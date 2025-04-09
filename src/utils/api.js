import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Update nếu backend thay đổi

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ✅ Bật credentials để tránh lỗi CORS
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function để xử lý lỗi
const handleError = (error) => {
  console.error('API Error:', error.response?.data || error.message);
  throw error.response?.data || error.message;
};

// Criteria API
export const fetchCriteria = async () => {
  try {
    const response = await axiosInstance.get('/criteria'); // ✅ Không cần lặp lại `API_BASE_URL`
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const createCriterion = async (criterionData) => {
  try {
    const response = await axiosInstance.post('/criteria', criterionData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Locations API
export const fetchLocations = async () => {
  try {
    const response = await axiosInstance.get('/locations');
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const createLocation = async (locationData) => {
  try {
    const response = await axiosInstance.post('/locations', locationData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Pairwise Comparisons API
export const submitPairwiseComparisons = async (comparisonData) => {
  try {
    const response = await axiosInstance.post('/pairwise', comparisonData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Evaluation API
export const evaluateLocations = async (evaluationData) => {
  try {
    const response = await axiosInstance.post('/evaluate', evaluationData); // ✅ Đã sửa lỗi axiosInstance
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// User History API
export const fetchUserHistory = async (userId) => {
  try {
    const response = await axiosInstance.get(`/user/${userId}/history`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};
