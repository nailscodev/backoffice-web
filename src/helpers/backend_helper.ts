import { APIClient } from "./api_helper";
import * as url from "./url_helper";

const api = new APIClient();

//==============================================
// AUTH API
//==============================================

export const postLogin = (data: { email: string; password: string }) => {
  return api.create(url.POST_LOGIN, {
    usernameOrEmail: data.email,
    password: data.password
  });
};

export const postLogout = async () => {
  try {
    // Try to call backend logout endpoint (may not exist yet)
    return await api.create(url.POST_LOGOUT, {});
  } catch (error: any) {
    // If endpoint doesn't exist, just return success
    // The main cleanup happens in the frontend
    console.warn('Logout endpoint not available, clearing local session only');
    return { success: true };
  }
};

//==============================================
// USER API
//==============================================

export const changeUserPassword = async (userId: string, data: { currentPassword: string; newPassword: string }) => {
  try {
    return await api.update(`${url.USERS}/${userId}/change-password`, data);
  } catch (error: any) {
    // Extract the actual error message from the response
    if (error.response?.data?.message) {
      // Handle array or string messages
      const backendMessage = error.response.data.message;
      if (Array.isArray(backendMessage)) {
        throw backendMessage[0] || 'Error al cambiar la contraseña';
      }
      throw backendMessage;
    }
    if (error.response?.data?.error) {
      throw error.response.data.error;
    }
    if (error.message) {
      throw error.message;
    }
    throw 'Error al cambiar la contraseña';
  }
};

export const getUserById = (userId: string) => 
  api.get(`${url.USERS}/${userId}`);

export const updateUserProfile = async (userId: string, data: any) => {
  try {
    return await api.update(`${url.USERS}/${userId}`, data);
  } catch (error: any) {
    // Extract the actual error message from the response
    if (error.response?.data?.message) {
      const backendMessage = error.response.data.message;
      if (Array.isArray(backendMessage)) {
        throw backendMessage[0] || 'Error al actualizar el perfil';
      }
      throw backendMessage;
    }
    if (error.response?.data?.error) {
      throw error.response.data.error;
    }
    if (error.message) {
      throw error.message;
    }
    throw 'Error al actualizar el perfil';
  }
};

//==============================================
// BOOKINGS / DASHBOARD API
//==============================================

export const getDashboardStats = async (startDate: string, endDate: string) => {
  try {
    return await api.get(`${url.DASHBOARD_STATS}?startDate=${startDate}&endDate=${endDate}`);
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export const getBestSellingServices = async (startDate: string, endDate: string, limit: number = 5) => {
  try {
    return await api.get(`${url.DASHBOARD_BEST_SELLING}?startDate=${startDate}&endDate=${endDate}&limit=${limit}`);
  } catch (error: any) {
    console.error('Error fetching best selling services:', error);
    throw error;
  }
};

export const getTopStaff = async (startDate: string, endDate: string, limit: number = 10) => {
  try {
    return await api.get(`${url.DASHBOARD_TOP_STAFF}?startDate=${startDate}&endDate=${endDate}&limit=${limit}`);
  } catch (error: any) {
    console.error('Error fetching top staff:', error);
    throw error;
  }
};

export const getUpcomingBookings = async (limit: number = 10) => {
  try {
    return await api.get(`${url.BOOKINGS_UPCOMING}?limit=${limit}`);
  } catch (error: any) {
    console.error('Error fetching upcoming bookings:', error);
    throw error;
  }
};

export const getBookingsBySource = async (startDate: string, endDate: string) => {
  try {
    return await api.get(`${url.DASHBOARD_BOOKINGS_BY_SOURCE}?startDate=${startDate}&endDate=${endDate}`);
  } catch (error: any) {
    console.error('Error fetching bookings by source:', error);
    throw error;
  }
};
