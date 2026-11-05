---
name: Frame Transform Studio
description: "Maquete técnica para poses rígidas / A technical maquette for rigid poses"
colors:
  active: "#235bd4"
  ground: "#f3f6f7"
  surface: "#fff"
  ink: "#202b36"
  muted: "#465663"
  support: "#4c5d6a"
  line: "#c5d0d7"
  button-border: "#b9c5ce"
  selected-surface: "#e4ecfc"
  selected-ink: "#173f96"
  object: "#e1e8eb"
  object-selected: "#d5e2ff"
  object-edge: "#52626e"
  parent-link: "#67747e"
  axis-x: "#b33436"
  axis-y: "#267343"
typography:
  title:
    fontFamily: "'Public Sans Variable', sans-serif"
    fontSize: "18px"
    fontWeight: 650
    lineHeight: 1.3
  heading:
    fontFamily: "'Public Sans Variable', sans-serif"
    fontSize: "16px"
  subheading:
    fontFamily: "'Public Sans Variable', sans-serif"
    fontSize: "14px"
    fontWeight: 650
  body:
    fontFamily: "'Public Sans Variable', sans-serif"
    fontSize: "14px"
    lineHeight: 1.5
  label:
    fontFamily: "'Public Sans Variable', sans-serif"
    fontSize: "14px"
    fontWeight: 550
  support:
    fontFamily: "'Public Sans Variable', sans-serif"
    fontSize: "12px"
  numeric:
    fontFamily: "'Public Sans Variable', sans-serif"
    fontSize: "13px"
  matrix:
    fontFamily: "ui-monospace, monospace"
    fontSize: "12px"
    lineHeight: 1.9
rounded:
  button: "5px"
  field: "4px"
  row: "3px"
spacing:
  compact: "6px"
  related: "8px"
  control: "12px"
  group: "14px"
  panel: "16px"
  workspace: "20px"
  separated: "24px"
components:
  button-neutral:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "8px 11px"
  button-primary:
    backgroundColor: "{colors.active}"
    textColor: "{colors.surface}"
    rounded: "{rounded.button}"
    padding: "8px 11px"
  button-pressed:
    backgroundColor: "{colors.active}"
    textColor: "{colors.surface}"
    rounded: "{rounded.button}"
    padding: "8px 11px"
  text-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "8px"
  numeric-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "7px 5px"
  hierarchy-row-selected:
    backgroundColor: "{colors.selected-surface}"
    textColor: "{colors.selected-ink}"
    rounded: "{rounded.row}"
  matrix-readout:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    typography: "{typography.matrix}"
    padding: "10px 4px"
---

# Design System: Frame Transform Studio

## Overview

**Creative North Star: "Maquete técnica / Technical maquette"**

**PT-BR.** A bancada clara coloca quadros, relações de parentesco e poses no centro do trabalho. Hierarquia e inspetor enquadram uma cena contínua; medidas e matrizes explicam a geometria. “Maquete técnica” é a direção provisória escolhida pelo responsável sob delegação, sem confirmação humana dessa escolha estética. React, trabalho por código e aplicações 3D profissionais são escolhas confirmadas.

**EN.** A daylight desk puts frames, parent relations and poses at the centre of the task. Hierarchy and inspector frame a continuous scene; measurements and matrices explain geometry. “Technical maquette” is the provisional direction chosen by the owner under delegated authority, without human confirmation of that visual choice. React, a code-first workflow and professional 3D applications are confirmed choices.

**Evidence / Evidência.** This record derives from actual CSS, React components, core axis colours and the built artifact. It preserves the technical document's limits: no desktop/mobile captures, real WebGL pixels, gestures, picking, rendered responsiveness, font rendering, focus traversal, screen-reader output or rendered contrast were observed. Visual finish remains pending with `recapture`; this document does not close it. Static detection, DOM/scene-object tests and an independent code review do not constitute visual or accessibility approval. / Registro da fonte, com revisão visual pendente.

**Key Characteristics:**

- Cena contínua entre hierarquia e inspetor / Continuous scene between hierarchy and inspector.
- Neutros claros, seleção azul e eixos identificados / Light neutrals, blue selection and identified axes.
- Poses locais e globais inspecionáveis / Inspectable local and world poses.
- Prévia explícita, aplicação deliberada e alternativa 2D / Explicit preview, deliberate commit and 2D alternative.

## Colors

O azul é o acento da interface; vermelho e verde são sinais dos eixos, com funções geométricas. Neutros frios separam controles, plano e objetos. Os valores normativos estão no frontmatter. / Blue is the interface accent; red and green are axis signals with geometric functions. Cool neutrals separate controls, plane and objects. The frontmatter owns normative values.

### Primary

- **Azul ativo / Active blue — `active`:** ações primárias, modos pressionados, foco, eixo Z, origem e arestas selecionadas / Primary actions, pressed modes, focus, Z axis, selected origin and edges.
- **Seleção da hierarquia / Hierarchy selection — `selected-surface`, `selected-ink`:** fundo e texto da linha selecionada / Selected row background and text.
- **Objeto selecionado / Selected object — `object-selected`:** preenchimento da geometria selecionada / Selected geometry fill.

### Secondary

- **Eixo X / X axis — `axis-x`:** segmentos X na cena, projeção e SVG exportado / X segments in scene, projection and exported SVG.
- **Eixo Y / Y axis — `axis-y`:** segmentos Y nas mesmas representações / Y segments in the same representations.

### Neutral

- **Bancada e superfície / Desk and surface — `ground`, `surface`:** raiz, cena, projeção e matrizes; controles e barras / Root, scene, projection and matrices; controls and bars.
- **Tintas / Inks — `ink`, `muted`, `support`:** texto principal, ajuda e contexto auxiliar / Main text, help and supporting context.
- **Limites / Boundaries — `line`, `button-border`:** divisórias, bordas de botões e regiões de documento / Dividers, button borders and document regions.
- **Geometria / Geometry — `object`, `object-edge`, `parent-link`:** cubos neutros, arestas e ligações de parentesco / Neutral cubes, edges and parent links.

**The Axis Identity Rule.** X, Y e Z mantêm as mesmas cores na cena e nas projeções; a legenda textual informa a convenção. / X, Y and Z retain the same colours in scene and projections; the text legend states the convention.

As rampas do sidecar são prévias sintetizadas de oito tons OKLCH, não cores adicionais adotadas na aplicação. Nenhum contraste em contexto renderizado foi medido. / Sidecar ramps are synthesized eight-step OKLCH previews, not additional adopted application colours. No contrast in rendered context was measured.

## Typography

Public Sans Variable é importada do pacote local em `src/main.tsx`, com fallback sans-serif. A interface usa uma família; monospace fica em matrizes e documentos JSON/SVG. / Public Sans Variable is imported from the local package in `src/main.tsx`, with a sans-serif fallback. The interface uses one family; monospace stays in matrices and JSON/SVG documents.

### Hierarchy

- **Title:** título compacto do produto / Compact product title.
- **Heading:** seções principais; o contexto selecionado também usa (16px), peso (600) / Main sections; selected context also uses (16px), weight (600).
- **Subheading:** grupos internos do inspetor / Internal inspector groups.
- **Body / Label:** texto-base e rótulos; legenda de fieldset usa peso (550) / Base text and labels; fieldset legends use weight (550).
- **Support:** IDs, ajuda, convenções e estado / IDs, help, conventions and status.
- **Numeric:** campos compactos; a regra intermediária usa (12px), e o móvel aumenta para (16px) / Compact fields; the intermediate rule uses (12px), and mobile increases to (16px).
- **Matrix:** matrizes de quatro linhas; textarea de documentos usa (13px) / Four-row matrices; document textarea uses (13px).

**The Inspectable Number Rule.** Campos numéricos, poses, matrizes e progresso usam algarismos tabulares; matrizes preservam alinhamento e rolagem horizontal. / Numeric fields, poses, matrices and progress use tabular numerals; matrices preserve alignment and horizontal scrolling.

## Layout

**PT-BR.** A grade padrão usa (190px), `minmax(320px, 1fr)` e (340px) para hierarquia, cena e inspetor. A cena é sticky no desktop, com altura `calc(100dvh - 84px)` e mínimo de (500px). O palco interno tem mínimo de (310px). A largura central é residual, sem fração fixa de dois terços.

**EN.** The default grid uses (190px), `minmax(320px, 1fr)` and (340px) for hierarchy, scene and inspector. The desktop scene is sticky, with height `calc(100dvh - 84px)` and a (500px) minimum. The inner stage has a (310px) minimum. Centre width is residual, without a fixed two-thirds fraction.

**PT-BR.** A partir de (1500px), colunas usam (210px), `minmax(500px, 1fr)` e (350px). Entre (761px) e (1000px), usam (155px), `minmax(260px, 1fr)` e (300px), com paddings menores. Até (760px), a barra quebra linhas, a grade vira coluna e o palco declara altura de (340px), sem sticky.

**EN.** At (1500px) and above, columns use (210px), `minmax(500px, 1fr)` and (350px). Between (761px) and (1000px), they use (155px), `minmax(260px, 1fr)` and (300px), with smaller padding. Up to (760px), the toolbar wraps, the grid becomes a column and the stage declares a (340px) height without sticky positioning.

**PT-BR.** No móvel, a navegação de Objetos, Propriedades e Planta fica antes da área de trabalho; a cena aparece antes do painel selecionado. A hierarquia usa botões indentados em (12px) por nível. Translações usam três colunas e quaternion usa quatro. O documento de importação/exportação abre abaixo da área de trabalho, sem modal. Essas são regras da fonte, ainda sem inspeção de layout real.

**EN.** On mobile, Objects, Properties and Plan navigation precedes the workspace; the scene appears before the selected panel. Hierarchy buttons indent by (12px) per level. Translation uses three columns and quaternion uses four. Import/export documents open beneath the workspace without a modal. These are source rules, pending inspection of actual layout.

Grupos usam a escala do frontmatter, divisórias e padding. O inspetor separa seções com margem superior de (22px) e padding superior de (20px). / Groups use the frontmatter scale, dividers and padding. Inspector sections use (22px) top margin and (20px) top padding.

## Elevation & Depth

Superfícies DOM separam-se por fundo e borda, sem sombras externas. A profundidade pertence aos cubos, eixos, ligações e grade real no plano XY; luz ambiente/direcional e rugosidade (.85) modelam os objetos. Essa aparência ainda não foi observada em WebGL. / DOM surfaces separate through background and border, without outer shadows. Depth belongs to cubes, axes, links and the real grid on the XY plane; ambient/directional light and roughness (.85) shape the objects. This appearance has not been observed in WebGL.

**The Spatial Depth Rule.** Preserve controles planos e deixe geometria, arestas e relações espaciais explicar a profundidade. / Preserve flat controls and let geometry, edges and spatial relations explain depth.

A hierarquia existente acrescenta uma faixa interna esquerda de (3px) via box-shadow à seleção. Ela não é token de elevação nem convenção aprovada: por equivaler a uma faixa lateral espessa em item de lista, não foi canonizada para novos componentes. / The existing hierarchy adds a (3px) inset left stripe through box-shadow to selection. It is neither an elevation token nor an approved convention: as a thick side stripe on a list item, it was not canonized for new components.

## Shapes

Botões usam cantos do token `button`; campos usam `field` e linhas usam `row`. Bordas comuns têm um pixel. O marcador de hierarquia é um pequeno quadrado rotacionado em CSS; ações usam Lucide com ícones de botão de (17px). Cubos, eixos e projeções são geometria do documento. / Buttons use `button` corners; fields use `field` and rows use `row`. Common borders are one pixel. The hierarchy mark is a small CSS-rotated square; actions use Lucide with (17px) button icons. Cubes, axes and projections are document geometry.

## Components

### Buttons and focus

Botões neutros são brancos; hover muda fundo e borda. Primário e pressionado usam azul sólido e texto branco. Desabilitado usa opacidade (.5) e cursor de indisponibilidade; sua legibilidade não foi verificada em pixels. Foco visível usa contorno azul de (3px), afastado em (3px). / Neutral buttons are white; hover changes fill and border. Primary and pressed use solid blue with white text. Disabled uses opacity (.5) and an unavailable cursor; its pixel legibility was not verified. Visible focus uses a (3px) blue outline with (3px) offset.

Botões e campos declaram mínimo de (44px). Resumos de matrizes declaram (40px), um detalhe existente que não estabelece meta para novos controles. / Buttons and fields declare a (44px) minimum. Matrix summaries declare (40px), an existing detail that does not set a target for new controls.

### Hierarchy and selected context

Linhas mostram rótulo e ID, com mínimo de (58px) e indentação por profundidade. A seleção muda fundo/tinta, o contexto mostra ID e rótulo e a cena destaca material/arestas. Não há drag-and-drop nem gizmo de edição; campos DOM autorizam mudanças. / Rows show label and ID with a (58px) minimum and depth indentation. Selection changes fill/ink, context shows ID and label, and scene highlights material/edges. There is no drag-and-drop or editing gizmo; DOM fields authorize changes.

### Fields and matrices

Rascunhos mantêm rótulo, translação e quaternion separados da pose aceita. Aplicar valida o conjunto. Trocar pai é ação explícita que preserva o instante global; matrizes local/global têm resumos nativos, entrelinha ampla e overflow horizontal. A leitura é por linhas; armazenamento/exportação é por colunas. / Drafts keep label, translation and quaternion separate from the accepted pose. Apply validates the set. Reparent is an explicit action preserving the static world pose; local/world matrices have native summaries, generous line height and horizontal overflow. Display is by rows; storage/export is by columns.

### Captures and preview

Capturas A/B guardam poses locais aceitas. Slider de (0–1), passo (.01), e botões de (10%) permitem inspeção manual. Reproduzir é uma ação de uma única passagem de (5s), com cancelamento ao parar, mudar seleção, executar comandos ou desmontar. Movimento reduzido interrompe e desabilita reprodução, mantendo controle manual. / A/B captures retain accepted local poses. A (0–1) slider, step (.01), and (10%) buttons allow manual inspection. Play is a single (5s) pass, cancelled on stop, selection change, commands or unmount. Reduced motion stops and disables playback, retaining manual control.

**The Preview Boundary Rule.** A prévia altera cena, projeção e leitura de matrizes; histórico e exportações continuam usando a pose aceita até Aplicar prévia. O contexto informa esse estado em texto. / Preview changes scene, projection and matrix readouts; history and exports continue using the accepted pose until Apply preview. Context states that boundary in text.

### View modes and fallback

Modo câmera monta OrbitControls apenas quando ligado; concluir ou Escape desmonta controles e restaura `touchAction: auto`. A fonte usa renderização sob demanda e DPR (1–1.5), sem giro automático ou amortecimento. Exceção, indisponibilidade ou perda de contexto levam à projeção 2D; o usuário pode tentar 3D novamente. / Camera mode mounts OrbitControls only while enabled; finish or Escape unmounts controls and restores `touchAction: auto`. Source uses demand rendering and DPR (1–1.5), without automatic spin or damping. Exceptions, unavailability or context loss lead to the 2D projection; the user can retry 3D.

A projeção é isométrica, não um desenho cotado. Grupos oferecem clique, sem handlers de teclado; botões da hierarquia oferecem seleção por teclado. Esse limite não é um padrão completo de acessibilidade. / Projection is isometric, not a dimensioned drawing. Groups offer clicks without keyboard handlers; hierarchy buttons offer keyboard selection. That limit is not a complete accessibility pattern.

O ajuste de câmera usa a esfera dos centros globais com margem para os eixos/cubos; considera o menor semiângulo dos campos de visão vertical e horizontal e reaplica o ajuste ao mudar o tamanho da viewport. O limite de afastamento mantém a esfera antes do plano distante. Escape no modo câmera ativo devolve o foco ao botão; fora desse modo não desloca o foco. Esses comportamentos têm regressões de matemática/objetos e DOM, sem observação em pixels. / Camera fit uses a padded world-origin sphere and the smaller vertical/horizontal half-FOV, refitting on viewport resize. Zoom-out keeps the sphere before the far plane. Escape from active camera mode returns focus to its toggle; inactive Escape leaves focus alone. Math/scene-object and DOM regressions cover these behaviors, without rendered-pixel evidence.

### Documents, status and recovery

Importar abre arquivo/rascunho em linha; exportar mostra o documento aceito e um link para salvar. Não há persistência local automática. Estado e alerta nomeiam falhas e preservação do documento; fechar o alerta é explícito. Textos PT-BR/EN mudam com o idioma sem alterar a geometria. / Import opens an inline file/draft region; export shows the accepted document and a save link. There is no automatic local persistence. Status and alert name failures and document preservation; closing the alert is explicit. PT-BR/EN text changes with locale without changing geometry.

## Do's and Don'ts

### Do:

- **Do** manter cores e legenda consistentes entre eixos e representações / keep colours and legend consistent across axes and representations.
- **Do** distinguir pose aceita, rascunho e prévia em texto / distinguish accepted pose, draft and preview in text.
- **Do** preservar seleção DOM, matrizes, controles manuais e exportação sem GPU / preserve DOM selection, matrices, manual controls and export without a GPU.
- **Do** verificar PT-BR/EN, foco, zoom, fontes, toque, scroll e contexto perdido em browser real / verify PT-BR/EN, focus, zoom, fonts, touch, scroll and lost context in a real browser.

### Don't:

- **Don't** copiar a faixa interna de (3px) como nova convenção de seleção / copy the (3px) inset stripe as a new selection convention.
- **Don't** apresentar prévia ou projeção como documento aceito ou desenho cotado / present preview or projection as accepted document or dimensioned drawing.
- **Don't** tratar clique na projeção, detector, testes ou este documento como aprovação completa de teclado, visual ou acessibilidade / treat projection clicks, detector, tests or this document as complete keyboard, visual or accessibility approval.
