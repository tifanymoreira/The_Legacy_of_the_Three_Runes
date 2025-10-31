import Phaser from 'phaser';

export default class WinScene extends Phaser.Scene {

    constructor(config) {
        super({ key: 'WinScene' }, config);
        this.config = config;
    }

    create() {
        // this.sound.stopAll();
        this.cameras.main.fadeIn(1000, 0, 0, 0);
        this.cameras.main.setBackgroundColor('#000000');
        
        // Usa o fundo do menu, escurecido
        try {
            const bg = this.add.image(
                this.config.width * 0.5,
                this.config.height * 0.5,
                'menu_bg'
            );
            bg.setScale(
                this.config.width / bg.width,
                this.config.height / bg.height
            );
            bg.setAlpha(0.3); // Bem escuro
        } catch (e) {
            console.warn("Imagem 'menu_bg' não encontrada para WinScene");
        }


        // Texto de Vitória
        this.add.text(this.config.width * 0.5, 200, 'VITÓRIA', {
            fontSize: '72px',
            fill: '#FFFF00', // Dourado
            fontFamily: '"Times New Roman"',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 8
        }).setOrigin(0.5);
        
        this.add.text(this.config.width * 0.5, 350, 'A floresta e a cripta estão a salvo... por enquanto.', {
            fontSize: '28px',
            fill: '#FFFFFF',
            fontFamily: '"Times New Roman"',
            fontStyle: 'italic',
            align: 'center',
            wordWrap: { width: this.config.width - 100 }
        }).setOrigin(0.5);

        // Texto de Reinício
        const restartText = this.add.text(this.config.width * 0.5, this.config.height - 100, 'Pressione Espaço para Jogar Novamente', {
            fontSize: '32px',
            fill: '#fff',
            fontFamily: '"Times New Roman"',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Animação "pulsante"
        this.tweens.add({
            targets: restartText,
            alpha: 0.2,
            ease: 'Sine.easeInOut',
            duration: 1200,
            yoyo: true,
            repeat: -1
        });

        // Reinicia o jogo
        this.input.keyboard.once('keydown-SPACE', () => {
            this.cameras.main.fadeOut(1000, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start('MenuScene'); // Volta para o Menu
            });
        });
    }
}