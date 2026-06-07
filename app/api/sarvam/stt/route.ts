import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.SARVAM_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ mock: true });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const languageCode = formData.get('language_code') || 'hi-IN';

    if (!file) {
      return NextResponse.json({ error: 'Missing audio file' }, { status: 400 });
    }

    // Call real Sarvam STT API
    const sarvamFormData = new FormData();
    sarvamFormData.append('file', file);
    sarvamFormData.append('model', 'saaras:v3');
    sarvamFormData.append('language_code', languageCode.toString());

    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey,
      },
      body: sarvamFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sarvam STT API error: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json({
      transcript: data.transcript,
      language_code: languageCode
    });

  } catch (error: any) {
    console.error('STT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
