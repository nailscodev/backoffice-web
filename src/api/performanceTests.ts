import axios from 'axios';
import config from '../config';

const API_URL = config.api.API_URL;

export type TestType = 'load' | 'stress' | 'spike' | 'soak';
export type TestStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export interface TimeSeriesPoint {
  time: number;
  rps: number;
  p50: number;
  p95: number;
  p99: number;
  errorRate: number;
  vus: number;
  totalRequests: number;
  totalErrors: number;
}

export interface TestSummary {
  totalRequests: number;
  totalErrors: number;
  avgRps: number;
  p50: number;
  p95: number;
  p99: number;
  avgErrorRate: number;
  maxVus: number;
  duration: number;
}

export interface TestResult {
  id: string;
  type: TestType;
  status: TestStatus;
  startedAt: string;
  completedAt?: string;
  progress: number;
  currentVus: number;
  timeSeries: TimeSeriesPoint[];
  summary?: TestSummary;
  targetEndpoints: string[];
  scenario: string;
}

const baseHeaders = () => {
  const authUser = sessionStorage.getItem('authUser');
  const token = authUser ? JSON.parse(authUser)?.token : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const startTest = async (type: TestType, baseUrl?: string): Promise<TestResult> => {
  // api_helper.ts's global response interceptor unwraps response.data before returning,
  // so axios calls receive the response body directly (not an AxiosResponse).
  const body: any = await axios.post(
    `${API_URL}/api/v1/performance-tests/run`,
    { type, baseUrl },
    { headers: baseHeaders() },
  );
  return body.data ?? body;
};

export const getTestResult = async (id: string): Promise<TestResult> => {
  const body: any = await axios.get(`${API_URL}/api/v1/performance-tests/${id}`, {
    headers: baseHeaders(),
  });
  return body.data ?? body;
};

export const listTestResults = async (): Promise<TestResult[]> => {
  const body: any = await axios.get(`${API_URL}/api/v1/performance-tests`, {
    headers: baseHeaders(),
  });
  const result = body.data ?? body;
  return Array.isArray(result) ? result : [];
};

export const cancelTest = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/api/v1/performance-tests/${id}/cancel`, {
    headers: baseHeaders(),
  });
};
