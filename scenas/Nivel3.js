class Nivel3 extends Phaser.Scene {
  constructor() {
    super({ key: "Nivel3" });
    this.currentChallenge = 1;
    this.score = 0;
    this.gates = [];
    this.connections = [];
    this.tempCable = null;
    this.selectedOutput = null;
    this.completing = false;

    // Entradas fijas
    this.inputs = {
      A: { value: 1, label: "A", y: 100 },
      B: { value: 0, label: "B", y: 180 },
      C: { value: 1, label: "C", y: 260 },
      D: { value: 0, label: "D", y: 340 },
    };

    // Salidas requeridas por desafío
    this.challenges = {
      1: {
        goal: "FUEGO = 1",
        check: (vals) => vals.FUEGO === 1,
        desc: "Usando A, B, C conecta compuertas para obtener FUEGO = 1.",
      },
      2: {
        goal: "FUEGO=1, SEGURO=1",
        check: (vals) => vals.FUEGO === 1 && vals.SEGURO === 1,
        desc: "Usando A, B, C, D obtener FUEGO=1 Y SEGURO=1.",
      },
      3: {
        goal: "FUEGO=1, SEGURO=1, AUX=1",
        check: (vals) =>
          vals.FUEGO === 1 && vals.SEGURO === 1 && vals.AUX === 1,
        desc: "Desafío Final: Activa todas las señales con el mínimo de compuertas.",
      },
    };

    this.isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(
      navigator.userAgent,
    );
  }

  preload() {
    // Audio comentado por precaución si no existen los archivos
    // this.load.audio("error", "assets/sounds/error.mp3");
    // this.load.audio("success", "assets/sounds/success.mp3");
    // this.load.audio("win", "assets/sounds/win.mp3");
  }

  create() {
    this.musicManager = MusicManager.getInstance();
    this.setupEnvironment();
    this.createPanels();
    this.createInputPins();
    this.createOutputPins();
    this.createGatesPanel();
    this.showIntro();

    // Graphics para cables
    this.cablesGraphics = this.add.graphics();
    this.tempCableGraphics = this.add.graphics();

    // Timer para ayuda automática
    this.lastActionTime = this.time.now;
    this.time.addEvent({
      delay: 20000, // Cada 20 segundos
      callback: () => {
        if (this.time.now - this.lastActionTime > 15000 && !this.completing) {
          this.byteComment(
            "¿Necesitas ayuda? Pulsa el botón de ASISTENCIA TÉCNICA.",
          );
        }
      },
      loop: true,
    });
  }

  setupEnvironment() {
    // Fondo Sala de Control
    this.add.rectangle(0, 0, 1000, 500, 0x050a10).setOrigin(0);

    const g = this.add.graphics();
    // Paneles de fondo decorativos
    g.lineStyle(1, 0x4444aa, 0.2);
    for (let i = 0; i < 1000; i += 50) {
      g.moveTo(i, 0);
      g.lineTo(i, 500);
      g.moveTo(0, i);
      g.lineTo(1000, i);
    }
    g.strokePath();

    // Cañón EMP decorativo (derecha)
    this.cannonContainer = this.add.container(850, 250);
    const cannon = this.add.graphics();
    cannon.fillStyle(0x2a2a2a, 1);
    cannon.fillRect(-40, -150, 80, 300); // Base
    cannon.lineStyle(2, 0x888888, 1);
    cannon.strokeRect(-40, -150, 80, 300);

    // Bobinas de energía
    this.coils = [];
    for (let i = 0; i < 5; i++) {
      const coil = this.add.graphics();
      coil.fillStyle(0x444444, 1);
      coil.fillRect(-50, -120 + i * 50, 100, 20);
      this.coils.push(coil);
      this.cannonContainer.add(coil);
    }
    this.cannonContainer.add(cannon);
  }

  createPanels() {
    // Panel de Compuertas (Izquierda)
    const panel = this.add.graphics();
    panel.fillStyle(0x1a1a2e, 0.9);
    panel.lineStyle(2, 0x4444aa, 1);
    panel.fillRoundedRect(10, 10, 180, 480, 10);
    panel.strokeRoundedRect(10, 10, 180, 480, 10);
    this.add
      .text(100, 30, "COMPUERTAS", {
        font: "bold 16px Orbitron",
        fill: "#00FF88",
      })
      .setOrigin(0.5);

    // HUD
    this.add.text(210, 20, "PLANETA: CIPHER-9", {
      font: "12px Orbitron",
      fill: "#00FF88",
    });
    this.add.text(210, 40, "MISIÓN: ACTIVAR CAÑÓN EMP", {
      font: "12px Rajdhani",
      fill: "#FFFFFF",
    });

    this.challengeTitle = this.add
      .text(500, 30, "CIRCUITO FINAL", {
        font: "bold 18px Orbitron",
        fill: "#00FF88",
      })
      .setOrigin(0.5);
    this.scoreText = this.add
      .text(780, 20, "SCORE: 0", {
        font: "bold 16px Orbitron",
        fill: "#00FF88",
      })
      .setOrigin(1, 0);
    this.gatesCountText = this.add
      .text(780, 40, "COMPUERTAS: 0", {
        font: "14px Rajdhani",
        fill: "#FFFFFF",
      })
      .setOrigin(1, 0);

    // Botón de Ayuda / Hint
    this.hintBtn = this.createButton(
      500,
      460,
      "ASISTENCIA TÉCNICA",
      0x8800ff,
      () => this.giveHint(),
    );
  }

  giveHint() {
    const hints = {
      1: [
        {
          msg: "BYTE: Paso 1. Necesitas combinar A y C con una compuerta AND. Arrastra una compuerta AND y conecta A y C a sus entradas.",
          check: () =>
            this.gates.some(
              (g) =>
                g.type === "AND" &&
                this.connections.some(
                  (c) =>
                    c.to.gate === g &&
                    c.from.source &&
                    (c.from.source.label === "A" ||
                      c.from.source.label === "C"),
                ),
            ),
        },
        {
          msg: "BYTE: Paso 2. La señal B debe ser invertida. Conecta B a la entrada de una compuerta NOT.",
          check: () =>
            this.gates.some(
              (g) =>
                g.type === "NOT" &&
                this.connections.some(
                  (c) =>
                    c.to.gate === g &&
                    c.from.source &&
                    c.from.source.label === "B",
                ),
            ),
        },
        {
          msg: "BYTE: Paso Final. Une la salida de tu AND y la salida de tu NOT a una compuerta OR, y conecta su salida a FUEGO.",
          check: () => this.outputs.FUEGO.value === 1,
        },
      ],
      2: [
        {
          msg: "BYTE: Paso 1. FUEGO requiere que A y B sean diferentes. Conecta A y B a una compuerta XOR.",
          check: () =>
            this.gates.some(
              (g) =>
                g.type === "XOR" &&
                this.connections.some(
                  (c) =>
                    c.to.gate === g &&
                    c.from.source &&
                    (c.from.source.label === "A" ||
                      c.from.source.label === "B"),
                ),
            ),
        },
        {
          msg: "BYTE: Paso 2. Para el SEGURO, conecta B y D a una compuerta NAND (o AND + NOT).",
          check: () =>
            this.gates.some(
              (g) =>
                (g.type === "NAND" || g.type === "AND") &&
                this.connections.some(
                  (c) =>
                    c.to.gate === g &&
                    c.from.source &&
                    (c.from.source.label === "B" ||
                      c.from.source.label === "D"),
                ),
            ),
        },
        {
          msg: "BYTE: Paso 3. Conecta C y D a una compuerta OR. Luego une la salida de este OR con la salida de tu XOR usando un AND hacia FUEGO.",
          check: () => this.outputs.FUEGO.value === 1,
        },
      ],
      3: [
        {
          msg: "BYTE: Estrategia. Este circuito es complejo. Empieza resolviendo una salida a la vez.",
          check: () => this.gates.length > 0,
        },
        {
          msg: "BYTE: Consejo. Puedes conectar la salida de una compuerta a varias entradas de otras para ahorrar espacio.",
          check: () => this.connections.length > 5,
        },
        {
          msg: "BYTE: Recuerda que menos compuertas significan una mayor puntuación de eficiencia.",
          check: () =>
            this.outputs.FUEGO.value === 1 && this.outputs.SEGURO.value === 1,
        },
      ],
    };

    if (!this.hintIndex) this.hintIndex = 0;
    const currentHints = hints[this.currentChallenge];

    // Verificar si el paso actual ya se cumplió para pasar al siguiente
    if (this.hintIndex < currentHints.length - 1) {
      if (currentHints[this.hintIndex].check()) {
        this.hintIndex++;
      }
    }

    const hint = currentHints[this.hintIndex];

    Swal.fire({
      toast: true,
      position: "top",
      title: "ASISTENCIA TÉCNICA (Paso a Paso)",
      text: hint.msg,
      background: "#1A1A2E",
      color: "#00FF88",
      showConfirmButton: false,
      timer: 8000, // Aumentado a 8 segundos
    });
  }

  createInputPins() {
    Object.keys(this.inputs).forEach((key) => {
      const input = this.inputs[key];
      const container = this.add.container(210, input.y);

      const bg = this.add.graphics();
      bg.fillStyle(0x1a1a2e, 1);
      bg.fillRoundedRect(0, -20, 60, 40, 5);
      bg.lineStyle(1, 0x4444aa, 1);
      bg.strokeRoundedRect(0, -20, 60, 40, 5);

      const led = this.add.circle(10, 0, 5, input.value ? 0x00ff88 : 0x444444);
      if (input.value) {
        this.tweens.add({
          targets: led,
          alpha: 0.5,
          duration: 800,
          yoyo: true,
          repeat: -1,
        });
      }

      const txt = this.add
        .text(35, 0, `${key}=${input.value}`, {
          font: "bold 14px Orbitron",
          fill: "#FFFFFF",
        })
        .setOrigin(0.5);

      // Pin de salida del input
      const pin = this.add
        .circle(60, 0, 6, 0xdaa520)
        .setInteractive({ useHandCursor: true });
      pin.isOutput = true;
      pin.source = input;
      pin.on("pointerdown", () => this.onPinClick(pin));

      container.add([bg, led, txt, pin]);
      input.pin = pin;
    });
  }

  createOutputPins() {
    this.outputs = {
      FUEGO: { y: 150, value: 0 },
      SEGURO: { y: 250, value: 0 },
      AUX: { y: 350, value: 0 },
    };

    Object.keys(this.outputs).forEach((key) => {
      const out = this.outputs[key];
      const container = this.add.container(750, out.y);

      // Display 7 segmentos (simulado)
      const display = this.add.graphics();
      this.draw7Segment(display, 0, 0, 0); // Empieza en 0

      const label = this.add
        .text(0, -40, key, { font: "bold 12px Orbitron", fill: "#FFFFFF" })
        .setOrigin(0.5);

      // Pin de entrada de la salida
      const pin = this.add
        .circle(-40, 0, 6, 0xdaa520)
        .setInteractive({ useHandCursor: true });
      pin.isInput = true;
      pin.target = out;
      pin.on("pointerdown", () => this.onPinClick(pin));

      container.add([display, label, pin]);
      out.display = display;
      out.pin = pin;
    });
  }

  draw7Segment(g, x, y, value) {
    g.clear();
    const color = value ? 0xff0000 : 0x333333;
    const dimColor = 0x111111;

    g.fillStyle(dimColor);
    g.fillRect(x - 20, y - 30, 40, 60);

    g.lineStyle(4, color, 1);
    // Simplificado: solo dibujamos 1 o 0
    if (value === 1) {
      g.moveTo(x + 10, y - 25);
      g.lineTo(x + 10, y + 25);
    } else {
      g.strokeRect(x - 10, y - 25, 20, 50);
    }
    g.strokePath();

    if (value === 1) {
      // Brillo si está activo
      g.lineStyle(8, color, 0.2);
      g.moveTo(x + 10, y - 25);
      g.lineTo(x + 10, y + 25);
      g.strokePath();
    }
  }

  createGatesPanel() {
    const gateTypes = ["AND", "OR", "NOT", "NAND", "XOR"];
    const tooltip = this.add
      .text(100, 430, "", {
        font: "10px Rajdhani",
        fill: "#00FF88",
        align: "center",
        wordWrap: { width: 160 },
      })
      .setOrigin(0.5);

    const descriptions = {
      AND: "Salida 1 solo si AMBAS entradas son 1.",
      OR: "Salida 1 si AL MENOS UNA entrada es 1.",
      NOT: "Invierte la señal (0 -> 1, 1 -> 0).",
      NAND: "Inverso de AND. 0 solo si ambas son 1.",
      XOR: "Salida 1 solo si las entradas son DIFERENTES.",
    };

    gateTypes.forEach((type, i) => {
      const x = 100;
      const y = 80 + i * 70;
      const gateGhost = this.createVisualGate(x, y, type);
      gateGhost.setInteractive({ useHandCursor: true });
      this.input.setDraggable(gateGhost);

      gateGhost.on("pointerover", () => {
        gateGhost.setScale(1.1);
        tooltip.setText(descriptions[type]);
      });
      gateGhost.on("pointerout", () => {
        gateGhost.setScale(1.0);
        tooltip.setText("");
      });

      gateGhost.on("dragstart", (pointer) => {
        gateGhost.setAlpha(0.5);
      });

      gateGhost.on("drag", (pointer, dragX, dragY) => {
        gateGhost.x = dragX;
        gateGhost.y = dragY;
      });

      gateGhost.on("dragend", (pointer) => {
        gateGhost.setAlpha(1);
        if (gateGhost.x > 200 && gateGhost.x < 700) {
          this.addGateToCanvas(gateGhost.x, gateGhost.y, type);
        }
        // Volver a su sitio
        gateGhost.x = x;
        gateGhost.y = y;
      });
    });
  }

  createVisualGate(x, y, type) {
    const container = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0x1a1a2e, 1);
    g.lineStyle(2, 0x4444aa, 1);

    // Dibujar forma según tipo IEEE
    if (type === "AND" || type === "NAND") {
      g.beginPath();
      g.moveTo(-20, -20);
      g.lineTo(0, -20);
      g.lineTo(15, -15);
      g.lineTo(20, 0);
      g.lineTo(15, 15);
      g.lineTo(0, 20);
      g.lineTo(-20, 20);
      g.closePath();
      g.fillPath();
      g.strokePath();
      if (type === "NAND") g.strokeCircle(24, 0, 4);
    } else if (type === "OR" || type === "XOR") {
      // Forma simplificada de escudo usando arcos o elipses para mayor compatibilidad
      g.beginPath();
      g.moveTo(-20, -20);
      g.lineTo(0, -20);
      g.lineTo(20, 0);
      g.lineTo(0, 20);
      g.lineTo(-20, 20);
      g.lineTo(-10, 0);
      g.closePath();
      g.fillPath();
      g.strokePath();

      if (type === "XOR") {
        g.lineStyle(2, 0x4444aa, 1);
        g.beginPath();
        g.moveTo(-25, -20);
        g.lineTo(-15, 0);
        g.lineTo(-25, 20);
        g.strokePath();
      }
    } else if (type === "NOT") {
      g.beginPath();
      g.moveTo(-20, -20);
      g.lineTo(15, 0);
      g.lineTo(-20, 20);
      g.closePath();
      g.fillPath();
      g.strokePath();
      g.strokeCircle(19, 0, 4);
    }

    const txt = this.add
      .text(0, 0, type, { font: "bold 10px Arial", fill: "#FFFFFF" })
      .setOrigin(0.5);
    container.add([g, txt]);
    container.setSize(60, 40);
    return container;
  }

  addGateToCanvas(x, y, type) {
    const gate = {
      id: Phaser.Utils.String.UUID(),
      type: type,
      x: x,
      y: y,
      inputs: type === "NOT" ? [null] : [null, null],
      outputValue: 0,
      visual: this.createVisualGate(x, y, type),
    };

    gate.visual.setInteractive({ draggable: true });
    this.input.setDraggable(gate.visual);

    // Añadir pins interactivos a la compuerta
    const inPins = [];
    gate.inputs.forEach((_, i) => {
      const py = gate.inputs.length === 1 ? 0 : i === 0 ? -10 : 10;
      const pin = this.add
        .circle(-25, py, 5, 0xdaa520)
        .setInteractive({ useHandCursor: true });
      pin.isInput = true;
      pin.gate = gate;
      pin.inputIndex = i;
      pin.on("pointerdown", () => this.onPinClick(pin));
      gate.visual.add(pin);
      inPins.push(pin);
    });

    const outPin = this.add
      .circle(type.includes("N") || type === "NOT" ? 28 : 20, 0, 5, 0xdaa520)
      .setInteractive({ useHandCursor: true });
    outPin.isOutput = true;
    outPin.gate = gate;
    outPin.on("pointerdown", () => this.onPinClick(outPin));
    gate.visual.add(outPin);

    gate.visual.on("drag", (pointer, dragX, dragY) => {
      gate.x = dragX;
      gate.y = dragY;
      gate.visual.x = dragX;
      gate.visual.y = dragY;
      this.updateCables();
      this.lastActionTime = this.time.now;
    });

    this.gates.push(gate);
    this.updateHUD();
    this.evaluateCircuit();
    this.lastActionTime = this.time.now;
  }

  onPinClick(pin) {
    this.lastActionTime = this.time.now;
    if (!this.selectedOutput) {
      if (pin.isOutput) {
        this.selectedOutput = pin;
        this.tempCable = { start: pin };
        // Feedback visual de selección
        pin.setScale(1.5);
      }
    } else {
      if (pin.isInput) {
        // Evitar múltiples conexiones al mismo input si es necesario
        // o simplemente permitirlo y que la última mande
        const existing = this.connections.find((c) => c.to === pin);
        if (existing) {
          this.connections = this.connections.filter((c) => c !== existing);
        }

        this.connections.push({
          from: this.selectedOutput,
          to: pin,
        });
        this.selectedOutput.setScale(1);
        this.selectedOutput = null;
        this.tempCable = null;
        this.evaluateCircuit();
      } else {
        // Si hace clic en otra salida, cambiar la selección
        if (pin.isOutput) {
          this.selectedOutput.setScale(1);
          this.selectedOutput = pin;
          this.tempCable = { start: pin };
          pin.setScale(1.5);
        } else {
          this.selectedOutput.setScale(1);
          this.selectedOutput = null;
          this.tempCable = null;
        }
      }
    }
  }

  evaluateCircuit() {
    // Reset values
    this.gates.forEach((g) => (g.outputValue = 0));
    Object.keys(this.outputs).forEach((k) => (this.outputs[k].value = 0));

    // Propagación simple: repetimos N veces para asegurar que la señal llegue
    for (let n = 0; n < this.gates.length + 1; n++) {
      this.gates.forEach((gate) => {
        const inputVals = gate.inputs.map((_, i) => {
          const conn = this.connections.find(
            (c) =>
              (c.to.gate === gate && c.to.inputIndex === i) ||
              (c.to.isInput && c.to.target && !c.to.gate),
          );
          // Buscar qué pin de salida está conectado a este input
          const connection = this.connections.find(
            (c) => c.to.gate === gate && c.to.inputIndex === i,
          );
          if (connection) {
            if (connection.from.source) return connection.from.source.value;
            if (connection.from.gate) return connection.from.gate.outputValue;
          }
          return 0;
        });

        gate.outputValue = this.computeLogic(gate.type, inputVals);
      });

      // Actualizar salidas finales
      Object.keys(this.outputs).forEach((key) => {
        const out = this.outputs[key];
        const connection = this.connections.find((c) => c.to.target === out);
        if (connection) {
          out.value = connection.from.source
            ? connection.from.source.value
            : connection.from.gate.outputValue;
        }
      });
    }

    this.updateVisuals();
    this.checkVictory();
  }

  computeLogic(type, inputs) {
    switch (type) {
      case "AND":
        return inputs[0] && inputs[1] ? 1 : 0;
      case "OR":
        return inputs[0] || inputs[1] ? 1 : 0;
      case "NOT":
        return inputs[0] ? 0 : 1;
      case "NAND":
        return !(inputs[0] && inputs[1]) ? 1 : 0;
      case "XOR":
        return inputs[0] !== inputs[1] ? 1 : 0;
      default:
        return 0;
    }
  }

  updateVisuals() {
    // Actualizar displays
    Object.keys(this.outputs).forEach((key) => {
      const out = this.outputs[key];
      this.draw7Segment(out.display, 0, 0, out.value);
    });

    // Actualizar cables
    this.updateCables();
  }

  updateCables() {
    this.cablesGraphics.clear();
    this.connections.forEach((conn) => {
      const startPos = this.getPinWorldPos(conn.from);
      const endPos = this.getPinWorldPos(conn.to);

      const value = conn.from.source
        ? conn.from.source.value
        : conn.from.gate.outputValue;
      const color = value ? 0x00ff88 : 0x444444;

      this.cablesGraphics.lineStyle(3, color, 1);
      this.drawStepLine(
        this.cablesGraphics,
        startPos.x,
        startPos.y,
        endPos.x,
        endPos.y,
      );

      if (value) {
        // Animación de flujo
        const t = (this.time.now % 1000) / 1000;
        this.cablesGraphics.fillStyle(0xffffff, 0.8);
        const dashPos = this.getStepLinePoint(
          startPos.x,
          startPos.y,
          endPos.x,
          endPos.y,
          t,
        );
        this.cablesGraphics.fillCircle(dashPos.x, dashPos.y, 2);
      }
    });
  }

  getPinWorldPos(pin) {
    if (pin.gate) {
      return {
        x: pin.gate.visual.x + pin.x,
        y: pin.gate.visual.y + pin.y,
      };
    }
    // Pin de entrada o salida fija (usamos las coordenadas locales + las del contenedor padre)
    if (pin.parentContainer) {
      return {
        x: pin.parentContainer.x + pin.x,
        y: pin.parentContainer.y + pin.y,
      };
    }
    return { x: pin.x, y: pin.y };
  }

  drawStepLine(g, x1, y1, x2, y2) {
    const midX = x1 + (x2 - x1) / 2;
    g.moveTo(x1, y1);
    g.lineTo(midX, y1);
    g.lineTo(midX, y2);
    g.lineTo(x2, y2);
    g.strokePath();
  }

  getStepLinePoint(x1, y1, x2, y2, t) {
    const midX = x1 + (x2 - x1) / 2;
    const d1 = Math.abs(midX - x1);
    const d2 = Math.abs(y2 - y1);
    const d3 = Math.abs(x2 - midX);
    const total = d1 + d2 + d3;

    let progress = t * total;
    if (progress < d1)
      return { x: x1 + (midX > x1 ? progress : -progress), y: y1 };
    progress -= d1;
    if (progress < d2)
      return { x: midX, y: y1 + (y2 > y1 ? progress : -progress) };
    progress -= d2;
    return { x: midX + (x2 > midX ? progress : -progress), y: y2 };
  }

  updateHUD() {
    this.scoreText.setText(`PUNTAJE: ${this.score}`);
    this.gatesCountText.setText(`COMPUERTAS: ${this.gates.length}`);
  }

  createButton(x, y, label, color, callback) {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(color, 0.8);
    bg.fillRoundedRect(-75, -20, 150, 40, 10);
    bg.lineStyle(2, 0x00ff88, 0.5);
    bg.strokeRoundedRect(-75, -20, 150, 40, 10);
    const txt = this.add
      .text(0, 0, label, { font: "bold 11px Orbitron", fill: "#ffffff" })
      .setOrigin(0.5);
    btn.add([bg, txt]);
    btn.setSize(150, 40);
    btn.setInteractive({ useHandCursor: true });
    btn.on("pointerdown", () => {
      bg.clear()
        .fillStyle(0x00ff88, 0.8)
        .fillRoundedRect(-75, -20, 150, 40, 10);
      this.time.delayedCall(100, () => {
        bg.clear()
          .fillStyle(color, 0.8)
          .fillRoundedRect(-75, -20, 150, 40, 10)
          .lineStyle(2, 0x00ff88, 0.5)
          .strokeRoundedRect(-75, -20, 150, 40, 10);
      });
      callback();
    });
    return btn;
  }

  async showIntro() {
    await Swal.fire({
      title: "NÚCLEO DE VOID: DESAFÍO FINAL",
      html: `<div style="text-align: left; color: #fff; font-family: Rajdhani;">
                <p><strong>LYRA:</strong> Este es el momento. El núcleo de VOID está expuesto. Necesitamos activar el cañón EMP ahora mismo.</p>
                <p><strong>MISIÓN:</strong> Conecta las señales A, B y C para activar la salida <strong>FUEGO</strong>. Si te bloqueas, usa el botón de asistencia.</p>
            </div>`,
      background: "#050A10",
      confirmButtonText: "ACTIVAR CAÑÓN",
      customClass: {
        popup: "custom-popup-class",
        title: "custom-title-class",
        confirmButton: "custom-confirm-button-class",
      },
    });
  }

  byteComment(t) {
    Swal.fire({
      toast: true,
      position: "top-end",
      title: "NOTIFICACIÓN",
      text: t,
      showConfirmButton: false,
      timer: 2500,
      background: "#0A0A1A",
      color: "#00FF88",
    });
  }

  checkVictory() {
    const challenge = this.challenges[this.currentChallenge];
    const vals = {
      FUEGO: this.outputs.FUEGO.value,
      SEGURO: this.outputs.SEGURO.value,
      AUX: this.outputs.AUX.value,
    };

    if (challenge.check(vals)) {
      this.handleChallengeComplete();
    }
  }

  handleChallengeComplete() {
    // Evitar múltiples llamadas
    if (this.completing) return;
    this.completing = true;

    this.score += 500; // Unificar puntaje
    this.updateHUD();

    Swal.fire({
      title: "¡SEÑAL ACTIVADA!",
      text: "¡NÚCLEO DESTRUIDO!",
      icon: "success",
      background: "#050A10",
      confirmButtonText: "FINALIZAR MISIÓN",
    }).then(() => {
      this.completing = false;
      this.victorySequence();
    });
  }

  resetCanvas() {
    this.gates.forEach((g) => g.visual.destroy());
    this.gates = [];
    this.connections = [];
    this.evaluateCircuit();
  }

  victorySequence() {
    // Animación del cañón
    this.coils.forEach((coil, i) => {
      this.tweens.add({
        targets: coil,
        alpha: 0.2,
        duration: 100,
        repeat: 10,
        yoyo: true,
        onStart: () =>
          coil
            .clear()
            .fillStyle(0x00ff88)
            .fillRect(-50, -120 + i * 50, 100, 20),
      });
    });

    this.time.delayedCall(1500, () => {
      const ray = this.add.graphics();
      ray.lineStyle(20, 0xffffff, 1);
      ray.moveTo(850, 250);
      ray.lineTo(-100, 250);
      ray.strokePath();
      this.cameras.main.shake(500, 0.05);

      this.time.delayedCall(1000, () => {
        this.scene.start("scenaVideo4");
      });
    });
  }

  update() {
    this.updateCables();

    // Animación de cable temporal si existe
    if (this.tempCable && this.selectedOutput) {
      this.tempCableGraphics.clear();
      this.tempCableGraphics.lineStyle(2, 0xdaa520, 0.5);
      const start = this.getPinWorldPos(this.selectedOutput);
      const pointer = this.input.activePointer;
      this.drawStepLine(
        this.tempCableGraphics,
        start.x,
        start.y,
        pointer.x,
        pointer.y,
      );
    } else {
      this.tempCableGraphics.clear();
    }
  }
}

window.Nivel3 = Nivel3;
