# 🌾 BUKID (eBUKID)

An SMS-based agricultural equipment management platform designed to bridge the gap between the rural reality of the Philippine farmer and enterprise-grade cooperative efficiency.

## 📖 The Problem
Despite 96.23% of farmers agreeing that shared agricultural machinery reduces production costs, Philippine agricultural cooperatives operate under a severe machinery deficit (4.22 tractors per 1,000 hectares vs. the global standard of 10). 

Because equipment is scarce, cooperatives rely on informal, memory-based, and socially rooted scheduling. This lack of formal digital governance leads to:
1. **Inequitable Access:** Nearly 50% of farmers are unable to secure machinery during narrow planting windows.
2. **Asset Decay:** 98% of farmers report anxiety over reactive breakdowns due to a lack of maintenance tracking.
3. **Compliance Blindspots:** Cooperatives struggle to provide accurate digital logbooks for DA and PhilMech audits.

## 💡 The Solution: BUKID
BUKID provides enterprise-grade logistics to cooperatives without requiring the end-user (the farmer) to own a smartphone or have internet access. 

By utilizing a forgiving SMS parser, farmers can book heavy machinery using basic keypad phones (e.g., Nokia) in localized Tagalog. The system automatically syncs this SMS data to a cloud-based React dashboard for Cooperative Admins, eliminating manual data entry and double-booking.

## ⚙️ System Architecture & Features
1. **Offline-First SMS Booking:** Farmers text a simple syntax (e.g., `HIRAM JUAN TRACTOR 03-05`). The system authenticates, checks availability, and replies in Tagalog.
2. **Visual Master Schedule:** A real-time, auto-updating web dashboard that translates SMS bookings into blocked calendar slots.
3. **Automated Digital Logbook:** Every SMS transaction dynamically populates a secure database, allowing admins to export accurate PhilMech/DA compliance reports with one click.
4. **Predictive Asset Tracker:** Monitors operating hours logged via SMS and automatically flags equipment for maintenance.

---

## 🛠️ Tech Stack
This project is built with a modern, high-performance web stack:
* **Frontend:** React, Vite, TypeScript
* **Styling & Components:** Tailwind CSS, shadcn-ui
* **Backend:** Node.js (SMS Webhook & Parser)
* **Database:** Supabase (PostgreSQL)

---

## 🚀 Getting Started (Local Development)

If you want to run the BUKID admin dashboard locally, the only requirement is having Node.js & npm installed.

**Step 1:** Clone the repository
```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>