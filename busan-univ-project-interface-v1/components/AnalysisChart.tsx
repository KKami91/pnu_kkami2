// import React from 'react';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';
// import { format, parseISO, subDays, isValid } from 'date-fns';

// interface DataItem {
//   ds: string;
//   sdnn: number;
//   rmssd: number;
// }

// interface AnalysisChartProps {
//   data: DataItem[];
// }

// const CustomTooltip = ({ active, payload, label }: any) => {
//   if (active && payload && payload.length) {
//     return (
//       <div className="bg-white p-2 border border-gray-300 rounded shadow">
//         <p className="text-sm font-bold text-black">{`Date: ${label}`}</p>
//         {payload.map((entry: any, index: number) => (
//           <p key={index} className="text-sm text-black">
//             {`${entry.name}: ${entry.value?.toFixed(2) ?? 'N/A'} ms`}
//           </p>
//         ))}
//       </div>
//     );
//   }
//   return null;
// };

// const AnalysisChart: React.FC<AnalysisChartProps> = ({ data }) => {
//   console.log('Received data:', data); // 데이터 로깅

//   if (!Array.isArray(data) || data.length === 0) {
//     return <div className="text-center text-red-500">No valid data available for the chart.</div>;
//   }

//   const formattedData = data
//     .filter(item => item && typeof item === 'object' && 'ds' in item)
//     .map(item => {
//       const parsedDate = parseISO(item.ds);
//       return {
//         ...item,
//         ds: isValid(parsedDate) ? format(parsedDate, 'yyyy-MM-dd HH:mm') : 'Invalid Date',
//       };
//     })
//     .filter(item => item.ds !== 'Invalid Date');

//   console.log('Formatted data:', formattedData); // 포맷된 데이터 로깅

//   if (formattedData.length === 0) {
//     return <div className="text-center text-red-500">No valid dates found in the data.</div>;
//   }

//   const renderChart = (chartData: any[], title: string, dataKey: string) => {
//     return (
//       <div className="w-full h-[400px] bg-white p-4 rounded-lg shadow-lg mb-8">
//         <h2 className="text-xl font-bold mb-4 text-black text-center">{title}</h2>
//         <ResponsiveContainer width="100%" height="100%">
//           <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
//             <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//             <XAxis
//               dataKey="ds"
//               tick={{ fill: '#666', fontSize: 12 }}
//               tickFormatter={(tick) => format(new Date(tick), 'MM-dd HH:mm')}
//             />
//             <YAxis
//               tick={{ fill: '#666', fontSize: 12 }}
//               domain={['auto', 'auto']}
//               label={{ value: '', angle: -90, position: 'insideLeft', fill: '#666' }}
//             />
//             <Tooltip content={<CustomTooltip />} />
//             <Legend verticalAlign="top" height={36} />
//             <Line
//               type="monotone"
//               dataKey={dataKey}
//               stroke="#8884d8"
//               name={dataKey.toUpperCase()}
//               dot={false}
//               strokeWidth={2}
//             />
//           </LineChart>
//         </ResponsiveContainer>
//       </div>
//     );
//   };

//   return (
//     <div>
//       {renderChart(formattedData, "SDNN Analysis", "sdnn")}
//       {renderChart(formattedData, "RMSSD Analysis", "rmssd")}
//     </div>
//   );
// };

// export default AnalysisChart;

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea, Brush } from 'recharts';
import { format, parseISO } from 'date-fns';

interface DataItem {
  ds: string;
  sdnn: number;
  rmssd: number;
}

interface AnalysisChartProps {
  data: DataItem[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow">
        <p className="text-sm font-bold text-black">{`Date: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm text-black">
            {`${entry.name}: ${entry.value?.toFixed(2) ?? 'N/A'} ms`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AnalysisChart: React.FC<AnalysisChartProps> = ({ data }) => {
  const [sdnnState, setSdnnState] = useState({
    refAreaLeft: null as string | null,
    refAreaRight: null as string | null,
    left: 'dataMin' as string | number,
    right: 'dataMax' as string | number,
    top: 'dataMax+1' as string | number,
    bottom: 'dataMin-1' as string | number,
  });

  const [rmssdState, setRmssdState] = useState({
    refAreaLeft: null as string | null,
    refAreaRight: null as string | null,
    left: 'dataMin' as string | number,
    right: 'dataMax' as string | number,
    top: 'dataMax+1' as string | number,
    bottom: 'dataMin-1' as string | number,
  });

  const formattedData = data
    .filter(item => item && typeof item === 'object' && 'ds' in item)
    .map(item => ({
      ...item,
      ds: format(parseISO(item.ds), 'yyyy-MM-dd HH:mm'),
    }))
    .filter(item => item.ds !== 'Invalid Date');

  const getAxisYDomain = (from: number, to: number, ref: keyof DataItem, offset: number) => {
    const refData = formattedData.slice(from, to);
    let [bottomVal, topVal] = [refData[0][ref], refData[0][ref]];
    refData.forEach((d) => {
      if (d[ref] > topVal) topVal = d[ref];
      if (d[ref] < bottomVal) bottomVal = d[ref];
    });
    
    return [(bottomVal as number) - offset, (topVal as number) + offset];
  };

  const zoom = (setState: React.Dispatch<React.SetStateAction<typeof sdnnState>>, state: typeof sdnnState) => {
    if (state.refAreaLeft === state.refAreaRight || state.refAreaRight === null) {
      setState(prev => ({ ...prev, refAreaLeft: null, refAreaRight: null }));
      return;
    }

    let [leftIndex, rightIndex] = [state.refAreaLeft, state.refAreaRight].map(x => 
      formattedData.findIndex(item => item.ds === x)
    );

    if (leftIndex > rightIndex) 
      [leftIndex, rightIndex] = [rightIndex, leftIndex];

    const [bottomVal, topVal] = getAxisYDomain(leftIndex, rightIndex, 'sdnn', 1);
    
    setState({
      refAreaLeft: null,
      refAreaRight: null,
      left: formattedData[leftIndex].ds,
      right: formattedData[rightIndex].ds,
      bottom: bottomVal,
      top: topVal,
    });
  };

  const zoomOut = (setState: React.Dispatch<React.SetStateAction<typeof sdnnState>>) => {
    setState({
      refAreaLeft: null,
      refAreaRight: null,
      left: 'dataMin',
      right: 'dataMax',
      top: 'dataMax+1',
      bottom: 'dataMin',
    });
  };

  const renderChart = (
    chartData: DataItem[], 
    title: string, 
    dataKey: keyof DataItem,
    state: typeof sdnnState,
    setState: React.Dispatch<React.SetStateAction<typeof sdnnState>>
  ) => {
    return (
      <div className="w-full h-[500px] bg-white p-4 rounded-lg shadow-lg mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-black">{title}</h2>
          <button onClick={() => zoomOut(setState)} className="bg-blue-500 text-white px-4 py-2 rounded">
            Zoom Out
          </button>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="ds"
              tick={{ fill: '#666', fontSize: 10 }}
              tickFormatter={(tick) => format(new Date(tick), 'MM-dd HH:mm')}
              angle={-45}
              textAnchor="end"
              height={60}
              domain={[state.left, state.right]}
            />
            <YAxis
              tick={{ fill: '#666', fontSize: 12 }}
              domain={[state.bottom, state.top]}
              label={{ value: '', angle: -90, position: 'insideLeft', fill: '#666' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#8884d8"
              name={dataKey.toUpperCase()}
              dot={false}
              strokeWidth={2}
            />
            {state.refAreaLeft && state.refAreaRight ? (
              <ReferenceArea x1={state.refAreaLeft} x2={state.refAreaRight} strokeOpacity={0.3} />
            ) : null}
            <Brush dataKey="ds" height={30} stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div>
      {renderChart(formattedData, "SDNN Analysis", "sdnn", sdnnState, setSdnnState)}
      {renderChart(formattedData, "RMSSD Analysis", "rmssd", rmssdState, setRmssdState)}
    </div>
  );
};

export default AnalysisChart;