import os
import random
import string
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

# Loading environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Getting the full database connection URI from the environment variables
db_connection_uri = os.environ.get('DB_CONNECTION_URI')

# Configuring the SQLAlchemy database URI using the Filess.io credentials (MySQL)
app.config['SQLALCHEMY_DATABASE_URI'] = db_connection_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


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
    user_id = db.Column(db.String(10), db.ForeignKey('users.user_id', name='fk_transactions_user_id'), nullable=False)
    asset_id = db.Column(db.String(10), db.ForeignKey('assets.asset_id', name='fk_transactions_asset_id'), nullable=False)
    transaction_type = db.Column(db.String(10), nullable=False)  # Expected values: "Buy" or "Sell"
    quantity = db.Column(db.Numeric(20, 4), nullable=False)
    price = db.Column(db.Numeric(20, 2), nullable=False)
    transaction_date = db.Column(db.DateTime, server_default=db.func.now())


# --- Utility Functions --- #

def generate_user_id(length=6):
    """Generate a random user id consisting of lowercase letters and digits."""
    chars = string.ascii_lowercase + string.digits
    return ''.join(random.choices(chars, k=length))


# --- API Endpoints --- #

@app.route('/register', methods=['POST'])
def register():
    """Registers a new user with a randomly generated user id."""
    user_id = generate_user_id()
    # Ensuring uniqueness by checking the database
    while User.query.filter_by(user_id=user_id).first() is not None:
        user_id = generate_user_id()
    new_user = User(user_id=user_id)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'user_id': new_user.user_id}), 201


@app.route('/assets', methods=['GET'])
def get_assets():
    """Returns a list of all available assets."""
    assets = Asset.query.all()
    assets_list = [
        {
            'asset_id': asset.asset_id,
            'asset_name': asset.asset_name,
            'asset_type': asset.asset_type
        } for asset in assets
    ]
    return jsonify({'assets': assets_list}), 200


@app.route('/transaction', methods=['POST'])
def create_transaction():
    """
    Records a transaction for a given user.
    Expects JSON with keys: 'user_id', 'asset_id', 'transaction_type', 'quantity', and 'price'
    """
    data = request.json
    required_fields = ['user_id', 'asset_id', 'transaction_type', 'quantity', 'price']
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        return jsonify({"error": f"Missing fields: {', '.join(missing_fields)}"}), 400

    new_transaction = Transaction(
        user_id=data['user_id'],
        asset_id=data['asset_id'],
        transaction_type=data['transaction_type'],
        quantity=data['quantity'],
        price=data['price']
    )
    db.session.add(new_transaction)
    db.session.commit()
    return jsonify({'transaction_id': new_transaction.transaction_id}), 201


# --- Seeding the Assets Table --- #
with app.app_context():
    db.create_all()  # Create tables if they don't exist
    if Asset.query.count() == 0:
        assets_to_add = [
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
        db.session.bulk_save_objects(assets_to_add)
        db.session.commit()

if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(debug=True)
