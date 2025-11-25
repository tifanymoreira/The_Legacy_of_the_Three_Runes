import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Knight from '../entities/Knight.js';

export default class SecondRuneScene extends Phaser.Scene {

  constructor(config) {
    super({ key: 'SecondRuneScene' }, config);
    this.config = config;
  }

  // =================================================================
  // INICIALIZAÇÃO E PERSISTÊNCIA DE DADOS
  // =================================================================
  init(data) {
    this.score = data.score || 0; 
    this.initialHealth = data.health || 6; 

    this.totalFires = 0;
    this.isTransitioning = false;
    this.hearts = [];
  }

  // =================================================================
  // CREATE
  // =================================================================
  create() {
    // 1. Áudio
    this.music = this.sound.add('game_scene', { loop: true, volume: 0.4 });
    this.music.play();
    this.buttonSelect = this.sound.add('button_select', { loop: false, volume: 0.5 });
    this.buttonPress = this.sound.add('button_press', { loop: false, volume: 0.5 });

    // 2. Cenário
    this.createBackground();
    this.createGround();
    this.createPlatforms();

    // 3. Jogador e Vida
    this.player = new Player(this, 90, 400);
    this.player.health = this.initialHealth;

    // 4. Inimigos
    this.knights = this.add.group({ runChildUpdate: true });

    const knightPositions = [
      { x: 240, y: 180 }, 
      { x: 400, y: 180 }, 
      { x: 740, y: 180 }, 
      { x: 610, y: 180 } 
    ];

    knightPositions.forEach(pos => {
      const k = new Knight(this, pos.x, pos.y, 'SecondRuneScene');
      this.knights.add(k);
    });

    // 5. Colisões
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.player, this.platforms);

    this.physics.add.collider(this.knights, this.ground);
    this.physics.add.collider(this.knights, this.platforms);

    // 6. Colecionáveis
    this.createFires();
    this.physics.add.overlap(this.player, this.fires, this.collectFire, null, this);

    // 7. Interface
    this.createUI();
    this.updateHealthUI(this.player.health);
    this.createPauseButton();
    this.showInstructionMessage();

    // Eventos
    this.events.on('player-health-changed', (newHealth) => this.updateHealthUI(newHealth));
    this.events.on('player-died', () => this.handlePlayerDeath());

    this.events.on('resume', (sys, data) => {
      if (this.music && this.music.isPaused) {
        this.music.resume();
      }
      if (this.player) {
        this.player.stopSounds();
        this.player.setVelocityX(0);
      }
    });
  }

  // =================================================================
  // UPDATE LOOP
  // =================================================================
  update() {
    if (this.isTransitioning) return;

    if (this.player) {
      this.player.update();
      this.checkPlayerAttacks();
    }

    this.knights.children.iterate((knight) => {
      if (knight && knight.active) {
        knight.update(this.player);
      }
    });
  }

  checkPlayerAttacks() {
    if (!this.player || this.player.isDead) return;
    if (!this.player.isAttacking) return;
    if (!this.player.isFrameActive()) return;

    this.knights.children.iterate((knight) => {
      if (!knight.active || knight.isDead) return;
      if (this.player.hasHit(knight)) return;

      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, knight.x, knight.y);
      const distY = Math.abs(this.player.y - knight.y);

      if (dist <= this.player.attackRange && distY < 80) {
        const isFacingEnemy = (this.player.flipX && this.player.x > knight.x) ||
          (!this.player.flipX && this.player.x < knight.x);

        if (isFacingEnemy) {
          this.applyDamageToKnight(knight);
        }
      }
    });
  }

  applyDamageToKnight(knight) {
    this.player.registerHit(knight);

    if (this.player.x < knight.x) {
      knight.setVelocityX(150);
      knight.setVelocityY(-100);
    } else {
      knight.setVelocityX(-150);
      knight.setVelocityY(-100);
    }

    knight.takeDamage(this.player.attackDamage);

    knight.setTint(0xff0000);
    this.time.delayedCall(150, () => {
      if (knight && !knight.isDead) knight.clearTint();
    });
  }

  // =================================================================
  // AMBIENTE
  // =================================================================

  createBackground() {
    this.add.image(this.config.width * 0.5, this.config.height * 0.5, 'second_rune_background')
      .setDisplaySize(this.config.width, this.config.height);
  }

  createGround() {
    const groundRect = this.add.rectangle(
      this.config.width / 2, this.config.height * 0.5 + 300,
      this.config.width, 20
    ).setVisible(false).setFillStyle(0x00ff00, 0.4);
    this.physics.add.existing(groundRect, true);
    this.ground = groundRect;
  }

  createPlatforms() {
    this.platforms = this.physics.add.staticGroup();
    const platformData = [
      { x: 250, y: 400, w: 120 }, 
      { x: 400, y: 490, w: 120 },
      { x: 740, y: 400, w: 120 }, 
      { x: 620, y: 510, w: 150 }
    ];
    platformData.forEach(data => {
      const plat = this.add.rectangle(data.x, data.y, data.w, 20).setVisible(false);
      this.physics.add.existing(plat, true);
      this.platforms.add(plat);
    });
  }

  createFires() {
    this.fires = this.physics.add.staticGroup();
    const fireLocations = [
      { x: 500, y: 65 }, { x: 500, y: 585 }, { x: 900, y: 585 },
      { x: 310, y: 340 }, { x: 450, y: 410 }, { x: 790, y: 350 }, { x: 650, y: 450 }
    ];
    fireLocations.forEach(fire => {
      this.fires.create(fire.x, fire.y, 'fire').setScale(0.2).play('fire_anim');
    });
    this.fires.children.iterate(child => {
      child.body.setSize(40, 40).setOffset(90, 90);
    });
    this.totalFires = fireLocations.length;
  }

  collectFire(player, fire) {
    if (this.player.isDead || this.isTransitioning) return;

    fire.disableBody(true, true);
    this.score += 1;
    this.scoreText.setText(this.score);
    this.sound.play('soul_collect', { volume: 0.7 });

    if (this.score === 13) {
      this.startNextLevelTransition()
    }
  }

  // =================================================================
  // UI E SISTEMAS
  // =================================================================

  createUI() {
    const margin = 20; const spacing = 10; const heartSpacing = 35; const iconScale = 0.2;
    this.soulIcon = this.add.sprite(margin, margin, 'fire', 0).setScale(iconScale).setOrigin(0, 0).setScrollFactor(0);
    const soulHeight = this.soulIcon.displayHeight;

    this.scoreText = this.add.text(
      margin + this.soulIcon.displayWidth + spacing, margin + (soulHeight / 2), `${this.score}`, {
      fontSize: '32px', fill: '#E0E0E0', fontFamily: 'MedievalSharp, serif', stroke: '#000', strokeThickness: 5
    }).setOrigin(0, 0.5).setScrollFactor(0);

    const y_row2 = margin + soulHeight + spacing;
    let tempHeart = this.add.image(0, 0, 'life').setScale(iconScale);
    const heartHeight = tempHeart.displayHeight;
    tempHeart.destroy();
    const heartY = y_row2 + (heartHeight / 2);
    let heartX = margin;
    this.hearts = [];
    for (let i = 0; i < 3; i++) {
      let heart = this.add.image(heartX, heartY, 'life').setScale(iconScale).setOrigin(0, 0.5).setScrollFactor(0);
      this.hearts.push(heart); heartX += heartSpacing;
    }
  }

  updateHealthUI(currentHealth) {
    this.hearts.forEach((heart) => {
      const textureWidth = heart.texture.getSourceImage().width;
      const textureHeight = heart.texture.getSourceImage().height;
      if (currentHealth >= 2) { heart.setCrop(); heart.visible = true; currentHealth -= 2; }
      else if (currentHealth === 1) { heart.setCrop(0, 0, textureWidth / 2, textureHeight); heart.visible = true; currentHealth -= 1; }
      else { heart.visible = false; }
    });
  }

  createPauseButton() {
    const margin = 20; const x = this.config.width - margin; const y = margin;
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x1a1a1a, 0.8); btnBg.lineStyle(2, 0xffffff, 1);
    btnBg.fillRoundedRect(-25, -20, 50, 40, 5); btnBg.strokeRoundedRect(-25, -20, 50, 40, 5);
    const btnText = this.add.text(0, 0, 'II', {
      fontFamily: 'MedievalSharp, serif', fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);
    const pauseContainer = this.add.container(x, y + 20, [btnBg, btnText]).setSize(50, 40).setScrollFactor(0).setInteractive();
    pauseContainer.on('pointerover', () => btnText.setFill('#ffff00'));
    pauseContainer.on('pointerout', () => btnText.setFill('#ffffff'));
    pauseContainer.on('pointerdown', () => {
      this.buttonPress.play();
      this.player.stopSounds();

      if (this.music) this.music.pause();

      this.scene.pause();
      this.scene.launch('PauseScene', { currentSceneKey: 'SecondRuneScene' });
    });
  }

  handlePlayerDeath() {
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.music.stop();
      this.showDeathScreen();
    });
  }

  showDeathScreen() {
    this.cameras.main.fadeIn(0, 0, 0, 0);

    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 1);
    bg.fillRect(0, 0, this.config.width, this.config.height);
    bg.setScrollFactor(0);
    bg.setDepth(2000);

    const title = this.add.text(centerX, centerY - 100, 'Você morreu', {
      fontFamily: 'MedievalSharp, serif', fontSize: '64px', fill: '#ff0000', stroke: '#000', strokeThickness: 4
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2001);

    const subtitle = this.add.text(centerX, centerY, 'As Runas se apagam... a escuridão prevalece.', {
      fontFamily: 'MedievalSharp, serif', fontSize: '24px', fill: '#ffffff', stroke: '#000', strokeThickness: 3
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2001);

    const btn = this.createButton(centerX, centerY + 100, 'Recomeçar', () => {
      bg.destroy();
      title.destroy();
      subtitle.destroy();
      btn.destroy();

      this.cameras.main.fadeIn(500, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
        this.scene.restart();
      });
    });

    btn.setScrollFactor(0);
    btn.setDepth(2001);
  }

  createButton(x, y, text, onClick) {
    const buttonWidth = 280; const buttonHeight = 60;
    const buttonBG = this.add.graphics().fillStyle(0x1a1a1a, 0.8).lineStyle(3, 0x555555, 1.0)
      .fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5)
      .strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5);
    const buttonText = this.add.text(0, 0, text, {
      fontFamily: 'MedievalSharp, serif', fontSize: '36px', fill: '#E0E0E0', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);
    const cont = this.add.container(x, y, [buttonBG, buttonText]).setSize(buttonWidth, buttonHeight).setInteractive();
    cont.on('pointerover', () => { this.buttonSelect.play(); buttonBG.clear().fillStyle(0x333333, 0.9).lineStyle(3, 0xaaaaaa, 1.0).fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5).strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5); buttonText.setFill('#ffffff'); });
    cont.on('pointerout', () => { this.buttonSelect.play(); buttonBG.clear().fillStyle(0x1a1a1a, 0.8).lineStyle(3, 0x555555, 1.0).fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5).strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5); buttonText.setFill('#E0E0E0'); });
    cont.on('pointerdown', () => { this.buttonPress.play(); cont.setScale(0.98); });
    cont.on('pointerup', (p) => { this.buttonPress.play(); cont.setScale(1.0); if (cont.getBounds().contains(p.x, p.y)) onClick(); });
    return cont;
  }

  showInstructionMessage() {
    const txt = this.add.text(this.config.width / 2, this.config.height / 2 - 120,
      'A Segunda Runa. As almas estão ainda mais protegidas.',
      { fontSize: '32px', fill: '#E0E0E0', fontFamily: 'MedievalSharp, serif', stroke: '#000', strokeThickness: 5, align: 'center' }
    ).setOrigin(0.5, 0.5).setScrollFactor(0);
    this.time.delayedCall(5000, () => {
      this.tweens.add({ targets: txt, alpha: 0, duration: 500, onComplete: () => txt.destroy() });
    });
  }

  startNextLevelTransition() {
    this.isTransitioning = true;
    this.player.stopSounds();
    this.music.stop();
    this.tweens.add({ targets: [this.soulIcon, this.scoreText, ...this.hearts], alpha: 0, duration: 500 });
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('ThirdRuneScene', {
        score: this.score,
        health: this.player.health
      });
    });
  }
}