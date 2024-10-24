// 어반이의 환경 데이터를 수집하는 모듈입니다.
const mariadb = require('mysql');

const con = mariadb.createConnection({
  host: process.env.DB_HOST, 
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: 3306
});

exports.onRequest = function(res, method, pathname, params, cb) {
  switch(method) {
    // 환경 정보 수집
    case "POST":
      if(pathname === "/saveclimate") {
        return register(method, pathname, params, (response) => {
          process.nextTick(cb, res, response);
        });
      } else if(pathname === "/getclimate") {
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
function register (method, pathname, params, cb) {
  console.log("Climate save [start]", params);
  var response = {
    key: params.key,
    errorcode: 0,
    errormessage: "success"
  };

  console.log("Climate save [validate params]", params);
  if (params.uId === null || params.uId === "") {
    response.errorcode = 1;
    response.errormessage = "Invalid id";
    cb(response);
    return;  // 에러가 발생하면 더 이상 실행하지 않음
  }

  console.log("Climate save [formatting date]", params);
  const formattedDate = new Date(params.date).toISOString().slice(0, 19).replace('T', ' ');
  
  console.log("Climate save [connect db]", params);
  var connection = con;

  // 첫 번째 쿼리: INSERT 쿼리 실행
  connection.query(
    "INSERT INTO env_data(u_id, temperature, humidity , date) VALUES(?, ?, ?, ?)",
    [params.uId, params.temperature, params.humidity, formattedDate],
    (error, results, fields) => {
      if (error) {
        response.errorcode = 1;
        console.log(error);
        response.errormessage = error.sqlMessage || "Database Error";
        cb(response);
        return;
      }
      cb(response);
  });
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
  console.log("Climate get [start]", params);
  var response = {
    key: params.key,
    errorcode: 0,
    errormessage: "success"
  };

  console.log("Climate get [validate params]", params);
  if(params.uId = null || params.name === "") {
    response.errorcode = 1;
    response.errormessage = "Invalid Name";
    cb(response);
  }
  console.log("Climate get [connect db]", params);
  var connection = con;

  try {
    connection.query(
      "select e.* from env_data e where date_format(e.date, '%Y-%m-%d') = ? and e.u_id = ?"
      ,[params.uId, params.current]
      ,(error, results, fields) => {
        if(error) {
          response.errorcode = 1;
          response.errormessage = error;
          
          cb(response);
          return;
        }
        console.log("Climate get [get data]", results);
        response.results = results;
        cb(response);
      }
    )
  } catch (error) {
    response.errorcode = 1;
    response.errormessage = error;
    cb(response);
  }

  
}