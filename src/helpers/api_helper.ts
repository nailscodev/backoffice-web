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

// intercepting to capture errors
axios.interceptors.response.use(
  function (response) {
    return response.data ? response.data : response;
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    let message;
    switch (error.status) {
      case 500:
        message = "Internal Server Error";
        break;
      case 401:
        message = "Invalid credentials";
        break;
      case 404:
        message = "Sorry! the data you are looking for could not be found";
        break;
      default:
        message = error.message || error;
    }
    return Promise.reject(message);
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