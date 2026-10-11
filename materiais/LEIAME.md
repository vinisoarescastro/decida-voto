# Materiais de divulgação

| Arquivo | Uso |
|---|---|
| `panfleto-a4.pdf` | Panfleto A4 para imprimir em tamanho real (100%). O QR code abre `https://emquemvotar.digital/?origem=panfleto` (contado como "Panfleto" no painel). |
| `panfleto-a4-previa.png` | Prévia do panfleto (para enviar por mensagem). |
| `stories-1080x1920.png` | Arte para stories. Colar o adesivo de link com `https://emquemvotar.digital/?origem=stories` dentro do retângulo. |

## Como alterar

As fontes editáveis estão em `fontes/` (`panfleto.html`, `stories.html`, logo, fotos e QR code). Para gerar de novo, abra o HTML
no Chrome e use **Imprimir › Salvar como PDF** (A4, margens "Nenhuma", com "Gráficos de plano de fundo") para o panfleto, ou
uma captura de tela em 1080×1920 para os stories.

Para trocar o link do QR code (ex.: outra origem), gere um novo `fontes/qr.svg` com correção de erro alta e confira a leitura
com a câmera do celular antes de imprimir.
