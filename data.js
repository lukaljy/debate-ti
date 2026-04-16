(() => {
  const internalDimensions = [
    ["expression_vs_competition", "表达—竞技"],
    ["stage_vs_team", "赛场—队伍"],
    ["initiation_tendency", "开战倾向"],
    ["pressing_intensity", "逼问强度"],
    ["fact_vs_mechanism", "事实—机理"],
    ["reality_vs_setting", "现实—设定"],
    ["self_vs_judge", "自我—裁判"],
    ["judge_vs_performance", "裁判—表现"],
    ["tournament_activity", "赛事活跃"],
    ["daily_argumentativeness", "日常论辩"],
    ["meme_intensity", "整活浓度"],
    ["emotional_heat", "上头程度"],
    ["team_construction", "整队建构"],
    ["solo_vs_coordination", "单兵—配合"],
    ["chain_vs_scene", "链条—场景"],
    ["plain_vs_stylized", "朴素—包装"]
  ].map(([key, label]) => ({ key, label }));

  const displayDimensions = [
    ["competitive_orientation", "竞技导向", "expression_vs_competition", "stage_vs_team"],
    ["pressure_orientation", "压迫倾向", "initiation_tendency", "pressing_intensity"],
    ["reality_anchor", "现实锚点", "fact_vs_mechanism", "reality_vs_setting"],
    ["judge_orientation", "评委导向", "self_vs_judge", "judge_vs_performance"],
    ["debate_immersion", "辩棍浓度", "tournament_activity", "daily_argumentativeness"],
    ["abstraction_orientation", "放飞程度", "meme_intensity", "emotional_heat"],
    ["collaboration_orientation", "协同倾向", "team_construction", "solo_vs_coordination"],
    ["rendering_orientation", "渲染倾向", "chain_vs_scene", "plain_vs_stylized"]
  ].map(([key, label, primary, secondary]) => ({ key, label, primary, secondary }));

  const effectTransforms = {
    attackPressure: { initiation_tendency: 0.7, pressing_intensity: 0.5 },
    defensiveDissection: { initiation_tendency: -0.35, pressing_intensity: -0.65, chain_vs_scene: -0.35 },
    frameworkModeling: { team_construction: 0.45, self_vs_judge: 0.25, chain_vs_scene: -0.25 },
    criterionSensitivity: { self_vs_judge: 0.75, judge_vs_performance: 0.5 },
    evidenceDependence: { fact_vs_mechanism: 0.75, reality_vs_setting: 0.5 },
    logicPurity: { chain_vs_scene: -0.75, fact_vs_mechanism: -0.3 },
    expressionImpact: { chain_vs_scene: 0.65, plain_vs_stylized: 0.35 },
    punchlineImpulse: { plain_vs_stylized: 0.75, meme_intensity: 0.35 },
    impromptuCounter: { initiation_tendency: 0.45, pressing_intensity: 0.25 },
    riskPreference: { expression_vs_competition: 0.7, stage_vs_team: 0.2 },
    teammateRelay: { solo_vs_coordination: 0.75, stage_vs_team: -0.35 },
    battlefieldControl: { team_construction: 0.7, solo_vs_coordination: 0.35 },
    winObsession: { expression_vs_competition: 0.75, stage_vs_team: 0.35 },
    reviewCompulsion: { tournament_activity: 0.7, daily_argumentativeness: 0.35 },
    memeDensity: { meme_intensity: 0.75, daily_argumentativeness: 0.45 },
    emotionSpike: { emotional_heat: 0.8 }
  };

  const questionModeSources = [
    {
      key: "profile35",
      label: "37题人格题",
      badge: "37 QUESTIONS",
      description: "四选一情境题，直接按选项给多个底层维度加减分，更适合快速体验人格结果。",
      file: "问题文档.md",
      parser: "weightedOptions"
    },
    {
      key: "scale80",
      label: "80题量表题",
      badge: "80 QUESTIONS",
      description: "五级量表题，每个底层维度 5 题，按正反向均分换算为 0-100，更适合精细查看维度。",
      file: "问题文档-80题.md",
      parser: "likertScale",
      shuffleOnStart: true
    }
  ];

  const dimensionDetails = {
    expression_vs_competition: {
      high: "更偏竞技、博弈、赛果与赢面。",
      low: "更偏表达、观点输出、自我投射。"
    },
    stage_vs_team: {
      high: "更偏赛事现场、赛场机制与比赛刺激。",
      low: "更偏辩论队、队友关系与共同体氛围。"
    },
    initiation_tendency: {
      high: "更习惯主动发起攻防、抢先开线。",
      low: "更愿意观察、等待对方出招后再回应。"
    },
    pressing_intensity: {
      high: "更倾向连续追问、压缩承诺、逼对方表态。",
      low: "更倾向点到为止，不一定一路追到底。"
    },
    fact_vs_mechanism: {
      high: "更依赖数据、案例、现实事实与可验证锚点。",
      low: "更偏机理、逻辑链条与抽象推演。"
    },
    reality_vs_setting: {
      high: "更偏政策题、社会议题、现实热点。",
      low: "更偏脑洞题、哲学题、抽象设定。"
    },
    self_vs_judge: {
      high: "更倾向讲评委想听、最能转化成票的话。",
      low: "更倾向讲自己真正想讲、真正认同的内容。"
    },
    judge_vs_performance: {
      high: "更认为评委变量会显著左右结果。",
      low: "更相信表现本身决定比赛结果。"
    },
    tournament_activity: {
      high: "参赛、约赛、看赛、复盘等辩论活动频率更高。",
      low: "辩论更像阶段性活动，不是持续生活状态。"
    },
    daily_argumentativeness: {
      high: "日常生活中也更容易进入辩论式表达。",
      low: "更少把辩论感带进普通聊天。"
    },
    meme_intensity: {
      high: "更爱玩梗、造梗、制造传播素材。",
      low: "更正经、克制、少娱乐化。"
    },
    emotional_heat: {
      high: "更容易被赛场情绪和攻防节奏卷入。",
      low: "更稳定，不容易被挑衅或场面带跑。"
    },
    team_construction: {
      high: "更习惯从整队分工、主线和收束思考比赛。",
      low: "更关注自己负责的点位和局部输出。"
    },
    solo_vs_coordination: {
      high: "更偏配合、补位、接线与同步。",
      low: "更偏单兵突破、独立作战。"
    },
    chain_vs_scene: {
      high: "更偏场景构造、画面感、代入感。",
      low: "更偏逻辑链条、机制分析、因果扣合。"
    },
    plain_vs_stylized: {
      high: "更偏包装、修辞、节奏与语言设计。",
      low: "更偏朴素、直给、克制表达。"
    }
  };

  const makeProfile = (overrides) => {
    const profile = Object.fromEntries(internalDimensions.map((dimension) => [dimension.key, 50]));
    return { ...profile, ...overrides };
  };

  const makeType = ({ code, name, tagline, profile, description }) => ({
    code,
    name,
    tagline,
    profile: makeProfile(profile),
    copy: {
      normal: description
    },
    share: {
      normal: `我的 DBTI 是${name}，${tagline}`
    }
  });

  const questions = [
    {
      id: "q001",
      text: "自由辩刚开始，对方一辩抛出一个你觉得明显偷换概念的定义，你会：",
      options: [
        {
          label: "A",
          text: "立刻站起来追问，先把定义钉死，再顺手把对面整条线拎起来抖一抖。",
          effects: { attackPressure: 36, impromptuCounter: 24, riskPreference: 16, emotionSpike: 12 }
        },
        {
          label: "B",
          text: "先记下来，等对方链条走完再拆。现在急着打，容易把自己也炸进去。",
          effects: { defensiveDissection: 34, logicPurity: 22, teammateRelay: 14, emotionSpike: -18 }
        },
        {
          label: "C",
          text: "把它放回评委最该看的判准里处理：这不是定义问题，这是比较标准问题。",
          effects: { frameworkModeling: 32, criterionSensitivity: 28, battlefieldControl: 18, riskPreference: -10 }
        },
        {
          label: "D",
          text: "翻资料夹，找出三个案例、两篇论文和一个赛后复盘，证明这不是第一次有人这么偷。",
          effects: { evidenceDependence: 36, reviewCompulsion: 24, logicPurity: 16, expressionImpact: -8 }
        }
      ]
    },
    {
      id: "q002",
      text: "赛前讨论到凌晨，大家还在吵核心标准，你最可能先做什么？",
      options: [
        {
          label: "A",
          text: "把所有人的话收成三层框架：定义、标准、比较，不然今晚谁也别睡。",
          effects: { frameworkModeling: 34, battlefieldControl: 20, criterionSensitivity: 18, memeDensity: -8 }
        },
        {
          label: "B",
          text: "先去找判例、论文、统计口径。没有材料支撑的灵感一律先别上桌。",
          effects: { evidenceDependence: 36, reviewCompulsion: 16, logicPurity: 14, expressionImpact: -8 }
        },
        {
          label: "C",
          text: "让大家各讲一分钟，先判断谁的方向能被评委听懂，再决定怎么收。",
          effects: { teammateRelay: 26, criterionSensitivity: 24, battlefieldControl: 18, emotionSpike: -10 }
        },
        {
          label: "D",
          text: "先抛一个能让全队醒过来的暴论。哪怕最后不用，也要把空气搅动起来。",
          effects: { punchlineImpulse: 28, memeDensity: 22, riskPreference: 20, frameworkModeling: -10 }
        }
      ]
    },
    {
      id: "q003",
      text: "队友在场上打出一个明显有坑的点，而且对方已经准备追了，你会：",
      options: [
        {
          label: "A",
          text: "马上接线，把它改造成一个较弱但能站住的版本，先保住队伍战场。",
          effects: { teammateRelay: 36, defensiveDissection: 24, battlefieldControl: 18, attackPressure: -8 }
        },
        {
          label: "B",
          text: "直接转火对方更大的漏洞，用进攻把这个坑从评委注意力里冲掉。",
          effects: { attackPressure: 34, impromptuCounter: 26, riskPreference: 20, teammateRelay: -8 }
        },
        {
          label: "C",
          text: "承认这个点不是主战场，立刻把评委拉回更关键的比较标准。",
          effects: { criterionSensitivity: 34, frameworkModeling: 24, emotionSpike: -14, riskPreference: -8 }
        },
        {
          label: "D",
          text: "赛后一定复盘，但场上先记下来，等对面真的追深了再精准拆弹。",
          effects: { reviewCompulsion: 24, defensiveDissection: 28, logicPurity: 18, emotionSpike: -12 }
        }
      ]
    },
    {
      id: "q004",
      text: "如果你负责结辩，最想把最后三分钟用来做什么？",
      options: [
        {
          label: "A",
          text: "把全场争点重新编号，告诉评委每个点为什么都导向我方。",
          effects: { battlefieldControl: 36, frameworkModeling: 24, criterionSensitivity: 16, memeDensity: -8 }
        },
        {
          label: "B",
          text: "把最重要的价值差异抬出来，让这场比赛看起来像一个时代选择。",
          effects: { expressionImpact: 32, punchlineImpulse: 22, frameworkModeling: 18, evidenceDependence: -8 }
        },
        {
          label: "C",
          text: "补一组对方没处理干净的数据和例子，让他们最后也不能安全落地。",
          effects: { evidenceDependence: 30, attackPressure: 20, reviewCompulsion: 16, expressionImpact: -6 }
        },
        {
          label: "D",
          text: "用一句能被记住的话收尾。赢不赢先放一边，赛后传播点必须有。",
          effects: { punchlineImpulse: 34, memeDensity: 28, expressionImpact: 20, logicPurity: -10 }
        }
      ]
    },
    {
      id: "q005",
      text: "对方质询突然问到你准备稿里没有的一环，你第一反应是：",
      options: [
        {
          label: "A",
          text: "先稳住概念范围，把问题拆成两个小问题，再逐个回应。",
          effects: { defensiveDissection: 34, logicPurity: 26, emotionSpike: -16, riskPreference: -8 }
        },
        {
          label: "B",
          text: "反问对方预设，把问题的危险性倒回他们自己的标准里。",
          effects: { impromptuCounter: 34, attackPressure: 26, criterionSensitivity: 16, riskPreference: 12 }
        },
        {
          label: "C",
          text: "快速看队友反应，能接就让队友接，不能接就先缩小承诺。",
          effects: { teammateRelay: 34, battlefieldControl: 18, defensiveDissection: 16, attackPressure: -8 }
        },
        {
          label: "D",
          text: "先用气势顶住，争取让这个问题看起来没有它听上去那么致命。",
          effects: { expressionImpact: 28, riskPreference: 24, emotionSpike: 20, logicPurity: -12 }
        }
      ]
    },
    {
      id: "q006",
      text: "你最喜欢拿到哪种准备任务？",
      options: [
        {
          label: "A",
          text: "写一辩稿。把定义、标准、框架和论点顺序排得干干净净。",
          effects: { frameworkModeling: 36, logicPurity: 22, riskPreference: -14, punchlineImpulse: -6 }
        },
        {
          label: "B",
          text: "做资料包。案例越多越安心，最好还能按用途贴好标签。",
          effects: { evidenceDependence: 38, reviewCompulsion: 22, teammateRelay: 12, expressionImpact: -8 }
        },
        {
          label: "C",
          text: "模拟自由辩。先把所有可能炸场的问法都拿出来试一遍。",
          effects: { attackPressure: 28, impromptuCounter: 28, riskPreference: 18, emotionSpike: 12 }
        },
        {
          label: "D",
          text: "做评委视角预判。哪些点会被买，哪些点听起来像自嗨，要先分清楚。",
          effects: { criterionSensitivity: 36, battlefieldControl: 20, frameworkModeling: 16, memeDensity: -8 }
        }
      ]
    },
    {
      id: "q007",
      text: "遇到一个很容易煽动情绪的辩题，你会怎么处理？",
      options: [
        {
          label: "A",
          text: "情绪可以有，但必须服务比较。先把价值冲突放进清楚的标准里。",
          effects: { criterionSensitivity: 28, frameworkModeling: 26, expressionImpact: 16, emotionSpike: -10 }
        },
        {
          label: "B",
          text: "找到最能打动人的叙事入口，把评委带进我方的价值现场。",
          effects: { expressionImpact: 36, punchlineImpulse: 18, riskPreference: 10, evidenceDependence: -8 }
        },
        {
          label: "C",
          text: "先查数据，情绪题最怕只剩情绪，必须把现实支点钉住。",
          effects: { evidenceDependence: 34, logicPurity: 20, reviewCompulsion: 12, punchlineImpulse: -8 }
        },
        {
          label: "D",
          text: "直接拆对方煽情里的偷换：感动归感动，比较归比较。",
          effects: { attackPressure: 28, defensiveDissection: 26, logicPurity: 18, expressionImpact: -6 }
        }
      ]
    },
    {
      id: "q008",
      text: "赛前最后一小时，你发现一个核心资料可能有口径问题，你会：",
      options: [
        {
          label: "A",
          text: "立刻停用，宁可少一个例子，也不要让对方抓住把柄。",
          effects: { logicPurity: 34, defensiveDissection: 22, riskPreference: -20, winObsession: 8 }
        },
        {
          label: "B",
          text: "保留，但改成更保守的表述，只支撑小结论，不支撑主结论。",
          effects: { criterionSensitivity: 26, frameworkModeling: 18, defensiveDissection: 18, riskPreference: -6 }
        },
        {
          label: "C",
          text: "继续用。只要对方没查到，它仍然是场上的有效武器。",
          effects: { riskPreference: 34, winObsession: 24, attackPressure: 14, logicPurity: -24 }
        },
        {
          label: "D",
          text: "马上找替代资料，并把这次事故记进赛后复盘清单。",
          effects: { evidenceDependence: 28, reviewCompulsion: 30, teammateRelay: 12, emotionSpike: -8 }
        }
      ]
    },
    {
      id: "q009",
      text: "队伍准备采用一个高风险但可能很亮眼的奇袭打法，你的态度是：",
      options: [
        {
          label: "A",
          text: "可以打，但必须先设计撤退路线。奇袭不是裸奔。",
          effects: { battlefieldControl: 28, riskPreference: 18, criterionSensitivity: 18, emotionSpike: -8 }
        },
        {
          label: "B",
          text: "打，必须打。常规打法赢不了就别装稳了。",
          effects: { riskPreference: 38, winObsession: 28, attackPressure: 20, defensiveDissection: -10 }
        },
        {
          label: "C",
          text: "先问评委能不能买。如果评委不吃，再好看也只是自嗨。",
          effects: { criterionSensitivity: 36, frameworkModeling: 18, riskPreference: -14, punchlineImpulse: -8 }
        },
        {
          label: "D",
          text: "我负责把它包装得像正经战术，至少不要让队友看起来像临时发疯。",
          effects: { teammateRelay: 26, expressionImpact: 24, memeDensity: 14, battlefieldControl: 12 }
        }
      ]
    },
    {
      id: "q010",
      text: "评委点评说“你们回应不够”，但你觉得明明回应了，你会：",
      options: [
        {
          label: "A",
          text: "复盘录像，找出是哪一层回应没有被评委识别出来。",
          effects: { reviewCompulsion: 36, criterionSensitivity: 24, logicPurity: 16, emotionSpike: -8 }
        },
        {
          label: "B",
          text: "下次直接把回应标签打在评委脸上：第一，回应；第二，比较；第三，影响。",
          effects: { frameworkModeling: 28, expressionImpact: 20, battlefieldControl: 18, criterionSensitivity: 14 }
        },
        {
          label: "C",
          text: "先不服三分钟，然后承认可能是表达路径没铺好。",
          effects: { emotionSpike: 24, expressionImpact: 18, reviewCompulsion: 18, logicPurity: 8 }
        },
        {
          label: "D",
          text: "把这条点评转发给全队，提醒大家以后别只在心里回应。",
          effects: { teammateRelay: 28, battlefieldControl: 18, reviewCompulsion: 16, memeDensity: 8 }
        }
      ]
    },
    {
      id: "q011",
      text: "如果让你自由选择上场位置，你最自然的位置是：",
      options: [
        {
          label: "A",
          text: "一辩。给我结构和定义，我来把这场比赛摆正。",
          effects: { frameworkModeling: 34, logicPurity: 18, riskPreference: -12, battlefieldControl: 12 }
        },
        {
          label: "B",
          text: "二辩或质询位。给我对面的人，我来拆。",
          effects: { attackPressure: 34, defensiveDissection: 22, impromptuCounter: 16, emotionSpike: 10 }
        },
        {
          label: "C",
          text: "三辩或自由辩核心。战场乱起来，我反而更清醒。",
          effects: { impromptuCounter: 34, riskPreference: 24, attackPressure: 16, teammateRelay: -8 }
        },
        {
          label: "D",
          text: "四辩。前面打成什么样都行，最后给我三分钟收账。",
          effects: { battlefieldControl: 34, criterionSensitivity: 22, expressionImpact: 20, reviewCompulsion: 10 }
        }
      ]
    },
    {
      id: "q012",
      text: "自由辩突然安静了两秒，空气开始变得尴尬，你会：",
      options: [
        {
          label: "A",
          text: "马上站起来补一问，哪怕不是最优，也不能让节奏死掉。",
          effects: { impromptuCounter: 28, attackPressure: 24, riskPreference: 18, emotionSpike: 12 }
        },
        {
          label: "B",
          text: "把刚才没收束的战场接回来，提醒队友下一轮该往哪打。",
          effects: { teammateRelay: 30, battlefieldControl: 24, defensiveDissection: 14, emotionSpike: -8 }
        },
        {
          label: "C",
          text: "宁可安静一秒，也不乱问。没有目标的问题只是在浪费时间。",
          effects: { logicPurity: 28, criterionSensitivity: 18, riskPreference: -18, punchlineImpulse: -8 }
        },
        {
          label: "D",
          text: "抛一个能把全场注意力拉回来的尖锐表述，先把气口抢回来。",
          effects: { expressionImpact: 30, punchlineImpulse: 24, memeDensity: 16, riskPreference: 10 }
        }
      ]
    },
    {
      id: "q013",
      text: "比赛输了，赛后你最可能先说什么？",
      options: [
        {
          label: "A",
          text: "第二轮质询那里其实就已经崩了，我们逐分钟复盘。",
          effects: { reviewCompulsion: 38, logicPurity: 18, winObsession: 16, memeDensity: -8 }
        },
        {
          label: "B",
          text: "先别互相怪，大家把自己没接住的线列出来。",
          effects: { teammateRelay: 32, battlefieldControl: 20, defensiveDissection: 14, emotionSpike: -12 }
        },
        {
          label: "C",
          text: "这个评委的判准其实能理解，我们没有把比较递到位。",
          effects: { criterionSensitivity: 30, frameworkModeling: 18, reviewCompulsion: 16, emotionSpike: -8 }
        },
        {
          label: "D",
          text: "先让我发个朋友圈阴阳一下，五分钟后回来复盘。",
          effects: { memeDensity: 30, emotionSpike: 22, punchlineImpulse: 18, reviewCompulsion: 8 }
        }
      ]
    },
    {
      id: "q014",
      text: "遇到明显强于自己的对手，你的备赛策略会变成：",
      options: [
        {
          label: "A",
          text: "把他们常用打法扒一遍，准备针对性资料和预设回应。",
          effects: { evidenceDependence: 30, reviewCompulsion: 24, defensiveDissection: 18, winObsession: 14 }
        },
        {
          label: "B",
          text: "赌一套他们没见过的切入角度。常规对轰大概率打不过。",
          effects: { riskPreference: 34, frameworkModeling: 18, attackPressure: 18, winObsession: 18 }
        },
        {
          label: "C",
          text: "压低失误率，所有争点都守住，逼他们自己犯错。",
          effects: { defensiveDissection: 32, logicPurity: 22, emotionSpike: -16, riskPreference: -12 }
        },
        {
          label: "D",
          text: "把表达和价值讲到极致，至少让评委知道我们不是来陪跑的。",
          effects: { expressionImpact: 34, punchlineImpulse: 18, winObsession: 20, evidenceDependence: -6 }
        }
      ]
    },
    {
      id: "q015",
      text: "比赛当天，队友突然开始焦虑，你通常会：",
      options: [
        {
          label: "A",
          text: "把流程、分工和重点再过一遍，用秩序感把大家按回座位。",
          effects: { battlefieldControl: 28, teammateRelay: 24, frameworkModeling: 16, emotionSpike: -12 }
        },
        {
          label: "B",
          text: "提醒大家这场必须拿下，焦虑可以有，但别影响执行。",
          effects: { winObsession: 32, battlefieldControl: 16, expressionImpact: 12, emotionSpike: 8 }
        },
        {
          label: "C",
          text: "讲点烂梗缓一下气氛，让队伍至少先像个人类组织。",
          effects: { memeDensity: 30, teammateRelay: 20, punchlineImpulse: 16, winObsession: -8 }
        },
        {
          label: "D",
          text: "自己找个角落再看一遍资料。别人焦虑的时候，我更想确认底牌。",
          effects: { evidenceDependence: 28, logicPurity: 16, teammateRelay: -10, emotionSpike: -6 }
        }
      ]
    },
    {
      id: "q016",
      text: "赛后如果要发一条总结，你最可能发什么？",
      options: [
        {
          label: "A",
          text: "感谢队友，今天几条线接得很舒服，下次继续补细节。",
          effects: { teammateRelay: 30, reviewCompulsion: 16, expressionImpact: 12, emotionSpike: -8 }
        },
        {
          label: "B",
          text: "今天最关键的问题是判准没有打透，下一场必须重构比较。",
          effects: { criterionSensitivity: 30, frameworkModeling: 22, reviewCompulsion: 18, memeDensity: -8 }
        },
        {
          label: "C",
          text: "附上三张资料截图和一句：别问，问就是还没查完。",
          effects: { evidenceDependence: 30, memeDensity: 18, reviewCompulsion: 18, expressionImpact: 8 }
        },
        {
          label: "D",
          text: "发一条能让同赛区都看懂的抽象短句，懂的都懂。",
          effects: { memeDensity: 36, punchlineImpulse: 24, expressionImpact: 14, logicPurity: -8 }
        }
      ]
    },
    {
      id: "q017",
      text: "拿到一个特别抽象的价值辩题，你最先做的事是：",
      options: [
        {
          label: "A",
          text: "先把关键词定义拆开，防止整场比赛从第一秒开始飘。",
          effects: { frameworkModeling: 32, logicPurity: 24, criterionSensitivity: 16, punchlineImpulse: -8 }
        },
        {
          label: "B",
          text: "找现实场景和具体人群，不然价值讨论很容易变成空中楼阁。",
          effects: { evidenceDependence: 26, expressionImpact: 18, criterionSensitivity: 14, memeDensity: -6 }
        },
        {
          label: "C",
          text: "先写一段能把题目抬起来的开场，让评委知道这不是普通选择题。",
          effects: { expressionImpact: 34, punchlineImpulse: 24, frameworkModeling: 12, evidenceDependence: -8 }
        },
        {
          label: "D",
          text: "直接问：这题到底哪边更容易赢？价值很美，但票很真实。",
          effects: { winObsession: 32, criterionSensitivity: 24, riskPreference: 10, expressionImpact: -8 }
        }
      ]
    },
    {
      id: "q018",
      text: "对方疯狂堆案例，听起来每个都很惨，但比较关系很虚，你会：",
      options: [
        {
          label: "A",
          text: "抓住样本和归因问题，说明案例不是结论的自动提款机。",
          effects: { logicPurity: 34, defensiveDissection: 26, evidenceDependence: 14, expressionImpact: -6 }
        },
        {
          label: "B",
          text: "直接追问比较标准：就算这些都是真的，为什么推出你方更优？",
          effects: { attackPressure: 30, criterionSensitivity: 28, impromptuCounter: 16, emotionSpike: 8 }
        },
        {
          label: "C",
          text: "拿我方更能解释大趋势的数据压回去，让评委看全局不是看眼泪。",
          effects: { evidenceDependence: 34, battlefieldControl: 20, winObsession: 12, punchlineImpulse: -6 }
        },
        {
          label: "D",
          text: "把对方煽情的地方转成一句能记住的反打，先把气势抢回来。",
          effects: { expressionImpact: 30, punchlineImpulse: 24, memeDensity: 14, logicPurity: -8 }
        }
      ]
    },
    {
      id: "q019",
      text: "队友说你的稿子太长，可能念不完，你会：",
      options: [
        {
          label: "A",
          text: "删修辞，保链条。只要逻辑骨架在，肉少一点也能活。",
          effects: { logicPurity: 30, frameworkModeling: 24, expressionImpact: -10, riskPreference: -8 }
        },
        {
          label: "B",
          text: "删资料，保关键例子。不要让评委在数据森林里迷路。",
          effects: { criterionSensitivity: 24, battlefieldControl: 18, evidenceDependence: -10, expressionImpact: 10 }
        },
        {
          label: "C",
          text: "不删，练到能念完。速度也是一种战术。",
          effects: { winObsession: 28, riskPreference: 24, evidenceDependence: 12, teammateRelay: -8 }
        },
        {
          label: "D",
          text: "让队友标出听不懂的地方，先保证他们能接上我的线。",
          effects: { teammateRelay: 34, battlefieldControl: 18, reviewCompulsion: 14, frameworkModeling: 8 }
        }
      ]
    },
    {
      id: "q020",
      text: "自由辩里对方突然开始抓你方一个小失误不放，你会：",
      options: [
        {
          label: "A",
          text: "承认它小，然后立刻问这个小失误如何影响主判准。",
          effects: { criterionSensitivity: 32, defensiveDissection: 24, emotionSpike: -12, riskPreference: -6 }
        },
        {
          label: "B",
          text: "反抓他们更大的不回应，用更高优先级的战场把它盖过去。",
          effects: { attackPressure: 34, battlefieldControl: 20, impromptuCounter: 18, riskPreference: 10 }
        },
        {
          label: "C",
          text: "让队友先接，我负责在下一轮把完整回应补回结构里。",
          effects: { teammateRelay: 30, frameworkModeling: 18, defensiveDissection: 16, emotionSpike: -8 }
        },
        {
          label: "D",
          text: "如果他们要一直追这个点，那就把它变成对方格局太小的证据。",
          effects: { expressionImpact: 28, punchlineImpulse: 20, riskPreference: 16, memeDensity: 12 }
        }
      ]
    },
    {
      id: "q021",
      text: "你正在准备一场你不喜欢的持方，但它明显更好赢，你会：",
      options: [
        {
          label: "A",
          text: "赢比赛和喜欢持方是两回事，先把最优打法做出来。",
          effects: { winObsession: 36, criterionSensitivity: 20, emotionSpike: -8, memeDensity: -8 }
        },
        {
          label: "B",
          text: "尽量找一个我能接受的价值入口，不然表达会没有灵魂。",
          effects: { expressionImpact: 26, frameworkModeling: 20, logicPurity: 14, winObsession: -6 }
        },
        {
          label: "C",
          text: "把自己不舒服的部分列出来，提前做成对方可能攻击的预案。",
          effects: { defensiveDissection: 28, reviewCompulsion: 22, logicPurity: 18, emotionSpike: -8 }
        },
        {
          label: "D",
          text: "边备赛边吐槽，但该找资料找资料，该上价值上价值。",
          effects: { evidenceDependence: 20, memeDensity: 22, teammateRelay: 12, reviewCompulsion: 10 }
        }
      ]
    },
    {
      id: "q022",
      text: "评委在你陈词时突然皱眉，你脑内第一反应是：",
      options: [
        {
          label: "A",
          text: "刚才那句比较可能没递到，下一段要把判准说得更显眼。",
          effects: { criterionSensitivity: 36, expressionImpact: 18, battlefieldControl: 14, emotionSpike: -6 }
        },
        {
          label: "B",
          text: "是不是链条跳了？先补中间环节，不然这段会被判成断言。",
          effects: { logicPurity: 34, frameworkModeling: 18, defensiveDissection: 12, riskPreference: -8 }
        },
        {
          label: "C",
          text: "稳住，不被表情带走。继续按稿走完，场下再复盘。",
          effects: { emotionSpike: -24, riskPreference: -12, reviewCompulsion: 18, battlefieldControl: 10 }
        },
        {
          label: "D",
          text: "提高表达强度，把这段讲得更像一个必须被听见的判断。",
          effects: { expressionImpact: 32, punchlineImpulse: 16, winObsession: 12, riskPreference: 8 }
        }
      ]
    },
    {
      id: "q023",
      text: "新队员问你“辩论到底怎么赢”，你会怎么解释？",
      options: [
        {
          label: "A",
          text: "先讲比较：不是证明自己好，而是证明自己比对方更值得被投。",
          effects: { criterionSensitivity: 34, frameworkModeling: 24, teammateRelay: 16, memeDensity: -6 }
        },
        {
          label: "B",
          text: "先讲论证链：主张、理由、例证、影响，少一个都容易塌。",
          effects: { logicPurity: 34, evidenceDependence: 18, frameworkModeling: 16, punchlineImpulse: -8 }
        },
        {
          label: "C",
          text: "先让他看一轮自由辩。辩论不是念稿，是在现场处理活人。",
          effects: { impromptuCounter: 30, attackPressure: 20, expressionImpact: 16, riskPreference: 10 }
        },
        {
          label: "D",
          text: "告诉他：赢法很多，但别先学会阴阳怪气再学会回应。",
          effects: { teammateRelay: 24, memeDensity: 18, reviewCompulsion: 12, criterionSensitivity: 10 }
        }
      ]
    },
    {
      id: "q024",
      text: "你看到对方在自由辩中连续三次没有正面回答，你会：",
      options: [
        {
          label: "A",
          text: "把三次不回应串成一条线，直接告诉评委这是对方核心义务缺席。",
          effects: { criterionSensitivity: 34, battlefieldControl: 24, attackPressure: 16, winObsession: 10 }
        },
        {
          label: "B",
          text: "继续追到他们回答为止。今天这个洞不填，谁也别走。",
          effects: { attackPressure: 38, impromptuCounter: 20, emotionSpike: 18, riskPreference: 10 }
        },
        {
          label: "C",
          text: "先暂停追问，回头用结辩语言把不回应的影响讲清楚。",
          effects: { battlefieldControl: 30, defensiveDissection: 20, expressionImpact: 12, emotionSpike: -8 }
        },
        {
          label: "D",
          text: "记在稿纸角落：对方疑似进入装死模式。",
          effects: { memeDensity: 26, reviewCompulsion: 18, defensiveDissection: 12, punchlineImpulse: 12 }
        }
      ]
    },
    {
      id: "q025",
      text: "备赛群里突然没人说话了，你会怎么打破沉默？",
      options: [
        {
          label: "A",
          text: "发一版分工表：谁查资料、谁写稿、谁模拟，先让机器重新转起来。",
          effects: { battlefieldControl: 32, teammateRelay: 24, reviewCompulsion: 12, memeDensity: -8 }
        },
        {
          label: "B",
          text: "发一个关键问题：这场我们到底靠哪个比较赢？",
          effects: { frameworkModeling: 30, criterionSensitivity: 24, winObsession: 14, expressionImpact: -6 }
        },
        {
          label: "C",
          text: "丢一个离谱但可能有用的切入点，先把大家从僵尸状态里拽出来。",
          effects: { punchlineImpulse: 28, memeDensity: 22, riskPreference: 18, teammateRelay: 10 }
        },
        {
          label: "D",
          text: "默默开始查资料，等群里复活时直接扔一份半成品。",
          effects: { evidenceDependence: 32, reviewCompulsion: 18, teammateRelay: -8, emotionSpike: -6 }
        }
      ]
    },
    {
      id: "q026",
      text: "对方抛出一个你没听过的新概念，但听起来很高级，你会：",
      options: [
        {
          label: "A",
          text: "先问定义和适用范围。高级词不解释，就先当烟雾弹处理。",
          effects: { attackPressure: 30, logicPurity: 28, defensiveDissection: 18, criterionSensitivity: 10 }
        },
        {
          label: "B",
          text: "把它放回原本比较框架：概念再新，也要回答本题怎么判。",
          effects: { frameworkModeling: 32, criterionSensitivity: 28, battlefieldControl: 16, riskPreference: -8 }
        },
        {
          label: "C",
          text: "先记下来，不急着碰。等确认它真的影响战场再处理。",
          effects: { defensiveDissection: 26, emotionSpike: -18, riskPreference: -12, reviewCompulsion: 10 }
        },
        {
          label: "D",
          text: "现场给它起个外号，方便队友和评委记住我们到底在打什么。",
          effects: { memeDensity: 28, expressionImpact: 22, teammateRelay: 12, punchlineImpulse: 16 }
        }
      ]
    },
    {
      id: "q027",
      text: "你的队伍需要一个人熬夜收束全稿，你的真实状态是：",
      options: [
        {
          label: "A",
          text: "我来吧。大家把材料发我，明早给你们一个能上场的版本。",
          effects: { teammateRelay: 34, battlefieldControl: 24, reviewCompulsion: 20, emotionSpike: -8 }
        },
        {
          label: "B",
          text: "可以，但我要先把框架钉死。没有框架的收稿只是排版。",
          effects: { frameworkModeling: 34, logicPurity: 20, criterionSensitivity: 14, teammateRelay: 8 }
        },
        {
          label: "C",
          text: "我负责资料核验。别让我明天在场上被一个错数据杀死。",
          effects: { evidenceDependence: 36, defensiveDissection: 16, reviewCompulsion: 18, riskPreference: -10 }
        },
        {
          label: "D",
          text: "我负责把难听的句子改成人话，顺便塞几个能活下来的金句。",
          effects: { expressionImpact: 32, punchlineImpulse: 22, teammateRelay: 12, logicPurity: -6 }
        }
      ]
    },
    {
      id: "q028",
      text: "你最不能忍受队友出现哪种情况？",
      options: [
        {
          label: "A",
          text: "不回应。对方问题摆在那，你还在念自己的小作文。",
          effects: { criterionSensitivity: 32, defensiveDissection: 20, emotionSpike: 12, teammateRelay: -8 }
        },
        {
          label: "B",
          text: "逻辑跳步。前提和结论隔着一条银河，还装作已经证明完了。",
          effects: { logicPurity: 36, reviewCompulsion: 16, expressionImpact: -8, memeDensity: 8 }
        },
        {
          label: "C",
          text: "没有资料。全场都靠感觉，像在给评委讲都市传说。",
          effects: { evidenceDependence: 34, winObsession: 12, logicPurity: 12, punchlineImpulse: -6 }
        },
        {
          label: "D",
          text: "完全不接队友。四个人像四个单独报名的灵魂。",
          effects: { teammateRelay: 34, battlefieldControl: 18, emotionSpike: 10, attackPressure: -8 }
        }
      ]
    },
    {
      id: "q029",
      text: "你方优势很大，只要稳住就能赢，但你突然看到一个能爆杀对方的点，你会：",
      options: [
        {
          label: "A",
          text: "不打。稳赢局不要给自己制造新变量。",
          effects: { riskPreference: -32, battlefieldControl: 24, criterionSensitivity: 16, emotionSpike: -12 }
        },
        {
          label: "B",
          text: "打，但只打一层，不恋战。让它变成加分项而不是新战场。",
          effects: { attackPressure: 24, criterionSensitivity: 22, battlefieldControl: 18, riskPreference: 6 }
        },
        {
          label: "C",
          text: "必须打。优势局不补刀，等于给对方写遗嘱的时间。",
          effects: { attackPressure: 36, winObsession: 24, riskPreference: 20, emotionSpike: 14 }
        },
        {
          label: "D",
          text: "留给结辩说，用最体面的方式把对方最后一口气收走。",
          effects: { battlefieldControl: 30, expressionImpact: 22, defensiveDissection: 12, punchlineImpulse: 10 }
        }
      ]
    },
    {
      id: "q030",
      text: "如果要给自己的辩论风格写一句简介，你最接近哪句？",
      options: [
        {
          label: "A",
          text: "我负责让这场比赛有骨架，别让所有人漂在空中。",
          effects: { frameworkModeling: 34, battlefieldControl: 20, logicPurity: 16, memeDensity: -8 }
        },
        {
          label: "B",
          text: "我负责让对方知道：每一个漏洞都会被现场认领。",
          effects: { attackPressure: 36, impromptuCounter: 22, riskPreference: 16, emotionSpike: 8 }
        },
        {
          label: "C",
          text: "我负责让评委相信：我们不是声音大，我们是证据硬。",
          effects: { evidenceDependence: 34, logicPurity: 22, criterionSensitivity: 14, expressionImpact: -6 }
        },
        {
          label: "D",
          text: "我负责让比赛结束后还有人记得这一场到底发生了什么。",
          effects: { expressionImpact: 34, punchlineImpulse: 24, memeDensity: 18, battlefieldControl: 10 }
        }
      ]
    }
  ];

  const personalityTypes = [
    makeType({
      code: "FREE-KILL",
      name: "自由辩查杀者",
      tagline: "你像赛场上的漏洞警报器，别人刚偷换，你已经准备拉警戒线了。",
      profile: { expression_vs_competition: 78, initiation_tendency: 94, pressing_intensity: 90, emotional_heat: 58, solo_vs_coordination: 38 },
      description: `你像赛场上的漏洞雷达，别人一句话刚飘出来，你已经在脑内给它标了三个风险等级。你最擅长的不是无差别乱冲，而是精准识别哪里有偷换、哪里有回避、哪里一旦追下去就会变成公开处刑现场。对面本来还想把一个含糊说法糊过去，结果你下一秒就把它按在桌上问“这个你到底认不认”。

你的快乐来自“抓到了”，不是来自“我声音最大”。你像那种对违禁逻辑特别敏感的人，别人说一句模模糊糊的概念，你脑子里已经弹出红字提示：此处可查杀。有时候全场还没意识到哪里出问题，你已经顺着那根最细的裂缝一路敲到了骨头。你最容易制造的赛场喜剧，就是别人本来想优雅飘过一个含糊点，结果被你当场要求出示定义、承诺和解释说明。`
    }),
    makeType({
      code: "QA-ROLLER",
      name: "质询压路机",
      tagline: "你不是在问问题，你是在把对方一路问进死胡同。",
      profile: { expression_vs_competition: 78, initiation_tendency: 98, pressing_intensity: 98, emotional_heat: 58, plain_vs_stylized: 70 },
      description: `你不是在提问，你是在铺设一条对方很难原路返回的追问链。别人问问题像敲门，你问问题像推土机先鸣笛再直线推进：一个承诺不够，那就再缩一个；一个回答太泛，那就继续追到它只剩能挨打的版本。你最擅长的不是发现破口，而是把一个已经出现的破口扩大成标准进出口，然后亲自监督对方从那里通过。

你上场的时候总会给人一种“这段可能要有人交代点什么”的感觉。你的压迫感不一定来自情绪，而是来自持续：你不是吼一声就算了，你会一层一层问到对面没法再舒舒服服飘着说。很多人打一段质询像在开话题，你打一段质询像在进行流程推进，对面回答得越多，离安全区反而越远。你最经典的画面，是全场都知道对方快扛不住了，但又没人说得清究竟是从哪一问开始塌的，因为你整段都像在持续施工。`
    }),
    makeType({
      code: "TILT-WAR",
      name: "上头战神",
      tagline: "你一热起来，比赛就会自动从“讨论”切换成“战斗模式”。",
      profile: { expression_vs_competition: 88, stage_vs_team: 78, initiation_tendency: 88, pressing_intensity: 76, emotional_heat: 98, solo_vs_coordination: 24 },
      description: `你像一台带情绪增压器的攻防发动机，比赛温度只要稍微升起来一点，你就会自动判断“可以开烧了”。你最有名的不是精密，也不是稳健，而是那种一旦进状态就能把全场气压直接拉低的冲锋感。别人还在思考这波要不要打，你已经把战场从“讨论问题”推进到“现在就来看看谁先顶不住”。

你这种人最适合把一潭死水打出波澜，顺风局能打出统治感，逆风局也经常靠一口气把场面重新点燃。乐子就在于，你的上头不是完全没用的乱冲，而是经常真能把比赛打活；刺激也在于，你有时会把一个本来只需要两步解决的问题，硬是推进成五分钟高燃灾难片。你很像那种会让队友一边倒吸冷气一边说“先别拦，看看他这波能不能真打出来”的人。`
    }),
    makeType({
      code: "SOLO-RAIDER",
      name: "单兵游击队",
      tagline: "你打团队赛最像在单排上分，看到机会就自己先翻墙进去了。",
      profile: { expression_vs_competition: 86, stage_vs_team: 76, initiation_tendency: 78, emotional_heat: 70, team_construction: 14, solo_vs_coordination: 10 },
      description: `你最像在团队赛里偷偷开启单排模式的人。队友还在讨论主线和分工，你已经顺着某个没人注意到的小缝切进去了，顺手拿下一块局部战场，再回头看大家为什么没跟。你不是不会团队合作，你只是太擅长自己找机会了，以至于经常先开出去再想“哦对，这还是四人项目”。

你这种人格的精彩之处在于，很多看起来僵住的盘面，在你眼里都会自动长出侧门。别人看整体，你看机会；别人求稳，你求快；别人担心路线，你先进去再说。最有戏的瞬间，往往是你独自打出一个漂亮转折，全队回看才知道你原来在那一侧已经赢过一次。你的比赛经常会出现一种非常具有个人风格的效果：队友一开始不知道你在干什么，后来突然发现你已经在另一条线上把门打开了。`
    }),
    makeType({
      code: "POSITION-SHIFTER",
      name: "临场变线怪",
      tagline: "你最大的爱好不是按计划打，而是现场把计划改成你的。",
      profile: { initiation_tendency: 74, pressing_intensity: 72, daily_argumentativeness: 72, meme_intensity: 70, chain_vs_scene: 72, plain_vs_stylized: 72 },
      description: `你不是最爱按原计划打的人，你是最容易在比赛中途突然发现“等等，这场是不是可以换条线赢”的人。别人还在按旧剧本推进，你已经开始拆旧布景、换新地图、顺手给全队改了一个更危险也更好看的版本。你对战场的理解很少是固定的，反而很擅长在对话里找新的切入口，再把整场比赛轻轻往另一个方向拧过去。

你这类人最有魅力的地方在于“临场有戏”，很多别人以为只能硬扛的局，你偏偏能现场翻面，突然把一段旧攻防说成新故事。你也特别容易让观众觉得这场有变化、有转折、有灵感。你很像那种比赛中途突然把剧本改成导演剪辑版的人，别人一开始以为你乱来，后来发现你居然真能把新线打成主线。这种人格最适合制造“比赛明明已经写好了，结果你突然说不，这里还能再拐一下”的乐子。`
    }),
    makeType({
      code: "FRAME-ARCH",
      name: "框架建筑师",
      tagline: "你不是在打比赛，你是在给比赛修一套只能判你赢的地图。",
      profile: { expression_vs_competition: 76, stage_vs_team: 72, self_vs_judge: 76, judge_vs_performance: 72, team_construction: 88, chain_vs_scene: 24, plain_vs_stylized: 26 },
      description: `你打比赛像在施工，开工前先看图纸，开工后还要盯结构受力。别人急着上来先打一拳，你的第一反应往往是“这场到底该按哪张地图判”。你喜欢先把定义、标准、主线、层次和收束方式搭起来，再让所有论点各自入位。你的满足感不来自某一句突然很帅，而来自整场比赛终于被你整理成一个只能这么理解的空间。

你这种人特别适合做赛场里的空间规划大师。对手如果没来得及看懂你给评委搭的地图，往往会在你定义好的房间里绕半天才发现出口方向根本不在自己那边。你的乐子不在于你吼得多大，而在于你可以很冷静地把一场混乱比赛装修成一个看起来天然该判你赢的样板间。别人是打局部，你是在修建筑；别人想的是“这一拳值不值”，你想的是“这一拳该打在哪层承重墙上”。`
    }),
    makeType({
      code: "BATTLE-CONDUCTOR",
      name: "战场导演",
      tagline: "你最像比赛里的总调度，谁该上、谁该收、哪条线该留，你脑子里都有分镜。",
      profile: { expression_vs_competition: 58, stage_vs_team: 58, self_vs_judge: 74, judge_vs_performance: 74, team_construction: 96, solo_vs_coordination: 86, plain_vs_stylized: 42 },
      description: `你不一定是最先发言的人，但你经常是整场比赛里最像导演的那个。谁该先上、哪条线要保、哪条线该丢、哪段输出现在值不值得继续加资源，你脑子里通常都在同时跑。你和“框架建筑师”的区别在于，人家更像赛前搭图纸的，你更像比赛全程拿着对讲机的人：前场有人脱节了你去接，后场有人打偏了你去拽，节奏太散了你负责重新调光打板。

你这种人格常常不是最吵的，但很像“如果没有这个人，这队今天会像四个分屏直播”。你很擅长把零散输出接回主线，也擅长让队友看起来比实际更像一个整体。你最容易给人一种奇妙的安心感：不一定每一段都最亮，但整场一直有人在掌舵。你的乐子通常发生在赛后复盘时，别人以为你只是顺手接了几句，结果回头一看，整场节奏原来一直是你在后台推着走。`
    }),
    makeType({
      code: "JUDGE-WHISPER",
      name: "评委读心术士",
      tagline: "你打比赛像在和评委脑内的记分纸同步更新。",
      profile: { expression_vs_competition: 74, stage_vs_team: 70, self_vs_judge: 96, judge_vs_performance: 88, team_construction: 74, plain_vs_stylized: 72 },
      description: `你像那种会一边听对面说话、一边观察评委笔记速度和眉毛角度的人。别人专注在论点本身，你脑内还同时开着一个“这句话评委会怎么记、这段比较他会不会吃、这一轮到底有没有投票价值”的后台。你不是不会讲自己想讲的，而是太清楚有些东西只有先被听进去、被记下来、被翻译成票，它才算真的存在过。

你这种人总有一种让比赛变得很“可裁判”的天赋。别人说完一段复杂攻防，评委脑子里还在整理碎片，你已经顺手把它包装成一个可落笔的结论递过去了。你最迷人的地方，是你经常不靠吼赢，而靠“让评委觉得自己其实已经会判了”来赢。全场最像在偷偷给裁判系统写说明书的人，通常就是你。`
    }),
    makeType({
      code: "RULE-GUARD",
      name: "程序正义守门员",
      tagline: "你不一定最凶，但你总能把“对面很怪”翻译成“对面违规了”。",
      profile: { initiation_tendency: 28, pressing_intensity: 28, self_vs_judge: 86, judge_vs_performance: 84, chain_vs_scene: 16, plain_vs_stylized: 30 },
      description: `你像赛场上的逻辑质检与规则监督二合一系统。别人一场比赛打下来，观众记住的是场面热不热，你记住的是谁偷了定义、谁没回应、谁把本来该补的论证步骤直接跳过。你不是最喜欢主动挑事的人，但你特别擅长把“对方这段哪里怪怪的”翻译成“对方在哪项比赛义务上确实没做完作业”。

你最有趣的地方在于，你能把很多本来只停留在感觉层面的不舒服，讲成一份非常像正式文件的问题说明。别人只觉得对方在耍滑，你已经开始分门别类：这是定义违停、这是回应逆行、这是比较无证驾驶。你很像赛场上的秩序系统，不一定负责把楼盖起来，但一定会指出谁把钢筋装反了。很多时候，别人只是觉得这段不太行，而你已经能准确说出它为什么在裁判层面站不住。`
    }),
    makeType({
      code: "COLD-WINNER",
      name: "冷血赢面机器",
      tagline: "你不负责浪漫，你负责把胜率推到最大。",
      profile: { expression_vs_competition: 98, stage_vs_team: 94, self_vs_judge: 86, judge_vs_performance: 84, meme_intensity: 18, emotional_heat: 18 },
      description: `你像会说话的胜率面板，赛场上最先启动的不是情绪，而是收益评估。别人还在纠结“这点好不好听”“这条线帅不帅”，你已经在心里给它们标完高收益、中收益和建议止损。你对比赛的热爱很真，但那种热爱更像高手对系统的迷恋：你不执着每个喜欢的论点都上桌，你执着的是最后哪几步能把票稳稳运回家。

你这类人最容易让队友又爱又怕。爱的是你真的很少迷路，很多别人舍不得放掉的战场，你会很冷静地判断“这不值票”；怕的是你有时太像在做理性资产配置，队友还在为某条浪漫论点依依不舍，你已经把它标注成“高风险低回报建议删除”。你的乐子在于，别人打着打着会热，你打着打着会更清醒，而且越到关键时刻越像系统进入高性能模式。`
    }),
    makeType({
      code: "SLICK-TALKER",
      name: "老辩棍",
      tagline: "你不是最凶的，但你浑身上下都写着“这套我太熟了”。",
      profile: { expression_vs_competition: 86, stage_vs_team: 86, pressing_intensity: 32, self_vs_judge: 82, judge_vs_performance: 78, tournament_activity: 96, daily_argumentativeness: 88 },
      description: `你像一个在辩论系统里泡出了包浆的人。你不一定每次都想把问题追到最深，但你很会把比赛打得“像比赛”，知道什么话听起来有赛场味、什么路径递给评委最顺、什么表达一放出来大家就会自动进入熟悉的论辩模式。你身上最明显的不是锋利，而是熟练，那种“这套我太熟了”的从容感常常比论点本身还先到场。

你这种人格最妙的地方是，别人需要热身才能进入比赛状态，你像随时能从口袋里掏出一整套标准赛场语气和论辩节奏。你很少是最凶的那个，但经常是最像“已经在这里打了很多年”的那个。你的存在感经常来自一种很难形容但大家都懂的东西：赛场包浆。你一句话未必最深，但总能精准落在“像那么回事”的位置上，让人很难不承认你真的太熟了。`
    }),
    makeType({
      code: "JUDGE-APPEAL",
      name: "评委申诉家",
      tagline: "你重视评委重视到，必要时会想和判词狠狠干一架。",
      profile: { expression_vs_competition: 84, stage_vs_team: 76, self_vs_judge: 90, judge_vs_performance: 92, tournament_activity: 76, emotional_heat: 84 },
      description: `你很在意评委，也很在意结果，但你的在意方式不是乖乖顺着评委走，而是随时准备跟不合理的判法狠狠干一架。别人重视裁判，通常会往适配方向长；你也重视裁判，但更容易长成“这票凭什么这么流”“这个判准为什么能这么用”“他到底有没有听到这段”的高度敏感型人格。你对比赛的解释权特别认真，以至于有时比对比赛本身还认真。

你这种人格最经典的画面不是场上，而是场下：比赛刚结束，别人还在收包喝水，你脑内已经自动生成了一版判词复议提纲。但你并不只是赛后容易上头，比赛过程中你也会对裁判逻辑保持一种强烈的警觉：哪一段会不会被误解、哪一轮有没有被听偏、哪条线是不是本来不该这么掉。你很像那种明明比赛已经结束，但脑内法庭还在继续开庭的人，只不过这个庭审经常还挺有理有据。`
    }),
    makeType({
      code: "DATA-ENGINE",
      name: "资料包掌控者",
      tagline: "你不是在备赛，你是在给辩题建数据库。",
      profile: { expression_vs_competition: 74, stage_vs_team: 72, fact_vs_mechanism: 96, reality_vs_setting: 86, tournament_activity: 78, chain_vs_scene: 22 },
      description: `你像随身带着一整个资料库的人，别人刚说“这题是不是得补点案例”，你已经开始问：什么国家、什么时间、什么来源、有没有可迁移性、反方可能从哪个口子打回来。你最擅长的不是气势，而是让一个空荡荡的论点突然长出实证的骨架。很多别人嘴里的“现实中很多人都这样”，到你这里都得补齐出处、条件和适用范围，不然很难活着走出备赛。

你的存在会让整支队伍显得突然靠谱起来。你不一定是最炸场的那个，但你很像那种会在关键时刻拿出一页真正能让空话落地的资料包、把“我感觉”改造成“这确实发生过”的人。你最容易制造的喜剧效果是：别人本来只是想简单聊聊题，你已经开始像给辩题建档，顺手连对面的反打路径都一起分好类了。你很像那种让队友逐渐失去“随便举个例子”自由的人。`
    }),
    makeType({
      code: "POLICY-GROUND",
      name: "政策题地勤组",
      tagline: "别人负责在云层里争理想，你负责把他们全都拽回地面。",
      profile: { expression_vs_competition: 58, stage_vs_team: 58, fact_vs_mechanism: 96, reality_vs_setting: 96, tournament_activity: 72, chain_vs_scene: 24 },
      description: `你对抽象大词的第一反应通常不是感动，而是落地。别人说一个原则、一个愿景、一个价值冲突，你脑子里自动跳出来的是：谁执行、在哪发生、影响谁、成本怎么分、现实里有没有类似情况。你像给辩论装地基的人，不太相信空中楼阁能自己长脚落地，所以总会把大家往制度、治理、政策、社会结构这些更硬的层面拽。

你最适合处理那些一旦往现实走就特别能看出差别的辩题。别人讨论“应不应该”，你会自然追问“能不能、怎么做、谁承担代价、谁真正受益”。你的存在会让很多本来很漂亮的空话开始冒出施工图、预算表和执行流程。你最经典的赛场效果，是把别人一个抽象主张问成一份现实实施方案，顺便让全场意识到“原来这玩意儿还得落地”。`
    }),
    makeType({
      code: "ABSTRACT-IMMORTAL",
      name: "抽象辩题仙人",
      tagline: "你不是不落地，你只是习惯先在云层里把世界搭出来。",
      profile: { fact_vs_mechanism: 12, reality_vs_setting: 10, meme_intensity: 72, chain_vs_scene: 78, plain_vs_stylized: 82 },
      description: `你对辩题的第一反应经常不是“现实里有没有”，而是“如果这个设定成立，它会把人带到什么样的世界”。你很喜欢处理概念、原则、设定和价值冲突，不太满足于只在地面上搬例子，而更想把一个问题讲成更大的想象空间。你像那种习惯在云层里作图的人，只是你的云层通常还挺有画面感，别人听着听着会发现自己已经被你带上去了。

你这种人格的魅力在于，很普通的一道题，到你这里都可能长出世界观。你喜欢问“原则如果推到极致会怎样”“一个设定一旦成立，人的处境会怎么变”。最有戏的地方在于，你讲抽象东西往往还不干，会带着场景、带着氛围、带着一点仙气和一点疯感，让人一边觉得你飞得很高，一边又忍不住继续听你往哪飞。你像那种把普通比赛讲出“天上还有第二层地图”的人。`
    }),
    makeType({
      code: "MECHANISM-SAGE",
      name: "机制推演师",
      tagline: "你最快乐的事，就是把一个抽象命题拆成能自洽运转的齿轮组。",
      profile: { fact_vs_mechanism: 12, reality_vs_setting: 12, meme_intensity: 18, chain_vs_scene: 14, plain_vs_stylized: 18 },
      description: `你像专门研究“如果一个机制成立，它会一路推到哪里”的人。别人打抽象题时喜欢铺画面、讲人性、谈文明，你更喜欢盯着那个核心齿轮看：它到底怎么转，转起来会带出什么连锁反应，哪一环一旦断掉，整套论证是不是就该一起下线。你不太依赖现实例子，也不太需要太多修辞，很多时候一条很干的推演链就足够让你高兴半天。

你最适合处理那种别人觉得“有点空”的题，因为你会很认真地把空的地方搭出真正能站住的机制骨架。你不是那种在场上到处抛梗的人，你更像在概念层面做精密装配。乐子也正在于此：别人明明只想轻轻聊个脑洞，你已经把它拆成设定前提、作用路径、递进后果和边界条件，像在给一个抽象命题做工程验收。你非常适合让别人意识到：抽象不等于随便飞，飞也得按空气动力学来。`
    }),
    makeType({
      code: "LOGIC-PURITY",
      name: "逻辑洁癖患者",
      tagline: "你听比赛像在做逻辑审计，链条一断你就想当场标红。",
      profile: { fact_vs_mechanism: 24, meme_intensity: 18, team_construction: 70, chain_vs_scene: 8, plain_vs_stylized: 18 },
      description: `你像赛场上的链条校准器，别人一句“所以社会会更好”刚说出口，你脑子里已经自动弹出三个问题：怎么更好、为什么会这样、更好的路径在哪里。你对论证的耐心很高，对跳步的耐心却很低。很多别人觉得“听起来差不多就是这个意思”的地方，在你这里都得重新拆开，看中间有没有漏桥、断层或者凭空起飞。

你这种人格最大的乐子在于，别人打比赛像在讲故事，你听比赛像在做逻辑审计。你不是不能欣赏表达，只是你总会先忍不住确认：这段到底成立没有。你的存在能让很多看似热闹的论点突然回到骨架层面接受体检，也很容易把队伍从“好像有道理”训练成“最好真的有道理”。你很像那种全场刚被一段豪华渲染带跑，只有你还坐在那儿安静想“但这中间那一步谁给它批的”。`
    }),
    makeType({
      code: "VIBE-CREW",
      name: "赛场气氛组",
      tagline: "你一开口，比赛就会自动长出一点舞台感和弹幕感。",
      profile: { daily_argumentativeness: 76, meme_intensity: 88, emotional_heat: 72, chain_vs_scene: 82, plain_vs_stylized: 88 },
      description: `你一上场，比赛会突然变得有点“有节目”。你不满足于把意思讲清楚，还会顺手把气氛带起来、把句子讲得更像句子、把场景讲得更像场景。你的表达里经常自带一点弹幕感，观众、队友、甚至评委都会更容易记住你这一轮的存在，因为你总能把内容讲出一种“赛后会有人复述这段”的质感。

你这种人格最擅长制造比赛的现场感。别人负责推进主线，你负责让主线终于像个故事；别人负责机制链条，你负责让它长出画面和情绪。你不一定每次都在追求最稳的胜率，但你很在意这场比赛有没有内容感、有没有让人醒一下。你很像那种赛场里的氛围发动机，一旦你开机，整场都会更有“这轮值得看”的感觉。`
    }),
    makeType({
      code: "VALUE-LIFT",
      name: "价值升华师",
      tagline: "普通争点到你嘴里，常常会突然开始承担一点文明重量。",
      profile: { fact_vs_mechanism: 34, self_vs_judge: 72, judge_vs_performance: 70, team_construction: 74, chain_vs_scene: 88, plain_vs_stylized: 90 },
      description: `你很擅长把一场比赛从“几个点谁更有道理”抬到“这场到底在争什么样的世界、什么样的价值排序”。别人还在局部比较，你已经开始思考怎么把这些争点重新装配成一个更大的意义层级。你不是单纯爱说漂亮话，而是特别知道什么时候该把具体争议往上抬，让评委和观众突然意识到：原来这场比赛背后还有更高一层的东西。

你这种人格一开口，经常会让普通争点突然背负一点文明重量。一个原本只是在比案例的局部冲突，到你这里会变成制度选择、人的处境、价值秩序或者一整套更高级的判断框架。你的乐子就在于“抬得上去”，你能让比赛最后几分钟看起来像不是在处理碎片，而是在给这些碎片找一个真正该落的位置。你很像赛场上的意义扩音器，负责把局部问题讲成全场都觉得“好像更大了”的东西。`
    }),
    makeType({
      code: "EXPRESSION-HEART",
      name: "观点表达者",
      tagline: "你打辩论最大的冲动，不是拿票，而是把自己真想说的话说完整。",
      profile: { expression_vs_competition: 18, self_vs_judge: 24, judge_vs_performance: 30, daily_argumentativeness: 76, chain_vs_scene: 72, plain_vs_stylized: 72 },
      description: `你打辩论很大一部分原因，是因为你真的有话想说。你不是不在乎比赛，也不是不会考虑评委，但你很难把自己完全训练成一个只围着赢面和票路转的人。你更在意一场辩论有没有把你真正关心的东西讲出来，有没有把某种观点、某种态度、某种人的处境表达得足够像样。对你来说，辩论不只是博弈，它也是一种输出和投射。

你这类人最有魅力的地方在于真。别人可以很熟练地选择值票的话，你却更容易为“我到底认不认这套说法”停下来。你通常也很有表达欲，只是这种表达欲不一定是为了全场尖叫，而是为了把自己想讲的东西讲完整、讲舒服、讲得像自己。你很像那种即使在赛场上，也很难完全关闭“这是我自己的立场”开关的人，所以你的表达常常会带着一种很明确的个人温度。`
    }),
    makeType({
      code: "FUN-CHAOS",
      name: "辩论乐子人",
      tagline: "你不是上头乱来，你是清醒地决定这场比赛应该更好玩一点。",
      profile: { expression_vs_competition: 24, self_vs_judge: 24, meme_intensity: 90, emotional_heat: 28, team_construction: 36, solo_vs_coordination: 22, plain_vs_stylized: 88 },
      description: `你不是被赛场带着抽象，你是主动给赛场加戏的人。别人认真打比赛，你认真把比赛打得有意思；别人负责推进主线，你负责让这一轮突然像开了特别节目。你很会整活，也很会包装，但和“上头战神”完全不同的是，你通常不是燃过头才这样，你是非常清醒地决定：这段如果再无聊下去，我可能得亲自救一下场。

你这类人最适合把一场本来平平的比赛打出个人风格。你不一定最在意评委吃不吃，也不一定永远顺着队伍最稳的路线来，你更在意自己这段有没有意思、有没有梗、有没有“只有我会这么讲”的存在感。乐子就在于，你经常能在不真正失控的情况下制造一种快要失控的观感，让全场突然意识到：这位并不是上头，他只是很擅长清醒地犯病。你特别像那种一边整活一边还知道自己在整什么的人。`
    }),
    makeType({
      code: "TEAM-NANNY",
      name: "保姆妈妈",
      tagline: "你最擅长的不是自己飞，而是让全队别在半空中散架。",
      profile: { expression_vs_competition: 40, stage_vs_team: 42, tournament_activity: 72, emotional_heat: 24, team_construction: 94, solo_vs_coordination: 96 },
      description: `你像那种队伍里默认存在、平时不一定最显眼、但一掉线全队都会立刻意识到“完了少了个会接人的”。你会主动看谁没接上、哪条线飘了、哪位队友现在说这个会不会没人接、比赛打崩以后谁来把主线重新捞回来。你不只是会配合，你是会下意识替整队操心，像一位战时后勤、赛场客服和主线维护员合成的人形系统。

你这种人格的可贵之处在于，很多队伍之所以还能像一支队，不是因为每个人都很强，而是因为你一直在悄悄把碎掉的地方粘回去。别人负责冲锋，你负责别散；别人负责起火，你负责别烧到自家。乐子在于，你常常一边补位一边还要顺手处理队友的各种突发情况，打着打着就像开启了“多线程带娃模式”。你很像那种大家平时不一定天天夸，但一旦不在，所有人都会立刻发现系统少了一个关键插件的人。`
    }),
    makeType({
      code: "CLUB-ANCHOR",
      name: "辩论队团魂锚点",
      tagline: "你不只是来打比赛的，你是来把这支队当成共同体认真经营的。",
      profile: { expression_vs_competition: 28, stage_vs_team: 10, tournament_activity: 72, team_construction: 86, solo_vs_coordination: 94 },
      description: `你很重视辩论队作为一个共同体的存在，不太把它理解成一台只负责拿成绩的比赛机器。对你来说，训练氛围、队友关系、长期配合、谁有没有被接住、这支队以后还能不能一起打，往往和某一轮具体输赢一样重要。你很容易成为那种队里默认的情感锚点：有你在，大家会觉得“这支队还是一支队”。

你这种人格最大的乐子在于，你不仅在打比赛，你还在给整个共同体续命。别人把辩论队当上分车队，你会不自觉把它当小型社会组织经营。你经常会在赛后关心人而不是只关心票，也会对“大家之后还能不能继续一起打”这件事特别认真。你像那种能让一支队的氛围慢慢有厚度的人，不一定最像选手，但非常像“这支队为什么还像一支队”的原因。`
    }),
    makeType({
      code: "CLUB-PRESIDENT",
      name: "伟大的社长",
      tagline: "你不一定最常上场，但你经常是让这支队还能继续上场的人。",
      profile: { expression_vs_competition: 40, stage_vs_team: 8, tournament_activity: 24, team_construction: 78, solo_vs_coordination: 84 },
      description: `你不一定是最常上场的人，但你经常是让这支队还能继续上场的人。别人把辩论看成比赛，你更容易顺手把它看成一支需要被维系、被组织、被照顾、被带着往前走的队伍。你不一定真的有职位，但你身上很容易长出一种“这事总得有人扛吧，那就我来”的气质，久而久之大家就会默认你是那个最像社长的人。

你这种人格最有意思的地方在于，你的贡献未必都发生在赛场中央。有人负责打一场，你负责让大家还有下一场；有人负责论点，你负责让群别死、队别散、事情别断、氛围别塌。你身上那种伟大，往往不是轰轰烈烈，而是一种很具体的“这个组织怎么还在转，哦原来是因为你一直没停”。你很像那种没有明说，但所有人默认“这事他会管一下”的人形组织中枢。`
    }),
    makeType({
      code: "SUMMARY-MORT",
      name: "结辩殡仪馆馆长",
      tagline: "别人负责把战场打碎，你负责把碎片排成判决书。",
      profile: { self_vs_judge: 76, judge_vs_performance: 72, team_construction: 90, solo_vs_coordination: 82, chain_vs_scene: 84, plain_vs_stylized: 86 },
      description: `你像那种专门负责给混乱战场写结论的人。别人前面打出一地碎片，你上来把碎片重新排成胜负关系；别人留下几个看起来都很重要的点，你很快就能判断哪些能留下、哪些该火化、哪些还能抢救成判准素材。你最大的强项不是制造战场，而是收束战场，把本来像事故现场的比赛整理成一份评委能直接盖章的说明书。

你这种人格最容易在比赛后段突然发光。前面大家各打各的、互相炸来炸去，看起来谁都说得有道理，到了你这里就会开始出现“死因明确、抢救无效、建议投票”这种非常像最终处理意见的节奏。你的乐子在于，你能把全队之前打出的那些边角料都重新装配出意义；你的喜剧点也非常明确：如果前面队友什么像样的东西都没打出来，你就会被迫进行一场略显尴尬但仍然很认真的追悼会。你特别像那种比赛最后五分钟忽然开始掌握生死簿的人。`
    }),
    makeType({
      code: "DAILY-DEBATER",
      name: "生活论辩污染源",
      tagline: "你的辩论人格没有下班按钮，聊天聊着聊着就容易打完一轮。",
      profile: { stage_vs_team: 74, tournament_activity: 76, daily_argumentativeness: 98, meme_intensity: 80 },
      description: `你不是在生活里偶尔用到辩论，你是辩论已经开始接管生活。朋友随口说一句“我觉得”，你脑子里会自动长出定义、标准、反例和反方路径；别人只是想轻松聊聊天，你已经在进行一种非常熟练的观点推进。你不一定总想赢，但你特别容易进入论辩状态，以至于“正常聊天”和“轻量自由辩”对你来说有时只差一个开场句。

你这种人格最有节目效果的地方，就是辩论人格没有下班按钮。别人谈吃什么，你开始定义“吃”和“什么”；别人说随便，你会下意识追问随便的适用范围和优先级。你的乐子不在于故意抬杠，而在于你真的太习惯用论辩的方式理解世界了。你像那种会把日常对话自动转译成观点交锋的人，所以很多人和你聊天聊久了，会隐约感觉自己刚刚好像参赛过。`
    }),
    makeType({
      code: "TOURNAMENT-DWELLER",
      name: "辩论永动机",
      tagline: "你不是在参加辩论，你像在被辩论系统持续供电。",
      profile: { expression_vs_competition: 78, stage_vs_team: 86, tournament_activity: 98, daily_argumentativeness: 88, meme_intensity: 56 },
      description: `你像一个长期住在辩论系统里的人。别人是偶尔打几场比赛，你是训练、约赛、复盘、聊天、看盘、转发、新题、旧题、队内梗、赛场八卦全都没断过，仿佛整个人自带一个持续运转的辩论后台。你不一定每时每刻都在场上，但你很像那种辩论生态的一部分，离开太久反而会觉得自己像掉线了。

你这种人格最夸张的地方不是单场爆发，而是持续。别人打一场比赛会累，你打一段时间像会自己回血；别人打完一轮就切回日常模式，你可能根本没有明显的模式切换，因为你的日常里本来就塞满了辩论。乐子也在这里：你不是在参加辩论，你更像在被辩论持续供电。只要赛场还开着、群还活着、题还在更新，你就总有办法继续转。你特别像那种辩论系统停电了才会被迫休息的人。`
    })
  ];

  const hiddenPersonalityTypes = {
    pure_atmosphere: makeType({
      code: "PURE-VIBE",
      name: "纯粹气氛组",
      tagline: "你来辩论不是为了成为传奇，你是为了让这群人今晚别散。",
      profile: {
        expression_vs_competition: 18,
        stage_vs_team: 8,
        tournament_activity: 42,
        daily_argumentativeness: 66,
        meme_intensity: 82,
        emotional_heat: 28,
        team_construction: 70,
        solo_vs_coordination: 88,
        plain_vs_stylized: 72
      },
      description: `你是隐藏人格里的纯粹气氛组。对你来说，辩论当然可以有输赢、有佳辩、有漂亮表达，但真正让你觉得“这趟值了”的，经常是赛后那一桌还没聊完的话、海底捞门口突然续上的局、KTV 里莫名其妙一起唱到天亮的队友。

你不一定最执着于赛场上的个人高光，也不一定最想把每一轮都算成战绩。你更像一支队伍里的温度维持系统：比赛可以结束，但关系、乐子和共同记忆不能就这么结束。别人把辩论理解成一场一场的胜负，你会更自然地把它理解成一群人因为某种共同兴奋而聚在一起。你不是不认真，你只是很清楚，很多时候让人一直留在辩论里的，未必是奖杯，而是“打完以后我们还想一起去吃点什么”。`
    })
  };

  window.DBTI_DATA = {
    config: {
      demoMode: false,
      assetVersion: "20260416-wechat-share-fit",
      fallbackThreshold: 60
    },
    internalDimensions,
    displayDimensions,
    effectTransforms,
    questionModeSources,
    dimensionDetails,
    questions,
    personalityTypes,
    hiddenPersonalityTypes,
    fallbackType: {
      code: "DEADLOCK",
      name: "流局人格",
      tagline: "系统无法稳定归票，建议重开一轮。",
      copy: {
        normal: "你的赛场画像像一场流局：每个评委都想投，但没人知道该投给谁。"
      },
      share: {
        normal: "我的 DBTI 是流局人格，系统无法稳定归票。"
      }
    }
  };
})();
