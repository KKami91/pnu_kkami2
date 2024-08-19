import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { format, parseISO, subDays, addDays, startOfDay, endOfDay, startOfHour, subHours,max, min } from 'date-fns';

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

  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);

  const dataRange = useMemo(() => {
    const allDates = [
      ...bpmData.map(item => new Date(item.ds).getTime()),
      ...stepData.map(item => new Date(item.ds).getTime()),
      ...calorieData.map(item => new Date(item.ds).getTime()),
      ...predictMinuteData.map(item => new Date(item.ds).getTime()),
      ...predictHourData.map(item => new Date(item.ds).getTime()),
      ...hrvHourData.map(item => new Date(item.ds).getTime()),
    ];

    return {
      start: new Date(Math.min(...allDates)),
      end: new Date(Math.max(...allDates)),
      minuteEnd: new Date(Math.max(...predictMinuteData.map(item => new Date(item.ds).getTime()))),
      hourEnd: new Date(Math.max(...predictHourData.map(item => new Date(item.ds).getTime()))),
    };
  }, [bpmData, stepData, calorieData, predictMinuteData, predictHourData, hrvHourData]);

  const [currentEndDate, setCurrentEndDate] = useState<Date>(() => {
    return timeUnit === 'minute' ? dataRange.minuteEnd : dataRange.hourEnd;
  });

  useEffect(() => {
    setCurrentEndDate(timeUnit === 'minute' ? dataRange.minuteEnd : dataRange.hourEnd);
  }, [timeUnit, dataRange]);

  const handleDateNavigation = (direction: 'forward' | 'backward') => {
    const days = dateRange === 'all' ? 30 : parseInt(dateRange);
    setCurrentEndDate(prevDate => {
      const newDate = direction === 'forward' 
        ? min([addDays(prevDate, days), timeUnit === 'minute' ? dataRange.minuteEnd : dataRange.hourEnd])
        : max([subDays(prevDate, days), addDays(dataRange.start, days)]);
      return newDate;
    });
  };

  const combinedData = useMemo(() => {
    console.log('Combining data...');
    const dataMap = new Map<number, any>();

    const processData = (data: any[], key: string, adjustTime: boolean = true) => {
      if (!Array.isArray(data)) {
        console.error(`Invalid data for ${key}: expected array, got`, data);
        return;
      }
      console.log(`Processing ${key} data, length:`, data.length);
      data.forEach(item => {
        if (item && typeof item.ds === 'string') {
          let timestamp = new Date(item.ds).getTime();
          if (adjustTime) {
            timestamp = subHours(new Date(timestamp), 9).getTime();
          }
          if (!dataMap.has(timestamp)) {
            dataMap.set(timestamp, { timestamp });
          }
          const value = item[key];
          if (typeof value === 'number') {
            dataMap.get(timestamp)![key] = value;
          }
        }
      });
    };

    // MongoDB 데이터 처리 (시간 조정)
    processData(bpmData, 'bpm', true);
    processData(stepData, 'step', true);
    processData(calorieData, 'calorie', true);

    // 예측 및 HRV 데이터 처리 (시간 조정 없음)
    processData(predictMinuteData, 'min_pred_bpm', false);
    processData(predictHourData, 'hour_pred_bpm', false);

    hrvHourData.forEach(item => {
      const timestamp = new Date(item.ds).getTime();
      if (!dataMap.has(timestamp)) {
        dataMap.set(timestamp, { timestamp });
      }
      dataMap.get(timestamp)!.hour_rmssd = item.hour_rmssd;
      dataMap.get(timestamp)!.hour_sdnn = item.hour_sdnn;
    });

    const result = Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    console.log('Combined data sample:', result.slice(0, 5));
    console.log('Combined data length:', result.length);
    return result;
  }, [bpmData, stepData, calorieData, predictMinuteData, predictHourData, hrvHourData]);

  // const filteredData = useMemo(() => {
  //   if (timeUnit === 'minute') {
  //     const oneWeekAgo = subHours(new Date(), 24 * 7).getTime();
  //     return combinedData.filter(item => item.timestamp >= oneWeekAgo);
  //   }
  //   return combinedData;
  // }, [combinedData, timeUnit]);

  const processedData = useMemo(() => {
    console.log('Processing data for time unit:', timeUnit);
    if (timeUnit === 'hour') {
      const hourlyData = new Map<number, any>();

      const processHourlyData = (data: any[], key: string) => {
        data.forEach(item => {
          const hourTimestamp = startOfHour(new Date(item.timestamp)).getTime();
          if (!hourlyData.has(hourTimestamp)) {
            hourlyData.set(hourTimestamp, { timestamp: hourTimestamp });
          }
          const hourData = hourlyData.get(hourTimestamp);
          
          if (key === 'bpm' || key === 'min_pred_bpm') {
            if (!hourData[key]) {
              hourData[key] = { sum: 0, count: 0 };
            }
            hourData[key].sum += item[key];
            hourData[key].count++;
          } else {
            hourData[key] = (hourData[key] || 0) + item[key];
          }
        });
      };

      processHourlyData(combinedData, 'bpm');
      processHourlyData(combinedData, 'step');
      processHourlyData(combinedData, 'calorie');
      processHourlyData(combinedData, 'min_pred_bpm');

      // HRV 데이터 처리 (이미 시간별 데이터)
      hrvHourData.forEach(item => {
        const hourTimestamp = startOfHour(new Date(item.ds)).getTime();
        if (!hourlyData.has(hourTimestamp)) {
          hourlyData.set(hourTimestamp, { timestamp: hourTimestamp });
        }
        const hourData = hourlyData.get(hourTimestamp);
        hourData.hour_rmssd = item.hour_rmssd;
        hourData.hour_sdnn = item.hour_sdnn;
      });

      // 시간별 예측 데이터 처리
      predictHourData.forEach(item => {
        const hourTimestamp = startOfHour(new Date(item.ds)).getTime();
        if (!hourlyData.has(hourTimestamp)) {
          hourlyData.set(hourTimestamp, { timestamp: hourTimestamp });
        }
        const hourData = hourlyData.get(hourTimestamp);
        hourData.hour_pred_bpm = item.hour_pred_bpm;
      });

      return Array.from(hourlyData.values()).map(hourData => ({
        ...hourData,
        bpm: hourData.bpm ? hourData.bpm.sum / hourData.bpm.count : null,
        min_pred_bpm: hourData.min_pred_bpm ? hourData.min_pred_bpm.sum / hourData.min_pred_bpm.count : null,
      }));
    }
    return combinedData;
  }, [combinedData, timeUnit, hrvHourData, predictHourData]);

  const displayData = useMemo(() => {
    let filteredData = processedData;
    
    if (filteredData.length > 0) {
      let startDate: Date;
      let endDate = currentEndDate;

      if (dateRange === 'all') {
        startDate = dataRange.start;
        endDate = timeUnit === 'minute' ? dataRange.minuteEnd : dataRange.hourEnd;
      } else {
        startDate = subDays(endDate, parseInt(dateRange));
      }
      
      console.log('Start date:', format(startDate, 'yyyy-MM-dd HH:mm:ss'));
      console.log('End date:', format(endDate, 'yyyy-MM-dd HH:mm:ss'));

      // 필터링 적용
      filteredData = filteredData.filter(item => 
        item.timestamp >= startOfDay(startDate).getTime() && 
        item.timestamp <= endDate.getTime()
      );
    }

    if (brushDomain) {
      filteredData = filteredData.filter(
        item => item.timestamp >= brushDomain[0] && item.timestamp <= brushDomain[1]
      );
    }

    console.log('Display data length:', filteredData.length);
    console.log('Display data sample:', filteredData.slice(0, 5));
    
    return filteredData;
  }, [processedData, timeUnit, dateRange, brushDomain, currentEndDate, dataRange]);

  const xAxisDomain = useMemo(() => {
    if (displayData.length === 0) return ['dataMin', 'dataMax'];
    const startTimestamp = displayData[0].timestamp;
    const endTimestamp = timeUnit === 'minute' ? dataRange.minuteEnd.getTime() : dataRange.hourEnd.getTime();
    return [startTimestamp, endTimestamp];
  }, [displayData, timeUnit, dataRange]);

  const handleBrushChange = useCallback((newBrushDomain: any) => {
    if (newBrushDomain && newBrushDomain.length === 2) {
      setBrushDomain(newBrushDomain);
      onBrushChange(newBrushDomain);
    } else {
      setBrushDomain(null);
      onBrushChange(null);
    }
  }, [onBrushChange]);

  // const formatDateForDisplay = (time: number) => {
  //   const date = new Date(time);
  //   return format(date, timeUnit === 'minute' ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd HH:00');
  // };

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

  const colors = {
    calorie: 'rgba(136, 132, 216, 0.6)',
    step: 'rgba(130, 202, 157, 0.6)',
    bpm: '#ff7300',
    pred_bpm_minute: '#A0D283',
    pred_bpm_hour: '#82ca9d',
    rmssd: '#8884d8',
    sdnn: '#82ca9d',
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
        <div>
        </div>
        <div className="flex items-center">
          <button 
            onClick={() => handleDateNavigation('backward')}
            className="px-2 py-1 bg-blue-500 text-white rounded mr-2"
            disabled={dateRange === 'all' || currentEndDate <= addDays(dataRange.start, parseInt(dateRange))}
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
            disabled={dateRange === 'all' || currentEndDate >= dataRange.end}
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
            domain={[0, 'dataMax']}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            label={{ value: 'Steps / Calories', angle: 90, position: 'insideRight' }} 
            domain={[0, 'dataMax']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {visibleCharts.calorie && (
            <Bar yAxisId="right" dataKey="calorie" fill="rgba(231, 78, 216, 0.6)" name="Calories" barSize={timeUnit === 'minute' ? 4 : 15} />
          )}
          {visibleCharts.step && (
            <Bar yAxisId="right" dataKey="step" fill="rgba(130, 202, 157, 0.6)" name="Steps" barSize={timeUnit === 'minute' ? 4 : 15} />
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