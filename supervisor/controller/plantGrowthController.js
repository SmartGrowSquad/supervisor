'use district';

const business = require('../service/plantGrowthService');
const cluster = require('cluster');

class plantGrowthController extends require('../server.js') {
  constructor() {
    super(
      "plant", 
      process.argv[2] ? Number(process.argv[2]) : 9030,
      ["POST/save", "POST/growth"]
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
  new plantGrowthController();
}


