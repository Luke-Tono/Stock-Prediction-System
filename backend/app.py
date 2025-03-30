"""
Stock Price Prediction API using Flask

This API allows users to predict future stock prices using a pre-trained GRU model.
It supports fetching real-time stock data, processing it, and making predictions.

Endpoints:
- `/api/predict` - Predicts future stock prices for a given stock symbol.
- `/api/stocks` - Returns a list of available stock symbols.

"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler
import yfinance as yf
import datetime
import os
import joblib

app = Flask(__name__)
CORS(app) 

model = None
scaler = None
WINDOW_SIZE = 60 

MODEL_PATH = "./model/model_GRU.keras"  
SCALER_PATH = "./model/scaler.pkl"  

def load_saved_model():
    """Load the pre-trained model."""
    global model, scaler
    
    try:
        print(f"Loading model: {MODEL_PATH}")
        model = load_model(MODEL_PATH)
        print("Model loaded successfully")

        if os.path.exists(SCALER_PATH):
            scaler = joblib.load(SCALER_PATH)
            print(f"Loaded scaler: {SCALER_PATH}")
        else:
            print("Scaler not found, creating a new MinMaxScaler")
            scaler = MinMaxScaler(feature_range=(0, 1))

            df = yf.download('AAPL', start=datetime.datetime.now() - datetime.timedelta(days=365), end=datetime.datetime.now())
            scaler.fit(df['Close'].values.reshape(-1, 1))

            os.makedirs(os.path.dirname(SCALER_PATH), exist_ok=True)
            joblib.dump(scaler, SCALER_PATH)
            print(f"New scaler created and saved: {SCALER_PATH}")
        
        return True
    except Exception as e:
        print(f"Error loading model {e}")
        return False

def prepare_data(symbol):
    """ Fetches recent stock data for prediction"""
    end_date = datetime.datetime.now()

    start_date = end_date - datetime.timedelta(days=WINDOW_SIZE*2)
    df = yf.download(symbol, start=start_date, end=end_date)
    
    if df.empty:
        raise ValueError(f"Unable to fetch data for {symbol}")

    data = df['Close'].values.reshape(-1, 1)

    scaled_data = scaler.transform(data)

    X_predict = []
    X_predict.append(scaled_data[-WINDOW_SIZE:, 0])
    X_predict = np.array(X_predict)
    X_predict = np.reshape(X_predict, (X_predict.shape[0], X_predict.shape[1], 1))
    
    return X_predict, df['Close'].iloc[-1]

@app.route('/api/predict', methods=['GET'])
def predict():
    """Predict future stock prices"""
    symbol = request.args.get('symbol', default='AAPL')
    days = int(request.args.get('days', default=7))
    
    try:
        if model is None:
            success = load_saved_model()
            if not success:
                return jsonify({'error': 'Model loading failed'}), 500

        X_predict, last_price = prepare_data(symbol)

        predictions = []
        next_input = X_predict[0]
        current_date = datetime.datetime.now()
        
        for i in range(days):

            current_date = current_date + datetime.timedelta(days=1)

            while current_date.weekday() >= 5:
                current_date = current_date + datetime.timedelta(days=1)
                
            pred = model.predict(next_input.reshape(1, next_input.shape[0], 1))
            price = float(scaler.inverse_transform(pred.reshape(-1, 1))[0][0])
            
            predictions.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'predictedPrice': price
            })

            next_input = np.append(next_input[1:], [[pred[0][0]]], axis=0)
        
        return jsonify({
            'symbol': symbol,
            'lastPrice': float(last_price),
            'predictions': predictions
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stocks', methods=['GET'])
def get_stock_list():
    """ Retrieve a list of available stock symbols """
    stocks = [
        {"symbol": "AAPL", "name": "Apple Inc."},
        {"symbol": "MSFT", "name": "Microsoft Corporation"},
        {"symbol": "GOOGL", "name": "Alphabet Inc."},
        {"symbol": "AMZN", "name": "Amazon.com Inc."},
        {"symbol": "META", "name": "Meta Platforms Inc."},
        {"symbol": "TSLA", "name": "Tesla Inc."},
        {"symbol": "NVDA", "name": "NVIDIA Corporation"},
        {"symbol": "JPM", "name": "JPMorgan Chase & Co."}
    ]
    return jsonify(stocks)

if __name__ == '__main__':
    with app.app_context():
        load_saved_model()
    app.run(debug=True, host='0.0.0.0', port=5000)