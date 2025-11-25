import Phaser from 'phaser';

export default class FinalBossCutScene extends Phaser.Scene {

  constructor(config) {
    super({ key: 'FinalBossCutScene' }, config);
    this.config = config || { width: 1000, height: 700 };

    // Roteiro do Diálogo: Storm vs Wizard
    this.dialogueData = [
      { 
        speaker: 'wizard', 
        text: "Então a pequena faísca virou uma tempestade..." 
      },
      { 
        speaker: 'storm', 
        text: "Seu reinado de cinzas acaba agora. Liberte as almas!" 
      },
      { 
        speaker: 'wizard', 
        text: "Tola... Ingênua... As almas são o combustível da minha eternidade. E você será a próxima." 
      },
      { 
        speaker: 'storm', 
        text: "Eu não queimo. Eu apago o fogo." 
      },
      { 
        speaker: 'wizard', 
        text: "Venha então! Mostre-me o poder das runas que você quebrou! Mostre-me agora toda a sua fúria que foi capaz de destruir tudo o que eu conquistei!" 
      },
      { 
        speaker: 'storm', 
        text: "Pelo legado esquecido... eu vou te destruir." 
      }
    ];
    
    this.dialogueIndex = 0; 
  }

  // =================================================================
  // INICIALIZAÇÃO
  // =================================================================
  init() {
    this.player = null;
    this.boss = null;
    
    this.dialogueBox = null;
    this.dialogueText = null;
    this.promptText = null;
    
    this.nameBox = null;
    this.dialogueIcon = null;
    this.dialogueName = null;

    this.charactersMoved = false; 
    this.dialogueStarted = false; 
    this.dialogueEnded = false;   

    // Áudio
    this.ambienceSound = null;
    this.typingSound = null;
    this.walking_sound = null;

    // Typewriter
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
    // Inputs
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE); 
    this.pKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P); 

    // Sons
    this.ambienceSound = this.sound.add('final_boss_ambience', { loop: true, volume: 0.3 });
    this.ambienceSound.play();
    this.typingSound = this.sound.add('dialog_introduction', { loop: true, volume: 0.8 });
    this.buttonSelect = this.sound.add('button_select', { loop: false, volume: 0.5 });
    this.buttonPress = this.sound.add('button_press', { loop: false, volume: 0.5 });
    this.walking_sound = this.sound.add('walking', { loop: true, volume: 0.5 });

    // 1. Cenário
    this.add.image(
      this.config.width * 0.5,
      this.config.height * 0.5,
      'boss_cutscene_background'
    ).setDisplaySize(this.config.width, this.config.height);

    // 2. Personagens (Spawn fora da tela ou nas bordas)
    // STORM
    this.player = this.physics.add.sprite(-100, this.config.height * 0.5 + 180, 'player_walk').setScale(1.5);
    this.player.play('anim_walk', true);

    // BOSS
    this.boss = this.physics.add.sprite(this.config.width + 100, this.config.height * 0.5 + 180, 'wizard_walk').setScale(1.5);
    this.boss.setFlipX(true); 
    this.boss.play('wizard_walk', true);

    this.walking_sound.play();

    // 3. Animação de Entrada (Tweens)
    // Storm entra
    this.tweens.add({
      targets: this.player,
      x: this.config.width * 0.15,
      duration: 3000,
      ease: 'Linear'
    });

    // Boss entra
    this.tweens.add({
      targets: this.boss,
      x: this.config.width * 0.75,
      duration: 3000,
      ease: 'Linear',
      onComplete: () => {
        // Personagens param
        this.player.play('anim_idle', true);
        this.player.setVelocityX(0);
        
        this.boss.play('wizard_idle', true);
        this.boss.setVelocityX(0);

        this.charactersMoved = true;
        if (this.walking_sound) this.walking_sound.stop();
      }
    });

    // UI
    this.createPassSceneBtn();
    this.createPauseButton();

    this.events.on('resume', () => {
        if (this.ambienceSound && this.ambienceSound.isPaused) this.ambienceSound.resume();
        if (!this.charactersMoved && this.walking_sound && this.walking_sound.isPaused) this.walking_sound.resume();
        if (this.isTyping && this.typingSound && this.typingSound.isPaused) this.typingSound.resume();
    });
  }

  update() {
    if (this.dialogueEnded) return;

    if (this.charactersMoved && !this.dialogueStarted) {
      this.startDialogue();
    }

    if (this.dialogueStarted && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      if (this.isTyping) { 
        this.finishTyping();
      } else {
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

    // Configuração da Caixa
    const boxHeight = 140; 
    const boxTopY = 20; 
    const boxLeftX = 50;
    const boxWidth = this.config.width - 100; 

    // Fundo
    this.dialogueBox = this.add.graphics();
    this.dialogueBox.fillStyle(0x000000, 0.8);
    this.dialogueBox.lineStyle(2, 0xffffff, 1);
    this.dialogueBox.fillRoundedRect(boxLeftX, boxTopY, boxWidth, boxHeight, 10);
    this.dialogueBox.strokeRoundedRect(boxLeftX, boxTopY, boxWidth, boxHeight, 10);

    // Elementos de UI
    this.nameBox = this.add.graphics();
    this.dialogueIcon = this.add.sprite(0, 0, 'storm_icon').setScale(0.5).setVisible(false);
    
    this.dialogueName = this.add.text(0, 0, '', {
      fontSize: '24px',
      fill: '#FFD700',
      fontFamily: 'MedievalSharp, serif',
      stroke: '#000',
      strokeThickness: 3
    });

    this.dialogueText = this.add.text(
      boxLeftX + 40, 
      boxTopY + 45,  
      '',
      {
        fontSize: '26px',
        fill: '#fff',
        fontFamily: 'MedievalSharp, serif',
        wordWrap: { width: boxWidth - 60 }
      }
    );

    this.promptText = this.add.text(
      boxLeftX + boxWidth - 20,
      boxTopY + boxHeight - 10,
      '[ESPAÇO]',
      { fontSize: '18px', fill: '#aaa', fontFamily: 'MedievalSharp, serif' }
    ).setOrigin(1, 1);

    this.showNextDialogue();
  }

  updateDialogueHeader(speaker) {
    this.nameBox.clear();
    
    const boxTopY = 20; 
    const boxLeftX = 50;
    
    let name = '';
    let iconKey = '';
    let nameColor = '#ffffff';

    if (speaker === 'storm') {
        name = 'Tempestade';
        iconKey = 'storm_icon';
        nameColor = '#00BFFF'; 
    } else {
        name = 'Mago de Fogo';
        iconKey = 'wizard_icon'; 
        nameColor = '#FF4500'; 
    }

    // Atualiza Nome e Cor
    this.dialogueName.setText(name);
    this.dialogueName.setFill(nameColor);

    // Posicionamento do Header
    const iconX = boxLeftX + 40;
    const iconY = boxTopY + 25; 

    this.dialogueIcon.setTexture(iconKey);
    this.dialogueIcon.setVisible(true);
    this.dialogueIcon.setPosition(iconX, iconY);
    
    if (speaker === 'wizard') {
        this.dialogueIcon.setFrame(0); 
        this.dialogueIcon.setScale(0.4); 
    } else {
        this.dialogueIcon.setScale(0.5);
    }

    this.dialogueName.setPosition(iconX + 30, iconY - 12);
  }

  showNextDialogue() {
    if (this.typingTimer) this.typingTimer.remove();

    if (this.dialogueIndex < this.dialogueData.length) {
      const data = this.dialogueData[this.dialogueIndex];
      this.currentMessage = data.text;
      
      this.updateDialogueHeader(data.speaker);

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

  // =================================================================
  // FINALIZAÇÃO
  // =================================================================

  endCutscene() {
    this.dialogueEnded = true;
    if (this.typingTimer) this.typingTimer.remove();
    
    this.sound.stopAll();

    if (this.dialogueBox) this.dialogueBox.destroy();
    if (this.dialogueText) this.dialogueText.destroy();
    if (this.promptText) this.promptText.destroy();
    if (this.nameBox) this.nameBox.destroy();
    if (this.dialogueIcon) this.dialogueIcon.destroy();
    if (this.dialogueName) this.dialogueName.destroy();

    this.cameras.main.fadeOut(1000, 0, 0, 0);

    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
       this.scene.start('FinalBossScene'); 
    });
  }

  createPassSceneBtn() {
    this.add.text(this.config.width - 20, this.config.height - 20, 'Pressione "P" para pular', {
      fontFamily: 'MedievalSharp, serif',
      fontSize: '20px',
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(1, 1);
  }

  createPauseButton() {
    const margin = 20;
    const x = margin + 25; 
    const y = this.config.height - margin - 20;

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x1a1a1a, 0.8);
    btnBg.lineStyle(2, 0xffffff, 1);
    btnBg.fillRoundedRect(-25, -20, 50, 40, 5);
    btnBg.strokeRoundedRect(-25, -20, 50, 40, 5);

    const btnText = this.add.text(0, 0, 'II', {
      fontFamily: 'MedievalSharp, serif', fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);

    const pauseContainer = this.add.container(x, y, [btnBg, btnText])
      .setSize(50, 40)
      .setInteractive();

    pauseContainer.on('pointerover', () => btnText.setFill('#ffff00'));
    pauseContainer.on('pointerout', () => btnText.setFill('#ffffff'));
    pauseContainer.on('pointerdown', () => {
      this.buttonPress.play();
      if (this.ambienceSound) this.ambienceSound.pause();
      if (this.walking_sound) this.walking_sound.pause();
      if (this.typingSound && this.isTyping) this.typingSound.pause();
      
      this.scene.pause();
      this.scene.launch('PauseScene', { currentSceneKey: 'FinalBossCutScene' });
    });
  }
}