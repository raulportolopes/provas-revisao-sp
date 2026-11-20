# Copa Code – solução de referência (Módulo G, Team Challenge)

Solução comentada para revisão. Não é a única resposta certa: é uma forma limpa de cumprir o enunciado em equipe.

## Como rodar (XAMPP)

1. Ligue Apache e MySQL no XAMPP.
2. Importe o banco: phpMyAdmin → Importar → `banco/copacode.sql` (cria o banco `copacode` com as tabelas e a carga inicial). Ou: `mysql -u root < banco/copacode.sql`.
3. Copie a pasta `TEAM_X_modulo_g` para `htdocs/` e abra `http://localhost/TEAM_X_modulo_g/`.
4. Precisa do `mod_rewrite` ligado e de `AllowOverride All` (por causa do `.htaccess` da pasta `api/`).
5. Usuário e senha do banco ficam em `config.php` (padrão do XAMPP: `root` sem senha).
6. Login da organização: `org` / `Copa@2026`.
7. **Voltar ao estado inicial:** importe `banco/copacode.sql` de novo (ele apaga e recria o banco).

## Mapa dos arquivos

| Arquivo | Pacote | O que tem |
|---|---|---|
| `api/index.php` | P1 | roteador, validação 422 com itens de lista, regras 409, transações, avanço do vencedor |
| `api/.htaccess` | P1 | reescrita de URL e repasse do cabeçalho Authorization |
| `config.php`, `.htaccess`, `banco/` | P1 | conexão PDO; o navegador não baixa `config.php` nem o `.sql` |
| `index.html` | P5 | só o `#app` e os scripts na ordem certa |
| `js/vendor/` | P5 | Vue 3 e Vue Router 4 (arquivos locais, licença MIT) |
| `js/api.js` | P5 | único lugar com `fetch` |
| `js/store.js` | P5 | `store` reactive, `FASES`, derivados (confirmadas, campeã), datas sem erro de fuso |
| `js/componentes.js` | P5 | `<modal-base>` com `<dialog>` e `<selo-equipe>` |
| `js/inscricao.js` | P2 | formulário dinâmico com validação ao vivo |
| `js/equipes.js` | P3 | lista com filtros na URL, acordeão, check-in, exclusão, gerar chaveamento |
| `js/chaveamento.js` | P4 | chave com conectores, caminho da equipe, campeã com confete, modo telão |
| `js/partidas.js` | P5 | abas ligadas à rota, contagem regressiva, modal de placar |
| `js/app.js` | P5 | rotas, link ativo, título da aba, login, toasts, montagem |
| `css/base.css` | P5 | tokens, casca, botões, campos, modal, toast, 768 e 375 px |
| `css/telas.css` | P2 a P5 | um bloco por pacote |

A explicação passo a passo está em `SOLUCAO_EXPLICADA_Copa_Code` (docx/pdf), na pasta do módulo.
