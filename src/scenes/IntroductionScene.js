import Phaser from 'phaser';

export default class IntroductionScene extends Phaser.Scene {

  constructor(config) {
    super({ key: 'IntroductionScene' }, config);
    this.config = config;

    // Historinha
    this.dialogueMessages = [
      "Este mundo... tudo o que conhecíamos se tornou cinzas.",
      "Ele usou o poder proibido: o Legado das Três Runas.",
      "Agora, as Almas Infernais vagam atormentadas, presas por essa magia sombria.",
      "Eu sinto a marca dele em toda parte... o Mago de Fogo que as condenou.",
      "Mas eu sou a Tempestade. Eu sou a única que pode enfrentar o Incêndio dele.",
      "Preciso libertar cada alma. A luz delas me tornará forte o suficiente para quebrar as Runas.",
      "E quando a última Runa cair, eu irei atrás dele.",
      "A jornada começa agora."
    ];
    this.dialogueIndex = 0; // Índice da fala 
  }

  init() {
    // Resetar variáveis para cada vez que a cena é iniciada
    this.player = null;
    this.dialogueBox = null;
    this.dialogueText = null;
    this.promptText = null;
    this.spaceKey = null;

    this.playerMoved = false; // Flag para saber se o player terminou de andar
    this.dialogueStarted = false; // Flag para saber se o diálogo começou
    this.dialogueEnded = false;   // Flag para saber se o diálogo terminou

    this.ambienceSound = null;
    this.typingSound = null;
    this.walking_sound = null; 

    this.nameBox = null;
    this.dialogueIcon = null;
    this.dialogueName = null;

    // Propriedades do Typewriter (Efeito de Máquina de Escrever)
    this.typingTimer = null;
    this.isTyping = false;
    this.currentMessage = '';
    this.charIndex = 0;
    this.typingSpeed = 40;
  }

  create() {
    // Tecla de espaço para avançar o diálogo
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Toca a música de ambiente em loop
    this.ambienceSound = this.sound.add('ambience_introduction', { loop: true, volume: 0.5 });
    this.ambienceSound.play();

    // Prepara o som de digitação, mas não toca ainda
    this.typingSound = this.sound.add('dialog_introduction', { loop: true, volume: 0.8 });

    // 1. Criar Background
    const bg = this.add.image(
      this.config.width * 0.5,
      this.config.height * 0.5,
      'introduction_background'
    ).setDisplaySize(this.config.width, this.config.height);
    
    // 2. Criar Player
    this.player = this.physics.add.sprite(
      100, 
      this.config.height * 0.5 + 60,
      'player_walk'
    ).setScale(1.5);
    
    this.player.play('anim_walk', true); 

    // Som de Caminhada
    this.walking_sound = this.sound.add('walking', { loop: true, volume: 0.5 });
    this.walking_sound.play();


    // 3. Mover o Player (Cutscene)
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
  }

  // LÓGICA DE UPDATE ===
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
  }

  // FUNÇÕES DE DIÁLOGO ===
  startDialogue() {
    this.dialogueStarted = true;
    
    const boxTopY = this.config.height - 150;
    const boxLeftX = 50;

    // 1. Caixa de diálogo
    this.dialogueBox = this.add.graphics();
    this.dialogueBox.fillStyle(0x000000, 0.7);
    this.dialogueBox.fillRect(
      boxLeftX,
      boxTopY, 
      this.config.width - 100,
      100 
    );

    // 1b. Caixa de Nome e Ícone
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


    // 2. Texto do diálogo
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

    // 3. Indicador de "Pressione Espaço"
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