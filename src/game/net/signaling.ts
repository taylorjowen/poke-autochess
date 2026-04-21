// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Thin client for the pac-signaling Cloudflare Worker (server/signaling/).
 * Phase-5 scope: connect to a lobby, announce a peerId, log membership
 * changes and relayed signaling messages. Actual WebRTC peer connections
 * and data channels come in a later phase.
 *
 * Wire protocol is documented in server/signaling/README.md.
 */

export type SignalingEvent =
  | { type: 'open' }
  | { type: 'close'; code: number; reason: string }
  | { type: 'error'; message: string }
  | { type: 'peers'; peers: string[] }
  | { type: 'peer-joined'; peerId: string }
  | { type: 'peer-left'; peerId: string }
  | { type: 'offer'; from: string; payload: unknown }
  | { type: 'answer'; from: string; payload: unknown }
  | { type: 'ice'; from: string; payload: unknown };

export type SignalingListener = (event: SignalingEvent) => void;

export interface SignalingClientOptions {
  /** Base URL of the pac-signaling Worker, e.g. `ws://127.0.0.1:8787`. */
  url: string;
  /** Lobby id (must match `[A-Za-z0-9_-]{1,64}`). */
  lobbyId: string;
  /** Our peer id — unique within the lobby. */
  peerId: string;
}

export class SignalingClient {
  private ws: WebSocket | null = null;
  private listeners = new Set<SignalingListener>();
  private readonly opts: SignalingClientOptions;

  constructor(opts: SignalingClientOptions) {
    this.opts = opts;
  }

  on(listener: SignalingListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  connect(): void {
    if (this.ws) return;
    const url = `${this.opts.url.replace(/\/+$/, '')}/lobby/${encodeURIComponent(this.opts.lobbyId)}`;
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ type: 'hello', peerId: this.opts.peerId }));
      this.emit({ type: 'open' });
    });

    ws.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(String(event.data)) as SignalingEvent;
        this.emit(msg);
      } catch {
        this.emit({ type: 'error', message: 'malformed message' });
      }
    });

    ws.addEventListener('close', (event) => {
      this.ws = null;
      this.emit({ type: 'close', code: event.code, reason: event.reason });
    });

    ws.addEventListener('error', () => {
      this.emit({ type: 'error', message: 'websocket error' });
    });
  }

  /** Send a relayed signaling message to a specific peer. */
  send(to: string, type: 'offer' | 'answer' | 'ice', payload: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('signaling socket not open');
    }
    this.ws.send(JSON.stringify({ type, to, payload }));
  }

  close(): void {
    this.ws?.close();
    this.ws = null;
  }

  private emit(event: SignalingEvent): void {
    for (const listener of this.listeners) listener(event);
  }
}

/** Short random id. Enough entropy for a pre-alpha lobby; not security-grade. */
export function randomPeerId(prefix = 'peer'): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return `${prefix}-${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}
