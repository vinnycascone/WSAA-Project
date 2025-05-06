document.getElementById('login-form').addEventListener('submit', async function(ev) {
    ev.preventDefault();
    const form = ev.target;
    const userId = form.user_id.value;
  
    try {
      const res = await fetch('http://127.0.0.1:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId })
      });
  
      const data = await res.json();
  
      if (res.ok) {
        localStorage.setItem('user_id', userId);  // Store user_id in localStorage
        window.location.href = 'dashboard.html';  // Redirect to dashboard
      } else {
        document.getElementById('login-result').innerHTML = `<p class="error">${data.error}</p>`;
      }
    } catch (err) {
      document.getElementById('login-result').innerHTML = `<p class="error">${err.message}</p>`;
    }
  });
  