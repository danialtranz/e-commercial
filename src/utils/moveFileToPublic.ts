import fs from "fs";
import path from "path";
import { PersistentFile } from "formidable";

/**
 *
 * @param file
 * @param subFolder
 * @returns
 */
export const moveFileToPublic = (
  file: PersistentFile,
  subFolder: string = ""
): string => {
  const newFilename = file.newFilename;

  const baseFolder = path.join(__dirname, "../public/images", subFolder);
  const destinationPath = path.join(baseFolder, newFilename);

  if (!fs.existsSync(baseFolder)) {
    fs.mkdirSync(baseFolder, { recursive: true });
  }

  fs.renameSync(file.filepath, destinationPath);

  const relativePath = path
    .join("/images", subFolder, newFilename)
    .replace(/\\/g, "/");
  return relativePath;
};
