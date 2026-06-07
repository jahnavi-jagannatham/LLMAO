/**
 * Global In-Memory Shared State for the MVP
 * Stores translation records, payment verifications, and settlement outcomes.
 */

export interface TranslationRecord {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  translation: string;
  latency: number;
  timestamp: number;
}

export interface VerificationRecord {
  passed: boolean;
  score: number;
  reason: string;
  timestamp: number;
}

export interface SettleRecord {
  settled: boolean;
  txHash?: string;
  timestamp: number;
}

class MemoryStore {
  // Map to store translation results by a unique ID or key
  private translations = new Map<string, TranslationRecord>();
  
  // Map to store payment verification results by nonce
  private verifications = new Map<string, VerificationRecord>();
  
  // Map to store settlement results by nonce
  private settlements = new Map<string, SettleRecord>();

  // Helper to store/get latest translation
  private latestTranslationId: string = "default";

  setTranslation(id: string, record: TranslationRecord) {
    this.translations.set(id, record);
    this.latestTranslationId = id;
  }

  getTranslation(id: string): TranslationRecord | undefined {
    return this.translations.get(id);
  }

  getLatestTranslation(): TranslationRecord | undefined {
    return this.translations.get(this.latestTranslationId);
  }

  setVerification(nonce: string, record: VerificationRecord) {
    this.verifications.set(nonce.toLowerCase(), record);
  }

  getVerification(nonce: string): VerificationRecord | undefined {
    return this.verifications.get(nonce.toLowerCase());
  }

  setSettlement(nonce: string, record: SettleRecord) {
    this.settlements.set(nonce.toLowerCase(), record);
  }

  getSettlement(nonce: string): SettleRecord | undefined {
    return this.settlements.get(nonce.toLowerCase());
  }

  clear() {
    this.translations.clear();
    this.verifications.clear();
    this.settlements.clear();
    this.latestTranslationId = "default";
  }
}

// Global singleton instance
export const globalStore = new MemoryStore();
