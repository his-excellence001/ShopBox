# ShopBox - Business Intelligence Assistant for Retail Owners

## 🚀 The Problem
Small shop owners lose money because they rely on memory and paper notebooks. They don't know what's selling, when to restock, or where to buy cheaper.

## 💡 The Solution
ShopBox is not a generic POS. It is a two-sided retail intelligence platform:
- **Seller Side:** Ultra-minimal sales & return terminal – no clutter, no confusion.
- **Owner Side:** Role-based access, PIN-secured terminal lock, AI-driven advice, cash flow forecasts, scenario simulator, and budget planner.

## 🛠️ Tech Stack
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (No frameworks – works fully offline!)
- **Backend Blueprint:** LingoQL / Sub0 declarative JSON APIs (swappable data layer – localStorage now, cloud‑ready via commented `fetch` hooks)
- **Data:** LocalStorage for demo; ready for PostgreSQL / Sub0 sync.
- **Extras:** Python backend for wholesale scraping & vector‑based supplier matching (in `backend/` folder)

## 🧪 Features (v1.0)

### 🔐 Authentication & Roles
- **Owner Registration:** First user creates a company account with name + 4‑digit PIN.
- **Employee Management:** Owner can add employees (name + PIN) directly from the dashboard.
- **Role‑Based Access:**
  - Employees: can only **sell** and **void returns**. No access to restocking, product creation, or the Owner Dashboard.
  - Owner: full access, protected by an additional terminal lock.

### 🔒 Security
- **Terminal Lock:** Owner can lock/unlock the entire shop with a PIN. When locked, no new products can be added or edited.
- **Void/Return System:** Employees can void a sale from today. Stock is restored, and an audit trail is kept – zero data loss.

### 📦 Inventory & Sales
- **Product Management (Owner only):** Add new products with cost price, selling price, and initial stock.
- **Fast Sales:** One‑tap sell button decrements stock, logs profit, and updates live summaries.
- **Restocking (Owner only):** Prompt‑based restock with quantity input.
- **Real‑time Search:** Filter products instantly by name while typing.
- **CSV Export:** One‑click download of the full inventory as a `.csv` spreadsheet.

### 📊 Owner Intelligence Dashboard (separate page)
- **Business Health Score:** Visual gauge with trend indicators (cash flow, stock risk, profit trend).
- **Cash Flow Forecast:** Current, 7‑day, and 30‑day projections.
- **AI‑Powered Advice Feed:** Dismissible, color‑coded impact cards (e.g., "Increase Rice stock – High Impact").
- **Scenario Simulator:** Select a real product from your inventory, adjust its price, and instantly see the weekly profit impact.
- **Weekly Budget Planner:** Pre‑filled budget breakdown with a safe spending limit.

### 📱 Progressive Web App (Bonus)
- **Installable on mobile:** Manifest and theme‑color meta tags allow "Add to Home Screen" – looks and feels like a native app.
- **Offline‑first:** Works without internet – all data stays on the device until you choose to sync.

## 🏗️ Project Structure
ShopBox/
├── index.html (Main shop interface)
├── style.css (Shop styling)
├── script.js (Core logic, permissions, sales, return, CSV, search)
├── login.html (Owner/Employee login & registration)
├── login.js (Auth handling, role assignment)
├── dashboard.html (Owner Intelligence Dashboard)
├── dashboard.css (Dark dashboard theme)
├── dashboard.js (Dashboard interactivity, scenario simulator)
├── manifest.json (PWA manifest)
├── favicon.ico (Browser tab icon)
├── logo.png (Brand logo)
├── README.md
└── backend/ (Python scraping & vector engine blueprints)
├── schema.sql
├── scraper.py
├── purchasing_engine.py
└── requirements.txt
## 🎯 Built for Zero to Query Hackathon
This project was designed to prove that a student with no professional development experience can build a real, scalable retail intelligence platform using prompt‑driven development and declarative backends.

---

Made with 💙 by Tanaka Mbewe
