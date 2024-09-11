import React, { useState, useEffect } from 'react'
import axios from 'axios'
import RmssdCalendar from '../../components/RmssdCalendar';
import SdnnCalendar from '../../components/SdnnCalendar';

const API_URL = 'https://heart-rate-app10-hotofhe3yq-du.a.run.app'

interface HrvDayData {
    ds: string;
    day_rmssd: number;
    day_sdnn: number;
}

export default function Home() {
  const [hrvDayData, setHrvDayData] = useState<HrvDayData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');
    const widthParam = params.get('width');
    const heightParam = params.get('height');

    if (userId && widthParam && heightParam) {
      setWidth(parseInt(widthParam));
      setHeight(parseInt(heightParam));
      fetchHrvData(userId);
    } else {
      setError('Missing required parameters');
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
    <div style={{ width, height, overflow: 'auto' }}>
      <RmssdCalendar hrvDayData={hrvDayData} />
      <SdnnCalendar hrvDayData={hrvDayData} />
    </div>
  );
}