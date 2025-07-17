const express = require('express');
const { AccessToken } = require('livekit-server-sdk');

const app = express();
app.use(express.json());

const apiKey = 'APIwiLgiMwSq6QU';
const apiSecret = 'esBUSp59e0SDpiYXoPMIHmornemZTjqVD9oCcS2RZPKB';

app.get('/token', (req, res) => {
  const roomName = 'talk';
  const identity = `user-${Math.random().toString(36).substring(7)}`;
  const at = new AccessToken(apiKey, apiSecret, { identity });
  at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
  const token = at.toJwt();
  res.send({ token });
});

app.listen(3000, () => console.log('Server on 3000')); 