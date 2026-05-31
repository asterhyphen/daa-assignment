// Spam Filtering Module Logic

// Initial keywords list
let spamKeywords = [
  { text: "Urgent", weight: 6 },
  { text: "Winner", weight: 8 },
  { text: "USD", weight: 5 },
  { text: "Inheritance", weight: 9 },
  { text: "Guaranteed", weight: 7 },
  { text: "Free", weight: 5 },
  { text: "Verify", weight: 5 }
];

// Email templates
const templates = {
  scam: `SUBJECT: Urgent Notice of Unclaimed Inheritance Account

Dear Beneficiary,

We have verified an inheritance fund of 950,000 USD under your name. This is guaranteed to be transferred to your bank account once you verify your personal credentials. 

Please reply with urgent priority as this fund will be returned to the government vault within 48 hours.

Sincerely,
Central Asset Registry`,
  
  promo: `CONGRATULATIONS STUDENT!

You are the lucky winner of our weekly campus raffle! You have won a free gift card worth 500 USD, guaranteed. 

To claim your prize, click the urgent link below and verify your academic login details. 

This offer is free but valid for today only. Act fast!`,

  meeting: `Subject: CS Department Curriculum Review Agenda

Hi Faculty,

Our next curriculum review meeting is scheduled for Wednesday at 10:00 AM in Conference Room B. 

We will verify the new course proposals and discuss the distribution of laboratory budgets. Please review the attached draft syllabus.

Best regards,
Admin Coordinator`,

  warning: `SECURITY WARNING: Verify Your Campus Account

Dear User,

Our campus network systems detected an unauthorized login attempt on your account. 

For your protection, you must verify your credentials immediately. Failure to do so will result in permanent suspension of all academic portals. 

Click here to resolve this urgent issue now.`
};

// Global Animation State variables
let animationSteps = [];
let currentStepIdx = 0;
let animationTimer = null;
let selectedTraceWord = "Winner";

// Initialize UI Elements
document.addEventListener("DOMContentLoaded", () => {
  initTemplates();
  initKeywordTags();
  initTabs();
  
  // Set default email template
  document.getElementById("email-text").value = templates.scam;
  
  // Custom keyword event listeners
  document.getElementById("btn-add-keyword").addEventListener("click", addNewKeyword);
  document.getElementById("btn-run-scan").addEventListener("click", runFullScan);
  
  // Animation Event listeners
  document.getElementById("select-trace-word").addEventListener("change", (e) => {
    selectedTraceWord = e.target.value;
    resetVisualizer();
  });
  document.getElementById("btn-anim-play").addEventListener("click", togglePlayAnimation);
  document.getElementById("btn-anim-next").addEventListener("click", stepForward);
  document.getElementById("btn-anim-prev").addEventListener("click", stepBackward);
  document.getElementById("btn-anim-reset").addEventListener("click", resetVisualizer);
  
  // Scan initially
  runFullScan();
});

// Setup templates load
function initTemplates() {
  document.getElementById("btn-tpl-scam").addEventListener("click", () => loadTemplate("scam"));
  document.getElementById("btn-tpl-promo").addEventListener("click", () => loadTemplate("promo"));
  document.getElementById("btn-tpl-meeting").addEventListener("click", () => loadTemplate("meeting"));
  document.getElementById("btn-tpl-warning").addEventListener("click", () => loadTemplate("warning"));
}

function loadTemplate(key) {
  document.getElementById("email-text").value = templates[key];
  if (typeof synth !== 'undefined') synth.playFlip();
  runFullScan();
}

// Keyword management tags display
function initKeywordTags() {
  const container = document.getElementById("keyword-tags-container");
  container.innerHTML = "";
  
  spamKeywords.forEach((kw, index) => {
    const tag = document.createElement("div");
    tag.className = "keyword-tag";
    tag.innerHTML = `
      <span>${kw.text}</span>
      <span class="badge" style="background-color: var(--marker-yellow); border-width: 1px; font-size: 0.75rem;">${kw.weight} pts</span>
      <span class="remove-tag" onclick="removeKeyword(${index})">×</span>
    `;
    container.appendChild(tag);
  });
  
  // Update select trace word options
  const select = document.getElementById("select-trace-word");
  const prevVal = select.value || selectedTraceWord;
  select.innerHTML = "";
  
  spamKeywords.forEach(kw => {
    const opt = document.createElement("option");
    opt.value = kw.text;
    opt.textContent = kw.text;
    if (kw.text.toLowerCase() === prevVal.toLowerCase()) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });
  
  selectedTraceWord = select.value || (spamKeywords[0] ? spamKeywords[0].text : "");
  resetVisualizer();
}

function addNewKeyword() {
  const input = document.getElementById("new-keyword");
  const weightInput = document.getElementById("new-weight");
  
  const text = input.value.trim();
  const weight = parseInt(weightInput.value);
  
  if (text && !isNaN(weight) && weight >= 1 && weight <= 10) {
    // Check duplicates
    if (spamKeywords.some(kw => kw.text.toLowerCase() === text.toLowerCase())) {
      alert("Keyword already exists!");
      return;
    }
    
    spamKeywords.push({ text, weight });
    input.value = "";
    weightInput.value = "3";
    initKeywordTags();
    runFullScan();
  }
}

function removeKeyword(index) {
  spamKeywords.splice(index, 1);
  initKeywordTags();
  runFullScan();
}

// Running Naive search for full scan calculations
function naiveSearchOccurrences(text, pattern) {
  const indices = [];
  const N = text.length;
  const M = pattern.length;
  if (M === 0 || N === 0 || M > N) return indices;
  
  for (let i = 0; i <= N - M; i++) {
    let j = 0;
    while (j < M && text[i + j].toLowerCase() === pattern[j].toLowerCase()) {
      j++;
    }
    if (j === M) {
      indices.push(i);
    }
  }
  return indices;
}

// Run Full Scan on email textarea
function runFullScan() {
  const emailText = document.getElementById("email-text").value;
  const flaggedContainer = document.getElementById("flagged-list");
  flaggedContainer.innerHTML = "";
  
  let totalThreatScore = 0;
  let matchesFoundCount = 0;
  
  spamKeywords.forEach(kw => {
    const matches = naiveSearchOccurrences(emailText, kw.text);
    if (matches.length > 0) {
      matchesFoundCount += matches.length;
      const points = kw.weight * matches.length;
      totalThreatScore += points;
      
      const item = document.createElement("div");
      item.className = "flagged-item";
      item.innerHTML = `
        <span>🔍 Found <strong>"${kw.text}"</strong> (x${matches.length})</span>
        <span style="font-family: var(--font-ui); font-weight: bold; color: var(--pencil-red);">+${points} pts</span>
      `;
      flaggedContainer.appendChild(item);
    }
  });
  
  if (flaggedContainer.children.length === 0) {
    flaggedContainer.innerHTML = `<p style="opacity: 0.6; font-style: italic;">Clean email! No threat keywords detected.</p>`;
  }
  
  // Calculate percentage out of 30 maximum severity threshold
  const maxThreshold = 35;
  const scorePercent = Math.min(100, Math.round((totalThreatScore / maxThreshold) * 100));
  
  // Rotate Needle
  // Needle starts pointing left (-90deg at 0%) and rotates to right (90deg at 100%)
  const needleRotation = -90 + (scorePercent * 1.8);
  document.getElementById("gauge-needle").style.transform = `rotate(${needleRotation}deg)`;
  
  // Label and badge
  document.getElementById("spam-score-label").textContent = `Spam Threat: ${scorePercent}%`;
  
  const statusBadge = document.getElementById("spam-status-badge");
  if (scorePercent <= 15) {
    statusBadge.textContent = "LEGITIMATE";
    statusBadge.style.backgroundColor = "var(--marker-green)";
    statusBadge.style.color = "var(--pencil-green)";
  } else if (scorePercent <= 50) {
    statusBadge.textContent = "SUSPICIOUS";
    statusBadge.style.backgroundColor = "var(--marker-yellow)";
    statusBadge.style.color = "var(--ink-color)";
  } else {
    statusBadge.textContent = "SPAM DANGER";
    statusBadge.style.backgroundColor = "var(--marker-red)";
    statusBadge.style.color = "var(--pencil-red)";
  }

  // Play audio alarm warning if spam threat is high
  if (scorePercent > 50 && typeof synth !== 'undefined') {
    synth.playSqueak();
  }
  
  resetVisualizer();
}

// ----------------- Visualizer State Machine Logic -----------------

function resetVisualizer() {
  stopAnimation();
  
  const emailText = document.getElementById("email-text").value;
  // Get first ~35 characters of text for clear horizontal visual layout
  let croppedText = emailText.replace(/\n/g, " ").trim();
  if (croppedText.length > 35) {
    croppedText = croppedText.substring(0, 35) + "...";
  }
  
  if (!selectedTraceWord || selectedTraceWord.length === 0) {
    document.getElementById("text-buffer-row").innerHTML = "Add/Select a keyword to visualize.";
    document.getElementById("pattern-buffer-row").innerHTML = "";
    return;
  }
  
  animationSteps = generateNaiveSearchSteps(croppedText, selectedTraceWord);
  currentStepIdx = 0;
  
  renderVisualizerStep(0);
}

function generateNaiveSearchSteps(text, pattern) {
  const steps = [];
  const N = text.length;
  const M = pattern.length;
  let comparisons = 0;
  const matches = [];

  // Step 0: init
  steps.push({
    i: 0,
    j: 0,
    status: 'start',
    comparisons: 0,
    matches: [...matches],
    line: 1,
    desc: `Initialize. Searching for keyword "${pattern}" (M=${M}) in text (N=${N}).`
  });

  for (let i = 0; i <= N - M; i++) {
    // Shift alignment
    steps.push({
      i: i,
      j: 0,
      status: 'align',
      comparisons: comparisons,
      matches: [...matches],
      line: 1,
      desc: `Shifting alignment index i = ${i}. Testing alignment.`
    });

    steps.push({
      i: i,
      j: 0,
      status: 'init_j',
      comparisons: comparisons,
      matches: [...matches],
      line: 2,
      desc: `Resetting pattern pointer j = 0.`
    });

    let j = 0;
    while (j < M) {
      comparisons++;
      
      // Step: comparing
      steps.push({
        i: i,
        j: j,
        status: 'comparing',
        comparisons: comparisons,
        matches: [...matches],
        line: 3,
        desc: `Comparing Text[${i + j}] ('${text[i+j]}') vs Pattern[${j}] ('${pattern[j]}').`
      });

      if (text[i + j].toLowerCase() === pattern[j].toLowerCase()) {
        j++;
        // Char matched
        steps.push({
          i: i,
          j: j,
          status: 'char_match',
          comparisons: comparisons,
          matches: [...matches],
          line: 4,
          desc: `Characters match! Incrementing index j = ${j}.`
        });
      } else {
        // Mismatch
        steps.push({
          i: i,
          j: j,
          status: 'mismatch',
          comparisons: comparisons,
          matches: [...matches],
          line: 3,
          desc: `Characters mismatch. Shift alignment.`
        });
        break;
      }
    }

    // Checking if full pattern match
    steps.push({
      i: i,
      j: j,
      status: 'check_found',
      comparisons: comparisons,
      matches: [...matches],
      line: 5,
      desc: `Loop evaluation: Check if j (${j}) equals M (${M}).`
    });

    if (j === M) {
      matches.push(i);
      steps.push({
        i: i,
        j: j,
        status: 'found',
        comparisons: comparisons,
        matches: [...matches],
        line: 6,
        desc: `Bingo! Full keyword match found at text index ${i}.`
      });
    }
  }

  steps.push({
    i: N - M,
    j: 0,
    status: 'done',
    comparisons: comparisons,
    matches: [...matches],
    line: 1,
    desc: `Filtering complete. Scanned text of length ${N}. Found ${matches.length} matches.`
  });

  return steps;
}

function renderVisualizerStep(stepIdx) {
  if (animationSteps.length === 0) return;
  
  const step = animationSteps[stepIdx];
  const emailText = document.getElementById("email-text").value;
  let croppedText = emailText.replace(/\n/g, " ").trim();
  if (croppedText.length > 35) {
    croppedText = croppedText.substring(0, 35) + "...";
  }
  
  const N = croppedText.length;
  const M = selectedTraceWord.length;
  
  // Render Text Buffer Row
  const textRow = document.getElementById("text-buffer-row");
  textRow.innerHTML = "";
  for (let c = 0; c < N; c++) {
    const box = document.createElement("div");
    box.className = "char-box";
    box.textContent = croppedText[c];
    
    // Highlights depending on algorithm state
    if (step.status !== 'start' && step.status !== 'done') {
      const activeTextIdx = step.i + step.j;
      // Is this character currently being evaluated?
      if (c === activeTextIdx && (step.status === 'comparing' || step.status === 'mismatch')) {
        box.classList.add(step.status === 'comparing' ? 'checking' : 'mismatched');
      } else if (c < activeTextIdx && c >= step.i && step.status !== 'align') {
        box.classList.add('matched');
      }
      
      // Highlight already completed full matches
      step.matches.forEach(mIdx => {
        if (c >= mIdx && c < mIdx + M) {
          box.classList.add('full-match');
        }
      });
    }
    
    textRow.appendChild(box);
  }

  // Render Pattern Row (physical sliding)
  const patternRow = document.getElementById("pattern-buffer-row");
  patternRow.innerHTML = "";
  for (let p = 0; p < M; p++) {
    const box = document.createElement("div");
    box.className = "char-box";
    box.textContent = selectedTraceWord[p];
    
    if (step.status !== 'start' && step.status !== 'done' && step.status !== 'align') {
      if (p === step.j && step.status === 'comparing') {
        box.classList.add('checking');
      } else if (p === step.j && step.status === 'mismatch') {
        box.classList.add('mismatched');
      } else if (p < step.j) {
        box.classList.add('matched');
      }
    }
    
    patternRow.appendChild(box);
  }
  
  // Shift the Pattern Row horizontally to align under the checked text index
  // Width of char-box is 36px + 4px margin = 40px
  const charBoxWidth = 40; 
  patternRow.style.transform = `translateX(${step.i * charBoxWidth}px)`;
  
  // Log message and pseudocode highlights
  document.getElementById("animation-log-text").innerHTML = `<strong>Step ${stepIdx + 1}/${animationSteps.length}:</strong> ${step.desc}`;
  
  // Highlight pseudocode lines
  for (let l = 1; l <= 6; l++) {
    const lineEl = document.getElementById(`p-line-${l}`);
    if (l === step.line) {
      lineEl.classList.add('active-line');
    } else {
      lineEl.classList.remove('active-line');
    }
  }

  // Update Stats
  document.getElementById("stat-comparisons").textContent = step.comparisons;
  document.getElementById("stat-n").textContent = N;
  document.getElementById("stat-m").textContent = M;
  
  // Audio feedback when character matches or mismatch
  if (typeof synth !== 'undefined' && stepIdx > 0) {
    if (step.status === 'char_match' || step.status === 'found') {
      synth.playSqueak();
    } else if (step.status === 'mismatch' || step.status === 'comparing') {
      synth.playScribble();
    }
  }

  // Update Complexity Scatter Dot
  updateComplexityChart(N, M, step.comparisons);
}

function updateComplexityChart(N, M, actualOps) {
  // Chart is 280 x 200 SVG. Plotting area: X (30 to 280), Y (170 to 10)
  // X represents Text Length N (0 to 50 map to 30 to 280)
  // Y represents Operations Ops (0 to max 150 map to 170 to 10)
  const maxN = 50;
  const maxOps = 120;
  
  const mapX = (N / maxN) * (280 - 30) + 30;
  // Cap at bounding height
  const mapY = 170 - (Math.min(maxOps, actualOps) / maxOps) * (170 - 10);
  
  const point = document.getElementById("actual-comp-point");
  const label = document.getElementById("actual-comp-label");
  
  if (point && label) {
    point.setAttribute("cx", mapX);
    point.setAttribute("cy", mapY);
    label.setAttribute("x", mapX + 10);
    label.setAttribute("y", mapY + 5);
    label.textContent = `Actual: ${actualOps} ops`;
  }
}

// Play Pause Controls
function togglePlayAnimation() {
  const playBtn = document.getElementById("btn-anim-play");
  if (animationTimer) {
    stopAnimation();
  } else {
    if (currentStepIdx >= animationSteps.length - 1) {
      currentStepIdx = 0; // Rewind
    }
    playBtn.innerHTML = "⏸ Pause";
    playBtn.style.backgroundColor = "var(--marker-yellow)";
    
    const speed = parseInt(document.getElementById("anim-speed").value);
    
    // Audio flip to start
    if (typeof synth !== 'undefined') synth.playFlip();
    
    animationTimer = setInterval(() => {
      currentStepIdx++;
      if (currentStepIdx < animationSteps.length) {
        renderVisualizerStep(currentStepIdx);
      } else {
        stopAnimation();
      }
    }, speed);
  }
}

function stopAnimation() {
  const playBtn = document.getElementById("btn-anim-play");
  if (playBtn) {
    playBtn.innerHTML = "▶ Play";
    playBtn.style.backgroundColor = "var(--btn-bg)";
  }
  if (animationTimer) {
    clearInterval(animationTimer);
    animationTimer = null;
  }
}

function stepForward() {
  stopAnimation();
  if (currentStepIdx < animationSteps.length - 1) {
    currentStepIdx++;
    renderVisualizerStep(currentStepIdx);
  }
}

function stepBackward() {
  stopAnimation();
  if (currentStepIdx > 0) {
    currentStepIdx--;
    renderVisualizerStep(currentStepIdx);
  }
}

// Tabs switching handler
function initTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      if (typeof synth !== 'undefined') synth.playFlip();
      
      // Deactivate all
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      
      // Activate clicked
      tab.classList.add("active");
      const contentId = tab.getAttribute("data-tab");
      document.getElementById(contentId).classList.add("active");
    });
  });
}
