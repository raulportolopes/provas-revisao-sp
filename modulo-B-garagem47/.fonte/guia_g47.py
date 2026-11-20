SUBTITULO = 'Módulo B – Garagem 47: ordens de serviço da oficina'
RODAPE = 'SPSKILLS_MB_GARAGEM47_GUIA_AVALIADOR'
USO = [
 'Este guia é do avaliador. Como este é um projeto de REVISÃO, a solução comentada (solucao-comentada/) é material de estudo do Eduardo e pode ser entregue a ele depois que ele tentar a prova.',
 'O script gabarito-avaliador/checar-garagem47.php testa o sistema pelo navegador (HTTP), sem olhar o código. Os códigos entre colchetes na CIS ([B4.1] etc.) são as linhas dele. A solução de referência passa em 83 de 83 verificações (MariaDB + Apache em /XX_modulo_b, 19/11/2026).',
 'O resultado do script é evidência, não nota final: um FALHA pode ser só um texto de mensagem diferente. Abra a página e confira antes de zerar.',
]
DEFEITOS = [
 ('Regras de estado no back-end (403, 404, oculto, cascata, "só quando")', 'B3 inteiro, B5 (apagar com regra), B6 (veículo ocupado, edição bloqueada), B7 (máquina de situações), B8 e B9 (quem pode)', '~22 pt'),
 ('Formato de data e moeda', 'B4 (colunas, atraso em dias, período inclusivo), B6 (prazo), B10 (CSV)', '~3 pt'),
 ('Filtros na URL, mantidos no select, paginação', 'B4', '6 pt'),
 ('belongsToMany com sync por checkbox, old() e edição preenchida', 'B6 (preço na pivot, checkboxes)', '~2,5 pt'),
 ('Policy de dono e @can', 'B3, B9', '~3 pt'),
 ('README e entrega', 'B1', '~1 pt'),
]
PREPARACAO = [
 'Importe garagem47_db.sql num banco vazio XX_modulo_b. O script e o roteiro dependem dos dados originais: reimporte antes de cada rodada.',
 'Copie o projeto do competidor para htdocs/XX_modulo_b, confira o .env (APP_URL com /XX_modulo_b, banco) e rode composer install se a pasta vendor não veio. Rode php artisan storage:link se o competidor não deixou o link.',
 'Abra http://servidor/XX_modulo_b/. Se precisar de /public ou de php artisan serve, anote (B1.1) e siga a avaliação do jeito que funcionar.',
 'Rode: php checar-garagem47.php http://servidor/XX_modulo_b fotos-teste (precisa da extensão curl, ligada no XAMPP). Ele leva menos de um minuto e altera o banco.',
 'Reimporte o banco e faça no navegador os aspectos sem código entre colchetes. Use uma janela normal para o gerente, uma anônima para o atendente e um segundo navegador para o mecânico. Status 403 e 404: DevTools (F12) > Network > primeira requisição.',
 'Para os testes de "forçar" (serviço inativo, transição de situação), use o DevTools: Elements, edite o value do checkbox ou do campo escondido "para" e envie.',
 'Leia o código para os dois aspectos de julgamento (B1).',
]
DADOS = [
 ('Teste', 'Esperado'),
 ('Listagem padrão, página 1', 'OS-2026-0001, 0002, 0003, 0011, 0004, 0015, 0005, 0012, 0013, 0007 (16 ordens no total)'),
 ('Totais', 'OS-2026-0001 R$ 498,80; OS-2026-0006 R$ 679,90 (maior); OS-2026-0011 R$ 288,80'),
 ('situação aberta', '0007, 0008, 0009, 0014'),
 ('Sem mecânico', '0007, 0009, 0014'),
 ('busca fjk-2b31', '0001 e 0015'),
 ('de 17/11/2026 até 18/11/2026', '0008, 0009, 0010, 0016'),
 ('Atrasadas em 19/11/2026', '0005 (7 dias), 0007 (1 dia), 0013 (5 dias), 0016 (1 dia); muda com a data de hoje'),
 ('Ordens do mecânico Carlos', '0001, 0003, 0005, 0008, 0011, 0013, 0016'),
 ('Próximo código', 'OS-2026-0017 (em 2027: OS-2027-0001)'),
 ('Última km do DKQ9031 (veículo 5)', '132.400 km (só tem a ordem cancelada 0003, pode abrir nova)'),
 ('Estoque', 'Kit correia dentada: 2; óleo 5W30: 40 (cancelar a 0006 devolve 4 → 44); fluido DOT4: 10; filtro de cabine: 0 (não aparece na lista)'),
 ('Cliente que pode ser apagado', 'Eduarda Fontes (id 12), com o veículo UYT3R02 e nenhuma ordem'),
 ('Serviço que pode ser apagado', 'Lavagem simples (inativo, nunca usado)'),
]
