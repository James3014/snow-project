/**
 * API 客戶端測試
 * 遵循 TDD 原則
 */

import { ApiClient, ApiClientError, authApi, tripsApi } from '../../platform/frontend/shared/api-client';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient('http://localhost:8080/api');
    mockFetch.mockClear();
  });

  describe('request method', () => {
    it('should make successful GET request', async () => {
      const mockData = { message: 'success' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      } as Response);

      const result = await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result.data).toEqual(mockData);
      expect(result.status).toBe(200);
    });

    it('should make successful POST request with data', async () => {
      const requestData = { name: 'test' };
      const responseData = { id: '1', name: 'test' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => responseData,
      } as Response);

      const result = await apiClient.post('/test', requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
        })
      );
      expect(result.data).toEqual(responseData);
    });

    it('should handle API errors', async () => {
      const errorData = {
        error: 'Not found',
        details: { resource: 'user' },
        timestamp: '2025-12-12T10:00:00Z',
        path: '/api/test',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorData,
      } as Response);

      await expect(apiClient.get('/test')).rejects.toThrow(ApiClientError);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/test')).rejects.toThrow(ApiClientError);
    });

    it('should include auth token in headers', async () => {
      apiClient.setAuthToken('test-token');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);
    });

    it('should call PUT method correctly', async () => {
      await apiClient.put('/test', { data: 'test' });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should call DELETE method correctly', async () => {
      await apiClient.delete('/test');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});

describe('AuthApi', () => {
  let mockClient: jest.Mocked<ApiClient>;

  beforeEach(() => {
    mockClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      request: jest.fn(),
      setAuthToken: jest.fn(),
    } as any;
  });

  it('should call login endpoint', async () => {
    const credentials = { email: 'test@example.com', password: 'password' };
    const authApi = new (require('../../platform/frontend/shared/api-client').AuthApi)(mockClient);

    await authApi.login(credentials);

    expect(mockClient.post).toHaveBeenCalledWith('/auth/login', credentials);
  });

  it('should call logout endpoint', async () => {
    const authApi = new (require('../../platform/frontend/shared/api-client').AuthApi)(mockClient);

    await authApi.logout();

    expect(mockClient.post).toHaveBeenCalledWith('/auth/logout');
  });

  it('should call profile endpoint', async () => {
    const authApi = new (require('../../platform/frontend/shared/api-client').AuthApi)(mockClient);

    await authApi.getProfile();

    expect(mockClient.get).toHaveBeenCalledWith('/users/profile');
  });
});

describe('TripsApi', () => {
  let mockClient: jest.Mocked<ApiClient>;

  beforeEach(() => {
    mockClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      request: jest.fn(),
      setAuthToken: jest.fn(),
    } as any;
  });

  it('should get trips', async () => {
    const tripsApi = new (require('../../platform/frontend/shared/api-client').TripsApi)(mockClient);

    await tripsApi.getTrips();

    expect(mockClient.get).toHaveBeenCalledWith('/trips');
  });

  it('should create trip', async () => {
    const tripData = { title: 'Test Trip', destination: 'Niseko' };
    const tripsApi = new (require('../../platform/frontend/shared/api-client').TripsApi)(mockClient);

    await tripsApi.createTrip(tripData);

    expect(mockClient.post).toHaveBeenCalledWith('/trips', tripData);
  });

  it('should update trip', async () => {
    const tripData = { title: 'Updated Trip' };
    const tripsApi = new (require('../../platform/frontend/shared/api-client').TripsApi)(mockClient);

    await tripsApi.updateTrip('123', tripData);

    expect(mockClient.put).toHaveBeenCalledWith('/trips/123', tripData);
  });

  it('should delete trip', async () => {
    const tripsApi = new (require('../../platform/frontend/shared/api-client').TripsApi)(mockClient);

    await tripsApi.deleteTrip('123');

    expect(mockClient.delete).toHaveBeenCalledWith('/trips/123');
  });
});

describe('ApiClientError', () => {
  it('should create error with correct properties', () => {
    const errorData = {
      error: 'Test error',
      details: { field: 'value' },
      timestamp: '2025-12-12T10:00:00Z',
      path: '/api/test',
    };

    const error = new ApiClientError(errorData, 400);

    expect(error.message).toBe('Test error');
    expect(error.status).toBe(400);
    expect(error.details).toEqual(errorData);
    expect(error.name).toBe('ApiClientError');
  });
});
