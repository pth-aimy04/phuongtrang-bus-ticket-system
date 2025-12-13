import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

export const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then((pool) => {
    console.log("✅ Đã kết nối SQL Server!");
    return pool;
  })
  .catch((err) => console.error("❌ Lỗi kết nối SQL:", err.message));
