(() => {
  const data = window.DBTI_DATA;
  const dimensionKeys = data.internalDimensions.map((dimension) => dimension.key);

  const likertOptions = [
    ["A", "非常不符合我"],
    ["B", "比较不符合我"],
    ["C", "一半一半 / 看情况"],
    ["D", "比较符合我"],
    ["E", "非常符合我"]
  ].map(([label, text]) => ({ label, text }));

  const teammateWeights = {
    expression_vs_competition: 0.9,
    stage_vs_team: 0.75,
    initiation_tendency: 0.8,
    pressing_intensity: 0.75,
    fact_vs_mechanism: 0.8,
    reality_vs_setting: 0.65,
    self_vs_judge: 0.7,
    judge_vs_performance: 0.65,
    tournament_activity: 0.35,
    daily_argumentativeness: 0.45,
    meme_intensity: 0.55,
    emotional_heat: 0.75,
    team_construction: 1.1,
    solo_vs_coordination: 1.1,
    chain_vs_scene: 0.85,
    plain_vs_stylized: 0.75
  };

  const teammatePoleLabels = {
    expression_vs_competition: ["观点表达", "赢面计算"],
    stage_vs_team: ["队伍关系", "赛场刺激"],
    initiation_tendency: ["后手观察", "主动开战"],
    pressing_intensity: ["克制拆解", "连续压迫"],
    fact_vs_mechanism: ["机理推演", "事实锚定"],
    reality_vs_setting: ["抽象设定", "现实议题"],
    self_vs_judge: ["自我表达", "评委转译"],
    judge_vs_performance: ["表现信念", "裁判变量"],
    tournament_activity: ["阶段参与", "高频参赛"],
    daily_argumentativeness: ["生活切换", "日常论辩"],
    meme_intensity: ["正经克制", "整活传播"],
    emotional_heat: ["冷静稳定", "情绪点火"],
    team_construction: ["局部单点", "整队建构"],
    solo_vs_coordination: ["单兵突破", "配合补位"],
    chain_vs_scene: ["逻辑链条", "场景画面"],
    plain_vs_stylized: ["朴素直给", "包装修辞"]
  };

  const fallbackMode = {
    key: "legacy",
    label: "旧版内置题",
    badge: `${data.questions.length} QUESTIONS`,
    description: "题库文档读取失败时的内置兜底题库。",
    parser: "legacyWeighted",
    scoring: "weightedOptions",
    questions: data.questions
  };

  const state = {
    currentQuestionIndex: 0,
    answers: {},
    selectedOptionIndex: null,
    result: null,
    questionModes: [],
    questionModeKey: null,
    questionModeStatus: "loading",
    activeQuestions: [],
    shareImageBlob: null,
    shareImageDataUrl: "",
    shareImageUrl: null,
    shareImageName: "dbti-result.png"
  };

  const $ = (selector) => document.querySelector(selector);

  const elements = {
    startScreen: $("#start-screen"),
    quizScreen: $("#quiz-screen"),
    resultScreen: $("#result-screen"),
    startButton: $("#start-btn"),
    modeSwitch: $("#mode-switch"),
    modeDesc: $("#mode-desc"),
    nextButton: $("#next-btn"),
    restartButton: $("#restart-btn"),
    copyButton: $("#copy-btn"),
    imageButton: $("#image-btn"),
    shareImageOverlay: $("#share-image-overlay"),
    shareImageClose: $("#share-image-close"),
    shareImagePreview: $("#share-image-preview"),
    downloadImageLink: $("#download-image-link"),
    systemShareButton: $("#system-share-btn"),
    questionTitle: $("#question-title"),
    questionText: $("#question-text"),
    optionList: $("#option-list"),
    choiceHint: $("#choice-hint"),
    progressCount: $("#progress-count"),
    progressFill: $("#progress-fill"),
    resultCode: $("#result-code"),
    resultName: $("#result-name"),
    resultTagline: $("#result-tagline"),
    resultDescription: $("#result-desc"),
    resultMatch: $("#result-match"),
    resultSecondary: $("#result-secondary"),
    teammateName: $("#teammate-name"),
    teammateReason: $("#teammate-reason"),
    radarChart: $("#radar-chart"),
    dimensionList: $("#dimension-list"),
    shareText: $("#share-text")
  };

  const screens = [
    elements.startScreen,
    elements.quizScreen,
    elements.resultScreen
  ].filter(Boolean);

  function init() {
    elements.startButton.disabled = true;
    elements.startButton.textContent = "题库加载中";

    elements.startButton.addEventListener("click", startTest);
    elements.nextButton.addEventListener("click", goNext);
    elements.restartButton.addEventListener("click", restartTest);
    elements.copyButton.addEventListener("click", copyShareText);
    elements.imageButton.addEventListener("click", openShareImageDialog);
    elements.shareImageClose.addEventListener("click", closeShareImageDialog);
    elements.downloadImageLink.addEventListener("click", handleDownloadImageClick);
    elements.systemShareButton.addEventListener("click", shareGeneratedImage);
    elements.shareImageOverlay.addEventListener("click", (event) => {
      if (event.target === elements.shareImageOverlay) closeShareImageDialog();
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !elements.shareImageOverlay.hidden) closeShareImageDialog();
    });
    window.addEventListener("resize", () => {
      if (state.result) drawRadarChart(state.result.displayScores);
    });

    renderModeButtons();
    loadQuestionModes();
  }

  async function loadQuestionModes() {
    const sources = data.questionModeSources || [];
    const modes = (await Promise.all(sources.map(loadQuestionMode))).filter(Boolean);

    if (modes.length > 0) {
      state.questionModes = modes;
      state.questionModeKey = modes[0].key;
      state.questionModeStatus = modes.length === sources.length ? "ready" : "partial";
    } else {
      state.questionModes = [fallbackMode];
      state.questionModeKey = fallbackMode.key;
      state.questionModeStatus = "fallback";
    }

    renderModeButtons();
    updateStartButton();
  }

  async function loadQuestionMode(source) {
    try {
      const version = encodeURIComponent(data.config.assetVersion || "dev");
      const response = await fetch(`${encodeURI(source.file)}?v=${version}`, { cache: "no-cache" });
      if (!response.ok) throw new Error(`${source.file} returned ${response.status}`);

      const markdown = await response.text();
      const questions = source.parser === "likertScale"
        ? parseLikertQuestionDoc(markdown, source)
        : parseWeightedQuestionDoc(markdown, source);

      if (questions.length === 0) throw new Error(`${source.file} parsed 0 questions`);

      return {
        ...source,
        scoring: source.parser === "likertScale" ? "likertScale" : "weightedOptions",
        questions
      };
    } catch (error) {
      console.warn(`[DBTI] ${source.label} 加载失败：`, error);
      return null;
    }
  }

  function parseWeightedQuestionDoc(markdown, source) {
    const questions = [];
    let currentQuestion = null;
    let currentOption = null;

    markdown.split(/\r?\n/).forEach((rawLine) => {
      const line = rawLine.trim();
      const questionMatch = line.match(/^##\s+Q(\d+)\.\s+(.+)$/);
      if (questionMatch) {
        currentQuestion = {
          id: `${source.key}-q${questionMatch[1].padStart(2, "0")}`,
          text: questionMatch[2].trim(),
          options: []
        };
        currentOption = null;
        questions.push(currentQuestion);
        return;
      }

      const optionMatch = line.match(/^-\s+([A-D])\.\s+(.+)$/);
      if (optionMatch && currentQuestion) {
        currentOption = {
          label: optionMatch[1],
          text: optionMatch[2].trim(),
          effects: {}
        };
        currentQuestion.options.push(currentOption);
        return;
      }

      const scoreMatch = line.match(/^-\s+分数：(.+)$/);
      if (scoreMatch && currentOption) {
        currentOption.effects = parseWeightedScoreLine(scoreMatch[1]);
        return;
      }

      const hiddenMatch = line.match(/^-\s+隐藏人格：([a-z_]+)$/);
      if (hiddenMatch && currentOption) {
        currentOption.hiddenTypeKey = hiddenMatch[1];
      }
    });

    return questions.filter((question) => question.text && question.options.length > 0);
  }

  function parseWeightedScoreLine(scoreText) {
    const effects = {};
    const pattern = /`([a-z_]+)(?:（[^`]*?）)?\s*([+-]\d+(?:\.\d+)?)`/g;
    let match = pattern.exec(scoreText);

    while (match) {
      const dimensionKey = match[1];
      const value = Number(match[2]);
      if (dimensionKeys.includes(dimensionKey) && Number.isFinite(value)) {
        effects[dimensionKey] = (effects[dimensionKey] || 0) + value;
      }
      match = pattern.exec(scoreText);
    }

    return effects;
  }

  function parseLikertQuestionDoc(markdown, source) {
    const questions = [];
    const lines = markdown.split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
      const questionMatch = lines[index].trim().match(/^Q(\d{2})$/);
      if (!questionMatch) continue;

      const textIndex = findNextContentLine(lines, index + 1);
      if (textIndex === -1) continue;
      const scoreIndex = findNextScoreLine(lines, textIndex + 1);
      if (scoreIndex === -1) continue;

      const scoreMatch = lines[scoreIndex].trim().match(/^计分：([a-z_]+)\s+(正向|反向)$/);
      if (!scoreMatch || !dimensionKeys.includes(scoreMatch[1])) continue;

      const dimensionKey = scoreMatch[1];
      const direction = scoreMatch[2];
      questions.push({
        id: `${source.key}-q${questionMatch[1]}`,
        text: lines[textIndex].trim(),
        scoringDimension: dimensionKey,
        scoringDirection: direction,
        options: makeLikertOptions(dimensionKey, direction)
      });

      index = scoreIndex;
    }

    return questions;
  }

  function findNextContentLine(lines, startIndex) {
    for (let index = startIndex; index < lines.length; index += 1) {
      const line = lines[index].trim();
      if (!line) continue;
      if (/^Q\d{2}$/.test(line) || line.startsWith("计分：")) return -1;
      return index;
    }
    return -1;
  }

  function findNextScoreLine(lines, startIndex) {
    for (let index = startIndex; index < lines.length; index += 1) {
      const line = lines[index].trim();
      if (!line) continue;
      if (/^Q\d{2}$/.test(line)) return -1;
      if (line.startsWith("计分：")) return index;
    }
    return -1;
  }

  function makeLikertOptions(dimensionKey, direction) {
    const rawScores = direction === "正向" ? [0, 1, 2, 3, 4] : [4, 3, 2, 1, 0];

    return likertOptions.map((option, index) => {
      const rawScore = rawScores[index];
      return {
        label: option.label,
        text: option.text,
        effects: { [dimensionKey]: rawScore * 25 },
        rawScores: { [dimensionKey]: rawScore }
      };
    });
  }

  function renderModeButtons() {
    if (!elements.modeSwitch || !elements.modeDesc) return;

    if (state.questionModes.length === 0) {
      elements.modeSwitch.innerHTML = `
        <button class="mode-button is-selected" type="button" disabled>题库加载中</button>
      `;
      elements.modeDesc.textContent = "正在读取问题文档.md 和 问题文档-80题.md。";
      return;
    }

    elements.modeSwitch.innerHTML = state.questionModes.map((mode) => {
      const selected = mode.key === state.questionModeKey ? " is-selected" : "";
      return `
        <button class="mode-button${selected}" type="button" data-mode-key="${escapeHtml(mode.key)}">
          <span>${escapeHtml(mode.label)}</span>
          <small>${escapeHtml(mode.badge || `${mode.questions.length} QUESTIONS`)}</small>
        </button>
      `;
    }).join("");

    elements.modeSwitch.querySelectorAll(".mode-button").forEach((button) => {
      button.addEventListener("click", () => {
        state.questionModeKey = button.dataset.modeKey;
        renderModeButtons();
      });
    });

    updateModeDescription();
  }

  function updateModeDescription() {
    const mode = currentMode();
    if (!mode) {
      elements.modeDesc.textContent = "题库加载中。";
      return;
    }

    const statusText = state.questionModeStatus === "partial"
      ? "部分题库读取失败，当前显示已成功读取的题库。"
      : state.questionModeStatus === "fallback"
        ? "题库文档读取失败，当前使用旧版内置兜底题库。"
        : "";

    elements.modeDesc.textContent = `${mode.description} 当前 ${mode.questions.length} 题。${statusText}`;
  }

  function updateStartButton() {
    const mode = currentMode();
    elements.startButton.disabled = !mode;
    elements.startButton.textContent = mode ? "进入赛场" : "题库加载中";
  }

  function currentMode() {
    return state.questionModes.find((mode) => mode.key === state.questionModeKey) || state.questionModes[0] || null;
  }

  function currentQuestions() {
    const mode = currentMode();
    return state.activeQuestions.length > 0 ? state.activeQuestions : mode?.questions || [];
  }

  function shuffleQuestions(questions) {
    const shuffled = [...questions];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled;
  }

  function showScreen(screenName) {
    const target = elements[`${screenName}Screen`];
    screens.forEach((screen) => {
      screen.classList.toggle("is-active", screen === target);
    });
  }

  function startTest() {
    const mode = currentMode();
    if (!mode) return;

    state.currentQuestionIndex = 0;
    state.answers = {};
    state.selectedOptionIndex = null;
    state.result = null;
    state.activeQuestions = mode.shuffleOnStart ? shuffleQuestions(mode.questions) : [...mode.questions];
    renderQuestion();
    showScreen("quiz");
  }

  function restartTest() {
    startTest();
  }

  function renderQuestion() {
    const mode = currentMode();
    const questions = currentQuestions();
    const question = questions[state.currentQuestionIndex];
    const questionNumber = state.currentQuestionIndex + 1;
    const total = questions.length;
    const answered = state.answers[question.id] !== undefined;
    const progress = answered ? questionNumber / total : state.currentQuestionIndex / total;
    const hint = mode.scoring === "likertScale" ? "选择最符合你的程度。" : "选择一个最像你的反应。";

    elements.questionTitle.textContent = `${mode.label} · 第 ${String(questionNumber).padStart(2, "0")} 题`;
    elements.questionText.textContent = question.text;
    elements.progressCount.textContent = `${String(questionNumber).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
    elements.progressFill.style.width = `${Math.round(progress * 100)}%`;
    elements.nextButton.disabled = state.selectedOptionIndex === null;
    elements.nextButton.textContent = questionNumber === total ? "查看结果" : "下一题";
    elements.choiceHint.textContent = state.selectedOptionIndex === null
      ? hint
      : `已选择 ${question.options[state.selectedOptionIndex].label}，可以交卷。`;

    elements.optionList.innerHTML = question.options.map((option, index) => {
      const selected = index === state.selectedOptionIndex ? " is-selected" : "";
      return `
        <button class="option-button${selected}" type="button" data-option-index="${index}">
            <span class="option-label">${escapeHtml(option.label)}</span>
            <span class="option-content">
              <span class="option-text">${escapeHtml(option.text)}</span>
            </span>
          </button>
      `;
    }).join("");

    elements.optionList.querySelectorAll(".option-button").forEach((button) => {
      button.addEventListener("click", () => selectOption(Number(button.dataset.optionIndex)));
    });
  }

  function selectOption(optionIndex) {
    const question = currentQuestions()[state.currentQuestionIndex];
    state.selectedOptionIndex = optionIndex;
    state.answers[question.id] = optionIndex;
    renderQuestion();
  }

  function goNext() {
    const mode = currentMode();
    const questions = currentQuestions();
    if (state.selectedOptionIndex === null) return;

    const isLastQuestion = state.currentQuestionIndex === questions.length - 1;
    if (!isLastQuestion) {
      state.currentQuestionIndex += 1;
      state.selectedOptionIndex = state.answers[questions[state.currentQuestionIndex].id] ?? null;
      renderQuestion();
      return;
    }

    state.result = computeResult();
    renderResult(state.result);
    showScreen("result");
    requestAnimationFrame(() => drawRadarChart(state.result.displayScores));
  }

  function computeResult() {
    const mode = currentMode();
    const hiddenType = findHiddenType();
    if (hiddenType) {
      const scores = Object.fromEntries(dimensionKeys.map((key) => [key, 50]));
      const result = {
        mode,
        isHidden: true,
        scores,
        touched: Object.fromEntries(dimensionKeys.map((key) => [key, 0])),
        primary: { ...hiddenType, similarity: 100 },
        secondary: null,
        displayScores: computeDisplayScores(scores)
      };
      result.teammate = computeTeammate(result);
      return result;
    }

    const scoringResult = mode.scoring === "likertScale"
      ? computeLikertScores(mode)
      : computeWeightedScores(mode);
    const { scores, touched } = scoringResult;

    const matches = data.personalityTypes
      .map((type) => scoreTypeMatch(type, scores, touched))
      .sort((a, b) => {
        if (a.distance !== b.distance) return a.distance - b.distance;
        return b.similarity - a.similarity;
      });

    const result = {
      mode,
      scores,
      touched,
      primary: matches[0] || data.fallbackType,
      secondary: matches[1] || null,
      displayScores: computeDisplayScores(scores)
    };
    result.teammate = computeTeammate(result);
    return result;
  }

  function findHiddenType() {
    for (const question of currentQuestions()) {
      const selectedIndex = state.answers[question.id];
      if (selectedIndex === undefined) continue;

      const option = question.options[selectedIndex];
      const hiddenTypeKey = option?.hiddenTypeKey;
      if (hiddenTypeKey && data.hiddenPersonalityTypes?.[hiddenTypeKey]) {
        return data.hiddenPersonalityTypes[hiddenTypeKey];
      }
    }

    return null;
  }

  function computeWeightedScores(mode) {
    const scores = Object.fromEntries(dimensionKeys.map((key) => [key, 50]));
    const touched = Object.fromEntries(dimensionKeys.map((key) => [key, 0]));

    currentQuestions().forEach((question) => {
      const selectedIndex = state.answers[question.id];
      if (selectedIndex === undefined) return;

      const option = question.options[selectedIndex];
      Object.entries(expandEffects(option.effects)).forEach(([dimensionKey, delta]) => {
        scores[dimensionKey] = clamp(scores[dimensionKey] + delta, 0, 100);
        touched[dimensionKey] += 1;
      });
    });

    normalizeScores(scores);
    return { scores, touched };
  }

  function computeLikertScores(mode) {
    const totals = Object.fromEntries(dimensionKeys.map((key) => [key, 0]));
    const touched = Object.fromEntries(dimensionKeys.map((key) => [key, 0]));

    currentQuestions().forEach((question) => {
      const selectedIndex = state.answers[question.id];
      if (selectedIndex === undefined) return;

      const option = question.options[selectedIndex];
      Object.entries(option.rawScores || {}).forEach(([dimensionKey, rawScore]) => {
        if (!dimensionKeys.includes(dimensionKey)) return;
        totals[dimensionKey] += rawScore;
        touched[dimensionKey] += 1;
      });
    });

    const scores = Object.fromEntries(dimensionKeys.map((key) => {
      if (touched[key] === 0) return [key, 50];
      return [key, clamp(Math.round((totals[key] / touched[key]) * 25), 0, 100)];
    }));

    return { scores, touched };
  }

  function scoreTypeMatch(type, scores, touched) {
    let distance = 0;
    let weightTotal = 0;

    dimensionKeys.forEach((key) => {
      const weight = touched[key] > 0 ? 1 : 0.15;
      const target = type.profile[key] ?? 50;
      distance += Math.abs(scores[key] - target) * weight;
      weightTotal += 100 * weight;
    });

    const similarity = Math.max(0, Math.round((1 - distance / weightTotal) * 100));
    return { ...type, distance, similarity };
  }

  function normalizeScores(scores) {
    const mean = dimensionKeys.reduce((sum, key) => sum + scores[key], 0) / dimensionKeys.length;

    dimensionKeys.forEach((key) => {
      scores[key] = clamp(50 + (scores[key] - mean) * 1.45, 0, 100);
    });
  }

  function computeDisplayScores(scores) {
    const displayScores = {};

    data.displayDimensions.forEach((dimension) => {
      const primaryValue = scores[dimension.primary] ?? 50;
      const secondaryValue = scores[dimension.secondary] ?? 50;
      const average = (primaryValue + secondaryValue) / 2;

      if (dimension.key === "competitive_orientation") {
        displayScores[dimension.key] = Math.round(Math.min(primaryValue, secondaryValue) * 0.7 + average * 0.3);
        return;
      }

      displayScores[dimension.key] = Math.round(average);
    });

    return displayScores;
  }

  function computeTeammate(result) {
    const primaryCode = result.primary?.code;
    const candidates = (data.personalityTypes || [])
      .filter((type) => type.code !== primaryCode);

    if (candidates.length === 0) return null;

    const sourceProfile = result.isHidden
      ? result.primary.profile
      : result.scores;

    const ranked = candidates
      .map((type) => {
        let distance = 0;
        let weightTotal = 0;

        dimensionKeys.forEach((key) => {
          const sourceValue = sourceProfile[key] ?? 50;
          const candidateValue = type.profile[key] ?? 50;
          const idealValue = getIdealTeammateValue(key, sourceValue);
          const weight = teammateWeights[key] ?? 0.5;

          distance += Math.abs(candidateValue - idealValue) * weight;
          weightTotal += 100 * weight;
        });

        const fit = Math.max(0, Math.round((1 - distance / weightTotal) * 100));
        return { ...type, teammateDistance: distance, teammateFit: fit };
      })
      .sort((a, b) => {
        if (a.teammateDistance !== b.teammateDistance) return a.teammateDistance - b.teammateDistance;
        return b.teammateFit - a.teammateFit;
      });

    const type = ranked[0];
    return {
      type,
      fit: type.teammateFit,
      reason: buildTeammateReason(sourceProfile, type)
    };
  }

  function getIdealTeammateValue(key, sourceValue) {
    if (key === "team_construction") return sourceValue < 55 ? 82 : clamp(100 - sourceValue, 35, 82);
    if (key === "solo_vs_coordination") return sourceValue < 55 ? 84 : clamp(100 - sourceValue, 40, 84);
    if (key === "tournament_activity") return sourceValue < 45 ? 62 : sourceValue;
    if (key === "daily_argumentativeness") return clamp(100 - sourceValue, 35, 80);
    if (key === "emotional_heat") return clamp(100 - sourceValue, 22, 78);

    return clamp(100 - sourceValue, 8, 92);
  }

  function buildTeammateReason(sourceProfile, teammate) {
    const strongest = pickStrongestTrait(sourceProfile);
    const balancing = pickBalancingTrait(sourceProfile, teammate.profile);

    return `你更突出的倾向是「${getPoleLabel(strongest.key, strongest.value)}」，${teammate.name}能补上「${getPoleLabel(balancing.key, teammate.profile[balancing.key] ?? 50)}」。你负责把自己的强项打满，TA负责把另一侧兜住，组合起来不容易偏科。`;
  }

  function pickStrongestTrait(profile) {
    return dimensionKeys
      .map((key) => {
        const value = profile[key] ?? 50;
        return {
          key,
          value,
          strength: Math.abs(value - 50) * (teammateWeights[key] ?? 0.5)
        };
      })
      .sort((a, b) => b.strength - a.strength)[0] || { key: dimensionKeys[0], value: 50 };
  }

  function pickBalancingTrait(sourceProfile, teammateProfile) {
    return dimensionKeys
      .map((key) => {
        const sourceValue = sourceProfile[key] ?? 50;
        const teammateValue = teammateProfile[key] ?? 50;
        const sourceDelta = sourceValue - 50;
        const teammateDelta = teammateValue - 50;
        const opposite = sourceDelta * teammateDelta < 0;
        const distance = Math.abs(sourceValue - teammateValue);
        const weight = teammateWeights[key] ?? 0.5;

        return {
          key,
          value: teammateValue,
          opposite,
          strength: Math.abs(sourceDelta) * distance * weight
        };
      })
      .sort((a, b) => {
        if (a.opposite !== b.opposite) return a.opposite ? -1 : 1;
        return b.strength - a.strength;
      })[0] || { key: dimensionKeys[0], value: 50 };
  }

  function getPoleLabel(key, value) {
    const labels = teammatePoleLabels[key] || ["这一侧", "另一侧"];
    return value >= 50 ? labels[1] : labels[0];
  }

  function renderResult(result) {
    const primary = result.primary;
    const secondary = result.secondary;
    const teammate = result.teammate;
    const description = primary.copy.normal;
    const shareText = primary.share.normal;

    elements.resultCode.textContent = primary.code;
    elements.resultName.textContent = primary.name;
    elements.resultTagline.textContent = primary.tagline;
    elements.resultDescription.textContent = description;
    elements.resultMatch.textContent = result.isHidden ? "隐藏" : `${primary.similarity}%`;
    elements.resultSecondary.textContent = result.isHidden
      ? `测试模式：${result.mode.label}｜隐藏人格触发`
      : secondary
      ? `测试模式：${result.mode.label}｜相似人格：${secondary.name} · ${secondary.similarity}%`
      : `测试模式：${result.mode.label}`;
    elements.teammateName.textContent = teammate ? teammate.type.name : "暂未生成";
    elements.teammateReason.textContent = teammate
      ? `${teammate.reason} 推荐指数：${teammate.fit}%`
      : "当前结果不足以稳定推荐队友。";
    elements.shareText.textContent = shareText;
    elements.copyButton.textContent = "复制分享文案";

    elements.dimensionList.innerHTML = data.displayDimensions.map((dimension) => {
      const score = result.displayScores[dimension.key];
      return `
        <div class="dimension-row">
          <span>${escapeHtml(dimension.label)}</span>
          <strong>${score}</strong>
        </div>
      `;
    }).join("");
  }

  function expandEffects(effects = {}) {
    const expanded = {};

    Object.entries(effects).forEach(([sourceKey, value]) => {
      const transform = data.effectTransforms?.[sourceKey] || { [sourceKey]: 1 };
      Object.entries(transform).forEach(([targetKey, weight]) => {
        expanded[targetKey] = (expanded[targetKey] || 0) + value * weight;
      });
    });

    return Object.fromEntries(
      Object.entries(expanded)
        .filter(([key]) => dimensionKeys.includes(key))
        .map(([key, value]) => [key, Math.round(value)])
        .filter(([, value]) => value !== 0)
    );
  }

  function drawRadarChart(displayScores) {
    const canvas = elements.radarChart;
    const ctx = canvas.getContext("2d");
    const holderWidth = canvas.parentElement.clientWidth || 360;
    const size = Math.min(holderWidth, 360);
    const dpr = window.devicePixelRatio || 1;
    const dimensions = data.displayDimensions;
    const center = size / 2;
    const radius = size * 0.32;

    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.lineJoin = "round";

    drawRadarGrid(ctx, dimensions, center, radius);
    drawRadarShape(ctx, dimensions, displayScores, center, radius);
    drawRadarLabels(ctx, dimensions, displayScores, center, radius);
  }

  function drawRadarGrid(ctx, dimensions, center, radius) {
    ctx.strokeStyle = "rgba(230, 238, 255, 0.18)";
    ctx.lineWidth = 1;

    for (let ring = 1; ring <= 5; ring += 1) {
      const ringRadius = (radius / 5) * ring;
      ctx.beginPath();
      dimensions.forEach((dimension, index) => {
        const point = getRadarPoint(index, dimensions.length, center, ringRadius);
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.stroke();
    }

    dimensions.forEach((dimension, index) => {
      const point = getRadarPoint(index, dimensions.length, center, radius);
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    });
  }

  function drawRadarShape(ctx, dimensions, displayScores, center, radius) {
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius);
    gradient.addColorStop(0, "rgba(255, 231, 122, 0.56)");
    gradient.addColorStop(1, "rgba(232, 64, 64, 0.36)");

    ctx.beginPath();
    dimensions.forEach((dimension, index) => {
      const value = (displayScores[dimension.key] ?? 0) / 100;
      const point = getRadarPoint(index, dimensions.length, center, radius * value);
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 231, 122, 0.92)";
    ctx.lineWidth = 2;
    ctx.stroke();

    dimensions.forEach((dimension, index) => {
      const value = (displayScores[dimension.key] ?? 0) / 100;
      const point = getRadarPoint(index, dimensions.length, center, radius * value);
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3.8, 0, Math.PI * 2);
      ctx.fillStyle = "#ffe77a";
      ctx.fill();
    });
  }

  function drawRadarLabels(ctx, dimensions, displayScores, center, radius) {
    ctx.fillStyle = "rgba(246, 239, 222, 0.92)";
    ctx.font = "12px 'Microsoft YaHei', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    dimensions.forEach((dimension, index) => {
      const point = getRadarPoint(index, dimensions.length, center, radius + 34);
      ctx.fillText(dimension.label, point.x, point.y - 7);
      ctx.fillStyle = "rgba(255, 231, 122, 0.9)";
      ctx.fillText(String(displayScores[dimension.key] ?? 0), point.x, point.y + 10);
      ctx.fillStyle = "rgba(246, 239, 222, 0.92)";
    });
  }

  function getRadarPoint(index, total, center, radius, centerY = center) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / total;
    return {
      x: center + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    };
  }

  async function openShareImageDialog() {
    if (!state.result) return;

    elements.imageButton.disabled = true;
    elements.imageButton.textContent = "生成中";

    try {
      const image = await createShareImage(state.result);
      setShareImageData(image, state.result);
      elements.shareImageOverlay.hidden = false;
      document.body.classList.add("is-dialog-open");
    } catch (error) {
      console.warn("[DBTI] 结果图生成失败：", error);
      elements.imageButton.textContent = "生成失败";
      window.setTimeout(() => {
        elements.imageButton.textContent = "生成结果图";
      }, 1200);
      return;
    } finally {
      elements.imageButton.disabled = false;
      if (elements.imageButton.textContent !== "生成失败") {
        elements.imageButton.textContent = "生成结果图";
      }
    }
  }

  function closeShareImageDialog() {
    elements.shareImageOverlay.hidden = true;
    document.body.classList.remove("is-dialog-open");
  }

  function setShareImageData(image, result) {
    if (state.shareImageUrl) URL.revokeObjectURL(state.shareImageUrl);

    const fileName = `DBTI-${sanitizeFileName(result.primary.name)}.png`;
    const blob = image.blob || dataUrlToBlob(image.dataUrl);
    const imageUrl = URL.createObjectURL(blob);
    const isWechat = isWeChatBrowser();

    state.shareImageBlob = blob;
    state.shareImageDataUrl = image.dataUrl;
    state.shareImageUrl = imageUrl;
    state.shareImageName = fileName;
    elements.shareImagePreview.src = image.dataUrl;
    elements.downloadImageLink.href = isWechat ? image.dataUrl : imageUrl;
    elements.downloadImageLink.download = fileName;
    elements.downloadImageLink.textContent = isWechat ? "长按上方图片保存" : "保存图片";

    const canShare = canShareGeneratedImage();
    elements.systemShareButton.disabled = !canShare;
    elements.systemShareButton.textContent = canShare
      ? "系统分享图片"
      : isWechat
      ? "微信内长按保存"
      : "长按图片保存";
  }

  function handleDownloadImageClick(event) {
    if (!isWeChatBrowser()) return;

    event.preventDefault();
    elements.downloadImageLink.textContent = "请长按图片保存";
    elements.shareImagePreview.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  async function shareGeneratedImage() {
    const file = makeShareImageFile();
    if (!file || !navigator.share || !canShareGeneratedImage()) {
      elements.systemShareButton.textContent = "请长按图片保存";
      return;
    }

    const result = state.result;
    const teammateName = result?.teammate?.type?.name;
    const text = teammateName
      ? `我的 DBTI 是${result.primary.name}，最适合的队友是${teammateName}。`
      : elements.shareText.textContent.trim();

    try {
      await navigator.share({
        files: [file],
        title: "我的 DBTI 华语辩论人格测试结果",
        text
      });
      elements.systemShareButton.textContent = "已打开分享";
    } catch (error) {
      if (error?.name !== "AbortError") {
        elements.systemShareButton.textContent = "分享失败";
      }
    }
  }

  function canShareGeneratedImage() {
    const file = makeShareImageFile();
    if (!file || !navigator.canShare) return false;

    try {
      return navigator.canShare({ files: [file] });
    } catch (error) {
      return false;
    }
  }

  function makeShareImageFile() {
    if (!state.shareImageBlob || typeof File === "undefined") return null;
    try {
      return new File([state.shareImageBlob], state.shareImageName, { type: "image/png" });
    } catch (error) {
      return null;
    }
  }

  function createShareImage(result) {
    const canvas = createShareImageCanvas(result);
    const dataUrl = canvas.toDataURL("image/png", 0.94);

    if (!canvas.toBlob) {
      return Promise.resolve({ blob: dataUrlToBlob(dataUrl), dataUrl });
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve({ blob, dataUrl });
        else resolve({ blob: dataUrlToBlob(dataUrl), dataUrl });
      }, "image/png", 0.94);
    });
  }

  function dataUrlToBlob(dataUrl) {
    const [meta, content] = dataUrl.split(",");
    const mimeMatch = meta.match(/data:(.*?);base64/);
    const mime = mimeMatch?.[1] || "image/png";
    const binary = atob(content);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return new Blob([bytes], { type: mime });
  }

  function isWeChatBrowser() {
    return /MicroMessenger/i.test(navigator.userAgent || "");
  }

  function createShareImageCanvas(result) {
    const canvas = document.createElement("canvas");
    const width = 1080;
    const height = 1800;
    const ctx = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;
    drawShareImage(ctx, result, width, height);
    return canvas;
  }

  function drawShareImage(ctx, result, width, height) {
    const primary = result.primary;
    const teammate = result.teammate;
    const teammateName = teammate?.type?.name || "暂未生成";
    const matchText = result.isHidden ? "隐藏" : `${primary.similarity}%`;
    const bodyFont = "'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', sans-serif";
    const cardX = 52;
    const cardY = 52;
    const cardWidth = width - cardX * 2;
    const cardHeight = height - cardY * 2;
    const contentX = cardX + 56;
    const contentWidth = cardWidth - 112;

    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, "#230811");
    background.addColorStop(0.46, "#080b12");
    background.addColorStop(1, "#092048");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    drawShareGlow(ctx, 160, 160, 320, "rgba(232, 64, 64, 0.34)");
    drawShareGlow(ctx, 920, 260, 360, "rgba(47, 109, 246, 0.34)");
    drawShareGlow(ctx, 520, 1240, 430, "rgba(255, 231, 122, 0.15)");

    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#f4ead7";
    ctx.font = `900 210px ${bodyFont}`;
    ctx.fillText("DBTI", 474, 1662);
    ctx.restore();

    fillRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 42, "rgba(244, 234, 215, 0.085)");
    strokeRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 42, "rgba(244, 234, 215, 0.24)", 2);

    let y = cardY + 58;
    drawSharePill(ctx, contentX, y, "DBTI RESULT", bodyFont, "#ffe77a", "rgba(255, 231, 122, 0.12)");
    drawSharePill(ctx, contentX + 232, y, result.mode.label, bodyFont, "#f4ead7", "rgba(244, 234, 215, 0.1)");

    y += 78;
    ctx.fillStyle = "#ffe77a";
    ctx.font = `700 26px ${bodyFont}`;
    ctx.fillText("华语辩论人格测试", contentX, y);

    y += 50;
    drawSharePill(ctx, contentX, y, primary.code, bodyFont, "#ffb0a6", "rgba(232, 64, 64, 0.18)");

    y += 66;
    ctx.fillStyle = "#f4ead7";
    ctx.font = `900 82px ${bodyFont}`;
    y = drawWrappedCanvasText(ctx, primary.name, contentX, y, contentWidth, 86, 2);

    y += 14;
    ctx.fillStyle = "#ffe77a";
    ctx.font = `700 35px ${bodyFont}`;
    y = drawWrappedCanvasText(ctx, primary.tagline, contentX, y, contentWidth, 46, 2);

    y += 30;
    const statY = y;
    drawShareMetric(ctx, contentX, statY, 230, 112, "匹配度", matchText, bodyFont);
    drawShareMetric(ctx, contentX + 254, statY, contentWidth - 254, 112, "最适合的队友", teammateName, bodyFont);

    y += 148;
    fillRoundRect(ctx, contentX, y, contentWidth, 126, 24, "rgba(0, 0, 0, 0.18)");
    strokeRoundRect(ctx, contentX, y, contentWidth, 126, 24, "rgba(255, 231, 122, 0.22)", 1);
    ctx.fillStyle = "rgba(244, 234, 215, 0.82)";
    ctx.font = `500 28px ${bodyFont}`;
    drawWrappedCanvasText(
      ctx,
      teammate
        ? `队友推荐：${teammate.reason}`
        : "队友推荐：当前结果不足以稳定推荐队友。",
      contentX + 30,
      y + 24,
      contentWidth - 60,
      38,
      2
    );

    const radarCenterY = Math.max(y + 330, 1010);
    const dimensionGridY = radarCenterY + 286;
    const footerY = dimensionGridY + 310;

    drawShareRadar(ctx, result.displayScores, width / 2, radarCenterY, 176, bodyFont);
    drawShareDimensionGrid(ctx, result.displayScores, contentX, dimensionGridY, contentWidth, bodyFont);

    ctx.fillStyle = "rgba(244, 234, 215, 0.68)";
    ctx.font = `500 25px ${bodyFont}`;
    ctx.fillText("长按保存图片，发朋友圈或发给你的辩论队友。", contentX, footerY);
    ctx.fillStyle = "#ffe77a";
    ctx.font = `700 25px ${bodyFont}`;
    ctx.fillText("DBTI 华语辩论人格测试", contentX, footerY + 44);
  }

  function drawShareGlow(ctx, x, y, radius, color) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSharePill(ctx, x, y, text, fontFamily, color, background) {
    ctx.save();
    ctx.font = `700 24px ${fontFamily}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const width = Math.ceil(ctx.measureText(text).width) + 42;
    fillRoundRect(ctx, x, y, width, 46, 23, background);
    strokeRoundRect(ctx, x, y, width, 46, 23, "rgba(255, 231, 122, 0.34)", 1);
    ctx.fillStyle = color;
    ctx.fillText(text, x + 21, y + 23);
    ctx.restore();
  }

  function drawShareMetric(ctx, x, y, width, height, label, value, fontFamily) {
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    fillRoundRect(ctx, x, y, width, height, 24, "rgba(244, 234, 215, 0.09)");
    strokeRoundRect(ctx, x, y, width, height, 24, "rgba(244, 234, 215, 0.18)", 1);
    ctx.fillStyle = "rgba(174, 184, 198, 0.98)";
    ctx.font = `500 24px ${fontFamily}`;
    ctx.fillText(label, x + 26, y + 24);
    ctx.fillStyle = "#ffe77a";
    ctx.font = `900 42px ${fontFamily}`;
    drawWrappedCanvasText(ctx, value, x + 26, y + 58, width - 52, 46, 1);
    ctx.restore();
  }

  function drawShareRadar(ctx, displayScores, centerX, centerY, radius, fontFamily) {
    const dimensions = data.displayDimensions;

    ctx.save();
    ctx.strokeStyle = "rgba(230, 238, 255, 0.2)";
    ctx.lineWidth = 2;

    for (let ring = 1; ring <= 5; ring += 1) {
      const ringRadius = (radius / 5) * ring;
      ctx.beginPath();
      dimensions.forEach((dimension, index) => {
        const point = getRadarPoint(index, dimensions.length, centerX, ringRadius, centerY);
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.stroke();
    }

    dimensions.forEach((dimension, index) => {
      const point = getRadarPoint(index, dimensions.length, centerX, radius, centerY);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    });

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, "rgba(255, 231, 122, 0.58)");
    gradient.addColorStop(1, "rgba(232, 64, 64, 0.38)");
    ctx.beginPath();
    dimensions.forEach((dimension, index) => {
      const value = (displayScores[dimension.key] ?? 0) / 100;
      const point = getRadarPoint(index, dimensions.length, centerX, radius * value, centerY);
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 231, 122, 0.92)";
    ctx.lineWidth = 4;
    ctx.stroke();

    dimensions.forEach((dimension, index) => {
      const value = (displayScores[dimension.key] ?? 0) / 100;
      const point = getRadarPoint(index, dimensions.length, centerX, radius * value, centerY);
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#ffe77a";
      ctx.fill();
    });

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 23px ${fontFamily}`;
    dimensions.forEach((dimension, index) => {
      const point = getRadarPoint(index, dimensions.length, centerX, radius + 58, centerY);
      ctx.fillStyle = "rgba(246, 239, 222, 0.94)";
      ctx.fillText(dimension.label, point.x, point.y - 14);
      ctx.fillStyle = "rgba(255, 231, 122, 0.94)";
      ctx.fillText(String(displayScores[dimension.key] ?? 0), point.x, point.y + 18);
    });
    ctx.restore();
  }

  function drawShareDimensionGrid(ctx, displayScores, x, y, width, fontFamily) {
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const columns = 2;
    const gap = 18;
    const itemWidth = (width - gap) / columns;
    const itemHeight = 62;

    data.displayDimensions.forEach((dimension, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const itemX = x + column * (itemWidth + gap);
      const itemY = y + row * (itemHeight + 14);

      fillRoundRect(ctx, itemX, itemY, itemWidth, itemHeight, 16, "rgba(0, 0, 0, 0.18)");
      strokeRoundRect(ctx, itemX, itemY, itemWidth, itemHeight, 16, "rgba(244, 234, 215, 0.16)", 1);
      ctx.fillStyle = "rgba(244, 234, 215, 0.78)";
      ctx.font = `500 24px ${fontFamily}`;
      ctx.fillText(dimension.label, itemX + 22, itemY + 20);
      ctx.fillStyle = "#ffe77a";
      ctx.font = `900 26px ${fontFamily}`;
      ctx.textAlign = "right";
      ctx.fillText(String(displayScores[dimension.key] ?? 0), itemX + itemWidth - 22, itemY + 19);
      ctx.textAlign = "left";
    });
    ctx.restore();
  }

  function drawWrappedCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
    const lines = wrapCanvasText(ctx, text, maxWidth, maxLines);
    lines.forEach((line, index) => {
      ctx.fillText(line, x, y + index * lineHeight);
    });
    return y + lines.length * lineHeight;
  }

  function wrapCanvasText(ctx, text, maxWidth, maxLines = Infinity) {
    const paragraphs = String(text ?? "").split(/\n+/).map((part) => part.trim()).filter(Boolean);
    const lines = [];

    for (const paragraph of paragraphs) {
      let line = "";
      const chars = Array.from(paragraph);

      for (let index = 0; index < chars.length; index += 1) {
        const char = chars[index];
        const testLine = `${line}${char}`;
        if (ctx.measureText(testLine).width > maxWidth && line) {
          lines.push(line);
          line = char;

          if (lines.length === maxLines) {
            lines[lines.length - 1] = truncateCanvasLine(ctx, lines[lines.length - 1], maxWidth);
            return lines;
          }
        } else {
          line = testLine;
        }
      }

      if (line) {
        lines.push(line);
        if (lines.length === maxLines) {
          if (paragraphs.indexOf(paragraph) < paragraphs.length - 1) {
            lines[lines.length - 1] = truncateCanvasLine(ctx, lines[lines.length - 1], maxWidth);
          }
          return lines;
        }
      }
    }

    return lines;
  }

  function truncateCanvasLine(ctx, line, maxWidth) {
    let nextLine = line;
    while (nextLine.length > 0 && ctx.measureText(`${nextLine}…`).width > maxWidth) {
      nextLine = nextLine.slice(0, -1);
    }
    return `${nextLine}…`;
  }

  function fillRoundRect(ctx, x, y, width, height, radius, color) {
    drawRoundRectPath(ctx, x, y, width, height, radius);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function strokeRoundRect(ctx, x, y, width, height, radius, color, lineWidth) {
    drawRoundRectPath(ctx, x, y, width, height, radius);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  function drawRoundRectPath(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function sanitizeFileName(value) {
    return String(value || "result")
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 40) || "result";
  }

  async function copyShareText() {
    const text = elements.shareText.textContent.trim();
    if (!text) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopy(text);
      }
      elements.copyButton.textContent = "已复制";
    } catch (error) {
      fallbackCopy(text);
      elements.copyButton.textContent = "已复制";
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  init();
})();
