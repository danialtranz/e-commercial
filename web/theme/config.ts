import type { ThemeConfig } from "antd";

const themeAntd: ThemeConfig = {
  token: {
    fontSize: 16,
    colorPrimary: "#52c41a",
  },
  components: {
    Message: {
      contentBg: "#1a1c1e",
      colorText: "#ffffff",
      colorBgElevated: "#1a1c1e",
      colorError: "#ff4d4f",
      colorSuccess: "#40c057",
      colorWarning: "#ffa502",
      colorInfo: "#3b82f6",
    },
    Notification: {
      colorBgElevated: "#1a1c1e",
      colorText: "#ffffff",
      colorTextHeading: "#ffffff",
      colorBorder: "#2a2c2e",
      colorIcon: "#ffffff",
      colorIconHover: "#ffffff",
    },
  },
};

export default themeAntd;
