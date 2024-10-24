const mysql = require('mysql');
const conn = {
  host: process.env.DB_HOST, 
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

exports.onRequest = function(res, method, pathname, params, cb) {
  switch(method) {
    // 환경 정보 수집
    case "POST":
      if(pathname === "/validate") { // qr 인증
        return validate(method, pathname, params, (response) => {
          process.nextTick(cb, res, response);
        });
      }
    default:
      return process.nextTick(cb, res, null);
  }
}

function validate(method, pathname, params, cb) {
  console.log("QR validate [start]", params);
  var response = {
    key: params.key,
    errorcode: 0,
    errormessage: "success"
  };

  console.log("QR validate [validate params]", params);
  if (params.passcode === null || params.passcode === "") {
    response.errorcode = 1;
    response.errormessage = "Invalid Passcode";
    cb(response);
    return;  // 에러가 발생하면 더 이상 실행하지 않음
  }

  console.log("QR validate [connect db]");
  var connection = mysql.createConnection(conn);
  connection.connect();

  console.log("QR validate [send query]");
  connection.query(
    "SELECT * FROM purchase WHERE passcode=? and id=?",
    [params.passcode, params.id], 
    (error, results, fields) => {
    if (error || results.length === 0) {
      response.errorcode = 1;
      response.errormessage = error;
      cb(response);
      return;
    }
    
    response.results = results;
    
    cb(response);
  });
}