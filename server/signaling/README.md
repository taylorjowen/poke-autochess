<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# `pac-signaling` — WebRTC signaling Worker

A Cloudflare Worker that brokers WebRTC connection setup for Pokémon Auto Chess lobbies. Peers exchange SDP offers/answers and ICE candidates through here; once the RTCPeerConnection is established, game traffic flows peer-to-peer over the data channel and this Worker is out of the loop.

**This Worker never sees or stores game state.** No scores, no board state, no draft shop rolls. Keep it that way.

## Protocol

JSON messages over WebSocket at `/lobby/:id`, where `:id` matches `[A-Za-z0-9_-]{1,64}`. A Durable Object instance per lobby id holds the peer list in memory.

**Client → server:**

```jsonc
{ "type": "hello",  "peerId": "<unique-per-lobby>" }
{ "type": "offer",  "to": "<peerId>", "payload": <RTCSessionDescription> }
{ "type": "answer", "to": "<peerId>", "payload": <RTCSessionDescription> }
{ "type": "ice",    "to": "<peerId>", "payload": <RTCIceCandidate> }
```

**Server → client:**

```jsonc
// On successful hello
{ "type": "peers", "peers": ["peerA", "peerB", ...] }

// Lobby membership changes
{ "type": "peer-joined", "peerId": "peerC" }
{ "type": "peer-left",   "peerId": "peerB" }

// Relayed signaling from another peer
{ "type": "offer",  "from": "peerA", "payload": ... }
{ "type": "answer", "from": "peerA", "payload": ... }
{ "type": "ice",    "from": "peerA", "payload": ... }

// Errors
{ "type": "error", "message": "..." }
```

Lobbies are soft-capped at 8 peers (`MAX_PEERS_PER_LOBBY`).

## Local dev

```bash
cd server/signaling
npm install
npm run dev    # wrangler dev, typically on http://127.0.0.1:8787
```

Then point the game at it via `VITE_SIGNALING_URL=ws://127.0.0.1:8787` in the repo-root `.env`.

## Deploy

```bash
npm run deploy      # wrangler deploy
npm run tail        # stream live logs
```

The signaling broker uses SQLite-backed Durable Objects, which are available on the Workers Free plan. CI deploys the Worker on merges to `main`; manual deployments require `wrangler login`.

## What's NOT in this Worker

- No authentication (anyone can join any lobby — that's fine for a pre-alpha fan project; revisit before public launch)
- No rate limiting (add Cloudflare Rate Limiting Rules when it's a real problem)
- No persistence (lobby state is in-memory per Durable Object instance, gone when empty)
- No STUN/TURN (PeerJS defaults to Google's public STUN; add TURN relays here via env bindings if NAT traversal becomes an issue in the wild)
