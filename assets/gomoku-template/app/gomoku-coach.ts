export type Stone = "black" | "white";
export type BoardPoint = { row: number; col: number };
export type PlacedStone = BoardPoint & { side?: Stone };
export type RuleSet = "freestyle" | "renju";

export type PatternKind =
  | "FIVE"
  | "OPEN_FOUR"
  | "RUSH_FOUR"
  | "FOUR_THREE"
  | "DOUBLE_FOUR"
  | "DOUBLE_THREE"
  | "OPEN_THREE"
  | "SLEEP_THREE"
  | "OPEN_TWO"
  | "SLEEP_TWO";

export type CoachCategory =
  | "WIN"
  | "FORBIDDEN"
  | "FORCED_WIN"
  | "FORCED_LOSS"
  | "MISSED_WIN"
  | "MISSED_DEFENSE"
  | "NECESSARY_DEFENSE"
  | "ATTACK_DEFENSE"
  | "DOUBLE_THREAT"
  | "STRONG_ATTACK"
  | "MISSED_TACTIC"
  | "IRRELEVANT"
  | "SLOW_MOVE"
  | "GOOD_MOVE"
  | "NORMAL_MOVE";

export type CoachSeverity = "none" | "low" | "medium" | "high" | "critical";
export type CoachConfidence = "low" | "medium" | "high";

export type PatternEvidence = {
  kind: PatternKind;
  side: Stone;
  direction: string;
  stones: BoardPoint[];
  actionPoints: BoardPoint[];
  priority: number;
};

export type CoachMarkers = {
  current: BoardPoint;
  best: BoardPoint | null;
  dangerPoints: BoardPoint[];
  relatedStones: Array<{ point: BoardPoint; relation: "own" | "opponent" }>;
};

export type CoachDetails = {
  before: string[];
  move: string[];
  effect: string[];
  recommendation: string[];
  conclusion: string[];
};

export type GomokuCoachLogic = {
  movePlayer: Stone;
  currentTurn: Stone;
  move: BoardPoint;
  bestMove: BoardPoint;
  scoreBefore: number;
  scoreAfter: number;
  scoreDelta: number;
  scoreImpact: number;
  loss: number;
  actualMateIn: number | null;
  bestMateIn: number | null;
  ownPatternsBefore: PatternKind[];
  ownPatternsAfter: PatternKind[];
  newOwnPatterns: PatternKind[];
  opponentThreatsBefore: Array<PatternKind | "DIRECT_WIN">;
  opponentThreatsAfter: Array<PatternKind | "DIRECT_WIN">;
  defendedThreat: boolean;
  createdThreat: PatternKind | null;
  bestMoveReason: string;
  category: CoachCategory;
  severity: CoachSeverity;
  confidence: CoachConfidence;
  markers: CoachMarkers;
  details: CoachDetails;
  evidence: {
    ownAtMove: PatternEvidence[];
    bestAtMove: PatternEvidence[];
    opponentWinningPointsBefore: BoardPoint[];
    opponentWinningPointsAfter: BoardPoint[];
    ownWinningPointsBefore: BoardPoint[];
  };
};

export type GomokuCoachResult = GomokuCoachLogic & {
  title: string;
  summary: string;
};

export type GomokuCoachInput = {
  movesBefore: PlacedStone[];
  movePlayer: Stone;
  move: BoardPoint;
  bestMove: BoardPoint;
  loss: number;
  scoreBeforeBlack: number;
  scoreAfterBlack: number;
  actualMateIn?: number | null;
  bestMateIn?: number | null;
  rules?: RuleSet;
  scoreRange?: number;
};

type Board = Array<Array<Stone | null>>;
type WinningPoint = { point: BoardPoint; stones: BoardPoint[] };
type ThreatSnapshot = {
  patterns: PatternEvidence[];
  winningPoints: WinningPoint[];
  strongest: PatternEvidence | null;
};

const BOARD_SIZE = 15;
const columns = "ABCDEFGHIJKLMNO".split("");
const directions = [
  { row: 0, col: 1, name: "横线" },
  { row: 1, col: 0, name: "竖线" },
  { row: 1, col: 1, name: "左上到右下斜线" },
  { row: 1, col: -1, name: "右上到左下斜线" },
];

const patternPriority: Record<PatternKind, number> = {
  FIVE: 100,
  DOUBLE_FOUR: 96,
  OPEN_FOUR: 94,
  FOUR_THREE: 90,
  RUSH_FOUR: 82,
  DOUBLE_THREE: 72,
  OPEN_THREE: 64,
  SLEEP_THREE: 42,
  OPEN_TWO: 24,
  SLEEP_TWO: 12,
};

const patternNames: Record<PatternKind, string> = {
  FIVE: "五连",
  OPEN_FOUR: "活四",
  RUSH_FOUR: "冲四",
  FOUR_THREE: "四三",
  DOUBLE_FOUR: "双四",
  DOUBLE_THREE: "双三",
  OPEN_THREE: "活三",
  SLEEP_THREE: "眠三",
  OPEN_TWO: "活二",
  SLEEP_TWO: "眠二",
};

const categoryTitles: Record<CoachCategory, string> = {
  WIN: "直接成五",
  FORBIDDEN: "禁手",
  FORCED_WIN: "形成强制胜势",
  FORCED_LOSS: "进入强制败势",
  MISSED_WIN: "错过胜点",
  MISSED_DEFENSE: "漏防关键威胁",
  NECESSARY_DEFENSE: "必走防守",
  ATTACK_DEFENSE: "攻防兼备",
  DOUBLE_THREAT: "双重威胁",
  STRONG_ATTACK: "强力进攻",
  MISSED_TACTIC: "错过强手",
  IRRELEVANT: "偏离主战场",
  SLOW_MOVE: "稍缓",
  GOOD_MOVE: "好棋",
  NORMAL_MOVE: "普通发展",
};

const otherSide = (side: Stone): Stone => (side === "black" ? "white" : "black");
const sideName = (side: Stone) => (side === "black" ? "黑方" : "白方");
const coord = (point: BoardPoint) => `${columns[point.col]}${point.row + 1}`;
const pointKey = (point: BoardPoint) => `${point.row},${point.col}`;
const samePoint = (left: BoardPoint | null | undefined, right: BoardPoint | null | undefined) =>
  left?.row === right?.row && left?.col === right?.col;
const inBoard = (row: number, col: number) => row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;

function uniquePoints(points: BoardPoint[]) {
  const seen = new Set<string>();
  return points.filter((point) => {
    const key = pointKey(point);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueKinds(kinds: PatternKind[]) {
  return [...new Set(kinds)].sort((left, right) => patternPriority[right] - patternPriority[left]);
}

function boardFromMoves(moves: PlacedStone[]) {
  const board: Board = Array.from({ length: BOARD_SIZE }, () => Array<Stone | null>(BOARD_SIZE).fill(null));
  moves.forEach((move, index) => {
    if (!inBoard(move.row, move.col)) return;
    board[move.row][move.col] = move.side ?? (index % 2 === 0 ? "black" : "white");
  });
  return board;
}

function copyBoard(board: Board) {
  return board.map((row) => [...row]);
}

function pointList(points: BoardPoint[], limit = 3) {
  const shown = points.slice(0, limit).map(coord).join("、");
  return points.length > limit ? `${shown} 等 ${points.length} 个点` : shown;
}

function scanRuns(board: Board, side: Stone) {
  const patterns: PatternEvidence[] = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] !== side) continue;
      for (const direction of directions) {
        const priorRow = row - direction.row;
        const priorCol = col - direction.col;
        if (inBoard(priorRow, priorCol) && board[priorRow][priorCol] === side) continue;

        const stones: BoardPoint[] = [];
        let nextRow = row;
        let nextCol = col;
        while (inBoard(nextRow, nextCol) && board[nextRow][nextCol] === side) {
          stones.push({ row: nextRow, col: nextCol });
          nextRow += direction.row;
          nextCol += direction.col;
        }

        const actionPoints: BoardPoint[] = [];
        if (inBoard(priorRow, priorCol) && board[priorRow][priorCol] === null) {
          actionPoints.push({ row: priorRow, col: priorCol });
        }
        if (inBoard(nextRow, nextCol) && board[nextRow][nextCol] === null) {
          actionPoints.push({ row: nextRow, col: nextCol });
        }

        let kind: PatternKind | null = null;
        if (stones.length >= 5) kind = "FIVE";
        else if (stones.length === 4 && actionPoints.length === 2) kind = "OPEN_FOUR";
        else if (stones.length === 4 && actionPoints.length === 1) kind = "RUSH_FOUR";
        else if (stones.length === 3 && actionPoints.length === 2) kind = "OPEN_THREE";
        else if (stones.length === 3 && actionPoints.length === 1) kind = "SLEEP_THREE";
        else if (stones.length === 2 && actionPoints.length === 2) kind = "OPEN_TWO";
        else if (stones.length === 2 && actionPoints.length === 1) kind = "SLEEP_TWO";
        if (!kind) continue;

        patterns.push({
          kind,
          side,
          direction: direction.name,
          stones,
          actionPoints,
          priority: patternPriority[kind],
        });
      }
    }
  }
  return patterns.sort((left, right) => right.priority - left.priority);
}

function winningEvidenceAt(board: Board, point: BoardPoint, side: Stone) {
  const trial = copyBoard(board);
  trial[point.row][point.col] = side;
  const lines: BoardPoint[][] = [];
  for (const direction of directions) {
    const stones: BoardPoint[] = [{ ...point }];
    for (const sign of [-1, 1]) {
      let row = point.row + direction.row * sign;
      let col = point.col + direction.col * sign;
      while (inBoard(row, col) && trial[row][col] === side) {
        stones.push({ row, col });
        row += direction.row * sign;
        col += direction.col * sign;
      }
    }
    if (stones.length >= 5) lines.push(stones);
  }
  return lines;
}

function winningPoints(board: Board, side: Stone) {
  const wins: WinningPoint[] = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] !== null) continue;
      const point = { row, col };
      const lines = winningEvidenceAt(board, point, side);
      if (lines.length) {
        wins.push({ point, stones: uniquePoints(lines.flat().filter((stone) => !samePoint(stone, point))) });
      }
    }
  }
  return wins;
}

function addCompositePatterns(
  patterns: PatternEvidence[],
  board: Board,
  side: Stone,
  move: BoardPoint,
) {
  const atMove = patterns.filter((pattern) => pattern.stones.some((stone) => samePoint(stone, move)));
  const fours = atMove.filter((pattern) => pattern.kind === "OPEN_FOUR" || pattern.kind === "RUSH_FOUR");
  const openThrees = atMove.filter((pattern) => pattern.kind === "OPEN_THREE");
  const composites: PatternEvidence[] = [];

  const makeComposite = (kind: PatternKind, sources: PatternEvidence[]) => ({
    kind,
    side,
    direction: sources.map((source) => source.direction).join(" + "),
    stones: uniquePoints(sources.flatMap((source) => source.stones)),
    actionPoints: uniquePoints(sources.flatMap((source) => source.actionPoints)),
    priority: patternPriority[kind],
  });

  if (fours.length >= 2) composites.push(makeComposite("DOUBLE_FOUR", fours));
  if (fours.length >= 1 && openThrees.length >= 1) {
    composites.push(makeComposite("FOUR_THREE", [fours[0], openThrees[0]]));
  }
  if (openThrees.length >= 2) composites.push(makeComposite("DOUBLE_THREE", openThrees));

  if (!fours.length) {
    const relevantWins = winningPoints(board, side).filter((win) =>
      win.stones.some((stone) => samePoint(stone, move)),
    );
    if (relevantWins.length) {
      const kind: PatternKind = relevantWins.length >= 2 ? "OPEN_FOUR" : "RUSH_FOUR";
      composites.push({
        kind,
        side,
        direction: "组合线路",
        stones: uniquePoints(relevantWins.flatMap((win) => win.stones)),
        actionPoints: relevantWins.map((win) => win.point),
        priority: patternPriority[kind],
      });
    }
  }

  return [...composites, ...atMove].sort((left, right) => right.priority - left.priority);
}

function snapshot(board: Board, side: Stone): ThreatSnapshot {
  const patterns = scanRuns(board, side).filter((pattern) => pattern.priority >= patternPriority.SLEEP_THREE);
  const wins = winningPoints(board, side);
  return { patterns, winningPoints: wins, strongest: patterns[0] ?? null };
}

function patternAtMove(board: Board, side: Stone, move: BoardPoint) {
  return addCompositePatterns(scanRuns(board, side), board, side, move);
}

function strongestPattern(patterns: PatternEvidence[]) {
  return patterns[0] ?? null;
}

function patternPlain(pattern: PatternEvidence | null) {
  if (!pattern) return "没有形成必须立即回应的棋型";
  const points = pattern.actionPoints.length ? `，关键延伸点是 ${pointList(pattern.actionPoints)}` : "";
  switch (pattern.kind) {
    case "FIVE": return "直接连成五颗";
    case "OPEN_FOUR": return `形成活四，两边都有成五位置${points}`;
    case "RUSH_FOUR": return `形成冲四，下一手有直接成五点${points}`;
    case "DOUBLE_FOUR": return `同时制造两路四连威胁${points}`;
    case "FOUR_THREE": return `同时制造四连和三连两种威胁${points}`;
    case "DOUBLE_THREE": return `在两个方向同时做出活三${points}`;
    case "OPEN_THREE": return `做出活三，这条${pattern.direction}两边都能继续发展${points}`;
    case "SLEEP_THREE": return `连成眠三，但这条${pattern.direction}只有一边能继续发展${points}`;
    case "OPEN_TWO": return `形成活二，两边都保留发展空间${points}`;
    case "SLEEP_TWO": return `连成两颗，但只有一边能继续发展${points}`;
  }
}

function threatKinds(snapshotValue: ThreatSnapshot) {
  const kinds: Array<PatternKind | "DIRECT_WIN"> = snapshotValue.patterns.map((pattern) => pattern.kind);
  if (snapshotValue.winningPoints.length) kinds.unshift("DIRECT_WIN");
  return [...new Set(kinds)];
}

function chanceFor(side: Stone, blackScore: number) {
  return side === "black" ? blackScore : 100 - blackScore;
}

function nearestDistance(board: Board, point: BoardPoint) {
  let nearest = Number.POSITIVE_INFINITY;
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] !== null) {
        nearest = Math.min(nearest, Math.max(Math.abs(row - point.row), Math.abs(col - point.col)));
      }
    }
  }
  return Number.isFinite(nearest) ? nearest : Math.max(Math.abs(point.row - 7), Math.abs(point.col - 7));
}

function severityFor(loss: number, scoreRange: number, category: CoachCategory): CoachSeverity {
  if (category === "WIN" || category === "FORCED_WIN" || category === "NORMAL_MOVE" || category === "GOOD_MOVE") return "none";
  if (category === "FORBIDDEN" || category === "FORCED_LOSS" || category === "MISSED_DEFENSE" || category === "MISSED_WIN") return "critical";
  const ratio = Math.max(0, loss) / Math.max(1, scoreRange);
  if (ratio >= 0.7) return "critical";
  if (ratio >= 0.4) return "high";
  if (ratio >= 0.18) return "medium";
  if (ratio >= 0.04) return "low";
  return "none";
}

function isForbidden(patterns: PatternEvidence[], rules: RuleSet, movePlayer: Stone) {
  if (rules !== "renju" || movePlayer !== "black") return false;
  const five = patterns.find((pattern) => pattern.kind === "FIVE");
  if (five?.stones.length === 5) return false;
  if (five && five.stones.length > 5) return true;
  return patterns.some((pattern) => pattern.kind === "DOUBLE_THREE" || pattern.kind === "DOUBLE_FOUR");
}

function positiveImpact(
  category: CoachCategory,
  scoreDelta: number,
  created: PatternEvidence | null,
  defendedThreat: boolean,
) {
  if (category === "NORMAL_MOVE") return 0;
  if (category === "WIN") return 50;
  if (category === "FORCED_WIN") return 40;
  const tactical = created ? Math.round(patternPriority[created.kind] / 4) : 0;
  const defensive = defendedThreat ? 20 : 0;
  const positional = Math.max(0, Math.round(scoreDelta));
  return Math.min(40, Math.max(tactical, defensive, positional));
}

function bestMoveReason(
  boardBefore: Board,
  player: Stone,
  bestMove: BoardPoint,
  ownWinsBefore: WinningPoint[],
  opponentWinsBefore: WinningPoint[],
  opponentWinsAfterBest: WinningPoint[],
  bestPatterns: PatternEvidence[],
) {
  if (winningEvidenceAt(boardBefore, bestMove, player).length) {
    return "它可以立即连成五子";
  }
  if (opponentWinsBefore.length && !opponentWinsAfterBest.length) {
    return "它能封住对手的直接成五点";
  }
  const bestPattern = strongestPattern(bestPatterns);
  if (bestPattern) return `它会${patternPlain(bestPattern)}`;
  if (ownWinsBefore.length) return "它更接近己方现有的胜点";
  const distance = nearestDistance(boardBefore, bestMove);
  return distance <= 2
    ? "它能让棋子留在当前主战场并保持联系"
    : "它是 Rapfi 计算出的效率更高位置";
}

function buildDetails(
  player: Stone,
  move: BoardPoint,
  bestMove: BoardPoint,
  actualPattern: PatternEvidence | null,
  ownBefore: PatternEvidence | null,
  opponentBefore: ThreatSnapshot,
  opponentAfter: ThreatSnapshot,
  defendedThreat: boolean,
  category: CoachCategory,
  recommendation: string,
) {
  const opponent = otherSide(player);
  const before: string[] = [];
  if (ownBefore) before.push(`${sideName(player)}原有的主要棋型是${patternNames[ownBefore.kind]}。`);
  else before.push(`${sideName(player)}落子前没有强制进攻棋型。`);
  if (opponentBefore.winningPoints.length) {
    before.push(`${sideName(opponent)}可在 ${pointList(opponentBefore.winningPoints.map((item) => item.point))} 直接成五。`);
  } else if (opponentBefore.strongest) {
    before.push(`${sideName(opponent)}原有的主要威胁是${patternNames[opponentBefore.strongest.kind]}。`);
  } else {
    before.push(`${sideName(opponent)}落子前没有直接成五威胁。`);
  }

  const moveLines = actualPattern
    ? [`${sideName(player)}本手落在 ${coord(move)}，${patternPlain(actualPattern)}。`]
    : [`${sideName(player)}本手落在 ${coord(move)}，没有新增强制棋型。`];

  const effect: string[] = [];
  if (defendedThreat) effect.push("本手已经解除对手落子前最急的威胁。");
  else if (opponentAfter.winningPoints.length) {
    effect.push(`${sideName(opponent)}仍可在 ${pointList(opponentAfter.winningPoints.map((item) => item.point))} 直接成五。`);
  } else if (opponentAfter.strongest) {
    effect.push(`${sideName(opponent)}落子后仍保留${patternNames[opponentAfter.strongest.kind]}。`);
  } else effect.push("本手没有给对手留下直接成五点。");

  const recommendationLines = samePoint(move, bestMove)
    ? [`本手与 Rapfi 首选 ${coord(bestMove)} 一致。`]
    : [`推荐 ${coord(bestMove)}：${recommendation}。`];

  return {
    before,
    move: moveLines,
    effect,
    recommendation: recommendationLines,
    conclusion: [`因此本手归类为“${categoryTitles[category]}”。`],
  };
}

export function analyzeGomokuCoach(input: GomokuCoachInput): GomokuCoachLogic {
  const rules = input.rules ?? "freestyle";
  const scoreRange = input.scoreRange ?? 100;
  const player = input.movePlayer;
  const opponent = otherSide(player);
  const boardBefore = boardFromMoves(input.movesBefore);
  const boardAfter = copyBoard(boardBefore);
  boardAfter[input.move.row][input.move.col] = player;

  const boardAfterBest = copyBoard(boardBefore);
  const legalBest = inBoard(input.bestMove.row, input.bestMove.col) && boardAfterBest[input.bestMove.row][input.bestMove.col] === null;
  if (legalBest) boardAfterBest[input.bestMove.row][input.bestMove.col] = player;

  const ownBeforePatterns = scanRuns(boardBefore, player);
  const ownAfterPatterns = scanRuns(boardAfter, player);
  const ownAtMove = patternAtMove(boardAfter, player, input.move);
  const bestAtMove = legalBest ? patternAtMove(boardAfterBest, player, input.bestMove) : [];
  const actualPattern = strongestPattern(ownAtMove);
  const bestPattern = strongestPattern(bestAtMove);

  const opponentBefore = snapshot(boardBefore, opponent);
  const opponentAfter = snapshot(boardAfter, opponent);
  const opponentAfterBest = snapshot(boardAfterBest, opponent);
  const ownWinsBefore = winningPoints(boardBefore, player);
  const ownWon = winningEvidenceAt(boardBefore, input.move, player).length > 0;
  const missedOwnWin = ownWinsBefore.length > 0 && !ownWon;
  const hadDirectDanger = opponentBefore.winningPoints.length > 0;
  const remainingDirectDanger = opponentAfter.winningPoints.length > 0;
  const defendedThreat = hadDirectDanger && !remainingDirectDanger;
  const missedDefense = hadDirectDanger && remainingDirectDanger;
  const forbidden = isForbidden(ownAtMove, rules, player);
  const lossRatio = Math.max(0, input.loss) / Math.max(1, scoreRange);
  const actualPriority = actualPattern?.priority ?? 0;
  const bestPriority = bestPattern?.priority ?? 0;
  const scoreBefore = chanceFor(player, input.scoreBeforeBlack);
  const scoreAfter = chanceFor(player, input.scoreAfterBlack);
  const scoreDelta = Math.round(scoreAfter - scoreBefore);

  let category: CoachCategory;
  if (forbidden) category = "FORBIDDEN";
  else if (ownWon) category = "WIN";
  else if (input.actualMateIn !== null && input.actualMateIn !== undefined && input.actualMateIn < 0) category = "FORCED_WIN";
  else if (missedOwnWin) category = "MISSED_WIN";
  else if (missedDefense) category = "MISSED_DEFENSE";
  else if (input.actualMateIn !== null && input.actualMateIn !== undefined && input.actualMateIn > 0) category = "FORCED_LOSS";
  else if (defendedThreat && actualPriority >= patternPriority.OPEN_TWO) category = "ATTACK_DEFENSE";
  else if (defendedThreat) category = "NECESSARY_DEFENSE";
  else if (actualPattern?.kind === "DOUBLE_FOUR" || actualPattern?.kind === "FOUR_THREE" || actualPattern?.kind === "DOUBLE_THREE") category = "DOUBLE_THREAT";
  else if (actualPriority >= patternPriority.OPEN_THREE) category = "STRONG_ATTACK";
  else if (input.loss > 0 && nearestDistance(boardBefore, input.move) >= 4 && actualPriority < patternPriority.OPEN_TWO) category = "IRRELEVANT";
  else if (bestPriority >= actualPriority + 20 && lossRatio >= 0.18) category = "MISSED_TACTIC";
  else if (lossRatio >= 0.18) category = "MISSED_TACTIC";
  else if (input.loss > 0) category = "SLOW_MOVE";
  else if (actualPriority >= patternPriority.OPEN_TWO || scoreDelta >= Math.max(2, Math.round(scoreRange * 0.03))) category = "GOOD_MOVE";
  else category = "NORMAL_MOVE";

  const scoreImpact = input.loss > 0
    ? -Math.round(input.loss)
    : positiveImpact(category, scoreDelta, actualPattern, defendedThreat);
  const severity = severityFor(input.loss, scoreRange, category);
  const concreteEvidence = ownWon || missedOwnWin || hadDirectDanger || Boolean(actualPattern) || samePoint(input.move, input.bestMove);
  const confidence: CoachConfidence = concreteEvidence ? "high" : input.loss > 0 ? "medium" : "low";
  const recommendation = bestMoveReason(
    boardBefore,
    player,
    input.bestMove,
    ownWinsBefore,
    opponentBefore.winningPoints,
    opponentAfterBest.winningPoints,
    bestAtMove,
  );

  const relatedOwn = actualPattern?.stones ?? [];
  const relatedOpponent = missedDefense
    ? uniquePoints(opponentAfter.winningPoints.flatMap((item) => item.stones))
    : opponentAfter.strongest?.stones ?? [];
  const dangerPoints = remainingDirectDanger
    ? opponentAfter.winningPoints.map((item) => item.point)
    : [];
  const ownKindsBefore = uniqueKinds(ownBeforePatterns.map((pattern) => pattern.kind));
  const ownKindsAfter = uniqueKinds(ownAfterPatterns.map((pattern) => pattern.kind));
  const beforeSet = new Set(ownKindsBefore);

  return {
    movePlayer: player,
    currentTurn: opponent,
    move: { ...input.move },
    bestMove: { ...input.bestMove },
    scoreBefore,
    scoreAfter,
    scoreDelta,
    scoreImpact,
    loss: Math.round(input.loss),
    actualMateIn: input.actualMateIn ?? null,
    bestMateIn: input.bestMateIn ?? null,
    ownPatternsBefore: ownKindsBefore,
    ownPatternsAfter: ownKindsAfter,
    newOwnPatterns: ownKindsAfter.filter((kind) => !beforeSet.has(kind)),
    opponentThreatsBefore: threatKinds(opponentBefore),
    opponentThreatsAfter: threatKinds(opponentAfter),
    defendedThreat,
    createdThreat: actualPattern?.kind ?? null,
    bestMoveReason: recommendation,
    category,
    severity,
    confidence,
    markers: {
      current: { ...input.move },
      best: samePoint(input.move, input.bestMove) ? null : { ...input.bestMove },
      dangerPoints: uniquePoints(dangerPoints),
      relatedStones: [
        ...uniquePoints(relatedOwn).map((point) => ({ point, relation: "own" as const })),
        ...uniquePoints(relatedOpponent).map((point) => ({ point, relation: "opponent" as const })),
      ],
    },
    details: buildDetails(
      player,
      input.move,
      input.bestMove,
      actualPattern,
      strongestPattern(ownBeforePatterns),
      opponentBefore,
      opponentAfter,
      defendedThreat,
      category,
      recommendation,
    ),
    evidence: {
      ownAtMove,
      bestAtMove,
      opponentWinningPointsBefore: opponentBefore.winningPoints.map((item) => item.point),
      opponentWinningPointsAfter: opponentAfter.winningPoints.map((item) => item.point),
      ownWinningPointsBefore: ownWinsBefore.map((item) => item.point),
    },
  };
}

function openingSentence(logic: GomokuCoachLogic) {
  const player = sideName(logic.movePlayer);
  if (logic.category === "WIN") return `${player}这一步直接连成五颗，已经获胜。`;
  if (logic.category === "FORBIDDEN") return `${player}这一步在当前禁手规则下不能落。`;
  if (logic.category === "FORCED_WIN") return `${player}这一步非常关键，已经形成强制胜势。`;
  if (logic.category === "FORCED_LOSS") return `${player}这一步是关键失误。`;
  if (logic.severity === "critical") return `${player}这一步是关键失误。`;
  if (logic.severity === "high") return `${player}这一步问题比较明显。`;
  if (logic.severity === "medium") return `${player}这一步有些亏。`;
  if (logic.severity === "low") return `${player}这一步可以下，不过不是最积极。`;
  if (logic.category === "DOUBLE_THREAT" || logic.category === "STRONG_ATTACK") return `${player}这一步很好。`;
  if (logic.category === "ATTACK_DEFENSE" || logic.category === "NECESSARY_DEFENSE") return `${player}这一步很有价值。`;
  if (logic.category === "GOOD_MOVE") return `${player}这一步比较稳。`;
  return `${player}这一步比较正常，局面变化不大。`;
}

function reasonSentence(logic: GomokuCoachLogic) {
  const player = sideName(logic.movePlayer);
  const opponent = sideName(logic.currentTurn);
  const ownPattern = strongestPattern(logic.evidence.ownAtMove);
  switch (logic.category) {
    case "WIN": return "这颗棋落下后，横、竖或斜线中已经有一条达到五连。";
    case "FORBIDDEN": return `虽然${player}制造了双重威胁，但黑方双三或双四在当前规则下属于禁手。`;
    case "FORCED_WIN": return `Rapfi 已确认${player}可以连续保持先手，并在约 ${Math.abs(logic.actualMateIn ?? 0)} 手内完成进攻。`;
    case "FORCED_LOSS": return `Rapfi 已确认${opponent}已有约 ${Math.abs(logic.actualMateIn ?? 0)} 手的强制胜路，普通防守无法全部覆盖。`;
    case "MISSED_WIN": return `${player}落子前已经有直接成五点，这一手却没有把胜势走完。`;
    case "MISSED_DEFENSE": return `${opponent}落子前已经能直接成五，而这一步之后危险点 ${pointList(logic.evidence.opponentWinningPointsAfter)} 仍然存在。`;
    case "NECESSARY_DEFENSE": return `这颗棋封住了${opponent}原来的直接成五点，先把眼前危险解决了。`;
    case "ATTACK_DEFENSE": return `这颗棋先封住了${opponent}的直接成五点，同时${patternPlain(ownPattern)}。`;
    case "DOUBLE_THREAT": return `${patternPlain(ownPattern)}，${opponent}很难用一手全部处理。`;
    case "STRONG_ATTACK": return `${patternPlain(ownPattern)}，已经迫使${opponent}优先回应。`;
    case "MISSED_TACTIC": return ownPattern
      ? `本手只是${patternPlain(ownPattern)}，但 Rapfi 找到了更强、更紧迫的选择。`
      : "本手没有制造连续威胁，把主动权让给了对方。";
    case "IRRELEVANT": return "这个落点离现有棋子和当前主战场较远，没有形成连续威胁。";
    case "SLOW_MOVE": return ownPattern
      ? `本手${patternPlain(ownPattern)}，但效果比最佳点弱。`
      : "本手没有明显失误，但也没有制造必须回应的威胁。";
    case "GOOD_MOVE": return ownPattern
      ? `这颗棋${patternPlain(ownPattern)}。`
      : "本手保持了棋子的联系，没有给对手留下直接成五点。";
    case "NORMAL_MOVE": return "这颗棋没有形成强制棋型，也没有漏掉对手的直接威胁。";
  }
}

function consequenceSentence(logic: GomokuCoachLogic) {
  if (logic.category === "MISSED_DEFENSE") return "强制威胁的优先级高于自己的普通进攻，这里必须先防。";
  if (logic.category === "FORCED_WIN") return "接下来应沿着最佳路线继续下强制手，不要转去无关方向。";
  if (logic.category === "FORCED_LOSS") return "这里不是普通的小亏，而是对手已经能用连续先手把胜势走完。";
  if (logic.category === "MISSED_WIN") return "能立即获胜时不应转去布局或制造较小的威胁。";
  if (logic.category === "ATTACK_DEFENSE") return "这样既解除危险，又保留了下一步继续进攻的空间。";
  if (logic.category === "NECESSARY_DEFENSE") return "这类手看起来不华丽，却是当前局面必须完成的任务。";
  if (logic.category === "DOUBLE_THREAT") return "两条线路同时发力，通常能连续保持先手。";
  if (logic.category === "STRONG_ATTACK") return "接下来要盯住标出的延伸点，继续保持先手。";
  if (logic.category === "IRRELEVANT" || logic.category === "MISSED_TACTIC") return "下一手应先看成五、挡五、四和活三，再考虑普通发展。";
  if (logic.scoreDelta === 0) return "双方胜率估计几乎没有变化，不需要为很小的分数波动编造理由。";
  return logic.scoreDelta > 0
    ? `${sideName(logic.movePlayer)}的局面比落子前有所改善，但仍要继续检查对手最快的反击。`
    : "局面略有回落，主要差别在落点效率，而不是出现了立即输棋。";
}

export function narrateGomokuCoach(logic: GomokuCoachLogic) {
  const sentences = [openingSentence(logic), reasonSentence(logic)];
  if (logic.category !== "WIN" && logic.category !== "FORBIDDEN") {
    sentences.push(consequenceSentence(logic));
  }
  if (!samePoint(logic.move, logic.bestMove) && logic.category !== "WIN") {
    sentences.push(`更好的选择是 ${coord(logic.bestMove)}，因为${logic.bestMoveReason}。`);
  } else if (samePoint(logic.move, logic.bestMove)) {
    sentences.push(`这手也与 Rapfi 的首选 ${coord(logic.bestMove)} 一致。`);
  }
  return sentences.slice(0, 4).join("");
}

export function createGomokuCoach(input: GomokuCoachInput): GomokuCoachResult {
  const logic = analyzeGomokuCoach(input);
  return {
    ...logic,
    title: categoryTitles[logic.category],
    summary: narrateGomokuCoach(logic),
  };
}

export function coachScoreText(scoreImpact: number) {
  if (scoreImpact > 0) return `+${scoreImpact}`;
  if (scoreImpact < 0) return `${scoreImpact}`;
  return "0";
}

export function patternName(kind: PatternKind) {
  return patternNames[kind];
}
