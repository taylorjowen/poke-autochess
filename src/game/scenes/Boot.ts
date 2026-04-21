// SPDX-License-Identifier: AGPL-3.0-only
import Phaser from 'phaser';

/**
 * Initial scene rendered at startup. Phase 5 wires lobby host/join controls
 * into this scene; later phases will hand off to Lobby/Draft/Battle scenes.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#0b0d12');

    this.add
      .text(width / 2, height / 2, 'Pokémon Auto Chess', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '48px',
        color: '#e6e8ee',
      })
      .setOrigin(0.5);

    this.scale.on('resize', this.handleResize, this);
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const text = this.children.list.find(
      (child): child is Phaser.GameObjects.Text => child instanceof Phaser.GameObjects.Text,
    );
    text?.setPosition(gameSize.width / 2, gameSize.height / 2);
  }
}
