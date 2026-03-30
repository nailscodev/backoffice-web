/**
 * Unit tests for api_helper.ts
 *
 * Areas covered:
 * 1. setAuthorization — sets Bearer token on axios defaults
 * 2. saveAuthTokens — persists to sessionStorage, sets axios defaults
 * 3. clearAuthTokens — removes from sessionStorage, clears axios headers
 * 4. Response interceptor: 401 clears session and redirects to /login
 */
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// ─── Setup ───────────────────────────────────────────────────────────────────

// The api_helper registers interceptors on module load.
// Import it here so they are active during tests.
import {
  setAuthorization,
  saveAuthTokens,
  clearAuthTokens,
} from '../helpers/api_helper';

describe('api_helper', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    // Reset axios to a clean state before each test
    mock = new MockAdapter(axios);
    sessionStorage.clear();
    // Clear any previous auth header
    delete (axios.defaults.headers.common as Record<string, string>)['Authorization'];
    delete (axios.defaults.headers.common as Record<string, string>)['X-CSRF-Token'];
  });

  afterEach(() => {
    mock.restore();
  });

  // ─── setAuthorization ──────────────────────────────────────────────────────

  describe('setAuthorization()', () => {
    it('sets the Authorization header with a Bearer prefix', () => {
      setAuthorization('my-jwt-token');
      expect(axios.defaults.headers.common['Authorization']).toBe('Bearer my-jwt-token');
    });

    it('overwrites a previous token', () => {
      setAuthorization('first-token');
      setAuthorization('second-token');
      expect(axios.defaults.headers.common['Authorization']).toBe('Bearer second-token');
    });
  });

  // ─── saveAuthTokens ────────────────────────────────────────────────────────

  describe('saveAuthTokens()', () => {
    it('persists the token in sessionStorage under "authUser"', () => {
      saveAuthTokens('token-abc');
      const stored = JSON.parse(sessionStorage.getItem('authUser') ?? '{}');
      expect(stored.token).toBe('token-abc');
    });

    it('persists the csrfToken alongside the JWT', () => {
      saveAuthTokens('token-abc', 'csrf-xyz');
      const stored = JSON.parse(sessionStorage.getItem('authUser') ?? '{}');
      expect(stored.csrfToken).toBe('csrf-xyz');
    });

    it('sets the Authorization header on axios', () => {
      saveAuthTokens('token-for-axios');
      expect(axios.defaults.headers.common['Authorization']).toBe('Bearer token-for-axios');
    });

    it('sets the X-CSRF-Token header on axios when provided', () => {
      saveAuthTokens('token-abc', 'csrf-xyz');
      expect(axios.defaults.headers.common['X-CSRF-Token']).toBe('csrf-xyz');
    });

    it('does not throw when called with null token', () => {
      expect(() => saveAuthTokens(null)).not.toThrow();
    });
  });

  // ─── clearAuthTokens ───────────────────────────────────────────────────────

  describe('clearAuthTokens()', () => {
    it('removes "authUser" from sessionStorage', () => {
      sessionStorage.setItem('authUser', JSON.stringify({ token: 'abc' }));
      clearAuthTokens();
      expect(sessionStorage.getItem('authUser')).toBeNull();
    });

    it('removes the Authorization header from axios defaults', () => {
      axios.defaults.headers.common['Authorization'] = 'Bearer old-token';
      clearAuthTokens();
      expect(axios.defaults.headers.common['Authorization']).toBeUndefined();
    });

    it('removes the X-CSRF-Token header from axios defaults', () => {
      axios.defaults.headers.common['X-CSRF-Token'] = 'csrf-token';
      clearAuthTokens();
      expect(axios.defaults.headers.common['X-CSRF-Token']).toBeUndefined();
    });
  });

  // ─── Response interceptor: 401 redirect ───────────────────────────────────

  describe('401 response interceptor', () => {
    const originalLocation = window.location;

    beforeEach(() => {
      // jsdom does not allow direct assignment of window.location.href
      // Override the property so we can spy on it
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { href: '' },
      });
      sessionStorage.setItem('authUser', JSON.stringify({ token: 'expired-jwt' }));
    });

    afterEach(() => {
      // Restore window.location
      Object.defineProperty(window, 'location', {
        writable: true,
        value: originalLocation,
      });
    });

    it('clears sessionStorage on a 401 response', async () => {
      mock.onGet('/api/v1/test').reply(401, { message: 'Unauthorized' });

      // Request will reject with interceptor side effect
      await axios.get('/api/v1/test').catch(() => {});

      expect(sessionStorage.getItem('authUser')).toBeNull();
    });

    it('sets window.location.href to /login on a 401 response', async () => {
      mock.onGet('/api/v1/test').reply(401, { message: 'Unauthorized' });

      await axios.get('/api/v1/test').catch(() => {});

      expect(window.location.href).toBe('/login');
    });
  });

  // ─── Request interceptor: CSRF bypass ────────────────────────────────────

  describe('request interceptor — CSRF bypass', () => {
    it('does NOT fetch a CSRF token for GET requests', async () => {
      mock.onGet('/api/v1/services/list').reply(200, { data: [] });

      await axios.get('/api/v1/services/list');

      // The CSRF endpoint must not have been called
      const csrfCalls = mock.history.get.filter((r) => r.url?.includes('/csrf/token'));
      expect(csrfCalls).toHaveLength(0);
    });

    it('skips CSRF fetch for /auth/login even though it is a POST', async () => {
      mock.onPost('/api/v1/auth/login').reply(200, { data: { token: 'jwt' } });

      await axios.post('/api/v1/auth/login', { email: 'a@b.com', password: 'pw' });

      const csrfCalls = mock.history.get.filter((r) => r.url?.includes('/csrf/token'));
      expect(csrfCalls).toHaveLength(0);
    });
  });

  // ─── Response interceptor: CSRF retry ────────────────────────────────────

  describe('response interceptor — CSRF retry', () => {
    beforeEach(() => {
      // Pre-populate sessionStorage so the retry path can update the token
      sessionStorage.setItem('authUser', JSON.stringify({ token: 'jwt', csrfToken: 'old-csrf' }));
    });

    it('retries the request once on a 400 CsrfTokenMalformedException', async () => {
      mock
        .onPost('/api/v1/bookings')
        .replyOnce(400, { error: 'CsrfTokenMalformedException', message: 'CSRF token malformed' })
        .onPost('/api/v1/bookings')
        .replyOnce(201, { data: { id: 1 } });

      // CSRF refresh endpoint
      mock.onGet('/api/v1/csrf/token').reply(200, { data: { token: 'fresh-csrf-token' } });

      await axios.post('/api/v1/bookings', { serviceId: 1 });

      // Original call + 1 retry = 2 POST calls total
      expect(mock.history.post.filter((r) => r.url === '/api/v1/bookings')).toHaveLength(2);
    });

    it('retries the request once on a 403 containing "csrf" in message', async () => {
      mock
        .onPut('/api/v1/bookings/5')
        .replyOnce(403, { message: 'Invalid csrf token' })
        .onPut('/api/v1/bookings/5')
        .replyOnce(200, { data: { id: 5 } });

      mock.onGet('/api/v1/csrf/token').reply(200, { data: { token: 'fresh-csrf-token' } });

      await axios.put('/api/v1/bookings/5', { status: 'confirmed' });

      expect(mock.history.put.filter((r) => r.url === '/api/v1/bookings/5')).toHaveLength(2);
    });
  });
});
