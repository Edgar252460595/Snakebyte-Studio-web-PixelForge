 // Detecta si estamos en GitHub Pages
  const isGitHub = window.location.hostname.includes("github.io");

  if (isGitHub) {
    // Oculta el header y el footer si existe
    document.addEventListener("DOMContentLoaded", () => {
      const header = document.getElementById("barraSuperior");
      const footer = document.getElementById("piePagina");

      if (header) header.style.display = "none";
      if (footer) footer.style.display = "none";
    });
  }



window.addEventListener("DOMContentLoaded", () => {

 


  // ======================
  // CONFIGURACIÓN CANVAS
  // ======================
  const gridCanvas = document.getElementById("gridCanvas"); // 🔹 canvas solo para la rejilla
const gridCtx = gridCanvas.getContext("2d");

const pixelCanvas = document.getElementById("pixelCanvas"); // 🔹 canvas principal
const ctx = pixelCanvas.getContext("2d");

const miniMap = document.getElementById("miniMap"); // 🔹 canvas minimapa
const miniCtx = miniMap.getContext("2d");

const gridInput = document.getElementById("gridSize");

  let gridSize = 16; // tamaño inicial de la grilla

  

  // 🔹 historial (para undo/redo)
  let history = [];
  let redoStack = [];
  let maxHistory = parseInt(localStorage.getItem("maxHistory")) || 50;

function drawGrid() {
  gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

  // ⚡ Ajustamos el tamaño de celda al entero más cercano
  const cellSize = Math.floor(gridCanvas.width / gridSize);

  gridCtx.beginPath();
  gridCtx.strokeStyle = "#ccc";
  gridCtx.lineWidth = 1;

  // Dibujar columnas
  for (let x = 0; x <= gridCanvas.width; x += cellSize) {
    gridCtx.moveTo(x, 0);
    gridCtx.lineTo(x, gridCanvas.height);
  }

  // Dibujar filas
  for (let y = 0; y <= gridCanvas.height; y += cellSize) {
    gridCtx.moveTo(0, y);
    gridCtx.lineTo(gridCanvas.width, y);
  }

  gridCtx.stroke();
}

// ======================
// MINIMAPA
// ======================
function updateMiniMap() {
  miniCtx.clearRect(0, 0, miniMap.width, miniMap.height);
  miniCtx.drawImage(pixelCanvas, 0, 0, miniMap.width, miniMap.height);
}

// ======================
// DIBUJO Y BORRADOR
// ======================
let isErasing = false;
let isDrawing = false;

pixelCanvas.addEventListener("mousedown", (e) => {
  const rect = pixelCanvas.getBoundingClientRect();
  const cellSize = pixelCanvas.width / gridSize;
  const x = Math.floor((e.clientX - rect.left) / cellSize);
  const y = Math.floor((e.clientY - rect.top) / cellSize);

  if (currentTool === "fill") {
    saveState(); // guardamos antes de rellenar
    bucketFill(x, y, currentColor);
    return;
  }

  // lápiz o borrador
  if (currentTool === "pencil" || currentTool === "eraser") {
    saveState();
    drawing = true;
    lastPos = null;
    drawPixel(e);
  }
});

pixelCanvas.addEventListener("mousemove", (e) => {
  if (isDrawing) drawOrErase(e);
});

pixelCanvas.addEventListener("mouseup", () => {
  isDrawing = false;
  saveState();
  updateMiniMap();
});

pixelCanvas.addEventListener("mouseleave", () => {
  isDrawing = false;
});

function drawOrErase(e) {
  const rect = pixelCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const cellSize = Math.floor(pixelCanvas.width / gridSize);
  const px = Math.floor(x / cellSize) * cellSize;
  const py = Math.floor(y / cellSize) * cellSize;

  if (isErasing) {
    ctx.clearRect(px, py, cellSize, cellSize);
  } else {
    ctx.fillStyle = currentColor;
    ctx.fillRect(px, py, cellSize, cellSize);
  }

  updateMiniMap();
}

// ======================
// INICIO
// ======================
drawGrid();
updateMiniMap();
saveState();



//==========================
/// zoom
//==========================



  // ======================
  // HISTORIAL: Save / Undo / Redo
  // ======================
  function saveState() {
    try {
      if (history.length >= maxHistory) history.shift();
      history.push(ctx.getImageData(0, 0, pixelCanvas.width, pixelCanvas.height));
      redoStack = [];
    } catch (err) {
      console.warn("saveState fallo:", err);
    }
  }

  function undo() {
    if (history.length === 0) return;
    try {
      redoStack.push(ctx.getImageData(0, 0, pixelCanvas.width, pixelCanvas.height));
      const prev = history.pop();
      ctx.putImageData(prev, 0, 0);
    } catch (err) {
      console.warn("undo fallo:", err);
    }
  }

  function redo() {
    if (redoStack.length === 0) return;
    try {
      history.push(ctx.getImageData(0, 0, pixelCanvas.width, pixelCanvas.height));
      const next = redoStack.pop();
      ctx.putImageData(next, 0, 0);
    } catch (err) {
      console.warn("redo fallo:", err);
    }
  }

  // conectar botones undo/redo
  const undoBtn = document.getElementById("undo");
  const redoBtn = document.getElementById("redo");
  if (undoBtn) undoBtn.addEventListener("click", undo);
  if (redoBtn) redoBtn.addEventListener("click", redo);


    // ======================
  // LIMPIAR LIENZO
  // ======================
  const clearBtn = document.getElementById("clearCanvas");
if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    const confirmar = confirm("⚠️ Esto borrará todo el lienzo. ¿Seguro que quieres continuar?");
    if (confirmar) {
      // Guardar el estado actual en el historial ANTES de limpiar
      saveState();

      // Limpiar el lienzo
      ctx.clearRect(0, 0, pixelCanvas.width, pixelCanvas.height);

      // Guardar el lienzo vacío como nuevo estado
      saveState();
    }
  });
}

  // ======================
  // PANEL DE CONFIGURACIÓN
  // ======================
  const historyRange = document.getElementById("historyRange");
  const historyValue = document.getElementById("historyValue");
  const saveBtn = document.getElementById("saveSettings");

  // inicializar controles
  historyRange.value = maxHistory;
  historyValue.textContent = maxHistory;

  // actualizar número en vivo
  historyRange.addEventListener("input", () => {
    historyValue.textContent = historyRange.value;
  });

  // guardar cambios
  saveBtn.addEventListener("click", () => {
    maxHistory = parseInt(historyRange.value);
    localStorage.setItem("maxHistory", maxHistory);
    alert("Configuración guardada. Nuevo límite: " + maxHistory);
  });

  // ======================
  // CAMBIO DE GRILLA CON CONFIRMACIÓN
  // ======================
  gridInput.addEventListener("change", (e) => {
  let nuevoValor = parseInt(e.target.value);

  // límites
  if (nuevoValor < 2) nuevoValor = 2;
  if (nuevoValor > 256) nuevoValor = 256;

  const canvasSize = pixelCanvas.width; // asumimos cuadrado 512x512

  // buscar divisores exactos del canvas
  let validSizes = [];
  for (let i = 1; i <= canvasSize; i++) {
    if (canvasSize % i === 0) {
      validSizes.push(i);
    }
  }

  // elegir el valor válido más cercano
  let masCercano = validSizes.reduce((a, b) =>
    Math.abs(b - nuevoValor) < Math.abs(a - nuevoValor) ? b : a
  );

  const confirmar = confirm(
    "⚠️ Cambiar el tamaño reiniciará tu dibujo. ¿Quieres continuar?"
  );
  if (confirmar) {
    gridSize = masCercano;
    e.target.value = gridSize; // actualizar input al valor válido

    // limpiar lienzo
    ctx.clearRect(0, 0, pixelCanvas.width, pixelCanvas.height);

    // reiniciar historial
    history = [];
    redoStack = [];

    // redibujar rejilla
    drawGrid();

    // guardar estado en blanco como punto inicial
    saveState();
  } else {
    // volver al valor anterior
    e.target.value = gridSize;
  }
});

drawGrid(); // dibuja la grilla al cargar
saveState(); // guardar estado inicial del canvas

  // ======================
  // MENÚ GENERAL MOVIBLE
  // ======================
  const menu = document.querySelector(".herramientasPixelForge");

  let menuIsDragging = false;
  let menuOffsetX = 0, menuOffsetY = 0;

  menu.addEventListener("mousedown", (e) => {
    menuIsDragging = true;
    menu.style.cursor = "grabbing";
    const menuRect = menu.getBoundingClientRect();
    menuOffsetX = e.pageX - (menuRect.left + window.scrollX);
    menuOffsetY = e.pageY - (menuRect.top + window.scrollY);
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!menuIsDragging) return;

    let newLeftPage = e.pageX - menuOffsetX;
    let newTopPage = e.pageY - menuOffsetY;

    // límites de ventana
    const minLeftPage = window.scrollX;
    const maxLeftPage = window.scrollX + window.innerWidth - menu.offsetWidth;
    const minTopPage = window.scrollY;
    const maxTopPage = window.scrollY + window.innerHeight - menu.offsetHeight;

    newLeftPage = Math.max(minLeftPage, Math.min(maxLeftPage, newLeftPage));
    newTopPage = Math.max(minTopPage, Math.min(maxTopPage, newTopPage));

    // convertir a coordenadas relativas al parent
    const parent = menu.offsetParent || document.body;
    const parentRect = parent.getBoundingClientRect();
    const parentLeftPage = parentRect.left + window.scrollX;
    const parentTopPage = parentRect.top + window.scrollY;

    menu.style.left = newLeftPage - parentLeftPage + "px";
    menu.style.top = newTopPage - parentTopPage + "px";
  });

  document.addEventListener("mouseup", () => {
    if (menuIsDragging) {
      menuIsDragging = false;
      menu.style.cursor = "move";
      localStorage.setItem(
        "menuPos",
        JSON.stringify({ left: menu.style.left, top: menu.style.top })
      );
    }
  });

  // Recupera posición al cargar
  window.addEventListener("load", () => {
    const savedPos = JSON.parse(localStorage.getItem("menuPos"));
    if (savedPos) {
      menu.style.left = savedPos.left;
      menu.style.top = savedPos.top;
    }
  });

  // ======================
  // MENÚ LÁPIZ MOVIBLE
  // ======================
  const pencilBtn = document.getElementById("pencilBtn");
  const eraserBtn = document.getElementById("eraserBtn");
  const pencilMenu = document.getElementById("pencilMenu");
  const pencilSizeSelect = document.getElementById("pencilSize");
  const colorPicker = document.getElementById("colorPicker");

  let pencilDragging = false;
  let pencilOffsetX = 0, pencilOffsetY = 0;

  pencilBtn.addEventListener("click", () => {
    currentTool = "pencil";
    pencilMenu.classList.remove("hidden");
  });

  eraserBtn.addEventListener("click", () => {
    currentTool = "eraser";
    pencilMenu.classList.remove("hidden"); // mantener visible
  });

  pencilMenu.addEventListener("mousedown", (e) => {
    if (["SELECT", "INPUT", "BUTTON"].includes(e.target.tagName)) return;
    pencilDragging = true;
    pencilOffsetX = e.pageX - pencilMenu.offsetLeft;
    pencilOffsetY = e.pageY - pencilMenu.offsetTop;
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!pencilDragging) return;
    let newLeft = e.pageX - pencilOffsetX;
    let newTop = e.pageY - pencilOffsetY;

    const minLeft = window.scrollX;
    const maxLeft = window.scrollX + window.innerWidth - pencilMenu.offsetWidth;
    const minTop = window.scrollY;
    const maxTop = window.scrollY + window.innerHeight - pencilMenu.offsetHeight;

    newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
    newTop = Math.max(minTop, Math.min(maxTop, newTop));

    pencilMenu.style.left = newLeft + "px";
    pencilMenu.style.top = newTop + "px";
  });

  document.addEventListener("mouseup", () => (pencilDragging = false));

  // ======================
  // LÁPIZ / PIXEL ART
  // ======================
  let drawing = false;
  let currentBrush = parseInt(pencilSizeSelect.value);
  let currentColor = colorPicker.value;
  let currentTool = "pencil";
  let lastPos = null;

  pencilSizeSelect.addEventListener("change", (e) => {
    currentBrush = parseInt(e.target.value);
  });

  colorPicker.addEventListener("change", (e) => {
    currentColor = e.target.value;
  });

 function drawPixel(e) {
  if (!drawing) return;

  const rect = pixelCanvas.getBoundingClientRect();
  const cellSize = pixelCanvas.width / gridSize;

  let x = Math.floor((e.clientX - rect.left) / cellSize);
  let y = Math.floor((e.clientY - rect.top) / cellSize);

  for (let i = 0; i < currentBrush; i++) {
    for (let j = 0; j < currentBrush; j++) {
      let drawX = (x + i) * cellSize;
      let drawY = (y + j) * cellSize;
      if (drawX < pixelCanvas.width && drawY < pixelCanvas.height) {
        if (currentTool === "pencil") {
          ctx.fillStyle = currentColor;
          ctx.fillRect(drawX, drawY, cellSize, cellSize);
        } else if (currentTool === "eraser") {
          ctx.clearRect(drawX, drawY, cellSize, cellSize);
        }
      }
    }
  }

  // mantener el trazo continuo (interpolación entre puntos)
  if (lastPos) {
    let dx = x - lastPos.x;
    let dy = y - lastPos.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    for (let step = 1; step < steps; step++) {
      let ix = lastPos.x + Math.round((dx * step) / steps);
      let iy = lastPos.y + Math.round((dy * step) / steps);
      for (let i = 0; i < currentBrush; i++) {
        for (let j = 0; j < currentBrush; j++) {
          let drawX = (ix + i) * cellSize;
          let drawY = (iy + j) * cellSize;
          if (drawX < pixelCanvas.width && drawY < pixelCanvas.height) {
            if (currentTool === "pencil") {
              ctx.fillStyle = currentColor;
              ctx.fillRect(drawX, drawY, cellSize, cellSize);
            } else if (currentTool === "eraser") {
              ctx.clearRect(drawX, drawY, cellSize, cellSize);
            }
          }
        }
      }
    }
  }
  lastPos = { x, y };
}

  // ======= BOTÓN FILL (Rellenar) =======
  const fillBtn = document.getElementById("fillTool");
  if (fillBtn) {
    fillBtn.addEventListener("click", () => {
      currentTool = "fill";
    });
  }

  // Detectar clic en el canvas
  pixelCanvas.addEventListener("mousedown", (e) => {
    // Si es fill: no empezar "stroke", ejecutar relleno puntual
    if (currentTool === "fill") {
      const rect = pixelCanvas.getBoundingClientRect();
      const cellSize = pixelCanvas.width / gridSize;
      const x = Math.floor((e.clientX - rect.left) / cellSize);
      const y = Math.floor((e.clientY - rect.top) / cellSize);

      saveState(); // guardamos antes de rellenar
      bucketFill(x, y, currentColor);
      return;
    }

    // si es lápiz o borrador: iniciar trazo y guardar estado (una sola vez por stroke)
    if (currentTool === "pencil" || currentTool === "eraser") {
      saveState();
      drawing = true;
      lastPos = null;
      drawPixel(e);
    }
  });

  pixelCanvas.addEventListener("mousemove", drawPixel);
  pixelCanvas.addEventListener("mouseup", () => { drawing = false; lastPos = null; });
  pixelCanvas.addEventListener("mouseleave", () => { drawing = false; lastPos = null; });

  // ======================
  // CURSOR PIXEL
  // ======================
  const pixelCursor = document.getElementById("pixelCursor");

  pixelCanvas.addEventListener("mouseenter", () => {
    pixelCursor.style.display = "block";
  });

  pixelCanvas.addEventListener("mouseleave", () => {
    pixelCursor.style.display = "none";
  });

  pixelCanvas.addEventListener("mousemove", (e) => {
    const rect = pixelCanvas.getBoundingClientRect();
    const cellSize = pixelCanvas.width / gridSize;

    let x = Math.floor((e.clientX - rect.left) / cellSize);
    let y = Math.floor((e.clientY - rect.top) / cellSize);

    const size = currentBrush * cellSize;
    pixelCursor.style.width = size + "px";
    pixelCursor.style.height = size + "px";

    // 🔥 color con transparencia + borde
    pixelCursor.style.background =
      currentTool === "pencil" ? currentColor + "80" : "#ffffff80";
    pixelCursor.style.border = "1px solid #000";

    // posición exacta considerando scroll
    pixelCursor.style.left = window.scrollX + rect.left + x * cellSize + "px";
    pixelCursor.style.top = window.scrollY + rect.top + y * cellSize + "px";
  });

  // ======================
  // HELPER: COLORES Y PIXEL CELDA
  // ======================
  function hexToRgba(hex) {
    if (!hex) return [0,0,0,255];
    hex = hex.replace("#", "");
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return [r, g, b, 255];
    } else if (hex.length === 6) {
      const bigint = parseInt(hex, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return [r, g, b, 255];
    }
    // fallback
    return [0,0,0,255];
  }

  function colorsMatch(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  }

  function getCellCenterColor(imgData, cellX, cellY) {
    const w = pixelCanvas.width;
    const cellSize = pixelCanvas.width / gridSize;
    const px = Math.floor(cellX * cellSize + cellSize / 2);
    const py = Math.floor(cellY * cellSize + cellSize / 2);
    const idx = (py * w + px) * 4;
    return [
      imgData.data[idx],
      imgData.data[idx + 1],
      imgData.data[idx + 2],
      imgData.data[idx + 3]
    ];
  }

  function setCellColorInImageData(imgData, cellX, cellY, rgba) {
    const w = pixelCanvas.width;
    const h = pixelCanvas.height;
    const cellSize = pixelCanvas.width / gridSize;
    const startX = Math.floor(cellX * cellSize);
    const startY = Math.floor(cellY * cellSize);
    const endX = Math.min(w - 1, Math.ceil((cellX + 1) * cellSize) - 1);
    const endY = Math.min(h - 1, Math.ceil((cellY + 1) * cellSize) - 1);

    for (let py = startY; py <= endY; py++) {
      for (let px = startX; px <= endX; px++) {
        const idx = (py * w + px) * 4;
        imgData.data[idx] = rgba[0];
        imgData.data[idx + 1] = rgba[1];
        imgData.data[idx + 2] = rgba[2];
        imgData.data[idx + 3] = rgba[3];
      }
    }
  }

  // ======================
  // BUCKET (FLOOD FILL) por CELDA
  // ======================
function bucketFill(cellX, cellY, fillHex) {
  const cellSize = pixelCanvas.width / gridSize;
  const imgData = ctx.getImageData(0, 0, pixelCanvas.width, pixelCanvas.height);
  const fillRGBA = hexToRgba(fillHex);

  const startColor = getCellCenterColor(imgData, cellX, cellY);
  if (colorsMatch(startColor, fillRGBA)) return; // ya tiene el color

  const stack = [[cellX, cellY]];
  const visited = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) continue;
    if (visited[y][x]) continue;

    const currentColor = getCellCenterColor(imgData, x, y);
    if (!colorsMatch(currentColor, startColor)) continue; // límite de la figura

    setCellColorInImageData(imgData, x, y, fillRGBA);
    visited[y][x] = true;

    // solo vecinos 4-direcciones
    stack.push([x + 1, y]);
    stack.push([x - 1, y]);
    stack.push([x, y + 1]);
    stack.push([x, y - 1]);
  }

  ctx.putImageData(imgData, 0, 0);
  updateMiniMap();
}

  // ======================
  // EXPORTAR IMAGEN
  // ======================
  function exportPNG() {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = gridSize;
    exportCanvas.height = gridSize;
    const exportCtx = exportCanvas.getContext("2d");

    const cellSize = pixelCanvas.width / gridSize;
    const imgData = ctx.getImageData(0, 0, pixelCanvas.width, pixelCanvas.height);

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const px = Math.floor(x * cellSize + cellSize / 2);
        const py = Math.floor(y * cellSize + cellSize / 2);
        const idx = (py * pixelCanvas.width + px) * 4;
        const r = imgData.data[idx];
        const g = imgData.data[idx + 1];
        const b = imgData.data[idx + 2];
        const a = imgData.data[idx + 3] / 255;
        exportCtx.fillStyle = `rgba(${r},${g},${b},${a})`;
        exportCtx.fillRect(x, y, 1, 1);
      }
    }

    const fileName = prompt("Ingrese el nombre del archivo:", "mi_dibujo") || "mi_dibujo";

    const link = document.createElement("a");
    link.download = `${fileName}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  }

  function exportJPG() {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = gridSize;
    exportCanvas.height = gridSize;
    const exportCtx = exportCanvas.getContext("2d");

    // Fondo blanco
    exportCtx.fillStyle = "#ffffff";
    exportCtx.fillRect(0, 0, gridSize, gridSize);

    const cellSize = pixelCanvas.width / gridSize;
    const imgData = ctx.getImageData(0, 0, pixelCanvas.width, pixelCanvas.height);

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const px = Math.floor(x * cellSize + cellSize / 2);
        const py = Math.floor(y * cellSize + cellSize / 2);
        const idx = (py * pixelCanvas.width + px) * 4;
        const r = imgData.data[idx];
        const g = imgData.data[idx + 1];
        const b = imgData.data[idx + 2];
        const a = imgData.data[idx + 3] / 255;
        exportCtx.fillStyle = `rgba(${r},${g},${b},${a})`;
        exportCtx.fillRect(x, y, 1, 1);
      }
    }

    const fileName = prompt("Ingrese el nombre del archivo:", "mi_dibujo") || "mi_dibujo";

    const link = document.createElement("a");
    link.download = `${fileName}.jpg`;
    link.href = exportCanvas.toDataURL("image/jpeg", 0.9); // calidad 90%
    link.click();
  }

  function exportSVG() {
    const cellSize = pixelCanvas.width / gridSize;
    const imgData = ctx.getImageData(0, 0, pixelCanvas.width, pixelCanvas.height);

    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${gridSize}" height="${gridSize}" shape-rendering="crispEdges">`;

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const px = Math.floor(x * cellSize + cellSize / 2);
        const py = Math.floor(y * cellSize + cellSize / 2);
        const idx = (py * pixelCanvas.width + px) * 4;
        const r = imgData.data[idx];
        const g = imgData.data[idx + 1];
        const b = imgData.data[idx + 2];
        const a = imgData.data[idx + 3] / 255;

        if (a > 0) {
          const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
          svgContent += `<rect x="${x}" y="${y}" width="1" height="1" fill="${hex}" fill-opacity="${a}"/>`;
        }
      }
    }

    svgContent += `</svg>`;
    const blob = new Blob([svgContent], { type: "image/svg+xml" });

    const fileName = prompt("Ingrese el nombre del archivo:", "mi_dibujo") || "mi_dibujo";

    const link = document.createElement("a");
    link.download = `${fileName}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
  }

  // ======================
  // MENÚ EXPORTAR
  // ======================
  document.getElementById("saveBtn").addEventListener("click", () => {
    const format = document.getElementById("saveOptions").value;
    if (!format) {
      alert("Por favor selecciona un formato de exportación.");
      return;
    }

    if (format === "png") exportPNG();
    else if (format === "jpg") exportJPG();
    else if (format === "svg") exportSVG();
    
  });

  // Botón: Guardar en tamaño real (512x512)
document.getElementById("saveBtnRealSize").addEventListener("click", () => {
  const format = document.getElementById("saveOptions").value;

  if (!format) {
    alert("Por favor selecciona un formato de exportación.");
    return;
  }

  if (format === "png") {
    const link = document.createElement("a");
    link.download = "canvas_real.png";
    link.href = pixelCanvas.toDataURL("image/png");
    link.click();

  } else if (format === "jpg") {
    const link = document.createElement("a");
    link.download = "canvas_real.jpg";
    link.href = pixelCanvas.toDataURL("image/jpeg", 1.0); // calidad máxima
    link.click();

  } else if (format === "svg") {
    // Convertir el canvas a SVG básico con imagen embebida en base64
    const svgData = `
      <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
        <image href="${pixelCanvas.toDataURL("image/png")}" width="512" height="512"/>
      </svg>
    `;
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const link = document.createElement("a");
    link.download = "canvas_real.svg";
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }
});



// ======================
// ATAJOS DE TECLADO: Ctrl/Cmd + Z y Y
// ======================
document.addEventListener("keydown", (e) => {
  const isUndo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z";
  const isRedo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y";

  if (isUndo) {
    e.preventDefault();
    undo();
  }
  if (isRedo) {
    e.preventDefault();
    redo();
  }

});



  // ======================
  // Menu figuras
  // ======================
 // Mostrar/ocultar el menú al hacer clic en el botón
    const figuresBtn = document.getElementById("figuresBtn");
    const figuresMenu = document.getElementById("figuresMenu");

    figuresBtn.addEventListener("click", () => {
      figuresMenu.style.display =
        figuresMenu.style.display === "block" ? "none" : "block";
    });

    // Función para hacer el menú movible con límite inferior
    function makeMenuDraggable(menuId) {
      const menu = document.getElementById(menuId);
      const header = menu.querySelector(".menuHeader");

      let offsetX = 0, offsetY = 0, startX = 0, startY = 0;

      header.addEventListener("mousedown", dragMouseDown);

      function dragMouseDown(e) {
        e.preventDefault();
        startX = e.clientX;
        startY = e.clientY;
        document.addEventListener("mouseup", closeDragElement);
        document.addEventListener("mousemove", elementDrag);
      }

      function elementDrag(e) {
        e.preventDefault();
        offsetX = startX - e.clientX;
        offsetY = startY - e.clientY;
        startX = e.clientX;
        startY = e.clientY;

        let newLeft = menu.offsetLeft - offsetX;
        let newTop = menu.offsetTop - offsetY;

        // 🔹 Límites horizontales
        const maxLeft = window.innerWidth - menu.offsetWidth;
        if (newLeft < 0) newLeft = 0;
        if (newLeft > maxLeft) newLeft = maxLeft;

        // 🔹 Límite superior
        if (newTop < 0) newTop = 0;

        // 🔹 Límite inferior (final del documento)
        const docHeight = document.documentElement.scrollHeight;
        const maxTop = docHeight - menu.offsetHeight;
        if (newTop > maxTop) newTop = maxTop;

        menu.style.left = newLeft + "px";
        menu.style.top = newTop + "px";
      }

      function closeDragElement() {
        document.removeEventListener("mouseup", closeDragElement);
        document.removeEventListener("mousemove", elementDrag);
      }
    }

    // Activamos el sistema en el menú de figuras
    makeMenuDraggable("figuresMenu");

// == CÍRCULO/ÓVALO HUECO con preview mientras arrastras ==
// (Pegar esto dentro de tu DOMContentLoaded, después de que exista pixelCanvas, ctx, gridSize, currentTool, currentColor y saveState())

// activar la herramienta desde el botón (si no lo tienes ya)
const circleOption = document.querySelector('[data-figure="circle"]');
if (circleOption) {
  circleOption.addEventListener("click", () => {
    currentTool = "circle";
  });
}

let ellipseStart = null;
let isDrawingEllipse = false;
let previewImageData = null;

pixelCanvas.addEventListener("mousedown", (e) => {
  if (currentTool !== "circle") return;

  const rect = pixelCanvas.getBoundingClientRect();
  const cellSize = pixelCanvas.width / gridSize;

  // posición en CELDAS
  const sx = Math.floor((e.clientX - rect.left) / cellSize);
  const sy = Math.floor((e.clientY - rect.top) / cellSize);

  ellipseStart = { x: sx, y: sy };
  isDrawingEllipse = true;

  // Guardar estado para undo y para preview
  saveState();
  previewImageData = ctx.getImageData(0, 0, pixelCanvas.width, pixelCanvas.height);
});

pixelCanvas.addEventListener("mousemove", (e) => {
  if (!isDrawingEllipse || currentTool !== "circle" || !ellipseStart) return;

  const rect = pixelCanvas.getBoundingClientRect();
  const cellSize = pixelCanvas.width / gridSize;

  const ex = Math.floor((e.clientX - rect.left) / cellSize);
  const ey = Math.floor((e.clientY - rect.top) / cellSize);

  // Restaurar estado original (antes del preview)
  if (previewImageData) ctx.putImageData(previewImageData, 0, 0);

  // Dibujar preview del contorno del óvalo en la grilla
  ctx.fillStyle = currentColor;
  drawEllipseOutlineCells(ellipseStart.x, ellipseStart.y, ex, ey, cellSize);
});

pixelCanvas.addEventListener("mouseup", (e) => {
  if (!isDrawingEllipse || currentTool !== "circle" || !ellipseStart) return;

  const rect = pixelCanvas.getBoundingClientRect();
  const cellSize = pixelCanvas.width / gridSize;

  const ex = Math.floor((e.clientX - rect.left) / cellSize);
  const ey = Math.floor((e.clientY - rect.top) / cellSize);

  // Restaurar (por si hay preview)
  if (previewImageData) ctx.putImageData(previewImageData, 0, 0);

  // Dibujar contorno final
  ctx.fillStyle = currentColor;
  drawEllipseOutlineCells(ellipseStart.x, ellipseStart.y, ex, ey, cellSize);

  // limpiar estado de dibujo temporal
  isDrawingEllipse = false;
  ellipseStart = null;
  previewImageData = null;
});

// Si el usuario sale del canvas mientras dibuja, cancelar dibujo (opcional)
pixelCanvas.addEventListener("mouseleave", () => {
  if (isDrawingEllipse) {
    // restaurar y cancelar
    if (previewImageData) ctx.putImageData(previewImageData, 0, 0);
    isDrawingEllipse = false;
    ellipseStart = null;
    previewImageData = null;
  }
});

// ===== función que marca SOLO EL CONTORNO del óvalo en CELDAS =====
function drawEllipseOutlineCells(x0, y0, x1, y1, cellSize) {
  // centro y radios en coordenadas de celda (pueden ser fraccionales)
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  let rx = Math.abs(x1 - x0) / 2;
  let ry = Math.abs(y1 - y0) / 2;

  // si el "rect" es un punto, dibujar un solo píxel
  if (rx < 0.5 && ry < 0.5) {
    ctx.fillRect(x0 * cellSize, y0 * cellSize, cellSize, cellSize);
    return;
  }

  // asegurar radios mínimos para evitar dividir entre cero
  rx = Math.max(rx, 0.5);
  ry = Math.max(ry, 0.5);

  const minX = Math.max(0, Math.floor(cx - rx) - 1);
  const maxX = Math.min(gridSize - 1, Math.ceil(cx + rx) + 1);
  const minY = Math.max(0, Math.floor(cy - ry) - 1);
  const maxY = Math.min(gridSize - 1, Math.ceil(cy + ry) + 1);

  // Recorremos por X: calculamos y superior e inferior y pintamos ambos (mejora continuidad)
  for (let xi = minX; xi <= maxX; xi++) {
    const dx = xi - cx;
    const val = 1 - (dx * dx) / (rx * rx);
    if (val < 0) continue;
    const yOff = ry * Math.sqrt(val);
    const yTop = Math.round(cy - yOff);
    const yBottom = Math.round(cy + yOff);

    if (yTop >= minY && yTop <= maxY) {
      ctx.fillRect(xi * cellSize, yTop * cellSize, cellSize, cellSize);
    }
    if (yBottom >= minY && yBottom <= maxY) {
      ctx.fillRect(xi * cellSize, yBottom * cellSize, cellSize, cellSize);
    }
  }

  // Recorremos por Y: calculamos x izquierdo y derecho y pintamos ambos (cubre huecos verticales)
  for (let yi = minY; yi <= maxY; yi++) {
    const dy = yi - cy;
    const val = 1 - (dy * dy) / (ry * ry);
    if (val < 0) continue;
    const xOff = rx * Math.sqrt(val);
    const xLeft = Math.round(cx - xOff);
    const xRight = Math.round(cx + xOff);

    if (xLeft >= minX && xLeft <= maxX) {
      ctx.fillRect(xLeft * cellSize, yi * cellSize, cellSize, cellSize);
    }
    if (xRight >= minX && xRight <= maxX) {
      ctx.fillRect(xRight * cellSize, yi * cellSize, cellSize, cellSize);
    }
  }
}

// == TRIÁNGULO HUECO con preview mientras arrastras ==
// (Pegar dentro de tu DOMContentLoaded, después de que existan pixelCanvas, ctx, gridSize, currentTool, currentColor y saveState())

// activar la herramienta desde el botón
const triangleOption = document.querySelector('[data-figure="triangle"]');
if (triangleOption) {
  triangleOption.addEventListener("click", () => {
    currentTool = "triangle";
  });
}

let triangleStart = null;
let isDrawingTriangle = false;
let previewImageDataTri = null;

pixelCanvas.addEventListener("mousedown", (e) => {
  if (currentTool !== "triangle") return;

  const rect = pixelCanvas.getBoundingClientRect();
  const cellSize = pixelCanvas.width / gridSize;

  // posición en CELDAS
  const sx = Math.floor((e.clientX - rect.left) / cellSize);
  const sy = Math.floor((e.clientY - rect.top) / cellSize);

  triangleStart = { x: sx, y: sy };
  isDrawingTriangle = true;

  // Guardar estado para undo y preview
  saveState();
  previewImageDataTri = ctx.getImageData(0, 0, pixelCanvas.width, pixelCanvas.height);
});

pixelCanvas.addEventListener("mousemove", (e) => {
  if (!isDrawingTriangle || currentTool !== "triangle" || !triangleStart) return;

  const rect = pixelCanvas.getBoundingClientRect();
  const cellSize = pixelCanvas.width / gridSize;

  const ex = Math.floor((e.clientX - rect.left) / cellSize);
  const ey = Math.floor((e.clientY - rect.top) / cellSize);

  // Restaurar estado original (antes del preview)
  if (previewImageDataTri) ctx.putImageData(previewImageDataTri, 0, 0);

  // Dibujar preview del contorno del triángulo en la grilla
  ctx.fillStyle = currentColor;
  drawTriangleOutlineCells(triangleStart.x, triangleStart.y, ex, ey, cellSize);
});

pixelCanvas.addEventListener("mouseup", (e) => {
  if (!isDrawingTriangle || currentTool !== "triangle" || !triangleStart) return;

  const rect = pixelCanvas.getBoundingClientRect();
  const cellSize = pixelCanvas.width / gridSize;

  const ex = Math.floor((e.clientX - rect.left) / cellSize);
  const ey = Math.floor((e.clientY - rect.top) / cellSize);

  // Restaurar (por si hay preview)
  if (previewImageDataTri) ctx.putImageData(previewImageDataTri, 0, 0);

  // Dibujar contorno final
  ctx.fillStyle = currentColor;
  drawTriangleOutlineCells(triangleStart.x, triangleStart.y, ex, ey, cellSize);

  // limpiar estado de dibujo temporal
  isDrawingTriangle = false;
  triangleStart = null;
  previewImageDataTri = null;
});

// cancelar si sale del canvas
pixelCanvas.addEventListener("mouseleave", () => {
  if (isDrawingTriangle) {
    if (previewImageDataTri) ctx.putImageData(previewImageDataTri, 0, 0);
    isDrawingTriangle = false;
    triangleStart = null;
    previewImageDataTri = null;
  }
});

// ===== función que dibuja líneas entre celdas (Bresenham) =====
function drawLineCells(x0, y0, x1, y1, cellSize) {
  let x = x0, y = y0;
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  while (true) {
    if (x >= 0 && y >= 0 && x < gridSize && y < gridSize) {
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}

// ===== función que dibuja SOLO EL CONTORNO del triángulo en CELDAS =====
function drawTriangleOutlineCells(x0, y0, x1, y1, cellSize) {
  // Vértices: isósceles dentro del rectángulo formado por (x0,y0) y (x1,y1)
  // Vértice superior en y0, base entre x0..x1 en y1
  const topX = Math.round((x0 + x1) / 2);
  const topY = y0;
  const leftX = x0;
  const leftY = y1;
  const rightX = x1;
  const rightY = y1;

  // Dibujar las 3 aristas usando Bresenham en coordenadas de celda
  drawLineCells(topX, topY, leftX, leftY, cellSize);
  drawLineCells(topX, topY, rightX, rightY, cellSize);
  drawLineCells(leftX, leftY, rightX, rightY, cellSize);
}


// == CUADRADO/RECTÁNGULO HUECO con preview mientras arrastras ==
// (Pegar dentro de tu DOMContentLoaded, después de que existan pixelCanvas, ctx, gridSize, currentTool, currentColor y saveState())

// activar la herramienta desde el botón
const squareOption = document.querySelector('[data-figure="square"]');
if (squareOption) {
  squareOption.addEventListener("click", () => {
    currentTool = "square";
  });
}

let squareStart = null;
let isDrawingSquare = false;
let previewImageDataSq = null;

pixelCanvas.addEventListener("mousedown", (e) => {
  if (currentTool !== "square") return;

  const rect = pixelCanvas.getBoundingClientRect();
  const cellSize = pixelCanvas.width / gridSize;

  const sx = Math.floor((e.clientX - rect.left) / cellSize);
  const sy = Math.floor((e.clientY - rect.top) / cellSize);

  squareStart = { x: sx, y: sy };
  isDrawingSquare = true;

  saveState();
  previewImageDataSq = ctx.getImageData(0, 0, pixelCanvas.width, pixelCanvas.height);
});

pixelCanvas.addEventListener("mousemove", (e) => {
  if (!isDrawingSquare || currentTool !== "square" || !squareStart) return;

  const rect = pixelCanvas.getBoundingClientRect();
  const cellSize = pixelCanvas.width / gridSize;

  const ex = Math.floor((e.clientX - rect.left) / cellSize);
  const ey = Math.floor((e.clientY - rect.top) / cellSize);

  if (previewImageDataSq) ctx.putImageData(previewImageDataSq, 0, 0);

  ctx.fillStyle = currentColor;
  drawSquareOutlineCells(squareStart.x, squareStart.y, ex, ey, cellSize);
});

pixelCanvas.addEventListener("mouseup", (e) => {
  if (!isDrawingSquare || currentTool !== "square" || !squareStart) return;

  const rect = pixelCanvas.getBoundingClientRect();
  const cellSize = pixelCanvas.width / gridSize;

  const ex = Math.floor((e.clientX - rect.left) / cellSize);
  const ey = Math.floor((e.clientY - rect.top) / cellSize);

  if (previewImageDataSq) ctx.putImageData(previewImageDataSq, 0, 0);

  ctx.fillStyle = currentColor;
  drawSquareOutlineCells(squareStart.x, squareStart.y, ex, ey, cellSize);

  isDrawingSquare = false;
  squareStart = null;
  previewImageDataSq = null;
});

pixelCanvas.addEventListener("mouseleave", () => {
  if (isDrawingSquare) {
    if (previewImageDataSq) ctx.putImageData(previewImageDataSq, 0, 0);
    isDrawingSquare = false;
    squareStart = null;
    previewImageDataSq = null;
  }
});

// ===== función para dibujar el contorno de un cuadrado/rectángulo =====
function drawSquareOutlineCells(x0, y0, x1, y1, cellSize) {
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);

  // líneas horizontales
  for (let xi = minX; xi <= maxX; xi++) {
    ctx.fillRect(xi * cellSize, minY * cellSize, cellSize, cellSize);
    ctx.fillRect(xi * cellSize, maxY * cellSize, cellSize, cellSize);
  }

  // líneas verticales
  for (let yi = minY; yi <= maxY; yi++) {
    ctx.fillRect(minX * cellSize, yi * cellSize, cellSize, cellSize);
    ctx.fillRect(maxX * cellSize, yi * cellSize, cellSize, cellSize);
  }
}

// == LÍNEA RECTA con preview mientras arrastras ==
// (Pegar dentro de tu DOMContentLoaded, después de que existan pixelCanvas, ctx, gridSize, currentTool, currentColor y saveState())

// activar la herramienta desde el botón
const lineOption = document.querySelector('[data-figure="line"]');
if (lineOption) {
  lineOption.addEventListener("click", () => {
    currentTool = "line";
  });
}

let lineStart = null;
let isDrawingLine = false;
let previewImageDataLn = null;

pixelCanvas.addEventListener("mousedown", (e) => {
  if (currentTool !== "line") return;

  const rect = pixelCanvas.getBoundingClientRect();
  const cellSize = pixelCanvas.width / gridSize;

  const sx = Math.floor((e.clientX - rect.left) / cellSize);
  const sy = Math.floor((e.clientY - rect.top) / cellSize);

  lineStart = { x: sx, y: sy };
  isDrawingLine = true;

  saveState();
  previewImageDataLn = ctx.getImageData(0, 0, pixelCanvas.width, pixelCanvas.height);
});

pixelCanvas.addEventListener("mousemove", (e) => {
  if (!isDrawingLine || currentTool !== "line" || !lineStart) return;

  const rect = pixelCanvas.getBoundingClientRect();
  const cellSize = pixelCanvas.width / gridSize;

  const ex = Math.floor((e.clientX - rect.left) / cellSize);
  const ey = Math.floor((e.clientY - rect.top) / cellSize);

  if (previewImageDataLn) ctx.putImageData(previewImageDataLn, 0, 0);

  ctx.fillStyle = currentColor;
  drawLineCells(lineStart.x, lineStart.y, ex, ey, cellSize);
});

pixelCanvas.addEventListener("mouseup", (e) => {
  if (!isDrawingLine || currentTool !== "line" || !lineStart) return;

  const rect = pixelCanvas.getBoundingClientRect();
  const cellSize = pixelCanvas.width / gridSize;

  const ex = Math.floor((e.clientX - rect.left) / cellSize);
  const ey = Math.floor((e.clientY - rect.top) / cellSize);

  if (previewImageDataLn) ctx.putImageData(previewImageDataLn, 0, 0);

  ctx.fillStyle = currentColor;
  drawLineCells(lineStart.x, lineStart.y, ex, ey, cellSize);

  isDrawingLine = false;
  lineStart = null;
  previewImageDataLn = null;
});

pixelCanvas.addEventListener("mouseleave", () => {
  if (isDrawingLine) {
    if (previewImageDataLn) ctx.putImageData(previewImageDataLn, 0, 0);
    isDrawingLine = false;
    lineStart = null;
    previewImageDataLn = null;
  }
});

// ===== función para dibujar una línea recta con Bresenham =====
function drawLineCells(x0, y0, x1, y1, cellSize) {
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  let sx = x0 < x1 ? 1 : -1;
  let sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    ctx.fillRect(x0 * cellSize, y0 * cellSize, cellSize, cellSize);

    if (x0 === x1 && y0 === y1) break;
    let e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}


  // ======================
  //linea curva
  // ======================

  // == LÍNEA CURVA (reset + arreglo) ==
// Pegar dentro de tu DOMContentLoaded después de que existan:
// pixelCanvas, ctx, gridSize, currentTool, currentColor, drawLineCells y saveState()

const curveOption = document.querySelector('[data-figure="curve"]');
if (curveOption) {
  curveOption.addEventListener("click", () => {
    currentTool = "curve";
  });
}

// estado
let curveStart = null;
let curveEnd = null;
let curveControl = null;
let isDrawingCurve = false;    // true mientras haces click+arrastre para la recta inicial
let isAdjustingCurve = false;  // true después de soltar, cuando aparece el punto de control
let isDraggingControl = false; // true mientras arrastras el punto de control
let previewImageDataCurve = null;

// auxiliar: obtener celda desde evento (compatible con tu código)
function getCellFromEventLocal(e) {
  const rect = pixelCanvas.getBoundingClientRect();
  const cellSize = pixelCanvas.width / gridSize;
  const x = Math.floor((e.clientX - rect.left) / cellSize);
  const y = Math.floor((e.clientY - rect.top) / cellSize);
  return { x, y, cellSize };
}

// MOUSE DOWN: iniciar dibujo o empezar a arrastrar el control si se clickea encima
pixelCanvas.addEventListener("mousedown", (e) => {
  if (currentTool !== "curve") return;
  const { x, y } = getCellFromEventLocal(e);

  // Si aún no hemos empezado: iniciamos start (click + arrastra)
  if (!isDrawingCurve && !isAdjustingCurve) {
    curveStart = { x, y };
    isDrawingCurve = true;
    // guardamos snapshot para preview (no guardamos historial aún)
    try { previewImageDataCurve = ctx.getImageData(0, 0, pixelCanvas.width, pixelCanvas.height); } catch (err) { previewImageDataCurve = null; }
    return;
  }

  // Si estamos en modo ajustar (ya hay start y end) -> comprobar si clic cerca del control para arrastrarlo
  if (isAdjustingCurve && curveControl) {
    const d = Math.hypot(x - curveControl.x, y - curveControl.y);
    if (d <= 1.5) {
      isDraggingControl = true;
      // nos aseguramos de tener la imagen base para restaurar mientras se mueve
      try { if (!previewImageDataCurve) previewImageDataCurve = ctx.getImageData(0, 0, pixelCanvas.width, pixelCanvas.height); } catch (err) {}
    }
  }
});

// MOUSE MOVE: preview de la recta mientras arrastras, o mover control mientras arrastras
pixelCanvas.addEventListener("mousemove", (e) => {
  if (currentTool !== "curve") return;
  const { x, y, cellSize } = getCellFromEventLocal(e);

  // Preview de la línea recta durante el primer arrastre
  if (isDrawingCurve && curveStart && !curveEnd) {
    if (previewImageDataCurve) ctx.putImageData(previewImageDataCurve, 0, 0);
    ctx.fillStyle = currentColor;
    drawLineCells(curveStart.x, curveStart.y, x, y, cellSize);
    return;
  }

  // Si estamos arrastrando el punto de control, actualizar preview de la curva
  if (isDraggingControl && isAdjustingCurve && curveStart && curveEnd) {
    curveControl = { x, y };
    if (previewImageDataCurve) ctx.putImageData(previewImageDataCurve, 0, 0);
    ctx.fillStyle = currentColor;
    drawQuadraticCurveCells(curveStart, curveControl, curveEnd, cellSize);
    // mostrar handle rojo mientras se arrastra
    ctx.fillStyle = "red";
    ctx.fillRect(curveControl.x * cellSize, curveControl.y * cellSize, cellSize, cellSize);
    return;
  }

  // Si estamos en ajuste pero aún no arrastrando, mostrar la curva con el control actual (sin modificarlo)
  if (!isDraggingControl && isAdjustingCurve && curveStart && curveEnd && curveControl) {
    if (previewImageDataCurve) ctx.putImageData(previewImageDataCurve, 0, 0);
    ctx.fillStyle = currentColor;
    drawQuadraticCurveCells(curveStart, curveControl, curveEnd, cellSize);
    ctx.fillStyle = "red";
    ctx.fillRect(curveControl.x * cellSize, curveControl.y * cellSize, cellSize, cellSize);
    return;
  }
});

// MOUSE UP: finalizar la recta inicial (y pasar a ajustar) o finalizar el ajuste (fijar curva)
pixelCanvas.addEventListener("mouseup", (e) => {
  if (currentTool !== "curve") return;
  const { x, y, cellSize } = getCellFromEventLocal(e);

  // Si estábamos dibujando la recta (click + drag) -> fijar end y pasar a ajuste
  if (isDrawingCurve && !curveEnd) {
    curveEnd = { x, y };
    // punto de control inicial en el centro de la recta
    curveControl = {
      x: Math.round((curveStart.x + curveEnd.x) / 2),
      y: Math.round((curveStart.y + curveEnd.y) / 2)
    };
    isDrawingCurve = false;
    isAdjustingCurve = true;

    // pintar preview de la curva con handle
    if (previewImageDataCurve) ctx.putImageData(previewImageDataCurve, 0, 0);
    ctx.fillStyle = currentColor;
    drawQuadraticCurveCells(curveStart, curveControl, curveEnd, cellSize);
    ctx.fillStyle = "red";
    ctx.fillRect(curveControl.x * cellSize, curveControl.y * cellSize, cellSize, cellSize);
    return;
  }

  // Si estábamos arrastrando el control -> fijar curva final y limpiar
  if (isDraggingControl && isAdjustingCurve && curveStart && curveEnd && curveControl) {
    isDraggingControl = false;

    // restaurar base y rasterizar curva final
    if (previewImageDataCurve) ctx.putImageData(previewImageDataCurve, 0, 0);
    ctx.fillStyle = currentColor;
    drawQuadraticCurveCells(curveStart, curveControl, curveEnd, cellSize);

    // guardar undo
    saveState();

    // limpiar estados temporales
    isAdjustingCurve = false;
    curveStart = null;
    curveEnd = null;
    curveControl = null;
    previewImageDataCurve = null;
    return;
  }
});

// Si el usuario sale del canvas mientras dibuja, cancelar y restaurar
pixelCanvas.addEventListener("mouseleave", () => {
  if (isDrawingCurve || isAdjustingCurve || isDraggingControl) {
    if (previewImageDataCurve) ctx.putImageData(previewImageDataCurve, 0, 0);
    isDrawingCurve = false;
    isAdjustingCurve = false;
    isDraggingControl = false;
    curveStart = null;
    curveEnd = null;
    curveControl = null;
    previewImageDataCurve = null;
  }
});

// ===== DIBUJO de curva Bézier cuadrática (usa drawLineCells existente) =====
function drawQuadraticCurveCells(p0, p1, p2, cellSize) {
  const steps = 200; // suavidad
  let prevX = p0.x;
  let prevY = p0.y;

  for (let t = 1; t <= steps; t++) {
    const tt = t / steps;
    const inv = 1 - tt;
    const x = Math.round(inv * inv * p0.x + 2 * inv * tt * p1.x + tt * tt * p2.x);
    const y = Math.round(inv * inv * p0.y + 2 * inv * tt * p1.y + tt * tt * p2.y);

    drawLineCells(prevX, prevY, x, y, cellSize);
    prevX = x;
    prevY = y;
  }
}

  // ======================
  // MOSTRAR / OCULTAR REJILLA
  // ======================
  let gridVisible = true; // estado inicial: la rejilla está encendida

  function toggleGrid() {
    gridVisible = !gridVisible;
    if (gridVisible) {
      drawGrid(); // la volvemos a dibujar
    } else {
      gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height); // la quitamos
    }
  }

  // botón para alternar
  const gridToggleBtn = document.getElementById("toggleGrid");
  if (gridToggleBtn) {
    gridToggleBtn.addEventListener("click", toggleGrid);
  }

  // acceso rápido con tecla G
  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "g") {
      toggleGrid();
    }
  });


  // Desactivar menú contextual en el canvas
pixelCanvas.addEventListener("contextmenu", (e) => e.preventDefault());

let prevTool = null; // para restaurar después de usar clic derecho

// Detectar clic en el canvas
pixelCanvas.addEventListener("mousedown", (e) => {
  const rect = pixelCanvas.getBoundingClientRect();
  const cellSize = pixelCanvas.width / gridSize;

  // Guardar herramienta previa antes de forzar borrador con botón derecho
  if (e.button === 2) { // click derecho
    prevTool = currentTool;
    currentTool = "eraser";

    // Cambiar color/estilo del cursor fantasma (ej: rojo)
    pixelCursor.style.background = "rgba(255,0,0,0.6)";
  }

  // Si es fill
  if (currentTool === "fill") {
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);

    saveState();
    bucketFill(x, y, currentColor);
    return;
  }

  // Si es lápiz o borrador
  if (currentTool === "pencil" || currentTool === "eraser") {
    saveState();
    drawing = true;
    lastPos = null;
    drawPixel(e);
  }
});

pixelCanvas.addEventListener("mousemove", drawPixel);

pixelCanvas.addEventListener("mouseup", (e) => {
  drawing = false;
  lastPos = null;

  // restaurar herramienta previa si venía de clic derecho
  if (e.button === 2 && prevTool) {
    currentTool = prevTool;
    prevTool = null;

    // Restaurar color del cursor fantasma al actual
    pixelCursor.style.background = currentColor;
  }
});

pixelCanvas.addEventListener("mouseleave", () => { 
  drawing = false; 
  lastPos = null; 
  if (prevTool) { 
    currentTool = prevTool; 
    prevTool = null; 

    // Restaurar color del cursor fantasma
    pixelCursor.style.background = currentColor;
  }
});




  


});
