const API_BASE = 'http://127.0.0.1:5000';

const contentEl = document.getElementById('content');

document.getElementById('btn-register')
  .addEventListener('click', registerUser);

document.getElementById('btn-load-assets')
  .addEventListener('click', loadAssets);

document.getElementById('btn-new-transaction')
  .addEventListener('click', showTransactionForm);

async function registerUser() {
  contentEl.innerHTML = 'Registering…';
  try {
    const res = await fetch(`${API_BASE}/register`, { method: 'POST' });
    const data = await res.json();
    contentEl.innerHTML = `<p>New user_id: <strong>${data.user_id}</strong></p>`;
  } catch (err) {
    contentEl.innerHTML = `<p class="error">Error: ${err.message}</p>`;
  }
}

async function loadAssets() {
  contentEl.innerHTML = 'Loading assets…';
  try {
    const res = await fetch(`${API_BASE}/assets`);
    const { assets } = await res.json();
    contentEl.innerHTML = `
      <ul>
        ${assets.map(a => `<li>${a.asset_id} — ${a.asset_name} (${a.asset_type})</li>`).join('')}
      </ul>
    `;
  } catch (err) {
    contentEl.innerHTML = `<p class="error">Error: ${err.message}</p>`;
  }
}

function showTransactionForm() {
  contentEl.innerHTML = `
    <h2>New Transaction</h2>
    <form id="tx-form">
      <label>User ID: <input name="user_id" required></label><br>
      <label>Asset ID: <input name="asset_id" required></label><br>
      <label>Type: 
        <select name="transaction_type">
          <option>Buy</option>
          <option>Sell</option>
        </select>
      </label><br>
      <label>Quantity: <input name="quantity" type="number" step="0.0001" required></label><br>
      <label>Price: <input name="price" type="number" step="0.01" required></label><br>
      <button type="submit">Submit</button>
    </form>
    <div id="tx-result"></div>
  `;

  document.getElementById('tx-form')
    .addEventListener('submit', async ev => {
      ev.preventDefault();
      const form = ev.target;
      const body = {
        user_id: form.user_id.value,
        asset_id: form.asset_id.value,
        transaction_type: form.transaction_type.value,
        quantity: parseFloat(form.quantity.value),
        price: parseFloat(form.price.value),
      };
      document.getElementById('tx-result').textContent = 'Submitting…';
      try {
        const res = await fetch(`${API_BASE}/transaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (res.ok) {
          document.getElementById('tx-result').innerHTML =
            `Success! Transaction ID: <strong>${json.transaction_id}</strong>`;
        } else {
          document.getElementById('tx-result').textContent =
            `Error: ${json.error || JSON.stringify(json)}`;
        }
      } catch (err) {
        document.getElementById('tx-result').textContent =
          `Network error: ${err.message}`;
      }
    });
}
