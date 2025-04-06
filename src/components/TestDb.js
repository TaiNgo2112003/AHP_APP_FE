import React, { useState } from 'react';
import axios from 'axios';

function TestDb() {
  const [message, setMessage] = useState("");

  const checkDbConnection = async () => {
    try {
      const response = await axios.get("https://ahp-app.onrender.com/test-db");
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response.data.message);
    }
  };

  return (
    <div>
      <button onClick={checkDbConnection}>Kiểm tra kết nối MongoDB</button>
      <p>{message}</p>
    </div>
  );
}

export default TestDb;
