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
