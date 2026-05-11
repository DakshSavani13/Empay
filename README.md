# EmPay HRMS 🚀

**EmPay** is a premium, high-performance Human Resource Management System (HRMS) built with a modern glassmorphism design. It streamlines attendance tracking, leave management, and payroll processing while ensuring top-tier security and logic consistency.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Security](https://img.shields.io/badge/security-hardened-orange.svg)

---

## ✨ Key Features

### 🕒 Smart Attendance Tracking
- **Multi-Session Support**: Multiple check-ins and check-outs per day.
- **Geofencing**: Strict validation ensuring employees are within the office perimeter (e.g., 100m radius).
- **Timezone Resilience**: Normalized `localDate` handling for overnight shifts and global consistency.

### 📅 Advanced Leave Management
- **Automatic Allocation**: New employees receive default leave balances automatically.
- **Smart Duration Calculation**: Automatically excludes Sundays and Public Holidays from leave counts.
- **Conflict Prevention**: Validates against pending requests to prevent over-drafting balances.

### 💰 Automated Payroll System
- **Accurate LOP Calculation**: Deducts salary based on actual working days (excluding holidays/weekends).
- **Tax & PF Handling**: Automated calculations for PF and Professional Tax based on configurable percentages.
- **Printable Statements**: Generate professional PDF salary statements for employees.

### 🔒 Enterprise-Grade Security
- **Rate Limiting**: Protection against brute-force and DDoS (Global & Auth-specific).
- **Input Validation**: Strict schema enforcement using `express-validator`.
- **Unique ID Generation**: Crypto-safe employee codes and login IDs to prevent race conditions.

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), Modern CSS (Glassmorphism), dynamic module loading.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB with Mongoose ODM.
- **Security**: Bcrypt.js, JSON Web Tokens (JWT), Express-Rate-Limit.
- **Utilities**: PDFKit for report generation.

---

## 📁 Project Structure

```text
empay-hrms/
├── backend/
│   ├── config/             # Database configuration
│   ├── controllers/        # Business logic for each module
│   ├── middleware/         # Auth, Role, and Security middleware
│   ├── models/             # Mongoose schemas (Employee, Leave, Attendance, etc.)
│   ├── routes/             # API route definitions
│   ├── utils/              # Helper functions (Payroll, Holidays, PDF)
│   └── server.js           # Entry point
├── frontend/
│   └── public/             # Static assets (HTML, CSS, JS)
│       ├── assets/
│       │   ├── css/        # Premium Glassmorphism styles
│       │   └── js/         # SPA Logic & API interactions
│       └── index.html      # Main entry point
└── README.md
```

---

## 👥 User Roles & Permissions

| Role | Permissions |
| :--- | :--- |
| **Admin** | Full system access, Manage Employees, System Settings, Bulk Reports. |
| **HR Manager** | Approve/Reject Leaves, Manage Attendance, View Employee Profiles. |
| **Payroll Officer** | Process Salaries, Generate Payruns, Manage Allowances/Deductions. |
| **Employee** | Check-in/out, Apply for Leaves, View personal Payslips, Profile management. |


---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or Atlas)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/DakshSavani13/Empay.git
   cd empay-hrms
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5001
   MONGO_URI=mongodb://localhost:27017/empay_db
   JWT_SECRET=your_jwt_secret
   OFFICE_LATITUDE=23.0225
   OFFICE_LONGITUDE=72.5714
   ALLOWED_RADIUS_METERS=100
   PF_PERCENTAGE=12
   PROFESSIONAL_TAX_MONTHLY=200
   ```

4. **Seed Initial Data (Optional)**
   ```bash
   npm run seed
   ```

5. **Start the Server**
   ```bash
   npm run dev
   ```

6. **Frontend Setup**
   Simply serve the `frontend/public` directory using any static web server (e.g., Live Server in VS Code) or access via the backend if served statically.

---

## 🔌 API Documentation (Summary)

### Authentication
- `POST /api/auth/register` - Create a new account.
- `POST /api/auth/login` - User login.

### Attendance
- `POST /api/attendance/check-in` - Mark attendance start (Geofenced).
- `POST /api/attendance/check-out` - Mark attendance end (Geofenced).
- `GET /api/attendance/history` - Retrieve attendance logs.

### Leaves
- `POST /api/leaves/apply` - Submit a leave request.
- `GET /api/leaves/my-leaves` - View own leave status.
- `PATCH /api/leaves/:id/status` - Admin: Approve/Reject requests.

### Payroll
- `POST /api/payroll/generate` - Process monthly salaries.
- `GET /api/payroll/payslip/:id` - Download PDF payslip.

---

## 🧪 Security Hardening (Post-Audit)
This version of EmPay has undergone a technical audit to resolve critical functional bugs:
- Fixed **Geofencing bypass** by enforcing coordinate checks on checkout.
- Resolved **Infinite Leave Glitch** by aggregate pending balance validation.
- Implemented **Race Condition Fixes** for registration IDs using random hex suffixes.
- Added **Dynamic Fallbacks** for frontend script loading to prevent UI crashes.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---

**Built with ❤️ by DAKSH SAVANI**
