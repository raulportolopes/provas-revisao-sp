/*
 * paginacao.js – desenha a paginação a partir do "meta" que a API devolve:
 *   { pagina: 2, por_pagina: 6, total: 16, total_paginas: 3 }
 * A paginação é do SERVIDOR: cada clique pede a página certa para a API (?pagina=3).
 * Quem chama decide o que fazer no clique (ver data-pagina nos botões).
 */
export function paginacaoHTML(meta, rotulo = 'Paginação') {
  if (!meta || meta.total_paginas <= 1) return '';           // uma página só: não mostra nada
  const { pagina, total_paginas: tp } = meta;
  // Com muitas páginas mostramos: 1 … 4 5 6 … 12 (sempre a primeira, a última e as vizinhas).
  const nums = [];
  for (let i = 1; i <= tp; i++) {
    if (i === 1 || i === tp || Math.abs(i - pagina) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== '…') nums.push('…');
  }
  const botoes = nums.map((n) => n === '…'
    ? '<li><span class="paginacao__reticencias" aria-hidden="true">…</span></li>'
    : `<li><button type="button" class="paginacao__num${n === pagina ? ' ativa' : ''}" data-pagina="${n}"
          ${n === pagina ? 'aria-current="page"' : ''} aria-label="Página ${n}">${n}</button></li>`).join('');
  return `
  <nav class="paginacao" aria-label="${rotulo}">
    <ul>
      <li><button type="button" class="paginacao__seta" data-pagina="${pagina - 1}" ${pagina === 1 ? 'disabled' : ''} aria-label="Página anterior">‹</button></li>
      ${botoes}
      <li><button type="button" class="paginacao__seta" data-pagina="${pagina + 1}" ${pagina === tp ? 'disabled' : ''} aria-label="Próxima página">›</button></li>
    </ul>
  </nav>`;
}
