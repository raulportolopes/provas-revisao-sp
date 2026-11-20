// Gera as imagens do Sabor de Bairro (ilustrações originais em SVG -> JPG). Uso: node imagens.js <pasta img>
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2];
const rests = JSON.parse(fs.readFileSync(__dirname + '/../app/api/semente/restaurantes.json'));
const cats = JSON.parse(fs.readFileSync(__dirname + '/../app/api/semente/categorias.json'));

// Pseudo-aleatório com semente (as imagens saem iguais a cada geração).
const rnd = (s) => () => ((s = (s * 9301 + 49297) % 233280) / 233280);

// Desenho do prato por categoria. v = variação (1..3). Centro (0,0), raio ~150.
const pratos = {
  1: (v, r) => { // pizza
    const molho = ['#C8361B', '#D9541F', '#B52D1A'][v - 1];
    let s = `<circle r="160" fill="#E7B266"/><circle r="140" fill="${molho}"/><circle r="135" fill="#F6D78B" opacity="${v === 2 ? .9 : .75}"/>`;
    for (let i = 0; i < 14; i++) { const a = r() * 6.28, d = 25 + r() * 95; s += v === 3 ? `<circle cx="${Math.cos(a) * d}" cy="${Math.sin(a) * d}" r="11" fill="#7A3B12"/>` : `<circle cx="${Math.cos(a) * d}" cy="${Math.sin(a) * d}" r="${v === 1 ? 14 : 12}" fill="${v === 1 ? '#3E8E41' : '#A3201B'}"/>`; }
    for (let i = 0; i < 6; i++) s += `<path d="M0 0 L${Math.cos(i * 1.047) * 160} ${Math.sin(i * 1.047) * 160}" stroke="#C78A3D" stroke-width="3" opacity=".6"/>`;
    return s;
  },
  2: (v, r) => { // sushi
    let s = `<rect x="-170" y="-110" width="340" height="220" rx="24" fill="#2B2B2B"/>`;
    const cores = v === 1 ? ['#F47C5A', '#F47C5A', '#F3F0E8'] : ['#E8524A', '#F6A04D', '#9BCB6A'];
    for (let i = 0; i < 6; i++) { const x = -110 + (i % 3) * 110, y = -45 + Math.floor(i / 3) * 95; s += `<circle cx="${x}" cy="${y}" r="42" fill="#1E3B2A"/><circle cx="${x}" cy="${y}" r="34" fill="#F6F3EA"/><circle cx="${x}" cy="${y}" r="17" fill="${cores[i % 3]}"/>`; }
    return s;
  },
  3: (v) => { // hambúrguer (de lado)
    const queijo = v === 2 ? '#F2A900' : '#F7C948';
    return `<ellipse cx="0" cy="120" rx="170" ry="22" fill="#000" opacity=".15"/>
      <path d="M-150 70 h300 a20 20 0 0 1 -20 30 h-260 a20 20 0 0 1 -20 -30z" fill="#D9913D"/>
      <rect x="-155" y="30" width="310" height="44" rx="20" fill="#5B2E14"/>
      ${v === 3 ? '<rect x="-155" y="-6" width="310" height="40" rx="18" fill="#4A230F"/>' : ''}
      <path d="M-160 ${v === 3 ? -4 : 32} l25 22 l25 -22 l25 22 l25 -22 l25 22 l25 -22 l25 22 l25 -22 l25 22 l25 -22 l25 22 l25 -22 v-16 h-320z" fill="${queijo}"/>
      <path d="M-165 ${v === 3 ? -20 : 14} q40 -26 80 0 t80 0 t80 0 t80 0 v-14 h-320z" fill="#4CAF50"/>
      <path d="M-150 ${v === 3 ? -28 : 2} a150 110 0 0 1 300 0z" fill="#E09A45"/>
      ${[[-70, -50], [-20, -75], [40, -60], [90, -35], [0, -40]].map(([x, y]) => `<ellipse cx="${x}" cy="${y + (v === 3 ? -30 : 0)}" rx="7" ry="4" fill="#FFF3D6"/>`).join('')}`;
  },
  4: (v) => // prato feito
    `<circle r="165" fill="#FFFFFF"/><circle r="140" fill="#F4EFE6"/>
     <path d="M-120 -30 a120 120 0 0 1 120 -100 v110z" fill="#FBF6EC" stroke="#E6DCC8" stroke-width="3"/>
     <path d="M10 -130 a130 130 0 0 1 110 100 h-110z" fill="${v === 2 ? '#2B1A12' : '#5B3A1E'}"/>
     <rect x="-110" y="0" width="${v === 1 ? 120 : 100}" height="80" rx="30" fill="${v === 3 ? '#C46A2F' : '#8B4A22'}"/>
     <path d="M30 10 h80 a10 10 0 0 1 0 60 h-80z" fill="#3E8E41"/><circle cx="60" cy="100" r="22" fill="#F2C14E"/>`,
  5: (v, r) => { // bowl
    let s = `<circle r="160" fill="${v === 1 ? '#F1E7D3' : '#DCE7D3'}"/><circle r="135" fill="#FFFFFF"/>`;
    const fat = [['#7BC47F', 0], ['#F28C38', 1.26], ['#E84A5F', 2.51], ['#F7D35C', 3.77], ['#7A4E2D', 5.03]];
    fat.forEach(([c, a]) => { s += `<path d="M0 0 L${Math.cos(a) * 130} ${Math.sin(a) * 130} A130 130 0 0 1 ${Math.cos(a + 1.26) * 130} ${Math.sin(a + 1.26) * 130} z" fill="${c}"/>`; });
    for (let i = 0; i < 18; i++) { const a = r() * 6.28, d = 30 + r() * 90; s += `<circle cx="${Math.cos(a) * d}" cy="${Math.sin(a) * d}" r="5" fill="#fff" opacity=".7"/>`; }
    return s + `<circle r="40" fill="${v === 2 ? '#F4A6B7' : '#FFF4E0'}"/>`;
  },
  6: (v) => v === 3 ? // açaí
    `<path d="M-130 -60 h260 l-30 190 h-200z" fill="#F5F0FA"/><ellipse cy="-60" rx="130" ry="40" fill="#4B1E4F"/>
     <circle cx="-50" cy="-70" r="20" fill="#F7D35C"/><circle cx="20" cy="-75" r="16" fill="#E84A5F"/><circle cx="60" cy="-60" r="18" fill="#F7D35C"/><path d="M-20 -60 l20 -25 l20 25z" fill="#7BC47F"/>`
    : // bolo
    `<ellipse cy="130" rx="170" ry="24" fill="#000" opacity=".12"/>
     <rect x="-140" y="-20" width="280" height="140" rx="18" fill="${v === 1 ? '#6B3A1E' : '#F4A6B7'}"/>
     <rect x="-140" y="30" width="280" height="16" fill="#FFF4E0"/><rect x="-140" y="76" width="280" height="16" fill="#FFF4E0"/>
     <path d="M-140 -20 h280 v20 q-20 30 -40 0 q-20 30 -40 0 q-20 30 -40 0 q-20 30 -40 0 q-20 30 -40 0 q-20 30 -40 0 q-20 30 -40 0z" fill="${v === 1 ? '#3B1E0E' : '#FFFFFF'}"/>
     ${[-90, -30, 30, 90].map((x) => `<circle cx="${x}" cy="-36" r="16" fill="#D7263D"/>`).join('')}`,
  7: (v) => { // esfiha
    const recheio = ['#C0392B', '#F2E6C8', '#3E8E41'][v - 1];
    return [[-80, -40], [80, -40], [0, 80]].map(([x, y]) => v === 2
      ? `<path d="M${x} ${y - 80} l75 120 h-150z" fill="#E3A55A" stroke="#C7883C" stroke-width="4" stroke-linejoin="round"/>`
      : `<circle cx="${x}" cy="${y}" r="78" fill="#E3A55A"/><circle cx="${x}" cy="${y}" r="58" fill="${recheio}"/><circle cx="${x - 15}" cy="${y - 10}" r="7" fill="#fff" opacity=".6"/>`).join('');
  },
  8: (v) => v === 3 ? // copo de caldo de cana / suco
    `<path d="M-60 -130 h120 l-15 250 h-90z" fill="#F7E7A1"/><path d="M-55 -60 h110" stroke="#fff" stroke-width="6" opacity=".6"/><path d="M15 -170 l20 60" stroke="#E84A5F" stroke-width="12" stroke-linecap="round"/>`
    : // pastel
    `<path d="M-170 40 a170 120 0 0 1 340 0z" fill="#EDB458" stroke="#D49536" stroke-width="5"/>
     ${Array.from({ length: 15 }, (_, i) => `<path d="M${-165 + i * 23} 40 v14" stroke="#D49536" stroke-width="6" stroke-linecap="round"/>`).join('')}
     ${v === 2 ? '<rect x="-70" y="-30" width="140" height="18" rx="9" fill="#F6E3AF" opacity=".8"/>' : ''}
     <circle cx="-60" cy="-20" r="8" fill="#F6E3AF"/><circle cx="40" cy="-50" r="6" fill="#F6E3AF"/><circle cx="90" cy="-10" r="7" fill="#F6E3AF"/>`,
};

function svgPrato(cat, v, w = 640, h = 400) {
  const c = cats.find((x) => x.id === cat).cor;
  const r = rnd(cat * 31 + v * 7);
  let manchas = '';
  for (let i = 0; i < 9; i++) manchas += `<circle cx="${r() * w}" cy="${r() * h}" r="${20 + r() * 60}" fill="#fff" opacity=".07"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><radialGradient id="f" cx=".3" cy=".25" r=".9"><stop offset="0" stop-color="${c}" stop-opacity=".55"/><stop offset="1" stop-color="${c}"/></radialGradient></defs>
    <rect width="${w}" height="${h}" fill="#2A1A12"/><rect width="${w}" height="${h}" fill="url(#f)"/>${manchas}
    <ellipse cx="${w / 2 + 10}" cy="${h / 2 + 18}" rx="${h * .44}" ry="${h * .42}" fill="#000" opacity=".18"/>
    <g transform="translate(${w / 2} ${h / 2}) scale(${h / 400})">${pratos[cat](v, r)}</g></svg>`;
}

function svgBanner(rest, k) {
  const c = cats.find((x) => x.id === rest.categoria_id).cor;
  const w = 1200, h = 520, r = rnd(k * 17 + 3);
  let deco = '';
  for (let i = 0; i < 26; i++) deco += `<circle cx="${r() * w}" cy="${r() * h}" r="${4 + r() * 10}" fill="#fff" opacity="${.08 + r() * .12}"/>`;
  const v1 = (k % 3) + 1, v2 = ((k + 1) % 3) + 1;
  const tem = (v) => (rest.categoria_id === 2 || rest.categoria_id === 5) && v === 3 ? 1 : v;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="#2A1A12"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>${deco}
    ${Array.from({ length: 8 }, (_, i) => `<path d="M${i * 170 - 80} ${h + 40} L${i * 170 + 140} -40" stroke="#fff" stroke-opacity=".05" stroke-width="50"/>`).join('')}
    <g transform="translate(870 250) scale(1.25) rotate(${k * 13 % 30 - 15})">${pratos[rest.categoria_id](tem(v1), rnd(k))}</g>
    <g transform="translate(560 330) scale(.75) rotate(${-k * 11 % 25})">${pratos[rest.categoria_id](tem(v2), rnd(k + 9))}</g></svg>`;
}

const vitrine = () => `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="840" viewBox="0 0 1120 840">
  <rect width="1120" height="840" fill="#3A2117"/><rect width="1120" height="840" fill="url(#m)"/>
  <defs><pattern id="m" width="80" height="80" patternUnits="userSpaceOnUse"><rect width="80" height="80" fill="#3A2117"/><path d="M0 40 h80 M40 0 v80" stroke="#4A2C1F" stroke-width="2"/></pattern></defs>
  <g transform="translate(330 300) scale(1.25)">${pratos[1](1, rnd(1))}</g>
  <g transform="translate(820 260) scale(.95)">${pratos[5](1, rnd(2))}</g>
  <g transform="translate(400 650) scale(.85)">${pratos[3](1, rnd(3))}</g>
  <g transform="translate(860 640) scale(.8)">${pratos[2](1, rnd(4))}</g></svg>`;

const entrar = () => `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1100" viewBox="0 0 900 1100">
  <rect width="900" height="1100" fill="#B83A1B"/>
  ${Array.from({ length: 12 }, (_, i) => `<circle cx="${(i % 3) * 330 + 120}" cy="${Math.floor(i / 3) * 300 + 120}" r="120" fill="#fff" opacity=".06"/>`).join('')}
  <g transform="translate(450 330) scale(1.3)">${pratos[4](1)}</g>
  <g transform="translate(300 800) scale(.9)">${pratos[7](1)}</g>
  <g transform="translate(680 820) scale(.8)">${pratos[6](1)}</g></svg>`;

(async () => {
  for (const d of ['pratos', 'restaurantes']) fs.mkdirSync(`${OUT}/${d}`, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage();
  async function jpg(svg, arq, w, h) {
    await p.setViewportSize({ width: w, height: h });
    await p.setContent(`<style>*{margin:0}body{width:${w}px;height:${h}px;overflow:hidden}</style>${svg}`);
    await p.screenshot({ path: arq, type: 'jpeg', quality: 78 });
  }
  const variacoes = { 1: 3, 2: 2, 3: 3, 4: 3, 5: 2, 6: 3, 7: 3, 8: 3 };
  for (const [cat, n] of Object.entries(variacoes)) for (let v = 1; v <= n; v++) await jpg(svgPrato(+cat, v), `${OUT}/pratos/${cat}-${v}.jpg`, 640, 400);
  for (const [k, r] of rests.entries()) await jpg(svgBanner(r, k), `${OUT}/restaurantes/${r.slug}.jpg`, 1200, 520);
  await jpg(vitrine(), `${OUT}/vitrine.jpg`, 1120, 840);
  await jpg(entrar(), `${OUT}/entrar.jpg`, 900, 1100);
  await b.close();
})();
