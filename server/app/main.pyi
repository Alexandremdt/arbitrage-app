import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import pandas as pd
import numpy as np
import ccxt
import aiohttp
from datetime import datetime
from typing import Dict, List, Optional

app = FastAPI(
    title="Arbitrage USDT/GOLD API",
    description="API pour l'analyse d'arbitrage entre USDT et l'or",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
class Config:
    BINANCE_PAIRS = ["XAU/USDT", "PAXG/USDT", "GOLD/USDT"]
    YAHOO_SYMBOLS = ["GC=F"]  # Gold Futures
    UPDATE_INTERVAL = 60  # seconds

config = Config()

# Clients d'échange
class ExchangeService:
    def __init__(self):
        self.binance = ccxt.binance({
            'enableRateLimit': True,
            'options': {
                'defaultType': 'spot',
                'adjustForTimeDifference': True
            }
        })
        self.session = aiohttp.ClientSession()
    
    async def get_binance_data(self, pair: str) -> Optional[Dict]:
        try:
            ticker = await self.binance.fetch_ticker(pair)
            ohlcv = await self.binance.fetch_ohlcv(pair, '1m', limit=100)
            
            return {
                'exchange': 'binance',
                'symbol': pair,
                'price': float(ticker['last']),
                'volume': float(ticker['baseVolume']),
                'timestamp': self.binance.iso8601(ticker['timestamp']),
                'ohlcv': pd.DataFrame(
                    ohlcv, 
                    columns=['timestamp', 'open', 'high', 'low', 'close', 'volume']
                )
            }
        except Exception as e:
            print(f"Error fetching Binance data for {pair}: {str(e)}")
            return None
    
    async def get_yahoo_data(self, symbol: str) -> Optional[Dict]:
        try:
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1m&range=1d"
            async with self.session.get(url) as response:
                data = await response.json()
                
                price = data['chart']['result'][0]['meta']['regularMarketPrice']
                timestamps = data['chart']['result'][0]['timestamp']
                ohlc = data['chart']['result'][0]['indicators']['quote'][0]
                
                df = pd.DataFrame({
                    'timestamp': [datetime.utcfromtimestamp(ts) for ts in timestamps],
                    'open': ohlc['open'],
                    'high': ohlc['high'],
                    'low': ohlc['low'],
                    'close': ohlc['close'],
                    'volume': ohlc['volume']
                })
                
                return {
                    'exchange': 'yahoo',
                    'symbol': symbol,
                    'price': float(price),
                    'volume': float(df['volume'].iloc[-1]),
                    'timestamp': datetime.utcnow().isoformat(),
                    'ohlcv': df.tail(100)  # Last 100 data points
                }
        except Exception as e:
            print(f"Error fetching Yahoo data for {symbol}: {str(e)}")
            return None
    
    async def close(self):
        await self.session.close()

# Stratégies d'arbitrage
class ArbitrageEngine:
    @staticmethod
    def calculate_bollinger_bands(df: pd.DataFrame, window=20, num_std=2) -> Dict:
        df['ma'] = df['close'].rolling(window=window).mean()
        df['std'] = df['close'].rolling(window=window).std()
        df['upper'] = df['ma'] + (df['std'] * num_std)
        df['lower'] = df['ma'] - (df['std'] * num_std)
        
        current = df.iloc[-1].to_dict()
        signal = 'SELL' if current['close'] > current['upper'] else 'BUY' if current['close'] < current['lower'] else 'HOLD'
        
        return {
            'signal': signal,
            'indicators': {
                'moving_average': current['ma'],
                'upper_band': current['upper'],
                'lower_band': current['lower'],
                'current_price': current['close']
            }
        }
    
    @staticmethod
    def calculate_spread_arbitrage(price1: float, price2: float, threshold=0.01) -> Dict:
        spread = abs(price1 - price2) / min(price1, price2)
        signal = 'ARBITRAGE' if spread > threshold else 'NO_OPPORTUNITY'
        return {
            'signal': signal,
            'spread': round(spread * 100, 2),  # Percentage
            'price1': price1,
            'price2': price2,
            'threshold': threshold * 100
        }

# Initialisation
exchange = ExchangeService()
engine = ArbitrageEngine()

# Endpoints API
@app.get("/api/markets")
async def get_available_markets():
    return {
        "binance": config.BINANCE_PAIRS,
        "yahoo": config.YAHOO_SYMBOLS
    }

@app.get("/api/analyze/{symbol}")
async def analyze_symbol(symbol: str):
    # Determine source based on symbol
    if symbol in config.BINANCE_PAIRS:
        data = await exchange.get_binance_data(symbol)
    elif symbol in config.YAHOO_SYMBOLS:
        data = await exchange.get_yahoo_data(symbol)
    else:
        raise HTTPException(status_code=404, detail="Symbol not supported")
    
    if not data:
        raise HTTPException(status_code=500, detail="Failed to fetch data")
    
    analysis = engine.calculate_bollinger_bands(data['ohlcv'])
    return {
        "metadata": {
            "symbol": data['symbol'],
            "exchange": data['exchange'],
            "timestamp": data['timestamp']
        },
        "price_data": {
            "current": data['price'],
            "volume": data['volume']
        },
        "analysis": analysis
    }

@app.get("/api/arbitrage/{symbol1}/{symbol2}")
async def analyze_arbitrage(symbol1: str, symbol2: str, threshold: float = 0.01):
    # Get first symbol data
    if symbol1 in config.BINANCE_PAIRS:
        data1 = await exchange.get_binance_data(symbol1)
    elif symbol1 in config.YAHOO_SYMBOLS:
        data1 = await exchange.get_yahoo_data(symbol1)
    else:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol1} not supported")
    
    # Get second symbol data
    if symbol2 in config.BINANCE_PAIRS:
        data2 = await exchange.get_binance_data(symbol2)
    elif symbol2 in config.YAHOO_SYMBOLS:
        data2 = await exchange.get_yahoo_data(symbol2)
    else:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol2} not supported")
    
    if not data1 or not data2:
        raise HTTPException(status_code=500, detail="Failed to fetch data for one or both symbols")
    
    # Calculate arbitrage
    arbitrage = engine.calculate_spread_arbitrage(data1['price'], data2['price'], threshold)
    
    return {
        "symbol1": {
            "symbol": data1['symbol'],
            "exchange": data1['exchange'],
            "price": data1['price']
        },
        "symbol2": {
            "symbol": data2['symbol'],
            "exchange": data2['exchange'],
            "price": data2['price']
        },
        "arbitrage": arbitrage
    }

@app.on_event("shutdown")
async def shutdown_event():
    await exchange.close()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
