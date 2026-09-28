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
  console.log('MySQL connected (market_place.service.js)');
});

app.get('/', (req, res) => {
  console.log(`Incoming Request http://localhost:${PORT}`);
  res.status(200).send("<H1>Welcome TO market_place.server.js Server</H1>");
});

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`market_place.service.js server running at http://localhost:${PORT}`);
});
// GET /MarketPlace      -> all MarketPlace
app.get('/market_place', (req, res) => {
    const M_ID = req.query.id;
  
    let sql = 'SELECT * FROM market_place';
    let params = [];
  
    if (M_ID && M_ID !== '%') {
      const idNum = Number(M_ID);
      if (!Number.isInteger(idNum)) {
        return res.status(400).json({ error: "Query param 'id' must be an integer or '%'." });
      }
  
      sql += ' WHERE M_ID = ?';
      params = [idNum];
    }
  
    con.query(sql, params, function (err, result, fields) {
      if (err) {
        console.error('DB query failed:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json(result);
      console.log(result);
    });
  });
   // POST /market to create a new record
app.post('/market_place', (req, res) => {
    console.log("Post Request Received", req.body);
  
    const { M_ID,Item_Name, Description,Available,Taken,P_ID } = req.body || {};
  
    if (!M_ID || !Item_Name || !Description|| !Available|| !Taken|| !P_ID ) {
      return res
        .status(400)
        .json({ Status: "Error", Message: "M_ID,Item_Name,Description,Available,Taken and P_ID are required" });
    }
  
    const sql = "INSERT INTO market_place (`M_ID`,`Item_Name`,`Description`,`Available`,`Taken`,`P_ID`) VALUES (?,?,?,?,?,?)";
  
    con.query(sql, [M_ID, Item_Name,Description,Available,Taken,P_ID], function (err, result, fields) {
      if (err) {
        console.error("Insert failed:", err.message);
        return res.status(500).json({ Status: "Error", Message: err.message });
      }
      res.json({ Status: "OK", Message: "Record Added Successfully with Id " + result.insertId });
      console.log("Record Added " + result.insertId);
    });
  });
  app.delete('/market_place',(req,res)=>{
    var M_ID= req.query.id;
    con.query("DELETE FROM market_place where M_ID = ?", [M_ID], function (err, result, fields) {
      if (err) throw err;
      res.json({"Status":"OK", "Message" : "Record Id ["+req.query.id+"] deleted Successfully"});
      console.log("Delete Request Received for record ["+req.query.id+"] received");
    });
  });
  app.put('/market_place', (req, res) => {
    console.log("PUT Request Received");
    var M_ID = req.query.id;
  
    con.query(
      "UPDATE market_place SET `Item_Name` = ?, `Description` = ?, `Available` = ?, `Taken` = ?, `P_ID` = ? WHERE M_ID = ?",
      [
        req.body.Item_Name,
        req.body.Description,
        req.body.Available,
        req.body.Taken,
        req.body.P_ID,
        M_ID
      ],
      function (err, result, fields) {
        if (err) {
          console.error("Update failed:", err.message);
          return res.status(500).json({ "Status": "Error", "Message": err.message });
        }
        res.json({ "Status": "OK", "Message": "Record Id [" + M_ID + "] is Updated Successfully" });
        console.log("Record Id [" + M_ID + "] is Updated Successfully");
      }
    );
  });
  