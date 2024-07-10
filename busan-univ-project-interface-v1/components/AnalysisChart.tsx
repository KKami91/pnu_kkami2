import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';
import { format, parseISO, subDays, isValid } from 'date-fns';

interface DataItem {
  ds: string;
  sdnn: number;
  rmssd: number;
}

interface AnalysisChartProps {
  data: DataItem[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow">
        <p className="text-sm font-bold text-black">{`Date: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm text-black">
            {`${entry.name}: ${entry.value?.toFixed(2) ?? 'N/A'} ms`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AnalysisChart: React.FC<AnalysisChartProps> = ({ data }) => {
  console.log('Received data:', data); // 데이터 로깅

  if (!Array.isArray(data) || data.length === 0) {
    return <div className="text-center text-red-500">No valid data available for the chart.</div>;
  }

  const formattedData = data
    .filter(item => item && typeof item === 'object' && 'ds' in item)
    .map(item => {
      const parsedDate = parseISO(item.ds);
      return {
        ...item,
        ds: isValid(parsedDate) ? format(parsedDate, 'yyyy-MM-dd HH:mm') : 'Invalid Date',
      };
    })
    .filter(item => item.ds !== 'Invalid Date');

  console.log('Formatted data:', formattedData); // 포맷된 데이터 로깅

  if (formattedData.length === 0) {
    return <div className="text-center text-red-500">No valid dates found in the data.</div>;
  }

  const renderChart = (chartData: any[], title: string, dataKey: string) => {
    return (
      <div className="w-full h-[400px] bg-white p-4 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-bold mb-4 text-black text-center">{title}</h2>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="ds"
              tick={{ fill: '#666', fontSize: 12 }}
              tickFormatter={(tick) => format(new Date(tick), 'MM-dd HH:mm')}
            />
            <YAxis
              tick={{ fill: '#666', fontSize: 12 }}
              domain={['auto', 'auto']}
              label={{ value: 'ms', angle: -90, position: 'insideLeft', fill: '#666' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#8884d8"
              name={dataKey.toUpperCase()}
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div>
      {renderChart(formattedData, "SDNN Analysis", "sdnn")}
      {renderChart(formattedData, "RMSSD Analysis", "rmssd")}
    </div>
  );
};

export default AnalysisChart;