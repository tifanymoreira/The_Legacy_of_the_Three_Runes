import Phaser from 'phaser';

// Classe que define a cena de carregamento
export default class PreloadScene extends Phaser.Scene {

  // Construtor
  constructor() {
    super({ key: 'PreloadScene' });
  }

  // Carrega os assets utilizados pelo jogo
  preload() {

    // Exibe a barra de progresso
    this.displayProgressBar();

    // Carregando os backgrounds
    this.load.image(
      'background',
      'assets/background.gif'
    );
    this.load.image(
      'introduction_background',
      'assets/introduction_background.png'
    );
    this.load.image(
      'menu_background',
      'assets/menu_background.png'
    );
    this.load.image(
      'second_rune_background',
      'assets/second_rune_background.png'
    );

    // Carregando o asset de vida (coração)
    this.load.image('life', 'assets/life.png');

    // Carregando o ícone da UI
    this.load.image('storm_icon', 'assets/images/icons/storm_icon.png');
    
    // Carregando os assets de áudio
    this.load.audio('ambience_introduction', 'assets/sound_effect/ambience_introduction.mp3');
    this.load.audio('dialog_introduction', 'assets/sound_effect/dialog_introduction.mp3');
    this.load.audio('game_scene', 'assets/sound_effect/game_scene.mp3');
    this.load.audio('menu_sound', 'assets/sound_effect/menu_sound.mp3');
    this.load.audio('button_press', 'assets/sound_effect/button_press.mp3');
    this.load.audio('button_select', 'assets/sound_effect/button_select.mp3');
    this.load.audio('walking', 'assets/sound_effect/walking.mp3');
    this.load.audio('running', 'assets/sound_effect/running.mp3');
    this.load.audio('jumping', 'assets/sound_effect/jumping.mp3');
    this.load.audio('landing', 'assets/sound_effect/landing.mp3');
    this.load.audio('sword_1', 'assets/sound_effect/sword_1.mp3');
    this.load.audio('sword_2', 'assets/sound_effect/sword_2.mp3');
    this.load.audio('hurt', 'assets/sound_effect/hurt.mp3');
    this.load.audio('dead', 'assets/sound_effect/dead.mp3');
    this.load.audio('soul_collect', 'assets/sound_effect/soul_collect.mp3');

    // Carregando o Foguinho Coletável
    this.load.spritesheet(
      'fire',
      'assets/images/spritesheets/firesheet.png',
      {
        frameWidth: 200,
        frameHeight: 200
      }
    );

    // Assets do Player (Lightning Mage)
    this.load.spritesheet(
      'player_idle',
      'assets/images/spritesheets/Lightning Mage/Idle.png',
      {
        frameWidth: 112,
        frameHeight: 128
      }
    );
    this.load.spritesheet(
      'player_walk',
      'assets/images/spritesheets/Lightning Mage/Walk.png',
      {
        frameWidth: 112,
        frameHeight: 128
      }
    );
    this.load.spritesheet(
      'player_run',
      'assets/images/spritesheets/Lightning Mage/Run.png',
      {
        frameWidth: 112,
        frameHeight: 128
      }
    );
    this.load.spritesheet(
      'player_jump',
      'assets/images/spritesheets/Lightning Mage/Jump.png',
      {
        frameWidth: 110,
        frameHeight: 128
      }
    );
    this.load.spritesheet(
      'player_attack1',
      'assets/images/spritesheets/Lightning Mage/Attack_1.png',
      {
        frameWidth: 128,
        frameHeight: 128
      }
    );
    this.load.spritesheet(
      'player_attack2',
      'assets/images/spritesheets/Lightning Mage/Attack_2.png',
      {
        frameWidth: 235,
        frameHeight: 128
      }
    );
    this.load.spritesheet(
      'player_hurt',
      'assets/images/spritesheets/Lightning Mage/Hurt.png',
      {
        frameWidth: 110,
        frameHeight: 128
      }
    );
    this.load.spritesheet(
      'player_dead',
      'assets/images/spritesheets/Lightning Mage/Dead.png',
      {
        frameWidth: 128,
        frameHeight: 128
      }
    );
  }

  // Inicializa os elementos da cena
  create() {
    
    // Registra todas as animações
    this.registerPlayerAnimations();
    this.registerFireAnimation(); 

    this.scene.start('MenuScene');
  }

  // Funções auxiliares (Barra de Progresso)
  displayProgressBar() {
    const { width, height } = this.cameras.main;
    const progressBarBg = this.add.graphics();
    progressBarBg.fillStyle(0x222222, 0.8);
    progressBarBg.fillRect(width / 4 - 2, height / 2 - 12, width / 2 + 4, 24);
    const progressBar = this.add.graphics();
    const loadingText = this.add.text(
      width / 2,
      height / 2 - 30,
      'Loading...',
      {
        fontSize: '20px',
        fill: '#fff'
      }
    ).setOrigin(0.5);
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 4, height / 2 - 10, (width / 2) * value, 20);
    });
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBarBg.destroy();
      loadingText.destroy();
    });
  }

  // Registra todas as animações do "Lightning Mage"
  registerPlayerAnimations() {
    this.anims.create({
      key: 'anim_idle',
      frames: this.anims.generateFrameNumbers('player_idle', { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'anim_walk',
      frames: this.anims.generateFrameNumbers('player_walk', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'anim_run',
      frames: this.anims.generateFrameNumbers('player_run', { start: 0, end: 7 }),
      frameRate: 12,
      repeat: -1
    });
    this.anims.create({
      key: 'anim_jump',
      frames: this.anims.generateFrameNumbers('player_jump', { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'anim_attack1',
      frames: this.anims.generateFrameNumbers('player_attack1', { start: 0, end: 9 }),
      frameRate: 17,
      repeat: 0 
    });
    this.anims.create({
      key: 'anim_attack2',
      frames: this.anims.generateFrameNumbers('player_attack2', { start: 0, end: 4 }),
      frameRate: 8, 
      repeat: 0
    });
    this.anims.create({
      key: 'anim_hurt',
      frames: this.anims.generateFrameNumbers('player_hurt', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: 0
    });
    this.anims.create({
      key: 'anim_dead',
      frames: this.anims.generateFrameNumbers('player_dead', { start: 0, end: 4 }),
      frameRate: 10,
      repeat: 0
    });
  }

  // Registra a animação do Foguinho
  registerFireAnimation() {
    this.anims.create({
      key: 'fire_anim',
      frames: this.anims.generateFrameNumbers('fire', { start: 0, end: 3 }),
      frameRate: 10, 
      repeat: -1
    });
  }
}