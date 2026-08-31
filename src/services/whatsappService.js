/**
 * WhatsApp notification service via CallMeBot
 */

const CALLMEBOT_URL = 'https://api.callmebot.com/whatsapp.php';
const PHONE = '558388841996';
const API_KEY = '4536444';

export function isWhatsAppConfigured() {
  return true; // Hardcoded keys are used
}

/**
 * Send a WhatsApp message via CallMeBot
 */
export async function sendWhatsApp(message) {
  const encodedText = encodeURIComponent(message);
  const url = `${CALLMEBOT_URL}?phone=${PHONE}&text=${encodedText}&apikey=${API_KEY}`;

  try {
    // using no-cors because callmebot does not return CORS headers
    await fetch(url, { method: 'GET', mode: 'no-cors' });
    return { success: true };
  } catch (err) {
    console.error('WhatsApp send error:', err);
    return { success: false, reason: err.message };
  }
}

/**
 * Format and send a BUY target alert
 */
export async function sendBuyAlert(ticker, targetPrice, currentPrice) {
  const message = [
    `🟢 *HORA DE COMPRAR — ${ticker}*`,
    `A ação atingiu o seu preço alvo de compra!`,
    ``,
    `Alvo definido: R$ ${targetPrice?.toFixed(2)}`,
    `Preço atual: R$ ${currentPrice?.toFixed(2)}`,
    ``,
    `📊 Acesse o painel para rever seu portfólio.`,
  ].join('\n');

  return sendWhatsApp(message);
}

/**
 * Format and send a SELL target alert
 */
export async function sendSellAlert(ticker, targetPrice, currentPrice) {
  const message = [
    `🔴 *HORA DE VENDER — ${ticker}*`,
    `A ação atingiu o seu preço alvo de venda!`,
    ``,
    `Alvo definido: R$ ${targetPrice?.toFixed(2)}`,
    `Preço atual: R$ ${currentPrice?.toFixed(2)}`,
    ``,
    `📊 Acesse o painel para rever seu portfólio.`,
  ].join('\n');

  return sendWhatsApp(message);
}
