/**
 * Fundamental analysis service
 * Uses data already fetched from brapi.dev (quote with fundamental=true)
 * Identifies red flags that explain WHY a stock may be technically cheap
 * but fundamentally broken.
 */

/**
 * Analyze the fundamental health of a company from its quote data.
 * Returns a score (0-100), list of flags, and overall rating.
 *
 * @param {Object} quote - brapi.dev quote result (with fundamental=true)
 * @returns {{ score: number, flags: Array, rating: string, summary: string }}
 */
export function analyzeFundamentals(quote) {
  if (!quote) {
    return { score: 50, flags: [], rating: 'unknown', summary: 'Dados fundamentalistas não disponíveis.' };
  }

  const flags = [];
  let deductions = 0;

  // ── Extract available fields ─────────────────────────────────────────
  const roe    = quote.returnOnEquity;          // % (e.g. 12.5 = 12.5%)
  const pl     = quote.priceEarnings;           // P/E ratio (negative = losses)
  const pvp    = quote.priceToBook;             // P/Book (negative = negative equity)
  const dy     = quote.dividendYield;           // % dividend yield
  const eps    = quote.earningsPerShare;        // LPA — earnings per share
  const ebitda = quote.ebitda;                  // raw EBITDA value

  // ── ROE (Return on Equity) ───────────────────────────────────────────
  if (roe !== null && roe !== undefined) {
    if (roe < -10) {
      flags.push({
        severity: 'danger',
        icon: '🔴',
        label: 'ROE fortemente negativo',
        detail: `ROE: ${roe.toFixed(1)}% — empresa destruindo valor do acionista`,
        field: 'ROE',
        value: `${roe.toFixed(1)}%`,
      });
      deductions += 35;
    } else if (roe < 0) {
      flags.push({
        severity: 'danger',
        icon: '🔴',
        label: 'ROE negativo',
        detail: `ROE: ${roe.toFixed(1)}% — empresa gerando prejuízo sobre patrimônio`,
        field: 'ROE',
        value: `${roe.toFixed(1)}%`,
      });
      deductions += 25;
    } else if (roe < 5) {
      flags.push({
        severity: 'warning',
        icon: '🟡',
        label: 'ROE muito baixo',
        detail: `ROE: ${roe.toFixed(1)}% — retorno fraco; abaixo da renda fixa`,
        field: 'ROE',
        value: `${roe.toFixed(1)}%`,
      });
      deductions += 10;
    }
  }

  // ── P/L (Price/Earnings) ─────────────────────────────────────────────
  if (pl !== null && pl !== undefined) {
    if (pl < 0) {
      flags.push({
        severity: 'danger',
        icon: '🔴',
        label: 'Empresa com prejuízo',
        detail: `P/L: ${pl.toFixed(1)} — preço baseado em expectativa futura, não em lucro atual`,
        field: 'P/L',
        value: pl.toFixed(1),
      });
      deductions += 20;
    } else if (pl > 40) {
      flags.push({
        severity: 'warning',
        icon: '🟡',
        label: 'P/L elevado',
        detail: `P/L: ${pl.toFixed(1)} — ação cara para os lucros gerados`,
        field: 'P/L',
        value: pl.toFixed(1),
      });
      deductions += 8;
    }
  }

  // ── P/VP (Price/Book Value) ──────────────────────────────────────────
  if (pvp !== null && pvp !== undefined) {
    if (pvp < 0) {
      flags.push({
        severity: 'danger',
        icon: '🔴',
        label: 'Patrimônio negativo (endividamento crítico)',
        detail: `P/VP: ${pvp.toFixed(2)} — passivo maior que ativo; risco real de insolvência`,
        field: 'P/VP',
        value: pvp.toFixed(2),
      });
      deductions += 40;
    } else if (pvp < 0.3 && pvp > 0) {
      flags.push({
        severity: 'warning',
        icon: '🟡',
        label: 'P/VP muito baixo (possível armadilha)',
        detail: `P/VP: ${pvp.toFixed(2)} — pode indicar empresa problemática ou setor em crise`,
        field: 'P/VP',
        value: pvp.toFixed(2),
      });
      deductions += 10;
    }
  }

  // ── EPS (Earnings Per Share / LPA) ────────────────────────────────────
  if (eps !== null && eps !== undefined && eps < 0 && !flags.find(f => f.field === 'P/L')) {
    flags.push({
      severity: 'warning',
      icon: '🟡',
      label: 'LPA negativo',
      detail: `LPA: R$ ${eps.toFixed(2)} — empresa reportou prejuízo por ação`,
      field: 'LPA',
      value: `R$ ${eps.toFixed(2)}`,
    });
    deductions += 15;
  }

  // ── Dividends context ─────────────────────────────────────────────────
  // Not a red flag by itself, but context. High DY can sometimes mean price dropped a lot.
  // No flag for this — just informational.

  // ── Calculate final score ─────────────────────────────────────────────
  const score = Math.max(0, 100 - deductions);

  let rating, ratingLabel, ratingColor;
  const dangerCount = flags.filter(f => f.severity === 'danger').length;
  const warnCount   = flags.filter(f => f.severity === 'warning').length;

  if (dangerCount >= 2) {
    rating = 'critical';
    ratingLabel = '🔴 Empresa com problemas sérios';
    ratingColor = '#ff3d71';
  } else if (dangerCount === 1) {
    rating = 'danger';
    ratingLabel = '🔴 Risco fundamentalista alto';
    ratingColor = '#ff3d71';
  } else if (warnCount >= 2) {
    rating = 'weak';
    ratingLabel = '🟡 Fundamentos fracos';
    ratingColor = '#ffcc02';
  } else if (warnCount === 1) {
    rating = 'moderate';
    ratingLabel = '🟡 Fundamentos moderados';
    ratingColor = '#ffcc02';
  } else if (flags.length === 0 && (roe !== null || pl !== null)) {
    rating = 'healthy';
    ratingLabel = '🟢 Fundamentos saudáveis';
    ratingColor = '#00e676';
  } else {
    rating = 'unknown';
    ratingLabel = '⚪ Sem dados suficientes';
    ratingColor = 'var(--text-muted)';
  }

  // Build one-line summary
  const summaryParts = [];
  if (roe !== null && roe !== undefined)  summaryParts.push(`ROE ${roe.toFixed(1)}%`);
  if (pl  !== null && pl  !== undefined)  summaryParts.push(`P/L ${pl.toFixed(1)}`);
  if (pvp !== null && pvp !== undefined)  summaryParts.push(`P/VP ${pvp.toFixed(2)}`);
  if (dy  !== null && dy  !== undefined)  summaryParts.push(`DY ${dy.toFixed(1)}%`);

  return {
    score,
    flags,
    rating,
    ratingLabel,
    ratingColor,
    summary: summaryParts.join(' · ') || 'Dados indisponíveis',
    raw: { roe, pl, pvp, dy, eps },
  };
}

/**
 * Should we suppress this stock from the buy list due to fundamental danger?
 * Returns true if the stock is fundamentally broken (not just weak).
 */
export function isFundamentallyBroken(fundamentals) {
  if (!fundamentals) return false;
  return fundamentals.rating === 'critical' || fundamentals.rating === 'danger';
}

/**
 * Penalty to apply to the opportunity score based on fundamental health
 * Ranges from 0 (healthy) to 40 (broken)
 */
export function getFundamentalPenalty(fundamentals) {
  if (!fundamentals) return 0;
  const map = { critical: 45, danger: 30, weak: 15, moderate: 5, healthy: 0, unknown: 0 };
  return map[fundamentals.rating] || 0;
}
