import api from "@/apis/endpoint";
import type { ApiEnvelope } from "@/interface/shop";
import registerNextServer from "@/utils/registerServer";
import request from "@/utils/nextRequest";
import type { AxiosResponse } from "axios";

const {
  oauthLogin,
  userSignUp,
  userSignInPw,
  userTakeResetCode,
  userForgotPassword,
  userChangePassword,
} = api;

const methods = {
  oauthLogin: {
    url: oauthLogin,
    method: "post",
  },
} as const;

const userService = registerNextServer<keyof typeof methods>(methods);

export interface ISignUpPayload {
  fullName: string;
  userName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface ISignInWithPasswordPayload {
  email: string;
  password: string;
}

export interface ITakePasswordResetCodePayload {
  email: string;
}

export interface IForgotPasswordPayload {
  email: string;
  new_password: string;
  code: string;
}

export interface IChangePasswordPayload {
  old_password: string;
  new_password: string;
}

export interface AuthUser {
  id?: string;
  email?: string | null;
  name?: string | null;
  avatar?: string | null;
  picture?: string | null;
  role?: string | null;
  [key: string]: unknown;
}

export type SignUpResponse = ApiEnvelope<{ sentTo: string }>;
export type SignInWithPasswordResponse = ApiEnvelope<{
  token: string;
  user: AuthUser;
}>;
export type TakePasswordResetCodeResponse = ApiEnvelope<{ sentTo: string }>;
export type ForgotPasswordResponse = ApiEnvelope<null>;
export type ChangePasswordResponse = ApiEnvelope<null>;

export async function signUpUser(payload: ISignUpPayload) {
  const res = await request.post<SignUpResponse>(userSignUp, payload);
  return res;
}

export async function signInWithPassword(payload: ISignInWithPasswordPayload) {
  const res = await request.post<SignInWithPasswordResponse>(
    userSignInPw,
    payload
  );
  localStorage.setItem("user1", JSON.stringify(res));
  return res;
}

export async function takePasswordResetCode(
  payload: ITakePasswordResetCodePayload
) {
  const res = await request.post<TakePasswordResetCodeResponse>(
    userTakeResetCode,
    payload
  );
  return res;
}

export async function forgotPassword(payload: IForgotPasswordPayload) {
  const res = await request.post<ForgotPasswordResponse>(
    userForgotPassword,
    payload
  );
  return res;
}

export async function changePassword(payload: IChangePasswordPayload) {
  const res = await request.post<ChangePasswordResponse>(
    userChangePassword,
    payload
  );
  return res;
}

export type { AxiosResponse };

export default userService;
