# Smart Waste Segregation Assistant

An intelligent, interactive waste classification platform and educational web app aligned with the **United States Environmental Protection Agency (EPA)** and **Basel Convention** waste hierarchy guidelines.

🌐 **Live GitHub Repository:** [https://github.com/blaze-139/smart-waste-segregation](https://github.com/blaze-139/smart-waste-segregation)

---

## 🌟 Key Features

### 1. 🔍 Deterministic Waste Classifier & Search Engine
- Search over 40+ verified domestic waste items across 5 core municipal streams:
  - **Biodegradable & Organics** (Green Cart / Deep Moss)
  - **Dry Recyclables** (Blue Cart / Ocean Blue)
  - **Household Hazardous Waste** (Red Bin / Terracotta)
  - **Electronic Waste (WEEE)** (Slate Depot / Deep Taupe)
  - **Landfill Residuals** (Black Cart)
- Instant autocomplete, material breakdown, disposal protocols, common traps to avoid, and prep steps.

### 2. 📸 Multimodal AI Visual Scanner (EcoSage Engine)
- Live webcam capture and drag-and-drop photo classification powered by **Google Gemini Vision**.
- Automatic material detection, packaging layer analysis, and designated bin concordance.
- Interactive follow-up conversational thread with tailored environmental guidance.

### 3. 🧪 12-Step Degradation Scrubber & Timeline
- Interactive slider exploring environmental persistence from a banana peel (3 weeks) to PET plastic bottles (450 years) and glass (1,000,000+ years).
- Tracks chemical half-life, microplastics release risk, and primary energy conserved.

### 4. 📊 Empirical Analytics & Verified Reports
- Sourced directly from **World Bank What a Waste 2.0**, **UN Global E-Waste Monitor 2024**, and **EPA WARM Model**.
- Dynamic Chart.js visualizations for global municipal composition, e-waste trajectory, and GHG abatement factors.

### 5. 🎮 3D Bin Station & Sorting Mini-Game
- Full 3D interactive station built with **Three.js** featuring orbital controls and hinged lid mechanics.
- Interactive sorting quiz challenge with streak counter, accuracy score, and instant feedback.

### 6. ⚡ Supabase Cloud Backend & Realtime Integration
- **Postgres Database:** Cloud persistence on Supabase (`ap-south-1`).
- **Live Community Telemetry:** Real-time counters tracking total verified community scans, recyclables diverted, organics composted, hazardous materials isolated, and kilograms of CO2e avoided.
- **Postgres Realtime Channel:** Live stream of community scans streaming seamlessly to clients.
- **Global Leaderboard:** High scores and quiz streaks stored in Postgres with instant global rank calculation.
- **Row-Level Security (RLS):** Production-grade access policies protecting data integrity.

---

## 🛠️ Architecture & Tech Stack

- **Frontend:** HTML5, Modern Vanilla CSS (Glassmorphism, custom design system tokens), Vanilla JavaScript (ES6+).
- **3D Graphics:** [Three.js](https://threejs.org/) (WebGL rendering, interactive raycasting, procedural materials).
- **Charts:** [Chart.js](https://www.chartjs.org/) (Responsive doughnut, grouped bar, and line trajectory charts).
- **AI Engine:** Google Gemini Vision API (`gemini-3.5-flash-lite` / `gemini-3.8-flash`).
- **Backend / Database:** [Supabase](https://supabase.com/) (Postgres 17, RLS, Stored Procedures, Realtime Engine).

---

## 🚀 Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/blaze-139/smart-waste-segregation.git
   cd smart-waste-segregation
   ```

2. Start any local static file server:
   ```bash
   # Python
   python -m http.server 3000

   # or Node.js / npx
   npx serve .
   ```

3. Open `http://localhost:3000` in your web browser.

---

## 📜 Database Schema (Supabase)

- `waste_items`: Verified waste knowledge catalog.
- `waste_scans`: Real-time scan and classification logs.
- `quiz_scores`: Competitive quiz leaderboard.
- `community_metrics`: Global community impact aggregation.

---

## 📄 License

MIT License. Open-source educational project.
