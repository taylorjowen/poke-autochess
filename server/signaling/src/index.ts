// SPDX-License-Identifier: AGPL-3.0-only

/**
 * pac-signaling — a Cloudflare Worker that brokers WebRTC signaling for
 * Pokémon Auto Chess lobbies. Connection setup only: SDP offers/answers and
 * ICE candidates are relayed between peers in the same lobby. Game state
 * never touches this Worker.
 *
 * Protocol (JSON over WebSocket, `/lobby/:id`):
 *   client → server:  { type: "hello", peerId }
 *   client → server:  { type: "offer"  | "answer" | "ice", to, payload }
 *   server → client:  { type: "peers", peers: string[] }           // on join
 *   server → client:  { type: "peer-joined" | "peer-left", peerId }
 *   server → client:  { type: "offer" | "answer" | "ice", from, payload }
 *
 * Lobby state is held in a Durable Object so all peers for a given lobby id
 * land on the same in-memory coordinator regardless of which edge POP they
 * connected to.
 */

export interface Env {
  LOBBY: DurableObjectNamespace;
}

const MAX_PEERS_PER_LOBBY = 8;
const LOBBY_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/lobby\/([^/]+)\/?$/);
    if (!match) {
      return new Response('pac-signaling\n', { status: 200, headers: corsHeaders() });
    }
    const lobbyId = match[1]!;
    if (!LOBBY_ID_RE.test(lobbyId)) {
      return new Response('invalid lobby id', { status: 400, headers: corsHeaders() });
    }
    const id = env.LOBBY.idFromName(lobbyId);
    const stub = env.LOBBY.get(id);
    return stub.fetch(request);
  },
};

function corsHeaders(): HeadersInit {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-allow-headers': 'content-type',
  };
}

type Relay =
  | { type: 'offer'; to: string; payload: unknown }
  | { type: 'answer'; to: string; payload: unknown }
  | { type: 'ice'; to: string; payload: unknown };

type Inbound = { type: 'hello'; peerId: string } | Relay;

interface Session {
  peerId: string;
  ws: WebSocket;
}

export class LobbyRoom {
  private sessions = new Map<string, Session>();

  constructor(
    _state: DurableObjectState,
    _env: Env,
  ) {}

  async fetch(request: Request): Promise<Response> {
    const upgrade = request.headers.get('upgrade');
    if (upgrade !== 'websocket') {
      return new Response('expected websocket upgrade', { status: 426 });
    }
    if (this.sessions.size >= MAX_PEERS_PER_LOBBY) {
      return new Response('lobby full', { status: 409 });
    }
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    server.accept();
    this.handle(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  private handle(ws: WebSocket): void {
    let peerId: string | null = null;

    ws.addEventListener('message', (event) => {
      let msg: Inbound;
      try {
        msg = JSON.parse(typeof event.data === 'string' ? event.data : '') as Inbound;
      } catch {
        this.sendError(ws, 'invalid json');
        return;
      }

      if (msg.type === 'hello') {
        if (peerId !== null) {
          this.sendError(ws, 'already announced');
          return;
        }
        if (!msg.peerId || typeof msg.peerId !== 'string' || msg.peerId.length > 64) {
          this.sendError(ws, 'invalid peerId');
          return;
        }
        if (this.sessions.has(msg.peerId)) {
          this.sendError(ws, 'peerId in use');
          return;
        }
        peerId = msg.peerId;
        this.sessions.set(peerId, { peerId, ws });
        ws.send(
          JSON.stringify({
            type: 'peers',
            peers: [...this.sessions.keys()].filter((id) => id !== peerId),
          }),
        );
        this.broadcast({ type: 'peer-joined', peerId }, peerId);
        return;
      }

      if (peerId === null) {
        this.sendError(ws, 'hello required first');
        return;
      }

      if (msg.type === 'offer' || msg.type === 'answer' || msg.type === 'ice') {
        const target = this.sessions.get(msg.to);
        if (!target) {
          this.sendError(ws, `no such peer: ${msg.to}`);
          return;
        }
        target.ws.send(
          JSON.stringify({
            type: msg.type,
            from: peerId,
            payload: msg.payload,
          }),
        );
        return;
      }

      this.sendError(ws, 'unknown message type');
    });

    const cleanup = (): void => {
      if (peerId === null) return;
      this.sessions.delete(peerId);
      this.broadcast({ type: 'peer-left', peerId });
      peerId = null;
    };

    ws.addEventListener('close', cleanup);
    ws.addEventListener('error', cleanup);
  }

  private broadcast(msg: object, exclude?: string): void {
    const payload = JSON.stringify(msg);
    for (const [id, session] of this.sessions) {
      if (id === exclude) continue;
      session.ws.send(payload);
    }
  }

  private sendError(ws: WebSocket, message: string): void {
    try {
      ws.send(JSON.stringify({ type: 'error', message }));
    } catch {
      // Socket may already be closed — nothing to recover.
    }
  }
}
