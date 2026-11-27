import { createClient } from '@supabase/supabase-js';
import type { IncomingMessage, ServerResponse } from 'node:http';

type Request = IncomingMessage & { body?: unknown };

function send(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(payload));
}

function config() {
  const url = process.env.SUPABASE_URL;
  // Use a public/publishable key with the user's JWT so account_backups is
  // protected by its authenticated RLS policies. The service key remains a
  // compatibility fallback for deployments that have not yet added the
  // publishable server variable.
  const key = process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
    || process.env.SUPABASE_ANON_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('account_backup_not_configured');
  return { url, key };
}

function token(req: Request) {
  const value = String(req.headers.authorization || '');
  const match = /^Bearer ([A-Za-z0-9._~-]{20,8192})$/.exec(value);
  return match?.[1] || null;
}

async function body(req: Request): Promise<unknown> {
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  let raw = '';
  for await (const chunk of req) {
    raw += chunk.toString();
    if (Buffer.byteLength(raw) > 1_500_000) throw new Error('payload_too_large');
  }
  return JSON.parse(raw || '{}');
}

function validBackup(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const backup = value as Record<string, unknown>;
  const settings = backup.settings as Record<string, unknown> | undefined;
  return !!settings
    && typeof settings === 'object'
    && settings.hasCompletedOnboarding === true
    && typeof settings.currentAge === 'number'
    && typeof settings.pubertyAge === 'number'
    && !!backup.counters
    && Array.isArray(backup.records);
}

function number(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function operations(value: unknown): Array<{ operationId: string; amount: number; createdAt?: string }> {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is { operationId: string; amount: number; createdAt?: string } => {
    return !!item && typeof item === 'object'
      && typeof (item as Record<string, unknown>).operationId === 'string'
      && Number.isSafeInteger((item as Record<string, unknown>).amount)
      && ((item as Record<string, unknown>).amount as number) > 0;
  });
}

/**
 * Istighfar is monotonic history. Merge by the highest confirmed completed
 * value instead of letting an older device replace a newer account snapshot.
 * Remaining is always derived from target - completed.
 */
function mergeIstighfar(existing: Record<string, unknown> | undefined, incoming: Record<string, unknown> | undefined) {
  if (!existing) return incoming;
  if (!incoming) return existing;
  const target = Math.max(
    number(existing.historicalTotalTarget),
    number(incoming.historicalTotalTarget),
    number(existing.totalEstimated),
    number(incoming.totalEstimated),
  );
  const completed = Math.max(
    number(existing.historicalCompleted),
    number(incoming.historicalCompleted),
  );
  const allOperations = new Map<string, { operationId: string; amount: number; createdAt?: string }>();
  for (const operation of [...operations(existing.operations), ...operations(incoming.operations)]) {
    allOperations.set(operation.operationId, operation);
  }
  const mergedOperations = [...allOperations.values()];
  const existingOperationTotal = operations(existing.operations).reduce((sum, operation) => sum + operation.amount, 0);
  const incomingOperationTotal = operations(incoming.operations).reduce((sum, operation) => sum + operation.amount, 0);
  const existingBase = Math.max(0, number(existing.historicalCompleted) - existingOperationTotal);
  const incomingBase = Math.max(0, number(incoming.historicalCompleted) - incomingOperationTotal);
  const mergedCompleted = Math.max(existingBase, incomingBase) + mergedOperations.reduce((sum, operation) => sum + operation.amount, 0);
  return {
    ...incoming,
    historicalTotalTarget: target,
    historicalCompleted: Math.max(completed, mergedCompleted),
    historicalRemaining: Math.max(0, target - Math.max(completed, mergedCompleted)),
    operations: mergedOperations,
  };
}

function mergeBackup(existing: Record<string, unknown> | null, incoming: Record<string, unknown>) {
  if (!existing) return incoming;
  const existingData = existing.istighfarData as Record<string, unknown> | undefined;
  const incomingData = incoming.istighfarData as Record<string, unknown> | undefined;
  const merged = { ...incoming };
  const istighfarData = mergeIstighfar(existingData, incomingData);
  if (istighfarData) merged.istighfarData = istighfarData;
  return merged;
}

/** Account-owned backup endpoint. The browser never sees the service key. */
export default async function handler(req: Request, res: ServerResponse) {
  try {
    const accessToken = token(req);
    if (!accessToken) return send(res, 401, { error: 'unauthorized' });
    const { url, key } = config();
    const db = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data: identity, error: identityError } = await db.auth.getUser(accessToken);
    if (identityError || !identity.user) return send(res, 401, { error: 'unauthorized' });

    if (req.method === 'GET') {
      const { data, error } = await db
        .from('account_backups')
        .select('payload, updated_at')
        .eq('user_id', identity.user.id)
        .maybeSingle();
      if (error) throw error;
      const metadataBackup = identity.user.user_metadata?.qada_profile_backup;
      const accountBackup = validBackup(metadataBackup) ? metadataBackup : null;
      const mergedBackup = data?.payload
        ? mergeBackup(data.payload as Record<string, unknown>, accountBackup || undefined)
        : accountBackup;
      const metadataUpdatedAt = accountBackup?.istighfarData && typeof accountBackup.istighfarData === 'object'
        ? (accountBackup.istighfarData as Record<string, unknown>).updatedAt
        : undefined;
      const updatedAt = [data?.updated_at, metadataUpdatedAt]
        .filter((value): value is string => typeof value === 'string')
        .sort()
        .at(-1);
      return send(res, 200, mergedBackup ? { backup: mergedBackup, updatedAt: updatedAt || new Date().toISOString() } : { backup: null });
    }

    if (req.method === 'PUT') {
      const input = await body(req) as { backup?: unknown };
      if (!validBackup(input?.backup)) return send(res, 400, { error: 'invalid_backup' });
      if (Buffer.byteLength(JSON.stringify(input.backup)) > 1_400_000) return send(res, 413, { error: 'payload_too_large' });
      const { data: current, error: currentError } = await db
        .from('account_backups')
        .select('payload')
        .eq('user_id', identity.user.id)
        .maybeSingle();
      if (currentError) throw currentError;
      const mergedBackup = mergeBackup(current?.payload || null, input.backup);
      const { error } = await db.from('account_backups').upsert({
        user_id: identity.user.id,
        payload: mergedBackup,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) throw error;
      return send(res, 200, { saved: true });
    }

    res.setHeader('Allow', 'GET, PUT');
    return send(res, 405, { error: 'method_not_allowed' });
  } catch (error) {
    const code = error instanceof Error && error.message === 'payload_too_large' ? 'payload_too_large' : 'backup_unavailable';
    return send(res, code === 'payload_too_large' ? 413 : 503, { error: code });
  }
}
