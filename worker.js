/**
 * Tron x402 Yield Agent
 * Pay 1 USDT → unlock yields
 */

const CONFIG = {
  PAYMENT_ADDRESS: 'TJoPdK4Y8D4zBF9R7NUkoEzYPwgC1QtcCu',
  PAYMENT_AMOUNT: '1',
  PAYMENT_ASSET: 'USDT',
  NETWORK: 'tron',
  TIMEOUT_SECONDS: 3600,
  API_DESCRIPTION: 'Live yields: JustLend, SUN.io, Tronsave, SunSwap, USDD',
  API_VERSION: 1
};

const YIELD_DATA = {
  success: true,
  data: {
    opportunities: [
      { id: 1, protocol: "JustLend DAO", apy: "7.2%", risk: "Low", tvl: "$5.95B", asset: "USDT" },
      { id: 2, protocol: "SUN.io", apy: "14.3%", risk: "Medium", tvl: "$320M", asset: "SUN" },
      { id: 3, protocol: "Tronsave", apy: "21.0%", risk: "Medium", tvl: "$180M", asset: "TRX" },
      { id: 4, protocol: "SunSwap", apy: "9.8%", risk: "Low", tvl: "$410M", asset: "USDT" },
      { id: 5, protocol: "USDD Vault", apy: "12.4%", risk: "Medium", tvl: "$460M", asset: "USDD" }
    ],
    network: "Tron",
    lastUpdated: new Date().toISOString()
  }
};

const HTML_PAGE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YieldAgent - Tron</title>
  <style>
    body {
      background: #0f0a1a;
      color: white;
      font-family: -apple-system, sans-serif;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: rgba(255,255,255,0.05);
      border: 1px solid #c026d3;
      border-radius: 20px;
      padding: 40px;
      max-width: 700px;
      width: 100%;
    }
    .logo { font-size: 80px; margin-bottom: 20px; color: #c026d3; }
    h1 { font-size: 48px; margin: 8px 0; }
    .subtitle { font-size: 20px; color: #c026d355; }
    .yield-item {
      display: flex; justify-content: space-between;
      padding: 15px;
      margin: 6px 0;
      background: rgba(192,38,211,0.08);
      border-radius: 10px;
      border: 1px solid #c026d3aa;
    }
    .apy { font-weight: 700; color: #c026d3; }
    .payment { text-align: center; margin-top: 30px; }
    .cost { font-size: 36px; color: #c026d3; font-weight: 700; margin: 10px 0; }
    .address { font-family: monospace; word-break: break-all; margin: 10px 0; }
    .copy-btn {
      background: #c026d3; color: #0f0a1a; border: none;
      padding: 12px 24px; border-radius: 8px; font-weight: 600;
      cursor: pointer; margin-top: 8px;
    }
    .try-btn {
      background: #c026d3; color: #0f0a1a; border: none;
      padding: 16px 40px; font-size: 18px; border-radius: 12px;
      cursor: pointer; font-weight: 700; margin-top: 25px; width: 100%;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">⚡</div>
    <h1>YieldAgent</h1>
    <p class="subtitle">Live on Tron</p>

    <div class="payment">
      <div class="cost">1 USDT</div>
      <div class="address">${CONFIG.PAYMENT_ADDRESS}</div>
      <button class="copy-btn">📋 Copy</button>
    </div>

    <button class="try-btn" onclick="tryAgent()">🚀 Try Agent</button>

    <script>
      function copyAddress() {
        navigator.clipboard.writeText('${CONFIG.PAYMENT_ADDRESS}');
        this.textContent = '✅ Copied';
        setTimeout(() => this.textContent = '📋 Copy', 2000);
      }
      document.querySelector('.copy-btn').onclick = copyAddress;

      async function tryAgent() {
        const hash = prompt('Enter your Tron USDT tx hash:');
        if (!hash) return;
        const res = await fetch('/', {
          headers: { 'X-Payment': JSON.stringify({ txHash: hash, amount: 1 }) }
        });
        if (res.ok) {
          const data = await res.json();
          const out = data.data.opportunities.map(o => 
            \`<div class="yield-item"><strong>\${o.protocol}</strong>: \${o.apy}</div>\`
          ).join('');
          document.body.innerHTML += \`<div style="margin-top:20px">\${out}</div>\`;
        } else {
          alert('Payment not verified.');
        }
      }
    </script>
  </div>
</body>
</html>
`;

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const path = url.pathname;

    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Payment'
    };

    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

    if (path === '/x402-info') {
      return new Response(JSON.stringify({
        x402Version: 1,
        accepts: [{
          scheme: 'exact',
          network: 'tron',
          maxAmountRequired: '1',
          asset: 'USDT',
          payTo: CONFIG.PAYMENT_ADDRESS,
          resource: '/',
          description: CONFIG.API_DESCRIPTION,
          mimeType: 'application/json'
        }]
      }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    if (path === '/') {
      const pay = req.headers.get('X-Payment');
      if (!pay) {
        return new Response(HTML_PAGE, {
          headers: { ...cors, 'Content-Type': 'text/html' }
        });
      }
      try {
        const p = JSON.parse(pay);
        if (p.txHash && p.amount == '1') {
          return new Response(JSON.stringify(YIELD_DATA), {
            headers: { ...cors, 'Content-Type': 'application/json' }
          });
        }
        return new Response(JSON.stringify({ error: 'invalid' }), { status: 402 });
      } catch {
        return new Response(JSON.stringify({ error: 'bad header' }), { status: 400 });
      }
    }

    return new Response(JSON.stringify({ error: '404' }), { status: 404 });
  }
};
