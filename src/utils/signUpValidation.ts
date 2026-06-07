export const SignUpErrorCode = {
  EMAIL_EXISTS: 1001,
  PASSWORD_INVALID: 1002,
  USERNAME_INVALID: 1003,
  USERNAME_EXISTS: 1004,
  PHONE_INVALID: 1005,
  PHONE_EXISTS: 1006,
  EMAIL_INVALID: 1007,
  FULLNAME_INVALID: 1008,
} as const;

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,32}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{5,50}$/;
const PHONE_REGEX = /^(03|05|07|08|09)\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignUpValidationResult =
  | { ok: true }
  | { ok: false; code: number; msg: string };

export function validateSignUpEmail(email: string): SignUpValidationResult {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !EMAIL_REGEX.test(normalized)) {
    return {
      ok: false,
      code: SignUpErrorCode.EMAIL_INVALID,
      msg: "Email không hợp lệ",
    };
  }
  return { ok: true };
}

export function validateSignUpPassword(password: string): SignUpValidationResult {
  if (!password || !PASSWORD_REGEX.test(password)) {
    return {
      ok: false,
      code: SignUpErrorCode.PASSWORD_INVALID,
      msg: "Mật khẩu phải từ 8–32 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt (!@#$%^&*)",
    };
  }
  return { ok: true };
}

export function validateSignUpUsername(username: string): SignUpValidationResult {
  const value = username.trim();
  if (!value || /\s/.test(value) || !USERNAME_REGEX.test(value)) {
    return {
      ok: false,
      code: SignUpErrorCode.USERNAME_INVALID,
      msg: "Tên đăng nhập từ 5–50 ký tự, chỉ gồm chữ không dấu, số, _ và -",
    };
  }
  return { ok: true };
}

export function validateSignUpPhoneNumber(
  phoneNumber: string,
): SignUpValidationResult {
  const value = phoneNumber.trim();
  if (!value || !PHONE_REGEX.test(value)) {
    return {
      ok: false,
      code: SignUpErrorCode.PHONE_INVALID,
      msg: "Số điện thoại phải 10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09",
    };
  }
  return { ok: true };
}

export function validateSignUpFullName(fullName: string): SignUpValidationResult {
  const value = fullName.trim();
  if (!value || value.length > 100) {
    return {
      ok: false,
      code: SignUpErrorCode.FULLNAME_INVALID,
      msg: "Họ tên bắt buộc và tối đa 100 ký tự",
    };
  }
  return { ok: true };
}
