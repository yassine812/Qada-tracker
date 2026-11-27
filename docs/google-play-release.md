# Préparation Google Play — Qada

Le projet Android Capacitor est maintenant initialisé dans `android/` avec :

- identifiant stable `com.yassine812.qadatracker` ;
- nom public `قضاء` ;
- cible Android récente (compile/target SDK 36) ;
- icônes Qada intégrées depuis `public/icons` ;
- contenu web local copié dans l'application pour le fonctionnement hors connexion ;
- URL publique de référence : `https://qada-tracker-five.vercel.app`.

## Construire le paquet

Sur une machine avec Android Studio, le SDK Android et un JDK complet (pas seulement un JRE) :

```powershell
npm install
npm run android:sync
cd android
.\gradlew.bat bundleRelease
```

Le fichier à envoyer dans Play Console sera ensuite dans :

`android/app/build/outputs/bundle/release/app-release.aab`

Ne mets jamais une clé de signature, un mot de passe ou un fichier `keystore` dans Git. Configure la signature de release dans Android Studio ou dans les secrets du système CI.

## Avant l'envoi Play Console

1. Créer/associer le compte développeur Google Play et compléter la vérification d'identité.
2. Ajouter une fiche Play Store en arabe et en français : nom, description, captures d'écran, icône 512×512 et bannière 1024×500.
3. Déclarer l'URL de confidentialité : `https://qada-tracker-five.vercel.app/privacy`.
4. Remplir le formulaire Data safety avec les données réellement utilisées. L'application fonctionne localement, mais le compte facultatif utilise Supabase et les notifications peuvent utiliser le service push.
5. Déclarer la suppression de compte si la création de compte est proposée, puis tester le parcours réel avant la publication.
6. Publier d'abord une piste de test interne, tester Android réel (connexion, notifications, hors connexion, restauration/synchronisation), puis seulement demander la production.

La création du paquet est préparée dans le dépôt ; la signature, la fiche Play Console, les déclarations légales et l'envoi final restent des actions du propriétaire du compte Google Play.
