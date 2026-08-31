import { db } from '../services/firebase.js';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

const COLLECTION_NAME = 'portfolio';
const SIGNALS_COLLECTION = 'signals_history';

/**
 * Fetch all stocks from Firestore
 */
export async function getPortfolio() {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const stocks = [];
    querySnapshot.forEach((doc) => {
      stocks.push(doc.data());
    });
    return stocks;
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    return [];
  }
}

/**
 * Add a new stock with buy and sell targets
 */
export async function addStock(ticker, name = '', buyTarget = null, sellTarget = null) {
  const normalized = ticker.toUpperCase().trim();
  
  const parseTarget = (val) => {
    if (!val) return null;
    const clean = String(val).replace(',', '.');
    return isNaN(Number(clean)) ? null : Number(clean);
  };

  const newStock = {
    ticker: normalized,
    name,
    addedAt: Date.now(),
    buyTarget: parseTarget(buyTarget),
    sellTarget: parseTarget(sellTarget),
  };

  try {
    const setPromise = setDoc(doc(db, COLLECTION_NAME, normalized), newStock);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout: Verifique se o banco Firestore foi criado no console do Firebase.")), 4000)
    );
    await Promise.race([setPromise, timeoutPromise]);
    return newStock;
  } catch (err) {
    console.error("Firebase write error:", err);
    throw new Error("Erro ao salvar: Banco Firestore não criado ou sem permissão.");
  }
}

/**
 * Update stock targets
 */
export async function updateTargets(ticker, buyTarget, sellTarget) {
  const normalized = ticker.toUpperCase().trim();
  await setDoc(doc(db, COLLECTION_NAME, normalized), {
    buyTarget: buyTarget ? Number(buyTarget) : null,
    sellTarget: sellTarget ? Number(sellTarget) : null,
  }, { merge: true });
}

/**
 * Remove a stock from portfolio
 */
export async function removeStock(ticker) {
  await deleteDoc(doc(db, COLLECTION_NAME, ticker.toUpperCase().trim()));
}

// Signal history for tracking when alerts were sent (also in Firestore)
export async function getSignalHistory() {
  try {
    const querySnapshot = await getDocs(collection(db, SIGNALS_COLLECTION));
    const history = {};
    querySnapshot.forEach((doc) => {
      history[doc.id] = doc.data().entries || [];
    });
    return history;
  } catch (error) {
    console.error("Error fetching signal history:", error);
    return {};
  }
}

export async function recordSignal(ticker, signalType, price) {
  try {
    const history = await getSignalHistory();
    if (!history[ticker]) history[ticker] = [];
    
    history[ticker].unshift({
      signal: signalType,
      price,
      timestamp: Date.now(),
      date: new Date().toLocaleString('pt-BR'),
    });
    
    // Keep only last 20 per ticker
    history[ticker] = history[ticker].slice(0, 20);
    
    await setDoc(doc(db, SIGNALS_COLLECTION, ticker.toUpperCase().trim()), {
      entries: history[ticker]
    });
  } catch (error) {
    console.error("Error recording signal:", error);
  }
}

export async function getLastSignalTime(ticker, signalType) {
  const history = await getSignalHistory();
  const entries = (history[ticker] || []).filter(e => e.signal === signalType);
  return entries.length > 0 ? entries[0].timestamp : null;
}
