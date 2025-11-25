import Phaser from 'phaser';

// Importação das Cenas
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import IntroductionScene from './scenes/IntroductionScene.js';
import GameScene from './scenes/GameScene.js';
import SecondRuneScene from './scenes/SecondRuneScene.js';
import PauseScene from './scenes/PauseScene.js';
import FinalBossCutScene from './scenes/FinalBossCutScene.js';
import FinalBossScene from './scenes/FinalBossScene.js';
import ThirdRuneScene from './scenes/ThirdRuneScene.js';

// =================================================================
// CONFIGURAÇÕES GLOBAIS
// =================================================================

const WIDTH = 1000;
const HEIGHT = 700;

const SHARED_CONFIG = {
  width: WIDTH,
  height: HEIGHT,
  debug: false
};

// =================================================================
// LISTA DE CENAS ATIVAS
// =================================================================
const SCENES = [
  PreloadScene,
  MenuScene,
  IntroductionScene,
  GameScene,
  SecondRuneScene,
  ThirdRuneScene,
  FinalBossCutScene,
  FinalBossScene,
  PauseScene,
]

// Cenas
const createScene = Scene => new Scene(SHARED_CONFIG);
const initScenes = () => SCENES.map(createScene);

// =================================================================
// INICIALIZAÇÃO DO PHASER GAME
// =================================================================
const config = {
  type: Phaser.AUTO,
  ...SHARED_CONFIG,
  backgroundColor: '#0080ff',
  parent: 'game-container',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      debug: SHARED_CONFIG['debug'],
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: initScenes()
};

new Phaser.Game(config);