# Dicas – Órbita (Módulo E)

Pistas para organizar a prova. Não há código pronto aqui: a ideia é você saber **por onde começar** e **onde costuma dar errado**.

## Antes de escrever código (10 min)
- Leia o enunciado inteiro e marque o peso de cada parte no "Resumo da avaliação". Filtros, mapa de lugares e pagamento valem muito mais que o splash e o carrossel.
- Abra `api/config.json`. Os números das regras (limite de lugares, tempo, taxa, horas para cancelar, % de meia) estão lá. Se você escrever `6` ou `0.08` direto no código, o avaliador vai perceber.
- Assista `design/Design.mp4` uma vez inteiro, em 1,5×.

## Rotas
- Uma função que lê o `location.hash`, separa o nome da tela, os parâmetros e a query (`URLSearchParams`) e chama a tela certa. Escute `hashchange` **e** chame a mesma função ao carregar (senão o F5 quebra o link ativo).

## Datas (cai sempre)
- Uma string `"2026-12-05"` passada para `new Date()` é lida como UTC. No Brasil isso volta um dia. Monte a data com os números (`ano, mês - 1, dia, hora, minuto`).
- O "agora" da prova não é o relógio do computador. Teste a regra das 2 horas com a sessão das 10:30 do dia 05/12.

## Programação
- Tenha **um** objeto com o estado da tela (filtros, ordem, página) e **uma** função que, a partir da lista completa, faz sempre: filtrar → ordenar → paginar → desenhar → atualizar a URL.
- Para comparar texto sem acento, pesquise `normalize('NFD')`.
- `sort()` altera o array original.
- Para mudar a URL sem criar histórico: `history.replaceState`.

## Modal
- Ao abrir: guarde quem estava com o foco. Ao fechar: devolva o foco para ele.
- Foco preso: no `keydown` de Tab, se o foco está no último elemento, vá para o primeiro (e o contrário com Shift).
- O "n de N" do modal é a posição na lista **filtrada e ordenada inteira**, não na página.

## Mapa de lugares
- Percorra `layout` caractere por caractere. Só conte o número do lugar quando o caractere é um lugar.
- Lugar isolado: pense em cada **bloco** de lugares entre corredores. Um lugar livre cujos vizinhos dos dois lados estão tomados (e que não é ponta do bloco) é o problema.
- Meia-entrada "metade arredondando para cima": pesquise `Math.ceil`.
- Cronômetro que sobrevive ao F5: guarde **quando acaba**, não quantos segundos faltam.
- Teclado no mapa: pesquise "roving tabindex". Use `aria-disabled` em vez de `disabled` para o lugar ocupado continuar recebendo foco.

## Pagamento
- CPF: os dois dígitos verificadores têm pesos 10..2 e 11..2. Sequências como 111.111.111-11 passam na conta, mas não são CPF.
- Cartão: algoritmo de Luhn.
- Máscara: tire tudo que não é número e remonte a string a cada `input`.
- `navigator.clipboard` não existe em http sem HTTPS. Tenha um plano B.

## Reservas e Guia do céu
- Abas acessíveis: pesquise o padrão "WAI-ARIA Tabs". Só a aba ativa tem `tabindex="0"`.
- Acordeão com animação de altura sem medir em px: pesquise `grid-template-rows: 0fr` → `1fr`.
- Gráfico só com CSS: o JS grava `--v` (altura) e `--i` (posição) e o CSS usa `calc()` em `height` e `animation-delay`.

## 375 px
- Se o menu `position: fixed` de baixo aparecer no lugar errado, procure `transform`, `filter` ou `backdrop-filter` em algum pai.
- Rolagem horizontal da página: quase sempre é um filho de grid ou flex com `min-width` automático.

## Últimos 15 minutos
Publique, abra no servidor com o cache limpo e passe pelo roteiro: F5 em cada rota, filtros na URL, comprar, cancelar, 375 px.
