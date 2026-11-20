// Funções comuns dos scripts de prints, vídeos e checagem: resetar o banco e avançar o torneio pela API.
const { execSync } = require('child_process');
const SQL = __dirname + '/../solucao-comentada/TEAM_X_modulo_g/banco/copacode.sql';
const API = (process.env.COPA_URL || 'http://localhost:8802/') + 'api/';
const resetar = () => execSync(`mysql -u root < "${SQL}"`);
async function pedir(caminho, metodo = 'GET', corpo, token) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = 'Bearer ' + token;
  const r = await fetch(API + caminho, { method: metodo, headers: h, body: corpo ? JSON.stringify(corpo) : undefined });
  return r.status === 204 ? null : r.json();
}
const token = async () => (await pedir('login', 'POST', { username: 'org', password: 'Copa@2026' })).token;
// fase: 'inicial' | 'chave' (8 confirmadas + chaveamento) | 'quartas' (quartas jogadas) | 'semis' | 'campea'
async function preparar(fase) {
  resetar();
  if (fase === 'inicial') return;
  const t = await token();
  await pedir('teams/8/check-in', 'POST', null, t);
  await pedir('bracket', 'POST', null, t);
  if (fase === 'chave') return;
  const placares = { quarterfinal: [[2, 0], [2, 1], [1, 2], [0, 2]], semifinal: [[2, 1], [2, 1]], final: [[2, 0]] };
  for (const st of ['quarterfinal', 'semifinal', 'final']) {
    const ms = (await pedir('matches')).filter((m) => m.stage === st).sort((a, b) => a.position - b.position);
    for (const [i, m] of ms.entries()) await pedir(`matches/${m.id}/score`, 'PATCH', { score_a: placares[st][i][0], score_b: placares[st][i][1] }, t);
    if ((fase === 'quartas' && st === 'quarterfinal') || (fase === 'semis' && st === 'semifinal')) return;
  }
}
module.exports = { resetar, preparar, pedir, token };
