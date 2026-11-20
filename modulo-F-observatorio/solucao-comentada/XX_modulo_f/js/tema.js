/* tema.js — carregado no <head> SEM defer, antes de o CSS pintar a página.
   Lê o tema salvo (ou a preferência do sistema) e coloca data-tema no <html>.
   Se isso ficasse no fim do body, a página piscaria no tema errado. */
(function () {
  var salvo = localStorage.getItem('oes-tema');
  var sistemaClaro = window.matchMedia('(prefers-color-scheme: light)').matches;
  var tema = salvo || (sistemaClaro ? 'claro' : 'escuro');
  document.documentElement.setAttribute('data-tema', tema);
})();
