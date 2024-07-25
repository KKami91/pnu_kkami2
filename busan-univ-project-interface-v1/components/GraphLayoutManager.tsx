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

  const renderSeparateCharts = () => {
    const charts = [
      <AnalysisChart
        key="sdnn"
        data={analysisData}
        globalStartDate={globalStartDate}
        globalEndDate={globalEndDate}
        brushDomain={brushDomain}
        onBrushChange={handleBrushChange}
        title="SDNN"
        dataKey="sdnn"
        syncId="healthData"
        showBrush={true}
      />,
      <AnalysisChart
        key="rmssd"
        data={analysisData}
        globalStartDate={globalStartDate}
        globalEndDate={globalEndDate}
        brushDomain={brushDomain}
        title="RMSSD"
        dataKey="rmssd"
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
        title="Heart Rate (BPM)"
        dataKey="y"
        syncId="healthData"
        showBrush={false}
      />,
      <AnalysisChart
        key="steps"
        data={stepData}
        isStep={true}
        globalStartDate={globalStartDate}
        globalEndDate={globalEndDate}
        brushDomain={brushDomain}
        title="Steps"
        dataKey="step"
        syncId="healthData"
        showBrush={false}
      />,
      <AnalysisChart
        key="calories"
        data={calorieData}
        isCalorie={true}
        globalStartDate={globalStartDate}
        globalEndDate={globalEndDate}
        brushDomain={brushDomain}
        title="Calories"
        dataKey="calorie"
        syncId="healthData"
        showBrush={false}
      />,
      <SleepChart
        key="sleep"
        data={sleepData}
        globalStartDate={globalStartDate}
        globalEndDate={globalEndDate}
        brushDomain={brushDomain}
        onBrushChange={handleBrushChange}
      />,
    ];

    return (
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
          gap: '1rem'
        }}
      >
        {charts}
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