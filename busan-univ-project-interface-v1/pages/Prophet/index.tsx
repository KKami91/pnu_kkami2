import { useState, useEffect  } from 'react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import HeartRateChart from '../../components/HeartRateChart2';

const users = ['hswchaos@gmail.com', 'subak63@gmail.com']
const API_URL = 'https://heart-rate-app10-hotofhe3yq-du.a.run.app';



export default function Home() {
  const [selectedUser, setSelectedUser] = useState('')
  const [message, setMessage] = useState('')
  const [predictionDates, setPredictionDates] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [graphData, setGraphData] = useState([])

  const handleDateSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const date = e.target.value
    setSelectedDate(date)
    if (date) {
      await fetchGraphData(selectedUser, date)
    }
  }

  const handleUserSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const user = e.target.value
    setSelectedDate(user)
    if (user) {
      await checkDb(user)
      await fetchPredictionDates(user)
    }
  }

  const checkDb = async (user: string) => {
    try {
      const response = await axios.post(`${API_URL}/check_db`, { user_email: user })
      setMessage(`Analysis requested for ${user}. Response: ${JSON.stringify(response.data)}`)
    } catch (error) {
      setMessage(`Error occurred: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

    // try {
    //     const response = await axios.post('https://heart-rate-app10-hotofhe3yq-du.a.run.app/check_db', { user_email: selectedUser })
    //     setMessage(`Analysis requested for ${selectedUser}. Response: ${JSON.stringify(response.data)}`)
    //   } catch (error) {
    //     setMessage(`Error occurred: ${error instanceof Error ? error.message : String(error)}`)
    //   }
    // }

  const fetchPredictionDates = async (user: string) => {
    try {
      const response = await axios.get(`${API_URL}/prediction_dates/${user}`);
      setPredictionDates(response.data.dates);
    } catch (error) {
      setMessage(`Error fetching prediction dates: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const fetchGraphData = async (user: string, date: string) => {
    try {
      const encodedDate = encodeURIComponent(date);
      const response = await axios.get(`${API_URL}/prediction_data/${user}/${encodedDate}`);
      setGraphData(response.data.data);
    } catch (error) {
      setMessage(`Error fetching graph data: ${error instanceof Error ? error.message : String(error)}`);
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
      </div>
      {selectedUser && (
        <div className="mb-4">
          <label className="mr-2">예측 기준 날짜:</label>
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