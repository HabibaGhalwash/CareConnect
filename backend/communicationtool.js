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
  console.log('MySQL connected (communicationtool.service.js)');
});

app.get('/', (req, res) => {
  console.log(`Incoming Request http://localhost:${PORT}`);
  res.status(200).send("<H1>Welcome TO communicationtool.server.js Server</H1>");
});

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`communicationtool.service.js server running at http://localhost:${PORT}`);
});

// GET /CommunicationTools      -> all CommunicationTools
app.get('/communication_tool', (req, res) => {
    const CT_ID = req.query.id;
  
    let sql = 'SELECT * FROM communication_tool';
    let params = [];
  
    if (CT_ID && CT_ID !== '%') {
      const idNum = Number(CT_ID);
      if (!Number.isInteger(idNum)) {
        return res.status(400).json({ error: "Query param 'id' must be an integer or '%'." });
      }
  
      sql += ' WHERE CT_ID = ?';
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
  // POST /communicationtoolto create a new record
app.post('/communication_tool', (req, res) => {
    console.log("Post Request Received", req.body);
  
    const { CT_ID, Phrase, Button_Label,Icon_Image } = req.body || {};
  
    if (!CT_ID || !Phrase || !Button_Label || !Icon_Image) {
      return res
        .status(400)
        .json({ Status: "Error", Message: "CT_ID, Phrase, Button_Label and Icon_Image are required" });
    }
  
    const sql = "INSERT INTO communication_tool (`CT_ID`,`Phrase`,`Button_Label`,`Icon_Image`) VALUES (?,?,?,?)";
  
    con.query(sql, [CT_ID, Phrase, Button_Label, Icon_Image], function (err, result, fields) {
      if (err) {
        console.error("Insert failed:", err.message);
        return res.status(500).json({ Status: "Error", Message: err.message });
      }
      res.json({ Status: "OK", Message: "Record Added Successfully with Id " + result.insertId });
      console.log("Record Added " + result.insertId);
    });
  });
  app.delete('/communication_tool',(req,res)=>{
    var CT_ID= req.query.id;
    con.query("DELETE FROM communication_tool where CT_ID = ?", [CT_ID], function (err, result, fields) {
      if (err) throw err;
      res.json({"Status":"OK", "Message" : "Record Id ["+req.query.id+"] deleted Successfully"});
      console.log("Delete Request Received for record ["+req.query.id+"] received");
    });
  });
  app.put('/communication_tool', (req, res) => {
    console.log("PUT Request Received");
    var CT_ID = req.query.id;
  
    con.query(
      "UPDATE communication_tool SET `Phrase` = ?, `Button_Label` = ?, `Icon_Image` = ? WHERE CT_ID = ?",
      [
        req.body.Phrase,
        req.body.Button_Label,
        req.body.Icon_Image,
        CT_ID
      ],
      function (err, result, fields) {
        if (err) {
          console.error("Update failed:", err.message);
          return res.status(500).json({ "Status": "Error", "Message": err.message });
        }
        res.json({ "Status": "OK", "Message": "Record Id [" + CT_ID + "] is Updated Successfully" });
        console.log("Record Id [" + CT_ID + "] is Updated Successfully");
      }
    );
  });