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
    activeQuestions: []
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

  function getRadarPoint(index, total, center, radius) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / total;
    return {
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius
    };
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
