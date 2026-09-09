# État de publication — 9 septembre 2026

- Site public : https://qada-tracker-yassine.netlify.app
- Projet Netlify : https://app.netlify.com/projects/qada-tracker-yassine/overview
- Déploiement manuel du contenu compilé de `dist` uniquement. Aucun accès GitHub supplémentaire, achat de domaine ou abonnement payant activé.
- AdSense : propriété vérifiée par balise HTML ; demande d'examen envoyée, statut observé `Getting ready` / `Review requested`. Ce n'est pas une approbation.
- L'identifiant public de l'éditeur et l'origine du site sont configurés localement dans `.env.production.local` (ignoré par Git). Aucun mot de passe n'est enregistré dans le projet.
- Les annonces restent désactivées. Avant activation : approbation Google, coordonnées publiques autorisées par le propriétaire, bloc publicitaire et CMP certifiée indépendante à configurer et tester. Ne pas activer Auto ads sur les écrans de suivi.

## Vérification technique

- TypeScript et compilation de production réussis ; 37 tests automatisés passent.
- Test navigateur local avec le serveur de prévisualisation arrêté : redémarrage de `/app`, enregistrement d'un compteur fictif, conservation après rechargement, première lecture du Coran et page suivante réussis.
- Vérification mobile de la page de confidentialité : aucun débordement horizontal ni script publicitaire chargé.
- Un test réel de l'hébergement a détecté un fichier technique caché retournant 404 dans le manifeste hors connexion. Le générateur exclut désormais les chemins cachés, et les installations échouées ont trois nouvelles tentatives maximum avec temporisation progressive.
- Version finale publiée : `0caf5e6f824fa9ad650c`. Vérification publique après correction : 143/143 fichiers requis en HTTP 200, révisions cohérentes et indicateur `جاهز بدون إنترنت` visible. Rendu mobile contrôlé sans débordement horizontal.
- Ces tests ne constituent pas des tests dans un simulateur Android, un simulateur iOS ni sur un iPhone réel. L'audio et les nouveaux commentaires du Coran nécessitent toujours une connexion.

## Prochaine mise à jour

Recompiler puis publier uniquement `dist` ou son archive, jamais le répertoire complet du projet. Vérifier la version et le statut hors connexion sur l'adresse publique après chaque publication. Pour des builds automatiques futurs, reporter les variables publiques voulues dans Netlify ; le fichier local ignoré par Git n'y sera pas transféré automatiquement.
