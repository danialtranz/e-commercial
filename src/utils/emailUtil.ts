import "../config/config";
import nodemailer, { Transporter } from "nodemailer";

export type EmailType = "verify_email" | "reset_password";

const APP_NAME = process.env.MAIL_APP_NAME || "Bán Mì Chú";

export function buildVerifyEmailUrl(token: string): string {
  const port = process.env.AGENT_PORT || "8889";
  const base =
    process.env.API_BASE_URL?.replace(/\/$/, "") ||
    `http://localhost:${port}`;
  return `${base}/v1/user/verify-email?token=${encodeURIComponent(token)}`;
}

function buildVerifyLinkEmailHtml(params: {
  title: string;
  greeting: string;
  description: string;
  verifyUrl: string;
  note: string;
}): string {
  const { title, greeting, description, verifyUrl, note } = params;

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:24px 28px;">
              <h1 style="margin:0;font-size:22px;line-height:1.3;color:#ffffff;">${APP_NAME}</h1>
              <p style="margin:8px 0 0;font-size:14px;color:#dcfce7;">${title}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${greeting}</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">${description}</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${verifyUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;background:#16a34a;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:8px;">Xác minh email</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#6b7280;">${note}</p>
              <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;word-break:break-all;">Hoặc mở link: <a href="${verifyUrl}" style="color:#15803d;">${verifyUrl}</a></p>
              <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#9ca3af;">Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">© ${new Date().getFullYear()} ${APP_NAME}. Email được gửi tự động, vui lòng không trả lời.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

function buildOtpEmailHtml(params: {
  title: string;
  greeting: string;
  description: string;
  code: string;
  codeLabel: string;
  note: string;
}): string {
  const { title, greeting, description, code, codeLabel, note } = params;

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:24px 28px;">
              <h1 style="margin:0;font-size:22px;line-height:1.3;color:#ffffff;">${APP_NAME}</h1>
              <p style="margin:8px 0 0;font-size:14px;color:#dcfce7;">${title}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${greeting}</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">${description}</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <div style="display:inline-block;padding:18px 28px;background:#f0fdf4;border:2px dashed #16a34a;border-radius:12px;">
                      <span style="display:block;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#15803d;margin-bottom:8px;">${codeLabel}</span>
                      <span style="display:block;font-size:36px;font-weight:700;letter-spacing:0.35em;color:#14532d;padding-left:0.35em;">${code}</span>
                    </div>
                    </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6b7280;">${note}</p>
              <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#9ca3af;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">© ${new Date().getFullYear()} ${APP_NAME}. Email được gửi tự động, vui lòng không trả lời.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

export interface OrderSuccessEmailParams {
  orderId: string;
  totalPrice: number;
  paymentMethod?: string;
  status?: string;
}

function formatVnd(amount: number): string {
  return `${Math.max(0, amount).toLocaleString("vi-VN")} đ`;
}

function buildOrderSuccessEmailHtml(params: OrderSuccessEmailParams): string {
  const orderRef = params.orderId.slice(-8).toUpperCase();
  const paymentLabel =
    params.paymentMethod?.toLowerCase() === "momo" ? "MoMo" : "COD (thanh toán khi nhận hàng)";
  const total = formatVnd(params.totalPrice);

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Đặt hàng thành công</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:24px 28px;">
              <h1 style="margin:0;font-size:22px;line-height:1.3;color:#ffffff;">${APP_NAME}</h1>
              <p style="margin:8px 0 0;font-size:14px;color:#dcfce7;">Đặt hàng thành công</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Xin chào,</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">
                Cảm ơn bạn đã đặt hàng. Đơn của bạn đã được ghi nhận thành công.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
                <tr>
                  <td style="padding:16px 20px;font-size:14px;line-height:1.8;color:#374151;">
                    <strong>Mã đơn:</strong> #${orderRef}<br />
                    <strong>Tổng tiền:</strong> ${total}<br />
                    <strong>Thanh toán:</strong> ${paymentLabel}
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#9ca3af;">
                Chúng tôi sẽ xử lý và giao hàng trong thời gian sớm nhất.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">© ${new Date().getFullYear()} ${APP_NAME}. Email được gửi tự động, vui lòng không trả lời.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

function getOrderSuccessEmailContent(
  params: OrderSuccessEmailParams,
): { subject: string; html: string; text: string } {
  const orderRef = params.orderId.slice(-8).toUpperCase();
  const paymentLabel =
    params.paymentMethod?.toLowerCase() === "momo" ? "MoMo" : "COD";
  const total = formatVnd(params.totalPrice);

  return {
    subject: `[${APP_NAME}] Đặt hàng thành công — #${orderRef}`,
    html: buildOrderSuccessEmailHtml(params),
    text: `[${APP_NAME}] Đặt hàng thành công.\nMã đơn: #${orderRef}\nTổng tiền: ${total}\nThanh toán: ${paymentLabel}`,
  };
}

function getEmailContent(
  emailType: EmailType,
  code: string,
): { subject: string; html: string; text: string } {
  switch (emailType) {
    case "verify_email": {
      const verifyUrl = buildVerifyEmailUrl(code);
      return {
        subject: `[${APP_NAME}] Xác minh email đăng ký`,
        html: buildVerifyLinkEmailHtml({
          title: "Xác minh email",
          greeting: "Xin chào,",
          description:
            "Bạn vừa đăng ký tài khoản. Nhấn nút bên dưới để xác minh email và kích hoạt tài khoản:",
          verifyUrl,
          note: "Link có hiệu lực 10 phút. Không chia sẻ link này với bất kỳ ai.",
        }),
        text: `[${APP_NAME}] Xác minh email: ${verifyUrl}\nLink có hiệu lực 10 phút.`,
      };
    }
    case "reset_password":
      return {
        subject: `[${APP_NAME}] Mã lấy lại mật khẩu`,
        html: buildOtpEmailHtml({
          title: "Lấy lại mật khẩu",
          greeting: "Xin chào,",
          description:
            "Bạn vừa yêu cầu đặt lại mật khẩu. Vui lòng nhập mã bên dưới để tiếp tục:",
          code,
          codeLabel: "Mã khôi phục",
          note: "Mã có hiệu lực trong thời gian ngắn. Nếu không phải bạn, hãy đổi mật khẩu ngay.",
        }),
        text: `[${APP_NAME}] Mã lấy lại mật khẩu của bạn là: ${code}. Mã có hiệu lực trong thời gian ngắn.`,
      };
    default: {
      const _exhaustive: never = emailType;
      throw new Error(`Unsupported email type: ${_exhaustive}`);
    }
  }
}

class EmailService {
  private transporter: Transporter;
  private readonly fromAddress: string;

  constructor() {
    const user = process.env.MAIL_USER;
    const pass = (process.env.MAIL_PASSWORD || "").replace(/\s/g, "");

    if (!user || !pass) {
      throw new Error(
        "MAIL_USER and MAIL_PASSWORD must be set in environment variables",
      );
    }

    this.fromAddress = user;
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.MAIL_SMTP_PORT) || 587,
      secure: process.env.MAIL_SMTP_SECURE === "true",
      auth: {
        user,
        pass,
      },
    });
  }

  /** Kiểm tra kết nối SMTP khi server khởi động. */
  async verify(): Promise<void> {
    await this.transporter.verify();
  }

  async sendEmail(
    code: string,
    emailType: EmailType,
    to: string,
  ): Promise<void> {
    const normalizedCode = code.trim();
    const recipient = to.trim().toLowerCase();

    if (!recipient) {
      throw new Error("Recipient email is required");
    }
    if (!/^\d{6}$/.test(normalizedCode)) {
      throw new Error("code must be exactly 6 digits");
    }

    const { subject, html, text } = getEmailContent(emailType, normalizedCode);

    console.log(
      `[EmailService] Sending ${emailType} to=${recipient} (from=${this.fromAddress})`,
    );

    const info = await this.transporter.sendMail({
      from: this.fromAddress,
      to: recipient,
      subject,
      text,
      html,
    });

    console.log(
      `[EmailService] Sent messageId=${info.messageId} accepted=${JSON.stringify(info.accepted)}`,
    );
  }

  async sendOrderSuccessEmail(
    to: string,
    params: OrderSuccessEmailParams,
  ): Promise<void> {
    const recipient = to.trim().toLowerCase();
    if (!recipient) {
      throw new Error("Recipient email is required");
    }

    const { subject, html, text } = getOrderSuccessEmailContent(params);

    console.log(
      `[EmailService] Sending order_success to=${recipient} orderId=${params.orderId}`,
    );

    const info = await this.transporter.sendMail({
      from: this.fromAddress,
      to: recipient,
      subject,
      text,
      html,
    });

    console.log(
      `[EmailService] Sent messageId=${info.messageId} accepted=${JSON.stringify(info.accepted)}`,
    );
  }
}

export const emailService = new EmailService();

export async function connectEmail(): Promise<void> {
  await emailService.verify();
}

export default EmailService;
