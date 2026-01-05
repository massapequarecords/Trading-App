// indicators.js - Pure indicators and generators (no dependencies on app functions)

function calcRSI(prices, period = 14) {
    if (prices.length < period + 1) return { val: 50, sig: 'NEUTRAL' };
    let gains = 0, losses = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
        const chg = prices[i] - prices[i - 1];
        if (chg > 0) gains += chg;
        else losses += Math.abs(chg);
    }
    const avgGain = gains / period;
    const avgLoss = losses / period || 0.0001;
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    return {
        val: Math.round(rsi * 10) / 10,
        sig: rsi < 20 ? 'EXTREME BUY' : rsi < 30 ? 'STRONG BUY' : rsi < 40 ? 'BUY' : 
             rsi > 80 ? 'EXTREME SELL' : rsi > 70 ? 'STRONG SELL' : rsi > 60 ? 'SELL' : 'NEUTRAL'
    };
}

function calcEMA(prices, period) {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < prices.length; i++) {
        ema = (prices[i] - ema) * multiplier + ema;
    }
    return ema;
}

function calcMACD(prices, fast = 12, slow = 26) {
    if (prices.length < slow) return { macd: 0, histogram: 0, crossover: 'NEUTRAL' };
    const emaFast = calcEMA(prices, fast);
    const emaSlow = calcEMA(prices, slow);
    const macdLine = emaFast - emaSlow;
    const crossover = macdLine > 0 ? 'BULLISH' : macdLine < 0 ? 'BEARISH' : 'NEUTRAL';
    return {
        macd: macdLine.toFixed(4),
        histogram: macdLine,
        crossover
    };
}

function calcBollingerBands(prices, period = 20, stdDev = 2) {
    if (prices.length < period) return { upper: 0, middle: 0, lower: 0, bandwidth: 0, position: 'NEUTRAL' };
    const recent = prices.slice(-period);
    const sma = recent.reduce((a, b) => a + b, 0) / period;
    const variance = recent.reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period;
    const std = Math.sqrt(variance);
    const upper = sma + (std * stdDev);
    const lower = sma - (std * stdDev);
    const bandwidth = ((upper - lower) / sma) * 100;
    const current = prices[prices.length - 1];
    let position = 'MIDDLE';
    if (current > upper) position = 'ABOVE UPPER';
    else if (current < lower) position = 'BELOW LOWER';
    return {
        upper: upper.toFixed(2),
        middle: sma.toFixed(2),
        lower: lower.toFixed(2),
        bandwidth: bandwidth.toFixed(2),
        position
    };
}

function detectPatterns(prices) {
    const patterns = [];
    const len = prices.length;
    if (len < 10) return patterns;

    const recent = prices.slice(-7);
    if (recent.length === 7) {
        const [p1, p2, p3, p4, p5, p6, p7] = recent;
        if (p2 > p1 && p2 > p3 && p4 > p2 && p4 > p5 && p6 > p5 && Math.abs(p2 - p6) / p2 < 0.08) {
            patterns.push({
                name: 'Head & Shoulders',
                type: 'bearish',
                conf: 80 + Math.random() * 15,
                target: p7 * 0.85,
                stop: p4 * 1.03,
                desc: 'Classic bearish reversal pattern'
            });
        }
    }

    const lows = prices.slice(-15).sort((a, b) => a - b);
    if (lows.length >= 2 && Math.abs(lows[0] - lows[1]) / lows[0] < 0.04) {
        patterns.push({
            name: 'Double Bottom',
            type: 'bullish',
            conf: 75 + Math.random() * 20,
            target: lows[0] * 1.15,
            stop: lows[0] * 0.95,
            desc: 'Strong bullish reversal'
        });
    }

    if (prices[len-1] > prices[len-5] && prices[len-5] > prices[len-10]) {
        patterns.push({
            name: 'Uptrend Continuation',
            type: 'bullish',
            conf: 70 + Math.random() * 15,
            target: prices[len-1] * 1.08,
            stop: prices[len-1] * 0.95,
            desc: 'Higher highs confirming bullish momentum'
        });
    }

    return patterns;
}

function genPrices(currentPrice, count = 50, volatility = 0.05) {
    const prices = [currentPrice];
    for (let i = 1; i < count; i++) {
        const change = (Math.random() - 0.5) * volatility * 2;
        prices.unshift(prices[0] * (1 + change));
    }
    return prices;
}

function genMaxPain(price, weeksOut = 1) {
    const baseVariance = (2 + Math.random() * 4) / 100;
    const weekFactor = Math.max(0.3, 1 - (weeksOut * 0.08));
    const variance = baseVariance * weekFactor;
    const direction = Math.random() > 0.5 ? 1 : -1;
    return Math.round(price * (1 + (variance * direction)) * 100) / 100;
}

function getExpirations() {
    const exps = [];
    const now = new Date();
    for (let i = 1; i <= 12; i++) {
        const future = new Date(now);
        future.setDate(now.getDate() + (i * 7));
        exps.push({
            label: i === 1 ? 'This Week' : `${i} Weeks`,
            val: `${i}w`,
            date: future.toLocaleDateString(),
            weeks: i
        });
    }
    return exps;
}
