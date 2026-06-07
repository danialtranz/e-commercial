import bcrypt from "bcrypt";
import { User } from "../../models/modal";
import { put, exists, get, del, setString } from "../../config/redis";
import { emailService } from "../../utils/emailUtil";
import {
  validateSignUpEmail,
  validateSignUpPassword,
} from "../../utils/signUpValidation";

export const AuthErrorCode = {
  EMAIL_NOT_FOUND: 1201,
  WRONG_PASSWORD: 1202,
  NO_PASSWORD_ACCOUNT: 1203,
  NOT_USER_ROLE: 1204,
  RESET_CODE_INVALID: 1206,
  RESET_EMAIL_MISMATCH: 1207,
  SAME_PASSWORD: 1208,
  OAUTH_ONLY_ACCOUNT: 1209,
} as const;

/** Provider cho tài khoản đăng ký / đăng nhập bằng mật khẩu */
const PASSWORD_AUTH_PROVIDERS = new Set(["local", "password"]);

export const RESET_PASSWORD_KEY_PREFIX = "reset-pw:verify:";
export const RESET_PASSWORD_EMAIL_INDEX_PREFIX = "reset-pw:email:";
export const RESET_PASSWORD_TTL_SECONDS = 600;

export class PasswordAuthServiceError extends Error {
  constructor(
    public readonly code: number,
    message: string,
  ) {
    super(message);
    this.name = "PasswordAuthServiceError";
  }
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface TakeResetCodeInput {
  email: string;
}

export interface ForgotPasswordInput {
  email: string;
  new_password: string;
  code: string;
}

export interface ChangePasswordInput {
  email: string;
  old_password: string;
  new_password: string;
}

function toUserPlain(user: User): Record<string, unknown> {
  const plain = { ...(user.get({ plain: true }) as object) } as Record<
    string,
    unknown
  >;
  delete plain.password;
  return plain;
}

async function generateUniqueResetCode(): Promise<string> {
  const maxAttempts = 50;
  for (let i = 0; i < maxAttempts; i++) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const key = `${RESET_PASSWORD_KEY_PREFIX}${code}`;
    if (!(await exists(key))) {
      return code;
    }
  }
  throw new Error("Cannot generate unique reset code");
}

export async function signInWithPassword(input: SignInInput) {
  const emailCheck = validateSignUpEmail(input.email);
  if (emailCheck.ok === false) {
    throw new PasswordAuthServiceError(emailCheck.code, emailCheck.msg);
  }

  const email = input.email.trim().toLowerCase();
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new PasswordAuthServiceError(
      AuthErrorCode.EMAIL_NOT_FOUND,
      "Tài khoản không tồn tại",
    );
  }

  if (user.role !== "user") {
    throw new PasswordAuthServiceError(
      AuthErrorCode.NOT_USER_ROLE,
      "Chỉ tài khoản user mới đăng nhập bằng email và mật khẩu",
    );
  }

  if (!user.password) {
    throw new PasswordAuthServiceError(
      AuthErrorCode.NO_PASSWORD_ACCOUNT,
      "Tài khoản không có mật khẩu. Vui lòng đăng nhập bằng Google",
    );
  }

  const passwordMatched = await bcrypt.compare(input.password, user.password);
  if (!passwordMatched) {
    throw new PasswordAuthServiceError(
      AuthErrorCode.WRONG_PASSWORD,
      "Mật khẩu không đúng",
    );
  }

  return {
    user: toUserPlain(user),
    jwtPayload: {
      id: user.id,
      email: user.email,
      role: "user" as const,
    },
  };
}

export async function takePasswordResetCode(
  input: TakeResetCodeInput,
): Promise<{ sentTo: string }> {
  const emailCheck = validateSignUpEmail(input.email);
  if (emailCheck.ok === false) {
    throw new PasswordAuthServiceError(emailCheck.code, emailCheck.msg);
  }

  const email = input.email.trim().toLowerCase();
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new PasswordAuthServiceError(
      AuthErrorCode.EMAIL_NOT_FOUND,
      "Email không tồn tại trong hệ thống",
    );
  }

  const emailIndexKey = `${RESET_PASSWORD_EMAIL_INDEX_PREFIX}${email}`;
  const previousCode = await get(emailIndexKey);
  if (previousCode) {
    await del(`${RESET_PASSWORD_KEY_PREFIX}${previousCode}`);
  }

  const resetCode = await generateUniqueResetCode();
  const userRow = toUserPlain(user);

  const verifyKey = `${RESET_PASSWORD_KEY_PREFIX}${resetCode}`;
  await put(verifyKey, userRow, RESET_PASSWORD_TTL_SECONDS);
  await setString(emailIndexKey, resetCode, RESET_PASSWORD_TTL_SECONDS);

  await emailService.sendEmail(resetCode, "reset_password", email);

  return { sentTo: email };
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  const emailCheck = validateSignUpEmail(input.email);
  if (emailCheck.ok === false) {
    throw new PasswordAuthServiceError(emailCheck.code, emailCheck.msg);
  }

  const normalizedCode = input.code.trim();
  if (!/^\d{6}$/.test(normalizedCode)) {
    throw new PasswordAuthServiceError(
      AuthErrorCode.RESET_CODE_INVALID,
      "Mã khôi phục không hợp lệ",
    );
  }

  const verifyKey = `${RESET_PASSWORD_KEY_PREFIX}${normalizedCode}`;
  const raw = await get(verifyKey);
  if (!raw) {
    throw new PasswordAuthServiceError(
      AuthErrorCode.RESET_CODE_INVALID,
      "Mã khôi phục đã hết hạn hoặc không hợp lệ",
    );
  }

  const userRow = JSON.parse(raw) as Record<string, unknown>;
  /** Email gắn với mã OTP — lấy từ user row đã lưu Redis khi gọi tke-code */
  const userEmailFromRedis =
    typeof userRow.email === "string"
      ? userRow.email.trim().toLowerCase()
      : "";
  const requestEmail = input.email.trim().toLowerCase();

  if (!userEmailFromRedis) {
    throw new PasswordAuthServiceError(
      AuthErrorCode.RESET_CODE_INVALID,
      "Mã khôi phục không hợp lệ",
    );
  }

  if (userEmailFromRedis !== requestEmail) {
    throw new PasswordAuthServiceError(
      AuthErrorCode.RESET_EMAIL_MISMATCH,
      "Email không khớp với mã khôi phục",
    );
  }

  const passwordCheck = validateSignUpPassword(input.new_password);
  if (passwordCheck.ok === false) {
    throw new PasswordAuthServiceError(passwordCheck.code, passwordCheck.msg);
  }

  const userId = typeof userRow.id === "string" ? userRow.id : null;
  if (!userId) {
    throw new PasswordAuthServiceError(
      AuthErrorCode.RESET_CODE_INVALID,
      "Mã khôi phục không hợp lệ",
    );
  }

  const hashedPassword = await bcrypt.hash(input.new_password, 10);
  const [updated] = await User.update(
    { password: hashedPassword },
    { where: { id: userId, email: userEmailFromRedis } },
  );

  if (updated === 0) {
    throw new PasswordAuthServiceError(
      AuthErrorCode.EMAIL_NOT_FOUND,
      "Không tìm thấy tài khoản để cập nhật mật khẩu",
    );
  }

  await del(verifyKey);
  await del(`${RESET_PASSWORD_EMAIL_INDEX_PREFIX}${requestEmail}`);
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  const email = input.email.trim().toLowerCase();
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new PasswordAuthServiceError(
      AuthErrorCode.EMAIL_NOT_FOUND,
      "Tài khoản không tồn tại",
    );
  }

  const provider = user.provider?.toLowerCase() ?? "";
  if (!PASSWORD_AUTH_PROVIDERS.has(provider)) {
    throw new PasswordAuthServiceError(
      AuthErrorCode.OAUTH_ONLY_ACCOUNT,
      "Tài khoản này chỉ được đăng nhập với email",
    );
  }

  if (input.old_password === input.new_password) {
    throw new PasswordAuthServiceError(
      AuthErrorCode.SAME_PASSWORD,
      "Mật khẩu cũ phải khác mật khẩu mới",
    );
  }

  const passwordCheck = validateSignUpPassword(input.new_password);
  if (passwordCheck.ok === false) {
    throw new PasswordAuthServiceError(passwordCheck.code, passwordCheck.msg);
  }

  if (!user.password) {
    throw new PasswordAuthServiceError(
      AuthErrorCode.NO_PASSWORD_ACCOUNT,
      "Tài khoản không có mật khẩu",
    );
  }

  const oldPasswordMatched = await bcrypt.compare(
    input.old_password,
    user.password,
  );
  if (!oldPasswordMatched) {
    throw new PasswordAuthServiceError(
      AuthErrorCode.WRONG_PASSWORD,
      "Mật khẩu cũ không đúng",
    );
  }

  const hashedPassword = await bcrypt.hash(input.new_password, 10);
  await User.update(
    { password: hashedPassword },
    { where: { id: user.id, email } },
  );
}
