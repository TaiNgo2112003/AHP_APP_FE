import axios from 'axios';

// Config API
const API_BASE_URL = 'http://localhost:5000/api'; // Update nếu backend thay đổi
const DEFAULT_ERROR_MESSAGE = 'An error occurred. Please try again.';

// Tạo instance axios với config mặc định
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ✅ Bật credentials để tránh lỗi CORS
  headers: {
    'Content-Type': 'application/json',
  },
});



/**
 * Xử lý lỗi API thống nhất
 * @param {Error} error - Error object từ axios
 * @returns {Promise<never>} - Trả về error message đã được chuẩn hóa
 */
const handleApiError = (error) => {
  // Log lỗi ra console để debug
  console.error('API Error:', {
    config: error.config,
    response: error.response,
    message: error.message
  });

  // Xác định error message
  let errorMessage = DEFAULT_ERROR_MESSAGE;
  
  if (error.response) {
    // Server trả về response với status code ngoài 2xx
    errorMessage = error.response.data?.error || 
                  error.response.data?.message || 
                  error.response.statusText;
  } else if (error.request) {
    // Request được gửi nhưng không nhận được response
    errorMessage = 'No response received from server. Please check your network connection.';
  }

  // Tạo error object mới với message đã được format
  const formattedError = new Error(errorMessage);
  formattedError.details = error.response?.data?.details;
  formattedError.status = error.response?.status;

  throw formattedError;
};

/**
 * API Service cho Criteria
 */
export const criteriaApi = {
  fetchAll: async () => {
    try {
      const response = await axiosInstance.get('/criteria');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  create: async (criterionData) => {
    try {
      const response = await axiosInstance.post('/criteria', criterionData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

/**
 * API Service cho Locations
 */
export const locationsApi = {
  fetchAll: async () => {
    try {
      const response = await axiosInstance.get('/locations');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  create: async (locationData) => {
    try {
      const response = await axiosInstance.post('/locations', locationData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

/**
 * API Service cho Pairwise Comparisons
 */
export const pairwiseApi = {
  submit: async (comparisonData) => {
    try {
      const response = await axiosInstance.post('/pairwise', comparisonData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getMatrixDetails: async (comparisonId) => {
    try {
      const response = await axiosInstance.get(`/pairwise/${comparisonId}/details`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

/**
 * API Service cho Evaluations
 */
export const evaluationApi = {
  evaluate: async (evaluationData) => {
    try {
      const response = await axiosInstance.post('/evaluate', evaluationData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  getEvaluationDetails: async (evaluationId) => {
    try {
      const response = await axiosInstance.get(`/evaluation-details/${evaluationId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  getResultDetails: async (evaluationId) => {
    try {
      const response = await axiosInstance.get(`/evaluate/${evaluationId}/details`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

/**
 * API Service cho User History
 */
export const userHistoryApi = {
  getHistory: async (userId) => {
    try {
      const response = await axiosInstance.get(`/user/${userId}/history`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

/**
 * API Service cho AHP Calculations (nếu cần)
 */
export const ahpApi = {
  calculateWeights: async (matrix) => {
    try {
      const response = await axiosInstance.post('/ahp/calculate', { matrix });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Export tất cả các services
export default {
  criteria: criteriaApi,
  locations: locationsApi,
  pairwise: pairwiseApi,
  evaluation: evaluationApi,
  history: userHistoryApi,
  ahp: ahpApi
};