import Phaser from 'phaser';

export default class IntroductionScene extends Phaser.Scene {

  constructor(config) {
    super({ key: 'IntroductionScene' }, config);
    this.config = config;

    // Roteiro
    this.dialogueMessages = [
      "Este mundo... tudo o que conhecíamos se tornou cinzas.",
      "Ele usou o poder proibido: o Legado das Três Runas.",
      "Agora, as Almas Infernais vagam atormentadas, presas por essa magia sombria.",
      "Eu sinto a marca dele em toda parte... foi ele... ele que as condenou.",
      "Mas eu sou a Tempestade. Eu sou a única que pode enfrentar o Incêndio dele.",
      "Preciso libertar cada alma. A luz delas me tornará forte o suficiente para quebrar as Runas.",
      "E quando a última Runa cair, eu irei atrás dele.",
      "A jornada começa agora."
    ];
    this.dialogueIndex = 0; 
  }

  // =================================================================
  // INICIALIZAÇÃO E VARIÁVEIS
  // =================================================================
  init() {
    this.player = null;
    this.dialogueBox = null;
    this.dialogueText = null;
    this.promptText = null;
    this.spaceKey = null;

    this.playerMoved = false; 
    this.dialogueStarted = false; 
    this.dialogueEnded = false;   

    this.ambienceSound = null;
    this.typingSound = null;
    this.walking_sound = null;

    this.nameBox = null;
    this.dialogueIcon = null;
    this.dialogueName = null;

    // Configuração do efeito de digitação (Typewriter)
    this.typingTimer = null;
    this.isTyping = false;
    this.currentMessage = '';
    this.charIndex = 0;
    this.typingSpeed = 40;
  }

  // =================================================================
  // CREATE
  // =================================================================
  create() {
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.pKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

    this.ambienceSound = this.sound.add('ambience_introduction', { loop: true, volume: 0.5 });
    this.ambienceSound.play();

    this.typingSound = this.sound.add('dialog_introduction', { loop: true, volume: 0.8 });

    // 1. Background
    const bg = this.add.image(
      this.config.width * 0.5,
      this.config.height * 0.5,
      'introduction_background'
    ).setDisplaySize(this.config.width, this.config.height);

    // 2. Animação de Entrada do Player
    this.player = this.physics.add.sprite(
      100,
      this.config.height * 0.5 + 60,
      'player_walk'
    ).setScale(1.5);

    this.player.play('anim_walk', true);

    this.walking_sound = this.sound.add('walking', { loop: true, volume: 0.5 });
    this.walking_sound.play();

    // Move o jogador até o ponto de fala
    this.tweens.add({
      targets: this.player,
      x: this.config.width / 3,
      duration: 4000,
      ease: 'Linear',
      onComplete: () => {
        this.player.play('anim_idle', true);
        this.player.setVelocityX(0);
        this.playerMoved = true;

        if (this.walking_sound) this.walking_sound.stop();
      }
    });

    this.createPauseButton();
    this.createPassSceneBtn();
    this.buttonSelect = this.sound.add('button_select', { loop: false, volume: 0.5 })
    this.buttonPress = this.sound.add('button_press', { loop: false, volume: 0.5 })

    // Listener de Resume (corrige áudio após pause)
    this.events.on('resume', () => {
        if (this.ambienceSound && this.ambienceSound.isPaused) {
            this.ambienceSound.resume();
        }
        if (!this.playerMoved && this.walking_sound && this.walking_sound.isPaused) {
            this.walking_sound.resume();
        }
        if (this.isTyping && this.typingSound && this.typingSound.isPaused) {
            this.typingSound.resume();
        }
    });
  }

  update() {
    if (this.dialogueEnded) {
      return;
    }

    if (this.playerMoved && !this.dialogueStarted) {
      this.startDialogue();
    }

    if (this.dialogueStarted && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      if (this.isTyping) {
        this.finishTyping();
      }
      else {
        this.showNextDialogue();
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.pKey)) {
      this.endCutscene();
    }
  }

  // =================================================================
  // SISTEMA DE DIÁLOGO
  // =================================================================

  startDialogue() {
    this.dialogueStarted = true;

    const boxTopY = this.config.height - 150;
    const boxLeftX = 50;

    // Caixa de Texto Principal
    this.dialogueBox = this.add.graphics();
    this.dialogueBox.fillStyle(0x000000, 0.7);
    this.dialogueBox.fillRect(
      boxLeftX,
      boxTopY,
      this.config.width - 100,
      100
    );

    // Caixa de Nome e Ícone
    this.nameBox = this.add.graphics();
    this.nameBox.fillStyle(0x000000, 0.7);
    this.nameBox.fillRect(boxLeftX + 20, boxTopY - 50, 240, 40);

    this.dialogueIcon = this.add.image(boxLeftX + 40, boxTopY - 30, 'storm_icon')
      .setScale(0.5)
      .setOrigin(0.5, 0.5);

    this.dialogueName = this.add.text(boxLeftX + 70, boxTopY - 30, 'Tempestade', {
      fontSize: '24px',
      fill: '#E0E0E0',
      fontFamily: 'MedievalSharp, serif',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0, 0.5);


    // Texto
    this.dialogueText = this.add.text(
      70,
      this.config.height - 130,
      '',
      {
        fontSize: '28px',
        fill: '#fff',
        wordWrap: { width: this.config.width - 140 }
      }
    );

    // Indicador [ESPAÇO]
    this.promptText = this.add.text(
      this.config.width - 100,
      this.config.height - 80,
      '[ESPAÇO]',
      { fontSize: '20px', fill: '#999' }
    ).setOrigin(1, 0);

    this.showNextDialogue();
  }

  showNextDialogue() {
    if (this.typingTimer) this.typingTimer.remove();

    if (this.dialogueIndex < this.dialogueMessages.length) {
      this.currentMessage = this.dialogueMessages[this.dialogueIndex];
      this.dialogueIndex++;

      this.dialogueText.setText('');
      this.charIndex = 0;

      this.promptText.setVisible(false);
      this.isTyping = true;

      if (this.typingSound) this.typingSound.play();

      // Inicia digitação caractere por caractere
      this.typingTimer = this.time.addEvent({
        delay: this.typingSpeed,
        callback: this.typeCharacter,
        callbackScope: this,
        loop: true
      });

    } else {
      this.endCutscene();
    }
  }

  createPassSceneBtn() {
    this.add.text(240, 50, 'Pressione "P" para pular a CutScene.', {
      fontFamily: 'MedievalSharp, serif',
      fontSize: '24px',
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0.5);
  }

  createPauseButton() {
    const margin = 20;
    const x = this.config.width - margin;
    const y = margin;

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x1a1a1a, 0.8);
    btnBg.lineStyle(2, 0xffffff, 1);
    btnBg.fillRoundedRect(-25, -20, 50, 40, 5);
    btnBg.strokeRoundedRect(-25, -20, 50, 40, 5);

    const btnText = this.add.text(0, 0, 'II', {
      fontFamily: 'MedievalSharp, serif',
      fontSize: '24px',
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0.5);

    const pauseContainer = this.add.container(x, y + 20, [btnBg, btnText])
      .setSize(50, 40)
      .setScrollFactor(0)
      .setInteractive();

    pauseContainer.on('pointerover', () => {
      btnText.setFill('#ffff00');
    });

    pauseContainer.on('pointerout', () => {
      btnText.setFill('#ffffff');
    });

    pauseContainer.on('pointerdown', () => {
      this.buttonPress.play();
      
      // Pause de todos os sons relevantes
      if (this.ambienceSound) this.ambienceSound.pause();
      if (this.walking_sound) this.walking_sound.pause();
      if (this.typingSound && this.isTyping) this.typingSound.pause();

      this.scene.pause();
      this.scene.launch('PauseScene', { currentSceneKey: 'IntroductionScene' });
    });
  }

  typeCharacter() {
    this.dialogueText.setText(this.dialogueText.text + this.currentMessage[this.charIndex]);
    this.charIndex++;

    if (this.charIndex >= this.currentMessage.length) {
      this.finishTyping();
    }
  }

  finishTyping() {
    if (this.typingTimer) this.typingTimer.remove();
    if (this.typingSound) this.typingSound.stop(); 

    this.dialogueText.setText(this.currentMessage);
    this.isTyping = false;
    this.promptText.setVisible(true);
  }

  endCutscene() {
    this.dialogueEnded = true;

    if (this.typingTimer) this.typingTimer.remove();

    if (this.ambienceSound) this.ambienceSound.stop();
    if (this.typingSound) this.typingSound.stop();
    if (this.walking_sound) this.walking_sound.stop();

    if (this.dialogueBox) this.dialogueBox.destroy();
    if (this.dialogueText) this.dialogueText.destroy();
    if (this.promptText) this.promptText.destroy();
    if (this.nameBox) this.nameBox.destroy();
    if (this.dialogueIcon) this.dialogueIcon.destroy();
    if (this.dialogueName) this.dialogueName.destroy();

    this.cameras.main.fadeOut(1000, 0, 0, 0);

    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('GameScene');
    });
  }
}