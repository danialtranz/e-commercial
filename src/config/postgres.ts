import "./config";
import { Sequelize, Options } from "sequelize";

const isDev = (process.env.NODE_ENV || "development") === "development";

const pgHost = isDev
  ? process.env.POSTGRES_HOST
  : process.env.POSTGRES_HOST_PROD;
const pgPort = Number(
  isDev ? process.env.POSTGRES_PORT : process.env.POSTGRES_PORT_PROD,
);
const pgUser = isDev
  ? process.env.POSTGRES_USER
  : process.env.POSTGRES_USER_PROD;
const pgPassword = isDev
  ? process.env.POSTGRES_PASSWORD
  : process.env.POSTGRES_PASSWORD_PROD;
const pgName = isDev
  ? process.env.POSTGRES_NAME
  : process.env.POSTGRES_NAME_PROD;
const sslMode = isDev
  ? process.env.POSTGRES_SSL_MODE
  : process.env.POSTGRES_SSL_MODE_PROD;

// Định nghĩa cấu hình SSL cho MySQL nếu cần
const encryptConnectionOption: Options["dialectOptions"] =
  sslMode === "enabled"
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : undefined;

// Khởi tạo Sequelize cho Postgres
const sequelize = new Sequelize(
  pgName as string,
  pgUser as string,
  pgPassword as string,
  {
    host: pgHost,
    port: pgPort,
    dialect: "postgres", // Postgres dialect
    logging: false, // Nếu debug thì đổi thành console.log
    timezone: "+00:00", // Timezone cho Postgres
    define: {
      freezeTableName: true,
      timestamps: true,
      underscored: true,
    },
    dialectOptions: {
      bigNumberStrings: true,
      dateStrings: false,
      typeCast: true,
      ...encryptConnectionOption,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  } as Options
);

export default sequelize;
