# Órbita – Planetário Paulista · Solução de referência (Módulo E)

Solução em **HTML + CSS + JavaScript puro com módulos ES**, sem framework e sem build.
Todo arquivo de `js/` começa com um bloco de comentário explicando o que ele faz e as regras que cumpre.

## Como rodar

```bash
# na pasta solucao/
python3 -m http.server 8000      # ou coloque no Apache/XAMPP
# abra http://localhost:8000/
```

O `fetch` não funciona abrindo o `index.html` direto do disco (file://).

## Mapa dos arquivos

| Arquivo | O que tem lá |
|---|---|
| `index.html` | Esqueleto: splash, cabeçalho, menu, cronômetro, `<main>`, modal e área de avisos |
| `css/estilo.css` | Variáveis dos dois temas, layout de todas as telas, efeitos e responsivo (comentado por seção) |
| `js/app.js` | Ponto de entrada: carrega a API, splash e **rotas** (`lerHash`, `rotear`), link ativo, título, erro com Tentar novamente |
| `js/api.js` | `carregarTudo` (Promise.all dos 6 JSON), ocupados + lugares vendidos no navegador, `lugaresDaSala` (lê o layout) |
| `js/util.js` | `definirAgora`/`agora` (data da API sem erro de fuso), `dataLocal`, `dataBR`, `reais`, `normalizar` (tira acento), `ler`/`gravar` |
| `js/modal.js` | Modal acessível único: `abrirModal`, `trocarConteudo`, `fecharModal`, foco preso (`teclado`) e `confirmar()` que devolve Promise |
| `js/avisos.js` | `avisar(texto, {tipo, acao})` – toasts com ação (Desfazer) |
| `js/tema.js` | Tema claro/escuro com `prefers-color-scheme` + localStorage |
| `js/splash.js` | `rodarSplash` – 2,5 s por tempo real (rAF), espera a API, Pular, só na 1ª visita |
| `js/efeitos.js` | Cartão 3D e brilho que seguem o mouse (só grava variáveis CSS) e `escalonar` (entrada em sequência) |
| `js/carrinho.js` | Carrinho no sessionStorage com **horário de expiração** (F5 não reinicia), `ligarCronometro` |
| `js/telas/inicio.js` | `carrossel` (autoplay 6 s, pausa, teclado, arrastar, inert), contadores e rosca |
| `js/telas/programacao.js` | **Estado único + `aplicar()`**: filtrar → ordenar → paginar → desenhar → URL; modal com setas |
| `js/telas/sessao.js` | Mapa de lugares e as 8 regras (`lugaresIsolados`, `valores`), teclado com roving tabindex |
| `js/telas/pagamento.js` | Wizard de 3 passos, máscaras, `cpfValido`, `luhn`, `validadeOk`, `gerarCodigo` |
| `js/telas/reservas.js` | Abas acessíveis, `podeCancelar` (2 h), `mudarStatus` (cancelar/desfazer), exportar .json |
| `js/telas/ceu.js` | Abas, gráfico de barras só com CSS, acordeão de um item aberto, fases da Lua |

## Onde está cada requisito do enunciado

| Requisito | Onde olhar |
|---|---|
| 1.2 rotas, 404, sessão inexistente | `app.js` → `rotear()` e objeto `ROTAS` |
| 1.3 link ativo + aria-current | `app.js` → final de `rotear()` |
| 1.5 splash | `splash.js` → `rodarSplash()` (porcentagem calculada pelo tempo, não por contador) |
| 1.6 tema | `tema.js` + script curto no `<head>` do `index.html` (evita piscar) |
| 1.7 erro da API | `app.js` → `mostrarErro()` |
| 2.x carrossel | `telas/inicio.js` → `carrossel()` (checklist no topo do arquivo) |
| 2.4 contadores e rosca | `telas/inicio.js` (IntersectionObserver + `conic-gradient` com `--pct`) |
| 3.x filtros, ordem, paginação, URL | `telas/programacao.js` → `montar()` → `aplicar()` |
| 3.9 cartão 3D / brilho / entrada | `efeitos.js` + `.inclinar` e `.brilho` no CSS |
| 4.x modal de detalhes | `telas/programacao.js` (parte 5) + `modal.js` |
| 5.2 mapa a partir do layout | `telas/sessao.js` → `sala.layout.forEach(...)` no `montar()` (e `api.js` → `lugaresDaSala()` para a lista de lugares) |
| 5.3 regras (limite, acessível, meia, isolado) | `telas/sessao.js` → `alternar()`, `ajustarMeias()`, `lugaresIsolados()` e o clique em `#continuar` |
| 5.5 cronômetro | `carrinho.js` → `ligarCronometro()` |
| 5.6 teclado no mapa | `telas/sessao.js` → roving tabindex no `atualizar()` e evento keydown |
| 6.x pagamento | `telas/pagamento.js` (validações são funções puras: teste no console) |
| 7.x reservas | `telas/reservas.js` |
| 8.x guia do céu | `telas/ceu.js` + `.barra` / `.acordeao` no CSS |
| 9.1 375 px | `@media (max-width: 767px)` no fim do `estilo.css` (ver o comentário do `backdrop-filter`) |

## Armadilhas resolvidas (leia antes de copiar a ideia)

1. **Fuso**: `new Date('2026-12-05')` é meia-noite UTC = 21h do dia 04 em Brasília. Use `dataLocal('2026-12-05', '10:30')`.
2. **"Agora" da API**: `definirAgora` lê a hora de parede da string (`10:00`), sem depender do fuso do computador.
3. **Filtros que brigam**: nunca filtre a lista "da tela". Sempre parta da lista completa dentro de `aplicar()`.
4. **`sort` muda o array original**: use `[...lista].sort(...)`.
5. **`[hidden]` perdendo para `display:flex`**: o CSS tem `[hidden]{display:none!important}`.
6. **Menu de baixo preso no topo no celular**: `backdrop-filter` no pai cria um novo "containing block" para `position: fixed`. Por isso o topo não usa `backdrop-filter` no celular.
7. **Grid estourando a largura**: filhos de grid têm `min-width: auto`; o CSS usa `min-width: 0` nas colunas.
8. **Copiar em http**: `navigator.clipboard` só existe em HTTPS; há alternativa com `textarea` + `execCommand('copy')`.

Elaborado por Raul Porto Lopes (Avaliador) – treino SP Skills 2026, ocupação 17 Tecnologias Web.
