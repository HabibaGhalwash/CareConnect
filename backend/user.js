const mysql = require('mysql'); //Database functionality
const express = require('express'); //express is a web framework for Node.js
const PORT = 8080; //Server Listening Port
const app = express(); // create app from express object

// Middleware to parse JSON and URL-encoded bodies from Postman
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to Database
global.con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: "",
  database: 'nodemysql'
});

con.connect(function (err) {
  if (err) throw err;
  console.log('MySQL connected (user.js)');
});

app.get('/', (req, res) => {
  console.log(`Incoming Request http://localhost:${PORT}`);
  res.status(200).send("<H1>Welcome TO Node.js Server</H1>");
});

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`user.js server running at http://localhost:${PORT}`);
});
// GET /users?id=1  -> single user
// GET /users       -> all users
app.get('/users', (req, res) => {
    const user_id = req.query.id;
  
    let sql = 'SELECT * FROM users';
    let params = [];
  
    if (user_id && user_id !== '%') {
      sql += ' WHERE id = ?';
      params = [user_id];
    }
  
    con.query(sql, params, function (err, result, fields) {
      if (err) throw err;
      res.json(result);
      console.log(result);
    });
  });
  