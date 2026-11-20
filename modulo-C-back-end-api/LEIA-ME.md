# Módulo C – Back-end API: dois projetos prontos para revisão

Base: Módulo C do Simulado Estadual 2026 (Jacareí, EcoSP API), em versão de 3 a 5 vezes maior. Cada prova vale 20 pontos (4 h sugeridas) e vem completa.

| Pasta | Tema | O que treina |
|---|---|---|
| `c1-hemosp/` | HemoSP: agendamento de doação de sangue | dois tipos de login (Sanctum com habilidades), regras de elegibilidade com datas, grade de horários com capacidade, 409 de conflito, protocolo sequencial, máquina de estados com auditoria, cancelar sem apagar, upload privado, CSV para Excel, relatório mensal |
| `c2-torque-certo/` | Torque Certo: oficina mecânica | perfis com middleware (403), dinheiro em centavos e desconto, estoque com transação e lockForUpdate, máquina de estados, SoftDeletes (lixeira), rotas aninhadas, ordenação por valor calculado, foto com miniatura GD, faturamento anual |

Em cada pasta:
- `Prova_*.docx/.pdf`: enunciado.
- `CIS_*.xlsx`: ficha de correção (20 pontos, coluna O para a nota).
- `Roteiro_Avaliador_*.docx/.pdf`: passo a passo, gabarito e erros comuns.
- `assets/`: o que o aluno recebe (banco .sql, coleção Postman, DICAS.md).
- `solucao/XX_modulo_c/`: projeto Laravel pronto e comentado, com `README.md` e `COMO-FOI-FEITO.md` (guia de estudo).
- `gabarito-avaliador/`: script `checar-*.php` + `esperado.json` (HemoSP 84 testes, Torque 71 testes; os dois passam 100% com a solução no MariaDB).

Como rodar a solução: `composer install`, copiar `.env.example` para `.env`, `php artisan key:generate`, importar o .sql, `php artisan migrate` (e `storage:link` na Torque).

Elaborado por Raul Porto Lopes (Avaliador) – revisão SP Skills 2026, ocupação 17 Tecnologias Web.
