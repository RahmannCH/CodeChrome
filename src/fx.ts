let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
};

export const playClick = (profile: 'off' | 'blue' | 'brown', volume = 0.28) => {
  if (profile === 'off' || volume <= 0) return;
  const ctx = getCtx();
  if (ctx.state === 'suspended') void ctx.resume();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = 'square';
  osc.frequency.setValueAtTime(profile === 'blue' ? 2100 + Math.random() * 400 : 420 + Math.random() * 80, now);
  filter.type = 'highpass';
  filter.frequency.value = profile === 'blue' ? 1200 : 180;
  gain.gain.setValueAtTime(volume * (profile === 'blue' ? 0.08 : 0.12), now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (profile === 'blue' ? 0.045 : 0.07));
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.08);
};

export const startMatrix = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => undefined;
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  const glyphs = '01アイウエオカキクケコ01CODECHROME';
  const font = 14;
  let cols = Math.floor(canvas.width / font);
  let drops = Array.from({ length: cols }, () => Math.random() * canvas.height);
  const onResize = () => {
    resize();
    cols = Math.floor(canvas.width / font);
    drops = Array.from({ length: cols }, () => Math.random() * canvas.height);
  };
  window.addEventListener('resize', onResize);
  let frame = 0;
  const tick = () => {
    ctx.fillStyle = 'rgba(3, 3, 4, 0.12)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#34d399';
    ctx.font = `${font}px JetBrains Mono, monospace`;
    drops.forEach((y, i) => {
      const ch = glyphs[Math.floor(Math.random() * glyphs.length)];
      ctx.fillText(ch, i * font, y);
      drops[i] = y > canvas.height && Math.random() > 0.975 ? 0 : y + font;
    });
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', onResize);
  };
};

export type AiProvider = 'gemini' | 'openai';

export const streamAi = async (
  prompt: string,
  provider: AiProvider,
  apiKey: string,
  onChunk: (text: string) => void,
) => {
  // First, try calling our local/Vercel serverless proxy endpoint
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, apiKey, provider }),
    });

    if (response.ok && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine.startsWith('data: ')) continue;
          const dataStr = cleanLine.substring(6);
          if (dataStr === '[DONE]') return;

          try {
            const json = JSON.parse(dataStr);
            if (json.text) onChunk(json.text);
          } catch {
            // Buffer chunk incomplete, continue
          }
        }
      }
      return;
    }
  } catch {
    // If local proxy fails (e.g. static extension mode without Vercel server), fallback to direct Google/OpenAI SDK REST fetch!
  }

  // Direct Browser Fetch Fallback Mode
  if (!apiKey.trim()) {
    throw new Error(`API key kosong! Masukkan API Key ${provider === 'gemini' ? 'Google AI Studio' : 'OpenAI'} Anda di Settings → AI Assistant.`);
  }

  if (provider === 'gemini') {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google API Error (${res.status}): ${errText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('Response body stream tidak dapat dibaca.');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
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
              if (text) onChunk(text);
            } catch {
              // Ignore incomplete JSON
            }
            buffer = buffer.substring(i + 1);
            i = -1;
            startIdx = -1;
          }
        }
      }
    }
    return;
  }

  // Direct OpenAI Fallback
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      stream: true
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API Error (${res.status}): ${errText}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('Response body stream tidak tersedia.');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine.startsWith('data: ')) continue;
      const dataStr = cleanLine.substring(6);
      if (dataStr === '[DONE]') return;

      try {
        const json = JSON.parse(dataStr);
        const text = json?.choices?.[0]?.delta?.content;
        if (text) onChunk(text);
      } catch {
        // Ignore incomplete JSON
      }
    }
  }
};
