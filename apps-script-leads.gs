/**
 * ============================================================
 * DROS Sales — Apps Script (2 fluxos)
 * ============================================================
 *
 * Roteia o POST por `event_source`:
 *  - 'dros-sales-website'  → aba "INDUSTRIA DIAGNÓSTICO" (form de lead, com contato)
 *  - 'dros-sales-raio-x'   → aba "RAIO X QUIZ RESPOSTAS" (quiz auto-diagnóstico, sem contato)
 *
 * DEPLOY:
 *  1) Extensões → Apps Script → cola este arquivo (substitui o anterior).
 *  2) Implantar → Gerenciar implantações → Editar implantação ativa → Nova versão.
 *  3) Salva. A URL /exec continua a mesma — não precisa atualizar no site.
 *  4) Roda `testQuiz()` e `testDiag()` uma vez pra criar headers + autorizar permissões.
 * ============================================================
 */

const SECRET = 'dros-leads-2026-9bK4Tx7QmR2pYz8WfA3H';
const SHEET_DIAGNOSTICO = 'INDUSTRIA DIAGNÓSTICO';
const SHEET_QUIZ        = 'RAIO X QUIZ RESPOSTAS';
const NOTIFY_EMAIL      = '';

// ============================================
// Colunas — Diagnóstico (com contato)
// ============================================
const COLS_DIAG = [
  'Recebido em','Event ID','Submitted At',
  'Nome','Empresa','WhatsApp','Segmento','Faturamento','Expansão','Anuncia?','Plataformas','Investimento',
  'Traffic Type','UTM Source','UTM Medium','UTM Campaign','UTM Term','UTM Content','UTM ID',
  'fbclid','gclid','gbraid','wbraid','ttclid','li_fat_id','msclkid','twclid','epik','sccid',
  'fbp (Facebook Browser ID)','fbc (Facebook Click ID)','GA','GA Client ID',
  'Landing Page','Current Page','Page Title','Referrer','Time on Page (s)',
  'User Agent','Language','Timezone','Screen','Viewport','IP (server)'
];

// ============================================
// Colunas — Raio-X Quiz (sem contato, com todas as respostas + score)
// ============================================
const COLS_QUIZ = [
  'Recebido em','Event ID','Submitted At','Tempo no Quiz (s)',

  // === Respostas ===
  'Segmento (setor)','Tempo de empresa','Entrega própria','Redes sociais',
  'Já tentou digital','Maior dificuldade',
  'Faturamento (faixa)','Faturamento (valor médio)',
  'Ticket médio (R$)','Clientes ativos','Novos por mês',
  'Top 5 clientes (%)','Indicação (%)','Investe em captação (R$/mês)',
  'Canais que trazem cliente',
  'CRM (0-10)','Follow-up (%)','Conversão (%)',
  'Prevê venda (0-10)','Abre região (0-10)','Processo (0-10)','Digital traz pedido (0-10)','Crescimento (0-10)',

  // === Análise ===
  'Score Geral (0-10)','Faixa','Band Label',
  'Score Previsibilidade','Score Novos Clientes','Score Processo','Score Digital','Score Gestão',
  'Ganho Mensal Projetado (R$)','Ganho Anual Projetado (R$)',
  'Faturamento >= R$ 100k?','Tier (Pixel)',

  // === Origem / tracking ===
  'Traffic Type','UTM Source','UTM Medium','UTM Campaign','UTM Term','UTM Content','UTM ID',
  'fbclid','gclid','gbraid','wbraid','ttclid','li_fat_id','msclkid','twclid','epik','sccid',
  'fbp (Facebook Browser ID)','fbc (Facebook Click ID)','GA','GA Client ID',

  // === Contexto ===
  'Landing Page','Current Page','Page Title','Referrer',
  'User Agent','Language','Timezone','Screen','Viewport','IP (server)'
];

// ============================================
// doPost — roteador
// ============================================
function doPost(e) {
  try {
    const raw  = e && e.postData ? e.postData.contents : '';
    const data = JSON.parse(raw || '{}');

    if (SECRET && data._secret !== SECRET) {
      return jsonResponse({ ok: false, error: 'unauthorized' });
    }

    const source = (data.event_source || '').toString();
    const ip     = (e && e.parameter && e.parameter.ip) || '';

    if (source === 'dros-sales-raio-x') {
      writeQuizRow(data, ip);
    } else {
      writeDiagRow(data, ip);
    }

    if (NOTIFY_EMAIL) sendNotification(data);
    return jsonResponse({ ok: true, source: source || 'diagnostico' });

  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

// ============================================
// doGet — sanity check
// ============================================
function doGet() {
  return HtmlService.createHtmlOutput(
    '<h2>DROS — Endpoint de leads ativo</h2>' +
    '<p>POST aqui pra registrar lead.</p>' +
    '<p>Abas: <b>' + SHEET_DIAGNOSTICO + '</b> e <b>' + SHEET_QUIZ + '</b>.</p>' +
    '<p>Última checagem: ' + new Date().toLocaleString('pt-BR') + '</p>'
  );
}

// ============================================
// Writers
// ============================================
function writeDiagRow(d, ip) {
  const sheet = getOrCreateSheet(SHEET_DIAGNOSTICO, COLS_DIAG);
  sheet.appendRow([
    new Date(), d.event_id || '', d.submitted_at || '',
    d.nome || '', d.empresa || '', d.whatsapp || '',
    d.segmento || '', d.faturamento || '', d.expansao || '',
    d.anuncia || '', d.plataformas || '', d.investimento || '',
    d.traffic_type || '',
    d.utm_source || '', d.utm_medium || '', d.utm_campaign || '',
    d.utm_term || '', d.utm_content || '', d.utm_id || '',
    d.fbclid || '', d.gclid || '', d.gbraid || '', d.wbraid || '',
    d.ttclid || '', d.li_fat_id || '', d.msclkid || '', d.twclid || '',
    d.epik || '', d.sccid || '',
    d.fbp || '', d.fbc || '', d.ga || '', d.ga_client_id || '',
    d.landing_page || '', d.current_page || '', d.page_title || '',
    d.referrer || '', d.time_on_page_seconds || '',
    d.user_agent || '', d.language || '', d.timezone || '',
    d.screen || '', d.viewport || '', ip
  ]);
}

function writeQuizRow(d, ip) {
  const sheet = getOrCreateSheet(SHEET_QUIZ, COLS_QUIZ);
  const fatValor = Number(d.fat_valor || 0);
  const tier = fatValor >= 100000 ? 'mais100k' : (fatValor > 0 ? 'menos100k' : '');
  sheet.appendRow([
    new Date(), d.event_id || '', d.submitted_at || '', d.time_on_page_seconds || '',

    // Respostas
    d.setor || '', d.tempo || '', d.entrega || '', d.redes || '',
    d.jatentou || '', d.dificuldade || '',
    d.fatFaixa_label || '', fatValor || '',
    d.ticket || '', d.clientesAtivos || '', d.novosMes || '',
    d.topClientesPct || '', d.indicacaoPct || '', d.investe || '',
    d.canais || '',
    d.crm || '', d.followup || '', d.conversao || '',
    d.prev1 || '', d.novos1 || '', d.proc1 || '', d.digital1 || '', d.cresce1 || '',

    // Análise
    d.score_overall || '', d.faixa || '', d.band_label || '',
    d.score_prev || '', d.score_novos || '', d.score_proc || '', d.score_digital || '', d.score_gestao || '',
    d.ganho_mensal || '', d.ganho_anual || '',
    fatValor >= 100000 ? 'sim' : (fatValor > 0 ? 'não' : ''),
    tier,

    // Tracking
    d.traffic_type || '',
    d.utm_source || '', d.utm_medium || '', d.utm_campaign || '',
    d.utm_term || '', d.utm_content || '', d.utm_id || '',
    d.fbclid || '', d.gclid || '', d.gbraid || '', d.wbraid || '',
    d.ttclid || '', d.li_fat_id || '', d.msclkid || '', d.twclid || '',
    d.epik || '', d.sccid || '',
    d.fbp || '', d.fbc || '', d.ga || '', d.ga_client_id || '',

    // Contexto
    d.landing_page || '', d.current_page || '', d.page_title || '',
    d.referrer || '',
    d.user_agent || '', d.language || '', d.timezone || '',
    d.screen || '', d.viewport || '', ip
  ]);
}

// ============================================
// Helpers
// ============================================
function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold').setBackground('#0a1018').setFontColor('#ffb300');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendNotification(d) {
  if (!NOTIFY_EMAIL) return;
  try {
    const isQuiz = d.event_source === 'dros-sales-raio-x';
    const subject = isQuiz
      ? '🟡 Novo Raio-X concluído: ' + (d.setor || 'sem segmento')
      : '🟢 Novo lead Diagnóstico: ' + (d.nome || 'sem nome');
    const body = isQuiz
      ? [
          'Segmento: ' + (d.setor || '-'),
          'Faturamento: ' + (d.fatFaixa_label || '-'),
          'Tier: ' + (Number(d.fat_valor || 0) >= 100000 ? 'mais100k' : 'menos100k'),
          'Score Geral: ' + (d.score_overall || '-'),
          'Faixa: ' + (d.band_label || '-'),
          '',
          'Origem: ' + (d.traffic_type || '-'),
          'UTM: ' + [d.utm_source, d.utm_medium, d.utm_campaign].filter(Boolean).join(' / '),
        ].join('\n')
      : [
          'Nome: ' + (d.nome || '-'),
          'Empresa: ' + (d.empresa || '-'),
          'WhatsApp: ' + (d.whatsapp || '-'),
          'Segmento: ' + (d.segmento || '-'),
          'Faturamento: ' + (d.faturamento || '-'),
          'Expansão: ' + (d.expansao || '-'),
          '',
          'Origem: ' + (d.traffic_type || '-'),
          'UTM: ' + [d.utm_source, d.utm_medium, d.utm_campaign].filter(Boolean).join(' / '),
        ].join('\n');
    MailApp.sendEmail({ to: NOTIFY_EMAIL, subject, body });
  } catch (_) {}
}

// ============================================
// Testes — rode UMA vez pra autorizar + criar headers
// ============================================
function testDiag() {
  doPost({ postData: { contents: JSON.stringify({
    _secret: SECRET,
    event_source: 'dros-sales-website',
    event_id: 'test-diag-' + Date.now(),
    submitted_at: new Date().toISOString(),
    nome: 'João Teste', empresa: 'Indústria Demo',
    whatsapp: '(48) 99999-9999', segmento: 'Indústria química',
    faturamento: 'R$ 1 mi – R$ 5 mi', expansao: 'Revendedores',
    anuncia: 'sim', plataformas: 'Meta Ads', investimento: 'R$ 5.000',
    traffic_type: 'direct', landing_page: 'https://drosagencia.com.br/industria/diagnostico.html',
    current_page: 'https://drosagencia.com.br/industria/diagnostico.html',
    referrer: '', time_on_page_seconds: 90,
  })}});
}

function testQuiz() {
  doPost({ postData: { contents: JSON.stringify({
    _secret: SECRET,
    event_source: 'dros-sales-raio-x',
    event_id: 'test-quiz-' + Date.now(),
    submitted_at: new Date().toISOString(),
    time_on_page_seconds: 180,
    setor: 'Cosméticos', tempo: 7, entrega: 1,
    redes: 'Instagram, WhatsApp Business',
    jatentou: 2, dificuldade: 5,
    fatFaixa_label: 'R$ 500 mil a R$ 1 milhão', fat_valor: 750000,
    ticket: '2500', clientesAtivos: '80', novosMes: '3',
    topClientesPct: 30, indicacaoPct: 45, investe: 3000,
    canais: 'Indicação / boca a boca, Representante comercial',
    crm: 3, followup: 40, conversao: '15',
    prev1: 4, novos1: 3, proc1: 5, digital1: 2, cresce1: 4,
    score_overall: 4.2, faixa: 'medio', band_label: 'Parcialmente estruturado',
    score_prev: 4.5, score_novos: 3.8, score_proc: 4.0, score_digital: 3.5, score_gestao: 4.2,
    ganho_mensal: 25000, ganho_anual: 300000,
    traffic_type: 'paid', utm_source: 'facebook', utm_campaign: 'raio-x-mai-2026',
    landing_page: 'https://drosagencia.com.br/industria/raio-x/',
    current_page: 'https://drosagencia.com.br/industria/raio-x/',
    referrer: 'https://www.facebook.com/',
  })}});
}
