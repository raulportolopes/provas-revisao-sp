/*
 * Tema claro / escuro / automático.
 * Arquivo "clássico" (sem type=module) carregado no <head>: ele precisa rodar antes da página
 * aparecer, senão o aluno que escolheu o tema escuro vê um clarão branco a cada F5.
 *
 * Guardamos a ESCOLHA ('claro' | 'escuro' | 'auto') no localStorage e aplicamos o tema REAL
 * no atributo data-tema do <html>. O CSS só olha para [data-tema="escuro"].
 */
(function () {
  var CHAVE = 'pulso.tema';
  var midia = window.matchMedia('(prefers-color-scheme: dark)');

  function escolha() { return localStorage.getItem(CHAVE) || 'auto'; }
  function aplicar() {
    var e = escolha();
    var real = e === 'auto' ? (midia.matches ? 'escuro' : 'claro') : e;
    document.documentElement.dataset.tema = real;
    document.documentElement.dataset.temaEscolha = e;
  }
  aplicar();
  // No modo automático, se o sistema mudar de tema com a página aberta, a página acompanha.
  midia.addEventListener('change', aplicar);

  // Exposto para os módulos (app.js e perfil.js) usarem.
  window.PulsoTema = {
    escolha: escolha,
    definir: function (valor) { localStorage.setItem(CHAVE, valor); aplicar(); },
    real: function () { return document.documentElement.dataset.tema; }
  };
})();
