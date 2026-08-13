export type Macro = {
  name: string;
  trigger: string;
  url: string;
  color: string;
  icon: string;
  key?: string;
};

export const macros: Macro[] = [
  { name: 'GitHub', trigger: 'gh', url: 'https://github.com', color: '#24292f', icon: 'github', key: 'g' },
  { name: 'YouTube', trigger: 'yt', url: 'https://youtube.com', color: '#ff0033', icon: 'youtube', key: 'y' },
  { name: 'ChatGPT', trigger: 'ai', url: 'https://chatgpt.com', color: '#10a37f', icon: 'spark', key: 'a' },
  { name: 'Figma', trigger: 'fig', url: 'https://figma.com', color: '#f24e1e', icon: 'figma', key: 'f' },
  { name: 'Notion', trigger: 'no', url: 'https://notion.so', color: '#111111', icon: 'notion', key: 'n' },
  { name: 'Gmail', trigger: 'mail', url: 'https://mail.google.com', color: '#ea4335', icon: 'mail', key: 'm' },
  { name: 'Spotify', trigger: 'sp', url: 'https://open.spotify.com', color: '#1db954', icon: 'music', key: 's' },
  { name: 'Reddit', trigger: 'r', url: 'https://reddit.com', color: '#ff4500', icon: 'reddit', key: 'r' },
];

export const commands = [
  { trigger: '?', template: '{base}/search?q={query}' },
  { trigger: '/', template: '{base}/{query}' },
];

export const engines = [
  { trigger: 'g', name: 'Google', url: 'https://www.google.com/search?q={query}' },
  { trigger: 'yt', name: 'YouTube', url: 'https://www.youtube.com/results?search_query={query}' },
  { trigger: 'gh', name: 'GitHub', url: 'https://github.com/search?q={query}' },
  { trigger: 'so', name: 'Stack Overflow', url: 'https://stackoverflow.com/search?q={query}' },
];
