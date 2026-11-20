/* =====================================================================
   B1-E · Inscrição com validação ao vivo, máscara de data e idade mínima
   Organização:
   1. regras (uma função por campo que devolve '' se ok ou a mensagem);
   2. um objeto "tocado" para só mostrar erro depois que o usuário digitou;
   3. uma função mostrar() que pinta o campo e uma atualizarBotao().
   ===================================================================== */

const SESSAO = { dia: 12, mes: 12, ano: 2026 };   // data da sessão (12/12/2026)
const IDADE_MINIMA = 12;
const MAX_OBS = 200;

const form    = document.getElementById('form');
const enviar  = document.getElementById('enviar');
const sucesso = document.getElementById('sucesso');
const campos  = ['nome', 'email', 'nascimento', 'obs'];
const tocado  = { nome: false, email: false, nascimento: false, obs: false };

/* ---------- 1. Regras ---------- */

// Nome: pelo menos 2 palavras com 2+ letras; letras com acento, espaço, ' e -
function validarNome(v) {
  const t = v.trim();
  if (t === '') return 'Informe o nome completo.';
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(t)) return 'Use apenas letras.';
  const palavras = t.split(/\s+/).filter(p => p.length >= 2);
  if (palavras.length < 2) return 'Digite nome e sobrenome.';
  return '';
}

// E-mail: um @, usuário e domínio sem espaço, domínio com ponto e final com 2+ letras
function validarEmail(v) {
  if (v === '') return 'Informe o e-mail.';
  if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v)) return 'E-mail inválido. Exemplo: ana@senai.br';
  return '';
}

// Data real? new Date "corrige" 31/04 para 01/05, então comparamos de volta.
function dataExiste(d, m, a) {
  const dt = new Date(a, m - 1, d);     // construtor local: sem problema de fuso
  return dt.getFullYear() === a && dt.getMonth() === m - 1 && dt.getDate() === d;
}

// Idade completa em uma data alvo (sem usar milissegundos, que erram por fuso)
function idadeEm(d, m, a, alvo) {
  let idade = alvo.ano - a;
  // ainda não fez aniversário no ano da sessão? tira 1
  if (alvo.mes < m || (alvo.mes === m && alvo.dia < d)) idade--;
  return idade;
}

function validarNascimento(v) {
  if (v === '') return 'Informe a data de nascimento.';
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  if (!m) return 'Data incompleta. Use dd/mm/aaaa.';
  const [dia, mes, ano] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (ano < 1900 || !dataExiste(dia, mes, ano)) return 'Esta data não existe.';
  const idade = idadeEm(dia, mes, ano, SESSAO);
  if (idade < 0) return 'A data não pode ser depois da sessão.';
  if (idade < IDADE_MINIMA) return `Idade mínima: ${IDADE_MINIMA} anos na data da sessão.`;
  return '';
}

function validarObs(v) {
  return v.length > MAX_OBS ? `Máximo de ${MAX_OBS} caracteres.` : '';
}

const regras = { nome: validarNome, email: validarEmail, nascimento: validarNascimento, obs: validarObs };

/* ---------- 2. Máscara dd/mm/aaaa ----------
   Remove tudo que não é número, corta em 8 dígitos e coloca as barras. */
function mascararData(v) {
  const n = v.replace(/\D/g, '').slice(0, 8);
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
}

/* ---------- 3. Mostrar estado de um campo ---------- */
function mostrar(id) {
  const input = document.getElementById(id);
  const erro  = document.getElementById('erro-' + id);
  const msg   = regras[id](input.value);

  if (!tocado[id]) return msg === '';          // não tocado: não pinta nada

  erro.textContent = msg;
  input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  input.classList.toggle('invalido', !!msg);
  // campo opcional vazio não fica verde (não há o que validar)
  input.classList.toggle('valido', !msg && input.value !== '');
  return msg === '';
}

function atualizarContador() {
  const n = document.getElementById('obs').value.length;
  const c = document.getElementById('contador');
  c.textContent = `${n}/${MAX_OBS}`;
  c.classList.toggle('alerta', n >= 180 && n <= MAX_OBS);
  c.classList.toggle('estourou', n > MAX_OBS);
}

// O botão olha as REGRAS de todos os campos, tocados ou não.
function atualizarBotao() {
  enviar.disabled = !campos.every(id => regras[id](document.getElementById(id).value) === '');
}

/* ---------- 4. Eventos ---------- */
campos.forEach(id => {
  const input = document.getElementById(id);
  input.addEventListener('input', () => {
    if (id === 'nascimento') input.value = mascararData(input.value);
    if (id === 'obs') atualizarContador();
    tocado[id] = true;
    mostrar(id);
    atualizarBotao();
    sucesso.hidden = true;
  });
});

form.addEventListener('submit', e => {
  e.preventDefault();                       // não recarrega a página
  campos.forEach(id => { tocado[id] = true; mostrar(id); });
  atualizarBotao();
  if (enviar.disabled) return;

  const nome = document.getElementById('nome').value.trim();
  const [d, m, a] = document.getElementById('nascimento').value.split('/').map(Number);
  const idade = idadeEm(d, m, a, SESSAO);
  sucesso.textContent = `Inscrição confirmada, ${nome}! Você terá ${idade} anos na sessão de 12/12/2026.`;
  sucesso.hidden = false;
  limpar(false);
});

// Limpar: esvazia os campos E os estados/mensagens.
// (Não chamamos form.reset() aqui: ele dispararia o evento reset de novo.)
function limpar(esconderSucesso = true) {
  campos.forEach(id => {
    tocado[id] = false;
    const input = document.getElementById(id);
    input.value = '';
    input.classList.remove('valido', 'invalido');
    input.removeAttribute('aria-invalid');
    document.getElementById('erro-' + id).textContent = '';
  });
  atualizarContador();
  enviar.disabled = true;
  if (esconderSucesso) sucesso.hidden = true;
}

form.addEventListener('reset', e => {
  e.preventDefault();                        // o reset é feito pela nossa função
  limpar();
});
