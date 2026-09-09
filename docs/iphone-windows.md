# Installer Qada sur iPhone depuis Windows

## État du projet

Le projet iOS Capacitor est généré dans `ios/`. Il embarque le contenu de `dist/` : interface, calculs, polices et texte complet du Coran (114 sourates et 604 pages). Il n'utilise pas d'adresse web distante pour démarrer et ne dépend pas d'un service worker Safari.

Cette préparation n'est pas encore un fichier IPA compilé, signé et testé sur un iPhone. Les vérifications de fichiers ne remplacent pas les essais sur iOS.

## Sans Mac personnel et sans abonnement Apple Developer

1. Compiler sur un Mac distant : le workflow GitHub Actions `Build iPhone package` est prêt dans `.github/workflows/ios-package.yml`. Une fois les fichiers poussés sur GitHub, l'exécuter depuis **Actions → Build iPhone package → Run workflow**. Il utilise macOS 15, Xcode 26.3, Node 24 et ne reçoit aucun identifiant Apple. Il ne publie pas l'app sur l'App Store.
2. Télécharger l'artifact `Qada-iPhone-unsigned`, puis extraire `Qada-unsigned.ipa` sur Windows. L'artifact n'existe qu'après une compilation réussie. Un IPA non signé ne s'installe pas directement depuis Safari.
3. Installer [Sideloadly depuis son site officiel](https://sideloadly.io/) et suivre ses prérequis Windows. Brancher l'iPhone en USB, sélectionner l'IPA et effectuer soi-même la connexion au compte Apple gratuit pour la signature et l'installation. Ne pas envoyer son mot de passe ou code de validation dans un chat ou dans GitHub.
4. Avec un compte gratuit, la signature expire après **7 jours**. Son renouvellement nécessite une connexion et l'accès au PC ; l'actualisation automatique dépend de la disponibilité du PC et de l'iPhone. L'app peut lire les données locales hors connexion entre les renouvellements. Ce mode convient à une installation personnelle, pas à une distribution publique durable.

Le workflow ne se lance que manuellement. Vérifier les quotas GitHub Actions du dépôt avant son exécution. Aucun achat, compte payant ou signature Apple n'est configuré par ces fichiers.

## Contenu hors connexion et limites

- Calculs et suivi des prières, compteurs, historique, adhkar, horaires calculés à partir d'une ville sauvegardée : données locales.
- Lecture du Coran arabe, traduction anglaise et pages du mushaf : fichiers embarqués.
- Audio de récitation : connexion nécessaire ; les enregistrements ne sont pas inclus.
- Nouveau tafsir : connexion nécessaire. Les passages déjà consultés et enregistrés restent accessibles localement.
- Les rappels dans l'application restent disponibles ; les notifications iOS en arrière-plan demandent une intégration native supplémentaire.

Safari et l'app native ont des espaces de stockage distincts. Avant l'installation, exporter la sauvegarde JSON depuis les réglages du site ; l'importer dans les réglages de l'app pour retrouver les compteurs. Ne pas désinstaller l'app pour renouveler sa signature : une désinstallation peut supprimer les données locales. L'export de sauvegarde depuis la nouvelle app, qui utilise encore le mécanisme web de téléchargement, doit être vérifié sur l'iPhone avant de s'y fier.

## Vérifications et commandes

```sh
npm ci
npm run lint
npm run ios:sync
```

`ios:sync` compile le site, copie les fichiers dans le projet iOS et vérifie la présence des ressources locales, des polices et des jeux de données complets. Il ne compile pas le binaire Swift sur Windows.

Sur un Mac équipé de Xcode 26 ou ultérieur : `npm run ios:open`. Sélectionner l'iPhone ou un simulateur, puis lancer l'app. iOS 15 ou ultérieur est requis par Capacitor 8.

Avant de considérer la version validée :

1. Installer sur un appareil de test, activer le mode avion avant le premier démarrage, puis ouvrir l'app.
2. Terminer la configuration, enregistrer une prière et un dhikr ; fermer complètement puis rouvrir l'app en mode avion et vérifier la conservation des données.
3. Lire une sourate et une page jamais ouvertes auparavant, notamment la dernière page (604).
4. Vérifier que l'audio et un tafsir non sauvegardé affichent un message clair ; tester également un tafsir préalablement enregistré.
5. Vérifier le clavier, les zones autour de l'encoche, l'import/export et le renouvellement de signature sans perte de données.

## Références

- [Capacitor : installation et copie du bundle](https://capacitorjs.com/docs/getting-started)
- [Capacitor : prérequis iOS](https://capacitorjs.com/docs/ios)
- [Apple : limites du compte gratuit et expiration à 7 jours](https://developer.apple.com/help/account/basics/about-your-developer-account)
- [Sideloadly : Windows, compte gratuit et renouvellement](https://sideloadly.io/)
- [GitHub : machines macOS hébergées](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)
