import { useEffect, useRef, useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { macros as defaultMacros, engines } from './config';
import type { Macro } from './config';
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
  dC('M', [0, 0.5]) + dC('c', [0, 0, 0, 0, 0, 0.5]) + dC('c', [0, 0, 0, 0, 0, -0.5]) + dC('M', [0, 0.5]) + dC('c', [0, 0, 0, 0, 0, -0.5]) + dC('c', [0, 0, 0, 0, 0, 0.5]),
  dC('M', [0, 0.5]) + dC('c', [0, 0, 0, 0, 0, 0.5]) + dC('c', [0, -curvature, 0.5, -curvature, 0.5, -0.5]) + dC('M', [0, 0.5]) + dC('c', [0, 0, 0, 0, 0, -0.5]) + dC('c', [0, curvature, 0.5, curvature, 0.5, 0.5]),
  (ratio: number) => dC('M', [0, 0.5]) + dC('c', [0, 0, 0, 0, 0, 0.5]) + dC('c', [0, -curvature, 0.5, -curvature, ratio * 2, -0.5]) + dC('M', [0, 0.5]) + dC('c', [0, 0, 0, 0, 0, -0.5]) + dC('c', [0, curvature, 0.5, curvature, ratio * 2, 0.5]),
  (ratio: number) => dC('M', [0, 0.5]) + dC('c', [0, 0, 0, 0, 0, 0.5]) + dC('c', [ratio * 4, 0, ratio * 2, 0, ratio * 2, -0.5]) + dC('M', [0, 0.5]) + dC('c', [0, 0, 0, 0, 0, -0.5]) + dC('c', [ratio * 4, 0, ratio * 2, 0, ratio * 2, 0.5])
];

type Mode = 'default' | 'opened' | 'searching' | 'redirected';
type Launch = { macro: Macro; x: number; y: number };

function AppIcon({ name }: { name: string }) {
  if (name === 'github') return (
    <svg viewBox="0 0 24 24">
      <path fill="currentColor" stroke="none" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/>
    </svg>
  );
  if (name === 'youtube') return (
    <svg viewBox="0 0 24 24">
      <path fill="currentColor" stroke="none" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
  if (name === 'figma') return (
    <svg viewBox="0 0 24 24">
      <path fill="currentColor" stroke="none" d="M8 24c-2.21 0-4-1.79-4-4s1.79-4 4-4h4v4c0 2.21-1.79 4-4 4zm0-16C5.79 8 4 6.21 4 4s1.79-4 4-4h4v8H8zm0 0h4v8H8a4 4 0 0 1 0-8zm8-4c2.21 0 4 1.79 4 4s-1.79 4-4 4h-4V4h4zm0 8c2.21 0 4 1.79 4 4s-1.79 4-4 4h-4v-8h4z"/>
    </svg>
  );
  if (name === 'mail') return (
    <svg viewBox="0 0 24 24">
      <path fill="currentColor" stroke="none" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>
  );
  if (name === 'music') return (
    <svg viewBox="0 0 24 24">
      <path fill="currentColor" stroke="none" d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.66.3.102zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72.96.42 1.5-.3.54-.96.72-1.5.42z"/>
    </svg>
  );
  if (name === 'reddit') return (
    <svg viewBox="0 0 24 24">
      <path fill="currentColor" stroke="none" d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.196-.491.956 0 1.73.774 1.73 1.73 0 .684-.396 1.277-.969 1.56.02.193.03.388.03.587 0 2.977-3.46 5.39-7.729 5.39-4.268 0-7.729-2.413-7.729-5.39 0-.195.01-.39.03-.583A1.734 1.734 0 0 1 4.3 12c0-.956.774-1.73 1.73-1.73.466 0 .888.182 1.196.49 1.193-.856 2.847-1.417 4.67-1.487l.951-4.463a.468.468 0 0 1 .557-.361l3.076.652c.117-.213.346-.357.61-.357z"/>
    </svg>
  );
  if (name === 'notion') return (
    <svg viewBox="0 0 24 24">
      <path fill="currentColor" stroke="none" d="M4.459 4.208c.746.606 1.026.56 2.428.466l11.416-.746c.326 0 .28-.28.186-.42L16.48 1.41c-.42-.513-.98-.84-2.146-.746L3.619 1.41c-.466.046-.653.373-.42.653l1.26 2.145zm1.587 3.638v13.805c0 .746.42 1.073 1.166 1.026l14.127-.84c.746-.046 1.073-.513 1.073-1.26V6.932c0-.746-.42-1.073-1.166-1.026l-14.127.84c-.653.047-1.073.467-1.073 1.093zm11.703 1.866c.14.373.047.746-.327.793l-.7.14v8.257c0 .653-.326.886-.886.933l-2.425.14c-.234.047-.42-.093-.56-.373l-4.15-6.577v5.924c.42.093.7.233.7.653 0 .093 0 .233-.047.373l-2.145.14c-.14.047-.327.047-.42-.14-.14-.373-.047-.746.326-.793l.7-.14V9.617c0-.653.327-.886.887-.933l2.565-.187c.373-.046.56.093.746.373l3.964 6.39V9.524c-.42-.093-.7-.233-.7-.653 0-.093 0-.233.047-.373l2.145-.14c.187-.047.327 0 .42.147z"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24">
      <path fill="currentColor" stroke="none" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
    </svg>
  );
}

export default function App() {
  const [mode, setMode] = useState<Mode>('default');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{label: string, value: string, prefix?: string}[]>([]);
  const [selIndex, setSelIndex] = useState(-1);
  const [time, setTime] = useState(new Date());
  const [launch, setLaunch] = useState<Launch | null>(null);
  
  // Settings & Custom Macros State
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'macros' | 'about'>('general');
  const [tabTitle, setTabTitle] = useState(() => localStorage.getItem('codechrome.title') || 'CodeChrome');
  const [macrosList, setMacrosList] = useState<Macro[]>(() => {
    try {
      const saved = localStorage.getItem('codechrome.macros');
      return saved ? JSON.parse(saved) : defaultMacros;
    } catch {
      return defaultMacros;
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const svgControls = useAnimationControls();
  const pathControls = useAnimationControls();
  const topControls = useAnimationControls();
  const bottomControls = useAnimationControls();
  const qlPathControls = useAnimationControls();
  const qlTextControls = useAnimationControls();

  const stages = getStages(0.35);
  const qlStages = getQuickLookStages(0.18);
  const pivotX = -0.15;
  const dur = 0.5;

  useEffect(() => { document.title = tabTitle; localStorage.setItem('codechrome.title', tabTitle); }, [tabTitle]);
  useEffect(() => { localStorage.setItem('codechrome.macros', JSON.stringify(macrosList)); }, [macrosList]);

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { if (!showSettings) inputRef.current?.focus(); }, [mode, showSettings]);

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

  const parseAndRedirect = (val = query) => {
    const txt = val.trim();
    if (!txt) return;
    const [head, ...tail] = txt.split(/\s+/);
    const macro = macrosList.find(m => m.trigger === head);
    if (macro) {
      if (!tail.length) redirect(macro.url);
      else redirect(`${macro.url}/search?q=${encodeURIComponent(tail.join(' '))}`);
      return;
    }
    const engine = engines.find(e => e.trigger === head);
    if (engine && tail.length) redirect(engine.url.replace('{query}', encodeURIComponent(tail.join(' '))));
    else redirect(engines[0].url.replace('{query}', encodeURIComponent(txt)));
  };

  const handleInput = (val: string) => {
    setQuery(val);
    if (!val.trim()) { setMode('default'); setSuggestions([]); return; }
    if (mode !== 'searching') setMode('searching');
    
    const t = val.trim().toLowerCase();
    const res = macrosList.filter(m => `${m.name} ${m.trigger}`.toLowerCase().includes(t))
      .map(m => ({ label: m.name, value: m.trigger, prefix: m.trigger }));
    setSuggestions(res);
    setSelIndex(-1);
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
      if (mode === 'searching') {
        if (e.key === 'ArrowDown' && suggestions.length) { e.preventDefault(); setSelIndex(i => Math.min(i + 1, suggestions.length - 1)); }
        if (e.key === 'ArrowUp' && suggestions.length) { e.preventDefault(); setSelIndex(i => Math.max(i - 1, -1)); }
        if (e.key === 'Enter') { e.preventDefault(); parseAndRedirect(selIndex >= 0 ? suggestions[selIndex].value : query); }
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
  }, [mode, query, selIndex, suggestions, showSettings, macrosList]);

  const activeMacro = macrosList.find(m => query.trim().split(' ')[0] === m.trigger);
  const curColor = activeMacro ? activeMacro.color : '#8b5cf6';

  const updateMacro = (index: number, field: keyof Macro, val: string) => {
    const next = [...macrosList];
    next[index] = { ...next[index], [field]: val };
    setMacrosList(next);
  };

  const addMacro = () => {
    setMacrosList([...macrosList, { name: 'New App', trigger: 'app', url: 'https://example.com', color: '#6366f1', icon: 'spark', key: 'x' }]);
  };

  const removeMacro = (index: number) => {
    setMacrosList(macrosList.filter((_, i) => i !== index));
  };

  return (
    <main className="app" onClick={() => !showSettings && inputRef.current?.focus()}>
      <input ref={inputRef} value={query} onChange={e => handleInput(e.target.value)} className="input-catcher" spellCheck="false" autoComplete="off" autoFocus />

      {/* Hidden Hover Corner Triggers */}
      <div className="corner-trigger-tr" />
      <div className="corner-trigger-br" />

      {/* Hidden Hover-Corner Buttons */}
      <button 
        className="corner-btn top-right" 
        title="Settings"
        onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}
      >
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" /></svg>
      </button>

      <button 
        className="corner-btn bottom-right" 
        title="Toggle Menu"
        onClick={(e) => { e.stopPropagation(); setMode(m => m === 'opened' ? 'default' : 'opened'); }}
      >
        <svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      
      {/* Chevron Animation Layer */}
      <div className="stage" style={{ visibility: (mode === 'default' || mode === 'opened') ? 'visible' : 'hidden' }}>
        <motion.svg initial={{ left: '50%' }} animate={svgControls} className="svg-morph" viewBox="0 0 0.5 1">
          <motion.path 
            initial={{ x: pivotX, d: stages[0] }} 
            animate={pathControls} 
            stroke="#ffffff" strokeWidth="0.015" fill="none" strokeLinecap="round" strokeLinejoin="round" 
          />
        </motion.svg>
      </div>

      {/* QuickLook Animation Layer */}
      <div className="stage" style={{ visibility: (mode === 'searching' || mode === 'redirected') ? 'visible' : 'hidden' }}>
        <motion.div className="quicklook" animate={qlTextControls} initial={{ x: '-100%' }}>
          <div className="ql-label" style={{ color: curColor }}>{query}</div>
        </motion.div>
        
        <svg className="svg-morph" style={{ left: 0 }} viewBox="0 0 1 1">
          <motion.path 
            initial={{ d: qlStages[0] as string }} 
            animate={qlPathControls} 
            fill="transparent" stroke={curColor} strokeWidth="0.015" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>

        {mode === 'searching' && suggestions.length > 0 && (
          <div className="suggestions">
            {suggestions.map((s, i) => (
              <div key={s.value} className={`item ${i === selIndex ? 'active' : ''}`}>
                <b>{s.prefix}</b>{s.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Menus Layer */}
      <div className="menu-layer" style={{ display: mode === 'opened' ? 'flex' : 'none' }}>
        <div className="menu-wrapper top">
          <motion.div 
            className="time-panel" 
            initial={{ y: 80, opacity: 0 }} 
            animate={topControls}
          >
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </motion.div>
        </div>
        <div className="menu-wrapper bottom">
          <motion.div 
            className={`macros-panel ${mode === 'opened' ? 'shift-active' : ''}`} 
            initial={{ y: -80, opacity: 0 }} 
            animate={bottomControls}
          >
            {macrosList.map((m) => (
              <button
                key={m.trigger}
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
                <div className="card-logo"><AppIcon name={m.icon} /></div>
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      <button className="creator-footer" onClick={(e) => { e.stopPropagation(); setSettingsTab('about'); setShowSettings(true); }}>
        CodeChrome · Built by Rahman CH
      </button>

      {launch && (
        <>
          <motion.div
            className="redirect-plate"
            style={{ '--card': launch.macro.color, left: launch.x - 70, top: launch.y - 70 } as React.CSSProperties}
            initial={{ scale: 1 }}
            animate={{ scale: Math.max(window.innerWidth, window.innerHeight) / 35 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
          <motion.div
            className="redirect-logo"
            style={{ left: launch.x - 36, top: launch.y - 36 }}
            initial={{ scale: 1 }}
            animate={{ left: window.innerWidth / 2 - 36, top: window.innerHeight / 2 - 36, scale: 2.2 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
          >
            <AppIcon name={launch.macro.icon} />
          </motion.div>
        </>
      )}

      {/* Chevron Settings Modal Studio */}
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
                    <a href="https://github.com/RahmannCH/Al-Qur-an_1.0/blob/master/README.md" target="_blank" rel="noreferrer">GitHub Project<span>RahmannCH</span></a>
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
