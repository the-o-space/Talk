# Talk

Minimal self-hosted web conferencing app using LiveKit.

## Overview

Persistent room at talk.the-o.space with auto-join, audio/video on, grid view of cameras.

## Setup

(TBD) 

## Installation

- LiveKit server installed and running via systemd.
- Backend Node.js for token generation.
- Frontend static HTML/JS served by nginx.

## DNS Setup

1. Set an A record for talk.the-o.space pointing to server IP: 46.62.155.122
2. Once propagated, run: `certbot --nginx -d talk.the-o.space` to set up SSL.

## Firewall

Open ports:
- 80/tcp, 443/tcp for HTTP/HTTPS
- 50000-60000/udp for WebRTC media

If using ufw: `ufw allow 80/tcp; ufw allow 443/tcp; ufw allow 50000:60000/udp; ufw reload`

## Usage

Open https://talk.the-o.space to join the persistent room 'talk' with auto audio/video. 