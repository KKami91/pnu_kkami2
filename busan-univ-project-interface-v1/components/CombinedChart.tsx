import React, { useState, useCallback } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { format, parseISO } from 'date-fns';

interface CombinedChartProps {
  analysisData: any[];
  predictionData: any[];
  stepData: any[];
  calorieData: any[];
  globalStartDate: Date;
  globalEndDate: Date;
}

type ChartVisibility = {
  calorie: boolean;
  step: boolean;
  bpm: boolean;
  sdnn: boolean;
  rmssd: boolean;
};

const CombinedChart: React.FC<CombinedChartProps> = ({
  analysisData,
  predictionData,
  stepData,
  calorieData,
  globalStartDate,
  globalEndDate,
}) => {
  const [visibleCharts, setVisibleCharts] = useState<ChartVisibility>({
    calorie: true,
    step: true,
    bpm: true,
    sdnn: true,
    rmssd: true,
  });

  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);

  const toggleChart = (chartName: keyof ChartVisibility) => {
    setVisibleCharts(prev => ({
      ...prev,
      [chartName]: !prev[chartName]
    }));
  };

  const combinedData = analysisData.map(item => {
    const matchingPrediction = predictionData.find(p => p.ds === item.ds);
    const matchingStep = stepData.find(s => s.ds === item.ds);
    const matchingCalorie = calorieData.find(c => c.ds === item.ds);
    return {
      ...item,
      bpm: matchingPrediction?.y,
      step: matchingStep?.step || 0,
      calorie: matchingCalorie?.calorie || 0,
    };
  });

  const handleBrushChange = useCallback((newDomain: any) => {
    if (newDomain && newDomain.startIndex !== undefined && newDomain.endIndex !== undefined) {
      setBrushDomain([newDomain.startIndex, newDomain.endIndex]);
    }
  }, []);

  return (
    <div>
      <div className="mb-4">
        {(Object.keys(visibleCharts) as Array<keyof ChartVisibility>).map((chartName) => (
          <label key={chartName} className="mr-4">
            <input
              type="checkbox"
              checked={visibleCharts[chartName]}
              onChange={() => toggleChart(chartName)}
            />
            {' '}{chartName.toUpperCase()}a
          </label>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={600}>
        <ComposedChart data={combinedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="ds"
            tickFormatter={(tick) => format(parseISO(tick), 'MM-dd HH:mm')}
          />
          <YAxis yAxisId="left" label={{ value: 'HRV (ms) / BPM', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'Steps / Calories', angle: 90, position: 'insideRight' }} />
          <Tooltip />
          <Legend />
          <Brush
            dataKey="ds"
            height={30}
            stroke="#8884d8"
            onChange={handleBrushChange}
            startIndex={brushDomain ? brushDomain[0] : undefined}
            endIndex={brushDomain ? brushDomain[1] : undefined}
          />
          {visibleCharts.calorie && (
            <Bar yAxisId="right" dataKey="calorie" fill="#8884d8" name="Calories" />
          )}
          {visibleCharts.step && (
            <Bar yAxisId="right" dataKey="step" fill="#82ca9d" name="Steps" />
          )}
          {visibleCharts.bpm && (
            <Line yAxisId="left" type="monotone" dataKey="bpm" stroke="#ff7300" name="BPM" />
          )}
          {visibleCharts.sdnn && (
            <Line yAxisId="left" type="monotone" dataKey="sdnn" stroke="#8884d8" name="SDNN" />
          )}
          {visibleCharts.rmssd && (
            <Line yAxisId="left" type="monotone" dataKey="rmssd" stroke="#82ca9d" name="RMSSD" />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CombinedChart;