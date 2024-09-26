import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { format, startOfWeek, endOfWeek, eachMinuteOfInterval, addDays, isWithinInterval, startOfMinute } from 'date-fns';



interface EChartsMinuteChartProps {
  bpmData: any[];
  stepData: any[];
  calorieData: any[];
  sleepData: any[];
  predictMinuteData: any[];
  globalStartDate: Date;
  globalEndDate: Date;
  onBrushChange: (domain: [number, number] | null) => void;
  fetchAdditionalData: (startDate: Date, endDate: Date) => Promise<AdditionalData>;
  initialDateWindow: { start: Date; end: Date; } | null;
  selectedDate: string;
  dbStartDate: Date | null;
  dbEndDate: Date | null;
}

interface AdditionalData {
  bpmData: any[];
  stepData: any[];
  calorieData: any[];
  sleepData: any[];
}

//const EChartsMinuteChart: React.FC<EChartsMinuteChartProps> = ({
    
const EChartsWeeklyChart: React.FC<EChartsMinuteChartProps> = ({
  bpmData,
  stepData,
  calorieData,
  sleepData,
  predictMinuteData,
  globalStartDate,
  globalEndDate,
  onBrushChange,
  fetchAdditionalData,
  initialDateWindow,
  selectedDate,
  dbStartDate,
  dbEndDate,
}) => {
  const [dateWindow, setDateWindow] = useState<{ start: Date; end: Date } | null>(null);
  const chartRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    console.log('Component mounted');
    console.log('Initial Date Window:', initialDateWindow);
    console.log('Selected Date:', selectedDate);
    console.log('Global Start Date:', globalStartDate);
    console.log('Global End Date:', globalEndDate);
    console.log('DB Start Date:', dbStartDate);
    console.log('DB End Date:', dbEndDate);
  }, []);

//   useEffect(() => {
//     if (selectedDate && !dateWindow) {
//       const selected = new Date(selectedDate);
//       setDateWindow({
//         start: startOfDay(selected),
//         end: endOfDay(selected)
//       });
//     }
//   }, [selectedDate, dateWindow]);

  useEffect(() => {
    if (selectedDate && !dateWindow) {
      const selected = new Date(selectedDate);
      setDateWindow({
        start: startOfWeek(selected, { weekStartsOn: 1 }),
        end: endOfWeek(selected, { weekStartsOn: 1 })
      });
    }
  }, [selectedDate, dateWindow]);

  useEffect(() => {
    console.log('Date Window updated:', dateWindow);
  }, [dateWindow]);

//   const processMinuteData = useCallback((data: any[]) => {
//     console.log('Processing data, length:', data.length);
//     return data.reduce((acc: any, item: any) => {
//       const minuteKey = startOfMinute(new Date(item.timestamp)).getTime();
//       if (!acc[minuteKey]) {
//         acc[minuteKey] = { timestamp: minuteKey, value: Number(item.value) };
//       }
//       return acc;
//     }, {});
//   }, []);

  const processMinuteData = useCallback((data: any[]) => {
    return data.reduce((acc: any, item: any) => {
      const minuteKey = new Date(item.timestamp).getTime();
      acc[minuteKey] = { timestamp: minuteKey, value: Number(item.value) };
      return acc;
    }, {});
  }, []);

  const minuteBpmData = useMemo(() => processMinuteData(bpmData), [bpmData, processMinuteData]);
  const minuteStepData = useMemo(() => processMinuteData(stepData), [stepData, processMinuteData]);
  const minuteCalorieData = useMemo(() => processMinuteData(calorieData), [calorieData, processMinuteData]);

//   useEffect(() => {
//     console.log('Minute BPM Data updated, count:', Object.keys(minuteBpmData).length);
//     console.log('Minute Step Data updated, count:', Object.keys(minuteStepData).length);
//     console.log('Minute Calorie Data updated, count:', Object.keys(minuteCalorieData).length);
//   }, [minuteBpmData, minuteStepData, minuteCalorieData]);

//   const displayData = useMemo(() => {
//     console.log('Calculating display data');
//     console.log('Current Date Window:', dateWindow);
    
//     if (!dateWindow) {
//       console.log('Date Window is null, returning empty array');
//       return [];
//     }
    
//     console.log('Minute BPM Data count:', Object.keys(minuteBpmData).length);
//     console.log('Minute Step Data count:', Object.keys(minuteStepData).length);
//     console.log('Minute Calorie Data count:', Object.keys(minuteCalorieData).length);
//     console.log('Predict Minute Data count:', predictMinuteData.length);

//     const filledData = eachMinuteOfInterval({ start: dateWindow.start, end: dateWindow.end })
//       .map(minute => {
//         const timestamp = minute.getTime();
//         const bpmData = minuteBpmData[timestamp];
//         const stepData = minuteStepData[timestamp];
//         const calorieData = minuteCalorieData[timestamp];
//         const predData = predictMinuteData.find(item => new Date(item.ds).getTime() === timestamp);

//         return {
//           timestamp,
//           bpm: bpmData ? bpmData.value : null,
//           step: stepData ? stepData.value : null,
//           calorie: calorieData ? calorieData.value : null,
//           min_pred_bpm: predData ? predData.min_pred_bpm : null,
//         };
//       });

//     console.log('Filled Data length:', filledData.length);
//     console.log('Sample Filled Data:', filledData.slice(0, 5));
//     return filledData;
//   }, [dateWindow, minuteBpmData, minuteStepData, minuteCalorieData, predictMinuteData]);

  const displayData = useMemo(() => {
    if (!dateWindow) return [];
    
    console.log('Calculating display data for week:', format(dateWindow.start, 'yyyy-MM-dd'), 'to', format(dateWindow.end, 'yyyy-MM-dd'));

    const filledData = eachMinuteOfInterval({ start: dateWindow.start, end: dateWindow.end })
      .map(minute => {
        const timestamp = minute.getTime();
        return {
          timestamp,
          bpm: minuteBpmData[timestamp]?.value ?? null,
          step: minuteStepData[timestamp]?.value ?? null,
          calorie: minuteCalorieData[timestamp]?.value ?? null,
          min_pred_bpm: predictMinuteData.find(item => new Date(item.ds).getTime() === timestamp)?.min_pred_bpm ?? null,
        };
      });

    console.log('Filled Data length:', filledData.length);
    return filledData;
  }, [dateWindow, minuteBpmData, minuteStepData, minuteCalorieData, predictMinuteData]);

//   useEffect(() => {
//     console.log('Display Data updated, length:', displayData.length);
//     chartRefs.current.forEach((chartRef, index) => {
//       if (chartRef) {
//         const chart = echarts.init(chartRef);
//         let option: echarts.EChartsOption = {};

//         switch(index) {
//           case 0: // BPM Chart
//             option = {
//               title: { text: 'BPM' },
//               tooltip: { trigger: 'axis' },
//               xAxis: { 
//                 type: 'time',
//                 axisLabel: {
//                   formatter: (value: number) => format(new Date(value), 'HH:mm')
//                 }
//               },
//               yAxis: { type: 'value' },
//               series: [
//                 {
//                   name: 'BPM',
//                   type: 'line',
//                   data: displayData.map(item => [item.timestamp, item.bpm]),
//                   sampling: 'lttb',
//                 },
//                 {
//                   name: 'Predicted BPM',
//                   type: 'line',
//                   data: displayData.map(item => [item.timestamp, item.min_pred_bpm]),
//                   sampling: 'lttb',
//                 }
//               ],
//               dataZoom: [
//                 {
//                   type: 'inside',
//                   start: 0,
//                   end: 100
//                 },
//                 {
//                   start: 0,
//                   end: 100
//                 }
//               ]
//             };
//             break;
//           case 1: // Step Chart
//             option = {
//               title: { text: 'Steps' },
//               tooltip: { trigger: 'axis' },
//               xAxis: { 
//                 type: 'time',
//                 axisLabel: {
//                   formatter: (value: number) => format(new Date(value), 'HH:mm')
//                 }
//               },
//               yAxis: { type: 'value' },
//               series: [{
//                 name: 'Steps',
//                 type: 'bar',
//                 data: displayData.map(item => [item.timestamp, item.step]),
//                 sampling: 'lttb',
//               }],
//               dataZoom: [
//                 {
//                   type: 'inside',
//                   start: 0,
//                   end: 100
//                 },
//                 {
//                   start: 0,
//                   end: 100
//                 }
//               ]
//             };
//             break;
//           case 2: // Calorie Chart
//             option = {
//               title: { text: 'Calories' },
//               tooltip: { trigger: 'axis' },
//               xAxis: { 
//                 type: 'time',
//                 axisLabel: {
//                   formatter: (value: number) => format(new Date(value), 'HH:mm')
//                 }
//               },
//               yAxis: { type: 'value' },
//               series: [{
//                 name: 'Calories',
//                 type: 'line',
//                 data: displayData.map(item => [item.timestamp, item.calorie]),
//                 sampling: 'lttb',
//               }],
//               dataZoom: [
//                 {
//                   type: 'inside',
//                   start: 0,
//                   end: 100
//                 },
//                 {
//                   start: 0,
//                   end: 100
//                 }
//               ]
//             };
//             break;
//         }

//         chart.setOption(option);

//         return () => {
//           chart.dispose();
//         };
//       }
//     });
//   }, [displayData]);

useEffect(() => {
    chartRefs.current.forEach((chartRef, index) => {
      if (chartRef) {
        const chart = echarts.init(chartRef);
        let option: echarts.EChartsOption = {};

        switch(index) {
          case 0: // BPM Chart
            option = {
              title: { text: 'BPM' },
              tooltip: { trigger: 'axis' },
              xAxis: { 
                type: 'time',
                axisLabel: {
                  formatter: (value: number) => format(new Date(value), 'MM-dd HH:mm')
                }
              },
              yAxis: { type: 'value' },
              series: [
                {
                  name: 'BPM',
                  type: 'line',
                  data: displayData.map(item => [item.timestamp, item.bpm]),
                  sampling: 'lttb',
                },
                {
                  name: 'Predicted BPM',
                  type: 'line',
                  data: displayData.map(item => [item.timestamp, item.min_pred_bpm]),
                  sampling: 'lttb',
                }
              ],
              dataZoom: [
                {
                  type: 'inside',
                  start: 0,
                  end: 100
                },
                {
                  start: 0,
                  end: 100
                }
              ]
            };
            break;
          case 1: // Step Chart
            option = {
              title: { text: 'Steps' },
              tooltip: { trigger: 'axis' },
              xAxis: { 
                type: 'time',
                axisLabel: {
                  formatter: (value: number) => format(new Date(value), 'MM-dd HH:mm')
                }
              },
              yAxis: { type: 'value' },
              series: [{
                name: 'Steps',
                type: 'bar',
                data: displayData.map(item => [item.timestamp, item.step]),
                sampling: 'lttb',
              }],
              dataZoom: [
                {
                  type: 'inside',
                  start: 0,
                  end: 100
                },
                {
                  start: 0,
                  end: 100
                }
              ]
            };
            break;
          case 2: // Calorie Chart
            option = {
              title: { text: 'Calories' },
              tooltip: { trigger: 'axis' },
              xAxis: { 
                type: 'time',
                axisLabel: {
                  formatter: (value: number) => format(new Date(value), 'MM-dd HH:mm')
                }
              },
              yAxis: { type: 'value' },
              series: [{
                name: 'Calories',
                type: 'line',
                data: displayData.map(item => [item.timestamp, item.calorie]),
                sampling: 'lttb',
              }],
              dataZoom: [
                {
                  type: 'inside',
                  start: 0,
                  end: 100
                },
                {
                  start: 0,
                  end: 100
                }
              ]
            };
            break;
        }

        chart.setOption(option);

        return () => {
          chart.dispose();
        };
      }
    });
  }, [displayData]);

  const moveDay = (direction: 'forward' | 'backward') => {
    setDateWindow(prevWindow => {
      if (!prevWindow || !dbStartDate || !dbEndDate) return prevWindow;

      const days = direction === 'forward' ? 1 : -1;
      const newStart = new Date(prevWindow.start.getTime() + days * 24 * 60 * 60 * 1000);
      const newEnd = new Date(prevWindow.end.getTime() + days * 24 * 60 * 60 * 1000);

      if (newStart < dbStartDate || newEnd > dbEndDate) {
        return prevWindow;
      }

      return { 
        start: newStart, 
        end: newEnd 
      };
    });
  };

  const moveWeek = (direction: 'forward' | 'backward') => {
    setDateWindow(prevWindow => {
      if (!prevWindow || !dbStartDate || !dbEndDate) return prevWindow;

      const days = direction === 'forward' ? 7 : -7;
      const newStart = addDays(prevWindow.start, days);
      const newEnd = addDays(prevWindow.end, days);

      if (newStart < dbStartDate || newEnd > dbEndDate) {
        return prevWindow;
      }

      return { 
        start: newStart, 
        end: newEnd 
      };
    });
  };

//   return (
//     <div className='bg-white p-4 rounded-lg shadow'>
//       <div className="mb-4 flex items-center justify-between">
//         <div>
//           <button 
//             onClick={() => moveDay('backward')}
//             className="px-2 py-1 bg-blue-500 text-white rounded mr-2"
//             disabled={!dateWindow || !dbStartDate || dateWindow.start <= dbStartDate}
//           >
//             ←
//           </button>
//           <button 
//             onClick={() => moveDay('forward')}
//             className="px-2 py-1 bg-blue-500 text-white rounded ml-2"
//             disabled={!dateWindow || !dbEndDate || dateWindow.end >= dbEndDate}
//           >
//             →
//           </button>
//         </div>
//       </div>
//       <div className="grid grid-cols-2 gap-4">
//         {['bpm', 'step', 'calorie'].map((_, index) => (
//           <div 
//             key={index} 
//             ref={(el: HTMLDivElement | null) => { chartRefs.current[index] = el; }}
//             style={{ width: '100%', height: '300px' }} 
//           />
//         ))}
//       </div>
//     </div>
//   );
// };

// export default EChartsMinuteChart;

return (
    <div className='bg-white p-4 rounded-lg shadow'>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <button 
            onClick={() => moveWeek('backward')}
            className="px-2 py-1 bg-blue-500 text-white rounded mr-2"
            disabled={!dateWindow || !dbStartDate || dateWindow.start <= dbStartDate}
          >
            ←
          </button>
          <span className="mx-2">
            {dateWindow ? `${format(dateWindow.start, 'yyyy-MM-dd')} to ${format(dateWindow.end, 'yyyy-MM-dd')}` : 'No date selected'}
          </span>
          <button 
            onClick={() => moveWeek('forward')}
            className="px-2 py-1 bg-blue-500 text-white rounded ml-2"
            disabled={!dateWindow || !dbEndDate || dateWindow.end >= dbEndDate}
          >
            →
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {['bpm', 'step', 'calorie'].map((_, index) => (
          <div 
            key={index} 
            ref={(el: HTMLDivElement | null) => { chartRefs.current[index] = el; }}
            style={{ width: '100%', height: '300px' }} 
          />
        ))}
      </div>
    </div>
  );
};

export default EChartsWeeklyChart;