# Security

Frame Transform Studio 0.1.0 is a development tool for synthetic rigid-frame concepts. It is not a physical controller, safety system or certified engineering tool.

Report vulnerabilities privately through [GitHub private vulnerability reporting](https://github.com/martinlofranodeoliveira/frame-transform-studio/security/advisories/new). Include a minimal synthetic reproduction, affected version, expected/observed behavior and environment. Do not include real personal data, credentials or private client documents. No response-time guarantee is stated.

For general contact use [Lofrano Tecnologia's official homepage](https://lofranotecnologia.com.br).

## Boundaries

- Imports are local JSON only, checked for bytes before decoding and completely validated before state replacement.
- Ordinary JSON.parse is not a recursion/RSS sandbox. Do not treat this application as an isolation boundary for unlimited hostile computation.
- Text labels cannot become HTML. SVG is generated from validated data with XML escaping and has no external resources, scripts or foreignObject.
- No runtime API, account, credentials, telemetry, model fetch, arbitrary executable import or automatic persistence is implemented.
- Camera gesture capture is opt-in and can be exited visibly or with Escape; actual browser gesture QA remains necessary.
- Browser/OS, dependency and static host vulnerabilities remain separate concerns. A static build does not itself establish production readiness.

Only the current development line is described; no long-term support or certification is promised.
