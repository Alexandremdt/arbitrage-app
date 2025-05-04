import React from 'react';

export const ArbitrageTable = ({ data }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Pair</th>
            <th className="px-4 py-2 text-left">Price</th>
            <th className="px-4 py-2 text-left">Spread</th>
            <th className="px-4 py-2 text-left">Signal</th>
          </tr>
        </thead>
        <tbody>
          <tr className="hover:bg-gray-800">
            <td className="px-4 py-2">{data.symbol1.symbol}</td>
            <td className="px-4 py-2">{data.symbol1.price.toFixed(2)}</td>
            <td className="px-4 py-2" rowSpan="2">
              {data.arbitrage.spread}%
            </td>
            <td className="px-4 py-2" rowSpan="2">
              <span className={`px-2 py-1 rounded ${
                data.arbitrage.signal === 'ARBITRAGE' 
                  ? 'bg-green-600' 
                  : 'bg-gray-600'
              }`}>
                {data.arbitrage.signal}
              </span>
            </td>
          </tr>
          <tr className="hover:bg-gray-800">
            <td className="px-4 py-2">{data.symbol2.symbol}</td>
            <td className="px-4 py-2">{data.symbol2.price.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};