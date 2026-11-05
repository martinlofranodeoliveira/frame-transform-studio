import { Store, close, exportJSON, interpolate, matrix, point, worlds } from './core';
import { seed } from './seed';
const args = process.argv.slice(2);
if (args.some(a => a !== '--assert' && a !== '--json')) { console.error('Usage: npm run demo -- [--assert] [--json]'); process.exitCode = 2; }
else {
  try {
    const store = new Store(seed());
    store.select('arm');
    const before = worlds(store.doc);
    store.reparent('arm', 'target');
    const after = worlds(store.doc);
    const local = store.doc.frames.find(f => f.id === 'arm')!.pose;
    const half = point(matrix(interpolate({ t:[0,0,0], q:[0,0,0,1] }, { t:[0,0,0], q:[0,0,1,0] }, 0.5)), [1,0,0]);
    if (args.includes('--assert')) {
      if (!close(point(before.get('arm')!, [0,0,0]), [2,1,0])) throw new Error('Literal child origin failed');
      if (!close(local.t, [-2,2,0])) throw new Error('Literal reparent translation failed');
      if (!close(point(after.get('tool')!, [0,0,0]), [0,1,0])) throw new Error('Literal descendant origin failed');
      if (!close(half, [0,1,0])) throw new Error('Literal SLERP midpoint failed');
      for (const [id, m] of before) if (!close(m, after.get(id)!)) throw new Error(`World preservation failed: ${id}`);
    }
    const round = (p: readonly number[]) => p.map(n => Math.abs(n) < 1e-9 ? 0 : Number(n.toFixed(6)));
    const report = { version: '0.1.0', synthetic: true, armWorld: round(point(after.get('arm')!, [0,0,0])), newLocal: round(local.t), toolWorld: round(point(after.get('tool')!, [0,0,0])), halfwayX: round(half), assertions: args.includes('--assert') ? 'passed' : 'not-requested' };
    if (args.includes('--json')) console.log(JSON.stringify(report, null, 2));
    else {
      console.log('Frame Transform Studio 0.1.0 — synthetic offline demo');
      console.log('arm world: [2, 1, 0]; new local under target: [-2, 2, 0]');
      console.log('tool world: [0, 1, 0]; halfway rotated +X: [0, 1, 0]');
      console.log(`Assertions: ${report.assertions}`);
      console.log('Accepted document JSON:'); console.log(exportJSON(store.doc).trimEnd());
    }
  } catch (error) { console.error(error instanceof Error ? error.message : 'Demo failed'); process.exitCode = 1; }
}
