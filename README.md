# Pay-When-It-Works Translation MVP (Monad Testnet)

A complete hackathon-ready MVP demonstrating **agentic payments using x402 conditional settlement** on the Monad Testnet. 

This application implements a conditional payment system where a user pays a translation agent *only if* the translation satisfies a quality checker (LLM Judge) evaluation.

---

## 💡 Use Case & Architecture

1. **Input & Select**: Payer enters source text, source language, and target language.
2. **Authorize**: Payer signs an off-chain **USDC EIP-3009** (`ReceiveWithAuthorization`) payment authorization.
3. **Verify Signature**: The app submits the signature to `/api/verify-payment`, cryptographically validating the EIP-712 typed structure on the server.
4. **Agent Execute**: The translation agent processes the text via the **Sarvam AI Translation API** and returns the translation.
5. **Quality Judge**: The Verification Engine evaluates translation quality (e.g. grammar, vocabulary, semantics).
6. **Conditional Release**:
   * **If quality passes (Demo Success)**: The server calls `/api/settle-payment`, submitting the EIP-3009 signature directly to the USDC contract on Monad Testnet. Payer pays the agent, and the UI displays **Payment Released** along with a live transaction hash.
   * **If quality fails (Demo Failure)**: The server blocks the settlement. Payer funds are safe, and the UI displays **Payment Not Released**.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS
* **Web3 Integration**: `viem`, `wagmi`, `@tanstack/react-query`
* **Protocol & Standard**: EIP-3009 (`ReceiveWithAuthorization`) and x402 scheme concepts
* **Translation API**: Sarvam AI API
* **Blockchain Network**: Monad Testnet (Chain ID `10143`)
  * **USDC Address**: `0x534b2f3A21130d7a60830c2Df862319e593943A3`
  * **Default RPC**: `https://testnet-rpc.monad.xyz`

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js v18 or later
* An EVM-compatible browser wallet (MetaMask or Rabby) configured for the **Monad Testnet** (Chain ID: `10143`).
* *Optional*: Some testnet MON and testnet USDC on Monad Testnet (you can get USDC by swapping on testnet DEXs or using faucets).
* *Note*: If you don't have MetaMask installed, you can toggle **"Virtual Wallet"** in the dashboard to sign messages instantly using a browser-generated EOA.

### 2. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory by copying the example template:
```bash
cp .env.example .env
```
Fill in the credentials in `.env`:
* `SARVAM_API_KEY`: Obtain a key from the [Sarvam AI Dashboard](https://dashboard.sarvam.ai/). If left empty, the application falls back to a simulated translation engine.
* `TRANSLATOR_AGENT_KEY`: The private key of the agent server. If provided and funded with MON, the server submits EIP-3009 transactions directly to the blockchain. If left empty, the server executes a simulated transaction fallback.

### 4. Running the App
Run the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 Walkthrough Instructions for Judges

We've built a step-by-step interactive panel to let judges test the conditional payment system without friction.

### Flow A: Demo Success Mode (Payment Released)
1. Navigate to the dashboard (click **Start Translation** on the Home Page).
2. Ensure the top toggle is set to **"Demo Success"**.
3. Toggle to **"Virtual Wallet"** (recommended for instant testing) or connect your MetaMask.
4. Click **1. Sign Payment Authorization**. Your wallet will request a typed signature. Confirm the signature.
5. Click **2. Verify Payment**. The app cryptographically verifies the EIP-3009 signature on the backend.
6. Click **3. Run Translation**. The agent will generate the translation (matching our expected phrase).
7. Click **4. Check Translation**. The LLM judge verifies quality and registers a score of **0.98/1.0 (PASS)**.
8. Click **5. Settle Payment**. The payment settles, on-chain transaction executes, and the UI turns **Green** showing **"Payment Released"** and the transaction hash.

### Flow B: Demo Failure Mode (Payment Blocked)
1. Click **Reset Flow** on the dashboard.
2. Change the top toggle to **"Demo Failure"**.
3. Click **1. Sign Payment Authorization** and sign the authorization.
4. Click **2. Verify Payment** to verify the signature.
5. Click **3. Run Translation**. The agent outputs an incorrect translation as mock failure.
6. Click **4. Check Translation**. The LLM judge detects the bad grammar/errors and registers **0.35/1.0 (FAIL)**.
7. Click **5. Settle Payment**. The settlement is **Blocked**, the UI turns **Red** showing **"Payment Not Released"**, and no transaction is executed on-chain.
