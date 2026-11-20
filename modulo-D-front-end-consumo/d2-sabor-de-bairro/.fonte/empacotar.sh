#!/bin/bash
# Monta a entrega do Sabor de Bairro em /mnt/project-files/revisao-projetos-prontos/modulo-D-sabor-de-bairro/
set -e
W=/tmp/claude-0/w/sabor; F=$W/.fonte; E=/mnt/project-files/revisao-projetos-prontos/modulo-D-sabor-de-bairro
cd $F
python3 mp4.py $W/webm $W/design/videos $W/design/Design.mp4 legendas.json
python3 prep_imgs.py $W/design $W/docimg
python3 make_prova.py $W/docimg $W/entrega/Projeto_Teste_Modulo_D_Sabor_de_Bairro.docx
python3 make_guia.py $W/entrega/Guia_Avaliador_Modulo_D_Sabor_de_Bairro.docx
python3 make_cis.py $W/entrega/CIS_Modulo_D_Sabor_de_Bairro.xlsx cis_sabor "Módulo D – Sabor de Bairro (Front-end Vue 3 com API) – Revisão SP Skills 2026" "Front-end consumindo API (Vue 3)"
cd $W/entrega && soffice --headless --convert-to pdf Projeto_Teste_Modulo_D_Sabor_de_Bairro.docx >/dev/null 2>&1 && soffice --headless --convert-to pdf Guia_Avaliador_Modulo_D_Sabor_de_Bairro.docx >/dev/null 2>&1
rm -rf $E && mkdir -p $E
cp $W/entrega/*.docx $W/entrega/*.pdf $W/entrega/*.xlsx $W/ESTUDO_GUIADO.md $E/
# Assets do competidor (dicas, nunca a resposta)
A=$E/XX-sabor; mkdir -p $A/js
cp -r $W/app/api $A/ && rm -rf $A/api/dados
cp -r $W/app/js/lib $A/js/ && cp -r $W/app/img $W/app/fonts $W/design $W/DICAS.md $A/
(cd $E && zip -qr assets_sabor.zip XX-sabor)
# Solução comentada
S=$E/solucao-comentada/XX_modulo_d; mkdir -p $S
cp -r $W/app/. $S/ && rm -rf $S/api/dados
(cd $E/solucao-comentada && zip -qr ../solucao_sabor_XX_modulo_d.zip XX_modulo_d)
# Avaliador
mkdir -p $E/gabarito-avaliador && cp $F/checar-sabor.js $E/gabarito-avaliador/
cat > $E/gabarito-avaliador/LEIA-ME-AVALIADOR.md <<'X'
# Sabor de Bairro – material do avaliador

- checar-sabor.js: 71 verificações automáticas (Playwright). Uso: `node checar-sabor.js http://servidor/XX_modulo_d/`. Roda no fuso America/Sao_Paulo (e uma parte em Asia/Tokyo, para provar que a hora não muda) e zera os dados da API antes (POST /reset).
- Roteiro por aspecto, gabarito por regra e pontos de atenção: ../Guia_Avaliador_Modulo_D_Sabor_de_Bairro.docx.
- Solução de referência comentada: ../solucao-comentada/XX_modulo_d/ (é material de revisão: pode ir para o Eduardo depois que ele tentar sozinho).
- Geradores (dados, imagens, prints, vídeos, CIS e documentos) em ../.fonte/.
X
mkdir -p $E/.fonte && cp $F/*.py $F/*.js $F/*.json $F/*.sh $E/.fonte/ && rm -rf $E/.fonte/__pycache__
du -sh $E; ls $E
