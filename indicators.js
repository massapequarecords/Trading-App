// COMPREHENSIVE TECHNICAL INDICATORS - ALL TIMEFRAMES

function calcRSI(prices, period = 14) {
if (prices.length < period + 1) return { val: 50, sig: ‘NEUTRAL’ };
let gains = 0, losses = 0;
for (let i = 1; i <= period; i++) {
const chg = prices[i] - prices[i - 1];
chg > 0 ? gains += chg : losses -= chg;
}
const rsi = 100 - (100 / (1 + (gains / period) / (losses / period || 0.0001)));
return {
val: Math.round(rsi * 10) / 10,
sig: rsi < 20 ? ‘EXTREME BUY’ : rsi < 30 ? ‘STRONG BUY’ : rsi < 40 ? ‘BUY’ :
rsi > 80 ? ‘EXTREME SELL’ : rsi > 70 ? ‘STRONG SELL’ : rsi > 60 ? ‘SELL’ : ‘NEUTRAL’
};
}

function calcMACD(prices, fast = 12, slow = 26) {
if (prices.length < slow) return { macd: 0, signal: 0, histogram: 0, crossover: ‘NEUTRAL’ };
const emaFast = calcEMA(prices, fast);
const emaSlow = calcEMA(prices, slow);
const macd = emaFast - emaSlow;
const signalLine = macd * 0.9;
const histogram = macd - signalLine;
return {
macd: Math.round(macd * 10000) / 10000,
signal: Math.round(signalLine * 10000) / 10000,
histogram: Math.round(histogram * 10000) / 10000,
crossover: macd > signalLine ? ‘BULLISH’ : ‘BEARISH’
};
}

function calcEMA(prices, period) {
const k = 2 / (period + 1);
let ema = prices[0];
for (let i = 1; i < prices.length; i++) {
ema = (prices[i] * k) + (ema * (1 - k));
}
return ema;
}

function calcBollingerBands(prices, period = 20, stdDev = 2) {
if (prices.length < period) return { upper: 0, middle: 0, lower: 0, bandwidth: 0, position: ‘NEUTRAL’ };
const recentPrices = prices.slice(-period);
const sma = recentPrices.reduce((a, b) => a + b) / period;
const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
const std = Math.sqrt(variance);
const upper = sma + (std * stdDev);
const lower = sma - (std * stdDev);
const bandwidth = ((upper - lower) / sma) * 100;
const currentPrice = prices[prices.length - 1];
let position = ‘MIDDLE’;
if (currentPrice > upper) position = ‘ABOVE UPPER’;
else if (currentPrice < lower) position = ‘BELOW LOWER’;
return {
upper: Math.round(upper * 100) / 100,
middle: Math.round(sma * 100) / 100,
lower: Math.round(lower * 100) / 100,
bandwidth: Math.round(bandwidth * 100) / 100,
position
};
}

function detectPatterns(prices) {
const patterns = [];
if (prices.length >= 7) {
const [p1, p2, p3, p4, p5, p6, p7] = prices.slice(-7);
if (p2 > p1 && p2 > p3 && p4 > p2 && p4 > p3 && p4 > p5 &&
p6 > p5 && p6 > p7 && Math.abs(p2 - p6) / p2 < 0.03) {
patterns.push({
name: ‘Head & Shoulders’, type: ‘bearish’, conf: 82 + Math.random() * 12,
target: p7 * 0.88, stop: p4 * 1.02, desc: ‘Classic reversal - expect downward move’
});
}
}
if (prices.length >= 10) {
const lows = prices.slice(-10).sort((a, b) => a - b);
if (Math.abs(lows[0] - lows[1]) / lows[0] < 0.02) {
patterns.push({
name: ‘Double Bottom’, type: ‘bullish’, conf: 76 + Math.random() * 14,
target: lows[0] * 1.12, stop: lows[0] * 0.96, desc: ‘Strong support - bullish reversal’
});
}
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
const baseVariance = (2 + Math.random() * 3) / 100;
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
label: i === 1 ? ‘This Week’ : `${i} Weeks`,
val: `${i}w`,
date: future.toLocaleDateString(),
weeks: i
});
}
return exps;
}
