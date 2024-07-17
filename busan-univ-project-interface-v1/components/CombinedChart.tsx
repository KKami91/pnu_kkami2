import React, { useState, useCallback, useMemo } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { format, parseISO, min, max } from 'date-fns';

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

  const [brushDomain, setBrushDomain] = useState<[Date, Date]>([globalStartDate, globalEndDate]);

  const toggleChart = (chartName: keyof ChartVisibility) => {
    setVisibleCharts(prev => ({
      ...prev,
      [chartName]: !prev[chartName]
    }));
  };

  const combinedData = useMemo(() => {
    return analysisData.map(item => {
      const matchingPrediction = predictionData.find(p => p.ds === item.ds);
      const matchingStep = stepData.find(s => s.ds === item.ds);
      const matchingCalorie = calorieData.find(c => c.ds === item.ds);
      return {
        ...item,
        ds: parseISO(item.ds),
        bpm: matchingPrediction?.y,
        step: matchingStep?.step || 0,
        calorie: matchingCalorie?.calorie || 0,
      };
    }).sort((a, b) => a.ds.getTime() - b.ds.getTime());
  }, [analysisData, predictionData, stepData, calorieData]);

  const handleBrushChange = useCallback((newDomain: any) => {
    if (newDomain && newDomain.startIndex !== undefined && newDomain.endIndex !== undefined) {
      const startDate = combinedData[newDomain.startIndex].ds;
      const endDate = combinedData[newDomain.endIndex].ds;
      setBrushDomain([startDate, endDate]);
    }
  }, [combinedData]);

  const domainData = useMemo(() => {
    return combinedData.filter(d => d.ds >= brushDomain[0] && d.ds <= brushDomain[1]);
  }, [combinedData, brushDomain]);

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
            {' '}{chartName.toUpperCase()}
          </label>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={600}>
        <ComposedChart data={domainData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="ds"
            type="number"
            scale="time"
            domain={[brushDomain[0].getTime(), brushDomain[1].getTime()]}
            tickFormatter={(tick) => format(new Date(tick), 'MM-dd HH:mm')}
          />
          <YAxis yAxisId="left" label={{ value: 'HRV (ms) / BPM', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'Steps / Calories', angle: 90, position: 'insideRight' }} />
          <Tooltip labelFormatter={(label) => format(new Date(label), 'yyyy-MM-dd HH:mm')} />
          <Legend />
          <Brush
            dataKey="ds"
            height={30}
            stroke="#8884d8"
            onChange={handleBrushChange}
            startIndex={combinedData.findIndex(d => d.ds.getTime() === brushDomain[0].getTime())}
            endIndex={combinedData.findIndex(d => d.ds.getTime() === brushDomain[1].getTime())}
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