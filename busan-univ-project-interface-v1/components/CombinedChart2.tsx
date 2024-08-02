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

type BrushDomain = [number, number] | null;

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
        sdnn: hourly.sdnn != null ? Number(Number(hourly.sdnn).toFixed(2)) : null,
        rmssd: hourly.rmssd != null ? Number(Number(hourly.rmssd).toFixed(2)) : null,
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

  const [brushDomain, setBrushDomain] = useState<BrushDomain>(null);

  const currentData = useMemo(() => 
    activeTimeUnit === 'hourly' ? combinedHourlyData : combinedDailyData,
  [activeTimeUnit, combinedHourlyData, combinedDailyData]);

  useEffect(() => {
    if (currentData.length > 0) {
      const newDomain: [number, number] = [currentData[0].timestamp, currentData[currentData.length - 1].timestamp];
      setBrushDomain(newDomain);
      onBrushChange(newDomain);
    }
  }, [currentData, onBrushChange]);

  const filteredData = useMemo(() => {
    if (!brushDomain) return currentData;
    return currentData.filter(
      item => item.timestamp >= brushDomain[0] && item.timestamp <= brushDomain[1]
    );
  }, [currentData, brushDomain]);

  const yAxisDomains = useMemo(() => {
    const leftData = filteredData.flatMap(d => [d.sdnn, d.rmssd, d.bpm].filter(v => v != null && v !== 0));
    const rightData = filteredData.flatMap(d => [d.step, d.calorie].filter(v => v != null && v !== 0));
    return {
      left: [0, Math.max(...leftData, 1) * 1.1],
      right: [1, Math.max(...rightData, 1)],
    };
  }, [filteredData]);

  const handleBrushChange = useCallback((newBrushDomain: any) => {
    if (newBrushDomain && typeof newBrushDomain.startIndex === 'number' && typeof newBrushDomain.endIndex === 'number') {
      const newDomain: BrushDomain = [
        currentData[newBrushDomain.startIndex].timestamp,
        currentData[newBrushDomain.endIndex].timestamp
      ];
      setBrushDomain(newDomain);
      onBrushChange(newDomain);
    } else if (Array.isArray(newBrushDomain) && newBrushDomain.length === 2 && 
               typeof newBrushDomain[0] === 'number' && typeof newBrushDomain[1] === 'number') {
      const typedNewBrushDomain: BrushDomain = [newBrushDomain[0], newBrushDomain[1]];
      setBrushDomain(typedNewBrushDomain);
      onBrushChange(typedNewBrushDomain);
    } else {
      const fullDomain: BrushDomain = [currentData[0].timestamp, currentData[currentData.length - 1].timestamp];
      setBrushDomain(fullDomain);
      onBrushChange(fullDomain);
    }
  }, [currentData, onBrushChange]);

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
    sdnn: '#0088FE',                      
    rmssd: '#00C49F'                      
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
        <div>
          <button
            className={`px-4 py-2 rounded ${activeTimeUnit === 'hourly' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveTimeUnit('hourly')}
          >
            Hourly
          </button>
          <button
            className={`px-4 py-2 rounded ml-2 ${activeTimeUnit === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveTimeUnit('daily')}
          >
            Daily
          </button>
        </div>
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
          {visibleCharts.sdnn && (
            <Line yAxisId="left" type="monotone" dataKey="sdnn" stroke={colors.sdnn} name="SDNN" />
          )}
          {visibleCharts.rmssd && (
            <Line yAxisId="left" type="monotone" dataKey="rmssd" stroke={colors.rmssd} name="RMSSD" />
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