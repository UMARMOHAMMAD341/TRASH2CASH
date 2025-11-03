const mysql = require('mysql');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345',  // your MySQL password
  database: 'trashtocash'
});

db.connect(err => {
  if (err) {
    console.error('❌ MySQL connection error:', err);
  } else {
    console.log('✅ Connected to MySQL Database');
  }
});

module.exports = db;
