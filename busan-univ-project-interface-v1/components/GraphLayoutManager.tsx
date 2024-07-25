import React, { useState, useCallback } from 'react';
import AnalysisChart from './AnalysisChart';
import SleepChart from './SleepChart';
import CombinedChart from './CombinedChart';

interface GraphLayoutManagerProps {
  analysisData: any[];
  predictionData: any[];
  stepData: any[];
  sleepData: any[];
  calorieData: any[];
  globalStartDate: Date;
  globalEndDate: Date;
  viewMode: string;
  columnCount: number;
}

const GraphLayoutManager: React.FC<GraphLayoutManagerProps> = ({
  analysisData,
  predictionData,
  stepData,
  sleepData,
  calorieData,
  globalStartDate,
  globalEndDate,
  viewMode,
  columnCount,
}) => {
  // const [columnsCount, setColumnsCount] = useState(1);
  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);

  const handleBrushChange = useCallback((domain: [number, number] | null) => {
    setBrushDomain(domain);
  }, []);

  const renderSeparateCharts  = () => {
    const charts = [
      <AnalysisChart
        key="calorie"
        data={calorieData}
        isCalorie={true}
        globalStartDate={globalStartDate}
        globalEndDate={globalEndDate}
        brushDomain={brushDomain}
        title="시간별 칼로리 소모량"
        dataKey='calorie'
        syncId="healthData"
        showBrush={true}
      />,
      <AnalysisChart
        key="step"
        data={stepData}
        isStep={true}
        globalStartDate={globalStartDate}
        globalEndDate={globalEndDate}
        brushDomain={brushDomain}
        title="시간별 걸음 수"
        dataKey="step"
        syncId="healthData"
        showBrush={false}
      />,
      <AnalysisChart
        key="bpm"
        data={predictionData}
        isPrediction={true}
        globalStartDate={globalStartDate}
        globalEndDate={globalEndDate}
        brushDomain={brushDomain}
        title="심박수 BPM"
        dataKey="y"
        syncId="healthData"
        showBrush={false}
      />,
      <AnalysisChart
        key="sdnn"
        data={analysisData}
        globalStartDate={globalStartDate}
        globalEndDate={globalEndDate}
        brushDomain={brushDomain}
        onBrushChange={handleBrushChange}
        title="SDNN : 정상 심박 간격(NN intervals)의 표준편차"
        dataKey="sdnn"
        syncId="healthData"
        showBrush={false}
      />,
      <AnalysisChart
        key="rmssd"
        data={analysisData}
        globalStartDate={globalStartDate}
        globalEndDate={globalEndDate}
        brushDomain={brushDomain}
        title="RMSSD : 연속된 정상 심박 간격(NN intervals)차이의 제곱근 평균"
        dataKey="rmssd"
        syncId="healthData"
        showBrush={false}
      />,
      <SleepChart
        key="sleep"
        data={sleepData}
        globalStartDate={globalStartDate}
        globalEndDate={globalEndDate}
      />,
    ];

    return (
      <div className={`grid grid-cols-1 md:grid-cols-${columnCount} gap-4`}>
        {charts.map((chart, index) => (
          <div key={index} className="w-full">
            {chart}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {viewMode === 'separate' ? renderSeparateCharts() : (
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
      )}
    </div>
  );
};

export default GraphLayoutManager;