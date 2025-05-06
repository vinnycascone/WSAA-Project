const API_BASE = 'http://127.0.0.1:5000'; // Your API base URL
const contentEl = document.getElementById('content');

// Check if the user is logged in
if (!localStorage.getItem('user_id')) {
  window.location.href = 'index.html'; // Redirect to login page if not logged in
}

// Event Listeners for buttons
document.getElementById('btn-load-assets').addEventListener('click', loadAssets);
document.getElementById('btn-new-transaction').addEventListener('click', showTransactionForm);
document.getElementById('btn-view-transactions').addEventListener('click', loadTransactions);
document.getElementById('btn-view-gains').addEventListener('click', loadGains);
document.getElementById('btn-logout').addEventListener('click', logout);

// Logout function
function logout() {
  localStorage.removeItem('user_id');
  window.location.href = 'index.html'; // Redirect to login page
}

// Load assets function
async function loadAssets() {
  contentEl.innerHTML = 'Loading assets...';
  try {
    const res = await fetch(`${API_BASE}/assets`);
    const { assets } = await res.json();
    contentEl.innerHTML = `
      <h2>Available Assets</h2>
      <ul>
        ${assets.map(a => `<li>${a.asset_id} — ${a.asset_name} (${a.asset_type})</li>`).join('')}
      </ul>
    `;
  } catch (err) {
    contentEl.innerHTML = `<p class="error">Error: ${err.message}</p>`;
  }
}

// Show new transaction form
function showTransactionForm() {
  contentEl.innerHTML = `
    <h2>New Transaction</h2>
    <form id="tx-form">
      <label>Asset ID: <input name="asset_id" required></label><br>
      <label>Quantity: <input name="quantity" type="number" required></label><br>
      <label>Price: <input name="price" type="number" required></label><br>
      <button type="submit">Submit</button>
    </form>
    <div id="tx-result"></div>
  `;

  // Handle form submission
  document.getElementById('tx-form').addEventListener('submit', async function(ev) {
    ev.preventDefault();
    const form = ev.target;
    const body = {
      user_id: localStorage.getItem('user_id'),
      asset_id: form.asset_id.value,
      quantity: parseFloat(form.quantity.value),
      price: parseFloat(form.price.value),
      transaction_type: 'Buy' // Default to 'Buy' for simplicity
    };

    const resultEl = document.getElementById('tx-result');
    resultEl.textContent = 'Submitting...';

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
      resultEl.innerHTML = `Success! Transaction ID: <strong>${json.transaction_id}</strong>`;
    } catch (err) {
      resultEl.textContent = `Error: ${err.message}`;
    }
  });
}

// Load user transactions
async function loadTransactions() {
  const userId = localStorage.getItem('user_id');
  contentEl.innerHTML = `Loading transactions for ${userId}...`;
  try {
    const res = await fetch(`${API_BASE}/transactions?user_id=${encodeURIComponent(userId)}`);
    const data = await res.json();

    if (res.ok) {
      const transactions = data.transactions;
      if (transactions.length === 0) {
        contentEl.innerHTML = `<p>No transactions found for user <strong>${userId}</strong>.</p>`;
        return;
      }

      let rows = transactions.map(t => 
        `<tr>
          <td>${t.transaction_id}</td>
          <td>${t.asset_id}</td>
          <td>${t.transaction_type}</td>
          <td>${t.quantity}</td>
          <td>${t.price}</td>
          <td>${new Date(t.date).toLocaleString()}</td>
        </tr>`
      ).join('');

      contentEl.innerHTML = `
        <h2>Transactions for ${userId}</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Asset</th><th>Type</th><th>Qty</th><th>Price</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    } else {
      contentEl.innerHTML = `<p class="error">${data.error}</p>`;
    }
  } catch (err) {
    contentEl.innerHTML = `<p class="error">Error: ${err.message}</p>`;
  }
}

// Load gains (view total portfolio gain/loss)
async function loadGains() {
  const userId = localStorage.getItem('user_id');
  contentEl.innerHTML = `Loading gains for ${userId}...`;

  try {
    const res = await fetch(`${API_BASE}/transactions?user_id=${encodeURIComponent(userId)}`);
    const data = await res.json();

    if (res.ok) {
      let totalGains = 0;
      let breakdown = '';
      data.transactions.forEach(tx => {
        const transactionValue = tx.quantity * tx.price;
        if (tx.transaction_type === 'Buy') {
          totalGains -= transactionValue; // Deduct Buy value
          breakdown += `<p>Bought ${tx.quantity} of ${tx.asset_id} for $${transactionValue.toFixed(2)}</p>`;
        } else {
          totalGains += transactionValue; // Add Sell value
          breakdown += `<p>Sold ${tx.quantity} of ${tx.asset_id} for $${transactionValue.toFixed(2)}</p>`;
        }
      });

      contentEl.innerHTML = `
        <h2>Total Gains for ${userId}</h2>
        <p>Your total portfolio gain/loss: <strong>${totalGains.toFixed(2)}</strong></p>
        <h3>Transaction Breakdown:</h3>
        ${breakdown}
      `;
    } else {
      contentEl.innerHTML = `<p class="error">${data.error}</p>`;
    }
  } catch (err) {
    contentEl.innerHTML = `<p class="error">Error: ${err.message}</p>`;
  }
}
