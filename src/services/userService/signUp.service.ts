import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { Op } from "sequelize";
import { User } from "../../models/modal";
import { put, exists, get, del, setString } from "../../config/redis";
import { emailService } from "../../utils/emailUtil";
import {
  SignUpErrorCode,
  validateSignUpEmail,
  validateSignUpFullName,
  validateSignUpPassword,
  validateSignUpPhoneNumber,
  validateSignUpUsername,
} from "../../utils/signUpValidation";

export const SIGNUP_VERIFY_KEY_PREFIX = "signup:verify:";
export const SIGNUP_EMAIL_INDEX_PREFIX = "signup:email:";
export const SIGNUP_VERIFY_TTL_SECONDS = 600;

export const VerifyEmailErrorCode = {
  TOKEN_EXPIRED: 1101,
  TOKEN_INVALID: 1102,
  ACCOUNT_EXISTS: 1103,
} as const;

export class SignUpServiceError extends Error {
  constructor(
    public readonly code: number,
    message: string,
  ) {
    super(message);
    this.name = "SignUpServiceError";
  }
}

export class VerifyEmailServiceError extends Error {
  constructor(
    public readonly code: number,
    message: string,
  ) {
    super(message);
    this.name = "VerifyEmailServiceError";
  }
}

export interface SignUpInput {
  fullName: string;
  userName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface SignUpPendingPayload {
  email: string;
  username: string;
  password: string;
  phoneNumber: string;
  fullName: string;
  role: "user";
}

async function generateUniqueVerificationCode(): Promise<string> {
  const maxAttempts = 50;
  for (let i = 0; i < maxAttempts; i++) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const key = `${SIGNUP_VERIFY_KEY_PREFIX}${code}`;
    if (!(await exists(key))) {
      return code;
    }
  }
  throw new Error("Cannot generate unique verification code");
}

export async function signUpUser(
  input: SignUpInput,
): Promise<{ sentTo: string }> {
  const fullName = input.fullName.trim();
  const username = input.userName.trim();
  const email = input.email.trim().toLowerCase();
  const phoneNumber = input.phoneNumber.trim();
  const password = input.password;

  const fullNameCheck = validateSignUpFullName(fullName);
  if (fullNameCheck.ok === false) {
    throw new SignUpServiceError(fullNameCheck.code, fullNameCheck.msg);
  }

  const emailFormatCheck = validateSignUpEmail(email);
  if (emailFormatCheck.ok === false) {
    throw new SignUpServiceError(emailFormatCheck.code, emailFormatCheck.msg);
  }

  const existingEmail = await User.findOne({ where: { email } });
  if (existingEmail) {
    throw new SignUpServiceError(
      SignUpErrorCode.EMAIL_EXISTS,
      "Email đã tồn tại trong hệ thống",
    );
  }

  const passwordCheck = validateSignUpPassword(password);
  if (passwordCheck.ok === false) {
    throw new SignUpServiceError(passwordCheck.code, passwordCheck.msg);
  }

  const usernameCheck = validateSignUpUsername(username);
  if (usernameCheck.ok === false) {
    throw new SignUpServiceError(usernameCheck.code, usernameCheck.msg);
  }

  const existingUsername = await User.findOne({
    where: {
      username: { [Op.iLike]: username },
    },
  });
  if (existingUsername) {
    throw new SignUpServiceError(
      SignUpErrorCode.USERNAME_EXISTS,
      "Tên đăng nhập đã tồn tại trong hệ thống",
    );
  }

  const phoneCheck = validateSignUpPhoneNumber(phoneNumber);
  if (phoneCheck.ok === false) {
    throw new SignUpServiceError(phoneCheck.code, phoneCheck.msg);
  }

  const existingPhone = await User.findOne({
    where: { phoneNumber },
  });
  if (existingPhone) {
    throw new SignUpServiceError(
      SignUpErrorCode.PHONE_EXISTS,
      "Số điện thoại đã tồn tại trong hệ thống",
    );
  }

  const emailIndexKey = `${SIGNUP_EMAIL_INDEX_PREFIX}${email}`;
  const previousCode = await get(emailIndexKey);
  if (previousCode) {
    await del(`${SIGNUP_VERIFY_KEY_PREFIX}${previousCode}`);
  }

  const verificationCode = await generateUniqueVerificationCode();
  const hashedPassword = await bcrypt.hash(password, 10);

  const payload: SignUpPendingPayload = {
    email,
    username,
    password: hashedPassword,
    phoneNumber,
    fullName,
    role: "user",
  };

  const verifyKey = `${SIGNUP_VERIFY_KEY_PREFIX}${verificationCode}`;

  await put(verifyKey, payload, SIGNUP_VERIFY_TTL_SECONDS);
  await setString(emailIndexKey, verificationCode, SIGNUP_VERIFY_TTL_SECONDS);

  const savedRaw = await get(verifyKey);
  if (savedRaw) {
    const saved = JSON.parse(savedRaw) as SignUpPendingPayload;
    if (saved.email !== email) {
      throw new Error("Redis payload email mismatch before send");
    }
  }

  console.log(`[signUp] Sending verification email to: ${email}`);
  await emailService.sendEmail(verificationCode, "verify_email", email);

  return { sentTo: email };
}

export async function verifyEmailByToken(token: string) {
  const normalizedToken = token.trim();
  if (!/^\d{6}$/.test(normalizedToken)) {
    throw new VerifyEmailServiceError(
      VerifyEmailErrorCode.TOKEN_INVALID,
      "Token không hợp lệ",
    );
  }

  const verifyKey = `${SIGNUP_VERIFY_KEY_PREFIX}${normalizedToken}`;
  const raw = await get(verifyKey);
  if (!raw) {
    throw new VerifyEmailServiceError(
      VerifyEmailErrorCode.TOKEN_EXPIRED,
      "Link xác minh đã hết hạn hoặc không hợp lệ",
    );
  }

  const payload = JSON.parse(raw) as SignUpPendingPayload;

  const duplicateEmail = await User.findOne({
    where: { email: payload.email },
  });
  if (duplicateEmail) {
    await del(verifyKey);
    await del(`${SIGNUP_EMAIL_INDEX_PREFIX}${payload.email}`);
    throw new VerifyEmailServiceError(
      VerifyEmailErrorCode.ACCOUNT_EXISTS,
      "Email đã tồn tại trong hệ thống",
    );
  }

  const duplicateUsername = await User.findOne({
    where: { username: { [Op.iLike]: payload.username } },
  });
  if (duplicateUsername) {
    await del(verifyKey);
    await del(`${SIGNUP_EMAIL_INDEX_PREFIX}${payload.email}`);
    throw new VerifyEmailServiceError(
      VerifyEmailErrorCode.ACCOUNT_EXISTS,
      "Tên đăng nhập đã tồn tại trong hệ thống",
    );
  }

  const duplicatePhone = await User.findOne({
    where: { phoneNumber: payload.phoneNumber },
  });
  if (duplicatePhone) {
    await del(verifyKey);
    await del(`${SIGNUP_EMAIL_INDEX_PREFIX}${payload.email}`);
    throw new VerifyEmailServiceError(
      VerifyEmailErrorCode.ACCOUNT_EXISTS,
      "Số điện thoại đã tồn tại trong hệ thống",
    );
  }

  const user = await User.create({
    id: randomUUID(),
    email: payload.email,
    username: payload.username,
    password: payload.password,
    phoneNumber: payload.phoneNumber,
    name: payload.fullName,
    avatar: null,
    provider: "password",
    role: "user",
    status: "active",
  });

  await del(verifyKey);
  await del(`${SIGNUP_EMAIL_INDEX_PREFIX}${payload.email}`);

  return user;
}
