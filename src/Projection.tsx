import { AXIS_COLORS, projection } from './core';
import type { Document } from './core';
export function Projection({ doc, selected, onSelect, label }: { doc: Document; selected: string | null; onSelect: (id: string) => void; label: string }) {
  const frames = projection(doc);
  return <svg className="projection" viewBox="0 0 640 420" role="img" aria-label={label}>
    <rect width="640" height="420" fill="#f3f6f7" />
    {frames.map(f => {
      const p = frames.find(p => p.id === f.parent);
      return <g key={f.id} onClick={() => onSelect(f.id)}>
        {p && <line x1={p.origin[0]} y1={p.origin[1]} x2={f.origin[0]} y2={f.origin[1]} stroke="#67747e" strokeWidth="2" />}
        {f.axes.map((end, i) => <line key={i} x1={f.origin[0]} y1={f.origin[1]} x2={end[0]} y2={end[1]} stroke={AXIS_COLORS[i]} strokeWidth="3" />)}
        <circle cx={f.origin[0]} cy={f.origin[1]} r={selected === f.id ? 7 : 4} fill={selected === f.id ? '#235bd4' : '#202b36'} />
        <text x={f.origin[0]+10} y={f.origin[1]-9} fill="#202b36" fontSize="14">{f.id}</text>
      </g>;
    })}
  </svg>;
}
