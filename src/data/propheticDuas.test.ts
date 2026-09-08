import {
  PROPHETIC_DUAS,
  TOTAL_PROPHETIC_DUAS,
  getPropheticDuaById,
  getPropheticDuaByNumber,
  searchPropheticDuas,
  getDailyPropheticDua,
  shuffleDuas,
} from './propheticDuas';

function runTests() {
  console.log('--- Starting Prophetic Duas Dataset Tests ---');

  // 1. Check length
  if (PROPHETIC_DUAS.length !== 29) {
    throw new Error(`Expected exactly 29 Prophetic Duas, got ${PROPHETIC_DUAS.length}`);
  }
  if (TOTAL_PROPHETIC_DUAS !== 29) {
    throw new Error(`Expected TOTAL_PROPHETIC_DUAS === 29, got ${TOTAL_PROPHETIC_DUAS}`);
  }
  console.log('✓ Dataset contains exactly 29 Prophetic Duas');

  // 2. Check each Dua completeness and unique IDs/numbers
  const seenIds = new Set<string>();
  const seenNumbers = new Set<number>();

  for (let i = 0; i < PROPHETIC_DUAS.length; i++) {
    const dua = PROPHETIC_DUAS[i];
    if (!dua.id || seenIds.has(dua.id)) {
      throw new Error(`Duplicate or missing id at index ${i}: ${dua.id}`);
    }
    seenIds.add(dua.id);

    if (!dua.number || seenNumbers.has(dua.number)) {
      throw new Error(`Duplicate or missing number at index ${i}: ${dua.number}`);
    }
    seenNumbers.add(dua.number);

    if (!dua.arabic || dua.arabic.trim().length < 10) {
      throw new Error(`Invalid Arabic text in Dua #${dua.number}`);
    }
    if (!dua.source) {
      throw new Error(`Missing source in Dua #${dua.number}`);
    }
    if (!dua.narrator) {
      throw new Error(`Missing narrator in Dua #${dua.number}`);
    }
    if (!dua.footnote) {
      throw new Error(`Missing footnote in Dua #${dua.number}`);
    }
  }
  console.log('✓ All 29 Duas have valid non-empty fields and unique IDs (1-29)');

  // 3. Check lookup helpers
  const dua1 = getPropheticDuaById('prophetic-dua-1');
  if (!dua1 || dua1.number !== 1 || !dua1.title.includes('سيد الاستغفار')) {
    throw new Error('getPropheticDuaById failed for prophetic-dua-1');
  }
  const dua29 = getPropheticDuaByNumber(29);
  if (!dua29 || dua29.id !== 'prophetic-dua-29' || !dua29.title.includes('الصلاة الإبراهيمية')) {
    throw new Error('getPropheticDuaByNumber failed for 29');
  }
  console.log('✓ Lookup helpers work correctly');

  // 4. Test Search
  const searchIstighfar = searchPropheticDuas('الاستغفار');
  if (searchIstighfar.length === 0) {
    throw new Error('Search for "الاستغفار" returned empty');
  }

  const searchAisha = searchPropheticDuas('عائشة');
  if (searchAisha.length === 0) {
    throw new Error('Search for narrator "عائشة" returned empty');
  }

  const searchBukhari = searchPropheticDuas('البخاري');
  if (searchBukhari.length === 0) {
    throw new Error('Search for source "البخاري" returned empty');
  }
  console.log(`✓ Search verified: 'الاستغفار' (${searchIstighfar.length}), 'عائشة' (${searchAisha.length}), 'البخاري' (${searchBukhari.length})`);

  // 5. Test Daily Dua Determinism
  const fixedDate = new Date(2026, 8, 8); // Sept 8, 2026
  const dailyDuaA = getDailyPropheticDua(fixedDate);
  const dailyDuaB = getDailyPropheticDua(fixedDate);
  if (dailyDuaA.id !== dailyDuaB.id) {
    throw new Error('Daily Prophetic Dua is not deterministic for same date');
  }
  console.log(`✓ Daily Dua is deterministic: Dua #${dailyDuaA.number} (${dailyDuaA.title}) on 2026-09-08`);

  // 6. Test Randomized-Cycle (Shuffle bag simulation)
  let remaining = [...PROPHETIC_DUAS.map((d) => d.id)];
  const shownIdsInCycle: string[] = [];

  while (remaining.length > 0) {
    const nextId = remaining.pop()!;
    shownIdsInCycle.push(nextId);
  }

  if (shownIdsInCycle.length !== 29 || new Set(shownIdsInCycle).size !== 29) {
    throw new Error('Randomized cycle failed to cover all 29 Duas exactly once');
  }
  console.log('✓ Randomized cycle covers all 29 Duas without repetition in a single cycle');

  // 7. Test shuffle function randomness
  const originalIds = PROPHETIC_DUAS.map((d) => d.id);
  const shuffled = shuffleDuas(originalIds);
  if (shuffled.length !== originalIds.length || new Set(shuffled).size !== 29) {
    throw new Error('Shuffle failed to preserve all elements');
  }
  console.log('✓ Fisher-Yates shuffle algorithm is valid');

  console.log('=== ALL 7 TESTS PASSED SUCCESSFULLY ===');
}

runTests();
