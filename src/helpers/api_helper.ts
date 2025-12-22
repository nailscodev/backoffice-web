import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import config from "../config";

const { api } = config;

// default
axios.defaults.baseURL = api.API_URL;
// send cookies (httpOnly) when backend uses them
axios.defaults.withCredentials = true;
// Ensure axios will read the CSRF cookie and send it in the header automatically
// Server should set a cookie named 'XSRF-TOKEN' (or change these names to match server)
axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-CSRF-Token';
// content type
axios.defaults.headers.post["Content-Type"] = "application/json";

// content type
const authUser: any = sessionStorage.getItem("authUser")
const token = JSON.parse(authUser) ? JSON.parse(authUser).token : null;
if (token)
  axios.defaults.headers.common["Authorization"] = "Bearer " + token;

// Helper to get CSRF token
let csrfTokenPromise: Promise<string> | null = null;

const fetchCsrfToken = async (): Promise<string> => {
  try {
    const response = await axios.get('/api/v1/csrf/token');
    const token = response.data?.data?.token || response.data?.token;
    if (token) {
      setCsrfToken(token);
      // Save to session storage
      const authUser = sessionStorage.getItem('authUser');
      if (authUser) {
        const parsed = JSON.parse(authUser);
        parsed.csrfToken = token;
        sessionStorage.setItem('authUser', JSON.stringify(parsed));
      }
      return token;
    }
    throw new Error('No CSRF token received');
  } catch (error) {
    throw new Error('Failed to fetch CSRF token');
  }
};

// Request interceptor to ensure CSRF token is present
axios.interceptors.request.use(
  async (config) => {
    // Only add CSRF for write operations
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      // Skip CSRF for login endpoint and csrf token endpoint
      if (config.url?.includes('/auth/login') || config.url?.includes('/csrf/token')) {
        console.log('[CSRF] Skipping CSRF for:', config.url);
        return config;
      }
      
      console.log('[CSRF] Checking CSRF token for:', config.method?.toUpperCase(), config.url);
      
      // Check if CSRF token is already set in headers
      if (!config.headers['X-CSRF-Token']) {
        // Try to get from session storage first (if we saved it from a previous request)
        const authUser = sessionStorage.getItem('authUser');
        if (authUser) {
          try {
            const parsed = JSON.parse(authUser);
            if (parsed.csrfToken) {
              console.log('[CSRF] Using token from sessionStorage');
              config.headers['X-CSRF-Token'] = parsed.csrfToken;
            }
          } catch (e) {
            console.warn('[CSRF] Error parsing authUser from sessionStorage:', e);
          }
        }
        
        // If still no token, fetch a fresh one (avoid parallel requests)
        if (!config.headers['X-CSRF-Token']) {
          console.log('[CSRF] No token found, fetching new one...');
          if (!csrfTokenPromise) {
            csrfTokenPromise = fetchCsrfToken().finally(() => {
              csrfTokenPromise = null;
            });
          }
          try {
            const token = await csrfTokenPromise;
            console.log('[CSRF] Successfully obtained token:', token ? 'YES' : 'NO');
            config.headers['X-CSRF-Token'] = token;
          } catch (error) {
            console.error('[CSRF] Failed to get CSRF token:', error);
            // Don't throw error here - let the request proceed and backend will handle it
            // The response interceptor will catch the error and retry
          }
        }
      } else {
        console.log('[CSRF] Token already present in headers');
      }
    }
    return config;
  },
  (error) => {
    console.error('[CSRF] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// intercepting to capture errors
axios.interceptors.response.use(
  function (response) {
    return response.data ? response.data : response;
  },
  async function (error) {
    const originalRequest = error.config;
    
    // If CSRF token is invalid/missing/malformed and we haven't retried yet
    if (error.response?.status === 400 && 
        (error.response?.data?.error === 'CsrfTokenMalformedException' ||
         error.response?.data?.message?.toLowerCase().includes('csrf')) && 
        !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Clear any stored CSRF token
        const authUser = sessionStorage.getItem('authUser');
        if (authUser) {
          try {
            const parsed = JSON.parse(authUser);
            delete parsed.csrfToken;
            sessionStorage.setItem('authUser', JSON.stringify(parsed));
          } catch (e) {
            // ignore
          }
        }
        
        // Fetch new CSRF token
        const token = await fetchCsrfToken();
        originalRequest.headers['X-CSRF-Token'] = token;
        // Retry the original request
        return axios(originalRequest);
      } catch (csrfError) {
        return Promise.reject('Failed to refresh CSRF token');
      }
    }
    
    // Also handle 403 CSRF errors
    if (error.response?.status === 403 && 
        error.response?.data?.message?.toLowerCase().includes('csrf') && 
        !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Clear any stored CSRF token
        const authUser = sessionStorage.getItem('authUser');
        if (authUser) {
          try {
            const parsed = JSON.parse(authUser);
            delete parsed.csrfToken;
            sessionStorage.setItem('authUser', JSON.stringify(parsed));
          } catch (e) {
            // ignore
          }
        }
        
        // Fetch new CSRF token
        const token = await fetchCsrfToken();
        originalRequest.headers['X-CSRF-Token'] = token;
        // Retry the original request
        return axios(originalRequest);
      } catch (csrfError) {
        return Promise.reject('Failed to refresh CSRF token');
      }
    }
    
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Pass the full error object so calling code can access response data
    return Promise.reject(error);
  }
);
/**
 * Sets the default authorization
 * @param {*} token
 */
const setAuthorization = (token : string) => {
  axios.defaults.headers.common["Authorization"] = "Bearer " + token;
};

/**
 * Persist JWT and optional csrfToken in sessionStorage and set axios defaults
 */
const saveAuthTokens = (token: string | null, csrfToken?: string | null, extra?: any) => {
  if (token) {
    setAuthorization(token);
  }

  if (csrfToken) {
    // also set default header for CSRF
    axios.defaults.headers.common['X-CSRF-Token'] = csrfToken;
  }

  // persist minimal authUser object for page reloads
  const authUserObj: any = {};
  if (token) authUserObj.token = token;
  if (csrfToken) authUserObj.csrfToken = csrfToken;
  if (extra && typeof extra === 'object') {
    Object.assign(authUserObj, extra);
  }

  try {
    sessionStorage.setItem('authUser', JSON.stringify(authUserObj));
  } catch (e) {
    // ignore storage errors
  }
};

const clearAuthTokens = () => {
  try {
    sessionStorage.removeItem('authUser');
  } catch (e) {
    // ignore
  }
  delete axios.defaults.headers.common['Authorization'];
  delete axios.defaults.headers.common['X-CSRF-Token'];
  // Reset CSRF token promise
  csrfTokenPromise = null;
};

const setCsrfToken = (csrfToken: string) => {
  axios.defaults.headers.common['X-CSRF-Token'] = csrfToken;
};

class APIClient {
  /**
   * Fetches data from the given URL
   */
  get = (url: string, params?: any): Promise<AxiosResponse> => {
    let response: Promise<AxiosResponse>;

    let paramKeys: string[] = [];

    if (params) {
      Object.keys(params).map(key => {
        paramKeys.push(key + '=' + params[key]);
        return paramKeys;
      });

      const queryString = paramKeys && paramKeys.length ? paramKeys.join('&') : "";
      response = axios.get(`${url}?${queryString}`, params);
    } else {
      response = axios.get(`${url}`, params);
    }

    return response;
  };

  /**
   * Posts the given data to the URL
   */
  create = (url: string, data: any, config?: AxiosRequestConfig): Promise<AxiosResponse> => {
    return axios.post(url, data, config);
  };

  /**
   * Updates data
   */
  update = (url: string, data: any): Promise<AxiosResponse> => {
    return axios.patch(url, data);
  };

  patch = (url: string, data: any): Promise<AxiosResponse> => {
    return axios.patch(url, data);
  };

  put = (url: string, data: any): Promise<AxiosResponse> => {
    return axios.put(url, data);
  };

  /**
   * Deletes data
   */
  delete = (url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> => {
    return axios.delete(url, { ...config });
  };
}

const getLoggedinUser = () => {
  const user = sessionStorage.getItem("authUser");
  if (!user) {
    return null;
  } else {
    return JSON.parse(user);
  }
};

export { APIClient, setAuthorization, getLoggedinUser, saveAuthTokens, clearAuthTokens, setCsrfToken };