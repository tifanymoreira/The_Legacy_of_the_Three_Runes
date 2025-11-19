import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {

  constructor() {
    super({ key: 'MenuScene' });
    this.controlsModal = null; // Container para o modal
  }

  create() {
    // 1. Adicionar o background e música
    this.add.image(
      this.cameras.main.width * 0.5,
      this.cameras.main.height * 0.5,
      'menu_background'
    ).setDisplaySize(this.cameras.main.width, this.cameras.main.height);

    // Toca a música de ambiente em loop
    this.menuSound = this.sound.add('menu_sound', { loop: true, volume: 0.5 });
    this.menuSound.play();


    this.buttonSelect = this.sound.add('button_select', { loop: false, volume: 0.5 })
    this.buttonPress = this.sound.add('button_press', { loop: false, volume: 0.5 })


    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // 2. Botão "Começar"
    this.createButton(
      centerX,
      centerY - 50,
      'Começar',
      this.startGame.bind(this)
    );

    // 3. Botão "Controles"
    this.createButton(
      centerX,
      centerY + 30,
      'Controles',
      this.showControlsModal.bind(this)
    );
  }

  /**
   * Inicia a transição para a cena de Introdução
   */
  startGame() {
    if (this.controlsModal) {
      return
    }

    if (this.menuSound) this.menuSound.stop();
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('IntroductionScene');
    });
  }

  /**
   * Cria um botão customizado no estilo medieval
   * @param {number} x - Posição X central
   * @param {number} y - Posição Y central
   * @param {string} text - Texto do botão
   * @param {function} onClick - Função a ser chamada no clique
   */
  createButton(x, y, text, onClick) {
    const buttonWidth = 280;
    const buttonHeight = 60;

    const bgColor = 0x1a1a1a;
    const strokeColor = 0x555555;
    const textColor = '#E0E0E0';

    const hoverBgColor = 0x333333;
    const hoverStrokeColor = 0xaaaaaa;
    const hoverTextColor = '#ffffff';

    const buttonBG = this.add.graphics()
      .fillStyle(bgColor, 0.8)
      .lineStyle(3, strokeColor, 1.0)
      .fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5)
      .strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5);

    const buttonText = this.add.text(0, 0, text, {
      fontFamily: 'MedievalSharp, serif',
      fontSize: '36px',
      fill: textColor,
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);

    const buttonContainer = this.add.container(x, y, [buttonBG, buttonText])
      .setSize(buttonWidth, buttonHeight)
      .setInteractive();

    buttonContainer.on('pointerover', () => {
      this.buttonSelect.play(),
        buttonBG.clear()
          .fillStyle(hoverBgColor, 0.9)
          .lineStyle(3, hoverStrokeColor, 1.0)
          .fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5)
          .strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5);
      buttonText.setFill(hoverTextColor);
    });

    buttonContainer.on('pointerout', () => {
      this.buttonSelect.play(),
        buttonBG.clear()
          .fillStyle(bgColor, 0.8)
          .lineStyle(3, strokeColor, 1.0)
          .fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5)
          .strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5);
      buttonText.setFill(textColor);
    });

    buttonContainer.on('pointerdown', () => {
      this.buttonPress.play(),
        buttonContainer.setScale(0.98);
    });

    buttonContainer.on('pointerup', (pointer) => {
      this.buttonPress.play(),
        buttonContainer.setScale(1.0);
      if (buttonContainer.getBounds().contains(pointer.x, pointer.y)) {
        onClick();
      }
    });

    return buttonContainer;
  }

  /**
   * Cria e exibe o modal de Controles
   */
  showControlsModal() {
    if (this.controlsModal) {
      this.controlsModal.destroy();
    }

    const modalWidth = 500;
    const modalHeight = 400;
    const { width: gameWidth, height: gameHeight } = this.cameras.main;

    // 1. Overlay (Fundo)
    const overlay = this.add.graphics()
      .fillStyle(0x000000, 0)
      .fillRect(0, 0, gameWidth, gameHeight)
      .setInteractive()
      .on('pointerdown', () => { });

    // 2. Painel do Modal
    const panel = this.add.graphics()
      .fillStyle(0x111111, 0.95)
      .lineStyle(4, 0x888888, 1.0)
      .fillRoundedRect(-modalWidth / 2, -modalHeight / 2, modalWidth, modalHeight, 10)
      .strokeRoundedRect(-modalWidth / 2, -modalHeight / 2, modalWidth, modalHeight, 10);

    // 3. Título
    const title = this.add.text(0, -modalHeight / 2 + 40, 'Controles', {
      fontFamily: 'MedievalSharp, serif',
      fontSize: '48px',
      fill: '#E0E0E0',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // 4. Texto dos Controles
    const controlsText = [
      '[Setas Esq/Dir]: Mover Personagem',
      '[Seta Cima]: Pular',
      '[Shift]: Correr',
      '[Espaço]: Ataque Rápido',
      '[E]: Ataque Forte',
      '[H]: Tomar Dano (Debug)'
    ].join('\n');

    const text = this.add.text(-20, 20, controlsText, {
      fontFamily: 'MedievalSharp, serif',
      fontSize: '24px',
      fill: '#cccccc',
      align: 'left',
      lineSpacing: 12
    }).setOrigin(0.5);

    // 5. Botão Fechar
    const closeButton = this.add.text(modalWidth / 2 - 30, -modalHeight / 2 + 30, 'X', {
      fontFamily: 'MedievalSharp, serif',
      fontSize: '32px',
      fill: '#aaaaaa',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5)
      .setInteractive();

    closeButton.on('pointerover', () => closeButton.setFill('#ffffff'));
    closeButton.on('pointerout', () => closeButton.setFill('#aaaaaa'));
    closeButton.on('pointerdown', () => {
      if (this.controlsModal) {
        this.controlsModal.destroy();
        this.controlsModal = null;
      }
    });

    // 6. Container do Modal
    this.controlsModal = this.add.container(
      gameWidth / 2,
      gameHeight / 2,
      [overlay, panel, title, text, closeButton]
    );
  }
}