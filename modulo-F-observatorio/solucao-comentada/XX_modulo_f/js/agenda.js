/* agenda.js — abas por mês + filtro por tipo + acordeão + modal de reserva.
   Ideia central: UM objeto "estado" e UMA função "desenhar()".
   Todo clique só muda o estado e chama desenhar(). Nada de mexer no DOM espalhado. */

const estado = {
  eventos: [],          // vem do dados/eventos.json
  mes: '2026-12',       // aba ativa (aaaa-mm)
  tipo: '',             // '' = todas
  aberto: null,         // id do evento aberto no acordeão (só um por vez)
  reservando: null,     // evento do modal
};

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const NOMES_TIPO = { observacao: 'Observação', palestra: 'Palestra', oficina: 'Oficina' };

const lista = document.getElementById('lista-eventos');
const contador = document.querySelector('.agenda__contador');
const abas = [...document.querySelectorAll('.aba')];
const painel = document.getElementById('painel-eventos');
const chips = [...document.querySelectorAll('.chip')];

// ---------- CARREGAR OS DADOS ----------
fetch('dados/eventos.json')
  .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then((dados) => {
    estado.eventos = dados.sort((a, b) => (a.data + a.horaInicio).localeCompare(b.data + b.horaInicio));
    desenhar();
  })
  .catch(() => { contador.textContent = 'Não foi possível carregar a agenda.'; });

// ---------- FUNÇÕES DE APOIO ----------
function diaDaSemana(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return DIAS[new Date(a, m - 1, d).getDay()];          // new Date(a, m, d) usa o fuso LOCAL: sem erro de dia
}
const precoTexto = (p) => (p === 0 ? 'Gratuito' : formatoMoeda.format(p));
function filtrados() {
  return estado.eventos.filter((e) => e.data.startsWith(estado.mes) && (!estado.tipo || e.tipo === estado.tipo));
}

// ---------- DESENHAR ----------
function desenhar() {
  // quantidade por mês nas abas (respeita o filtro de tipo)
  abas.forEach((aba) => {
    const qtd = estado.eventos.filter((e) => e.data.startsWith(aba.dataset.mes) && (!estado.tipo || e.tipo === estado.tipo)).length;
    aba.querySelector('.aba__qtd').textContent = qtd;
  });

  const itens = filtrados();
  contador.textContent = itens.length === 1 ? '1 atividade' : `${itens.length} atividades`;

  if (itens.length === 0) {
    lista.innerHTML = `<li class="vazio"><span class="icone icone--alerta" aria-hidden="true"></span>
      <p><strong>Nenhuma atividade deste tipo neste mês.</strong><br>Escolha outro tipo ou outro mês.</p></li>`;
    return;
  }

  lista.innerHTML = itens.map((e, i) => {
    const [, m, d] = e.data.split('-');
    const aberto = estado.aberto === e.id;
    const esgotado = e.vagasRestantes === 0;
    const ocupado = (e.vagas - e.vagasRestantes) / e.vagas;
    return `
    <li class="evento" style="--i:${i}">
      <button class="evento__cabeca" type="button" aria-expanded="${aberto}" aria-controls="ev-${e.id}" data-id="${e.id}">
        <span class="evento__data" aria-hidden="true"><strong>${d}</strong><span>${MESES[m - 1]}</span></span>
        <span class="evento__info">
          <span class="evento__titulo">${e.titulo}</span>
          <span class="evento__meta">
            <span class="etiqueta etiqueta--${e.tipo}">${NOMES_TIPO[e.tipo]}</span>
            <span><span class="icone icone--calendario" aria-hidden="true"></span>${diaDaSemana(e.data)}, ${dataBR(e.data)}</span>
            <span><span class="icone icone--relogio" aria-hidden="true"></span>${e.horaInicio} às ${e.horaFim}</span>
          </span>
        </span>
        <span class="evento__preco">${precoTexto(e.preco)}
          <span class="evento__vagas ${esgotado ? 'evento__vagas--esgotado' : ''}">${esgotado ? 'Esgotado' : `${e.vagasRestantes} vagas`}</span>
        </span>
        <span class="evento__seta icone icone--seta-baixo" aria-hidden="true"></span>
      </button>
      <div class="evento__painel" id="ev-${e.id}" role="region" aria-labelledby="ev-${e.id}-t">
        <div>
          <div class="evento__corpo">
            <div>
              <p id="ev-${e.id}-t" class="visualmente-oculto">${e.titulo}</p>
              <p>${e.descricao}</p>
              <p class="evento__meta"><span><span class="icone icone--local" aria-hidden="true"></span>${e.local}</span>
                 <span><span class="icone icone--usuarios" aria-hidden="true"></span>${e.publico}</span></p>
            </div>
            <div class="evento__lado">
              <div class="ocupacao">
                <div class="ocupacao__rotulo"><span>Ocupação</span><span>${e.vagas - e.vagasRestantes} de ${e.vagas}</span></div>
                <div class="ocupacao__barra" style="--ocupado:${ocupado.toFixed(2)}"><span></span></div>
              </div>
              <button class="botao botao--primario" type="button" data-reservar="${e.id}" ${esgotado ? 'disabled' : ''} ${aberto ? '' : 'tabindex="-1"'}>
                <span class="icone icone--ingresso" aria-hidden="true"></span>${esgotado ? 'Esgotado' : 'Reservar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </li>`;
  }).join('');
}

// ---------- ABAS ----------
function selecionarAba(aba, focar) {
  abas.forEach((a) => {
    const ativa = a === aba;
    a.setAttribute('aria-selected', String(ativa));
    a.tabIndex = ativa ? 0 : -1;                        // só a aba ativa entra no Tab (padrão ARIA)
  });
  document.querySelector('.abas').style.setProperty('--aba', abas.indexOf(aba));  // move o indicador
  painel.setAttribute('aria-labelledby', aba.id);
  estado.mes = aba.dataset.mes;
  estado.aberto = null;
  if (focar) aba.focus();
  desenhar();
}
abas.forEach((aba) => aba.addEventListener('click', () => selecionarAba(aba)));
document.querySelector('.abas').addEventListener('keydown', (e) => {
  const atual = abas.indexOf(document.activeElement);
  if (atual < 0) return;
  let novo = null;
  if (e.key === 'ArrowRight') novo = (atual + 1) % abas.length;            // circular
  if (e.key === 'ArrowLeft') novo = (atual - 1 + abas.length) % abas.length;
  if (e.key === 'Home') novo = 0;
  if (e.key === 'End') novo = abas.length - 1;
  if (novo !== null) { e.preventDefault(); selecionarAba(abas[novo], true); }
});

// ---------- FILTRO POR TIPO ----------
chips.forEach((chip) => chip.addEventListener('click', () => {
  chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
  estado.tipo = chip.dataset.tipo;
  estado.aberto = null;
  desenhar();
}));

// ---------- ACORDEÃO (delegação: um ouvinte só na lista) ----------
lista.addEventListener('click', (e) => {
  const cabeca = e.target.closest('.evento__cabeca');
  if (cabeca) {
    const id = Number(cabeca.dataset.id);
    // abrir um fecha o outro: o estado guarda UM id só.
    // Não redesenhamos a lista (perderia a animação); só trocamos os atributos.
    estado.aberto = estado.aberto === id ? null : id;
    lista.querySelectorAll('.evento__cabeca').forEach((c) => {
      const aberto = Number(c.dataset.id) === estado.aberto;
      c.setAttribute('aria-expanded', String(aberto));
      const reservar = c.nextElementSibling.querySelector('[data-reservar]');
      reservar.tabIndex = aberto ? 0 : -1;             // botão escondido não recebe foco
    });
    return;
  }
  const reservar = e.target.closest('[data-reservar]');
  if (reservar) abrirReserva(Number(reservar.dataset.reservar), reservar);
});

// ---------- MODAL DE RESERVA ----------
const modal = document.getElementById('modal-reserva');
const form = document.getElementById('form-reserva');
const campoQtd = document.getElementById('r-qtd');
const total = document.getElementById('r-total');
const sucesso = document.getElementById('reserva-ok');
let quemAbriu = null;

function abrirReserva(id, origem) {
  const ev = estado.eventos.find((e) => e.id === id);
  estado.reservando = ev;
  quemAbriu = origem;
  form.reset();
  form.hidden = false;
  sucesso.hidden = true;
  form.querySelectorAll('.campo').forEach((c) => c.classList.remove('campo--erro'));
  form.querySelectorAll('.campo__erro').forEach((p) => (p.textContent = ''));
  campoQtd.max = Math.min(6, ev.vagasRestantes);       // não deixa reservar mais do que sobrou
  document.getElementById('modal-evento').textContent = `${ev.titulo} · ${dataBR(ev.data)} às ${ev.horaInicio} · ${precoTexto(ev.preco)} por pessoa`;
  atualizarTotal();
  modal.showModal();
  document.body.classList.add('travado');              // a página de trás não rola
  document.getElementById('r-nome').focus();
}
function fecharReserva() { modal.close(); }
modal.addEventListener('close', () => {               // dispara no X, no Esc e no clique fora
  document.body.classList.remove('travado');
  if (quemAbriu) quemAbriu.focus();                    // foco volta para quem abriu
});
modal.querySelector('.modal__fechar').addEventListener('click', fecharReserva);
sucesso.querySelector('[data-fechar]').addEventListener('click', fecharReserva);
modal.addEventListener('click', (e) => { if (e.target === modal) fecharReserva(); }); // clique no fundo

function atualizarTotal() {
  const qtd = Math.max(0, Number(campoQtd.value) || 0);
  total.textContent = estado.reservando.preco === 0 ? 'Gratuito' : formatoMoeda.format(qtd * estado.reservando.preco);
}
campoQtd.addEventListener('input', atualizarTotal);

// mensagens em português usando a validação nativa (validity)
function mensagem(campo) {
  const v = campo.validity;
  if (v.valid) return '';
  if (campo.type === 'checkbox') return 'Confirme que leu as regras de visita.';
  if (v.valueMissing) return 'Preencha este campo.';
  if (v.typeMismatch) return 'Digite um e-mail válido, como nome@exemplo.com.';
  if (v.tooShort) return `Use pelo menos ${campo.minLength} letras.`;
  if (v.rangeUnderflow) return 'A quantidade mínima é 1.';
  if (v.rangeOverflow) return `Restam só ${campo.max} vagas por reserva.`;
  return 'Valor inválido.';
}
function validar(campo) {
  const texto = mensagem(campo);
  campo.closest('.campo').classList.toggle('campo--erro', !!texto);
  campo.setAttribute('aria-invalid', String(!!texto));
  document.getElementById(campo.getAttribute('aria-describedby')).textContent = texto;
  return !texto;
}
form.querySelectorAll('input').forEach((c) => c.addEventListener('blur', () => validar(c)));

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const campos = [...form.querySelectorAll('input')];
  const ok = campos.map(validar).every(Boolean);
  if (!ok) { campos.find((c) => !c.validity.valid).focus(); return; }

  const ev = estado.reservando;
  const qtd = Number(campoQtd.value);
  ev.vagasRestantes -= qtd;                            // muda o ESTADO...
  const protocolo = `OES-${ev.data.replaceAll('-', '').slice(2)}-${String(ev.id).padStart(2, '0')}${String(ev.vagasRestantes).padStart(3, '0')}`;
  document.getElementById('reserva-texto').textContent = `${qtd} ${qtd === 1 ? 'vaga reservada' : 'vagas reservadas'} para ${ev.titulo} em ${dataBR(ev.data)}. Guarde o protocolo:`;
  document.getElementById('reserva-protocolo').textContent = protocolo;
  form.hidden = true;
  sucesso.hidden = false;
  sucesso.querySelector('button').focus();
  desenhar();                                          // ...e a lista mostra as vagas novas
  quemAbriu = lista.querySelector(`[data-id="${ev.id}"]`);
});
