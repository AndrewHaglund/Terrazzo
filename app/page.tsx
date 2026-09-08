'use client';

import { useMemo, useState } from 'react';
import { Download, Dices, RotateCcw } from 'lucide-react';

type Settings = { color: string; density: number; randomness: number; size: number; sides: number };
const DEFAULTS: Settings[] = [
  { color: '#F27B52', density: 58, randomness: 42, size: 52, sides: 3 },
  { color: '#F5C46B', density: 34, randomness: 35, size: 44, sides: 4 },
  { color: '#6C8B84', density: 24, randomness: 50, size: 38, sides: 5 },
];
const CANVAS = { width: 900, height: 620 };

function seeded(seed: number) { let value = seed % 2147483647; if (value <= 0) value += 2147483646; return () => { value = (value * 16807) % 2147483647; return (value - 1) / 2147483646; }; }
function polygonPoints(cx: number, cy: number, radius: number, sides: number, randomness: number, random: () => number) {
  const rotation = random() * Math.PI * 2;
  const points = [];
  for (let index = 0; index < sides; index += 1) { const angle = rotation + (Math.PI * 2 * index) / sides; const jitter = 1 - randomness / 100 + random() * (randomness / 50); const r = radius * jitter; points.push(`${(cx + Math.cos(angle) * r).toFixed(2)},${(cy + Math.sin(angle) * r).toFixed(2)}`); }
  return points.join(' ');
}
function createShapes(settings: Settings[]) {
  return settings.flatMap((setting, colorIndex) => { const count = Math.round(8 + setting.density * 1.65); const random = seeded(1009 + colorIndex * 271 + Math.round(setting.randomness * 7.3)); return Array.from({ length: count }, (_, index) => { const edge = 38; const x = edge + random() * (CANVAS.width - edge * 2); const y = edge + random() * (CANVAS.height - edge * 2); const radius = (5 + setting.size * 0.19) * (0.58 + random() * 0.82); const sidesVariance = random() > 0.68 ? (random() > 0.5 ? 1 : -1) : 0; const sides = Math.max(3, Math.min(6, Math.round(setting.sides + sidesVariance))); return { key: `${colorIndex}-${index}`, points: polygonPoints(x, y, radius, sides, setting.randomness, random), fill: setting.color, opacity: 0.78 + random() * 0.2 }; }); });
}

export default function Home() {
  const [settings, setSettings] = useState(DEFAULTS); const [activeColor, setActiveColor] = useState(0); const [background, setBackground] = useState(true); const shapes = useMemo(() => createShapes(settings), [settings]);
  function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) { setSettings((current) => current.map((item, index) => index === activeColor ? { ...item, [key]: value } : item)); }
  function updateColorCount(count: number) { setSettings((current) => count > current.length ? [...current, ...Array.from({ length: count - current.length }, (_, index) => ({ ...DEFAULTS[(current.length + index) % DEFAULTS.length] }))] : current.slice(0, count)); setActiveColor((current) => Math.min(current, count - 1)); }
  function reset() { setSettings(DEFAULTS); setActiveColor(0); setBackground(true); }
  function exportSvg() { const fill = background ? '#F2F1EE' : 'none'; const polygons = shapes.map((shape) => `<polygon points="${shape.points}" fill="${shape.fill}" opacity="${shape.opacity.toFixed(2)}"/>`).join(''); const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS.width}" height="${CANVAS.height}" viewBox="0 0 ${CANVAS.width} ${CANVAS.height}"><rect width="100%" height="100%" fill="${fill}"/>${polygons}</svg>`; const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'terrazzo-maker.svg'; anchor.click(); URL.revokeObjectURL(url); }
  const active = settings[activeColor];
  return <main className="app-shell">
    <header className="topbar"><div className="brand-lockup"><div className="brand-mark"><span /><span /><span /><span /></div><div><div className="brand-name">Terrazzo Maker</div><div className="brand-kicker">Geometry playground</div></div></div><div className="top-actions"><button className="icon-button" onClick={reset} aria-label="Reset artwork"><RotateCcw size={16} /></button><button className="export-button" onClick={exportSvg}><Download size={16} /> Export SVG</button></div></header>
    <div className="workspace">
      <aside className="control-panel"><div className="panel-scroll"><div className="section-heading"><div><span className="eyebrow">Palette</span><h1>Build your mix</h1></div><span className="live-dot">Live</span></div>
        <section className="control-section"><div className="label-row"><label>Number of colors</label><span className="value-pill">{settings.length}</span></div><div className="segmented-control" role="group" aria-label="Number of colors">{[2, 3, 4, 5].map((count) => <button key={count} className={settings.length === count ? 'selected' : ''} onClick={() => updateColorCount(count)}>{count}</button>)}</div></section>
        <section className="control-section palette-section"><div className="label-row"><label>Colors</label><span className="hint">Tap a swatch to edit</span></div><div className="color-list">{settings.map((item, index) => <button key={index} className={`color-row ${activeColor === index ? 'active' : ''}`} onClick={() => setActiveColor(index)}><span className="color-swatch" style={{ background: item.color }} /><span className="color-name">Color {String(index + 1).padStart(2, '0')}</span><span className="color-hex">{item.color}</span><span className="color-picker-wrap"><input type="color" value={item.color} aria-label={`Choose color ${index + 1}`} onChange={(event) => { setActiveColor(index); setSettings((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, color: event.target.value.toUpperCase() } : entry)); }} /></span></button>)}</div></section>
        <section className="control-section tuning-section"><div className="label-row"><label>Tune color {String(activeColor + 1).padStart(2, '0')}</label><span className="active-chip" style={{ background: active.color }} /></div><Range label="Density" value={active.density} min={10} max={90} suffix="%" onChange={(value) => updateSetting('density', value)} /><Range label="Randomness" value={active.randomness} min={0} max={100} suffix="%" onChange={(value) => updateSetting('randomness', value)} /><Range label="Particle size" value={active.size} min={10} max={90} suffix="%" onChange={(value) => updateSetting('size', value)} /><Range label="Typical sides" value={active.sides} min={3} max={6} suffix="" step={1} onChange={(value) => updateSetting('sides', value)} /></section>
        <section className="control-section last-section"><div className="toggle-row"><div><label>Background</label><span>Fill the main frame</span></div><button role="switch" aria-checked={background} className={`switch ${background ? 'on' : ''}`} onClick={() => setBackground((current) => !current)}><span /></button></div></section>
      </div><div className="panel-footer"><Dices size={14} /><span>New shapes every time you tune</span></div></aside>
      <section className="preview-area"><div className="preview-toolbar"><div><span className="eyebrow">Preview</span><h2>Live composition</h2></div><div className="preview-meta"><span className="status-orb" />{shapes.length} shapes <span className="meta-divider" /> 900 × 620</div></div><div className={`artboard-wrap ${background ? 'has-background' : ''}`}><svg className="artboard" viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`} role="img" aria-label="Generated terrazzo composition">{background && <rect width="100%" height="100%" fill="#F2F1EE" />}{shapes.map((shape) => <polygon key={shape.key} points={shape.points} fill={shape.fill} opacity={shape.opacity} />)}</svg><div className="corner-label top-left">A / 01</div><div className="corner-label bottom-right">VECTOR PREVIEW</div></div><div className="preview-footer"><span>Drag values to explore a new field</span><span className="preview-footer-right"><span className="keyboard-key">⌘</span><span className="keyboard-key">E</span> export</span></div></section>
    </div>
  </main>;
}

function Range({ label, value, min, max, step = 1, suffix, onChange }: { label: string; value: number; min: number; max: number; step?: number; suffix: string; onChange: (value: number) => void }) { return <div className="range-control"><div className="label-row"><label>{label}</label><span className="range-value">{value}{suffix}</span></div><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><div className="range-scale"><span>{min}{suffix}</span><span>{max}{suffix}</span></div></div>; }
