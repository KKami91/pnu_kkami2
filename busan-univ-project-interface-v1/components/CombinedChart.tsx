import React, { useState, useCallback, useMemo } from 'react';
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

  const [brushDomain, setBrushDomain] = useState<[number, number]>([
    globalStartDate.getTime(),
    globalEndDate.getTime()
  ]);

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
        timestamp: parseISO(item.ds).getTime(),
        bpm: matchingPrediction?.y,
        step: matchingStep?.step || 0,
        calorie: matchingCalorie?.calorie || 0,
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
  }, [analysisData, predictionData, stepData, calorieData]);

  const yAxisDomains = useMemo(() => {
    const leftData = combinedData.flatMap(d => [d.sdnn, d.rmssd, d.bpm].filter(v => v != null));
    const rightData = combinedData.flatMap(d => [d.step, d.calorie]);
    return {
      left: [Math.min(...leftData), Math.max(...leftData)],
      right: [0, Math.max(...rightData)],
    };
  }, [combinedData]);

  const handleBrushChange = useCallback((domain: any) => {
    if (domain && domain.startIndex !== undefined && domain.endIndex !== undefined) {
      const startTime = combinedData[domain.startIndex].timestamp;
      const endTime = combinedData[domain.endIndex].timestamp;
      setBrushDomain([startTime, endTime]);
    }
  }, [combinedData]);

  const formatDateForBrush = (time: number) => {
    return format(new Date(time), 'yyyy-MM-dd HH:mm');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: '10px', border: '1px solid #ccc' }}>
          <p className="label" style={{ color: '#ff7300', fontWeight: 'bold' }}>{format(new Date(label), 'yyyy-MM-dd HH:mm')}</p>
          {payload.map((pld: any) => (
            <p key={pld.dataKey} style={{ color: pld.color }}>
              {`${pld.name}: ${pld.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className='bg-white'>
      <div className="mb-4">
        {(Object.keys(visibleCharts) as Array<keyof ChartVisibility>).map((chartName) => (
          <label key={chartName} className="mr-4 text-blue-600">
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
        <ComposedChart data={combinedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={brushDomain}
            tickFormatter={(tick) => format(new Date(tick), 'MM-dd HH:mm')}
          />
          <YAxis 
            yAxisId="left" 
            label={{ value: 'HRV (ms) / BPM', angle: -90, position: 'insideLeft' }} 
            domain={yAxisDomains.left}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            label={{ value: 'Steps / Calories', angle: 90, position: 'insideRight' }} 
            domain={yAxisDomains.right}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Brush 
            dataKey="timestamp" 
            height={30} 
            stroke="#8884d8" 
            onChange={handleBrushChange}
            startIndex={combinedData.findIndex(d => d.timestamp >= brushDomain[0])}
            endIndex={combinedData.findIndex(d => d.timestamp >= brushDomain[1])}
            travellerWidth={10}
            gap={1}
            tickFormatter={formatDateForBrush}
          >
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(tick) => format(new Date(tick), 'MM-dd')}
            />
          </Brush>
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