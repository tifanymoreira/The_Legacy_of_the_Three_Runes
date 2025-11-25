import Phaser from 'phaser';

export default class Boss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'wizard_idle');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // =================================================================
    // CONFIGURAÇÕES DO BOSS
    // =================================================================
    this.setCollideWorldBounds(true);
    this.body.setGravityY(500);
    this.setScale(2); // Escala aumentada
    this.body.setSize(40, 80).setOffset(44, 48); 

    // Status
    this.maxHealth = 30;
    this.health = this.maxHealth;
    this.isDead = false;
    this.isInvulnerable = false;
    this.isAttacking = false;

    // IA (Temporizadores e Velocidade)
    this.nextActionTime = 0;
    this.moveSpeed = 120;
    this.chargeSpeed = 200;

    this.fireballsGroup = null; // Referência externa para projéteis

    // Áudio
    this.chargeSound = scene.sound.add('wizard_charge', { volume: 0.8 });
    this.magicSound = scene.sound.add('wizard_fire_spell', { volume: 0.6 });
    this.hurtSound = scene.sound.add('hurt_2', { volume: 1.0 });
    this.deadSound = scene.sound.add('dead', { volume: 1.0 });

    this.play('wizard_idle');
    this.on('animationcomplete', this.onAnimComplete, this);
  }

  setFireballsGroup(group) {
    this.fireballsGroup = group;
  }

  // =================================================================
  // UPDATE LOOP (INTELIGÊNCIA ARTIFICIAL)
  // =================================================================
  update(player, time) {
    if (this.isDead) return;

    // Se estiver ocupado (atacando/machucado), ignora IA
    if (this.isAttacking || this.isInvulnerable) {
      if (this.anims.currentAnim && this.anims.currentAnim.key !== 'wizard_charge') {
        if (this.body.onFloor()) this.setVelocityX(0);
      }
      return;
    }

    // 1. Orientação (Face Player)
    // ---------------------------------------------------------------
    if (player.x < this.x) {
      this.setFlipX(true); // Esquerda
    } else {
      this.setFlipX(false); // Direita
    }

    // 2. Cooldown Global de Ação
    // ---------------------------------------------------------------
    if (time < this.nextActionTime) {
      if (this.body.onFloor()) {
        this.setVelocityX(0);
        this.play('wizard_idle', true);
      }
      return;
    }

    // 3. Tomada de Decisão (Baseada em Distância e RNG)
    // ---------------------------------------------------------------
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const rand = Phaser.Math.Between(0, 100);

    if (dist < 200) {
      // Curta Distância
      if (rand < 60) this.attackFlameJet();
      else this.moveJumpAway();
    }
    else if (dist >= 200 && dist < 550) {
      // Média Distância
      if (rand < 20) this.attackCharge(player);
      else if (rand < 30) this.attackFireball(player);
    }
    else {
      // Longa Distância
      if (rand < 50) this.attackFireball(player);
      else this.moveChase(player);
    }
  }

  // =================================================================
  // MOVIMENTAÇÃO
  // =================================================================

  moveChase(player) {
    const dir = player.x < this.x ? -1 : 1;
    this.setVelocityX(dir * this.moveSpeed);
    this.play('wizard_walk', true);
    this.nextActionTime = this.scene.time.now + 1500;
  }

  moveJumpAway() {
    const jumpDir = this.flipX ? 1 : -1;
    this.setVelocity(jumpDir * 250, -550);
    this.play('wizard_jump');
    this.nextActionTime = this.scene.time.now + 2000;
  }

  // =================================================================
  // HABILIDADES E ATAQUES
  // =================================================================

  attackFireball(player) {
    this.startAttack('wizard_fireball');
    this.setVelocityX(0);

    // Delay para sincronizar com a animação de lançamento
    this.scene.time.delayedCall(400, () => {
      if (this.isDead || !this.fireballsGroup) return;

      this.magicSound.play();

      const fireball = this.fireballsGroup.create(this.x, this.y - 20, 'wizard_charge');

      if (fireball) {
        fireball.play('wizard_charge'); 
        fireball.body.setAllowGravity(false);
        fireball.body.setCircle(30); 
        fireball.setScale(1.5);

        // Mira no jogador
        const angle = Phaser.Math.Angle.Between(this.x, this.y - 20, player.x, player.y);
        this.scene.physics.velocityFromRotation(angle, 450, fireball.body.velocity);
        fireball.rotation = angle;
      }
    });

    this.nextActionTime = this.scene.time.now + 2500;
  }

  attackCharge(player) {
    this.isAttacking = true;
    this.play('wizard_idle');
    this.setVelocityX(0);
    this.setTint(0xffaa00); // Aviso visual (Telegraph)

    this.scene.time.delayedCall(500, () => {
      if (this.isDead) return;
      this.clearTint();
      this.play('wizard_charge');
      this.chargeSound.play();

      const dir = this.flipX ? -1 : 1;
      this.setVelocityX(dir * this.chargeSpeed);
    });

    this.nextActionTime = this.scene.time.now + 3000;
  }

  attackFlameJet() {
    this.startAttack('wizard_flame');
    this.setVelocityX(0);
    this.nextActionTime = this.scene.time.now + 2000;
  }

  startAttack(animKey) {
    this.isAttacking = true;
    this.play(animKey);
  }

  onAnimComplete(animation) {
    if (this.isDead) return;

    if (animation.key === 'wizard_charge') {
      this.chargeSound.stop();
    }

    // Retorna para Idle após ações
    if (['wizard_fireball', 'wizard_flame', 'wizard_hurt', 'wizard_charge'].includes(animation.key)) {
      this.isAttacking = false;
      this.play('wizard_idle', true);
    }
  }

  // =================================================================
  // DANO E MORTE
  // =================================================================

  takeDamage(amount) {
    if (this.isDead || this.isInvulnerable) return;

    this.health -= amount;
    this.scene.events.emit('boss-health-changed', this.health);

    this.chargeSound.stop();
    this.setTint(0xff0000);
    this.isInvulnerable = true;
    this.setVelocityX(0);

    if (this.health <= 0) {
      this.die();
      return;
    }

    this.isAttacking = false;
    this.play('wizard_hurt');
    this.hurtSound.play();

    this.scene.time.delayedCall(400, () => {
      if (!this.isDead) {
        this.clearTint();
        this.isInvulnerable = false;
      }
    });
  }

  die() {
    this.isDead = true;
    this.health = 0;
    this.setVelocity(0, 0);
    this.chargeSound.stop();
    this.body.checkCollision.none = true;
    this.play('wizard_dead');
    this.deadSound.play();

    this.scene.events.emit('boss-died');
  }
}