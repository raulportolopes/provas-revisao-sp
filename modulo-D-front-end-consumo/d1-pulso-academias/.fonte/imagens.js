// Gera as imagens da Pulso (ilustrações originais em SVG -> JPG). Uso: node imagens.js <pasta img>
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2];
const mods = JSON.parse(fs.readFileSync(__dirname + '/../app/api/semente/modalidades.json'));
const ins = JSON.parse(fs.readFileSync(__dirname + '/../app/api/semente/instrutores.json'));
const uni = JSON.parse(fs.readFileSync(__dirname + '/../app/api/semente/unidades.json'));
const W = '#fff';
const icones = {
  bike: `<circle cx="-70" cy="40" r="55"/><circle cx="90" cy="40" r="55"/><path d="M-70 40 L0 -50 L60 -50 M0 -50 L30 40 L90 40 M-20 -80 h40 M60 -50 l15 -35 h30"/>`,
  funcional: `<path d="M-120 0 h240"/><rect x="-150" y="-55" width="30" height="110" rx="8"/><rect x="120" y="-55" width="30" height="110" rx="8"/><rect x="-115" y="-35" width="20" height="70" rx="6"/><rect x="95" y="-35" width="20" height="70" rx="6"/>`,
  yoga: `<circle cx="0" cy="-95" r="26"/><path d="M0 -65 v70 M-110 -30 Q-50 0 0 -40 Q50 0 110 -30 M0 5 Q-60 40 -110 60 h220 Q60 40 0 5"/>`,
  pilates: `<circle cx="0" cy="20" r="80"/><path d="M-80 20 Q0 -20 80 20 M0 -60 Q-30 20 0 100"/><circle cx="-130" cy="-80" r="22"/><path d="M-130 -58 Q-90 -20 -60 -40"/>`,
  boxe: `<path d="M-60 -90 h70 a50 50 0 0 1 50 50 v60 a40 40 0 0 1 -40 40 h-80 a30 30 0 0 1 -30 -30 v-90 a30 30 0 0 1 30 -30 z M-20 60 v40 h70 v-40 M-60 -20 h80"/>`,
  ritmos: `<path d="M-60 60 V-80 L90 -110 V30"/><ellipse cx="-90" cy="60" rx="35" ry="25"/><ellipse cx="60" cy="30" rx="35" ry="25"/><path d="M-60 -40 L90 -70"/>`,
  hiit: `<circle cx="0" cy="10" r="95"/><path d="M0 10 V-50 M0 10 L45 40 M-25 -110 h50 M0 -110 v25"/><path d="M110 -40 l30 -10 M115 0 h35 M110 40 l30 10"/>`,
  alongamento: `<circle cx="-70" cy="-90" r="24"/><path d="M-70 -66 L-20 0 L80 30 M-20 0 L-60 90 M-50 -40 L60 -110 M80 30 L140 80"/>`,
};
function svgMod(m) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${m.cor}"/><stop offset="1" stop-color="#140F22"/></linearGradient>
  <radialGradient id="r" cx=".8" cy=".2" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
  <rect width="800" height="450" fill="url(#g)"/><rect width="800" height="450" fill="url(#r)"/>
  ${Array.from({ length: 7 }, (_, i) => `<path d="M${-100 + i * 140} 470 L${60 + i * 140} -20" stroke="#fff" stroke-opacity=".07" stroke-width="40"/>`).join('')}
  <path d="M0 330 L230 330 L260 270 L290 400 L330 200 L370 360 L400 330 L800 330" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="6" stroke-linejoin="round"/>
  <g transform="translate(560 210) scale(1.05)" fill="none" stroke="${W}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">${icones[m.slug]}</g>
  </svg>`;
}
const peles = ['#F1C7A5', '#C98E63', '#8D5A3B', '#E8B48F', '#5E3A26', '#F3D2B8', '#B07650', '#D9A07A'];
const cabelos = ['#2B1B12', '#111', '#6B3E1E', '#C9A227', '#1A1A1A', '#8B4513', '#333', '#5A2D0C'];
const fundos = ['#FFE1E6', '#E0E7FF', '#DCFCE7', '#FEF3C7', '#E0F2FE', '#F3E8FF', '#FFEDD5', '#E2E8F0'];
function svgPessoa(i) {
  const k = i.id - 1, longo = [0, 2, 4, 6].includes(k);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
  <rect width="240" height="240" fill="${fundos[k]}"/>
  ${longo ? `<path d="M62 120 Q60 40 120 38 Q180 40 178 120 L180 190 L60 190 Z" fill="${cabelos[k]}"/>` : ''}
  <path d="M30 250 Q30 170 120 168 Q210 170 210 250 Z" fill="${mods[(k * 3) % 8].cor}"/>
  <rect x="104" y="140" width="32" height="34" rx="10" fill="${peles[k]}"/>
  <ellipse cx="120" cy="104" rx="46" ry="52" fill="${peles[k]}"/>
  <path d="M74 98 Q74 46 120 46 Q166 46 166 98 Q150 70 120 72 Q92 72 74 98 Z" fill="${cabelos[k]}"/>
  <circle cx="104" cy="108" r="5" fill="#1b1b1b"/><circle cx="136" cy="108" r="5" fill="#1b1b1b"/>
  <path d="M106 130 Q120 140 134 130" stroke="#7a3b2e" stroke-width="4" fill="none" stroke-linecap="round"/>
  </svg>`;
}
const svgEntrar = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1400" viewBox="0 0 1200 1400">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF3D5A"/><stop offset=".55" stop-color="#5B3DF5"/><stop offset="1" stop-color="#0E0C16"/></linearGradient></defs>
<rect width="1200" height="1400" fill="url(#g)"/>
${Array.from({ length: 12 }, (_, i) => `<circle cx="${900 - i * 10}" cy="${380 + i * 6}" r="${60 + i * 48}" fill="none" stroke="#fff" stroke-opacity="${0.18 - i * 0.012}" stroke-width="3"/>`).join('')}
<path d="M0 760 L380 760 L430 640 L490 900 L560 520 L630 860 L680 760 L1200 760" fill="none" stroke="#fff" stroke-width="14" stroke-linejoin="round" stroke-linecap="round" opacity=".9"/>
</svg>`;
function svgUnidade(u, k) {
  const c = ['#FF3D5A', '#5B3DF5', '#16A34A', '#F59E0B'][k];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="800" height="450" fill="#1A1626"/>
  ${Array.from({ length: 9 }, (_, i) => `<rect x="${40 + i * 84}" y="${120 + (i % 3) * 30}" width="70" height="${330 - (i % 3) * 30}" fill="${c}" opacity="${0.25 + (i % 4) * 0.12}"/>`).join('')}
  <rect y="400" width="800" height="50" fill="#0E0C16"/><text x="40" y="80" fill="#fff" font-family="Arial" font-weight="700" font-size="44">${u.nome}</text></svg>`;
}
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  async function salvar(svg, w, h, arq) {
    await p.setViewportSize({ width: w, height: h });
    await p.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    await p.screenshot({ path: arq, type: 'jpeg', quality: 82, clip: { x: 0, y: 0, width: w, height: h } });
  }
  for (const m of mods) await salvar(svgMod(m), 800, 450, `${OUT}/modalidades/${m.slug}.jpg`);
  for (const i of ins) await salvar(svgPessoa(i), 240, 240, `${OUT}/instrutores/${i.id}.jpg`);
  for (const [k, u] of uni.entries()) await salvar(svgUnidade(u, k), 800, 450, `${OUT}/${u.imagem.replace('img/', '')}`);
  await salvar(svgEntrar, 1200, 1400, `${OUT}/entrar.jpg`);
  await b.close();
  console.log('imagens ok');
})();
