const net = require("net");
const port = 1337;
const host = "0.0.0.0";
const server = net.createServer();
server.listen(port, host, () => {
  console.log(`TCP server listening on ${host}:${port}`);
});
let sockets = [];

server.on("connection", (socket) => {
  var clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
  //console.log(`new client connected: ${clientAddress}`);
  sockets.push(socket);
  socket.on("data", (data) => {
    //console.log(`Client ${clientAddress}: ${data}`);
  });
  socket.on("close", (data) => {
    let index = sockets.findIndex((o) => {
      return (
        o.remoteAddress === socket.remoteAddress &&
        o.remotePort === socket.remotePort
      );
    });
    if (index !== -1) sockets.splice(index, 1);
    sockets.forEach((sock) => {
      sock.write(`${clientAddress} disconnected\n`);
    });
    //console.log(`connection closed: ${clientAddress}`);
  });
  socket.on("error", (err) => {
    console.log(`Error occurred in ${clientAddress}: ${err.message}`);
  });
});

// setInterval(() => {
//   write_to_all("HI");
// }, 1000);

module.exports.write_to_all = write_to_all;

function write_to_all(data) {
  sockets.forEach((sock) => {
    sock.write(data);
  });
}
