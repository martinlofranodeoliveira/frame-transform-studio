import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
const comment = readFileSync(new URL('./index.html',import.meta.url),'utf8').match(/<body>\s*(<!--[\s\S]*?-->)/)?.[1];
if (!comment) throw new Error('Missing opening body contract');
export default defineConfig({
  base: '/frame-transform-studio/',
  plugins: [react(), {
    name: 'retained-dependency-notices',
    generateBundle(_options, bundle) {
      const roots = new Set<string>();
      for (const item of Object.values(bundle)) {
        if (item.type !== 'chunk') continue;
        for (const id of Object.keys(item.modules)) {
          const at = id.lastIndexOf('/node_modules/');
          if (at < 0) continue;
          const tail = id.slice(at + 14).split('/');
          const name = tail[0].startsWith('@') ? tail.slice(0, 2).join('/') : tail[0];
          roots.add(id.slice(0, at + 14) + name);
        }
      }
      // The self-hosted font is a CSS asset, absent from JavaScript chunk modules.
      roots.add(join(dirname(fileURLToPath(import.meta.url)), 'node_modules/@fontsource-variable/public-sans'));
      const records = [...roots].map(root => {
        const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
        const files = readdirSync(root).filter(name => /^(?:licen[sc]e|copying)(?:[.\-_].*)?$/i.test(name));
        const sourceRoot = dirname(fileURLToPath(import.meta.url));
        const supplemental = JSON.parse(readFileSync(join(sourceRoot, 'dependency-notices/sources.json'), 'utf8')) as {package:string;version:string;file:string;source:string;sha256:string}[];
        const fallback = supplemental.find(f => f.package === pkg.name && f.version === pkg.version);
        if (!files.length && !fallback) throw new Error(`Missing dependency license text: ${pkg.name}`);
        const extra = files.length || !fallback ? [] : (() => {
          const text = readFileSync(join(sourceRoot, 'dependency-notices', fallback.file), 'utf8');
          if (createHash('sha256').update(text).digest('hex') !== fallback.sha256) throw new Error('Supplemental license digest changed');
          return [{file:fallback.source,text,sha256:fallback.sha256}];
        })();
        return { name: pkg.name as string, version: pkg.version as string, license: pkg.license,
          files: files.sort().map(file => { const text = readFileSync(join(root, file), 'utf8'); return { file, text, sha256: createHash('sha256').update(text).digest('hex') }; }).concat(extra) };
      }).sort((a,b) => a.name.localeCompare(b.name));
      const text = 'Third-party notices — Frame Transform Studio 0.1.0\nOriginal app source: MIT. Dependency licenses below remain separate.\nPackages retained in JavaScript chunks, plus the imported Public Sans font CSS/assets.\n\n' + records.map(r => `${r.name}@${r.version} (${JSON.stringify(r.license)})\n` + r.files.map(f => `Source: ${r.name}/${f.file}\nSHA-256: ${f.sha256}\n${f.text}`).join('\n')).join('\n\n====================\n\n');
      this.emitFile({ type:'asset', fileName:'third-party-notices.txt', source:text });
      this.emitFile({ type:'asset', fileName:'third-party-sources.json', source:JSON.stringify(records.map(({files,...r})=>({...r,files:files.map(({text,...f})=>f)})),null,2)+'\n' });
    }
  }, {
    name: 'preserve-opening-body-contract',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const html = bundle['index.html'];
      if (html?.type !== 'asset' || typeof html.source !== 'string') throw new Error('Missing production HTML');
      html.source = html.source.replace(/<!--[\s\S]*?-->/g, match => match.includes('325ed87b') ? '' : match).replace(/<body>/, `<body>\n${comment}`);
    }
  }],
  build: { target: 'es2022', sourcemap: false }
});
