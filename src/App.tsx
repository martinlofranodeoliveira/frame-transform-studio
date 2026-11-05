import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Undo2, Upload, Download, Focus, Check, Pause, Play, X, Layers, SlidersHorizontal, Map } from 'lucide-react';
import { Fault, IDENTITY, MAX_BYTES, Store, exportJSON, exportSVG, interpolate, matrix, poseFromMatrix, previewDocument, worlds } from './core';
import type { Code, Pose } from './core';
import { seed } from './seed';
import { errorKey, translator } from './i18n';
import type { Key, Locale } from './i18n';
import { Scene } from './Scene';
import { CameraModeButton } from './CameraModeButton';
import { Projection } from './Projection';
const format = (n: number) => Math.abs(n) < 0.0000005 ? '0.000000' : n.toFixed(6);
function matrixText(m: readonly number[]) { return [0,1,2,3].map(r => [0,1,2,3].map(c => format(m[c*4+r]).padStart(12)).join(' ')).join('\n'); }
function supported() { return typeof WebGLRenderingContext !== 'undefined'; }
export function App({ initialStore, initialFallback = false }: { initialStore?: Store; initialFallback?: boolean }) {
  const [store] = useState(() => initialStore ?? new Store(seed()));
  const [revision, setRevision] = useState(0);
  const [locale, setLocale] = useState<Locale>('pt-BR');
  const t = translator(locale);
  const [tab, setTab] = useState<'objects' | 'properties' | 'plan'>('objects');
  const [fallback, setFallback] = useState(() => initialFallback || !supported());
  const [viewError, setViewError] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const [fitKey, setFitKey] = useState(0);
  const [error, setError] = useState<Code | null>(null);
  const [status, setStatus] = useState<Key>('ready');
  const [label, setLabel] = useState('');
  const [numbers, setNumbers] = useState<string[]>([]);
  const [parent, setParent] = useState('');
  const [a, setA] = useState<Pose | null>(null), [b, setB] = useState<Pose | null>(null);
  const [amount, setAmount] = useState(0), [preview, setPreview] = useState(false), [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [importOpen, setImportOpen] = useState(false), [draft, setDraft] = useState('');
  const [exported, setExported] = useState<{ text: string; ext: 'json' | 'svg' } | null>(null);
  const animation = useRef<number | null>(null);
  const mounted = useRef(true);
  const fileRead = useRef(0);
  const frame = store.doc.frames.find(f => f.id === store.selected);
  const stop = useCallback(() => { if (animation.current !== null) cancelAnimationFrame(animation.current); animation.current = null; setPlaying(false); }, []);
  useEffect(() => {
    mounted.current = true;
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const update = () => { setReduced(media?.matches ?? false); if (media?.matches) stop(); };
    update(); media?.addEventListener('change', update);
    return () => { mounted.current = false; fileRead.current++; if (animation.current !== null) cancelAnimationFrame(animation.current); media?.removeEventListener('change', update); };
  }, [stop]);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { stop(); } };
    window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape);
  }, [stop]);
  useEffect(() => {
    setLabel(frame?.label ?? '');
    setNumbers(frame ? [...frame.pose.t, ...frame.pose.q].map(String) : []);
    setParent(frame?.parent ?? '');
  }, [frame, revision]);
  const clearComparison = () => { setA(null); setB(null); setAmount(0); setPreview(false); };
  const select = useCallback((id: string) => {
    stop(); store.select(id); setA(null); setB(null); setPreview(false); setAmount(0); setError(null); setRevision(v => v+1);
  }, [store, stop]);
  const failView = useCallback(() => { setCameraMode(false); setFallback(true); setViewError(true); }, []);
  const action = (fn: () => void, clear = false, nextStatus: Key = 'changed') => {
    stop(); setPreview(false);
    try { fn(); if (clear) clearComparison(); setError(null); setStatus(nextStatus); setRevision(v => v+1); }
    catch (e) { setError(e instanceof Fault ? e.code : 'schema'); }
  };
  const previewPose = frame && a && b && preview ? interpolate(a, b, amount) : null;
  const visible = frame && previewPose ? previewDocument(store.doc, frame.id, previewPose) : store.doc;
  const world = frame ? worlds(visible).get(frame.id)! : null;
  const local = frame ? (previewPose ?? frame.pose) : null;
  const globalPose = world ? poseFromMatrix(world) : null;
  const setStep = (value: number) => { stop(); setAmount(Math.max(0, Math.min(1, Math.round(value*1000)/1000))); setPreview(true); };
  const play = () => {
    if (!a || !b || reduced) return;
    stop(); setAmount(0); setPreview(true); setPlaying(true);
    const start = performance.now();
    const tick = (now: number) => {
      const next = Math.min(1, Math.max(0, (now-start)/5000)); setAmount(next);
      if (next < 1) animation.current = requestAnimationFrame(tick);
      else { animation.current = null; setPlaying(false); }
    };
    animation.current = requestAnimationFrame(tick);
  };
  const add = () => action(() => {
    let index = 1; while (store.doc.frames.some(f => f.id === `f${index}`)) index++;
    store.add({ id: `f${index}`, label: `F${index}`, parent: store.selected, pose: IDENTITY });
  }, true);
  const apply = () => action(() => {
    if (!frame) throw new Fault('missing');
    const values = numbers.map(v => /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(v.trim()) ? Number(v) : NaN);
    store.edit(frame.id, label, { t: [values[0], values[1], values[2]], q: [values[3], values[4], values[5], values[6]] });
  });
  const readFile = async (file: File | undefined) => {
    if (!file) return;
    const token = ++fileRead.current;
    try {
      if (file.size > MAX_BYTES) throw new Fault('bytes');
      const text = await file.text();
      if (mounted.current && token === fileRead.current) { setDraft(text); setError(null); }
    } catch (e) { if (mounted.current && token === fileRead.current) setError(e instanceof Fault ? e.code : 'file'); }
  };
  const exportTo = (ext: 'json' | 'svg') => setExported({ text: ext === 'json' ? exportJSON(store.doc) : exportSVG(store.doc), ext });
  return <div className="app">
    <header className="toolbar">
      <div className="identity"><h1>{t('title')}</h1><span>{t('development')}</span></div>
      <div className="file-actions">
        <button onClick={() => action(() => store.undo(), true)} disabled={!store.undoCount}><Undo2 aria-hidden="true" />{t('undo')}</button>
        <button onClick={() => { stop(); fileRead.current++; setImportOpen(v => !v); }}><Upload aria-hidden="true" />{t('import')}</button>
        <button onClick={() => exportTo('json')}><Download aria-hidden="true" />JSON</button>
        <button onClick={() => exportTo('svg')}><Download aria-hidden="true" />SVG</button>
      </div>
      <label className="locale">{t('language')}<select value={locale} onChange={e => setLocale(e.target.value as Locale)}><option value="pt-BR">Português</option><option value="en">English</option></select></label>
    </header>
    <nav className="mobile-nav" aria-label={t('objects')}>
      {(['objects','properties','plan'] as const).map((key, i) => { const Icon = [Layers, SlidersHorizontal, Map][i]; return <button key={key} aria-pressed={tab === key} onClick={() => setTab(key)}><Icon aria-hidden="true" />{t(key)}</button>; })}
    </nav>
    <main className={`workspace tab-${tab}`}>
      <aside className="hierarchy" aria-label={t('objects')}>
        <h2>{t('objects')} <span>{store.doc.frames.length}/64</span></h2>
        <ul>{store.doc.frames.map(f => {
          let depth = 0, p = f.parent; while (p) { depth++; p = store.doc.frames.find(x => x.id === p)!.parent; }
          return <li key={f.id}><button style={{ paddingInlineStart: 12+depth*12 }} aria-label={`${f.label} (${f.id})`} aria-pressed={store.selected === f.id} onClick={() => select(f.id)}><span className="frame-mark" /> <span>{f.label}<small>{f.id}</small></span></button></li>;
        })}</ul>
        {!store.doc.frames.length && <p>{t('empty')}</p>}
        <button onClick={add}><Plus aria-hidden="true" />{t('add')}</button>
        <button disabled={!frame} onClick={() => frame && action(() => store.remove(frame.id), true)}><Trash2 aria-hidden="true" />{t('remove')}</button>
        <p className="conventions">{t('units')}</p>
        <a href="https://lofranotecnologia.com.br">{t('general')}</a>
      </aside>
      <section className="view" aria-label={t('title')}>
        <div className="view-context"><output aria-label={t('selected')}>{frame ? `${frame.id} · ${frame.label}` : t('empty')}</output><span>{previewPose ? t('preview') : t('accepted')}</span></div>
        <div className="stage">
          {fallback ? <Projection doc={visible} selected={store.selected} onSelect={select} label={t('projection')} /> : <Scene doc={visible} selected={store.selected} onSelect={select} cameraMode={cameraMode} fitKey={fitKey} onFail={failView} loading={t('loading')} />}
          {!store.doc.frames.length && <p className="view-message">{t('empty')}</p>}
        </div>
        <div className="view-tools">
          {!fallback && <CameraModeButton active={cameraMode} onChange={setCameraMode} startLabel={t('camera')} finishLabel={t('finishCamera')} />}
          <button onClick={() => { setFitKey(v => v+1); }}><Focus aria-hidden="true" />{t('fit')}</button>
          <button aria-pressed={fallback} onClick={() => { setCameraMode(false); setFallback(v => !v); setViewError(false); }}>{fallback ? t('webgl') : t('fallback')}</button>
        </div>
        <p className="view-hint">{fallback ? (viewError ? t('webglError') : t('fallbackStatus')) : t(cameraMode ? 'cameraMode' : 'selectionMode')}</p>
        <p className="axis-key">{t('axes')}</p>
      </section>
      <aside className="inspector" aria-label={t('properties')}>
        <h2>{t('properties')}</h2>
        {!frame && <p>{t('empty')}</p>}
        {frame && <>
          <form onSubmit={e => { e.preventDefault(); apply(); }}>
            <h3>{t('local')}</h3>
            <label>{t('label')}<input value={label} onChange={e => setLabel(e.target.value)} maxLength={128} /></label>
            <fieldset><legend>{t('translation')}</legend><div className="numeric three">{['X','Y','Z'].map((axis, i) => <label key={axis}>{axis}<input aria-label={`${t('translation')} ${axis}`} inputMode="decimal" maxLength={64} value={numbers[i] ?? ''} onChange={e => setNumbers(v => v.map((n,j) => j === i ? e.target.value : n))} /></label>)}</div></fieldset>
            <fieldset><legend>{t('quaternion')} xyzw</legend><div className="numeric four">{['x','y','z','w'].map((axis, i) => <label key={axis}>{axis}<input aria-label={`${t('quaternion')} ${axis}`} inputMode="decimal" maxLength={64} value={numbers[i+3] ?? ''} onChange={e => setNumbers(v => v.map((n,j) => j === i+3 ? e.target.value : n))} /></label>)}</div></fieldset>
            <button type="submit" className="primary"><Check aria-hidden="true" />{t('apply')}</button>
          </form>
          <section className="inspector-section"><label>{t('parent')}<select value={parent} onChange={e => setParent(e.target.value)}><option value="">{t('root')}</option>{store.doc.frames.filter(f => f.id !== frame.id).map(f => <option key={f.id} value={f.id}>{f.label} ({f.id})</option>)}</select></label><button onClick={() => action(() => store.reparent(frame.id, parent || null), true)}>{t('reparent')}</button></section>
          <section className="inspector-section"><h3>{t('worldPose')}</h3><output className="pose-output">t [{globalPose!.t.map(format).join(', ')}]<br />q [{globalPose!.q.map(format).join(', ')}]</output>
            <details open><summary>{t('worldMatrix')}</summary><pre aria-label={t('worldMatrix')}>{matrixText(world!)}</pre></details>
            <details><summary>{t('localMatrix')}</summary><pre aria-label={t('localMatrix')}>{matrixText(matrix(local!))}</pre></details><p>{t('matrixHelp')}</p>
          </section>
          <section className="inspector-section comparison"><h3>{t('compare')}</h3><p>{t('compareHelp')}</p>
            <div className="capture"><button onClick={() => { stop(); setA(frame.pose); }}>{t('captureA')}</button><span>A: {t(a ? 'captured' : 'notCaptured')}</span><button onClick={() => { stop(); setB(frame.pose); }}>{t('captureB')}</button><span>B: {t(b ? 'captured' : 'notCaptured')}</span></div>
            <label htmlFor="interpolation-progress">{t('progress')} <output>{Math.round(amount*100)}%</output><input id="interpolation-progress" type="range" min="0" max="1" step="0.01" value={amount} disabled={!a || !b} onChange={e => setStep(Number(e.target.value))} /></label>
            <div className="step-actions"><button disabled={!a || !b} onClick={() => setStep(amount-0.1)}>{t('back')}</button><button disabled={!a || !b} onClick={() => setStep(amount+0.1)}>{t('forward')}</button></div>
            <button disabled={!a || !b || reduced} onClick={playing ? stop : play}>{playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}{t(playing ? 'pause' : 'play')}</button>
            {reduced && <p>{t('reduced')}</p>}
            <button disabled={!previewPose} onClick={() => previewPose && action(() => store.edit(frame.id, frame.label, previewPose))}>{t('commit')}</button>
          </section>
        </>}
      </aside>
      <section className="plan-panel" aria-label={t('plan')}><h2>{t('plan')}</h2><Projection doc={visible} selected={store.selected} onSelect={select} label={t('projection')} /><p>{t('axes')}</p></section>
    </main>
    <footer className="status" aria-live="polite"><span>{error ? `${t('rejected')} ${t(errorKey(error))}` : t(status)}</span><span>{store.doc.frames.length} {t('frames')} · {store.undoCount}/20 {t('history')}</span><a href={`${import.meta.env.BASE_URL}third-party-notices.txt`}>{t('licenses')}</a></footer>
    {error && <div role="alert" className="error-banner">{t(errorKey(error))}<button aria-label={t('close')} onClick={() => setError(null)}><X aria-hidden="true" /></button></div>}
    {importOpen && <section className="document-panel" aria-label={t('importTitle')}><h2>{t('importTitle')}</h2><p>{t('importHelp')}</p><label>{t('file')}<input type="file" accept=".json,application/json" onChange={e => { void readFile(e.target.files?.[0]); }} /></label><label>{t('draft')}<textarea value={draft} onChange={e => { fileRead.current++; setDraft(e.target.value); }} spellCheck={false} /></label><button className="primary" onClick={() => action(() => store.import(draft), true, 'imported')}>{t('applyImport')}</button><button onClick={() => { fileRead.current++; setImportOpen(false); }}>{t('close')}</button></section>}
    {exported && <section className="document-panel" aria-label={t('exported')}><h2>{t('exported')}</h2><label>{exported.ext === 'json' ? t('exportJSON') : t('exportSVG')}<textarea readOnly value={exported.text} /></label><a className="button-link" href={`data:${exported.ext === 'json' ? 'application/json' : 'image/svg+xml'};charset=utf-8,${encodeURIComponent(exported.text)}`} download={`frames.${exported.ext}`}>{t('save')}</a><button onClick={() => setExported(null)}>{t('close')}</button></section>}
  </div>;
}
