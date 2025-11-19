import Phaser from 'phaser';

export default class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseScene' });
    }

    init(data) {
        this.currentSceneKey = data.currentSceneKey;
    }

    create() {
        // Sons (reaproveitando os carregados no PreloadScene)
        this.buttonSelect = this.sound.add('button_select', { loop: false, volume: 0.5 });
        this.buttonPress = this.sound.add('button_press', { loop: false, volume: 0.5 });

        const { width, height } = this.cameras.main;

        this.add.graphics()
            .fillStyle(0x000000, 0.7)
            .fillRect(0, 0, width, height);

        this.add.text(width / 2, height / 2 - 150, 'PAUSA', {
            fontFamily: 'MedievalSharp, serif',
            fontSize: '56px',
            fill: '#E0E0E0',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        const startY = height / 2 - 50;
        const spacing = 70;

        if (this.currentSceneKey !== "IntroductionScene") {
            this.createButton(width / 2, startY, 'Continuar', () => {
                this.scene.resume(this.currentSceneKey);
                this.scene.stop();
            });

            this.createButton(width / 2, startY + spacing, 'Reiniciar Fase', () => {

                this.scene.stop(this.currentSceneKey);
                this.scene.start(this.currentSceneKey);
                this.scene.stop();
            });

            this.createButton(width / 2, startY + (spacing * 2), 'Reiniciar Jornada', () => {
                this.scene.stop(this.currentSceneKey);
                this.scene.start('GameScene');
                this.scene.stop();
            });

            this.createButton(width / 2, startY + (spacing * 3), 'Ir para o Menu', () => {
                this.scene.stop(this.currentSceneKey);
                this.scene.start('MenuScene');
                this.scene.stop();
            });
        } else {
            this.createButton(width / 2, startY, 'Continuar', () => {
                this.scene.resume(this.currentSceneKey);
                this.scene.stop();
            });
            this.createButton(width / 2, startY + spacing, 'Ir para o Menu', () => {
                this.scene.stop(this.currentSceneKey);
                this.scene.start('MenuScene');
                this.scene.stop();
            });
        }

    }

    createButton(x, y, text, onClick) {
        const buttonWidth = 320;
        const buttonHeight = 55;

        const bgColor = 0x1a1a1a;
        const strokeColor = 0x555555;
        const textColor = '#E0E0E0';

        const hoverBgColor = 0x333333;
        const hoverStrokeColor = 0xaaaaaa;
        const hoverTextColor = '#ffffff';

        const buttonBG = this.add.graphics()
            .fillStyle(bgColor, 0.9)
            .lineStyle(3, strokeColor, 1.0)
            .fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5)
            .strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5);

        const buttonText = this.add.text(0, 0, text, {
            fontFamily: 'MedievalSharp, serif',
            fontSize: '28px',
            fill: textColor,
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5);

        const buttonContainer = this.add.container(x, y, [buttonBG, buttonText])
            .setSize(buttonWidth, buttonHeight)
            .setInteractive();

        buttonContainer.on('pointerover', () => {
            this.buttonSelect.play();
            buttonBG.clear()
                .fillStyle(hoverBgColor, 0.95)
                .lineStyle(3, hoverStrokeColor, 1.0)
                .fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5)
                .strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5);
            buttonText.setFill(hoverTextColor);
        });

        buttonContainer.on('pointerout', () => {
            buttonBG.clear()
                .fillStyle(bgColor, 0.9)
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
            buttonContainer.setScale(1.0);
            if (buttonContainer.getBounds().contains(pointer.x, pointer.y)) {
                onClick();
            }
        });

        return buttonContainer;
    }
}