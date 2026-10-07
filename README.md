# HealthGPT – Personal Health Assistant 🩺

A production-style, secure, multilingual AI-powered healthcare assistant web application built with completely original branding, clean architecture, relational database integrity, and a strict **privacy-first design**.

Designed for college/hackathon prototypes, patient empowerment, and clinical educational triage.

---

## 🌟 Key Features

### 1. 🛡️ Privacy-First Architecture & Zero Preloaded Patient Records
- **Empty Database Enforcement**: The production database starts **100% empty**. No sample patient records are preloaded. Every user creates their own fresh account and personal health profile.
- **Privacy Firewall**: Administrators **never** have access to users' private health profiles, medical notes, vital records, or AI conversations.
- **GDPR-Style Rights**: One-click **full JSON data export** and permanent **hard account deletion/purge**.

### 2. 🤖 Multilingual AI Health Assistant & Symptom Checker
- **4 Languages Supported**: Fluent interactive counseling in **English, Tamil (தமிழ்), Telugu (తెలుగు), and Hindi (हिन्दी)**.
- **Non-Diagnostic Structured Responses**:
  1. Clinical Educational Summary
  2. Possible Explanations (Non-Diagnostic)
  3. Supportive Steps & Self-Care Principles
  4. When to Seek Professional In-Person Medical Evaluation
  5. Mandatory Clinical Disclaimers
- **Emergency Safety Triage**: Real-time keyword filter detects acute emergencies (chest pain, stroke signs, breathing difficulty) and triggers red alert banners with one-touch emergency helpline dialing (108 / 112 / 911).
- **AI Abstraction Layer**: Built with pluggable support for **Google Gemini 1.5 Flash**, **OpenAI**, or the **Offline Built-in Clinical Knowledge Engine**.

### 3. 📊 Daily Health Tracking & Reminders
- **Vital Health Tracker**: Manual logs for Heart Rate, Blood Pressure (Systolic/Diastolic), Blood Glucose, Sleep, Weight, and Water Intake with clean, interactive SVG trend lines (7d / 30d views).
- **Medication Reminders**: Dosage scheduling, frequency, and daily adherence logging (Taken / Skipped).
- **Private Health Records**: Notes, lab diagnostics, and prescription tracking with search, category filtering, and attachment management.
- **Doctor Appointments**: In-person clinic and telehealth consultation management.
- **Healthcare Education & Dictionary**: Searchable public health library and A-Z layperson medical glossary.

### 4. 🔒 Administrator Portal
- Role-based administrative dashboard located at `/admin`.
- User directory with status toggles (active / suspended).
- Educational content CMS and Medical Dictionary CMS.
- Immutable security audit logs recording logins and administrative changes.
- In-app feedback management.
- AI provider configuration console.

---

## 🚀 Application URLs

| Application Surface | Local URL | Description |
| :--- | :--- | :--- |
| **User Application** | `http://localhost:5173/` | Public landing, authentication, and user dashboard |
| **Admin Portal** | `http://localhost:5173/admin/login` | Administrator governance console |
| **Backend REST API** | `http://localhost:5000/api` | Express API endpoints & health check |
| **API Health Check** | `http://localhost:5000/api/health` | Live service health monitor |

---

## 🔑 Default Administrator Credentials

For evaluation and testing, the initial administrator credentials are created during database initialization:

- **Admin Username / Email**: `admin` or `admin@healthgpt.local`
- **Admin Password**: `Admin@HealthGPT2026!`
- *(A one-click "Auto-fill Prototype Credentials" button is provided on the Admin Login page for reviewer convenience)*

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, React Router 7, Lucide Icons, Custom Vanilla CSS Design System with accessible Dark/Light themes.
- **Backend**: Node.js, Express, Helmet, CORS, Rate Limiting, JSON Web Tokens (JWT), Bcrypt password hashing.
- **Database**: SQLite (relational schema with WAL mode & foreign key cascade deletions) with seamless PostgreSQL compatibility.
- **AI Engine**: Modular AI Service supporting Google Gemini API, OpenAI, and a built-in offline clinical rule triage engine in English, Tamil, Telugu, and Hindi.

---

## 💻 Local Development Setup

### Prerequisites
- Node.js (v18+ or v22+)
- npm

### 1. Installation
Clone or navigate to the project directory:
```bash
cd C:\Users\GIRIVASU\.gemini\antigravity-ide\scratch\healthgpt-app
```

Install server dependencies:
```bash
cd server
npm install
```

Install client dependencies:
```bash
cd ../client
npm install
```

### 2. Initialize Database
Initialize the SQLite relational database and public educational content:
```bash
cd ../server
npm run init-db
```

### 3. Start the Backend API Server
```bash
npm start
# Server listens on port 5000: http://localhost:5000/api
```

### 4. Start the Frontend Application
In a separate terminal window:
```bash
cd ../client
npm run dev
# Frontend runs on port 5173: http://localhost:5173/
```

---

## 🌐 Production Deployment Guide

### Deploying Full Stack to a Single VPS (e.g. DigitalOcean / AWS EC2 / Render)
1. Build the React frontend:
   ```bash
   cd client
   npm run build
   ```
2. Serve the built static assets `client/dist` using Express or NGINX.
3. Configure environment variables in `.env`:
   ```env
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=your_long_random_production_secret
   ADMIN_JWT_SECRET=your_long_random_admin_secret
   ACTIVE_AI_PROVIDER=builtin
   ```
4. Run under process supervision (PM2 or Docker):
   ```bash
   pm2 start src/index.js --name healthgpt-backend
   ```
5. Bind HTTPS using Let's Encrypt / Certbot reverse proxy.

---

## 📋 Security & Compliance Notice

HealthGPT strictly isolates each patient's data by user ID and database relational foreign keys. This software is an educational prototype and does not provide formal medical diagnoses or prescriptions. Always consult a licensed physician for clinical healthcare.
