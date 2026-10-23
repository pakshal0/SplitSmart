# SplitSmart 💸

An intuitive full-stack web application for splitting shared expenses, managing group budgets, and simplifying debt settlements without awkward math or confusion.

---

## 📌 Project Overview

When friends go on a trip, roommates share flat bills, or colleagues split dining checks, figuring out who owes whom often turns into a messy spreadsheet or confusing chat messages.

**SplitSmart** makes group finances transparent and painless:
- **Zero Calculation Headaches**: Add an expense, choose who was involved, and let SplitSmart calculate exact shares.
- **Smart Debt Reduction**: Instead of 5 people exchanging money back and forth in multiple transactions, our debt simplification algorithm computes the minimum direct payments needed to settle everyone up.
- **Penny-Perfect Accuracy**: All money is handled in integer paise internally so you never get floating-point rounding errors (like `₹33.333333`).

---

## 🛠️ Technologies Used & Why We Used Them

Here is an explanation of every technology used in this project and its exact purpose:

| Technology | What it is | Why we used it in SplitSmart |
|---|---|---|
| **React 18** | Frontend JavaScript Library | Builds a fast, interactive single-page application with reusable UI components. |
| **Vite** | Frontend Build Tool | Provides near-instant local server startup and rapid hot-module reloading during development. |
| **Tailwind CSS** | Utility-First CSS Framework | Creates a clean, modern SaaS design with responsive layouts and custom color schemes. |
| **Lucide React** | Icon Pack | Lightweight, consistent vector icons for buttons, categories, and alerts. |
| **Recharts** | Data Visualization Library | Renders interactive spending graphs, monthly trends, and category breakdown charts. |
| **Node.js & Express.js** | Backend Server & REST API | Handles all API requests, authentication, expense splitting calculations, and database operations. |
| **MongoDB & Mongoose** | NoSQL Database & ODM | Stores user profiles, groups, expenses, budgets, settlements, and activity logs in structured schemas. |
| **Tesseract.js** | Optical Character Recognition (OCR) | Scans uploaded receipt photos to automatically extract merchant name, total bill amount, and date without needing third-party paid AI APIs. |
| **JWT & bcryptjs** | Authentication & Security | Encrypts user passwords and manages secure user sessions using HTTP-only cookies. |
| **Vitest & Supertest** | Testing Framework | Runs 34 automated unit and integration tests to verify that financial math and API endpoints are 100% bug-free. |

---

## 🌟 Key Features & How to Use Them

### 1. 🧠 Smart Spending Insights (Dashboard)
- **What it does:** Analyzes your spending habits over the last 30 days compared to the previous period.
- **What you see:** Total money spent, spending trend percentage (increase/decrease), your #1 top expense category, and whether you are owed money or owe others.
- **Actionable Advice:** Displays smart recommendations (e.g., alerts when dining out exceeds 40% of your total budget, or reminders when you have pending payments).

### 2. 🎯 Group Budget Tracker (Groups Page)
- **What it does:** Allows groups to set a spending ceiling for trips, projects, or shared apartments.
- **How to use it:**
  1. Open any group and click **"Set Budget"** (or **"Edit Budget"**).
  2. Pick a quick preset (₹5k, ₹10k, ₹25k, ₹50k) or enter your own custom limit.
  3. The live progress bar automatically updates:
     - 🟢 **Green / Blue (<80%):** Spending is on track.
     - 🟡 **Yellow / Amber (80%–100%):** Warning alert that you are nearing the budget cap.
     - 🔴 **Red (>100%):** Exceeded alert showing the exact amount over budget.

### 3. 📸 Receipt Scanning with OCR (Add Expense Modal)
- **What it does:** Saves time typing by reading physical paper bills or digital receipts.
- **How to use it:**
  1. Click **"+ Add Expense"** in any group.
  2. Click **"Upload Receipt"** and select a photo (JPEG, PNG, WebP up to 5MB).
  3. The built-in OCR reads the image and auto-populates the Description, Amount (₹), Date, and Category.
  4. You can review and adjust any field before clicking **"Save Expense"**.

### 4. ⚖️ 3 Splitting Methods
- **Split Equally:** Divides the bill evenly among all selected members (handles odd paise remainders fairly).
- **Custom Amounts (₹):** Specify the exact rupees each individual consumed.
- **Percentage Split (%):** Split by percentage (e.g., 50% / 30% / 20%).

### 5. 🤝 Smart Debt Simplification & One-Click Settlements
- **What it does:** Eliminates circular debts (e.g., if A owes B ₹500, and B owes C ₹500, the system simplifies it so A just pays C ₹500 directly).
- **How to use it:** Go to the **"Balances & Settle"** tab in any group to see the recommended minimum payments and record payments once transferred via UPI or cash.

---

## 🚀 How to Run on Localhost

### Step 1: Requirements
Make sure you have installed on your computer:
- [Node.js](https://nodejs.org/) (Version 18 or newer)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) running locally on port `27017`

### Step 2: Install Dependencies
Open your terminal in the `SplitSmart` project folder:
```bash
npm install
```

### Step 3: Run the Application
Start both the backend server and frontend client with a single command:
```bash
npm run dev
```

### Step 4: Open in Your Browser
- **Frontend App:** Open [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5001/api/v1](http://localhost:5001/api/v1)
- **API Health Check:** [http://localhost:5001/api/v1/health](http://localhost:5001/api/v1/health)

---

## 👤 Demo Test Accounts

The database comes pre-seeded with realistic groups and expenses. You can sign in using any of these accounts:

| User | Email | Password |
|---|---|---|
| **Rahul Sharma** | `rahul@splitsmart.com` | `password123` |
| **Priya Patel** | `priya@splitsmart.com` | `password123` |
| **Amit Verma** | `amit@splitsmart.com` | `password123` |
| **Sneha Rao** | `sneha@splitsmart.com` | `password123` |

*(You can also click **"Create Account"** on the login page to register a new account.)*

---

## 🧪 Running Automated Tests

To run the complete test suite (checks calculations, budgets, OCR parsing, and authentication):
```bash
npm test
```
*(All 34 tests in 7 test suites pass.)*
