import { userForgetPasswordSuccess, userForgetPasswordError } from "./reducer"

//Include Both Helper File with needed methods
import { getFirebaseBackend } from "../../../helpers/firebase_helper";


import axios from "axios";

const fireBaseBackend : any= getFirebaseBackend();

export const userForgetPassword = (user : any, history : any) => async (dispatch : any) => {
  try {
      // Real backend call
      const response = await axios.post(
        "/api/v1/users/forgot-password",
        { email: user.email },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response && response.data) {
        dispatch(
          userForgetPasswordSuccess(
            response.data.message ||
              "Reset link has been sent to your mailbox, check there first."
          )
        );
      }
  } catch (forgetError) {
      dispatch(userForgetPasswordError(forgetError))
  }
}