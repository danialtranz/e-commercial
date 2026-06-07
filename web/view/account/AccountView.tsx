"use client";

import Link from "next/link";
import React, {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { ChevronDown, Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAllChangePasswordFieldFeedback,
  validateChangePasswordField,
  type ChangePasswordFieldKey,
} from "@/lib/validation/userAuthValidation";
import { useChangePassword } from "@/hooks/user/useUserHook";
import {
  AUTH_SESSION_UPDATED_EVENT,
  readAuthSessionFromStorage,
  type StoredUserInfo,
} from "@/lib/authSession";

type ApiMessage = {
  type: "success" | "error";
  text: string;
};

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  success?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  autoComplete?: string;
};

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  success,
  inputRef,
  autoComplete,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const hintId = error ? `${id}-error` : success ? `${id}-success` : undefined;

  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="text-xs font-bold uppercase tracking-wide text-slate-500"
      >
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">
          <Lock size={18} />
        </span>
        <input
          ref={inputRef}
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={hintId}
          className={cn(
            "w-full rounded-lg border py-3 pr-11 pl-10 text-sm transition-all outline-none focus:border-transparent focus:ring-2",
            error
              ? "border-red-400 focus:ring-red-400"
              : success
                ? "border-blue-300 focus:ring-blue-400"
                : "border-slate-200 focus:ring-emerald-500"
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
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
        "rounded-lg border px-3 py-2.5 text-sm leading-snug",
        message.type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-700"
      )}
    >
      {message.text}
    </div>
  );
}

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

function ChangePasswordSection() {
  const { changePassword, loading } = useChangePassword();
  const [expanded, setExpanded] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<ChangePasswordFieldKey, string>>
  >({});
  const [successes, setSuccesses] = useState<
    Partial<Record<ChangePasswordFieldKey, string>>
  >({});
  const [apiMessage, setApiMessage] = useState<ApiMessage | null>(null);

  const oldPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);

  const values = { oldPassword, newPassword };

  const resetForm = () => {
    setOldPassword("");
    setNewPassword("");
    setErrors({});
    setSuccesses({});
    setApiMessage(null);
  };

  const toggleExpanded = () => {
    setExpanded((prev) => {
      if (prev) resetForm();
      return !prev;
    });
  };

  const handleFieldChange = (
    field: ChangePasswordFieldKey,
    value: string,
    setter: (v: string) => void
  ) => {
    setter(value);
    setApiMessage(null);
    const next = { ...values, [field]: value };
    applyFieldFeedback(
      field,
      validateChangePasswordField(field, next),
      setErrors,
      setSuccesses
    );

    if (field === "oldPassword" && newPassword) {
      applyFieldFeedback(
        "newPassword",
        validateChangePasswordField("newPassword", next),
        setErrors,
        setSuccesses
      );
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const { errors: nextErrors, successes: nextSuccesses } =
      getAllChangePasswordFieldFeedback(values);
    setErrors(nextErrors);
    setSuccesses(nextSuccesses);
    setApiMessage(null);

    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.oldPassword) {
        oldPasswordRef.current?.focus();
      } else {
        newPasswordRef.current?.focus();
      }
      return;
    }

    try {
      const res = await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });

      if (res?.code === 0) {
        resetForm();
        setExpanded(false);
        return;
      }

      setApiMessage({
        type: "error",
        text: res?.msg || "Đổi mật khẩu thất bại",
      });
    } catch {
      setApiMessage({
        type: "error",
        text: "Không kết nối được máy chủ",
      });
    }
  };

  return (
    <div className="mt-6 border-t border-slate-100 pt-6">
      <button
        type="button"
        onClick={toggleExpanded}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2">
          <KeyRound size={18} className="text-emerald-600" />
          Đổi mật khẩu
        </span>
        <ChevronDown
          size={18}
          className={cn(
            "shrink-0 text-slate-500 transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded ? (
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4"
          noValidate
        >
          <ApiMessageBanner message={apiMessage} />

          <PasswordField
            id="account-old-password"
            label="Mật khẩu hiện tại"
            value={oldPassword}
            onChange={(v) =>
              handleFieldChange("oldPassword", v, setOldPassword)
            }
            placeholder="********"
            autoComplete="current-password"
            error={errors.oldPassword}
            success={successes.oldPassword}
            inputRef={oldPasswordRef}
          />
          <PasswordField
            id="account-new-password"
            label="Mật khẩu mới"
            value={newPassword}
            onChange={(v) =>
              handleFieldChange("newPassword", v, setNewPassword)
            }
            placeholder="********"
            autoComplete="new-password"
            error={errors.newPassword}
            success={successes.newPassword}
            inputRef={newPasswordRef}
          />

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : "Lưu mật khẩu mới"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={toggleExpanded}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Hủy
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

const AccountView: React.FC = () => {
  const [user, setUser] = useState<StoredUserInfo | null>(null);

  useEffect(() => {
    const syncUser = () => {
      setUser(readAuthSessionFromStorage().userInfo);
    };
    syncUser();
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, syncUser);
    return () =>
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, syncUser);
  }, []);

  const canChangePassword = user?.role === "user";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 md:px-6">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold text-slate-900">Tài khoản</h1>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {user ? (
            <>
              <p className="text-sm text-slate-500">Tên</p>
              <p className="font-medium text-slate-900">{user.name || "—"}</p>
              <p className="mt-4 text-sm text-slate-500">Email</p>
              <p className="font-medium text-slate-900">{user.email || "—"}</p>
              <p className="mt-4 text-sm text-slate-500">Vai trò</p>
              <p className="font-medium text-slate-900">
                {user.role === "admin" ? "Quản trị viên" : "Khách hàng"}
              </p>

              {canChangePassword ? <ChangePasswordSection /> : null}
            </>
          ) : (
            <p className="text-slate-600">
              Không đọc được thông tin người dùng.
            </p>
          )}
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/account/orders"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Đơn hàng của tôi
          </Link>
          <Link
            href="/shop"
            className="rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccountView;
