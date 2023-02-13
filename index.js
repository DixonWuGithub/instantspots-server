const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });
const { v4: uuidv4 } = require('uuid');

const clients = [];
const commentArray = [];

server.on('connection', (socket) => {
  console.log('Client connected');
  clients.push(socket);

  socket.on('message', (message) => {

    const data = JSON.parse(message);
    const sender = data.sender;
    const broadcastMessage = `${sender.name} said: ${data.message}`;
    
    commentArray.push(broadcastMessage)
    console.log(commentArray)

    if (!clients.find(client => client.id === sender.id)) {
        clients.push({ id: sender.id, socket });
      }

    // const id = uuidv4()
    // const sender = socket._socket.remoteAddress + ':' + socket._socket.remotePort;
    console.log(`Received message: ${message}`);
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(commentArray));
        }
    });
    
  });

  socket.on('close', () => {
    console.log('Client disconnected');
    const clientIndex = clients.findIndex(client => client.socket === socket);
    if (clientIndex !== -1) {
      clients.splice(clientIndex, 1);
    }
  });
});