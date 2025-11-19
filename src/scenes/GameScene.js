import Phaser from 'phaser';

// Classe que representa a cena principal do jogo
export default class GameScene extends Phaser.Scene {

  constructor(config) {
    super({ key: 'GameScene' }, config);
    this.config = config;
  }

  // Inicializa as propriedades da cena
  init() {
    this.gravity = 500;
    this.player = null;
    this.playerSpeed = 200;
    this.playerRunSpeed = 350; // Velocidade correndo
    this.playerJumpForce = 520;

    // Propriedades dos coletáveis
    this.fires = null;
    this.score = 0;
    this.scoreText = null;
    this.totalFires = 0; 

    // Propriedades de Saúde e UI
    this.health = 6; 
    this.hearts = [];
    this.soulIcon = null;

    // Propriedades de Áudio
    this.music = null;
    this.walkSound = null;
    this.runSound = null;

    this.wasInAir = false;
    
    this.isTransitioning = false;
    this.isDead = false;
  }

  // Cria os elementos visuais e lógicos da cena
  create() {
    
    this.music = this.sound.add('game_scene', { loop: true, volume: 0.4 });
    this.music.play();

    // Sons de movimento (loop)
    this.walkSound = this.sound.add('walking', { loop: true, volume: 0.5 });
    this.runSound = this.sound.add('running', { loop: true, volume: 0.5 });
    
    // Sons dos botões
    this.buttonSelect = this.sound.add('button_select', { loop: false, volume: 0.5 })
    this.buttonPress = this.sound.add('button_press', { loop: false, volume: 0.5 })
    
    this.createBackground();
    this.createGround();
    this.createUpGround();
    this.createStairs();

    this.createPlayer();
    this.createFires(); 

    this.createUI();
    this.createPauseButton(); // <--- ADICIONADO O BOTÃO DE PAUSE

    // Configura física do Player
    this.player.body.setGravityY(this.gravity);
    this.player.setCollideWorldBounds(true);

    // Colisões
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.player, this.upGround);
    this.physics.add.collider(this.player, this.stairs);

    // Física de Coleta (Overlap)
    this.physics.add.overlap(
      this.player,
      this.fires,
      this.collectFire,
      null,
      this
    );

    this.cursorKeys = this.input.keyboard.createCursorKeys();
    this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.hKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);

    this.input.mouse.disableContextMenu();

    this.showInstructionMessage();
  }

  // Lógica do Teclado (Update)
  update() {

    if (this.health === 0 || this.isTransitioning || this.isDead) {
      this.walkSound.stop();
      this.runSound.stop();
      return;
    }

    const { left, right, up, space } = this.cursorKeys;
    const { isDown: isShiftDown } = this.shiftKey;
    
    const isUpJustDown = Phaser.Input.Keyboard.JustDown(up);
    const isSpaceJustDown = Phaser.Input.Keyboard.JustDown(space);
    const isEKeyJustDown = Phaser.Input.Keyboard.JustDown(this.eKey);
    const isHKeyJustDown = Phaser.Input.Keyboard.JustDown(this.hKey);

    const playerOnFloor = this.player.body.onFloor();
    
    if (playerOnFloor && this.wasInAir) {
      if (!isUpJustDown) {
        this.sound.play('landing', { volume: 0.7 });
      }
    }
    this.wasInAir = !playerOnFloor;


    const currentPlayerAnim = this.player.anims.currentAnim?.key;
    const isPlayerPlaying = animKey => this.player.anims.isPlaying && currentPlayerAnim === animKey;

    if (isHKeyJustDown) {
      this.takeDamage(1); 
    }

    if (isPlayerPlaying('anim_attack1') || isPlayerPlaying('anim_attack2') || isPlayerPlaying('anim_hurt')) {
      this.player.setVelocityX(0); 
      this.walkSound.stop(); 
      this.runSound.stop();  
      return; 
    }

    if (isSpaceJustDown) {
      this.player.play('anim_attack1');
      this.player.setVelocityX(0); 
      this.sound.play('sword_1'); 
      return; 
    }
    if (isEKeyJustDown) {
      this.player.play('anim_attack2');
      this.player.setVelocityX(0); 
      this.sound.play('sword_2'); 
      return; 
    }

    const currentSpeed = isShiftDown ? this.playerRunSpeed : this.playerSpeed;

    if (left.isDown) {
      this.player.setVelocityX(-currentSpeed);
      this.player.setFlipX(true);
    }
    else if (right.isDown) {
      this.player.setVelocityX(currentSpeed);
      this.player.setFlipX(false);
    }
    else {
      this.player.setVelocityX(0);
    }

    if (isUpJustDown && playerOnFloor) {
      this.player.setVelocityY(-this.playerJumpForce);
      this.sound.play('jumping'); 
    }

    if (playerOnFloor) {
      if (this.player.body.velocity.x !== 0) {
        this.player.play(isShiftDown ? 'anim_run' : 'anim_walk', true);
        
        if (isShiftDown) {
          if (!this.runSound.isPlaying) this.runSound.play();
          this.walkSound.stop();
        } else {
          if (!this.walkSound.isPlaying) this.walkSound.play();
          this.runSound.stop();
        }

      } else {
        this.player.play('anim_idle', true);
        this.walkSound.stop(); 
        this.runSound.stop();  
      }
    } else {
      this.player.play('anim_jump', true);
      this.walkSound.stop(); 
      this.runSound.stop();  
    }
  }

  // Funções auxiliares (Cenário)
  createBackground() {
    const bg = this.add.image(
      this.config.width * 0.5,
      this.config.height * 0.5,
      'background'
    ).setDisplaySize(this.config.width, this.config.height);
  }

  createStairs() {
    const groundTop = (this.config.height * 0.5 + 215) - 10;
    const rampWidth = 180;
    const rampHeight = 175;
    const rampEndX = this.config.width;
    this.stairs = this.physics.add.staticGroup();

    for (let i = 0; i < rampWidth; i++) {
      const x = (rampEndX - rampWidth) + i;
      const y = (groundTop - (i * (rampHeight / rampWidth)));
      this.stairs.create(x, y)
        .setSize(1, 1)    
        .setVisible(false)
        .setOrigin(0, 1);
    }
  }

  createGround() {
    const groundRect = this.add.rectangle(
      this.config.width / 2,
      this.config.height * 0.5 + 215, // Y = 565
      this.config.width,
      20,
    ).setVisible(false); 
    this.physics.add.existing(groundRect, true);
    this.ground = groundRect;
  }

  createUpGround() {
    const platformWidth = 740;
    const platformCenterX = platformWidth / 1.8;
    const platformCenterY = this.config.height * -0.02 + 215; // Y = 201
    const groundRect = this.add.rectangle(
      platformCenterX,
      platformCenterY,
      platformWidth,
      20,
    ).setVisible(false); 
    this.physics.add.existing(groundRect, true);
    this.upGround = groundRect;
  }

  // Player
  createPlayer() {
    this.player = this.physics.add.sprite(
      200,
      this.config.height * 0.5, // 350
      'player_idle'
    ).setScale(1.5); 

    this.player.body.setSize(50, 100).setOffset(30, 28);
    this.player.play('anim_idle', true);
  }

  // Funções dos Foguinhos
  createFires() {
    this.fires = this.physics.add.staticGroup();
    const fireLocations = [
      { x: 300, y: 535 },
      { x: 500, y: 535 },
      { x: 700, y: 535 },
      { x: 100, y: 181 },
      { x: 350, y: 181 },
      { x: 600, y: 181 }
    ];
    fireLocations.forEach(fire => {
      this.fires.create(fire.x, fire.y, 'fire')
        .setScale(0.2) 
        .play('fire_anim');
    });

    this.fires.children.iterate(child => {
      child.body.setSize(40, 40).setOffset(90, 90);
    });
    
    this.totalFires = fireLocations.length;
  }

  collectFire(player, fire) {
    if (this.isDead || this.isTransitioning) return;
    
    fire.disableBody(true, true);
    this.score += 1;
    this.scoreText.setText(this.score);
    this.sound.play('soul_collect', { volume: 0.7 }); 

    if (this.score === this.totalFires) {
      this.startNextLevelTransition();
    }
  }

  // Funções de UI e Saúde
  createUI() {
    const margin = 20;
    const spacing = 10;
    const heartSpacing = 35;
    const iconScale = 0.2;

    this.soulIcon = this.add.sprite(margin, margin, 'fire', 0)
      .setScale(iconScale) 
      .setOrigin(0, 0)
      .setScrollFactor(0);
    
    const soulHeight = this.soulIcon.displayHeight;

    this.scoreText = this.add.text(
      margin + this.soulIcon.displayWidth + spacing, 
      margin + (soulHeight / 2),
      '0', 
      {
        fontSize: '32px', 
        fill: '#E0E0E0',
        fontFamily: 'MedievalSharp, serif',
        stroke: '#000',
        strokeThickness: 5
    }).setOrigin(0, 0.5)
     .setScrollFactor(0);

    const y_row2 = margin + soulHeight + spacing;
    let tempHeart = this.add.image(0, 0, 'life').setScale(iconScale);
    const heartHeight = tempHeart.displayHeight;
    tempHeart.destroy();

    const heartY = y_row2 + (heartHeight / 2);
    let heartX = margin; 

    this.hearts = [];
    for (let i = 0; i < 3; i++) {
      let heart = this.add.image(heartX, heartY, 'life')
        .setScale(iconScale)
        .setOrigin(0, 0.5)
        .setScrollFactor(0);
      
      this.hearts.push(heart);
      heartX += heartSpacing;
    }
  }

  createPauseButton() {
    const margin = 20;
    const x = this.config.width - margin;
    const y = margin;

    // Fundo do botão
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x1a1a1a, 0.8);
    btnBg.lineStyle(2, 0xffffff, 1);
    btnBg.fillRoundedRect(-25, -20, 50, 40, 5);
    btnBg.strokeRoundedRect(-25, -20, 50, 40, 5);

    // Texto ou Ícone "||"
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
      // Pausa a cena atual
      this.scene.pause();
      // Lança a cena de Pause, passando a chave da cena atual para saber qual reiniciar
      this.scene.launch('PauseScene', { currentSceneKey: 'GameScene' });
    });
  }

  updateHealthUI() {
    let currentHealth = this.health;
    this.hearts.forEach((heart) => {
      const textureWidth = heart.texture.getSourceImage().width;
      const textureHeight = heart.texture.getSourceImage().height;

      if (currentHealth >= 2) {
        heart.setCrop(); 
        heart.visible = true;
        currentHealth -= 2;
      } 
      else if (currentHealth === 1) {
        heart.setCrop(0, 0, textureWidth / 2, textureHeight);
        heart.visible = true;
        currentHealth -= 1;
      } 
      else {
        heart.visible = false; 
      }
    });
  }

  takeDamage(amount) {
    if (this.health === 0 || this.isTransitioning || this.isDead) return;

    this.health -= amount;
    if (this.health < 0) {
      this.health = 0;
    }

    this.updateHealthUI();

    if (this.health === 0) {
      // --- MORTE ---
      this.isDead = true;
      this.sound.play('dead'); 
      this.player.setVelocity(0, 0);
      this.player.play('anim_dead', true); 
      this.player.body.setGravityY(0); 
      this.player.body.enable = false; 
      
      this.walkSound.stop();
      this.runSound.stop();

      this.player.once('animationcomplete-anim_dead', () => {
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.music.stop();
          this.showDeathScreen();
        });
      }, this);

    } else {
      // --- DANO ---
      this.sound.play('hurt'); 
      this.player.play('anim_hurt');
      this.tweens.add({
        targets: this.player,
        alpha: 0.5,
        duration: 100,
        ease: 'Linear',
        yoyo: true, 
        repeat: 3 
      });
    }
  }

  // Funções de Transição e Mensagem
  showInstructionMessage() {
    const instructionStyle = {
      fontSize: '32px',
      fill: '#E0E0E0',
      fontFamily: 'MedievalSharp, serif',
      stroke: '#000',
      strokeThickness: 5,
      align: 'center'
    };

    const instructionText = this.add.text(
      this.config.width / 2,
      this.config.height / 2 - 120, // Posição
      'Colete todas as almas para ir para a próxima Runa.',
      instructionStyle
    ).setOrigin(0.5, 0.5)
     .setScrollFactor(0);

    this.time.delayedCall(10000, () => {
      this.tweens.add({
        targets: instructionText,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          if (instructionText) {
            instructionText.destroy();
          }
        }
      });
    });
  }
  
  startNextLevelTransition() {
    this.isTransitioning = true; 

    this.player.body.enable = false;
    this.player.setVelocity(0, 0);
    this.player.play('anim_idle', true);
    
    this.music.stop();
    this.walkSound.stop();
    this.runSound.stop();
    
    this.tweens.add({
      targets: [this.soulIcon, this.scoreText, ...this.hearts],
      alpha: 0,
      duration: 500
    });

    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('SecondRuneScene');
    });
  }
  
  showDeathScreen() {
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;

    this.add.text(centerX, centerY - 100, 'Você morreu', {
      fontFamily: 'MedievalSharp, serif',
      fontSize: '64px',
      fill: '#ff0000',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0);

    this.add.text(centerX, centerY, 'As Runas se apagam... a escuridão prevalece.', {
      fontFamily: 'MedievalSharp, serif',
      fontSize: '24px',
      fill: '#ffffff',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0);

    this.createButton(centerX, centerY + 100, 'Recomeçar', () => {
      this.cameras.main.fadeIn(500, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
        this.scene.restart();
      });
    }).setScrollFactor(0);
  }
  
  createButton(x, y, text, onClick) {
    const buttonWidth = 280;
    const buttonHeight = 60;

    const bgColor = 0x1a1a1a;
    const strokeColor = 0x555555;
    const textColor = '#E0E0E0';
    
    const hoverBgColor = 0x333333;
    const hoverStrokeColor = 0xaaaaaa;
    const hoverTextColor = '#ffffff';

    const buttonBG = this.add.graphics()
      .fillStyle(bgColor, 0.8)
      .lineStyle(3, strokeColor, 1.0)
      .fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5)
      .strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5);

    const buttonText = this.add.text(0, 0, text, {
      fontFamily: 'MedievalSharp, serif',
      fontSize: '36px',
      fill: textColor,
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);

    const buttonContainer = this.add.container(x, y, [buttonBG, buttonText])
      .setSize(buttonWidth, buttonHeight)
      .setInteractive();

    buttonContainer.on('pointerover', () => {
      this.buttonSelect.play();
      buttonBG.clear()
        .fillStyle(hoverBgColor, 0.9)
        .lineStyle(3, hoverStrokeColor, 1.0)
        .fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5)
        .strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5);
      buttonText.setFill(hoverTextColor);
    });

    buttonContainer.on('pointerout', () => {
      this.buttonSelect.play();
      buttonBG.clear()
        .fillStyle(bgColor, 0.8)
        .lineStyle(3, strokeColor, 1.0)
        .fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5)
        .strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5);
      buttonText.setFill(textColor);
    });

    buttonContainer.on('pointerdown', () => {
      this.buttonPress.play();
      buttonContainer.setScale(0.98);
    });
    
    buttonContainer.on('pointerup', (pointer) => {
      this.buttonPress.play();
      buttonContainer.setScale(1.0);
      if (buttonContainer.getBounds().contains(pointer.x, pointer.y)) {
        onClick();
      }
    });

    return buttonContainer;
  }
}