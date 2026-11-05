import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const mode = process.argv[2];
function execute(args) {
  const child = spawnSync(process.execPath,args,{stdio:'inherit',timeout:120000,env:mode === 'test' ? {...process.env,NODE_ENV:'development'} : process.env});
  if (child.error) throw child.error;
  if (child.status !== 0) process.exit(child.status ?? 1);
}
if (mode === 'test') {
  await build({configFile:false,envDir:false,plugins:[react()],define:{'process.env.NODE_ENV':JSON.stringify('development')},build:{ssr:true,target:'es2022',outDir:'build/checks/node',emptyOutDir:true,minify:false,rollupOptions:{input:{core:'tests/core.test.ts',scene:'tests/scene.test.tsx'},output:{entryFileNames:'[name].mjs'}}}});
  await build({configFile:false,envDir:false,plugins:[react()],define:{'process.env.NODE_ENV':JSON.stringify('development'),'process.env.RTL_SKIP_AUTO_CLEANUP':JSON.stringify('true')},build:{target:'es2022',outDir:'build/checks/dom',emptyOutDir:true,minify:false,lib:{entry:'tests/dom.probe.tsx',name:'FrameProbe',formats:['iife'],fileName:()=> 'probe.js'}}});
  execute(['--test','--test-timeout=30000','build/checks/node/core.mjs','build/checks/node/scene.mjs','tests/host.test.mjs']);
} else if (mode === 'demo') {
  await build({configFile:false,logLevel:'error',build:{ssr:'src/demo.ts',target:'es2022',outDir:'build/checks/demo',emptyOutDir:true,minify:false,rollupOptions:{output:{entryFileNames:'demo.mjs'}}}});
  execute(['build/checks/demo/demo.mjs',...process.argv.slice(3)]);
} else if (mode === 'html') {
  const source = await readFile('index.html','utf8');
  const built = await readFile('dist/index.html','utf8');
  const comment = source.match(/<body>\s*(<!--[\s\S]*?-->)/)?.[1];
  assert.ok(comment,'Source body must start with the direction comment');
  assert.ok(comment.split(/\s+/).length <= 150,'Comment word cap');
  for (const block of ['THESIS','OWN-WORLD','STORY','FIRSTVIEWPORT','FORM','325ed87b']) assert.ok(comment.includes(block));
  assert.ok(comment.includes('FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md.'));
  assert.equal(built.match(/<body>\s*(<!--[\s\S]*?-->)/)?.[1],comment,'Production first body child must preserve the exact comment');
  assert.match(built,/\/frame-transform-studio\/assets\//);
  assert.doesNotMatch(built,/(?:src|href)=["']https?:\/\//);
  console.log('Production HTML contract verified. This is not a browser rendering check.');
} else { throw new Error('Expected test, demo or html'); }
