const mysql = require('mysql');

const con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'nodemysql'
});

con.connect((err) => {
  if (err) {
    console.error('DB connection error:', err.message);
  } else {
    console.log('MySQL Connected ✅');
  }
});

module.exports = con;