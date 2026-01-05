// ADVANCED AI ANALYSIS ENGINE

function generateAIAnalysis(stockData, maxPain, rsi, macd, patterns, bb) {
const price = stockData.price;
const delta = (maxPain - price) / price;

```
let score = 50;

// Max Pain influence (25 points)
score += Math.min(Math.abs(delta) * 100, 25);

// RSI influence (20 points)
if ((rsi.val < 30 && delta > 0) || (rsi.val > 70 && delta < 0)) score += 20;
else if ((rsi.val < 40 && delta > 0) || (rsi.val > 60 && delta < 0)) score += 10;

// MACD influence (15 points)
if ((macd.crossover === 'BULLISH' && delta > 0) || (macd.crossover === 'BEARISH' && delta < 0)) score += 15;

// Pattern influence (10 points)
const bullishPat = patterns.filter(p => p.type === 'bullish').length;
const bearishPat = patterns.filter(p => p.type === 'bearish').length;
score += Math.abs(bullishPat - bearishPat) * 5;

// Bollinger Bands influence (10 points)
if (bb.position === 'BELOW LOWER' && delta > 0) score += 10;
if (bb.position === 'ABOVE UPPER' && delta < 0) score += 10;

score = Math.min(Math.round(score), 100);

// Calculate confidence
let confidence = 60 + Math.abs(delta) * 80;
if ((rsi.val < 30 && delta > 0) || (rsi.val > 70 && delta < 0)) confidence += 15;
confidence += patterns.length * 5;
confidence = Math.min(Math.round(confidence), 95);

// Determine quality
let quality = 'POOR';
if (score >= 85) quality = 'EXCELLENT';
else if (score >= 70) quality = 'GOOD';
else if (score >= 55) quality = 'FAIR';

// Determine direction
const direction = delta > 0 ? 'BULLISH' : 'BEARISH';

// Calculate entry/targets/stops
const entry = price;
const target1 = price * (1 + delta * 0.5);
const target2 = price * (1 + delta * 0.7);
const target3 = price * (1 + delta * 0.9);
const stop = price * (1 - Math.abs(delta) * 0.4);

const risk = Math.abs(entry - stop);
const reward = Math.abs(target2 - entry);
const riskReward = `1:${(reward / risk).toFixed(2)}`;

// Generate reasoning
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
```

}

// MAX PAIN SCANNER
async function runScanner() {
const scanBtn = document.getElementById(‘scanBtn’) || event.target;
if (scanBtn) scanBtn.disabled = true;

```
document.getElementById('scannerResults').innerHTML = '<div class="loading"><div class="spinner"></div><div>Scanning market...</div></div>';

const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'GME', 'SPY', 'QQQ'];
const results = [];

for (const sym of symbols) {
    try {
        const res = await fetchPrice(sym);
        if (res.ok) {
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
        }
        await new Promise(r => setTimeout(r, 200));
    } catch (e) {}
}

results.sort((a, b) => b.score - a.score);

let html = `
    <div class="alert alert-success" style="margin-top: 1rem;">
        Scanned ${results.length} symbols. Top opportunities ranked by AI score.
    </div>
    <table class="scanner-table" style="width: 100%; margin-top: 1rem;">
        <thead>
            <tr>
                <th>Rank</th>
                <th>Symbol</th>
                <th>Price</th>
                <th>Max Pain</th>
                <th>Delta %</th>
                <th>RSI</th>
                <th>Direction</th>
                <th>AI Score</th>
            </tr>
        </thead>
        <tbody>
            ${results.map((r, i) => `
                <tr style="cursor: pointer;" onclick="quickSearch('${r.sym}'); showTab('dashboard');">
                    <td><strong>#${i + 1}</strong></td>
                    <td><strong>${r.sym}</strong></td>
                    <td>$${r.price.toFixed(2)}</td>
                    <td>$${r.mp.toFixed(2)}</td>
                    <td class="${r.delta >= 0 ? 'positive' : 'negative'}">${r.delta.toFixed(2)}%</td>
                    <td>${r.rsi.toFixed(1)}</td>
                    <td><span class="badge badge-${r.direction === 'BULLISH' ? 'bull' : 'bear'}">${r.direction}</span></td>
                    <td class="${r.score >= 75 ? 'positive' : r.score >= 50 ? 'neutral' : 'negative'}"><strong>${r.score}/100</strong></td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    <div style="margin-top: 1rem; padding: 1rem; background: rgba(0, 255, 136, 0.05); border-radius: 10px; font-size: 0.9rem; color: #a0a4a8;">
        Click any row to analyze that symbol in detail
    </div>
`;

document.getElementById('scannerResults').innerHTML = html;
if (scanBtn) scanBtn.disabled = false;
```

}

// FRACTAL PATTERN ANALYSIS
async function analyzeFractals() {
const sym = document.getElementById(‘fractalInput’).value.trim().toUpperCase();
if (!sym) return;

```
document.getElementById('fractalResults').innerHTML = '<div class="loading"><div class="spinner"></div><div>Analyzing fractals...</div></div>';

try {
    const res = await fetchPrice(sym);
    if (!res.ok) {
        document.getElementById('fractalResults').innerHTML = `<div class="alert alert-error">ERROR: ${res.err}</div>`;
        return;
    }
    
    const prices = genPrices(res.price, 200);
    const fractals = findFractals(prices);
    const currentPattern = getCurrentPattern(prices);
    const matches = matchCurrentToHistorical(currentPattern, fractals);
    
    let html = `
        <div class="alert alert-success">Found ${fractals.length} historical fractal patterns for ${sym}</div>
        
        <div class="card">
            <div class="card-header">Current Pattern Match</div>
            <div class="ai-insight">
                <div class="ai-header">Best Matching Historical Fractal</div>
                <div class="ai-content">
                    <strong>Match Quality:</strong> ${matches[0].similarity.toFixed(0)}% similar to pattern from ${matches[0].daysAgo} days ago<br>
                    <strong>Historical Outcome:</strong> ${matches[0].outcome > 0 ? 'Price rose' : 'Price fell'} ${Math.abs(matches[0].outcome).toFixed(2)}% over next ${matches[0].duration} days<br>
                    <strong>Current Completion:</strong> ${matches[0].completion.toFixed(0)}% complete<br>
                    <strong>Predicted Move:</strong> ${matches[0].prediction > 0 ? 'UP' : 'DOWN'} ${Math.abs(matches[0].prediction).toFixed(2)}% (${matches[0].confidence}% confidence)
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">All Historical Fractals</div>
            ${fractals.slice(0, 5).map((f, i) => `
                <div class="fractal-item">
                    <strong>Pattern #${i + 1}</strong> - ${f.daysAgo} days ago<br>
                    <small>Duration: ${f.duration} days | Outcome: ${f.outcome > 0 ? '+' : ''}${f.outcome.toFixed(2)}%</small>
                </div>
            `).join('')}
        </div>
    `;
    
    document.getElementById('fractalResults').innerHTML = html;
    
} catch (e) {
    document.getElementById('fractalResults').innerHTML = `<div class="alert alert-error">ERROR: ${e.message}</div>`;
}
```

}

function findFractals(prices) {
const fractals = [];
const patternLength = 10;

```
for (let i = 0; i < prices.length - patternLength * 2; i += 5) {
    const pattern = prices.slice(i, i + patternLength);
    const next = prices.slice(i + patternLength, i + patternLength + 10);
    
    const outcome = ((next[next.length - 1] - pattern[pattern.length - 1]) / pattern[pattern.length - 1]) * 100;
    
    fractals.push({
        startIdx: i,
        pattern: pattern,
        outcome: outcome,
        duration: 10,
        daysAgo: Math.floor((prices.length - i) / 5)
    });
}

return fractals;
```

}

function getCurrentPattern(prices) {
return prices.slice(-10);
}

function matchCurrentToHistorical(current, fractals) {
const matches = fractals.map(f => {
const similarity = calculateSimilarity(current, f.pattern);
const completion = (current.length / f.pattern.length) * 100;

```
    return {
        ...f,
        similarity,
        completion,
        prediction: f.outcome * (similarity / 100),
        confidence: Math.round(similarity)
    };
});

return matches.sort((a, b) => b.similarity - a.similarity);
```

}

function calculateSimilarity(pattern1, pattern2) {
if (pattern1.length !== pattern2.length) return 0;

```
const norm1 = normalize(pattern1);
const norm2 = normalize(pattern2);

let sumDiff = 0;
for (let i = 0; i < norm1.length; i++) {
    sumDiff += Math.abs(norm1[i] - norm2[i]);
}

const avgDiff = sumDiff / norm1.length;
return Math.max(0, (1 - avgDiff) * 100);
```

}

function normalize(arr) {
const min = Math.min(…arr);
const max = Math.max(…arr);
const range = max - min || 1;
return arr.map(v => (v - min) / range);
}

// ADVANCED ANALYSIS TAB
async function advancedAnalysis() {
const sym = document.getElementById(‘advSymInput’).value.trim().toUpperCase();
if (!sym) return;

```
document.getElementById('advancedResults').innerHTML = '<div class="loading"><div class="spinner"></div><div>Deep analysis...</div></div>';

try {
    const res = await fetchPrice(sym);
    if (!res.ok) {
        document.getElementById('advancedResults').innerHTML = `<div class="alert alert-error">ERROR: ${res.err}</div>`;
        return;
    }
    
    const prices = genPrices(res.price, 100);
    
    const timeframes = {
        '5m': prices.slice(-20),
        '15m': prices.slice(-30),
        '1h': prices.slice(-40),
        '4h': prices.slice(-60),
        '1d': prices
    };
    
    let html = `
        <div class="alert alert-success">Deep Analysis for ${sym} - ${res.src}</div>
        
        <div class="card">
            <div class="card-header">Multi-Timeframe RSI Analysis</div>
            <div class="indicator-grid">
                ${Object.entries(timeframes).map(([tf, p]) => {
                    const rsi = calcRSI(p);
                    return `
                        <div class="indicator-card">
                            <div class="indicator-header">${tf.toUpperCase()}</div>
                            <div class="indicator-value ${rsi.val < 30 ? 'positive' : rsi.val > 70 ? 'negative' : 'neutral'}">${rsi.val.toFixed(1)}</div>
                            <div class="indicator-signal">${rsi.sig}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">Multi-Timeframe MACD</div>
            <div class="indicator-grid">
                ${Object.entries(timeframes).map(([tf, p]) => {
                    const macd = calcMACD(p);
                    return `
                        <div class="indicator-card">
                            <div class="indicator-header">${tf.toUpperCase()}</div>
                            <div class="indicator-value ${macd.histogram > 0 ? 'positive' : 'negative'}">${macd.macd.toFixed(4)}</div>
                            <div class="indicator-signal">${macd.crossover}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    const alignedBullish = Object.values(timeframes).filter(p => {
        const rsi = calcRSI(p);
        return rsi.val < 30;
    }).length;
    
    if (alignedBullish >= 3) {
        html += `
            <div class="ai-insight">
                <div class="ai-header">Strong Multi-Timeframe Signal!</div>
                <div class="ai-content">
                    ${alignedBullish} timeframes showing oversold RSI. This multi-timeframe alignment significantly increases probability of upward move.
                </div>
            </div>
        `;
    }
    
    document.getElementById('advancedResults').innerHTML = html;
    
} catch (e) {
    document.getElementById('advancedResults').innerHTML = `<div class="alert alert-error">ERROR: ${e.message}</div>`;
}
```

}

// INTERACTIVE CHARTS
async function loadChart() {
const sym = document.getElementById(‘chartInput’).value.trim().toUpperCase();
if (!sym) return;

```
document.getElementById('chartResults').innerHTML = '<div class="loading"><div class="spinner"></div><div>Loading chart...</div></div>';

try {
    const res = await fetchPrice(sym);
    if (!res.ok) {
        document.getElementById('chartResults').innerHTML = `<div class="alert alert-error">ERROR: ${res.err}</div>`;
        return;
    }
    
    const prices = genPrices(res.price, 50);
    const labels = prices.map((_, i) => `T-${prices.length - i}`);
    
    const mp = genMaxPain(res.price, 1);
    const mpLine = Array(prices.length).fill(mp);
    
    const html = `
        <div class="alert alert-success">Chart loaded for ${sym}</div>
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
                backgroundColor: 'rgba(0, 255, 136, 0.1)',
                tension: 0.4,
                fill: true
            }, {
                label: 'Max Pain',
                data: mpLine,
                borderColor: '#ff3366',
                borderDash: [5, 5],
                borderWidth: 2,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#e8eaed' } },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                y: { 
                    ticks: { color: '#a0a4a8' },
                    grid: { color: '#2a2f3a' }
                },
                x: { 
                    ticks: { color: '#a0a4a8' },
                    grid: { color: '#2a2f3a' }
                }
            }
        }
    });
    
} catch (e) {
    document.getElementById('chartResults').innerHTML = `<div class="alert alert-error">ERROR: ${e.message}</div>`;
}
```

}
