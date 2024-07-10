import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO, isValid } from 'date-fns';

interface AnalysisDataItem {
  ds: string;
  sdnn: number;
  rmssd: number;
}

interface HeartRateDataItem {
  ds: string;
  y: number;
}

interface AnalysisChartProps {
  analysisData: AnalysisDataItem[];
  heartRateData: HeartRateDataItem[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow">
        <p className="text-sm font-bold text-black">{`Date: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm text-black">
            {`${entry.name}: ${entry.value?.toFixed(2) ?? 'N/A'} ${entry.name === 'BPM' ? 'BPM' : 'ms'}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AnalysisChart: React.FC<AnalysisChartProps> = ({ analysisData, heartRateData }) => {
  if (!Array.isArray(analysisData) || !Array.isArray(heartRateData) || analysisData.length === 0 || heartRateData.length === 0) {
    return <div className="text-center text-red-500">No valid data available for the chart.</div>;
  }

  const formattedAnalysisData = analysisData
    .filter(item => item && typeof item === 'object' && 'ds' in item)
    .map(item => {
      const parsedDate = parseISO(item.ds);
      return {
        ...item,
        ds: isValid(parsedDate) ? format(parsedDate, 'yyyy-MM-dd HH:mm') : 'Invalid Date',
      };
    })
    .filter(item => item.ds !== 'Invalid Date');

  const formattedHeartRateData = heartRateData
    .filter(item => item && typeof item === 'object' && 'ds' in item)
    .map(item => {
      const parsedDate = parseISO(item.ds);
      return {
        ...item,
        ds: isValid(parsedDate) ? format(parsedDate, 'yyyy-MM-dd HH:mm') : 'Invalid Date',
      };
    })
    .filter(item => item.ds !== 'Invalid Date');

  if (formattedAnalysisData.length === 0 || formattedHeartRateData.length === 0) {
    return <div className="text-center text-red-500">No valid dates found in the data.</div>;
  }

  // Merge analysis data and heart rate data
  const mergedData = formattedAnalysisData.map(analysisItem => {
    const matchingHeartRateItem = formattedHeartRateData.find(heartRateItem => heartRateItem.ds === analysisItem.ds);
    return {
      ...analysisItem,
      bpm: matchingHeartRateItem ? matchingHeartRateItem.y : null,
    };
  });

  return (
    <div className="w-full h-[600px] bg-white p-4 rounded-lg shadow-lg mb-8">
      <h2 className="text-xl font-bold mb-4 text-black text-center">Heart Rate Analysis</h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={mergedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="ds"
            tick={{ fill: '#666', fontSize: 12 }}
            tickFormatter={(tick) => format(new Date(tick), 'MM-dd HH:mm')}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: '#666', fontSize: 12 }}
            domain={['auto', 'auto']}
            label={{ value: 'SDNN/RMSSD (ms)', angle: -90, position: 'insideLeft', fill: '#666' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: '#666', fontSize: 12 }}
            domain={['auto', 'auto']}
            label={{ value: 'BPM', angle: 90, position: 'insideRight', fill: '#666' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="sdnn"
            stroke="#8884d8"
            name="SDNN"
            dot={false}
            strokeWidth={2}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="rmssd"
            stroke="#82ca9d"
            name="RMSSD"
            dot={false}
            strokeWidth={2}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="bpm"
            stroke="#ffc658"
            name="BPM"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalysisChart;