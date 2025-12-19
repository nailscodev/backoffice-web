//Include Both Helper File with needed methods
import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import {
  postFakeLogin,
  postJwtLogin,
} from "../../../helpers/fakebackend_helper";
import { postLogin } from "../../../helpers/backend_helper";
import { saveAuthTokens, clearAuthTokens } from "../../../helpers/api_helper";

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
          saveAuthTokens(token, null, { user: userData });
          dispatch(loginSuccess({ token, ...userData }));
          history('/dashboard');
        } else {
          dispatch(apiError({ data: data.error || 'Invalid response from server' }));
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
  } catch (error) {
    dispatch(apiError(error));
  }
};

export const logoutUser = () => async (dispatch : any) => {
  try {
    if (process.env.REACT_APP_DEFAULTAUTH === "nailsco") {
      clearAuthTokens();
      dispatch(logoutUserSuccess(true));
    } else {
      sessionStorage.removeItem("authUser");
      let fireBaseBackend : any = getFirebaseBackend();
      if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
        const response = fireBaseBackend.logout;
        dispatch(logoutUserSuccess(response));
      } else {
        dispatch(logoutUserSuccess(true));
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