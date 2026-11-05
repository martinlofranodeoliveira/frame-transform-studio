import { Component, Suspense, useEffect, useLayoutEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Edges, OrbitControls } from '@react-three/drei';
import { Matrix4, Vector3 } from 'three';
import { AXIS_COLORS, point, worlds } from './core';
import type { Document } from './core';
import type { PerspectiveCamera } from 'three';
import { CAMERA_FAR, fitDistance, frameBounds } from './camera-fit';
export type ObjectProps = { doc: Document; selected: string | null; onSelect: (id: string) => void };
export function SceneObjects({ doc, selected, onSelect }: ObjectProps) {
  const w = useMemo(() => worlds(doc), [doc]);
  const links = useMemo(() => new Float32Array(doc.frames.flatMap(f => f.parent === null ? [] : [...point(w.get(f.parent)!, [0,0,0]), ...point(w.get(f.id)!, [0,0,0])])), [doc, w]);
  return <group name="frames">
    <lineSegments name="parent-links"><bufferGeometry><bufferAttribute attach="attributes-position" args={[links, 3]} /></bufferGeometry><lineBasicMaterial color="#67747e" /></lineSegments>
    {doc.frames.map(f => <group key={f.id} name={`frame:${f.id}`} matrix={new Matrix4().fromArray(w.get(f.id)!)} matrixAutoUpdate={false} userData={{ frameId: f.id, selected: f.id === selected }}>
      <mesh name={`pick:${f.id}`} onClick={e => { e.stopPropagation(); onSelect(f.id); }}>
        <boxGeometry args={[0.34,0.34,0.34]} /><meshStandardMaterial color={f.id === selected ? '#d5e2ff' : '#e1e8eb'} roughness={0.85} />
        <Edges color={f.id === selected ? '#235bd4' : '#52626e'} threshold={15} />
      </mesh>
      <mesh position={[0.425,0,0]}><boxGeometry args={[0.85,0.025,0.025]} /><meshBasicMaterial color={AXIS_COLORS[0]} /></mesh>
      <mesh position={[0,0.425,0]}><boxGeometry args={[0.025,0.85,0.025]} /><meshBasicMaterial color={AXIS_COLORS[1]} /></mesh>
      <mesh position={[0,0,0.425]}><boxGeometry args={[0.025,0.025,0.85]} /><meshBasicMaterial color={AXIS_COLORS[2]} /></mesh>
    </group>)}
  </group>;
}
function Lifecycle({ cameraMode, fail }: { cameraMode: boolean; fail: () => void }) {
  const gl = useThree(s => s.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); fail(); };
    canvas.addEventListener('webglcontextlost', lost);
    return () => { canvas.removeEventListener('webglcontextlost', lost); canvas.style.touchAction = 'auto'; };
  }, [gl, fail]);
  useLayoutEffect(() => { if (!cameraMode) gl.domElement.style.touchAction = 'auto'; return () => { gl.domElement.style.touchAction = 'auto'; }; }, [cameraMode, gl]);
  return null;
}
export function Camera({ doc, fitKey, active }: { doc: Document; fitKey: number; active: boolean }) {
  const { camera, invalidate, size } = useThree();
  const bounds = useMemo(() => frameBounds(doc),[doc]);
  useLayoutEffect(() => {
    if (size.width <= 0 || size.height <= 0 || !(camera as PerspectiveCamera).isPerspectiveCamera) return;
    const perspective = camera as PerspectiveCamera;
    perspective.aspect = size.width/size.height;
    const distance = fitDistance(bounds.radius,perspective.getEffectiveFOV(),perspective.aspect);
    const center = new Vector3(...bounds.center);
    perspective.up.set(0,0,1);
    perspective.position.copy(center).add(new Vector3(1,-1.4,1).normalize().multiplyScalar(distance));
    perspective.lookAt(center); perspective.updateProjectionMatrix(); invalidate();
  },[bounds,fitKey,camera,invalidate,size.width,size.height]);
  // Keep orbit zoom-out behind the far plane, including the largest admitted sphere.
  return active ? <OrbitControls makeDefault target={[...bounds.center]} enableDamping={false} minDistance={0.1} maxDistance={CAMERA_FAR-2*bounds.radius} /> : null;
}
class Guard extends Component<{ children: ReactNode; onFail: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFail(); }
  render() { return this.state.failed ? null : this.props.children; }
}
function Failed({ onFail }: { onFail: () => void }) { useEffect(onFail, [onFail]); return null; }
export function Scene({ doc, selected, onSelect, cameraMode, fitKey, onFail, loading }: ObjectProps & { cameraMode: boolean; fitKey: number; onFail: () => void; loading: string }) {
  return <Guard onFail={onFail}><Suspense fallback={<p className="view-message">{loading}</p>}>
    <Canvas frameloop="demand" dpr={[1,1.5]} camera={{ position: [8,-10,8], up: [0,0,1], fov: 40, near: 0.01, far: CAMERA_FAR }} style={{ touchAction: cameraMode ? 'none' : 'auto' }} fallback={<Failed onFail={onFail} />}>
      <color attach="background" args={['#f3f6f7']} />
      <ambientLight intensity={1.5} /><directionalLight position={[4,-6,10]} intensity={2} />
      <gridHelper args={[24,24,'#b7c3cb','#dce3e7']} rotation={[Math.PI/2,0,0]} position={[0,0,-0.22]} />
      <SceneObjects doc={doc} selected={selected} onSelect={onSelect} />
      <Camera doc={doc} fitKey={fitKey} active={cameraMode} /><Lifecycle cameraMode={cameraMode} fail={onFail} />
    </Canvas>
  </Suspense></Guard>;
}
