// MAIN APPLICATION LOGIC
const APIS = {
twelve: ‘c7ab348043d54432b00b5ebce7574a7c’,
finnhub: ‘d5cpoahr01qvl80loeo0d5cpoahr01qvl80loeog’,
polygon: ‘VxuN5ENI_BpLPIYAIy1P6i7gysU9SPca’,
alpha: ‘4WG2HRRESHMYFVNB’
};

let alerts = [];
let calls = { twelve: 0, finnhub: 0, polygon: 0, alpha: 0 };
let currentChart = null;

// TAB MANAGEMENT
function showTab(tab) {
[‘dashboardTab’, ‘advancedTab’, ‘scannerTab’, ‘fractalsTab’, ‘chartsTab’, ‘cryptoTab’, ‘alertsTab’].forEach(t => {
document.getElementById(t).classList.add(‘hidden’);
});

```
document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

const tabMap = {
    'dashboard': [0, 'dashboardTab'],
    'advanced': [1, 'advancedTab'],
    'scanner': [2, 'scannerTab'],
    'fractals': [3, 'fractalsTab'],
    'charts': [4, 'chartsTab'],
    'crypto': [5, 'cryptoTab'],
    'alerts': [6, 'alertsTab']
};

if (tabMap[tab]) {
    document.getElementById(tabMap[tab][1]).classList.remove('hidden');
    document.querySelectorAll('.nav-btn')[tabMap[tab][0]].classList.add('active');
}
```

}

// API FETCHING
async function fetchPrice(symbol) {
try {
const s = symbol.includes(’-USD’) ? symbol.replace(’-USD’, ‘/USD’) : symbol;
const r = await fetch(`https://api.twelvedata.com/quote?symbol=${s}&apikey=${APIS.twelve}`);
const d = await r.json();
if (d.price) {
calls.twelve++;
return {
ok: true, sym: symbol, price: +d.price, prev: +(d.previous_close || d.price),
chg: +(d.change || 0), pct: +(d.percent_change || 0), vol: +(d.volume || 0),
high: +(d.high || d.price), low: +(d.low || d.price), open: +(d.open || d.price),
src: ‘TwelveData’, num: calls.twelve
};
}
} catch (e) {}

```
try {
    const s = symbol.includes('-USD') ? `BINANCE:${symbol.replace('-USD', 'USDT')}` : symbol;
    const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${s}&token=${APIS.finnhub}`);
    const d = await r.json();
    if (d.c > 0) {
        calls.finnhub++;
        return {
            ok: true, sym: symbol, price: d.c, prev: d.pc, chg: d.d, pct: d.dp, vol: 0,
            high: d.h, low: d.l, open: d.o, src: 'Finnhub', num: calls.finnhub
        };
    }
} catch (e) {}

return { ok: false, err: 'All APIs failed' };
```

}

function quickSearch(sym) {
document.getElementById(‘symInput’).value = sym;
search();
}

async function search() {
const sym = document.getElementById(‘symInput’).value.trim().toUpperCase();
if (!sym) return;

```
document.getElementById('errorBox').innerHTML = '';
document.getElementById('resultsBox').innerHTML = '';
document.getElementById('loadingBox').classList.remove('hidden');

try {
    const res = await fetchPrice(sym);
    
    if (!res.ok) {
        document.getElementById('errorBox').innerHTML = `<div class="alert alert-error">ERROR: ${res.err}</div>`;
        document.getElementById('loadingBox').classList.add('hidden');
        return;
    }
    
    const prices = genPrices(res.price);
    const allExps = getExpirations();
    const maxPains = {};
    allExps.forEach(e => maxPains[e.val] = genMaxPain(res.price, e.weeks));
    
    const rsi = calcRSI(prices);
    const macd = calcMACD(prices);
    const bb = calcBollingerBands(prices);
    const patterns = detectPatterns(prices);
    const aiAnalysis = generateAIAnalysis(res, maxPains['1w'], rsi, macd, patterns, bb);
    
    const delta = ((maxPains['1w'] - res.price) / res.price) * 100;
    if (Math.abs(delta) > 3) {
        alerts.unshift({
            sym, msg: `Max pain ${Math.abs(delta).toFixed(2)}% ${delta > 0 ? 'above' : 'below'} price`,
            conf: aiAnalysis.confidence, time: new Date().toLocaleTimeString()
        });
        alerts = alerts.slice(0, 20);
        updateAlerts();
    }
    
    let html = `
        <div class="alert alert-success">SUCCESS: Loaded ${res.sym} via ${res.src} (Call #${res.num})</div>
        
        <div class="grid">
            <div class="stat">
                <div class="stat-label">Price</div>
                <div class="stat-value">$${res.price.toFixed(2)}</div>
                <div class="stat-change ${res.chg >= 0 ? 'positive' : 'negative'}">
                    ${res.chg >= 0 ? 'UP' : 'DOWN'} ${Math.abs(res.pct).toFixed(2)}%
                </div>
            </div>
            <div class="stat">
                <div class="stat-label">Max Pain (1W)</div>
                <div class="stat-value">$${maxPains['1w'].toFixed(2)}</div>
                <div class="stat-change ${maxPains['1w'] > res.price ? 'positive' : 'negative'}">
                    ${delta.toFixed(2)}% Delta
                </div>
            </div>
            <div class="stat">
                <div class="stat-label">RSI (14)</div>
                <div class="stat-value">${rsi.val.toFixed(1)}</div>
                <div class="stat-change ${rsi.val < 30 ? 'positive' : rsi.val > 70 ? 'negative' : 'neutral'}">${rsi.sig}</div>
            </div>
            <div class="stat">
                <div class="stat-label">AI Score</div>
                <div class="stat-value">${aiAnalysis.score}/100</div>
                <div class="stat-change ${aiAnalysis.score >= 75 ? 'positive' : aiAnalysis.score >= 50 ? 'neutral' : 'negative'}">
                    ${aiAnalysis.score >= 75 ? 'EXCELLENT' : aiAnalysis.score >= 50 ? 'GOOD' : 'FAIR'}
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">All Expirations - Max Pain Levels</div>
            <div class="tabs">
                ${allExps.map((e, i) => `
                    <button class="tab-btn ${i === 0 ? 'active' : ''}" onclick="switchExp('${e.val}', ${res.price})">
                        ${e.label}<br><small>$${maxPains[e.val].toFixed(2)}</small>
                    </button>
                `).join('')}
            </div>
        </div>
        
        <div class="ai-insight">
            <div class="ai-header">AI Comprehensive Analysis</div>
            <div class="ai-content">
                <strong>Trade Quality:</strong> ${aiAnalysis.quality}<br>
                <strong>Direction:</strong> <span class="${aiAnalysis.direction === 'BULLISH' ? 'positive' : 'negative'}">${aiAnalysis.direction}</span> 
                (Confidence: ${aiAnalysis.confidence}%)<br>
                <strong>Entry Zone:</strong> $${aiAnalysis.entry.toFixed(2)}<br>
                <strong>Targets:</strong> T1: $${aiAnalysis.targets[0].toFixed(2)} | 
                T2: $${aiAnalysis.targets[1].toFixed(2)} | 
                T3: $${aiAnalysis.targets[2].toFixed(2)}<br>
                <strong>Stop Loss:</strong> $${aiAnalysis.stop.toFixed(2)}<br>
                <strong>Risk/Reward:</strong> ${aiAnalysis.riskReward}<br><br>
                <strong>Analysis:</strong> ${aiAnalysis.reasoning}
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">Technical Indicators</div>
            <div class="indicator-grid">
                <div class="indicator-card">
                    <div class="indicator-header">RSI (14)</div>
                    <div class="indicator-value ${rsi.val < 30 ? 'positive' : rsi.val > 70 ? 'negative' : 'neutral'}">${rsi.val.toFixed(1)}</div>
                    <div class="indicator-signal">${rsi.sig}</div>
                </div>
                <div class="indicator-card">
                    <div class="indicator-header">MACD</div>
                    <div class="indicator-value ${macd.histogram > 0 ? 'positive' : 'negative'}">${macd.macd.toFixed(4)}</div>
                    <div class="indicator-signal">${macd.crossover}</div>
                </div>
                <div class="indicator-card">
                    <div class="indicator-header">Bollinger Bands</div>
                    <div class="indicator-value">${bb.bandwidth.toFixed(2)}%</div>
                    <div class="indicator-signal">${bb.position}</div>
                </div>
                <div class="indicator-card">
                    <div class="indicator-header">Volume</div>
                    <div class="indicator-value">${res.vol > 0 ? (res.vol / 1000000).toFixed(2) + 'M' : 'N/A'}</div>
                    <div class="indicator-signal">24H Volume</div>
                </div>
            </div>
        </div>
    `;
    
    if (patterns.length > 0) {
        html += `
            <div class="card">
                <div class="card-header">Detected Patterns</div>
                ${patterns.map(p => `
                    <div style="background: #1a1f2e; padding: 1rem; border-radius: 10px; margin-bottom: 1rem; border: 1px solid #2a2f3a;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <strong>${p.name}</strong>
                            <span class="badge badge-${p.type === 'bullish' ? 'bull' : 'bear'}">${p.type}</span>
                        </div>
                        <div style="font-size: 1.4rem; font-weight: 700; color: #00ff88; margin: 0.5rem 0;">
                            ${p.conf.toFixed(0)}% Confidence
                        </div>
                        <div style="font-size: 0.9rem; color: #a0a4a8;">
                            ${p.desc || ''}<br>
                            Target: $${p.target.toFixed(2)} | Stop: $${p.stop.toFixed(2)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    document.getElementById('resultsBox').innerHTML = html;
    
} catch (e) {
    document.getElementById('errorBox').innerHTML = `<div class="alert alert-error">ERROR: ${e.message}</div>`;
} finally {
    document.getElementById('loadingBox').classList.add('hidden');
}
```

}

function switchExp(exp, curPrice) {
document.querySelectorAll(’.tab-btn’).forEach(btn => btn.classList.remove(‘active’));
event.target.closest(’.tab-btn’).classList.add(‘active’);
}

async function searchCrypto() {
const sym = document.getElementById(‘cryptoInput’).value.trim().toUpperCase();
if (!sym) return;

```
document.getElementById('cryptoResults').innerHTML = '<div class="loading"><div class="spinner"></div></div>';

try {
    const res = await fetchPrice(sym);
    
    if (!res.ok) {
        document.getElementById('cryptoResults').innerHTML = `<div class="alert alert-error">ERROR: ${res.err}</div>`;
        return;
    }
    
    const prices = genPrices(res.price, 100);
    const timeframes = ['5m', '15m', '1h', '4h', '1d'];
    const rsiData = {};
    
    timeframes.forEach((tf, i) => {
        const slice = prices.slice(-(20 + i * 10));
        rsiData[tf] = calcRSI(slice);
    });
    
    let html = `
        <div class="alert alert-success">SUCCESS: Loaded ${res.sym} via ${res.src}</div>
        
        <div class="grid">
            <div class="stat">
                <div class="stat-label">Price</div>
                <div class="stat-value">$${res.price.toLocaleString()}</div>
                <div class="stat-change ${res.chg >= 0 ? 'positive' : 'negative'}">
                    ${res.chg >= 0 ? 'UP' : 'DOWN'} ${Math.abs(res.pct).toFixed(2)}%
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">Multi-Timeframe RSI Analysis</div>
            <div class="grid">
                ${timeframes.map(tf => {
                    const rsi = rsiData[tf];
                    return `
                        <div class="stat">
                            <div class="stat-label">${tf.toUpperCase()}</div>
                            <div class="stat-value ${rsi.val < 30 ? 'positive' : rsi.val > 70 ? 'negative' : 'neutral'}">${rsi.val.toFixed(1)}</div>
                            <div class="stat-change">${rsi.sig}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    const alignedSignals = timeframes.filter(tf => rsiData[tf].val < 30).length;
    if (alignedSignals >= 3) {
        html += `
            <div class="ai-insight">
                <div class="ai-header">Strong Signal Detected!</div>
                <div class="ai-content">
                    ${alignedSignals} timeframes showing oversold conditions. This is a strong buy signal when multiple timeframes align.
                </div>
            </div>
        `;
    }
    
    document.getElementById('cryptoResults').innerHTML = html;
    
} catch (e) {
    document.getElementById('cryptoResults').innerHTML = `<div class="alert alert-error">ERROR: ${e.message}</div>`;
}
```

}

function updateAlerts() {
document.getElementById(‘alertCount’).textContent = `(${alerts.length})`;

```
if (alerts.length === 0) {
    document.getElementById('alertsList').innerHTML = '<div style="text-align: center; padding: 2rem; color: #a0a4a8;">No alerts yet</div>';
    return;
}

let html = '';
for (const alert of alerts) {
    html += `
        <div class="alert alert-success" style="margin-bottom: 1rem;">
            <div>
                <strong>${alert.sym}</strong> - ${alert.msg}
                <div style="font-size: 0.85rem; color: #a0a4a8; margin-top: 0.5rem;">
                    Confidence: ${alert.conf}% • ${alert.time}
                </div>
            </div>
        </div>
    `;
}
document.getElementById('alertsList').innerHTML = html;
```

}

console.log(‘MaxPain Pro Ultimate loaded successfully’);
