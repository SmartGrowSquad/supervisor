// 식물 생장 데이터 관련 수집 서비스입니다.
const mariadb = require('mysql');
const { loadModelsAndData, predict } = require('../ai');

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
      if(pathname === "/save") {
        return register(method, pathname, params, (response) => {
          process.nextTick(cb, res, response);
        });
      } else if(pathname === "/growth") {
        return getGrowth(method, pathname, params, (response) => {
          process.nextTick(cb, res, response);
        });
      }
    default:
      return process.nextTick(cb, res, null);
  }
}
function getExpectedDate(predictedDays) {
  const currentDate = new Date(); // 현재 날짜와 시간
  const millisecondsPerDay = 24 * 60 * 60 * 1000; // 하루의 밀리초 수
  const additionalMilliseconds = predictedDays * millisecondsPerDay; // 예측 일수를 밀리초로 변환
  const expectedDate = new Date(currentDate.getTime() + additionalMilliseconds); // 예상 날짜 계산
  return expectedDate;
}
async function register(method, pathname, params, cb) {
  console.log("Growth save [start]", params);
  var response = {
    key: params.key,
    errorcode: 0,
    errormessage: "success"
  };

  console.log("Growth save [validate params]", params);
  if (params.uId === null || params.uId === "") {
    response.errorcode = 1;
    response.errormessage = "Invalid id";
    cb(response);
    return;  // 에러가 발생하면 더 이상 실행하지 않음
  }
  console.log("Growth save [formatting date]", params);
  const formattedDate = new Date(params.date).toISOString().slice(0, 19).replace('T', ' ');

  loadModelsAndData().then(() => {
    console.log('모델 및 정규화 데이터 로드 완료');
    predict(params.temperature, params.humidity, params.plantArea).then((result) => {
      console.log('예측 결과:', result);
      if(result.saleProbability < 0.7) {
        response.errorcode = 1;
        response.errormessage = "미성장 작물입니다.";
        cb(response);
        return;
      }
      console.log("Growth save [connect db]", params);
      var connection = con;
      connection.query(
        "INSERT INTO growth_data(u_id, jignum, growth , predictDate, date) VALUES(?, ?, ?, ?, ?)",
        [
          params.uId, 
          params.jignum, 
          result.saleProbability * 100, 
          getExpectedDate(result.predictedDays),
          formattedDate
        ],
        (error, results, fields) => {
          if (error) {
            response.errorcode = 1;
            response.errormessage = error.sqlMessage || "Database Error";
            cb(response);
            return;
          }    
          cb(response);
      });
    }).catch((error) => {
      console.error('예측 중 오류 발생:', error);
      if (error) {
        response.errorcode = 1;
        response.errormessage = error.sqlMessage || "Predict Error";
        cb(response);
        return;
      }
    });
  }).catch((error) => { 
    console.error('모델 및 정규화 데이터 로드 중 오류 발생:', error);
    if (error) {
      response.errorcode = 1;
      response.errormessage = error.sqlMessage || "Data Load Error";
      cb(response);
      return;
    }
  })
}

function getGrowth(method, pathname, params, cb) {
  console.log("Growth get [start]", params);
  var response = {
    key: params.key,
    errorcode: 0,
    errormessage: "success"
  };

  console.log("Growth get [validate params]", params);
  if (params.uId === null || params.uId === "") {
    response.errorcode = 1;
    response.errormessage = "Invalid id";
    cb(response);
    return;  // 에러가 발생하면 더 이상 실행하지 않음
  }

  console.log("Growth get [formatting date]", params);
  
  console.log("Growth get [connect db]", params);
  var connection = con;

  connection.query(
    "select * from growth_data where u_id = ?",
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