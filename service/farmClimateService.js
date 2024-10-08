// 어반이의 환경 데이터를 수집하는 모듈입니다.

// 수집 목록
// 환경: 온습도
// 지그 관리

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
      if(pathname === "/register") {
        return register(method, pathname, params, (response) => {
          process.nextTick(cb, res, response);
        });
      } else if(pathname === "/getUrbaniData") {
        return getUrbaniData(method, pathname, params, (response) => {
          process.nextTick(cb, res, response);
        });
      }
    default:
      return process.nextTick(cb, res, null);
  }
}

/**
 * 
 * @param {*} method 
 * @param {*} pathname 
 * @param {*} params 
 * @param {*} cb
 * params: {
 * uId: UUID,
 * temperature: Number,
 * date: LocalDateTime
 * }
 */
function register(method, pathname, params, cb) {
  var response = {
    key: params.key,
    errorcode: 0,
    errormessage: "success"
  };
  console.log("test param", params);
  if(params.name = null || params.name === "") {
    response.errorcode = 1;
    response.errormessage = "Invalid Name";
    cb(response);
  } else {
    // 정상적인 데이터를 수집한 경우,
    // 1. 자체 데이터 저장
    var connection = mysql.createConnection(conn);
    connection.connect();

    connection.query("insert into urbani_temperature(u_id, temperature, date) values(?, ?, ?); select LAST_INSERT_ID() as id;"
      ,[params.uId, params.temperature, params.date]
      ,(error, results, fields) => {
        if(error) {
          response.errorcode = 1;
          response.errormessage = error;
        } else {
          response.id = results[1][0].id;
        }

        cb(response);
      }
    )
    connection.end();
  }
}

/**
 * 저장소에 있는 데이터 중 요청 시간보다 나중에 쌒인 데이터를 보내줌
 * @param {*} method 
 * @param {*} pathname 
 * @param {*} params 
 * @param {*} cb 
 * params: {
 * uId: UUID,
 * currentTimestamp: LocalDateTime
 * }
 */
function getUrbaniData(method, pathname, params, cb) {
  var response = {
    key: params.key,
    errorcode: 0,
    errormessage: "success"
  };

  console.log("test param", params);
  
  if(params.uId = null || params.name === "") {
    response.errorcode = 1;
    response.errormessage = "Invalid Name";
    cb(response);
  } else {
    var connection = mysql.createConnection(conn);
    connection.connect();

    connection.query("select * from urbani_temperature where u_id = ? and date > ?"
      ,[params.uId, params.currentTimestamp]
      ,(error, results, fields) => {
        console.log("test results", results);
        if(error) {
          response.errorcode = 1;
          response.errormessage = error;
        } else {
          response.temp = results[0].temperature;
        }

        cb(response);
      }
    )
    connection.end();
  }
}