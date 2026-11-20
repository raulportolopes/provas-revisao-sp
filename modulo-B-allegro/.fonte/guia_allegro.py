SUBTITULO = 'Módulo B – Allegro: turmas, matrículas e mensalidades da escola de música'
RODAPE = 'SPSKILLS_MB_ALLEGRO_GUIA_AVALIADOR'
USO = [
 'Este guia é do avaliador. Como este é um projeto de REVISÃO, a solução comentada (solucao-comentada/) é material de estudo do Eduardo e pode ser entregue a ele depois que ele tentar a prova.',
 'O script gabarito-avaliador/checar-allegro.php testa o sistema pelo navegador (HTTP), sem olhar o código. Os códigos entre colchetes na CIS ([B4.1] etc.) são as linhas dele. A solução de referência passa em 74 de 74 verificações (MariaDB + Apache em subpasta, 20/11/2026).',
 'Vários valores esperados dependem da data de hoje (dias de atraso, valor atualizado, vencimento da primeira mensalidade, aulas de hoje). O script calcula esses valores na hora; no navegador, use a fórmula da seção Dados esperados.',
 'O resultado do script é evidência, não nota final: um FALHA pode ser só um texto de mensagem diferente. Abra a página e confira antes de zerar.',
]
DEFEITOS = [
 ('Regras de estado no back-end (403, 404, oculto, "só quando", não apaga com vínculo)', 'B3 inteiro, B5 (desativar e apagar turma), B6 (apagar aluno), B7 (espera, promoção, cancelamento), B8 (pagar uma vez, estorno)', '~18 pt'),
 ('Conflito de horário (intervalos sobrepostos)', 'B5 (sala e professor), B7 (aluno e promoção da espera)', '~5 pt'),
 ('Formato de data, idade e moeda', 'B4, B6 (idade pela data), B7 (vencimentos), B8 (mm/aaaa, dias de atraso, R$), B9 (CSV)', '~5 pt'),
 ('Cálculo no servidor (multa e juros, totais de todas as linhas filtradas)', 'B8, B9', '~4 pt'),
 ('Filtros na URL, mantidos no select, paginação', 'B4, B6, B8', '~3 pt'),
 ('README e entrega', 'B1', '~1 pt'),
]
PREPARACAO = [
 'Importe allegro_db.sql num banco vazio XX_modulo_b. O script e o roteiro dependem dos dados originais: reimporte antes de cada rodada.',
 'Copie o projeto do competidor para htdocs/XX_modulo_b, confira o .env (APP_URL com /XX_modulo_b, banco, APP_TIMEZONE=America/Sao_Paulo) e rode composer install se a pasta vendor não veio.',
 'Abra http://servidor/XX_modulo_b/. Se precisar de /public ou de php artisan serve, anote (B1.1) e siga a avaliação do jeito que funcionar.',
 'Rode: php checar-allegro.php http://servidor/XX_modulo_b (precisa da extensão curl, ligada no XAMPP). Ele leva menos de um minuto e altera o banco.',
 'Reimporte o banco e faça no navegador os aspectos sem código entre colchetes. Use uma janela normal para a coordenação, uma anônima para a secretaria e um segundo navegador para a professora. Status 403 e 404: DevTools (F12) > Network > primeira requisição.',
 'Para os testes de "forçar" (valor do pagamento, professor inativo), use o DevTools: Elements, acrescente ou edite o campo e envie.',
 'Leia o código para os dois aspectos de julgamento (B1).',
]
DADOS = [
 ('Teste', 'Esperado'),
 ('Listagem de turmas (ordem)', 'VIO-BAS-SEG18, VLN-BAS-SEG19, PIA-BAS-TER14, CAN-INT-TER19, TEC-BAS-QUA15 (inativa), VIO-INT-QUA18, PIA-AVA-QUI19, GUI-INT-SEX20, CAN-BAS-SAB09'),
 ('Turmas cheias', 'VLN-BAS-SEG19 (4/4, espera: Carolina Vidal 1ª, Gustavo Amorim 2º), PIA-BAS-TER14 (3/3, espera: Manuela Franco, Nicolas Barros), PIA-AVA-QUI19 (2/2)'),
 ('Só com vaga', 'VIO-BAS-SEG18, CAN-INT-TER19, VIO-INT-QUA18, GUI-INT-SEX20, CAN-BAS-SAB09'),
 ('Salas', 'Villa-Lobos 8, Chiquinha Gonzaga 6, Estúdio Tom Jobim 4, Auditório 20 lugares'),
 ('Conflitos para testar', 'Segunda 19:00–20:00 na Villa-Lobos: ocupada pela VIO-BAS-SEG18. Segunda 19:30–20:30 com Lúcia Ferraz: conflito com a VLN-BAS-SEG19. Segunda 19:30 na Villa-Lobos encosta e é aceita'),
 ('Promoção da espera', 'Cancelar Caio Fonseca na VLN-BAS-SEG19: Carolina (1ª) tem conflito com a VIO-BAS-SEG18 e continua esperando; Gustavo Amorim entra'),
 ('Alunos', '32; primeiro da lista: Alice Monteiro; 7 em débito: Flávia Rocha, Isabela Duarte, Pedro Henrique Dias, Joana Bittencourt, Manuela Franco, Elisa Moraes, Beatriz Quaresma'),
 ('Valor atualizado', 'valor × (1 + 0,02 + 0,01 × dias / 30), arredondado em centavos. Ex.: R$ 200,00 com 15 dias = R$ 205,00; pagar no dia do vencimento = sem multa'),
 ('Pagamento de teste', 'Isabela Duarte, mensalidade de outubro (vence 10/10/2026), pagamento em 25/10/2026 = R$ 205,00; data antes de 02/09/2026 (matrícula) é recusada'),
 ('Mensalidade da turma x já gerada', 'GUI-INT-SEX20 custa R$ 210,00 nas mensalidades já geradas (Joana Bittencourt); mudar a turma não altera'),
 ('Primeira mensalidade de matrícula nova', 'Vence dia 10 do mês atual; se hoje já é dia 10 ou depois, vence hoje + 5 dias. Uma mensalidade por mês até dezembro'),
 ('Aulas de hoje (painel da professora Marta)', 'Segunda: VIO-BAS-SEG18; quarta: VIO-INT-QUA18; sexta: GUI-INT-SEX20; outros dias: "Nenhuma aula hoje"'),
]
