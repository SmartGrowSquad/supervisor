const http = require("http");
const url = require("url");
const qureystring = require("querystring");
const tcpClient = require("./Distributor/client");

var mapClients = {};
var mapUrls = {};
var mapResponse = {};
var mapRR = {};
var index = 0;

var server = http.createServer((req, res) => {
  var method = req.method;
  var uri = url.parse(req.url, true);
  var pathname = uri.pathname;

  //method: POST and PUT
  if (method == "POST" || method == "PUT") {
    var body = "";

    req.on("data", (data) => {
      body += data;
    });
    // http 통신이 종료됨 -> 모든 데이터 수신 완료
    req.on("end", () => {
      var params;
      //if data id JSON
      if (req.headers["content-type"] == "application/json") {
        params = JSON.parse(body);
      } else {
        params = qureystring.parse(body);
      }
      onRequest(res, method, pathname, params);
    });
  } else {
    onRequest(res, method, pathname, uri.query);
  }
}).listen(8000, () => {
  console.log("Gate server is listening on port", server.address());

  // Distributor에 접속하기 위해서 등록할 패킷을 생성합니다.
  var packet = {
    uri: "/distributes",
    method: "POST",
    key: 0,
    params: {
      part: 8000,
      name: "gate", 
      urls: []
    }
  }

  var isConnectedDistributor = false; 

  this.clientDistributor = new tcpClient(
    "127.0.0.1",
    9000,
    (options) => {
      isConnectedDistributor = true;
      this.clientDistributor.write(packet);
    },
    (options, data) => { onDistribute(data); }, // Distributor로부터 데이터를 받았을 때
    (options) => { isConnectedDistributor = false; },
    (options) => { isConnectedDistributor = false; }
  );

  setInterval(() => {
    if (isConnectedDistributor != true) {
      this.clientDistributor.connect();
    }
  }, 3000);
});
function onRequest(res, method, pathname, params) {
  // method와 pathname을 합쳐서 key를 생성합니다.
  // key는 클라이언트의 정보를 저장하는 mapClients 객체의 key로 사용됩니다.
  var key = method + pathname;
  var client = mapUrls[key];

  if(client == null) {
    res.writeHead(404);
    res.end();
    return;
  } else {
    params.key = index;

    var packet = {
      uri: pathname,
      method: method,
      params: params
    };
    //
    mapResponse[index] = res;
    index++;
    
    // 라운드 로빈
    if(mapRR[key] == null) {
      mapRR[key] = 0;
    }
    mapRR[key]++;
    client[mapRR[key] % client.length].write(packet);
  }
}

function onReadClient(packet) {
  console.log("onReadClient", packet);
  mapResponse[packet.key].writeHead(200, {
    "Content-Type": "application/json"
  });
  mapResponse[packet.key].end(JSON.stringify(packet));
  delete mapResponse[packet.key];
} 

function onDistribute(data) {
  for(var n in data.params) {
    var node = data.params[n];
    var key = node.host + ":" + node.port;
    console.log("node", node);
    if(mapClients[key] == null && node.name != "gate") {
      var client = new tcpClient(node.host, node.port, onCreateClient, onReadClient, onEndClient, onErrorClient);
      
      mapClients[key] = {
        client: client, 
        info: node,
      };

      for(var m in node.urls) {
        //"POST/orderlist"
        var key = node.urls[m];
        // 만약에 mapUrls[key]가 없다면 새로운 배열을 생성합니다.
        if(mapUrls[key] == null) {
          mapUrls[key] = [];
        }
        mapUrls[key].push(client);
      }
      
      client.connect();
    }
  }
}
function onCreateClient(options) {
  console.log("onCreateClient");
}
// 장애 등으로 접속이 끊어지면 해당 클라이언트 정보를 삭제합니다.
function onEndClient(options) {
  var key = options.host + ":" + options.port;  
  console.log("onEndClient", mapClients[key]);

  for(var n in mapClients[key].info.urls) {
    var node = mapClients[key].info.urls[n];
    delete mapUrls[node];
  }
  delete mapClients[key];
}
function onErrorClient(options) {
  console.log("onErrorClient");
}
