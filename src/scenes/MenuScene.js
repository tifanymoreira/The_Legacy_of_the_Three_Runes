import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {

    constructor(config) {
        super({ key: 'MenuScene' }, config);
        this.config = config;
    }

    create() {
        // Efeito de fade-in
        this.cameras.main.fadeIn(1000, 0, 0, 0);
        
        // Adiciona a imagem de fundo
        const bg = this.add.image(
            this.config.width * 0.5,
            this.config.height * 0.5,
            'menu_bg'
        );
        // Ajusta a escala da imagem para cobrir a tela
        bg.setScale(
            this.config.width / bg.width,
            this.config.height / bg.height
        );

        // Título
        this.add.text(this.config.width * 0.5, 100, 'O Peregrino da Floresta Sombria', {
            fontSize: '48px',
            fill: '#FF0000',
            fontFamily: '"Times New Roman"',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Texto de Início
        const startText = this.add.text(this.config.width * 0.5, this.config.height - 100, 'Pressione Espaço para Iniciar', {
            fontSize: '32px',
            fill: '#FFFFFF',
            fontFamily: '"Times New Roman"',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Animação "pulsante"
        this.tweens.add({
            targets: startText,
            alpha: 0.2,
            ease: 'Sine.easeInOut',
            duration: 1200,
            yoyo: true,
            repeat: -1
        });

        // Inicia o jogo
        this.input.keyboard.once('keydown-SPACE', () => {
            // Efeito de fade-out
            this.cameras.main.fadeOut(1000, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start('GameScene');
            });
        });
    }
}