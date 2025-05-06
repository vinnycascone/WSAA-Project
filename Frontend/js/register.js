document.getElementById('register-btn').addEventListener('click', async function() {
  const resultEl = document.getElementById('register-result');
  resultEl.innerHTML = 'Registering…';

  try {
    const res = await fetch('http://127.0.0.1:5000/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();

    if (res.ok) {
      resultEl.innerHTML = `Registration successful! Your user ID is: <strong>${data.user_id}</strong>`;
    } else {
      resultEl.innerHTML = `<p class="error">${data.error}</p>`;
    }
  } catch (err) {
    resultEl.innerHTML = `<p class="error">Error: ${err.message}</p>`;
  }
});
