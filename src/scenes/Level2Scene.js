import Phaser from 'phaser';

// ARQUIVO NOVO - Crie como 'Level2Scene.js' na pasta 'src/scenes/'

export default class Level2Scene extends Phaser.Scene {

    constructor(config) {
        super({ key: 'Level2Scene' }, config);
        this.config = config;
    }

    init() {
        this.cursors = null;
        this.player = null;
        this.playerSpeed = 200;
        this.altar = null;
        this.questText = null;
    }

    create() {
        // --- Efeitos e Sons ---
        this.cameras.main.fadeIn(1000, 0, 0, 0);
        // this.sound.stopAll();
        // this.sound.play('music_crypt', { loop: true, volume: 0.5 });
        
        // --- Cenário ---
        const bg = this.add.image(
            this.config.width * 0.5,
            this.config.height * 0.5,
            'crypt_bg'
        );
        bg.setScale(
            this.config.width / bg.width,
            this.config.height / bg.height
        );
        
        // --- Altar (Objetivo) ---
        this.altar = this.physics.add.sprite(this.config.width - 150, this.config.height * 0.5, 'altar');
        this.altar.setImmovable(true);
        this.altar.setScale(0.8);
        
        // --- Player (Cavaleiro) ---
        this.player = this.physics.add.sprite(
            150, this.config.height * 0.5, // Começa na esquerda
            'knight_sheet'
        );
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.35);
        this.player.body.setSize(150, 250).setOffset(150, 120);

        // --- Câmera ---
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, this.config.width, this.config.height);

        // --- UI (Texto da Quest) ---
        this.questText = this.add.text(this.config.width * 0.5, 30, 'Leve o Amuleto para o Altar de Purificação!', {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: '"Times New Roman"',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0);

        // --- Colisões ---
        this.physics.add.overlap(this.player, this.altar, this.winGame, null, this);

        // --- Controles ---
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update(time) {
        this.movePlayer();
    }

    movePlayer() {
        this.player.setVelocity(0);
        let isMoving = false;

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-this.playerSpeed);
            this.player.setFlipX(true); isMoving = true;
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(this.playerSpeed);
            this.player.setFlipX(false); isMoving = true;
        }

        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-this.playerSpeed); isMoving = true;
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(this.playerSpeed); isMoving = true;
        }

        this.player.anims.play(isMoving ? 'knight_walk' : 'knight_idle', true);
    }

    winGame(player, altar) {
        // (Tocar som de 'sfx_win')
        this.questText.setText('O Amuleto foi purificado! Você venceu!');
        
        this.physics.pause();
        this.player.anims.play('knight_idle');
        
        // Transição para a Tela de Vitória
        this.cameras.main.fadeOut(2000, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('WinScene');
        });
    }
}