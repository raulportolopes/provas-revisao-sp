import sys
sys.path.insert(0, sys.path[0])
from docbase import Doc
from cis_sabor import SUB, TOTAL
OUT = sys.argv[1]
D = Doc('Guia do avaliador – roteiro de teste e gabarito', 'Módulo D – Sabor de Bairro: delivery em Vue 3', 'SPSKILLS_MD_SABOR_GUIA_AVALIADOR')
D.h('Uso deste guia')
D.p('Documento do avaliador. Como este é um projeto de revisão, a solução comentada (solucao-comentada/XX_modulo_d/) e o ESTUDO_GUIADO.md podem ir para o competidor depois que ele tentar fazer sozinho. O script de apoio está em gabarito-avaliador/checar-sabor.js.')
D.p('É o segundo projeto de revisão do Módulo D. O primeiro (Pulso Academias) é em JavaScript puro; este é em Vue 3 sem build, para o Eduardo treinar o mesmo raciocínio de estado com reatividade: URL como fonte da verdade, computed em vez de contas repetidas, store compartilhada, modal acessível reaproveitado, corrida de requisições, polling, regras 401/409/422 vindas da API, dinheiro em centavos e datas em UTC. É 3 a 5 vezes maior que o Módulo D do simulado estadual (EcoSP, 15 pt, JSON estático).')

D.h('Distribuição dos pontos')
linhas = [('Subcritério', 'Foco', 'Pontos')]
for s in SUB: linhas.append((s[0], s[1], f'{sum(a[5] for a in s[2]):.2f}'.replace('.', ',')))
linhas.append(('TOTAL', '', f'{TOTAL:.2f}'.replace('.', ',')))
D.tabela(linhas, [0.16, 0.64, 0.2], prot=1)
w = {}
for s in SUB:
    for a in s[2]: w[a[4]] = round(w.get(a[4], 0) + a[5], 2)
nj = sum(1 for s in SUB for a in s[2] if a[0] == 'J'); na = sum(len(s[2]) for s in SUB)
D.p(f'WSOS 3 = {w[3]:.2f} e WSOS 4 = {w[4]:.2f}'.replace('.', ',') + f'. São {na} aspectos, {na - nj} de medição e {nj} de julgamento.')

D.h('Preparação')
D.i(0, '1. Publique a entrega no Apache (ou rode php -S localhost:8000 dentro da pasta). Dê permissão de escrita em api/dados/.')
D.i(0, '2. Antes de começar, zere os dados: no console do navegador, fetch("api/index.php/reset", {method: "POST"}). Faça isso também entre um competidor e outro.')
D.i(0, '3. Vários restaurantes abrem só à noite ou no almoço. Para testar a qualquer hora, use os que ficam abertos 24 h: Smash do Bairro, Bowl & Cia, Açaí da Esquina e Pastelaria Madrugada.')
D.i(0, '4. Para testar o token vencido (D9.4), com o cliente logado, rode no console (troque a chave se o competidor usou outro nome; veja em Application > Local Storage):')
D.code('fetch("api/index.php/sessao/expirar", { method: "POST", headers: { Authorization: "Bearer " + localStorage.getItem("sabor.token") } });')
D.i(0, '5. Corrida (D2.5): DevTools > Rede > Fast 3G, clicar em Pizza e logo em Hambúrguer. A lista final tem de ser só de hambúrguer.')
D.i(0, '6. 409 do pedido (D7.4): PEDIDO_MINIMO e TOTAL_DIVERGENTE dá para provocar pelo console, mandando um pedido com total_esperado errado:')
D.code('fetch("api/index.php/pedidos", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("sabor.token") },\n  body: JSON.stringify({ restaurante_id: 6, itens: [{ item_id: 40, quantidade: 1, opcoes: [] }], endereco: { cep: "03101-001", numero: "1" }, pagamento: "pix", total_esperado: 1 }) }).then(r => r.json()).then(console.log)')
D.p('Na tela, o jeito mais simples é DevTools > Rede > botão direito no POST /pedidos > "Override content" (ou bloquear e responder) ou mudar o preço no localStorage do carrinho (sabor.carrinho, campo preco_unitario) antes de confirmar: a API devolve TOTAL_DIVERGENTE.')
D.i(0, '7. Status do pedido: o relógio é acelerado (em_preparo em 30 s, a_caminho em 90 s, entregue em 150 s). Faça um pedido e deixe a tela aberta 3 minutos para ver o polling e a parada.')
D.i(0, '8. Script de apoio: node checar-sabor.js http://servidor/XX_modulo_d/ (Node + Playwright). Ele foi escrito para a solução de referência: seletores diferentes podem falhar sem que o requisito falhe. Use como evidência, não como nota.')
D.i(0, '9. Compare as animações com os vídeos de design/videos/, que o competidor também recebe.')

D.h('Roteiro de teste por aspecto')
for sid, nome, asp in SUB:
    D.s(f'{sid} – {nome} ({sum(a[5] for a in asp):.2f} pt)'.replace('.', ','))
    for k, (t, desc, extra, req, wsos, mx, jud) in enumerate(asp, 1):
        valor = f'{mx:.2f}'.replace('.', ',')
        if t == 'M':
            D.i(0, f'{sid}.{k} [M {valor}] {desc}.')
            D.i(1, f'Como testar: {req}. Dedução: {extra}.')
        else:
            D.i(0, f'{sid}.{k} [J {valor}] {desc}.')
            D.i(1, 'Escala: ' + ' / '.join(f'{n} = {j}' for n, j in enumerate(jud)) + '.')

D.h('Comportamento esperado da API (gabarito)')
D.tabela([
 ('Teste', 'Resultado esperado'),
 ('GET /restaurantes sem filtro', '14 restaurantes, 3 páginas de 6 (6 + 6 + 2)'),
 ('Categoria Pizza (1)', '2 restaurantes'),
 ('busca=temaki', 'Temaki Express e Sushi Kaigan (prato com "temaki")'),
 ('entrega_gratis=1', 'Pizzaria Bella Mooca, Cozinha da Dona Cida e Bowl & Cia'),
 ('Clássico (Smash), Ao ponto + Bacon + Queijo extra, quantidade 2', '(34,90 + 6,00 + 5,00) × 2 = R$ 91,80'),
 ('CEP 03164-000 no Smash do Bairro', 'Entrega R$ 3,90 + R$ 3,00 = R$ 6,90'),
 ('Subtotal R$ 103,70, CEP 03164-000, FRETEGRATIS', 'Desconto R$ 6,90 (taxa inteira); total R$ 103,70. Se descontar só R$ 3,90, a API responde 409 TOTAL_DIVERGENTE'),
 ('BEMVINDO10 com subtotal R$ 103,70', 'Desconto R$ 10,37 (arredondado em centavos)'),
 ('DESCONTO15 com subtotal abaixo de R$ 60', '422 "Este cupom vale para pedidos a partir de R$ 60,00."'),
 ('VERAO2025', '422 "Este cupom venceu em 20/03/2025."'),
 ('Pedido de R$ 6,00 no Smash (mínimo R$ 20)', '409 PEDIDO_MINIMO'),
 ('Troco para R$ 50 num pedido de R$ 106,60', '422 troco_para'),
 ('Cancelar depois de 30 s', '409 NAO_PODE_CANCELAR'),
 ('Avaliar com nota 2 e comentário "ruim"', '422 comentario'),
 ('Depois do reset', 'Cliente com 7 pedidos (#1001–#1007; #1004 cancelado; #1002 e #1006 sem avaliação): 2 páginas de 5'),
 ('criado_em "2026-11-17T21:58:00Z"', 'Tela: 17/11/2026 às 18:58 (Brasília), em qualquer fuso do Windows'),
], [0.42, 0.58])

D.h('Pontos de atenção (onde o competidor costuma perder)')
for t in [
 'Somar dinheiro em reais com vírgula flutuante (49.900000001) em vez de somar centavos e formatar só no fim.',
 'Guardar os filtros só em ref() e esquecer a URL: F5 e Voltar não restauram nada.',
 'watch na URL E no ref ao mesmo tempo, gerando duas requisições por clique (ou um laço).',
 '"Carregar mais" que substitui a lista, ou que repete a primeira página porque o filtro mudou no meio.',
 'Calcular o preço do prato num @change e esquecer a quantidade: use computed.',
 'Modal que perde o foco ao fechar porque foi aberto pela URL (F5) e não há "quem abriu".',
 'Ouvinte de teclado preso na caixa do modal: quando o botão focado some (remover linha do carrinho), Esc para de funcionar.',
 'scrollIntoView na aba ativa: rola a janela também e cancela a rolagem suave do clique.',
 'Frete grátis descontando só a taxa do restaurante (esquece o acréscimo do bairro): a API devolve TOTAL_DIVERGENTE.',
 'Polling com setInterval que continua rodando depois de sair da tela (vazamento) e empilha requisições.',
 'Datas: mostrar "21:58" cortando a string UTC em vez de converter para Brasília.',
 'backdrop-filter no cabeçalho: a barra fixa do carrinho no celular gruda no topo.',
 'Tema aplicado no app.js (módulo, que roda depois): a página pisca branca no F5 do tema escuro.',
]:
    D.i(0, '• ' + t)

D.h('Plano de tempo sugerido (4 h)')
D.tabela([
 ('Bloco', 'Tempo', 'Entregável'),
 ('Ler API e prints, montar checklist', '0:00–0:15', 'Plano'),
 ('Esqueleto Vue + Router + api.js + estado.js (sessão, carrinho)', '0:15–0:40', 'D1'),
 ('Início: lista, filtros na URL, debounce, carregar mais', '0:40–1:20', 'D2'),
 ('Cardápio + modal base + modal do prato', '1:20–2:10', 'D3, D4'),
 ('Gaveta do carrinho e regras', '2:10–2:35', 'D5'),
 ('Login + checkout em 3 passos + cupom + envio', '2:35–3:20', 'D6, D7'),
 ('Acompanhamento (polling) e lista de pedidos', '3:20–3:45', 'D8, D9'),
 ('375 px, tema, efeitos, publicar e testar no servidor', '3:45–4:00', 'D10'),
], [0.5, 0.2, 0.3])
D.p('Elaborado por Raul Porto Lopes (Avaliador) – revisão SP Skills 2026, ocupação 17 Tecnologias Web.')
D.save(OUT)
print('ok')
