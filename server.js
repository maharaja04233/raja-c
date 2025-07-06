const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const chatFile = path.join(__dirname, 'chat.json');

let chatHistory = [];
if (fs.existsSync(chatFile)) {
  try {
    chatHistory = JSON.parse(fs.readFileSync(chatFile, 'utf-8'));
  } catch (err) {
    console.error('Error reading chat.json:', err.message);
    chatHistory = [];
  }
}

app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send previous messages
  ws.send(JSON.stringify({ type: 'history', messages: chatHistory }));

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);

      if (msg.type === 'chat') {
        chatHistory.push(msg);
        fs.writeFileSync(chatFile, JSON.stringify(chatHistory, null, 2));

        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(msg));
          }
        });
      }
    } catch (err) {
      console.error('Error processing message:', err.message);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
