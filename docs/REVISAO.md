# Roteiro de revisão de conteúdo (antes de publicar)

Pesquisa inicial feita em 09/10/2026. Todos os 63 links responderam no verificador automático (`npm run check:links`). Isso confirma que as páginas existem, mas **não** que o conteúdo foi lido corretamente: essa conferência é o papel da revisão humana.

## Como revisar

1. Rode `npm run dev` e abra `http://localhost:3000/metodologia/`. A página mostra cada posição com resumo, justificativa, confiança e fontes.
2. Para cada posição, abra ao menos a fonte principal e confirme:
   - a fonte diz o que o resumo afirma;
   - a alternativa escolhida é a mais próxima, e as vizinhas são menos adequadas;
   - o mesmo critério foi aplicado aos dois candidatos.
3. Corrija o que for preciso em `src/data/positions.json` e `src/data/news.json`.
4. Ao concluir, mude `reviewStatus` para `"revisado"` nos dois arquivos. Esse campo é só um controle interno da equipe e não aparece no site.

## Posições atribuídas (valor 1 a 4, ver alternativas em `questions.json`)

| Tema | Flávio Bolsonaro | Lula | Observação |
|---|---|---|---|
| Estatais | 3 (média) | 1 (alta) | Flávio: sinais conflitantes ("privatizar 95%" em 02/2026 × Sachsida em 08/10/2026) |
| Impostos | 4 (alta) | 2 (alta) | Fala de Flávio sobre tributar dividendos só aparece em paráfrase; se confirmada, reavaliar entre 3 e 4 |
| Programas sociais | 2 (média) | 1 (alta) | |
| Saúde | 2 (média) | 2 (alta) | Mesmo valor: o tema não diferencia os candidatos |
| Educação | 3 (média) | 1 (alta) | Flávio: plano prioriza escolas cívico-militares; a pergunta não cita militares, então a alternativa 3 ("mais disciplina") depende de interpretação |
| Armas | 3 (média) | 2 (alta) | Flávio: dúvida entre 3 e 4 (revogação do Estatuto detalhada por um aliado, não pelo plano) |
| Meio ambiente | 3 (alta) | 2 (alta) | |
| Corrupção (foro) | 3 (média) | **insuficiente** | Lula: sem posição documentada sobre o foro. O tema fica fora do cálculo |
| Trabalho | 4 (média) | 1 (alta) | Flávio: alternativa 4 é a mais próxima (flexibilização, negociado sobre o legislado, pagamento por hora), mas "mais de 50h semanais" e "menos direitos" não aparecem nas fontes |
| Política externa | 3 (alta) | 2 (alta) | |

## Pendências conhecidas

- [ ] **Planos de governo:** foram lidos em cópias publicadas por veículos (Congresso em Foco, Poder360, Agência Brasil), porque o DivulgaCandContas/TSE bloqueou o acesso automatizado. Conferir no TSE e, se possível, trocar as URLs pelas oficiais.
- [ ] **PEC do fim da escala 6x1:** confirmar se houve votação no plenário do Senado após 07/10/2026.
- [ ] **Contexto da pergunta sobre foro:** conferir no site do STF a decisão de 03/2025 e a confirmação de 05/2026.
- [ ] **Republicações:** algumas notícias apontam para republicações (ex.: Estadão Conteúdo e BBC em outros portais). O veículo original está indicado; trocar pela URL original se preferir.
- [ ] **Datas ausentes:** 13 de 70 evidências e 1 notícia estão sem data de publicação confirmada (aparecem como "Data não informada").
- [ ] **Opinião:** a coluna do O POVO+ (meio ambiente) e o artigo da CartaCapital (política externa) são opinião e estão marcados como "análise". Avaliar se devem permanecer.
- [ ] **Perguntas e alternativas (v2.1.0):** estão em linguagem simples, foram encurtadas e não citam instituições nem programas (STF, Bolsa Família, BRICS etc.), para evitar respostas guiadas pela reação ao nome. Reler as 10 perguntas e confirmar que cada posição continua mapeada na alternativa certa com a nova redação. Nas justificativas, "alternativa N" se refere ao valor N da escala (1 a 4), listado em `/metodologia`.
