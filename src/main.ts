// SPDX-License-Identifier: AGPL-3.0-only
import Phaser from 'phaser';
import { BootScene } from '@game/scenes/Boot';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#0b0d12',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
  },
  scene: [BootScene],
};

new Phaser.Game(config);
