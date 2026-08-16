export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, apiKey: clientKey } = req.body;

    // Prioritaskan API Key dari client (BYOK), jika kosong pakai Env Vercel
    const finalApiKey = clientKey || process.env.GEMINI_API_KEY;

    if (!finalApiKey) {
      return res.status(401).json({ error: 'API Key Google Gemini tidak ditemukan di server maupun client.' });
    }

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt tidak boleh kosong.' });
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${finalApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return res.status(geminiRes.status).json({ error: `Gemini API Error: ${errText}` });
    }

    // Setup SSE headers to stream back to client
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = geminiRes.body?.getReader();
    if (!reader) {
      return res.status(500).json({ error: 'Failed to get stream reader from Gemini.' });
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // Parse JSON objects manually from the chunk
      let openBraces = 0;
      let startIdx = -1;
      
      for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === '{') {
          if (openBraces === 0) startIdx = i;
          openBraces++;
        } else if (buffer[i] === '}') {
          openBraces--;
          if (openBraces === 0 && startIdx !== -1) {
            const candidateStr = buffer.substring(startIdx, i + 1);
            try {
              const json = JSON.parse(candidateStr);
              const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
            buffer = buffer.substring(i + 1);
            i = -1;
            startIdx = -1;
          }
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
    
  } catch (error) {
    console.error('API Chat Error:', error);
    res.status(500).json({ error: 'Internal Server Error in AI Proxy' });
  }
}
