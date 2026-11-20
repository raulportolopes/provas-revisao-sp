/*
 * Tela ENTRAR (#/entrar) – login com a API.
 *
 * Respostas que precisam ser tratadas:
 *   200 -> { token, usuario }  : guarda a sessão e vai para o destino (ou #/agenda)
 *   422 -> { erros: { email: [...], senha: [...] } } : mensagem embaixo de CADA campo
 *   401 -> { mensagem }        : aviso geral "E-mail ou senha incorretos."
 *   0   -> sem conexão         : aviso geral
 */
import { api, sessao } from '../api.js';
import { destinoDepoisDoLogin } from '../navegacao.js';

export function montar(raiz, params) {
  const expirou = params.get('expirou') === '1';
  raiz.innerHTML = `
  <section class="entrar">
    <div class="entrar__arte" aria-hidden="true">
      <p class="entrar__frase">Seu treino.<br><strong>No seu ritmo.</strong></p>
    </div>
    <div class="entrar__lado">
      <form class="entrar__form cartao" novalidate>
        <img class="entrar__logo" src="img/logo-pulso.svg" alt="Pulso Academias" width="160" height="39">
        <h1>Entrar</h1>
        <p class="texto-suave">Reserve aulas em qualquer unidade da rede.</p>
        ${expirou ? '<p class="alerta alerta--aviso" role="status">Sua sessão expirou. Entre novamente para continuar de onde parou.</p>' : ''}
        <p class="alerta alerta--erro" id="erro-geral" role="alert" hidden></p>

        <div class="campo">
          <label for="email">E-mail</label>
          <input id="email" name="email" type="email" autocomplete="username" aria-describedby="erro-email">
          <p class="campo__erro" id="erro-email"></p>
        </div>
        <div class="campo">
          <label for="senha">Senha</label>
          <div class="campo__senha">
            <input id="senha" name="senha" type="password" autocomplete="current-password" aria-describedby="erro-senha">
            <button type="button" class="btn-texto" id="ver-senha" aria-pressed="false">Mostrar</button>
          </div>
          <p class="campo__erro" id="erro-senha"></p>
        </div>
        <button class="btn btn--primario btn--largo" type="submit"><span class="btn__texto">Entrar</span></button>
        <p class="texto-suave texto-pequeno">Conta de teste: aluno@pulso.com.br · Pulso2026!</p>
      </form>
    </div>
  </section>`;

  const form = raiz.querySelector('form');
  const botao = form.querySelector('[type="submit"]');
  const erroGeral = form.querySelector('#erro-geral');
  form.email.focus();

  // Mostrar/ocultar senha: troca o type e informa o estado com aria-pressed.
  const ver = form.querySelector('#ver-senha');
  ver.addEventListener('click', () => {
    const mostrar = form.senha.type === 'password';
    form.senha.type = mostrar ? 'text' : 'password';
    ver.textContent = mostrar ? 'Ocultar' : 'Mostrar';
    ver.setAttribute('aria-pressed', mostrar);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    limparErros(form);
    erroGeral.hidden = true;
    botao.disabled = true;                       // evita duplo clique = duas requisições
    botao.classList.add('carregando');
    botao.querySelector('.btn__texto').textContent = 'Entrando…';
    try {
      const r = await api('/login', { metodo: 'POST', corpo: { email: form.email.value.trim(), senha: form.senha.value } });
      sessao.salvar(r.token, r.usuario);
      location.hash = destinoDepoisDoLogin();
    } catch (err) {
      if (err.status === 422) mostrarErros(form, err.erros);
      else { erroGeral.textContent = err.message; erroGeral.hidden = false; }
      botao.disabled = false;
      botao.classList.remove('carregando');
      botao.querySelector('.btn__texto').textContent = 'Entrar';
    }
  });
}

/** Erros 422 por campo: texto embaixo do campo + aria-invalid; foco no primeiro campo com erro. */
export function mostrarErros(form, erros) {
  let primeiro = null;
  for (const [campo, msgs] of Object.entries(erros)) {
    const input = form.elements[campo];
    const alvo = form.querySelector(`#erro-${campo.replace(/_/g, '-')}`);
    if (alvo) alvo.textContent = msgs[0];
    if (input) { input.setAttribute('aria-invalid', 'true'); primeiro ??= input; }
  }
  primeiro?.focus();
}
export function limparErros(form) {
  form.querySelectorAll('.campo__erro').forEach((p) => (p.textContent = ''));
  form.querySelectorAll('[aria-invalid]').forEach((i) => i.removeAttribute('aria-invalid'));
}
