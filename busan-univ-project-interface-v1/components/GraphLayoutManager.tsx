import React, { useState } from 'react';
import AnalysisChart from './AnalysisChart';
import SleepChart from './SleepChart';

interface GraphLayoutManagerProps {
  analysisData: any[];
  predictionData: any[];
  stepData: any[];
  sleepData: any[];
  globalStartDate: Date;
  globalEndDate: Date;
  onBrushChange: (domain: [number, number] | null) => void;
}

const GraphLayoutManager: React.FC<GraphLayoutManagerProps> = ({
  analysisData,
  predictionData,
  stepData,
  sleepData,
  globalStartDate,
  globalEndDate,
  onBrushChange,
}) => {
  const [columnsCount, setColumnsCount] = useState(1);

  const renderCharts = () => {
    const charts = [
      <AnalysisChart
        key="sdnn"
        data={analysisData}
        globalStartDate={globalStartDate}
        globalEndDate={globalEndDate}
        onBrushChange={onBrushChange}
        title="SDNN : 정상 심박 간격(NN intervals)의 표준편차"
        dataKey="sdnn"
      />,
      <AnalysisChart
        key="rmssd"
        data={analysisData}
        globalStartDate={globalStartDate}
        globalEndDate={globalEndDate}
        onBrushChange={onBrushChange}
        title="RMSSD : 연속된 정상 심박 간격(NN intervals)차이의 제곱근 평균"
        dataKey="rmssd"
      />,
      <AnalysisChart
        key="step"
        data={stepData}
        isStep={true}
        globalStartDate={globalStartDate}
        globalEndDate={globalEndDate}
        onBrushChange={onBrushChange}
        title="시간별 걸음 수"
        dataKey="step"
      />,
      <AnalysisChart
        key="bpm"
        data={predictionData}
        isPrediction={true}
        globalStartDate={globalStartDate}
        globalEndDate={globalEndDate}
        onBrushChange={onBrushChange}
        title="심박수 BPM"
        dataKey="y"
      />,
      <SleepChart
        key="sleep"
        data={sleepData}
        onBrushChange={onBrushChange}
      />,
    ];

    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columnsCount}, 1fr)`, gap: '1rem' }}>
        {charts}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-4">
        <label className="mr-2">Columns:</label>
        <select
          value={columnsCount}
          onChange={(e) => setColumnsCount(Number(e.target.value))}
          className="border p-2 rounded"
        >
          {[1, 2, 3, 4, 5].map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>
      {renderCharts()}
    </div>
  );
};

export default GraphLayoutManager;