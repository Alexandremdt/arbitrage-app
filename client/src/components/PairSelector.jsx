import React from 'react';

export const PairSelector = ({ 
  selectedPair, 
  comparisonPair, 
  availableMarkets, 
  onChange 
}) => {
  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Market Selection</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Primary Pair:</label>
          <select
            value={selectedPair}
            onChange={(e) => onChange(e.target.value, comparisonPair)}
            className="w-full p-2 bg-gray-700 rounded"
          >
            {availableMarkets.binance?.map(pair => (
              <option key={pair} value={pair}>{pair}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Comparison Pair:</label>
          <select
            value={comparisonPair}
            onChange={(e) => onChange(selectedPair, e.target.value)}
            className="w-full p-2 bg-gray-700 rounded"
          >
            {availableMarkets.binance?.map(pair => (
              <option key={pair} value={pair}>{pair}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};