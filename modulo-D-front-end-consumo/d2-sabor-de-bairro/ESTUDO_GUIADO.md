# Estudo guiado – Sabor de Bairro (Módulo D, revisão em Vue 3)

Material de revisão para o Eduardo. Preparado por Raul Porto Lopes (Avaliador), SP Skills 2026, #17 Tecnologias Web.

A ideia é a mesma da Pulso: **ver o projeto pronto, entender por que cada peça está ali e depois refazer as peças sozinho**. A Pulso é em JavaScript puro; aqui os mesmos problemas (estado, URL, corrida, modal, 401/409/422, datas) aparecem resolvidos com Vue 3. Compare os dois: o *raciocínio* é igual, só muda quem redesenha a tela.

---

## 0. Como rodar

1. Copie `solucao-comentada/XX_modulo_d/` para o `htdocs` do XAMPP (ou rode `php -S localhost:8000` dentro da pasta).
2. Abra `http://localhost/XX_modulo_d/` no Chrome com o DevTools aberto (abas **Console** e **Rede**).
3. Entre com `cliente@sabor.com.br` / `Sabor2026!`.
4. Para zerar os dados: `fetch('api/index.php/reset', { method: 'POST' })` no console.
5. Para testar a qualquer hora, use os restaurantes 24 h: **Smash do Bairro**, Bowl & Cia, Açaí da Esquina e Pastelaria Madrugada.

---

## 1. O mapa do projeto (leia nesta ordem)

| Arquivo | Para que serve | O que você precisa saber de cabeça |
|---|---|---|
| `index.html` | Casca: carrega Vue, Router e `app.js` | Global build: `Vue.createApp`, `VueRouter.createRouter`, sem npm |
| `js/tema-inicial.js` | Aplica o tema no `<head>` | Script **clássico** (não `type="module"`) para não piscar |
| `js/estado.js` | Sessão, carrinho, avisos e tema | `reactive()` exportado **é** a store; `computed` para totais; `watch(..., { deep: true })` salva no localStorage |
| `js/api.js` | **Toda** conversa com o servidor | `api(caminho, { metodo, corpo, params, signal })`, `ErroApi`, 401 centralizado |
| `js/formatos.js` | Dinheiro, datas, máscara de CEP | `Intl.NumberFormat` com centavos/100 no fim; `Intl.DateTimeFormat` com `timeZone` |
| `js/app.js` | Rotas, guarda, título, foco no `<main>` | `beforeEach` com `meta.login` e `?voltar=` |
| `js/componentes/modal.js` | Base de todo modal e da gaveta | Foco entra, Tab preso, Esc, foco volta, pilha de modais |
| `js/componentes/confirmar.js` | `await confirmar('…')` | Promise + estado reativo = `window.confirm` acessível |
| `js/componentes/modal-item.js` | Opções do prato | radio × checkbox, máximo, `computed` do preço |
| `js/componentes/gaveta-carrinho.js` | Carrinho | Barra do mínimo, foco depois de remover |
| `js/telas/inicio.js` | Busca, chips, filtros, carregar mais | **URL como fonte da verdade** + AbortController |
| `js/telas/restaurante.js` | Cardápio, abas, scrollspy | Prato aberto na URL (`?item=36`) |
| `js/telas/checkout.js` | 3 passos, CEP, pagamento, cupom | Passo na URL, rascunho no sessionStorage, 422 → passo certo |
| `js/telas/pedido.js` | Acompanhamento | Polling com `setTimeout` encadeado que **para** |
| `js/telas/pedidos.js` | Lista paginada | `?pagina=2`, `aria-current="page"` |
| `css/style.css` | Tudo visual | Variáveis por tema, `::before` no topo, folha de baixo em 375 px |

---

## 2. Os 10 padrões deste projeto

### Padrão 1 – A URL é a fonte da verdade (`js/telas/inicio.js`)

```js
const filtros = computed(() => ({ busca: rota.query.busca || '', ... }));  // LÊ da URL
function mudar(parcial) { router.replace({ query: { ...rota.query, ...parcial } }); } // ESCREVE na URL
watch(() => rota.query, () => carregar(1));                                 // URL mudou → busca
```

O clique **não** chama a API. O clique muda a URL; a URL mudando chama a API. Assim F5, Voltar e link colado funcionam de graça, e só existe **um** caminho que carrega a lista.

> Erro clássico: ter `ref` para os filtros E a URL, e um `watch` em cada. Resultado: duas requisições por clique, ou um laço.

### Padrão 2 – Uma função só para a API, com 401 centralizado (`js/api.js`)

- `Authorization: Bearer` sai daqui em toda chamada.
- `!resposta.ok` vira `throw new ErroApi(status, corpo)`; a tela lê `e.status`, `e.erros`, `e.codigo`.
- 401 com token → `sessao.sair()` + callback que o `app.js` registrou (aviso + `/entrar?voltar=`).

### Padrão 3 – Corrida de requisições: AbortController + "dono"

```js
controlador?.abort();
const meu = (controlador = new AbortController());
try { ... } catch (e) { if (e.name === 'AbortError') return; ... }
finally { if (meu === controlador) carregando.value = false; }   // só o DONO desliga o carregando
```

O mesmo padrão aparece em 5 lugares: início, cardápio, CEP, lista de pedidos e polling.

### Padrão 4 – Store sem biblioteca (`js/estado.js`)

`export const carrinho = reactive({...})` e `export const subtotal = computed(...)`. Qualquer componente importa e usa; o Vue redesenha todos. Persistência: um `watch` com `deep: true` grava no localStorage.

Regra de negócio da linha do carrinho: **a chave** é `item + ids das opções ORDENADOS + observação`. Ordenar é o que faz "Bacon depois Queijo" ser igual a "Queijo depois Bacon".

### Padrão 5 – Derivado é `computed`, nunca conta repetida

Preço do prato, subtotal, taxa (restaurante + bairro), desconto, total, "Faltam R$ X", progresso do mínimo: tudo `computed`. Você nunca "atualiza o total" num `@click`; o total **é** uma fórmula.

E sempre em **centavos**: `brl(centavos)` só na hora de mostrar. `0.1 + 0.2 !== 0.3`.

### Padrão 6 – Modal base acessível com pilha (`js/componentes/modal.js`)

1. `onMounted`: guarda `document.activeElement` (quem abriu), foca o primeiro campo.
2. Ouvinte de `keydown` **no document** (não na caixa): se o botão focado sumir, o Esc continua funcionando.
3. Pilha: com confirmação aberta por cima da gaveta, só o modal de cima responde.
4. `onBeforeUnmount`: devolve o foco; se quem abriu foi o `<body>` (modal aberto pelo F5), usa o seletor `voltarPara`.

### Padrão 7 – Estado de tela na URL também para modal e passo

- Prato aberto: `?item=36` → F5 reabre; Voltar do navegador fecha.
- Passo do checkout: `?passo=2` → F5 mantém. Dados digitados: `sessionStorage`.

### Padrão 8 – Scrollspy simples (`js/telas/restaurante.js`)

"A seção ativa é a **última cuja borda de cima já passou da metade da tela**; no fim da página, a última." Um `scroll` com `requestAnimationFrame` (um cálculo por quadro). E a aba ativa entra na barra com `trilho.scrollTo(...)`, **não** com `scrollIntoView` (que rola a janela e cancela a rolagem suave).

### Padrão 9 – Polling que para (`js/telas/pedido.js`)

```js
async function consultar() { ...; if (ativo && !document.hidden && !terminou) timer = setTimeout(consultar, 5000); }
onBeforeUnmount(() => { ativo = false; clearTimeout(timer); ctrl?.abort(); });
```

`setTimeout` encadeado (nunca `setInterval`): a próxima só sai quando a anterior terminou. Três motivos para parar: pedido terminou, saiu da tela, aba escondida.

### Padrão 10 – Datas e fusos (`js/formatos.js`)

- `"2026-11-17T21:58:00Z"` é UTC. Na tela: `Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', ... })` → 18:58.
- `abre_em` vem com `-03:00`; para "hoje / amanhã", compare o **dia em São Paulo** dos dois lados (`en-CA` dá `AAAA-MM-DD`).
- Teste: mude o fuso do Windows. A hora na tela não pode mudar.

---

## 3. Ordem de ataque em 4 horas

1. **0:00–0:15** Ler a tabela da API e os prints. Anotar códigos 409 e campos de 422.
2. **0:15–0:40** `index.html` + `app.js` com 2 rotas vazias. `api.js` e `estado.js`. Testar login no console.
3. **0:40–1:20** Início com filtros na URL. Só depois o visual dos cartões.
4. **1:20–2:10** Cardápio, modal base e modal do prato (computed do preço!).
5. **2:10–2:35** Gaveta e regras do carrinho.
6. **2:35–3:20** Checkout: passo 1 → 2 → 3 → POST com `total_esperado`.
7. **3:20–3:45** Acompanhamento e lista de pedidos.
8. **3:45–4:00** 375 px, tema, publicar no servidor e testar lá.

Se o tempo apertar: os pontos estão em **regras e estado**, não em efeito. Uma tela feia que respeita 422/409, URL e foco vale mais que uma tela linda que quebra no F5.

---

## 4. Treino: refaça sem olhar

Faça cada um em arquivo novo, sem abrir a solução. Depois compare.

1. **(15 min)** Uma tela Vue com um `<select>` de ordem e um chip, que guarda tudo na URL e restaura no F5.
2. **(15 min)** `api()` com token, `ErroApi` e 401 que chama um callback.
3. **(20 min)** Busca com debounce de 350 ms + AbortController + "dono" do carregando. Teste em Fast 3G.
4. **(20 min)** Modal base: foco entra, Tab preso, Esc, clique no fundo, foco volta. Depois abra uma confirmação por cima.
5. **(15 min)** Grupo de opções com `min`/`max`: radio quando max = 1, checkbox desabilitando quando chega no máximo, e o preço em `computed`.
6. **(15 min)** Carrinho em `reactive` com localStorage e a chave ordenada das opções.
7. **(20 min)** Checkout de 3 passos com `?passo=` e validação que foca o campo.
8. **(10 min)** Polling de 5 s que para em 3 situações.
9. **(10 min)** Formatar `"2026-11-17T21:58:00Z"` em Brasília e testar com o Windows em outro fuso.
10. **(10 min)** Scrollspy com a regra da "metade da tela".

---

## 5. Testes automáticos

`gabarito-avaliador/checar-sabor.js` roda 71 verificações com Playwright (`node checar-sabor.js http://localhost/XX_modulo_d/`). Leia o arquivo: cada teste mostra **como o avaliador vai testar** aquele requisito (F5, Fast 3G, só teclado, outro fuso, 375 px).

## 6. Bugs reais que apareceram fazendo esta solução

Todos foram pegos pelos testes, e todos são do tipo que derruba ponto na prova:

1. **Esc parou de fechar a gaveta** depois de remover uma linha: o ouvinte estava na caixa do modal e o foco tinha caído no `<body>`. Solução: ouvinte no `document` + mover o foco para a linha vizinha.
2. **Foco não voltava ao prato** quando o modal tinha sido aberto pelo F5: "quem abriu" era o `<body>`. Solução: seletor `voltarPara`.
3. **A aba do meio nunca acendia** no scrollspy porque a página não rolava o bastante. Solução: linha na metade da tela + regra do fim da página.
4. **Clicar na aba parava a rolagem no meio**: `scrollIntoView` na aba cancelava a rolagem suave da janela.
5. **O erro antigo do CEP escondia o endereço encontrado**: erro de validação precisa sumir quando o campo é corrigido.
6. **`url()` dentro de variável CSS** apontava para `css/img/...`: imagem de dado vem em `<img>`, não em `background` via variável.
