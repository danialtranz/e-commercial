// routes/uploadMessageFile.ts
import { IncomingForm, File } from "formidable";
import path from "path";
import fs from "fs";

export const parseFormDataFileOnly = (req, res, next) => {
  const form = new IncomingForm({
    multiples: true,
    keepExtensions: true,
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error("[ERROR][parseFormDataFileOnly]", err);
      return res.status(500).json({ msg: "Upload failed" });
    }
    req.files = files;

    const normalizedFields: Record<string, any> = {};
    for (const key in fields) {
      if (Array.isArray(fields[key]) && fields[key].length === 1) {
        normalizedFields[key] = fields[key][0];
      } else {
        normalizedFields[key] = fields[key];
      }
    }
    req.body = normalizedFields;

    next();
  });
};
