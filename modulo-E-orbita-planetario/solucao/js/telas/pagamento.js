// =====================================================================
// telas/pagamento.js – pagamento em 3 passos (wizard).
//   1 Seus dados  ->  2 Pagamento  ->  3 Revisão e confirmação
//
// Regras:
//  - sem carrinho, a rota não abre: volta para #/programacao com aviso
//  - não avança com campo inválido; foco vai para o PRIMEIRO campo com erro
//  - voltar um passo mantém o que foi digitado (também no F5: sessionStorage)
//  - máscaras enquanto digita: CPF 000.000.000-00, celular (00) 00000-0000,
//    cartão 0000 0000 0000 0000, validade MM/AA
//  - validações de verdade: dígitos do CPF, Luhn do cartão, validade não vencida
//  - ao confirmar: código ORB-AAAAMMDD-XXXX, reserva no localStorage,
//    lugares passam a ocupados, carrinho e cronômetro são zerados
// =====================================================================
import { dados, sessaoPorId, ocupados, ocupadosLocais, gravarOcupadosLocais } from '../api.js';
import { agora, isoDia, dataBR, diaSemana, reais, esc, centavos, ler, gravar } from '../util.js';
import { carrinho, limparCarrinho } from '../carrinho.js';
import { valores } from './sessao.js';
import { avisar } from '../avisos.js';

export const titulo = 'Pagamento';
const CHAVE = 'orbita:checkout';

// ---------------- Validações (funções puras, fáceis de testar no console) ----------------
const soDigitos = v => String(v).replace(/\D/g, '');

export function cpfValido(cpf) {
  const d = soDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;     // 111.111.111-11 passa na conta, mas é inválido
  const dv = n => {                                                  // n = 9 ou 10 primeiros dígitos
    const soma = [...d.slice(0, n)].reduce((s, x, i) => s + Number(x) * (n + 1 - i), 0);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

// Algoritmo de Luhn: dobra um dígito sim, um não, da direita para a esquerda.
export function luhn(numero) {
  const d = soDigitos(numero);
  if (d.length !== 16) return false;
  let soma = 0;
  [...d].reverse().forEach((x, i) => {
    let n = Number(x);
    if (i % 2 === 1) { n *= 2; if (n > 9) n -= 9; }
    soma += n;
  });
  return soma % 10 === 0;
}

// "12/26" é válido até o último dia de dezembro de 2026.
export function validadeOk(mmaa, hoje = agora()) {
  const m = /^(\d{2})\/(\d{2})$/.exec(mmaa);
  if (!m) return false;
  const mes = Number(m[1]), ano = 2000 + Number(m[2]);
  if (mes < 1 || mes > 12) return false;
  return ano > hoje.getFullYear() || (ano === hoje.getFullYear() && mes >= hoje.getMonth() + 1);
}

const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const nomeOk = v => v.trim().split(/\s+/).filter(p => p.length >= 2).length >= 2;

// ---------------- Máscaras ----------------
const MASCARAS = {
  cpf: v => soDigitos(v).slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'),
  celular: v => soDigitos(v).slice(0, 11).replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2'),
  cartao: v => soDigitos(v).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '),
  validade: v => soDigitos(v).slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2'),
  cvv: v => soDigitos(v).slice(0, 3),
};

// ---------------- Regras de cada campo: [teste, mensagem] ----------------
const REGRAS = {
  nome: [nomeOk, 'Informe nome e sobrenome.'],
  cpf: [cpfValido, 'CPF inválido. Confira os 11 dígitos.'],
  email: [emailOk, 'Informe um e-mail válido, como nome@exemplo.com.'],
  celular: [v => soDigitos(v).length === 11, 'Informe o celular com DDD: (11) 98765-4321.'],
  cartao: [luhn, 'Número de cartão inválido.'],
  titular: [nomeOk, 'Informe o nome como está no cartão.'],
  validade: [v => validadeOk(v), 'Validade inválida ou cartão vencido (MM/AA).'],
  cvv: [v => /^\d{3}$/.test(v), 'O CVV tem 3 dígitos.'],
  aceite: [v => v === true, 'Você precisa aceitar as regras para confirmar.'],
};
const CAMPOS_PASSO = {
  1: ['nome', 'cpf', 'email', 'celular'],
  2: f => (f.forma === 'cartao' ? ['cartao', 'titular', 'validade', 'cvv'] : []),
  3: ['aceite'],
};

export function montar(main) {
  const c = carrinho();
  if (!c) {
    avisar('Escolha os lugares antes de ir para o pagamento.', { tipo: 'info' });
    return { redirecionar: '#/programacao' };
  }
  const s = sessaoPorId(c.sessaoId);
  const v = valores(c.lugares, s.preco_inteira, dados.config.taxa_servico_percentual);
  const form = ler(CHAVE, { passo: 1, forma: 'pix', parcelas: 1, aceite: false }, sessionStorage);
  // Carrinho novo (outra sessão ou outros lugares)? Recomeça do passo 1, mas mantém os dados digitados.
  const assinatura = `${c.sessaoId}:${c.lugares.map(l => l.id + l.tipo).join(',')}`;
  if (form.carrinho !== assinatura) Object.assign(form, { carrinho: assinatura, passo: 1, aceite: false });

  function salvar() { gravar(CHAVE, form, sessionStorage); }

  function desenhar(focar = true) {
    const p = form.passo;
    main.innerHTML = `
      <div class="cabecalho-pagina">
        <a class="link-voltar" href="#/sessao/${s.id}">‹ Voltar aos lugares</a>
        <h1>Pagamento</h1>
        <p>${esc(s.programa.titulo)} · ${diaSemana(s.data)}, ${dataBR(s.data)} às ${s.hora} · Lugares ${c.lugares.map(l => l.id).join(', ')}</p>
      </div>
      <ol class="passos" aria-label="Etapas do pagamento">
        ${['Seus dados', 'Pagamento', 'Revisão'].map((t, i) => `
          <li class="passos__item ${i + 1 < p ? 'passos__item--feito' : ''}" ${i + 1 === p ? 'aria-current="step"' : ''}>
            <span class="passos__num" aria-hidden="true">${i + 1 < p ? '✓' : i + 1}</span>${t}</li>`).join('')}
      </ol>
      <div class="compra">
        <form class="cartao-form" id="form" novalidate>
          ${p === 1 ? passo1() : p === 2 ? passo2() : passo3()}
          <div class="form__botoes">
            ${p > 1 ? '<button type="button" class="botao botao--contorno" id="voltar">Voltar</button>' : '<span></span>'}
            <button type="submit" class="botao brilho">${p < 3 ? 'Continuar' : `Confirmar e pagar ${reais(v.total)}`}</button>
          </div>
        </form>
        <aside class="resumo">
          <h2>Resumo</h2>
          <p class="resumo__tempo">Lugares reservados por <strong data-tempo-restante>--:--</strong></p>
          <ul class="ingressos ingressos--simples">${c.lugares.map(l => `<li><span class="ingressos__lugar">${l.id}</span> ${l.tipo === 'meia' ? 'Meia' : 'Inteira'} <b>${reais(l.tipo === 'meia' ? s.preco_inteira / 2 : s.preco_inteira)}</b></li>`).join('')}</ul>
          <dl class="resumo__valores">
            <div><dt>Ingressos</dt><dd>${reais(v.subtotal)}</dd></div>
            <div><dt>Taxa de serviço</dt><dd>${reais(v.taxa)}</dd></div>
            <div class="resumo__total"><dt>Total</dt><dd>${reais(v.total)}</dd></div>
          </dl>
        </aside>
      </div>`;
    ligar();
    if (focar) main.querySelector('h1').setAttribute('tabindex', '-1');
  }

  // ---------- HTML dos passos ----------
  const campo = (id, rotulo, tipo = 'text', extra = '') => `
    <div class="campo">
      <label for="c-${id}">${rotulo}</label>
      <input type="${tipo}" id="c-${id}" name="${id}" value="${esc(form[id] || '')}" aria-describedby="e-${id}" ${extra}>
      <p class="erro-campo" id="e-${id}"></p>
    </div>`;

  const passo1 = () => `
    <fieldset><legend class="form__titulo">1. Seus dados</legend>
      ${campo('nome', 'Nome completo', 'text', 'autocomplete="name"')}
      <div class="campos-2">
        ${campo('cpf', 'CPF', 'text', 'inputmode="numeric" placeholder="000.000.000-00" data-mascara="cpf"')}
        ${campo('celular', 'Celular', 'tel', 'inputmode="numeric" placeholder="(11) 98765-4321" data-mascara="celular"')}
      </div>
      ${campo('email', 'E-mail', 'email', 'autocomplete="email"')}
    </fieldset>`;

  const parcelas = n => `${n}x de ${reais(centavos(v.total / n))}${n > 1 ? ' sem juros' : ''}`;
  const passo2 = () => `
    <fieldset><legend class="form__titulo">2. Forma de pagamento</legend>
      <div class="opcoes-pagamento">
        <label class="opcao"><input type="radio" name="forma" value="pix" ${form.forma === 'pix' ? 'checked' : ''}><span><b>Pix</b> aprovação na hora</span></label>
        <label class="opcao"><input type="radio" name="forma" value="cartao" ${form.forma === 'cartao' ? 'checked' : ''}><span><b>Cartão de crédito</b> até 3x sem juros</span></label>
      </div>
      ${form.forma === 'pix' ? `
        <div class="pix">
          <label for="pix-codigo">Pix copia e cola</label>
          <div class="pix__linha">
            <input id="pix-codigo" readonly value="${codigoPix()}">
            <button type="button" class="botao botao--pequeno" id="copiar">Copiar</button>
          </div>
          <p class="suave">O código vale enquanto o cronômetro estiver correndo.</p>
        </div>` : `
        ${campo('cartao', 'Número do cartão', 'text', 'inputmode="numeric" placeholder="0000 0000 0000 0000" data-mascara="cartao" autocomplete="cc-number"')}
        ${campo('titular', 'Nome impresso no cartão', 'text', 'autocomplete="cc-name"')}
        <div class="campos-3">
          ${campo('validade', 'Validade', 'text', 'inputmode="numeric" placeholder="MM/AA" data-mascara="validade" autocomplete="cc-exp"')}
          ${campo('cvv', 'CVV', 'text', 'inputmode="numeric" placeholder="123" data-mascara="cvv" autocomplete="cc-csc"')}
          <div class="campo"><label for="c-parcelas">Parcelas</label>
            <select id="c-parcelas" name="parcelas">${[1, 2, 3].map(n => `<option value="${n}" ${Number(form.parcelas) === n ? 'selected' : ''}>${parcelas(n)}</option>`).join('')}</select></div>
        </div>`}
    </fieldset>`;

  const passo3 = () => `
    <fieldset><legend class="form__titulo">3. Revisão</legend>
      <dl class="revisao">
        <div><dt>Nome</dt><dd>${esc(form.nome)}</dd><button type="button" class="botao botao--texto" data-ir="1">Editar</button></div>
        <div><dt>CPF</dt><dd>${esc(form.cpf)}</dd><button type="button" class="botao botao--texto" data-ir="1">Editar</button></div>
        <div><dt>E-mail</dt><dd>${esc(form.email)}</dd><button type="button" class="botao botao--texto" data-ir="1">Editar</button></div>
        <div><dt>Pagamento</dt><dd>${form.forma === 'pix' ? 'Pix' : `Cartão final ${soDigitos(form.cartao).slice(-4)} · ${parcelas(Number(form.parcelas))}`}</dd><button type="button" class="botao botao--texto" data-ir="2">Editar</button></div>
      </dl>
      <label class="check check--aceite"><input type="checkbox" name="aceite" id="c-aceite" ${form.aceite ? 'checked' : ''} aria-describedby="e-aceite">
        Li e aceito: o cancelamento só é possível até ${dados.config.cancelamento_minimo_horas} horas antes da sessão.</label>
      <p class="erro-campo" id="e-aceite"></p>
    </fieldset>`;

  function codigoPix() {
    return `00020126ORBITA-PLANETARIO-${s.id}-${c.lugares.map(l => l.id).join('')}-${v.total.toFixed(2).replace('.', '')}5303986BR`;
  }

  // ---------- validação ----------
  function camposDoPasso() {
    const lista = CAMPOS_PASSO[form.passo];
    return typeof lista === 'function' ? lista(form) : lista;
  }
  function validarCampo(nome) {
    const [teste, msg] = REGRAS[nome];
    const ok = teste(form[nome] ?? '');
    const input = main.querySelector(`[name="${nome}"]`);
    const erro = main.querySelector(`#e-${nome}`);
    if (input) input.setAttribute('aria-invalid', String(!ok));
    if (erro) erro.textContent = ok ? '' : msg;
    return ok;
  }

  // ---------- eventos ----------
  function ligar() {
    const f = main.querySelector('#form');
    f.addEventListener('input', e => {
      const el = e.target;
      if (el.dataset.mascara) el.value = MASCARAS[el.dataset.mascara](el.value);
      form[el.name] = el.type === 'checkbox' ? el.checked : el.value;
      // depois do primeiro erro, revalida enquanto digita (o erro some quando corrige)
      if (el.getAttribute('aria-invalid') === 'true') validarCampo(el.name);
      salvar();
    });
    // valida ao sair do campo
    f.addEventListener('focusout', e => { if (REGRAS[e.target.name] && e.target.value) validarCampo(e.target.name); });
    f.addEventListener('change', e => {
      if (e.target.name === 'forma') { form.forma = e.target.value; salvar(); desenhar(false); main.querySelector(`[name="forma"][value="${form.forma}"]`).focus(); }
      if (e.target.name === 'parcelas') { form.parcelas = Number(e.target.value); salvar(); }
    });
    f.addEventListener('submit', e => {
      e.preventDefault();
      const invalidos = camposDoPasso().filter(n => !validarCampo(n));
      if (invalidos.length) {
        main.querySelector(`[name="${invalidos[0]}"]`).focus();
        avisar(`Corrija ${invalidos.length === 1 ? 'o campo destacado' : `os ${invalidos.length} campos destacados`}.`, { tipo: 'erro' });
        return;
      }
      if (form.passo < 3) { form.passo++; salvar(); desenhar(); focarPasso(); return; }
      confirmarCompra();
    });
    main.querySelector('#voltar')?.addEventListener('click', () => { form.passo--; salvar(); desenhar(); focarPasso(); });
    main.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => { form.passo = Number(b.dataset.ir); salvar(); desenhar(); focarPasso(); }));
    main.querySelector('#copiar')?.addEventListener('click', copiarPix);
  }
  function focarPasso() { main.querySelector('legend')?.closest('fieldset').querySelector('input, select')?.focus(); }

  // Clipboard API só existe em "contexto seguro" (https ou localhost).
  // Na prova o site roda em http://IP/…, então precisamos do plano B.
  async function copiarPix() {
    const input = main.querySelector('#pix-codigo');
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(input.value);
      else { input.select(); document.execCommand('copy'); }
      const b = main.querySelector('#copiar'); b.textContent = 'Copiado!';
      setTimeout(() => (b.textContent = 'Copiar'), 2000);
      avisar('Código Pix copiado.', { tipo: 'sucesso' });
    } catch { avisar('Não foi possível copiar. Selecione o código e copie manualmente.', { tipo: 'erro' }); }
  }

  function confirmarCompra() {
    // Alguém comprou o mesmo lugar em outra aba enquanto pagávamos?
    const tomados = ocupados(s);
    const conflito = c.lugares.filter(l => tomados.has(l.id));
    if (conflito.length) {
      avisar(`O lugar ${conflito.map(l => l.id).join(', ')} acabou de ser vendido. Escolha outro.`, { tipo: 'erro', duracao: 6000 });
      location.hash = `#/sessao/${s.id}`; return;
    }
    const reservas = ler('orbita:reservas', []);
    const codigo = gerarCodigo(reservas);
    reservas.unshift({
      codigo,
      sessao: { programa: s.programa.titulo, sala: s.sala.nome, data: s.data, hora: s.hora },
      sessao_id: s.id,
      lugares: c.lugares.map(l => ({ id: l.id, tipo: l.tipo, valor: l.tipo === 'meia' ? s.preco_inteira / 2 : s.preco_inteira })),
      subtotal: v.subtotal, taxa: v.taxa, total: v.total,
      status: 'ativa', criada_em: agora().toISOString(), cancelada_em: null,
      cliente: { nome: form.nome.trim(), email: form.email.trim() },
      pagamento: form.forma === 'pix' ? 'Pix' : `Cartão final ${soDigitos(form.cartao).slice(-4)}`,
    });
    gravar('orbita:reservas', reservas);
    gravarOcupadosLocais(s.id, [...ocupadosLocais(s.id), ...c.lugares.map(l => l.id)]);
    limparCarrinho();
    sessionStorage.removeItem(CHAVE);
    avisar(`Compra confirmada! Código ${codigo}.`, { tipo: 'sucesso', duracao: 6000 });
    location.hash = `#/reservas?nova=${codigo}`;
  }

  const expirou = () => { sessionStorage.removeItem(CHAVE); location.hash = `#/sessao/${s.id}`; };
  window.addEventListener('carrinho-expirou', expirou);

  desenhar();
  return { limpar: () => window.removeEventListener('carrinho-expirou', expirou) };
}

// ORB-20261205-K7Q2: data de "agora" + 4 caracteres sem 0/O/1/I (fáceis de confundir)
function gerarCodigo(existentes) {
  const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo;
  do {
    const sufixo = Array.from({ length: 4 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join('');
    codigo = `ORB-${isoDia(agora()).replaceAll('-', '')}-${sufixo}`;
  } while (existentes.some(r => r.codigo === codigo));
  return codigo;
}
