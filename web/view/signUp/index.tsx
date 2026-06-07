"use client";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useRouter } from "next/router";
import {
  ArrowRight,
  AtSign,
  ChevronLeft,
  Eye,
  EyeOff,
  Hash,
  KeyRound,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAllForgotResetFieldFeedback,
  getAllForgotTakeCodeFieldFeedback,
  getAllLoginFieldFeedback,
  getAllSignUpFieldFeedback,
  validateForgotResetField,
  validateForgotTakeCodeField,
  validateLoginField,
  validateSignUpField,
  type ForgotResetFieldKey,
  type ForgotTakeCodeFieldKey,
  type LoginFieldKey,
  type SignUpFieldKey,
} from "@/lib/validation/userAuthValidation";
import {
  useForgotPassword,
  useSignInWithPassword,
  useSignUp,
  useTakePasswordResetCode,
} from "@/hooks/user/useUserHook";
import { Divider } from "@/view/loginV2/Divider";
import { Terms } from "@/view/loginV2/Terms";
import { LoadingOverlay } from "@/view/loginV2/LoadingOverlay";
import { UserGoogleSignInButton } from "./GoogleSignInButton";

type AuthTab = "login" | "signup";
type AuthPanel = AuthTab | "forgot";

type ApiMessage = {
  type: "success" | "error";
  text: string;
};

const RESET_CODE_COOLDOWN_SECONDS = 30;

export type UserAuthViewProps = {
  defaultTab?: AuthTab;
};

type AuthFieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon: ReactNode;
  autoComplete?: string;
  required?: boolean;
  error?: string;
  success?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  showPasswordToggle?: boolean;
};

function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  icon,
  autoComplete,
  required = true,
  error,
  success,
  inputRef,
  showPasswordToggle = false,
}: AuthFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const hintId = error ? `${id}-error` : success ? `${id}-success` : undefined;
  const isPasswordField = showPasswordToggle || type === "password";
  const inputType =
    isPasswordField && showPasswordToggle
      ? passwordVisible
        ? "text"
        : "password"
      : type;

  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="text-xs font-bold uppercase tracking-wide text-gray-500"
      >
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
          {icon}
        </span>
        <input
          ref={inputRef}
          id={id}
          type={inputType}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={hintId}
          className={cn(
            "w-full rounded border py-3 pl-10 text-sm transition-all outline-none focus:border-transparent focus:ring-2",
            isPasswordField && showPasswordToggle ? "pr-11" : "pr-4",
            error
              ? "border-red-400 focus:ring-red-400"
              : success
                ? "border-blue-300 focus:ring-blue-400"
                : "border-gray-200 focus:ring-organic"
          )}
        />
        {isPasswordField && showPasswordToggle ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label={passwordVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            aria-pressed={passwordVisible}
            onClick={() => setPasswordVisible((v) => !v)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
          >
            {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-xs text-red-500" role="alert">
          {error}
        </p>
      ) : null}
      {!error && success ? (
        <p id={`${id}-success`} className="text-xs text-blue-600" role="status">
          {success}
        </p>
      ) : null}
    </div>
  );
}

function ApiMessageBanner({ message }: { message: ApiMessage | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={cn(
        "mb-4 rounded-md border px-3 py-2.5 text-sm leading-snug",
        message.type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-700"
      )}
    >
      {message.text}
    </div>
  );
}

const PANEL_HEADERS: Record<AuthPanel, { title: string; subtitle: string }> = {
  login: {
    title: "Đăng nhập",
    subtitle: "Chào mừng bạn đến với Ban Mi Chu",
  },
  signup: {
    title: "Đăng ký",
    subtitle: "Tạo tài khoản khách hàng mới",
  },
  forgot: {
    title: "Quên mật khẩu",
    subtitle: "Khôi phục quyền truy cập tài khoản",
  },
};

function SubmitButton({
  loading,
  label,
  loadingLabel = "ĐANG XỬ LÝ...",
  disabled = false,
}: {
  loading: boolean;
  label: string;
  loadingLabel?: string;
  disabled?: boolean;
}) {
  const isDisabled = loading || disabled;
  return (
    <button
      type="submit"
      disabled={isDisabled}
      className="group flex w-full items-center justify-center gap-2 rounded bg-organic py-4 font-bold text-white shadow-lg transition-all hover:bg-organic-dark disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? loadingLabel : label}
      {!loading && !disabled && (
        <ArrowRight
          size={18}
          className="transition-transform group-hover:translate-x-1"
        />
      )}
    </button>
  );
}

function AuthTabs({
  activeTab,
  onChange,
  disabled,
}: {
  activeTab: AuthTab;
  onChange: (tab: AuthTab) => void;
  disabled?: boolean;
}) {
  const tabs: { id: AuthTab; label: string }[] = [
    { id: "login", label: "Đăng nhập" },
    { id: "signup", label: "Đăng ký" },
  ];

  return (
    <div
      className="mb-6 flex rounded-lg border border-gray-100 bg-gray-50 p-1"
      role="tablist"
      aria-label="Chọn đăng nhập hoặc đăng ký"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex-1 rounded-md py-2.5 text-xs font-bold uppercase tracking-wider transition-all",
              isActive
                ? "bg-white text-organic shadow-sm"
                : "text-gray-500 hover:text-gray-700",
              disabled && "cursor-not-allowed opacity-60"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function focusField(ref: React.RefObject<HTMLInputElement | null>) {
  requestAnimationFrame(() => {
    ref.current?.focus();
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

export function UserAuthView({ defaultTab = "login" }: UserAuthViewProps) {
  const router = useRouter();
  const { signIn, loading: signInLoading } = useSignInWithPassword();
  const { signUp, loading: signUpLoading } = useSignUp();
  const { takeResetCode, loading: takeResetCodeLoading } =
    useTakePasswordResetCode();
  const { forgotPassword, loading: forgotPasswordLoading } =
    useForgotPassword();

  const [panel, setPanel] = useState<AuthPanel>(defaultTab);
  const [activeTab, setActiveTab] = useState<AuthTab>(defaultTab);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<
    Partial<Record<LoginFieldKey, string>>
  >({});
  const [loginFieldSuccess, setLoginFieldSuccess] = useState<
    Partial<Record<LoginFieldKey, string>>
  >({});
  const [loginApiMessage, setLoginApiMessage] = useState<ApiMessage | null>(
    null
  );

  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupErrors, setSignupErrors] = useState<
    Partial<Record<SignUpFieldKey, string>>
  >({});
  const [signupFieldSuccess, setSignupFieldSuccess] = useState<
    Partial<Record<SignUpFieldKey, string>>
  >({});
  const [signupApiMessage, setSignupApiMessage] = useState<ApiMessage | null>(
    null
  );

  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [forgotEmailErrors, setForgotEmailErrors] = useState<
    Partial<Record<ForgotTakeCodeFieldKey, string>>
  >({});
  const [forgotEmailSuccess, setForgotEmailSuccess] = useState<
    Partial<Record<ForgotTakeCodeFieldKey, string>>
  >({});
  const [forgotResetErrors, setForgotResetErrors] = useState<
    Partial<Record<ForgotResetFieldKey, string>>
  >({});
  const [forgotResetSuccess, setForgotResetSuccess] = useState<
    Partial<Record<ForgotResetFieldKey, string>>
  >({});
  const [forgotApiMessage, setForgotApiMessage] = useState<ApiMessage | null>(
    null
  );
  const [resetCodeCooldown, setResetCodeCooldown] = useState(0);

  const loginEmailRef = useRef<HTMLInputElement>(null);
  const loginPasswordRef = useRef<HTMLInputElement>(null);
  const fullNameRef = useRef<HTMLInputElement>(null);
  const userNameRef = useRef<HTMLInputElement>(null);
  const signupEmailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const signupPasswordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const forgotEmailRef = useRef<HTMLInputElement>(null);
  const resetCodeRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmNewPasswordRef = useRef<HTMLInputElement>(null);

  const loginFieldRefs: Record<
    LoginFieldKey,
    React.RefObject<HTMLInputElement | null>
  > = {
    email: loginEmailRef,
    password: loginPasswordRef,
  };

  const signupFieldRefs: Record<
    SignUpFieldKey,
    React.RefObject<HTMLInputElement | null>
  > = {
    fullName: fullNameRef,
    userName: userNameRef,
    email: signupEmailRef,
    phoneNumber: phoneRef,
    password: signupPasswordRef,
    confirmPassword: confirmPasswordRef,
  };

  const forgotTakeCodeValues = { email: forgotEmail };
  const forgotResetValues = {
    code: resetCode,
    newPassword,
    confirmNewPassword,
  };

  useEffect(() => {
    if (resetCodeCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResetCodeCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resetCodeCooldown]);

  const header = PANEL_HEADERS[panel];
  const apiLoading = signInLoading || signUpLoading;
  const forgotLoading = takeResetCodeLoading || forgotPasswordLoading;
  const isLoading = apiLoading || googleLoading || forgotLoading;

  const loginValues = { email: loginEmail, password: loginPassword };
  const signupValues = {
    fullName,
    userName,
    email: signupEmail,
    phoneNumber,
    password: signupPassword,
    confirmPassword,
  };

  const applyFieldFeedback = <K extends string>(
    field: K,
    feedback: { error?: string; success?: string },
    setErrors: Dispatch<SetStateAction<Partial<Record<K, string>>>>,
    setSuccesses: Dispatch<SetStateAction<Partial<Record<K, string>>>>
  ) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (feedback.error) next[field] = feedback.error;
      else delete next[field];
      return next;
    });
    setSuccesses((prev) => {
      const next = { ...prev };
      if (feedback.success) next[field] = feedback.success;
      else delete next[field];
      return next;
    });
  };

  const handleLoginFieldChange = (
    field: LoginFieldKey,
    value: string,
    setter: (v: string) => void
  ) => {
    setter(value);
    setLoginApiMessage(null);
    const next = { ...loginValues, [field]: value };
    applyFieldFeedback(
      field,
      validateLoginField(field, next),
      setLoginErrors,
      setLoginFieldSuccess
    );
  };

  const handleSignupFieldChange = (
    field: SignUpFieldKey,
    value: string,
    setter: (v: string) => void
  ) => {
    setter(value);
    setSignupApiMessage(null);
    const next = { ...signupValues, [field]: value };
    applyFieldFeedback(
      field,
      validateSignUpField(field, next),
      setSignupErrors,
      setSignupFieldSuccess
    );

    if (field === "password" && confirmPassword) {
      applyFieldFeedback(
        "confirmPassword",
        validateSignUpField("confirmPassword", next),
        setSignupErrors,
        setSignupFieldSuccess
      );
    }
  };

  const focusFirstLoginError = (
    errors: Partial<Record<LoginFieldKey, string>>
  ) => {
    const order: LoginFieldKey[] = ["email", "password"];
    const first = order.find((key) => errors[key]);
    if (first) focusField(loginFieldRefs[first]);
  };

  const focusFirstSignupError = (
    errors: Partial<Record<SignUpFieldKey, string>>
  ) => {
    const order: SignUpFieldKey[] = [
      "fullName",
      "userName",
      "email",
      "phoneNumber",
      "password",
      "confirmPassword",
    ];
    const first = order.find((key) => errors[key]);
    if (first) focusField(signupFieldRefs[first]);
  };

  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setPanel(tab);
    setLoginErrors({});
    setLoginFieldSuccess({});
    setSignupErrors({});
    setSignupFieldSuccess({});
    setLoginApiMessage(null);
    setSignupApiMessage(null);
  };

  const openForgotPassword = () => {
    if (loginEmail.trim()) {
      const email = loginEmail.trim();
      setForgotEmail(email);
      applyFieldFeedback(
        "email",
        validateForgotTakeCodeField("email", { email }),
        setForgotEmailErrors,
        setForgotEmailSuccess
      );
    }
    setForgotApiMessage(null);
    setPanel("forgot");
  };

  const backToLogin = () => {
    setPanel("login");
    setActiveTab("login");
    setForgotEmailErrors({});
    setForgotEmailSuccess({});
    setForgotResetErrors({});
    setForgotResetSuccess({});
    setForgotApiMessage(null);
  };

  const handleForgotTakeCodeFieldChange = (
    field: ForgotTakeCodeFieldKey,
    value: string,
    setter: (v: string) => void
  ) => {
    setter(value);
    setForgotApiMessage(null);
    const next = { ...forgotTakeCodeValues, [field]: value };
    applyFieldFeedback(
      field,
      validateForgotTakeCodeField(field, next),
      setForgotEmailErrors,
      setForgotEmailSuccess
    );
  };

  const handleForgotResetFieldChange = (
    field: ForgotResetFieldKey,
    value: string,
    setter: (v: string) => void
  ) => {
    setter(value);
    setForgotApiMessage(null);
    const next = { ...forgotResetValues, [field]: value };
    applyFieldFeedback(
      field,
      validateForgotResetField(field, next),
      setForgotResetErrors,
      setForgotResetSuccess
    );

    if (field === "newPassword" && confirmNewPassword) {
      applyFieldFeedback(
        "confirmNewPassword",
        validateForgotResetField("confirmNewPassword", next),
        setForgotResetErrors,
        setForgotResetSuccess
      );
    }
  };

  const startResetCodeCooldown = () => {
    setResetCodeCooldown(RESET_CODE_COOLDOWN_SECONDS);
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const { errors, successes } = getAllLoginFieldFeedback(loginValues);
    setLoginErrors(errors);
    setLoginFieldSuccess(successes);
    setLoginApiMessage(null);

    if (Object.keys(errors).length > 0) {
      focusFirstLoginError(errors);
      return;
    }

    try {
      const res = await signIn({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      });

      if (res?.code === 0) {
        await router.replace("/product");
        return;
      }

      setLoginApiMessage({
        type: "error",
        text: res?.msg || "Đăng nhập thất bại",
      });
    } catch {
      setLoginApiMessage({
        type: "error",
        text: "Không kết nối được máy chủ",
      });
    }
  };

  const handleSignupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const { errors, successes } = getAllSignUpFieldFeedback(signupValues);
    setSignupErrors(errors);
    setSignupFieldSuccess(successes);
    setSignupApiMessage(null);

    if (Object.keys(errors).length > 0) {
      focusFirstSignupError(errors);
      return;
    }

    try {
      const res = await signUp({
        fullName: fullName.trim(),
        userName: userName.trim(),
        email: signupEmail.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        password: signupPassword,
      });

      if (res?.code === 0) {
        setSignupApiMessage({
          type: "success",
          text: res.msg || "Vui lòng kiểm tra email để xác minh tài khoản",
        });
        await router.replace("/user-login");
        return;
      }

      setSignupApiMessage({
        type: "error",
        text: res?.msg || "Đăng ký thất bại",
      });
    } catch {
      setSignupApiMessage({
        type: "error",
        text: "Không kết nối được máy chủ",
      });
    }
  };

  const handleSendResetCode = async (e: FormEvent) => {
    e.preventDefault();
    if (resetCodeCooldown > 0) return;

    const { errors, successes } =
      getAllForgotTakeCodeFieldFeedback(forgotTakeCodeValues);
    setForgotEmailErrors(errors);
    setForgotEmailSuccess(successes);
    setForgotApiMessage(null);

    if (Object.keys(errors).length > 0) {
      focusField(forgotEmailRef);
      return;
    }

    try {
      const res = await takeResetCode({
        email: forgotEmail.trim().toLowerCase(),
      });

      if (res?.code === 0) {
        startResetCodeCooldown();
        setForgotApiMessage({
          type: "success",
          text: res.msg || "Mã khôi phục đã được gửi đến email của bạn",
        });
        return;
      }

      setForgotApiMessage({
        type: "error",
        text: res?.msg || "Không gửi được mã khôi phục",
      });
    } catch {
      setForgotApiMessage({
        type: "error",
        text: "Không kết nối được máy chủ",
      });
    }
  };

  const handleResetPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const takeCodeFeedback =
      getAllForgotTakeCodeFieldFeedback(forgotTakeCodeValues);
    const { errors, successes } =
      getAllForgotResetFieldFeedback(forgotResetValues);

    setForgotEmailErrors(takeCodeFeedback.errors);
    setForgotEmailSuccess(takeCodeFeedback.successes);
    setForgotResetErrors(errors);
    setForgotResetSuccess(successes);
    setForgotApiMessage(null);

    const allErrors = {
      ...takeCodeFeedback.errors,
      ...errors,
    };

    if (Object.keys(allErrors).length > 0) {
      if (takeCodeFeedback.errors.email) {
        focusField(forgotEmailRef);
      } else if (errors.code) {
        focusField(resetCodeRef);
      } else if (errors.newPassword) {
        focusField(newPasswordRef);
      } else if (errors.confirmNewPassword) {
        focusField(confirmNewPasswordRef);
      }
      return;
    }

    try {
      const res = await forgotPassword({
        email: forgotEmail.trim().toLowerCase(),
        code: resetCode.trim(),
        new_password: newPassword,
      });

      if (res?.code === 0) {
        setForgotApiMessage({
          type: "success",
          text: res.msg || "Đặt lại mật khẩu thành công",
        });
        backToLogin();
        return;
      }

      setForgotApiMessage({
        type: "error",
        text: res?.msg || "Đặt lại mật khẩu thất bại",
      });
    } catch {
      setForgotApiMessage({
        type: "error",
        text: "Không kết nối được máy chủ",
      });
    }
  };

  const resetCodeButtonLabel =
    resetCodeCooldown > 0
      ? `GỬI LẠI SAU (${resetCodeCooldown}s)`
      : "GỬI MÃ KHÔI PHỤC";

  const showTabs = panel === "login" || panel === "signup";
  const showGoogle = panel !== "forgot";

  return (
    <div className="relative flex min-h-[60vh] items-center justify-center bg-login-bg px-4 py-20">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-gray-100 bg-white shadow-xl">
        <div className="bg-organic p-8 text-center">
          <h2 className="text-2xl font-bold tracking-widest text-white uppercase">
            {header.title}
          </h2>
          <p className="mt-2 text-xs tracking-tighter text-white/80 uppercase">
            {header.subtitle}
          </p>
        </div>

        <div className="p-8">
          {panel === "forgot" && (
            <button
              type="button"
              onClick={backToLogin}
              className="mb-5 flex items-center gap-1 text-xs font-medium text-organic hover:text-organic-dark hover:underline"
            >
              <ChevronLeft size={16} />
              Quay lại đăng nhập
            </button>
          )}

          {showTabs && (
            <AuthTabs
              activeTab={activeTab}
              onChange={switchTab}
              disabled={isLoading}
            />
          )}

          {panel === "login" && <ApiMessageBanner message={loginApiMessage} />}
          {panel === "signup" && (
            <ApiMessageBanner message={signupApiMessage} />
          )}
          {panel === "forgot" && (
            <ApiMessageBanner message={forgotApiMessage} />
          )}

          {panel === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-5" noValidate>
              <AuthField
                id="login-email"
                label="Email"
                type="email"
                value={loginEmail}
                onChange={(v) =>
                  handleLoginFieldChange("email", v, setLoginEmail)
                }
                placeholder="email@example.com"
                icon={<Mail size={18} />}
                autoComplete="email"
                error={loginErrors.email}
                success={loginFieldSuccess.email}
                inputRef={loginEmailRef}
              />
              <AuthField
                id="login-password"
                label="Mật khẩu"
                type="password"
                showPasswordToggle
                value={loginPassword}
                onChange={(v) =>
                  handleLoginFieldChange("password", v, setLoginPassword)
                }
                placeholder="********"
                icon={<Lock size={18} />}
                autoComplete="current-password"
                error={loginErrors.password}
                success={loginFieldSuccess.password}
                inputRef={loginPasswordRef}
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={openForgotPassword}
                  className="text-xs font-semibold text-organic hover:text-organic-dark hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <SubmitButton loading={apiLoading} label="ĐĂNG NHẬP NGAY" />
            </form>
          )}

          {panel === "signup" && (
            <form
              onSubmit={handleSignupSubmit}
              className="space-y-4"
              noValidate
            >
              <AuthField
                id="signup-fullname"
                label="Họ và tên"
                value={fullName}
                onChange={(v) =>
                  handleSignupFieldChange("fullName", v, setFullName)
                }
                placeholder="Nguyễn Văn A"
                icon={<User size={18} />}
                autoComplete="name"
                error={signupErrors.fullName}
                success={signupFieldSuccess.fullName}
                inputRef={fullNameRef}
              />
              <AuthField
                id="signup-username"
                label="Tên đăng nhập"
                value={userName}
                onChange={(v) =>
                  handleSignupFieldChange("userName", v, setUserName)
                }
                placeholder="username"
                icon={<AtSign size={18} />}
                autoComplete="username"
                error={signupErrors.userName}
                success={signupFieldSuccess.userName}
                inputRef={userNameRef}
              />
              <AuthField
                id="signup-email"
                label="Email"
                type="email"
                value={signupEmail}
                onChange={(v) =>
                  handleSignupFieldChange("email", v, setSignupEmail)
                }
                placeholder="email@example.com"
                icon={<Mail size={18} />}
                autoComplete="email"
                error={signupErrors.email}
                success={signupFieldSuccess.email}
                inputRef={signupEmailRef}
              />
              <AuthField
                id="signup-phone"
                label="Số điện thoại"
                type="tel"
                value={phoneNumber}
                onChange={(v) =>
                  handleSignupFieldChange("phoneNumber", v, setPhoneNumber)
                }
                placeholder="09xxxxxxxx"
                icon={<Phone size={18} />}
                autoComplete="tel"
                error={signupErrors.phoneNumber}
                success={signupFieldSuccess.phoneNumber}
                inputRef={phoneRef}
              />
              <AuthField
                id="signup-password"
                label="Mật khẩu"
                type="password"
                showPasswordToggle
                value={signupPassword}
                onChange={(v) =>
                  handleSignupFieldChange("password", v, setSignupPassword)
                }
                placeholder="********"
                icon={<Lock size={18} />}
                autoComplete="new-password"
                error={signupErrors.password}
                success={signupFieldSuccess.password}
                inputRef={signupPasswordRef}
              />
              <AuthField
                id="signup-confirm-password"
                label="Xác nhận mật khẩu"
                type="password"
                showPasswordToggle
                value={confirmPassword}
                onChange={(v) =>
                  handleSignupFieldChange(
                    "confirmPassword",
                    v,
                    setConfirmPassword
                  )
                }
                placeholder="********"
                icon={<KeyRound size={18} />}
                autoComplete="new-password"
                error={signupErrors.confirmPassword}
                success={signupFieldSuccess.confirmPassword}
                inputRef={confirmPasswordRef}
              />

              <SubmitButton loading={apiLoading} label="ĐĂNG KÝ NGAY" />
            </form>
          )}

          {panel === "forgot" && (
            <div className="space-y-6">
              <form onSubmit={handleSendResetCode} className="space-y-4">
                <p className="text-sm leading-relaxed text-gray-500">
                  Nhập email đã đăng ký. Chúng tôi sẽ gửi mã xác minh để đặt lại
                  mật khẩu.
                </p>
                <AuthField
                  id="forgot-email"
                  label="Email"
                  type="email"
                  value={forgotEmail}
                  onChange={(v) =>
                    handleForgotTakeCodeFieldChange("email", v, setForgotEmail)
                  }
                  placeholder="email@example.com"
                  icon={<Mail size={18} />}
                  autoComplete="email"
                  error={forgotEmailErrors.email}
                  success={forgotEmailSuccess.email}
                  inputRef={forgotEmailRef}
                />
                <SubmitButton
                  loading={takeResetCodeLoading}
                  disabled={resetCodeCooldown > 0}
                  label={resetCodeButtonLabel}
                />
              </form>

              <Divider />

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <p className="text-sm leading-relaxed text-gray-500">
                  Nhập mã OTP từ email và mật khẩu mới.
                </p>
                <AuthField
                  id="reset-code"
                  label="Mã xác minh"
                  value={resetCode}
                  onChange={(v) =>
                    handleForgotResetFieldChange("code", v, setResetCode)
                  }
                  placeholder="123456"
                  icon={<Hash size={18} />}
                  autoComplete="one-time-code"
                  error={forgotResetErrors.code}
                  success={forgotResetSuccess.code}
                  inputRef={resetCodeRef}
                />
                <AuthField
                  id="reset-new-password"
                  label="Mật khẩu mới"
                  type="password"
                  showPasswordToggle
                  value={newPassword}
                  onChange={(v) =>
                    handleForgotResetFieldChange(
                      "newPassword",
                      v,
                      setNewPassword
                    )
                  }
                  placeholder="********"
                  icon={<Lock size={18} />}
                  autoComplete="new-password"
                  error={forgotResetErrors.newPassword}
                  success={forgotResetSuccess.newPassword}
                  inputRef={newPasswordRef}
                />
                <AuthField
                  id="reset-confirm-password"
                  label="Xác nhận mật khẩu mới"
                  type="password"
                  showPasswordToggle
                  value={confirmNewPassword}
                  onChange={(v) =>
                    handleForgotResetFieldChange(
                      "confirmNewPassword",
                      v,
                      setConfirmNewPassword
                    )
                  }
                  placeholder="********"
                  icon={<KeyRound size={18} />}
                  autoComplete="new-password"
                  error={forgotResetErrors.confirmNewPassword}
                  success={forgotResetSuccess.confirmNewPassword}
                  inputRef={confirmNewPasswordRef}
                />

                <SubmitButton
                  loading={forgotPasswordLoading}
                  label="ĐẶT LẠI MẬT KHẨU"
                />
              </form>
            </div>
          )}

          {showGoogle && (
            <>
              <div className="mt-6">
                <Divider />
              </div>
              <div className="mt-6">
                <UserGoogleSignInButton
                  disabled={isLoading}
                  onLoadingChange={setGoogleLoading}
                  portal="user"
                  className="group"
                />
              </div>
            </>
          )}

          <Terms />
        </div>
      </div>

      <LoadingOverlay isLoading={isLoading} />
    </div>
  );
}

export default UserAuthView;
