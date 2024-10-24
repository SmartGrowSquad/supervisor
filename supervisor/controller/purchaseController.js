'use district';
const business = require('../service/purchaseService');
const cluster = require('cluster');

class puchaseController extends require('../server.js') {
  constructor() {
    super(
      "purchase",
      process.argv[2] ? Number(process.argv[2]) : 9040,
      ["POST/puchase"]
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

  cluster.fork();
  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    cluster.fork();
  })
} else {
  new puchaseController();
}