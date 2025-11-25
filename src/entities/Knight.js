import Phaser from 'phaser';

export default class Knight extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, sceneKey) {
    super(scene, x, y); 

    this.scene = scene;
    this.sceneKey = sceneKey;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.init();
  }

  init() {
    this.setCollideWorldBounds(true);
    this.body.setGravityY(500);
    this.setScale(1.5);
    
    // Configura Range de Patrulha baseado na Cena
    let range = (this.sceneKey === "GameScene" ? 70 : (this.sceneKey === "SecondRuneScene" ? 30 : 50))
    console.log("range")
    console.log(range)
    
    // Hitbox
    this.body.setSize(40, 60).setOffset(44, 65);

    // =================================================================
    // CONFIGURAÇÃO DE PATRULHA
    // =================================================================
    this.startX = this.x;       
    this.patrolRange = range;      
    this.walkSpeed = 30;        

    this.isWaiting = false;     
    this.waitTime = 1000;       

    // =================================================================
    // CONFIGURAÇÃO DE COMBATE
    // =================================================================
    this.health = 3; 
    this.isDead = false;
    this.attackRange = 100;      
    this.damage = 1;
    
    this.isAttacking = false;
    this.attackCooldown = 2000; 
    this.lastAttackTime = 0;
    this.hasHitPlayer = false;

    this.direction = 1; // 1 = Direita, -1 = Esquerda

    this.on('animationcomplete', this.onAnimComplete, this);
    
    this.playAnim('knight_idle');
  }

  // =================================================================
  // UPDATE LOOP (IA)
  // =================================================================
  update(player) {
    if (this.isDead) return;

    // 1. Prioridade: Combate Ativo
    if (this.isAttacking) {
        this.setVelocityX(0); 
        this.checkAttackHitbox(player);
        return; 
    }

    // 2. Detecção de Jogador
    if (player && !player.isDead) {
        const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        const distY = Math.abs(this.y - player.y);

        // Se player estiver perto e alinhado verticalmente
        if (distToPlayer < this.attackRange && distY < 80) {
            
            if (this.scene.time.now > this.lastAttackTime) {
                this.startAttack(player);
                return;
            } else {
                // Cooldown: Encara o player e aguarda
                this.setVelocityX(0);
                this.playAnim('knight_idle', true);
                this.setFlipX(player.x < this.x);
                return;
            }
        }
    }

    // 3. Estado Padrão: Patrulha
    this.patrol();
  }

  // =================================================================
  // LÓGICA DE MOVIMENTAÇÃO (PATRULHA)
  // =================================================================
  patrol() {
    if (this.isWaiting || (this.anims.currentAnim && this.anims.currentAnim.key.includes('knight_hurt'))) {
        this.setVelocityX(0);
        return;
    }

    let shouldTurn = false;

    // A) Colisão com parede
    if (this.body.blocked.right || this.body.blocked.left) {
        shouldTurn = true;
    }

    // B) Prevenção de queda (Buracos)
    if (!this.body.onFloor() && this.body.velocity.y > 0) {
        shouldTurn = true;
    }

    // C) Limite da patrulha
    if (this.direction === 1 && this.x > (this.startX + this.patrolRange)) {
        shouldTurn = true;
    } else if (this.direction === -1 && this.x < (this.startX - this.patrolRange)) {
        shouldTurn = true;
    }

    if (shouldTurn) {
        this.startTurnWait();
    } else {
        this.setVelocityX(this.walkSpeed * this.direction);
        this.setFlipX(this.direction < 0);
        this.playAnim('knight_walk', true);
    }
  }

  startTurnWait() {
    this.isWaiting = true;
    this.setVelocityX(0);
    this.playAnim('knight_idle');

    this.scene.time.delayedCall(this.waitTime, () => {
        if (this.isDead) return;
        
        this.direction *= -1;
        this.isWaiting = false;
        this.setFlipX(this.direction < 0);
    });
  }

  // =================================================================
  // ATAQUE E DANO
  // =================================================================

  startAttack(player) {
    this.isAttacking = true;
    this.setVelocityX(0);
    this.setFlipX(player.x < this.x); // Vira para o player
    this.playAnim('knight_attack'); 
    
    this.lastAttackTime = this.scene.time.now + this.attackCooldown;
    this.hasHitPlayer = false;
  }

  checkAttackHitbox(player) {
    if (this.hasHitPlayer) return; 

    const frameIndex = this.anims.currentFrame ? this.anims.currentFrame.index : 0;

    // Hit Window: Frame 2 em diante
    if (frameIndex >= 2) { 
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        const distY = Math.abs(this.y - player.y);
        const isFacingPlayer = (this.flipX && player.x < this.x) || (!this.flipX && player.x > this.x);

        if (dist <= this.attackRange && distY < 80 && isFacingPlayer) {
            player.takeDamage(this.damage);
            this.hasHitPlayer = true; 
        }
    }
  }

  takeDamage(amount) {
    if (this.isDead) return;

    this.health -= amount;
    
    // Interrupção de IA ao receber dano
    this.isAttacking = false; 
    this.isWaiting = false;   
    this.setVelocityX(0);

    if (this.health <= 0) {
      this.die();
    } else {
      this.playAnim('knight_hurt');
      
      const knockbackDir = this.flipX ? 1 : -1;
      this.setVelocity(knockbackDir * 50, -100);
    }
  }

  die() {
    this.isDead = true;
    this.setVelocity(0, 0);
    this.body.enable = false;
    this.playAnim('knight_dead',);

    this.scene.time.delayedCall(1500, () => {
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 1000,
            onComplete: () => this.destroy()
        });
    });
  }

  // Helpers
  playAnim(animName, ignoreIfPlaying = false) {
    if (this.scene.anims.exists(animName)) {
        this.play(animName, ignoreIfPlaying);
    }
  }

  onAnimComplete(animation) {
    if (animation.key.includes('knight_attack') || animation.key.includes('knight_hurt')) {
        this.isAttacking = false;
        if (!this.isDead) {
            this.playAnim('knight_idle');
        }
    }
  }
}