import React, { useState, useCallback } from 'react';
import AnalysisChart from './AnalysisChart';
import SleepChart from './SleepChart';
import CombinedChart from './CombinedChart';
import { Menu, LayoutGrid } from 'lucide-react';

interface GraphLayoutManagerProps {
  analysisData: any[];
  predictionData: any[];
  stepData: any[];
  sleepData: any[];
  calorieData: any[];
  globalStartDate: Date;
  globalEndDate: Date;
}

type Layout = 'combined' | 'grid2x2' | 'grid3x3' | 'vertical';

const ChartLayoutControls: React.FC<{ onLayoutChange: (layout: Layout) => void }> = ({ onLayoutChange }) => {
  return (
    <div className="absolute top-2 right-2 flex space-x-2">
      <button onClick={() => onLayoutChange('combined')} className="p-1 hover:bg-gray-200 rounded">
        <Menu size={20} />
      </button>
      <button onClick={() => onLayoutChange('grid2x2')} className="p-1 hover:bg-gray-200 rounded">
        <LayoutGrid size={20} />
      </button>
    </div>
  );
};

const GraphLayoutManager: React.FC<GraphLayoutManagerProps> = ({
  analysisData,
  predictionData,
  stepData,
  sleepData,
  calorieData,
  globalStartDate,
  globalEndDate,
}) => {
  const [layout, setLayout] = useState<Layout>('combined');
  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);

  const handleLayoutChange = useCallback((newLayout: Layout) => {
    setLayout(newLayout);
  }, []);

  const handleBrushChange = useCallback((domain: [number, number] | null) => {
    setBrushDomain(domain);
  }, []);

  const renderCharts = () => {
    switch (layout) {
      case 'combined':
        return (
          <CombinedChart
            analysisData={analysisData}
            predictionData={predictionData}
            stepData={stepData}
            calorieData={calorieData}
            globalStartDate={globalStartDate}
            globalEndDate={globalEndDate}
            brushDomain={brushDomain}
            onBrushChange={handleBrushChange}
          />
        );
      case 'grid2x2':
        return (
          <div className="grid grid-cols-2 gap-4">
            <AnalysisChart
              data={analysisData}
              globalStartDate={globalStartDate}
              globalEndDate={globalEndDate}
              brushDomain={brushDomain}
              onBrushChange={handleBrushChange}
              title="SDNN & RMSSD"
              dataKey="sdnn"
              syncId="healthData"
              showBrush={true}
            />
            <AnalysisChart
              data={predictionData}
              isPrediction={true}
              globalStartDate={globalStartDate}
              globalEndDate={globalEndDate}
              brushDomain={brushDomain}
              title="Heart Rate (BPM)"
              dataKey="y"
              syncId="healthData"
              showBrush={false}
            />
            <AnalysisChart
              data={stepData}
              isStep={true}
              globalStartDate={globalStartDate}
              globalEndDate={globalEndDate}
              brushDomain={brushDomain}
              title="Steps"
              dataKey="step"
              syncId="healthData"
              showBrush={false}
            />
            <SleepChart
              data={sleepData}
              globalStartDate={globalStartDate}
              globalEndDate={globalEndDate}
              brushDomain={brushDomain}
              onBrushChange={handleBrushChange}
            />
          </div>
        );
      // 다른 레이아웃 케이스를 여기에 추가할 수 있습니다.
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      <ChartLayoutControls onLayoutChange={handleLayoutChange} />
      {renderCharts()}
    </div>
  );
};

export default GraphLayoutManager;

//   const renderSeparateCharts  = () => {
//     const charts = [
//       <AnalysisChart
//         key="calorie"
//         data={calorieData}
//         isCalorie={true}
//         globalStartDate={globalStartDate}
//         globalEndDate={globalEndDate}
//         brushDomain={brushDomain}
//         title="시간별 칼로리 소모량"
//         dataKey='calorie'
//         syncId="healthData"
//         showBrush={true}
//       />,
//       <AnalysisChart
//         key="step"
//         data={stepData}
//         isStep={true}
//         globalStartDate={globalStartDate}
//         globalEndDate={globalEndDate}
//         brushDomain={brushDomain}
//         title="시간별 걸음 수"
//         dataKey="step"
//         syncId="healthData"
//         showBrush={false}
//       />,
//       <AnalysisChart
//         key="bpm"
//         data={predictionData}
//         isPrediction={true}
//         globalStartDate={globalStartDate}
//         globalEndDate={globalEndDate}
//         brushDomain={brushDomain}
//         title="심박수 BPM"
//         dataKey="y"
//         syncId="healthData"
//         showBrush={false}
//       />,
//       <AnalysisChart
//         key="sdnn"
//         data={analysisData}
//         globalStartDate={globalStartDate}
//         globalEndDate={globalEndDate}
//         brushDomain={brushDomain}
//         onBrushChange={handleBrushChange}
//         title="SDNN : 정상 심박 간격(NN intervals)의 표준편차"
//         dataKey="sdnn"
//         syncId="healthData"
//         showBrush={false}
//       />,
//       <AnalysisChart
//         key="rmssd"
//         data={analysisData}
//         globalStartDate={globalStartDate}
//         globalEndDate={globalEndDate}
//         brushDomain={brushDomain}
//         title="RMSSD : 연속된 정상 심박 간격(NN intervals)차이의 제곱근 평균"
//         dataKey="rmssd"
//         syncId="healthData"
//         showBrush={false}
//       />,
//       <SleepChart
//         key="sleep"
//         data={sleepData}
//         globalStartDate={globalStartDate}
//         globalEndDate={globalEndDate}
//       />,
//     ];

//     return (
//       <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columnsCount}, 1fr)`, gap: '1rem' }}>
//         {charts}
//       </div>
//     );
//   };

//   return (
//     <div>
//       <div className="mb-4">
//         <label className="mr-2">Columns:</label>
//         <select
//           value={columnsCount}
//           onChange={(e) => setColumnsCount(Number(e.target.value))}
//           className="border p-2 rounded"
//         >
//           {[1, 2, 3, 4, 5].map(num => (
//             <option key={num} value={num}>{num}</option>
//           ))}
//         </select>
//       </div>
//       {viewMode === 'separate' ? renderSeparateCharts() : (
//         <CombinedChart
//           analysisData={analysisData}
//           predictionData={predictionData}
//           stepData={stepData}
//           calorieData={calorieData}
//           globalStartDate={globalStartDate}
//           globalEndDate={globalEndDate}
//         />
//       )}
//     </div>
//   );
// };

// export default GraphLayoutManager;