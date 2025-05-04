import React, { useState, useEffect } from 'react';
import { 
  ArbitrageTable, 
  HistoricalChart, 
  PairSelector, 
  PriceCard, 
  SignalIndicator,
  Navbar,
  AlertBanner
} from './components';
import './styles.css';

function App() {
  const [marketData, setMarketData] = useState(null);
  const [arbitrageData, setArbitrageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPair, setSelectedPair] = useState('XAU/USDT');
  const [comparisonPair, setComparisonPair] = useState('PAXG/USDT');
  const [availableMarkets, setAvailableMarkets] = useState([]);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/markets');
        const data = await response.json();
        setAvailableMarkets(data);
      } catch (err) {
        console.error("Failed to fetch markets:", err);
      }
    };
    fetchMarkets();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const marketRes = await fetch(`http://localhost:8000/api/analyze/${selectedPair}`);
      if (!marketRes.ok) throw new Error(`HTTP error! status: ${marketRes.status}`);
      const marketJson = await marketRes.json();
      setMarketData(marketJson);
      
      if (comparisonPair) {
        const arbRes = await fetch(`http://localhost:8000/api/arbitrage/${selectedPair}/${comparisonPair}?threshold=0.01`);
        if (!arbRes.ok) throw new Error(`HTTP error! status: ${arbRes.status}`);
        const arbJson = await arbRes.json();
        setArbitrageData(arbJson);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [selectedPair, comparisonPair]);

  const config = {
    updateInterval: 60,
    theme: {
      primary: 'bg-gray-900',
      secondary: 'bg-gray-800',
      accent: 'text-yellow-500',
      border: 'border-yellow-700'
    }
  };

  if (loading && !marketData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${config.theme.primary} text-gray-100`}>
      <Navbar />
      {error && <AlertBanner message={error} type="error" onDismiss={() => setError(null)} />}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="space-y-6">
            <PairSelector 
              selectedPair={selectedPair}
              comparisonPair={comparisonPair}
              availableMarkets={availableMarkets}
              onChange={(primary, comparison) => {
                setSelectedPair(primary);
                setComparisonPair(comparison);
              }}
            />
            {marketData && (
              <>
                <PriceCard 
                  price={marketData.price_data.current}
                  volume={marketData.price_data.volume}
                  exchange={marketData.metadata.exchange}
                  symbol={marketData.metadata.symbol}
                  timestamp={marketData.metadata.timestamp}
                />
                <SignalIndicator 
                  signal={marketData.analysis.signal} 
                  indicators={marketData.analysis.indicators}
                />
              </>
            )}
          </div>
          <div className="lg:col-span-2">
            {marketData && (
              <HistoricalChart 
                data={marketData.price_data} 
                ohlcv={marketData.ohlcv} 
                analysis={marketData.analysis} 
              />
            )}
          </div>
        </div>
        {arbitrageData && (
          <div className={`p-6 rounded-lg ${config.theme.secondary} shadow-lg`}>
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <span className={`mr-2 ${config.theme.accent}`}>⚖️</span>
              Arbitrage Opportunities
            </h2>
            <ArbitrageTable data={arbitrageData} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;