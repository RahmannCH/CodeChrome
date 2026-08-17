import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { macros as defaultMacros, engines } from './config';
import type { Macro } from './config';
import { playClick, startMatrix, streamAi, findBrandPreset, fetchSearchSuggestions } from './fx';
import type { AiProvider } from './fx';
import './index.css';

const dC = (cmd: string, args: number[], scale = 1) => `${cmd}${args.map((a) => a * scale).join(',')}`;
const smoothing = 0.1;

const getStages = (size: number) => [
  dC('M', [0.5, 0.5 / size], size) + dC('c', [0, 0, 0, 0, -0.5, 0.5], size) + dC('M', [0.5, 0.5 / size], size) + dC('c', [0, 0, 0, 0, -0.5, -0.5], size),
  dC('M', [0.5, 0.5 / size], size) + dC('c', [0, smoothing, -0.5, 0.5, -0.5, 0.5], size) + dC('M', [0.5, 0.5 / size], size) + dC('c', [0, -smoothing, -0.5, -0.5, -0.5, -0.5], size),
  dC('M', [0, 0.5]) + dC('c', [0, smoothing * 2, 0, 0.5, 0, 0.5]) + dC('M', [0, 0.5]) + dC('c', [0, -smoothing * 2, 0, -0.5, 0, -0.5]),
  dC('M', [0.5, 0.5 / size], size) + dC('c', [0, 0, 0, 0, -0.5, 0], size) + dC('M', [0.5, 0.5 / size], size) + dC('c', [0, 0, 0, 0, -0.5, 0], size),
  dC('M', [0.5 * 8 / 2, 0.5 / size], size) + dC('c', [0, 0, 0, 0, -0.5 * 8, 0], size) + dC('M', [0.5 * 8 / 2, 0.5 / size], size) + dC('c', [0, 0, 0, 0, -0.5 * 8, 0], size),
];

const getQuickLookStages = (curvature: number) => [
  dC('M', [0, 0]) + dC('L', [0, 1]) + dC('C', [0, 1, 0, 1, 0, 0.5]) + dC('C', [0, 0, 0, 0, 0, 0]) + 'Z',
  dC('M', [0, 0]) + dC('L', [0, 1]) + dC('C', [0, 1 - curvature, 0.46, 1 - curvature, 0.46, 0.5]) + dC('C', [0.46, curvature, 0, curvature, 0, 0]) + 'Z',
  (ratio: number) => dC('M', [0, 0]) + dC('L', [0, 1]) + dC('C', [0, 1 - curvature, ratio * 2, 1 - curvature, ratio * 2, 0.5]) + dC('C', [ratio * 2, curvature, 0, curvature, 0, 0]) + 'Z',
  (ratio: number) => dC('M', [0, 0]) + dC('L', [0, 1]) + dC('C', [ratio * 4, 1, ratio * 2, 1, ratio * 2, 0.5]) + dC('C', [ratio * 2, 0, ratio * 4, 0, ratio * 2, 0]) + 'Z'
];

type Mode = 'default' | 'opened' | 'searching' | 'redirected';
type Launch = { macro: Macro; x: number; y: number };

const APP_SCHEMA_VERSION = '2026-08-codechrome-pages-v8';

function BrandIcon({ macro }: { macro: Macro }) {
  // Always prioritize high-res inline SVGs for built-in apps
  return <AppIcon name={macro.icon} />;
}

function AppIcon({ name }: { name: string }) {
  const iconKey = name.toLowerCase().trim();
  switch (iconKey) {
    case 'google':
      return (
        <svg viewBox="0 0 24 24" shapeRendering="geometricPrecision">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.24a7.19 7.19 0 0 1 0-4.48V6.61H1.29a11.97 11.97 0 0 0 0 10.78l3.99-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"/>
        </svg>
      );
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" shapeRendering="geometricPrecision">
          <path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/>
          <path fill="#FFFFFF" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      );
    case 'whatsapp':
    case 'wa':
      return (
        <svg viewBox="0 0 24 24" shapeRendering="geometricPrecision">
          <path fill="#25D366" d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.94 9.94 0 0 0 1.333 4.993L2 22l5.233-1.237a9.95 9.95 0 0 0 4.779 1.22h.005c5.505 0 9.988-4.478 9.989-9.984A9.956 9.956 0 0 0 12.012 2z"/>
          <path fill="#FFFFFF" d="M17.472 14.382c-.301-.15-1.777-.877-2.052-.976-.276-.1-.476-.15-.677.15-.2.3-.777.976-.952 1.176-.176.2-.351.226-.652.076-.301-.15-1.271-.469-2.422-1.496-.895-.798-1.5-1.784-1.675-2.085-.176-.301-.019-.464.131-.613.136-.135.301-.351.451-.527.15-.175.201-.301.301-.501.1-.2.05-.376-.025-.526-.075-.15-.677-1.631-.928-2.233-.244-.585-.494-.506-.677-.515-.175-.009-.376-.009-.576-.009s-.526.075-.802.376c-.276.3-1.053 1.028-1.053 2.507s1.078 2.908 1.228 3.109c.15.2 2.122 3.24 5.141 4.544.718.31 1.279.495 1.716.634.72.229 1.376.196 1.895.119.578-.086 1.777-.727 2.027-1.428.25-.702.25-1.303.175-1.428-.075-.125-.276-.201-.577-.351z"/>
        </svg>
      );
    case 'drive':
      return (
        <svg viewBox="0 0 87.3 78" shapeRendering="geometricPrecision">
          <path fill="#0066da" d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"/>
          <path fill="#00ac47" d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0-1.2 4.5h27.5z"/>
          <path fill="#ea4335" d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"/>
          <path fill="#00832d" d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"/>
          <path fill="#2684fc" d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"/>
          <path fill="#ffba00" d="m73.4 26.5-25.4-44c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 20.45 35.4 21.9-11.8c.8-1.4 1.2-2.95 1.2-4.5 0-1.54-.4-3.1-1.2-4.5z"/>
        </svg>
      );
    case 'github':
      return (
        <svg viewBox="0 0 24 24" shapeRendering="geometricPrecision">
          <path fill="#FFFFFF" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/>
        </svg>
      );
    case 'gemini':
      return (
        <svg viewBox="0 0 24 24" shapeRendering="geometricPrecision">
          <path fill="url(#geminiGrad)" d="M12 0c1.99 7.25 4.75 10.01 12 12-7.25 1.99-10.01 4.75-12 12-1.99-7.25-4.75-10.01-12-12 7.25-1.99 10.01-4.75 12-12z"/>
          <defs>
            <linearGradient id="geminiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1A73E8" />
              <stop offset="50%" stopColor="#8AB4F8" />
              <stop offset="100%" stopColor="#D9D2FE" />
            </linearGradient>
          </defs>
        </svg>
      );
    case 'chatgpt':
    case 'ai':
    case 'spark':
      return (
        <svg viewBox="0 0 24 24" shapeRendering="geometricPrecision">
          <path fill="#10A37F" d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073z"/>
        </svg>
      );
    case 'router':
    case '9r':
      return (
        <svg viewBox="0 0 24 24" shapeRendering="geometricPrecision">
          <path fill="#6366F1" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      );
    case 'instagram':
    case 'ig':
      return (
        <svg viewBox="0 0 24 24" shapeRendering="geometricPrecision">
          <path fill="url(#instaGrad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
          <defs>
            <radialGradient id="instaGrad" cx="30%" cy="107%" r="135%">
              <stop offset="0%" stopColor="#fdf497" />
              <stop offset="5%" stopColor="#fdf497" />
              <stop offset="45%" stopColor="#fd5949" />
              <stop offset="60%" stopColor="#d6249f" />
              <stop offset="90%" stopColor="#285AEB" />
            </radialGradient>
          </defs>
        </svg>
      );
    case 'tiktok':
    case 'tt':
      return (
        <svg viewBox="0 0 24 24" shapeRendering="geometricPrecision">
          <path fill="#FFFFFF" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/>
        </svg>
      );
    case 'facebook':
    case 'fb':
      return (
        <svg viewBox="0 0 24 24" shapeRendering="geometricPrecision">
          <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      );
    case 'spotify':
    case 'sp':
    case 'music':
      return (
        <svg viewBox="0 0 24 24" shapeRendering="geometricPrecision">
          <path fill="#1DB954" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.66.3.102zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72.96.42 1.5-.3.54-.96.72-1.5.42z"/>
        </svg>
      );
    case 'discord':
    case 'dc':
      return (
        <svg viewBox="0 0 24 24" shapeRendering="geometricPrecision">
          <path fill="#5865F2" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
      );
    case 'netflix':
    case 'nf':
      return (
        <svg viewBox="0 0 24 24" shapeRendering="geometricPrecision">
          <path fill="#E50914" d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.596 2.344.058 4.85.398 4.854.398-2.8-7.924-5.923-16.747-8.487-24zm8.489 0v9.63L18.6 22.951c-.043-7.86-.004-16.554.002-22.95zM5.398 1.05V24c1.873-.225 2.81-.312 4.715-.398v-9.22z"/>
        </svg>
      );
    case 'itemku':
      return (
        <svg viewBox="0 0 24 24" shapeRendering="geometricPrecision">
          <path fill="#FF7A00" d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.236L19.764 8 12 11.764 4.236 8 12 4.236zM4 9.618l7 3.5V20l-7-3.5V9.618zm9 10.382v-6.882l7-3.5V16.5L13 20z"/>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" shapeRendering="geometricPrecision">
          <path fill="#8B5CF6" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      );
  }
}

export default function App() {
  const [mode, setMode] = useState<Mode>('default');
  const [query, setQuery] = useState('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [selIndex, setSelIndex] = useState(-1);
  const [time, setTime] = useState(new Date());
  const [launch, setLaunch] = useState<Launch | null>(null);
  
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'macros' | 'themes' | 'ai' | 'about'>('general');
  
  // AI Panel states
  const [aiOpen, setAiOpen] = useState(false);
  const [aiHistory, setAiHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Matrix canvas ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('codechrome.settings');
    // Force default provider to Gemini to fix OpenAI default issue
    const parsed = saved ? JSON.parse(saved) : null;
    if (parsed && !parsed.aiProvider) {
      parsed.aiProvider = 'gemini';
    }
    return parsed || {
      clockFormat: '24h',
      showSeconds: false,
      soundProfile: 'off' as 'off' | 'blue' | 'brown',
      soundVolume: 0.28,
      themeFx: 'ambient' as 'ambient' | 'matrix' | 'crt',
      aiProvider: 'gemini' as 'gemini' | 'openai',
      aiApiKey: '',
    };
  });
  const [tabTitle, setTabTitle] = useState(() => localStorage.getItem('codechrome.title') || 'CodeChrome');

  useEffect(() => { localStorage.setItem('codechrome.settings', JSON.stringify(settings)); }, [settings]);
  const [macrosList, setMacrosList] = useState<Macro[]>(() => {
    try {
      const savedVersion = localStorage.getItem('codechrome.schema');
      const saved = localStorage.getItem('codechrome.macros');
      if (savedVersion !== APP_SCHEMA_VERSION) {
        localStorage.setItem('codechrome.schema', APP_SCHEMA_VERSION);
        localStorage.setItem('codechrome.macros', JSON.stringify(defaultMacros));
        localStorage.setItem('codechrome.cols', '4');
        localStorage.setItem('codechrome.rows', '2');
        return defaultMacros;
      }
      return saved ? JSON.parse(saved) : defaultMacros;
    } catch {
      return defaultMacros;
    }
  });
  const [gridCols, setGridCols] = useState(() => Number(localStorage.getItem('codechrome.cols')) || 4);
  const [gridRows, setGridRows] = useState(() => Number(localStorage.getItem('codechrome.rows')) || 2);
  const [page, setPage] = useState(0);
  const [pageDir, setPageDir] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

  const svgControls = useAnimationControls();
  const pathControls = useAnimationControls();
  const topControls = useAnimationControls();
  const bottomControls = useAnimationControls();
  const qlPathControls = useAnimationControls();
  const qlTextControls = useAnimationControls();

  const stages = getStages(0.25);
  const qlStages = getQuickLookStages(0.18);
  const pivotX = -0.125;
  const dur = 0.5;
  
  const perPage = gridCols * gridRows;
  const pageCount = Math.ceil(macrosList.length / perPage);
  const currentMacros = macrosList.slice(page * perPage, (page + 1) * perPage);

  const matchedBrand = findBrandPreset(query);
  const activeMacro = macrosList.find(m => query.trim().split(' ')[0] === m.trigger);
  const curColor = matchedBrand ? matchedBrand.color : (activeMacro ? activeMacro.color : '#64748b');
  const badgeText = matchedBrand ? matchedBrand.marqueeText : 'SEARCH';

  useEffect(() => { document.title = tabTitle; localStorage.setItem('codechrome.title', tabTitle); }, [tabTitle]);
  useEffect(() => { localStorage.setItem('codechrome.macros', JSON.stringify(macrosList)); }, [macrosList]);
  useEffect(() => { localStorage.setItem('codechrome.cols', String(gridCols)); }, [gridCols]);
  useEffect(() => { localStorage.setItem('codechrome.rows', String(gridRows)); }, [gridRows]);
  useEffect(() => { setPage(current => Math.min(current, Math.max(0, pageCount - 1))); }, [pageCount]);

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (aiOpen) {
      aiInputRef.current?.focus();
      return;
    }
    if (!showSettings) inputRef.current?.focus();
  }, [mode, showSettings, aiOpen]);

  // Fetch search recommendations real-time when query changes
  useEffect(() => {
    if (!query.trim()) {
      setRecommendations([]);
      return;
    }
    let cancelled = false;
    fetchSearchSuggestions(query, matchedBrand).then(res => {
      if (!cancelled) setRecommendations(res);
    });
    return () => { cancelled = true; };
  }, [query, matchedBrand?.id]);

  // Matrix Rain effect hook
  useEffect(() => {
    if (settings.themeFx === 'matrix' && canvasRef.current) {
      const stop = startMatrix(canvasRef.current);
      return stop;
    }
  }, [settings.themeFx]);

  useEffect(() => {
    const run = async () => {
      if (mode === 'default') {
        qlPathControls.start({ d: qlStages[0] as string, transition: { ease: 'backIn', duration: dur * 0.8 } });
        qlTextControls.start({ x: '-100%', transition: { ease: 'backIn', duration: dur * 0.8 } });
        topControls.start({ y: 80, opacity: 0, transition: { duration: dur * 0.6 } });
        bottomControls.start({ y: -80, opacity: 0, transition: { duration: dur * 0.6 } });
        svgControls.start({ left: '50%', transition: { ease: 'easeInOut', duration: dur } });
        pathControls.start({ x: pivotX, d: stages[3], transition: { ease: 'easeInOut', duration: dur * 0.6 } })
          .then(() => pathControls.start({ d: stages[0], transition: { ease: 'easeInOut', duration: dur * 0.4 } }));
      }
      if (mode === 'opened') {
        svgControls.start({ left: '50%', transition: { ease: 'easeInOut', duration: dur } });
        pathControls.start({ x: pivotX, d: stages[3], transition: { ease: 'easeInOut', duration: dur * 0.5 } })
          .then(() => pathControls.start({ x: 0, d: stages[4], transition: { ease: 'easeInOut', duration: dur * 0.5 } }));
        topControls.start({ y: 0, opacity: 1, transition: { ease: 'backOut', duration: dur, delay: 0.1 } });
        bottomControls.start({ y: 0, opacity: 1, transition: { ease: 'backOut', duration: dur, delay: 0.1 } });
      }
      if (mode === 'searching') {
        svgControls.start({ left: '0%', transition: { ease: 'easeIn', duration: dur * 0.6 } });
        pathControls.start({ x: 0, d: stages[1], transition: { ease: 'linear', duration: dur * 0.6 } })
          .then(() => pathControls.start({ y: 0, d: stages[2], transition: { ease: 'easeOut', duration: dur * 0.4 } }));
        qlPathControls.start({ d: qlStages[1] as string, transition: { ease: 'easeOut', duration: dur, delay: dur * 0.4 } });
        qlTextControls.start({ x: '0%', transition: { ease: 'easeOut', duration: dur, delay: dur * 0.4 } });
      }
      if (mode === 'redirected') {
        const ratio = window.innerWidth / window.innerHeight;
        qlPathControls.start({ d: (qlStages[2] as (r:number)=>string)(ratio), transition: { ease: 'easeInOut', duration: dur } })
          .then(() => qlPathControls.start({ d: (qlStages[3] as (r:number)=>string)(ratio), transition: { ease: 'easeInOut', duration: dur } }));
        qlTextControls.start({ left: '50%', x: '-50%', transition: { ease: 'easeInOut', duration: dur } });
      }
    };
    run();
  }, [mode]);

  const redirect = (url: string) => {
    setMode('redirected');
    setTimeout(() => { window.location.assign(url); }, dur * 1800);
  };

  const askAi = async (promptText: string) => {
    if (!promptText.trim()) return;
    setAiLoading(true);
    setAiError('');
    const userMsg = { role: 'user' as const, text: promptText };
    setAiHistory(prev => [...prev, userMsg]);
    setQuery('');
    
    try {
      let modelReply = '';
      setAiHistory(prev => [...prev, { role: 'model', text: '' }]);
      await streamAi(promptText, settings.aiProvider, settings.aiApiKey, (chunk) => {
        modelReply += chunk;
        setAiHistory(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: 'model', text: modelReply };
          return next;
        });
      });
    } catch (err: any) {
      setAiError(err.message || 'Error processing AI request.');
    } finally {
      setAiLoading(false);
    }
  };

  const parseAndRedirect = (val = query) => {
    const txt = val.trim();
    if (!txt) return;
    if (txt.startsWith('/ai ')) {
      askAi(txt.substring(4));
      return;
    }
    // Direct URL check
    if (txt.startsWith('http://') || txt.startsWith('https://')) {
      redirect(txt);
      return;
    }
    const [head, ...tail] = txt.split(/\s+/);
    const macro = macrosList.find(m => m.trigger === head);
    if (macro) {
      if (!tail.length) redirect(macro.url);
      else redirect(`${macro.url}/search?q=${encodeURIComponent(tail.join(' '))}`);
      return;
    }
    const preset = findBrandPreset(txt);
    if (preset && txt.toLowerCase() === preset.trigger.toLowerCase()) {
      redirect(preset.directUrl);
      return;
    }
    const engine = engines.find(e => e.trigger === head);
    if (engine && tail.length) redirect(engine.url.replace('{query}', encodeURIComponent(tail.join(' '))));
    else redirect(engines[0].url.replace('{query}', encodeURIComponent(txt)));
  };

  const handleInput = (val: string) => {
    // Sound FX on typing
    playClick(settings.soundProfile, settings.soundVolume);

    setQuery(val);
    if (!val.trim()) { setMode('default'); setRecommendations([]); return; }
    
    // Check if user is typing AI command
    if (val.startsWith('/ai ')) {
      setAiOpen(true);
      setMode('searching');
      return;
    }

    if (mode !== 'searching') setMode('searching');
    setSelIndex(-1);
  };

  const lastSpaceTime = useRef(0);
  const handleSpaceTrigger = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ') {
      const now = Date.now();
      if (now - lastSpaceTime.current < 280 && !query.trim()) {
        e.preventDefault();
        setQuery('/ai ');
        setAiOpen(true);
        setMode('searching');
      }
      lastSpaceTime.current = now;
    }
  };

  useEffect(() => {
    const kdown = (e: KeyboardEvent) => {
      if (showSettings) return;
      if (e.key === 'Shift' && mode === 'default') setMode('opened');
      if (e.key === 'Escape') { setQuery(''); setMode('default'); }
      if (mode === 'opened' && e.shiftKey && e.key.length === 1) {
        const m = macrosList.find(x => x.key === e.key.toLowerCase());
        if (m) redirect(m.url);
      }
      if (mode === 'opened') {
        if (e.key === 'ArrowLeft') { e.preventDefault(); setPage(p => { const np = Math.max(0, p - 1); setPageDir(-1); return np; }); }
        if (e.key === 'ArrowRight') { e.preventDefault(); setPage(p => { const np = Math.min(pageCount - 1, p + 1); setPageDir(1); return np; }); }
      }
      if (mode === 'searching') {
        if (e.key === 'Tab') {
          e.preventDefault();
          if (matchedBrand) {
            setQuery(matchedBrand.id);
          } else if (recommendations.length > 0) {
            const target = selIndex >= 0 ? recommendations[selIndex] : recommendations[0];
            if (target && !target.startsWith('http')) setQuery(target);
          }
        }
        if (e.key === 'ArrowDown' && recommendations.length) { 
          e.preventDefault(); 
          setSelIndex(i => Math.min(i + 1, recommendations.length - 1)); 
        }
        if (e.key === 'ArrowUp' && recommendations.length) { 
          e.preventDefault(); 
          setSelIndex(i => Math.max(i - 1, -1)); 
        }
        if (e.key === 'Enter') { 
          e.preventDefault(); 
          if (selIndex >= 0 && recommendations[selIndex]) {
            const chosen = recommendations[selIndex];
            if (chosen.startsWith('http://') || chosen.startsWith('https://')) redirect(chosen);
            else parseAndRedirect(chosen);
          } else if (matchedBrand) {
            redirect(matchedBrand.directUrl);
          } else {
            parseAndRedirect(query); 
          }
        }
      }
    };
    const kup = (e: KeyboardEvent) => { if (!showSettings && e.key === 'Shift' && mode === 'opened') setMode('default'); };
    const rclick = (e: MouseEvent) => {
      if (showSettings) return;
      e.preventDefault();
      setMode(m => m === 'default' ? 'opened' : 'default');
    };
    
    window.addEventListener('keydown', kdown);
    window.addEventListener('keyup', kup);
    window.addEventListener('contextmenu', rclick);
    return () => { window.removeEventListener('keydown', kdown); window.removeEventListener('keyup', kup); window.removeEventListener('contextmenu', rclick); };
  }, [mode, query, selIndex, recommendations, matchedBrand, showSettings, macrosList, pageCount]);

  const updateMacro = (index: number, field: keyof Macro, val: string) => {
    const next = [...macrosList];
    next[index] = { ...next[index], [field]: val };
    setMacrosList(next);
  };

  const addMacro = () => {
    setMacrosList([...macrosList, { name: 'New App', trigger: 'app', url: 'https://example.com', color: '#6366f1', icon: 'router', key: 'x' }]);
  };

  const removeMacro = (index: number) => {
    setMacrosList(macrosList.filter((_, i) => i !== index));
  };

  return (
    <main className={`app ${settings.themeFx === 'crt' ? 'crt-mode' : ''}`} onClick={() => !showSettings && inputRef.current?.focus()}>
      {settings.themeFx === 'matrix' && <canvas ref={canvasRef} className="matrix-canvas" />}
      {settings.themeFx === 'crt' && <div className="crt-overlay" />}
      
      <input ref={inputRef} value={query} onChange={e => handleInput(e.target.value)} onKeyDown={handleSpaceTrigger} className="input-catcher" spellCheck="false" autoComplete="off" autoFocus />

      <div className="corner-trigger-tr" />
      <div className="corner-trigger-br" />

      {/* Floating AI Assistant Button */}
      <motion.button 
        className="floating-ai-btn" 
        title="Tanya AI Assistant"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={(e) => { 
          e.stopPropagation(); 
          setAiOpen(prev => !prev); 
          if (!aiOpen) setMode('searching'); 
          else setMode('default'); 
          playClick(settings.soundProfile, settings.soundVolume);
        }}
      >
        <span className="pulse-ripple" />
        <svg viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 2a1 1 0 0 1 1 1v2.07c2.61.3 4.83 1.83 6.07 3.93H4.93c1.24-2.1 3.46-3.63 6.07-3.93V3a1 1 0 0 1 1-1zM5 8h-1a3 3 0 0 0-3 3v3a3 3 0 0 0 3 3h1.07a7 7 0 0 0 11.86 0H19a3 3 0 0 0 3-3v-3a3 3 0 0 0-3-3h-1.07A7 7 0 0 0 5 8zm4 5a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 9 13zm6 0a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5z"/>
        </svg>
      </motion.button>

      <button className="corner-btn top-right" title="Settings" onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}>
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" /></svg>
      </button>
      <button className="corner-btn bottom-right" title="Toggle Menu" onClick={(e) => { e.stopPropagation(); setMode(m => m === 'opened' ? 'default' : 'opened'); }}>
        <svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      
      <div className="stage" style={{ visibility: (mode === 'default' || mode === 'opened') ? 'visible' : 'hidden' }}>
        <motion.svg initial={{ left: '50%' }} animate={svgControls} className="svg-morph" viewBox="0 0 0.5 1">
          <motion.path initial={{ x: pivotX, d: stages[0] }} animate={pathControls} stroke="#ffffff" strokeWidth="0.015" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </div>

      <div className="stage" style={{ visibility: (mode === 'searching' || mode === 'redirected') ? 'visible' : 'hidden' }}>
        <motion.div 
          className="quicklook" 
          animate={qlTextControls} 
          initial={{ x: '-100%' }}
          style={{ clipPath: 'url(#chevronClip)', WebkitClipPath: 'url(#chevronClip)' }}
        >
          <div className="ql-marquee-wrapper">
            <div className="ql-marquee-track">
              {[...Array(8)].map((_, rIdx) => (
                <div key={rIdx} className={`marquee-line ${rIdx % 2 === 1 ? 'reverse' : ''}`}>
                  {[...Array(8)].map((_, wIdx) => (
                    <span key={wIdx} className="marquee-word">{badgeText}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        <svg className="svg-morph" style={{ left: 0, width: '100vw', height: '100vh', pointerEvents: 'none' }} viewBox="0 0 1 1" preserveAspectRatio="none">
          <defs>
            <clipPath id="chevronClip" clipPathUnits="objectBoundingBox">
              <motion.path initial={{ d: qlStages[0] as string }} animate={qlPathControls} />
            </clipPath>
          </defs>
          <motion.path 
            initial={{ d: qlStages[0] as string }} 
            animate={qlPathControls} 
            fill={curColor} 
            stroke="#ffffff" 
            strokeWidth="0.008" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>

        {mode === 'searching' && (
          <div className="search-center-stage" onClick={e => e.stopPropagation()}>
            <h1 className="search-brand-title" style={{ color: matchedBrand ? '#ffffff' : '#f8fafc' }}>
              {matchedBrand ? matchedBrand.name : (query.toUpperCase() || 'SEARCH')}
            </h1>
            
            {matchedBrand?.directUrl && (
              <button
                className="search-direct-link"
                style={{ color: matchedBrand.color }}
                onClick={(e) => {
                  e.stopPropagation();
                  redirect(matchedBrand.directUrl);
                }}
              >
                🔗 {matchedBrand.directUrl}
              </button>
            )}

            <div className="search-recommendations-grid">
              {recommendations.map((rec, i) => {
                const isUrl = rec.startsWith('http://') || rec.startsWith('https://');
                const isActive = i === selIndex;
                return (
                  <button
                    key={rec + i}
                    className={`recommendation-chip ${isUrl ? 'url-chip' : ''} ${isActive ? 'active' : ''}`}
                    style={isUrl ? ({ '--brand-color': curColor } as React.CSSProperties) : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isUrl) redirect(rec);
                      else parseAndRedirect(rec);
                    }}
                  >
                    {rec}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>


      <div className="menu-layer" style={{ display: mode === 'opened' ? 'flex' : 'none' }}>
        <div className="menu-wrapper top">
          <motion.div className="time-panel" initial={{ y: 80, opacity: 0 }} animate={topControls}>
            {time.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit',
              second: settings.showSeconds ? '2-digit' : undefined,
              hour12: settings.clockFormat === '12h' 
            })}
          </motion.div>
        </div>
        <div className="menu-wrapper bottom">
          <AnimatePresence mode="popLayout" custom={pageDir}>
            <motion.div 
              key={page}
              custom={pageDir}
              initial={{ opacity: 0, x: pageDir * 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: pageDir * -100 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={`macros-panel ${mode === 'opened' ? 'shift-active' : ''}`} 
              style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
            >
              {currentMacros.map((m, i) => (
                <motion.button
                  key={m.trigger}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3, ease: 'easeOut' }}
                  className="app-card"
                  style={{ '--card': m.color } as React.CSSProperties}
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setLaunch({ macro: m, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
                    redirect(m.url);
                  }}
                >
                  <div className="card-bg" />
                  <div className="card-plate" />
                  <div className="card-logo"><BrandIcon macro={m} /></div>
                </motion.button>
              ))}
            </motion.div>
          </AnimatePresence>
          
          {pageCount > 1 && (
            <>
              <button className="page-arrow left" onClick={(e) => { e.stopPropagation(); setPage(p => { setPageDir(-1); return Math.max(0, p - 1); }); }}>‹</button>
              <button className="page-arrow right" onClick={(e) => { e.stopPropagation(); setPage(p => { setPageDir(1); return Math.min(pageCount - 1, p + 1); }); }}>›</button>
              <div className="page-dots">
                {Array.from({ length: pageCount }).map((_, i) => (
                  <span key={i} className={`dot ${i === page ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setPageDir(i > page ? 1 : -1); setPage(i); }} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <button className="creator-badge-pill" onClick={(e) => { e.stopPropagation(); setSettingsTab('about'); setShowSettings(true); }}>
        <span className="badge-dot" />© CodeChrome · Rahman CH
      </button>

      {/* AI Assistant Chat Overlay */}
      {aiOpen && (
        <div className="ai-chat-drawer glass" onClick={e => e.stopPropagation()}>
          <header className="ai-chat-header">
            <h3>🤖 CodeChrome AI Assistant ({settings.aiProvider})</h3>
            <button className="btn-close-ai" onClick={() => { setAiOpen(false); setMode('default'); }}>×</button>
          </header>
          <div className="ai-chat-messages">
            {aiHistory.length === 0 ? (
              <p className="ai-welcome">Ketik prompt Anda di kolom input utama untuk memulai diskusi, atau ketik langsung di bawah.</p>
            ) : (
              aiHistory.map((h, i) => (
                <div key={i} className={`ai-message ${h.role}`}>
                  <span className="role-lbl">{h.role === 'user' ? 'You' : 'AI'}</span>
                  <div className="msg-txt">{h.text}</div>
                </div>
              ))
            )}
            {aiLoading && <div className="ai-loading-pulse">Thinking...</div>}
            {aiError && <div className="ai-error-msg">{aiError}</div>}
          </div>
          <div className="ai-chat-input-bar">
            <input 
              ref={aiInputRef}
              placeholder="Tulis prompt di sini..." 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const target = e.currentTarget;
                  askAi(target.value);
                  target.value = '';
                }
              }}
            />
          </div>
        </div>
      )}

      {launch && (
        <>
          <motion.div className="redirect-plate" style={{ '--card': launch.macro.color, left: launch.x - 70, top: launch.y - 70 } as React.CSSProperties} initial={{ scale: 1 }} animate={{ scale: Math.max(window.innerWidth, window.innerHeight) / 35 }} transition={{ duration: 0.8, ease: 'easeOut' }} />
          <motion.div className="redirect-logo" style={{ left: launch.x - 36, top: launch.y - 36 }} initial={{ scale: 1 }} animate={{ left: window.innerWidth / 2 - 36, top: window.innerHeight / 2 - 36, scale: 2.2 }} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}>
            <BrandIcon macro={launch.macro} />
          </motion.div>
        </>
      )}

      {showSettings && (
        <div className="settings-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-card" onClick={e => e.stopPropagation()}>
            <div className="settings-header">
              <h2>CodeChrome Settings</h2>
              <button onClick={() => setShowSettings(false)}>×</button>
            </div>
            <div className="settings-nav">
              <button className={settingsTab === 'general' ? 'active' : ''} onClick={() => setSettingsTab('general')}>General</button>
              <button className={settingsTab === 'macros' ? 'active' : ''} onClick={() => setSettingsTab('macros')}>Macro Applications</button>
              <button className={settingsTab === 'themes' ? 'active' : ''} onClick={() => setSettingsTab('themes')}>Themes & FX</button>
              <button className={settingsTab === 'ai' ? 'active' : ''} onClick={() => setSettingsTab('ai')}>AI Assistant</button>
              <button className={settingsTab === 'about' ? 'active' : ''} onClick={() => setSettingsTab('about')}>About</button>
            </div>
            <div className="settings-body">
              {settingsTab === 'general' && (
                <>
                  <div className="field-group">
                    <label>Tab Title</label>
                    <input value={tabTitle} onChange={e => setTabTitle(e.target.value)} />
                  </div>
                  <div className="field-group">
                    <label>Default Search Engine</label>
                    <select defaultValue="google">
                      <option value="google">Google</option>
                      <option value="duckduckgo">DuckDuckGo</option>
                    </select>
                  </div>
                  <div className="grid-layout-row">
                    <div className="field-group">
                      <label>Grid Columns</label>
                      <input type="number" min="2" max="8" value={gridCols} onChange={e => setGridCols(Math.min(8, Math.max(2, Number(e.target.value))))} />
                    </div>
                    <div className="field-group">
                      <label>Grid Rows</label>
                      <input type="number" min="1" max="4" value={gridRows} onChange={e => setGridRows(Math.min(4, Math.max(1, Number(e.target.value))))} />
                    </div>
                  </div>
                  <div className="grid-layout-row">
                    <div className="field-group">
                      <label>Clock Format</label>
                      <select value={settings.clockFormat} onChange={e => setSettings({ ...settings, clockFormat: e.target.value as '12h' | '24h' })}>
                        <option value="24h">24 Hour (00:00 - 23:59)</option>
                        <option value="12h">12 Hour (12:00 AM/PM)</option>
                      </select>
                    </div>
                    <div className="field-group">
                      <label>Show Seconds</label>
                      <select value={settings.showSeconds ? 'yes' : 'no'} onChange={e => setSettings({ ...settings, showSeconds: e.target.value === 'yes' })}>
                        <option value="yes">Yes (HH:MM:SS)</option>
                        <option value="no">No (HH:MM)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
              {settingsTab === 'macros' && (
                <>
                  {macrosList.map((m, index) => (
                    <div className="macro-item" key={index}>
                      <input value={m.name} placeholder="Name" onChange={e => updateMacro(index, 'name', e.target.value)} />
                      <input value={m.url} placeholder="URL" onChange={e => updateMacro(index, 'url', e.target.value)} />
                      <input value={m.trigger} placeholder="Trigger" onChange={e => updateMacro(index, 'trigger', e.target.value)} />
                      <input value={m.color} type="color" onChange={e => updateMacro(index, 'color', e.target.value)} />
                      <button style={{ background: 'transparent', border: 0, color: '#ff4444', cursor: 'pointer' }} onClick={() => removeMacro(index)}>×</button>
                    </div>
                  ))}
                  <button className="btn-add" onClick={addMacro}>+ Add New Macro App</button>
                </>
              )}
              {settingsTab === 'themes' && (
                <>
                  <div className="field-group">
                    <label>Background Effect</label>
                    <select value={settings.themeFx} onChange={e => setSettings({ ...settings, themeFx: e.target.value as 'ambient' | 'matrix' | 'crt' })}>
                      <option value="ambient">Ambient Glow</option>
                      <option value="matrix">Matrix Rain</option>
                      <option value="crt">Retro CRT</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label>Typing Sound</label>
                    <select value={settings.soundProfile} onChange={e => setSettings({ ...settings, soundProfile: e.target.value as 'off' | 'blue' | 'brown' })}>
                      <option value="off">Off</option>
                      <option value="blue">Mechanical Blue (clicky)</option>
                      <option value="brown">Mechanical Brown (thocky)</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label>Sound Volume ({Math.round((settings.soundVolume ?? 0.28) * 100)}%)</label>
                    <input type="range" min="0" max="1" step="0.05" value={settings.soundVolume ?? 0.28} onChange={e => setSettings({ ...settings, soundVolume: Number(e.target.value) })} />
                  </div>
                </>
              )}
              {settingsTab === 'ai' && (
                <>
                  <div className="field-group">
                    <label>AI Provider</label>
                    <select value={settings.aiProvider} onChange={e => setSettings({ ...settings, aiProvider: e.target.value as AiProvider })}>
                      <option value="gemini">Google Gemini</option>
                      <option value="openai">OpenAI</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label>API Key</label>
                    <input type="password" value={settings.aiApiKey} placeholder="Disimpan lokal di browser" onChange={e => setSettings({ ...settings, aiApiKey: e.target.value })} />
                  </div>
                  <p className="slot-note">Ambil API Key Gemini gratis di <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color: '#8b5cf6', textDecoration: 'underline' }}>Google AI Studio</a>. Trigger: ketik `/ai ` lalu Enter, double-space di input kosong, atau klik tombol mengambang di pojok kiri atas.</p>
                </>
              )}
              {settingsTab === 'about' && (
                <section className="about-panel">
                  <div className="creator-badge">
                    <span>CC</span>
                    <div>
                      <b>Rahman CH</b>
                      <small>Creator & Developer of CodeChrome</small>
                    </div>
                  </div>
                  <p className="about-copy">CodeChrome dibuat sebagai startpage compact, cepat, dan keyboard-first untuk workflow browser harian. Untuk business inquiry, kolaborasi, atau feedback, kontak developer melalui kanal resmi di bawah.</p>
                  <div className="contact-grid">
                    <a href="mailto:Rahmannch19@gmail.com">Email<span>Rahmannch19@gmail.com</span></a>
                    <a href="https://instagram.com/mangch._" target="_blank" rel="noreferrer">Instagram<span>@mangch._</span></a>
                    <a href="https://github.com/RahmannCH/CodeChrome" target="_blank" rel="noreferrer">GitHub Repository<span>RahmannCH/CodeChrome</span></a>
                  </div>
                  <div className="slot-note">Slot tambahan: portfolio, LinkedIn, website pribadi, atau media kit bisa ditambahkan kapan saja.</div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
