export type Macro = {
  name: string;
  trigger: string;
  url: string;
  color: string;
  icon: string;
  iconUrl?: string; // Kept for type compatibility, but unused in rendering
  key?: string;
};

export const macros: Macro[] = [
  { name: 'Google', trigger: 'g', url: 'https://google.com', color: '#4285F4', icon: 'google', key: '1' },
  { name: 'YouTube', trigger: 'yt', url: 'https://youtube.com', color: '#FF0000', icon: 'youtube', key: '2' },
  { name: 'WhatsApp', trigger: 'wa', url: 'https://web.whatsapp.com', color: '#25D366', icon: 'whatsapp', key: '3' },
  { name: 'Drive', trigger: 'drive', url: 'https://drive.google.com', color: '#0F9D58', icon: 'drive', key: '4' },
  { name: 'GitHub', trigger: 'gh', url: 'https://github.com', color: '#181717', icon: 'github', key: '5' },
  { name: 'Gemini', trigger: 'gemini', url: 'https://gemini.google.com', color: '#1C69FF', icon: 'gemini', key: '6' },
  { name: 'ChatGPT', trigger: 'ai', url: 'https://chatgpt.com', color: '#10A37F', icon: 'chatgpt', key: '7' },
  { name: '9Router', trigger: '9r', url: 'http://localhost:20128/dashboard', color: '#6366F1', icon: 'router', key: '8' },
  { name: 'Instagram', trigger: 'ig', url: 'https://instagram.com', color: '#E4405F', icon: 'instagram', key: 'q' },
  { name: 'TikTok', trigger: 'tt', url: 'https://tiktok.com', color: '#000000', icon: 'tiktok', key: 'w' },
  { name: 'Facebook', trigger: 'fb', url: 'https://facebook.com', color: '#1877F2', icon: 'facebook', key: 'e' },
  { name: 'Spotify', trigger: 'sp', url: 'https://open.spotify.com', color: '#1DB954', icon: 'spotify', key: 'r' },
  { name: 'Discord', trigger: 'dc', url: 'https://discord.com/app', color: '#5865F2', icon: 'discord', key: 't' },
  { name: 'Netflix', trigger: 'nf', url: 'https://netflix.com', color: '#E50914', icon: 'netflix', key: 'y' },
  { name: 'Itemku', trigger: 'itemku', url: 'https://itemku.com', color: '#FF7A00', icon: 'itemku', key: 'u' },
];

export const engines = [
  { trigger: 'g', name: 'Google', url: 'https://www.google.com/search?q={query}' },
  { trigger: 'yt', name: 'YouTube', url: 'https://www.youtube.com/results?search_query={query}' },
  { trigger: 'gh', name: 'GitHub', url: 'https://github.com/search?q={query}' },
  { trigger: 'so', name: 'Stack Overflow', url: 'https://stackoverflow.com/search?q={query}' },
];
