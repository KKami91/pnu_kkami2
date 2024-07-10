import { useState, useEffect  } from 'react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import AnalysisChart from '../../components/AnalysisChart';

const users = ['hswchaos@gmail.com', 'subak63@gmail.com']
const API_URL = 'https://heart-rate-app10-hotofhe3yq-du.a.run.app';

const LoadingSpinner = () => (
  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ml-2">
    <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
  </div>
);

const SkeletonLoader = () => (
  <div className="animate-pulse">
    <div className="h-64 bg-gray-300 rounded"></div>
    <div className="mt-4 h-4 bg-gray-300 rounded w-3/4"></div>
    <div className="mt-2 h-4 bg-gray-300 rounded w-1/2"></div>
  </div>
);

export default function Home() {
  const [selectedUser, setSelectedUser] = useState('')
  const [message, setMessage] = useState('')
  const [analysisDates, setAnalysisDates] = useState([])
  const [predictionDates, setPredictionDates] = useState([])
  const [analysisSelectedDate, setAnalysisSelectedDate] = useState('')
  const [predictionSelectedDate, setPredictionSelectedDate] = useState('')
  const [analysisGraphData, setAnalysisGraphData] = useState([])
  const [predictionGraphData, setPredictionGraphData] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const [isLoadingUser, setIsLoadingUser] = useState(false)
  const [isLoadingDate, setIsLoadingDate] = useState(false)

  const handleAnalysisDateSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const date = e.target.value
    setAnalysisSelectedDate(date)
    if (date) {
      setIsLoadingDate(true)
      await fetchAnalysisGraphData(selectedUser, date)
      setIsLoadingDate(false)
    }
  }

  const handlePredictionDateSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const date = e.target.value
    setPredictionSelectedDate(date)
    if (date) {
      setIsLoadingDate(true)
      await fetchPredictionGraphData(selectedUser, date)
      setIsLoadingDate(false)
    }
  }

  const handleUserSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const user = e.target.value
    setSelectedUser(user)
    setAnalysisSelectedDate('')
    setPredictionSelectedDate('')
    setAnalysisDates([])
    setPredictionDates([])
    if (user) {
      setIsLoadingUser(true)
      await checkDb(user)
      await fetchAnalysisDates(user)
      await fetchPredictionDates(user)
      setIsLoadingUser(false)
    }
  }

  const checkDb = async (user: string) => {
    try {
      const response = await axios.post(`${API_URL}/check_db_analysis`, { user_email: user })
    } catch (error) {
      setMessage(`Error occurred: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const fetchAnalysisDates = async (user: string) => {
    try {
      const response = await axios.get(`${API_URL}/analysis_dates/${user}`);
      setAnalysisDates(response.data.dates);
    } catch (error) {
      setMessage(`Error fetching analysis dates: ${error instanceof Error ? error.message : String(error)}`);
      setAnalysisDates([]);
    }
  }

  const fetchPredictionDates = async (user: string) => {
    try {
      const response = await axios.get(`${API_URL}/prediction_dates/${user}`);
      setPredictionDates(response.data.dates);
    } catch (error) {
      setMessage(`Error fetching prediction dates: ${error instanceof Error ? error.message : String(error)}`);
      setPredictionDates([]);
    }
  }

  const fetchAnalysisGraphData = async (user: string, date: string) => {
    try {
      const response = await axios.get(`${API_URL}/analysis_data/${user}/${date}`);
      setAnalysisGraphData(response.data.data);
    } catch (error) {
      setMessage(`Error fetching analysis graph data: ${error instanceof Error ? error.message : String(error)}`);
      setAnalysisGraphData([]);
    }
  }

  const fetchPredictionGraphData = async (user: string, date: string) => {
    try {
      const response = await axios.get(`${API_URL}/prediction_data/${user}/${date}`);
      setPredictionGraphData(response.data.data);
    } catch (error) {
      setMessage(`Error fetching prediction graph data: ${error instanceof Error ? error.message : String(error)}`);
      setPredictionGraphData([]);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Heart Rate Analysis Dashboard</h1>
      <div className="mb-4 flex items-center">
        <label className="mr-2">계정 선택:</label>
        <select 
          value={selectedUser} 
          onChange={handleUserSelect}
          className="border p-2 rounded mr-2"
        >
          <option value="">Select a user</option>
          {users.map(user => (
            <option key={user} value={user}>{user}</option>
          ))}
        </select>
        {isLoadingUser && <LoadingSpinner />}
      </div>
      {selectedUser && (
        <>
          <div className="mb-4 flex items-center">
            <label className="mr-2">분석 저장 날짜:</label>
            {analysisDates.length > 0 ? (
              <select 
                value={analysisSelectedDate} 
                onChange={handleAnalysisDateSelect}
                className="border p-2 rounded mr-2"
              >
                <option value="">Select a analysis date</option>
                {analysisDates.map(date => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
            ) : (
              <p>No analysis dates available</p>
            )}
            {isLoadingDate && <LoadingSpinner />}
          </div>
          <div className="mb-4 flex items-center">
            <label className="mr-2">심박수 저장 날짜:</label>
            {predictionDates.length > 0 ? (
              <select 
                value={predictionSelectedDate} 
                onChange={handlePredictionDateSelect}
                className="border p-2 rounded mr-2"
              >
                <option value="">Select a BPM date</option>
                {predictionDates.map(date => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
            ) : (
              <p>No BPM dates available</p>
            )}
            {isLoadingDate && <LoadingSpinner />}
          </div>
        </>
      )}
      
      {message && <p className="mt-4">{message}</p>}
      <div className="mt-8">
        {isLoadingDate ? (
          <SkeletonLoader />
        ) : analysisGraphData.length > 0 && predictionGraphData.length > 0 ? (
          <AnalysisChart analysisData={analysisGraphData} heartRateData={predictionGraphData} />
        ) : (
          <div className="text-center text-red-500">Please select both analysis and heart rate dates to view the chart.</div>
        )}
      </div>
    </div>
  )
}