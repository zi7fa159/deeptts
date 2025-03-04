export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Only GET requests are allowed' });
  }

  const { text, voice_id = 'emily', sample_rate = 24000, speed = 1.0, format = 'mp3' } = req.query;

  if (!text) {
    return res.status(400).json({ success: false, message: 'Text is required' });
  }

  if (!process.env.WAVES_API_KEY) {
    return res.status(500).json({ success: false, message: 'WAVES_API_KEY is not set' });
  }

  const requestBody = {
    text,
    voice_id,
    sample_rate: parseInt(sample_rate),
    speed: parseFloat(speed),
    format, // Request MP3 format
  };

  try {
    const response = await fetch('https://waves-api.smallest.ai/api/v1/lightning/get_speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WAVES_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Check for errors
    const contentType = response.headers.get('content-type');
    if (!response.ok || !contentType.includes('audio/mpeg')) {
      const errorData = await response.json();
      console.error('Waves API Error:', errorData);
      return res.status(400).json({ success: false, message: errorData.message || 'Failed to generate speech' });
    }

    // Set response headers for MP3
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="speech.mp3"');

    // Stream MP3 response properly
    const audioStream = await response.body;
    audioStream.pipe(res);
  } catch (error) {
    console.error('Fetch Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
