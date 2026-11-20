/*
 * Tela PERFIL (#/perfil)
 *  - Foto: escolher OU arrastar e soltar, validar no navegador (tipo e 2 MB), pré-visualizar na hora
 *    e enviar com FormData para POST /me/foto. Se a API recusar (422), a foto antiga volta.
 *  - Dados: PATCH /me com JSON; erros 422 aparecem embaixo de cada campo.
 *    Telefone com máscara enquanto digita: (11) 91234-5678.
 *  - Tema: claro, escuro ou automático (segue o sistema), guardado no localStorage.
 *  - Regras da academia: ACORDEÃO com um item aberto por vez (aria-expanded + região).
 *  - Sair: POST /logout, limpa a sessão e volta ao login.
 */
import { api, sessao } from '../api.js';
import { cat, carregarCatalogos } from '../dados.js';
import { desenharUsuario, avatarHTML } from '../navegacao.js';
import * as f from '../formatos.js';
import { esc } from '../formatos.js';
import { toast } from '../componentes/toast.js';
import { mostrarErros, limparErros } from './entrar.js';

const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024;

export function montar(raiz) {
  const u = sessao.usuario;
  raiz.innerHTML = `
  <div class="pagina">
    <header class="cabecalho-pagina">
      <div><p class="sobretitulo">Aluno desde ${f.data(f.dataLocal(u.membro_desde))}</p><h1>Meu perfil</h1></div>
      <button type="button" class="btn btn--fantasma" id="sair">Sair da conta</button>
    </header>
    <div class="perfil">
      <section class="cartao perfil__foto" aria-labelledby="t-foto">
        <h2 id="t-foto">Foto</h2>
        <div class="soltar" id="soltar">
          <div class="avatar avatar--grande" id="avatar-grande">${avatarHTML(u)}</div>
          <p>Arraste uma imagem para cá ou</p>
          <label class="btn btn--contorno btn--pequeno" for="arquivo">Escolher foto</label>
          <input class="so-leitor" type="file" id="arquivo" accept="image/jpeg,image/png,image/webp" aria-describedby="erro-foto dica-foto">
          <p class="texto-suave texto-pequeno" id="dica-foto">JPG, PNG ou WEBP de até 2 MB.</p>
          <p class="campo__erro" id="erro-foto" role="alert"></p>
        </div>
      </section>

      <section class="cartao perfil__dados" aria-labelledby="t-dados">
        <h2 id="t-dados">Dados pessoais</h2>
        <form id="form-dados" novalidate>
          <div class="campo"><label for="nome">Nome completo</label>
            <input id="nome" name="nome" autocomplete="name" aria-describedby="erro-nome"><p class="campo__erro" id="erro-nome"></p></div>
          <div class="campo"><label for="email-p">E-mail</label>
            <input id="email-p" value="${esc(u.email)}" readonly aria-describedby="dica-email"><p class="texto-suave texto-pequeno" id="dica-email">Para trocar o e-mail, fale com a recepção.</p></div>
          <div class="campo"><label for="telefone">Celular</label>
            <input id="telefone" name="telefone" inputmode="numeric" autocomplete="tel-national" placeholder="(11) 91234-5678" aria-describedby="erro-telefone"><p class="campo__erro" id="erro-telefone"></p></div>
          <div class="campo"><label for="unidade_id">Unidade preferida</label>
            <select id="unidade_id" name="unidade_id"></select><p class="campo__erro" id="erro-unidade-id"></p></div>
          <div class="campo"><label for="meta_mensal">Meta de aulas por mês: <output id="meta-saida" for="meta_mensal"></output></label>
            <input type="range" id="meta_mensal" name="meta_mensal" min="4" max="30" step="1" aria-describedby="erro-meta-mensal"><p class="campo__erro" id="erro-meta-mensal"></p></div>
          <button class="btn btn--primario" type="submit" disabled>Salvar alterações</button>
        </form>
      </section>

      <section class="cartao perfil__tema" aria-labelledby="t-tema">
        <h2 id="t-tema">Aparência</h2>
        <fieldset class="opcoes-tema">
          <legend class="so-leitor">Tema</legend>
          ${[['claro', 'Claro'], ['escuro', 'Escuro'], ['auto', 'Automático']].map(([v, t]) => `
            <label class="opcao-tema opcao-tema--${v}"><input type="radio" name="tema" value="${v}"><span class="opcao-tema__amostra" aria-hidden="true"></span>${t}</label>`).join('')}
        </fieldset>
        <p class="texto-suave texto-pequeno">Automático acompanha o tema do seu sistema.</p>
      </section>

      <section class="cartao perfil__regras" aria-labelledby="t-regras">
        <h2 id="t-regras">Regras da academia</h2>
        <div class="acordeao" id="acordeao"></div>
      </section>
    </div>
  </div>`;
  const $ = (s) => raiz.querySelector(s);
  const form = $('#form-dados');
  const salvar = form.querySelector('[type="submit"]');

  /* ---------- Dados: preencher, máscara, "sujo", salvar ---------- */
  carregarCatalogos().then(() => {
    $('#unidade_id').innerHTML = [...cat.unidades.values()].map((x) => `<option value="${x.id}">${esc(x.nome)}</option>`).join('');
    preencher(sessao.usuario);
    $('#acordeao').innerHTML = cat.regras.map((r, i) => `
      <h3 class="acordeao__titulo">
        <button type="button" id="ac-btn-${r.id}" aria-expanded="${i === 0}" aria-controls="ac-painel-${r.id}">
          ${esc(r.titulo)}<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
        </button>
      </h3>
      <div class="acordeao__painel${i === 0 ? ' aberto' : ''}" id="ac-painel-${r.id}" role="region" aria-labelledby="ac-btn-${r.id}">
        <div><p>${esc(r.texto)}</p></div>
      </div>`).join('');
  });
  function preencher(x) {
    form.nome.value = x.nome; form.telefone.value = x.telefone;
    form.unidade_id.value = x.unidade_id; form.meta_mensal.value = x.meta_mensal;
    $('#meta-saida').textContent = x.meta_mensal;
    salvar.disabled = true;
  }
  form.addEventListener('input', (e) => {
    if (e.target === form.telefone) e.target.value = mascaraTelefone(e.target.value);
    if (e.target === form.meta_mensal) $('#meta-saida').textContent = e.target.value;
    salvar.disabled = false;            // só habilita quando algo mudou
  });
  form.addEventListener('change', () => { salvar.disabled = false; });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    limparErros(form);
    salvar.disabled = true; salvar.classList.add('carregando');
    try {
      const r = await api('/me', { metodo: 'PATCH', corpo: {
        nome: form.nome.value.trim(), telefone: form.telefone.value,
        unidade_id: Number(form.unidade_id.value), meta_mensal: Number(form.meta_mensal.value) } });
      sessao.atualizarUsuario(r.dados);
      desenharUsuario();                 // o nome no cabeçalho muda na hora
      preencher(r.dados);
      toast('Dados salvos.');
    } catch (err) {
      if (err.status === 401) return;
      if (err.status === 422) mostrarErros(form, err.erros); else toast(err.message, 'erro');
      salvar.disabled = false;
    } finally { salvar.classList.remove('carregando'); }
  });

  /* ---------- Foto: input, arrastar e soltar, prévia e envio ---------- */
  const zona = $('#soltar');
  $('#arquivo').addEventListener('change', (e) => { if (e.target.files[0]) enviarFoto(e.target.files[0]); e.target.value = ''; });
  // dragover precisa de preventDefault, senão o navegador não deixa soltar (e abre o arquivo na aba!).
  zona.addEventListener('dragover', (e) => { e.preventDefault(); zona.classList.add('arrastando'); });
  zona.addEventListener('dragleave', (e) => { if (!zona.contains(e.relatedTarget)) zona.classList.remove('arrastando'); });
  zona.addEventListener('drop', (e) => {
    e.preventDefault(); zona.classList.remove('arrastando');
    const arq = e.dataTransfer.files[0]; if (arq) enviarFoto(arq);
  });

  async function enviarFoto(arq) {
    const erro = $('#erro-foto'); erro.textContent = '';
    if (!TIPOS.includes(arq.type)) { erro.textContent = 'Use uma imagem JPG, PNG ou WEBP.'; return; }
    if (arq.size > MAX_BYTES) { erro.textContent = `A foto tem ${(arq.size / 1048576).toFixed(1).replace('.', ',')} MB. O máximo é 2 MB.`; return; }
    const caixa = $('#avatar-grande');
    const antes = caixa.innerHTML;
    const url = URL.createObjectURL(arq);                 // prévia imediata, sem esperar o servidor
    caixa.innerHTML = `<img src="${url}" alt="Prévia da nova foto">`;
    caixa.classList.add('enviando');
    const dados = new FormData();
    dados.append('foto', arq);                            // o nome do campo é o que a API espera: "foto"
    try {
      const r = await api('/me/foto', { metodo: 'POST', corpo: dados });
      sessao.atualizarUsuario(r.dados);
      desenharUsuario();
      toast('Foto atualizada.');
    } catch (err) {
      caixa.innerHTML = antes;                            // deu errado: volta a foto anterior
      if (err.status !== 401) erro.textContent = err.erros?.foto?.[0] || err.message;
    } finally {
      caixa.classList.remove('enviando');
      setTimeout(() => URL.revokeObjectURL(url), 1000);   // libera a memória da prévia
    }
  }

  /* ---------- Tema ---------- */
  const radios = raiz.querySelectorAll('[name="tema"]');
  const marcarTema = () => radios.forEach((r) => { r.checked = r.value === window.PulsoTema.escolha(); });
  marcarTema();
  raiz.querySelector('.opcoes-tema').addEventListener('change', (e) => {
    window.PulsoTema.definir(e.target.value);
    document.dispatchEvent(new CustomEvent('tema-mudou'));
  });
  document.addEventListener('tema-mudou', marcarTema);

  /* ---------- Acordeão: abrir um fecha os outros ---------- */
  $('#acordeao').addEventListener('click', (e) => {
    const b = e.target.closest('button[aria-controls]'); if (!b) return;
    const abrir = b.getAttribute('aria-expanded') !== 'true';
    for (const outro of $('#acordeao').querySelectorAll('button[aria-controls]')) {
      const aberto = outro === b && abrir;
      outro.setAttribute('aria-expanded', aberto);
      document.getElementById(outro.getAttribute('aria-controls')).classList.toggle('aberto', aberto);
    }
  });

  /* ---------- Sair ---------- */
  $('#sair').addEventListener('click', async () => {
    try { await api('/logout', { metodo: 'POST' }); } catch { /* mesmo com erro, sai localmente */ }
    sessao.limpar();
    location.hash = '#/entrar';
  });

  return () => document.removeEventListener('tema-mudou', marcarTema);
}

/** Só dígitos -> (11) 91234-5678, montando aos poucos enquanto o usuário digita. */
export function mascaraTelefone(v) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
