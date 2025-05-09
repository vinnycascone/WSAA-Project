# Asset Manager

A lightweight asset management platform designed with privacy and ease-of-use in mind. Users register with a randomly generated identifier, ensuring anonymity while tracking investments in various asset classes (stocks, cryptocurrencies, fiat currencies). Transactions are logged and dynamically compared against live market values via the Alpha Vantage API.

---

## 📦 Downloads

All project artifacts are hosted on Files.io.

Download your .env file (containing ALPHA_VANTAGE_API_KEY and DB_CONNECTION_URI) from https://docs.google.com/document/d/1jL8YqnuMNiSL1WgK1UpEnh1zGfCsu5v8EZ8tj10hik0/edit?tab=t.0

Place the downloaded .env into your project’s /backend folder

Run the Flask server:
python app.py

then
cd frontend
python -m http.server 8080

---

## 🏗️ Architecture Overview

1. **Frontend**

   * Static HTML/CSS/JavaScript
   * AJAX calls to Flask REST API
   * Pages: Login, Register, Dashboard

2. **Backend**

   * Python 3 + Flask
   * Flask-SQLAlchemy ORM, Flask-Caching, Flask-CORS
   * Endpoints for user registration, asset listing, transactions, live‐price fetch

3. **Database**

   * SQL (PostgreSQL or MySQL)
   * Hosted & managed by Files.io (see below)
   * Tables:

     * `users` (*user\_id*, created\_at)
     * `assets` (*asset\_id*, asset\_name, asset\_type)
     * `transactions` (*transaction\_id*, user\_id ↔ users, asset\_id ↔ assets, type, quantity, price, date)

---

## 🚀 Getting Started

### Quick Start Guide

Follow these steps to get the Asset Manager up and running on your local machine:

1. **Download Project Files**
   - Download the backend, frontend, and database files from the Files.io links above
   - Extract the files to your preferred directory

2. **Set Up Environment**
   ```bash
   # Create and navigate to project directory
   mkdir asset-manager
   cd asset-manager
   
   # Create backend and frontend directories
   mkdir backend frontend
   
   # Move downloaded files to appropriate directories
   # (manually move files to their correct locations)
   ```

3. **Install Dependencies**
   ```bash
   # Navigate to backend directory
   cd backend
   
   # Install required packages
   pip install Flask Flask_SQLAlchemy psycopg2-binary flask-caching flask-cors python-dotenv requests
   ```

4. **Configure Environment Variables**
   - Create a `.env` file in the `/backend` directory:
   ```
   ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
   DB_CONNECTION_URI=<your_filesio_connection_uri>
   ```
   - **Note**: Get your Alpha Vantage API key from [alphavantage.co](https://www.alphavantage.co/support/#api-key)
   - If using a local database instead of Files.io, set your connection string accordingly (e.g., `sqlite:///local.db`)

5. **Run the Application**

   **Backend:**
   ```bash
   cd backend
   
   # Initialize and seed the database
   flask init-db
   
   # Run the Flask application
   python app.py
   # OR alternatively:
   flask run --port 5000
   ```

   **Frontend:**
   ```bash
   cd frontend
   
   # Using Python's built-in HTTP server
   # For Python 3:
   python -m http.server 8000
   # For Python 2:
   python -m SimpleHTTPServer 8000
   ```

6. **Access the Application**
   - Open your browser and navigate to `http://localhost:8000`
   - Backend API is available at `http://localhost:5000`

### Alternative Database Setup (Local)

If you prefer to run the database locally instead of using Files.io:

1. **Modify the `.env` file:**
   ```
   ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
   DB_CONNECTION_URI=sqlite:///local.db
   # Or for PostgreSQL:
   # DB_CONNECTION_URI=postgresql://username:password@localhost/assetmanager
   # Or for MySQL:
   # DB_CONNECTION_URI=mysql://username:password@localhost/assetmanager
   ```

2. **Initialize the local database:**
   ```bash
   cd backend
   flask init-db
   ```

### API Endpoints

The backend exposes the following endpoints:

* **Register**: `POST /register`
* **Get Assets**: `GET /assets`
* **Create Transaction**: `POST /transaction`
* **List Transactions**: `GET /transactions?user_id=...`
* **Fetch Stock**: `GET /stock/:symbol`
* **Batch Prices**: `GET /prices?assets=TSLA,AAPL,BTC`

---

## Part A: Database Setup on Files.io

### Why Files.io?

* **Simplified Management:** Automated backups, scaling, and security.
* **Scalability:** Cloud-based; resources can grow with project demand.
* **High Availability & Security:** Reliable uptime and data protection.
* **Rapid Deployment:** Quick spin-up matches our lightweight, anonymous model.
* **Cost-Efficiency:** Competitive plans for early prototypes.

### Step 1: Create & Configure Database

1. Log in to Files.io
2. Navigate to the **Database** section
3. **Type of Database:** SQL
4. **Database Identifier:** `AssetManager`
5. Note your **Connection URI** (will be used in `.env` below)

---

## Part B: Backend (Python API)

### 1. Prerequisites

```bash
pip install Flask Flask_SQLAlchemy psycopg2-binary flask-caching flask-cors python-dotenv requests
```

### 2. Environment Variables

Create a `.env` file in `/backend`:

```dotenv
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
DB_CONNECTION_URI=<your_filesio_connection_uri>
```

### 3. Models & Database Schema

* **User**: user\_id (PK), created\_at timestamp
* **Asset**: asset\_id (PK), asset\_name, asset\_type
* **Transaction**: auto-inc transaction\_id (PK), user\_id → users, asset\_id → assets, transaction\_type (Buy/Sell), quantity, price, transaction\_date

These relationships enforce data integrity and support user-specific transaction logging.

### 4. Utility Function

```python
def generate_user_id(length=6):
    """
    Generate a random, anonymous user ID (36⁶ ≈ 2.1B combos).
    On collision, registration logic retries.
    """
    chars = string.ascii_lowercase + string.digits
    return ''.join(random.choices(chars, k=length))
```

### 5. Initialize & Seed Database

```bash
# From the backend folder
flask init-db
```

### 6. Run the API

```bash
flask run --port 5000
```

### 7. Testing Endpoints

* **Register**: `POST /register`
* **Get Assets**: `GET /assets`
* **Create Transaction**: `POST /transaction`
* **List Transactions**: `GET /transactions?user_id=...`
* **Fetch Stock**: `GET /stock/:symbol`
* **Batch Prices**: `GET /prices?assets=TSLA,AAPL,BTC`

---

## Part C: Frontend

We built a simple, responsive UI with three HTML pages—Login, Register, and Dashboard—plus accompanying CSS and JavaScript files:

### 1. **Login Page** (`index.html`)

* **Purpose**: Allow existing users to enter their `user_id` and sign in.
* **Key Features**:

  * Icon and branding (Font Awesome wallet icon).
  * Simple form with user ID input and submit button.
  * Link to the Register page for new users.
* **Files**:

  * `index.html` (structure)
  * `styles.css` (global styles)
  * `js/login.js` (AJAX POST to `/register` and result handling)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- ... meta tags, title, stylesheets ... -->
</head>
<body>
  <div class="container">
    <div class="login-card">
      <div class="logo"><i class="fas fa-wallet"></i></div>
      <h1>Asset Manager</h1>
      <form id="login-form">
        <div class="input-group">
          <i class="fas fa-user"></i>
          <input id="user_id" name="user_id" placeholder="User ID" required>
        </div>
        <button type="submit">Login</button>
      </form>
      <div id="login-result"></div>
      <p>Don't have an account? <a href="register.html">Register</a></p>
    </div>
  </div>
  <script src="js/login.js"></script>
</body>
</html>
```

### 2. **Register Page** (`register.html`)

* **Purpose**: Generate a new `user_id` anonymously.
* **Key Features**:

  * Prominent "Register" button to trigger user creation.
  * Displays the new ID or error messages.
  * Link back to the Login page.
* **Files**:

  * `register.html` (structure)
  * `js/register.js` (AJAX POST to `/register`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- ... -->
</head>
<body>
  <div class="container">
    <div class="login-card">
      <div class="logo"><i class="fas fa-wallet"></i></div>
      <h1>Asset Manager</h1>
      <button id="register-btn">Generate User ID</button>
      <div id="register-result"></div>
      <p>Already have an account? <a href="index.html">Login</a></p>
    </div>
  </div>
  <script src="js/register.js"></script>
</body>
</html>
```

### 3. **Dashboard Page** (`dashboard.html`)

* **Purpose**: Main interface for viewing assets, creating transactions, and analytics.
* **Key Features**:

  * **Sidebar Navigation**: Dashboard, Available Assets, New Transaction, Transactions, Analytics.
  * **Top Bar**: Page title & description, refresh button, date display, theme toggle.
  * **Content Area**: Dynamically rendered by `dashboard.js`.
  * **Cache Status** indicator (shows when data is served from cache).
* **Files**:

  * `dashboard.html` (layout)
  * `dashboard.css` (sidebar & content styles)
  * `js/dashboard.js` (fetch assets, transactions, live prices; render tables & charts via Chart.js)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- ... meta tags, title, Chart.js, stylesheets ... -->
</head>
<body>
  <div class="dashboard-container">
    <div class="sidebar"> <!-- logo, user info, nav items, logout --> </div>
    <div class="main-content">
      <div class="top-bar"> <!-- page info, actions --> </div>
      <div id="cache-status"></div>
      <div id="content" class="dashboard-content"></div>
    </div>
  </div>
  <script src="js/dashboard.js"></script>
</body>
</html>
```

### 4. **Styling & Scripts**

* **CSS**: `styles.css` for global resets, typography, and form/card styling; `dashboard.css` for flex/grid layout of the dashboard.
* **JavaScript**:

  * `login.js` & `register.js`: simple `fetch()` calls and DOM updates.
  * `dashboard.js`: modular functions to load each view, handle user interactions, and integrate real-time data with Chart.js.

---

## 🛠️ Troubleshooting

### Common Issues

1. **Backend Connection Error**
   - Ensure Flask is running on port 5000
   - Check that CORS is properly configured in the backend
   - Verify your .env file has correct configuration

2. **Database Connection Issues**
   - Verify your DB_CONNECTION_URI is correct
   - If using Files.io, ensure your account has active database permissions
   - For local database, check that the path is accessible and writable

3. **API Rate Limiting**
   - Alpha Vantage has rate limits on free tier accounts
   - Consider implementing additional caching for price data
   - Monitor your API usage in the Alpha Vantage dashboard

4. **Blank Dashboard**
   - Check browser console for JavaScript errors
   - Verify all frontend files are in the correct locations
   - Ensure backend endpoints are accessible from the browser

---

## 📚 Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [Alpha Vantage API Documentation](https://www.alphavantage.co/documentation/)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- [Files.io Documentation](https://docs.files.io/)

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
