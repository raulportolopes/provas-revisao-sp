// =====================================================================
// tema.js – tema escuro/claro.
// 1) O <script> no <head> do index.html já aplicou o tema certo antes do CSS.
// 2) Aqui só ligamos o botão e guardamos a escolha no localStorage.
// 3) Todas as cores vêm de variáveis (design tokens) em css/estilo.css:
//    trocar data-tema no <html> troca a aplicação inteira.
// =====================================================================
const html = document.documentElement;
const botao = document.getElementById('botao-tema');

function atualizarBotao() {
  const claro = html.dataset.tema === 'claro';
  botao.setAttribute('aria-pressed', String(claro));
  botao.querySelector('.sr-only').textContent = claro ? 'Tema claro ativado' : 'Tema claro';
  botao.title = claro ? 'Mudar para o tema escuro' : 'Mudar para o tema claro';
}

export function iniciarTema() {
  atualizarBotao();
  botao.addEventListener('click', () => {
    html.dataset.tema = html.dataset.tema === 'claro' ? 'escuro' : 'claro';
    localStorage.setItem('orbita:tema', html.dataset.tema);
    atualizarBotao();
  });
}
