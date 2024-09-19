import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, ReferenceLine, TooltipProps } from 'recharts';
import { format, subDays, addDays, startOfDay, endOfDay, startOfHour, subHours, max, min, startOfMonth, endOfMonth, addMinutes, startOfMinute, isBefore, startOfWeek, endOfWeek, isAfter, addHours, previousMonday, nextSunday, eachHourOfInterval } from 'date-fns';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { filter } from 'd3';

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

type DateRange = '1' | '7' | '15' | '30' | 'all';


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

  

  const [localHrvData, setLocalHrvData] = useState(hrvHourData);

  console.log('최상단, ', bpmData)

  useEffect(() => {
    setLocalHrvData(hrvHourData);
  }, [hrvHourData]);

  useEffect(() => {
    if (dateWindow && (!localHrvData || localHrvData.length === 0)) {
      fetchAdditionalData(dateWindow.start, dateWindow.end).then((newData) => {
        console.log(`in multichart4.tsx - newData.hrvData : ${newData}`)
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

  // const dataRange = useMemo(() => {

  //   const parseTimestamp = (item: any) => {
  //       const timestamp = new Date(item.timestamp).getTime();
  //       // console.log('Parsing timestamp:', item.timestamp, '->', timestamp);
  //       return timestamp;
  //     };

  //   // const allDates = [
  //   //   ...bpmData.map(item => adjustTimeZone(new Date(item.ds)).getTime()),
  //   //   ...stepData.map(item => adjustTimeZone(new Date(item.ds)).getTime()),
  //   //   ...calorieData.map(item => adjustTimeZone(new Date(item.ds)).getTime()),
  //   // ];

  //   const allDates = [
  //       ...bpmData.map(parseTimestamp),
  //       ...stepData.map(parseTimestamp),
  //       ...calorieData.map(parseTimestamp),
  //     ];

  //   // const allDates = [
  //   //   ...bpmData.map(item => new Date(item.timestamp).getTime()),
  //   //   ...stepData.map(item => new Date(item.timestamp).getTime()),
  //   //   ...calorieData.map(item => new Date(item.timestamp).getTime()),
  //   // ];

  

  //   // console.log('Sample data:',
  //   //     { 
  //   //       bpm: bpmData.slice(0, 3),
  //   //       step: stepData.slice(0, 3),
  //   //       calorie: calorieData.slice(0, 3)
  //   //     }
  //   //   );

  //   // console.log('???')
  //   // console.log(stepData)
  //   // console.log('???')

  //   const start = startOfDay(new Date(Math.min(...allDates)));
  //   const end = endOfDay(new Date(Math.max(...allDates)));
  //   const minuteEnd = endOfDay(new Date(Math.max(...predictMinuteData.map(item => new Date(item.ds).getTime()))));
  //   const hourEnd = endOfDay(new Date(Math.max(...predictHourData.map(item => new Date(item.ds).getTime()))));
  //   //const predictEnd = endOfDay(new Date(Math.max(...predictMinuteData.map(item => new Date(item.ds).getTime()))))

  //   // console.log('Data Range:', { 
  //   //     start: start.toISOString(), 
  //   //     end: end.toISOString(),
  //   //     minuteEnd: minuteEnd.toISOString(),
  //   //     hourEnd: hourEnd.toISOString()
  //   //   });

  //   return { start, end, minuteEnd, hourEnd };
  // }, [bpmData, stepData, calorieData, predictMinuteData, predictHourData]);

  // const [dataRange, setDataRange] = useState(() => {
  //   const allDates = [
  //     ...bpmData.map(item => new Date(item.timestamp).getTime()),
  //     ...stepData.map(item => new Date(item.timestamp).getTime()),
  //     ...calorieData.map(item => new Date(item.timestamp).getTime()),
  //   ];

  //   const start = startOfDay(new Date(Math.min(...allDates)));
  //   const end = endOfDay(new Date(Math.max(...allDates)));
  //   const minuteEnd = endOfDay(new Date(Math.max(...predictMinuteData.map(item => new Date(item.ds).getTime()))));
  //   const hourEnd = endOfDay(new Date(Math.max(...predictHourData.map(item => new Date(item.ds).getTime()))));

  //   return { start, end, minuteEnd, hourEnd };
  // });

  // useEffect(() => {

  //   // const parseTimestamp = (item: any) => {
  //   //   const timestamp = new Date(item.timestamp).getTime();
  //   //   return timestamp;
  //   // };

  //       // const allDates = [
  //   //   ...bpmData.map(item => adjustTimeZone(new Date(item.ds)).getTime()),
  //   //   ...stepData.map(item => adjustTimeZone(new Date(item.ds)).getTime()),
  //   //   ...calorieData.map(item => adjustTimeZone(new Date(item.ds)).getTime()),
  //   // ];

  // //   const allDates = [
  // //       ...bpmData.map(parseTimestamp),
  // //       ...stepData.map(parseTimestamp),
  // //       ...calorieData.map(parseTimestamp),
  // //     ];


  //   const allDates = [
  //     ...bpmData.map(item => adjustTimeZone(new Date(item.timestamp)).getTime()),
  //     ...stepData.map(item => adjustTimeZone(new Date(item.timestamp)).getTime()),
  //     ...calorieData.map(item => adjustTimeZone(new Date(item.timestamp)).getTime()),
  //     ...predictMinuteData.map(item => new Date(item.ds).getTime()),
  //     ...predictHourData.map(item => new Date(item.ds).getTime()),
  //   ];

  //   // const allDates = [
  //   //   ...bpmData.map(parseTimestamp),
  //   //   ...stepData.map(parseTimestamp),
  //   //   ...calorieData.map(parseTimestamp),
  //   //   ...predictMinuteData.map(parseTimestamp),
  //   //   //...predictHourData.map(item => new Date(item.ds).getTime()),
  //   // ];

  //   // const bpmDataTime = [...bpmData.map(item => adjustTimeZone(new Date(item.timestamp)).getTime())]
  //   // console.log(`In UseEffect2 - bpmDataTime : ${bpmDataTime}`)


  //   //console.log(`In useEffect allDates : ${allDates}`)

  //   const actualDates = [
  //     ...bpmData.map(item => new Date(item.timestamp).getTime()),
  //     ...stepData.map(item => new Date(item.timestamp).getTime()),
  //     ...calorieData.map(item => new Date(item.timestamp).getTime()),
  //   ];

  //   //console.log(`In useEffect actualDates : ${actualDates}`)

  //   console.log(`befrestartOfWeek - ${new Date(Math.min(...allDates))}`)

  //   const start = new Date(Math.min(...allDates))
  //   const end = endOfWeek(new Date(Math.max(...allDates)), { weekStartsOn: 1 });
  //   const lastActualDataDate = new Date(Math.max(...actualDates));

  //   console.log(`In useEffect start : ${start}`)
  //   console.log(`In useEffect end : ${end}`)
  //   console.log(`In useEffect lastActualDataDate : ${lastActualDataDate}`)

  //   setDataRange({ start, end, lastActualDataDate });
  // }, [bpmData, stepData, calorieData, predictMinuteData, predictHourData]);


  

  const calculateDateWindow = useCallback((range: DateRange, referenceDate: Date) => {
    let start: Date, end: Date;

    switch (range) {
      case '1':
        end = min([endOfDay(referenceDate), dataRange.end]);
        start = startOfDay(end);
        break;
      case '7':
        console.log(`In calculateDateWindow`)
        console.log(`In calculateDateWindow before end : ${dataRange.end}`)
        end = min([endOfWeek(referenceDate, { weekStartsOn: 1 }), dataRange.end]);
        console.log(`In calculateDateWindow after end : ${end}`)
        start = startOfWeek(end, { weekStartsOn: 1 });
        console.log(`In calculateDateWindow after start : ${start}`)
        break;
      case '15':
        end = min([endOfDay(addDays(startOfMonth(referenceDate), 14)), dataRange.end]);
        start = startOfMonth(end);
        break;
      case '30':
        end = min([endOfMonth(referenceDate), dataRange.end]);
        start = startOfMonth(end);
        break;
      case 'all':
        start = dataRange.start;
        end = dataRange.end;
        break;
      default:
        start = startOfDay(referenceDate);
        end = endOfDay(referenceDate);
    }

    start = max([start, dataRange.start]);
    end = min([end, dataRange.end]);

    return { start, end };
  }, [dataRange]);
  
  // useEffect(() => {
  //   if (initialDateWindow) {
  //     setDateWindow(initialDateWindow);
  //   } else {
  //     const lastWeekEnd = endOfWeek(dataRange.lastActualDataDate, { weekStartsOn: 1 });
  //     const initialWindow = calculateDateWindow(dateRange, lastWeekEnd);
  //     setDateWindow(initialWindow);
  //   }
  // }, [initialDateWindow, calculateDateWindow, dateRange, dataRange]);

  useEffect(() => {
    console.log(`-----???---------???-----`)
    console.log(`-----???----${selectedDate}---???-----`)
    console.log(`-----???---------???-----`)
    if (selectedDate) {
      const selectedDateObj = new Date(selectedDate);
      const startOfWeekDate = startOfWeek(selectedDateObj, { weekStartsOn: 1 }); // 월요일 시작
      const endOfWeekDate = endOfWeek(selectedDateObj, { weekStartsOn: 1 }); // 일요일 끝

      console.log(`In useEffect ${selectedDate}`)
      console.log(`In useEffect ${startOfWeekDate} ~ ${endOfWeekDate}`)
      console.log(`In useEffect ${startOfDay(startOfWeekDate)} ~ ${endOfDay(endOfWeekDate)}`)
      
      setDateWindow({
        start: startOfDay(startOfWeekDate),
        end: endOfDay(endOfWeekDate)
      });
    }
  }, [selectedDate]);
  
  //const [dateWindow, setDateWindow] = useState(() => calculateDateWindow(dateRange, dataRange.minuteEnd));

  // useEffect(() => {
  //   setDateWindow(calculateDateWindow(dateRange, timeUnit === 'minute' ? dataRange.minuteEnd : dataRange.hourEnd));
  // }, [dateRange, dataRange, calculateDateWindow, timeUnit]);

  // const handleDateNavigation = (direction: 'forward' | 'backward') => {
  //   setBrushDomain(null);
  //   setDateWindow(prev => {
  //     let newReferenceDate: Date;
  //     switch (dateRange) {
  //       case '1':
  //         newReferenceDate = direction === 'forward' ? addDays(prev.start, 1) : subDays(prev.start, 1);
  //         break;
  //       case '7':
  //         newReferenceDate = direction === 'forward' ? addDays(prev.start, 7) : subDays(prev.start, 7);
  //         break;
  //       case '15':
  //         if (prev.start.getDate() === 1) {
  //           newReferenceDate = direction === 'forward' ? addDays(prev.start, 15) : subDays(prev.start, 15);
  //         } else {
  //           newReferenceDate = direction === 'forward' ? addDays(prev.start, 15) : startOfMonth(prev.start);
  //         }
  //         break;
  //       case '30':
  //         newReferenceDate = direction === 'forward' ? addDays(prev.start, 30) : subDays(prev.start, 30);
  //         break;
  //       default:
  //         return prev;
  //     }
  //     const newWindow = calculateDateWindow(dateRange, newReferenceDate);
      
  //     if (newWindow.start < dataRange.start || newWindow.end > (timeUnit === 'minute' ? dataRange.minuteEnd : dataRange.hourEnd)) {
  //       return prev;
  //     }    
  //     return newWindow;
  //   });
  // };

  // const handleDateNavigation = (direction: 'forward' | 'backward') => {
  //   setBrushDomain(null);
  //   setDateWindow(prev => {
  //     let newReferenceDate: Date;
  //     switch (dateRange) {
  //       case '1':
  //         newReferenceDate = direction === 'forward' ? addDays(prev.start, 1) : subDays(prev.start, 1);
  //         break;
  //       case '7':
  //         newReferenceDate = direction === 'forward' ? addDays(prev.start, 7) : subDays(prev.start, 7);
  //         break;
  //       case '15':
  //         newReferenceDate = direction === 'forward' ? addDays(prev.start, 14) : subDays(prev.start, 14);
  //         break;
  //       case '30':
  //         newReferenceDate = direction === 'forward' ? addDays(prev.start, 30) : subDays(prev.start, 30);
  //         break;
  //       default:
  //         return prev;
  //     }
  //     const newWindow = calculateDateWindow(dateRange, newReferenceDate);
      
  //     if (newWindow.start < dataRange.start || newWindow.end > (timeUnit === 'minute' ? dataRange.minuteEnd : dataRange.hourEnd)) {
  //       return prev;
  //     }    
  //     return newWindow;
  //   });
  // };

  // const handleDateNavigation = async (direction: 'forward' | 'backward') => {
  //   setBrushDomain(null);
  //   setDateWindow(prev => {
  //     if (!prev) return null;
  //     const newStart = direction === 'forward' ? addDays(prev.start, 7) : subDays(prev.start, 7);
  //     const newEnd = direction === 'forward' ? addDays(prev.end, 7) : subDays(prev.end, 7);

  //     if (direction === 'backward') {
  //       const additionalStart = subDays(newStart, 7);
  //       fetchAdditionalData(additionalStart, newStart);
  //     }

  //     return { start: newStart, end: newEnd };
  //   });
  // };


  const handleDateNavigation = async (direction: 'forward' | 'backward') => {
    if (!dateWindow) return;

    let newStart: Date, newEnd: Date;
    console.log(`--- In Navi before switch ---`)
    console.log(`--- dateWindow.start : ${dateWindow.start} ---`)
    console.log(`--- dateWindow.start : ${dateWindow.end} ---`)
    console.log(`--- ----------------- ---`)

    switch (dateRange) {
      case '7':
        newStart = direction === 'forward' ? addDays(dateWindow.start, 7) : subDays(dateWindow.start, 7);
        console.log(`--- In Navi In switch ---`)
        console.log(`--- newStart : ${newStart} ---`)
        console.log(`--- ----------------- ---`)
        newEnd = endOfWeek(newStart, { weekStartsOn: 1 });
        newStart = startOfWeek(newStart, { weekStartsOn: 1 });
        console.log(`--- In Navi In switch After startOfWeek ---`)
        console.log(`--- newEnd : ${newEnd} ---`)
        console.log(`--- newStart : ${newStart} ---`)
        console.log(`--- ----------------- ---`)
        break;
      // ... (other cases remain the same)
      default:
        return;
    }

    console.log(`------ End Switch ------`)
    console.log(`Before IF newStart : ${newStart}`)
    console.log(`Before IF dataRange.start : ${dataRange.start}`)

    if (direction === 'backward' && newStart <= addDays(dataRange.start, 1)) {
      const fetchStart = startOfDay(subDays(newStart, 7));
      const fetchEnd = subDays(newStart, 1);

      console.log(`In IF fetchStart : ${fetchStart}`)
      console.log(`In IF fetchStart : ${fetchEnd}`)
      
      try {
        const newData = await fetchAdditionalData(fetchStart, fetchEnd);
        
        if (newData && newData.bpmData) {
          setBpmData(prevData => [...newData.bpmData, ...prevData]);
          setStepData(prevData => [...(newData.stepData || []), ...prevData]);
          setCalorieData(prevData => [...(newData.calorieData || []), ...prevData]);
          setSleepData(prevData => [...(newData.sleepData || []), ...prevData]);

          setDataRange(prevRange => ({
            ...prevRange,
            start: min([prevRange.start, fetchStart])
          }));
        } else {
          console.warn("Received empty or invalid data from fetchAdditionalData");
          setError("No additional data available");
        }
      } catch (error) {
        console.error("Error fetching additional data:", error);
        setError("Failed to fetch additional data. Please try again.");
      }
    }

    newStart = max([newStart, dataRange.start]);
    newEnd = min([newEnd, dataRange.end]);
    
    setDateWindow({ start: newStart, end: newEnd });
  };


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

  const processedData = useMemo(() => {
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

      hrvHourData.forEach(item => {
        const hourTimestamp = startOfHour(new Date(item.ds)).getTime();
        if (!hourlyData.has(hourTimestamp)) {
          hourlyData.set(hourTimestamp, { timestamp: hourTimestamp });
        }
        const hourData = hourlyData.get(hourTimestamp);
        hourData.hour_rmssd = item.hour_rmssd;
        hourData.hour_sdnn = item.hour_sdnn;
      });
      

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
        isActual: new Date(hourData.timestamp) <= dataRange.lastActualDataDate
      }));
    }
    return combinedData;
  }, [combinedData, timeUnit, hrvHourData, predictHourData, dataRange.lastActualDataDate]);

  // const displayData = useMemo(() => {
  //   if (!dateWindow) return combinedData;
  //   return combinedData.filter(item => 
  //     item.timestamp >= dateWindow.start.getTime() && 
  //     item.timestamp <= dateWindow.end.getTime()
  //   );
  // }, [combinedData, dateWindow]);

  const fetchPreviousWeekData = async (newStart: Date, earliestDataDate: Date) => {
    try {
      const newData = await fetchAdditionalData(newStart, earliestDataDate);
      console.log('123213123123-123-12312', newData)
      if (newData) {
        setBpmData(prevData => [...newData.bpmData, ...prevData]);
        setStepData(prevData => [...newData.stepData, ...prevData]);
        setCalorieData(prevData => [...newData.calorieData, ...prevData]);
        setSleepData(prevData => [...newData.sleepData, ...prevData]);
        setLocalHrvData(prevData => [...(newData.hrvData || []), ...prevData]);

        setDataRange(prevRange => ({
          ...prevRange,
          start: min([prevRange.start, newStart])
        }));
      }
    } catch (error) {
      console.error("Error fetching previous week data:", error);
      setError("Failed to fetch previous week data. Please try again.");
    }
  };
  
  const fetchNextWeekData = async (latestDataDate: Date, newEnd: Date) => {
    try {
      const newData = await fetchAdditionalData(latestDataDate, newEnd);
      if (newData) {
        setBpmData(prevData => [...prevData, ...newData.bpmData]);
        setStepData(prevData => [...prevData, ...newData.stepData]);
        setCalorieData(prevData => [...prevData, ...newData.calorieData]);
        setSleepData(prevData => [...prevData, ...newData.sleepData]);
        setLocalHrvData(prevData => [...prevData, ...(newData.hrvData || [])]);
      }
    } catch (error) {
      console.error("Error fetching next week data:", error);
      setError("Failed to fetch next week data. Please try again.");
    }
  };

  const moveWeek = async (direction: 'forward' | 'backward') => {
    setDateWindow(prevWindow => {
      if (!prevWindow) return prevWindow;
      const days = direction === 'forward' ? 7 : -7;
      const newStart = addDays(prevWindow.start, days);
      const newEnd = addDays(prevWindow.end, days);
  
      // 다음 주의 시작일 계산
      const nextWeekStart = direction === 'backward' ? subDays(newStart, 7) : addDays(newEnd, 1);
  
      // 현재 데이터의 범위 확인
      const earliestDataDate = new Date(Math.min(...combinedData.map(item => new Date(item.timestamp).getTime())));
      const latestDataDate = new Date(Math.max(...combinedData.map(item => new Date(item.timestamp).getTime())));
  
      // 다음 주의 데이터가 없는 경우 fetch
      if (direction === 'backward' && nextWeekStart < earliestDataDate) {
        fetchPreviousWeekData(nextWeekStart, earliestDataDate);
      } else if (direction === 'forward' && nextWeekStart > latestDataDate) {
        fetchNextWeekData(latestDataDate, nextWeekStart);
      }
  
      return { 
        start: startOfDay(newStart), 
        end: endOfDay(newEnd) 
      };
    });
  };

  const displayData = useMemo(() => {
    if (!dateWindow) return [];
    
    let filteredData;
    if (timeUnit === 'hour') {
      const filledBpmData = fillEmptyHours(hourlyBpmData, dateWindow.start, dateWindow.end, ['bpm']);
      const filledStepData = fillEmptyHours(hourlyStepData, dateWindow.start, dateWindow.end, ['step']);
      const filledCalorieData = fillEmptyHours(hourlyCalorieData, dateWindow.start, dateWindow.end, ['calorie']);
      const filledHrvData = fillEmptyHours(hourlyHrvData, dateWindow.start, dateWindow.end, ['hour_rmssd', 'hour_sdnn']);

      console.log('Filled HRV data:', filledHrvData);

      filteredData = filledBpmData.map((item, index) => ({
        ...item,
        step: filledStepData[index]?.step ?? null,
        calorie: filledCalorieData[index]?.calorie ?? null,
        hour_rmssd: filledHrvData[index]?.hour_rmssd ?? null,
        hour_sdnn: filledHrvData[index]?.hour_sdnn ?? null
      }));
    } else {
      filteredData = bpmData.map(item => ({
        timestamp: item.timestamp,
        bpm: item.value,
        step: stepData.find(s => s.timestamp === item.timestamp)?.value || null,
        calorie: calorieData.find(c => c.timestamp === item.timestamp)?.value || null,
        sleep_stage: sleepData.find(s => new Date(s.timestamp_start).getTime() === item.timestamp)?.value || null
      }));
    }

    return filteredData.filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= dateWindow.start && itemDate <= dateWindow.end;
    });
  }, [timeUnit, dateWindow, hourlyBpmData, hourlyStepData, hourlyCalorieData, hourlyHrvData, bpmData, stepData, calorieData, sleepData, fillEmptyHours]);
  
  console.log(displayData)

  const filteredData = useMemo(() => {
    if (!brushDomain) return displayData;
    return displayData.filter(
      item => item.timestamp >= brushDomain[0] && item.timestamp <= brushDomain[1]
    );
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
    //console.log(`in formatdate -- , ${date}`)
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

//   useEffect(() => {
//     console.log('Filtered Data Update : ', filteredData);
//   }, [filteredData])
//console.log(displayData);

const renderChart = (dataKey: string, color: string, yAxisLabel: string, ChartType: typeof LineChart | typeof BarChart = LineChart, additionalProps = {}) => {
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
            scale={ChartType === BarChart ? 'log' : 'auto'}
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
          {dataKey === 'bpm' && timeUnit === 'hour' && (
            <Line 
              type="monotone" 
              dataKey="hour_pred_bpm" 
              stroke="#82ca9d" 
              dot={false} 
              name="Predicted BPM (Hour)" 
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
          {/* <button 
            onClick={() => handleDateNavigation('backward')}
            className="px-2 py-1 bg-blue-500 text-white rounded mr-2"
            disabled={!dateWindow || dateWindow.start <= dataRange.start}
          > */}
          <button 
            onClick={() => moveWeek('backward')}
            className="px-2 py-1 bg-blue-500 text-white rounded mr-2"
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
          {/* <button 
            onClick={() => handleDateNavigation('forward')}
            className="px-2 py-1 bg-blue-500 text-white rounded ml-2"
            disabled={!dateWindow || isAfter(dateWindow.end, dataRange.end)}
          > */}
          <button 
            onClick={() => moveWeek('forward')}
            className="px-2 py-1 bg-blue-500 text-white rounded ml-2"
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
  
//   return (
//     <div className='bg-white p-4 rounded-lg shadow'>
//       <div className="mb-4 flex items-center justify-between">
//         <div>
//           {[1, 2, 3].map(count => (
//             <button
//               key={count}
//               onClick={() => setColumnCount(count)}
//               className={`px-4 py-2 rounded ml-2 ${columnCount === count ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
//             >
//               {count} Column{count !== 1 ? 's' : ''}
//             </button>
//           ))}
//         </div>
//         <div className="flex items-center">
//           <button 
//             onClick={() => handleDateNavigation('backward')}
//             className="px-2 py-1 bg-blue-500 text-white rounded mr-2"
//             disabled={dateRange === 'all' || dateWindow.start <= dataRange.start}
//           >
//             ←
//           </button>
//           <select
//             value={timeUnit}
//             onChange={(e) => setTimeUnit(e.target.value as 'minute' | 'hour')}
//             className="mr-2 p-2 border rounded"
//           >
//             <option value="minute">Minute</option>
//             <option value="hour">Hour</option>
//           </select>
//           <select
//             value={dateRange}
//             onChange={(e) => setDateRange(e.target.value as DateRange)}
//             className="p-2 border rounded"
//           >
//             <option value="1">1 Day</option>
//             <option value="7">7 Days</option>
//             <option value="15">15 Days</option>
//             <option value="30">30 Days</option>
//             <option value="all">All Data</option>
//           </select>
//           <button 
//             onClick={() => handleDateNavigation('forward')}
//             className="px-2 py-1 bg-blue-500 text-white rounded ml-2"
//             disabled={dateRange === 'all' || dateWindow.end >= (timeUnit === 'minute' ? dataRange.minuteEnd : dataRange.hourEnd)}
//           >
//             →
//           </button>
//         </div>
//       </div>
//       <div style={{ height: '100px', marginBottom: '20px' }}>
//         <ResponsiveContainer width="100%" height="100%">
//           <LineChart data={filteredData} syncId="healthMetrics">
//             <XAxis 
//               dataKey="timestamp" 
//               type="number" 
//               scale="time" 
//               domain={['dataMin', 'dataMax']}
//               tickFormatter={formatDateForDisplay}
//             />
//             <Brush 
//               dataKey="timestamp" 
//               height={30} 
//               stroke="#8884d8" 
//               onChange={handleBrushChange}
//               tickFormatter={formatDateForDisplay}
//             />
//           </LineChart>
//         </ResponsiveContainer>
//       </div>
//       <div 
//         className={`grid gap-4`} 
//         style={{ 
//           gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
//           gridAutoRows: `calc((100vh - 300px) / ${Math.ceil(charts.length / columnCount)})`
//         }}
//       >
//         {charts.map(chart => (
//           <div key={chart.key} className="w-full h-full">
//             {chart.key === 'sleep_stage' ? renderSleepStageChart() : renderChart(chart.key, chart.color, chart.label, chart.type)}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default MultiChart;