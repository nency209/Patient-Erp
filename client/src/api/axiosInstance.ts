import axios from 'axios';

// const axiosInstance = axios.create({
//   // Use your actual Render backend URL here
//   baseURL: 'https://patient-erp.onrender.com/api', 
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

const axiosInstance = axios.create({
  // Use your actual Render backend URL here
  baseURL: 'http://localhost:5001/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;