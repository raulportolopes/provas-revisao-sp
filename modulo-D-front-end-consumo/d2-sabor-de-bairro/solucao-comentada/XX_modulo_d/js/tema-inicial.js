/*
 * Roda no <head>, antes do CSS pintar a página.
 * Ordem de prioridade: escolha salva > preferência do sistema.
 * Se isto rodasse dentro do app.js (módulo, que é "defer"), a página
 * apareceria clara por um instante e depois escureceria: o "piscar" que a ficha cobra.
 */
(function () {
  var salvo = null;
  try { salvo = localStorage.getItem('sabor.tema'); } catch (e) { /* modo privado */ }
  var escuro = salvo ? salvo === 'escuro' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.tema = escuro ? 'escuro' : 'claro';
})();
