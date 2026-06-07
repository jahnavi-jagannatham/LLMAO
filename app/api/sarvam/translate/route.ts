import { NextResponse } from 'next/server';

const PRELOADED_TRANSLATIONS: { [langCode: string]: { [questionId: string]: string } } = {
  'hi-IN': {
    'full_name': 'आपका पूरा नाम क्या है?',
    'college_name': 'आप किस कॉलेज या विश्वविद्यालय में पढ़ते हैं?',
    'degree': 'आप कौन सी डिग्री या विषय की पढ़ाई कर रहे हैं?',
    'cgpa': 'आपका वर्तमान सीजीपीए क्या है?',
    'projects': 'क्या आप हाल ही में बनाए गए किसी प्रोजेक्ट के बारे में बता सकते हैं?',
    'career_goals': 'ग्रेजुएशन के बाद आपके करियर के लक्ष्य क्या हैं?',
    'autofill_prompt': 'मैंने आपके प्रोफ़ाइल से "{value}" पाया है। क्या आप चाहते हैं कि मैं इसका उपयोग करूँ?',
    'finish_prompt': 'जानकारी दर्ज करने के लिए धन्यवाद। कृपया विवरण की समीक्षा करें और सबमिट करें।',
    'missing_prompt': 'काम खत्म करने से पहले मुझे अभी भी आपके "{field}" की आवश्यकता है।'
  },
  'te-IN': {
    'full_name': 'మీ పూర్తి పేరు ఏమిటి?',
    'college_name': 'మీరు ఏ కాలేజీ లేదా విశ్వవిద్యాలయంలో చదువుతున్నారు?',
    'degree': 'మీరు ఏ డిగ్రీ లేదా మేజర్ చదువుతున్నారు?',
    'cgpa': 'మీ ప్రస్తుత సిజిపిఎ ఎంత?',
    'projects': 'మీరు ఇటీవల చేసిన ఒక ప్రాజెక్ట్ గురించి చెప్పగలరా?',
    'career_goals': 'గ్రాడ్యుయేషన్ తర్వాత మీ కెరీర్ లక్ష్యాలు ఏమిటి?',
    'autofill_prompt': 'నేను మీ ప్రొఫైల్ నుండి "{value}" కనుగొన్నాను. నేను దానిని ఉపయోగించాలా?',
    'finish_prompt': 'వివరాలు అందించినందుకు ధన్యవాదాలు. దయచేసి సమీక్షించి, సబ్మిట్ చేయండి.',
    'missing_prompt': 'మేము పూర్తి చేయడానికి ముందు నాకు ఇంకా మీ "{field}" అవసరం.'
  },
  'kn-IN': {
    'full_name': 'ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು ಏನು?',
    'college_name': 'ನೀವು ಯಾವ ಕಾಲೇಜು ಅಥವಾ ವಿಶ್ವವಿದ್ಯಾಲಯದಲ್ಲಿ ಓದುತ್ತಿದ್ದೀರಿ?',
    'degree': 'ನೀವು ಯಾವ ಪದವಿ ಅಥವಾ ಕೋರ್ಸ್ ಮಾಡುತ್ತಿದ್ದೀರಿ?',
    'cgpa': 'ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸಿಜಿಪಿಎ ಎಷ್ಟು?',
    'projects': 'ನೀವು ಇತ್ತೀಚೆಗೆ ಮಾಡಿದ ಒಂದು ಪ್ರಾಜೆಕ್ಟ್ ಬಗ್ಗೆ ವಿವರಿಸಬಹುದೇ?',
    'career_goals': 'ಪದವಿ ಮುಗಿದ ನಂತರ ನಿಮ್ಮ ವೃತ್ತಿಜೀವನದ ಗುರಿಗಳು ಏನು?',
    'autofill_prompt': 'ನಾನು ನಿಮ್ಮ ಪ್ರೊಫೈಲ್‌ನಿಂದ "{value}" ಅನ್ನು ಕಂಡುಕೊಂಡಿದ್ದೇನೆ. ನಾನು ಅದನ್ನು ಬಳಸಬೇಕೇ?',
    'finish_prompt': 'ವಿವರಗಳನ್ನು ನೀಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಸಬ್ಮಿಟ್ ಮಾಡಿ.',
    'missing_prompt': 'ನಾವು ಮುಗಿಸುವ ಮೊದಲು ನನಗೆ ಇನ್ನೂ ನಿಮ್ಮ "{field}" ಅಗತ್ಯವಿದೆ.'
  },
  'ta-IN': {
    'full_name': 'உங்கள் முழு பெயர் என்ன?',
    'college_name': 'நீங்கள் எந்த கல்லூரி அல்லது பல்கலைக்கழகத்தில் படிக்கிறீர்கள்?',
    'degree': 'நீங்கள் என்ன பட்டம் அல்லது பாடம் படிக்கிறீர்கள்?',
    'cgpa': 'உங்கள் தற்போதைய சிஜிபிஏ என்ன?',
    'projects': 'நீங்கள் சமீபத்தில் செய்த ஒரு திட்டத்தைப் பற்றி விவரிக்க முடியுமா?',
    'career_goals': 'பட்டம் பெற்ற பிறகு உங்கள் தொழில் இலக்குகள் என்ன?',
    'autofill_prompt': 'உங்கள் சுயவிவரத்திலிருந்து "{value}" ஐக் கண்டறிந்தேன். அதை நான் பயன்படுத்தலாமா?',
    'finish_prompt': 'விவரங்களை வழங்கியமைக்கு நன்றி. தயவுசெய்து சரிபார்த்து சமர்ப்பிக்கவும்.',
    'missing_prompt': 'நாங்கள் முடிப்பதற்கு முன் எனக்கு இன்னும் உங்கள் "{field}" தேவை.'
  },
  'ml-IN': {
    'full_name': 'നിങ്ങളുടെ മുഴുവൻ പേര് എന്താണ്?',
    'college_name': 'നിങ്ങൾ ഏത് കോളേജിലാണ് അല്ലെങ്കിൽ യൂണിവേഴ്സിറ്റിയിലാണ് പഠിക്കുന്നത്?',
    'degree': 'നിങ്ങൾ ഏത് ബിരുദമാണ് അല്ലെങ്കിൽ കോഴ്സാണ് പഠിക്കുന്നത്?',
    'cgpa': 'നിങ്ങളുടെ ഇപ്പോഴത്തെ സിജിപിഎ എത്രയാണ്?',
    'projects': 'നിങ്ങൾ അടുത്തിടെ ചെയ്ത ഒരു പ്രോജക്റ്റിനെക്കുറിച്ച് വിവരിക്കാമോ?',
    'career_goals': 'ബിരുദ പഠനത്തിന് ശേഷം നിങ്ങളുടെ കരിയർ ലക്ഷ്യങ്ങൾ എന്തൊക്കെയാണ്?',
    'autofill_prompt': 'ഞാൻ നിങ്ങളുടെ പ്രൊഫൈലിൽ നിന്ന് "{value}" കണ്ടെത്തി. ഞാൻ അത് ഉപയോഗിക്കണോ?',
    'finish_prompt': 'വിവരങ്ങൾ നൽകിയതിന് നന്ദി. ദയവായി അവലോകനം ചെയ്ത് സമർപ്പിക്കുക.',
    'missing_prompt': 'തീർക്കുന്നതിന് മുൻപ് എനിക്ക് നിങ്ങളുടെ "{field}" ആവശ്യമുണ്ട്.'
  }
};

export async function POST(request: Request) {
  try {
    const { input, target_language_code, source_language_code, questionId } = await request.json();

    if (!input || !target_language_code) {
      return NextResponse.json({ error: 'Missing input or target_language_code' }, { status: 400 });
    }

    // Check for local preloaded translation
    if (target_language_code === 'en-IN' || target_language_code === 'en') {
      return NextResponse.json({
        translated_text: input,
        source_language_code: source_language_code || 'en'
      });
    }

    if (questionId && PRELOADED_TRANSLATIONS[target_language_code]?.[questionId]) {
      return NextResponse.json({
        translated_text: PRELOADED_TRANSLATIONS[target_language_code][questionId],
        source_language_code: 'en-IN'
      });
    }

    const apiKey = process.env.SARVAM_API_KEY;

    if (!apiKey) {
      // Return local preloaded dictionary translation or default fallback
      const localLangDict = PRELOADED_TRANSLATIONS[target_language_code];
      if (localLangDict) {
        // Try finding matching text value
        const foundKey = Object.keys(localLangDict).find(
          (k) => k.toLowerCase().replace('_', ' ') === input.toLowerCase()
        );
        if (foundKey) {
          return NextResponse.json({
            translated_text: localLangDict[foundKey],
            source_language_code: 'en-IN'
          });
        }
      }
      
      // If not in dictionary, return input as fallback
      return NextResponse.json({
        translated_text: input,
        source_language_code: source_language_code || 'en-IN',
        mock: true
      });
    }

    // Call real Sarvam Translate API
    const response = await fetch('https://api.sarvam.ai/translate', {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input,
        source_language_code: source_language_code || 'auto',
        target_language_code
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sarvam Translation API error: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json({
      translated_text: data.translated_text,
      source_language_code: data.source_language_code
    });

  } catch (error: any) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
