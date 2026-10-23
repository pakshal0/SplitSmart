# SplitSmart Production Deployment Guide 🚀

This guide walks you through deploying **SplitSmart** as a unified all-in-one service on **Render** (Free Tier) connected to **MongoDB Atlas** (Free Tier M0).

---

## 🏗️ Architecture Overview

- **Database:** MongoDB Atlas M0 (Free Forever, 512MB cloud storage).
- **Web App & API:** Render Free Web Service (Serves the compiled React Vite frontend and the Node.js Express REST API under a single unified URL, e.g. `https://splitsmart.onrender.com`).
- **Key Advantages:**
  - 100% Free
  - Zero CORS or cross-origin cookie problems (frontend and backend live on the exact same domain)
  - Automatic deployment on every `git push` to your GitHub repo

---

## 📋 Step 1: Set Up MongoDB Atlas (Cloud Database)

If you don't already have a cloud MongoDB database:

1. **Sign Up / Log In:** Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign in.
2. **Create a Free Cluster:**
   - Click **Create** (or **Build a Database**).
   - Select the **M0 (Free)** tier.
   - Provider: **AWS**, Region: Choose the one closest to you (e.g. `ap-south-1` Mumbai or `ap-southeast-1` Singapore).
   - Name your cluster (e.g., `Cluster0`) and click **Create Deployment**.
3. **Set Up Database User Authentication:**
   - In **Database Access** (left sidebar): Click **Add New Database User**.
   - Authentication Method: **Password**.
   - Username: e.g. `splitsmart_admin`.
   - Password: Click **Autogenerate Secure Password** or enter one. **Save this password somewhere safe!**
   - Built-in Role: **Read and write to any database**.
   - Click **Add User**.
4. **Configure Network Access (Crucial):**
   - In **Network Access** (left sidebar): Click **Add IP Address**.
   - Click **Allow Access from Anywhere** (adds `0.0.0.0/0`).
   - *(Render cloud servers use dynamic IP addresses, so `0.0.0.0/0` is required for your backend to connect).*
   - Click **Confirm**.
5. **Copy Your Connection String:**
   - In **Database** (left sidebar): Click **Connect** next to your cluster.
   - Choose **Drivers** (Node.js).
   - Copy the connection string. It will look like this:
     ```
     mongodb+srv://splitsmart_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual database user password.
   - Add `/splitsmart` right before the `?`:
     ```
     mongodb+srv://splitsmart_admin:YourSecretPassword@cluster0.xxxxx.mongodb.net/splitsmart?retryWrites=true&w=majority
     ```

---

## 📋 Step 2: Push Code Updates to GitHub

We have configured the build scripts, production static file serving, and dual-auth safeguards. Commit and push these changes to GitHub:

```bash
git add .
git commit -m "Configure production build, SPA routing, and Render deployment"
git push origin main
```

---

## 📋 Step 3: Deploy on Render

1. **Sign Up / Log In:** Go to [render.com](https://render.com) and log in with your GitHub account.
2. **Create New Web Service:**
   - Click the blue **New +** button in the dashboard and choose **Web Service**.
   - Choose **Build and deploy from a Git repository**.
   - Connect your `pakshal0/SplitSmart` repository.
3. **Configure Service Settings:**
   - **Name:** `splitsmart` (or any custom name like `splitsmart-app`)
   - **Region:** Choose Singapore, Frankfurt, or Oregon (closest to your MongoDB Atlas region)
   - **Branch:** `main`
   - **Root Directory:** *(Leave completely blank)*
   - **Runtime:** `Node`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
4. **Add Environment Variables:**
   Scroll down to the **Environment Variables** section and add:

   | Key | Value | Note |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production mode |
   | `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string from Step 1 |
   | `JWT_SECRET` | `splitsmart_jwt_super_secure_production_secret_key_98765` | A long random secret key |
   | `JWT_EXPIRES_IN` | `7d` | Token lifetime |
   | `COOKIE_SECURE` | `true` | Enables secure cookies over HTTPS |

5. **Deploy:**
   - Click **Create Web Service** (or **Deploy Web Service**).
   - Render will automatically clone your repo, run `npm run build` (installing dependencies and compiling the Vite frontend into `client/dist`), and start the Express server!

---

## 📋 Step 4 (Optional): Populate Initial Demo Data

If you want your deployed database pre-populated with realistic demo groups, expenses, and users:

Run this command directly from your local terminal:

```bash
MONGODB_URI="your-mongodb-atlas-uri-here" npm run seed
```

This will connect to your MongoDB Atlas database, create demo users (`rahul@splitsmart.com`, `priya@splitsmart.com`, etc.) and pre-seed expense history.

---

## ✅ Step 5: Verify Your Live App

Once Render finishes deploying (status turns to 🟢 **Live**):

1. **Open your live URL:** e.g. `https://splitsmart.onrender.com`
2. **Health Check:** Visit `https://splitsmart.onrender.com/api/v1/health` — it should return:
   ```json
   {
     "status": "ok",
     "service": "SplitSmart Backend API"
   }
   ```
3. **Test In Browser:**
   - Register a new account or log in with demo credentials.
   - Create a group, add an expense, test receipt scanning, and record a settlement.
   - Refresh the page on any subroute (e.g. `/expenses` or `/groups`) to confirm client-side routing works smoothly.

---

> [!TIP]
> **Note on Render Free Tier Sleep Mode:**
> Render's free tier spins down after 15 minutes of inactivity. When someone visits the site after it has slept, the initial request may take ~30–50 seconds to cold start. Once awake, it responds instantly!
