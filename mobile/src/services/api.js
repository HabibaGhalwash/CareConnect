import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

// Dynamically detect the host machine IP during development
// This avoids manual IP updates when the network changes
const debuggerHost = Constants.expoConfig?.hostUri || '';
const hostIP = debuggerHost.split(':')[0] || 'localhost';

const API_BASE = `http://${hostIP}:8080`;
const WEB_BASE = `http://${hostIP}:3000`;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Add interceptor to include auth token if available
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('Failed to get auth token:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear storage and redirect to login
      AsyncStorage.multiRemove(['authToken', 'parent', 'admin', 'userRole', 'isLoggedIn']);
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Auth APIs
  loginParent: (email, password) =>
    api.get(`/modules/parent/login?Email=${encodeURIComponent(email)}&Password=${encodeURIComponent(password)}`),
  
  loginAdmin: (email) =>
    api.get(`/modules/Admin/search?keyword=Email&keyvalue=${encodeURIComponent(email)}`),

  loginShadowTeacher: (email, password) =>
    api.get(`/modules/shadow_teacher/login?Email=${encodeURIComponent(email)}&Password=${encodeURIComponent(password)}`),

  loginTherapist: (email, password) =>
    api.get(`/modules/therapist/login?Email=${encodeURIComponent(email)}&Password=${encodeURIComponent(password)}`),

  // School APIs
  getSchools: () => api.get('/modules/school/school'),
  getSchoolById: (id) => api.get(`/modules/school/school/${id}`),

  // Parent/Child APIs
  getChildren: (parentId) => api.get(`/modules/child/child/by-parent?P_ID=${parentId}`),
  getChildById: (childId) => api.get(`/modules/child/child/${childId}`),
  addChild: (childData) => api.post('/modules/child/child', childData),
  updateChild: (childId, childData) => api.put(`/modules/child/child/${childId}`, childData),
  deleteChild: (childId) => api.delete(`/modules/child/child/${childId}`),

  // Shadow Teachers APIs
  getShadowTeachers: () => api.get('/modules/shadow_teacher/shadow_teacher'),
  getShadowTeacherById: (id) => api.get(`/modules/shadow_teacher/shadow_teacher/${id}`),
  bookShadowTeacher: (bookingData) => api.post('/modules/shadow_teacher/booking', bookingData),

  // Therapist APIs
  getTherapists: () => api.get('/modules/therapist/therapist'),
  getTherapistById: (id) => api.get(`/modules/therapist/therapist/${id}`),
  bookTherapist: (bookingData) => api.post('/modules/therapist/booking', bookingData),

  // Booking APIs
  getParentBookings: (parentId) => api.get(`/modules/booking/search?keyword=P_ID&keyvalue=${parentId}`),
  getBookingsByChild: (childId) => api.get(`/modules/booking/by-child?Child_ID=${childId}`),
  cancelBooking: (bookingId) => api.put(`/modules/booking/booking-status?id=${bookingId}`, { Booking_status: 'Cancelled' }),

  // Community APIs
  getCommunityPosts: () => api.get('/modules/community/community'),
  createCommunityPost: (postData) => api.post('/modules/community/community', postData),
  getAllParents: () => api.get('/modules/parent/parent'),
  
  getComments: (postId) => api.get(`/modules/community/${postId}/comments`),
  
  addComment: (postId, commentData) => api.post(`/modules/community/${postId}/comments`, commentData),

  // Donation APIs
  getDonations: () => api.get('/modules/market_place/market_place'),
  requestDonation: (donationData) => api.post('/modules/market_place/market_place', donationData),

  // Parent Profile APIs
  getParentProfile: (parentId) => api.get(`/modules/parent/${parentId}`),
  updateParentProfile: (parentId, profileData) => api.put(`/modules/parent/parent?id=${parentId}`, profileData),

  // Services/Tools APIs
  getCommunicationTools: () => api.get('/modules/communicationtool/communication_tool'),
  getResources: () => api.get('/modules/resources'),

  // Notification APIs
  getNotifications: (userId) => api.get(`/modules/notifications/${userId}`),

  // Subscription APIs
  getParentSubscription: (parentId) => api.get(`/modules/parent/parent?id=${parentId}`),
  getSubscriptionDetails: (sid) => api.get(`/modules/subscription/subscription?id=${sid}`),
  getAllSubscriptions: () => api.get('/modules/subscription/subscription'),

  // Generic endpoints for extensibility
  get: (endpoint, config = {}) => api.get(endpoint, config),
  post: (endpoint, data, config = {}) => api.post(endpoint, data, config),
  put: (endpoint, data, config = {}) => api.put(endpoint, data, config),
  delete: (endpoint, config = {}) => api.delete(endpoint, config),
};

export { API_BASE, WEB_BASE };
