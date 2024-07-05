import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';
import { format, parseISO } from 'date-fns';

interface DataItem {
  ds: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
}

interface HeartRateChartProps {
  data: DataItem[];
}

const HeartRateChart: React.FC<HeartRateChartProps> = ({ data }) => {
  const formattedData = data.map(item => ({
    ...item,
    ds: format(parseISO(item.ds), 'MM-dd HH:mm'),
  }));

  return (
    <div className="w-full h-[500px] bg-white p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-center">Heart Rate Prediction vs Actual Data</h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={formattedData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="ds" 
            tick={{ fill: '#666', fontSize: 12 }}
            tickFormatter={(tick) => format(new Date(tick), 'MM-dd')}
          />
          <YAxis 
            tick={{ fill: '#666', fontSize: 12 }}
            domain={['auto', 'auto']}
            label={{ value: 'BPM', angle: -90, position: 'insideLeft', fill: '#666' }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend verticalAlign="top" height={36} />
          <Area 
            type="monotone" 
            dataKey="yhat_lower" 
            stroke="none" 
            fill="#8884d8" 
            fillOpacity={0.2}
          />
          <Area 
            type="monotone" 
            dataKey="yhat_upper" 
            stroke="none" 
            fill="#8884d8" 
            fillOpacity={0.2}
          />
          <Line 
            type="monotone" 
            dataKey="yhat" 
            stroke="#8884d8" 
            name="Predicted BPM" 
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HeartRateChart;