# Checagem automática – Allegro

1. Reimporte `allegro_db.sql` (o script altera o banco).
2. `php checar-allegro.php http://servidor/XX_modulo_b`
3. Cada linha tem o código da CIS ([B4.1] etc.). FALHA é evidência: confira na tela antes de zerar.
4. Valores que dependem da data (dias de atraso, valor atualizado, primeiro vencimento, aulas de hoje) são calculados pelo script na hora.

A solução comentada passa em 74/74 (MariaDB 10.11 + Apache com mod_rewrite, publicada em subpasta, 20/11/2026).
