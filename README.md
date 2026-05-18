# site-dros-industrias

Página de captura de leads da **Agência DROS** focada em **indústrias**.

🌐 **Produção:** [drosagencia.com.br/industria](https://drosagencia.com.br/industria)

---

## Sobre

Site institucional + landing de diagnóstico para a **DROS Sales** — a frente da DROS especializada em estruturar canal de vendas para indústrias e distribuidoras (fábricas, química, cosméticos, embalagens, automotivo, ração animal, ARLA, metalúrgica, equipamentos).

**Objetivo de negócio:** atrair dono de indústria, mostrar autoridade e cases, capturar leads qualificados via formulário multi-etapa que vai direto para o CRM da DROS.

---

## Estrutura do site

### `/` — Home institucional
- **Hero** com headline + carrossel de resultados (Quimiprol · Agrozacca · ASK · DoorGrill)
- **Faixa de logos** dos clientes
- **Diagnóstico do mercado** com dados da CNI + 6 problemas comuns da indústria
- **Método DROS Sales** (Análise → Anúncios → Comercial)
- **Faixa de KPIs** (199+ projetos · 16+ clientes · 6+ anos · 0% achismo)
- **Cases reais** em carrossel (Quimiprol · ASK · Agrozacca) com foto, headline, descrição e 3 stats
- **Depoimentos** em carrossel auto-rotativo (Rodri · Welliton · Ramon)
- **Tecnologia** entregue ao cliente:
  - Bloco destaque do **CRM com IA** (mockup CSS replicando o produto real) — qualificação automática, cadências, distribuição de leads, disparos por tag/funil e **integração Meta CAPI** (otimização por venda real, não clique)
  - **Landing pages iterativas** (mockup)
  - **Sistemas sob medida** (mockup do dashboard de pedidos)
  - **Personalização por indústria** (mockup de configuração)
- **5 diferenciais** (linguagem do dono de fábrica, processo inteiro, números, consistência, foco em indústria)
- **CTA final** + **Footer** com navegação, segmentos, contato

### `/diagnostico.html` — Landing de captura
- Hero com bullets de garantia (30 min, sem compromisso, confidencial)
- **Formulário multi-step em 3 etapas** com barra de progresso:
  1. **Identificação** — Nome, Empresa/Indústria, WhatsApp
  2. **Sua empresa** — Segmento, Faturamento mensal, Como pretende expandir
  3. **Investimento** — Anuncia? (sim/não) → se sim, plataformas (Meta/Google/TikTok/LinkedIn) + valor mensal
- Validação por etapa, animação suave, pause/continue, navegação back/next
- "7 pontos que vamos avaliar" — checklist
- "Como funciona — 3 passos"
- FAQ
- CTA final

---

## Captura completa de leads + tracking

O submit do formulário envia **42 campos** para uma planilha do Google Sheets via Apps Script, prontos para entrar no CRM e fazer remarketing/CAPI depois.

| Bloco | Campos |
|---|---|
| **Identificação do evento** | `event_id` (UUID, pra dedup com CAPI), `submitted_at`, `time_on_page_seconds` |
| **Dados do form** | nome, empresa, whatsapp, segmento, faturamento, expansão, anuncia, plataformas, investimento |
| **UTMs** | utm_source, utm_medium, utm_campaign, utm_term, utm_content, utm_id |
| **Click IDs** | `fbclid` (Meta) · `gclid`/`gbraid`/`wbraid` (Google) · `ttclid` (TikTok) · `li_fat_id` (LinkedIn) · `msclkid` (Bing) · `twclid` (X) · `epik` (Pinterest) · `ScCid` (Snap) |
| **Pixel cookies** | `_fbp`, `_fbc` (gerado a partir do fbclid se ausente), `_ga`, `ga_client_id` |
| **Inferência** | `traffic_type` (paid · organic · social · email · referral · direct) |
| **Contexto sessão** | landing_page (primeira URL da sessão), current_page (página do submit), page_title, referrer |
| **Device** | user_agent, language, timezone, screen, viewport |

> **Observação:** o site **não dispara** evento Meta/Google direto. Quem cuida disso é o CRM, que recebe o lead com `event_id` único + cookies do Pixel e dispara o CAPI quando o lead avança no funil (atendimento → proposta → venda).

Passo-a-passo de integração da planilha em [`INTEGRACAO-LEADS.md`](./INTEGRACAO-LEADS.md).

---

## Stack técnica

HTML5 + CSS3 puro. **Zero framework, zero build step.** Inter via Google Fonts.

```
dros-sales-site-v2/
├── index.html           # Home institucional
├── diagnostico.html     # Landing de captura
├── styles.css           # Design system compartilhado
├── diagnostico.css      # Componentes da landing (form, FAQ, etc.)
├── apps-script-leads.gs # Cole no Google Apps Script
├── INTEGRACAO-LEADS.md  # Passo-a-passo da planilha
└── assets/
    ├── icons/           # Logos dos clientes (4)
    └── img/             # Fachadas, avatares e logo DROS
```

### Design tokens

| Token | Valor |
|---|---|
| Background base | `#0a1018` |
| Background alt | `#0d141d` / `#06090e` |
| Accent (amarelo) | `#ffb300` |
| Texto | `#ffffff` |
| Fonte | Inter (400–900) |
| Container | 1200px |

### Componentes notáveis

- **3 carrosséis** alimentados pela mesma função `makeCarousel(wrap, slideSel, dotSel, interval)`:
  - Resultados de clientes no hero (5s)
  - Cases reais (8s)
  - Depoimentos (6s)
- **SVG icon sprite** Lucide-style no topo do `<body>` — todos os ícones são `<use href="#i-name"/>` herdando `currentColor`
- **Formulário multi-step** com barra de progresso, validação por etapa, lógica condicional
- **Mockups CSS** que replicam o produto real da DROS (CRM, dashboard, landing, painel de configuração)

### Responsivo

Quebra mobile-first com breakpoints em 768px, 600px, 420px. CTAs do header somem em mobile (já têm botão no hero e CTAs ao longo da página). Carrosséis viram coluna única.

---

## Rodar local

Qualquer servidor estático funciona. Não há build step.

```bash
# Com Node
npx serve .
# ou
python -m http.server 8765
```

Acesse `http://localhost:8765/` (home) ou `http://localhost:8765/diagnostico.html` (landing).

---

## Deploy

Site **100% estático**. Hospede em qualquer servidor que sirva HTML — Apache, nginx, Vercel, Netlify, S3, GitHub Pages.

Produção atual: **Apache** na VPS DROS, servindo em `drosagencia.com.br/industria`.

```bash
# Na VPS (root via SSH)
cd /home/drosagen/public_html   # ajuste para seu docroot real
git clone https://github.com/soaresjoaoluiz1/site-dros-industrias.git industria

# Updates futuros
cd /home/drosagen/public_html/industria
git pull
```

---

## Notas de manutenção

- **Imagens grandes:** `quimiprol-fachada.jpg` está com 29MB e `hero-industria.jpg` com 13MB. Antes do deploy final, otimize para < 500KB cada (ex: `cwebp` ou `mozjpeg`).
- **Endpoint do Apps Script:** após deployar a planilha, edite `diagnostico.html` e preencha `LEAD_ENDPOINT` + `LEAD_SECRET` no `<script>` final.
- **Integração CRM:** o CRM da DROS deve consumir a planilha (via Apps Script trigger ou polling) e disparar eventos CAPI quando o lead progredir.
