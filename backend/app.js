const express = require('express');
const { AccessToken } = require('livekit-server-sdk');
require('dotenv').config();

console.log('LIVEKIT_API_KEY:', process.env.LIVEKIT_API_KEY);
console.log('LIVEKIT_API_SECRET:', process.env.LIVEKIT_API_SECRET);

const app = express();
app.use(express.json());

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

app.get('/token', async (req, res) => {
  try {
    const roomName = 'talk';
    const identity = `user-${Math.random().toString(36).substring(7)}`;
    console.log('Creating token for:', { roomName, identity, apiKey, apiSecret: apiSecret ? 'SET' : 'MISSING' });
    
    const at = new AccessToken(apiKey, apiSecret, { identity });
    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
    const token = await at.toJwt();
    
    console.log('Generated token:', token ? 'SUCCESS' : 'FAILED');
    console.log('Token value:', token);
    console.log('Token type:', typeof token);
    res.send({ token });
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).send({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server on 3000')); 