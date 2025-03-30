# # Stock Prediction System

## Project Overview

This project implements a stock prediction system that leverages multiple deep learning models to forecast stock prices. The system consists of three main components:

1. **Model Comparison**: Analysis of four different deep learning models for stock prediction
2. **Backend**: A **Flask-based** API server to handle prediction requests
3. **Frontend**: A **React-based** web interface for user interaction

## Model Comparison

- Single-layer LSTM (Long Short-Term Memory)
- Two-layer LSTM
- GRU (Gated Recurrent Unit)
- RNN (Recurrent Neural Network)

Based on the comparison results, the GRU model was selected for implementation in the production system due to its superior 

## Setup and Running

### Backend Setup

1. Navigate to the backend directory:

   ```
   cd backend
   ```

2. Install dependencies:

   ```
   pip install -r requirements.txt
   ```

3. Start the Flask server:

   ```
   python app.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```
   cd frontend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the development server:

   ```
   npm run dev
   ```

   The frontend will be available at http://localhost:3000
