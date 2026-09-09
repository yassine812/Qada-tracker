# Lancement gratuit de Qada

## Ce qui est prêt et ce qui demande le propriétaire

La version publiée est un site/PWA. Elle ne nécessite pas de compte Apple
Developer. Le projet iOS expérimental reste séparé et n'est pas distribué.
AdSense n'est pas activé par défaut : aucun revenu ni approbation n'est garanti.

Le propriétaire doit se connecter à Netlify, choisir **Free** et accepter lui-même
les conditions du service. Ne pas activer d'offre payante, d'achat de domaine,
d'extension payante ou de recharge automatique sans une nouvelle autorisation.
Les quotas du plan gratuit peuvent suspendre le site. Les vidéos décoratives et
les téléchargements initiaux consomment de la bande passante.

## Déploiement

1. Exécuter `npm run lint`, `npm run build`, puis `npm test`.
2. Importer le dépôt dans Netlify, avec `npm run build` et le dossier `dist`.
   `netlify.toml` contient ces paramètres. L'accès GitHub supplémentaire doit
   être autorisé par le propriétaire, limité au dépôt Qada-tracker.
3. Alternative sans accès GitHub : dans l'espace Netlify connecté, téléverser
   uniquement `dist` ou son archive. Ne jamais publier le dossier complet du
   projet : il contient des documents de travail, des fichiers iOS et autres
   fichiers qui n'appartiennent pas au site.
4. Copier l'adresse HTTPS attribuée par Netlify. Ne pas inventer une URL libre.
5. Configurer `SITE_URL` avec cette origine pour générer le sitemap/canonical,
   puis reconstruire et republier. Les builds Git Netlify fournissent aussi `URL`.
6. Tester `/`, `/app`, `/about`, `/privacy`, `/guides`, les deux articles et les
   liens depuis le téléphone. Le bouton de navigateur Android reste facultatif.

Les fichiers `_headers` et `_redirects` sont inclus dans `dist`, y compris pour un
téléversement manuel. Ils ne font pas partie du cache hors connexion.

## AdSense (activation séparée)

Voir [adsense-setup.md](adsense-setup.md). Fournir directement à Google les
informations d'identité, de résidence, fiscales et de paiement demandées.
Partager seulement les identifiants publics nécessaires au site, jamais un mot
de passe, code de connexion ou coordonnées bancaires dans le dépôt.

Définir `VITE_ADSENSE_CLIENT` avec le véritable identifiant permet de publier la
balise de vérification et `ads.txt`, **sans activer de publicités**. Le site a besoin
du nom public de l'éditeur et d'un contact valide avant activation. Un build avec
`VITE_ADS_ENABLED=true` échoue si ces renseignements, le bloc publicitaire ou la
confirmation d'approbation Google manquent. Un consentement réel reste requis
au moment d'afficher une annonce : les variables seules ne le remplacent pas.

## Test hors connexion

Ouvrir une fois avec Internet et attendre «جاهز بدون إنترنت». Couper ensuite
Internet et recharger `/app` dans le même navigateur ; lire aussi une sourate
jamais ouverte et vérifier les compteurs après fermeture/réouverture. Ne pas
confondre un test Chromium à largeur mobile avec un test Safari iOS réel.

Les publicités, nouveaux commentaires et récitations ne sont pas nécessaires
au démarrage. Les récitations et nouveaux commentaires restent en ligne.
Safari peut effacer le stockage : conserver une sauvegarde personnelle des
saisies. Ne jamais promettre un stockage navigateur permanent.

## Sources

- [Offres Netlify](https://www.netlify.com/pricing/)
- [Usage commercial gratuit](https://www.netlify.com/guides/netlify-vs-vercel/)
- [Configuration Netlify](https://docs.netlify.com/build/configure-builds/file-based-configuration/)
- [Inscription et validation AdSense](https://support.google.com/adsense/answer/7402256?hl=fr)
