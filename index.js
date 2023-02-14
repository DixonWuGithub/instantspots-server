const express = require("express");
const WebSocket = require("ws");
const http = require('http')
const fs = require('node:fs');
const stringify = require('fast-safe-stringify')
const app = express();
const server = http.createServer(app);
const socketServer = new WebSocket.Server({ server });

const { v4: uuidv4 } = require('uuid');
const clientsList = [];
const commentArray = [];
let asks = [];


socketServer.on('connection', (socket) => {
  readTopics()
  console.log('Client connected');
  clientsList.push(socket);

  socket.on('message', (message) => {


    const data = JSON.parse(message);
    console.log(data)

    switch (data.type) {
      case 'joinRoom':
        leaveCurrentRoom(socket);
        joinRoom(socket, data.roomName);
        break;
      case 'sendMessage':
        const sender = data.sender;
        const broadcastMessage = `${sender.name} said: ${data.message}`;
        // commentArray.push(broadcastMessage)
        // console.log(commentArray)
        console.log('roomname is ', data.roomName)
        sendMessage(socket, data.roomName, data.sender, broadcastMessage);
        break;
      default:
        break;
    }
  });

  socket.on('close', () => {
    console.log('Client disconnected');
    const clientIndex = clientsList.findIndex(client => client.socket === socket);
    if (clientIndex !== -1) {
      clientsList.splice(clientIndex, 1);
    }

    const ask = asks.find(a => a.clients.includes(socket));
    if (ask) {
      const askClientIndex = ask.clients.findIndex(client => client === socket);
      ask.clients.splice(askClientIndex, 1);
    }

  });
});

function leaveCurrentRoom(socket) {
  const ask = asks.find(a => a.clients.includes(socket));
  if (ask) {
    const clientIndex = ask.clients.findIndex(client => client === socket);
    ask.clients.splice(clientIndex, 1);
  }

  socket.send(JSON.stringify({
    type: 'newMessage',
    message: []
  }));
}

function joinRoom(socket, roomName) {
  let ask = asks.find(a => a.name === roomName);
  if (!ask) {
    ask = { name: roomName, clients: [], messages: [] };
    asks.push(ask);
    
  }
  console.log(asks)
  console.log(ask)
  ask.clients.push(socket);
  socket.ask = ask;
  writeTopicsToFile(asks)

  ask.messages.forEach((message) => {
    socket.send(JSON.stringify({
      type: 'newMessage',
      message: [...ask.messages]
    }));
  });

  console.log(`joined ${ask.name} with ${ask.clients}`)
}

function sendMessage(socket, roomName, sender, message) {
  let ask = asks.find(a => a.name === roomName);
  console.log('ask is', ask)
  if (!ask) {
    console.log("ask not found")
    return;
  }

  // if (!ask.clients.find(client => client.id === sender.id)) {
  //   ask.clients.push({ id: sender.id, socket });
  // }

  console.log(`Received message: ${message}`);
  ask.messages.push(message);
  writeTopicsToFile(asks)
  ask.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'newMessage',
        message: [...ask.messages]
      }));
    }

    // const id = uuidv4()
    // const sender = socket._socket.remoteAddress + ':' + socket._socket.remotePort;
  });
}

function readTopics() {
  try {
    asks = JSON.parse(fs.readFileSync('./data/topics/topics.json'));
  } catch (e) {
    console.error('Error reading topics:', e);
  }
}

function writeTopicsToFile(asks) {
  fs.writeFileSync('./data/topics/topics.json', stringify(asks));
}

server.listen(8080, function () {
  console.log(`Listening on 8080`);
});