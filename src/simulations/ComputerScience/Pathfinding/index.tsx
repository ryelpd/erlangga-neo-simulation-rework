import { useRef, useEffect, useCallback } from 'react';

type AlgoMode = 'ASTAR' | 'DIJKSTRA' | 'BFS';

interface Pos { r: number; c: number }

class PFNode {
  r: number;
  c: number;
  f: number = 0;
  g: number = 0;
  h: number = 0;
  parent: PFNode | null = null;

  constructor(r: number, c: number) {
    this.r = r;
    this.c = c;
  }
}

const COLS = 40;
const ROWS = 22;

export default function Pathfinding() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    currentMode: 'ASTAR' as AlgoMode,
    animationSpeed: 80,
    grid: [] as number[][],
    startNode: { r: 10, c: 5 } as Pos,
    endNode: { r: 10, c: 34 } as Pos,
    isPlaying: false,
    isFinished: false,
    pathGenerator: null as Generator<string, void, unknown> | null,
    lastFrameTime: 0,
    openSetVis: [] as Pos[],
    closedSetVis: [] as Pos[],
    pathVis: [] as Pos[],
    nodesExploredCount: 0,
    pathDistanceCount: 0,
    isDragging: false,
    dragMode: null as 'WALL_ADD' | 'WALL_REMOVE' | 'START' | 'END' | null,
    cellW: 0,
    cellH: 0,
    animationId: 0,
  });

  const btnAStarRef = useRef<HTMLButtonElement>(null);
  const btnDijkstraRef = useRef<HTMLButtonElement>(null);
  const btnBFSRef = useRef<HTMLButtonElement>(null);

  const sliderSpeedRef = useRef<HTMLInputElement>(null);
  const valSpeedRef = useRef<HTMLSpanElement>(null);

  const btnPlayRef = useRef<HTMLButtonElement>(null);
  const dataExploredRef = useRef<HTMLSpanElement>(null);
  const dataDistanceRef = useRef<HTMLSpanElement>(null);
  const dataStatusRef = useRef<HTMLSpanElement>(null);

  const heuristic = useCallback((a: Pos | PFNode, b: Pos): number => {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
  }, []);

  const getNeighbors = useCallback((node: Pos): Pos[] => {
    const state = stateRef.current;
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const neighbors: Pos[] = [];
    for (const d of dirs) {
      const nr = node.r + d[0];
      const nc = node.c + d[1];
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && state.grid[nr][nc] === 0) {
        neighbors.push({ r: nr, c: nc });
      }
    }
    return neighbors;
  }, []);

  const reconstructPath = useCallback((currentNode: PFNode): Pos[] => {
    const path: Pos[] = [];
    let curr: PFNode | null = currentNode;
    while (curr && curr.parent) {
      path.push({ r: curr.r, c: curr.c });
      curr = curr.parent;
    }
    path.reverse();
    return path;
  }, []);

  function* aStarGen() {
    const state = stateRef.current;
    const openSet: PFNode[] = [new PFNode(state.startNode.r, state.startNode.c)];
    const closedMap: boolean[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const openMap: boolean[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const gScore: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(Infinity));
    gScore[state.startNode.r][state.startNode.c] = 0;
    openMap[state.startNode.r][state.startNode.c] = true;

    while (openSet.length > 0) {
      let lowestIndex = 0;
      for (let i = 0; i < openSet.length; i++) {
        if (openSet[i].f < openSet[lowestIndex].f) lowestIndex = i;
      }
      const current = openSet[lowestIndex];

      if (current.r === state.endNode.r && current.c === state.endNode.c) {
        const finalPath = reconstructPath(current);
        state.pathVis = finalPath;
        state.pathDistanceCount = finalPath.length;
        yield 'FOUND';
        return;
      }

      openSet.splice(lowestIndex, 1);
      openMap[current.r][current.c] = false;
      closedMap[current.r][current.c] = true;

      if (!(current.r === state.startNode.r && current.c === state.startNode.c)) {
        state.closedSetVis.push({ r: current.r, c: current.c });
        state.nodesExploredCount++;
      }

      const neighbors = getNeighbors(current);
      for (const nInfo of neighbors) {
        if (closedMap[nInfo.r][nInfo.c]) continue;

        const tentative_gScore = gScore[current.r][current.c] + 1;

        if (!openMap[nInfo.r][nInfo.c] || tentative_gScore < gScore[nInfo.r][nInfo.c]) {
          gScore[nInfo.r][nInfo.c] = tentative_gScore;

          const neighborNode = new PFNode(nInfo.r, nInfo.c);
          neighborNode.parent = current;
          neighborNode.g = tentative_gScore;
          neighborNode.h = heuristic(neighborNode, state.endNode);
          neighborNode.f = neighborNode.g + neighborNode.h;

          if (!openMap[nInfo.r][nInfo.c]) {
            openSet.push(neighborNode);
            openMap[nInfo.r][nInfo.c] = true;
            if (!(nInfo.r === state.endNode.r && nInfo.c === state.endNode.c)) {
              state.openSetVis.push({ r: nInfo.r, c: nInfo.c });
            }
          } else {
            for (let i = 0; i < openSet.length; i++) {
              if (openSet[i].r === nInfo.r && openSet[i].c === nInfo.c) {
                openSet[i] = neighborNode;
                break;
              }
            }
          }
        }
      }
      yield 'SEARCHING';
    }
    yield 'NO_PATH';
  }

  function* dijkstraGen() {
    const state = stateRef.current;
    const openSet: PFNode[] = [new PFNode(state.startNode.r, state.startNode.c)];
    const closedMap: boolean[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const openMap: boolean[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const gScore: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(Infinity));
    gScore[state.startNode.r][state.startNode.c] = 0;
    openMap[state.startNode.r][state.startNode.c] = true;

    while (openSet.length > 0) {
      let lowestIndex = 0;
      for (let i = 0; i < openSet.length; i++) {
        if (openSet[i].g < openSet[lowestIndex].g) lowestIndex = i;
      }
      const current = openSet[lowestIndex];

      if (current.r === state.endNode.r && current.c === state.endNode.c) {
        const finalPath = reconstructPath(current);
        state.pathVis = finalPath;
        state.pathDistanceCount = finalPath.length;
        yield 'FOUND';
        return;
      }

      openSet.splice(lowestIndex, 1);
      openMap[current.r][current.c] = false;
      closedMap[current.r][current.c] = true;

      if (!(current.r === state.startNode.r && current.c === state.startNode.c)) {
        state.closedSetVis.push({ r: current.r, c: current.c });
        state.nodesExploredCount++;
      }

      const neighbors = getNeighbors(current);
      for (const nInfo of neighbors) {
        if (closedMap[nInfo.r][nInfo.c]) continue;

        const tentative_gScore = gScore[current.r][current.c] + 1;

        if (!openMap[nInfo.r][nInfo.c] || tentative_gScore < gScore[nInfo.r][nInfo.c]) {
          gScore[nInfo.r][nInfo.c] = tentative_gScore;

          const neighborNode = new PFNode(nInfo.r, nInfo.c);
          neighborNode.parent = current;
          neighborNode.g = tentative_gScore;

          if (!openMap[nInfo.r][nInfo.c]) {
            openSet.push(neighborNode);
            openMap[nInfo.r][nInfo.c] = true;
            if (!(nInfo.r === state.endNode.r && nInfo.c === state.endNode.c)) {
              state.openSetVis.push({ r: nInfo.r, c: nInfo.c });
            }
          } else {
            for (let i = 0; i < openSet.length; i++) {
              if (openSet[i].r === nInfo.r && openSet[i].c === nInfo.c) {
                openSet[i] = neighborNode;
                break;
              }
            }
          }
        }
      }
      yield 'SEARCHING';
    }
    yield 'NO_PATH';
  }

  function* bfsGen() {
    const state = stateRef.current;
    const queue: PFNode[] = [new PFNode(state.startNode.r, state.startNode.c)];
    const visitedMap: boolean[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    visitedMap[state.startNode.r][state.startNode.c] = true;

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.r === state.endNode.r && current.c === state.endNode.c) {
        const finalPath = reconstructPath(current);
        state.pathVis = finalPath;
        state.pathDistanceCount = finalPath.length;
        yield 'FOUND';
        return;
      }

      if (!(current.r === state.startNode.r && current.c === state.startNode.c)) {
        state.openSetVis = state.openSetVis.filter(n => !(n.r === current.r && n.c === current.c));
        state.closedSetVis.push({ r: current.r, c: current.c });
        state.nodesExploredCount++;
      }

      const neighbors = getNeighbors(current);
      for (const nInfo of neighbors) {
        if (!visitedMap[nInfo.r][nInfo.c]) {
          visitedMap[nInfo.r][nInfo.c] = true;
          const neighborNode = new PFNode(nInfo.r, nInfo.c);
          neighborNode.parent = current;

          queue.push(neighborNode);
          if (!(nInfo.r === state.endNode.r && nInfo.c === state.endNode.c)) {
            state.openSetVis.push({ r: nInfo.r, c: nInfo.c });
          }
        }
      }
      yield 'SEARCHING';
    }
    yield 'NO_PATH';
  }

  const updateTelemetry = useCallback(() => {
    const state = stateRef.current;
    if (dataExploredRef.current) dataExploredRef.current.textContent = String(state.nodesExploredCount);
    if (dataDistanceRef.current) dataDistanceRef.current.textContent = String(state.pathDistanceCount);
  }, []);

  const draw = useCallback(() => {
    const state = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * state.cellW, 0);
      ctx.lineTo(c * state.cellW, canvas.height);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * state.cellH);
      ctx.lineTo(canvas.width, r * state.cellH);
      ctx.stroke();
    }

    ctx.fillStyle = '#bae6fd';
    for (const node of state.closedSetVis) {
      ctx.fillRect(node.c * state.cellW + 1, node.r * state.cellH + 1, state.cellW - 2, state.cellH - 2);
    }

    ctx.fillStyle = '#fef08a';
    for (const node of state.openSetVis) {
      ctx.fillRect(node.c * state.cellW + 1, node.r * state.cellH + 1, state.cellW - 2, state.cellH - 2);
    }

    ctx.fillStyle = '#facc15';
    for (const node of state.pathVis) {
      ctx.fillRect(node.c * state.cellW + 1, node.r * state.cellH + 1, state.cellW - 2, state.cellH - 2);
    }

    ctx.fillStyle = '#0f172a';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (state.grid[r][c] === 1) {
          ctx.fillRect(c * state.cellW + 1, r * state.cellH + 1, state.cellW - 2, state.cellH - 2);
        }
      }
    }

    if (state.pathVis.length > 0) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(state.startNode.c * state.cellW + state.cellW / 2, state.startNode.r * state.cellH + state.cellH / 2);
      for (const node of state.pathVis) {
        ctx.lineTo(node.c * state.cellW + state.cellW / 2, node.r * state.cellH + state.cellH / 2);
      }
      ctx.lineTo(state.endNode.c * state.cellW + state.cellW / 2, state.endNode.r * state.cellH + state.cellH / 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(state.startNode.c * state.cellW + 1, state.startNode.r * state.cellH + 1, state.cellW - 2, state.cellH - 2);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(state.startNode.c * state.cellW + 1, state.startNode.r * state.cellH + 1, state.cellW - 2, state.cellH - 2);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(state.endNode.c * state.cellW + 1, state.endNode.r * state.cellH + 1, state.cellW - 2, state.cellH - 2);
    ctx.strokeRect(state.endNode.c * state.cellW + 1, state.endNode.r * state.cellH + 1, state.cellW - 2, state.cellH - 2);
  }, []);

  const executeStep = useCallback((): boolean => {
    const state = stateRef.current;

    if (!state.pathGenerator) {
      if (state.currentMode === 'ASTAR') state.pathGenerator = aStarGen();
      else if (state.currentMode === 'DIJKSTRA') state.pathGenerator = dijkstraGen();
      else if (state.currentMode === 'BFS') state.pathGenerator = bfsGen();

      if (dataStatusRef.current) {
        dataStatusRef.current.textContent = 'SEDANG MENCARI JALAN...';
        dataStatusRef.current.className = 'text-xs font-black text-sky-400 uppercase tracking-widest';
      }
    }

    const stepsPerFrame = Math.max(1, Math.floor(state.animationSpeed / 10)) * (state.currentMode === 'BFS' || state.currentMode === 'DIJKSTRA' ? 2 : 1);

    let result: IteratorResult<string, void>;
    for (let i = 0; i < stepsPerFrame; i++) {
      result = state.pathGenerator!.next();
      if (result.done || result.value !== 'SEARCHING') break;
    }

    updateTelemetry();
    draw();

    if (result!.done || result!.value === 'FOUND' || result!.value === 'NO_PATH') {
      state.isFinished = true;
      state.isPlaying = false;

      if (btnPlayRef.current) {
        btnPlayRef.current.innerHTML = 'SELESAI';
        btnPlayRef.current.className = 'border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-300 text-slate-600 py-4 text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all';
      }

      if (dataStatusRef.current) {
        if (result!.value === 'FOUND') {
          dataStatusRef.current.textContent = 'RUTE TERPENDEK DITEMUKAN!';
          dataStatusRef.current.className = 'text-xs font-black text-emerald-400 uppercase tracking-widest';
        } else {
          dataStatusRef.current.textContent = 'GAGAL: JALAN BUNTU!';
          dataStatusRef.current.className = 'text-xs font-black text-rose-500 uppercase tracking-widest';
        }
      }
      return false;
    }
    return true;
  }, [updateTelemetry, draw, getNeighbors, heuristic, reconstructPath]);

  const clearPathVisuals = useCallback(() => {
    const state = stateRef.current;
    state.openSetVis = [];
    state.closedSetVis = [];
    state.pathVis = [];
    state.nodesExploredCount = 0;
    state.pathDistanceCount = 0;
    state.isFinished = false;
    state.isPlaying = false;
    state.pathGenerator = null;

    if (btnPlayRef.current) {
      btnPlayRef.current.innerHTML = 'MULAI PENCARIAN';
      btnPlayRef.current.className = 'border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-emerald-400 hover:bg-emerald-300 py-4 text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none';
    }

    if (dataStatusRef.current) {
      dataStatusRef.current.textContent = 'SIAP';
      dataStatusRef.current.className = 'text-xs font-black text-yellow-300 uppercase tracking-widest';
    }

    updateTelemetry();
    draw();
  }, [updateTelemetry, draw]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const state = stateRef.current;

    const rect = canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;

    canvas.width = rect.width;
    canvas.height = rect.height;
    state.cellW = canvas.width / COLS;
    state.cellH = canvas.height / ROWS;
    draw();
  }, [draw]);

  const getGridPos = useCallback((clientX: number, clientY: number): Pos => {
    const canvas = canvasRef.current;
    if (!canvas) return { r: 0, c: 0 };
    const state = stateRef.current;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const px = (clientX - rect.left) * scaleX;
    const py = (clientY - rect.top) * scaleY;

    let c = Math.floor(px / state.cellW);
    let r = Math.floor(py / state.cellH);

    c = Math.max(0, Math.min(COLS - 1, c));
    r = Math.max(0, Math.min(ROWS - 1, r));

    return { r, c };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const state = stateRef.current;
    if (state.isPlaying) return;
    state.isDragging = true;
    const pos = getGridPos(e.clientX, e.clientY);

    if (pos.r === state.startNode.r && pos.c === state.startNode.c) {
      state.dragMode = 'START';
    } else if (pos.r === state.endNode.r && pos.c === state.endNode.c) {
      state.dragMode = 'END';
    } else {
      if (state.grid[pos.r][pos.c] === 1) {
        state.dragMode = 'WALL_REMOVE';
        state.grid[pos.r][pos.c] = 0;
      } else {
        state.dragMode = 'WALL_ADD';
        state.grid[pos.r][pos.c] = 1;
      }
    }

    clearPathVisuals();
  }, [getGridPos, clearPathVisuals]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const state = stateRef.current;
    if (!state.isDragging || state.isPlaying) return;
    e.preventDefault();

    const pos = getGridPos(e.clientX, e.clientY);

    if (state.dragMode === 'START') {
      if (!(pos.r === state.endNode.r && pos.c === state.endNode.c)) {
        state.startNode = { r: pos.r, c: pos.c };
        state.grid[pos.r][pos.c] = 0;
      }
    } else if (state.dragMode === 'END') {
      if (!(pos.r === state.startNode.r && pos.c === state.startNode.c)) {
        state.endNode = { r: pos.r, c: pos.c };
        state.grid[pos.r][pos.c] = 0;
      }
    } else if (state.dragMode === 'WALL_ADD') {
      if (!(pos.r === state.startNode.r && pos.c === state.startNode.c) && !(pos.r === state.endNode.r && pos.c === state.endNode.c)) {
        state.grid[pos.r][pos.c] = 1;
      }
    } else if (state.dragMode === 'WALL_REMOVE') {
      state.grid[pos.r][pos.c] = 0;
    }

    draw();
  }, [getGridPos, draw]);

  const handlePointerUp = useCallback(() => {
    const state = stateRef.current;
    state.isDragging = false;
    state.dragMode = null;
  }, []);

  const setMode = useCallback((mode: AlgoMode) => {
    const state = stateRef.current;
    state.currentMode = mode;
    clearPathVisuals();

    if (btnAStarRef.current && btnDijkstraRef.current && btnBFSRef.current) {
      const btns = [btnAStarRef.current, btnDijkstraRef.current, btnBFSRef.current];
      btns.forEach(btn => {
        btn.classList.remove('ring-4', 'ring-black', 'bg-blue-400', 'text-white');
        btn.classList.add('bg-slate-200', 'text-slate-600');
      });

      const activeBtn = mode === 'ASTAR' ? btnAStarRef.current : mode === 'DIJKSTRA' ? btnDijkstraRef.current : btnBFSRef.current;
      activeBtn.classList.add('ring-4', 'ring-black', 'bg-blue-400', 'text-white');
      activeBtn.classList.remove('bg-slate-200', 'text-slate-600');
    }
  }, [clearPathVisuals]);

  const handlePlay = useCallback(() => {
    const state = stateRef.current;
    if (state.isFinished) return;

    state.isPlaying = !state.isPlaying;

    if (btnPlayRef.current) {
      if (state.isPlaying) {
        btnPlayRef.current.innerHTML = 'JEDA PENCARIAN';
        btnPlayRef.current.className = 'border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-yellow-400 hover:bg-yellow-300 py-4 text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none';
        if (dataStatusRef.current) {
          dataStatusRef.current.textContent = 'SEDANG MENCARI JALAN...';
          dataStatusRef.current.className = 'text-xs font-black text-sky-400 uppercase tracking-widest';
        }
      } else {
        btnPlayRef.current.innerHTML = 'LANJUTKAN';
        btnPlayRef.current.className = 'border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-emerald-400 hover:bg-emerald-300 py-4 text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none';
        if (dataStatusRef.current) {
          dataStatusRef.current.textContent = 'DIJEDA (PAUSED)';
          dataStatusRef.current.className = 'text-xs font-black text-yellow-300 uppercase tracking-widest';
        }
      }
    }
  }, []);

  const handleRandomMaze = useCallback(() => {
    const state = stateRef.current;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if ((r === state.startNode.r && c === state.startNode.c) || (r === state.endNode.r && c === state.endNode.c)) {
          state.grid[r][c] = 0;
        } else {
          state.grid[r][c] = Math.random() < 0.3 ? 1 : 0;
        }
      }
    }
    clearPathVisuals();
  }, [clearPathVisuals]);

  const handleClearWalls = useCallback(() => {
    const state = stateRef.current;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        state.grid[r][c] = 0;
      }
    }
    clearPathVisuals();
  }, [clearPathVisuals]);

  const animate = useCallback((timestamp: number) => {
    const state = stateRef.current;
    if (!state.lastFrameTime) state.lastFrameTime = timestamp;
    const elapsed = timestamp - state.lastFrameTime;

    if (sliderSpeedRef.current) {
      state.animationSpeed = parseInt(sliderSpeedRef.current.value);
      let speedText = 'Sedang';
      if (state.animationSpeed < 30) speedText = 'Lambat';
      else if (state.animationSpeed > 70) speedText = 'Sangat Cepat';
      if (valSpeedRef.current) valSpeedRef.current.textContent = speedText;
    }

    const delay = state.animationSpeed < 20 ? 100 : 0;

    if (state.isPlaying && elapsed > delay) {
      state.lastFrameTime = timestamp;
      const continuePlaying = executeStep();
      if (!continuePlaying) state.isPlaying = false;
    }

    state.animationId = requestAnimationFrame(animate);
  }, [executeStep]);

  useEffect(() => {
    const state = stateRef.current;

    state.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

    resizeCanvas();
    state.animationId = requestAnimationFrame(animate);

    const handleResize = () => resizeCanvas();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(state.animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [resizeCanvas, animate]);

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 md:p-8 flex flex-col items-center" style={{ backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <header className="text-center mb-8 max-w-6xl bg-blue-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full relative">
        <div className="absolute -top-4 -left-4 bg-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-sm -rotate-3 text-black">KECERDASAN BUATAN & GRAF</div>
        <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-black">LAB VIRTUAL: PATHFINDING</h1>
        <p className="text-md md:text-lg font-semibold bg-white inline-block px-4 py-2 border-2 border-black text-black shadow-[4px_4px_0px_#000]">Visualisasi Pencarian Rute Terpendek (A*, Dijkstra, BFS)</p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mb-10 z-10 items-stretch">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 relative flex flex-col gap-6 w-full lg:w-1/3 justify-between">
          <span className="absolute -top-4 right-6 bg-slate-900 text-white font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_#3b82f6] text-md rotate-2 z-30 uppercase">Panel Kendali</span>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Pilih Algoritma Pencarian</label>
              <div className="grid grid-cols-1 gap-2">
                <button ref={btnAStarRef} onClick={() => setMode('ASTAR')} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-blue-400 text-white py-2 px-3 text-xs font-bold text-left flex justify-between items-center ring-4 ring-black uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
                  <span>A* SEARCH</span>
                  <span className="text-[9px] bg-white text-black px-1 border border-black">Terbaik</span>
                </button>
                <button ref={btnDijkstraRef} onClick={() => setMode('DIJKSTRA')} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-200 text-slate-600 py-2 px-3 text-xs font-bold text-left flex justify-between items-center uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
                  <span>DIJKSTRA</span>
                  <span className="text-[9px] bg-white text-black px-1 border border-black">Pastik Pendek</span>
                </button>
                <button ref={btnBFSRef} onClick={() => setMode('BFS')} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-200 text-slate-600 py-2 px-3 text-xs font-bold text-left flex justify-between items-center uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
                  <span>BFS</span>
                  <span className="text-[9px] bg-white text-black px-1 border border-black">Menyebar</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-4 border-4 border-black bg-slate-50 shadow-[4px_4px_0px_0px_#000]">
              <label className="text-[11px] font-black uppercase text-slate-500 mb-1">Pengaturan Peta (Grid)</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleRandomMaze} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-slate-800 text-white hover:bg-slate-700 py-2 px-2 text-[10px] font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">ACAK TEMBOK</button>
                <button onClick={handleClearWalls} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-white text-slate-800 py-2 px-2 text-[10px] font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">HAPUS TEMBOK</button>
              </div>
              <div className="text-[10px] font-bold text-blue-600 mt-1 bg-blue-50 p-2 border border-blue-200">
                <b>Tips:</b> Klik dan seret (drag) pada kotak untuk menggambar tembok. Geser ikon Mulai/Selesai untuk memindahkannya.
              </div>
            </div>

            <div className="bg-sky-50 p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-sky-800 uppercase text-[10px]">Kecepatan Animasi</span>
                <span ref={valSpeedRef} className="font-mono font-black text-sm bg-white px-2 border-2 border-black text-sky-600">Cepat</span>
              </div>
              <input ref={sliderSpeedRef} type="range" min="1" max="100" step="1" defaultValue="80" className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer" />
            </div>

            <div className="flex flex-col gap-2 border-t-4 border-black pt-4">
              <button ref={btnPlayRef} onClick={handlePlay} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-emerald-400 hover:bg-emerald-300 py-4 text-sm flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">MULAI PENCARIAN</button>
              <button onClick={clearPathVisuals} className="border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg bg-rose-300 hover:bg-rose-200 py-2 text-xs w-full flex items-center justify-center gap-2 font-bold uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">BERSIHKAN JALUR (RESET)</button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] mt-4">
            <h4 className="font-black text-blue-400 text-[10px] mb-3 uppercase tracking-widest border-b-2 border-slate-700 pb-2">METRIK KINERJA ALGORITMA</h4>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Titik Dieksplorasi</span>
                <span ref={dataExploredRef} className="text-2xl font-black text-sky-400 font-mono">0</span>
              </div>
              <div className="bg-slate-800 p-2 border-2 border-slate-600 rounded flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-400 mb-1">Jarak Rute (Panjang)</span>
                <span ref={dataDistanceRef} className="text-2xl font-black text-emerald-400 font-mono">0</span>
              </div>
            </div>

            <div className="bg-black p-2 border-2 border-dashed border-slate-500 flex justify-between items-center">
              <span className="text-[9px] font-bold uppercase text-slate-400">Status Operasi:</span>
              <span ref={dataStatusRef} className="text-xs font-black text-yellow-300 uppercase tracking-widest">SIAP</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-slate-100 border-8 border-black rounded-xl relative flex flex-col w-full h-[600px] overflow-hidden" style={{ backgroundColor: '#f8fafc', backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
            <span className="absolute top-4 left-4 bg-white text-black font-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000] text-[10px] -rotate-1 z-30 uppercase">Peta Navigasi</span>

            <div className="absolute top-4 right-4 z-20 bg-white/90 p-2 border-2 border-black flex flex-col gap-1 text-[9px] font-bold uppercase shadow-[2px_2px_0px_#000]">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 border border-black"></div> Titik Awal</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-500 border border-black"></div> Titik Tujuan</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-900 border border-black"></div> Tembok (Rintangan)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-sky-200 border border-black opacity-70"></div> Area Dieksplorasi</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-400 border border-black"></div> Rute Terpendek</div>
            </div>

            <div className="w-full h-full relative z-10 flex items-center justify-center p-4 pt-20 pb-4">
              <canvas ref={canvasRef} className="w-full h-full border-4 border-black shadow-[4px_4px_0px_0px_#000] bg-white cursor-crosshair" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} style={{ touchAction: 'none' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-blue-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 w-full max-w-6xl z-10 relative mb-10 text-black">
        <h3 className="text-xl font-bold bg-white inline-block px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-6 -rotate-1 uppercase text-black">Buku Panduan: Cara AI Mencari Jalan</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-blue-700 border-b-2 border-black pb-1 mb-2">Algoritma A* (A-Star)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Algoritma paling populer untuk navigasi game dan peta GPS. Ia menggunakan <b>Heuristik (Tebakan pintar)</b>, seperti menghitung jarak garis lurus ke target, sehingga ia tahu arah mana yang "mungkin" lebih dekat. Hasilnya? Ia menemukan rute terpendek dengan jumlah eksplorasi sel yang sangat sedikit!
            </p>
          </div>
          
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-emerald-700 border-b-2 border-black pb-1 mb-2">Algoritma Dijkstra</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Dijkstra dijamin selalu menemukan rute terpendek, namun ia <b>tidak memiliki arah</b> (buta). Ia akan mencari ke segala arah secara perlahan seperti riak air yang menyebar dari titik awal. Akibatnya, jumlah titik yang dieksplorasi jauh lebih banyak dibandingkan A*.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <h4 className="font-black text-lg uppercase text-sky-700 border-b-2 border-black pb-1 mb-2">Breadth-First Search (BFS)</h4>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Algoritma pencarian paling mendasar. Ia mengeksekusi lapisan demi lapisan. Untuk peta dengan bobot langkah yang sama, BFS dan Dijkstra akan memiliki pola penyebaran dan hasil yang identik.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}