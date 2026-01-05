// app.js - Everything else: mock data, AI analysis, all tab functions, main logic

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

    // Simulate small delay for realism
    await new Promise(r => setTimeout(r, 300 + Math.random() * 400));

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

function generateAIAnalysis(stockData, maxPain, rsi, macd, patterns, bb) {
    const price = stockData.price;
    const delta = (maxPain - price) / price;
    
    let score = 50;
    
    score += Math.min(Math.abs(delta) * 100, 25);
    
    if ((rsi.val < 30 && delta > 0) || (rsi.val > 70 && delta < 0)) score += 20;
    else if ((rsi.val < 40 && delta > 0) || (rsi.val > 60 && delta < 0)) score += 10;
    
    if ((macd.crossover === 'BULLISH' && delta > 0) || (macd.crossover === 'BEARISH' && delta < 0)) score += 15;
    
    const bullishPat = patterns.filter(p => p.type === 'bullish').length;
    const bearishPat = patterns.filter(p => p.type === 'bearish').length;
    score += Math.abs(bullishPat - bearishPat) * 5;
    
    if (bb.position === 'BELOW LOWER' && delta > 0) score += 10;
    if (bb.position === 'ABOVE UPPER' && delta < 0) score += 10;
    
    score = Math.min(Math.round(score), 100);
    
    let confidence = 60 + Math.abs(delta) * 80;
    if ((rsi.val < 30 && delta > 0) || (rsi.val > 70 && delta < 0)) confidence += 15;
    confidence += patterns.length * 5;
    confidence = Math.min(Math.round(confidence), 95);
    
    let quality = 'POOR';
    if (score >= 85) quality = 'EXCELLENT';
    else if (score >= 70) quality = 'GOOD';
    else if (score >= 55) quality = 'FAIR';
    
    const direction = delta > 0 ? 'BULLISH' : 'BEARISH';
    
    const entry = price;
    const target1 = price * (1 + delta * 0.5);
    const target2 = price * (1 + delta * 0.7);
    const target3 = price * (1 + delta * 0.9);
    const stop = price * (1 - Math.abs(delta) * 0.4);
    
    const risk = Math.abs(entry - stop);
    const reward = Math.abs(target2 - entry);
    const riskReward = reward > 0 ? `1:${(reward / risk).toFixed(2)}` : 'N/A';
    
    const reasons = [];
    reasons.push(`Max pain at $${maxPain.toFixed(2)} creates ${delta > 0 ? 'upward' : 'downward'} pressure (${(Math.abs(delta) * 100).toFixed(1)}% delta)`);
    if (rsi.val < 35) reasons.push(`RSI ${rsi.val.toFixed(0)} indicates oversold conditions`);
    if (rsi.val > 65) reasons.push(`RSI ${rsi.val.toFixed(0)} shows overbought territory`);
    if (macd.crossover !== 'NEUTRAL') reasons.push(`MACD ${macd.crossover.toLowerCase()} crossover confirms direction`);
    if (patterns.length > 0) reasons.push(`${patterns.length} technical pattern(s) detected supporting the move`);
    if (bb.position !== 'MIDDLE') reasons.push(`Price at ${bb.position.toLowerCase()} of Bollinger Bands`);
    
    return {
        score,
        confidence,
        quality,
        direction,
        entry,
        targets: [target1, target2, target3],
        stop,
        riskReward,
        reasoning: reasons.join('. ') + '.'
    };
}

function showTab(tab) {
    const tabs = ['dashboardTab', 'advancedTab', 'scannerTab', 'fractalsTab', 'chartsTab', 'cryptoTab', 'alertsTab'];
    tabs.forEach(t => document.getElementById(t)?.classList.add('hidden'));
    
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    const map = {
        'dashboard': 0, 'advanced': 1, 'scanner': 2, 'fractals': 3,
        'charts': 4, 'crypto': 5, 'alerts': 6
    };
    
    if (map[tab] !== undefined) {
        document.getElementById(tabs[map[tab]])?.classList.remove('hidden');
        document.querySelectorAll('.nav-btn')[map[tab]]?.classList.add('active');
    }
}

function quickSearch(sym) {
    document.getElementById('symInput').value = sym;
    search();
}

async function search() {
    const symInput = document.getElementById('symInput');
    if (!symInput) return;
    const sym = symInput.value.trim().toUpperCase();
    if (!sym) return;
    
    document.getElementById('errorBox').innerHTML = '';
    document.getElementById('resultsBox').innerHTML = '';
    document.getElementById('loadingBox')?.classList.remove('hidden');
    
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
            <div class="alert alert-success">Loaded ${res.sym} • Price: $${res.price.toFixed(2)} (+${res.pct.toFixed(2)}%) via ${res.src}</div>
            
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
                    <div class="stat-label">RSI (14)</div>
                    <div class="stat-value">${rsi.val.toFixed(1)}</div>
                    <div class="stat-change ${rsi.val < 30 ? 'positive' : rsi.val > 70 ? 'negative' : 'neutral'}">${rsi.sig}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">AI Score</div>
                    <div class="stat-value">${aiAnalysis.score}/100</div>
                    <div class="stat-change ${aiAnalysis.score >= 75 ? 'positive' : 'neutral'}">${aiAnalysis.quality}</div>
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
                    <div class="indicator-card"><div class="indicator-header">Bollinger Bands</div><div class="indicator-value">${bb.bandwidth}%</div><div>${bb.position}</div></div>
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
        console.error(e);
        document.getElementById('errorBox').innerHTML = `<div class="alert alert-error">Error: ${e.message || 'Unknown error'}</div>`;
    } finally {
        document.getElementById('loadingBox')?.classList.add('hidden');
    }
}

async function runScanner() {
    const scanBtn = document.getElementById('scanBtn');
    if (scanBtn) scanBtn.disabled = true;
    
    document.getElementById('scannerResults').innerHTML = '<div class="loading"><div class="spinner"></div><div>Scanning market...</div></div>';
    
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'GME', 'SPY', 'QQQ'];
    const results = [];
    
    for (const sym of symbols) {
        const res = await fetchPrice(sym);
        const prices = genPrices(res.price);
        const mp = genMaxPain(res.price, 1);
        const delta = ((mp - res.price) / res.price) * 100;
        const rsi = calcRSI(prices);
        const macd = calcMACD(prices);
        
        let score = 60 + Math.abs(delta) * 2;
        if ((rsi.val < 30 && delta > 0) || (rsi.val > 70 && delta < 0)) score += 15;
        if ((macd.crossover === 'BULLISH' && delta > 0) || (macd.crossover === 'BEARISH' && delta < 0)) score += 10;
        score = Math.min(Math.round(score), 100);
        
        results.push({
            sym, price: res.price, mp, delta, rsi: rsi.val, macd: macd.crossover, score,
            direction: delta > 0 ? 'BULLISH' : 'BEARISH'
        });
        
        await new Promise(r => setTimeout(r, 150));
    }
    
    results.sort((a, b) => b.score - a.score);
    
    let html = `
        <div class="alert alert-success">Scan complete — ${results.length} symbols analyzed</div>
        <table>
            <thead>
                <tr>
                    <th>Rank</th><th>Symbol</th><th>Price</th><th>Max Pain</th><th>Delta %</th><th>RSI</th><th>Direction</th><th>AI Score</th>
                </tr>
            </thead>
            <tbody>
                ${results.map((r, i) => `
                    <tr style="cursor:pointer;" onclick="quickSearch('${r.sym}'); showTab('dashboard');">
                        <td>#${i+1}</td>
                        <td><strong>${r.sym}</strong></td>
                        <td>$${r.price.toFixed(2)}</td>
                        <td>$${r.mp.toFixed(2)}</td>
                        <td class="${r.delta >= 0 ? 'positive' : 'negative'}">${r.delta.toFixed(2)}%</td>
                        <td>${r.rsi.toFixed(1)}</td>
                        <td><span class="badge badge-${r.direction === 'BULLISH' ? 'bull' : 'bear'}">${r.direction}</span></td>
                        <td class="${r.score >= 75 ? 'positive' : 'neutral'}"><strong>${r.score}</strong></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    document.getElementById('scannerResults').innerHTML = html;
    if (scanBtn) scanBtn.disabled = false;
}

async function advancedAnalysis() {
    const sym = document.getElementById('advSymInput')?.value.trim().toUpperCase();
    if (!sym) return;
    
    document.getElementById('advancedResults').innerHTML = '<div class="loading"><div class="spinner"></div><div>Running deep analysis...</div></div>';
    
    const res = await fetchPrice(sym);
    const prices = genPrices(res.price, 100);
    
    const timeframes = {
        '5m': prices.slice(-20),
        '15m': prices.slice(-35),
        '1h': prices.slice(-50),
        '4h': prices.slice(-70),
        '1d': prices
    };
    
    let html = `
        <div class="alert alert-success">Multi-Timeframe Analysis for ${sym}</div>
        <div class="card">
            <div class="card-header">RSI by Timeframe</div>
            <div class="indicator-grid">
                ${Object.entries(timeframes).map(([tf, p]) => {
                    const rsi = calcRSI(p);
                    return `
                        <div class="indicator-card">
                            <div class="indicator-header">${tf.toUpperCase()}</div>
                            <div class="indicator-value ${rsi.val < 30 ? 'positive' : rsi.val > 70 ? 'negative' : ''}">${rsi.val.toFixed(1)}</div>
                            <div>${rsi.sig}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">MACD by Timeframe</div>
            <div class="indicator-grid">
                ${Object.entries(timeframes).map(([tf, p]) => {
                    const macd = calcMACD(p);
                    return `
                        <div class="indicator-card">
                            <div class="indicator-header">${tf.toUpperCase()}</div>
                            <div class="indicator-value ${macd.histogram > 0 ? 'positive' : 'negative'}">${macd.macd}</div>
                            <div>${macd.crossover}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    document.getElementById('advancedResults').innerHTML = html;
}

function findFractals(prices) {
    const fractals = [];
    const patternLength = 10;
    for (let i = 0; i < prices.length - patternLength * 2; i += 5) {
        const pattern = prices.slice(i, i + patternLength);
        const outcome = ((prices[i + patternLength + 9] - pattern[pattern.length - 1]) / pattern[pattern.length - 1]) * 100;
        fractals.push({
            pattern,
            outcome,
            duration: 10,
            daysAgo: prices.length - i - patternLength
        });
    }
    return fractals;
}

function normalize(arr) {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const range = max - min || 1;
    return arr.map(v => (v - min) / range);
}

function calculateSimilarity(p1, p2) {
    if (p1.length !== p2.length) return 0;
    const n1 = normalize(p1);
    const n2 = normalize(p2);
    let diff = 0;
    for (let i = 0; i < n1.length; i++) diff += Math.abs(n1[i] - n2[i]);
    return Math.max(0, (1 - diff / n1.length) * 100);
}

async function analyzeFractals() {
    const sym = document.getElementById('fractalInput')?.value.trim().toUpperCase();
    if (!sym) return;
    
    document.getElementById('fractalResults').innerHTML = '<div class="loading"><div class="spinner"></div><div>Searching for fractals...</div></div>';
    
    const res = await fetchPrice(sym);
    const prices = genPrices(res.price, 200);
    const fractals = findFractals(prices);
    const currentPattern = prices.slice(-10);
    const matches = fractals.map(f => {
        const similarity = calculateSimilarity(currentPattern, f.pattern);
        return { ...f, similarity, prediction: f.outcome * (similarity / 100), confidence: Math.round(similarity) };
    }).sort((a, b) => b.similarity - a.similarity);
    
    const best = matches[0] || { similarity: 0, outcome: 0, daysAgo: 0, prediction: 0, confidence: 0 };
    
    let html = `
        <div class="alert alert-success">Fractal Analysis for ${sym} — Found ${fractals.length} historical patterns</div>
        <div class="ai-insight">
            <div class="ai-header">Best Matching Fractal</div>
            <div>
                Similarity: ${best.similarity.toFixed(0)}% (from ${best.daysAgo} days ago)<br>
                Historical outcome: ${best.outcome > 0 ? '+' : ''}${best.outcome.toFixed(1)}%<br>
                Predicted move: ${best.prediction > 0 ? 'UP' : 'DOWN'} ${Math.abs(best.prediction).toFixed(1)}% 
                (${best.confidence}% confidence)
            </div>
        </div>
    `;
    
    document.getElementById('fractalResults').innerHTML = html;
}

async function loadChart() {
    const sym = document.getElementById('chartInput')?.value.trim().toUpperCase();
    if (!sym) return;
    
    document.getElementById('chartResults').innerHTML = '<div class="loading"><div class="spinner"></div><div>Loading chart...</div></div>';
    
    const res = await fetchPrice(sym);
    const prices = genPrices(res.price, 60).reverse(); // Chronological order
    const labels = prices.map((_, i) => `Day ${i + 1}`);
    const mp = genMaxPain(res.price, 1);
    const mpLine = Array(prices.length).fill(mp);
    
    let html = `
        <div class="alert alert-success">Price Chart for ${sym}</div>
        <div class="chart-container">
            <canvas id="priceChart"></canvas>
        </div>
    `;
    
    document.getElementById('chartResults').innerHTML = html;
    
    if (currentChart) currentChart.destroy();
    
    const ctx = document.getElementById('priceChart')?.getContext('2d');
    if (!ctx) return;
    
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Price',
                    data: prices,
                    borderColor: '#00ff88',
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Max Pain',
                    data: mpLine,
                    borderColor: '#ff3366',
                    borderDash: [8, 4],
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#e8eaed' } } },
            scales: {
                y: { ticks: { color: '#a0a4a8' }, grid: { color: '#2a2f3a' } },
                x: { ticks: { color: '#a0a4a8' }, grid: { color: '#2a2f3a' } }
            }
        }
    });
}

async function searchCrypto() {
    const sym = document.getElementById('cryptoInput')?.value.trim().toUpperCase();
    if (!sym) return;
    
    document.getElementById('cryptoResults').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    const res = await fetchPrice(sym);
    const prices = genPrices(res.price, 120);
    
    const tfs = ['5m', '15m', '1h', '4h', '1d'];
    const slices = [20, 35, 50, 70, 120];
    let html = `
        <div class="alert alert-success">${sym} • Current: $${res.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
        <div class="card">
            <div class="card-header">Multi-Timeframe RSI</div>
            <div class="grid">
                ${tfs.map((tf, i) => {
                    const rsi = calcRSI(prices.slice(-slices[i]));
                    return `
                        <div class="stat">
                            <div class="stat-label">${tf.toUpperCase()}</div>
                            <div class="stat-value ${rsi.val < 30 ? 'positive' : rsi.val > 70 ? 'negative' : ''}">${rsi.val.toFixed(1)}</div>
                            <div class="stat-change">${rsi.sig}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    const oversoldCount = tfs.filter((_, i) => calcRSI(prices.slice(-slices[i])).val < 30).length;
    if (oversoldCount >= 3) {
        html += `
            <div class="ai-insight">
                <div class="ai-header">Strong Oversold Signal</div>
                <div>${oversoldCount} timeframes showing oversold RSI — high probability rebound</div>
            </div>
        `;
    }
    
    document.getElementById('cryptoResults').innerHTML = html;
}

function updateAlerts() {
    const countEl = document.getElementById('alertCount');
    if (countEl) countEl.textContent = `(${alerts.length})`;
    
    const listEl = document.getElementById('alertsList');
    if (!listEl) return;
    
    if (alerts.length === 0) {
        listEl.innerHTML = '<div style="text-align:center;padding:2rem;color:#a0a4a8;">No alerts yet</div>';
        return;
    }
    
    listEl.innerHTML = alerts.map(a => `
        <div class="alert alert-success" style="margin-bottom:1rem;">
            <strong>${a.sym}</strong> — ${a.msg}<br>
            <small>Confidence: ${a.conf}% • ${a.time}</small>
        </div>
    `).join('');
}

console.log('MaxPain Pro - FINAL FIXED VERSION (2 files only)');
