import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_AUTH_DOMAIN",
  databaseURL: "VOTRE_DATABASE_URL",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_STORAGE_BUCKET",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

let app;
let auth;
let db;

try {
  const config = { ...firebaseConfig };
  // Remove invalid URL placeholder to avoid getDatabase crash
  if (!config.databaseURL || !config.databaseURL.startsWith('http')) {
    delete config.databaseURL;
  }
  
  if (config.apiKey && config.apiKey !== "VOTRE_API_KEY") {
    app = initializeApp(config);
    auth = getAuth(app);
    if (config.databaseURL) {
      db = getDatabase(app);
    }
  } else {
    console.log("[Firebase] Config par défaut détectée, initialisation ignorée (utilisation du mock).");
  }
} catch (e) {
  console.warn("[Firebase] Erreur d'initialisation, basculement en mode mock :", e);
}

export { auth, db };
export default app;