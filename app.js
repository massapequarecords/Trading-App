// app.js - Main app with full mocked data and complete dashboard HTML

let alerts = [];
let currentChart = null;

async function fetchPrice(symbol) {
    const basePrices = {
        'AAPL': 225 + Math.random() * 25,
        'MSFT': 415 + Math.random() * 25,
        'GOOGL': 170 + Math.random() * 20,
        'AMZN': 185 + Math.random() * 20,
        'TSLA': 230 + Math.random() * 50,
        'NVDA': 120 + Math.random() * 25,
        'META': 510 + Math.random() * 30,
        'GME': 25 + Math.random() * 15,
        'SPY': 530 + Math.random() * 20,
        'QQQ': 460 + Math.random() * 20,
        'BTC-USD': 65000 + Math.random() * 15000,
        'ETH-USD': 3500 + Math.random() * 1000,
    };

    let price = basePrices[symbol] || (100 + Math.random() * 600);
    price = Math.round(price * 100) / 100;

    const prev = Math.round(price * (0.95 + Math.random() * 0.1) * 100) / 100;
    const pct = ((price - prev) / prev) * 100;

    await new Promise(r => setTimeout(r, 500));

    return {
        ok: true,
        sym: symbol,
        price,
        prev,
        chg: price - prev,
        pct,
        vol: Math.floor(5000000 + Math.random() * 100000000),
        src: 'Mock Data Engine',
        num: Math.floor(Math.random() * 500)
    };
}

function showTab(tab) {
    const tabs = ['dashboardTab', 'advancedTab', 'scannerTab', 'fractalsTab', 'chartsTab', 'cryptoTab', 'alertsTab'];
    tabs.forEach(t => document.getElementById(t).classList.add('hidden'));
    
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    const map = {
        'dashboard': 0, 'advanced': 1, 'scanner': 2, 'fractals': 3,
        'charts': 4, 'crypto': 5, 'alerts': 6
    };
    
    if (map[tab] !== undefined) {
        document.getElementById(tabs[map[tab]]).classList.remove('hidden');
        document.querySelectorAll('.nav-btn')[map[tab]].classList.add('active');
    }
}

function quickSearch(sym) {
    document.getElementById('symInput').value = sym;
    search();
}

async function search() {
    const sym = document.getElementById('symInput').value.trim().toUpperCase();
    if (!sym) return;
    
    document.getElementById('errorBox').innerHTML = '';
    document.getElementById('resultsBox').innerHTML = '';
    document.getElementById('loadingBox').classList.remove('hidden');
    
    try {
        const res = await fetchPrice(sym);
        
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
                sym,
                msg: `Max pain ${Math.abs(delta).toFixed(2)}% ${delta > 0 ? 'above' : 'below'} price`,
                conf: aiAnalysis.confidence,
                time: new Date().toLocaleTimeString()
            });
            alerts = alerts.slice(0, 20);
            updateAlerts();
        }
        
        let html = `
            <div class="alert alert-success">Loaded ${res.sym} • Price: $${res.price.toFixed(2)} via ${res.src}</div>
            
            <div class="grid">
                <div class="stat">
                    <div class="stat-label">Current Price</div>
                    <div class="stat-value">$${res.price.toFixed(2)}</div>
                    <div class="stat-change ${res.pct >= 0 ? 'positive' : 'negative'}">${res.pct >= 0 ? '+' : ''}${res.pct.toFixed(2)}%</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Max Pain (1W)</div>
                    <div class="stat-value">$${maxPains['1w'].toFixed(2)}</div>
                    <div class="stat-change ${delta >= 0 ? 'positive' : 'negative'}">${delta.toFixed(2)}% Delta</div>
                </div>
                <div class="stat">
                    <div class="stat-label">RSI</div>
                    <div class="stat-value">${rsi.val.toFixed(1)}</div>
                    <div class="stat-change ${rsi.val < 30 ? 'positive' : rsi.val > 70 ? 'negative' : 'neutral'}">${rsi.sig}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">AI Score</div>
                    <div class="stat-value">${aiAnalysis.score}/100</div>
                    <div class="stat-change ${aiAnalysis.score >= 75 ? 'positive' : 'neutral'}">${aiAnalysis.quality}</div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">Max Pain by Expiration</div>
                <div class="tabs">
                    ${allExps.map((e, i) => `
                        <button class="tab-btn ${i === 0 ? 'active' : ''}">${e.label}<br><small>$${maxPains[e.val].toFixed(2)}</small></button>
                    `).join('')}
                </div>
            </div>
            
            <div class="ai-insight">
                <div class="ai-header">AI Trade Recommendation</div>
                <div>
                    <strong>Quality:</strong> ${aiAnalysis.quality}<br>
                    <strong>Direction:</strong> <span class="${aiAnalysis.direction === 'BULLISH' ? 'positive' : 'negative'}">${aiAnalysis.direction}</span> 
                    (${aiAnalysis.confidence}% confidence)<br><br>
                    <strong>Entry:</strong> $${aiAnalysis.entry.toFixed(2)}<br>
                    <strong>Targets:</strong> $${aiAnalysis.targets[0].toFixed(2)} • $${aiAnalysis.targets[1].toFixed(2)} • $${aiAnalysis.targets[2].toFixed(2)}<br>
                    <strong>Stop Loss:</strong> $${aiAnalysis.stop.toFixed(2)}<br>
                    <strong>Risk/Reward:</strong> ${aiAnalysis.riskReward}<br><br>
                    <strong>Reasoning:</strong> ${aiAnalysis.reasoning}
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">Key Indicators</div>
                <div class="indicator-grid">
                    <div class="indicator-card"><div class="indicator-header">RSI</div><div class="indicator-value">${rsi.val.toFixed(1)}</div><div>${rsi.sig}</div></div>
                    <div class="indicator-card"><div class="indicator-header">MACD</div><div class="indicator-value">${macd.macd}</div><div>${macd.crossover}</div></div>
                    <div class="indicator-card"><div class="indicator-header">Bollinger</div><div class="indicator-value">${bb.bandwidth}%</div><div>${bb.position}</div></div>
                    <div class="indicator-card"><div class="indicator-header">Volume</div><div class="indicator-value">${(res.vol / 1000000).toFixed(1)}M</div></div>
                </div>
            </div>
        `;
        
        if (patterns.length > 0) {
            html += `
                <div class="card">
                    <div class="card-header">Detected Patterns (${patterns.length})</div>
                    ${patterns.map(p => `
                        <div style="background:#1a1f2e;padding:1rem;border-radius:10px;margin-bottom:1rem;">
                            <strong>${p.name}</strong> — <span class="badge badge-${p.type === 'bullish' ? 'bull' : 'bear'}">${p.type.toUpperCase()}</span><br>
                            Confidence: ${p.conf.toFixed(0)}%<br>
                            ${p.desc}<br>
                            Target: $${p.target.toFixed(2)} | Stop: $${p.stop.toFixed(2)}
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        document.getElementById('resultsBox').innerHTML = html;
        
    } catch (e) {
        document.getElementById('errorBox').innerHTML = `<div class="alert alert-error">Error: ${e.message}</div>`;
    } finally {
        document.getElementById('loadingBox').classList.add('hidden');
    }
}

async function searchCrypto() {
    const sym = document.getElementById('cryptoInput').value.trim().toUpperCase();
    if (!sym) return;
    
    document.getElementById('cryptoResults').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    const res = await fetchPrice(sym);
    const prices = genPrices(res.price, 100);
    
    const tfs = ['5m', '15m', '1h', '4h', '1d'];
    const rsiData = tfs.map((tf, i) => calcRSI(prices.slice(-(20 + i*15))));
    
    let html = `
        <div class="alert alert-success">${sym} • $${res.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
        <div class="card">
            <div class="card-header">Multi-Timeframe RSI</div>
            <div class="grid">
                ${tfs.map((tf, i) => {
                    const r = rsiData[i];
                    return `<div class="stat">
                        <div class="stat-label">${tf.toUpperCase()}</div>
                        <div class="stat-value ${r.val < 30 ? 'positive' : r.val > 70 ? 'negative' : ''}">${r.val.toFixed(1)}</div>
                        <div class="stat-change">${r.sig}</div>
                    </div>`;
                }).join('')}
            </div>
        </div>
    `;
    
    document.getElementById('cryptoResults').innerHTML = html;
}

function updateAlerts() {
    document.getElementById('alertCount').textContent = `(${alerts.length})`;
    if (alerts.length === 0) {
        document.getElementById('alertsList').innerHTML = '<div style="text-align:center;padding:2rem;color:#a0a4a8;">No alerts yet</div>';
        return;
    }
    
    document.getElementById('alertsList').innerHTML = alerts.map(a => `
        <div class="alert alert-success">
            <strong>${a.sym}</strong> — ${a.msg}<br>
            <small>Confidence: ${a.conf}% • ${a.time}</small>
        </div>
    `).join('');
}

console.log('MaxPain Pro - Final Fixed Version Loaded');
