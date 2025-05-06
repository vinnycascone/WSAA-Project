import os
import random
import string
import requests
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from flask_cors import CORS

# Load .env
load_dotenv()

# Alpha Vantage API key (ensure this is set in your .env file)
ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
API_BASE_URL = 'https://www.alphavantage.co/query'

app = Flask(__name__)
CORS(app)  # <-- add CORS headers on every response

# Database config
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DB_CONNECTION_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- Models --- #

class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.String(10), primary_key=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())


class Asset(db.Model):
    __tablename__ = 'assets'
    asset_id = db.Column(db.String(10), primary_key=True)
    asset_name = db.Column(db.String(50), nullable=False)
    asset_type = db.Column(db.String(20), nullable=False)


class Transaction(db.Model):
    __tablename__ = 'transactions'
    transaction_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(10),
                        db.ForeignKey('users.user_id',
                                      name='fk_transactions_user_id'),
                        nullable=False)
    asset_id = db.Column(db.String(10),
                         db.ForeignKey('assets.asset_id',
                                       name='fk_transactions_asset_id'),
                         nullable=False)
    transaction_type = db.Column(db.String(10), nullable=False)  # "Buy" or "Sell"
    quantity = db.Column(db.Numeric(20, 4), nullable=False)
    price = db.Column(db.Numeric(20, 2), nullable=False)
    transaction_date = db.Column(db.DateTime, server_default=db.func.now())


# --- Utility --- #

def generate_user_id(length=6):
    chars = string.ascii_lowercase + string.digits
    return ''.join(random.choices(chars, k=length))


# --- API Endpoints --- #

@app.route('/register', methods=['POST'])
def register():
    user_id = generate_user_id()
    while User.query.filter_by(user_id=user_id).first():
        user_id = generate_user_id()
    new_user = User(user_id=user_id)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'user_id': new_user.user_id}), 201


@app.route('/assets', methods=['GET'])
def get_assets():
    assets = Asset.query.all()
    return jsonify({
        'assets': [
            {
                'asset_id': a.asset_id,
                'asset_name': a.asset_name,
                'asset_type': a.asset_type
            }
            for a in assets
        ]
    }), 200


@app.route('/transaction', methods=['POST'])
def create_transaction():
    data = request.get_json() or {}
    required = ['user_id', 'asset_id', 'transaction_type', 'quantity', 'price']
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({'error': f"Missing fields: {', '.join(missing)}"}), 400

    tx = Transaction(
        user_id=data['user_id'],
        asset_id=data['asset_id'],
        transaction_type=data['transaction_type'],
        quantity=data['quantity'],
        price=data['price']
    )
    db.session.add(tx)
    db.session.commit()
    return jsonify({'transaction_id': tx.transaction_id}), 201

@app.route('/transactions', methods=['GET'])
def list_transactions():
    """
    Querystring params:
      - user_id: required
    Returns all transactions for that user.
    """
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "Missing required query param: user_id"}), 400

    # ensure user exists?
    if User.query.get(user_id) is None:
        return jsonify({"error": f"No such user: {user_id}"}), 404

    txs = Transaction.query.filter_by(user_id=user_id) \
                           .order_by(Transaction.transaction_date.desc()) \
                           .all()

    result = []
    for t in txs:
        result.append({
            "transaction_id":   t.transaction_id,
            "asset_id":         t.asset_id,
            "transaction_type": t.transaction_type,
            "quantity":         float(t.quantity),
            "price":            float(t.price),
            "date":             t.transaction_date.isoformat()
        })

    return jsonify({ "transactions": result }), 200


@app.route('/stock/<symbol>', methods=['GET'])
def get_stock_data(symbol):
    """
    Fetches real-time stock data from Alpha Vantage for the given symbol.
    Example: /stock/TSLA will return the stock data for Tesla.
    """
    # Define the API parameters for real-time stock data
    params = {
        'function': 'TIME_SERIES_INTRADAY',  # Intraday stock data
        'symbol': symbol,  # Stock symbol (e.g., TSLA, AAPL)
        'interval': '5min',  # Data interval (e.g., 5 minutes, 1 minute, etc.)
        'apikey': ALPHA_VANTAGE_API_KEY
    }

    # Make the request to Alpha Vantage API
    response = requests.get(API_BASE_URL, params=params)

    if response.status_code == 200:
        data = response.json()

        # Check if stock data is available
        if 'Time Series (5min)' in data:
            stock_data = data['Time Series (5min)']
            latest_time = list(stock_data.keys())[0]  # Get the most recent time entry
            latest_data = stock_data[latest_time]

            # Return the relevant stock data
            return jsonify({
                'symbol': symbol,
                'price': latest_data['4. close'],  # Close price at that time
                'time': latest_time
            })
        else:
            return jsonify({'error': 'No data found for the given symbol.'}), 404
    else:
        return jsonify({'error': 'Failed to fetch stock data.'}), 500


# --- Flask CLI command to init & seed the DB --- #

@app.cli.command('init-db')
def init_db():
    """Create tables and seed the assets table."""
    db.create_all()
    if Asset.query.count() == 0:
        seed = [
            Asset(asset_id='TSLA', asset_name='Tesla Inc.', asset_type='Stock'),
            Asset(asset_id='AAPL', asset_name='Apple Inc.', asset_type='Stock'),
            Asset(asset_id='GOOGL', asset_name='Alphabet Inc.', asset_type='Stock'),
            Asset(asset_id='AMZN', asset_name='Amazon.com Inc.', asset_type='Stock'),
            Asset(asset_id='BTC', asset_name='Bitcoin', asset_type='Crypto'),
            Asset(asset_id='ETH', asset_name='Ethereum', asset_type='Crypto'),
            Asset(asset_id='ADA', asset_name='Cardano', asset_type='Crypto'),
            Asset(asset_id='USD', asset_name='US Dollar', asset_type='Currency'),
            Asset(asset_id='EUR', asset_name='Euro', asset_type='Currency'),
            Asset(asset_id='GBP', asset_name='British Pound', asset_type='Currency'),
            Asset(asset_id='JPY', asset_name='Japanese Yen', asset_type='Currency'),
        ]
        db.session.bulk_save_objects(seed)
        db.session.commit()
    print("✅ Database initialized and assets seeded.")


if __name__ == '__main__':
    app.run(debug=True)
