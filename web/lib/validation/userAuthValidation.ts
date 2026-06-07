/**
 * Validate khớp BE: be/BE_ban_mi_chu/src/utils/signUpValidation.ts
 */

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

export type FieldValidationResult =
  | { ok: true }
  | { ok: false; code: number; msg: string };

export function validateSignUpEmail(email: string): FieldValidationResult {
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

export function validateSignUpPassword(
  password: string
): FieldValidationResult {
  if (!password || !PASSWORD_REGEX.test(password)) {
    return {
      ok: false,
      code: SignUpErrorCode.PASSWORD_INVALID,
      msg: "Mật khẩu phải từ 8–32 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt (!@#$%^&*)",
    };
  }
  return { ok: true };
}

export function validateSignUpUsername(
  username: string
): FieldValidationResult {
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
  phoneNumber: string
): FieldValidationResult {
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

export function validateSignUpFullName(
  fullName: string
): FieldValidationResult {
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

/** Đăng nhập: 8–32 ký tự, ≥1 chữ cái, ≥1 số hoặc chữ hoa, ≥1 ký tự đặc biệt (!@#$%^&*). */
const SIGN_IN_PASSWORD_SPECIAL = /[!@#$%^&*]/;

export function validateSignInPassword(
  password: string
): FieldValidationResult {
  if (!password) {
    return {
      ok: false,
      code: SignUpErrorCode.PASSWORD_INVALID,
      msg: "Mật khẩu là bắt buộc",
    };
  }

  const len = password.length;
  if (len < 8 || len > 32) {
    return {
      ok: false,
      code: SignUpErrorCode.PASSWORD_INVALID,
      msg: "Mật khẩu phải từ 8–12 ký tự",
    };
  }

  if (!/[a-zA-Z]/.test(password)) {
    return {
      ok: false,
      code: SignUpErrorCode.PASSWORD_INVALID,
      msg: "Mật khẩu phải có ít nhất 1 chữ cái",
    };
  }

  if (!/(\d|[A-Z])/.test(password)) {
    return {
      ok: false,
      code: SignUpErrorCode.PASSWORD_INVALID,
      msg: "Mật khẩu phải có ít nhất 1 chữ số hoặc 1 chữ in hoa",
    };
  }

  if (!SIGN_IN_PASSWORD_SPECIAL.test(password)) {
    return {
      ok: false,
      code: SignUpErrorCode.PASSWORD_INVALID,
      msg: "Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*)",
    };
  }

  return { ok: true };
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string
): FieldValidationResult {
  if (!confirmPassword) {
    return {
      ok: false,
      code: SignUpErrorCode.PASSWORD_INVALID,
      msg: "Vui lòng xác nhận mật khẩu",
    };
  }
  if (password !== confirmPassword) {
    return {
      ok: false,
      code: SignUpErrorCode.PASSWORD_INVALID,
      msg: "Mật khẩu xác nhận không khớp",
    };
  }
  return { ok: true };
}

const RESET_CODE_REGEX = /^\d{6}$/;

export function validateResetCode(code: string): FieldValidationResult {
  const value = code.trim();
  if (!value) {
    return {
      ok: false,
      code: SignUpErrorCode.PASSWORD_INVALID,
      msg: "Mã xác minh là bắt buộc",
    };
  }
  if (!RESET_CODE_REGEX.test(value)) {
    return {
      ok: false,
      code: SignUpErrorCode.PASSWORD_INVALID,
      msg: "Mã xác minh phải gồm 6 chữ số",
    };
  }
  return { ok: true };
}

export type LoginFieldKey = "email" | "password";

export type ForgotTakeCodeFieldKey = "email";

export type ForgotResetFieldKey = "code" | "newPassword" | "confirmNewPassword";

export type ChangePasswordFieldKey = "oldPassword" | "newPassword";

export function validateChangePasswordOldPassword(
  oldPassword: string
): FieldValidationResult {
  if (!oldPassword) {
    return {
      ok: false,
      code: SignUpErrorCode.PASSWORD_INVALID,
      msg: "Mật khẩu cũ là bắt buộc",
    };
  }
  return { ok: true };
}

export function validateChangePasswordNewPassword(
  oldPassword: string,
  newPassword: string
): FieldValidationResult {
  const passwordCheck = validateSignUpPassword(newPassword);
  if (!passwordCheck.ok) return passwordCheck;

  if (oldPassword && oldPassword === newPassword) {
    return {
      ok: false,
      code: SignUpErrorCode.PASSWORD_INVALID,
      msg: "Mật khẩu mới phải khác mật khẩu cũ",
    };
  }

  return { ok: true };
}

export type SignUpFieldKey =
  | "fullName"
  | "userName"
  | "email"
  | "phoneNumber"
  | "password"
  | "confirmPassword";

export function validateLoginForm(values: {
  email: string;
  password: string;
}): Partial<Record<LoginFieldKey, string>> {
  const errors: Partial<Record<LoginFieldKey, string>> = {};
  const emailResult = validateSignUpEmail(values.email);
  if (!emailResult.ok) errors.email = emailResult.msg;
  const passwordResult = validateSignInPassword(values.password);
  if (!passwordResult.ok) errors.password = passwordResult.msg;
  return errors;
}

export function validateSignUpForm(values: {
  fullName: string;
  userName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}): Partial<Record<SignUpFieldKey, string>> {
  const errors: Partial<Record<SignUpFieldKey, string>> = {};

  const fullNameResult = validateSignUpFullName(values.fullName);
  if (!fullNameResult.ok) errors.fullName = fullNameResult.msg;

  const userNameResult = validateSignUpUsername(values.userName);
  if (!userNameResult.ok) errors.userName = userNameResult.msg;

  const emailResult = validateSignUpEmail(values.email);
  if (!emailResult.ok) errors.email = emailResult.msg;

  const phoneResult = validateSignUpPhoneNumber(values.phoneNumber);
  if (!phoneResult.ok) errors.phoneNumber = phoneResult.msg;

  const passwordResult = validateSignUpPassword(values.password);
  if (!passwordResult.ok) errors.password = passwordResult.msg;

  const confirmResult = validateConfirmPassword(
    values.password,
    values.confirmPassword
  );
  if (!confirmResult.ok) errors.confirmPassword = confirmResult.msg;

  return errors;
}

export function isLoginFormValid(values: {
  email: string;
  password: string;
}): boolean {
  return Object.keys(validateLoginForm(values)).length === 0;
}

export function isSignUpFormValid(values: {
  fullName: string;
  userName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}): boolean {
  return Object.keys(validateSignUpForm(values)).length === 0;
}

export type FieldFeedback = {
  error?: string;
  success?: string;
};

function toFieldFeedback(
  result: FieldValidationResult,
  successMsg: string,
  value: string
): FieldFeedback {
  if (!result.ok) return { error: result.msg };
  if (value.trim()) return { success: successMsg };
  return {};
}

export function validateLoginField(
  field: LoginFieldKey,
  values: { email: string; password: string }
): FieldFeedback {
  switch (field) {
    case "email":
      return toFieldFeedback(
        validateSignUpEmail(values.email),
        "Email hợp lệ",
        values.email
      );
    case "password":
      return toFieldFeedback(
        validateSignInPassword(values.password),
        "Mật khẩu hợp lệ",
        values.password
      );
    default:
      return {};
  }
}

export function validateSignUpField(
  field: SignUpFieldKey,
  values: {
    fullName: string;
    userName: string;
    email: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
  }
): FieldFeedback {
  switch (field) {
    case "fullName":
      return toFieldFeedback(
        validateSignUpFullName(values.fullName),
        "Họ tên hợp lệ",
        values.fullName
      );
    case "userName":
      return toFieldFeedback(
        validateSignUpUsername(values.userName),
        "Tên đăng nhập hợp lệ",
        values.userName
      );
    case "email":
      return toFieldFeedback(
        validateSignUpEmail(values.email),
        "Email hợp lệ",
        values.email
      );
    case "phoneNumber":
      return toFieldFeedback(
        validateSignUpPhoneNumber(values.phoneNumber),
        "Số điện thoại hợp lệ",
        values.phoneNumber
      );
    case "password":
      return toFieldFeedback(
        validateSignUpPassword(values.password),
        "Mật khẩu hợp lệ",
        values.password
      );
    case "confirmPassword":
      return toFieldFeedback(
        validateConfirmPassword(values.password, values.confirmPassword),
        "Mật khẩu xác nhận khớp",
        values.confirmPassword
      );
    default:
      return {};
  }
}

/** Gán feedback cho mọi field (submit / blur toàn form). */
export function getAllLoginFieldFeedback(values: {
  email: string;
  password: string;
}): {
  errors: Partial<Record<LoginFieldKey, string>>;
  successes: Partial<Record<LoginFieldKey, string>>;
} {
  const keys: LoginFieldKey[] = ["email", "password"];
  const errors: Partial<Record<LoginFieldKey, string>> = {};
  const successes: Partial<Record<LoginFieldKey, string>> = {};
  for (const key of keys) {
    const { error, success } = validateLoginField(key, values);
    if (error) errors[key] = error;
    if (success) successes[key] = success;
  }
  return { errors, successes };
}

export function getAllSignUpFieldFeedback(values: {
  fullName: string;
  userName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}): {
  errors: Partial<Record<SignUpFieldKey, string>>;
  successes: Partial<Record<SignUpFieldKey, string>>;
} {
  const keys: SignUpFieldKey[] = [
    "fullName",
    "userName",
    "email",
    "phoneNumber",
    "password",
    "confirmPassword",
  ];
  const errors: Partial<Record<SignUpFieldKey, string>> = {};
  const successes: Partial<Record<SignUpFieldKey, string>> = {};
  for (const key of keys) {
    const { error, success } = validateSignUpField(key, values);
    if (error) errors[key] = error;
    if (success) successes[key] = success;
  }
  return { errors, successes };
}

export function validateForgotTakeCodeField(
  field: ForgotTakeCodeFieldKey,
  values: { email: string }
): FieldFeedback {
  if (field === "email") {
    return toFieldFeedback(
      validateSignUpEmail(values.email),
      "Email hợp lệ",
      values.email
    );
  }
  return {};
}

export function validateForgotResetField(
  field: ForgotResetFieldKey,
  values: {
    code: string;
    newPassword: string;
    confirmNewPassword: string;
  }
): FieldFeedback {
  switch (field) {
    case "code":
      return toFieldFeedback(
        validateResetCode(values.code),
        "Mã xác minh hợp lệ",
        values.code
      );
    case "newPassword":
      return toFieldFeedback(
        validateSignUpPassword(values.newPassword),
        "Mật khẩu hợp lệ",
        values.newPassword
      );
    case "confirmNewPassword":
      return toFieldFeedback(
        validateConfirmPassword(values.newPassword, values.confirmNewPassword),
        "Mật khẩu xác nhận khớp",
        values.confirmNewPassword
      );
    default:
      return {};
  }
}

export function getAllForgotTakeCodeFieldFeedback(values: { email: string }): {
  errors: Partial<Record<ForgotTakeCodeFieldKey, string>>;
  successes: Partial<Record<ForgotTakeCodeFieldKey, string>>;
} {
  const keys: ForgotTakeCodeFieldKey[] = ["email"];
  const errors: Partial<Record<ForgotTakeCodeFieldKey, string>> = {};
  const successes: Partial<Record<ForgotTakeCodeFieldKey, string>> = {};
  for (const key of keys) {
    const { error, success } = validateForgotTakeCodeField(key, values);
    if (error) errors[key] = error;
    if (success) successes[key] = success;
  }
  return { errors, successes };
}

export function getAllForgotResetFieldFeedback(values: {
  code: string;
  newPassword: string;
  confirmNewPassword: string;
}): {
  errors: Partial<Record<ForgotResetFieldKey, string>>;
  successes: Partial<Record<ForgotResetFieldKey, string>>;
} {
  const keys: ForgotResetFieldKey[] = [
    "code",
    "newPassword",
    "confirmNewPassword",
  ];
  const errors: Partial<Record<ForgotResetFieldKey, string>> = {};
  const successes: Partial<Record<ForgotResetFieldKey, string>> = {};
  for (const key of keys) {
    const { error, success } = validateForgotResetField(key, values);
    if (error) errors[key] = error;
    if (success) successes[key] = success;
  }
  return { errors, successes };
}

export function validateChangePasswordField(
  field: ChangePasswordFieldKey,
  values: { oldPassword: string; newPassword: string }
): FieldFeedback {
  switch (field) {
    case "oldPassword":
      return toFieldFeedback(
        validateChangePasswordOldPassword(values.oldPassword),
        "Đã nhập mật khẩu cũ",
        values.oldPassword
      );
    case "newPassword":
      return toFieldFeedback(
        validateChangePasswordNewPassword(
          values.oldPassword,
          values.newPassword
        ),
        "Mật khẩu mới hợp lệ",
        values.newPassword
      );
    default:
      return {};
  }
}

export function getAllChangePasswordFieldFeedback(values: {
  oldPassword: string;
  newPassword: string;
}): {
  errors: Partial<Record<ChangePasswordFieldKey, string>>;
  successes: Partial<Record<ChangePasswordFieldKey, string>>;
} {
  const keys: ChangePasswordFieldKey[] = ["oldPassword", "newPassword"];
  const errors: Partial<Record<ChangePasswordFieldKey, string>> = {};
  const successes: Partial<Record<ChangePasswordFieldKey, string>> = {};
  for (const key of keys) {
    const { error, success } = validateChangePasswordField(key, values);
    if (error) errors[key] = error;
    if (success) successes[key] = success;
  }
  return { errors, successes };
}
