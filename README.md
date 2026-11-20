# 🌿 CALM — Version 1 Relaxation Platform

> **Core Philosophy**: *Open. Choose. Relax. Return.*

CALM is a responsive stress-relief application designed to help people manage everyday mental pressure through short, guided relaxation practices. It is not a productivity tracker, social network, or complex meditation platform.

---

## 🍃 Architecture & Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons, Web Audio API, Web Speech API.
- **Backend**: Node.js & Express (TypeScript), PostgreSQL connection pool, bcryptjs, jsonwebtoken, qrcode.
- **Database**: PostgreSQL 18 with dedicated cluster on port `5434` (database: `calm_db`).
- **Payment & Subscription**: Razorpay Dynamic UPI QR (₹99/month), HMAC-SHA256 signature verification, idempotent processing, manual renewal & UPI AutoPay mandate support.

---

## 🧘 Six Core Guided Activities

1. **Cyclic Sighing**: Rapid physiological reset lowering autonomic arousal via two rapid inhales through the nose and a prolonged, gentle exhale through the mouth.
2. **Box Breathing (4-4-4-4)**: Inhale 4s, Hold 4s, Exhale 4s, Hold 4s. Restores nervous system equilibrium and steadies racing thoughts.
3. **Long-Exhale Breathing**: Inhale 4s, Pause 1s, Exhale 8s. Doubling exhalation activates the vagus nerve and rest-and-digest response.
4. **Seated Muscle Release**: Guided progressive release of tight neck, clenched jaw, shoulders, hands, and posture strain at your desk.
5. **5-4-3-2-1 Sensory Grounding**: Mindful sensory orientation (5 see, 4 feel, 3 hear, 2 smell, 1 taste) cutting through anxiety or mental overload.
6. **Guided Body Scan**: Head-to-toe gentle physical awareness releasing dormant stress.

*Note: All exercises support adaptable pacing, hold skipping, and immediate exit if any discomfort is experienced.*

---

## 🎵 Dual-Channel Audio & Spoken Voice Engine

- **Procedural Soundscape Generator**: 6 serene harmonic soundscapes (396 Hz Solfeggio, 432 Hz Alpha resonance, Morning Mountain Mist, Still Waters, Forest Canopy, Evening Cloud Drift). Generative Web Audio API with zero external dependencies and zero copyright issues.
- **Independent Spoken Voice Guidance**: Native browser speech synthesis providing soothing verbal instructions.
- **Independent Volume Controls**: Adjust music volume and voice guidance volume completely separately so instructions are never drowned out.
- **Zen Contour Visualizer**: Organic topographic contour wave expanding during inhale and contracting during exhale (inspired by the reference UI).

---

## 💳 ₹99 Monthly Subscription & Razorpay Dynamic UPI QR

- **Dynamic UPI QR**: Dynamic QR codes conforming to NPCI UPI specifications generated on-the-fly (`upi://pay?pa=...&am=99.00`).
- **Cryptographic Webhook Verification**: Razorpay webhooks verified via HMAC-SHA256 with safe timing comparison to reject tampered payloads.
- **Idempotency Locks**: Duplicate payment notifications prevent double activation.
- **Renewal Options**:
  - **Option A**: Manual Monthly Renewal (pay ₹99 for 30 days only; no recurring deduction).
  - **Option B**: UPI AutoPay Mandate (explicit consent checkbox authorizes recurring debit).
  - Manage or revoke AutoPay anytime from Account Settings.

---

## 🔐 Credentials & Quick Test Accounts

| Account | Email | Password | Role & Features |
| :--- | :--- | :--- | :--- |
| **Subscriber (Demo)** | `alex@calm.local` | `UserAlex2026!` | Active ₹99 subscriber, moderate stress level |
| **Administrator** | `admin@calm.local` | `CalmAdmin2026!` | Full admin panel, user list, payment logs, content editor |
| **New Registration** | Available on `/register` | Minimum 8 chars | Fresh non-subscribed state |

---

## 🚀 Running the Services

### 1. Database
```powershell
& "C:\Program Files\PostgreSQL\18\bin\postgres.exe" -D "C:\Users\Arman\.gemini\antigravity\scratch\calm\database\data" -p 5434
```

### 2. Backend API (Port 5000)
```powershell
cd C:\Users\Arman\.gemini\antigravity\scratch\calm\server
npm start
# or npm run dev
```

### 3. Frontend Client (Port 3000)
```powershell
cd C:\Users\Arman\.gemini\antigravity\scratch\calm\client
npm start
# or npm run dev
```

### 4. Running the E2E Verification Suite
```powershell
cd C:\Users\Arman\.gemini\antigravity\scratch\calm\server
npx ts-node src/scripts/test_e2e.ts
```
*(All 17 Phase 9 verification criteria verified passing).*
