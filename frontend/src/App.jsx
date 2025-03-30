import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  // Predefined stock list
  const predefinedStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'BABA', name: 'Alibaba Group Holding Ltd.' },
    { symbol: 'TCEHY', name: 'Tencent Holdings Ltd.' },
    { symbol: 'PDD', name: 'PDD Holdings Inc.' },
    { symbol: 'BIDU', name: 'Baidu Inc.' }
  ];

  const [stocks, setStocks] = useState(predefinedStocks);
  const [selectedStock, setSelectedStock] = useState(predefinedStocks[0]);
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [confidenceLevel, setConfidenceLevel] = useState(0.9); // 90% confidence level
  const [error, setError] = useState(null);
  const [lastPrice, setLastPrice] = useState(null);

  // Load stock list
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        // Try to get stock list from API
        const response = await axios.get(`${API_BASE_URL}/stocks`);
        // If API returns data, use the data from API
        if (response.data && response.data.length > 0) {
          setStocks(response.data);
          setSelectedStock(response.data[0]);
        } else {
          // Otherwise use predefined stock list
          setStocks(predefinedStocks);
          setSelectedStock(predefinedStocks[0]);
        }
      } catch (err) {
        // If API call fails, use predefined stock list
        console.error('Error getting stock list:', err);
        setStocks(predefinedStocks);
        setSelectedStock(predefinedStocks[0]);
      }
    };

    fetchStocks();
  }, []);

  // Handle stock selection changes
  const handleStockChange = (e) => {
    const symbol = e.target.value;
    const stock = stocks.find(s => s.symbol === symbol);
    setSelectedStock(stock);
  };

  // Perform prediction
  const handlePredictClick = async () => {
    if (!selectedStock) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/predict`, {
        params: {
          symbol: selectedStock.symbol,
          days: 7
        }
      });

      setPredictions(response.data.predictions);
      setLastPrice(response.data.lastPrice);
    } catch (err) {
      setError('Prediction failed, please try again later');
      console.error('Prediction error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate average predicted price
  const averagePredictedPrice = predictions.length
    ? (predictions.reduce((sum, p) => sum + p.predictedPrice, 0) / predictions.length).toFixed(2)
    : 0;

  // Calculate price range (based on confidence interval)
  const calculatePriceRange = (price) => {
    const uncertainty = (1 - confidenceLevel) * price * 0.2;
    return {
      low: (price - uncertainty).toFixed(2),
      high: (price + uncertainty).toFixed(2)
    };
  };

  // Check if there is an upward trend
  const hasBullishTrend = predictions.length >= 2 &&
    predictions[predictions.length - 1].predictedPrice > predictions[0].predictedPrice;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>GRU Stock Price Prediction System</h1>
      </header>

      <main className="content">
        <div className="control-panel">
          <div className="form-group">
            <label htmlFor="stock-select">Select Stock</label>
            <select
              id="stock-select"
              value={selectedStock?.symbol || ''}
              onChange={handleStockChange}
              disabled={isLoading || stocks.length === 0}
            >
              {stocks.map(stock => (
                <option key={stock.symbol} value={stock.symbol}>
                  {stock.name} ({stock.symbol})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="confidence-select">Confidence Level</label>
            <select
              id="confidence-select"
              value={confidenceLevel}
              onChange={(e) => setConfidenceLevel(parseFloat(e.target.value))}
              disabled={isLoading}
            >
              <option value={0.99}>99%</option>
              <option value={0.95}>95%</option>
              <option value={0.9}>90%</option>
              <option value={0.8}>80%</option>
            </select>
          </div>

          <button
            className="predict-button"
            onClick={handlePredictClick}
            disabled={isLoading || !selectedStock}
          >
            {isLoading ? 'Predicting...' : 'Predict Next Week'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {predictions.length > 0 && (
          <div className="results">
            <div className="summary-cards">
              <div className="card">
                <h3>Current Price</h3>
                <p className="value">${lastPrice.toFixed(2)}</p>
              </div>
              <div className="card">
                <h3>Average Predicted Price (Next Week)</h3>
                <p className="value">${averagePredictedPrice}</p>
              </div>
              <div className="card">
                <h3>{(confidenceLevel * 100)}% Confidence Interval</h3>
                <p className="value">
                  ${calculatePriceRange(parseFloat(averagePredictedPrice)).low} - ${calculatePriceRange(parseFloat(averagePredictedPrice)).high}
                </p>
              </div>
              <div className="card">
                <h3>Predicted Trend</h3>
                <p className={`value ${hasBullishTrend ? 'bullish' : 'bearish'}`}>
                  {hasBullishTrend ? 'Bullish ↑' : 'Bearish ↓'}
                </p>
              </div>
            </div>

            <div className="chart-container">
              <h2>Price Prediction Chart</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={predictions}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={['auto', 'auto']} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="predictedPrice"
                    stroke="#8884d8"
                    name="Predicted Price"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>

              <div className="data-table">
                <h3>Detailed Prediction Data</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Predicted Price</th>
                      <th>Confidence Interval</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((prediction, index) => {
                      const range = calculatePriceRange(prediction.predictedPrice);
                      return (
                        <tr key={index}>
                          <td>{prediction.date}</td>
                          <td>${prediction.predictedPrice.toFixed(2)}</td>
                          <td>${range.low} - ${range.high}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div className="disclaimer">
          <h3>Disclaimer:</h3>
          <ul>
            <li>Predictions are for reference only and do not constitute investment advice</li>
            <li>The model predicts based on historical data and cannot account for unexpected events</li>
            <li>Actual investment decisions should consider multiple factors</li>
            <li>This system uses a GRU neural network model, trained over 50 epochs</li>
            <li>The model uses past price sequences to predict future price trends</li>
          </ul>
        </div>
      </footer>
    </div>
  );
}

export default App;