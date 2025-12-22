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
