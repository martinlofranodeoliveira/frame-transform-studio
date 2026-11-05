import { IDENTITY, validate } from './core';
const s = Math.sqrt(0.5);
export const seed = () => validate({ version: '0.1.0', frames: [
  { id: 'base', label: 'Base', parent: null, pose: { t: [2,0,0], q: [0,0,s,s] } },
  { id: 'arm', label: 'A', parent: 'base', pose: { t: [1,0,0], q: IDENTITY.q } },
  { id: 'tool', label: 'Tool', parent: 'arm', pose: { t: [0,2,0], q: IDENTITY.q } },
  { id: 'target', label: 'B', parent: null, pose: { t: [0,3,0], q: [0,0,1,0] } }
] });
