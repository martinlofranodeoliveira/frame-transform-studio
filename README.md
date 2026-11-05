# Frame Transform Studio

Development version **0.1.0** — an original Lofrano Tecnologia rigid-frame editor, MIT licensed. Inspect a synthetic hierarchy, edit local poses, inspect global matrices and compare two captured local poses. The application uses real React Three Fiber / Three.js geometry, not CSS perspective. Portuguese is the default interface; the English switch changes only UI text.

[Português](README.pt-BR.md) · [Contract](docs/contract.md) · [Design](docs/design.md) · [Lofrano Tecnologia](https://lofranotecnologia.com.br)

## Install and use

Node 22 or later is required; the supplied dependency tuple targets Node 22.23.4 / npm 10.9.9. Direct dependencies are exact versions. The npm-generated lock is committed; `npm ci` consumes the recorded dependency graph without rewriting it. Install dependencies before running the local checks.

```sh
npm ci --ignore-scripts
npm run dev
```

Open `http://127.0.0.1:5173/frame-transform-studio/`.

```sh
npm run typecheck
npm test
npm run demo -- --assert
npm run demo -- --assert --json
npm run build
npm run preview
```

Preview uses `http://127.0.0.1:4173/frame-transform-studio/`. Build output is static and configured for `/frame-transform-studio/`. Assets and variable Public Sans fonts are local build assets. Once dependencies are installed, tests, demo and build require no service or model/API. Serving the built assets requires no runtime external requests. This is not a service-worker app: a first visit still needs access to the local/static server.

## Operate

- Select `A (arm)` in the hierarchy or click its 3D cube. Its world origin starts at `[2, 1, 0]`. The same selection highlights the scene and the 2D plan.
- Enter local translation and a unit quaternion in **xyzw** order, then apply. Invalid drafts remain editable and do not replace the accepted document.
- Select `B (target)` as the new parent of A, then reparent preserving world. A's new local translation is `[-2, 2, 0]`; its descendant Tool remains at `[0, 1, 0]` globally.
- Capture applied pose A, edit a different pose, press **Apply pose and label**, then capture applied pose B. The form identifies unapplied changes; captures and comparison controls remain disabled while fields differ from the accepted pose. Editing stops and cancels preview so a preview commit cannot overwrite a pending draft. Use the slider or 10% buttons. This is a **preview**, not an edit: JSON/SVG exports and undo remain tied to accepted state. **Apply preview** makes one undoable edit.
- Optional playback is a single five-second run. Reduced motion disables playback but keeps all manual controls. Editing, selecting, importing, reparenting and Escape pause playback.
- Camera gestures are opt-in. **Camera mode** mounts OrbitControls; **Finish camera (Esc)** disconnects them. Selection mode has no connected camera controls. Numerical editing does not require a gizmo.
- Use **Use 2D plan** at any time. Missing WebGL, rendering errors and context loss lead to the DOM/2D path. Retry 3D explicitly. The hierarchy, inspector, comparison, import/export and undo remain available without a GPU.
- JSON/SVG toolbar actions prepare a read-only export and a **Save file** link. Exported content is a snapshot from the moment the action was selected. Import accepts a local file or pasted JSON and validates before replacing the entire document.

On narrow layouts the bounded geometry area remains above **Objects / Properties / Plan** navigation. Every model operation has a labelled native DOM control. User labels are plain text; visible frame IDs disambiguate duplicate labels. No data is saved automatically; save an export before closing the page.

## Small code example

The independent core can be used without React or Three:

```ts
import { Store, exportJSON, point, worlds } from './src/core';
import { seed } from './src/seed';

const store = new Store(seed());
store.select('arm');
store.reparent('arm', 'target');
const origin = point(worlds(store.doc).get('arm')!, [0, 0, 0]);
// approximately [2, 1, 0]
const text = exportJSON(store.doc);
store.import(text);
```

The headless demo prints human-readable results and accepted JSON. `--json` emits a machine-readable report instead. Expected report:

```json
{
  "version": "0.1.0",
  "synthetic": true,
  "armWorld": [2, 1, 0],
  "newLocal": [-2, 2, 0],
  "toolWorld": [0, 1, 0],
  "halfwayX": [0, 1, 0],
  "assertions": "passed"
}
```

This is expected output, not a recorded execution claim. Failed demo assertions return a nonzero exit status; unknown options return status 2.

## Contract and rationale

Right-handed coordinates, column vectors, `L = T × R`, `W = P × L`; binary64 arithmetic and column-major matrices. Local translations are limited to ±1000 generic units, with at most 64 frames, depth 16 and 20 undo snapshots. Only unit rigid poses are admitted; there is no scale, shear, reflection, physics or robot control. See the precise schema and tolerance in [docs/contract.md](docs/contract.md).

Pure math and validated documents authorize every renderer. Three is an adapter and an independent test oracle, not the implementation of the core math. There is no runtime account, CDN, model fetch, arbitrary mesh/script import, telemetry, credential or external API.

## Verification scope and limitations

The test command strictly typechecks, bundles executable Node tests through Vite SSR, builds a separate ReactDOM probe and runs Node's test runner. It covers literal/exhaustive geometry cases, independent Three comparisons, adversarial imports, atomic commands, undo, both locales, real ReactDOM interaction in an isolated JSDOM realm and actual R3F scene objects. The CLI demo independently asserts its literal results. The production build separately checks preservation of the opening HTML comment as the first body child and the repository base path.

These files are not a successful test/build record. JSDOM and the R3F test renderer are **not evidence of real WebGL rendering, browser gestures, visual quality, font rendering, responsive behavior or accessibility conformance**. A browser host is unavailable for real rendered QA. Those checks still need real devices/browsers. The upstream Three.Clock deprecation warning in scene tests is not suppressed.

No production readiness, physical safety, manufacturing suitability, broad format/standards compliance or certification is claimed. Import byte bounds are enforced before JSON decoding; this is not a pre-decoder recursion or RSS sandbox. SVG is a deliberately small self-contained isometric projection, not a CAD interchange format. No persistent storage or whole-animation world-preserving reparent guarantee is provided.

Original application code: MIT, copyright 2026 Lofrano Tecnologia. Public Sans assets retain OFL-1.1; Lucide retains ISC; dependency licenses are not replaced by the application license. Security reports: [GitHub private vulnerability reporting](https://github.com/martinlofranodeoliveira/frame-transform-studio/security/advisories/new). General contact: [official homepage](https://lofranotecnologia.com.br).

The production build emits `third-party-notices.txt` and `third-party-sources.json`, linked from the footer. They contain actual retained JavaScript package notices and the imported Public Sans font license, with source filenames and SHA-256 hashes. The Fiber tarball omits LICENSE; its exact-version upstream license is retained in `dependency-notices/` with provenance. No claim is made that minification preserves every original banner.
