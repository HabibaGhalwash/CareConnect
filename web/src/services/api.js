// Dynamic API base URL detection
// If accessed via localhost, use localhost:8080
// If accessed via IP (mobile app WebView), use that same IP:8080
export const API_BASE = `http://${window.location.hostname}:8080`;

export const getApiUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
};