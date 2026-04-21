// SPDX-License-Identifier: AGPL-3.0-only
import Phaser from 'phaser';
import { SignalingClient, randomPeerId } from '@game/net/signaling';

/**
 * Initial scene rendered at startup. Currently a placeholder landing page
 * with Host / Join controls that exercise the signaling layer. Lobby and
 * Draft scenes are TODO; Host/Join don't transition anywhere yet — they
 * connect to pac-signaling and log peer events to the console + on-screen
 * status line.
 */
export class BootScene extends Phaser.Scene {
  private title!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private hostButton!: Phaser.GameObjects.Text;
  private joinButton!: Phaser.GameObjects.Text;
  private client: SignalingClient | null = null;

  constructor() {
    super({ key: 'Boot' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0b0d12');

    this.title = this.add
      .text(0, 0, 'Pokémon Auto Chess', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '48px',
        color: '#e6e8ee',
      })
      .setOrigin(0.5);

    this.hostButton = this.makeButton('Host lobby', () => this.host());
    this.joinButton = this.makeButton('Join lobby', () => this.join());

    this.statusText = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#8a94a6',
        align: 'center',
      })
      .setOrigin(0.5);

    this.layout();
    this.scale.on('resize', this.layout, this);
  }

  private makeButton(label: string, onClick: () => void): Phaser.GameObjects.Text {
    const button = this.add
      .text(0, 0, label, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#e6e8ee',
        backgroundColor: '#1c2230',
        padding: { left: 18, right: 18, top: 10, bottom: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    button.on('pointerover', () => button.setBackgroundColor('#2a3342'));
    button.on('pointerout', () => button.setBackgroundColor('#1c2230'));
    button.on('pointerdown', onClick);
    return button;
  }

  private layout(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.title.setPosition(cx, cy - 120);
    this.hostButton.setPosition(cx - 90, cy);
    this.joinButton.setPosition(cx + 90, cy);
    this.statusText.setPosition(cx, cy + 120);
  }

  private host(): void {
    const lobbyId = promptFallback('New lobby id:', randomLobbyId()) ?? randomLobbyId();
    this.startSession(lobbyId, 'host');
  }

  private join(): void {
    const lobbyId = promptFallback('Lobby id to join:', '');
    if (!lobbyId) return;
    this.startSession(lobbyId, 'guest');
  }

  private startSession(lobbyId: string, role: 'host' | 'guest'): void {
    this.client?.close();

    const url = import.meta.env.VITE_SIGNALING_URL;
    if (!url) {
      this.setStatus('VITE_SIGNALING_URL not set — create .env with it to connect');
      console.warn('[net] VITE_SIGNALING_URL missing');
      return;
    }

    const peerId = randomPeerId(role);
    const client = new SignalingClient({ url, lobbyId, peerId });
    this.client = client;
    this.setStatus(`${role} ${peerId} → lobby "${lobbyId}"…`);

    client.on((event) => {
      console.log('[signaling]', event);
      switch (event.type) {
        case 'open':
          this.setStatus(`${role} ${peerId} connected to "${lobbyId}"`);
          break;
        case 'peers':
          this.setStatus(`${role} ${peerId} in "${lobbyId}" — peers: [${event.peers.join(', ')}]`);
          break;
        case 'peer-joined':
          this.setStatus(`peer joined: ${event.peerId}`);
          break;
        case 'peer-left':
          this.setStatus(`peer left: ${event.peerId}`);
          break;
        case 'close':
          this.setStatus(`disconnected (${event.code})`);
          break;
        case 'error':
          this.setStatus(`error: ${event.message}`);
          break;
      }
    });

    client.connect();
    // TODO(lobby): transition to LobbyScene once it exists.
  }

  private setStatus(text: string): void {
    this.statusText.setText(text);
  }
}

function randomLobbyId(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function promptFallback(message: string, defaultValue: string): string | null {
  if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
    return window.prompt(message, defaultValue);
  }
  return defaultValue || null;
}
