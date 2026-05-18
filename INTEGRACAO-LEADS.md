# Integração de leads — DROS Diagnóstico → Google Sheets

Os leads do formulário em `diagnostico.html` são enviados para uma planilha do Google via Apps Script (Web App). Tudo o que é trackeável também vai junto: UTMs, click IDs, cookies do Meta/Google, contexto da sessão.

## Por que vale a pena

- **Tudo numa planilha** — você abre o Google Sheets e vê todos os leads, com origem, plataforma, dispositivo, tempo na página.
- **Pronto pra Meta CAPI** — coletamos `_fbp`, `_fbc`, `fbclid` e geramos um `event_id` único pra deduplicar com Pixel.
- **Atribuição correta** — registramos UTMs, `gclid`, `fbclid`, `ttclid`, etc. Você sabe se o lead veio de Meta, Google, TikTok, LinkedIn, organic, social, direto.
- **Remarketing fácil** — todos os click IDs e cookies ficam guardados pra subir audiência custom depois.

## Passo a passo

### 1. Preparar a planilha

1. Crie (ou abra) uma planilha do Google Sheets onde vai receber os leads.
2. No menu, vá em **Extensões → Apps Script**.
3. Apague tudo que estiver no editor.
4. Cole o conteúdo de [`apps-script-leads.gs`](./apps-script-leads.gs).

### 2. Configurar segredo

No topo do script, troque:

```js
const SECRET = 'troque-isso-por-uma-string-aleatoria-e-cole-no-diagnostico-html';
```

Por algo aleatório longo, ex: `'dros-leads-7K3xP9aQ-2026'`.

**Anote esse valor** — você vai colar igualzinho no `diagnostico.html`.

*Opcional:* preencha `NOTIFY_EMAIL` se quiser receber notificação por email a cada lead novo.

### 3. (Opcional) Testar antes de deployar

Com o script aberto, no menu superior do editor:

1. Selecione a função `testInsertarLeadDeExemplo` no dropdown.
2. Clique em **Executar** ▶.
3. Primeira vez vai pedir autorização — aceite com a sua conta Google. (Pode aparecer aviso "App não verificado" — é normal, é seu próprio script. Clique em "Avançado → Acessar sem confirmação".)
4. Volte na planilha — deve aparecer a aba **Leads** com o cabeçalho destacado em amarelo e uma linha de teste do "João Teste".

### 4. Implantar como Web App

1. No editor do Apps Script, canto superior direito: **Implantar → Nova implantação**.
2. Em "Selecionar tipo" (ícone de engrenagem), escolha **App da Web**.
3. Preencha:
   - **Descrição:** `DROS Leads — v1`
   - **Executar como:** *Eu (seu email)*
   - **Quem tem acesso:** *Qualquer pessoa* (precisa ser exatamente isso pra o site conseguir enviar sem login)
4. Clique em **Implantar**.
5. Autorize as permissões se pedir.
6. **Copie a URL gerada** — termina em `/exec`. Algo como:
   `https://script.google.com/macros/s/AKfycb.../exec`

### 5. Conectar o site

No arquivo `diagnostico.html`, localize estas duas constantes (dentro do `<script>` no final do arquivo):

```js
const LEAD_ENDPOINT = ''; // ex: 'https://script.google.com/macros/s/AKfycb.../exec'
const LEAD_SECRET = '';   // mesmo valor configurado no Apps Script
```

Cole:
- `LEAD_ENDPOINT` = a URL `/exec` do passo 4.
- `LEAD_SECRET` = o `SECRET` que você definiu no passo 2.

### 6. Testar end-to-end

1. Abra `http://localhost:8765/diagnostico.html?utm_source=teste&utm_medium=cpc&utm_campaign=primeiro-teste&fbclid=IwAR_xxx` (qualquer combinação de UTMs).
2. Preencha os 3 passos do formulário.
3. Envie.
4. Confira na planilha — uma nova linha deve aparecer com o lead **+ todos os UTMs e o `fbclid`** preenchidos.

## O que é capturado em cada lead

| Bloco | Campos |
|---|---|
| **Identificação do evento** | `event_id` (UUID), `submitted_at`, `time_on_page_seconds` |
| **Dados do form** | nome, empresa, whatsapp, segmento, faturamento, expansão, anuncia?, plataformas (múltiplas), investimento |
| **UTMs** | utm_source, utm_medium, utm_campaign, utm_term, utm_content, utm_id |
| **Click IDs** | `fbclid` (Meta), `gclid`/`gbraid`/`wbraid` (Google), `ttclid` (TikTok), `li_fat_id` (LinkedIn), `msclkid` (Bing), `twclid` (X), `epik` (Pinterest), `ScCid` (Snap) |
| **Cookies pixel** | `_fbp` (Facebook browser id), `_fbc` (Facebook click id), `_ga` (Google Analytics), `ga_client_id` |
| **Inferência** | `traffic_type` (paid · organic · social · email · referral · direct) |
| **Contexto sessão** | landing_page (primeira página da sessão), current_page (página do submit), page_title, referrer (de onde veio) |
| **Device** | user_agent, language, timezone, screen, viewport |

## Atualização futura

Se editar o `apps-script-leads.gs`:
1. Cola a nova versão no editor.
2. **Implantar → Gerenciar implantações**.
3. Edite a implantação atual (ícone de lápis) → escolha "Nova versão" no dropdown → **Implantar**.

A URL `/exec` permanece a mesma — não precisa atualizar o site.

## Sobre o backup local

Mesmo se o Apps Script estiver fora do ar ou der erro de rede, o lead é salvo em `localStorage` do navegador (chave `dros_diag_submissions`). Não some, mas fica apenas no device de quem submeteu — útil pra debug, não pra recuperação.

## Sobre Meta CAPI (próximo passo)

O `event_id` único + `_fbp` + `_fbc` + dados de usuário (nome, whatsapp normalizado, email se houver) já formam o payload pra **deduplicação com o Pixel**. Próximo passo seria:

1. No Gerenciador de Eventos do Meta: criar evento server-side **Lead**.
2. Pegar **Access Token** + **Pixel ID**.
3. Adicionar uma função no Apps Script (`sendToMetaCAPI`) que pega a linha recém-inserida e dispara o evento para a API Graph do Facebook (`/PIXEL_ID/events`) com `event_id` igual ao do browser. Isso elimina duplicação e cobre quem está com adblock.

Quando quiser ativar isso, peça que eu monto a função.
