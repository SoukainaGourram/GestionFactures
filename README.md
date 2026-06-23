# FactureFlow - Système de Facturation & Gestion Professionnelle 

**FactureFlow** est une application web moderne et robuste développée en React.js, conçue pour simplifier la gestion de la facturation, le suivi des règlements clients et l'analyse financière. Ce projet intègre les contraintes techniques et académiques d'un **Projet de Fin d'Année (PFA)** axé sur l'entreprenariat et la gestion de projet.

L'application intègre également un **mode hors-ligne automatique (localStorage fallback)** qui garantit un fonctionnement fluide même si le serveur de base de données local est injoignable.

---

## 🚀 Fonctionnalités Clés

### 1. Gestion Dynamique de la Facturation
- **Création & Édition de factures** avec calculs automatiques en temps réel.
- **4 Méthodes de Facturation :**
  - **Méthode 1 (Simple) :** Application standard HT + TVA (20%).
  - **Méthode 2 (Remise par ligne) :** Application d'une remise en pourcentage sur chaque article individuellement avant calcul de la TVA.
  - **Méthode 3 (Remise globale) :** Application d'une remise commerciale globale en pourcentage sur le sous-total brut, suivie de la TVA.
  - **Méthode 4 (TVA par catégorie) :** Taux de TVA variables selon la nature de l'article :
    - *Informatique* : 20%
    - *Services* : 10%
    - *Formation* : 0%

### 2. Certification Numérique (Signature & Code QR)
- **Signature Électronique Dessinable :** Zone de dessin interactive (HTML5 Canvas) intégrée au formulaire permettant de signer les factures à la souris ou au doigt sur écran tactile.
- **Code QR de Vérification :** Génération automatique d'un QR code unique sur chaque facture PDF encodant les métadonnées clés (numéro, émetteur, destinataire, montant, date) pour vérification de l'authenticité.

### 3. Gestion Multidevise & Multi-société
- **Multi-devise :** Gestion complète en **MAD (DH)**, **EUR (€)**, et **USD ($)** avec conversion des symboles sur l'interface et sur le PDF.
- **Multi-société :** Sélection dynamique de l'entreprise émettrice pour personnaliser les en-têtes de facturation (FactureFlow Inc., Global Services S.A., Tech Solutions SARL).

### 4. Suivi des Règlements & Archivage
- **Champs de Suivi :** Saisie des dates de dépôt, dates réelles d'encaissement et du mode de virement (Virement, Chèque, Espèces, Carte).
- **Archivage Annuel :** Filtrage instantané de l'historique des factures par exercice fiscal (2026, 2025, 2024).
- **Export Excel :** Bouton d'export CSV structuré (encodé UTF-8 avec BOM) compatible Microsoft Excel.

### 5. Workflow & Alertes en Temps Réel
- Enregistrement automatique de toutes les actions clés du système dans un journal d'activité (Création, Modification, Suppression, Validation, Rejet).
- Panneau d'alertes dynamique affiché sur les tableaux de bord.
- Simulation d'envoi d'e-mail automatique au client lors de la validation ("Payée") par l'administrateur.

---

## 🛠️ Technologies Utilisées

- **Frontend :** React JS (Hooks, Contexts, Architecture modulaire)
- **Design System :** Material UI (MUI) - Design premium responsive, effets split-screen, micro-animations, glassmorphism.
- **Visualisations :** Recharts (Graphiques d'évolution mensuelle et répartition des statuts)
- **Génération PDF :** jsPDF & jspdf-autotable
- **Base de Données / Backend :** JSON Server (Simulé) + Système de synchronisation locale résilient (LocalStorage Fallback)

---

## 📦 Installation et Lancement

### 1. Cloner le dépôt
```bash
git clone https://github.com/SoukainaGourram/GestionFactures.git
cd GestionFactures
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Lancer le serveur de données (Optionnel)
L'application intègre un mode autonome hors-ligne via LocalStorage. Si vous souhaitez utiliser le fichier de base de données partagée `db.json` :
```bash
npm run json-server
```

### 4. Démarrer l'application React
Dans un autre terminal :
```bash
npm start
```
L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

---

## 🔑 Comptes de Test (Simulation)

| Rôle / Profil | Adresse E-mail | Mot de passe |
| :--- | :--- | :--- |
| **Administrateur** | `admin@test.com` | `admin123` |
| **Client Acme Corp** | `client1@test.com` | `client123` |
| **Client Globex Corp** | `client2@test.com` | `client123` |
| **Client doha** | `doha@gmail.com` | `client123` |

---
*Développé dans le cadre du projet académique PFA - Gestion de la facturation.*
