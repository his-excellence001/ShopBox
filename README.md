# ShopBox - Business Intelligence Assistant for Retail Owners

## 🚀 The Problem
Small shop owners lose money because they rely on memory and paper notebooks. They don't know what's selling, when to restock, or where to buy cheaper.

## 💡 The Solution
ShopBox is not a generic POS. It is a two-sided retail intelligence platform:
- **Seller Side:** Ultra-minimal, fast sales & restocking.
- **Owner Side:** Role-based access, security locks, AI-driven advice, cash flow forecasts, and an intelligent dashboard.

## 🛠️ Tech Stack
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (No frameworks—works offline!)
- **Backend:** LingoQL / Sub0 (Declarative JSON APIs, integrated via a swappable data layer)
- **Data:** LocalStorage for demo; ready for cloud sync.

## 🧪 Features (v1.0)
- 🔐 **Role-based Login:** Separate entry for Owner (unrestricted) vs. Clerks (restricted) using secure PIN inputs.
- 🔒 **Terminal Security Lock:** Instantly locks modification privileges on the seller-side dashboard to prevent unauthorized additions or stock edits.
- 📦 **Full Inventory Control (CRUD):** Live product creation, dynamic restocks, point-of-sale mock triggers, and restricted deletion.
- 🔍 **Real-time Live Filtering:** Instantly filters products by typing keywords.
- 📥 **Audit-Ready Reporting:** Allows owners to export local product tables directly into a clean `.csv` spreadsheet file with one click.
- 📊 **Owner Intelligence Dashboard:** Integrated analysis metrics displaying live daily profit, total sales, and visual low-stock warning indicators.