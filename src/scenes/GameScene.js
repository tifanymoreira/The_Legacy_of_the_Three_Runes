import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {

    constructor(config) {
        super({ key: 'GameScene' }, config);
        this.config = config;
    }

    init() {
        this.cursors = null;
        this.player = null;
        this.playerSpeed = 200; // Aumenta a velocidade
        this.traveler = null;
        this.amulet = null;
        
        // NOVA QUEST:
        this.runes = null;
        this.runesCollected = 0;
        this.questText = null;
    }

    create() {
        // --- Efeitos e Sons ---
        this.cameras.main.fadeIn(1000, 0, 0, 0);
        // this.sound.play('music_forest', { loop: true, volume: 0.4 });
        
        // --- Cenário ---
        const bg = this.add.image(
            this.config.width * 0.5,
            this.config.height * 0.5,
            'forest_bg'
        );
        bg.setScale(
            this.config.width / bg.width,
            this.config.height / bg.height
        );
        
        // --- Amuleto (Objetivo Final) ---
        this.amulet = this.physics.add.sprite(this.config.width - 150, 150, 'amulet');
        this.amulet.setVisible(false); // Escondido até coletar as runas
        this.amulet.setScale(0.5);

        // --- Runas (Nova Quest) ---
        this.runes = this.physics.add.group();
        // Posições das 3 runas
        this.runes.create(100, 100, 'rune').setScale(0.4);
        this.runes.create(this.config.width * 0.5, this.config.height - 100, 'rune').setScale(0.4);
        this.runes.create(this.config.width - 100, this.config.height - 100, 'rune').setScale(0.4);

        // --- Viajante (NPC) ---
        this.traveler = this.physics.add.sprite(150, 350, 'traveler_sheet');
        this.traveler.setImmovable(true);
        this.traveler.anims.play('traveler_idle', true);
        this.traveler.setScale(0.35); // CORREÇÃO: Escala menor
        // CORREÇÃO: Hitbox ajustada para a nova escala
        this.traveler.body.setSize(150, 250).setOffset(150, 120);

        // --- Player (Cavaleiro) ---
        this.player = this.physics.add.sprite(
            300, 350, // Começa perto do viajante
            'knight_sheet'
        );
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.35); // CORREÇÃO: Escala menor
        // CORREÇÃO: Hitbox ajustada
        this.player.body.setSize(150, 250).setOffset(150, 120);

        // --- Câmera ---
        // CORREÇÃO: Sem "zoom" (sem lerp/suavização)
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, this.config.width, this.config.height);

        // --- UI (Texto da Quest) ---
        this.questText = this.add.text(this.config.width * 0.5, 30, 'Fale com o Viajante...', {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: '"Times New Roman"',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0); // Fixo na tela

        // --- Colisões ---
        this.physics.add.collider(this.player, this.traveler, this.startQuest, null, this);
        this.physics.add.overlap(this.player, this.runes, this.collectRune, null, this);
        this.physics.add.overlap(this.player, this.amulet, this.collectAmulet, null, this);

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
        // (Adicionar lógica de som de passos aqui)
    }

    startQuest(player, traveler) {
        if (this.runesCollected > 0) return; // Só roda a quest uma vez
        
        this.questText.setText('Viajante: "O Amuleto se quebrou! Encontre as 3 Runas para restaurá-lo!"');
        this.runesCollected = 1; // Marca a quest como iniciada (usa 1 para evitar bug)
        // (Tocar som de 'quest_start')
    }

    collectRune(player, rune) {
        if (this.runesCollected === 0) return; // Não pode coletar antes de falar com o NPC

        rune.disableBody(true, true); // Remove a runa
        this.runesCollected++;
        // (Tocar som de 'sfx_rune_collect')

        let runesLeft = 4 - this.runesCollected; // 4 porque começamos em 1
        this.questText.setText(`Runas restantes: ${runesLeft}`);

        if (runesLeft === 0) {
            this.questText.setText('As Runas foram encontradas! O Amuleto apareceu!');
            this.amulet.setVisible(true); // Revela o amuleto
            // Efeito de brilho no amuleto
            this.tweens.add({
                targets: this.amulet,
                alpha: 0.3,
                ease: 'Sine.easeInOut',
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }
    }
    
    collectAmulet(player, amulet) {
        if (!this.amulet.visible) return; // Não pode coletar se estiver invisível

        amulet.disableBody(true, true);
        this.questText.setText('Você pegou o Amuleto! Leve-o para a Cripta!');
        // (Tocar som de 'sfx_amulet_collect')
        
        this.physics.pause();
        
        // Transição para o Nível 2
        this.cameras.main.fadeOut(1500, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('Level2Scene');
        });
    }
}