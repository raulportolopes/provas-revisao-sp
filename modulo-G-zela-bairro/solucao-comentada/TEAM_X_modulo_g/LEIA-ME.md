# Zela Bairro – solução de referência (Módulo G, Team Challenge)

Solução comentada para revisão. Não é a única resposta certa: é uma forma limpa de cumprir o enunciado em equipe.

## Como rodar

- **XAMPP / Apache:** copie a pasta `TEAM_X_modulo_g` para `htdocs/` e abra `http://localhost/TEAM_X_modulo_g/`. Precisa do `mod_rewrite` ligado e de `AllowOverride All` (para o `.htaccess` da pasta `api/`).
- Não precisa de banco: os dados ficam em `dados/*.json`, criados a partir de `dados/seed/` na primeira chamada.
- **Voltar ao estado inicial:** apague `dados/categorias.json`, `dados/chamados.json`, `dados/usuarios.json` e `dados/tokens.json` (não apague a pasta `seed/`) e as fotos de `uploads/`.
- A pasta `dados/` e a pasta `uploads/` precisam de permissão de escrita para o Apache.
- Login da equipe: `marta` / `Zela@2026` ou `paulo` / `Zela@2026`.

## Mapa dos arquivos

| Arquivo | Pacote | O que tem |
|---|---|---|
| `api/index.php` | P1 | roteador, regras, máquina de estados, upload seguro |
| `api/.htaccess` | P1 | reescrita de URL e repasse do cabeçalho Authorization |
| `dados/.htaccess`, `uploads/.htaccess` | P1 | bloqueio de download dos JSON e de PHP enviado |
| `js/api.js` | P5 | único lugar com `fetch` |
| `js/util.js` | P5 | `Estado`, datas sem erro de fuso, modais, toast, copiar |
| `js/painel.js` | P2 | kanban, filtros na URL, mover, arrastar, apoio, detalhe |
| `js/novo-chamado.js` | P3 | formulário, validação ao vivo, mapa, foto |
| `js/mapa.js` | P4 | pinos e lista ligados |
| `js/indicadores.js` | P4 | KPIs, barras e rosca só com CSS |
| `js/app.js` | P5 | rotas, link ativo, tema, login, carga inicial |
| `css/tokens.css` | P5 | fontes, cores, tema escuro, `prefers-reduced-motion` |
| `css/layout.css` | P5 | cabeçalho, menu, 768 e 375 px |
| `css/componentes.css` | P5 | botões, chips, campos, modal, toast |
| `css/telas.css` | P2/P3/P4 | estilos de cada tela |

A explicação passo a passo está em `SOLUCAO_EXPLICADA` (docx/pdf) na pasta acima desta.
