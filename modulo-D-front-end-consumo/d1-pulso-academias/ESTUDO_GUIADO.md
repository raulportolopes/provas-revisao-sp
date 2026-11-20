# Estudo guiado – Pulso Academias (Módulo D, revisão)

Material de revisão para o Eduardo. Preparado por Raul Porto Lopes (Avaliador), SP Skills 2026, #17 Tecnologias Web.

A ideia: **ver o projeto pronto, entender por que cada peça está ali e depois refazer as peças sozinho**. Não é para decorar o código. É para guardar os *padrões*, porque eles se repetem em toda prova de front-end.

---

## 0. Como rodar

1. Copie `solucao-comentada/XX_modulo_d/` para o `htdocs` do XAMPP (ou rode `php -S localhost:8000` dentro da pasta).
2. Abra `http://localhost/XX_modulo_d/` no Chrome com o DevTools aberto (abas **Console** e **Rede**).
3. Entre com `aluno@pulso.com.br` / `Pulso2026!`.
4. Para começar do zero a qualquer hora, rode no console: `fetch('api/index.php/reset', { method: 'POST' })`.

---

## 1. O mapa do projeto (leia nesta ordem)

| Arquivo | Para que serve | Padrão que você precisa saber de cabeça |
|---|---|---|
| `index.html` | Casca: cabeçalho, `<main>`, região de toasts | Link "Pular para o conteúdo", `aria-live` |
| `js/tema.js` | Tema claro/escuro/automático | Script **clássico no `<head>`** para não piscar |
| `js/api.js` | **Toda** conversa com o servidor | Uma função `api()` com token, JSON, erros e 401 |
| `js/formatos.js` | Datas e números em pt-BR | `Intl.DateTimeFormat` com `timeZone`, `dataLocal()` |
| `js/navegacao.js` + `js/app.js` | Roteador por hash e guarda de login | `hashchange`, `replaceState`, destino depois do login |
| `js/dados.js` | Catálogos (unidades, modalidades...) | `Promise.all` + `Map` para cruzar ids |
| `js/componentes/modal.js` | Modal acessível reaproveitável | Foco preso, Esc, fundo, volta do foco, pilha |
| `js/componentes/abas.js` | Teclado das abas ARIA | Roving tabindex, setas circulares, Home/End |
| `js/componentes/paginacao.js` | Paginação a partir do `meta` | Botões desabilitados nas pontas, `aria-current` |
| `js/telas/*.js` | Uma tela por arquivo | `montar(raiz, params)` devolve a função de limpeza |
| `css/style.css` | Tudo visual | Variáveis de tema, `@media`, efeitos |

Cada arquivo começa com um comentário dizendo **o que resolve** e **onde costuma dar errado**. Leia esses comentários primeiro.

---

## 2. Os 10 padrões deste projeto

### Padrão 1 – Uma função só para falar com a API (`js/api.js`)

Toda requisição passa por `api(caminho, { metodo, corpo, query, sinal })`. Ela:

- coloca `Authorization: Bearer <token>` sozinha;
- transforma objeto em JSON, mas deixa `FormData` passar do jeito que está (upload);
- converte a resposta e, se `!resp.ok`, **lança** um `ErroApi` com `status`, `mensagem`, `erros` (por campo) e `codigo`;
- num 401, chama um único tratador (definido no `app.js`) que limpa a sessão e manda para o login.

**Por que importa:** sem isso, você escreve `fetch` em 15 lugares e esquece o token ou o 401 em algum. Na prova, faça essa função **nos primeiros 15 minutos**.

```js
try {
  const r = await api('/reservas', { metodo: 'POST', corpo: { aula_id: 123 } });
} catch (err) {
  if (err.status === 422) mostrarErros(form, err.erros);   // erro por campo
  else if (err.codigo === 'AULA_LOTADA') { /* troca o botão */ }
  else mensagem.textContent = err.message;               // texto que a API mandou
}
```

### Padrão 2 – Roteador por hash com guarda (`js/app.js`)

- `window.addEventListener('hashchange', rotear)` + `rotear()` na carga.
- Antes de desenhar: se a rota não é pública e não tem token → guarda o destino em `sessionStorage` e vai para `#/entrar`.
- Depois do login: `location.hash = destinoDepoisDoLogin()`.
- Link ativo: classe `ativo` **e** `aria-current="page"` só no link da rota atual. Como é calculado dentro do `rotear()`, funciona no clique, no F5 e no Voltar.
- Cada tela devolve uma função de limpeza (cancela fetch e timers) que roda antes da próxima tela.

### Padrão 3 – Estado da tela na URL (`js/telas/agenda.js`)

1. Na entrada: lê `params` → monta o objeto `estado` (com padrão e validação).
2. Quando algo muda: altera `estado` → `gravarURL()` com `history.replaceState` → `carregar()`.

`replaceState` **não** dispara `hashchange`; por isso a tela não é remontada e o campo de busca não perde o foco enquanto você digita.

### Padrão 4 – Filtro no servidor, paginação no servidor

A API filtra e pagina. O front só manda os parâmetros e desenha o que voltou:

```
GET /aulas?data=2026-11-24&modalidade_id=1,7&periodo=noite&somente_vagas=1&pagina=2&por_pagina=6
→ { dados: [...6 aulas], meta: { pagina: 2, total: 9, total_paginas: 2 } }
```

Regra de ouro: **mudou filtro → página 1**. E a paginação é desenhada a partir do `meta` (`paginacaoHTML(meta)`).

### Padrão 5 – Debounce + AbortController (a corrida de requisições)

A API desta prova demora de 0,2 s a 0,9 s **de propósito**. Se você digitar "yoga", sem cuidado saem 4 pedidos e o de "y" pode chegar por último e apagar o resultado certo.

```js
// debounce: só pede depois de 300 ms sem digitar
clearTimeout(timer);
timer = setTimeout(() => { estado.busca = campo.value; filtrosMudaram(); }, 300);

// cancelamento: cada pedido novo cancela o anterior
controlador?.abort();
const meu = controlador = new AbortController();
try { ... await api('/aulas', { sinal: meu.signal }) ... }
catch (e) { if (e.name === 'AbortError') return; }   // fui cancelado: não desenho nada
finally { if (meu === controlador) lista.removeAttribute('aria-busy'); }
```

Repare no `finally`: o pedido cancelado **não pode** desligar o "carregando" do pedido novo. Esse bug apareceu de verdade durante os testes desta solução.

### Padrão 6 – Modal acessível (`js/componentes/modal.js`)

Checklist que a ficha cobra e que você precisa conseguir escrever sem consultar:

1. `role="dialog"`, `aria-modal="true"`, `aria-labelledby` = id do título.
2. Guardar `document.activeElement` antes de abrir (quem abriu).
3. Foco para dentro ao abrir (`data-foco-inicial` ou o X).
4. `keydown`: Esc fecha; Tab no último vai para o primeiro, Shift+Tab no primeiro vai para o último.
5. Clique no fundo fecha, clique dentro não (`e.target === fundo`).
6. `body.sem-rolagem` (overflow hidden) enquanto aberto.
7. Ao fechar, foco volta para quem abriu. **Se a lista foi redesenhada**, o botão antigo não existe mais: devolva o foco para o botão novo da mesma aula (`[data-detalhes="id"]`). Veja `desenhar()` em `agenda.js`.

A confirmação de cancelamento (`confirmar()`) é outro modal por cima do primeiro, devolvendo uma `Promise<boolean>`. Nada de `window.confirm`.

### Padrão 7 – Abas ARIA com teclado (`js/componentes/abas.js`)

- `role="tablist"` no pai; cada aba com `role="tab"`, `aria-selected`, `aria-controls`; o painel com `role="tabpanel"` e `aria-labelledby`.
- Só a aba selecionada tem `tabindex="0"`; as outras `-1` (o Tab entra na lista uma vez e as setas andam dentro).
- ← → circulares, Home e End.

Está usado duas vezes: dias da agenda e abas de Minhas reservas. **Um componente, duas telas.**

### Padrão 8 – Datas sem cair no fuso (`js/formatos.js`)

| Situação | Errado | Certo |
|---|---|---|
| Data sem hora `"2025-03-10"` | `new Date("2025-03-10")` → 09/03 no Brasil | `dataLocal("2025-03-10")` → `new Date(2025, 2, 10, 12)` |
| Data em UTC `"2026-11-18T17:59:51Z"` | cortar a string → 17:59 | `Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', ... })` → 14:59 |
| Gerar `"AAAA-MM-DD"` de hoje | `toISOString().slice(0,10)` (UTC: depois das 21h vira amanhã!) | `isoDia(new Date())` com `getFullYear/getMonth/getDate` |

### Padrão 9 – Efeitos que seguem o cursor (card 3D)

O JS só mede onde está o mouse e grava variáveis CSS. Quem desenha é o CSS:

```js
card.style.setProperty('--ry', `${(x - 0.5) * 10}deg`);   // x de 0 a 1
card.style.setProperty('--mx', `${x * 100}%`);
```
```css
.aula { transform: perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)); }
.aula__brilho { background: radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,.35), transparent 45%); }
```

O mesmo truque (JS → variável CSS) serve para o gráfico: a barra recebe `--h: 68.75%` e o CSS anima a altura de 0 até `--h`. A rosca é um `conic-gradient` com os graus calculados no JS.

### Padrão 10 – 375 px e a barra fixa embaixo

- O menu vira `position: fixed; bottom: 0` dentro do `@media (max-width: 700px)`, e o `body` ganha `padding-bottom` para nada ficar escondido.
- **Armadilha que aconteceu aqui:** o cabeçalho tinha `backdrop-filter`. Um pai com `backdrop-filter`, `transform` ou `filter` vira a referência dos filhos `position: fixed`, e a barra "de baixo" grudou no topo. Solução: o vidro foi para um `::before` do cabeçalho.
- O modal vira folha que sobe de baixo (`align-items: end`, `border-radius` só em cima, `max-height: 92vh`, `overflow-y: auto`).

---

## 3. Ordem de ataque em 4 horas (como a solução foi pensada)

1. **0:00–0:15** Ler a tabela da API e os prints. Fazer o checklist com os pontos da ficha.
2. **0:15–0:45** `api.js`, `formatos.js`, roteador com guarda, tela de login. *Já garante quase todo o D1.*
3. **0:45–1:45** Agenda: catálogos com `Promise.all`, abas de dia, filtros mandados para a API, URL, paginação, debounce e AbortController.
4. **1:45–2:30** Modal: detalhes, reservar, 409/422, lista de espera, confirmação, toast.
5. **2:30–3:00** Minhas reservas (reaproveita abas, paginação e confirmação).
6. **3:00–3:25** Perfil: PATCH com erros, máscara, upload com prévia, tema, acordeão.
7. **3:25–3:40** Progresso: barras e rosca.
8. **3:40–4:00** 375 px, Lighthouse, publicar no servidor e testar lá.

Regra dos 15 minutos continua valendo: travou, anota, pula.

---

## 4. Treino: refaça sem olhar

Cada exercício em arquivo novo, sem abrir a solução. Depois compare.

1. **(15 min)** Escreva `api()` com token, JSON, `FormData`, erro com `status/erros/codigo` e tratamento de 401.
2. **(15 min)** Escreva o modal acessível com os 7 itens do Padrão 6. Teste só com teclado.
3. **(10 min)** Abas ARIA com ← → Home End, circular.
4. **(10 min)** Busca com debounce de 300 ms + AbortController. Prove no DevTools (Fast 3G) que a lista final é a da última busca.
5. **(10 min)** `formatarData()` que mostra `"2026-11-18T17:59:51Z"` como `18/11/2026 às 14:59` e `"2025-03-10"` como `10/03/2025`.
6. **(15 min)** Gráfico de barras só com CSS a partir de `[6, 8, 11, 11, 8, 8]` com linha de meta em 12 e balão no hover e no foco.
7. **(10 min)** Acordeão com um item aberto por vez e animação com `grid-template-rows: 0fr → 1fr`.

Se travar 10 minutos num exercício: anote o que tentou, abra **só o comentário do topo** do arquivo correspondente e tente de novo.

---

## 5. Testes automáticos

`gabarito-avaliador/checar-pulso.js` roda 34 verificações com Playwright (login, 401, URL, debounce, modal, foco, 409, cancelamento, UTC, máscara, upload, tema, acordeão, gráfico). Todas passam na solução. Rodar:

```
node checar-pulso.js http://localhost/XX_modulo_d/
```
