class Nivel2 extends Phaser.Scene {
  constructor() {
    super({ key: "Nivel2" });
    this.currentFragment = 0;
    this.bugsFound = 0;
    this.score = 0;
    this.totalBugs = 6;
    this.selectedLineIndex = -1;
    this.isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(
      navigator.userAgent,
    );

    this.fragments = [
      {
        title: "robot_patrulla.void",
        code: [
          { text: "funcion patrullar(robot):", type: "keyword" },
          { text: "  mientras True:          # BUG 1", type: "bug", id: 1 },
          { text: "    robot.mover_adelante()", type: "normal" },
          { text: "    robot.girar_derecha()", type: "normal" },
          { text: "    robot.girar_derecha()", type: "normal" },
          { text: "    robot.escanear()", type: "normal" },
          {
            text: "    robot.bateria = robot.bateria + 10   # BUG 2",
            type: "bug",
            id: 2,
          },
          { text: "  fin_mientras", type: "keyword" },
          { text: "fin_funcion", type: "keyword" },
        ],
        bugs: {
          1: {
            options: [
              { label: "mientras robot.activo == False", correct: false },
              { label: "mientras robot.bateria > 0", correct: true },
              { label: "mientras robot.bateria == 100", correct: false },
              { label: "mientras True and robot.id > 0", correct: false },
            ],
            correctedText: "  mientras robot.bateria > 0:",
          },
          2: {
            options: [
              { label: "robot.bateria = robot.bateria * 2", correct: false },
              { label: "robot.bateria = 100", correct: false },
              { label: "robot.bateria = robot.bateria - 10", correct: true },
              { label: "robot.bateria = robot.bateria + 1", correct: false },
            ],
            correctedText: "    robot.bateria = robot.bateria - 10",
          },
        },
      },
      {
        title: "clasificador.void",
        code: [
          { text: "funcion clasificar(dato, nivel):", type: "keyword" },
          { text: "  si nivel == 10:          # BUG 1", type: "bug", id: 1 },
          { text: "    retornar dato", type: "keyword" },
          { text: "  si dato > umbral:", type: "keyword" },
          {
            text: "    retornar clasificar(dato * 2, nivel - 1)",
            type: "normal",
          },
          { text: "  sino:", type: "keyword" },
          {
            text: "    retornar clasificar(dato / 2, nivel + 1)  # BUG 2",
            type: "bug",
            id: 2,
          },
          { text: "  fin_si", type: "keyword" },
          { text: "fin_funcion", type: "keyword" },
        ],
        bugs: {
          1: {
            options: [
              { label: "si nivel == 0", correct: true },
              { label: "si nivel == -1", correct: false },
              { label: "si nivel > 5", correct: false },
              { label: "si nivel == 100", correct: false },
            ],
            correctedText: "  si nivel == 0:",
          },
          2: {
            options: [
              {
                label: "retornar clasificar(dato / 2, nivel * 2)",
                correct: false,
              },
              {
                label: "retornar clasificar(dato / 2, nivel - 1)",
                correct: true,
              },
              {
                label: "retornar clasificar(dato + 2, nivel - 1)",
                correct: false,
              },
              {
                label: "retornar clasificar(dato / 2, nivel + 1)",
                correct: false,
              },
            ],
            correctedText: "    retornar clasificar(dato / 2, nivel - 1)",
          },
        },
      },
      {
        title: "busqueda_ruta.void",
        code: [
          {
            text: "funcion buscar_ruta(inicio, fin, visitados):",
            type: "keyword",
          },
          { text: "  si inicio == fin:", type: "keyword" },
          { text: "    retornar []", type: "keyword" },
          { text: "  visitados.agregar(fin)    # BUG 1", type: "bug", id: 1 },
          { text: "  vecinos = obtener_vecinos(inicio)", type: "normal" },
          { text: "  para cada nodo en vecinos:", type: "keyword" },
          { text: "    si nodo no está en visitados:", type: "keyword" },
          {
            text: "      ruta = buscar_ruta(nodo, fin, visitados)",
            type: "normal",
          },
          { text: "      si ruta no es nulo:", type: "keyword" },
          { text: "        retornar [inicio] + ruta", type: "keyword" },
          { text: "  retornar nulo             # BUG 2", type: "bug", id: 2 },
          { text: "fin_funcion", type: "keyword" },
        ],
        bugs: {
          1: {
            options: [
              { label: "visitados.agregar(nodo)", correct: false },
              { label: "visitados.agregar(inicio)", correct: true },
              { label: "visitados.agregar(fin)", correct: false },
              { label: "visitados.agregar(fin + 1)", correct: false },
            ],
            correctedText: "  visitados.agregar(inicio)",
          },
          2: {
            options: [
              { label: "retornar nulo (indentado 2 niveles)", correct: true },
              { label: "retornar nulo fuera de la función", correct: false },
              { label: "eliminar la línea retornar nulo", correct: false },
              { label: "mover retornar nulo al inicio", correct: false },
            ],
            correctedText: "      retornar nulo",
          },
        },
      },
    ];
  }

  preload() {
    // En un entorno real, cargaríamos sonidos aquí
    // this.load.audio("error", "assets/sounds/error.mp3");
    // this.load.audio("success", "assets/sounds/success.mp3");
    // this.load.audio("win", "assets/sounds/win.mp3");
  }

  create() {
    this.musicManager = MusicManager.getInstance();
    this.setupBackground();
    this.createIDE();
    this.createTerminal();
    this.createHUD();
    this.createSidePanel();
    this.loadFragment(0);
    this.showIntro();
  }

  setupBackground() {
    this.add.rectangle(0, 0, 1000, 500, 0x000510).setOrigin(0);

    // Partículas de código binario
    this.binaryParticles = [];
    for (let i = 0; i < 30; i++) {
      const txt = this.add.text(
        Phaser.Math.Between(0, 1000),
        Phaser.Math.Between(-500, 0),
        Phaser.Math.Between(0, 1).toString(),
        { font: "bold 14px Rajdhani", fill: "#00FF88", alpha: 0.2 },
      );
      this.binaryParticles.push({
        obj: txt,
        speed: Phaser.Math.Between(1, 3),
      });
    }

    // Efecto de glitch ocasional
    this.time.addEvent({
      delay: 3500,
      callback: () => {
        if (this.bugsFound < this.totalBugs) {
          this.cameras.main.shake(100, 0.002);
        }
      },
      loop: true,
    });
  }

  createIDE() {
    // Fondo del editor
    const editorBg = this.add.graphics();
    editorBg.fillStyle(0x0d1117, 1);
    editorBg.fillRoundedRect(50, 50, 600, 350, 10);

    // Barra superior
    editorBg.fillStyle(0x161b22, 1);
    editorBg.fillRoundedRect(50, 50, 600, 35, { tl: 10, tr: 10, bl: 0, br: 0 });

    // Círculos OS
    const colors = [0xff5f56, 0xffbd2e, 0x27c93f];
    colors.forEach((color, i) => {
      editorBg.fillStyle(color, 1);
      editorBg.fillCircle(75 + i * 20, 67, 6);
    });

    this.fileNameText = this.add
      .text(350, 67, "robot_control.void", {
        font: "14px Orbitron",
        fill: "#8B949E",
      })
      .setOrigin(0.5);

    // Columna de números de línea
    editorBg.fillStyle(0x090c10, 1);
    editorBg.fillRect(50, 85, 40, 315); // Cambiado fillRoundedRect por fillRect por compatibilidad

    this.lineNumbers = this.add.container(50, 85).setDepth(2);
    this.codeContainer = this.add.container(90, 85).setDepth(2);

    // Resaltado de línea seleccionada (fuera del contenedor que se limpia)
    this.selectionHighlight = this.add.graphics().setDepth(1);
    this.selectionHighlight.visible = false;

    // Cursor parpadeante (fuera del contenedor que se limpia)
    this.cursor = this.add.rectangle(0, 0, 2, 20, 0x58a6ff).setDepth(3);
    this.cursor.visible = false;

    this.tweens.add({
      targets: this.cursor,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  createTerminal() {
    const termBg = this.add.graphics();
    termBg.fillStyle(0x000000, 1);
    termBg.fillRect(50, 410, 600, 70);
    termBg.lineStyle(1, 0x30363d, 1);
    termBg.strokeRect(50, 410, 600, 70);

    this.terminalText = this.add.text(60, 420, "> Iniciando depurador...", {
      font: "12px monospace",
      fill: "#00FF00",
    });

    this.terminalLines = ["> Cargando robot_control.void..."];
  }

  updateTerminal(msg) {
    this.terminalLines.push("> " + msg);
    if (this.terminalLines.length > 3) this.terminalLines.shift();
    this.terminalText.setText(this.terminalLines.join("\n"));
  }

  createHUD() {
    this.add.text(20, 15, "PLANETA: CIPHER-9", {
      font: "14px Orbitron",
      fill: "#00FF88",
    });
    this.add.text(250, 15, "MISIÓN: DEPURAR CÓDIGO VOID", {
      font: "14px Rajdhani",
      fill: "#FFFFFF",
    });

    this.bugsText = this.add.text(700, 15, "BUGS: 0 / 6", {
      font: "16px Orbitron",
      fill: "#FF4444",
    });
    this.scoreText = this.add.text(850, 15, "SCORE: 0", {
      font: "16px Orbitron",
      fill: "#00FF88",
    });
    this.fragmentText = this.add.text(500, 15, "FRAGMENTO: 1/3", {
      font: "14px Rajdhani",
      fill: "#58A6FF",
    });
  }

  createSidePanel() {
    this.sidePanel = this.add.container(1000, 50);

    const bg = this.add.graphics();
    bg.fillStyle(0x0d1117, 0.95);
    bg.lineStyle(2, 0x30363d, 1);
    bg.fillRoundedRect(0, 0, 300, 430, 10);
    bg.strokeRoundedRect(0, 0, 300, 430, 10);
    this.sidePanel.add(bg);

    this.sidePanelTitle = this.add
      .text(150, 30, "CORRECCIONES DISPONIBLES", {
        font: "bold 12px Orbitron",
        fill: "#00FF88",
        align: "center",
        wordWrap: { width: 280 },
      })
      .setOrigin(0.5);
    this.sidePanel.add(this.sidePanelTitle);

    this.optionsContainer = this.add.container(0, 60);
    this.sidePanel.add(this.optionsContainer);
  }

  loadFragment(index) {
    this.currentFragment = index;
    const fragment = this.fragments[index];
    this.fileNameText.setText(fragment.title);
    this.fragmentText.setText(`FRAGMENTO: ${index + 1}/3`);

    this.lineNumbers.removeAll(true);
    this.codeContainer.removeAll(true);

    // Reposicionar highlight y cursor al inicio del fragmento
    this.selectionHighlight.visible = false;
    this.cursor.visible = false;

    this.lineObjects = [];

    fragment.code.forEach((line, i) => {
      const yPos = i * 25;

      // Número de línea
      const num = this.add
        .text(20, yPos + 12, (i + 1).toString(), {
          font: "12px monospace",
          fill: "#6E7681",
        })
        .setOrigin(0.5);
      this.lineNumbers.add(num);

      // Zona interactiva de la línea (toda la fila)
      const hitZone = this.add
        .rectangle(0, yPos, 560, 25, 0x000000, 0)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true });
      hitZone.lineIndex = i;
      this.codeContainer.add(hitZone);

      let color = "#FFFFFF";
      if (line.type === "keyword") color = "#58A6FF";

      let textObj;

      if (line.text.includes("#")) {
        const parts = line.text.split("#");
        const codePart = this.add
          .text(10, yPos + 12, parts[0], {
            font: "14px monospace",
            fill: color,
          })
          .setOrigin(0, 0.5);
        const commentPart = this.add
          .text(10 + codePart.width, yPos + 12, "#" + parts[1], {
            font: "14px monospace",
            fill: "#7EE787",
          })
          .setOrigin(0, 0.5);

        this.codeContainer.add([codePart, commentPart]);
        textObj = codePart;
      } else {
        textObj = this.add
          .text(10, yPos + 12, line.text, {
            font: "14px monospace",
            fill: color,
          })
          .setOrigin(0, 0.5);
        this.codeContainer.add(textObj);
      }

      const lineData = { textObj: textObj, data: line };
      this.lineObjects.push(lineData);

      if (line.type === "bug") {
        const dot = this.add.circle(10, yPos + 12, 4, 0xff4444);
        this.lineNumbers.add(dot);
        lineData.bugDot = dot;
      }
    });

    // Asegurar que el listener solo se registre una vez
    if (!this.inputListenerRegistered) {
      this.input.on("gameobjectdown", (pointer, obj) => {
        if (obj.lineIndex !== undefined) {
          this.selectLine(obj.lineIndex);
        }
      });
      this.inputListenerRegistered = true;
    }

    this.updateTerminal(`Analizando ${fragment.title}...`);
  }

  selectLine(index) {
    this.selectedLineIndex = index;
    const line = this.lineObjects[index];

    this.selectionHighlight.visible = true;
    this.selectionHighlight.x = 90; // Alinear con codeContainer
    this.selectionHighlight.y = 85 + index * 25;
    this.selectionHighlight.clear();
    this.selectionHighlight.fillStyle(0x1f2937, 1);
    this.selectionHighlight.fillRect(0, 0, 560, 25);

    this.cursor.visible = true;
    this.cursor.x = 90 + line.textObj.x + line.textObj.width + 5;
    this.cursor.y = 85 + index * 25 + 12;

    this.updateTerminal(`Analizando línea ${index + 1}...`);

    if (line.data.type === "bug" && !line.data.corrected) {
      this.showOptions(line.data.id);
    } else {
      this.hideSidePanel();
    }
  }

  showOptions(bugId) {
    this.optionsContainer.removeAll(true);
    const fragment = this.fragments[this.currentFragment];
    const bug = fragment.bugs[bugId];

    bug.options.forEach((opt, i) => {
      const btn = this.add.container(20, i * 80);

      const bg = this.add.graphics();
      bg.fillStyle(0x1c2333, 1);
      bg.lineStyle(1, 0x30363d, 1);
      bg.fillRoundedRect(0, 0, 260, 60, 5);
      bg.strokeRoundedRect(0, 0, 260, 60, 5);
      btn.add(bg);

      const txt = this.add
        .text(130, 30, opt.label, {
          font: "12px Rajdhani",
          fill: "#FFFFFF",
          align: "center",
          wordWrap: { width: 240 },
        })
        .setOrigin(0.5);
      btn.add(txt);

      bg.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, 260, 60),
        Phaser.Geom.Rectangle.Contains,
      );
      bg.on("pointerover", () =>
        bg.lineStyle(2, 0x58a6ff, 1).strokeRoundedRect(0, 0, 260, 60, 5),
      );
      bg.on("pointerout", () =>
        bg.lineStyle(1, 0x30363d, 1).strokeRoundedRect(0, 0, 260, 60, 5),
      );
      bg.on("pointerdown", () => this.checkCorrection(opt, bugId));

      this.optionsContainer.add(btn);
    });

    this.tweens.add({
      targets: this.sidePanel,
      x: 670,
      duration: 300,
      ease: "Back.easeOut",
    });
  }

  hideSidePanel() {
    this.tweens.add({
      targets: this.sidePanel,
      x: 1000,
      duration: 300,
      ease: "Power2",
    });
  }

  checkCorrection(option, bugId) {
    if (option.correct) {
      this.handleSuccess(bugId);
    } else {
      this.handleError();
    }
  }

  handleSuccess(bugId) {
    const line = this.lineObjects[this.selectedLineIndex];
    const bugData = this.fragments[this.currentFragment].bugs[bugId];

    line.data.corrected = true;
    line.textObj.setText(bugData.correctedText);
    line.textObj.setFill("#7EE787");
    if (line.bugDot) line.bugDot.destroy();

    this.bugsFound++;
    this.score += 150;
    this.updateHUDText();
    this.updateTerminal("Bug neutralizado. VOID pierde acceso.");

    this.hideSidePanel();

    // Verificar si fragmento completado
    const fragmentBugs = Object.values(
      this.fragments[this.currentFragment].code,
    ).filter((l) => l.type === "bug" && !l.corrected);
    if (fragmentBugs.length === 0) {
      this.handleFragmentComplete();
    }
  }

  handleError() {
    this.score = Math.max(0, this.score - 25);
    this.updateHUDText();
    this.cameras.main.shake(100, 0.01);
    this.updateTerminal("ERROR: Corrección inválida. Sistema inestable.");

    const line = this.lineObjects[this.selectedLineIndex];
    const originalColor = line.textObj.style.color;
    line.textObj.setFill("#FF4444");
    this.time.delayedCall(500, () => line.textObj.setFill(originalColor));
  }

  updateHUDText() {
    this.bugsText.setText(`BUGS: ${this.bugsFound} / 6`);
    this.scoreText.setText(`SCORE: ${this.score}`);
  }

  handleFragmentComplete() {
    this.score += 100; // Bonus por fragmento perfecto (asumiendo que llegó aquí)
    this.updateHUDText();

    let msg = "";
    if (this.currentFragment === 0)
      msg = "El robot de patrulla está limpio. VOID perdió control.";
    if (this.currentFragment === 1)
      msg = "El clasificador ya no recursa infinitamente. Bien analizado.";
    if (this.currentFragment === 2)
      msg = "El algoritmo de ruta funciona. Los robots pueden navegar.";

    this.time.delayedCall(1000, () => {
      if (this.currentFragment < 2) {
        this.loadFragment(this.currentFragment + 1);
        this.kaiComment(msg);
      } else {
        this.checkVictory();
      }
    });
  }

  async showIntro() {
    await Swal.fire({
      title: "MISIÓN: DEPURACIÓN",
      html: `<div style="text-align: left; color: #fff; font-family: Rajdhani;">
                <p><strong>KAI:</strong> VOID corrompió el código de control. Hay 3 fragmentos infectados con 2 bugs cada uno.</p>
                <p><strong>BYTE:</strong> Analiza cada línea. Haz clic en la que creas que está mal y elige la corrección lógica correcta.</p>
            </div>`,
      background: "#0D1117",
      confirmButtonText: "INICIAR DEPURACIÓN",
      customClass: {
        popup: "custom-popup-class",
        title: "custom-title-class",
        confirmButton: "custom-confirm-button-class",
      },
    });
  }

  kaiComment(text) {
    Swal.fire({
      toast: true,
      position: "top-end",
      title: "KAI",
      text: text,
      showConfirmButton: false,
      timer: 3000,
      background: "#0D1117",
      color: "#58A6FF",
    });
  }

  checkVictory() {
    Swal.fire({
      title: "¡CÓDIGO DEPURADO!",
      html: `<div style="color: #fff; font-family: Rajdhani;">
                <p><strong>KAI:</strong> Código depurado al 100%. Los robots de CIPHER-9 responden. VOID está perdiendo.</p>
                <p>Score Final: ${this.score}</p>
            </div>`,
      background: "#0D1117",
      confirmButtonText: "CONTINUAR",
      customClass: {
        popup: "custom-popup-class",
        title: "custom-title-class",
        confirmButton: "custom-confirm-button-class",
      },
    }).then(() => {
      this.scene.start("Nivel3");
    });
  }

  update() {
    // Animación sutil de los números binarios en el fondo
    this.binaryParticles.forEach((p) => {
      p.obj.y += p.speed;
      if (p.obj.y > 500) {
        p.obj.y = -20;
        p.obj.x = Phaser.Math.Between(0, 1000);
      }
    });
  }
}

window.Nivel2 = Nivel2;
