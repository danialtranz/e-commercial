// middlewares/parseFormData.ts
import { IncomingForm } from "formidable";

export const parseFormData = (req, res, next) => {
  const form = new IncomingForm({
    multiples: false,
    keepExtensions: true,
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      return res
        .status(400)
        .json({ message: "Form parsing failed", error: err });
    }
    console.log("field_pre", fields);
    console.log("files_123", files);
    const normalizedFields: Record<string, any> = {};
    for (const key in fields) {
      if (Array.isArray(fields[key]) && fields[key].length === 1) {
        normalizedFields[key] = fields[key][0];
      } else {
        normalizedFields[key] = fields[key];
      }
    }

    for (const key in normalizedFields) {
      if (isJSONString(normalizedFields[key])) {
        normalizedFields[key] = JSON.parse(normalizedFields[key]);
      }
    }
    req.body = normalizedFields;
    console.log("req.body", req.body);
    console.log("parse_file", files);
    req.files = files;

    next();
  });
};

const isJSONString = (value: any): boolean => {
  if (typeof value !== "string") return false;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null;
  } catch (e) {
    return false;
  }
};
