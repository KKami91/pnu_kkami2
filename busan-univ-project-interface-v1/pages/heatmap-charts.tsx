import React, { useState, useEffect } from 'react'
import axios from 'axios'
import RmssdCalendar from '../components/RmssdCalendar';
import SdnnCalendar from '../components/SdnnCalendar';
import SdnnCalHeatmap from '../components/CalHeatMapSdnnMobile'
import RmssdCalHeatmap from '../components/CalHeatMapRmssdMobile'

const API_URL = 'https://heart-rate-app10-hotofhe3yq-du.a.run.app'

interface HrvDayData {
  ds: string;
  day_rmssd: number;
  day_sdnn: number;
}

HeatmapCharts.getLayout = (page: React.ReactElement) => page;

export default function HeatmapCharts() {
const [hrvDayData, setHrvDayData] = useState<HrvDayData[]>([]);
const [error, setError] = useState<string | null>(null);
const [dimensions, setDimensions] = useState({ width: '100%', height: '100%' });

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('userId');
  const width = params.get('width');
  const height = params.get('height');

  if (userId) {
    fetchHrvData(userId);
  } else {
    setError('Missing userId parameter');
  }

  if (width && height) {
    setDimensions({ width: `${width}px`, height: `${height}px` });
  }
}, []);

const fetchHrvData = async (user: string) => {
  try {
    const response = await axios.get(`${API_URL}/feature_day_div/${user}`);
    setHrvDayData(response.data.day_hrv);
  } catch (error) {
    console.error('Error fetching HRV data:', error);
    setError(`Error fetching HRV data: ${error instanceof Error ? error.message : String(error)}`);
  }
};

if (error) {
  return <div style={{ color: 'red' }}>{error}</div>;
}

return (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    padding: '20px',
    width: dimensions.width,
    height: dimensions.height,
    overflow: 'auto'
  }}>
    <div style={{ width: '100%', marginBottom: '20px' }}>
      <RmssdCalHeatmap hrvDayData={hrvDayData} />
    </div>
    {/* <div style={{ width: '100%' }}>
      <SdnnCalHeatmap hrvDayData={hrvDayData} />
    </div> */}
  </div>
);
}