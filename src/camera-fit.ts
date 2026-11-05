import { point, worlds } from './core';
import type { Document, Vec3 } from './core';
export const CAMERA_FAR = 1_000_000;
export function frameBounds(doc: Document) {
  const positions = [...worlds(doc).values()].map(m => point(m,[0,0,0]));
  const min = [0,1,2].map(i=>Math.min(0,...positions.map(p=>p[i]))) as unknown as Vec3;
  const max = [0,1,2].map(i=>Math.max(0,...positions.map(p=>p[i]))) as unknown as Vec3;
  const center = min.map((v,i)=>(v+max[i])/2) as unknown as Vec3;
  // One unit encloses each rotated frame's cube and axis meshes around its origin.
  const radius = Math.max(2,Math.hypot(...min.map((v,i)=>max[i]-v))/2+1);
  return {min,max,center,radius};
}
export function fitDistance(radius: number, verticalFovDegrees: number, aspect: number): number {
  if (![radius,verticalFovDegrees,aspect].every(Number.isFinite) || radius<=0 || aspect<=0 || verticalFovDegrees<=0 || verticalFovDegrees>=180) throw new RangeError('Invalid perspective fit');
  const vertical = verticalFovDegrees*Math.PI/360;
  const horizontal = Math.atan(Math.tan(vertical)*aspect);
  const distance = radius/Math.sin(Math.min(vertical,horizontal))*1.12;
  if (!Number.isFinite(distance)) throw new RangeError('Unrepresentable perspective fit');
  return distance;
}
