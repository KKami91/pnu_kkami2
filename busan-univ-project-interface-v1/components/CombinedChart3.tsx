import React, { useState, useCallback, useMemo } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { format, parseISO } from 'date-fns';

interface DataItem {
  ds: string;
  bpm?: number;
  step?: number;
  calorie?: number;
  pred_bpm?: number;
}

interface CombinedChartProps {
  bpmData: DataItem[];
  stepData: DataItem[];
  calorieData: DataItem[];
  predictMinuteData: DataItem[];
  globalStartDate: Date;
  globalEndDate: Date;
  onBrushChange: (domain: [number, number] | null) => void;
}

const CombinedChart: React.FC<CombinedChartProps> = ({
  bpmData,
  stepData,
  calorieData,
  predictMinuteData,
  globalStartDate,
  globalEndDate,
  onBrushChange,
}) => {
  const [visibleCharts, setVisibleCharts] = useState({
    bpm: true,
    step: true,
    calorie: true,
    pred_bpm: true,
  });

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

  const handleBrushChange = useCallback((brushDomain: any) => {
    if (brushDomain && brushDomain.length === 2) {
      onBrushChange([brushDomain.start, brushDomain.end]);
    } else {
      onBrushChange(null);
    }
  }, [onBrushChange]);

  const toggleChart = (chartName: keyof typeof visibleCharts) => {
    setVisibleCharts(prev => ({ ...prev, [chartName]: !prev[chartName] }));
  };

  return (
    <div className='bg-white p-4 rounded-lg shadow'>
      <div className="mb-4 flex flex-wrap gap-4 justify-between">
        <div>
          {Object.entries(visibleCharts).map(([chartName, isVisible]) => (
            <label key={chartName} className="inline-flex items-center cursor-pointer mr-4">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={() => toggleChart(chartName as keyof typeof visibleCharts)}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="ml-2 text-gray-700">{chartName.toUpperCase()}</span>
            </label>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={600}>
        <ComposedChart data={combinedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ds" tickFormatter={(tick) => format(new Date(tick), 'MM-dd HH:mm')} />
          <YAxis yAxisId="left" label={{ value: 'BPM', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'Steps / Calories', angle: 90, position: 'insideRight' }} />
          <Tooltip 
            formatter={(value: number, name: string) => [value, name.charAt(0).toUpperCase() + name.slice(1)]} 
          />
          <Legend />
          {visibleCharts.bpm && <Line yAxisId="left" type="monotone" dataKey="bpm" stroke="#8884d8" name="BPM" dot={false} />}
          {visibleCharts.step && <Bar yAxisId="right" dataKey="step" fill="#82ca9d" name="Steps" />}
          {visibleCharts.calorie && <Bar yAxisId="right" dataKey="calorie" fill="#ffc658" name="Calories" />}
          {visibleCharts.pred_bpm && <Line yAxisId="left" type="monotone" dataKey="pred_bpm" stroke="#ff7300" name="Predicted BPM" dot={false} />}
          <Brush 
            dataKey="ds" 
            height={30} 
            stroke="#8884d8" 
            onChange={handleBrushChange}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CombinedChart;