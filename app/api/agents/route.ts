import { NextResponse } from 'next/server';

interface Question {
  id: string;
  type: string;
  label: string;
  required: boolean;
}

// Pre-translated agent utterances to support zero-key demo
const TRANSLATED_PROMPTS: { [lang: string]: { [key: string]: string } } = {
  'English': {
    'welcome': 'Hello! I am your AI Interview Agent. Let\'s get started. What is your full name?',
    'autofill_detect': 'I detected CHRIST University and Computer Science in your Monad profile. Should I use them?',
    'cgpa_ask': 'Great! What is your current CGPA?',
    'projects_ask': 'Nice. Tell me about a recent project you have built.',
    'career_ask': 'Got it. Finally, what are your career goals after graduation?',
    'finish': 'Awesome! All required questions are answered. Please review and submit your application.',
    'missing': 'I still need your {field} before we finish.',
  },
  'Hindi': {
    'welcome': 'नमस्ते! मैं आपका एआई इंटरव्यू एजेंट हूं। चलिए शुरू करते हैं। आपका पूरा नाम क्या है?',
    'autofill_detect': 'मुझे आपके मोनाड प्रोफ़ाइल में क्राइस्ट यूनिवर्सिटी और कंप्यूटर साइंस मिला है। क्या मुझे उनका उपयोग करना चाहिए?',
    'cgpa_ask': 'बहुत बढ़िया! आपका वर्तमान सीजीपीए क्या है?',
    'projects_ask': 'अच्छा। मुझे हाल ही में आपके द्वारा बनाए गए किसी प्रोजेक्ट के बारे में बताएं।',
    'career_ask': 'समझ गया। अंत में, ग्रेजुएशन के बाद आपके करियर के लक्ष्य क्या हैं?',
    'finish': 'बहुत बढ़िया! सभी आवश्यक प्रश्नों के उत्तर मिल गए हैं। कृपया समीक्षा करें और अपना आवेदन सबमिट करें।',
    'missing': 'मुझे काम खत्म करने से पहले आपके {field} की आवश्यकता है।',
  },
  'Telugu': {
    'welcome': 'నమస్తే! నేను మీ AI ఇంటర్వ్యూ ఏజెంట్. ప్రారంభిద్దాం. మీ పూర్తి పేరు ఏమిటి?',
    'autofill_detect': 'నేను మీ మోనాడ్ ప్రొఫైల్‌లో క్రిస్ట్ యూనివర్సిటీ మరియు కంప్యూటర్ సైన్స్ కనుగొన్నాను. నేను వాటిని ఉపయోగించాలా?',
    'cgpa_ask': 'చాలా బాగుంది! మీ ప్రస్తుత సిజిపిఎ ఎంత?',
    'projects_ask': 'మంచిది. మీరు ఇటీవల నిర్మించిన ప్రాజెక్ట్ గురించి నాకు చెప్పండి.',
    'career_ask': 'అర్థమైంది. చివరిగా, గ్రాడ్యుయేషన్ తర్వాత మీ కెరీర్ లక్ష్యాలు ఏమిటి?',
    'finish': 'అద్భుతం! అన్ని అవసరమైన ప్రశ్నలకు సమాధానాలు లభించాయి. దయచేసి సమీక్షించి, మీ దరఖాస్తును సమర్పించండి.',
    'missing': 'మేము పూర్తి చేయడానికి ముందు నాకు ఇంకా మీ {field} అవసరం.',
  },
  'Kannada': {
    'welcome': 'ನಮಸ್ತೆ! ನಾನು ನಿಮ್ಮ AI ಸಂದರ್ಶನ ಏಜೆಂಟ್. ಪ್ರಾರಂಭಿಸೋಣ. ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು ಏನು?',
    'autofill_detect': 'ನಿಮ್ಮ ಮೊನಾಡ್ ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ನಾನು ಕ್ರೈಸ್ಟ್ ಯೂನಿವರ್ಸಿಟಿ ಮತ್ತು ಕಂಪ್ಯೂಟರ್ ಸೈನ್ಸ್ ಅನ್ನು ಪತ್ತೆ ಮಾಡಿದ್ದೇನೆ. ನಾನು ಅವುಗಳನ್ನು ಬಳಸಬೇಕೇ?',
    'cgpa_ask': 'ಉತ್ತಮ! ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸಿಜಿಪಿಎ ಎಷ್ಟು?',
    'projects_ask': 'ಚೆನ್ನಾಗಿದೆ. ನೀವು ಇತ್ತೀಚೆಗೆ ನಿರ್ಮಿಸಿದ ಯೋಜನೆಯ ಬಗ್ಗೆ ನನಗೆ ತಿಳಿಸಿ.',
    'career_ask': 'ತಿಳಿಯಿತು. ಕೊನೆಯದಾಗಿ, ಪದವಿ ಮುಗಿದ ನಂತರ ನಿಮ್ಮ ವೃತ್ತಿಜೀವನದ ಗುರಿಗಳು ಏನು?',
    'finish': 'ಅದ್ಭುತ! ಎಲ್ಲಾ ಅಗತ್ಯ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ನಿಮ್ಮ ಅರ್ಜಿಯನ್ನು ಸಲ್ಲಿಸಿ.',
    'missing': 'ನಾವು ಮುಗಿಸುವ ಮೊದಲು ನನಗೆ ಇನ್ನೂ ನಿಮ್ಮ {field} ಅಗತ್ಯವಿದೆ.',
  },
  'Tamil': {
    'welcome': 'வணக்கம்! நான் உங்கள் AI நேர்காணல் முகவர். ஆரம்பிக்கலாம். உங்கள் முழு பெயர் என்ன?',
    'autofill_detect': 'உங்கள் மோனாட் சுயவிவரத்தில் கிறிஸ்ட் பல்கலைக்கழகம் மற்றும் கணினி அறிவியலைக் கண்டறிந்துள்ளேன். அவற்றை நான் பயன்படுத்தலாமா?',
    'cgpa_ask': 'அற்புதம்! உங்கள் தற்போதைய சிஜிபிஏ என்ன?',
    'projects_ask': 'நல்லது. நீங்கள் சமீபத்தில் உருவாக்கிய ஒரு திட்டத்தைப் பற்றி எனக்குச் சொல்லுங்கள்.',
    'career_ask': 'புரிந்தது. இறுதியாக, பட்டம் பெற்ற பிறகு உங்கள் தொழில் இலக்குகள் என்ன?',
    'finish': 'அருமை! தேவையான அனைத்து கேள்விகளுக்கும் பதிலளிக்கப்பட்டுள்ளன. தயவுசெய்து சரிபார்த்து உங்கள் விண்ணப்பத்தை சமர்ப்பிக்கவும்.',
    'missing': 'நாங்கள் முடிப்பதற்கு முன் எனக்கு இன்னும் உங்கள் {field} தேவை.',
  },
  'Malayalam': {
    'welcome': 'ഹലോ! ഞാൻ നിങ്ങളുടെ AI ഇന്റർവ്യൂ ഏജന്റാണ്. നമുക്ക് ആരംഭിക്കാം. നിങ്ങളുടെ മുഴുവൻ പേര് എന്താണ്?',
    'autofill_detect': 'നിങ്ങളുടെ മോണാഡ് പ്രൊഫൈലിൽ ക്രിസ്റ്റ് യൂണിവേഴ്സിറ്റിയും കമ്പ്യൂട്ടർ സയൻസും ഞാൻ കണ്ടെത്തിയിട്ടുണ്ട്. ഞാൻ അവ ഉപയോഗിക്കണോ?',
    'cgpa_ask': 'വളരെ നല്ലത്! നിങ്ങളുടെ ഇപ്പോഴത്തെ സിജിപിഎ എത്രയാണ്?',
    'projects_ask': 'നല്ലത്. നിങ്ങൾ അടുത്തിടെ ചെയ്ത ഒരു പ്രോജക്റ്റിനെക്കുറിച്ച് എന്നോട് പറയുക.',
    'career_ask': 'മനസ്സിലായി. അവസാനമായി, ബിരുദ പഠനത്തിന് ശേഷം നിങ്ങളുടെ കരിയർ ലക്ഷ്യങ്ങൾ എന്തൊക്കെയാണ്?',
    'finish': 'അതിശയകരം! ആവശ്യമായ എല്ലാ ചോദ്യങ്ങൾക്കും മറുപടി ലഭിച്ചു. ദയവായി അവലോകനം ചെയ്ത് നിങ്ങളുടെ അപേക്ഷ സമർപ്പിക്കുക.',
    'missing': 'തീർക്കുന്നതിന് മുൻപ് എനിക്ക് നിങ്ങളുടെ {field} ആവശ്യമുണ്ട്.',
  }
};

// Simple rule-based extraction for Scholarship Form fields
function ruleBasedExtraction(questionId: string, text: string): any {
  const cleanText = text.trim();
  if (questionId === 'cgpa') {
    // Look for decimals or integers
    const numMatch = cleanText.match(/\b\d+(\.\d+)?\b/);
    if (numMatch) {
      return parseFloat(numMatch[0]);
    }
    // Handle word digits: e.g. "eight point seven"
    const textLower = cleanText.toLowerCase();
    const wordNumbers: { [key: string]: number } = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'zero': 0,
      'ten': 10
    };
    const words = textLower.split(' ');
    let parsedVal = '';
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (wordNumbers[w] !== undefined) {
        parsedVal += wordNumbers[w].toString();
      } else if (w === 'point' || w === 'dot' || w === '.') {
        parsedVal += '.';
      } else if (w.match(/^\d+$/)) {
        parsedVal += w;
      }
    }
    const parsedNum = parseFloat(parsedVal);
    if (!isNaN(parsedNum)) return parsedNum;
    return 8.5; // default fallback
  }

  // General cleanups for textual names / colleges
  let extracted = cleanText;
  const prefixes = [
    /^my name is\s+/i,
    /^i study in\s+/i,
    /^i study at\s+/i,
    /^i am studying\s+/i,
    /^it's\s+/i,
    /^its\s+/i,
    /^i am\s+/i,
    /^i'm\s+/i,
    /^my cgpa is\s+/i,
    /^my college is\s+/i,
    /^college name is\s+/i,
  ];

  for (const prefix of prefixes) {
    if (prefix.test(extracted)) {
      extracted = extracted.replace(prefix, '');
    }
  }

  // Capitalize first letters of text for full_name/college_name
  if (questionId === 'full_name' || questionId === 'college_name') {
    extracted = extracted
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return extracted;
}

// Call Gemini API for extraction and next question generation
async function callGemini(prompt: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error: ${errText}`);
    }

    const resData = await response.json();
    const textResult = resData.candidates[0].content.parts[0].text;
    return JSON.parse(textResult);
  } catch (error: any) {
    console.error('Gemini Call Failed:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const {
      formId,
      responses,
      currentQuestionId,
      userAnswer,
      language,
    } = await request.json();

    if (!formId || !responses) {
      return NextResponse.json({ error: 'Missing formId or responses' }, { status: 400 });
    }

    const currentLang = language || 'English';

    // 1. Language Agent: Receive and clean userAnswer
    const cleanedAnswer = userAnswer ? userAnswer.trim() : '';

    // Log the incoming answer
    const logs: any[] = [];
    logs.push({
      agent: 'Language Agent',
      message: `Received answer in ${currentLang}: "${cleanedAnswer}"`,
      status: 'success',
    });

    let extractedValue = cleanedAnswer;
    let newResponses = { ...responses };

    // 2. Response Extraction Agent
    if (currentQuestionId && cleanedAnswer) {
      logs.push({
        agent: 'Extraction Agent',
        message: `Extracting value for field "${currentQuestionId}"...`,
        status: 'active',
      });

      const geminiKey = process.env.GEMINI_API_KEY;
      if (geminiKey) {
        // Use Gemini to extract structured response
        const prompt = `
          You are a Response Extraction Agent.
          Question ID: "${currentQuestionId}"
          User Answer Text: "${cleanedAnswer}"
          
          Extract the structured value corresponding to the field.
          For 'cgpa' or 'number', extract as a float/number.
          For text fields, clean up prefixes like "I am", "My name is", "It's at", etc. and capitalize names appropriately.
          
          Return ONLY a JSON object:
          {
            "extractedValue": <extracted_value>
          }
        `;
        try {
          const result = await callGemini(prompt);
          extractedValue = result.extractedValue;
          logs.push({
            agent: 'Extraction Agent',
            message: `Gemini extracted: ${JSON.stringify(extractedValue)}`,
            status: 'success',
          });
        } catch (e) {
          // Fallback to rules-based
          extractedValue = ruleBasedExtraction(currentQuestionId, cleanedAnswer);
          logs.push({
            agent: 'Extraction Agent',
            message: `Rules-based extracted: ${JSON.stringify(extractedValue)}`,
            status: 'success',
          });
        }
      } else {
        // Rule-based fallback
        extractedValue = ruleBasedExtraction(currentQuestionId, cleanedAnswer);
        logs.push({
          agent: 'Extraction Agent',
          message: `Rules-based extracted: ${JSON.stringify(extractedValue)}`,
          status: 'success',
        });
      }

      newResponses[currentQuestionId] = extractedValue;
    }

    // 3. Form Understanding Agent & Completion Agent:
    // Determine remaining questions and sequence
    const defaultQuestions: Question[] = [
      { id: 'full_name', type: 'text', label: 'Full Name', required: true },
      { id: 'college_name', type: 'text', label: 'College Name', required: true },
      { id: 'degree', type: 'text', label: 'Degree', required: true },
      { id: 'cgpa', type: 'number', label: 'CGPA', required: true },
      { id: 'projects', type: 'long_text', label: 'Projects', required: false },
      { id: 'career_goals', type: 'long_text', label: 'Career Goals', required: true },
    ];

    const requiredQuestions = defaultQuestions.filter(q => q.required);
    const answeredRequired = requiredQuestions.filter(q => {
      const val = newResponses[q.id];
      return val !== undefined && val !== null && val.toString().trim() !== '';
    });
    
    const completionPercentage = Math.round((answeredRequired.length / requiredQuestions.length) * 100);

    logs.push({
      agent: 'Completion Agent',
      message: `Completion percentage is ${completionPercentage}%`,
      status: 'success',
    });

    // Find the next unfilled question
    let nextQuestionId: string | null = null;
    for (const q of defaultQuestions) {
      const val = newResponses[q.id];
      if (val === undefined || val === null || val.toString().trim() === '') {
        nextQuestionId = q.id;
        break;
      }
    }

    // 4. Interview Agent & Language Agent: Formulate natural response
    let nextAgentStatement = '';
    
    logs.push({
      agent: 'Interview Agent',
      message: nextQuestionId 
        ? `Determined next question field: "${nextQuestionId}"` 
        : `All fields complete! Triggering final submission instructions.`,
      status: 'success',
    });

    // Translate/Synthesize statement
    const promptDict = TRANSLATED_PROMPTS[currentLang] || TRANSLATED_PROMPTS['English'];

    if (!nextQuestionId) {
      nextAgentStatement = promptDict['finish'];
    } else {
      if (nextQuestionId === 'cgpa') {
        nextAgentStatement = promptDict['cgpa_ask'];
      } else if (nextQuestionId === 'projects') {
        nextAgentStatement = promptDict['projects_ask'];
      } else if (nextQuestionId === 'career_goals') {
        nextAgentStatement = promptDict['career_ask'];
      } else if (nextQuestionId === 'full_name') {
        nextAgentStatement = promptDict['welcome'];
      } else {
        // Fallback or translate custom field label
        const rawPrompt = `What is your ${nextQuestionId.replace('_', ' ')}?`;
        
        const geminiKey = process.env.GEMINI_API_KEY;
        if (geminiKey && currentLang !== 'English') {
          try {
            const translatePrompt = `
              Translate this question to ${currentLang}:
              "${rawPrompt}"
              
              Return ONLY a JSON object:
              {
                "translated": "..."
              }
            `;
            const transResult = await callGemini(translatePrompt);
            nextAgentStatement = transResult.translated;
          } catch (e) {
            nextAgentStatement = rawPrompt;
          }
        } else {
          nextAgentStatement = rawPrompt;
        }
      }
    }

    logs.push({
      agent: 'Language Agent',
      message: `Formulated agent prompt in ${currentLang}: "${nextAgentStatement}"`,
      status: 'success',
    });

    return NextResponse.json({
      responses: newResponses,
      nextQuestionId,
      nextQuestionText: nextAgentStatement,
      completionPercentage,
      logs,
    });

  } catch (error: any) {
    console.error('Agent Orchestrator error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
