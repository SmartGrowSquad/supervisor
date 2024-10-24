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
      if(pathname === "/urbani") {
        return getUserUrbani(method, pathname, params, (response) => {
          process.nextTick(cb, res, response);
        });
      }
    default:
      return process.nextTick(cb, res, null);
  }
}

function getUserUrbani(method, pathname, params, cb) {
  console.log("UserUrbani get [start]");
  var response = {
    key: params.key,
    errorcode: 0,
    errormessage: "success"
  };

  console.log("UserUrbani get [validate params]", params);
  if (params.mId === null || params.mId === "") {
    response.errorcode = 1;
    response.errormessage = "Invalid mId";
    cb(response);
    return;  // 에러가 발생하면 더 이상 실행하지 않음
  }

  console.log("UserUrbani get [connect db]", params);
  var connection = mysql.createConnection(conn);
  connection.connect();

  // 첫 번째 쿼리: INSERT 쿼리 실행
  connection.query(
    "select * from urbani where m_id=?",
    [
      params.mId,
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