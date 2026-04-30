A smart pass management system for students and wardens to streamline request approvals, tracking, and campus movement efficiently.

# PassMate 🎓

**Smart Hostel Gate Pass Management System** — A full-stack SaaS application for Indian colleges to digitize the student gate pass process with role-based access, QR code exits, and real-time approval workflows.

![React](https://img.shields.io/badge/React-18-blue?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js) ![SQLite](https://img.shields.io/badge/SQLite-Database-lightblue?logo=sqlite) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss)

---

## ✨ Features

### 🎓 Student Portal
- Dashboard with active gate pass hero card & QR code
- 3-step request form (Details → Reason & Time → Review)
- Real-time pass status tracking with parent/warden approval stages
- Full-screen QR code view for gate scanning

### 👨‍👩‍👧 Parent Approval (No Login Required)
- Magic link sent via SMS upon student request
- OTP-verified approval/rejection flow

### 🏫 Warden Portal
- Priority action queue for pending approvals
- Full request table with slide-in detail panel
- Student directory with violation tracking
- Emergency override tool with full audit trail

### 🔐 Security Guard Module
- Mobile-first interface optimized for tablets at the gate
- Simulated QR scanner with animated viewfinder
- Hold-to-confirm touch targets for exit/entry marking
- Auto-detects late returns and logs violations

### 📊 Admin Dashboard
- Analytics with Recharts (area chart, donut, bar chart, heatmap)
- User management (Students, Wardens, Guards)
- Audit log viewer and violation monitoring

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS v3, Custom Design Tokens |
| State | Zustand + Persisted JWT Auth |
| Backend | Node.js, Express.js |
| Database | SQLite (via Knex.js) |
| Auth | JWT (7-day tokens), OTP Verification |
| Charts | Recharts |

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/passmate.git
cd passmate
```

### 2. Install frontend dependencies
```bash
cd frontend
npm install
cd ..
```

### 3. Install backend dependencies
```bash
cd backend && npm install && cd ..
```

### 4. Start the backend (Port 3001)
```bash
cd backend
node index.js
```
The server auto-creates the SQLite DB and seeds it with demo data.

### 5. Start the frontend (Port 5173)
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173**

---

## 🔑 Demo Accounts

| Role | USN | Mobile | OTP |
|---|---|---|---|
| Student | `1DS22CS042` | `9845012345` | `123456` |
| Warden | *(blank)* | `9845001234` | `123456` |
| Guard | *(blank)* | `9900012345` | `123456` |
| Admin | *(blank)* | `9000000001` | `123456` |

> OTP bypass `123456` works for all accounts. Dev OTP is also shown on-screen after login.

---

## 📁 Project Structure

```
passmate/
├── frontend/               # React Frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/ui/  # Design system components
│   │   ├── layouts/        # AppShell, Sidebar, TopBar, MobileNav
│   │   ├── lib/api.ts      # Typed API client
│   │   ├── pages/          # Role-scoped page components
│   │   │   ├── student/
│   │   │   ├── warden/
│   │   │   ├── guard/
│   │   │   ├── admin/
│   │   │   └── parent/
│   │   └── store/          # Zustand state + JWT auth
│   ├── package.json
│   └── vite.config.ts
├── backend/                # Node.js Backend (Express + SQLite)
│   ├── index.js            # Express entry point
│   ├── db.js               # Knex + SQLite schema
│   ├── middleware/auth.js  # JWT middleware
│   ├── routes/             # auth, passes, users, admin
│   │   ├── auth.js
│   │   ├── passes.js
│   │   ├── users.js
│   │   └── admin.js
│   ├── utils/seed.js       # DB seeder
│   └── package.json
└── README.md
```

---

## 🗂 Key API Endpoints

```
POST  /api/auth/login               → Initiate OTP login
POST  /api/auth/verify-otp          → Verify OTP → receive JWT
GET   /api/passes                   → List passes (role-filtered)
POST  /api/passes                   → Student creates new request
PATCH /api/passes/:id/parent-approve → Parent magic link response
PATCH /api/passes/:id/warden-approve → Warden approval
PATCH /api/passes/:id/scan-exit     → Guard marks exit
PATCH /api/passes/:id/scan-entry    → Guard marks entry + late check
GET   /api/admin/analytics          → KPIs + chart data
GET   /api/admin/logs               → Audit log
GET   /api/admin/violations         → Violation report
```

---

## 📄 License

MIT License
