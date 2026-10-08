<div align="center">

# 🩺 Arogya Copilot
### **Smart Health Organizer & Multimodal AI Clinical Companion**

Transforming messy, paper-based medical reports and prescriptions into structured, multilingual, ABDM & HL7 FHIR R4-compliant health intelligence.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://arogya-copilot.vercel.app/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%20Flash-4285F4?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
[![HL7 FHIR](https://img.shields.io/badge/Standard-HL7%20FHIR%20R4-E01E5A?style=for-the-badge)](https://hl7.org/fhir/)
[![ABDM](https://img.shields.io/badge/Ecosystem-ABDM%20%2F%20ABHA-FF9933?style=for-the-badge)](https://abdm.gov.in/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20Postgres-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

[🌐 **Live Application**](https://arogya-copilot.vercel.app/) • [🔑 **Quick Test Access**](#-evaluator-quick-test-access) • [🏗️ **Architecture Pipeline**](https://arogya-copilot.vercel.app/architecture) • [📄 **FHIR R4 Schema**](#-fhir-r4--abdm-interoperability)

</div>

---

## ⚡ Evaluator Quick Test Access

| Resource | Details |
| :--- | :--- |
| **Live Production URL** | **[https://arogya-copilot.vercel.app/](https://arogya-copilot.vercel.app/)** |
| **Demo Account Email** | `demo@arogya.com` |
| **Demo Account Password** | `ArogyaDemo@123` |
| **Self Sign-Up** | Instant registration available on [`/signup`](https://arogya-copilot.vercel.app/signup) |
| **Sample Data** | 1-Click sample FHIR bundles can be imported via **Profile** (`/profile`) |

---

## 💡 The Problem & Our Solution

### The Challenge
- **Fragmented Medical History**: Millions of patients carry envelopes of paper lab reports, handwritten prescriptions, and diagnostic scans that get lost across hospital visits.
- **Complex Medical Jargon**: Patients struggle to understand physiological ranges, abnormal biomarker levels, and prescription dosage schedules.
- **Language Barriers**: In diverse nations like India, medical reports are written almost exclusively in English, isolating non-English speaking patients and caregivers.
- **Zero Interoperability**: Critical clinical data remains trapped in physical paper or PDFs, inaccessible to digital hospital EHRs.

### The Arogya Copilot Solution
Arogya Copilot leverages **Google Gemini Multimodal Vision AI** and international healthcare standards (**HL7 FHIR R4 & ABDM**) to ingest unstructured health documents, extract structured biomarkers with physiological reference ranges, flag clinical risks, provide multilingual translations in regional languages (**Telugu, Hindi, etc.**), and power a grounded, privacy-preserving AI health companion.

---

## 🌟 Key Features

### 1. 📷 Multimodal Clinical OCR & Entity Ingestion
- Upload doctor prescriptions, lab panels (CBC, Lipid, Metabolic), and hospital discharge summaries via **drag-and-drop or camera capture** (PNG, JPG, PDF up to 10MB).
- Extracts medications, dosages, frequency, test names, observed values, and laboratory reference intervals.

### 2. ⚠️ Intelligent Biomarker & Abnormal Flagging
- Automatically benchmarks test values against age/gender-adjusted reference bands.
- Color-coded severity indicators (`Normal`, `Abnormal`, `Critical`) for rapid triage and longitudinal tracking.

### 3. 🌐 Multilingual Health Translation (Bonus Track)
- Breaks language barriers by translating clinical findings, diagnoses, and doctor instructions into regional Indian languages including **Telugu (తెలుగు)** and **Hindi (हिन्दी)** with medical context preservation.

### 4. 🏥 HL7 FHIR R4 & ABDM Standards Interoperability
- Converts raw medical extractions into standardized **HL7 FHIR Release 4 resources**:
  - `DiagnosticReport`: Structured diagnostic panel header & clinical conclusions.
  - `Observation`: Atomic test observations with LOINC/clinical coding, quantities, and reference bands.
  - `MedicationRequest`: Prescriptions with dosage instructions and route.
  - `Bundle`: Complete clinical transaction collection exportable with one click.
- **ABDM / ABHA Ready**: Extracts and validates 14-digit Ayushman Bharat Health Account IDs and QR identity cards.

### 5. 💬 Context-Aware AI Health Copilot
- Conversational clinical assistant grounded strictly in the patient's uploaded health history.
- Ask questions like: *"Why is my creatinine elevated?"*, *"How should I schedule my blood pressure medication?"*
- Built with **strict clinical safety disclaimers** and emergency escalation guidelines.

### 6. 📈 Longitudinal Trend Analytics
- Dynamic charts (powered by Recharts) visualize biomarkers over time (Blood Sugar, HbA1c, Cholesterol, Thyroid) with normal reference bands to monitor disease trajectory.

---

## 🏗️ System Architecture & 7-Stage Pipeline

```
  [ Patient Client ]
   (Camera / PDF Upload)
          │
          ▼
  [ Stage 1: Ingestion & Validation ] (Size, MIME, client-side preview)
          │
          ▼
  [ Stage 2: Supabase Private Vault ] (Isolated storage with RLS)
          │
          ▼
  [ Stage 3: Multimodal Vision AI ] (Google Gemini 3.5 / 3.6 Flash)
          │
          ▼
  [ Stage 4: Clinical Entity Normalization ] (Medicines, Vitals, Range parsing)
          │
          ▼
  [ Stage 5: FHIR R4 Schema Mapping ] (HL7 DiagnosticReport & Observation Bundles)
          │
          ▼
  [ Stage 6: Isolated Relational Store ] (PostgreSQL with Row-Level Security)
          │
          ▼
  [ Stage 7: Presentation & Copilot Engine ]
   ├── Longitudinal Timeline & Biomarker Charts
   ├── Regional Translation (Hindi / Telugu)
   └── Grounded Clinical Copilot Chat
```

---

## 💻 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | **Next.js 14 (App Router)** | Modern full-stack React framework with Serverless Route Handlers |
| **Language** | **TypeScript 5** | End-to-end type safety across clinical schemas |
| **Styling & UI** | **Tailwind CSS & Framer Motion** | Responsive Liquid Glass design system with smooth animations |
| **AI / Multimodal** | **Google Gemini 3.5 & 3.6 Flash** | Advanced OCR, document vision reasoning, and clinical translation |
| **Database & Auth** | **Supabase (PostgreSQL 15)** | Scalable relational storage with PostgreSQL **Row-Level Security (RLS)** |
| **Health Standards** | **HL7 FHIR R4 & ABDM** | International healthcare interoperability and national digital health ID |
| **Analytics** | **Recharts** | Interactive longitudinal health tracking with reference range bands |
| **Hosting & CI/CD** | **Vercel** | Edge network and serverless deployment with automated GitHub CI/CD |

---

## 🧪 3-Minute Judging Walkthrough

To quickly evaluate the platform, follow this path:

1. **Log In**: Navigate to [https://arogya-copilot.vercel.app/login](https://arogya-copilot.vercel.app/login) and use `demo@arogya.com` / `ArogyaDemo@123`.
2. **Review Dashboard (`/dashboard`)**: Inspect patient timeline, abnormal alerts, and interactive blood biomarker trend curves.
3. **Upload a Report (`/upload`)**: Drag and drop any lab report (PDF/image) and observe the multimodal extraction pipeline.
4. **Inspect FHIR R4 (`/reports/[id]`)**: Open any report and click **"Inspect FHIR R4 Bundle"** to inspect standard JSON clinical data.
5. **Test Multilingual Translation**: Click the language toggle to translate findings into **Telugu (తెలుగు)** or **Hindi (हिन्दी)**.
6. **Chat with Copilot (`/chat`)**: Ask clinical questions regarding the uploaded test findings and observe safety guardrails.
7. **Inspect System Architecture (`/architecture`)**: Review the visual pipeline diagram and clinical data specification.

---

## 🔒 Security, Privacy & Clinical Safety

- **Row-Level Security (RLS)**: Enforced directly on PostgreSQL. Users can never view or query another patient's medical records.
- **Server-Side API Key Isolation**: Gemini API keys and Supabase service keys are strictly encapsulated in secure server-side environments.
- **Responsible AI Disclaimer**: Prominently featured across all analysis and chat interfaces—emphasizing that AI synthesis is for patient educational support and does not replace certified physician diagnosis.

---

## 🚀 Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/sriviswanadhampabolu/arogya-copilot.git
cd arogya-copilot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local` and add your keys:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.5-flash
GEMINI_MODEL_STRONG=gemini-3.6-flash
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 5. Build for Production
```bash
npm run build
npm run start
```

---

<div align="center">
Made with ❤️ for better patient health literacy & interoperable healthcare.
</div>
