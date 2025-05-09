// dashboard.js
const API_BASE = 'http://127.0.0.1:5000'; // Your API base URL
const contentEl = document.getElementById('content');
const pageTitleEl = document.getElementById('page-title');
const currentDateEl = document.getElementById('current-date');
const userIdDisplayEl = document.getElementById('user-id-display');

// Data cache to avoid multiple API calls
const DataCache = {
  // cached data
  assets: null,
  transactions: null,
  prices: null,        // for batch price responses

  // timestamps of last fetch
  lastFetchTime: {
    assets: null,
    transactions: null,
    prices: null
  },

  // Cache expiry time (1 minute)
  cacheExpiry: 60_000,

  // Fetch and cache assets
  async getAssets() {
    const now = Date.now();
    if (this.assets && this.lastFetchTime.assets &&
        (now - this.lastFetchTime.assets < this.cacheExpiry)) {
      return this.assets;
    }
    try {
      const res = await fetch(`${API_BASE}/assets`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch assets');
      this.assets = data.assets || [];
      this.lastFetchTime.assets = now;
      return this.assets;
    } catch (err) {
      console.error('Error fetching assets:', err);
      throw err;
    }
  },

  // Fetch and cache transactions
  async getTransactions(userId) {
    const now = Date.now();
    if (this.transactions && this.lastFetchTime.transactions &&
        (now - this.lastFetchTime.transactions < this.cacheExpiry)) {
      return this.transactions;
    }
    try {
      const res = await fetch(`${API_BASE}/transactions?user_id=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch transactions');
      this.transactions = data.transactions || [];
      this.lastFetchTime.transactions = now;
      return this.transactions;
    } catch (err) {
      console.error('Error fetching transactions:', err);
      throw err;
    }
  },

  // Fetch and cache a single asset price (fallback use)
  async getPrice(assetId) {
    try {
      const res = await fetch(`${API_BASE}/price/${encodeURIComponent(assetId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch price');
      return data;  // { symbol, price, time }
    } catch (err) {
      console.error('Error fetching price for', assetId, err);
      throw err;
    }
  },

  // Batch-fetch and cache prices for multiple assets in one call
  async getPrices(symbols) {
    const now = Date.now();
    const key = symbols.join(',');

    // Reuse cached batch if still valid
    if (this.prices?.key === key &&
        this.lastFetchTime.prices &&
        (now - this.lastFetchTime.prices < this.cacheExpiry)) {
      return this.prices.data;
    }

    // Otherwise fetch fresh
    try {
      const res = await fetch(`${API_BASE}/prices?assets=${encodeURIComponent(key)}`);
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to fetch batch prices');

      // Cache the result
      this.prices = { key, data: payload.prices };
      this.lastFetchTime.prices = now;
      return payload.prices;
    } catch (err) {
      console.error('Error fetching batch prices:', err);
      throw err;
    }
  },

  // Clear all caches (e.g. after a new transaction)
  clearCache() {
    this.assets = null;
    this.transactions = null;
    this.prices = null;
    this.lastFetchTime.assets = null;
    this.lastFetchTime.transactions = null;
    this.lastFetchTime.prices = null;
    console.log('Cache cleared');
  }
};

// Check if the user is logged in
const userId = localStorage.getItem('user_id');
if (!userId) {
  window.location.href = 'index.html'; // Redirect to login page if not logged in
}

// Display user ID
userIdDisplayEl.textContent = `User ID: ${userId}`;

// Display current date
const now = new Date();
currentDateEl.textContent = now.toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

// Event Listeners for buttons
document.getElementById('btn-dashboard').addEventListener('click', loadDashboard);
document.getElementById('btn-load-assets').addEventListener('click', loadAssets);
document.getElementById('btn-new-transaction').addEventListener('click', showTransactionForm);
document.getElementById('btn-view-transactions').addEventListener('click', loadTransactions);
document.getElementById('btn-view-gains').addEventListener('click', loadGains);
document.getElementById('btn-logout').addEventListener('click', logout);

// Add refresh button listener if it exists
const refreshBtn = document.getElementById('btn-refresh');
if (refreshBtn) {
  refreshBtn.addEventListener('click', refreshData);
}

// Refresh data (clear cache and reload current view)
function refreshData() {
  DataCache.clearCache();

  // Get the active page and reload it
  const activeNav = document.querySelector('.nav-item.active');
  if (activeNav) {
    activeNav.click();
  } else {
    loadDashboard();
  }
}

// Set active nav item
function setActiveNavItem(id) {
  // Remove active class from all nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  // Add active class to clicked nav item
  document.getElementById(id).classList.add('active');
}

// Logout function
function logout() {
  localStorage.removeItem('user_id');
  window.location.href = 'index.html'; // Redirect to login page
}

async function loadDashboard() {
  setActiveNavItem('btn-dashboard');
  pageTitleEl.textContent = 'Dashboard';

  // show spinner while we fetch data & prices
  contentEl.innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Loading your portfolio...</span>
    </div>
  `;

  try {
    // 1) fetch cached transactions & assets
    const [transactions, assets] = await Promise.all([
      DataCache.getTransactions(userId),
      DataCache.getAssets()
    ]);

    // 2) build holdings & totalInvested
    let totalInvested = 0;
    const holdings = {};
    const recentTransactions = [];

    transactions.forEach(tx => {
      const value = tx.quantity * tx.price;

      // capture up to 5 recent
      if (recentTransactions.length < 5) {
        recentTransactions.push(tx);
      }

      if (!holdings[tx.asset_id]) {
        holdings[tx.asset_id] = {
          asset_id: tx.asset_id,
          asset_name: assets.find(a => a.asset_id === tx.asset_id)?.asset_name || tx.asset_id,
          asset_type: assets.find(a => a.asset_id === tx.asset_id)?.asset_type || 'Unknown',
          quantity: 0,
          invested: 0
        };
      }

      if (tx.transaction_type === 'Buy') {
        holdings[tx.asset_id].quantity += tx.quantity;
        holdings[tx.asset_id].invested += value;
        totalInvested += value;
      } else {
        holdings[tx.asset_id].quantity -= tx.quantity;
      }
    });

    // only keep assets with >0 quantity
    const activeHoldings = Object.values(holdings).filter(h => h.quantity > 0);

    // --- inside loadDashboard, after you build `activeHoldings` ---
    // 3) fetch all live prices in one batch call
    let batch;
    try {
      const symbols = activeHoldings.map(h => h.asset_id);
      batch = await DataCache.getPrices(symbols);
    } catch (err) {
      console.warn('Batch fetch failed — falling back to individual calls', err);
      // fallback to previous parallel approach
      batch = await Promise.all(activeHoldings.map(h =>
        DataCache.getPrice(h.asset_id)
          .then(({ price }) => ({ symbol: h.asset_id, price }))
          .catch(() => ({ symbol: h.asset_id, price: (h.invested / h.quantity).toString() }))
      ));
    }

    // turn batch into livePrices with numeric fallback
    const livePrices = batch.map(p => {
      const asset_id = p.symbol;
      const priceNum = p.price != null ? parseFloat(p.price)
        : activeHoldings.find(h => h.asset_id === asset_id).invested
        / activeHoldings.find(h => h.asset_id === asset_id).quantity;
      return { asset_id, price: priceNum };
    });


    // 4) merge livePrices back in…
    let totalValue = 0;
    livePrices.forEach(({ asset_id, price }) => {
      const h = activeHoldings.find(x => x.asset_id === asset_id);
      h.live_price = price;
      h.current_value = h.quantity * price;
      totalValue += h.current_value;
    });

    // 5) compute totalGains & percentage
    const totalGains = totalValue - totalInvested;
    const gainPct = totalInvested > 0 ? (totalGains / totalInvested) * 100 : 0;

    // 6) render summary cards + portfolio table + recent tx
    contentEl.innerHTML = `
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-icon"><i class="fas fa-wallet"></i></div>
          <div class="card-title">Total Portfolio Value</div>
          <div class="card-value">$${totalValue.toFixed(2)}</div>
        </div>
        <div class="summary-card">
          <div class="card-icon"><i class="fas fa-money-bill"></i></div>
          <div class="card-title">Total Invested</div>
          <div class="card-value">$${totalInvested.toFixed(2)}</div>
        </div>
        <div class="summary-card">
          <div class="card-icon"><i class="fas fa-chart-line"></i></div>
          <div class="card-title">Total Gain/Loss</div>
          <div class="card-value">$${totalGains.toFixed(2)}</div>
          <div class="card-change ${totalGains >= 0 ? 'positive' : 'negative'}">
            <i class="fas fa-${totalGains >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
            ${Math.abs(gainPct).toFixed(2)}%
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon"><i class="fas fa-coins"></i></div>
          <div class="card-title">Active Assets</div>
          <div class="card-value">${activeHoldings.length}</div>
        </div>
      </div>

      <h3 class="section-title"><i class="fas fa-briefcase"></i> Your Portfolio</h3>
      ${activeHoldings.length > 0 ? `
        <div class="portfolio-assets">
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Live Price</th>
                <th>Current Value</th>
                <th>Invested</th>
                <th>Gain/Loss</th>
              </tr>
            </thead>
            <tbody>
              ${activeHoldings.map(h => {
      const gain = h.current_value - h.invested;
      const pct = h.invested > 0 ? (gain / h.invested) * 100 : 0;
      return `
                  <tr>
                    <td>${h.asset_name}</td>
                    <td>${h.asset_type}</td>
                    <td>${h.quantity}</td>
                    <td>$${h.live_price.toFixed(2)}</td>
                    <td>$${h.current_value.toFixed(2)}</td>
                    <td>$${h.invested.toFixed(2)}</td>
                    <td class="${gain >= 0 ? 'positive' : 'negative'}">
                      $${gain.toFixed(2)} (${Math.abs(pct).toFixed(2)}%)
                    </td>
                  </tr>
                `;
    }).join('')}
            </tbody>
          </table>
        </div>
      ` : '<p>No active assets. Use "New Transaction" to get started.</p>'}

      <h3 class="section-title"><i class="fas fa-history"></i> Recent Transactions</h3>
      ${recentTransactions.length > 0 ? `
        <div class="portfolio-assets">
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Asset</th><th>Type</th><th>Qty</th><th>Price</th><th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${recentTransactions.map(tx => {
      const asset = assets.find(a => a.asset_id === tx.asset_id);
      return `
                  <tr>
                    <td>${new Date(tx.date).toLocaleDateString()}</td>
                    <td>${asset?.asset_name || tx.asset_id}</td>
                    <td>${tx.transaction_type}</td>
                    <td>${tx.quantity}</td>
                    <td>$${tx.price.toFixed(2)}</td>
                    <td>$${(tx.quantity * tx.price).toFixed(2)}</td>
                  </tr>
                `;
    }).join('')}
            </tbody>
          </table>
        </div>
      ` : '<p>No recent transactions.</p>'}
    `;
  } catch (err) {
    contentEl.innerHTML = `
      <p class="result-error">
        <i class="fas fa-exclamation-circle"></i>
        Error loading dashboard: ${err.message}
      </p>
    `;
  }
}


// Load assets function
async function loadAssets() {
  setActiveNavItem('btn-load-assets');
  pageTitleEl.textContent = 'Available Assets';

  contentEl.innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Loading assets...</span>
    </div>
  `;

  try {
    // Get assets from cache
    const assets = await DataCache.getAssets();

    if (assets && assets.length > 0) {
      contentEl.innerHTML = `
        <div class="portfolio-assets">
          <table>
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${assets.map(asset => `
                <tr>
                  <td>${asset.asset_id}</td>
                  <td>${asset.asset_name}</td>
                  <td>${asset.asset_type}</td>
                  <td>
                    <button class="btn-submit" onclick="showTransactionFormForAsset('${asset.asset_id}')">
                      Buy/Sell
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      contentEl.innerHTML = `<p>No assets are currently available in the system.</p>`;
    }
  } catch (err) {
    contentEl.innerHTML = `<p class="result-error">Error: ${err.message}</p>`;
  }
}

// Show new transaction form for a specific asset
function showTransactionFormForAsset(assetId) {
  showTransactionForm(assetId);
}

// Show new transaction form
function showTransactionForm(preselectedAssetId = '') {
  setActiveNavItem('btn-new-transaction');
  pageTitleEl.textContent = 'New Transaction';

  // Show loading spinner
  contentEl.innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Loading transaction form...</span>
    </div>
  `;

  // Use cache for assets
  DataCache.getAssets()
    .then(assets => {
      contentEl.innerHTML = `
        <div class="transaction-form">
          <h3 class="section-title"><i class="fas fa-exchange-alt"></i> New Transaction</h3>
          <form id="tx-form">
            <div class="form-group">
              <label for="asset_id">Asset:</label>
              <select name="asset_id" id="asset_id" required>
                <option value="">Select an asset</option>
                ${assets.map(asset => `
                  <option value="${asset.asset_id}" ${asset.asset_id === preselectedAssetId ? 'selected' : ''}>
                    ${asset.asset_name} (${asset.asset_type})
                  </option>
                `).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label for="transaction_type">Transaction Type:</label>
              <select name="transaction_type" id="transaction_type" required>
                <option value="Buy">Buy</option>
                <option value="Sell">Sell</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="quantity">Quantity:</label>
              <input name="quantity" id="quantity" type="number" step="0.01" min="0.01" required>
            </div>
            
            <div class="form-group">
              <label for="price">Price per Unit ($):</label>
              <input name="price" id="price" type="number" step="0.01" min="0.01" required>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn-cancel" onclick="loadDashboard()">Cancel</button>
              <button type="submit" class="btn-submit">Submit Transaction</button>
            </div>
          </form>
          <div id="tx-result"></div>
        </div>
      `;

      // Add validation for sell transactions
      const txTypeSelect = document.getElementById('transaction_type');
      const assetSelect = document.getElementById('asset_id');
      const quantityInput = document.getElementById('quantity');

      // Check available quantity when selecting "Sell"
      txTypeSelect.addEventListener('change', async () => {
        if (txTypeSelect.value === 'Sell' && assetSelect.value) {
          await validateSellQuantity(assetSelect.value);
        }
      });

      // Check available quantity when selecting an asset with "Sell" already selected
      assetSelect.addEventListener('change', async () => {
        if (txTypeSelect.value === 'Sell' && assetSelect.value) {
          await validateSellQuantity(assetSelect.value);
        }
      });

      async function validateSellQuantity(assetId) {
        try {
          // Get transactions from cache
          const transactions = await DataCache.getTransactions(userId);

          // Calculate available quantity
          let availableQty = 0;
          transactions.forEach(tx => {
            if (tx.asset_id === assetId) {
              if (tx.transaction_type === 'Buy') {
                availableQty += tx.quantity;
              } else {
                availableQty -= tx.quantity;
              }
            }
          });

          // Update max value
          quantityInput.max = availableQty;

          // Add hint about maximum available
          const qtyLabel = document.querySelector('label[for="quantity"]');
          qtyLabel.textContent = `Quantity: (Max ${availableQty.toFixed(2)} available)`;
        } catch (err) {
          console.error('Error validating sell quantity:', err);
        }
      }

      // Handle form submission
      document.getElementById('tx-form').addEventListener('submit', async function (ev) {
        ev.preventDefault();
        const form = ev.target;
        const body = {
          user_id: userId,
          asset_id: form.asset_id.value,
          transaction_type: form.transaction_type.value,
          quantity: parseFloat(form.quantity.value),
          price: parseFloat(form.price.value)
        };

        // Validate sell quantity
        if (body.transaction_type === 'Sell') {
          try {
            const transactions = await DataCache.getTransactions(userId);
            let availableQty = 0;

            transactions.forEach(tx => {
              if (tx.asset_id === body.asset_id) {
                if (tx.transaction_type === 'Buy') {
                  availableQty += tx.quantity;
                } else {
                  availableQty -= tx.quantity;
                }
              }
            });

            if (body.quantity > availableQty) {
              document.getElementById('tx-result').innerHTML = `
                <div class="result-message result-error">
                  <i class="fas fa-exclamation-circle"></i> Error: Cannot sell more than available (${availableQty.toFixed(2)})
                </div>
              `;
              return;
            }
          } catch (err) {
            console.error('Error validating sell quantity:', err);
          }
        }

        const resultEl = document.getElementById('tx-result');
        resultEl.innerHTML = `
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Processing transaction...</span>
          </div>
        `;

        try {
          const res = await fetch(`${API_BASE}/transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            const text = await res.text();
            throw new Error(`HTTP ${res.status}\n\n${text}`);
          }

          const json = await res.json();
          resultEl.innerHTML = `
            <div class="result-message result-success">
              <i class="fas fa-check-circle"></i> Transaction successful!
              <br>Transaction ID: <strong>${json.transaction_id}</strong>
            </div>
          `;

          // Clear cache after new transaction
          DataCache.clearCache();

          // Refresh form after successful submission
          form.reset();

          // Auto-redirect to dashboard after a short delay
          setTimeout(() => {
            loadDashboard();
          }, 3000);

        } catch (err) {
          resultEl.innerHTML = `
            <div class="result-message result-error">
              <i class="fas fa-exclamation-circle"></i> Error: ${err.message}
            </div>
          `;
        }
      });
    })
    .catch(err => {
      contentEl.innerHTML = `<p class="result-error">Error loading assets: ${err.message}</p>`;
    });
}

// Load user transactions
async function loadTransactions() {
  setActiveNavItem('btn-view-transactions');
  pageTitleEl.textContent = 'Transaction History';

  contentEl.innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Loading transactions...</span>
    </div>
  `;

  try {
    // Get data from cache
    const [assets, transactions] = await Promise.all([
      DataCache.getAssets(),
      DataCache.getTransactions(userId)
    ]);

    if (transactions.length === 0) {
      contentEl.innerHTML = `
        <p>No transactions found for your account.</p>
        <button class="btn-submit" onclick="showTransactionForm()">
          <i class="fas fa-plus-circle"></i> Add Your First Transaction
        </button>
      `;
      return;
    }

    // Sort transactions by date (newest first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    let rows = transactions.map(tx => {
      const asset = assets.find(a => a.asset_id === tx.asset_id);
      const assetName = asset ? asset.asset_name : tx.asset_id;
      const total = tx.quantity * tx.price;

      return `
        <tr>
          <td>${new Date(tx.date).toLocaleString()}</td>
          <td>${tx.transaction_id}</td>
          <td>${assetName}</td>
          <td>${tx.transaction_type}</td>
          <td>${tx.quantity}</td>
          <td>$${tx.price.toFixed(2)}</td>
          <td>$${total.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    contentEl.innerHTML = `
      <div class="portfolio-assets">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>ID</th>
              <th>Asset</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    contentEl.innerHTML = `<p class="result-error">Error loading transactions: ${err.message}</p>`;
  }
}

// Load gains (view total portfolio gain/loss)
async function loadGains() {
  setActiveNavItem('btn-view-gains');
  pageTitleEl.textContent = 'Portfolio Analysis';

  contentEl.innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Analyzing portfolio...</span>
    </div>
  `;

  try {
    // Get data from cache
    const [assets, transactions] = await Promise.all([
      DataCache.getAssets(),
      DataCache.getTransactions(userId)
    ]);

    if (transactions.length === 0) {
      contentEl.innerHTML = `
        <p>No transactions found for analysis. Add some transactions first.</p>
        <button class="btn-submit" onclick="showTransactionForm()">
          <i class="fas fa-plus-circle"></i> Add Your First Transaction
        </button>
      `;
      return;
    }

    // Calculate gains per asset
    let totalGains = 0;
    let assetGains = {};
    let assetTransactions = {};

    transactions.forEach(tx => {
      const transactionValue = tx.quantity * tx.price;

      // Initialize asset if not exists
      if (!assetGains[tx.asset_id]) {
        assetGains[tx.asset_id] = {
          asset_id: tx.asset_id,
          asset_name: assets.find(a => a.asset_id === tx.asset_id)?.asset_name || tx.asset_id,
          buys: 0,
          sells: 0,
          quantity: 0,
          invested: 0,
          returns: 0,
          gain: 0
        };
        assetTransactions[tx.asset_id] = [];
      }

      // Add to asset transactions
      assetTransactions[tx.asset_id].push(tx);

      // Update gains based on transaction type
      if (tx.transaction_type === 'Buy') {
        assetGains[tx.asset_id].buys += transactionValue;
        assetGains[tx.asset_id].quantity += tx.quantity;
        assetGains[tx.asset_id].invested += transactionValue;
        totalGains -= transactionValue; // Deduct Buy value
      } else {
        assetGains[tx.asset_id].sells += transactionValue;
        assetGains[tx.asset_id].quantity -= tx.quantity;
        assetGains[tx.asset_id].returns += transactionValue;
        totalGains += transactionValue; // Add Sell value
      }

      // Calculate gain
      assetGains[tx.asset_id].gain = assetGains[tx.asset_id].returns - assetGains[tx.asset_id].buys;
    });

    // Sort assets by gain (highest first)
    const sortedAssets = Object.values(assetGains).sort((a, b) => b.gain - a.gain);

    // Generate asset rows
    const assetRows = sortedAssets.map(asset => {
      const gainPercentage = asset.invested > 0 ? (asset.gain / asset.invested) * 100 : 0;
      return `
        <tr>
          <td>${asset.asset_name}</td>
          <td>$${asset.invested.toFixed(2)}</td>
          <td>$${asset.returns.toFixed(2)}</td>
          <td class="${asset.gain >= 0 ? 'positive' : 'negative'}">
            $${asset.gain.toFixed(2)} 
            (${Math.abs(gainPercentage).toFixed(2)}%)
          </td>
          <td>${asset.quantity}</td>
        </tr>
      `;
    }).join('');

    // Calculate total portfolio metrics
    const totalInvested = sortedAssets.reduce((sum, asset) => sum + asset.invested, 0);
    const totalReturns = sortedAssets.reduce((sum, asset) => sum + asset.returns, 0);
    const gainPercentage = totalInvested > 0 ? (totalGains / totalInvested) * 100 : 0;

    contentEl.innerHTML = `
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-icon"><i class="fas fa-money-bill"></i></div>
          <div class="card-title">Total Invested</div>
          <div class="card-value">$${totalInvested.toFixed(2)}</div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon"><i class="fas fa-hand-holding-usd"></i></div>
          <div class="card-title">Total Returns</div>
          <div class="card-value">$${totalReturns.toFixed(2)}</div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon"><i class="fas fa-chart-line"></i></div>
          <div class="card-title">Total Gain/Loss</div>
          <div class="card-value">$${totalGains.toFixed(2)}</div>
          <div class="card-change ${totalGains >= 0 ? 'positive' : 'negative'}">
            <i class="fas fa-${totalGains >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
            ${Math.abs(gainPercentage).toFixed(2)}%
          </div>
        </div>
      </div>
      
      <h3 class="section-title"><i class="fas fa-chart-pie"></i> Gain/Loss by Asset</h3>
      
      <div class="portfolio-assets">
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Invested</th>
              <th>Returns</th>
              <th>Gain/Loss</th>
              <th>Current Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${assetRows}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    contentEl.innerHTML = `<p class="result-error">Error analyzing portfolio: ${err.message}</p>`;
  }
}

// Load dashboard on page load
loadDashboard();