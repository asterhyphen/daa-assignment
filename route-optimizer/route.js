// Route Optimization Module Logic

// Graph definitions
const nodeKeys = ['A', 'E', 'L', 'S', 'D', 'R'];
const nodeNames = {
  'A': 'Admin Hall',
  'E': 'Engineering Dept',
  'L': 'Main Library',
  'S': 'Science Labs',
  'D': 'Student Dormitories',
  'R': 'Sports Arena'
};

const nodeCoordinates = {
  'A': { x: 100, y: 110 },
  'E': { x: 150, y: 280 },
  'L': { x: 300, y: 90 },
  'S': { x: 460, y: 130 },
  'D': { x: 350, y: 310 },
  'R': { x: 530, y: 290 }
};

// V x V matrices dimensions
const V = nodeKeys.length;

// Adjacency distances (direct weights)
const graphWeights = [
  // A, E, L, S, D, R
  [0, 4, 8, Infinity, Infinity, Infinity],        // A
  [4, 0, 5, Infinity, 6, Infinity],               // E
  [8, 5, 0, 6, Infinity, Infinity],               // L
  [Infinity, Infinity, 6, 0, 5, 4],               // S
  [Infinity, 6, Infinity, 5, 0, 7],               // D
  [Infinity, Infinity, Infinity, 4, 7, 0]         // R
];

// Global Matrix States History
let fwStates = [];
let currentKIdx = 0;
let solverTimer = null;

// User routing selections
let startNode = "L";
let endNode = "R";

document.addEventListener("DOMContentLoaded", () => {
  // Compute Floyd-Warshall step details
  precomputeFloydWarshall();
  
  // Initialize UI controls
  initMapClicks();
  initDropdowns();
  initSolverControls();
  
  // Draw initial route
  triggerRouteCalculation();
});

// Floyd-Warshall dynamic programming algorithm recorder
function precomputeFloydWarshall() {
  fwStates = [];
  
  // Clone initial weights matrix
  let D = graphWeights.map(row => [...row]);
  
  // Init Predecessor Matrix
  // P[i][j] = i if edge (i,j) exists and weight < infinity, else null
  let P = [];
  for (let i = 0; i < V; i++) {
    P[i] = [];
    for (let j = 0; j < V; j++) {
      if (i !== j && graphWeights[i][j] !== Infinity) {
        P[i][j] = i;
      } else {
        P[i][j] = null;
      }
    }
  }

  // Record initial State 0 (k = 0)
  fwStates.push({
    k: 0,
    kNode: null,
    D: D.map(row => [...row]),
    P: P.map(row => [...row]),
    updates: [],
    message: "Initialization step. Displaying direct connections and distances (Adjacency Matrix)."
  });

  // Solve through k intermediate nodes
  for (let k = 0; k < V; k++) {
    const kNode = nodeKeys[k];
    let nextD = D.map(row => [...row]);
    let nextP = P.map(row => [...row]);
    let stepUpdates = [];
    let logMsg = `Allowing paths to go through intermediate vertex <strong>${nodeNames[kNode]} (${kNode})</strong>.<br>`;
    let updateTexts = [];

    for (let i = 0; i < V; i++) {
      for (let j = 0; j < V; j++) {
        if (i === j) continue;
        
        const pathThroughK = D[i][k] + D[k][j];
        if (pathThroughK < D[i][j]) {
          nextD[i][j] = pathThroughK;
          nextP[i][j] = P[k][j];
          stepUpdates.push({ i, j, oldVal: D[i][j], newVal: pathThroughK });
          
          updateTexts.push(`${nodeKeys[i]}→${nodeKeys[j]} updated to ${pathThroughK} via ${kNode} (was ${D[i][j] === Infinity ? '∞' : D[i][j]})`);
        }
      }
    }

    if (updateTexts.length > 0) {
      logMsg += `Found ${updateTexts.length} shorter paths: ` + updateTexts.slice(0, 3).join(", ") + (updateTexts.length > 3 ? "..." : "");
    } else {
      logMsg += "No shorter paths found using this intermediate vertex.";
    }

    // Set matrices for next loop
    D = nextD.map(row => [...row]);
    P = nextP.map(row => [...row]);

    // Record State (k = k+1)
    fwStates.push({
      k: k + 1,
      kNode: kNode,
      D: D.map(row => [...row]),
      P: P.map(row => [...row]),
      updates: stepUpdates,
      message: logMsg
    });
  }
}

// Draw short path on map
function triggerRouteCalculation() {
  if (!startNode || !endNode) return;
  
  // Highlight nodes on SVG map
  document.querySelectorAll(".map-node").forEach(node => {
    node.classList.remove("start-node", "end-node");
  });
  
  const startEl = document.getElementById(`node-${startNode}`);
  const endEl = document.getElementById(`node-${endNode}`);
  if (startEl) startEl.classList.add("start-node");
  if (endEl) endEl.classList.add("end-node");

  // Sync dropdown values
  document.getElementById("select-start-node").value = startNode;
  document.getElementById("select-end-node").value = endNode;

  // Reconstruct optimal path using the final Floyd-Warshall matrices
  const finalState = fwStates[fwStates.length - 1];
  const finalD = finalState.D;
  const finalP = finalState.P;
  
  const startIndex = nodeKeys.indexOf(startNode);
  const endIndex = nodeKeys.indexOf(endNode);
  
  const totalCost = finalD[startIndex][endIndex];
  
  const narrativeBox = document.getElementById("route-narrative");
  const highlightPath = document.getElementById("route-highlight-path");
  
  if (totalCost === Infinity) {
    narrativeBox.innerHTML = `⚠️ No viable path exists between <strong>${nodeNames[startNode]}</strong> and <strong>${nodeNames[endNode]}</strong>.`;
    highlightPath.setAttribute("d", "");
    return;
  }
  
  if (startNode === endNode) {
    narrativeBox.innerHTML = `📍 You are already at <strong>${nodeNames[startNode]}</strong>. Travel time is 0 minutes!`;
    highlightPath.setAttribute("d", "");
    return;
  }
  
  // Reconstruct
  const pathIndices = reconstructPath(startIndex, endIndex, finalP);
  const pathNodes = pathIndices.map(idx => nodeKeys[idx]);
  
  // Generate narrative details
  let pathText = `🗺️ <strong>Route Found (Travel Time: ${totalCost} mins):</strong><br>`;
  let directions = [];
  for (let i = 0; i < pathNodes.length; i++) {
    directions.push(`<strong>${nodeNames[pathNodes[i]]}</strong>`);
  }
  pathText += directions.join(" ➔ ");
  
  narrativeBox.innerHTML = pathText;
  
  // Draw animated crayon SVG path on the map overlay
  let dString = "";
  pathNodes.forEach((node, idx) => {
    const coords = nodeCoordinates[node];
    if (idx === 0) {
      dString += `M ${coords.x} ${coords.y}`;
    } else {
      dString += ` L ${coords.x} ${coords.y}`;
    }
  });
  
  highlightPath.setAttribute("d", dString);
  
  // Trigger glowing crayon drawing sketch effect
  const length = highlightPath.getTotalLength();
  highlightPath.style.transition = 'none';
  highlightPath.style.strokeDasharray = length + ' ' + length;
  highlightPath.style.strokeDashoffset = length;
  
  // Force browser layout update (reflow)
  highlightPath.getBoundingClientRect();
  
  highlightPath.style.transition = 'stroke-dashoffset 1s ease-in-out';
  highlightPath.style.strokeDashoffset = '0';
  
  // Play sound squeak when path is completed
  if (typeof synth !== 'undefined') {
    synth.playSqueak();
  }
}

// Path reconstruction using predecessor matrix
function reconstructPath(i, j, P) {
  if (i === j) return [i];
  if (P[i][j] === null) return [];
  
  const path = [j];
  let curr = j;
  while (true) {
    let pred = P[i][curr];
    if (pred === null) return [];
    path.unshift(pred);
    if (pred === i) break;
    curr = pred;
  }
  return path;
}

// Set click events on SVG nodes
function initMapClicks() {
  nodeKeys.forEach(key => {
    const nodeEl = document.getElementById(`node-${key}`);
    if (nodeEl) {
      nodeEl.addEventListener("click", () => {
        // Play pencil feedback
        if (typeof synth !== 'undefined') synth.playScribble();
        
        if (startNode && !endNode && startNode !== key) {
          endNode = key;
        } else if (!startNode) {
          startNode = key;
        } else {
          // Clear both and set start
          startNode = key;
          endNode = null;
        }
        triggerRouteCalculation();
      });
    }
  });
}

// Set select changes on dropdown elements
function initDropdowns() {
  const selectStart = document.getElementById("select-start-node");
  const selectEnd = document.getElementById("select-end-node");
  
  selectStart.addEventListener("change", (e) => {
    startNode = e.target.value;
    triggerRouteCalculation();
  });
  
  selectEnd.addEventListener("change", (e) => {
    endNode = e.target.value;
    triggerRouteCalculation();
  });
  
  // Show / Hide Floyd-Warshall panel
  const showBtn = document.getElementById("btn-show-solver");
  const solverPanel = document.getElementById("solver-panel");
  showBtn.addEventListener("click", () => {
    if (solverPanel.style.display === "none") {
      solverPanel.style.display = "block";
      showBtn.textContent = "🙈 Hide Floyd-Warshall Matrices";
      showBtn.style.backgroundColor = "var(--marker-yellow)";
      renderSolverKStep(currentKIdx);
    } else {
      solverPanel.style.display = "none";
      showBtn.textContent = "🔬 Inspect Floyd-Warshall Matrices";
      showBtn.style.backgroundColor = "var(--btn-bg)";
      stopSolverAutoPlay();
    }
  });
}

// Initialize step controls in the Floyd-Warshall matrices card
function initSolverControls() {
  document.getElementById("btn-solver-next").addEventListener("click", stepSolverForward);
  document.getElementById("btn-solver-prev").addEventListener("click", stepSolverBackward);
  document.getElementById("btn-solver-play").addEventListener("click", toggleSolverPlay);
}

function renderSolverKStep(idx) {
  const state = fwStates[idx];
  currentKIdx = idx;
  
  // Highlight intermediate building k on map
  document.querySelectorAll(".map-node").forEach(node => {
    node.classList.remove("k-node");
  });
  if (state.kNode) {
    const kEl = document.getElementById(`node-${state.kNode}`);
    if (kEl) kEl.classList.add("k-node");
  }
  
  // Display intermediate labels
  document.getElementById("current-k-label").innerHTML = state.kNode ? `k = ${nodeNames[state.kNode]} (${state.kNode})` : "k = direct connections";
  document.getElementById("solver-log-message").innerHTML = state.message;
  
  // Render tables
  renderMatrixTable("distance-matrix-table", state.D, state.updates, false, state.k);
  renderMatrixTable("predecessor-matrix-table", state.P, state.updates, true, state.k);
  
  // Play subtle sound scribble when updates occur in matrix
  if (typeof synth !== 'undefined' && idx > 0) {
    if (state.updates.length > 0) {
      synth.playSqueak();
    } else {
      synth.playScribble();
    }
  }
}

function renderMatrixTable(tableId, dataMatrix, updates, isPredecessor, currentKStep) {
  const table = document.getElementById(tableId);
  table.innerHTML = "";
  
  // Header Row
  const headerTr = document.createElement("tr");
  headerTr.appendChild(document.createElement("th")); // Blank top-left cell
  nodeKeys.forEach(key => {
    const th = document.createElement("th");
    th.textContent = key;
    headerTr.appendChild(th);
  });
  table.appendChild(headerTr);
  
  // Body Rows
  for (let i = 0; i < V; i++) {
    const tr = document.createElement("tr");
    
    // Row label cell
    const labelTd = document.createElement("td");
    labelTd.className = "cell-row-header";
    labelTd.textContent = nodeKeys[i];
    tr.appendChild(labelTd);
    
    for (let j = 0; j < V; j++) {
      const td = document.createElement("td");
      
      // Formatting values
      let val = dataMatrix[i][j];
      if (isPredecessor) {
        td.textContent = (val !== null) ? nodeKeys[val] : "-";
      } else {
        td.textContent = (val === Infinity) ? "∞" : val;
      }
      
      // Node k highlight (the row/col of node k is highlight)
      // k step is 1-indexed in fwStates history (k=0 is init adjacency, k=1 is kNode index 0)
      const kIndexFocus = currentKStep - 1; 
      if (kIndexFocus >= 0 && kIndexFocus < V) {
        if (i === kIndexFocus || j === kIndexFocus) {
          td.classList.add("cell-k-focus");
        }
      }
      
      // Check updates from this k step to highlight green
      const isUpdatedCell = updates.some(upd => upd.i === i && upd.j === j);
      if (isUpdatedCell) {
        td.classList.add("cell-updated");
        if (!isPredecessor) {
          // If distance update, show crayon crossed-out styling
          const updateObj = updates.find(upd => upd.i === i && upd.j === j);
          td.innerHTML = `<span class="cell-scribble-out">${updateObj.oldVal === Infinity ? '∞' : updateObj.oldVal}</span> ${updateObj.newVal}`;
        }
      }
      
      tr.appendChild(td);
    }
    
    table.appendChild(tr);
  }
}

// Steppers
function stepSolverForward() {
  stopSolverAutoPlay();
  if (currentKIdx < fwStates.length - 1) {
    currentKIdx++;
    renderSolverKStep(currentKIdx);
  }
}

function stepSolverBackward() {
  stopSolverAutoPlay();
  if (currentKIdx > 0) {
    currentKIdx--;
    renderSolverKStep(currentKIdx);
  }
}

function toggleSolverPlay() {
  const playBtn = document.getElementById("btn-solver-play");
  if (solverTimer) {
    stopSolverAutoPlay();
  } else {
    if (currentKIdx >= fwStates.length - 1) {
      currentKIdx = 0; // Rewind
    }
    playBtn.innerHTML = "⏸ Pause";
    playBtn.style.backgroundColor = "var(--marker-yellow)";
    
    // Play page flip sound
    if (typeof synth !== 'undefined') synth.playFlip();
    
    solverTimer = setInterval(() => {
      currentKIdx++;
      if (currentKIdx < fwStates.length) {
        renderSolverKStep(currentKIdx);
      } else {
        stopSolverAutoPlay();
      }
    }, 2000); // 2 seconds per intermediate vertex update is great readability rate
  }
}

function stopSolverAutoPlay() {
  const playBtn = document.getElementById("btn-solver-play");
  if (playBtn) {
    playBtn.innerHTML = "▶ Auto";
    playBtn.style.backgroundColor = "var(--btn-bg)";
  }
  if (solverTimer) {
    clearInterval(solverTimer);
    solverTimer = null;
  }
}
