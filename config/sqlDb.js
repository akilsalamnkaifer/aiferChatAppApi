const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Function to execute queries asynchronously
const db = async (query, params) => {
  try {
    const [rows, fields] = await pool.promise().query(query, params);
    return rows;
  } catch (err) {
    console.error("Database query error:", err);
    throw err; // Re-throw the error to handle it in the calling code
  }
};

// Function to check the connection to the database
const checkConnection = async () => {
  try {
    const connection = await pool.promise().getConnection();
    await connection.ping();
    connection.release();
    console.log("Database connection successful");
  } catch (err) {
    console.error("Database connection error:", err);
  }
};

// Export the database query function and the connection check function
module.exports = { db, checkConnection };
