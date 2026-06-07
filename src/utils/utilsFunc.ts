export const convertToISODate = (dateString: string): string => {
  console.log("[dateString]", dateString);
  const [day, month, year] = dateString.split("/");
  return `${year}-${month}-${day}`; // yyyy-mm-dd
};
// utils/validateUploadFiles.ts
// utils/validateUploadFiles.ts
export const validateUploadFiles = (filesObj: { files: any[] }) => {
  if (
    !filesObj ||
    !filesObj.files ||
    !Array.isArray(filesObj.files) ||
    filesObj.files.length === 0
  ) {
    return { errorCode: false, message: "You need to upload at least 1 file" };
  }

  const fileArray = filesObj.files;

  if (fileArray.length > 10) {
    return { errorCode: false, message: "Exceeded 10 files maximum!" };
  }

  const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  ];

  const maxSizeBytes = 100 * 1024 * 1024; // 100MB
  const executableMimePatterns = [
    /^application\/x-executable/,
    /^application\/x-msdownload/,
  ];

  for (const file of fileArray) {
    const { mimetype, size, originalFilename } = file;

    if (!allowedMimeTypes.includes(mimetype)) {
      return {
        errorCode: false,
        message: `File "${originalFilename}" không đúng định dạng (chỉ cho phép .pdf, .docx).`,
      };
    }

    if (size > maxSizeBytes) {
      return {
        errorCode: false,
        message: `File "${originalFilename}" vượt quá giới hạn 100MB.`,
      };
    }

    const isExecutable = executableMimePatterns.some((pattern) =>
      pattern.test(mimetype),
    );
    if (isExecutable) {
      return {
        errorCode: false,
        message: `File "${originalFilename}" có định dạng nguy hiểm và không được phép upload.`,
      };
    }
  }

  return { errorCode: true };
};
import { UUIDTypes, v4 as uuidv4 } from "uuid";
export const getIdString = () => {
  return uuidv4().replace(/-/g, "");
};

import "../config/config";

////////////////////////
////////////////////////
////////////////////////
import { v7 as uuidv7 } from "uuid";

export function getUuidV7() {
  const raw = uuidv7(); // ví dụ: '018fe9ac-b2c4-7ac1-b58c-13dfdf0dcf1b'
  return raw.replace(/-/g, ""); // trả về 32 ký tự
}

export const convertStringDateToDate = (dateString: string) => {
  const date = new Date(dateString);
  return date;
};
