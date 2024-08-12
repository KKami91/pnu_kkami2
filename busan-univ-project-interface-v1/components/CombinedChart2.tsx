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
  pred_bpm: boolean;
  sdnn: boolean;
  rmssd: boolean;
  pred_rmssd: boolean;
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
    pred_bpm: true,
    sdnn: true,
    rmssd: true,
    pred_rmssd: true,
  });

  const [activeTimeUnit, setActiveTimeUnit] = useState<'hourly' | 'daily'>('hourly');

  const combinedHourlyData = useMemo(() => {
    return hourlyData.map(hourly => {
      const hourlyDate = parseISO(hourly.ds);
      const adjustedDate = subHours(hourlyDate, 9); // UTC to KST 조정
      const matchingDaily = dailyData.find(daily => daily.ds.split('T')[0] === hourly.ds.split('T')[0]);
      
      return {
        ...hourly,
        timestamp: adjustedDate.getTime(),
        bpm: hourly.bpm != null ? Number(hourly.bpm) : null,
        pred_bpm: hourly.pred_bpm != null ? Number(hourly.pred_bpm) : null,
        sdnn: hourly.sdnn != null ? Number(Number(hourly.sdnn).toFixed(2)) : null,
        rmssd: hourly.rmssd != null ? Number(Number(hourly.rmssd).toFixed(2)) : null,
        pred_rmssd: hourly.pred_rmssd != null ? Number(Number(hourly.pred_rmssd).toFixed(2)) : null,
        step: hourly.step != null ? Number(hourly.step) : null,
        calorie: hourly.calorie != null ? Number(hourly.calorie) : null,
        dailyStep: matchingDaily?.step != null ? Number(matchingDaily.step) : null,
        dailyCalorie: matchingDaily?.calorie != null ? Number(matchingDaily.calorie) : null,
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
  }, [hourlyData, dailyData]);

  const combinedDailyData = useMemo(() => {
    return dailyData.map(daily => {
      const dailyDate = parseISO(daily.ds);
      return {
        ...daily,
        timestamp: dailyDate.getTime(),
        bpm: daily.bpm != null ? Number(daily.bpm) : null,
        sdnn: daily.sdnn != null ? Number(Number(daily.sdnn).toFixed(2)) : null,
        rmssd: daily.rmssd != null ? Number(Number(daily.rmssd).toFixed(2)) : null,
        step: daily.step != null ? Number(daily.step) : null,
        calorie: daily.calorie != null ? Number(daily.calorie) : null,
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
  }, [dailyData]);

  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);

  useEffect(() => {
    const data = activeTimeUnit === 'hourly' ? combinedHourlyData : combinedDailyData;
    if (data.length > 0) {
      setBrushDomain([
        data[0].timestamp,
        data[data.length - 1].timestamp
      ]);
    }
  }, [combinedHourlyData, combinedDailyData, activeTimeUnit]);

  const filteredData = useMemo(() => {
    const data = activeTimeUnit === 'hourly' ? combinedHourlyData : combinedDailyData;
    if (!brushDomain) return data;
    return data.filter(
      item => item.timestamp >= brushDomain[0] && item.timestamp <= brushDomain[1]
    );
  }, [combinedHourlyData, combinedDailyData, brushDomain, activeTimeUnit]);

  const yAxisDomains = useMemo(() => {
    const leftData = filteredData.flatMap(d => [d.sdnn, d.rmssd, d.bpm].filter(v => v != null && v !== 0));
    const rightData = filteredData.flatMap(d => [d.step, d.calorie].filter(v => v != null && v !== 0));
    return {
      left: [0, Math.max(...leftData, 1) * 1.1],
      right: [1, Math.max(...rightData, 1)],
    };
  }, [filteredData]);

  const handleBrushChange = useCallback((newBrushDomain: any) => {
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
    return format(new Date(time), activeTimeUnit === 'hourly' ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <p className="font-bold" style={{ color: '#ff7300', fontWeight: 'bold' }}>
            {format(new Date(label), activeTimeUnit === 'hourly' ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd')}
          </p>
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

  const colors = {
    calorie: 'rgba(136, 132, 216, 0.6)',  
    step: 'rgba(130, 202, 157, 0.6)',     
    bpm: '#ff7300',                       
    pred_bpm: '#A05233',                  
    sdnn: '#0088FE',                      
    rmssd: '#00C49F',                     
    pred_rmssd: '#B2ca9d'                 
  };

  return (
    <div className='bg-white p-4 rounded-lg shadow'>
      <div className="mb-4 flex flex-wrap gap-4 justify-between">
        <div>
          {(Object.keys(visibleCharts) as Array<keyof ChartVisibility>).map((chartName) => (
            <label key={chartName} className="inline-flex items-center cursor-pointer mr-4">
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
        {/* ... (rest of the UI remains the same) */}
      </div>
      <ResponsiveContainer width="100%" height={600}>
        <ComposedChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(tick) => format(new Date(tick), activeTimeUnit === 'hourly' ? 'MM-dd HH:mm' : 'MM-dd')}
            padding={{ left: 30, right: 30 }}
          />
          <YAxis 
            yAxisId="left" 
            domain={yAxisDomains.left} 
            label={{ value: 'HRV (ms) / BPM', angle: -90, position: 'insideLeft' }} 
            tickFormatter={(value) => value.toFixed(0)}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            domain={yAxisDomains.right}
            scale="log"
            tickFormatter={(value) => Math.round(value).toString()}
            label={{ value: 'Steps / Calories', angle: 90, position: 'insideRight' }} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {visibleCharts.calorie && (
            <Bar yAxisId="right" dataKey="calorie" fill={colors.calorie} name="Calories" />
          )}
          {visibleCharts.step && (
            <Bar yAxisId="right" dataKey="step" fill={colors.step} name="Steps" />
          )}
          {visibleCharts.bpm && (
            <Line yAxisId="left" type="monotone" dataKey="bpm" stroke={colors.bpm} name="BPM" />
          )}
          {visibleCharts.pred_bpm && (
            <Line yAxisId="left" type="monotone" dataKey="pred_bpm" stroke={colors.pred_bpm} name="Predicted BPM" />
          )}
          {visibleCharts.sdnn && (
            <Line yAxisId="left" type="monotone" dataKey="sdnn" stroke={colors.sdnn} name="SDNN" />
          )}
          {visibleCharts.rmssd && (
            <Line yAxisId="left" type="monotone" dataKey="rmssd" stroke={colors.rmssd} name="RMSSD" />
          )}
          {visibleCharts.pred_rmssd && (
            <Line yAxisId="left" type="monotone" dataKey="pred_rmssd" stroke={colors.pred_rmssd} name="Predicted RMSSD" />
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