import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API Methods

export const apiClient = {
  // Campaigns
  getCampaigns: async () => {
    const response = await api.get('/api/campaigns');
    return response.data;
  },

  getCampaign: async (id: string) => {
    const response = await api.get(`/api/campaigns/${id}`);
    return response.data;
  },

  // Ad Sets
  getAdSets: async () => {
    const response = await api.get('/api/adsets');
    return response.data;
  },

  getAdSet: async (id: string) => {
    const response = await api.get(`/api/adsets/${id}`);
    return response.data;
  },

  // Ads
  getAds: async () => {
    const response = await api.get('/api/ads');
    return response.data;
  },

  getAd: async (id: string) => {
    const response = await api.get(`/api/ads/${id}`);
    return response.data;
  },

  // Metrics
  getMetrics: async (params?: {
    entityType?: string;
    entityId?: string;
    startDate?: string;
    endDate?: string;
    aggregate?: string;
  }) => {
    const response = await api.get('/api/metrics', { params });
    return response.data;
  },

  // Sync
  syncCampaigns: async () => {
    const response = await api.post('/api/sync/campaigns');
    return response.data;
  },

  syncAdSets: async () => {
    const response = await api.post('/api/sync/adsets');
    return response.data;
  },

  syncAds: async () => {
    const response = await api.post('/api/sync/ads');
    return response.data;
  },

  syncMetrics: async () => {
    const response = await api.post('/api/sync/metrics');
    return response.data;
  },

  syncAll: async () => {
    const response = await api.post('/api/sync/all');
    return response.data;
  },

  getSyncStatus: async () => {
    const response = await api.get('/api/sync/status');
    return response.data;
  },

  // AI - Creative Analysis
  analyzeCreative: async (adId: string) => {
    const response = await api.post('/api/ai/analyze-creative', { adId });
    return response.data;
  },

  getCreativeAnalyses: async (adId: string) => {
    const response = await api.get(`/api/ai/creative-analyses/${adId}`);
    return response.data;
  },

  // AI - Anomaly Detection
  detectAnomalies: async (params?: { days?: number; threshold?: number }) => {
    const response = await api.get('/api/ai/detect-anomalies', { params });
    return response.data;
  },

  getAnomalies: async (params?: { resolved?: boolean; limit?: number }) => {
    const response = await api.get('/api/ai/anomalies', { params });
    return response.data;
  },

  resolveAnomaly: async (id: string) => {
    const response = await api.patch(`/api/ai/anomalies/${id}/resolve`);
    return response.data;
  },

  // AI - Insights
  getInsights: async (days?: number) => {
    const response = await api.get('/api/ai/insights', { params: { days } });
    return response.data;
  },

  // AI - Natural Language Query
  query: async (question: string) => {
    const response = await api.post('/api/ai/query', { question });
    return response.data;
  },
};

export default api;
