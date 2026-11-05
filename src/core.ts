export const VERSION = '0.1.0';
export const MAX_BYTES = 262144;
export type Vec3 = readonly [number, number, number];
export type Quat = readonly [number, number, number, number];
export type Pose = Readonly<{ t: Vec3; q: Quat }>;
export type Frame = Readonly<{ id: string; label: string; parent: string | null; pose: Pose }>;
export type Document = Readonly<{ version: '0.1.0'; frames: readonly Frame[] }>;
export type Mat4 = number[];
export type Code = 'bytes' | 'json' | 'schema' | 'id' | 'label' | 'translation' | 'quaternion' | 'parent' | 'cycle' | 'depth' | 'frames' | 'leaf' | 'missing' | 'bounds' | 'preserve' | 'range' | 'file';
export class Fault extends Error {
  constructor(public readonly code: Code) { super(code); this.name = 'Fault'; }
}
function fail(code: Code): never { throw new Fault(code); }
function record(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return fail('schema');
  const obj = value as Record<string, unknown>;
  if (Object.keys(obj).length !== keys.length || keys.some(k => !Object.hasOwn(obj, k))) return fail('schema');
  return obj;
}
function tuple(value: unknown, n: number, code: Code): number[] {
  if (!Array.isArray(value) || value.length !== n || Array.from(value).some(v => typeof v !== 'number' || !Number.isFinite(v))) return fail(code);
  return value as number[];
}
export function validId(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]{0,31}$/.test(value)) return fail('id');
  return value;
}
export function validLabel(value: unknown): string {
  if (typeof value !== 'string' || !value.length || value.length > 128 || new TextEncoder().encode(value).length > 128) return fail('label');
  for (const char of value) {
    const c = char.codePointAt(0)!;
    if (!(c === 9 || c === 10 || c === 13 || (c >= 32 && c <= 0xd7ff) || (c >= 0xe000 && c <= 0xfffd) || (c >= 0x10000 && c <= 0x10ffff))) return fail('label');
  }
  return value;
}
export function capturePose(value: unknown): Pose {
  const p = record(value, ['t', 'q']);
  const t = tuple(p.t, 3, 'translation');
  if (t.some(v => Math.abs(v) > 1000)) return fail('translation');
  const q = tuple(p.q, 4, 'quaternion');
  const n = q.reduce((s, v) => s + v * v, 0);
  if (Math.abs(n - 1) > 1e-10) return fail('quaternion');
  const d = Math.sqrt(n);
  // q and -q represent one rotation. Canonical sign resolves exact half-turn SLERP ties.
  const first = q[3] !== 0 ? q[3] : q.find(v => v !== 0)!;
  const sign = first < 0 ? -1 : 1;
  return Object.freeze({ t: Object.freeze([...t]) as Vec3, q: Object.freeze(q.map(v => v === 0 ? 0 : sign * v / d)) as unknown as Quat });
}
export function validate(value: unknown): Document {
  const d = record(value, ['version', 'frames']);
  if (d.version !== VERSION || !Array.isArray(d.frames)) return fail('schema');
  if (d.frames.length > 64) return fail('frames');
  const ids = new Set<string>();
  const frames: Frame[] = Array.from(d.frames).map((value: unknown) => {
    const f = record(value, ['id', 'label', 'parent', 'pose']);
    const id = validId(f.id);
    if (ids.has(id)) return fail('id');
    ids.add(id);
    const parent = f.parent === null ? null : validId(f.parent);
    return Object.freeze({ id, label: validLabel(f.label), parent, pose: capturePose(f.pose) });
  });
  const map = new Map(frames.map(f => [f.id, f]));
  for (const f of frames) {
    const seen = new Set<string>();
    let current: Frame | undefined = f;
    while (current) {
      if (seen.has(current.id)) return fail('cycle');
      seen.add(current.id);
      if (seen.size > 16) return fail('depth');
      if (current.parent !== null && !map.has(current.parent)) return fail('parent');
      current = current.parent === null ? undefined : map.get(current.parent);
    }
  }
  frames.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  return Object.freeze({ version: VERSION, frames: Object.freeze(frames) });
}
export function importJSON(text: string): Document {
  if (text.length > MAX_BYTES || new TextEncoder().encode(text).length > MAX_BYTES) return fail('bytes');
  let value: unknown;
  try { value = JSON.parse(text); } catch { return fail('json'); }
  return validate(value);
}
export function exportJSON(doc: Document): string {
  return JSON.stringify({ version: VERSION, frames: doc.frames.map(f => ({ id: f.id, label: f.label, parent: f.parent, pose: { t: f.pose.t, q: f.pose.q } })) }, null, 2) + '\n';
}
export const IDENTITY: Pose = Object.freeze({ t: Object.freeze([0, 0, 0]) as Vec3, q: Object.freeze([0, 0, 0, 1]) as Quat });
export function matrix(p: Pose): Mat4 {
  const [x, y, z, w] = p.q;
  return [1 - 2 * (y*y + z*z), 2 * (x*y + z*w), 2 * (x*z - y*w), 0,
    2 * (x*y - z*w), 1 - 2 * (x*x + z*z), 2 * (y*z + x*w), 0,
    2 * (x*z + y*w), 2 * (y*z - x*w), 1 - 2 * (x*x + y*y), 0,
    ...p.t, 1];
}
export function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Array<number>(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) out[c*4+r] += a[k*4+r] * b[c*4+k];
  return out;
}
export function point(m: Mat4, p: Vec3): Vec3 {
  return [m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12], m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13], m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];
}
export function inverse(m: Mat4): Mat4 {
  return [m[0], m[4], m[8], 0, m[1], m[5], m[9], 0, m[2], m[6], m[10], 0,
    -(m[0]*m[12]+m[1]*m[13]+m[2]*m[14]), -(m[4]*m[12]+m[5]*m[13]+m[6]*m[14]), -(m[8]*m[12]+m[9]*m[13]+m[10]*m[14]), 1];
}
export function poseFromMatrix(m: Mat4): Pose {
  const trace = m[0] + m[5] + m[10];
  let x: number, y: number, z: number, w: number;
  if (trace > 0) {
    const s = 2 * Math.sqrt(trace + 1); w = s/4; x = (m[6]-m[9])/s; y = (m[8]-m[2])/s; z = (m[1]-m[4])/s;
  } else if (m[0] > m[5] && m[0] > m[10]) {
    const s = 2 * Math.sqrt(1+m[0]-m[5]-m[10]); w = (m[6]-m[9])/s; x = s/4; y = (m[4]+m[1])/s; z = (m[8]+m[2])/s;
  } else if (m[5] > m[10]) {
    const s = 2 * Math.sqrt(1+m[5]-m[0]-m[10]); w = (m[8]-m[2])/s; x = (m[4]+m[1])/s; y = s/4; z = (m[9]+m[6])/s;
  } else {
    const s = 2 * Math.sqrt(1+m[10]-m[0]-m[5]); w = (m[1]-m[4])/s; x = (m[8]+m[2])/s; y = (m[9]+m[6])/s; z = s/4;
  }
  const n = Math.hypot(x, y, z, w);
  return { t: [m[12], m[13], m[14]], q: [x/n, y/n, z/n, w/n] };
}
export function worlds(doc: Document): Map<string, Mat4> {
  const out = new Map<string, Mat4>();
  const frames = new Map(doc.frames.map(f => [f.id, f]));
  function visit(id: string): Mat4 {
    const cached = out.get(id); if (cached) return cached;
    const f = frames.get(id)!;
    const m = f.parent === null ? matrix(f.pose) : multiply(visit(f.parent), matrix(f.pose));
    out.set(id, m); return m;
  }
  for (const f of doc.frames) visit(f.id);
  return out;
}
export function close(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((v, i) => Math.abs(v-b[i]) <= 1e-9 + 1e-12*Math.max(Math.abs(v), Math.abs(b[i])));
}
export function interpolate(a: Pose, b: Pose, t: number): Pose {
  if (!Number.isFinite(t) || t < 0 || t > 1) return fail('range');
  if (t === 0) return a;
  if (t === 1) return b;
  let dot = a.q.reduce((s, v, i) => s + v*b.q[i], 0);
  const end = dot < 0 ? b.q.map(v => -v) : b.q;
  dot = Math.min(1, Math.abs(dot));
  let q: number[];
  if (dot > 0.9995) q = a.q.map((v, i) => v + t*(end[i]-v));
  else {
    const angle = Math.acos(dot), den = Math.sin(angle);
    q = a.q.map((v, i) => (Math.sin((1-t)*angle)*v + Math.sin(t*angle)*end[i])/den);
  }
  const n = Math.hypot(...q);
  return { t: a.t.map((v, i) => v + t*(b.t[i]-v)) as unknown as Vec3, q: q.map(v => v/n) as unknown as Quat };
}
export function previewDocument(doc: Document, id: string, pose: Pose): Document {
  return { version: VERSION, frames: doc.frames.map(f => f.id === id ? { ...f, pose } : f) };
}
type Snapshot = { doc: Document; selected: string | null };
export class Store {
  private current: Document;
  private selection: string | null;
  private past: Snapshot[] = [];
  constructor(value: unknown) { this.current = validate(value); this.selection = this.current.frames[0]?.id ?? null; }
  get doc(): Document { return this.current; }
  get selected(): string | null { return this.selection; }
  get undoCount(): number { return this.past.length; }
  select(id: string): void { if (!this.current.frames.some(f => f.id === id)) fail('missing'); this.selection = id; }
  private commit(candidate: unknown, selected: string | null, check?: (next: Document) => void): void {
    const next = validate(candidate);
    if (selected !== null && !next.frames.some(f => f.id === selected)) fail('missing');
    check?.(next);
    this.past = [...this.past.slice(-19), { doc: this.current, selected: this.selection }];
    this.current = next; this.selection = selected;
  }
  add(frame: Frame): void { this.commit({ version: VERSION, frames: [...this.current.frames, frame] }, frame.id); }
  edit(id: string, label: string, pose: Pose): void {
    if (!this.current.frames.some(f => f.id === id)) fail('missing');
    this.commit({ version: VERSION, frames: this.current.frames.map(f => f.id === id ? { ...f, label, pose } : f) }, this.selection);
  }
  remove(id: string): void {
    const f = this.current.frames.find(f => f.id === id); if (!f) return fail('missing');
    if (this.current.frames.some(f => f.parent === id)) fail('leaf');
    const frames = this.current.frames.filter(f => f.id !== id);
    const selected = this.selection === id ? f.parent ?? frames[0]?.id ?? null : this.selection;
    this.commit({ version: VERSION, frames }, selected);
  }
  reparent(id: string, parent: string | null): void {
    const f = this.current.frames.find(f => f.id === id); if (!f) return fail('missing');
    if (parent !== null && !this.current.frames.some(f => f.id === parent)) fail('parent');
    // Validate the graph before computing any new pose.
    validate({ version: VERSION, frames: this.current.frames.map(v => v.id === id ? { ...v, parent } : v) });
    const before = worlds(this.current);
    const local = parent === null ? before.get(id)! : multiply(inverse(before.get(parent)!), before.get(id)!);
    const pose = poseFromMatrix(local);
    if (pose.t.some(v => Math.abs(v) > 1000)) fail('bounds');
    this.commit({ version: VERSION, frames: this.current.frames.map(v => v.id === id ? { ...v, parent, pose } : v) }, this.selection, next => {
      const after = worlds(next);
      for (const [key, value] of before) if (!close(value, after.get(key)!)) fail('preserve');
    });
  }
  import(text: string): void {
    const next = importJSON(text);
    const selected = next.frames.some(f => f.id === this.selection) ? this.selection : next.frames[0]?.id ?? null;
    this.commit(next, selected);
  }
  undo(): void {
    const previous = this.past.at(-1); if (!previous) return;
    this.past = this.past.slice(0, -1); this.current = previous.doc; this.selection = previous.selected;
  }
}
export type Projected = { id: string; label: string; parent: string | null; origin: readonly [number, number]; axes: readonly (readonly [number, number])[] };
export function projection(doc: Document): Projected[] {
  const w = worlds(doc);
  const iso = (p: Vec3): [number, number] => [(p[0]-p[1])*Math.sqrt(3)/2, (p[0]+p[1])/2-p[2]];
  const raw = doc.frames.map(f => ({ ...f, origin: iso(point(w.get(f.id)!, [0,0,0])), axes: ([[0.85,0,0],[0,0.85,0],[0,0,0.85]] as Vec3[]).map(p => iso(point(w.get(f.id)!, p))) }));
  const points = raw.flatMap(f => [f.origin, ...f.axes]);
  if (!points.length) return [];
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const scale = Math.min(500/Math.max(1, maxX-minX), 300/Math.max(1, maxY-minY));
  const map = (p: readonly [number, number]): [number, number] => [320+(p[0]-(minX+maxX)/2)*scale, 210+(p[1]-(minY+maxY)/2)*scale];
  return raw.map(f => ({ id: f.id, label: f.label, parent: f.parent, origin: map(f.origin), axes: f.axes.map(map) }));
}
export const AXIS_COLORS = ['#b33436', '#267343', '#235bd4'] as const;
function xml(value: string): string { return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!); }
function decimal(n: number): string { return (Math.abs(n) < 0.0000005 ? 0 : n).toFixed(6); }
export function exportSVG(doc: Document): string {
  const projected = projection(doc);
  const height = 450 + projected.length*22;
  const at = (p: readonly [number, number]) => `x="${decimal(p[0])}" y="${decimal(p[1])}"`;
  const line = (a: readonly [number, number], b: readonly [number, number], color: string) => `<line x1="${decimal(a[0])}" y1="${decimal(a[1])}" x2="${decimal(b[0])}" y2="${decimal(b[1])}" stroke="${color}" stroke-width="2"/>`;
  const elements = projected.map((f, i) => {
    const parent = projected.find(p => p.id === f.parent);
    return (parent ? line(parent.origin, f.origin, '#67747e') : '') + f.axes.map((p, axis) => line(f.origin, p, AXIS_COLORS[axis])).join('') + `<circle c${at(f.origin).replace(' y=', ' cy=')} r="4" fill="#202b36"/><text ${at([f.origin[0]+7, f.origin[1]-7])}>${xml(f.id)}</text><text x="24" y="${450+i*22}">${xml(f.id)} · ${xml(f.label)}</text>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="${height}" viewBox="0 0 640 ${height}"><title>Frame Transform Studio 0.1.0</title><rect width="640" height="${height}" fill="#f3f6f7"/><g font-family="sans-serif" font-size="14" fill="#202b36">${elements}<text x="24" y="425">X / Y / Z · isometric · generic units</text></g></svg>\n`;
}
