# Dicas – Estúdio Pulso (Módulo E, Vue)

Pistas para organizar a prova. Não há código pronto aqui.

## Montando o Vue sem build
- Com as versões globais, `Vue` e `VueRouter` viram variáveis globais. Em módulos ES, pegue o que precisa com desestruturação (`const { ref, computed } = Vue`).
- Componente sem build = objeto com `setup()` e `template` (string). Carregue a API **antes** do `mount` se as guardas de rota dependem dela.
- O `index.html` pode ter um script curto no `<head>` que aplica tema e tamanho do texto antes de a página aparecer.

## Estado
- Um único objeto `reactive()` em um módulo, importado por todas as telas, já é um "store". Um `watch` com `deep: true` grava no localStorage.
- Coloque as **regras** (pode reservar? por que não?) em funções do store que devolvem um objeto com a ação e o motivo. O template só mostra.
- Nunca grave a senha.

## Rotas
- Modal com endereço próprio = rota **filha** da grade. A grade tem um `<RouterView />` dentro dela.
- `RouterLink` com `custom` e `v-slot` dá acesso a `isActive`.
- Guarda: `router.beforeEach`. Para voltar depois do login, mande o destino na query.
- `<Transition>` em volta da tela exige que cada tela tenha um único elemento raiz.

## Datas
- `"2026-12-08"` em `new Date()` vira dia 07 à noite no Brasil. Monte com números.
- A semana da grade começa na segunda da semana do "agora" da API.

## Grade
- CSS Grid com uma linha a cada 15 min: linha = (minutos desde 06:00) / 15 + 1; o `span` vem da duração.
- Duas aulas no mesmo dia se sobrepõem quando o início de uma é antes do fim da outra **e vice-versa**. Cada dia pode ter duas colunas ("pistas").
- Deixe a URL ser a fonte da verdade dos filtros: o controle lê de `route.query` e grava com `router.replace`.

## Minha área
- Foto: `FileReader` lê o arquivo; para saber a largura e a altura, carregue o resultado num `new Image()`.
- localStorage cheio lança exceção: `try/catch` no gravar.
- Rosca com várias cores: `conic-gradient(cor1 0% 25%, cor2 25% 40%, ...)` montado a partir dos dados.

## Treino
- Drag and drop do HTML5: `draggable="true"`, `dragstart`, `dragover` (com `preventDefault`), `drop`, `dragend`.
- Quem não usa mouse também precisa reordenar: teclado na alça + `aria-live` anunciando a posição.
- `ref` num `<TransitionGroup>` devolve o componente; o elemento está em `$el`.
- Importar: valide tudo **antes** de trocar o treino. Uma regra = uma mensagem.

## 375 px
- Menu fixo embaixo fora do lugar? Procure `transform`, `filter` ou `backdrop-filter` em algum pai.
- `matchMedia` no JS para trocar a grade pelas abas por dia.

## Últimos 15 minutos
Publique, limpe o armazenamento do site, entre com a conta de demonstração e passe pelo roteiro: guarda, reservar, conflito, lista de espera, F5 no modal, 375 px.
