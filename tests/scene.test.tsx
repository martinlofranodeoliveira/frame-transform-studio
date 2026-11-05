import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { create } from '@react-three/test-renderer';
import type { Group, Mesh } from 'three';
import type { RootState } from '@react-three/fiber';
import { SceneObjects } from '../src/Scene';
import { Store, close } from '../src/core';
import { seed } from '../src/seed';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
test('actual R3F scene objects use core world matrices, real geometry, selection and picking', async () => {
  const store = new Store(seed()); let picked = '';
  const renderer = await create(<SceneObjects doc={store.doc} selected="arm" onSelect={id=>{picked=id;}} />);
  try {
    const arm = renderer.scene.findByProps({name:'frame:arm'}).instance as Group;
    assert.equal(arm.userData.selected,true);
    assert.ok(close(arm.matrix.elements,[0,1,0,0,-1,0,0,0,0,0,1,0,2,1,0,1]));
    const tool = renderer.scene.findByProps({name:'pick:tool'});
    const mesh = tool.instance as Mesh;
    assert.equal(mesh.geometry.type,'BoxGeometry');
    assert.equal(mesh.geometry.getAttribute('position').count,24);
    await renderer.fireEvent(tool,'click',{stopPropagation(){}});
    assert.equal(picked,'tool');
    store.reparent('arm','target');
    await renderer.update(<SceneObjects doc={store.doc} selected={picked} onSelect={()=>{}} />);
    assert.equal((renderer.scene.findByProps({name:'frame:arm'}).instance as Group).userData.selected,false);
    const selected = renderer.scene.findByProps({name:'frame:tool'}).instance as Group;
    assert.equal(selected.userData.selected,true);
    assert.ok(close(selected.matrix.elements.slice(12,15),[0,1,0]));
    const links = renderer.scene.findByProps({name:'parent-links'}).instance as Mesh;
    assert.equal(links.geometry.getAttribute('position').count,4);
  } finally { await renderer.unmount(); }
});

test('perspective fit contains eight bounds corners and valid maximum-depth origins at narrow and wide aspects', async () => {
  const {frameBounds,fitDistance,CAMERA_FAR} = await import('../src/camera-fit');
  const {PerspectiveCamera,Vector3} = await import('three');
  const {validate,IDENTITY,worlds,point} = await import('../src/core');
  const root = (id:string,x:number,y=0,z=0,parent:string|null=null)=>({id,label:id,parent,pose:{t:[x,y,z],q:IDENTITY.q}});
  const chain = [-1,1].flatMap(sign=>Array.from({length:16},(_,i)=>root(`s${sign<0?'n':'p'}${i}`,sign*1000,sign*1000,sign*1000,i?`s${sign<0?'n':'p'}${i-1}`:null)));
  const documents = [validate({version:'0.1.0',frames:[root('left',-1000),root('right',1000)]}),validate({version:'0.1.0',frames:chain}),seed()];
  for (const doc of documents) for (const aspect of [.1,260/600,.8,2]) {
    const bounds=frameBounds(doc),distance=fitDistance(bounds.radius,40,aspect);
    const camera=new PerspectiveCamera(40,aspect,.01,CAMERA_FAR),center=new Vector3(...bounds.center);
    camera.up.set(0,0,1);camera.position.copy(center).add(new Vector3(1,-1.4,1).normalize().multiplyScalar(distance));camera.lookAt(center);camera.updateMatrixWorld(true);
    assert.ok(distance<CAMERA_FAR-2*bounds.radius,'Camera controls must not clamp the fitted distance');
    const corners=[...Array(8)].map((_,i)=>new Vector3(...[0,1,2].map(axis=>(i&(1<<axis))?bounds.max[axis]:bounds.min[axis]) as [number,number,number]));
    const origins=[...worlds(doc).values()].map(m=>new Vector3(...point(m,[0,0,0])));
    for(const v of [...corners,...origins]) {
      const ndc=v.project(camera);assert.ok([ndc.x,ndc.y,ndc.z].every(n=>Number.isFinite(n)&&Math.abs(n)<1),`clipped aspect${aspect}: ${ndc.toArray()}`);
    }
  }
});

test('actual R3F camera refits when viewport size changes', async () => {
  const {Camera} = await import('../src/Scene');
  const {useThree,act} = await import('@react-three/fiber');
  let state:RootState | undefined;
  function Observe() {state=useThree();return null;}
  const renderer=await create(<><Camera doc={seed()} fitKey={0} active={false}/><Observe/></>,{width:800,height:1000});
  try {
    assert.ok(state);const before=state.camera.position.length();
    await act(async()=>{state!.setSize(100,1000);});
    assert.ok(state!.camera.position.length()>before*3,'Narrow viewport must move the camera back');
    assert.equal((state!.camera as import('three').PerspectiveCamera).aspect,.1);
  } finally {await renderer.unmount();}
});
