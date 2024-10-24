// 작물 구매 승인 요청
const mysql = require('mysql');
const conn = {
  host: process.env.DB_HOST, 
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

exports.onRequest = function(res, method, pathname, params, cb) {
  switch(method) {
    case "POST":
      if(pathname === "/puchase") {
        return getPurchases(method, pathname, params, (response) => {
          process.nextTick(cb, res, response);
        });
      }
    default:
      return process.nextTick(cb, res, null);
  }
}

function getPurchases(method, pathname, params, cb) {
  console.log("Puchase get [start]");
  var response = {
    key: params.key,
    errorcode: 0,
    errormessage: "success"
  };

  console.log("Puchase get [validate params]", params);
  if (params.uId === null || params.uId === "") {
    response.errorcode = 1;
    response.errormessage = "Invalid id";
    cb(response);
    return;  // 에러가 발생하면 더 이상 실행하지 않음
  }

  console.log("Puchase get [connect db]", params);
  var connection = mysql.createConnection(conn);
  connection.connect();

  // 첫 번째 쿼리: INSERT 쿼리 실행
  connection.query(
    "select p.*, ac.name from purchase p join available_crop ac on ac.id = p.ac_id where ac.u_id=?",
    [
      params.uId,
    ],
    (error, results, fields) => {
      if (error) {
        response.errorcode = 1;
        response.errormessage = error.sqlMessage || "Database Error";
        cb(response);
        
        return;
      }

      response.results = results;

      cb(response);
  });
}