// 장터에 작물을 등록하기 위한 서비스입니다. 
const http = require('http');

exports.onRequest = function(res, method, pathname, params, cb) {
  switch (method) {
    // 장터에 등록
    case "POST":
      return register(method, pathname, params, (response) => {
        process.nextTick(cb, res, response);
      });
    default:
      return process.nextTick(cb, res, null);
  }
}

/**
 * 작물 등록
 * @param {*} method 
 * @param {*} pathname 
 * @param {*} params 
 * @param {*} cd 
 * 
 * 한 어반이에서 여러 작물이 등록될 수 있음. 어떤 어반이의 어떤 지그에 있는 작물인지 알아야함
 * 
 * 한 어반이에서 팔 작물은 시스템에 먼저 등록후 팔 수 있음.
 * 
 * 
 * params: {
 * acId: UUID,
 * jigs: [1, 3],
 * count: Number,
 * }
 * 
 * 이 정보를 토대로
 */
function register(method, pathname, params, cb) {
  var response = {
    key: params.key,
    errorcode: 0,
    errormessage: "success"
  };
  
  if(acId.name = null || acId.name === "") {
    response.errorcode = 1;
    response.errormessage = "Invalid Name";
    cd(response);

  } else {
    // URI로 POST 요청
    const options = {
      uri: "",
      method: "POST",
      body: params
    }

    http.request(options, (error, result) => {
      if(error) {
        response.errorcode = 1;
        response.errormessage = error;
        cd(response);
      } else {
        // 등록한 작물의 ID를 response에 추가
        response.id = result.id;
      }

      cb(response);
    });
  }
}
