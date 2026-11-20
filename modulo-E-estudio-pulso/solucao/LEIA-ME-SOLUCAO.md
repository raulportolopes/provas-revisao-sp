# Estúdio Pulso · Solução de referência (Módulo E, Vue 3)

Solução em **Vue 3 + Vue Router 4 pelas versões globais** (`js/vendor/`), com módulos ES e componentes escritos como objetos com `template`. **Sem build, sem npm.** Funciona colocando a pasta em qualquer Apache.
Todo arquivo de `js/` começa com um comentário explicando o que ele faz.

## Como rodar

```bash
# na pasta solucao/
python3 -m http.server 8000      # ou Apache/XAMPP
# abra http://localhost:8000/   ·   conta: bia@pulso.com / Pulso2026!
```

## Como o Vue está montado

```
index.html  ── carrega vue.global.prod.js, vue-router.global.prod.js e js/main.js (type="module")
js/main.js  ── await carregar() (API)  →  createApp(App).use(router), component('ModalBase') e component('Acordeao'), mount('#app')
js/store.js ── reactive({ dados, usuario, reservas, treino, prefs, avisos }) + watch → localStorage + REGRAS
js/router.js── rotas, rota filha do modal, beforeEach (guarda) e afterEach (título + foco no h1)
js/App.js   ── cabeçalho, menu com RouterLink (v-slot isActive), preferências, <RouterView> com <Transition>, avisos
js/paginas/ ── uma tela por arquivo (todas com UMA raiz <div class="pagina"> por causa da Transition)
js/componentes/ ── Modal (Teleport + Transition + foco preso) e Acordeao (um aberto por vez)
```

## Mapa dos arquivos

| Arquivo | O que tem lá |
|---|---|
| `js/store.js` | Estado global e regras: `agora`, `ocorrenciasDaSemana`, `vagas`, **`situacao`** (decide o botão do modal), `reservar`, `cancelar`, `entrar`, `sair`, `avisar` |
| `js/router.js` | `createWebHashHistory`, rota filha `/aulas/:aulaId/:data`, guarda `requerLogin` / `soVisitante`, `scrollBehavior` |
| `js/App.js` | `alternarTema`, tamanho do texto, `sairDaConta` (sai da tela protegida antes de apagar o usuário), toasts com ação |
| `js/util.js` | `dataLocal` (sem erro de fuso), `segundaDaSemana`, `somarDias`, `isoDia`, `ler`/`gravar`, `baixar` (Blob) |
| `js/componentes/Modal.js` | Modal acessível reutilizável: `Teleport`, `Transition`, foco preso (`teclado`), Esc, fundo, trava a rolagem |
| `js/componentes/Acordeao.js` | Um item aberto por vez (o estado é só um número) |
| `js/paginas/Inicio.js` | `animarNumeros` (IntersectionObserver + rAF), carrossel com **scroll-snap** (`aoRolar`, `irPara`, `teclas`) |
| `js/paginas/Aulas.js` | **URL como fonte da verdade** (`mudar` → `router.replace`), grade em CSS Grid com 2 pistas, abas no celular (`teclaAba`), `estadoDe` |
| `js/paginas/AulaModal.js` | Rota filha; `acao()` chama `reservar`/`cancelar` do store; Desfazer |
| `js/paginas/Entrar.js` | `validar`, `enviar`, volta só para caminho interno (`?volta=`) |
| `js/paginas/MinhaArea.js` | Foto (`escolherFoto`, `salvarFoto`, `removerFoto`), meta (`salvarMeta`), gráficos só com CSS, paginação de 5 |
| `js/paginas/Planos.js` | Interruptor mensal/anual com preço animado, tabela gerada da API, FAQ com `<Acordeao>` |
| `js/paginas/Treino.js` | `adicionar`, `mover`, drag and drop (`inicioArraste`, `sobreItem`, `soltar`), `teclaItem` (Alt + setas), `exportar`, `importar` |
| `css/estilo.css` | Temas, grade, componentes, transições (`.pagina-*`, `.cartao-*`, `.lista-*`) e responsivo |

## Onde está cada requisito do enunciado

| Requisito | Onde olhar |
|---|---|
| 1.2 rotas e 404 | `router.js` → `routes` (rota coringa `/:caminho(.*)*`) |
| 1.3 link ativo também em `/aulas/9/...` | `App.js` → `RouterLink custom v-slot="{ isActive }"` |
| 1.4 título e foco | `router.js` → `afterEach` |
| 1.5 guarda | `router.js` → `beforeEach` + `Entrar.js` → `enviar()` |
| 1.6 transições | `App.js` → `<RouterView v-slot>` + `<Transition mode="out-in">` |
| 1.7 tema e fonte sem piscar | `<script>` no `<head>` do `index.html` + `watchEffect` no `App.js` |
| 2.2 contadores | `Inicio.js` → `animarNumeros()` |
| 2.5 carrossel scroll-snap | `Inicio.js` + `.trilha { scroll-snap-type }` no CSS |
| 3.3 filtros na URL | `Aulas.js` → `q` (computed lido da query) e `mudar()` |
| 3.4/3.5 grade e sobreposição | `Aulas.js` → computed `posicionadas` (linha = minutos/15, pista 1 ou 2) |
| 3.7 abas no celular | `Aulas.js` → `celular` (matchMedia) e `teclaAba()` |
| 4.1 modal por rota | `router.js` (children) + `AulaModal.js` |
| 4.4 regras de reserva | `store.js` → `situacao()` (limite, conflito, 60 min, espera) |
| 6.1 foto | `MinhaArea.js` → `escolherFoto()` (FileReader + `new Image()` para medir) |
| 6.3 gráficos | `MinhaArea.js` → `semanas`, `fatias`, `fundoRosca` + `.barra`/`.rosca` no CSS |
| 7.1 preço animado | `Planos.js` → `watch(anual)` com requestAnimationFrame |
| 8.3/8.4 reordenar | `Treino.js` → drag and drop e `teclaItem()` |
| 8.6 importar | `Treino.js` → `importar()` (cada `throw` é uma regra) |

## Armadilhas do Vue resolvidas

1. **`<Transition>` precisa de UMA raiz** na tela; senão o Vue avisa e não anima. Todas as páginas são `<div class="pagina">`.
2. **`ref` num `<TransitionGroup>`** devolve o componente: o elemento está em `.$el`.
3. **Sair na Minha área**: primeiro `router.push('/inicio')`, depois `sair()`; ao contrário, o template tenta ler `usuario.nome` de `null`.
4. **Filtro em dois lugares** (ref + URL) desencontra. Aqui a URL é a única fonte: o controle lê `route.query` e grava com `router.replace`.
5. **`router.push` a cada filtro** enche o histórico; use `replace`.
6. **Logo SVG com `currentColor` em `<img>`** não herda a cor; por isso o logo é SVG inline no `App.js`.
7. **Datas**: `new Date('2026-12-08')` vira dia 07 às 21h em Brasília. Use `dataLocal`.
8. **Senha no localStorage**: o `entrar()` remove a senha antes de guardar o usuário.

Elaborado por Raul Porto Lopes (Avaliador) – treino SP Skills 2026, ocupação 17 Tecnologias Web.
