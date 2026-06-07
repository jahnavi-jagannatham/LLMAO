const fs = require('fs');
const path = require('path');

const apiKey = "sk_2d0pn82h_NDa7HItrMeFCPX8NMhZcAaTj"; // Loaded from .env

async function test() {
  console.log('Testing Sarvam TTS...');
  try {
    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: 'ಕನ್ನಡದಲ್ಲಿ ಪ್ರಶ್ನೆಗಳು',
        speaker: 'meera',
        target_language_code: 'kn-IN',
        pitch: 0,
        pace: 1.0,
        loudness: 0
      })
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text.substring(0, 500));
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
