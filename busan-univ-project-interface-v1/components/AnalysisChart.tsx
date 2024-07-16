import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, TooltipProps } from 'recharts';
import { format, parseISO, addHours } from 'date-fns';
import { HelpCircle } from 'lucide-react';


interface AnalysisChartProps {
  data: any[];
  isStep?: boolean;
  isPrediction?: boolean;
  globalStartDate: Date;
  globalEndDate: Date;
  brushDomain: [number, number] | null;
  onBrushChange?: (domain: [number, number] | null) => void;
  title: string;
  dataKey: string;
  syncId: string;
  showBrush: boolean;
}

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow">
        <p className="text-sm font-bold text-black">{`Date: ${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-black">
            {`${entry.name}: ${entry.value != null ? Number(entry.value).toFixed(2) : 'N/A'} ${entry.name === 'BPM' ? 'bpm' : entry.name === 'Steps' ? '' : 'ms'}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ExplanationTooltip: React.FC<{ content: string }> = ({ content }) => (
  <div className="absolute z-10 p-2 bg-white border border-gray-300 rounded shadow" style={{ width: '300px', left: '25px', top: '-5px' }}>
    <p className="text-sm text-black whitespace-pre-line">{content}</p>
  </div>
);

const AnalysisChart: React.FC<AnalysisChartProps> = ({ 
  data, 
  isStep = false, 
  isPrediction = false, 
  globalStartDate, 
  globalEndDate, 
  brushDomain,
  onBrushChange,
  title, 
  dataKey,
  syncId,
  showBrush
}) => {
  const [showExplanation, setShowExplanation] = useState(false);

  const formattedData = useMemo(() => {
    if (isStep) {
      return data.map(item => ({
        ...item,
        ds: format(parseISO(item.ds), 'yyyy-MM-dd HH:mm')
      }));
    }
    
    const sortedData = [...data].sort((a, b) => new Date(a.ds).getTime() - new Date(b.ds).getTime());
    const filledData = [];
    let currentDate = new Date(globalStartDate);
    const endDate = new Date(globalEndDate);

    while (currentDate <= endDate) {
      const existingData = sortedData.find(item => {
        const itemDate = new Date(item.ds);
        return itemDate.getFullYear() === currentDate.getFullYear() &&
               itemDate.getMonth() === currentDate.getMonth() &&
               itemDate.getDate() === currentDate.getDate() &&
               itemDate.getHours() === currentDate.getHours();
      });

      filledData.push({
        ds: format(currentDate, 'yyyy-MM-dd HH:mm'),
        [dataKey]: existingData ? existingData[dataKey] : null,
      });

      currentDate = addHours(currentDate, 1);
    }

    return filledData;
  }, [data, globalStartDate, globalEndDate, isPrediction, isStep, dataKey]);

  const handleBrushChange = (domain: any) => {
    if (onBrushChange) {
      if (domain && domain.startIndex !== undefined && domain.endIndex !== undefined) {
        const startTime = new Date(formattedData[domain.startIndex].ds).getTime();
        const endTime = new Date(formattedData[domain.endIndex].ds).getTime();
        // 브러시 범위가 데이터 범위를 벗어나지 않도록 조정
        const adjustedStartTime = Math.max(startTime, globalStartDate.getTime());
        const adjustedEndTime = Math.min(endTime, globalEndDate.getTime());
        onBrushChange([adjustedStartTime, adjustedEndTime]);
      } else {
        onBrushChange(null);
      }
    }
  };

  const explanation = isStep
    ? "이 그래프는 시간별 걸음 수를 보여줍니다."
    : isPrediction
    ? "이 그래프는 예측된 심박수 데이터를 보여줍니다. 실제 측정값(BPM)을 나타내며, 향후 예측된 값들도 포함될 수 있습니다."
    : dataKey === "sdnn"
    ? "* 전체적인 HRV를 나타내는 지표로써, 장기간의 기록에서 모든 주기성을 반영\n\n* SDNN이 높다면 전반적인 자율신경계의 변동성이 크다는 것을 의미, 건강한 심장 기능과 관련이 있습니다.\n\n* SDNN이 낮다면 자율신경계의 변동성이 낮아 스트레스에 취약할 수 있습니다. 또한, 종종 심혈관 질환과 연관이 있습니다."
    : "* 단기 HRV를 반영하며, 주로 보교감 신경계의 활동을 나타냄\n\nRMSSD가 높다면 부교감신경의 활성도가 높다는 것을 의미, 일반적으로 좋은 회복 능력과 관련이 있습니다.\n\n* RMSSD가 낮다면 부교감신경의 활성도가 낮아 스트레스,피로,우울증이 있을 수 있습니다.";

    return (
      <div className="w-full h-[400px] bg-white p-4 rounded-lg shadow-lg mb-8 relative">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-bold text-black mr-2">{title}</h2>
          <div
            className="relative"
            onMouseEnter={() => setShowExplanation(true)}
            onMouseLeave={() => setShowExplanation(false)}
          >
            <HelpCircle size={18} className="text-gray-500 cursor-help" />
            {showExplanation && <ExplanationTooltip content={explanation} />}
          </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          {isStep ? (
            <BarChart
              data={formattedData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              syncId={syncId}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="ds"
                tick={{ fill: '#666', fontSize: 10 }}
                tickFormatter={(tick) => format(new Date(tick), 'MM-dd HH:mm')}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fill: '#666', fontSize: 12 }}
                label={{ value: 'steps', angle: -90, position: 'insideLeft', fill: '#666' }} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey={dataKey} fill="#ffa726" name="Steps" />
              {showBrush && (
                <Brush
                  dataKey="ds"
                  height={30}
                  stroke="#8884d8"
                  onChange={handleBrushChange}
                  startIndex={brushDomain ? brushDomain[0] : undefined}
                  endIndex={brushDomain ? brushDomain[1] : undefined}
                />
              )}
            </BarChart>
          ) : (
            <LineChart
              data={formattedData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              syncId={syncId}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="ds"
                tick={{ fill: '#666', fontSize: 10 }}
                tickFormatter={(tick) => format(new Date(tick), 'MM-dd HH:mm')}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fill: '#666', fontSize: 12 }}
                label={{ value: isPrediction ? 'bpm' : 'ms', angle: -90, position: 'insideLeft', fill: '#666' }} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} />
              <Line 
                type="linear" 
                dataKey={dataKey} 
                stroke={isPrediction ? "#FF5733" : "#8884d8"} 
                name={isPrediction ? "BPM" : dataKey.toUpperCase()} 
                dot={{ r: 3, strokeWidth: 1 }}
                strokeWidth={2}
                connectNulls={false}
              />
                {showBrush && (
                  <Brush
                    dataKey="ds"
                    height={30}
                    stroke="#8884d8"
                    onChange={handleBrushChange}
                    startIndex={brushDomain ? Math.max(0, formattedData.findIndex(d => new Date(d.ds).getTime() >= brushDomain[0])) : undefined}
                    endIndex={brushDomain ? Math.min(formattedData.length - 1, formattedData.findIndex(d => new Date(d.ds).getTime() >= brushDomain[1])) : undefined}
                  />
                )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };
  
  export default AnalysisChart;



// BPM 전체 다 나오는 버전
// import React, { useState, useMemo } from 'react';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, TooltipProps } from 'recharts';
// import { format, parseISO, isValid, addMinutes, isBefore } from 'date-fns';
// import { HelpCircle } from 'lucide-react';

// interface AnalysisData {
//   ds: string;
//   sdnn: number | null;
//   rmssd: number | null;
// }

// interface PredictionData {
//   ds: string;
//   y: number | null;
// }

// type DataItem = AnalysisData | PredictionData;

// interface AnalysisChartProps {
//   data: DataItem[];
//   isPrediction?: boolean;
//   globalStartDate: Date;
//   globalEndDate: Date;
//   onBrushChange: (domain: [number, number] | null) => void;
// }

// const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
//   if (active && payload && payload.length) {
//     return (
//       <div className="bg-white p-2 border border-gray-300 rounded shadow">
//         <p className="text-sm font-bold text-black">{`Date: ${label}`}</p>
//         {payload.map((entry, index) => (
//           <p key={index} className="text-sm text-black">
//             {`${entry.name}: ${entry.value != null ? Number(entry.value).toFixed(2) : 'N/A'} ${entry.name === 'Y' ? 'bpm' : 'ms'}`}
//           </p>
//         ))}
//       </div>
//     );
//   }
//   return null;
// };

// const ExplanationTooltip: React.FC<{ content: string }> = ({ content }) => (
//   <div className="absolute z-10 p-2 bg-white border border-gray-300 rounded shadow" style={{ width: '300px', left: '25px', top: '-5px' }}>
//     <p className="text-sm text-black whitespace-pre-line">{content}</p>
//   </div>
// );

// const AnalysisChart: React.FC<AnalysisChartProps> = ({ data, isPrediction = false, globalStartDate, globalEndDate, onBrushChange }) => {
//   const [showExplanation, setShowExplanation] = useState(false);

//   const formattedData = useMemo(() => {
//     const sortedData = [...data].sort((a, b) => new Date(a.ds).getTime() - new Date(b.ds).getTime());
//     const filledData: DataItem[] = [];
    
//     let currentDate = new Date(globalStartDate);
//     const endDate = new Date(globalEndDate);

//     while (isBefore(currentDate, endDate) || currentDate.getTime() === endDate.getTime()) {
//       const existingData = sortedData.find(item => {
//         const itemDate = new Date(item.ds);
//         return itemDate.getTime() === currentDate.getTime();
//       });

//       if (existingData) {
//         filledData.push({
//           ...existingData,
//           ds: format(currentDate, 'yyyy-MM-dd HH:mm:ss')
//         });
//       } else {
//         if (isPrediction) {
//           filledData.push({
//             ds: format(currentDate, 'yyyy-MM-dd HH:mm:ss'),
//             y: null
//           });
//         } else {
//           filledData.push({
//             ds: format(currentDate, 'yyyy-MM-dd HH:mm:ss'),
//             sdnn: null,
//             rmssd: null
//           });
//         }
//       }

//       currentDate = addMinutes(currentDate, 1);
//     }

//     return filledData;
//   }, [data, globalStartDate, globalEndDate, isPrediction]);

//   // const formattedData = useMemo(() => {
//   //   const sortedData = [...data].sort((a, b) => new Date(a.ds).getTime() - new Date(b.ds).getTime());
//   //   const filledData: DataItem[] = [];

//   //   let currentDate = new Date(globalStartDate);
//   //   const endDate = new Date(globalEndDate);

//   //   while (currentDate <= endDate) {
//   //     const existingData = sortedData.find(item => {
//   //       const itemDate = new Date(item.ds);
//   //       return itemDate.getFullYear() === currentDate.getFullYear() &&
//   //              itemDate.getMonth() === currentDate.getMonth() &&
//   //              itemDate.getDate() === currentDate.getDate() &&
//   //              itemDate.getHours() === currentDate.getHours();
//   //     });

//   //     if (isPrediction) {
//   //       filledData.push({
//   //         ds: format(currentDate, 'yyyy-MM-dd HH:mm'),
//   //         y: (existingData as PredictionData | undefined)?.y ?? null,
//   //       });
//   //     } else {
//   //       filledData.push({
//   //         ds: format(currentDate, 'yyyy-MM-dd HH:mm'),
//   //         sdnn: (existingData as AnalysisData | undefined)?.sdnn ?? null,
//   //         rmssd: (existingData as AnalysisData | undefined)?.rmssd ?? null,
//   //       });
//   //     }

//   //     currentDate = addHours(currentDate, 1);
//   //   }

//   //   return filledData;
//   // }, [data, globalStartDate, globalEndDate, isPrediction]);

//   const handleBrushChange = (newDomain: any) => {
//     if (Array.isArray(newDomain) && newDomain.length === 2) {
//       onBrushChange(newDomain as [number, number]);
//     }
//   };

//   const renderChart = (
//     chartData: DataItem[],
//     title: string,
//     dataKey: 'y' | 'sdnn' | 'rmssd',
//     color: string,
//     syncId: string,
//     explanation: string,
//     showBrush: boolean
//   ) => {
//     const isPredictionData = (item: DataItem): item is PredictionData => 'y' in item;
//     const isAnalysisData = (item: DataItem): item is AnalysisData => 'sdnn' in item && 'rmssd' in item;

//     return (
//       <div className="w-full h-[400px] bg-white p-4 rounded-lg shadow-lg mb-8 relative">
//         <div className="flex items-center mb-4">
//           <h2 className="text-xl font-bold text-black mr-2">{title}</h2>
//           <div
//             className="relative"
//             onMouseEnter={() => setShowExplanation(true)}
//             onMouseLeave={() => setShowExplanation(false)}
//           >
//             <HelpCircle size={18} className="text-gray-500 cursor-help" />
//             {showExplanation && <ExplanationTooltip content={explanation} />}
//           </div>
//         </div>
//         <ResponsiveContainer width="100%" height="100%">
//           <LineChart
//             data={chartData}
//             margin={{ top: 5, right: 30, left: 20, bottom: 35 }}
//             syncId={syncId}
//           >
//             <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//             <XAxis
//               dataKey="ds"
//               tick={{ fill: '#666', fontSize: 10 }}
//               tickFormatter={(tick) => format(new Date(tick), 'MM-dd HH:mm')}
//               angle={-45}
//               textAnchor="end"
//               height={60}
//             />
//             <YAxis
//               tick={{ fill: '#666', fontSize: 12 }}
//               label={{ value: isPrediction ? 'bpm' : 'ms', angle: -90, position: 'insideLeft', fill: '#666' }}
//             />
//             <Tooltip content={<CustomTooltip />} />
//             <Legend verticalAlign="top" height={36} />
//             {isPredictionData(chartData[0]) && (
//               <Line
//                 type="linear"
//                 dataKey="y"
//                 stroke={color}
//                 name="BPM"
//                 dot={{ r: 2, strokeWidth: 1 }}
//                 strokeWidth={2}
//                 connectNulls={false}
//               />
//             )}
//             {isAnalysisData(chartData[0]) && (
//               <Line
//                 type="linear"
//                 dataKey={dataKey}
//                 stroke={color}
//                 name={dataKey.toUpperCase()}
//                 dot={{ r: 2, strokeWidth: 1 }}
//                 strokeWidth={2}
//                 connectNulls={false}
//               />
//             )}
//             {showBrush && (
//               <Brush
//                 dataKey="ds"
//                 height={30}
//                 stroke={color}
//                 onChange={handleBrushChange}
//               />
//             )}
//           </LineChart>
//         </ResponsiveContainer>
//       </div>
//     );
//   };

//   const sdnnExplanation = "* 전체적인 HRV를 나타내는 지표로써, 장기간의 기록에서 모든 주기성을 반영\n\n* SDNN이 높다면 전반적인 자율신경계의 변동성이 크다는 것을 의미, 건강한 심장 기능과 관련이 있습니다.\n\n* SDNN이 낮다면 자율신경계의 변동성이 낮아 스트레스에 취약할 수 있습니다. 또한, 종종 심혈관 질환과 연관이 있습니다.";
//   const rmssdExplanation = "* 단기 HRV를 반영하며, 주로 보교감 신경계의 활동을 나타냄\n\nRMSSD가 높다면 부교감신경의 활성도가 높다는 것을 의미, 일반적으로 좋은 회복 능력과 관련이 있습니다.\n\n* RMSSD가 낮다면 부교감신경의 활성도가 낮아 스트레스,피로,우울증이 있을 수 있습니다.";
//   const predictionExplanation = "이 그래프는 예측된 심박수 데이터를 보여줍니다. 실제 측정값(Y)을 나타내며, 향후 예측된 값들도 포함될 수 있습니다.";

//   if (isPrediction) {
//     return renderChart(formattedData, "심박수 BPM", "y", "#FF5733", "sync", predictionExplanation, false);
//   }

//   return (
//     <div>
//       {renderChart(formattedData, "SDNN : 정상 심박 간격(NN intervals)의 표준편차", "sdnn", "#8884d8", "sync", sdnnExplanation, true)}
//       {renderChart(formattedData, "RMSSD : 연속된 정상 심박 간격(NN intervals)차이의 제곱근 평균", "rmssd", "#82ca9d", "sync", rmssdExplanation, false)}
//     </div>
//   );
// };

// export default AnalysisChart;


