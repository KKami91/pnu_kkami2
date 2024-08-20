import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, ReferenceArea } from 'recharts';
import { format, parseISO, subDays, addDays, startOfDay, endOfDay, max, min, subHours, startOfHour, differenceInDays } from 'date-fns';

interface CombinedChartProps {
  bpmData: any[];
  stepData: any[];
  calorieData: any[];
  predictMinuteData: any[];
  predictHourData: any[];
  hrvHourData: any[];
  globalStartDate: Date;
  globalEndDate: Date;
  onBrushChange: (domain: [number, number] | null) => void;
}

type ChartVisibility = {
  calorie: boolean;
  step: boolean;
  bpm: boolean;
  pred_bpm: boolean;
  rmssd: boolean;
  sdnn: boolean;
};

type DateRange = '1' | '7' | '15' | '30' | 'all';

const CombinedChart: React.FC<CombinedChartProps> = ({
  bpmData,
  stepData,
  calorieData,
  predictMinuteData,
  predictHourData,
  hrvHourData,
  globalStartDate,
  globalEndDate,
  onBrushChange,
}) => {
  const [timeUnit, setTimeUnit] = useState<'minute' | 'hour'>('minute');
  const [dateRange, setDateRange] = useState<DateRange>('7');
  const [visibleCharts, setVisibleCharts] = useState<ChartVisibility>({
    calorie: true,
    step: true,
    bpm: true,
    pred_bpm: true,
    rmssd: true,
    sdnn: true,
  });

  const combinedData = useMemo(() => {
    const dataMap = new Map<number, any>();

    const processData = (data: any[], key: string) => {
      data.forEach(item => {
        if (item && typeof item.ds === 'string') {
          const timestamp = new Date(item.ds).getTime();
          if (!dataMap.has(timestamp)) {
            dataMap.set(timestamp, { timestamp });
          }
          dataMap.get(timestamp)[key] = item[key];
        }
      });
    };

    processData(bpmData, 'bpm');
    processData(stepData, 'step');
    processData(calorieData, 'calorie');
    processData(predictMinuteData, 'min_pred_bpm');
    processData(predictHourData, 'hour_pred_bpm');
    hrvHourData.forEach(item => {
      const timestamp = new Date(item.ds).getTime();
      if (!dataMap.has(timestamp)) {
        dataMap.set(timestamp, { timestamp });
      }
      dataMap.get(timestamp).hour_rmssd = item.hour_rmssd;
      dataMap.get(timestamp).hour_sdnn = item.hour_sdnn;
    });

    return Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [bpmData, stepData, calorieData, predictMinuteData, predictHourData, hrvHourData]);

  const dataRange = useMemo(() => {
    const timestamps = combinedData.map(item => item.timestamp);
    return {
      start: new Date(Math.min(...timestamps)),
      end: new Date(Math.max(...timestamps)),
    };
  }, [combinedData]);

  const [dateWindow, setDateWindow] = useState<{start: Date, end: Date}>(() => {
    const end = dataRange.end;
    const start = subDays(end, parseInt(dateRange) - 1);
    return { start, end };
  });

  useEffect(() => {
    const end = dataRange.end;
    const start = dateRange === 'all' ? dataRange.start : subDays(end, parseInt(dateRange) - 1);
    setDateWindow({ start, end });
  }, [dateRange, dataRange]);

  const handleDateNavigation = (direction: 'forward' | 'backward') => {
    const days = dateRange === 'all' ? differenceInDays(dataRange.end, dataRange.start) : parseInt(dateRange);
    setDateWindow(prev => {
      let newStart: Date, newEnd: Date;
      if (direction === 'forward') {
        newEnd = new Date(Math.min(addDays(prev.end, days).getTime(), dataRange.end.getTime()));
        newStart = subDays(newEnd, days - 1);
      } else {
        newStart = new Date(Math.max(subDays(prev.start, days).getTime(), dataRange.start.getTime()));
        newEnd = addDays(newStart, days - 1);
      }
      return { start: newStart, end: newEnd };
    });
  };

  const displayData = useMemo(() => {
    return combinedData.filter(item => 
      item.timestamp >= dateWindow.start.getTime() && 
      item.timestamp <= dateWindow.end.getTime()
    );
  }, [combinedData, dateWindow]);

  const handleBrushChange = useCallback((brushDomain: any) => {
    if (Array.isArray(brushDomain) && brushDomain.length === 2) {
      onBrushChange([brushDomain[0], brushDomain[1]]);
    } else {
      onBrushChange(null);
    }
  }, [onBrushChange]);

  const xAxisDomain = useMemo(() => {
    return [dateWindow.start.getTime(), dateWindow.end.getTime()];
  }, [dateWindow]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <p className="font-bold" style={{ color: '#ff7300', fontWeight: 'bold' }}>
            {format(date, timeUnit === 'minute' ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd HH:00')}
          </p>
          {payload.map((pld: any) => (
            <p key={pld.dataKey} style={{ color: pld.color }}>
              {`${pld.name}: ${pld.value !== null ? pld.value.toFixed(2) : 'N/A'}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
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
                onChange={() => setVisibleCharts(prev => ({...prev, [chartName]: !prev[chartName]}))}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="ml-2 text-gray-700">{chartName.toUpperCase()}</span>
            </label>
          ))}
        </div>
        <div className="flex items-center">
          <button 
            onClick={() => handleDateNavigation('backward')}
            className="px-2 py-1 bg-blue-500 text-white rounded mr-2"
            disabled={dateRange === 'all' || dateWindow.start <= dataRange.start}
          >
            ←
          </button>
          <select
            value={timeUnit}
            onChange={(e) => setTimeUnit(e.target.value as 'minute' | 'hour')}
            className="mr-2 p-2 border rounded"
          >
            <option value="minute">Minute</option>
            <option value="hour">Hour</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="p-2 border rounded"
          >
            <option value="1">1 Day</option>
            <option value="7">7 Days</option>
            <option value="15">15 Days</option>
            <option value="30">30 Days</option>
            <option value="all">All Data</option>
          </select>
          <button 
            onClick={() => handleDateNavigation('forward')}
            className="px-2 py-1 bg-blue-500 text-white rounded ml-2"
            disabled={dateRange === 'all' || dateWindow.end >= dataRange.end}
          >
            →
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={600}>
        <ComposedChart data={displayData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={xAxisDomain}
            tickFormatter={(tick) => format(new Date(tick), timeUnit === 'minute' ? 'MM-dd HH:mm' : 'MM-dd HH:00')}
            padding={{ left: 30, right: 30 }}
          />
          <YAxis 
            yAxisId="left" 
            label={{ value: 'BPM / HRV', angle: -90, position: 'insideLeft' }} 
            domain={[0, 'auto']}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            scale="log"
            domain={[1, 'auto']}
            label={{ value: 'Steps / Calories', angle: 90, position: 'insideRight' }} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {visibleCharts.calorie && (
            <Bar yAxisId="right" dataKey="calorie" fill="rgba(231, 78, 216, 0.6)" name="Calories" />
          )}
          {visibleCharts.step && (
            <Bar yAxisId="right" dataKey="step" fill="rgba(130, 202, 157, 0.6)" name="Steps" />
          )}
          {visibleCharts.bpm && (
            <Line yAxisId="left" type="monotone" dataKey="bpm" stroke="#ff7300" name="BPM" dot={false} />
          )}
          {visibleCharts.pred_bpm && timeUnit === 'minute' && (
            <Line yAxisId="left" type="monotone" dataKey="min_pred_bpm" stroke="#A0D283" name="Predicted BPM (Minute)" dot={false} />
          )}
          {visibleCharts.pred_bpm && timeUnit === 'hour' && (
            <Line yAxisId="left" type="monotone" dataKey="hour_pred_bpm" stroke="#82ca9d" name="Predicted BPM (Hour)" dot={false} />
          )}
          {visibleCharts.rmssd && timeUnit === 'hour' && (
            <Line yAxisId="left" type="monotone" dataKey="hour_rmssd" stroke="#8884d8" name="RMSSD" dot={false} />
          )}
          {visibleCharts.sdnn && timeUnit === 'hour' && (
            <Line yAxisId="left" type="monotone" dataKey="hour_sdnn" stroke="#82ca9d" name="SDNN" dot={false} />
          )}
          <Brush
            dataKey="timestamp"
            height={30}
            stroke="#8884d8"
            onChange={handleBrushChange}
            tickFormatter={(tick) => format(new Date(tick), timeUnit === 'minute' ? 'MM-dd HH:mm' : 'MM-dd HH:00')}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CombinedChart;