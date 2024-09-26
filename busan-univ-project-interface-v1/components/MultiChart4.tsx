import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, ReferenceLine, TooltipProps } from 'recharts';
import { format, subDays, addDays, startOfDay, endOfDay, startOfHour, subHours, max, min, isSameDay, endOfMonth, addMinutes, startOfMinute, isBefore, startOfWeek, endOfWeek, isAfter, addHours, previousMonday, nextSunday, eachHourOfInterval, eachMinuteOfInterval } from 'date-fns';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface MultiChartProps {
  bpmData: any[];
  stepData: any[];
  calorieData: any[];
  sleepData: any[];
  predictMinuteData: any[];
  predictHourData: any[];
  hrvHourData: any[];
  globalStartDate: Date;
  globalEndDate: Date;
  onBrushChange: (domain: [number, number] | null) => void;
  fetchAdditionalData: (startDate: Date, endDate: Date) => Promise<AdditionalData>;
  initialDateWindow: { start: Date; end: Date; } | null;
  selectedDate: string;
  fetchHrvData: (user: string, start: Date, end: Date) => Promise<any[]>;
  dbStartDate: Date | null;
  dbEndDate: Date | null;
}

interface SleepData {
  ds_start: string;
  ds_end: string;
  stage: number | null;
}

interface AdditionalData {
  bpmData: any[];
  stepData: any[];
  calorieData: any[];
  sleepData: any[];
  hrvData: any[];
}

type DateRange = '1' | '7';


const MultiChart: React.FC<MultiChartProps> = ({
  bpmData: initialBpmData,
  stepData: initialStepData,
  calorieData: initialCalorieData,
  sleepData: initialSleepData,
  predictMinuteData,
  predictHourData,
  hrvHourData,
  onBrushChange,
  fetchAdditionalData,
  initialDateWindow,
  selectedDate,
  fetchHrvData,
  dbStartDate,
  dbEndDate,
}) => {
  const [timeUnit, setTimeUnit] = useState<'minute' | 'hour'>('hour');
  const [dateRange, setDateRange] = useState<DateRange>('7');
  const [columnCount, setColumnCount] = useState(2);
  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);
  const [dateWindow, setDateWindow] = useState(initialDateWindow);
  const [bpmData, setBpmData] = useState(initialBpmData);
  const [stepData, setStepData] = useState(initialStepData);
  const [calorieData, setCalorieData] = useState(initialCalorieData);
  const [sleepData, setSleepData] = useState(initialSleepData);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [cachedData, setCachedData] = useState<{
    [key: string]: AdditionalData
  }>({});

  const [localHrvData, setLocalHrvData] = useState(hrvHourData);

  const fetchWeekData = useCallback(async (start: Date, end: Date) => {
    const weekKey = format(start, 'yyyy-MM-dd');
    if (!cachedData[weekKey]) {
      //console.log(`Fetching data for week: ${weekKey}`);
      const newData = await fetchAdditionalData(start, end);
      setCachedData(prev => ({ ...prev, [weekKey]: newData }));
    } else {
      //console.log(`Using cached data for week: ${weekKey}`);
    }
  }, [fetchAdditionalData, cachedData]);

  const prefetchAdjacentWeeks = useCallback(async (currentStart: Date, currentEnd: Date) => {
    const prevWeekStart = subDays(currentStart, 7);
    const prevWeekEnd = subDays(currentStart, 1);
    const nextWeekStart = addDays(currentEnd, 1);
    const nextWeekEnd = addDays(currentEnd, 7);

    await Promise.all([
      fetchWeekData(prevWeekStart, prevWeekEnd),
      fetchWeekData(nextWeekStart, nextWeekEnd)
    ]);
  }, [fetchWeekData]);

  useEffect(() => {
    if (dateWindow) {
      const weekStart = startOfWeek(dateWindow.start, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(dateWindow.start, { weekStartsOn: 1 });
      fetchWeekData(weekStart, weekEnd);
      prefetchAdjacentWeeks(weekStart, weekEnd);
    }
  }, [dateWindow, fetchWeekData, prefetchAdjacentWeeks]);

  useEffect(() => {
    setLocalHrvData(hrvHourData);
  }, [hrvHourData]);

  useEffect(() => {
    
    if (dateWindow && (!localHrvData || localHrvData.length === 0)) {
      fetchAdditionalData(dateWindow.start, dateWindow.end).then((newData) => {
        if (newData.hrvData) {
          setLocalHrvData(newData.hrvData);
        }
      });
      
    }
  }, [dateWindow, localHrvData, fetchAdditionalData]);

  const [dataRange, setDataRange] = useState<{ start: Date; end: Date; lastActualDataDate: Date }>({ 
    start: new Date(), 
    end: new Date(),
    lastActualDataDate: new Date()
  });

  const adjustTimeZone = (date: Date) => {
    return subHours(date, 9);
  };

  const mapSleepStage = (stage: number | null): number => {
    switch(stage) {
      case 1: return -1;
      case 2: return -1.5;
      case 3: return 0;
      case 4: return -2;
      case 5: return -3;
      case 6: return -2.5;
      default: return 0;
    }
  };

  const sleepStageConfig = {
    0: { color: '#808080', label: 'Unused' },
    '-1': { color: '#FFA500', label: 'Awake' },
    '-1.5': { color: '#90EE90', label: 'Light1' },
    '-2': { color: '#32CD32', label: 'Light2' },
    '-2.5': { color: '#4169E1', label: 'REM' },
    '-3': { color: '#000080', label: 'Deep' },
  };

  const getSleepStageLabel = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'Unknown';
    const stage = value.toString() as keyof typeof sleepStageConfig;
    return sleepStageConfig[stage]?.label || 'Unknown';
  };

  const getSleepStageColor = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '#000000';
    const stage = value.toString() as keyof typeof sleepStageConfig;
    return sleepStageConfig[stage]?.color || '#000000';
  };

  const renderSleepStageChart = () => (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={filteredData} syncId="healthMetrics">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp" 
            type="number" 
            scale="time" 
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatDateForDisplay}
          />
          <YAxis 
            label={{ value: '', angle: -90, position: 'insideLeft' }} 
            domain={[-3.5, 0]}
            ticks={[-3, -2.5, -2, -1.5, -1, 0]}
            tickFormatter={(value) => getSleepStageLabel(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="stepAfter"
            dataKey="sleep_stage"
            stroke="#8884d8"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            name="Sleep Stage"
          />
          {Object.entries(sleepStageConfig).map(([stage, config]) => (
            <ReferenceLine key={stage} stroke={config.color} strokeDasharray="3 3" label={config.label} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  const roundToNearestMinute = (date: Date) => {
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    if (seconds >= 30) {
      return addMinutes(startOfMinute(date), 1);
    }
    return startOfMinute(date);
  };

  const processSleepData = (sleepData: any[]) => {
    const processedData: { timestamp: number; sleep_stage: number }[] = [];
    
    sleepData.forEach((item) => {
      let start = roundToNearestMinute(adjustTimeZone(new Date(item.timestamp_start)));
      const end = roundToNearestMinute(adjustTimeZone(new Date(item.timestamp_end)));

      while (isBefore(start, end)) {
        processedData.push({
          timestamp: start.getTime(),
          sleep_stage: mapSleepStage(item.value),
        });
        start = addMinutes(start, 1);
      }
    });
    return processedData;
  };

  useEffect(() => {
    if (selectedDate) {
      const selectedDateObj = new Date(selectedDate);
      const startOfWeekDate = startOfWeek(selectedDateObj, { weekStartsOn: 1 }); // 월요일 시작
      const endOfWeekDate = endOfWeek(selectedDateObj, { weekStartsOn: 1 }); // 일요일 끝
      setDateWindow({
        start: startOfDay(startOfWeekDate),
        end: endOfDay(endOfWeekDate)
      });
    }
  }, [selectedDate]);

  const processHourlyData = useCallback((data: any[], valueKey: string) => {
    const hourlyData = data.reduce((acc: any, item: any) => {
      const hourKey = startOfHour(adjustTimeZone(new Date(item.timestamp))).getTime();
      if (!acc[hourKey]) {
        acc[hourKey] = { timestamp: hourKey, values: [], sum: 0, count: 0 };
      }
      acc[hourKey].values.push(item.value);
      acc[hourKey].sum += item.value;
      acc[hourKey].count += 1;
      return acc;
    }, {});

    return Object.values(hourlyData).map((item: any) => ({
      timestamp: item.timestamp,
      [valueKey]: valueKey === 'bpm' ? item.sum / item.count : item.sum
    }));
  }, []);

  const hourlyBpmData = useMemo(() => processHourlyData(bpmData, 'bpm'), [bpmData, processHourlyData]);
  const hourlyStepData = useMemo(() => processHourlyData(stepData, 'step'), [stepData, processHourlyData]);
  const hourlyCalorieData = useMemo(() => processHourlyData(calorieData, 'calorie'), [calorieData, processHourlyData]);
  const hourlyHrvData = useMemo(() => {
    return localHrvData.map(item => ({
      timestamp: new Date(item.ds).getTime(),
      hour_rmssd: item.hour_rmssd,
      hour_sdnn: item.hour_sdnn
    }));
  }, [localHrvData]);


  const fillEmptyHours = useCallback((data: any[], start: Date, end: Date, keys: string[]) => {
    const allHours = eachHourOfInterval({ start, end });
    const filledData = allHours.map(hour => {
      const timestamp = hour.getTime();
      const existingData = data.find(item => item.timestamp === timestamp);
      if (existingData) return existingData;
      const emptyData: any = { timestamp };
      keys.forEach(key => emptyData[key] = null);
      return emptyData;
    });
    return filledData;
  }, []);


  const currentData = useMemo(() => {
    if (timeUnit === 'hour') {
      return {
        bpmData: hourlyBpmData,
        stepData: hourlyStepData,
        calorieData: hourlyCalorieData,
        sleepData: sleepData, // Sleep data might need special handling for hourly view
        predictData: predictHourData,
        hrvData: hrvHourData
      };
    } else {
      return {
        bpmData,
        stepData,
        calorieData,
        sleepData,
        predictData: predictMinuteData,
        hrvData: []
      };
    }
  }, [timeUnit, bpmData, stepData, calorieData, sleepData, hourlyBpmData, hourlyStepData, hourlyCalorieData, predictMinuteData, predictHourData, hrvHourData]);

  const combinedData = useMemo(() => {
    const dataMap = new Map<number, any>();

    const processData = (data: any[], key: string) => {
      data.forEach(item => {
        const timestamp = roundToNearestMinute(adjustTimeZone(new Date(item.timestamp))).getTime();
        if (!dataMap.has(timestamp)) {
          dataMap.set(timestamp, { timestamp });
        }
        dataMap.get(timestamp)![key] = item.value;
      });
    };

    processData(bpmData, 'bpm');
    processData(stepData, 'step');
    processData(calorieData, 'calorie');

    const processedSleepData = processSleepData(sleepData);
    processedSleepData.forEach(item => {
      if (!dataMap.has(item.timestamp)) {
        dataMap.set(item.timestamp, { timestamp: item.timestamp });
      }
      dataMap.get(item.timestamp)!.sleep_stage = item.sleep_stage;
    });

    predictMinuteData.forEach(item => {
      const timestamp = roundToNearestMinute(new Date(item.ds)).getTime();
      if (!dataMap.has(timestamp)) {
        dataMap.set(timestamp, { timestamp });
      }
      dataMap.get(timestamp)!.min_pred_bpm = item.min_pred_bpm;
    });

    return Array.from(dataMap.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(item => ({
        ...item,
        isActual: new Date(item.timestamp) <= dataRange.lastActualDataDate
      }));
  }, [bpmData, stepData, calorieData, sleepData, predictMinuteData, dataRange.lastActualDataDate]);

  const moveDate = useCallback((direction: 'forward' | 'backward') => {
    setDateWindow(prevWindow => {
      if (!prevWindow || !dbStartDate || !dbEndDate) return prevWindow;

      const days = dateRange === '7' ? 7 : 1;
      let newStart, newEnd;

      if (dateRange === '7') {
        newStart = direction === 'forward' 
          ? addDays(prevWindow.start, days) 
          : subDays(prevWindow.start, days);
        newEnd = endOfWeek(newStart, { weekStartsOn: 1 });
      } else {
        newEnd = direction === 'forward' 
          ? addDays(prevWindow.end, days) 
          : subDays(prevWindow.end, days);
        newStart = startOfDay(newEnd);
      }

      if (newStart < dbStartDate || newEnd > dbEndDate) {
        return prevWindow;
      }

      const adjustedStart = dateRange === '7' ? startOfWeek(newStart, { weekStartsOn: 1 }) : newStart;
      const adjustedEnd = dateRange === '7' ? endOfWeek(adjustedStart, { weekStartsOn: 1 }) : newEnd;

      const weekKey = format(startOfWeek(adjustedStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      if (cachedData[weekKey]) {
        const weekData = cachedData[weekKey];
        setBpmData(weekData.bpmData);
        setStepData(weekData.stepData);
        setCalorieData(weekData.calorieData);
        setSleepData(weekData.sleepData);
        setLocalHrvData(weekData.hrvData || []);
      }

      return { 
        start: startOfDay(adjustedStart), 
        end: endOfDay(adjustedEnd) 
      };
    });
  }, [dateRange, dbStartDate, dbEndDate, cachedData]);

  const indexData = useCallback((data: any[]) => {
    return data.reduce((acc: { [key: number]: any }, item) => {
      const timestamp = adjustTimeZone(new Date(item.timestamp)).getTime();
      acc[timestamp] = item;
      return acc;
    }, {});
  }, []);

  const indexedBpmData = useMemo(() => indexData(bpmData), [bpmData, indexData]);
  const indexedStepData = useMemo(() => indexData(stepData), [stepData, indexData]);
  const indexedCalorieData = useMemo(() => indexData(calorieData), [calorieData, indexData]);

  const indexedSleepData = useMemo(() => {
    return sleepData.map(item => ({
      start: new Date(item.timestamp_start).getTime(),
      end: new Date(item.timestamp_end).getTime(),
      value: item.value
    }));
  }, [sleepData]);

  

  const indexedPredictData = useMemo(() => {
    return predictMinuteData.reduce((acc: { [key: number]: any }, item) => {
      const timestamp = new Date(item.ds).getTime();
      acc[timestamp] = item;
      return acc;
    }, {});
  }, [predictMinuteData]);

  const displayData = useMemo(() => {
    if (!dateWindow) return [];
    
    //console.log(`in displayData -> dateWindow.start : ${dateWindow.start} /// dateWindow.end : ${dateWindow.end}`)

    let startDate, endDate;
    if (dateRange === '7') {
      startDate = startOfWeek(dateWindow.start, { weekStartsOn: 1 });
      endDate = endOfWeek(dateWindow.start, { weekStartsOn: 1 });
    } else {
      startDate = startOfDay(dateWindow.end);
      endDate = endOfDay(dateWindow.end);
    }
    
    //console.log(`Calculating display data for ${dateRange} day(s):`, format(startDate, 'yyyy-MM-dd'), 'to', format(endDate, 'yyyy-MM-dd'));

    let filteredData;
    //console.log(`in displayData --- timeunit : ${timeUnit}`)
    if (timeUnit === 'hour') {
      const filledBpmData = fillEmptyHours(hourlyBpmData, startDate, endDate, ['bpm']);
      const filledStepData = fillEmptyHours(hourlyStepData, startDate, endDate, ['step']);
      const filledCalorieData = fillEmptyHours(hourlyCalorieData, startDate, endDate, ['calorie']);
      const filledHrvData = fillEmptyHours(hourlyHrvData, startDate, endDate, ['hour_rmssd', 'hour_sdnn']);

      filteredData = filledBpmData.map((item, index) => ({
        ...item,
        step: filledStepData[index]?.step ?? null,
        calorie: filledCalorieData[index]?.calorie ?? null,
        hour_rmssd: filledHrvData[index]?.hour_rmssd ?? null,
        hour_sdnn: filledHrvData[index]?.hour_sdnn ?? null,
        hour_pred_bpm: predictHourData.find(p => new Date(p.ds).getTime() === item.timestamp)?.hour_pred_bpm ?? null
      }));
    } else {
      const allMinutes = eachMinuteOfInterval({ start: startDate, end: endDate });
      
      filteredData = allMinutes.map(minute => {
        const timestamp = minute.getTime();
        const bpmItem = indexedBpmData[timestamp];
        const stepItem = indexedStepData[timestamp];
        const calorieItem = indexedCalorieData[timestamp];
        const sleepItem = indexedSleepData.find(s => timestamp >= s.start && timestamp < s.end);
        const predItem = indexedPredictData[timestamp];

        return {
          timestamp,
          bpm: bpmItem ? bpmItem.value : null,
          step: stepItem ? stepItem.value : null,
          calorie: calorieItem ? calorieItem.value : null,
          sleep_stage: sleepItem ? mapSleepStage(sleepItem.value) : null,
          min_pred_bpm: predItem ? predItem.min_pred_bpm : null
        };
      });
    }

    return filteredData;
  }, [timeUnit, dateRange, dateWindow, hourlyBpmData, hourlyStepData, hourlyCalorieData, hourlyHrvData, 
      indexedBpmData, indexedStepData, indexedCalorieData, indexedSleepData, indexedPredictData, 
      predictHourData, fillEmptyHours]);

  const filteredData = useMemo(() => {
    // displayData가 undefined이거나 배열이 아닌 경우 빈 배열 반환
    if (!Array.isArray(displayData)) return [];

    // brushDomain이 없으면 전체 displayData 반환
    if (!brushDomain) return displayData;

    // brushDomain이 유효한 경우에만 필터링 적용
    if (Array.isArray(brushDomain) && brushDomain.length === 2) {
      return displayData.filter(
        item => item.timestamp >= brushDomain[0] && item.timestamp <= brushDomain[1]
      );
    }

    // 기본적으로 전체 displayData 반환
    return displayData;
  }, [displayData, brushDomain]);

  const handleBrushChange = useCallback((newBrushDomain: any) => {
    if (newBrushDomain && newBrushDomain.length === 2) {
      setBrushDomain(newBrushDomain);
      onBrushChange(newBrushDomain);
    } else {
      setBrushDomain(null);
      onBrushChange(null);
    }
  }, [onBrushChange]);

  const formatDateForDisplay = (time: number) => {
    const date = new Date(time);
    return format(date, timeUnit === 'minute' ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd HH:00');
  };

  const CustomTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const date = new Date(label as number);
      const currentChart = payload[0].dataKey as string;

      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <p className="font-bold" style={{ color: '#ff7300', fontWeight: 'bold' }}>
            {format(date, timeUnit === 'minute' ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd HH:00')}
          </p>
          {payload.map((pld, index) => {
            if (pld.dataKey === currentChart || (currentChart === 'bpm' && (pld.dataKey === 'min_pred_bpm' || pld.dataKey === 'hour_pred_bpm'))) {
              let value = pld.value !== null ? 
                (pld.dataKey === 'step' || pld.dataKey === 'calorie' ? 
                  Number(pld.value).toFixed(0) : 
                  Number(pld.value).toFixed(2)) 
                : 'N/A';
              
              if (pld.dataKey === 'sleep_stage') {
                const sleepStage = pld.value as number;
                value = getSleepStageLabel(sleepStage);
                return (
                  <p key={`${pld.dataKey}-${index}`} style={{ color: getSleepStageColor(sleepStage) }}>
                    Sleep Stage: {value}
                  </p>
                );
              }           
              return (
                <p key={`${pld.dataKey}-${index}`} style={{ color: pld.color }}>
                  {`${pld.name}: ${value}`}
                </p>
              );
            }
            return null;
          })}
        </div>
      );
    }
    return null;
  };

const renderChart = (dataKey: string, color: string, yAxisLabel: string, ChartType: typeof LineChart | typeof BarChart = LineChart, additionalProps = {}) => {
  console.log(`@@@@@@@@@@@@@@@@@@@@@@@@@@ : ${dataKey}`)
  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ChartType data={displayData} syncId="healthMetrics">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp" 
            type="number" 
            scale="time" 
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatDateForDisplay}
          />
          <YAxis 
            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} 
            tickFormatter={(value) => value.toFixed(1)}
            domain={dataKey === 'sleep_stage' ? [-3.5, 0.5] : ['auto', 'auto']}
            ticks={dataKey === 'sleep_stage' ? [-3, -2.5, -2, -1.5, -1] : undefined}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {dataKey === 'hrv' ? (
            <>
              <Line type="monotone" dataKey="hour_rmssd" stroke="#8884d8" name="RMSSD" dot={false} connectNulls />
              <Line type="monotone" dataKey="hour_sdnn" stroke="#82ca9d" name="SDNN" dot={false} connectNulls />
            </>
          ) : ChartType === LineChart ? (
            <Line type="monotone" dataKey={dataKey} stroke={color} name={dataKey.toUpperCase()} dot={false} connectNulls {...additionalProps} />
          ) : (
            <Bar dataKey={dataKey} fill={color} name={dataKey.toUpperCase()} {...additionalProps} />
          )}
          {dataKey === 'bpm' && (
            <Line 
              type="monotone" 
              dataKey={timeUnit === 'hour' ? "hour_pred_bpm" : "min_pred_bpm"} 
              stroke="#82ca9d" 
              dot={false} 
              name={`Predicted BPM (${timeUnit === 'hour' ? 'Hour' : 'Minute'})`} 
              connectNulls
            />
          )}
          {dataKey === 'sleep_stage' && (
            <>
              <ReferenceLine y={0} stroke='lightgray' strokeDasharray='3 3' />
              <ReferenceLine y={-1} stroke='lightgray' strokeDasharray='3 3' />
              <ReferenceLine y={-2} stroke='lightgray' strokeDasharray='3 3' />
              <ReferenceLine y={-3} stroke='lightgray' strokeDasharray='3 3' />
            </>
          )}
        </ChartType>
      </ResponsiveContainer>
    </div>
  );
};

  const charts = [
    { key: 'bpm', color: '#ff7300', label: 'BPM', type: LineChart },
    { key: 'step', color: 'rgba(130, 202, 157)', label: 'Steps', type: BarChart },
    { key: 'calorie', color: 'rgba(136, 132, 216)', label: 'Calories', type: BarChart },
  ];
  
  if (timeUnit === 'hour') {
    charts.push(
      { key: 'hour_rmssd', color: '#8884d8', label: 'RMSSD', type: LineChart },
      { key: 'hour_sdnn', color: '#82ca9d', label: 'SDNN', type: LineChart }
    );
  } else {
    charts.push({ key: 'sleep_stage', color: '#000000', label: 'Sleep Stage', type: LineChart })
  }

  return (
    <div className='bg-white p-4 rounded-lg shadow'>
      <div className="mb-4 flex items-center justify-between">
        <div>
          {[1, 2, 3].map(count => (
            <button
              key={count}
              onClick={() => setColumnCount(count)}
              className={`px-4 py-2 rounded ml-2 ${columnCount === count ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              {count} Column{count !== 1 ? 's' : ''}
            </button>
          ))}
        </div>
        <div className="flex items-center">
          <button 
            onClick={() => moveDate('backward')}
            className="px-2 py-1 bg-blue-500 text-white rounded mr-2"
            disabled={!dateWindow || !dbStartDate || dateWindow.start <= dbStartDate}
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
          </select>
          <button 
            onClick={() => moveDate('forward')}
            className="px-2 py-1 bg-blue-500 text-white rounded ml-2"
            disabled={!dateWindow || !dbEndDate || dateWindow.end >= dbEndDate}
          >
            →
          </button>
        </div>
      </div>
      <div style={{ height: '100px', marginBottom: '20px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} syncId="healthMetrics">
            <XAxis 
              dataKey="timestamp" 
              type="number" 
              scale="time" 
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatDateForDisplay}
            />
            <Brush 
              dataKey="timestamp" 
              height={30} 
              stroke="#8884d8" 
              onChange={handleBrushChange}
              tickFormatter={formatDateForDisplay}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div 
        className={`grid gap-4`} 
        style={{ 
          gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
          gridAutoRows: `calc((100vh - 300px) / ${Math.ceil(charts.length / columnCount)})`
        }}
      >
        {charts.map(chart => (
          <div key={chart.key} className="w-full h-full">
            {renderChart(chart.key, chart.color, chart.label, chart.type)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiChart;