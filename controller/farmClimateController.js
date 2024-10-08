'use district';

const business = require('../service/farmClimateService');
const cluster = require('cluster');

class farmClimateController extends require('../server.js') {
  constructor() {
    super(
      "farm_climate", 
      process.argv[2] ? Number(process.argv[2]) : 9020,
      ["POST/register", "POST/getUrbaniData"]
    );

    this.connectToDistributor(process.env.BACK_CONTAINER_NAME, 9000, (data) => {
      console.log("Distributor Notification", data);
    });
  }
  onRead(socket, data) {
    console.log("onRead", socket.remoteAddress, socket.remotePort, data);
    business.onRequest(socket, data.method, data.uri, data.params, (s, packet) => {
      socket.write(JSON.stringify(packet) + '¶');
    });
  }
}

if (cluster.isMaster) {

  // 자식 프로세스 실행
  cluster.fork();
  
  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    cluster.fork();
  })
} else {
  new farmClimateController();
}


