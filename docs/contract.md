# Development 0.1.0 contract

This is a deliberately bounded rigid-frame format and editor, not a general 3D scene/CAD/robot format. The contract applies to accepted documents; renderer state and drafts are not documents.

## Coordinates and arithmetic

- Right-handed, column vectors; positive Rz maps +X to +Y.
- Local pose `L = T × R`; child world `Wchild = Wparent × L`. Roots use `W = L`.
- Quaternion order is `[x,y,z,w]`. All entries must be finite. Admission requires `abs(x²+y²+z²+w²−1) <= 1e-10`, then capture normalizes. Zero and materially nonunit quaternions are rejected, not repaired.
- q and −q denote the same rotation. Capture chooses a canonical sign: positive w, or at w=0, a positive first nonzero x/y/z component. Exports preserve this accepted normalized representation.
- Translation components must be finite numbers with absolute value at most 1000 generic units. World coordinates can exceed this local bound through hierarchy composition.
- Matrices are derived from captured poses, column-major arrays of 16 binary64 values. The inspector displays rows for reading. No scale, shear or reflection is accepted.
- World preservation compares every matrix element with `abs(a−b) <= 1e-9 + 1e-12 * max(abs(a),abs(b))`. This is a numerical tolerance, not a physical accuracy guarantee.

## JSON schema

A document has exactly these fields:

```json
{
  "version": "0.1.0",
  "frames": [
    {
      "id": "root",
      "label": "Synthetic root",
      "parent": null,
      "pose": {
        "t": [0, 0, 0],
        "q": [0, 0, 0, 1]
      }
    }
  ]
}
```

Every object rejects extra or missing fields. Arrays must have exactly three/four elements for t/q. Strings, booleans, null or nonfinite values cannot stand in for numbers. Version must be the exact string `0.1.0`. Unknown derived caches are rejected rather than trusted.

- 0–64 frames. Multiple roots are allowed.
- IDs are unique, case-sensitive ASCII matching `[A-Za-z][A-Za-z0-9_-]{0,31}`. IDs are not editable in the UI after creation; added frames use the first available f1, f2, etc.
- Labels are nonempty, at most 128 UTF-8 bytes. XML 1.0 character ranges are accepted: tab, LF, CR, U+0020–D7FF, E000–FFFD, 10000–10FFFF. Unpaired surrogates and prohibited controls are rejected. Labels are data, never HTML.
- Parent is null or a known ID. No cycles. Root depth is 1; maximum depth is 16.
- Import text is limited to 262144 UTF-8 bytes. An initial UTF-16 length check avoids encoding arbitrarily large strings; a UTF-8 check occurs before JSON.parse. Local files are checked by File.size before reading too.

JSON.parse still performs ordinary decoding. There is no pre-decoder nesting/RSS sandbox, streamed parser or guaranteed memory ceiling for the JavaScript engine. JSON object duplicate-key behavior is the native parser's last-value behavior; duplicate frame IDs are rejected. This is not a claim of broad JSON security-profile compliance.

## State, atomicity and commands

Accepted documents are sorted by ASCII ID and deeply frozen. The store owns selection and at most 20 undo snapshots, each containing document and selection. Selection alone is UI state and adds no undo snapshot. A successful document command adds one snapshot, including a valid no-op command; undo restores the previous snapshot. There is no redo.

Commands validate completely before committing:

- Add a frame with valid parent/ID/pose and graph caps.
- Remove only an existing leaf. If selected, selection moves to its parent, otherwise the first remaining sorted frame, otherwise null.
- Edit an existing frame's label and local pose together.
- Reparent an existing frame to an existing parent or null. Validate prospective graph, then compute `Lnew = inverse(WnewParent) × WoldChild` at the **current accepted static pose**. Reject out-of-bounds resulting local translation. Recompute matrices and verify world preservation before commit, including descendants.
- Import replaces the document. Preserve selected ID if still present; otherwise choose first sorted ID or null.

Unknown IDs, cycles, invalid poses, invalid imports, cap violations and numerical preservation failures leave canonical JSON, selection and undo count/content untouched. Draft text, playback state, UI error messages and preview are not part of this atomicity guarantee. A rejected edit pauses playback and removes a preview but does not commit it. Core error codes are translated by the UI; errors are not silently clamped.

## Local pose comparison

A and B are explicit captures of the selected frame's accepted **local** pose. Translation uses linear interpolation. Rotation uses shortest-arc SLERP, flips the interpolation representation when dot < 0 and uses normalized lerp for dot > 0.9995. At t=0/1 the exact captured pose object is returned, including its quaternion representation. t must be finite in [0,1].

Slider steps are 0.01; buttons change 0.1, clamped to endpoints. Playback is optional, five seconds, one-shot, never mandatory under reduced motion. All document commands pause playback before attempting mutation. Selection clears comparison. Reparent also clears captures because the local basis changes. Captures survive ordinary pose edits to enable capturing distinct endpoints.

Preview affects renderers and displayed matrices only. Canonical document, exports and history stay unchanged until Apply preview. Reparent operates on accepted static pose, not on an uncommitted preview and not on an entire animation.

## Exports

JSON emits only accepted version/frames/local poses, sorted by ASCII ID, with fixed property order, two-space indentation and final newline. Native JSON number formatting is used; −0 serializes as 0. Capture normalization can change numeric spelling from an imported file, so import/export is not a byte-preserving archive. Subsequent exports of unchanged accepted state are deterministic. Matrices are always recomputed, never imported.

SVG exports accepted poses through a fixed isometric projection `(sqrt(3)/2*(x−y), (x+y)/2−z)`, uniformly fitted into a 640×420 drawing region. Axis segments represent 0.85 generic units. It includes ID labels and an ID/display-label legend; coordinates use six decimal places. Height grows at most to 1858 pixels for the legend. It escapes XML metacharacters and contains no script, external URL, foreignObject, font fetch or imported markup. Namespace URI is an XML namespace identifier, not a fetched resource. Export is locale/selection independent. UI projection can show the preview and selected highlight separately.

## Locale, runtime and scope

PT-BR is default; EN is complete UI text, errors and statuses. Locale does not change labels, captured geometry, store selection, undo, JSON or SVG. The interface uses generic units; labels and typed numeric input are not locale-formatted geometry. Numeric inputs accept at most 64 characters of decimal/scientific notation (optional sign, decimal point and exponent). Hexadecimal/binary prefixes, blank values and comma decimal notation are rejected.

No network API, telemetry, tracking, arbitrary model/script import, physical controller, authentication or persisted user data. Local static assets only. No claims of engineering certification, production readiness, full SVG/CAD interchange or browser accessibility compliance. Real responsive/WebGL/pointer/accessibility QA is still required on a browser host; DOM and scene-object tests are narrower evidence.

Quaternion capture normalizes the admitted unit quaternion and chooses positive w; at w=0, the first nonzero x/y/z component is positive. This deterministic representation makes identity-to-(0,0,±1,0) take the same +90° halfway rotation. Exact interpolation endpoints are the accepted, normalized poses.
