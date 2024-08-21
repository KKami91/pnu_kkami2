import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { format, parseISO, subDays, addDays, startOfDay, endOfDay, startOfHour, subHours,max, min, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, set, getDate } from 'date-fns';
import { log } from 'console';

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

const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Encountered two children with the same key')) {
    return;
  }
  originalError.apply(console, args);
};


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
  const [timeUnit, setTimeUnit] = useState<'minute' | 'hour'>('hour');
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
  

  const adjustTimeZone = (date: Date) => {
    return subHours(date, 9);
  };

  const dataRange = useMemo(() => {
    const allDates = [
      ...bpmData.map(item => adjustTimeZone(new Date(item.ds)).getTime()),
      ...stepData.map(item => adjustTimeZone(new Date(item.ds)).getTime()),
      ...calorieData.map(item => adjustTimeZone(new Date(item.ds)).getTime()),
    ];

    const start = startOfDay(new Date(Math.min(...allDates)));
    const end = endOfDay(new Date(Math.max(...allDates)));
    const minuteEnd = endOfDay(new Date(Math.max(...predictMinuteData.map(item => new Date(item.ds).getTime()))));
    const hourEnd = endOfDay(new Date(Math.max(...predictHourData.map(item => new Date(item.ds).getTime()))));

    return { start, end, minuteEnd, hourEnd };
  }, [bpmData, stepData, calorieData, predictMinuteData, predictHourData]);

  // const [dateWindow, setDateWindow] = useState<{start: Date, end: Date}>(() => {
  //   const end = timeUnit === 'minute' ? dataRange.minuteEnd : dataRange.hourEnd;
  //   const start = subDays(end, parseInt(dateRange) - 1);
  //   return { start, end };
  // });

  console.log('맨 위 rendering, 2brushDomain:', brushDomain);
  const calculateDateWindow = useCallback((range: DateRange, referenceDate: Date) => {
    const relevantEnd = timeUnit === 'minute' ? dataRange.minuteEnd : dataRange.hourEnd;
    let start: Date, end: Date;

    switch (range) {
      case '1':
        end = min([endOfDay(referenceDate), relevantEnd]);
        start = startOfDay(end);
        break;
      case '7':
        end = min([endOfDay(addDays(referenceDate, 6)), relevantEnd]);
        start = startOfDay(subDays(end, 6));
        break;
      case '15':
        end = min([endOfDay(addDays(startOfMonth(referenceDate), 14)), relevantEnd]);
        start = startOfMonth(end);
        break;
      case '30':
        end = min([endOfMonth(referenceDate), relevantEnd]);
        start = startOfMonth(end);
        break;
      case 'all':
        start = dataRange.start;
        end = relevantEnd;
        break;
      default:
        start = startOfDay(referenceDate);
        end = endOfDay(referenceDate);
    }

    // 시작 날짜가 데이터 범위 시작보다 이전인 경우 조정
    start = max([start, dataRange.start]);

    // 끝 날짜가 데이터 범위 끝보다 이후인 경우 조정
    end = min([end, relevantEnd]);

    return { start, end };
  }, [dataRange, timeUnit]);

  const [dateWindow, setDateWindow] = useState(() => calculateDateWindow(dateRange, dataRange.minuteEnd));


  useEffect(() => {
    setDateWindow(calculateDateWindow(dateRange, timeUnit === 'minute' ? dataRange.minuteEnd : dataRange.hourEnd));
  }, [dateRange, dataRange, calculateDateWindow, timeUnit]);

  const handleDateNavigation = (direction: 'forward' | 'backward') => {
    setBrushDomain(null);  // Reset brush when navigating
    setDateWindow(prev => {
      let newReferenceDate: Date;
      switch (dateRange) {
        case '1':
          newReferenceDate = direction === 'forward' ? addDays(prev.start, 1) : subDays(prev.start, 1);
          break;
        case '7':
          newReferenceDate = direction === 'forward' ? addDays(prev.start, 7) : subDays(prev.start, 7);
          break;
        case '15':
          if (getDate(prev.start) === 1) {
            newReferenceDate = direction === 'forward' ? set(prev.start, { date: 16 }) : subDays(prev.start, 15);
          } else {
            newReferenceDate = direction === 'forward' ? addDays(prev.start, 15) : set(prev.start, { date: 1 });
          }
          break;
        case '30':
          newReferenceDate = direction === 'forward' ? addDays(prev.start, 30) : subDays(prev.start, 30);
          break;
        default:
          return prev;
      }
      const newWindow = calculateDateWindow(dateRange, newReferenceDate);
      console.log('New date window after navigation:', newWindow);
      
      // 새 창이 데이터 범위를 벗어나면 이전 창을 유지
      if (newWindow.start < dataRange.start || newWindow.end > (timeUnit === 'minute' ? dataRange.minuteEnd : dataRange.hourEnd)) {
        return prev;
      }
      
      return newWindow;
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
      data.forEach((item, index) => {
        if (item && typeof item.ds === 'string') {
          let timestamp = new Date(item.ds);
          if (adjustTime) {
            timestamp = adjustTimeZone(timestamp);
          }
          const timeKey = timestamp.getTime();
          if (!dataMap.has(timeKey)) {
            dataMap.set(timeKey, { timestamp: timeKey, id: `${key}-${index}` });
          }
          const value = item[key];
          if (typeof value === 'number') {
            dataMap.get(timeKey)![key] = value;
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

    hrvHourData.forEach((item, index) => {
      const timestamp = new Date(item.ds).getTime();
      if (!dataMap.has(timestamp)) {
        dataMap.set(timestamp, { timestamp, id: `hrv-${index}` });
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
    console.log('Calculating displayData, brushDomain:', brushDomain);
  
    const baseData = processedData.filter(item => 
      item.timestamp >= dateWindow.start.getTime() && 
      item.timestamp <= dateWindow.end.getTime()
    );
  
    if (!brushDomain) return baseData;
  
    return baseData.filter(
      item => item.timestamp >= brushDomain[0] && item.timestamp <= brushDomain[1]
    );
  }, [processedData, dateWindow, brushDomain]);


  const xAxisDomain = useMemo(() => {
    console.log('in xAxisDomain ---- brushDomain', brushDomain);
    if (brushDomain) {
      return brushDomain;
    }
    if (displayData.length > 0) {
      return [displayData[0].timestamp, displayData[displayData.length - 1].timestamp];
    }
    return [dateWindow.start.getTime(), dateWindow.end.getTime()];
  }, [displayData, dateWindow, brushDomain]);

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

// const handleBrushChange = useCallback((newBrushDomain: any) => {
//   console.log('newBrushDomain:', newBrushDomain);

//   if (newBrushDomain && 'startIndex' in newBrushDomain && 'endIndex' in newBrushDomain) {
//     const { startIndex, endIndex } = newBrushDomain;

//     // displayData에서 실제 타임스탬프 값 추출
//     const startTimestamp = displayData[startIndex].timestamp;
//     const endTimestamp = displayData[endIndex].timestamp;

//     console.log('st', startTimestamp);
//     console.log('et', endTimestamp);

//     const brushDomainValue: [number, number] = [startTimestamp, endTimestamp];

//     console.log('Calculated brushDomain:', brushDomainValue);
//     setBrushDomain(brushDomainValue);
//     onBrushChange(brushDomainValue);

//     // 필터링된 데이터 계산
//     const filteredData = displayData.slice(startIndex, endIndex + 1);

//     console.log('Filtered data length:', filteredData.length);
//     console.log('First data point:', filteredData[0]);
//     console.log('Last data point:', filteredData[filteredData.length - 1]);
//   } else {
//     console.log('Resetting brush');
//     setBrushDomain(null);
//     onBrushChange(null);
//   }
// }, [onBrushChange, displayData]);
  

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
            disabled={dateRange === 'all' || dateWindow.end >= (timeUnit === 'minute' ? dataRange.minuteEnd : dataRange.hourEnd)}
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
            alwaysShowText={true}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CombinedChart;