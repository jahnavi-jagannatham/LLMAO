import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text, target_language_code, speaker } = await request.json();

    if (!text || !target_language_code) {
      return NextResponse.json({ error: 'Missing text or target_language_code' }, { status: 400 });
    }

    const apiKey = process.env.SARVAM_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ mock: true });
    }

    // Call real Sarvam TTS API
    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        speaker: speaker || 'vidya',
        target_language_code,
        pitch: 0,
        pace: 1.0,
        loudness: 1.2
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sarvam TTS API error: ${errorText}`);
    }

    const data = await response.json();
    
    // Check if data has audios array
    if (data.audios && data.audios.length > 0) {
      return NextResponse.json({
        audio: data.audios[0],
        request_id: data.request_id
      });
    } else {
      throw new Error('No audio returned from Sarvam API');
    }

  } catch (error: any) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
