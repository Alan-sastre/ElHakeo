class Nivel1 extends Phaser.Scene {
  constructor() {
    super({ key: "Nivel1" });
    this.gridSize = 7;
    this.cellSize = 55;
    this.gridOffset = { x: 310, y: 70 };
    this.dronePos = { x: 0, y: 6 };
    this.droneDir = 0;
    this.nodes = [
      { x: 2, y: 4, scanned: false },
      { x: 4, y: 2, scanned: false },
      { x: 6, y: 4, scanned: false },
      { x: 3, y: 1, scanned: false },
    ];
    this.walls = [
      { x: 1, y: 3 }, { x: 3, y: 3 }, { x: 5, y: 3 },
      { x: 2, y: 1 }, { x: 4, y: 5 },
    ];
    this.score = 0;
    this.scannedCount = 0;
    this.isMoving = false;
    this.isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
  }

  preload() {}

  create() {
    this.musicManager = MusicManager.getInstance();
    this.setupBackground();
    this.createDecorativePanels();
    this.drawGrid();
    this.createDrone();
    this.createNodesAndWalls();
    this.createUI();
    this.setupControls();
    this.showIntro();
  }

  setupBackground() {
    this.add.rectangle(0, 0, 1000, 500, 0x000510).setOrigin(0);
    for (let i = 0; i < 3; i++) {
      let glow = this.add.graphics();
      glow.fillStyle(i === 0 ? 0x00ffff : 0x00ff88, 0.03);
      glow.fillCircle(Phaser.Math.Between(0, 1000), Phaser.Math.Between(0, 500), 200);
    }
    this.binaryParticles = [];
    for (let i = 0; i < 30; i++) {
      const txt = this.add.text(Phaser.Math.Between(0, 1000), Phaser.Math.Between(-500, 0),
        Phaser.Math.Between(0, 1).toString(), { font: "bold 14px Rajdhani", fill: "#00FF88", alpha: 0.2 });
      this.binaryParticles.push({ obj: txt, speed: Phaser.Math.Between(1, 3) });
    }
    this.scanLine = this.add.rectangle(0, 0, 1000, 2, 0x00ff88, 0.1).setOrigin(0);
    this.tweens.add({ targets: this.scanLine, y: 500, duration: 4000, repeat: -1 });
  }

  createDecorativePanels() {
    const createPanel = (x, y, w, h, title) => {
      const g = this.add.graphics();
      g.fillStyle(0x0a0a1a, 0.7);
      g.lineStyle(2, 0x00ff88, 0.3);
      g.fillRoundedRect(x, y, w, h, 10);
      g.strokeRoundedRect(x, y, w, h, 10);
      this.add.text(x + w / 2, y + 15, title, { font: "bold 11px Orbitron", fill: "#00FF88" }).setOrigin(0.5);
      g.lineStyle(1, 0x00ff88, 0.1);
      for (let i = 35; i < h; i += 20) {
        g.moveTo(x + 10, y + i); g.lineTo(x + w - 10, y + i);
      }
      g.strokePath();
      return g;
    };

    createPanel(20, 20, 220, 140, "DIAGNÓSTICO SISTEMA");
    createPanel(20, 170, 220, 140, "ESTADO DE INFECCIÓN");
    createPanel(760, 20, 220, 280, "TELEMETRÍA SATELITAL");

    this.diagTexts = [];
    for (let i = 0; i < 5; i++) {
      this.diagTexts.push(this.add.text(40, 55 + i * 20, "LOG: " + Math.random().toString(16).substr(2, 8).toUpperCase(), { font: "9px monospace", fill: "#00ff88" }));
    }
  }

  drawGrid() {
    const g = this.add.graphics();
    g.lineStyle(2, 0x00ff88, 0.15);
    const gridW = this.gridSize * this.cellSize;
    const gridH = this.gridSize * this.cellSize;
    g.lineStyle(3, 0x00ff88, 0.4);
    g.strokeRect(this.gridOffset.x - 5, this.gridOffset.y - 5, gridW + 10, gridH + 10);
    g.lineStyle(1, 0x00ff88, 0.1);
    for (let i = 0; i <= this.gridSize; i++) {
      g.moveTo(this.gridOffset.x + i * this.cellSize, this.gridOffset.y);
      g.lineTo(this.gridOffset.x + i * this.cellSize, this.gridOffset.y + gridH);
      g.moveTo(this.gridOffset.x, this.gridOffset.y + i * this.cellSize);
      g.lineTo(this.gridOffset.x + gridW, this.gridOffset.y + i * this.cellSize);
    }
    g.strokePath();
    for (let i = 0; i <= this.gridSize; i++) {
      for (let j = 0; j <= this.gridSize; j++) {
        this.add.circle(this.gridOffset.x + i * this.cellSize, this.gridOffset.y + j * this.cellSize, 1, 0x00ff88, 0.5);
      }
    }
  }

  createDrone() {
    this.droneContainer = this.add.container(
      this.gridOffset.x + (this.dronePos.x + 0.5) * this.cellSize,
      this.gridOffset.y + (this.dronePos.y + 0.5) * this.cellSize
    );

    // Contenedor interno para animaciones visuales (evita interferir con el movimiento del contenedor principal)
    this.droneVisuals = this.add.container(0, 0);
    this.droneContainer.add(this.droneVisuals);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.4);
    shadow.fillEllipse(0, 20, 40, 15);
    this.droneVisuals.add(shadow);

    const body = this.add.graphics();
    body.lineStyle(2, 0x00ffff, 0.8);
    body.fillStyle(0x222222, 1);
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = i * 60 * (Math.PI / 180);
      points.push({ x: Math.cos(angle) * 22, y: Math.sin(angle) * 22 });
    }
    body.fillPoints(points, true);
    body.strokePoints(points, true);
    this.droneVisuals.add(body);

    body.lineStyle(1, 0x00ffff, 0.3);
    body.strokeCircle(0, 0, 10);
    body.moveTo(-15, 0); body.lineTo(15, 0);
    body.strokePath();

    this.rotors = [];
    const rotorPos = [{ x: -18, y: -18 }, { x: 18, y: -18 }, { x: -18, y: 18 }, { x: 18, y: 18 }];
    rotorPos.forEach((pos) => {
      const r = this.add.graphics();
      r.lineStyle(2, 0x444444, 1);
      r.strokeCircle(pos.x, pos.y, 8);
      const blade = this.add.graphics();
      blade.lineStyle(3, 0x00ffff, 0.9);
      blade.x = pos.x; blade.y = pos.y;
      this.droneVisuals.add(r);
      this.droneVisuals.add(blade);
      this.rotors.push(blade);
    });

    this.droneLight = this.add.graphics();
    this.droneLight.fillStyle(0x00ffff, 0.15);
    this.droneLight.fillTriangle(0, 0, -30, -70, 30, -70);
    this.droneVisuals.add(this.droneLight);

    this.droneLED = this.add.circle(0, 0, 4, 0x00ff00);
    this.droneVisuals.add(this.droneLED);
    this.tweens.add({ targets: this.droneLED, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });

    // Animación de balanceo idle en el contenedor visual
    this.tweens.add({
      targets: this.droneVisuals,
      y: -5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  createNodesAndWalls() {
    this.nodeObjects = [];
    this.nodes.forEach((node) => {
      const container = this.add.container(this.gridOffset.x + (node.x + 0.5) * this.cellSize, this.gridOffset.y + (node.y + 0.5) * this.cellSize);
      const aura = this.add.graphics();
      aura.fillStyle(0xff0000, 0.2);
      aura.fillCircle(0, 0, 30);
      container.add(aura);
      this.tweens.add({ targets: aura, scale: 1.3, alpha: 0.05, duration: 800, yoyo: true, repeat: -1 });
      const cube = this.add.graphics();
      cube.lineStyle(1, 0xff0044, 0.8);
      cube.fillStyle(0x110000, 1);
      cube.fillRect(-18, -18, 36, 36);
      cube.strokeRect(-18, -18, 36, 36);
      cube.fillStyle(0x330000, 1);
      cube.fillRect(-12, -12, 24, 10);
      container.add(cube);
      node.container = container;
      node.cube = cube;
      node.aura = aura;
      this.nodeObjects.push(node);
    });

    this.walls.forEach((wall) => {
      const container = this.add.container(this.gridOffset.x + (wall.x + 0.5) * this.cellSize, this.gridOffset.y + (wall.y + 0.5) * this.cellSize);
      const bg = this.add.graphics();
      bg.fillStyle(0x330000, 0.8);
      bg.fillRect(-25, -25, 50, 50);
      bg.lineStyle(2, 0xff0044, 1);
      bg.strokeRect(-25, -25, 50, 50);
      const core = this.add.graphics();
      core.fillStyle(0xff0044, 0.3);
      core.fillCircle(0, 0, 10);
      this.tweens.add({ targets: core, scale: 1.5, alpha: 0.1, duration: 600, yoyo: true, repeat: -1 });
      const binText = this.add.text(0, 0, "1010", { font: "bold 10px monospace", fill: "#ff0044" }).setOrigin(0.5);
      container.add([bg, core, binText]);
      this.time.addEvent({
        delay: 200, loop: true,
        callback: () => { binText.text = Phaser.Math.Between(0, 1).toString() + Phaser.Math.Between(0, 1).toString(); }
      });
    });
  }

  createUI() {
    // Posiciones de texto ajustadas para evitar superposición con paneles
    this.scoreText = this.add.text(960, 310, "PUNTAJE: 0", { font: "bold 18px Orbitron", fill: "#00FF88" }).setOrigin(1, 0);
    this.progressText = this.add.text(960, 340, "NODOS: 0/4", { font: "bold 18px Rajdhani", fill: "#ffffff" }).setOrigin(1, 0);

    const centerX = 130, centerY = 405;
    const base = this.add.graphics();
    base.lineStyle(2, 0x00ff88, 0.3);
    base.fillStyle(0x001100, 0.5);
    base.fillCircle(centerX, centerY, 65);
    base.strokeCircle(centerX, centerY, 65);
    base.strokeCircle(centerX, centerY, 35);
    this.add.text(centerX, centerY - 80, "CONTROL MANUAL", { font: "bold 10px Orbitron", fill: "#00FF88" }).setOrigin(0.5);

    this.helpBtn = this.createButton(870, 445, "AYUDA / MANUAL", 0x333333, () => this.showIntro());
  }

  createButton(x, y, label, color, callback) {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(color, 0.8);
    bg.fillRoundedRect(-75, -20, 150, 40, 10);
    bg.lineStyle(2, 0x00ff88, 0.5);
    bg.strokeRoundedRect(-75, -20, 150, 40, 10);
    const txt = this.add.text(0, 0, label, { font: "bold 11px Orbitron", fill: "#ffffff" }).setOrigin(0.5);
    btn.add([bg, txt]);
    btn.setSize(150, 40);
    btn.setInteractive({ useHandCursor: true });
    btn.on("pointerdown", () => {
      bg.clear().fillStyle(0x00ff88, 0.8).fillRoundedRect(-75, -20, 150, 40, 10);
      this.time.delayedCall(100, () => {
        bg.clear().fillStyle(color, 0.8).fillRoundedRect(-75, -20, 150, 40, 10).lineStyle(2, 0x00ff88, 0.5).strokeRoundedRect(-75, -20, 150, 40, 10);
      });
      callback();
    });
    return btn;
  }

  setupControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W, down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A, right: Phaser.Input.Keyboard.KeyCodes.D
    });

    const centerX = 130, centerY = 405;
    const dist = 40;
    this.createDPadButton(centerX, centerY - dist, 0, "▲");
    this.createDPadButton(centerX + dist, centerY, 1, "▶");
    this.createDPadButton(centerX, centerY + dist, 2, "▼");
    this.createDPadButton(centerX - dist, centerY, 3, "◀");
  }

  createDPadButton(x, y, dir, label) {
    const btnContainer = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x00ff88, 0.1);
    bg.fillCircle(0, 0, 20);
    bg.lineStyle(2, 0x00ff88, 0.4);
    bg.strokeCircle(0, 0, 20);
    const txt = this.add.text(0, 0, label, { font: "bold 16px Arial", fill: "#00ff88" }).setOrigin(0.5);
    btnContainer.add([bg, txt]);
    const zone = this.add.zone(x, y, 40, 40).setInteractive({ useHandCursor: true });
    zone.on("pointerdown", () => {
      bg.clear().fillStyle(0x00ff88, 0.5).fillCircle(0, 0, 20);
      this.handleMove(dir);
    });
    zone.on("pointerup", () => {
      bg.clear().fillStyle(0x00ff88, 0.1).fillCircle(0, 0, 20).lineStyle(2, 0x00ff88, 0.4).strokeCircle(0, 0, 20);
    });
    zone.on("pointerout", () => {
      bg.clear().fillStyle(0x00ff88, 0.1).fillCircle(0, 0, 20).lineStyle(2, 0x00ff88, 0.4).strokeCircle(0, 0, 20);
    });
  }

  handleMove(dir) {
    if (this.isMoving) return;
    let nx = this.dronePos.x, ny = this.dronePos.y;
    if (dir === 0) ny--; else if (dir === 1) nx++; else if (dir === 2) ny++; else if (dir === 3) nx--;

    if (nx < 0 || nx >= this.gridSize || ny < 0 || ny >= this.gridSize || this.walls.some(w => w.x === nx && w.y === ny)) {
      this.handleCollision(); return;
    }

    this.isMoving = true;
    this.dronePos = { x: nx, y: ny };
    this.droneDir = dir;

    const trail = this.add.circle(this.droneContainer.x, this.droneContainer.y, 10, 0x00ffff, 0.3);
    this.tweens.add({ targets: trail, alpha: 0, scale: 0.1, duration: 500, onComplete: () => trail.destroy() });

    this.tweens.add({
      targets: this.droneContainer,
      x: this.gridOffset.x + (nx + 0.5) * this.cellSize,
      y: this.gridOffset.y + (ny + 0.5) * this.cellSize,
      angle: dir * 90,
      duration: 180,
      ease: "Cubic.easeOut",
      onComplete: () => {
        this.isMoving = false;
        this.scanNode();
      }
    });
  }

  handleCollision() {
    this.score = Math.max(0, this.score - 15);
    this.updateHUD();
    this.droneLED.setFillStyle(0xff0000);
    this.cameras.main.shake(150, 0.015);
    this.byteComment("ERROR DE SISTEMA: Colisión detectada. ¡Evita los virus rojos!");
    this.time.delayedCall(500, () => this.droneLED.setFillStyle(0x00ff00));
  }

  scanNode() {
    const node = this.nodes.find(n => n.x === this.dronePos.x && n.y === this.dronePos.y && !n.scanned);
    if (node) {
      node.scanned = true; this.scannedCount++; this.score += 150; this.updateHUD();
      for (let i = 0; i < 10; i++) {
        let p = this.add.circle(node.container.x, node.container.y, 3, 0x00ff88);
        this.tweens.add({
          targets: p,
          x: p.x + Phaser.Math.Between(-50, 50),
          y: p.y + Phaser.Math.Between(-50, 50),
          alpha: 0, duration: 600, onComplete: () => p.destroy()
        });
      }
      node.aura.destroy();
      node.cube.clear().lineStyle(2, 0x00ffff, 1).fillStyle(0x002222, 1).fillRect(-18, -18, 36, 36).strokeRect(-18, -18, 36, 36);
      this.byteComment(`DESINFECCIÓN EXITOSA: Nodo ${this.scannedCount}/4`);
      if (this.scannedCount === 4) this.checkVictory();
    }
  }

  updateHUD() {
    this.scoreText.setText(`PUNTAJE: ${this.score}`);
    this.progressText.setText(`NODOS: ${this.scannedCount}/4`);
  }

  async showIntro() {
    await Swal.fire({
      title: "CONTROL MANUAL: ARIA-1",
      html: `<div style="text-align: left; color: #fff; font-family: Rajdhani; line-height: 1.6;">
                <p style="color: #00FF88; font-weight: bold; border-bottom: 2px solid #00FF88; padding-bottom: 5px;">ESTADO DE LA MISIÓN: CRÍTICO</p>
                <p>La reprogramación automática falló. VOID ha tomado el control. Iniciando secuencia de anulación manual.</p>
                
                <p style="color: #00FF88; font-weight: bold; margin-top: 15px;">INSTRUCCIONES DE PILOTAJE:</p>
                <ul style="padding-left: 20px; list-style-type: square;">
                  <li>Usa el <strong>Joystick Holográfico</strong> o el <strong>Teclado (Flechas/WASD)</strong>.</li>
                  <li>Navega por la cuadrícula y <strong>desinfecta los 4 nodos</strong> moviéndote sobre ellos.</li>
                  <li>Las colisiones con las <strong>Paredes de Virus</strong> dañarán la integridad del dron.</li>
                </ul>

                <div style="background: rgba(0, 255, 136, 0.1); padding: 12px; border-radius: 8px; border: 1px solid #00FF88; margin-top: 15px;">
                  <strong style="color: #00FF88;">BYTE:</strong> "Sé rápido, piloto. ¡La infección binaria se está extendiendo!"
                </div>
            </div>`,
      background: "#0A0A1A",
      confirmButtonText: "INICIAR MISIÓN",
      customClass: { popup: "custom-popup-class", title: "custom-title-class", confirmButton: "custom-confirm-button-class" }
    });
  }

  checkVictory() {
    this.time.delayedCall(500, () => {
      Swal.fire({
        title: "MISIÓN CUMPLIDA",
        html: `<div style="color: #fff; font-family: Rajdhani; font-size: 1.2em;">ZETA: Nodos neutralizados. Integridad del sistema restaurada.<br><br><strong style="color: #00FF88;">PUNTAJE FINAL: ${this.score}</strong></div>`,
        background: "#0A0A1A", confirmButtonText: "SIGUIENTE SECTOR",
        customClass: { popup: "custom-popup-class", title: "custom-title-class", confirmButton: "custom-confirm-button-class" }
      }).then(() => this.scene.start("scenaVideo2"));
    });
  }

  byteComment(t) {
    Swal.fire({ toast: true, position: "top-end", title: "NOTIFICACIÓN", text: t, showConfirmButton: false, timer: 2500, background: "#0A0A1A", color: "#00FF88" });
  }

  update(time, delta) {
    if (this.rotors) this.rotors.forEach((r, i) => {
      r.clear().lineStyle(3, 0x00ffff, 0.9);
      const a = time * 0.025 + (i * Math.PI) / 2;
      r.moveTo(Math.cos(a) * 8, Math.sin(a) * 8); r.lineTo(Math.cos(a + Math.PI) * 8, Math.sin(a + Math.PI) * 8); r.strokePath();
    });
    this.binaryParticles.forEach((p) => {
      p.obj.y += p.speed;
      if (p.obj.y > 500) { p.obj.y = -20; p.obj.x = Phaser.Math.Between(0, 1000); }
    });
    if (time % 100 < 20) {
      this.diagTexts.forEach(t => {
        if (Math.random() > 0.95) t.text = "LOG: " + Math.random().toString(16).substr(2, 8).toUpperCase();
      });
    }
    if (!this.isMoving) {
      if (this.cursors.up.isDown || this.wasd.up.isDown) this.handleMove(0);
      else if (this.cursors.right.isDown || this.wasd.right.isDown) this.handleMove(1);
      else if (this.cursors.down.isDown || this.wasd.down.isDown) this.handleMove(2);
      else if (this.cursors.left.isDown || this.wasd.left.isDown) this.handleMove(3);
    }
  }
}

window.Nivel1 = Nivel1;
