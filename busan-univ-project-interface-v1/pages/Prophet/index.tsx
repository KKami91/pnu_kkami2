import { useState, useEffect  } from 'react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import HeartRateChart from '../../components/HeartRateChart2';

const users = ['hswchaos@gmail.com', 'subak63@gmail.com']
const API_URL = 'https://heart-rate-app10-hotofhe3yq-du.a.run.app';

const LoadingBar = () => (
  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
    <div className="w-full h-full bg-blue-500 animate-pulse"></div>
  </div>
);

export default function Home() {
  const [selectedUser, setSelectedUser] = useState('')
  const [message, setMessage] = useState('')
  const [predictionDates, setPredictionDates] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [graphData, setGraphData] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const [isLoadingUser, setIsLoadingUser] = useState(false)
  const [isLoadingDate, setIsLoadingDate] = useState(false)

  const handleDateSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const date = e.target.value
    setSelectedDate(date)
    if (date) {
      setIsLoadingDate(true)
      await fetchGraphData(selectedUser, date)
      setIsLoadingDate(false)
    }
  }

  const handleUserSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const user = e.target.value
    setSelectedUser(user)
    setSelectedDate('')  // 새 사용자를 선택할 때 날짜 선택을 초기화합니다.
    if (user) {
      setIsLoadingUser(true)
      await checkDb(user)
      await fetchPredictionDates(user)
      setIsLoadingUser(false)
    }
  }

  const checkDb = async (user: string) => {
    try {
      const response = await axios.post(`${API_URL}/check_db`, { user_email: user })
      // setMessage(`Analysis requested for ${user}. Response: ${JSON.stringify(response.data)}`)
    } catch (error) {
      setMessage(`Error occurred: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const fetchPredictionDates = async (user: string) => {
    try {
      const response = await axios.get(`${API_URL}/prediction_dates/${user}`);
      setPredictionDates(response.data.dates);
    } catch (error) {
      setMessage(`Error fetching prediction dates: ${error instanceof Error ? error.message : String(error)}`);
      setPredictionDates([]);  // 에러 발생 시 예측 날짜 목록을 비웁니다.
    }
  }

  const fetchGraphData = async (user: string, date: string) => {
    try {
      const response = await axios.get(`${API_URL}/prediction_data/${user}/${date}`);
      setGraphData(response.data.data);
    } catch (error) {
      setMessage(`Error fetching graph data: ${error instanceof Error ? error.message : String(error)}`);
      setGraphData([]);  // 에러 발생 시 그래프 데이터를 비웁니다.
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Heart Rate Analysis Dashboard</h1>
      <div className="mb-4">
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
        {isLoadingUser && <LoadingBar />}
      </div>
      {selectedUser && (
        <div className="mb-4">
          <label className="mr-2">예측 기준 날짜:</label>
          {predictionDates.length > 0 ? (
            <select 
              value={selectedDate} 
              onChange={handleDateSelect}
              className="border p-2 rounded mr-2"
            >
              <option value="">Select a prediction date</option>
              {predictionDates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          ) : (
            <p> </p>
          )}
          {isLoadingUser && <LoadingBar />}
        </div>
      )}
      
      {message && <p className="mt-4">{message}</p>}
      {graphData.length > 0 ? (
        <div className="mt-8">
            <HeartRateChart data={graphData} />
        </div>
      ) : (
        <div className="mt-8 text-center text-red-500">No data available for the chart.</div>
      )}
    </div>
  )
}