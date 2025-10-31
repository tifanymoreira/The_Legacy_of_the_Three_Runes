import Phaser from "phaser";

//Classe que define a cena de carregamento
export default class PreLoadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreLoadScene' });
    }

    preload() {
        this.displayProgressBar();

        // --- Cenários ---
        // CORREÇÃO: Carregando os arquivos .jpg com os nomes corretos
        this.load.image('forest_bg', 'assets/images/floresta.jpg');
        this.load.image('menu_bg', 'assets/images/menu_fundo.jpg');
        // NOVO NÍVEL:
        this.load.image('crypt_bg', 'assets/images/crypt_bg.jpg');

        // --- Itens e Objetivos ---
        this.load.image('amulet', 'assets/images/amulet.png');
        // NOVO NÍVEL:
        this.load.image('rune', 'assets/images/rune.png');
        this.load.image('altar', 'assets/images/altar.png');

        // --- Sprite Sheets ---
        // CORREÇÃO: Usando os tamanhos de frame corretos (448x448)
        this.load.spritesheet('traveler_sheet', 'assets/images/traveler_sheet.png', {
            frameWidth: 448,
            frameHeight: 448
        });
        
        this.load.spritesheet('knight_sheet', 'assets/images/knight_sheet.png', {
            frameWidth: 448,
            frameHeight: 448
        });
        
        // --- Efeitos Sonoros (Você precisa adicionar os arquivos .mp3) ---
        // this.load.audio('music_forest', 'assets/audio/music_forest.mp3');
        // this.load.audio('music_crypt', 'assets/audio/music_crypt.mp3');
        // this.load.audio('sfx_steps', 'assets/audio/footsteps.mp3');
        // this.load.audio('sfx_rune_collect', 'assets/audio/rune_collect.mp3');
        // this.load.audio('sfx_amulet_collect', 'assets/audio/amulet_collect.mp3');
        // this.load.audio('sfx_win', 'assets/audio/win_fanfare.mp3');
    }

    create() {
        this.createAnimations();
        this.scene.start('MenuScene');
    }
    
    //------------------------------------------------------------------------
    createAnimations() {
        // Animação do Cavaleiro (Jogador)
        this.anims.create({
            key: 'knight_idle',
            frames: this.anims.generateFrameNumbers('knight_sheet', { start: 0, end: 0 }),
            frameRate: 1,
            repeat: -1
        });
        
        this.anims.create({
            key: 'knight_walk',
            frames: this.anims.generateFrameNumbers('knight_sheet', { start: 0, end: 5 }), // 6 frames
            frameRate: 8,
            repeat: -1
        });
        
        // Animação do Viajante (NPC)
        this.anims.create({
            key: 'traveler_idle',
            frames: this.anims.generateFrameNumbers('traveler_sheet', { start: 0, end: 5 }), // 6 frames de idle
            frameRate: 4, // Animação de "parado" mais sutil
            repeat: -1
        });
    }

    //Cria e exibe uma barra de progresso
    displayProgressBar() {
        const { width, height } = this.cameras.main;
        const progressBarBg = this.add.graphics();
        progressBarBg.fillStyle(0x222222, 0.8);
        progressBarBg.fillRect(width / 4 - 2, height / 2 - 12, width / 2 + 4, 24);
        const progressBar = this.add.graphics();
        const loadingText = this.add.text(
            width / 2,
            height / 2 - 30,
            'Carregando...',
            { fontSize: '20px', fill: "#ffffff", fontFamily: '"Times New Roman"' }
        ).setOrigin(0.5);
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 4, height / 2 - 10, (width / 2) * value, 20);
        });
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBarBg.destroy();
            loadingText.destroy();
        });
    }
}