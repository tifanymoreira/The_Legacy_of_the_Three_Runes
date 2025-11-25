import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Boss from '../entities/Boss.js';

export default class FinalBossScene extends Phaser.Scene {

  constructor(config) {
    super({ key: 'FinalBossScene' });
    this.config = config;
  }

  init(data) {
    this.playerHealth = 12; 
    this.isGameEnded = false;
  }

  create() {
    // --- ÁUDIO ---
    this.music = this.sound.add('final_battle_ambience', { loop: true, volume: 0.5 }); 
    this.music.play();
    this.explosionSound = this.sound.add('dead', { volume: 0.5 });
    
    // Sons de UI (Adicionados para o botão de vitória)
    this.buttonSelect = this.sound.add('button_select', { loop: false, volume: 0.5 });
    this.buttonPress = this.sound.add('button_press', { loop: false, volume: 0.5 });

    // --- CENÁRIO ---
    this.createBackground();
    this.createGround(); 

    // --- JOGADOR ---
    this.player = new Player(this, 100, this.config.height - 350);
    this.player.health = this.playerHealth;
    this.player.isInvulnerable = false; 
    this.events.emit('player-health-changed', this.player.health);

    // --- BOSS ---
    this.boss = new Boss(this, this.config.width - 150, this.config.height - 380);
    
    // --- GRUPOS DE ATAQUE ---
    this.fireballs = this.physics.add.group({
        defaultKey: 'wizard_charge',
        maxSize: 20
    });
    this.boss.setFireballsGroup(this.fireballs);

    // --- COLISÕES ---
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.boss, this.ground);
    
    this.physics.add.collider(this.fireballs, this.ground, (ball) => {
        this.createExplosion(ball.x, ball.y);
        ball.destroy();
    });

    // 1. Projétil acerta Player
    this.physics.add.overlap(this.player, this.fireballs, (player, ball) => {
        if (this.player.isInvulnerable) return;

        this.createExplosion(ball.x, ball.y);
        ball.destroy();
        
        player.takeDamage(1); 
        this.triggerPlayerInvulnerability();
    });

    // --- UI ---
    this.createPlayerUI();
    this.createBossHealthBar();
    this.createPauseButton();

    // --- EVENTOS ---
    this.events.on('player-health-changed', (hp) => this.updatePlayerHealthUI(hp));
    this.events.on('player-died', () => this.handlePlayerDeath());
    this.events.on('boss-health-changed', () => this.updateBossHealthBar());
    this.events.on('boss-died', () => this.handleBossDeath());
    
    this.cameras.main.setBounds(0, 0, this.config.width, this.config.height);
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    this.events.on('resume', () => {
        if (this.music && this.music.isPaused) this.music.resume();
        if (this.player) {
            this.player.stopSounds();
            this.player.setVelocityX(0);
        }
    });
  }

  update(time, delta) {
    if (this.isGameEnded) return;

    if (this.player) this.player.update();
    if (this.boss) this.boss.update(this.player, time);

    this.checkCombatInteractions();
  }

  // ======================================================
  //                 COMBATE
  // ======================================================

  checkCombatInteractions() {
    if (!this.player || !this.boss || this.boss.isDead || this.player.isDead) return;

    // 1. PLAYER ATACA BOSS
    if (this.player.isAttacking && this.player.isFrameActive()) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y);
        if (dist < (this.player.attackRange + 40) && !this.player.hasHit(this.boss)) {
             
             const facingBoss = (this.player.flipX && this.player.x > this.boss.x) || (!this.player.flipX && this.player.x < this.boss.x);
             
             if (facingBoss) {
                 this.boss.takeDamage(this.player.attackDamage);
                 this.player.registerHit(this.boss);
             }
        }
    }

    // 2. BOSS ATACA PLAYER (Colisões Especiais)
    const bossAnim = this.boss.anims.currentAnim ? this.boss.anims.currentAnim.key : '';
    
    // Charge
    if (bossAnim === 'wizard_charge') {
        this.physics.overlap(this.player, this.boss, () => {
            if (this.player.isInvulnerable) return;

            this.player.takeDamage(1);
            const dir = this.player.x < this.boss.x ? -1 : 1;
            this.player.setVelocity(dir * 400, -200);

            this.triggerPlayerInvulnerability();
        });
    }

    // Flame Jet (Jato de Fogo)
    if (bossAnim === 'wizard_flame') {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y);
        const facingPlayer = (this.boss.flipX && this.player.x < this.boss.x) || (!this.boss.flipX && this.player.x > this.boss.x);
        
        if (dist < 180 && facingPlayer && Math.abs(this.player.y - this.boss.y) < 100) {
             if (this.player.isInvulnerable) return;

             this.player.takeDamage(1);
             this.triggerPlayerInvulnerability();
        }
    }
  }

  triggerPlayerInvulnerability() {
    this.player.isInvulnerable = true;
    this.time.delayedCall(1000, () => {
        if (this.player && !this.player.isDead) {
            this.player.isInvulnerable = false;
        }
    });
  }

  createExplosion(x, y) {
    const boom = this.add.circle(x, y, 30, 0xffaa00, 0.8);
    this.tweens.add({
        targets: boom, alpha: 0, scale: 2, duration: 300,
        onComplete: () => boom.destroy()
    });
    this.explosionSound.play();
  }

  handleBossDeath() {
    this.isGameEnded = true;
    this.music.stop();
    this.time.timeScale = 0.5; 

    this.time.delayedCall(2000, () => {
        this.time.timeScale = 1;
        this.showVictoryScreen();
    });
  }

  handlePlayerDeath() {
      this.cameras.main.fadeOut(1000, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.restart({ health: 12 }); 
      });
  }

  // ======================================================
  //                 UI E VISUAIS
  // ======================================================

  createBackground() {
    this.add.image(this.config.width * 0.5, this.config.height * 0.5, 'final_boss_background')
      .setDisplaySize(this.config.width, this.config.height);
  }

  createGround() {
    this.ground = this.add.rectangle(
      this.config.width / 2, 
      this.config.height - 230, 
      this.config.width, 
      40,
      0x00ff00 
    ).setVisible(false); 
    
    this.physics.add.existing(this.ground, true);
  }

  createBossHealthBar() {
    const x = this.config.width / 2 - 200;
    const y = 50;
    const w = 400;
    const h = 20;

    this.bossHealthBg = this.add.graphics().setScrollFactor(0);
    this.bossHealthBg.fillStyle(0x000000, 0.8);
    this.bossHealthBg.fillRect(x - 4, y - 4, w + 8, h + 8);

    this.bossHealthFill = this.add.graphics().setScrollFactor(0);
    this.updateBossHealthBar(); 

    this.add.text(this.config.width / 2, y - 30, 'Mago de Fogo', {
        fontFamily: 'MedievalSharp, serif', fontSize: '22px', fill: '#FF4500', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0);
  }

  updateBossHealthBar() {
    this.bossHealthFill.clear();
    const x = this.config.width / 2 - 200;
    const y = 50;
    const w = 400;
    const h = 20;
    
    const percentage = Math.max(0, this.boss.health / this.boss.maxHealth);
    const widthFill = w * percentage;

    let color = 0xff0000; 
    if (percentage > 0.5) color = 0xff6600; 
    if (percentage > 0.75) color = 0xffd700; 
    
    this.bossHealthFill.fillStyle(color, 1);
    this.bossHealthFill.fillRect(x, y, widthFill, h);
  }

  createPlayerUI() {
    const margin = 20; 
    const heartSpacing = 35; 
    const iconScale = 0.2;
    this.hearts = [];
    let heartX = margin;
    const heartY = margin + 20;

    for (let i = 0; i < 6; i++) {
       let heart = this.add.image(heartX, heartY, 'life').setScale(iconScale).setOrigin(0, 0.5).setScrollFactor(0);
       this.hearts.push(heart); 
       heartX += heartSpacing;
    }
  }

  updatePlayerHealthUI(currentHealth) {
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

  // --- NOVA TELA DE VITÓRIA COM BOTÃO ---
  showVictoryScreen() {
      // Fade in para suave
      this.cameras.main.fadeIn(500, 0, 0, 0);

      const centerX = this.config.width / 2;
      const centerY = this.config.height / 2;

      // Fundo escuro (quase sólido)
      const bg = this.add.graphics().setScrollFactor(0);
      bg.fillStyle(0x000000, 1);
      bg.fillRect(0, 0, this.config.width, this.config.height);
      bg.setDepth(2000);

      // Título
      this.add.text(centerX, centerY - 100, 'VITÓRIA!', {
          fontFamily: 'MedievalSharp, serif', fontSize: '64px', fill: '#FFD700', stroke: '#000', strokeThickness: 4
      }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);

      // Subtítulo
      this.add.text(centerX, centerY, 'O Legado das Três Runas foi restaurado.', {
          fontFamily: 'MedievalSharp, serif', fontSize: '24px', fill: '#ffffff', stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);

      // Botão "Voltar ao Menu"
      const btn = this.createButton(centerX, centerY + 100, 'Voltar ao Menu', () => {
          this.scene.start('MenuScene');
      });
      btn.setScrollFactor(0);
      btn.setDepth(2001);
  }

  // --- MÉTODO AUXILIAR PARA CRIAR BOTÕES ---
  createButton(x, y, text, onClick) {
    const buttonWidth = 280; const buttonHeight = 60;
    const buttonBG = this.add.graphics().fillStyle(0x1a1a1a, 0.8).lineStyle(3, 0x555555, 1.0)
      .fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 5)
      .strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 5);
    const buttonText = this.add.text(0, 0, text, {
      fontFamily: 'MedievalSharp, serif', fontSize: '28px', fill: '#E0E0E0', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);
    const cont = this.add.container(x, y, [buttonBG, buttonText]).setSize(buttonWidth, buttonHeight).setInteractive();
    
    cont.on('pointerover', () => { 
        this.buttonSelect.play(); 
        buttonBG.clear().fillStyle(0x333333, 0.9).lineStyle(3, 0xaaaaaa, 1.0).fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 5).strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 5); 
        buttonText.setFill('#ffffff'); 
    });
    cont.on('pointerout', () => { 
        this.buttonSelect.play(); 
        buttonBG.clear().fillStyle(0x1a1a1a, 0.8).lineStyle(3, 0x555555, 1.0).fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 5).strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 5); 
        buttonText.setFill('#E0E0E0'); 
    });
    cont.on('pointerdown', () => { 
        this.buttonPress.play(); 
        cont.setScale(0.98); 
    });
    cont.on('pointerup', (p) => { 
        this.buttonPress.play(); 
        cont.setScale(1.0); 
        if (cont.getBounds().contains(p.x, p.y)) onClick(); 
    });
    return cont;
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
      fontFamily: 'MedievalSharp, serif', fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);

    const pauseContainer = this.add.container(x, y + 20, [btnBg, btnText])
      .setSize(50, 40)
      .setScrollFactor(0)
      .setInteractive();

    pauseContainer.on('pointerover', () => btnText.setFill('#ffff00'));
    pauseContainer.on('pointerout', () => btnText.setFill('#ffffff'));
    pauseContainer.on('pointerdown', () => {
      if (this.music) this.music.pause();
      this.scene.pause();
      this.scene.launch('PauseScene', { currentSceneKey: 'FinalBossScene' });
    });
  }
}