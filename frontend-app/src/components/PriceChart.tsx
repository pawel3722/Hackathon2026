import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface PriceChartProps {
  priceHistory: number[];
}

export const PriceChart: React.FC<PriceChartProps> = ({ priceHistory }) => {
    const data = priceHistory.map((price, index) => ({
    turn: index + 1,
    price: Number(price.toFixed(2)),
  }));

  const isPositiveTrend =
    priceHistory.length >= 2
      ? priceHistory[priceHistory.length - 1] >= priceHistory[0]
      : true;

  const lineColor = isPositiveTrend ? '#10b981' : '#ef4444'; // Kolory z palety Tailwind (emerald-500 / red-500)

  return (
    <div style={{ width: 360, height: 240, minWidth: 360 }}>
      <LineChart width={360} height={240} data={data} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />

        <XAxis
          dataKey="turn"
          stroke="#9ca3af" // Szary kolor osi
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          tickMargin={10}
          minTickGap={40}
        />

        <YAxis
          domain={['auto', 'auto']}
          stroke="#9ca3af"
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          tickFormatter={(value) => `${value} PLN`}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: 'none',
            borderRadius: '8px',
            color: '#f9fafb'
          }}
          itemStyle={{ color: lineColor }}
          labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
          labelFormatter={(label) => `Turn: ${label}`}
          formatter={(value: any) => [`${Number(value).toFixed(2)} PLN`, 'Price']}
        />

        <Line
          type="monotone"
          dataKey="price"
          stroke={lineColor}
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 6, fill: lineColor, stroke: '#1f2937', strokeWidth: 2 }}
        />
      </LineChart>
    </div>
  );
};