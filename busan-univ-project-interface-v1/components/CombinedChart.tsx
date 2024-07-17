import React, { useState, useCallback, useMemo } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from 'recharts';
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

  const [brushStart, setBrushStart] = useState<number | null>(null);
  const [brushEnd, setBrushEnd] = useState<number | null>(null);
  const [isBrushing, setIsBrushing] = useState(false);

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
        timestamp: new Date(item.ds).getTime(),
        bpm: matchingPrediction?.y,
        step: matchingStep?.step || 0,
        calorie: matchingCalorie?.calorie || 0,
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
  }, [analysisData, predictionData, stepData, calorieData]);

  const handleMouseDown = useCallback((e: any) => {
    if (e && e.activeLabel) {
      setBrushStart(e.activeLabel);
      setIsBrushing(true);
    }
  }, []);

  const handleMouseMove = useCallback((e: any) => {
    if (isBrushing && e && e.activeLabel) {
      setBrushEnd(e.activeLabel);
    }
  }, [isBrushing]);

  const handleMouseUp = useCallback(() => {
    setIsBrushing(false);
  }, []);

  const chartData = useMemo(() => {
    if (brushStart !== null && brushEnd !== null) {
      const start = Math.min(brushStart, brushEnd);
      const end = Math.max(brushStart, brushEnd);
      return combinedData.filter(d => d.timestamp >= start && d.timestamp <= end);
    }
    return combinedData;
  }, [combinedData, brushStart, brushEnd]);

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
        <ComposedChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(tick) => format(new Date(tick), 'MM-dd HH:mm')}
          />
          <YAxis yAxisId="left" label={{ value: 'HRV (ms) / BPM', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'Steps / Calories', angle: 90, position: 'insideRight' }} />
          <Tooltip labelFormatter={(label) => format(new Date(label), 'yyyy-MM-dd HH:mm')} />
          <Legend />
          {brushStart !== null && brushEnd !== null && (
            <ReferenceArea x1={brushStart} x2={brushEnd} strokeOpacity={0.3} />
          )}
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