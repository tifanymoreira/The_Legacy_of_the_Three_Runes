import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player_idle');

    // Inicialização na Cena e Física
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // =================================================================
    // CONFIGURAÇÕES DE FÍSICA E PROPRIEDADES
    // =================================================================
    this.gravity = 500;
    this.speed = 200;
    this.runSpeed = 350;
    this.jumpForce = 520;
    
    this.body.setGravityY(this.gravity);
    this.setCollideWorldBounds(true);
    this.setScale(1.5);
    
    // Ajuste da Hitbox (Caixa de Colisão)
    this.body.setSize(50, 100).setOffset(30, 28);

    // Estado do Jogador
    this.health = 6;
    this.isDead = false;
    this.wasInAir = false;

    // =================================================================
    // SISTEMA DE COMBATE
    // =================================================================
    this.attackDamage = 1;       
    this.hitEnemies = [];        
    this.isAttacking = false;    
    this.attackRange = 140;      

    // Controles (Input)
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.shiftKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.eKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Efeitos Sonoros
    this.walkSound = scene.sound.add('walking', { loop: true, volume: 0.5 });
    this.runSound = scene.sound.add('running', { loop: true, volume: 0.5 });
    this.jumpSound = scene.sound.add('jumping', { volume: 1.0 });
    this.landingSound = scene.sound.add('landing', { volume: 0.7 });
    this.sword1Sound = scene.sound.add('sword_1');
    this.sword2Sound = scene.sound.add('sword_2');
    this.hurtSound = scene.sound.add('hurt');
    this.deadSound = scene.sound.add('dead');

    this.on('animationcomplete', this.onAnimComplete, this);

    this.play('anim_idle', true);
  }

  // =================================================================
  // UPDATE LOOP
  // =================================================================
  update() {
    if (this.isDead) return;

    // 1. Verificação de Input e Estado do Solo
    // ---------------------------------------------------------------
    const { left, right, up } = this.cursors;
    const isShiftDown = this.shiftKey.isDown;
    const onFloor = this.body.onFloor();
    
    // Detecção de aterrissagem para SFX
    if (onFloor && this.wasInAir) {
      if (!Phaser.Input.Keyboard.JustDown(up)) { 
         this.landingSound.play();
      }
    }
    this.wasInAir = !onFloor;

    // 2. Bloqueio de Ações (Ataque/Dano travam movimento)
    // ---------------------------------------------------------------
    const currentAnim = this.anims.currentAnim ? this.anims.currentAnim.key : '';
    const isBusy = (currentAnim.includes('attack') || currentAnim.includes('hurt'));

    if (isBusy) {
      this.setVelocityX(0); 
      this.walkSound.stop();
      this.runSound.stop();
      return; 
    }

    // Input de Ataque
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.startAttack('anim_attack1', 1); 
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.startAttack('anim_attack2', 2); 
      return;
    }

    // 3. Movimentação Horizontal
    // ---------------------------------------------------------------
    const currentSpeed = isShiftDown ? this.runSpeed : this.speed;

    if (left.isDown) {
      this.setVelocityX(-currentSpeed);
      this.setFlipX(true); 
    } else if (right.isDown) {
      this.setVelocityX(currentSpeed);
      this.setFlipX(false); 
    } else {
      this.setVelocityX(0);
    }

    // 4. Pulo
    // ---------------------------------------------------------------
    if (Phaser.Input.Keyboard.JustDown(up) && onFloor) {
      this.setVelocityY(-this.jumpForce);
      this.jumpSound.play();
    }

    // 5. Gerenciamento de Animações e Sons de Passos
    // ---------------------------------------------------------------
    if (onFloor) {
      if (this.body.velocity.x !== 0) {
        this.play(isShiftDown ? 'anim_run' : 'anim_walk', true);
        if (isShiftDown) {
          if (!this.runSound.isPlaying) this.runSound.play();
          this.walkSound.stop();
        } else {
          if (!this.walkSound.isPlaying) this.walkSound.play();
          this.runSound.stop();
        }
      } else {
        this.play('anim_idle', true);
        this.walkSound.stop();
        this.runSound.stop();
      }
    } else {
      this.play('anim_jump', true);
      this.walkSound.stop();
      this.runSound.stop();
    }
  }

  // =================================================================
  // MÉTODOS DE COMBATE
  // =================================================================

  startAttack(animKey, damage) {
    this.setVelocityX(0);
    this.isAttacking = true;
    this.attackDamage = damage;
    this.hitEnemies = []; // Reseta lista de inimigos atingidos neste golpe
    
    this.play(animKey);
    
    if (animKey === 'anim_attack1') this.sword1Sound.play();
    else this.sword2Sound.play();
  }

  // Define frames específicos onde o dano é válido (Hit Window)
  isFrameActive() {
    const anim = this.anims.currentAnim;
    if (!anim) return false;
    
    const frame = this.anims.currentFrame.index;
   
    if (anim.key === 'anim_attack1') {
        return frame >= 3 && frame <= 8;
    }
    
    if (anim.key === 'anim_attack2') {
        return frame >= 1 && frame <= 4;
    }

    return false;
  }

  registerHit(enemy) {
    this.hitEnemies.push(enemy);
  }

  hasHit(enemy) {
    return this.hitEnemies.includes(enemy);
  }

  // =================================================================
  // DANO E MORTE
  // =================================================================

  takeDamage(amount) {
    if (this.isDead) return;

    this.health -= amount;
    if (this.health < 0) this.health = 0;

    this.scene.events.emit('player-health-changed', this.health);

    if (this.health === 0) {
      this.die();
    } else {
      this.hurtSound.play();
      this.play('anim_hurt');
      
      // Knockback ao receber dano
      const knockbackDir = this.flipX ? 1 : -1;
      this.setVelocity(knockbackDir * 150, -150);
      
      // Feedback visual (piscada)
      this.scene.tweens.add({
        targets: this, alpha: 0.5, duration: 100, yoyo: true, repeat: 3
      });
    }
  }

  die() {
    this.isDead = true;
    this.deadSound.play();
    this.setVelocity(0, 0);
    this.play('anim_dead', true);
    this.body.enable = false;
    this.stopSounds();

    this.once('animationcomplete', (anim) => {
        if (anim.key === 'anim_dead') {
            this.scene.events.emit('player-died');
        }
    });
  }

  stopSounds() {
      this.walkSound.stop();
      this.runSound.stop();
  }

  onAnimComplete(animation) {
    // Retorna para Idle após ataques ou dano
    if (animation.key.includes('attack') || animation.key.includes('hurt')) {
        this.isAttacking = false;
        if (!this.isDead) {
            this.play('anim_idle', true);
        }
    }
  }
}