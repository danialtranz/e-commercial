import * as React from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { useToast } from "@/hooks/useToast";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  type ToastActionElement,
} from "@/components/ui/toast";

export type I18nText =
  | string
  | {
      key: string;
      values?: Record<string, unknown>;
      defaultValue?: string;
    };

function resolveI18nText(t: TFunction, input?: I18nText): string | undefined {
  if (!input) return undefined;
  if (typeof input === "string") return input;
  return t(input.key, {
    ...(input.values ?? {}),
    defaultValue: input.defaultValue,
  });
}

export type RadixToastInput = {
  title?: I18nText;
  description?: I18nText;
  variant?: "default" | "destructive";
  action?: ToastActionElement;
};

/**
 * Hook dùng để show Radix toast với hỗ trợ đa ngôn ngữ.
 *
 * Usage:
 * const { toast } = useRadixToast();
 * toast({ title: { key: "message.saveSuccess" }, description: "..." })
 */
export function useRadixToast() {
  const { t } = useTranslation();
  const { toast: rawToast } = useToast();

  const toast = React.useCallback(
    (input: RadixToastInput) => {
      rawToast({
        title: resolveI18nText(t, input.title),
        description: resolveI18nText(t, input.description),
        variant: input.variant,
        action: input.action,
      });
    },
    [rawToast, t]
  );

  return { toast };
}

/**
 * Component mount 1 lần ở app root để render Radix toast UI.
 */
export function RadixToaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title ? <ToastTitle>{title}</ToastTitle> : null}
            {description ? (
              <ToastDescription>{description}</ToastDescription>
            ) : null}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
