import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {

  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    this.displayProgressBar();

    // --- ASSETS GERAIS ---
    this.load.image('background', 'assets/background.gif');
    this.load.image('introduction_background', 'assets/introduction_background.png');
    this.load.image('menu_background', 'assets/menu_background.png');
    this.load.image('second_rune_background', 'assets/second_rune_background.png');
    this.load.image('third_rune_background', 'assets/third_rune_background.jpeg');
    this.load.image('final_boss_background', 'assets/final_boss_background.png');
    this.load.image('boss_cutscene_background', 'assets/boss_cutscene_background.png');
    this.load.image('life', 'assets/life.png');
    this.load.image('storm_icon', 'assets/images/icons/storm_icon.png');
    this.load.image('wizard_icon', 'assets/images/icons/wizard_icon.png');
    
    // --- ÁUDIO ---
    this.load.audio('ambience_introduction', 'assets/sound_effect/ambience_introduction.mp3');
    this.load.audio('dialog_introduction', 'assets/sound_effect/dialog_introduction.mp3');
    this.load.audio('final_boss_ambience', 'assets/sound_effect/final_boss_ambience.mp3');
    this.load.audio('final_battle_ambience', 'assets/sound_effect/final_battle_ambience.mp3');
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
    this.load.audio('wizard_fire_spell', 'assets/sound_effect/wizard_fire_spell.mp3');
    this.load.audio('wizard_charge', 'assets/sound_effect/wizard_charge.mp3');
    this.load.audio('hurt', 'assets/sound_effect/hurt.mp3');
    this.load.audio('hurt_2', 'assets/sound_effect/hurt_2.mp3');
    this.load.audio('dead', 'assets/sound_effect/dead.mp3');
    this.load.audio('soul_collect', 'assets/sound_effect/soul_collect.mp3');

    // Foguinho (almas de fogo)
    this.load.spritesheet('fire', 'assets/images/spritesheets/firesheet.png', { frameWidth: 200, frameHeight: 200 });

    // --- ENTITIES (PLAYER, BOSS E NPC INIMIGO) ---
    this.loadPlayerAssets();
    this.loadKnightAssets();
    this.loadWizardAssets();
  }

  create() {
    this.registerPlayerAnimations(); //animação do player (storm/tempestade)
    this.registerFireAnimation(); //animação dos fogos (almas)
    this.registerKnightAnimations(); //animação dos cavaleiros 
    this.registerWizardAnimations(); //animação do boss final (wizard)

    
    this.scene.start('MenuScene');
  }

  // ======================================================
  //                 CARREGAMENTO DE ASSETS
  // ======================================================

  loadPlayerAssets() {
    const path = 'assets/images/spritesheets/Lightning Mage';
    this.load.spritesheet('player_idle', `${path}/Idle.png`, { frameWidth: 112, frameHeight: 128 });
    this.load.spritesheet('player_walk', `${path}/Walk.png`, { frameWidth: 112, frameHeight: 128 });
    this.load.spritesheet('player_run', `${path}/Run.png`, { frameWidth: 112, frameHeight: 128 });
    this.load.spritesheet('player_jump', `${path}/Jump.png`, { frameWidth: 110, frameHeight: 128 });
    this.load.spritesheet('player_attack1', `${path}/Attack_1.png`, { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('player_attack2', `${path}/Attack_2.png`, { frameWidth: 235, frameHeight: 128 });
    this.load.spritesheet('player_hurt', `${path}/Hurt.png`, { frameWidth: 110, frameHeight: 128 });
    this.load.spritesheet('player_dead', `${path}/Dead.png`, { frameWidth: 128, frameHeight: 128 });
  }

  loadKnightAssets() {
    const path = 'assets/images/spritesheets/Knight_1';
    this.load.spritesheet('knight_idle', `${path}/Idle.png`, { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('knight_walk', `${path}/Walk.png`, { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('knight_hurt', `${path}/Hurt.png`, { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('knight_attack', `${path}/Attack.png`, { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('knight_dead', `${path}/Dead.png`, { frameWidth: 128, frameHeight: 128 });
  }

  loadWizardAssets() {
    const path = 'assets/images/spritesheets/Fire Wizard';
    this.load.spritesheet('wizard_idle', `${path}/Idle.png`, { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('wizard_walk', `${path}/Walk.png`, { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('wizard_jump', `${path}/Jump.png`, { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('wizard_hurt', `${path}/Hurt.png`, { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('wizard_dead', `${path}/Dead.png`, { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('wizard_charge', `${path}/Charge.png`, { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('wizard_fireball', `${path}/Fireball.png`, { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('wizard_flame', `${path}/Flame_jet.png`, { frameWidth: 124, frameHeight: 128 });
  }

  // ======================================================
  //                 REGISTRO DE ANIMAÇÕES
  // ======================================================

  registerPlayerAnimations() {
    this.anims.create({ key: 'anim_idle', frames: this.anims.generateFrameNumbers('player_idle', { start: 0, end: 7 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'anim_walk', frames: this.anims.generateFrameNumbers('player_walk', { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'anim_run', frames: this.anims.generateFrameNumbers('player_run', { start: 0, end: 7 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'anim_jump', frames: this.anims.generateFrameNumbers('player_jump', { start: 0, end: 7 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'anim_attack1', frames: this.anims.generateFrameNumbers('player_attack1', { start: 0, end: 9 }), frameRate: 17, repeat: 0 });
    this.anims.create({ key: 'anim_attack2', frames: this.anims.generateFrameNumbers('player_attack2', { start: 0, end: 4 }), frameRate: 8, repeat: 0 });
    this.anims.create({ key: 'anim_hurt', frames: this.anims.generateFrameNumbers('player_hurt', { start: 0, end: 2 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'anim_dead', frames: this.anims.generateFrameNumbers('player_dead', { start: 0, end: 4 }), frameRate: 10, repeat: 0 });
  }

  registerKnightAnimations() {
    this.anims.create({ key: 'knight_idle', frames: this.anims.generateFrameNumbers('knight_idle', { start: 0, end: 3 }), frameRate: 5, repeat: -1 });
    this.anims.create({ key: 'knight_walk', frames: this.anims.generateFrameNumbers('knight_walk', { start: 0, end: 7 }), frameRate: 5, repeat: 1 });
    this.anims.create({ key: 'knight_hurt', frames: this.anims.generateFrameNumbers('knight_hurt', { start: 0, end: 1 }), frameRate: 6, repeat: 1 });
    this.anims.create({ key: 'knight_attack', frames: this.anims.generateFrameNumbers('knight_attack', { start: 1, end: 4 }), frameRate: 10, repeat: 1 });
    this.anims.create({ key: 'knight_dead', frames: this.anims.generateFrameNumbers('knight_dead', { start: 2, end: 5 }), frameRate: 10, repeat: 1 });
  }

  registerWizardAnimations() {
    this.anims.create({ key: 'wizard_idle', frames: this.anims.generateFrameNumbers('wizard_idle', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'wizard_walk', frames: this.anims.generateFrameNumbers('wizard_walk', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'wizard_jump', frames: this.anims.generateFrameNumbers('wizard_jump', { start: 0, end: 7 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'wizard_hurt', frames: this.anims.generateFrameNumbers('wizard_hurt', { start: 0, end: 2 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'wizard_dead', frames: this.anims.generateFrameNumbers('wizard_dead', { start: 0, end: 4 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'wizard_charge', frames: this.anims.generateFrameNumbers('wizard_charge', { start: 0, end: 5 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'wizard_fireball', frames: this.anims.generateFrameNumbers('wizard_fireball', { start: 0, end: 7 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'wizard_flame', frames: this.anims.generateFrameNumbers('wizard_flame', { start: 0, end: 13 }), frameRate: 12, repeat: 0 });
  }

  registerFireAnimation() {
    this.anims.create({ key: 'fire_anim', frames: this.anims.generateFrameNumbers('fire', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });
  }

  displayProgressBar() {
    const { width, height } = this.cameras.main;
    const progressBarBg = this.add.graphics();
    progressBarBg.fillStyle(0x222222, 0.8);
    progressBarBg.fillRect(width / 4 - 2, height / 2 - 12, width / 2 + 4, 24);
    const progressBar = this.add.graphics();
    const loadingText = this.add.text(width / 2, height / 2 - 30, 'Carregando...', { fontSize: '20px', fill: '#fff' }).setOrigin(0.5);
    
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
}