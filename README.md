# VoiceForms AI 🎙️📄
> **"Forms become conversations."**

VoiceForms AI is a production-ready, AI-native alternative to Google Forms. Instead of manually filling inputs, respondents participate in a natural multilingual voice conversation. The multi-agent orchestrator translates speech in real time, extracts structured answers, and stores reusable user-owned identity credentials on Monad Testnet.

---

## 🌟 Vision & Differentiator

1. **AI-Native Multilingual Interviews**: Driven by Sarvam AI and Gemini APIs, respondents answer naturally in their native language (**English, Hindi, Telugu, Kannada, Tamil, Malayalam**).
2. **Monad Reusable Identity Layer**: We do not use Monad simply to store submission hashes. We build a **reusable user-owned identity profile system** on-chain. Future forms query the user's Monad profile and offer to **Smart Autofill** verified data in a single tap.
3. **On-chain Validation Proofs**: Each completed form generates a canonical JSON representation and a SHA-256 hash. The submission verification record is registered permanently to the Monad Testnet.

---

## 🛠️ Technology Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **State**: Zustand
- **AI Integration**: Sarvam AI (Speech-to-Text, Text-to-Speech, Translation) + Gemini API (Orchestrator, Extraction)
- **Web3 Engine**: Wagmi, Viem, Monad Testnet Injected wallet (MetaMask / Rabby)
- **Solidity Smart Contracts**: `VoiceForms.sol` deployed on Monad Testnet at `0x21268e45412bac4cef41c79b69ef382ed17cb5e2`

---

## 🤖 Multi-Agent Architecture
The application coordinates 6 specialized modular agents:
- **Form Understanding Agent**: Reads form schema, maps required fields, and tracks interview completion percentage.
- **Interview Agent**: Tracks conversation context, determines question order, and prompts user naturally.
- **Language Agent**: Orchestrates translation of inputs/outputs using Sarvam AI, returning native language audios.
- **Response Extraction Agent**: Extracts structured values (e.g. converting *"my CGPA is eight point seven"* to `{ cgpa: 8.7 }`).
- **Completion Agent**: Detects missing fields, triggers follow-ups, and approves the form.
- **Verification Agent**: Computes the canonical SHA-256 submission hash and broadcasts it to Monad.

---

## ⏱️ 60-Second Quick Demo Guide for Judges

For presenting or judging in under a minute, follow this curated flow:

1. **Boot Quick Demo Mode**: Toggle the **"Quick Demo"** switch in the top header. This simulates preloading your verified identity profile (Name, College, Degree) from the Monad Registry.
2. **Choose Language**: Select a language card (e.g., **Kannada** or **Hindi**).
3. **Trigger Smart Autofill (Key Moment)**: The AI Interview Agent immediately speaks and prompts:
   > *"I detected verified details in your Monad profile. Should I use them to auto-fill the form?"*
4. **Accept Autofill**: Click the glowing button **"Yes, Autofill Monad Profile"**. Name, College, and Degree fields fill instantly in the lower pane, with active agent logs updating in the visualizer.
5. **Answer the Rest by Voice**: Click the **Microphone** icon. Speak into the mic:
   > *"My CGPA is around eight point seven."* (Follow up projects and goals fields next).
6. **Canonical Review**: View the extracted responses on the Review Screen. Edits are allowed.
7. **Monad Verification**: Click **"Submit & Register on Monad"**. It generates a SHA-256 hash, broadcasts to Monad Testnet, fires success confetti, and displays the receipt page showing the Monad Transaction Hash and proof records.

---

## 🚀 Local Setup & Installation

### Prerequisites
- Node.js v18.x or newer
- An Injected Wallet (MetaMask/Rabby) configured for the **Monad Testnet**:
  - **RPC URL**: `https://testnet-rpc.monad.xyz`
  - **Chain ID**: `10143`
  - **Currency Symbol**: `MON`
  - **Explorer**: `https://testnet.monadscan.com`

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` or `.env.local` file in the root directory:
```env
SARVAM_API_KEY="your-sarvam-api-key"
GEMINI_API_KEY="your-gemini-api-key"
NEXT_PUBLIC_CONTRACT_ADDRESS="0x21268e45412bac4cef41c79b69ef382ed17cb5e2"
```
*(Note: If no API keys are provided, the system gracefully falls back to Web Speech APIs and a preloaded dictionary, allowing the entire flow to run smoothly with zero keys!)*

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📂 Solidity Smart Contract
Deployed Address: **`0x21268e45412bac4cef41c79b69ef382ed17cb5e2`** on Monad Testnet.

The Solidity code is located at [VoiceForms.sol](file:///c:/2026/Monad_2/LLMAO/contracts/VoiceForms.sol).
- **`saveProfile`**: Stores user-owned verified identity profile attributes on-chain.
- **`submitVerification`**: Registers form canonical SHA-256 hashes linked to the form ID and submitter address.
