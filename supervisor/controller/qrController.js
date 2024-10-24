'use district';
const business = require('../service/qrService');
const cluster = require('cluster');

class qrController extends require('../server.js') {
  constructor() {
    super(
      "qr",
      process.argv[2] ? Number(process.argv[2]) : 9050,
      ["POST/validate"]
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
  new qrController();
}