import React, { useState } from 'react';
import RmssdCalHeatmap from './CalHeatMapRmssd';
import SdnnCalHeatmap from './CalHeatMapSdnn';
import { addMonths, subMonths } from 'date-fns';

interface HrvDayData {
    ds: string;
    day_rmssd: number;
    day_sdnn: number;
}

interface CombinedHrvHeatmapProps {
    hrvDayData: HrvDayData[];
    firstDate: any;
}

const CombinedHrvHeatmap: React.FC<CombinedHrvHeatmapProps> = ({ hrvDayData, firstDate }) => {
    //const [startDate, setStartDate] = useState(() => subMonths(new Date(), 1));
    const [startDate, setStartDate] = useState(() => new Date(firstDate));

    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@in combinedhrvhratmap.tsx startdate : ', startDate)

    const handlePrevious = () => {
        setStartDate(prevDate => subMonths(prevDate, 1));
    };

    const handleNext = () => {
        setStartDate(prevDate => addMonths(prevDate, 1));
    };

    return (
        <div className="combined-hrv-heatmap">
            <div className="flex justify-between mb-4">
                <button onClick={handlePrevious} className="px-4 py-2 bg-blue-500 text-white rounded">
                    Previous
                </button>
                <button onClick={handleNext} className="px-4 py-2 bg-blue-500 text-white rounded">
                    Next
                </button>
            </div>
            <div className="heatmap-container" style={{ minHeight: '400px' }}>
                <RmssdCalHeatmap hrvDayData={hrvDayData} startDate={startDate} />
            </div>
            <div className="heatmap-container" style={{ minHeight: '400px' }}>
                <SdnnCalHeatmap hrvDayData={hrvDayData} startDate={startDate} />
            </div>
        </div>
    );
};

export default CombinedHrvHeatmap;