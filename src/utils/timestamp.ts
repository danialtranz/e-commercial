export const createTimestamp = (date: Date) => {
  const timestamp = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);

  const milliseconds = date.getMilliseconds().toString().padStart(3, "0");
  const formattedTimestamp = `${timestamp}.${milliseconds} +0700`;
  return formattedTimestamp;
};

export function toTimestamp(dateStr) {
  // Tạo đối tượng Date từ chuỗi YYYY-MM-DD
  const date = new Date(dateStr);
  // Trả về timestamp (milliseconds từ 1970)
  return date.getTime();
}
