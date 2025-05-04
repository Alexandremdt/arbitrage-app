import React from 'react';

const signalColors = {
  BUY: 'from-green-600 to-green-800',
  SELL: 'from-red-600 to-red-800',
  HOLD: 'from-gray-600 to-gray-800',
  ARBITRAGE: 'from-purple-600 to-purple-800'
};

export const SignalIndicator = ({ signal, indicators }) => {
  return (
    <div className={`bg-gradient-to-r ${signalColors[signal] || 'from-gray-800 to-gray-900'} 
      p-4 rounded-lg shadow-lg`}>
      <h3 className="text-xl font-bold mb-1">Signal</h3>
      <p className="text-3xl font-extrabold mb-2">{signal}</p>
      {indicators && (
        <div className="text-sm">
          <p>Price: {indicators.current_price.toFixed(2)}</p>
          <p>MA: {indicators.moving_average.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
};