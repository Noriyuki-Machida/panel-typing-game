"use strict";

const STORAGE_SETTINGS = "panelTypingGame.settings.v2";
const STORAGE_HISTORY = "panelTypingGame.history.v2";
const STORAGE_REVEAL = "panelTypingGame.reveal.v1";
const BOARD_PANEL_COUNT = 96;
const APP_VERSION = "v2.1";
const SAMPLE_PROBLEMS = [
  {
    id: "english",
    name: "英単語",
    title: "英単語サンプル",
    mode: "typing",
    lines: ["guitar", "keyboard", "rhythm", "melody", "harmony", "studio"]
  },
  {
    id: "math",
    name: "計算クイズ",
    title: "計算クイズサンプル",
    mode: "quiz",
    lines: ["1+1,2", "3+4,7", "9-5,4", "6*3,18", "12/4,3"]
  },
  {
    id: "music",
    name: "音楽問題",
    title: "音楽サンプル",
    mode: "music",
    lines: ["Imagine,John Lennon", "Let It Be,The Beatles", "Purple Haze,Jimi Hendrix", "Respect,Aretha Franklin"]
  }
];

const $ = (id) => document.getElementById(id);
const els = {
  versionBadge: $("versionBadge"),
  stageTitle: $("stageTitle"),
  currentIndex: $("currentIndex"),
  targetCount: $("targetCount"),
  progressTiles: $("progressTiles"),
  progressFill: $("progressFill"),
  correctCount: $("correctCount"),
  missCount: $("missCount"),
  liveScore: $("liveScore"),
  timeLimitInput: $("timeLimitInput"),
  noTimeLimitToggle: $("noTimeLimitToggle"),
  startBtn: $("startBtn"),
  abortBtn: $("abortBtn"),
  folderInput: $("folderInput"),
  fileSelect: $("fileSelect"),
  pasteArea: $("pasteArea"),
  loadPasteBtn: $("loadPasteBtn"),
  playerNameInput: $("playerNameInput"),
  sampleSelect: $("sampleSelect"),
  loadSampleBtn: $("loadSampleBtn"),
  gameTypeSelect: $("gameTypeSelect"),
  questionCountSelect: $("questionCountSelect"),
  modeSelect: $("modeSelect"),
  commaModeSelect: $("commaModeSelect"),
  imageInput: $("imageInput"),
  imageModeSelect: $("imageModeSelect"),
  resetPuzzleBtn: $("resetPuzzleBtn"),
  imageFileName: $("imageFileName"),
  volumeInput: $("volumeInput"),
  soundToggle: $("soundToggle"),
  keySoundToggle: $("keySoundToggle"),
  correctSoundToggle: $("correctSoundToggle"),
  missSoundToggle: $("missSoundToggle"),
  rhythmToggle: $("rhythmToggle"),
  rhythmBpmInput: $("rhythmBpmInput"),
  metronomeLight: $("metronomeLight"),
  rhythmJudge: $("rhythmJudge"),
  rhythmStatus: $("rhythmStatus"),
  demoToggle: $("demoToggle"),
  demoStatus: $("demoStatus"),
  timerValue: $("timerValue"),
  timerFill: $("timerFill"),
  countdownOverlay: $("countdownOverlay"),
  questionText: $("questionText"),
  questionSub: $("questionSub"),
  answerInput: $("answerInput"),
  inputMirror: $("inputMirror"),
  judgeBtn: $("judgeBtn"),
  skipBtn: $("skipBtn"),
  feedbackText: $("feedbackText"),
  feedbackSub: $("feedbackSub"),
  scorePop: $("scorePop"),
  panelBoard: $("panelBoard"),
  resultCorrect: $("resultCorrect"),
  resultMiss: $("resultMiss"),
  resultAccuracy: $("resultAccuracy"),
  resultTime: $("resultTime"),
  resultAverage: $("resultAverage"),
  resultWpm: $("resultWpm"),
  resultCpm: $("resultCpm"),
  resultScore: $("resultScore"),
  rankValue: $("rankValue"),
  rankScore: $("rankScore"),
  rankStars: $("rankStars"),
  rhythmResult: $("rhythmResult"),
  resultKeyAverage: $("resultKeyAverage"),
  analysisComment: $("analysisComment"),
  fastKeys: $("fastKeys"),
  slowKeys: $("slowKeys"),
  strongWords: $("strongWords"),
  weakWords: $("weakWords"),
  missSummary: $("missSummary"),
  missList: $("missList"),
  retryMissBtn: $("retryMissBtn"),
  copyMissBtn: $("copyMissBtn"),
  saveMissBtn: $("saveMissBtn"),
  clearHistoryBtn: $("clearHistoryBtn"),
  rankingTabs: $("rankingTabs"),
  sameConditionToggle: $("sameConditionToggle"),
  rankingList: $("rankingList")
};

const state = {
  files: [],
  imageUrls: [],
  imageUrl: "",
  imageName: "",
  imageFit: "cover",
  game: null,
  timerId: 0,
  countdownId: 0,
  transitionId: 0,
  rhythmTimerId: 0,
  demoTimerId: 0,
  slideshowTimerId: 0,
  slideshowIndex: 0,
  rankingFilter: "typing",
  audioContext: null,
  composing: false,
  settings: loadJson(STORAGE_SETTINGS, {}),
  history: loadJson(STORAGE_HISTORY, []),
  reveal: loadJson(STORAGE_REVEAL, { indices: [] })
};

applySettings();
els.versionBadge.textContent = APP_VERSION;
renderSampleSelect();
renderFileSelect();
renderPanels(0);
renderHistory();
updateTimeLimitControls();
updateAllStats();

els.folderInput.addEventListener("change", handleFolderInput);
els.fileSelect.addEventListener("change", () => {
  applySelectedFileMode();
  persistSettings();
  updateAllStats();
});
els.loadPasteBtn.addEventListener("click", handlePasteLoad);
els.loadSampleBtn.addEventListener("click", handleSampleLoad);
els.playerNameInput.addEventListener("change", () => {
  persistSettings();
  renderHistory();
});
els.imageInput.addEventListener("change", handleImageInput);
els.resetPuzzleBtn.addEventListener("click", resetPuzzle);
els.startBtn.addEventListener("click", () => {
  unlockAudio();
  startGame();
});
els.abortBtn.addEventListener("click", abortGame);
els.judgeBtn.addEventListener("click", judgeCurrentAnswer);
els.skipBtn.addEventListener("click", () => missCurrentQuestion("ミス"));
els.retryMissBtn.addEventListener("click", retryMissQuestions);
els.copyMissBtn.addEventListener("click", copyMissQuestions);
els.saveMissBtn.addEventListener("click", saveMissQuestions);
els.clearHistoryBtn.addEventListener("click", clearHistory);
els.sameConditionToggle.addEventListener("change", renderHistory);
els.rankingTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-score-type]");
  if (!button) return;
  state.rankingFilter = button.dataset.scoreType;
  renderHistory();
});

els.answerInput.addEventListener("compositionstart", () => {
  state.composing = true;
});
els.answerInput.addEventListener("compositionend", () => {
  state.composing = false;
  updateInputMirror();
  checkAutoCorrect();
});
els.answerInput.addEventListener("input", () => {
  updateInputMirror();
  playKeySound();
  checkAutoCorrect();
});
els.answerInput.addEventListener("keydown", (event) => {
  recordKeydown(event);
  if (event.key === "Enter") {
    event.preventDefault();
    judgeCurrentAnswer();
  }
});

[
  els.gameTypeSelect,
  els.questionCountSelect,
  els.modeSelect,
  els.commaModeSelect,
  els.imageModeSelect,
  els.timeLimitInput,
  els.noTimeLimitToggle,
  els.volumeInput,
  els.soundToggle,
  els.keySoundToggle,
  els.correctSoundToggle,
  els.missSoundToggle,
  els.rhythmToggle,
  els.rhythmBpmInput,
  els.demoToggle
].forEach((control) => {
  control.addEventListener("change", () => {
    if (control === els.commaModeSelect) {
      reparseLoadedQuestions();
    }
    persistSettings();
    updateTimeLimitControls();
    updateAllStats();
    if (control === els.soundToggle || control === els.rhythmToggle) {
      unlockAudio();
    }
    if (control === els.rhythmToggle) {
      if (els.rhythmToggle.checked) playRhythmClick(true);
      els.rhythmStatus.textContent = els.rhythmToggle.checked ? `${getRhythmBpm()} BPM / 開始後に鳴ります` : "拍に合うと加点";
    }
    if (control === els.demoToggle) {
      els.demoStatus.textContent = els.demoToggle.checked ? "開始後に自動入力します" : "制限時間の80%で入力";
      if (state.game && state.game.running && state.game.current) {
        state.game.demoEnabled = els.demoToggle.checked;
        if (state.game.demoEnabled) {
          startDemoTyping();
        } else {
          clearDemoTimer();
        }
      }
    }
    if (state.game && state.game.running && state.game.current) {
      startQuestionTimer();
      if (control === els.rhythmToggle || control === els.rhythmBpmInput) {
        state.game.rhythmEnabled = els.rhythmToggle.checked;
        state.game.rhythmBpm = getRhythmBpm();
        startRhythmLoop();
      }
    }
    if (control === els.imageModeSelect) {
      stopSlideshow();
      renderPanels(state.game ? state.game.panelCount : getPreviewPanelCount());
      startSlideshow();
      renderHistory();
    }
  });
  control.addEventListener("input", persistSettings);
});

function reparseLoadedQuestions() {
  for (const file of state.files) {
    file.questions = file.questions.map((question) => ({
      ...parseQuestionLine(question.raw, file.mode),
      fileName: question.fileName,
      sourceTitle: question.sourceTitle
    }));
  }
}

async function handleFolderInput(event) {
  const files = Array.from(event.target.files || [])
    .filter((file) => file.name.toLowerCase().endsWith(".txt"))
    .sort((a, b) => getFilePath(a).localeCompare(getFilePath(b), "ja"));

  const parsed = [];
  for (const file of files) {
    const entry = parseProblemText(await file.text(), file.name);
    if (entry.questions.length) {
      parsed.push({
        id: makeId(),
        name: file.name,
        title: entry.title,
        mode: entry.mode,
        questions: entry.questions.map((question) => ({
          ...question,
          fileName: file.name,
          sourceTitle: entry.title
        }))
      });
    }
  }

  state.files = parsed;
  renderFileSelect();
  updateAllStats();
  setFeedback(parsed.length ? "読み込み完了" : "問題なし", parsed.length ? `${parsed.length}ファイル` : "2行目以降に問題を書いてください", !parsed.length);
}

function handlePasteLoad() {
  const entry = parseProblemText(els.pasteArea.value, "貼り付け問題");
  if (!entry.questions.length) {
    setFeedback("問題なし", "貼り付け欄を確認してください", true);
    return;
  }

  const name = `貼り付け-${new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}.txt`;
  const file = {
    id: makeId(),
    name,
    title: entry.title,
    mode: entry.mode,
    questions: entry.questions.map((question) => ({
      ...question,
      fileName: name,
      sourceTitle: entry.title
    }))
  };
  state.files.push(file);
  els.fileSelect.value = file.id;
  renderFileSelect(file.id);
  updateAllStats();
  setFeedback("貼り付け読込", `${entry.questions.length}問`, false);
}

function renderSampleSelect() {
  els.sampleSelect.innerHTML = "";
  els.sampleSelect.appendChild(new Option("選択してください", ""));
  for (const sample of SAMPLE_PROBLEMS) {
    els.sampleSelect.appendChild(new Option(sample.name, sample.id));
  }
}

function handleSampleLoad() {
  const sample = SAMPLE_PROBLEMS.find((item) => item.id === els.sampleSelect.value) || SAMPLE_PROBLEMS[0];
  if (!sample) return;
  const text = [`#mode=${sample.mode}`, sample.title, ...sample.lines].join("\n");
  const entry = parseProblemText(text, `${sample.name}.txt`);
  const file = {
    id: makeId(),
    name: `${sample.name}.sample`,
    title: entry.title,
    mode: entry.mode,
    questions: entry.questions.map((question) => ({
      ...question,
      fileName: `${sample.name}.sample`,
      sourceTitle: entry.title
    }))
  };
  state.files.push(file);
  renderFileSelect(file.id);
  els.fileSelect.value = file.id;
  applySelectedFileMode();
  updateAllStats();
  setFeedback("サンプル読込", `${sample.name} / ${entry.questions.length}問`, false);
}

function handleImageInput(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;
  stopSlideshow();
  for (const item of state.imageUrls) URL.revokeObjectURL(item.url);
  state.imageUrls = [];
  resetPuzzleState();
  for (const file of files) {
    const item = {
      url: URL.createObjectURL(file),
      name: file.name,
      fit: "cover"
    };
    state.imageUrls.push(item);
    const probe = new Image();
    probe.onload = () => {
      item.fit = probe.naturalHeight > probe.naturalWidth ? "contain" : "cover";
      if (state.imageUrl === item.url) {
        state.imageFit = item.fit;
        renderPanels(BOARD_PANEL_COUNT);
      }
    };
    probe.src = item.url;
  }
  state.slideshowIndex = 0;
  setCurrentImage(0);
  els.imageFileName.textContent = files.length === 1 ? files[0].name : `${files.length} images`;
  persistSettings();
  renderPanels(BOARD_PANEL_COUNT);
  startSlideshow();
}

function resetPuzzle() {
  resetPuzzleState();
  if (state.game) {
    state.game.revealedPanels = new Set();
  }
  renderPanels(state.game ? state.game.panelCount : getPreviewPanelCount());
  setFeedback("パズルリセット", "開放マスを0に戻しました", false);
}

function resetPuzzleState() {
  state.reveal = { indices: [] };
  localStorage.removeItem(STORAGE_REVEAL);
}

function parseProblemText(text, fallbackTitle) {
  const rawLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line);
  const modeLine = rawLines.find((line) => /^#\s*mode\s*=/.test(line.toLowerCase()));
  const mode = normalizeProblemMode(modeLine ? modeLine.split("=").slice(1).join("=").trim() : "");
  const lines = rawLines.filter((line) => !line.startsWith("#"));
  const title = lines[0] || fallbackTitle || "無題";
  const questions = lines.slice(1).map((line) => parseQuestionLine(line, mode)).filter((question) => question.answer);
  return { title, mode, questions };
}

function parseQuestionLine(line, mode = "") {
  const effectiveMode = mode || getSelectedCommaMode();
  const comma = line.indexOf(",");
  const prompt = comma >= 0 ? line.slice(0, comma).trim() : line.trim();
  const right = comma >= 0 ? line.slice(comma + 1).trim() : "";
  if (effectiveMode === "typing") {
    const text = line.trim();
    return { id: makeId(), prompt: text, answer: text, sub: "", raw: text, displayMode: "typing" };
  }
  if (comma >= 0 && effectiveMode === "answer") {
    return { id: makeId(), prompt, answer: right, sub: "答えを入力", raw: line.trim(), displayMode: "answer" };
  }
  if (comma >= 0 && effectiveMode === "music") {
    return { id: makeId(), prompt, answer: prompt, sub: right, raw: line.trim(), displayMode: "music" };
  }
  return { id: makeId(), prompt, answer: prompt, sub: right, raw: line.trim(), displayMode: "sub" };
}

function normalizeProblemMode(mode) {
  const value = String(mode || "").trim().toLowerCase();
  if (value === "quiz" || value === "answer") return "answer";
  if (value === "music") return "music";
  if (value === "sub") return "sub";
  if (value === "typing") return "typing";
  return "";
}

function getSelectedCommaMode() {
  return els.commaModeSelect.value === "answer" ? "answer" : els.commaModeSelect.value;
}

function renderFileSelect(selected = els.fileSelect.value || "all") {
  els.fileSelect.innerHTML = "";
  const allOption = new Option("全ファイル", "all");
  els.fileSelect.appendChild(allOption);
  for (const file of state.files) {
    els.fileSelect.appendChild(new Option(`${file.name} (${file.questions.length})`, file.id));
  }
  els.fileSelect.value = state.files.some((file) => file.id === selected) ? selected : "all";
  persistSettings();
}

function applySelectedFileMode() {
  const file = state.files.find((item) => item.id === els.fileSelect.value);
  if (!file || !file.mode || file.mode === "typing") return;
  els.commaModeSelect.value = file.mode;
}

function startGame(options = {}) {
  clearQuestionTimer();
  clearCountdown();
  clearTransitionTimer();
  clearDemoTimer();
  const pool = options.questions || getQuestionPool();
  if (!pool.length) {
    setFeedback("問題がありません", "フォルダ選択、または貼り付け読込をしてください", true);
    return;
  }

  const gameType = els.gameTypeSelect.value === "timeAttack" && !options.questions ? "timeAttack" : "normal";
  const baseCount = options.questions ? pool.length : (gameType === "timeAttack" ? pool.length : getSelectedAttemptCount(pool.length));
  const questions = chooseQuestions(pool, baseCount);
  const scoreType = options.scoreType || getScoreType(gameType, questions);
  const panelCount = BOARD_PANEL_COUNT;
  const revealedPanels = getPersistedRevealedPanels();

  state.game = {
    running: false,
    finished: false,
    gameType,
    scoreType,
    title: options.title || buildStageTitle(),
    problemSetKey: buildProblemSetKey(),
    conditionKey: buildConditionKey(scoreType),
    questions,
    attemptCount: gameType === "timeAttack" ? Infinity : questions.length,
    displayTarget: gameType === "timeAttack" ? getAttackLimitSeconds() : questions.length,
    questionCursor: 0,
    attemptsMade: 0,
    current: null,
    correctCount: 0,
    missCount: 0,
    missed: new Map(),
    startTime: 0,
    questionStartTime: 0,
    totalAnswerMs: 0,
    correctChars: 0,
    lastKeyTime: 0,
    keyTimings: [],
    keyStats: new Map(),
    wordStats: new Map(),
    rhythmEnabled: els.rhythmToggle.checked,
    rhythmBpm: getRhythmBpm(),
    rhythmScore: 0,
    rhythmHits: { perfect: 0, good: 0, miss: 0 },
    demoEnabled: els.demoToggle.checked,
    panelCount,
    revealedPanels,
    attackLimitSeconds: gameType === "timeAttack" ? getAttackLimitSeconds() : 0,
    attackEndTime: 0,
    panelOrder: shuffle(Array.from({ length: panelCount }, (_, index) => index))
  };

  renderPanels(panelCount);
  setInputsEnabled(false);
  updateAllStats();
  runCountdown();
}

function runCountdown() {
  clearQuestionTimer();
  clearCountdown();
  let value = 3;
  els.countdownOverlay.classList.remove("hidden");
  els.countdownOverlay.classList.remove("start-word");
  els.countdownOverlay.textContent = String(value);
  setFeedback("カウントダウン", "3秒後に開始", false);

  state.countdownId = window.setInterval(() => {
    value -= 1;
    if (value > 0) {
      els.countdownOverlay.classList.remove("start-word");
      els.countdownOverlay.textContent = String(value);
      return;
    }
    if (value === 0) {
      els.countdownOverlay.classList.add("start-word");
      els.countdownOverlay.textContent = "START";
      return;
    }
    clearCountdown();
    els.countdownOverlay.classList.add("hidden");
    beginGameAfterCountdown();
  }, 1000);
}

function beginGameAfterCountdown() {
  const game = state.game;
  if (!game) return;
  game.running = true;
  game.startTime = performance.now();
  game.lastKeyTime = 0;
  startRhythmLoop();
  if (game.gameType === "timeAttack") {
    game.attackEndTime = game.startTime + game.attackLimitSeconds * 1000;
    startTimeAttackTimer();
  }
  setInputsEnabled(true);
  setFeedback("スタート", game.gameType === "timeAttack" ? `${game.attackLimitSeconds}秒勝負` : "ミスも1回として数えます", false);
  nextQuestion();
}

function chooseQuestions(pool, count) {
  if (!pool.length || !count) return [];
  const result = [];
  let round = 0;
  while (result.length < count) {
    const items = els.modeSelect.value === "random" ? shuffle(pool) : [...pool];
    for (const question of items) {
      if (result.length >= count) break;
      result.push({ ...question, id: makeId(), cycle: round });
    }
    round += 1;
  }
  return result;
}

function nextQuestion() {
  const game = state.game;
  if (!game || !game.running) return;
  clearDemoTimer();
  if (game.gameType === "timeAttack" && performance.now() >= game.attackEndTime) {
    finishGame(false);
    return;
  }
  if (game.gameType !== "timeAttack" && game.attemptsMade >= game.attemptCount) {
    finishGame(false);
    return;
  }

  if (game.gameType === "timeAttack") {
    if (game.questionCursor > 0 && game.questionCursor % game.questions.length === 0 && els.modeSelect.value === "random") {
      game.questions = shuffle(game.questions).map((question) => ({ ...question, id: makeId() }));
    }
    game.current = game.questions[game.questionCursor % game.questions.length];
  } else {
    game.current = game.questions[game.attemptsMade];
  }
  game.questionStartTime = performance.now();
  game.lastKeyTime = 0;
  els.questionText.textContent = game.current.prompt;
  els.questionSub.textContent = game.current.sub || game.current.sourceTitle || "";
  els.answerInput.value = "";
  applyTextLengthClasses(game.current);
  updateInputMirror();
  els.answerInput.focus();
  if (game.gameType === "timeAttack") {
    updateTimeAttackTimerReadout();
  } else {
    startQuestionTimer();
  }
  updateAllStats();
  startDemoTyping();
}

function checkAutoCorrect() {
  const game = state.game;
  if (state.composing || !game || !game.running || !game.current) return;
  if (els.answerInput.value === game.current.answer) {
    correctCurrentQuestion();
  }
}

function updateInputMirror() {
  if (!els.inputMirror) return;
  els.inputMirror.textContent = els.answerInput.value || "";
  window.requestAnimationFrame(() => {
    els.inputMirror.scrollLeft = els.inputMirror.scrollWidth;
    els.answerInput.scrollLeft = els.answerInput.scrollWidth;
  });
}

function applyTextLengthClasses(question) {
  const promptLength = [...(question.prompt || "")].length;
  const subLength = [...(question.sub || "")].length;
  const answerLength = [...(question.answer || "")].length;
  els.questionText.classList.toggle("long-text", promptLength >= 22);
  els.questionText.classList.toggle("very-long-text", promptLength >= 42);
  els.questionSub.classList.toggle("long-text", subLength >= 28);
  els.questionSub.classList.toggle("very-long-text", subLength >= 52);
  els.answerInput.classList.toggle("long-answer", answerLength >= 24);
  els.answerInput.classList.toggle("very-long-answer", answerLength >= 44);
  els.inputMirror.classList.toggle("long-answer", answerLength >= 24);
  els.inputMirror.classList.toggle("very-long-answer", answerLength >= 44);
}

function judgeCurrentAnswer() {
  const game = state.game;
  if (!game || !game.running || !game.current) return;
  if (els.answerInput.value === game.current.answer) {
    correctCurrentQuestion();
  } else {
    missCurrentQuestion("ミス");
  }
}

function recordKeydown(event) {
  const game = state.game;
  if (!game || !game.running || !game.current || event.isComposing) return;
  if (event.key.length !== 1) return;
  recordTypedKey(event.key, performance.now());
}

function recordTypedKey(key, now) {
  const game = state.game;
  if (!game || !game.running || !game.current || key.length !== 1) return;
  if (game.lastKeyTime) {
    const delta = now - game.lastKeyTime;
    if (delta >= 20 && delta <= 5000) {
      game.keyTimings.push(delta);
      const normalizedKey = key.toLowerCase();
      const stat = game.keyStats.get(normalizedKey) || { count: 0, totalMs: 0 };
      stat.count += 1;
      stat.totalMs += delta;
      game.keyStats.set(normalizedKey, stat);
    }
  }
  game.lastKeyTime = now;
  recordRhythmHit(game, now);
}

function correctCurrentQuestion() {
  const game = state.game;
  if (!game || !game.running || !game.current) return;
  clearDemoTimer();
  if (game.gameType !== "timeAttack") {
    clearQuestionTimer();
  }
  const answerMs = performance.now() - game.questionStartTime;
  game.correctCount += 1;
  game.attemptsMade += 1;
  game.questionCursor += 1;
  game.totalAnswerMs += answerMs;
  game.correctChars += game.current.answer.length;
  recordWordResult(game, game.current, true, answerMs);
  showSpeedBonus(game.current.answer.length, answerMs);
  revealNextPanel();
  playCorrectSound();
  setFeedback("正解！", "パネルが開きました", false);
  updateAllStats();
  clearTransitionTimer();
  state.transitionId = window.setTimeout(() => state.game === game && game.running && nextQuestion(), 260);
}

function missCurrentQuestion(reason) {
  const game = state.game;
  if (!game || !game.running || !game.current) return;
  clearDemoTimer();
  if (game.gameType !== "timeAttack") {
    clearQuestionTimer();
  }
  game.missCount += 1;
  game.attemptsMade += 1;
  game.questionCursor += 1;
  game.missed.set(game.current.raw, game.current);
  recordWordResult(game, game.current, false, performance.now() - game.questionStartTime);
  playMissSound();
  setInputsEnabled(false);
  setFeedback(`正解: ${game.current.answer}`, reason === "時間切れ" ? "時間切れ" : "不正解", true);
  updateAllStats();
  clearTransitionTimer();
  state.transitionId = window.setTimeout(() => {
    if (state.game === game && game.running) {
      setInputsEnabled(true);
      nextQuestion();
    }
  }, 900);
}

function startQuestionTimer() {
  clearQuestionTimer();
  const game = state.game;
  const limit = getTimeLimitSeconds();
  if (!game || !limit) {
    els.timerValue.textContent = "--";
    els.timerFill.style.width = "100%";
    return;
  }

  const end = performance.now() + limit * 1000;
  const tick = () => {
    if (!state.game || state.game !== game || !game.running) return;
    const remaining = Math.max(0, end - performance.now());
    els.timerValue.textContent = (remaining / 1000).toFixed(1);
    els.timerFill.style.width = `${Math.max(0, (remaining / (limit * 1000)) * 100)}%`;
    if (remaining <= 0) {
      missCurrentQuestion("時間切れ");
    }
  };
  tick();
  state.timerId = window.setInterval(tick, 80);
}

function startTimeAttackTimer() {
  clearQuestionTimer();
  const game = state.game;
  if (!game || game.gameType !== "timeAttack") return;
  const tick = () => {
    if (!state.game || state.game !== game || !game.running) return;
    updateTimeAttackTimerReadout();
    if (performance.now() >= game.attackEndTime) {
      finishGame(false);
    }
  };
  tick();
  state.timerId = window.setInterval(tick, 80);
}

function updateTimeAttackTimerReadout() {
  const game = state.game;
  if (!game || game.gameType !== "timeAttack") return;
  const remaining = Math.max(0, game.attackEndTime - performance.now());
  els.timerValue.textContent = (remaining / 1000).toFixed(1);
  els.timerFill.style.width = `${game.attackLimitSeconds ? Math.max(0, remaining / (game.attackLimitSeconds * 1000) * 100) : 0}%`;
  const elapsed = game.attackLimitSeconds * 1000 - remaining;
  els.progressFill.style.width = `${game.attackLimitSeconds ? Math.min(100, elapsed / (game.attackLimitSeconds * 1000) * 100) : 0}%`;
}

function revealNextPanel() {
  const game = state.game;
  const index = game.panelOrder.find((panelIndex) => !game.revealedPanels.has(panelIndex));
  if (index === undefined) return;
  game.revealedPanels.add(index);
  state.reveal.indices = Array.from(game.revealedPanels).slice(0, BOARD_PANEL_COUNT);
  localStorage.setItem(STORAGE_REVEAL, JSON.stringify(state.reveal));
  const tile = els.panelBoard.querySelector(`[data-panel-index="${index}"]`);
  if (tile) {
    tile.classList.remove("covered");
    tile.classList.add("revealed");
  }
}

function renderPanels(count) {
  els.panelBoard.innerHTML = "";
  const imageMode = getImageMode();
  els.panelBoard.classList.toggle("wallpaper-mode", imageMode === "wallpaper");
  els.panelBoard.classList.toggle("slideshow-mode", imageMode === "slideshow");
  if (!count && !state.imageUrl) {
    const placeholder = document.createElement("div");
    placeholder.className = "image-placeholder";
    placeholder.textContent = "IMAGE";
    els.panelBoard.appendChild(placeholder);
    return;
  }

  if (state.imageUrl) {
    const img = document.createElement("img");
    img.className = "board-image";
    img.src = state.imageUrl;
    img.alt = "";
    img.style.objectFit = state.imageFit;
    els.panelBoard.appendChild(img);
  }

  if (!count) return;
  if (imageMode !== "puzzle") {
    if (!state.imageUrl) {
      const placeholder = document.createElement("div");
      placeholder.className = "image-placeholder";
      placeholder.textContent = imageMode === "slideshow" ? "SLIDESHOW" : "WALLPAPER";
      els.panelBoard.appendChild(placeholder);
    }
    return;
  }

  const { cols, rows } = getGridSize(count);
  els.panelBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  els.panelBoard.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

  for (let index = 0; index < count; index += 1) {
    const tile = document.createElement("div");
    const revealed = state.game ? state.game.revealedPanels.has(index) : getPersistedRevealedPanels().has(index);
    tile.className = `tile ${revealed ? "revealed" : "covered"}`;
    tile.dataset.panelIndex = String(index);
    els.panelBoard.appendChild(tile);
  }
}

function setCurrentImage(index) {
  if (!state.imageUrls.length) {
    state.imageUrl = "";
    state.imageName = "";
    state.imageFit = "cover";
    return;
  }
  const safeIndex = ((index % state.imageUrls.length) + state.imageUrls.length) % state.imageUrls.length;
  const item = state.imageUrls[safeIndex];
  state.slideshowIndex = safeIndex;
  state.imageUrl = item.url;
  state.imageName = item.name;
  state.imageFit = item.fit;
}

function startSlideshow() {
  stopSlideshow();
  if (getImageMode() !== "slideshow" || state.imageUrls.length <= 1) return;
  state.slideshowTimerId = window.setInterval(() => {
    setCurrentImage(state.slideshowIndex + 1);
    els.imageFileName.textContent = `${state.imageName} (${state.slideshowIndex + 1}/${state.imageUrls.length})`;
    renderPanels(state.game ? state.game.panelCount : getPreviewPanelCount());
  }, 3500);
}

function stopSlideshow() {
  if (state.slideshowTimerId) {
    window.clearInterval(state.slideshowTimerId);
    state.slideshowTimerId = 0;
  }
}

function getImageMode() {
  return els.imageModeSelect.value || "puzzle";
}

function getGridSize(count) {
  const cols = Math.ceil(Math.sqrt(count * 16 / 9));
  return { cols, rows: Math.ceil(count / cols) };
}

function getPersistedRevealedPanels() {
  if (Array.isArray(state.reveal.indices)) {
    return new Set(state.reveal.indices.filter((index) => Number.isInteger(index) && index >= 0 && index < BOARD_PANEL_COUNT));
  }
  const count = Math.max(0, Math.min(BOARD_PANEL_COUNT, Number(state.reveal.count) || 0));
  return new Set(Array.from({ length: count }, (_, index) => index));
}

function finishGame(aborted) {
  const game = state.game;
  if (!game) return;
  clearQuestionTimer();
  clearCountdown();
  clearTransitionTimer();
  clearDemoTimer();
  stopRhythmLoop();
  game.running = false;
  game.finished = true;
  game.finishedAt = performance.now();
  setInputsEnabled(false);
  const stats = calculateStats(game);
  updateAllStats();
  if (aborted) {
    playCancelSound();
    setFeedback("中止しました", "結果を表示しています", true);
    return;
  }
  playFinishSound();
  addHistory(stats, game);
  setFeedback(game.gameType === "timeAttack" ? "タイムアップ！" : (game.correctCount === game.attemptCount ? "完成！" : "終了"), "今回の結果を保存しました", false);
}

function abortGame() {
  if (!state.game || (!state.game.running && !state.countdownId)) return;
  if (window.confirm("ゲームを中止しますか？")) {
    finishGame(true);
  }
}

function updateAllStats() {
  const game = state.game;
  const stats = calculateStats(game);
  const poolCount = getQuestionPool().length;
  const isTimeAttack = game && game.gameType === "timeAttack";
  const displayTarget = isTimeAttack ? `${game.attackLimitSeconds}s` : (game ? game.attemptCount : getSelectedAttemptCount(poolCount));
  const displayCurrent = game ? (isTimeAttack ? game.attemptsMade : Math.min(game.attemptsMade + (game.running ? 1 : 0), game.attemptCount)) : 0;
  els.stageTitle.textContent = game ? game.title : buildStageTitle();
  els.currentIndex.textContent = displayCurrent;
  els.targetCount.textContent = displayTarget;
  els.correctCount.textContent = stats.correctCount;
  els.missCount.textContent = stats.missCount;
  els.liveScore.textContent = formatNumber(stats.score);
  if (isTimeAttack) {
    const elapsedSeconds = game.startTime ? Math.min(game.attackLimitSeconds, Math.max(0, (performance.now() - game.startTime) / 1000)) : 0;
    renderProgress(game.attackLimitSeconds, elapsedSeconds);
  } else {
    renderProgress(Number(displayTarget) || 0, game ? game.attemptsMade : 0);
  }
  updateResultView(stats);
  renderMissList(game ? Array.from(game.missed.values()) : []);
  if (!game) renderPanels(getPreviewPanelCount());
}

function calculateStats(game) {
  if (!game) {
    return blankStats();
  }
  const now = game.finishedAt || performance.now();
  const totalSeconds = game.startTime ? Math.max(0, (now - game.startTime) / 1000) : 0;
  const attempts = game.correctCount + game.missCount;
  const accuracyRate = attempts ? game.correctCount / attempts : 0;
  const accuracy = accuracyRate * 100;
  const averageSeconds = game.correctCount ? game.totalAnswerMs / game.correctCount / 1000 : 0;
  const minutes = Math.max(totalSeconds / 60, 1 / 60);
  const cpm = game.correctChars / minutes;
  const wpm = cpm / 5;
  const secondsPerChar = game.correctChars ? game.totalAnswerMs / game.correctChars / 1000 : 0;
  const speedPower = getSpeedPower(secondsPerChar, cpm);
  const rhythmScore = game.rhythmScore || 0;
  const avgKeyMs = getAverage(game.keyTimings || []);
  const keyAnalysis = buildKeyAnalysis(game.keyStats);
  const wordAnalysis = buildWordAnalysis(game.wordStats);
  const scoreType = game.scoreType || getScoreType(game.gameType);
  if (scoreType === "timeAttack") {
    const attackMinutes = Math.max((game.attackLimitSeconds || totalSeconds || 60) / 60, 1 / 60);
    const correctPerMinute = game.correctCount / attackMinutes;
    const densityPower = Math.pow(clamp(correctPerMinute / 45, 0, 1), 1.7);
    const missPenalty = game.missCount * 260;
    const participationBase = game.correctCount ? 300 : 0;
    const speedBonus = 7600 * accuracyRate * Math.max(speedPower, densityPower);
    const score = Math.max(0, Math.round(
      participationBase +
      game.correctCount * 95 +
      accuracyRate * 450 +
      speedBonus -
      missPenalty +
      rhythmScore
    ));
    return {
      correctCount: game.correctCount,
      missCount: game.missCount,
      accuracy,
      totalSeconds,
      averageSeconds,
      secondsPerChar,
      wpm,
      cpm,
      score,
      scoreRate: getScoreRate(score),
      scoreType,
      rhythmScore,
      avgKeyMs,
      keyAnalysis,
      wordAnalysis,
      comment: buildAnalysisComment(accuracyRate, averageSeconds, avgKeyMs, rhythmScore),
      rank: getRank(score, scoreType)
    };
  }
  const targetCount = Math.max(1, game.attemptCount || attempts || 1);
  const completionRate = clamp(game.correctCount / targetCount, 0, 1);
  if (scoreType === "quiz") {
    const score = Math.max(0, Math.round(100 * completionRate));
    return {
      correctCount: game.correctCount,
      missCount: game.missCount,
      accuracy,
      totalSeconds,
      averageSeconds,
      secondsPerChar,
      wpm,
      cpm,
      score,
      scoreRate: score,
      scoreType,
      rhythmScore,
      avgKeyMs,
      keyAnalysis,
      wordAnalysis,
      comment: buildAnalysisComment(accuracyRate, averageSeconds, avgKeyMs, rhythmScore),
      rank: getRank(score, scoreType)
    };
  }
  const missPenalty = game.missCount * 300;
  const base = 1000 * completionRate * accuracyRate;
  const speedBonus = 9000 * completionRate * accuracyRate * speedPower;
  const score = Math.max(0, Math.round(
    base +
    speedBonus -
    missPenalty +
    rhythmScore
  ));
  return {
    correctCount: game.correctCount,
    missCount: game.missCount,
    accuracy,
    totalSeconds,
    averageSeconds,
    secondsPerChar,
    wpm,
    cpm,
    score,
    scoreRate: getScoreRate(score),
    scoreType,
    rhythmScore,
    avgKeyMs,
    keyAnalysis,
    wordAnalysis,
    comment: buildAnalysisComment(accuracyRate, averageSeconds, avgKeyMs, rhythmScore),
    rank: getRank(score, scoreType)
  };
}

function blankStats() {
  return {
    correctCount: 0,
    missCount: 0,
    accuracy: 0,
    totalSeconds: 0,
    averageSeconds: 0,
    secondsPerChar: 0,
    wpm: 0,
    cpm: 0,
    score: 0,
    scoreRate: 0,
    scoreType: "typing",
    rhythmScore: 0,
    avgKeyMs: 0,
    keyAnalysis: { fast: [], slow: [] },
    wordAnalysis: { strong: [], weak: [] },
    comment: "待機中",
    rank: "-"
  };
}

function updateResultView(stats) {
  els.resultCorrect.textContent = stats.correctCount;
  els.resultMiss.textContent = stats.missCount;
  els.resultAccuracy.textContent = `${Math.round(stats.accuracy)}%`;
  els.resultTime.textContent = formatDuration(stats.totalSeconds);
  els.resultAverage.textContent = `${stats.averageSeconds.toFixed(1)}s`;
  els.resultWpm.textContent = stats.wpm.toFixed(1);
  els.resultCpm.textContent = stats.cpm.toFixed(1);
  els.resultScore.textContent = formatNumber(stats.score);
  els.rankValue.textContent = stats.rank;
  els.rankScore.textContent = formatNumber(stats.score);
  els.rankStars.textContent = getStars(stats.rank);
  els.rankValue.closest(".rank-card").className = `rank-card rank-${String(stats.rank).toLowerCase()}`;
  els.rhythmResult.textContent = `リズム ${formatNumber(stats.rhythmScore)}`;
  els.resultKeyAverage.textContent = stats.avgKeyMs ? `${Math.round(stats.avgKeyMs)}ms` : "0ms";
  els.analysisComment.textContent = stats.comment;
  els.fastKeys.textContent = formatKeyList(stats.keyAnalysis.fast);
  els.slowKeys.textContent = formatKeyList(stats.keyAnalysis.slow);
  els.strongWords.textContent = formatWordList(stats.wordAnalysis.strong);
  els.weakWords.textContent = formatWordList(stats.wordAnalysis.weak);
}

function renderProgress(total, done) {
  els.progressTiles.innerHTML = "";
  const count = Math.max(0, Math.min(total, 50));
  for (let index = 0; index < count; index += 1) {
    const tile = document.createElement("div");
    tile.className = `progress-tile ${index < done ? "done" : ""}`;
    els.progressTiles.appendChild(tile);
  }
  els.progressFill.style.width = total ? `${Math.min(100, done / total * 100)}%` : "0%";
}

function renderMissList(items) {
  els.missList.innerHTML = "";
  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = item.raw;
    els.missList.appendChild(li);
  }
  els.missSummary.textContent = `${items.length}件`;
  const hasMisses = items.length > 0;
  els.retryMissBtn.disabled = !hasMisses;
  els.copyMissBtn.disabled = !hasMisses;
  els.saveMissBtn.disabled = !hasMisses;
}

function recordWordResult(game, question, correct, answerMs) {
  const key = question.raw || question.answer;
  const stat = game.wordStats.get(key) || {
    label: question.answer || question.prompt,
    attempts: 0,
    correct: 0,
    miss: 0,
    totalMs: 0
  };
  stat.attempts += 1;
  stat.correct += correct ? 1 : 0;
  stat.miss += correct ? 0 : 1;
  stat.totalMs += Math.max(0, answerMs || 0);
  game.wordStats.set(key, stat);
}

function buildKeyAnalysis(keyStats) {
  const items = Array.from((keyStats || new Map()).entries())
    .filter(([, stat]) => stat.count >= 1)
    .map(([key, stat]) => ({
      label: key === " " ? "Space" : key,
      averageMs: stat.totalMs / stat.count,
      count: stat.count
    }));
  return {
    fast: [...items].sort((a, b) => a.averageMs - b.averageMs).slice(0, 3),
    slow: [...items].sort((a, b) => b.averageMs - a.averageMs).slice(0, 3)
  };
}

function buildWordAnalysis(wordStats) {
  const items = Array.from((wordStats || new Map()).values())
    .map((stat) => ({
      label: stat.label,
      attempts: stat.attempts,
      accuracy: stat.attempts ? stat.correct / stat.attempts : 0,
      averageMs: stat.correct ? stat.totalMs / Math.max(1, stat.correct) : Infinity,
      miss: stat.miss
    }));
  return {
    strong: [...items]
      .filter((item) => item.accuracy > 0)
      .sort((a, b) => b.accuracy - a.accuracy || a.averageMs - b.averageMs)
      .slice(0, 3),
    weak: [...items]
      .sort((a, b) => b.miss - a.miss || a.accuracy - b.accuracy || b.averageMs - a.averageMs)
      .slice(0, 3)
  };
}

function buildAnalysisComment(accuracyRate, averageSeconds, avgKeyMs, rhythmScore) {
  if (!accuracyRate && !averageSeconds && !avgKeyMs) return "待機中";
  if (accuracyRate >= 0.95 && averageSeconds <= 3) return rhythmScore ? "正確で速い。リズムも良好です。" : "正確で速いです。";
  if (accuracyRate < 0.75) return "正確さを優先すると伸びます。";
  if (averageSeconds >= 6) return "正確です。次はテンポを上げましょう。";
  if (avgKeyMs >= 650) return "打鍵間隔が広めです。苦手キーを確認しましょう。";
  return "安定しています。弱点ワードを重点練習しましょう。";
}

function retryMissQuestions() {
  const game = state.game;
  if (!game || !game.missed.size) return;
  const questions = Array.from(game.missed.values()).map((question) => ({ ...question, id: makeId() }));
  startGame({ questions, title: "ミス問題", scoreType: game.scoreType });
}

async function copyMissQuestions() {
  const text = getMissText();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    setFeedback("コピーしました", "ミス問題をクリップボードへ", false);
  } catch {
    els.pasteArea.value = text;
    setFeedback("コピー不可", "貼り付け欄へ入れました", true);
  }
}

function saveMissQuestions() {
  const text = getMissText();
  if (!text) return;
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `miss_questions_${formatDateForFile(new Date())}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function getMissText() {
  const game = state.game;
  if (!game || !game.missed.size) return "";
  return `ミス問題\n${Array.from(game.missed.values()).map((question) => question.raw).join("\n")}\n`;
}

function addHistory(stats, game) {
  const scoreType = stats.scoreType || game.scoreType || getScoreType(game.gameType);
  state.history.push({
    date: new Date().toISOString(),
    title: game.title,
    playerName: getPlayerName(),
    type: getScoreTypeLabel(scoreType),
    scoreType,
    problemSetKey: game.problemSetKey || buildProblemSetKey(),
    conditionKey: game.conditionKey || buildConditionKey(scoreType),
    gameType: game.gameType,
    commaMode: els.commaModeSelect.value,
    questionCount: game.gameType === "timeAttack" ? game.attackLimitSeconds : game.attemptCount,
    timeLimit: getTimeLimitSeconds(),
    rhythmEnabled: game.rhythmEnabled,
    imageMode: getImageMode(),
    total: game.gameType === "timeAttack" ? game.attackLimitSeconds : game.attemptCount,
    score: stats.score,
    scoreRate: stats.scoreRate,
    correct: stats.correctCount,
    miss: stats.missCount,
    seconds: stats.totalSeconds,
    rank: stats.rank
  });
  state.history.sort((a, b) => b.score - a.score);
  state.history = state.history.slice(0, 200);
  localStorage.setItem(STORAGE_HISTORY, JSON.stringify(state.history));
  renderHistory();
}

function renderHistory() {
  els.rankingList.innerHTML = "";
  const filter = state.rankingFilter || "typing";
  for (const button of els.rankingTabs.querySelectorAll("[data-score-type]")) {
    button.classList.toggle("active", button.dataset.scoreType === filter);
  }
  const entries = state.history
    .map((entry) => ({
      ...entry,
      scoreType: normalizeHistoryScoreType(entry),
      conditionKey: entry.conditionKey || "legacy"
    }))
    .filter((entry) => entry.scoreType === filter)
    .filter((entry) => !els.sameConditionToggle.checked || entry.conditionKey === buildConditionKey(filter))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
  if (!entries.length) {
    const li = document.createElement("li");
    li.className = "small-text";
    li.textContent = els.sameConditionToggle.checked ? `${getScoreTypeLabel(filter)}の同条件履歴なし` : `${getScoreTypeLabel(filter)}の履歴なし`;
    els.rankingList.appendChild(li);
    return;
  }
  entries.forEach((entry, index) => {
    const li = document.createElement("li");
    li.className = "ranking-item";
    li.innerHTML = `<span class="ranking-rank">${index + 1}位</span><span class="ranking-type">${getScoreTypeLabel(entry.scoreType)}</span><span class="ranking-title">${escapeHtml(entry.playerName || "Guest")} / ${escapeHtml(entry.title)}</span><span class="ranking-grade">${entry.rank}</span><span class="ranking-score">${formatNumber(entry.score)}</span>`;
    li.title = `${new Date(entry.date).toLocaleString("ja-JP")} ${entry.playerName || "Guest"} 正解:${entry.correct} ミス:${entry.miss} 時間:${formatDuration(entry.seconds)} 条件:${entry.conditionKey || "旧履歴"}`;
    els.rankingList.appendChild(li);
  });
}

function normalizeHistoryScoreType(entry) {
  if (entry.scoreType === "quiz" || entry.scoreType === "typing" || entry.scoreType === "timeAttack") {
    return entry.scoreType;
  }
  if (entry.type === "TA" || entry.type === "タイムアタック") return "timeAttack";
  if (entry.type === "クイズ") return "quiz";
  return "typing";
}

function getScoreTypeLabel(scoreType) {
  if (scoreType === "quiz") return "クイズ";
  if (scoreType === "timeAttack") return "TA";
  return "タイピング";
}

function clearHistory() {
  if (!state.history.length) return;
  if (!window.confirm("ランキング履歴をクリアしますか？")) return;
  state.history = [];
  localStorage.removeItem(STORAGE_HISTORY);
  renderHistory();
}

function getQuestionPool() {
  const selected = els.fileSelect.value;
  if (selected && selected !== "all") {
    const file = state.files.find((item) => item.id === selected);
    return file ? file.questions : [];
  }
  return state.files.flatMap((file) => file.questions);
}

function getSelectedAttemptCount(max = getQuestionPool().length) {
  if (!max) return 0;
  const value = els.questionCountSelect.value;
  if (value === "all") return max;
  return Math.max(0, Number(value) || 0);
}

function getPreviewPanelCount() {
  const count = getSelectedAttemptCount();
  return count ? BOARD_PANEL_COUNT : 0;
}

function buildStageTitle() {
  const selected = els.fileSelect.value;
  if (!state.files.length) return "未読込";
  if (selected && selected !== "all") {
    const file = state.files.find((item) => item.id === selected);
    return file ? file.title : "未読込";
  }
  return state.files.length === 1 ? state.files[0].title : `${state.files.length}ファイル`;
}

function getPlayerName() {
  const name = (els.playerNameInput.value || "").trim();
  return name || "Guest";
}

function buildProblemSetKey() {
  const selected = els.fileSelect.value;
  const files = selected && selected !== "all"
    ? state.files.filter((file) => file.id === selected)
    : state.files;
  if (!files.length) return "no-problems";
  return files
    .map((file) => `${file.name}:${file.title}:${file.questions.length}:${file.mode || "ui"}`)
    .sort()
    .join("|");
}

function buildConditionKey(scoreType = state.rankingFilter || "typing") {
  return [
    `score=${scoreType}`,
    `set=${buildProblemSetKey()}`,
    `game=${els.gameTypeSelect.value}`,
    `comma=${els.commaModeSelect.value}`,
    `count=${els.questionCountSelect.value}`,
    `time=${els.noTimeLimitToggle.checked ? "none" : getTimeLimitSeconds()}`,
    `rhythm=${els.rhythmToggle.checked ? getRhythmBpm() : "off"}`,
    `image=${getImageMode()}`
  ].join(";");
}

function setInputsEnabled(enabled) {
  els.answerInput.disabled = !enabled;
  els.judgeBtn.disabled = !enabled;
  els.skipBtn.disabled = !enabled;
}

function setFeedback(text, sub, isMiss) {
  els.feedbackText.textContent = text;
  els.feedbackText.classList.toggle("miss", Boolean(isMiss));
  els.feedbackSub.textContent = sub || "";
}

function showSpeedBonus(answerLength, answerMs) {
  if (!answerLength || !answerMs) return;
  const secondsPerChar = answerMs / answerLength / 1000;
  const cpm = secondsPerChar ? 60 / secondsPerChar : 0;
  const speedPower = getSpeedPower(secondsPerChar, cpm);
  const bonus = Math.round(speedPower * Math.max(30, answerLength * 18));
  if (bonus > 0) showScorePop(`Speed +${bonus}`, false);
}

function showScorePop(text, isMiss) {
  if (!els.scorePop) return;
  els.scorePop.textContent = text;
  els.scorePop.classList.toggle("miss", Boolean(isMiss));
  els.scorePop.classList.remove("hidden", "pop");
  void els.scorePop.offsetWidth;
  els.scorePop.classList.add("pop");
  window.setTimeout(() => els.scorePop.classList.add("hidden"), 900);
}

function updateTimeLimitControls() {
  const isTimeAttack = els.gameTypeSelect.value === "timeAttack";
  els.noTimeLimitToggle.disabled = isTimeAttack;
  if (isTimeAttack) {
    els.noTimeLimitToggle.checked = false;
  }
  const seconds = getTimeLimitSeconds();
  els.timerValue.textContent = seconds ? seconds.toFixed(1) : "--";
  els.timeLimitInput.disabled = els.noTimeLimitToggle.checked;
  if (!state.game || !state.game.running) {
    els.timerFill.style.width = "100%";
  }
}

function getTimeLimitSeconds() {
  if (els.noTimeLimitToggle.checked) return 0;
  return Math.max(1, Math.floor(Number(els.timeLimitInput.value) || 10));
}

function getAttackLimitSeconds() {
  return Math.max(1, Math.floor(Number(els.timeLimitInput.value) || 60));
}

function clearQuestionTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = 0;
  }
}

function clearCountdown() {
  if (state.countdownId) {
    window.clearInterval(state.countdownId);
    state.countdownId = 0;
  }
}

function clearTransitionTimer() {
  if (state.transitionId) {
    window.clearTimeout(state.transitionId);
    state.transitionId = 0;
  }
}

function clearDemoTimer() {
  if (state.demoTimerId) {
    window.clearTimeout(state.demoTimerId);
    window.clearInterval(state.demoTimerId);
    state.demoTimerId = 0;
  }
}

function startDemoTyping() {
  clearDemoTimer();
  const game = state.game;
  if (!game || !game.running || !game.current || !game.demoEnabled) {
    els.demoStatus.textContent = els.demoToggle.checked ? "開始後に自動入力します" : "制限時間の80%で入力";
    return;
  }
  const answer = game.current.answer || "";
  if (!answer) return;
  if (game.rhythmEnabled) {
    startRhythmSyncedDemoTyping(game, answer);
    return;
  }
  const durationMs = getDemoDurationMs(game, answer);
  const stepMs = clamp(Math.floor(durationMs / Math.max(1, answer.length)), 45, 800);
  els.demoStatus.textContent = `自動入力中 ${Math.round(durationMs / 1000 * 10) / 10}s`;
  state.demoTimerId = window.setInterval(() => {
    if (!state.game || state.game !== game || !game.running || !game.current || !game.demoEnabled) {
      clearDemoTimer();
      return;
    }
    const current = els.answerInput.value;
    if (current === answer) {
      clearDemoTimer();
      checkAutoCorrect();
      return;
    }
    if (!answer.startsWith(current)) {
      clearDemoTimer();
      els.demoStatus.textContent = "手入力を優先";
      return;
    }
    const nextChar = answer.charAt(current.length);
    els.answerInput.value = current + nextChar;
    updateInputMirror();
    recordTypedKey(nextChar, performance.now());
    playKeySound();
    checkAutoCorrect();
  }, stepMs);
}

function startRhythmSyncedDemoTyping(game, answer) {
  const beatMs = 60000 / game.rhythmBpm;
  els.demoStatus.textContent = `リズム同期 ${game.rhythmBpm} BPM`;
  const scheduleNext = () => {
    if (!state.game || state.game !== game || !game.running || !game.current || !game.demoEnabled) {
      clearDemoTimer();
      return;
    }
    const current = els.answerInput.value;
    if (current === answer) {
      clearDemoTimer();
      checkAutoCorrect();
      return;
    }
    if (!answer.startsWith(current)) {
      clearDemoTimer();
      els.demoStatus.textContent = "手入力を優先";
      return;
    }
    const now = performance.now();
    const elapsed = Math.max(0, now - game.startTime);
    const nextBeatIndex = Math.max(1, Math.floor(elapsed / beatMs) + 1);
    const targetTime = game.startTime + nextBeatIndex * beatMs;
    const delay = Math.max(0, targetTime - now);
    state.demoTimerId = window.setTimeout(() => {
      if (!state.game || state.game !== game || !game.running || !game.current || !game.demoEnabled) {
        clearDemoTimer();
        return;
      }
      const latest = els.answerInput.value;
      if (latest === answer) {
        clearDemoTimer();
        checkAutoCorrect();
        return;
      }
      if (!answer.startsWith(latest)) {
        clearDemoTimer();
        els.demoStatus.textContent = "手入力を優先";
        return;
      }
      const nextChar = answer.charAt(latest.length);
      els.answerInput.value = latest + nextChar;
      updateInputMirror();
      recordTypedKey(nextChar, performance.now());
      playKeySound();
      checkAutoCorrect();
      scheduleNext();
    }, delay);
  };
  scheduleNext();
}

function getDemoDurationMs(game, answer) {
  if (game.gameType === "timeAttack") {
    return Math.max(1200, answer.length * 140);
  }
  const limit = getTimeLimitSeconds();
  if (limit) {
    return Math.max(600, limit * 800);
  }
  return Math.max(1600, answer.length * 180);
}

function startRhythmLoop() {
  stopRhythmLoop();
  const game = state.game;
  if (!game || !game.running || !game.rhythmEnabled) {
    els.rhythmStatus.textContent = els.rhythmToggle.checked ? "開始後に鳴ります" : "拍に合うと加点";
    return;
  }
  unlockAudio();
  const interval = 60000 / game.rhythmBpm;
  els.rhythmStatus.textContent = `${game.rhythmBpm} BPM`;
  pulseMetronome(true);
  playRhythmClick(true);
  state.rhythmTimerId = window.setInterval(() => {
    if (!state.game || state.game !== game || !game.running || !game.rhythmEnabled) {
      stopRhythmLoop();
      return;
    }
    pulseMetronome(false);
    playRhythmClick(false);
  }, interval);
}

function stopRhythmLoop() {
  if (state.rhythmTimerId) {
    window.clearInterval(state.rhythmTimerId);
    state.rhythmTimerId = 0;
  }
}

function recordRhythmHit(game, now) {
  if (!game.rhythmEnabled || !game.startTime) return;
  const beatMs = 60000 / game.rhythmBpm;
  const elapsed = Math.max(0, now - game.startTime);
  const offset = Math.abs(((elapsed + beatMs / 2) % beatMs) - beatMs / 2);
  const excellentWindow = beatMs * 0.1;
  const goodWindow = beatMs * 0.24;
  if (offset <= excellentWindow) {
    game.rhythmScore += 20;
    game.rhythmHits.perfect += 1;
    setRhythmJudge("Excellent", 20, offset, "excellent");
  } else if (offset <= goodWindow) {
    game.rhythmScore += 8;
    game.rhythmHits.good += 1;
    setRhythmJudge("Good", 8, offset, "good");
  } else {
    game.rhythmHits.miss += 1;
    setRhythmJudge("NG", 0, offset, "ng");
  }
}

function pulseMetronome(accent) {
  els.metronomeLight.classList.remove("beat", "accent");
  void els.metronomeLight.offsetWidth;
  els.metronomeLight.classList.add("beat");
  if (accent) els.metronomeLight.classList.add("accent");
}

function setRhythmJudge(label, points, offset, className) {
  els.rhythmJudge.textContent = points ? `${label} +${points}` : label;
  els.rhythmJudge.className = className;
  els.rhythmStatus.textContent = `${label} ${points ? `+${points}` : "+0"} (${Math.round(offset)}ms)`;
  showScorePop(points ? `${label} +${points}` : "NG +0", className === "ng");
}

function persistSettings() {
  state.settings = {
    selectedFile: els.fileSelect.value,
    playerName: getPlayerName(),
    gameType: els.gameTypeSelect.value,
    questionCount: els.questionCountSelect.value,
    mode: els.modeSelect.value,
    commaMode: els.commaModeSelect.value,
    imageMode: getImageMode(),
    timeLimitSeconds: els.timeLimitInput.value,
    noTimeLimit: els.noTimeLimitToggle.checked,
    volume: els.volumeInput.value,
    sound: els.soundToggle.checked,
    keySound: els.keySoundToggle.checked,
    correctSound: els.correctSoundToggle.checked,
    missSound: els.missSoundToggle.checked,
    rhythm: els.rhythmToggle.checked,
    rhythmBpm: els.rhythmBpmInput.value,
    demo: els.demoToggle.checked,
    imageName: state.imageName
  };
  localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(state.settings));
}

function applySettings() {
  const settings = state.settings;
  els.gameTypeSelect.value = settings.gameType || "normal";
  els.playerNameInput.value = settings.playerName || "";
  els.questionCountSelect.value = settings.questionCount || "20";
  els.modeSelect.value = settings.mode || "random";
  els.commaModeSelect.value = settings.commaMode || "answer";
  els.imageModeSelect.value = settings.imageMode || "puzzle";
  els.timeLimitInput.value = settings.timeLimitSeconds || settings.customTime || settings.timeLimit || "10";
  els.noTimeLimitToggle.checked = settings.noTimeLimit || settings.timeLimit === "none";
  els.volumeInput.value = settings.volume || "0.35";
  els.soundToggle.checked = settings.sound !== false;
  els.keySoundToggle.checked = settings.keySound !== false;
  els.correctSoundToggle.checked = settings.correctSound !== false;
  els.missSoundToggle.checked = settings.missSound !== false;
  els.rhythmToggle.checked = Boolean(settings.rhythm);
  els.rhythmBpmInput.value = settings.rhythmBpm || "100";
  els.demoToggle.checked = Boolean(settings.demo);
  els.imageFileName.textContent = settings.imageName ? `${settings.imageName} (再選択してください)` : "未選択";
}

function playKeySound() {
  if (!els.soundToggle.checked || !els.keySoundToggle.checked) return;
  playTone([420, 520, 610, 720][Math.floor(Math.random() * 4)], 0.022, "square", 0.16);
}

function playCorrectSound() {
  if (!els.soundToggle.checked || !els.correctSoundToggle.checked) return;
  playTone(880, 0.07, "sine", 0.35, 0);
  playTone(1320, 0.09, "sine", 0.28, 0.06);
}

function playMissSound() {
  if (!els.soundToggle.checked || !els.missSoundToggle.checked) return;
  playTone(180, 0.16, "sawtooth", 0.28, 0);
  playTone(120, 0.13, "sawtooth", 0.2, 0.08);
}

function playFinishSound() {
  if (!els.soundToggle.checked || !els.correctSoundToggle.checked) return;
  [784, 988, 1175].forEach((frequency, index) => playTone(frequency, 0.11, "triangle", 0.28, index * 0.08));
}

function playCancelSound() {
  if (!els.soundToggle.checked) return;
  playTone(320, 0.08, "triangle", 0.22, 0);
  playTone(210, 0.12, "triangle", 0.18, 0.07);
}

function playRhythmClick(accent) {
  if (!els.soundToggle.checked) return;
  playTone(accent ? 1200 : 820, 0.055, "square", accent ? 0.34 : 0.24, 0);
}

function unlockAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!state.audioContext) state.audioContext = new AudioContextClass();
  if (state.audioContext.state === "suspended") {
    state.audioContext.resume().catch(() => {});
  }
  return state.audioContext;
}

function playTone(frequency, duration, type, gainScale, delay = 0) {
  const ctx = unlockAudio();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime + delay;
  const volume = Number(els.volumeInput.value) || 0;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * gainScale), start + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function getRank(score, scoreType = "typing") {
  if (scoreType === "quiz") {
    if (score >= 100) return "S";
    if (score >= 80) return "A";
    if (score >= 60) return "B";
    return "C";
  }
  if (score >= 8500) return "S";
  if (score >= 6000) return "A";
  if (score >= 3000) return "B";
  return "C";
}

function getStars(rank) {
  if (rank === "S") return "*****";
  if (rank === "A") return "****";
  if (rank === "B") return "***";
  if (rank === "C") return "*";
  return "---";
}

function roundUpToFour(value) {
  return Math.max(4, Math.ceil(Math.max(0, value) / 4) * 4);
}

function getSpeedPower(secondsPerChar, cpm) {
  if (!secondsPerChar && !cpm) return 0;
  const charSpeedRate = clamp((0.75 - secondsPerChar) / 0.65, 0, 1);
  const cpmRate = clamp(cpm / 850, 0, 1);
  return Math.max(Math.pow(charSpeedRate, 2.2), Math.pow(cpmRate, 2));
}

function getScoreRate(score) {
  return clamp(score / 100, 0, 100);
}

function getScoreType(gameType, questions = []) {
  if (gameType === "timeAttack") return "timeAttack";
  if (questions.length) return questions.every((question) => question.displayMode === "answer") ? "quiz" : "typing";
  return els.commaModeSelect.value === "answer" ? "quiz" : "typing";
}

function getRhythmBpm() {
  return clamp(Math.floor(Number(els.rhythmBpmInput.value) || 100), 40, 300);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getAverage(values) {
  return values && values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function formatKeyList(items) {
  if (!items || !items.length) return "-";
  return items.map((item) => `${item.label}:${Math.round(item.averageMs)}ms`).join(" / ");
}

function formatWordList(items) {
  if (!items || !items.length) return "-";
  return items.map((item) => item.label).join(" / ");
}

function formatDuration(seconds) {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("ja-JP").format(Math.round(value || 0));
}

function formatDateForFile(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function getFilePath(file) {
  return file.webkitRelativePath || file.name;
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}
