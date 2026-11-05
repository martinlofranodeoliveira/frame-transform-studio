import test from 'node:test';
import assert from 'node:assert/strict';
import { Matrix4, Quaternion, Vector3 } from 'three';
import { Fault, IDENTITY, MAX_BYTES, Store, capturePose, close, exportJSON, exportSVG, importJSON, interpolate, inverse, matrix, multiply, point, validate, worlds } from '../src/core';
import type { Frame, Pose, Quat, Vec3 } from '../src/core';
import { seed } from '../src/seed';
import { en, pt } from '../src/i18n';
const s = Math.sqrt(0.5);
const rz: Pose = { t:[2,0,0], q:[0,0,s,s] };
function near(actual: readonly number[], expected: readonly number[]) { assert.ok(close(actual, expected), `${actual} != ${expected}`); }
function frame(id: string, parent: string | null = null): Frame { return { id, label:id, parent, pose:IDENTITY }; }
function doc(frames: readonly Frame[]) { return { version:'0.1.0', frames }; }
function snapshot(store: Store) { return [exportJSON(store.doc), store.selected, store.undoCount]; }
function rejectsAtomically(store: Store, fn: () => void, code?: string) {
  const before = snapshot(store);
  assert.throws(fn, e => e instanceof Fault && (!code || e.code === code));
  assert.deepEqual(snapshot(store), before);
}
test('literal column-vector order, positive Rz and rigid inverse', () => {
  near(point(matrix({ ...rz, t:[0,0,0] }), [1,0,0]), [0,1,0]);
  near(point(matrix(rz), [1,0,0]), [2,1,0]);
  const reversed = multiply(matrix({ ...rz, t:[0,0,0] }), matrix({ ...IDENTITY, t:[2,0,0] }));
  near(point(reversed, [1,0,0]), [0,3,0]);
  near(point(inverse(matrix(rz)), [2,1,0]), [1,0,0]);
  near(matrix(rz), [0,1,0,0,-1,0,0,0,0,0,1,0,2,0,0,1]);
});
test('literal reparent preserves child and descendant, including orientation', () => {
  const store = new Store(seed()); store.select('arm');
  const before = worlds(store.doc);
  near(point(before.get('arm')!, [0,0,0]), [2,1,0]);
  near(point(before.get('tool')!, [0,0,0]), [0,1,0]);
  store.reparent('arm','target');
  const f = store.doc.frames.find(f => f.id === 'arm')!;
  near(f.pose.t, [-2,2,0]);
  near(matrix({ t:[0,0,0], q:f.pose.q }), matrix({ t:[0,0,0], q:[0,0,-s,s] }));
  const after = worlds(store.doc);
  for (const [id,m] of before) near(after.get(id)!,m);
  store.undo(); assert.equal(store.doc.frames.find(f => f.id === 'arm')!.parent,'base');
});
test('exhaustive principal-axis quarter turns and independent Three composition/inverse oracle', () => {
  for (const axis of [[1,0,0],[0,1,0],[0,0,1]] as Vec3[]) for (let turn = -4; turn <= 4; turn++) {
    const angle = turn*Math.PI/2;
    const q = [...axis.map(v => v*Math.sin(angle/2)), Math.cos(angle/2)] as unknown as Quat;
    for (const t of [[0,0,0],[2,-3,5],[-1000,1000,0.125]] as Vec3[]) {
      const own = matrix(capturePose({t,q}));
      const three = new Matrix4().compose(new Vector3(...t), new Quaternion(...q), new Vector3(1,1,1));
      near(own, three.elements); near(inverse(own), three.clone().invert().elements);
      for (const p of [[1,0,0],[0,1,0],[0,0,1],[-2,4,0.5]] as Vec3[]) near(point(own,p), new Vector3(...p).applyMatrix4(three).toArray());
      // Four quarter turns restore each literal basis vector, regardless of axis.
      if (Math.abs(turn) === 4) near(point(own,[1,2,3]), [t[0]+1,t[1]+2,t[2]+3]);
      const b = new Matrix4().makeTranslation(-7,2,1);
      near(multiply(own,b.elements), three.clone().multiply(b).elements);
    }
  }
});
test('SLERP exact endpoints, antipodes, close angles and independent quaternion oracle', () => {
  const a = capturePose({t:[0,0,0],q:[0,0,0,1]});
  const b = capturePose({t:[10,20,-4],q:[0,0,1,0]});
  assert.strictEqual(interpolate(a,b,0),a); assert.strictEqual(interpolate(a,b,1),b);
  near(interpolate(a,b,0.5).t,[5,10,-2]);
  near(point(matrix(interpolate(a,b,0.5)),[1,0,0]),[5,11,-2]);
  const negative: Pose = {t:a.t,q:[0,0,0,-1]};
  for (let i=0;i<=100;i++) {
    const t=i/100;
    near(matrix(interpolate(a,negative,t)),matrix(a));
    const expected = new Quaternion(...a.q).slerp(new Quaternion(...b.q),t);
    near(matrix({t:[0,0,0],q:interpolate(a,b,t).q}),new Matrix4().makeRotationFromQuaternion(expected).elements);
  }
  const tiny = capturePose({t:[0,0,0],q:[0,0,Math.sin(1e-6),Math.cos(1e-6)]});
  assert.ok(interpolate(a,tiny,.5).q.every(Number.isFinite));
  near(matrix({t:rz.t,q:rz.q.map(v=>-v) as unknown as Quat}),matrix(rz));
  assert.throws(()=>interpolate(a,b,NaN),Fault);
});
test('admission tolerance, normalization, strict schema and UTF-8/XML labels', () => {
  assert.ok(Math.abs(capturePose({t:[0,0,0],q:[0,0,0,1+1e-11]}).q[3]-1)<1e-15);
  assert.throws(()=>capturePose({t:[0,0,0],q:[0,0,0,1+1e-8]}),Fault);
  for (const label of ['\u0000','\ud800','é'.repeat(65),'x'.repeat(129),'']) assert.throws(()=>validate(doc([{...frame('a'),label}])),Fault);
  const valid = validate(doc([{...frame('a'),label:'<A & "B"> 😀'}]));
  const svg = exportSVG(valid);
  assert.match(svg,/&lt;A &amp; &quot;B&quot;&gt;/);
  assert.doesNotMatch(svg,/<script|foreignObject|href=|url\(/i);
  assert.match(svg,/<circle cx="[\d.]+" cy="[\d.]+"/);
  assert.throws(()=>validate({...doc([]),worlds:[]}),Fault);
  assert.throws(()=>validate(doc([{...frame('a'),extra:1} as Frame])),Fault);
  assert.throws(()=>validate(doc([{...frame('a'),pose:{t:[0,0,0],q:[0,0,0,1],scale:1} as Pose}])),Fault);
  assert.throws(()=>validate(doc([frame('__proto__'),frame('__proto__')])),Fault);
});
test('all rejected commands preserve canonical JSON, selection and nonempty undo history', () => {
  const store = new Store(seed()); store.select('arm'); store.edit('arm','Edited',store.doc.frames.find(f=>f.id==='arm')!.pose);
  rejectsAtomically(store,()=>store.reparent('base','tool'),'cycle');
  rejectsAtomically(store,()=>store.reparent('arm','absent'),'parent');
  rejectsAtomically(store,()=>store.remove('base'),'leaf');
  rejectsAtomically(store,()=>store.edit('arm','A',{t:[NaN,0,0],q:IDENTITY.q}),'translation');
  rejectsAtomically(store,()=>store.edit('arm','A',{t:[0,0,0],q:[0,0,0,2]}),'quaternion');
  rejectsAtomically(store,()=>store.add(frame('arm')),'id');
  rejectsAtomically(store,()=>store.import('{'),'json');
  rejectsAtomically(store,()=>store.import(' '.repeat(MAX_BYTES+1)),'bytes');
  rejectsAtomically(store,()=>store.import('é'.repeat(MAX_BYTES/2+1)),'bytes');
  rejectsAtomically(store,()=>store.import('{"version":"0.1.0","frames":[{"id":"a","label":"a","parent":null,"pose":{"t":[1e999,0,0],"q":[0,0,0,1]}}]}'),'translation');
  rejectsAtomically(store,()=>store.import(JSON.stringify(doc([{...frame('x'),parent:'missing'}]))),'parent');
  rejectsAtomically(store,()=>store.import('{"version":"0.1.0","frames":[],"__proto__":{"polluted":true}}'),'schema');
  assert.equal(({} as {polluted?:boolean}).polluted,undefined);
});
test('64-frame and depth-16 boundaries, depth-17 reparent and world-bound rejection', () => {
  const many = new Store(doc(Array.from({length:64},(_,i)=>frame(`f${i}`))));
  many.select('f0'); rejectsAtomically(many,()=>many.add(frame('extra')),'frames');
  const chain = Array.from({length:16},(_,i)=>frame(`n${i}`,i?`n${i-1}`:null));
  const deep = new Store(doc([...chain,frame('other')])); deep.select('other');
  rejectsAtomically(deep,()=>deep.reparent('other','n15'),'depth');
  rejectsAtomically(deep,()=>deep.add(frame('n16','n15')),'depth');
  const far = new Store(doc([{...frame('a'),pose:{t:[1000,0,0],q:IDENTITY.q}}, {...frame('b'),pose:{t:[-1000,0,0],q:IDENTITY.q}}]));
  rejectsAtomically(far,()=>far.reparent('a','b'),'bounds');
  near(point(worlds(far.doc).get('a')!,[0,0,0]),[1000,0,0]);
});
test('bounded undo restores actual snapshots, imports recompute and empty is useful', () => {
  const store = new Store(doc([frame('a')]));
  for(let i=1;i<=25;i++) store.edit('a',`Label ${i}`,IDENTITY);
  assert.equal(store.undoCount,20);
  rejectsAtomically(store,()=>store.import(JSON.stringify({version:'9',frames:[]})),'schema');
  for(let i=0;i<20;i++) store.undo();
  assert.equal(store.doc.frames[0].label,'Label 5'); assert.equal(store.undoCount,0);
  store.import(JSON.stringify(doc([]))); assert.equal(store.selected,null);
  store.add(frame('new')); assert.equal(store.selected,'new'); store.remove('new'); assert.equal(store.selected,null);
  const text=exportJSON(seed()); assert.equal(exportJSON(importJSON(text)),text);
  assert.ok(Object.isFrozen(store.doc)); assert.ok(Object.isFrozen(seed().frames[0].pose.q));
});
test('both locales cover every visible key and fault without placeholder values', () => {
  assert.deepEqual(Object.keys(en).sort(),Object.keys(pt).sort());
  for(const table of [en,pt]) for(const text of Object.values(table)) assert.ok(text.length>0);
});

test('half-turn tie is independent of endpoint quaternion sign', () => {
  const start = capturePose({t:[0,0,0],q:[0,0,0,1]});
  for (const endSign of [1,-1]) {
    const end = capturePose({t:[0,0,0],q:[0,0,endSign,0]});
    near(point(matrix(interpolate(start,end,.5)),[1,0,0]),[0,1,0]);
    assert.strictEqual(interpolate(start,end,1),end);
  }
  const q = capturePose({t:[0,0,0],q:[.5,.5,.5,.5]});
  const opposite = capturePose({t:[0,0,0],q:[-.5,-.5,-.5,-.5]});
  for (const t of [0,.1,.5,.9,1]) {
    const actual = interpolate(q,opposite,t);
    assert.ok(actual.q.every(Number.isFinite));
    assert.ok(Math.hypot(...actual.q)>0);
    near(matrix(actual),matrix(q));
  }
});

test('sparse public arrays never bypass finite coordinate or frame admission', () => {
  assert.throws(()=>capturePose({t:new Array(3),q:[0,0,0,1]}),Fault);
  assert.throws(()=>capturePose({t:[0,0,0],q:new Array(4)}),Fault);
  assert.throws(()=>validate(doc(new Array(1))),Fault);
});
