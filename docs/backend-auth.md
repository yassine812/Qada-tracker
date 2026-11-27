# Backend des comptes Qada — Supabase Auth

## État et périmètre

Le frontend utilise le backend d'authentification géré Supabase : inscription email/mot de passe, confirmation email, connexion, session persistante, déconnexion du navigateur et récupération du mot de passe (PKCE). Aucun serveur Express ni table publique de mots de passe n'est nécessaire. Aucun faux compte local n'est créé si le backend n'est pas configuré.

Les compteurs religieux restent exclusivement dans IndexedDB/localStorage. **Cette version ne synchronise pas les données et ne les isole pas par compte** : le compte n'est pas un verrou de confidentialité du navigateur. Les utilisateurs de postes partagés doivent utiliser des profils de navigateur séparés. Aucun ancien compteur n'est effacé ou envoyé au backend.

## Activer le vrai backend

### Configuration constatée le 14 septembre 2026

- Projet du propriétaire créé : `qolmdufbnzulyayxccxc` (Qada), Free, Frankfurt.
- URL et clé publishable configurées dans `.env.local` ignoré par Git. Aucune clé secrète ni mot de passe de base copié.
- Site URL principal : `https://qada-tracker-five.vercel.app/account`. Les destinations Vercel et Netlify ci-dessous sont enregistrées pour conserver le miroir.
- Email activé, confirmation obligatoire, changement sécurisé d'email et de mot de passe activés. La valeur backend du minimum de caractères reste à relire après l'enregistrement ; le frontend impose 10.
- Backend joint réellement : une connexion avec des identifiants fictifs est refusée avec `invalid_credentials` (HTTP 400), sans session créée. Aucun compte de test créé et aucun email envoyé lors de ce contrôle.
- TypeScript, build configuré et 53 tests réussis. Cela ne remplace pas un test complet de confirmation/récupération par email.
- Gmail choisi par le propriétaire. Formulaire SMTP préparé, **pas encore enregistré** : `smtp.gmail.com:465`, expéditeur et utilisateur Gmail du propriétaire, nom `قضاء | Qada`. Le propriétaire doit créer et saisir son mot de passe d'application Google lui-même, puis enregistrer. Ne jamais mettre ce secret dans le dépôt.
- Version web publiée sur Vercel : `https://qada-tracker-five.vercel.app`. Il reste au propriétaire de finaliser SMTP et de tester les parcours email réels.

1. Créer un projet Supabase dans le compte du propriétaire, sur l'offre Free si elle convient. Le propriétaire choisit et conserve le mot de passe de la base. Ne pas saisir ce mot de passe dans le code ou la conversation.
2. Dans Authentication, activer Email et la confirmation des emails. Définir une longueur minimale de mot de passe de **10** et conserver les limites anti-abus. Activer les protections supplémentaires disponibles avant une ouverture publique.
3. Dans URL Configuration, utiliser le site de production principal comme Site URL, puis autoriser exactement :
   - `https://qada-tracker-yassine.netlify.app/account?mode=login`
   - `https://qada-tracker-yassine.netlify.app/account?mode=recovery`
   - `https://qada-tracker-five.vercel.app/account?mode=login`
   - `https://qada-tracker-five.vercel.app/account?mode=recovery`
   - En développement seulement : les mêmes chemins sur `http://localhost:3000`.
   Ne pas ajouter de joker de production large. Les liens PKCE doivent être ouverts dans le navigateur qui a initié la demande. Les sessions Netlify et Vercel sont distinctes.
4. Configurer un **SMTP de production vérifié** pour les emails de confirmation et de récupération. Le service email intégré Supabase est limité et n'est pas destiné à envoyer les emails d'une application publique à tous ses utilisateurs. Ne pas désactiver la confirmation email pour contourner cette restriction. Configurer l'expéditeur et les enregistrements DNS requis par le fournisseur, puis vérifier la livraison.
5. Copier uniquement l'URL du projet et la clé **publishable** dans :
   ```dotenv
   VITE_SUPABASE_URL=https://PROJECT.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
   En local : `.env.local` (ignoré par Git). En production : variables d'environnement de build Netlify et Vercel, puis nouveau déploiement. Une ancienne clé JWT `anon` est aussi acceptée. **Ne jamais utiliser `service_role`, `sb_secret_...`, un mot de passe DB ou une clé administrative côté Vite.**
6. Vérifier sur le vrai backend avec un compte de test contrôlé : confirmation, connexion, rechargement, mauvais mot de passe, déconnexion et lien de récupération expiré/valide. Tester un destinataire qui n'appartient pas à l'équipe Supabase pour valider SMTP. Aucune vérification de bout en bout réelle ne peut être déclarée avant ces étapes.

## Confidentialité et exploitation

- Les mots de passe sont transmis directement par HTTPS au service Auth ; ils ne sont ni journalisés ni stockés par Qada. Les jetons de session sont conservés par le SDK : protéger le site contre XSS et ne pas injecter de publicités dans `/account` ou `/app`.
- Le service worker laisse passer les appels externes Auth sans les mettre en cache. L'authentification n'empêche pas l'utilisation locale hors ligne.
- Maintenir un canal privé pour les demandes de suppression de compte. Le propriétaire peut supprimer l'utilisateur via le dashboard Supabase après vérification de son identité. Supprimer le stockage local ne supprime pas le compte distant.
- Avant toute future synchronisation, créer des tables avec Row Level Security, politiques basées sur `auth.uid()`, isolation par utilisateur et une migration explicite des données existantes. Ne jamais utiliser l'email ou un identifiant fourni par le navigateur comme autorisation de lecture.
- Examiner les quotas et frais actuels du fournisseur avant lancement. Aucun abonnement payant n'est activé par ce changement.

Documentation officielle : [authentification par mot de passe](https://supabase.com/docs/guides/auth/passwords), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [redirections](https://supabase.com/docs/guides/auth/redirect-urls).
