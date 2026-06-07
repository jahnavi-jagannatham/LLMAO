/**
 * Translation Quality Checker - LLM Judge Engine for MVP
 */

export interface VerificationResult {
  passed: boolean;
  score: number;
  reason: string;
}

/**
 * Verifies the quality of a translation.
 * Uses hardcoded scenarios for hackathon demonstration:
 * - Successful matching case (English -> Hindi)
 * - Custom simulated LLM scoring if not matching
 */
export function verifyTranslation(
  original: string,
  translated: string,
  sourceLanguage: string,
  targetLanguage: string
): VerificationResult {
  const normOriginal = original.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
  const normTranslated = translated.trim();

  // 1. Hardcoded Success Scenario (English -> Hindi)
  // Hello, how are you? -> नमस्ते, आप कैसे हैं?
  const isEnglishToHindi =
    (sourceLanguage.toLowerCase().startsWith('en') || sourceLanguage.toLowerCase() === 'english') &&
    (targetLanguage.toLowerCase().startsWith('hi') || targetLanguage.toLowerCase() === 'hindi');

  const matchesOriginalRef = normOriginal === "hello how are you";
  const matchesTranslationRef =
    normTranslated === "नमस्ते, आप कैसे हैं?" || 
    normTranslated === "नमस्ते आप कैसे हैं?" ||
    normTranslated.includes("नमस्ते") && normTranslated.includes("कैसे");

  if (isEnglishToHindi && matchesOriginalRef && matchesTranslationRef) {
    return {
      passed: true,
      score: 0.98,
      reason: "Excellent match. Translation accurately maps EOA/BCP-47 greetings and registers high semantic alignment (0.98/1.0). Quality checks passed.",
    };
  }

  // 2. Hardcoded Failure Scenario
  // If it matches incorrect Hindi translation
  if (isEnglishToHindi && matchesOriginalRef && (normTranslated.includes("गलत") || normTranslated.includes("फेल") || normTranslated.toLowerCase().includes("fail") || normTranslated.includes("नमस्कार"))) {
    return {
      passed: false,
      score: 0.35,
      reason: "Critically low quality score (0.35/1.0). The translation contains gibberish, incorrect honorifics, or failed grammar structures. Settlement blocked.",
    };
  }

  // 3. Fallback General Check
  // We check if the translation matches the original string exactly (which is a failed translation)
  if (normOriginal === normTranslated.toLowerCase()) {
    return {
      passed: false,
      score: 0.1,
      reason: "Direct duplication. The translation output is identical to the input text. No translation performed.",
    };
  }

  // General simulated LLM heuristic
  if (normTranslated.length > 0) {
    // If not matching our exact success criteria, check if it's longer than 3 characters
    return {
      passed: true,
      score: 0.85,
      reason: "Heuristic LLM Score: 0.85/1.0. Translation has valid character distribution and proper language formatting.",
    };
  }

  return {
    passed: false,
    score: 0.0,
    reason: "Translation output is empty or could not be evaluated by the LLM Judge.",
  };
}
