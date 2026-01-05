// advanced-ai.js - All advanced functions (unchanged core logic, works with mocks)

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
    const riskReward = `1:${(reward / risk).toFixed(2)}`;
    
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

async function runScanner() {
    const scanBtn = document.getElementById('scanBtn');
    scanBtn.disabled = true;
    
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
        
        await new Promise(r => setTimeout(r, 200));
    }
    
    results.sort((a, b) => b.score - a.score);
    
    let html = `
        <div class="alert alert-success" style="margin-top: 1rem;">
            Scanned ${results.length} symbols. Top opportunities ranked by AI score.
        </div>
        <table style="width: 100%; margin-top: 1rem; border-collapse: collapse;">
            <thead>
                <tr style="background: #1a1f2e;">
                    <th style="padding: 0.8rem; text-align: left;">Rank</th>
                    <th style="padding: 0.8rem; text-align: left;">Symbol</th>
                    <th style="padding: 0.8rem; text-align: left;">Price</th>
                    <th style="padding: 0.8rem; text-align: left;">Max Pain</th>
                    <th style="padding: 0.8rem; text-align: left;">Delta %</th>
                    <th style="padding: 0.8rem; text-align: left;">RSI</th>
                    <th style="padding: 0.8rem; text-align: left;">Direction</th>
                    <th style="padding: 0.8rem; text-align: left;">AI Score</th>
                </tr>
            </thead>
            <tbody>
                ${results.map((r, i) => `
                    <tr style="cursor: pointer; border-bottom: 1px solid #2a2f3a;" onclick="quickSearch('${r.sym}'); showTab('dashboard');">
                        <td style="padding: 0.8rem;"><strong>#${i + 1}</strong></td>
                        <td style="padding: 0.8rem;"><strong>${r.sym}</strong></td>
                        <td style="padding: 0.8rem;">$${r.price.toFixed(2)}</td>
                        <td style="padding: 0.8rem;">$${r.mp.toFixed(2)}</td>
                        <td style="padding: 0.8rem;" class="${r.delta >= 0 ? 'positive' : 'negative'}">${r.delta.toFixed(2)}%</td>
                        <td style="padding: 0.8rem;">${r.rsi.toFixed(1)}</td>
                        <td style="padding: 0.8rem;"><span class="badge badge-${r.direction === 'BULLISH' ? 'bull' : 'bear'}">${r.direction}</span></td>
                        <td style="padding: 0.8rem;" class="${r.score >= 75 ? 'positive' : 'neutral'}"><strong>${r.score}/100</strong></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div style="margin-top: 1rem; padding: 1rem; background: rgba(0, 255, 136, 0.05); border-radius: 10px;">
            Click any row to analyze that symbol in detail
        </div>
    `;
    
    document.getElementById('scannerResults').innerHTML = html;
    scanBtn.disabled = false;
}

async function analyzeFractals() {
    const sym = document.getElementById('fractalInput').value.trim().toUpperCase();
    if (!sym) return;
    
    document.getElementById('fractalResults').innerHTML = '<div class="loading"><div class="spinner"></div><div>Analyzing fractals...</div></div>';
    
    const res = await fetchPrice(sym);
    const prices = genPrices(res.price, 200);
    const fractals = findFractals(prices);
    const currentPattern = getCurrentPattern(prices);
    const matches = matchCurrentToHistorical(currentPattern, fractals);
    
    let html = `
        <div class="alert alert-success">Found ${fractals.length} historical fractal patterns for ${sym}</div>
        <div class="card">
            <div class="card-header">Best Matching Fractal</div>
            <div class="ai-insight">
                <div class="ai-header">Top Match</div>
                <div>
                    <strong>Similarity:</strong> ${matches[0]?.similarity.toFixed(0) || 0}% (from ${matches[0]?.daysAgo || 0} days ago)<br>
                    <strong>Historical Outcome:</strong> ${matches[0]?.outcome > 0 ? '+' : ''}${matches[0]?.outcome.toFixed(2) || 0}% over ${matches[0]?.duration || 0} days<br>
                    <strong>Predicted Move:</strong> ${matches[0]?.prediction > 0 ? 'UP' : 'DOWN'} ${Math.abs(matches[0]?.prediction || 0).toFixed(2)}% 
                    (${matches[0]?.confidence || 0}% confidence)
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('fractalResults').innerHTML = html;
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

function getCurrentPattern(prices) {
    return prices.slice(-10);
}

function matchCurrentToHistorical(current, fractals) {
    return fractals.map(f => {
        const similarity = calculateSimilarity(current, f.pattern);
        return { ...f, similarity, confidence: similarity };
    }).sort((a, b) => b.similarity - a.similarity);
}

function calculateSimilarity(p1, p2) {
    if (p1.length !== p2.length) return 0;
    const n1 = normalize(p1);
    const n2 = normalize(p2);
    let diff = 0;
    for (let i = 0; i < n1.length; i++) diff += Math.abs(n1[i] - n2[i]);
    return Math.max(0, (1 - diff / n1.length) * 100);
}

function normalize(arr) {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const range = max - min || 1;
    return arr.map(v => (v - min) / range);
}

async function advancedAnalysis() {
    const sym = document.getElementById('advSymInput').value.trim().toUpperCase();
    if (!sym) return;
    
    document.getElementById('advancedResults').innerHTML = '<div class="loading"><div class="spinner"></div><div>Deep analysis...</div></div>';
    
    const res = await fetchPrice(sym);
    const prices = genPrices(res.price, 100);
    
    const timeframes = {
        '5m': prices.slice(-20),
        '15m': prices.slice(-30),
        '1h': prices.slice(-40),
        '4h': prices.slice(-60),
        '1d': prices
    };
    
    let html = `
        <div class="alert alert-success">Deep Multi-Timeframe Analysis for ${sym}</div>
        <div class="card">
            <div class="card-header">RSI Across Timeframes</div>
            <div class="indicator-grid">
                ${Object.entries(timeframes).map(([tf, p]) => {
                    const rsi = calcRSI(p);
                    return `<div class="indicator-card">
                        <div class="indicator-header">${tf.toUpperCase()}</div>
                        <div class="indicator-value ${rsi.val < 30 ? 'positive' : rsi.val > 70 ? 'negative' : ''}">${rsi.val.toFixed(1)}</div>
                        <div>${rsi.sig}</div>
                    </div>`;
                }).join('')}
            </div>
        </div>
    `;
    
    document.getElementById('advancedResults').innerHTML = html;
}

let currentChart = null;

async function loadChart() {
    const sym = document.getElementById('chartInput').value.trim().toUpperCase();
    if (!sym) return;
    
    document.getElementById('chartResults').innerHTML = '<div class="loading"><div class="spinner"></div><div>Loading chart...</div></div>';
    
    const res = await fetchPrice(sym);
    const prices = genPrices(res.price, 60);
    const labels = Array.from({length: prices.length}, (_, i) => `Day ${i + 1}`);
    const mp = genMaxPain(res.price);
    const mpLine = Array(prices.length).fill(mp);
    
    const html = `
        <div class="alert alert-success">Interactive Chart for ${sym}</div>
        <div class="chart-container">
            <canvas id="priceChart"></canvas>
        </div>
    `;
    
    document.getElementById('chartResults').innerHTML = html;
    
    if (currentChart) currentChart.destroy();
    
    const ctx = document.getElementById('priceChart').getContext('2d');
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Price',
                data: prices,
                borderColor: '#00ff88',
                tension: 0.4,
                fill: true
            }, {
                label: 'Max Pain',
                data: mpLine,
                borderColor: '#ff3366',
                borderDash: [5, 5]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}
