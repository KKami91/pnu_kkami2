import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { format, parseISO, subHours } from 'date-fns';

interface CombinedChartProps {
  hourlyData: any[];
  dailyData: any[];
  globalStartDate: Date;
  globalEndDate: Date;
  onBrushChange: (domain: [number, number] | null) => void;
}

type ChartVisibility = {
  calorie: boolean;
  step: boolean;
  bpm: boolean;
  sdnn: boolean;
  rmssd: boolean;
};

const CombinedChart: React.FC<CombinedChartProps> = ({
  hourlyData,
  dailyData,
  globalStartDate,
  globalEndDate,
  onBrushChange,
}) => {
  const [visibleCharts, setVisibleCharts] = useState<ChartVisibility>({
    calorie: true,
    step: true,
    bpm: true,
    sdnn: true,
    rmssd: true,
  });

  const combinedData = useMemo(() => {
    return hourlyData.map(hourly => {
      const hourlyDate = parseISO(hourly.ds);
      const adjustedDate = subHours(hourlyDate, 9); // UTC to KST 조정
      const matchingDaily = dailyData.find(daily => daily.ds.split('T')[0] === hourly.ds.split('T')[0]);
      
      return {
        ...hourly,
        timestamp: adjustedDate.getTime(),
        bpm: hourly.bpm != null ? Number(hourly.bpm) : null,
        sdnn: hourly.sdnn != null ? Number(Number(hourly.sdnn).toFixed(2)) : null,
        rmssd: hourly.rmssd != null ? Number(Number(hourly.rmssd).toFixed(2)) : null,
        step: hourly.step != null ? Number(hourly.step) : null,
        calorie: hourly.calorie != null ? Number(hourly.calorie) : null,
        dailyStep: matchingDaily?.step != null ? Number(matchingDaily.step) : null,
        dailyCalorie: matchingDaily?.calorie != null ? Number(matchingDaily.calorie) : null,
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
  }, [hourlyData, dailyData]);

  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (combinedData.length > 0) {
      setBrushDomain([
        combinedData[0].timestamp,
        combinedData[combinedData.length - 1].timestamp
      ]);
    }
  }, [combinedData]);

  const filteredData = useMemo(() => {
    if (!brushDomain) return combinedData;
    return combinedData.filter(
      item => item.timestamp >= brushDomain[0] && item.timestamp <= brushDomain[1]
    );
  }, [combinedData, brushDomain]);

  const yAxisDomains = useMemo(() => {
    const leftData = filteredData.flatMap(d => [d.sdnn, d.rmssd, d.bpm].filter(v => v != null));
    const rightData = filteredData.flatMap(d => [d.step, d.calorie].filter(v => v != null));
    const dailyMaxStep = Math.max(...dailyData.map(d => d.step || 0));
    const dailyMaxCalorie = Math.max(...dailyData.map(d => d.calorie || 0));
    return {
      left: [0, Math.max(...leftData, 1) * 1.1],
      right: [0, Math.max(...rightData, dailyMaxStep, dailyMaxCalorie, 1) * 1.1],
    };
  }, [filteredData, dailyData]);

  const handleBrushChange = useCallback((newBrushDomain: any) => {
    console.log('Brush changed:', newBrushDomain);
    if (newBrushDomain && newBrushDomain.length === 2) {
      setBrushDomain(newBrushDomain);
      onBrushChange(newBrushDomain);
    } else {
      setBrushDomain(null);
      onBrushChange(null);
    }
  }, [onBrushChange]);

  const toggleChart = (chartName: keyof ChartVisibility) => {
    setVisibleCharts(prev => ({
      ...prev,
      [chartName]: !prev[chartName]
    }));
  };

  const formatDateForBrush = (time: number) => {
    return format(new Date(time), 'yyyy-MM-dd HH:mm');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <p className="font-bold">{format(new Date(label), 'yyyy-MM-dd HH:mm')}</p>
          {payload.map((pld: any) => (
            <p key={pld.dataKey} style={{ color: pld.color }}>
              {`${pld.name}: ${pld.value !== null ? 
                (pld.name === 'SDNN' || pld.name === 'RMSSD' ? Number(pld.value).toFixed(2) : pld.value)
                : 'N/A'}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  console.log('Combined Data Sample:', combinedData[0]);
  console.log('Filtered Data Sample:', filteredData[0]);

  return (
    <div className='bg-white p-4 rounded-lg shadow'>
      <div className="mb-4 flex flex-wrap gap-4">
        {(Object.keys(visibleCharts) as Array<keyof ChartVisibility>).map((chartName) => (
          <label key={chartName} className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={visibleCharts[chartName]}
              onChange={() => toggleChart(chartName)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="ml-2 text-gray-700">{chartName.toUpperCase()}</span>
          </label>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={600}>
        <ComposedChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(tick) => format(new Date(tick), 'MM-dd HH:mm')}
          />
          <YAxis yAxisId="left" domain={yAxisDomains.left} label={{ value: 'HRV (ms) / BPM', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" domain={yAxisDomains.right} label={{ value: 'Steps / Calories', angle: 90, position: 'insideRight' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {visibleCharts.calorie && (
            <Bar yAxisId="right" dataKey="calorie" fill="#8884d8" name="Hourly Calories" />
          )}
          {visibleCharts.step && (
            <Bar yAxisId="right" dataKey="step" fill="#82ca9d" name="Hourly Steps" />
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
          <Brush
            dataKey="timestamp"
            height={30}
            stroke="#8884d8"
            onChange={handleBrushChange}
            tickFormatter={formatDateForBrush}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CombinedChart;