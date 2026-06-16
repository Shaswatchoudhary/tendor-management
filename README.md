# TenderHub 🏢🤝
**AI-Powered Tender Management Platform (Frontend Prototype)**

TenderHub is a next-generation, AI-driven platform that revolutionizes the way companies create tenders and vendors apply for them. Built as a fully functional frontend-only prototype, it leverages the **Google Gemini API** to automatically parse, evaluate, and score vendor applications against complex tender requirements—saving hundreds of hours of manual review.

> **Note**: This is a frontend-only prototype. All data is persisted locally in the browser using `localStorage` and mock stores. There is no backend database.

---

## ✨ Key Features

### For Companies 🏢
- **Create Smart Tenders**: Define eligibility criteria, budget, completion timelines, and requested documents.
- **AI Tender Generation**: Use Gemini AI to automatically generate comprehensive NIT (Notice Inviting Tender) PDFs from simple form inputs.
- **Automated Vendor Evaluation**: Gemini evaluates every incoming application, scoring them out of 100% based on Technical, Financial, Experience, and Eligibility matches.
- **Fraud & Authenticity Detection**: The AI automatically flags generic marketing fluff, copy-pasted internet text, or AI-generated responses in vendor submissions.
- **Auto-Selection**: Close a tender with one click to automatically select the highest-scoring, best-matched vendor.

### For Vendors 👷
- **Smart Applications**: Apply to active tenders with detailed financial data, past projects, technical capabilities, and document uploads.
- **Real-time Evaluation Insights**: Once the tender closes, vendors get a detailed AI-generated breakdown of their score, highlighting Strengths, Concerns, Matched Criteria, and Missing items.
- **Application PDF Export**: Automatically generate and download a professional PDF summary of the submitted application.

---

## 🛠️ Technology Stack

- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: SCSS (Component-level modular architecture)
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **AI Integration**: `@google/generative-ai` (Gemini 1.5 Flash / Pro)
- **PDF Generation**: `jspdf`
- **State Management**: Custom local store (`src/lib/store.ts`) leveraging `localStorage`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- A Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Shaswatchoudhary/tendor-management.git
   cd tendor-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open the app**
   Navigate to `http://localhost:5173` in your browser.

---

## 💡 How to Demo

The platform comes with pre-loaded mock data. To properly test the flow:

1. **Company Flow**:
   - Log in as the "Company".
   - Click "Create Tender" and fill out the requirements.
   - Wait for vendor applications to appear in your dashboard.
   - Review the AI scores and click "Close Tender & Select Winner" to finalize.

2. **Vendor Flow**:
   - Log in as the "Vendor".
   - Browse open tenders and click "Apply Now".
   - Submit your details (Try copying/pasting generic text to see the AI penalize your score!).
   - Once the company closes the tender, check your "My Applications" tab to see your final verdict and detailed AI feedback.

---

## 📂 Project Structure

```text
src/
├── components/
│   ├── layout/       # Topbar, Sidebar, and App Shell wrappers
│   └── ui/           # Reusable generic UI components
├── features/
│   ├── company/      # Company-specific views (Create Tender, Dashboard, Results)
│   └── vendor/       # Vendor-specific views (Browse, Apply, Dashboard)
├── lib/
│   ├── gemini.ts     # Core AI prompt engineering, parsing, and PDF generation
│   ├── store.ts      # LocalStorage-based database simulation
│   └── mockData.ts   # Initial seed data
├── styles/           # Global variables and shared SCSS components
└── pages/            # Root level pages (Home/Login)
```

---

*Built with ❤️ for efficient, transparent, and intelligent tender management.*
