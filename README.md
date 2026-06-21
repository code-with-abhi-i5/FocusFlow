# FocusFlow 🎯

FocusFlow is an enterprise-grade, premium SaaS productivity tracking system comprising a **Manifest V3 Chrome Extension** and a **Vite + React + TypeScript + Tailwind CSS Dashboard** synced via **Firebase (Auth & Firestore)**.

It provides real-time time tracking, productivity classification, daily goals, streak triggers, focus lock blockers, and an automated rule-based AI Coach.

---

## Project Structure

```
FocusFlow/
├── extension/          # Chrome Extension (Vanilla JS, Manifest V3)
│   ├── background/     # service-worker.js tracking engine
│   ├── popup/          # Glassmorphic user interface dropdown
│   ├── blocked/        # Focus Mode lock display page
│   ├── options/        # Preferences page & Google authentication
│   └── utils/          # tracker, storage, sync, rules and blocker modules
│
└── dashboard/          # React analytics dashboard (Vite + TS + Tailwind v4)
    ├── src/
    │   ├── components/ # layout wrappers and charting adapters
    │   ├── contexts/   # Auth and Theme provider states
    │   ├── hooks/      # useTimeData, useGoals, useStreaks, useAnalytics hooks
    │   ├── pages/      # Dashboard, Analytics, Goals, Settings pages
    │   └── services/   # config, categoryService, timeEntryService database modules
    └── vite.config.ts  # Tailwind CSS v4 compiler setup
```

---

## ⚡ Setup & Installation

### 1. Firebase Project Configuration
1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** and activate the **Google Provider**.
3. Create a **Cloud Firestore** database.
4. Replace the Firebase config placeholders in both files:
   - For Extension: [firebase.js](file:///c:/Users/ghosh/OneDrive/Desktop/Chrome%20Extension/extension/utils/firebase.js)
   - For Dashboard: Create a `dashboard/.env` file or replace defaults in [config.ts](file:///c:/Users/ghosh/OneDrive/Desktop/Chrome%20Extension/dashboard/src/services/firebase/config.ts) using:
     ```env
     VITE_FIREBASE_API_KEY=your_key
     VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     ```

### 2. Loading the Chrome Extension
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top-right toggle switch).
3. Click **Load unpacked** (top-left button).
4. Select the `extension/` directory of this project.
5. Pins the extension to your toolbar. Click it to view the popup interface.

### 3. Launching the Analytics Dashboard
Navigate to the `dashboard/` directory and spin up the development environment:
```bash
cd dashboard
npm install
npm run dev
```
Open `http://localhost:5173` to explore your stats.

---

## 🔒 Security Rules (Cloud Firestore)
Deploy the following rules inside the Firebase console to ensure users can only read/write their own records:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /timeEntries/{entryId} {
      allow read, write: if request.auth != null && resource == null || (resource.data.uid == request.auth.uid && request.resource.data.uid == request.auth.uid);
    }
    match /goals/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /streaks/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /categories/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 💡 Key Design Decisions
- **MV3 Heartbeat Logic**: Service Workers in Manifest V3 are ephemeral and spin down. FocusFlow uses `chrome.alarms` for tracking checks and periodic flush schedules to prevent data loss.
- **Glassmorphic Theme**: Designed with custom CSS parameters, dark slates, radial mesh backgrounds, and Tailwind v4.
- **AI Coach Interface**: Rule-based pattern recognition engine loaded locally, ready for seamless swap with OpenAI or Gemini API calls.
