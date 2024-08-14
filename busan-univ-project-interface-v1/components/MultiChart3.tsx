import React, { useState, useCallback, useMemo } from 'react';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { format, parseISO } from 'date-fns';

interface DataItem {
  ds: string;
  bpm?: number;
  step?: number;
  calorie?: number;
  min_pred_bpm: number | null;
}

interface MultiChartProps {
  bpmData: DataItem[];
  stepData: DataItem[];
  calorieData: DataItem[];
  predictMinuteData: DataItem[];
  globalStartDate: Date;
  globalEndDate: Date;
  onBrushChange: (domain: [number, number] | null) => void;
}

const MultiChart: React.FC<MultiChartProps> = ({
  bpmData,
  stepData,
  calorieData,
  predictMinuteData,
  globalStartDate,
  globalEndDate,
  onBrushChange,
}) => {
  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);

  const combinedData = useMemo(() => {
    const allData = [...bpmData, ...stepData, ...calorieData, ...predictMinuteData];
    return allData.reduce((acc, curr) => {
      const existingItem = acc.find(item => item.ds === curr.ds);
      if (existingItem) {
        return acc.map(item => 
          item.ds === curr.ds ? { ...item, ...curr } : item
        );
      }
      return [...acc, curr];
    }, [] as DataItem[]);
  }, [bpmData, stepData, calorieData, predictMinuteData]);

  const handleBrushChange = useCallback((newBrushDomain: any) => {
    if (newBrushDomain && newBrushDomain.length === 2) {
      setBrushDomain(newBrushDomain);
      onBrushChange(newBrushDomain);
    } else {
      setBrushDomain(null);
      onBrushChange(null);
    }
  }, [onBrushChange]);

  const renderChart = (dataKey: string, color: string, yAxisLabel: string, ChartType: typeof LineChart | typeof BarChart = LineChart) => (
    <div className="w-full h-60 mb-4">
      <ResponsiveContainer width="100%" height="100%">
        <ChartType data={combinedData} syncId="healthMetrics">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="ds" 
            tickFormatter={(tick) => format(new Date(tick), 'MM-dd HH:mm')}
          />
          <YAxis 
            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} 
            domain={['auto', 'auto']}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
          />
          <Legend />
          {ChartType === LineChart ? (
            <Line type="monotone" dataKey={dataKey} stroke={color} dot={false} />
          ) : (
            <Bar dataKey={dataKey} fill={color} />
          )}
        </ChartType>
      </ResponsiveContainer>
    </div>
  );

  const charts = [
    { key: 'bpm', color: '#8884d8', label: 'BPM', type: LineChart },
    { key: 'pred_bpm', color: '#82ca9d', label: 'Predicted BPM', type: LineChart },
    { key: 'step', color: '#ffc658', label: 'Steps', type: BarChart },
    { key: 'calorie', color: '#ff7300', label: 'Calories', type: BarChart },
  ];

  return (
    <div className='bg-white p-4 rounded-lg shadow'>
      <div style={{ height: '100px', marginBottom: '20px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={combinedData} syncId="healthMetrics">
            <XAxis 
              dataKey="ds" 
              tickFormatter={(tick) => format(new Date(tick), 'MM-dd HH:mm')}
            />
            <Brush 
              dataKey="ds" 
              height={30} 
              stroke="#8884d8" 
              onChange={handleBrushChange}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {charts.map(chart => (
        <div key={chart.key}>
          {renderChart(chart.key, chart.color, chart.label, chart.type)}
        </div>
      ))}
    </div>
  );
};

export default MultiChart;