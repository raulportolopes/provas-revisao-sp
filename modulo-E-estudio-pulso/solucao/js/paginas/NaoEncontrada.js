// NaoEncontrada.js – rota coringa /:caminho(.*)* (qualquer endereço que não existe)
export default {
  template: `<div class="pagina estado">
    <p class="codigo-404" aria-hidden="true">404</p>
    <h1>Página não encontrada</h1>
    <p>Esse endereço não existe no Estúdio Pulso.</p>
    <RouterLink to="/inicio" class="botao">Voltar para o início</RouterLink>
  </div>`,
};
