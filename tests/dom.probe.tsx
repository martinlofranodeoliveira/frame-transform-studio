import React, {useState} from 'react';
import {CameraModeButton} from '../src/CameraModeButton';
import { render, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';
import { Store, exportJSON } from '../src/core';
import { seed } from '../src/seed';
function check(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
async function run() {
  const store = new Store(seed());
  const user = userEvent.setup({document});
  const view = render(<App initialStore={store} initialFallback />);
  const ui = within(view.container);
  let checks = 0;
  const ok = (value: unknown, message: string) => { check(value,message); checks++; };
  try {
    ok(ui.getByRole('img',{name:'Projeção isométrica dos quadros'}),'Portuguese fallback exists');
    await user.click(ui.getByRole('button',{name:'Tool (tool)'}));
    ok(ui.getByLabelText('Objeto selecionado').textContent==='tool · Tool','DOM selection updates context');
    const matrix = ui.getByLabelText('Matriz global').textContent!;
    ok(matrix.split('\n')[0].trim().endsWith('0.000000'),'Tool literal world X is zero');
    ok(matrix.split('\n')[1].trim().endsWith('1.000000'),'Tool literal world Y is one');
    const beforeLocale = [exportJSON(store.doc),store.selected,store.undoCount].join('|');
    await user.selectOptions(ui.getByLabelText('Idioma / Language'),'en');
    ok(document.documentElement.lang==='en','English document language');
    ok(ui.getByRole('button',{name:'Apply pose and label'}),'English editing control');
    ok([exportJSON(store.doc),store.selected,store.undoCount].join('|')===beforeLocale,'Locale does not mutate canonical state or history');
    const x = ui.getByRole('textbox',{name:'Local translation X'});
    await user.clear(x); await user.type(x,'1001');
    await user.click(ui.getByRole('button',{name:'Apply pose and label'}));
    ok(ui.getByRole('alert').textContent!.includes('finite translations'),'English actionable validation');
    ok([exportJSON(store.doc),store.selected,store.undoCount].join('|')===beforeLocale,'Rejected draft is atomic');
    await user.clear(x); await user.type(x,'0x10');
    await user.click(ui.getByRole('button',{name:'Apply pose and label'}));
    ok(ui.getByRole('alert').textContent!.includes('finite translations'),'Nondecimal coordinate syntax rejected');
    ok([exportJSON(store.doc),store.selected,store.undoCount].join('|')===beforeLocale,'Rejected hexadecimal input is atomic');
    await user.clear(x); await user.type(x,'1');
    await user.click(ui.getByRole('button',{name:'Capture current pose A'}));
    await user.click(ui.getByRole('button',{name:'Apply pose and label'}));
    await user.click(ui.getByRole('button',{name:'Capture current pose B'}));
    const accepted = exportJSON(store.doc), history = store.undoCount;
    await user.click(ui.getByRole('button',{name:'Forward 10%'}));
    ok((ui.getByRole('slider',{name:/Interpolation/}) as HTMLInputElement).value==='0.1','Manual 10% step');
    ok(exportJSON(store.doc)===accepted && store.undoCount===history,'Preview leaves accepted document and history untouched');
    await user.click(ui.getByRole('button',{name:'JSON'}));
    ok((ui.getByRole('textbox',{name:'Export JSON'}) as HTMLTextAreaElement).value===accepted,'Export uses accepted, not preview geometry');
    await user.selectOptions(ui.getByLabelText('New parent'),'target');
    await user.click(ui.getByRole('button',{name:'Reparent preserving world'}));
    ok(store.doc.frames.find(f=>f.id==='tool')!.parent==='target','DOM fallback reparent works');
    await user.click(ui.getByRole('button',{name:'SVG'}));
    ok((ui.getByRole('textbox',{name:'Export SVG'}) as HTMLTextAreaElement).value.startsWith('<svg'),'Fallback SVG export');
    await user.selectOptions(ui.getByLabelText('Idioma / Language'),'pt-BR');
    ok(ui.getByRole('button',{name:'Aplicar pose e rótulo'}),'Portuguese restored');
    await user.click(ui.getByRole('button',{name:'Importar'}));
    await user.type(ui.getByRole('textbox',{name:'Rascunho de importação'}),'invalid');
    const beforeImport = [exportJSON(store.doc),store.selected,store.undoCount].join('|');
    await user.click(ui.getByRole('button',{name:'Validar e importar'}));
    ok(ui.getByRole('alert').textContent!.includes('JSON inválido'),'Portuguese actionable error');
    ok([exportJSON(store.doc),store.selected,store.undoCount].join('|')===beforeImport,'Rejected import retains full state');
    await user.click(ui.getByRole('button',{name:'Adicionar quadro'}));
    ok(store.selected==='f1','Fallback add and selection linkage');
    const leaf = ui.getByRole('button',{name:'F1 (f1)'});
    leaf.focus(); await user.keyboard('{Enter}');
    ok(ui.getByLabelText('Objeto selecionado').textContent==='f1 · F1','Keyboard hierarchy selection');
    function Mode() {
      const [active,setActive] = useState(false);
      return <><CameraModeButton active={active} onChange={setActive} startLabel="Enter camera" finishLabel="Finish camera"/><input aria-label="Outside camera focus"/></>;
    }
    const modeView = render(<Mode/>);
    try {
      const controls = within(modeView.container);
      const toggle = controls.getByRole('button',{name:'Enter camera'});
      const outside = controls.getByRole('textbox',{name:'Outside camera focus'});
      await user.click(toggle); await user.click(outside);
      ok(toggle.getAttribute('aria-pressed')==='true','Explicit camera mode active');
      await user.keyboard('{Escape}');
      ok(toggle.getAttribute('aria-pressed')==='false' && document.activeElement===toggle,'Active Escape exits and returns focus to camera toggle');
      await user.click(outside); await user.keyboard('{Escape}');
      ok(document.activeElement===outside,'Inactive Escape does not steal focus');
    } finally {modeView.unmount();}
    return {checks};
  } finally { view.unmount(); cleanup(); }
}
Object.assign(globalThis,{__probe:run()});
