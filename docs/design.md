# Design and implementation notes

Development version 0.1.0. This describes source decisions, not a visual acceptance verdict.

## Authority and spatial task

The pinned technical-maquette direction uses seed `325ed87b`. It was provisionally selected under delegated implementation authority, not approved by a human preference review. React and a code-first real-3D implementation are explicit product choices. The interface is an operating tool, not a marketing page.

A daylight workspace uses ground `#f3f6f7`, ink `#202b36`, active `#235bd4`, bounded inspector surfaces and pale spatial cubes with visible edges. Public Sans variable is self-hosted through `@fontsource-variable/public-sans/wght.css`. Icons come from Lucide. Font and icon licenses remain OFL-1.1 and ISC respectively. The original source license is MIT.

Desktop places a narrow hierarchy beside a dominant continuous scene and a numerical inspector. A modest toolbar and compact status bound the workspace. At narrow widths the scene has a bounded upper height and Object/Properties/Plan navigation exposes the corresponding DOM panels. Frame IDs remain visible in hierarchy, selected context and projection. The initial synthetic hierarchy demonstrates a rotated parent, child, descendant and alternate parent immediately.

## Authoritative data flow

`core.ts` has no Three, React or browser import. Its validator captures immutable poses, validates the complete graph, and returns sorted, frozen documents. `Store` validates candidates and checks reparent world preservation before changing document, selection or undo history. A maximum of 20 frozen snapshots bounds retained model memory.

Three adapters consume core-derived column-major matrices. Scene frames are flattened into world-space groups so renderer parenting cannot silently redefine conventions. Picking returns a frame ID to the same selection path used by hierarchy buttons. Numerical DOM fields, not renderer controls, authorize edits. No transform gizmo is offered.

The SVG/React projection shares a core isometric layout function. Its fitted coordinates retain orientation and relative lengths under one uniform projection scale. It is not a dimensioned drawing: exact poses and matrices are in the inspector and JSON. Export SVG includes escaped IDs/labels and a legend, no external resources or foreignObject.

## Preview is not accepted state

Captures A and B reference immutable accepted local poses of the selected frame. Edits can occur between captures. Selection changes, import, add/remove, undo and reparent clear captures. Pose edits retain captures so two distinct endpoints can be captured. Playback/stepping overlays a transient pose for scene, projection and matrix inspection without touching canonical state. Applying preview is one explicit undoable edit. Exports never serialize an overlay.

SLERP flips the second representation for shortest-arc interpolation, uses normalized lerp near coincidence and returns the exact captured endpoints at 0 and 1. Antipodal representations do not interpolate through a zero quaternion. One-shot playback is capped at five seconds of elapsed time. Request callbacks are canceled on stop/unmount and before document commands. Reduced-motion changes stop playback and disable play while retaining manual controls.

## Camera ownership and rendering

Canvas uses demand rendering with DPR between 1 and 1.5. There is no auto-rotation. Fit resets camera position/up/look-at around the padded world-origin sphere, using `radius / sin(min(verticalHalfFov, horizontalHalfFov)) * 1.12`; viewport width/height changes refit through the actual R3F size state. Orbit zoom-out is bounded before the far plane, including the largest admitted hierarchy. OrbitControls are **mounted only in explicit camera mode**. Finishing mode or Escape unmounts them; active-mode Escape returns focus to the toggle while inactive Escape does not move focus; Drei owns disconnect/disposal, while the canvas lifecycle restores `touchAction: auto`. Merely disabling controls would not release their wheel/touch connections and is intentionally not used. Context loss unregisters the scene through fallback; event listeners and callbacks have cleanup paths. R3F owns geometry/material disposal at unmount.

The default path permits page scrolling without a connected OrbitControls instance. This is an implementation intention, not a claim that real gestures were tested. Camera mode explains that drag/wheel are captured and exposes a visible finish button.

## Error and empty states

Invalid drafts retain their input and show localized actionable faults while accepted geometry remains intact. File size is checked before reading and the core checks UTF-8 bytes before JSON.parse. Asynchronous file reads are ignored after closure, a newer read or unmount. No storage is used, so there are no hidden persistence or quota assumptions. A user must explicitly export to keep work.

Empty documents are valid and can add a root. Rendering exceptions, missing WebGL and context loss switch to the usable 2D/DOM path. A retry control attempts a new 3D mount. A Suspense loading message exists for scene initialization. There is no network asset loading state because there are no network scene assets.

## Evidence boundaries

The source includes independent literal/exhaustive core tests, actual ReactDOM interactions in a JSDOM outside-only realm, and actual R3F test-renderer scene-object assertions. Node tests use Vite SSR bundling to avoid upstream extensionless declaration/runtime resolution issues. The DOM probe bundles its own React into the isolated realm; no host window/document is installed globally. Its worker_threads MessageChannels are tracked, unreferenced and closed by the host. The upstream Three.Clock warning is left visible.

A browser host is unavailable: real WebGL pixels, pointer/touch/scroll behavior, context recovery on real hardware, mobile layout, focus order, screen-reader operation, font rendering and visual contrast still require real browser QA. Automated DOM/scene assertions do not substitute for that work. No screenshot review, finished-design verdict or accessibility certification is claimed.

The opening HTML direction comment is developer material only. The Vite plugin preserves it as the first body child, and the build script asserts the exact comment, five named blocks, seed and word cap in production output. It is not rendered in product controls. There is deliberately no finish-review artifact claiming an unobserved review.

Quaternion capture normalizes the admitted unit quaternion and chooses positive w; at w=0, the first nonzero x/y/z component is positive. This deterministic representation makes identity-to-(0,0,±1,0) take the same +90° halfway rotation. Exact interpolation endpoints are the accepted, normalized poses.
