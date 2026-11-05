import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MessageChannel } from 'node:worker_threads';
import { TextEncoder, TextDecoder } from 'node:util';
import { JSDOM, VirtualConsole } from 'jsdom';
import vm from 'node:vm';
test('isolated outside-only ReactDOM interaction probe', {timeout:30000}, async () => {
  const channels = new Set();
  class OwnedChannel extends MessageChannel {
    constructor() { super(); channels.add(this); this.port1.unref(); this.port2.unref(); }
  }
  const virtualConsole = new VirtualConsole();
  virtualConsole.forwardTo(console);
  const dom = new JSDOM('<!doctype html><html><body></body></html>',{url:'https://example.invalid/frame-transform-studio/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole});
  Object.assign(dom.window,{MessageChannel:OwnedChannel,TextEncoder,TextDecoder,IS_REACT_ACT_ENVIRONMENT:true});
  let timer;
  try {
    const style = dom.window.document.createElement('style');
    style.textContent = await readFile(new URL('../src/style.css',import.meta.url),'utf8');
    dom.window.document.head.append(style);
    const bundle = await readFile(new URL('../build/checks/dom/probe.js',import.meta.url),'utf8');
    vm.runInContext(bundle,dom.getInternalVMContext(),{timeout:5000,filename:'frame-dom-probe.js'});
    const result = await Promise.race([dom.window.__probe,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('DOM probe deadline')),25000);})]);
    assert.ok(result.checks >= 18,`Expected substantive DOM checks, got ${result.checks}`);
  } finally {
    clearTimeout(timer);
    dom.window.close();
    for(const channel of channels) { channel.port1.close(); channel.port2.close(); }
    channels.clear();
  }
});
