import React from 'react';

export const PriceCard = ({ price, volume, exchange, symbol, timestamp }) => {
  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">{symbol}</h3>
      <div className="space-y-2">
        <p className="text-2xl font-bold text-yellow-400">{price.toFixed(2)}</p>
        <p className="text-sm">Volume: {volume.toFixed(2)}</p>
        <p className="text-xs text-gray-400">
          {exchange} • {new Date(timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
};