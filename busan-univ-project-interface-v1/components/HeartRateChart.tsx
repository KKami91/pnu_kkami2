import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';
import { format, parseISO, subDays } from 'date-fns';

interface DataItem {
  ds: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
}

interface HeartRateChartsProps {
  data: DataItem[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow">
        <p className="text-sm font-bold">{`Date: ${label}`}</p>
        <p className="text-sm text-blue-600">{`Predicted: ${payload[0].value.toFixed(2)} BPM`}</p>
        <p className="text-sm text-green-600">{`Lower: ${payload[1].value.toFixed(2)} BPM`}</p>
        <p className="text-sm text-red-600">{`Upper: ${payload[2].value.toFixed(2)} BPM`}</p>
      </div>
    );
  }
  return null;
};

const HeartRateCharts: React.FC<HeartRateChartsProps> = ({ data }) => {
  const formattedData = data.map(item => ({
    ...item,
    ds: format(parseISO(item.ds), 'yyyy-MM-dd HH:mm'),
  }));

  const lastDate = parseISO(data[data.length - 1].ds);
  const predictionStartDate = subDays(lastDate, 3);

  const historicalData = formattedData.filter(item => parseISO(item.ds) < predictionStartDate);
  const predictedData = formattedData.filter(item => parseISO(item.ds) >= predictionStartDate);

  const renderChart = (chartData: any[], title: string, showHistorical: boolean = false) => (
    <div className="w-full h-[400px] bg-white p-4 rounded-lg shadow-lg mb-8">
      <h2 className="text-xl font-bold mb-4 text-center">{title}</h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} />
          <Area
            type="monotone"
            dataKey="yhat_lower"
            stackId="1"
            stroke="none"
            fill="#8884d8"
            fillOpacity={0.2}
          />
          <Area
            type="monotone"
            dataKey="yhat_upper"
            stackId="1"
            stroke="none"
            fill="#8884d8"
            fillOpacity={0.2}
          />
          {showHistorical && (
            <Line
              type="monotone"
              dataKey="yhat"
              stroke="#82ca9d"
              name="Historical Data"
              dot={false}
              strokeWidth={2}
            />
          )}
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

  return (
    <div>
      {renderChart(formattedData, "Complete Heart Rate Data (Historical + Predicted)", true)}
      {renderChart(predictedData, "Predicted Heart Rate Data (Last 3 Days)")}
    </div>
  );
};

export default HeartRateCharts;