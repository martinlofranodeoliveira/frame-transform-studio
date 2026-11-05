# Frame Transform Studio

Versão de desenvolvimento **0.1.0** — editor original de quadros rígidos da Lofrano Tecnologia, sob licença MIT. Inspecione uma hierarquia sintética, edite poses locais, consulte matrizes globais e compare duas poses locais capturadas. A aplicação usa geometria real React Three Fiber / Three.js, não perspectiva CSS. A interface começa em português; a troca para inglês altera apenas os textos da interface.

[English](README.md) · [Contrato](docs/contract.md) · [Projeto](docs/design.md) · [Lofrano Tecnologia](https://lofranotecnologia.com.br)

## Instalação e comandos

É necessário Node 22 ou superior. A matriz de dependências fornecida tem como alvo Node 22.23.4 / npm 10.9.9. As dependências diretas têm versões exatas. O lock gerado pelo npm está versionado; `npm ci` consome esse grafo sem reescrevê-lo. Instale as dependências antes de executar as verificações.

```sh
npm ci --ignore-scripts
npm run dev
```

Abra `http://127.0.0.1:5173/frame-transform-studio/`.

```sh
npm run typecheck
npm test
npm run demo -- --assert
npm run demo -- --assert --json
npm run build
npm run preview
```

A prévia usa `http://127.0.0.1:4173/frame-transform-studio/`. O build estático usa a subpasta `/frame-transform-studio/`. Fontes Public Sans variáveis e demais recursos são locais. Após instalar as dependências, testes, demo e build não precisam de serviços ou modelos/APIs. O uso dos arquivos servidos não exige requisições externas em tempo de execução. Não há service worker: a primeira visita ainda precisa alcançar o servidor local/estático.

## Uso

- Selecione `A (arm)` na hierarquia ou clique em seu cubo 3D. A origem global inicial é `[2, 1, 0]`. A seleção também destaca o objeto real da cena e a planta.
- Preencha translação local e quaternion unitário na ordem **xyzw** e aplique. Um rascunho inválido continua editável sem substituir o documento aceito.
- Escolha `B (target)` como novo pai de A e preserve o mundo. A translação local passa a `[-2, 2, 0]`; o descendente Tool mantém a origem global `[0, 1, 0]`.
- Capture a pose local A, edite/aplique outra pose e capture B. Use o controle deslizante ou passos de 10%. Isso produz uma **prévia**, não uma edição. JSON, SVG e histórico continuam ligados ao estado aceito. **Aplicar prévia** cria uma edição com opção de desfazer.
- A reprodução opcional dura cinco segundos, uma única vez. Movimento reduzido desativa a reprodução, mas mantém todos os controles manuais. Edição, seleção, importação, troca de pai e Escape pausam a reprodução.
- Gestos de câmera exigem ativação explícita. **Modo câmera** monta OrbitControls; **Concluir câmera (Esc)** desconecta os controles. No modo de seleção não há controles de câmera conectados. A edição numérica não exige manipulador espacial.
- **Usar planta 2D** está sempre disponível. Ausência de WebGL, erros de renderização e perda de contexto levam ao caminho DOM/2D. A tentativa de voltar ao 3D é explícita. Hierarquia, propriedades, comparação, importação/exportação e desfazer continuam disponíveis sem GPU.
- As ações JSON/SVG preparam texto somente leitura e um link **Salvar arquivo**. A exportação é um instantâneo do momento da ação. A importação aceita arquivo local ou JSON colado e valida tudo antes de substituir o documento.

Em telas estreitas a geometria ocupa uma região superior limitada, seguida de navegação **Objetos / Propriedades / Planta**. Cada operação tem controle DOM nativo rotulado. Rótulos do usuário são texto simples; IDs visíveis distinguem rótulos repetidos. Não há gravação automática: exporte antes de fechar a página.

## Exemplo de código

O núcleo funciona sem React ou Three:

```ts
import { Store, exportJSON, point, worlds } from './src/core';
import { seed } from './src/seed';

const store = new Store(seed());
store.select('arm');
store.reparent('arm', 'target');
const origem = point(worlds(store.doc).get('arm')!, [0, 0, 0]);
// aproximadamente [2, 1, 0]
const texto = exportJSON(store.doc);
store.import(texto);
```

A demo imprime resultados legíveis e JSON aceito. `--json` retorna um relatório para processamento. Saída esperada:

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

É uma saída esperada, não um registro de execução. Falhas nas verificações da demo retornam código diferente de zero; opções desconhecidas retornam 2.

## Contrato e decisões

Coordenadas de mão direita, vetores-coluna, `L = T × R`, `W = P × L`, aritmética binary64 e matrizes armazenadas por colunas. Translações locais limitadas a ±1000 unidades genéricas, até 64 quadros, profundidade 16 e 20 instantâneos para desfazer. Apenas poses rígidas com quaternion unitário são aceitas; não há escala, cisalhamento, reflexão, física ou controle robótico. O esquema e a tolerância estão em [docs/contract.md](docs/contract.md).

O núcleo puro e os documentos validados autorizam todos os renderizadores. Three é adaptador e oráculo independente dos testes, não a implementação matemática do núcleo. Não há conta, CDN, busca de modelos, importação arbitrária de malhas/scripts, telemetria, credenciais ou API externa em tempo de execução.

## Verificação e limites

O comando de testes verifica tipos estritos, empacota testes Node via Vite SSR, constrói uma sonda ReactDOM separada e executa o test runner do Node. Há casos geométricos literais/exaustivos, comparações com Three, importações adversariais, atomicidade, histórico, os dois idiomas, interação ReactDOM real em ambiente JSDOM isolado e objetos reais do test renderer R3F. A demo verifica seus próprios resultados literais. O build verifica separadamente o comentário inicial como primeiro filho do body e a subpasta do repositório.

Estes arquivos não são um registro de testes/build bem-sucedidos. JSDOM e objetos R3F **não comprovam renderização WebGL, gestos reais, qualidade visual, fontes, responsividade ou conformidade de acessibilidade**. Não há host de navegador disponível para QA renderizada. Esses itens ainda precisam de navegadores/dispositivos reais. O aviso de depreciação Three.Clock emitido pelos testes de cena não é suprimido.

Não há alegação de prontidão para produção, segurança física, adequação à fabricação, conformidade ampla com formatos/normas ou certificação. O limite de bytes é aplicado antes da decodificação JSON, mas não constitui isolamento de recursão ou RSS do decodificador. SVG é uma projeção isométrica autocontida limitada, não formato CAD. Não há persistência nem promessa de preservar o mundo de uma animação inteira ao trocar o pai.

Código original: MIT, copyright 2026 Lofrano Tecnologia. Public Sans mantém OFL-1.1; Lucide mantém ISC; a licença do aplicativo não substitui as licenças das dependências. Segurança: [relato privado no GitHub](https://github.com/martinlofranodeoliveira/frame-transform-studio/security/advisories/new). Contato geral: [site oficial](https://lofranotecnologia.com.br).

O build gera `third-party-notices.txt` e `third-party-sources.json`, acessíveis pelo rodapé. Eles contêm os avisos reais dos pacotes JavaScript retidos e a licença da fonte Public Sans importada, com arquivos de origem e hashes SHA-256. O pacote Fiber não inclui LICENSE; sua licença upstream da versão exata está em `dependency-notices/`, com procedência. Não se presume que a minificação preserve todos os banners originais.
