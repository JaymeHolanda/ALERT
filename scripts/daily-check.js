import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fetch from 'node-fetch'; // Requires node-fetch for Node.js if using older node, but GitHub actions uses Node 20+, so global fetch is available.

// Use the Firebase config provided
// Since we don't have a service account JSON, we will initialize using standard config 
// but Firebase Admin usually requires a Service Account. 
// For this open project, since rules are likely open, we can use the REST API or standard client SDK in node.
// However, it's easier to just use the standard firebase client SDK in a Node script for this simple use case.

import { initializeApp as initClient } from 'firebase/app';
import { getFirestore as getClientFirestore, collection, getDocs, setDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDAmxWKW0QEcMBllYxTlYOaLbuEIC2Svu0",
  authDomain: "b3procurador.firebaseapp.com",
  projectId: "b3procurador",
  storageBucket: "b3procurador.firebasestorage.app",
  messagingSenderId: "851733772729",
  appId: "1:851733772729:web:ae8e3a3f4b4f27eed45e68"
};

const app = initClient(firebaseConfig);
const db = getClientFirestore(app);

const CALLMEBOT_URL = 'https://api.callmebot.com/whatsapp.php';
const PHONE = process.env.WHATSAPP_PHONE || '558388841996';
const API_KEY = process.env.WHATSAPP_APIKEY || '4536444';

async function sendWhatsApp(message) {
  const encodedText = encodeURIComponent(message);
  const url = `${CALLMEBOT_URL}?phone=${PHONE}&text=${encodedText}&apikey=${API_KEY}`;
  try {
    await fetch(url);
    console.log('✅ WhatsApp message sent successfully');
  } catch (err) {
    console.error('❌ Failed to send WhatsApp message:', err.message);
  }
}

async function fetchQuote(ticker) {
  const url = `https://brapi.dev/api/quote/${ticker}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`brapi error: ${res.status}`);
  const data = await res.json();
  return data.results?.[0];
}

async function runDailyCheck() {
  console.log('🚀 Starting daily price check...');
  
  try {
    const querySnapshot = await getDocs(collection(db, 'portfolio'));
    const stocks = [];
    querySnapshot.forEach(d => stocks.push(d.data()));
    
    console.log(`📦 Found ${stocks.length} stocks in portfolio.`);
    
    for (const stock of stocks) {
      if (!stock.buyTarget && !stock.sellTarget) {
        console.log(`⏩ Skipping ${stock.ticker} (no targets set)`);
        continue;
      }
      
      console.log(`🔍 Checking ${stock.ticker}...`);
      try {
        const quote = await fetchQuote(stock.ticker);
        const currentPrice = quote?.regularMarketPrice;
        
        if (!currentPrice) {
          console.log(`⚠️ Could not get price for ${stock.ticker}`);
          continue;
        }
        
        console.log(`   Current Price: R$ ${currentPrice}`);
        
        // Buy Check
        if (stock.buyTarget && currentPrice <= stock.buyTarget) {
          console.log(`   🟢 BUY TARGET HIT!`);
          const msg = `🟢 *HORA DE COMPRAR — ${stock.ticker}*\nA ação atingiu o seu preço alvo de compra!\n\nAlvo: R$ ${stock.buyTarget.toFixed(2)}\nPreço atual: R$ ${currentPrice.toFixed(2)}`;
          await sendWhatsApp(msg);
        }
        
        // Sell Check
        if (stock.sellTarget && currentPrice >= stock.sellTarget) {
          console.log(`   🔴 SELL TARGET HIT!`);
          const msg = `🔴 *HORA DE VENDER — ${stock.ticker}*\nA ação atingiu o seu preço alvo de venda!\n\nAlvo: R$ ${stock.sellTarget.toFixed(2)}\nPreço atual: R$ ${currentPrice.toFixed(2)}`;
          await sendWhatsApp(msg);
        }
        
        // Add a small delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (err) {
        console.error(`❌ Error checking ${stock.ticker}:`, err.message);
      }
    }
    
    console.log('✅ Daily check completed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Global error:', err);
    process.exit(1);
  }
}

runDailyCheck();
