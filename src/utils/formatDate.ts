export const formatDate = (timestamp) => {
  const date = new Date(timestamp); // Chuyển timestamp thành đối tượng Date
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Lấy tháng (tháng bắt đầu từ 0)
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0"); // Thêm phần milliseconds

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
};

export const generateTimestamps = () => {
  const current_timestamp = () => Date.now();

  const datetime_format = (date_time) =>
    new Date(
      date_time.getFullYear(),
      date_time.getMonth(),
      date_time.getDate(),
      date_time.getHours(),
      date_time.getMinutes(),
      date_time.getSeconds()
    );

  const now = new Date();

  return {
    create_time: current_timestamp(),
    create_date: datetime_format(now),
    update_time: current_timestamp(),
    update_date: datetime_format(now),
  };
};

// Example usage
