//Include Both Helper File with needed methods
import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import {
  postFakeLogin,
  postJwtLogin,
} from "../../../helpers/fakebackend_helper";
import { postLogin, postLogout, getUserPermissions } from "../../../helpers/backend_helper";
import { saveAuthTokens, clearAuthTokens } from "../../../helpers/api_helper";
import { getFirstAvailableRoute } from "../../../helpers/navigation_helper";

import { loginSuccess, logoutUserSuccess, apiError, reset_login_flag } from './reducer';

export const loginUser = (user : any, history : any) => async (dispatch : any) => {
  try {
    let response;
    if (process.env.REACT_APP_DEFAULTAUTH === "nailsco") {
      response = postLogin({
        email: user.email,
        password: user.password
      });
    } else if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
      let fireBaseBackend : any = getFirebaseBackend();
      response = fireBaseBackend.loginUser(
        user.email,
        user.password
      );
    } else if (process.env.REACT_APP_DEFAULTAUTH === "jwt") {
      response = postJwtLogin({
        email: user.email,
        password: user.password
      });

    } else if (process.env.REACT_APP_DEFAULTAUTH) {
      response = postFakeLogin({
        email: user.email,
        password: user.password,
      });
    }

    var data = await response;

    if (data) {
      if (process.env.REACT_APP_DEFAULTAUTH === "nailsco") {
        // Backend NailsCo returns: { success: true, data: { token: string, user: {...} } }
        if (data.success && data.data) {
          const { token, user: userData } = data.data;
          
          // Save basic user data first
          saveAuthTokens(token, null, { user: userData });
          
          try {
            // Get user permissions after successful login
            const permissionsResponse = await getUserPermissions();
            const permissions = permissionsResponse?.data?.screens || [];
            
            // Create user object with permissions for storage
            const userWithPermissions = {
              ...userData,
              permissions: { screens: permissions }
            };
            
            // Update stored data with permissions
            saveAuthTokens(token, null, { user: userWithPermissions });
            dispatch(loginSuccess({ token, ...userData, permissions: { screens: permissions } }));
            
            // Navigate to the first available route for the user
            const firstAvailableRoute = getFirstAvailableRoute(permissions);
            console.log('📍 Navigating to first available route:', firstAvailableRoute, 'based on permissions:', permissions);
            history(firstAvailableRoute);
            
          } catch (permissionsError) {
            console.error('Error fetching user permissions:', permissionsError);
            // Continue with login even if permissions fail, but go to dashboard as fallback
            dispatch(loginSuccess({ token, ...userData, permissions: { screens: [] } }));
            history('/dashboard');
          }
        } else {
          dispatch(apiError({ 
            message: data.error || data.message || 'Invalid response from server',
            field: data.field || null 
          }));
        }
      } else {
        sessionStorage.setItem("authUser", JSON.stringify(data));
        if (process.env.REACT_APP_DEFAULTAUTH === "fake") {
        var finallogin : any = JSON.stringify(data);
        finallogin = JSON.parse(finallogin)
        data = finallogin.data;
        if (finallogin.status === "success") {
          dispatch(loginSuccess(data));
          history('/dashboard')
        } 
        else {
          dispatch(apiError(finallogin));
        }
      } else {
        dispatch(loginSuccess(data));
        history('/dashboard')
        }
      }
    }
  } catch (error: any) {
    // Extract error message from different error structures
    let errorMessage = "An error occurred during login";
    let errorField = null;
    
    if (error?.response?.data) {
      errorMessage = error.response.data.error || error.response.data.message || errorMessage;
      errorField = error.response.data.field || null;
      
      // If message contains "Invalid credentials" or similar, associate with password field
      if (!errorField && (
        errorMessage.toLowerCase().includes('invalid credentials') ||
        errorMessage.toLowerCase().includes('incorrect password') ||
        errorMessage.toLowerCase().includes('wrong password')
      )) {
        errorField = 'password';
        errorMessage = 'Invalid password';
      }
    } else if (error?.message) {
      errorMessage = error.message;
      // Check for invalid credentials in error message
      if (errorMessage.toLowerCase().includes('invalid credentials')) {
        errorField = 'password';
        errorMessage = 'Invalid password';
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
      if (errorMessage.toLowerCase().includes('invalid credentials')) {
        errorField = 'password';
        errorMessage = 'Invalid password';
      }
    }
    
    dispatch(apiError({ message: errorMessage, field: errorField }));
  }
};

export const logoutUser = (history?: any) => async (dispatch : any) => {
  try {
    if (process.env.REACT_APP_DEFAULTAUTH === "nailsco") {
      // Call backend logout endpoint to revoke token
      try {
        await postLogout();
      } catch (error) {
        // Even if backend call fails, we still want to clear local session
        console.warn('Logout API call failed, but clearing local session:', error);
      }
      
      // Clear auth tokens from sessionStorage and axios defaults
      clearAuthTokens();
      
      // Dispatch logout success to clear Redux state
      dispatch(logoutUserSuccess(true));
      
      // Navigate to login page if history is provided
      if (history) {
        history('/login');
      }
    } else {
      sessionStorage.removeItem("authUser");
      let fireBaseBackend : any = getFirebaseBackend();
      if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
        const response = fireBaseBackend.logout;
        dispatch(logoutUserSuccess(response));
      } else {
        dispatch(logoutUserSuccess(true));
      }
      if (history) {
        history('/login');
      }
    }
  } catch (error) {
    dispatch(apiError(error));
  }
};

export const socialLogin = (type : any, history : any) => async (dispatch : any) => {
  try {
    let response;

    if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
      const fireBaseBackend : any = getFirebaseBackend();
      response = fireBaseBackend.socialLoginUser(type);
    }
    //  else {
      //   response = postSocialLogin(data);
      // }
      
      const socialdata = await response;
    if (socialdata) {
      sessionStorage.setItem("authUser", JSON.stringify(response));
      dispatch(loginSuccess(response));
      history('/dashboard')
    }

  } catch (error) {
    dispatch(apiError(error));
  }
};

export const resetLoginFlag = () => async (dispatch : any) => {
  try {
    const response = dispatch(reset_login_flag());
    return response;
  } catch (error) {
    dispatch(apiError(error));
  }
};