/**
 * ============================================================
 * DROS Sales — Apps Script para receber leads do form Diagnóstico
 * ============================================================
 *
 * COMO USAR (resumo rápido):
 *
 * 1) Abra a planilha do Google onde você quer receber os leads.
 * 2) Menu: Extensões → Apps Script.
 * 3) Apague tudo que vier no editor e cole ESTE arquivo inteiro.
 * 4) No topo do arquivo, troque a constante SECRET por algo aleatório
 *    (qualquer string longa). Depois cole o MESMO valor no
 *    `diagnostico.html` (LEAD_SECRET).
 * 5) Clique em "Implantar → Nova implantação".
 *    - Tipo: "App da Web".
 *    - Executar como: "Eu (seu email)".
 *    - Quem tem acesso: "Qualquer pessoa".
 * 6) Copie a URL gerada (termina em /exec) e cole no `diagnostico.html`
 *    (constante LEAD_ENDPOINT).
 * 7) Pronto. Os próximos leads vão cair na aba "Leads".
 *
 * (Detalhes completos em INTEGRACAO-LEADS.md)
 * ============================================================
 */

// ============================================
// CONFIGURAÇÃO
// ============================================
const SECRET = 'dros-leads-2026-9bK4Tx7QmR2pYz8WfA3H'; // já configurado no diagnostico.html
const SHEET_NAME = 'INDUSTRIA DIAGNÓSTICO';            // aba da planilha "ENTRADA DE LEADS | DROS AGÊNCIA"
const NOTIFY_EMAIL = '';                                // Opcional: email pra notificação. Deixe vazio pra desligar.

// ============================================
// Ordem das colunas (cabeçalho)
// ============================================
const COLUMNS = [
  'Recebido em',          // timestamp do server
  'Event ID',             // UUID — usar pra deduplicar com Meta CAPI
  'Submitted At',         // timestamp do browser

  // === Dados do lead ===
  'Nome',
  'Empresa',
  'WhatsApp',
  'Segmento',
  'Faturamento',
  'Expansão',
  'Anuncia?',
  'Plataformas',
  'Investimento',

  // === Origem / tracking ===
  'Traffic Type',
  'UTM Source',
  'UTM Medium',
  'UTM Campaign',
  'UTM Term',
  'UTM Content',
  'UTM ID',

  // === Click IDs ===
  'fbclid',
  'gclid',
  'gbraid',
  'wbraid',
  'ttclid',
  'li_fat_id',
  'msclkid',
  'twclid',
  'epik',
  'sccid',

  // === Pixel cookies (CAPI) ===
  'fbp (Facebook Browser ID)',
  'fbc (Facebook Click ID)',
  'GA',
  'GA Client ID',

  // === Contexto ===
  'Landing Page',
  'Current Page',
  'Page Title',
  'Referrer',
  'Time on Page (s)',
  'User Agent',
  'Language',
  'Timezone',
  'Screen',
  'Viewport',
  'IP (server)',
];

// ============================================
// Endpoint POST — recebe o lead do site
// ============================================
function doPost(e) {
  try {
    const raw = e && e.postData ? e.postData.contents : '';
    const data = JSON.parse(raw || '{}');

    if (SECRET && data._secret !== SECRET) {
      return jsonResponse({ ok: false, error: 'unauthorized' });
    }

    const sheet = getOrCreateSheet();

    // Headers (só na primeira execução)
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(COLUMNS);
      sheet.getRange(1, 1, 1, COLUMNS.length)
        .setFontWeight('bold')
        .setBackground('#0a1018')
        .setFontColor('#ffb300');
      sheet.setFrozenRows(1);
    }

    const ip = (e && e.parameter && e.parameter.ip) || '';

    sheet.appendRow([
      new Date(),
      data.event_id || '',
      data.submitted_at || '',

      data.nome || '',
      data.empresa || '',
      data.whatsapp || '',
      data.segmento || '',
      data.faturamento || '',
      data.expansao || '',
      data.anuncia || '',
      data.plataformas || '',
      data.investimento || '',

      data.traffic_type || '',
      data.utm_source || '',
      data.utm_medium || '',
      data.utm_campaign || '',
      data.utm_term || '',
      data.utm_content || '',
      data.utm_id || '',

      data.fbclid || '',
      data.gclid || '',
      data.gbraid || '',
      data.wbraid || '',
      data.ttclid || '',
      data.li_fat_id || '',
      data.msclkid || '',
      data.twclid || '',
      data.epik || '',
      data.sccid || '',

      data.fbp || '',
      data.fbc || '',
      data.ga || '',
      data.ga_client_id || '',

      data.landing_page || '',
      data.current_page || '',
      data.page_title || '',
      data.referrer || '',
      data.time_on_page_seconds || '',
      data.user_agent || '',
      data.language || '',
      data.timezone || '',
      data.screen || '',
      data.viewport || '',
      ip,
    ]);

    if (NOTIFY_EMAIL) sendNotification(data);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

// ============================================
// Endpoint GET — só pra testar se o app está no ar
// ============================================
function doGet() {
  return HtmlService.createHtmlOutput(
    '<h2>DROS — Endpoint de leads ativo</h2>' +
    '<p>POST aqui pra registrar lead. Última atualização: ' +
    new Date().toLocaleString('pt-BR') + '</p>'
  );
}

// ============================================
// Helpers
// ============================================
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendNotification(data) {
  if (!NOTIFY_EMAIL) return;
  try {
    const subject = '🟢 Novo lead DROS Diagnóstico: ' + (data.nome || 'sem nome');
    const body = [
      'Nome: ' + (data.nome || '-'),
      'Empresa: ' + (data.empresa || '-'),
      'WhatsApp: ' + (data.whatsapp || '-'),
      'Segmento: ' + (data.segmento || '-'),
      'Faturamento: ' + (data.faturamento || '-'),
      'Expansão: ' + (data.expansao || '-'),
      'Anuncia: ' + (data.anuncia || '-'),
      'Plataformas: ' + (data.plataformas || '-'),
      'Investimento: ' + (data.investimento || '-'),
      '',
      'Origem: ' + (data.traffic_type || '-'),
      'UTM Source/Medium/Campaign: ' + [data.utm_source, data.utm_medium, data.utm_campaign].filter(Boolean).join(' / '),
      'Landing: ' + (data.landing_page || '-'),
      'Referrer: ' + (data.referrer || '-'),
    ].join('\n');
    MailApp.sendEmail({ to: NOTIFY_EMAIL, subject, body });
  } catch (_) { /* ignora falha de email */ }
}

// ============================================
// FUNÇÃO DE TESTE — rode manualmente uma vez
// para autorizar permissões e ver headers na planilha
// ============================================
function testInsertarLeadDeExemplo() {
  doPost({
    postData: {
      contents: JSON.stringify({
        _secret: SECRET,
        event_id: 'test-' + Date.now(),
        submitted_at: new Date().toISOString(),
        nome: 'João Teste',
        empresa: 'Indústria Demo',
        whatsapp: '(41) 99999-9999',
        segmento: 'Indústria química',
        faturamento: 'R$ 1 mi – R$ 5 mi',
        expansao: 'Revendedores',
        anuncia: 'sim',
        plataformas: 'Meta Ads, Google Ads',
        investimento: 'R$ 5.000',
        traffic_type: 'paid',
        utm_source: 'facebook',
        utm_medium: 'cpc',
        utm_campaign: 'diagnostico-mai-2026',
        fbclid: 'IwAR_demo123',
        landing_page: 'https://drosagencia.com.br/industria/diagnostico.html?utm_source=facebook',
        current_page: 'https://drosagencia.com.br/industria/diagnostico.html',
        referrer: 'https://www.facebook.com/',
        user_agent: 'Mozilla/5.0 (test)',
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        screen: '1920x1080',
        viewport: '1440x900',
        time_on_page_seconds: 87,
      })
    }
  });
}
