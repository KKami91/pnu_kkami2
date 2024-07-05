import { useState } from 'react'
import axios from 'axios'

const users = ['U#hswchaos@gmail.com', 'U#subak63@gmail.com']

export default function Home() {
  const [selectedUser, setSelectedUser] = useState('')
  const [message, setMessage] = useState('')

  const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUser(e.target.value)
  }

  const handleSubmit = async () => {
    if (!selectedUser) {
      setMessage('Please select a user')
      return
    }

    try {
      const response = await axios.post('https://heart-rate-app10-hotofhe3yq-du.a.run.app/analyze_and_predict', { user_email: selectedUser })
      setMessage(`Analysis requested for ${selectedUser}. Response: ${JSON.stringify(response.data)}`)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setMessage(`Error occurred: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
      } else {
        setMessage(`Error occurred: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Heart Rate Analysis Dashboard</h1>
      <div className="mb-4">
        <select 
          value={selectedUser} 
          onChange={handleUserSelect}
          className="border p-2 rounded"
        >
          <option value="">Select a user</option>
          {users.map(user => (
            <option key={user} value={user}>{user}</option>
          ))}
        </select>
      </div>
      <button 
        onClick={handleSubmit}
        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
      >
        Analyze Heart Rate
      </button>
      {message && <p className="mt-4">{message}</p>}
    </div>
  )
}