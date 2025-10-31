//------------------------------------------------------------------------
// Main.js : Arquivo principal do Jogo Dark Fantasy

import Phaser from 'phaser';

//importa as cenas
import PreLoadScene from './scenes/PreLoadScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes.GameScene.js'; // Nível 1 - Floresta
import Level2Scene from './scenes/Level2Scene.js'; // Nível 2 - Cripta
import WinScene from './scenes/WinScene.js';   // Tela de Vitória

//Configurações Globais
const WIDTH = 1000;
const HEIGHT = 700;

//Configurações compartilhadas
const SHARED_CONFIG = {
  width: WIDTH,
  height: HEIGHT,
  debug: false // Mude para 'true' para ver as caixas de colisão
};

//Lista das cenas
const SCENES = [
  PreLoadScene,
  MenuScene,
  GameScene,   // Nível 1
  Level2Scene, // Nível 2
  WinScene     // Vitória
]

const createScene = Scene => new Scene(SHARED_CONFIG);
const initScenes = () => SCENES.map(createScene);

//------------------------------------------------------------------------
//Configuração geral do Phaser.Game

const config = {
  type: Phaser.AUTO,
  ...SHARED_CONFIG,
  backgroundColor: '#000000',
  parent: 'game-container',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: SHARED_CONFIG['debug'],
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.Center_Both
  },
  scene: initScenes()
};

//------------------------------------------------------------------------
//Inicializa a instância principal do jogo
new Phaser.Game(config);