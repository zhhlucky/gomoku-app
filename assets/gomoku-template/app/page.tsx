"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import {
  coachScoreText,
  createGomokuCoach,
  type GomokuCoachResult,
} from "./gomoku-coach";

type Stone = "black" | "white";
type GameMode = "demo" | "manual" | "free";
type BoardPoint = { row: number; col: number };
type Move = BoardPoint & {
  score: number;
  label?: string;
  note?: string;
  suggested?: [number, number];
  loss?: number;
  engineEvaluation?: number | null;
  pv?: BoardPoint[];
  mateIn?: number | null;
  coach?: GomokuCoachResult;
};
type MoveGrade = {
  best: BoardPoint;
  penalty: number;
  bestBlackWinRate: number;
  bestEngineEvaluation?: number | null;
  bestMateIn?: number | null;
  bestPv?: BoardPoint[];
};
type Review = {
  index: number;
  best: BoardPoint;
  loss: number;
  blackWinRate: number;
  engineEvaluation: number | null;
  mateIn?: number | null;
  pv?: BoardPoint[];
  bestBlackWinRate?: number;
  bestEngineEvaluation?: number | null;
  bestMateIn?: number | null;
  bestPv?: BoardPoint[];
};
type PositionAnalysis = {
  terminal: boolean;
  winner: Stone | null;
  next: Stone | null;
  best: BoardPoint | null;
  pv: BoardPoint[];
  mateIn: number | null;
  blackWinRate: number;
  engineEvaluation: number | null;
  grade?: MoveGrade;
};

const T = {
  app: "\u843d\u5b50\u590d\u76d8",
  sample: "\u793a\u4f8b\u68cb\u5c40",
  import: "\u5bfc\u5165 SGF",
  create: "\u65b0\u5efa\u68cb\u5c40",
  review: "\u5b8c\u6574\u590d\u76d8",
  demo: "\u793a\u4f8b\u590d\u76d8",
  myGame: "\u6211\u7684\u68cb\u8c31",
  step: "\u7b2c",
  hand: "\u624b",
  blackWin: "\u9ed1\u65b9\u80dc\u7387",
  trend: "\u5c40\u52bf\u8d70\u52bf",
  coach: "\u5b9e\u65f6\u6559\u7ec3",
  issues: "\u9700\u8981\u590d\u76d8\u7684\u624b",
  suggestion: "\u5efa\u8bae",
  route: "\u672a\u6765 5 \u624b\u6700\u4f73\u8def\u7ebf",
  demoStatus: "\u5f53\u524d\u663e\u793a\u793a\u4f8b\u68cb\u5c40",
  manualStatus: "Rapfi \u81ea\u52a8\u6267\u5bf9\u65b9",
  imported: "\u5df2\u5bfc\u5165",
  moves: "\u624b",
  noSgf: "\u6ca1\u6709\u627e\u5230 15 \u8def\u68cb\u8c31\u7684\u843d\u5b50\u8bb0\u5f55",
  ready: "Rapfi \u5df2\u8fde\u63a5 \u00b7 \u4e13\u5bb6\u8bb2\u89e3 \u00b7 5 \u624b\u4e3b\u53d8",
  reviewing: "Rapfi \u6b63\u5728\u9010\u624b\u590d\u76d8...",
  whiteThinking: "Rapfi \u6b63\u5728\u8ba1\u7b97\u767d\u65b9\u6700\u4f73\u5e94\u624b...",
  routeThinking: "Rapfi \u5df2\u843d\u5b50\uff0c\u6b63\u5728\u8ffd\u7b97\u672a\u6765 5 \u624b...",
  done: "Rapfi \u590d\u76d8\u5b8c\u6210",
  offline: "Rapfi \u672c\u5730\u670d\u52a1\u4e0d\u5728\u7ebf",
  noMoves: "\u5148\u843d\u5b50\u6216\u5bfc\u5165\u68cb\u8c31",
  stable: "\u8fd9\u6b65\u6ca1\u6709\u51fa\u73b0\u660e\u663e\u6389\u5206\u3002\u7ee7\u7eed\u76ef\u4f4f\u5bf9\u624b\u6700\u5feb\u7684\u8fde\u7ebf\u65b9\u5411\u3002",
  routePending: "\u7b49\u5f85 Rapfi \u4e3b\u53d8",
  footer: "Rapfi \u5728\u672c\u673a\u8fd0\u884c\uff0c\u68cb\u8c31\u4e0d\u4f1a\u4e0a\u4f20\u3002",
};

const columns = "ABCDEFGHIJKLMNO".split("");
const defaultEngineUrl = "http://127.0.0.1:8795";
const legacyEngineUrl = /^http:\/\/(127\.0\.0\.1|localhost):8788$/i;

function initialEngineUrl() {
  if (typeof window === "undefined") return defaultEngineUrl;
  const savedUrl = window.localStorage.getItem("rapfi-engine-url");
  return savedUrl && !legacyEngineUrl.test(savedUrl) ? savedUrl : defaultEngineUrl;
}

const demoMoves: Move[] = [
  { row: 7, col: 7, score: 50 },
  { row: 7, col: 8, score: 51 },
  { row: 6, col: 7, score: 53 },
  { row: 8, col: 8, score: 52 },
  { row: 5, col: 7, score: 58 },
  { row: 8, col: 7, score: 56 },
  { row: 4, col: 7, score: 63 },
  { row: 9, col: 7, score: 59 },
  { row: 6, col: 8, score: 65 },
  { row: 5, col: 8, score: 62 },
  { row: 6, col: 6, score: 67 },
  { row: 3, col: 9, score: 41 },
  { row: 7, col: 6, score: 42 },
  { row: 6, col: 9, score: 35 },
  { row: 8, col: 6, score: 34 },
  { row: 5, col: 9, score: 29 },
  { row: 8, col: 9, score: 27 },
  { row: 4, col: 9, score: 18 },
];

const stoneFor = (index: number): Stone => (index % 2 === 0 ? "black" : "white");
const otherSide = (side: Stone): Stone => (side === "black" ? "white" : "black");
const coord = (move: BoardPoint) => `${columns[move.col]}${move.row + 1}`;
const importScore = (index: number, row: number, col: number) =>
  Math.max(
    8,
    Math.min(
      92,
      51 + [0, 2, -1, 3, -2, 1, -3][index % 7] -
        Math.max(Math.abs(row - 7) + Math.abs(col - 7) - 6, 0) * 2,
    ),
  );

function parseSgf(text: string): Move[] {
  const found = [...text.matchAll(/;[BW]\[([a-o])([a-o])\]/gi)];
  if (!found.length) throw new Error(T.noSgf);
  return found.map((match, index) => {
    const col = match[1].toLowerCase().charCodeAt(0) - 97;
    const row = match[2].toLowerCase().charCodeAt(0) - 97;
    return { row, col, score: importScore(index, row, col) };
  });
}

function labelFor(loss: number) {
  if (loss >= 70) return "\u5927\u5931\u8bef";
  if (loss >= 35) return "\u4e25\u91cd\u95ee\u9898";
  if (loss >= 12) return "\u5c0f\u95ee\u9898";
  if (loss > 0) return "\u8f7b\u5fae\u504f\u5dee";
  return "\u6700\u4f18\u89e3";
}

type CoachingContext = {
  before: Move[];
  scoreBeforeBlack?: number;
  actualBlackWinRate?: number;
  actualMateIn?: number | null;
  actualPv?: BoardPoint[];
  bestBlackWinRate?: number;
  bestMateIn?: number | null;
  bestPv?: BoardPoint[];
};
const pointKey = (point: BoardPoint) => `${point.row},${point.col}`;

function noteFor(index: number, actual: Move, best: BoardPoint, loss: number, context: CoachingContext) {
  return coachForMove(index, actual, best, loss, context).summary;
}

function coachForMove(index: number, actual: Move, best: BoardPoint, loss: number, context: CoachingContext) {
  return createGomokuCoach({
    movesBefore: context.before.map(({ row, col }) => ({ row, col })),
    movePlayer: stoneFor(index),
    move: { row: actual.row, col: actual.col },
    bestMove: { row: best.row, col: best.col },
    loss,
    scoreBeforeBlack: context.scoreBeforeBlack ?? context.before.at(-1)?.score ?? 50,
    scoreAfterBlack: context.actualBlackWinRate ?? actual.score,
    actualMateIn: context.actualMateIn,
    bestMateIn: context.bestMateIn,
  });
}

function sideName(side: Stone) {
  return side === "black" ? "\u9ed1\u65b9" : "\u767d\u65b9";
}

function roleStatus(humanSide: Stone) {
  const order = humanSide === "black" ? "\u5148\u624b" : "\u540e\u624b";
  return `\u4f60\u6267${sideName(humanSide)}\uff08${order}\uff09\uff0cRapfi \u81ea\u52a8\u6267${sideName(otherSide(humanSide))}`;
}

function forcedWinnerFor(analysis: PositionAnalysis) {
  if (!analysis.next || !analysis.mateIn) return null;
  return analysis.mateIn > 0 ? analysis.next : otherSide(analysis.next);
}

function liveNote(analysis: PositionAnalysis) {
  if (analysis.terminal && analysis.winner) {
    return `${sideName(analysis.winner)}\u5df2\u7ecf\u8fde\u6210\u4e94\u5b50\uff0c\u6b64\u5c40\u5df2\u7ecf\u7ed3\u675f\u3002`;
  }
  if (!analysis.best || !analysis.next) {
    return "Rapfi \u6682\u65f6\u6ca1\u6709\u7ed9\u51fa\u540e\u7eed\u843d\u70b9\u3002";
  }
  const forcedWinner = forcedWinnerFor(analysis);
  const route = (analysis.pv ?? [])
    .slice(0, 5)
    .map((move, index) => `${index + 1}.${coord(move)}`)
    .join(" \u2192 ");
  const routeText = route ? `\u6700\u4f73\u8def\u7ebf\uff1a${route}\u3002` : "";
  const forcedText = forcedWinner
    ? `Rapfi \u5df2\u786e\u8ba4${sideName(forcedWinner)}\u5f3a\u5236\u80dc\uff0c\u9884\u8ba1 ${Math.abs(analysis.mateIn!)} \u624b\u5185\u7ed3\u675f\u3002`
    : "";
  return `\u73b0\u5728\u8f6e\u5230${sideName(analysis.next)}\uff0c\u9996\u9009 ${coord(analysis.best)}\u3002${routeText}${forcedText}\u5f53\u524d\u9ed1\u65b9\u80dc\u7387 ${analysis.blackWinRate}%\u3002`;
}

export default function Home() {
  const [moves, setMoves] = useState<Move[]>(demoMoves);
  const [step, setStep] = useState(demoMoves.length - 1);
  const [mode, setMode] = useState<GameMode>("demo");
  const [humanSide, setHumanSide] = useState<Stone>("black");
  const [message, setMessage] = useState(T.demoStatus);
  const [engineMessage, setEngineMessage] = useState(T.ready);
  const [engineUrl, setEngineUrl] = useState(initialEngineUrl);
  const [reviewing, setReviewing] = useState(false);
  const [autoReplying, setAutoReplying] = useState(false);
  const [expandedCoachIndex, setExpandedCoachIndex] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const liveRequest = useRef(0);
  const liveAbort = useRef<AbortController | null>(null);
  const playLock = useRef(false);

  const visible = moves.slice(0, step + 1);
  const current = moves[step];
  const previous = step > 0 ? moves[step - 1] : undefined;
  const coachIndex = current?.loss !== undefined
    ? step
    : previous?.loss !== undefined
      ? step - 1
      : step;
  const coachMove = moves[coachIndex];
  const coachExpanded = expandedCoachIndex === coachIndex;
  const activeCoach = coachMove?.coach;
  const coachCurrentKey = activeCoach ? pointKey(activeCoach.markers.current) : null;
  const coachBestKey = activeCoach?.markers.best ? pointKey(activeCoach.markers.best) : null;
  const coachDangerKeys = new Set(activeCoach?.markers.dangerPoints.map(pointKey) ?? []);
  const coachRelated = new Map(
    activeCoach?.markers.relatedStones.map(({ point, relation }) => [pointKey(point), relation]) ?? [],
  );
  const score = current?.score ?? 50;
  const principalVariation = current?.pv?.slice(0, 5) ?? [];
  const primaryHint = principalVariation[0] ?? null;
  const issues = useMemo(
    () => moves
      .map((move, index) => ({ move, index, loss: move.loss ?? 0 }))
      .filter((item) => item.loss > 0)
      .sort((left, right) => right.loss - left.loss),
    [moves],
  );
  const boardLocked = reviewing || autoReplying || (
    mode === "manual" && stoneFor(visible.length) !== humanSide
  );

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    const savedUrl = window.localStorage.getItem("rapfi-engine-url");
    if (savedUrl && legacyEngineUrl.test(savedUrl)) {
      window.localStorage.setItem("rapfi-engine-url", defaultEngineUrl);
    }
  }, []);

  useEffect(() => () => {
    liveAbort.current?.abort();
  }, []);

  function cancelLiveAnalysis() {
    liveRequest.current += 1;
    liveAbort.current?.abort();
    liveAbort.current = null;
    playLock.current = false;
    setAutoReplying(false);
  }

  function resetDemo() {
    cancelLiveAnalysis();
    setMoves(demoMoves);
    setStep(demoMoves.length - 1);
    setMode("demo");
    setMessage(T.demoStatus);
    setEngineMessage(T.ready);
  }

  function startManual(selectedSide: Stone = humanSide) {
    cancelLiveAnalysis();
    setHumanSide(selectedSide);
    setMoves([]);
    setStep(-1);
    setMode("manual");
    setMessage(roleStatus(selectedSide));
    setEngineMessage(T.ready);
    if (selectedSide === "white") {
      playLock.current = true;
      setAutoReplying(true);
      setMessage("\u4f60\u9009\u62e9\u540e\u624b\uff0cRapfi \u6b63\u5728\u4e0b\u9ed1\u65b9\u7b2c\u4e00\u624b");
      void analyzePosition([], true, selectedSide);
    }
  }

  function startFreeReview() {
    cancelLiveAnalysis();
    setMoves([]);
    setStep(-1);
    setMode("free");
    setMessage("\u81ea\u7531\u590d\u76d8\u5df2\u5f00\u59cb\uff0c\u9ed1\u767d\u53cc\u65b9\u90fd\u7531\u4f60\u843d\u5b50");
    setEngineMessage(T.ready);
  }

  function chooseSide(selectedSide: Stone) {
    if (reviewing || autoReplying || (selectedSide === humanSide && mode === "manual" && !moves.length)) return;
    startManual(selectedSide);
  }

  function place(row: number, col: number) {
    if (reviewing || playLock.current) return;
    const base = mode === "demo" ? [] : moves.slice(0, step + 1);
    const freeReview = mode === "free";
    const playedSide = stoneFor(base.length);
    if (!freeReview && playedSide !== humanSide) return;
    if (base.some((move) => move.row === row && move.col === col)) return;

    const previous = base.at(-1);
    const recommended = previous?.pv?.[0] ?? (previous?.suggested
      ? { row: previous.suggested[0], col: previous.suggested[1] }
      : undefined);
    const humanMove: Move = { row, col, score: base.at(-1)?.score ?? 50 };
    const next = [...base, humanMove];
    playLock.current = true;
    setAutoReplying(true);
    setMoves(next);
    setStep(next.length - 1);
    if (freeReview) {
      setMode("free");
      setMessage(`${sideName(playedSide)}\u5df2\u843d ${coord(humanMove)}\uff0cRapfi \u6b63\u5728\u8bc4\u5206\u8fd9\u4e00\u624b`);
      void analyzePosition(next, false, humanSide, recommended, true, true);
    } else {
      setMode("manual");
      setMessage(`${sideName(humanSide)}\u5df2\u843d ${coord(humanMove)}\uff0c\u7b49\u5f85 Rapfi \u5e94\u624b`);
      void analyzePosition(next, true, humanSide, recommended);
    }
  }

  function importSgf(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        cancelLiveAnalysis();
        const next = parseSgf(String(reader.result));
        setMoves(next);
        setStep(next.length - 1);
        setMode("free");
        setMessage(`${T.imported} ${file.name}\uff0c${next.length} ${T.moves}\uff0c\u53ef\u7ee7\u7eed\u64cd\u4f5c\u9ed1\u767d\u53cc\u65b9`);
        void analyzePosition(next, false);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Import failed");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function configureEngine() {
    const next = window.prompt("Rapfi bridge URL", engineUrl);
    if (!next) return;
    const value = next.replace(/\/$/, "");
    setEngineUrl(value);
    window.localStorage.setItem("rapfi-engine-url", value);
    setEngineMessage(T.ready);
  }

  async function requestAnalysis(
    nextMoves: Move[],
    controller: AbortController,
    gradeLastMove = false,
    recommended?: BoardPoint,
  ) {
    const response = await fetch(`${engineUrl}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moves: nextMoves.map(({ row, col }) => ({ row, col })),
        timeoutMs: 800,
        gradeLastMove,
        recommended: recommended ?? null,
      }),
      signal: controller.signal,
    });
    const body = await response.json() as PositionAnalysis & { error?: string };
    if (!response.ok) throw new Error(body.error ?? T.offline);
    return body;
  }

  function applyAnalysis(nextMoves: Move[], analysis: PositionAnalysis, label = "\u5b9e\u65f6\u5c40\u9762") {
    const latestIndex = nextMoves.length - 1;
    if (latestIndex < 0) return nextMoves;
    return nextMoves.map((move, index) => {
      if (index !== latestIndex) return move;
      const grade = analysis.grade;
      const suggested = grade?.best ?? analysis.best;
      const terminalLabel = analysis.winner === "black" ? "\u9ed1\u65b9\u80dc\u5229" : "\u767d\u65b9\u80dc\u5229";
      const coach = grade
        ? coachForMove(latestIndex, move, grade.best, grade.penalty, {
            before: nextMoves.slice(0, -1),
            actualBlackWinRate: analysis.blackWinRate,
            actualMateIn: analysis.mateIn,
            actualPv: analysis.pv,
            bestBlackWinRate: grade.bestBlackWinRate,
            bestMateIn: grade.bestMateIn,
            bestPv: grade.bestPv,
          })
        : move.coach;
      return {
        ...move,
        score: analysis.blackWinRate,
        suggested: suggested
          ? [suggested.row, suggested.col] as [number, number]
          : undefined,
        loss: grade ? grade.penalty : move.loss,
        engineEvaluation: analysis.engineEvaluation,
        pv: analysis.pv ?? [],
        mateIn: analysis.mateIn,
        coach,
        label: coach?.title ?? (analysis.terminal
          ? terminalLabel
          : grade
            ? labelFor(grade.penalty)
            : label),
        note: coach?.summary ?? (analysis.terminal
          ? liveNote(analysis)
          : grade
            ? noteFor(latestIndex, move, grade.best, grade.penalty, {
                before: nextMoves.slice(0, -1),
                actualBlackWinRate: analysis.blackWinRate,
                actualMateIn: analysis.mateIn,
                actualPv: analysis.pv,
                bestBlackWinRate: grade.bestBlackWinRate,
                bestMateIn: grade.bestMateIn,
                bestPv: grade.bestPv,
              })
            : liveNote(analysis)),
      };
    });
  }

  async function analyzePosition(
    nextMoves: Move[],
    autoEngineReply: boolean,
    activeHumanSide: Stone = humanSide,
    recommended?: BoardPoint,
    gradeLastMove = autoEngineReply,
    releaseBoard = autoEngineReply,
  ) {
    const engineSide = otherSide(activeHumanSide);
    const requestId = liveRequest.current + 1;
    liveRequest.current = requestId;
    liveAbort.current?.abort();
    const controller = new AbortController();
    liveAbort.current = controller;
    if (autoEngineReply) {
      setEngineMessage(`Rapfi \u6b63\u5728\u8ba1\u7b97${sideName(engineSide)}\u6700\u4f73\u5e94\u624b...`);
    }
    else setEngineMessage("Rapfi \u6b63\u5728\u5206\u6790\u5f53\u524d\u5c40\u9762...");

    try {
      let analyzedMoves = nextMoves;
      const playedMove = gradeLastMove ? analyzedMoves.at(-1) : undefined;
      let analysis = await requestAnalysis(
        analyzedMoves,
        controller,
        Boolean(gradeLastMove && playedMove),
        recommended,
      );
      if (requestId !== liveRequest.current) return;
      const moveGrade = analysis.grade;
      analyzedMoves = applyAnalysis(analyzedMoves, analysis);
      setMoves(analyzedMoves);

      if (autoEngineReply && !analysis.terminal && analysis.next === engineSide && analysis.best) {
        const engineMove: Move = {
          row: analysis.best.row,
          col: analysis.best.col,
          score: analysis.blackWinRate,
          label: `Rapfi ${sideName(engineSide)}\u5e94\u624b`,
        };
        analyzedMoves = [...analyzedMoves, engineMove];
        setMoves(analyzedMoves);
        setStep(analyzedMoves.length - 1);
        setMessage(`Rapfi ${sideName(engineSide)}\u81ea\u52a8\u4e0b\u5728 ${coord(engineMove)}`);
        setEngineMessage(T.routeThinking);

        analysis = await requestAnalysis(analyzedMoves, controller, true, engineMove);
        if (requestId !== liveRequest.current) return;
        analyzedMoves = applyAnalysis(analyzedMoves, analysis, `Rapfi ${sideName(engineSide)}\u5e94\u624b`);
        setMoves(analyzedMoves);
      }

      const gradeStatus = moveGrade && moveGrade.penalty > 0
        ? ` \u00b7 \u4e0a\u4e00\u624b\u6263 ${moveGrade.penalty} \u5206`
        : "";
      const forcedWinner = forcedWinnerFor(analysis);
      if (analysis.terminal) {
        const winner = analysis.winner ? sideName(analysis.winner) : "";
        setEngineMessage(`${winner}\u5df2\u8fde\u6210\u4e94\u5b50`);
      } else if (forcedWinner) {
        setEngineMessage(`Rapfi \u5df2\u66f4\u65b0${gradeStatus} \u00b7 ${sideName(forcedWinner)}\u5fc5\u80dc \u00b7 ${(analysis.pv ?? []).length} \u624b\u540e\u7ec8\u5c40`);
      } else {
        setEngineMessage(`Rapfi \u5df2\u66f4\u65b0${gradeStatus} \u00b7 \u4e3b\u53d8 ${(analysis.pv ?? []).length} \u624b`);
      }
      const gradeNotice = moveGrade && moveGrade.penalty > 0 && playedMove
        ? `${coord(playedMove)} \u4e0d\u662f\u9996\u9009\uff0c\u6263 ${moveGrade.penalty} \u5206\uff0c\u5efa\u8bae ${coord(moveGrade.best)}\u3002`
        : "";
      setMessage(`${gradeNotice}${liveNote(analysis)}`);
    } catch (error) {
      if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) return;
      if (requestId !== liveRequest.current) return;
      setEngineMessage(T.offline);
      setMessage(error instanceof Error ? error.message : T.offline);
    } finally {
      if (requestId === liveRequest.current) {
        liveAbort.current = null;
        if (releaseBoard) {
          playLock.current = false;
          setAutoReplying(false);
        }
      }
    }
  }

  async function runReview() {
    if (!moves.length) {
      setMessage(T.noMoves);
      return;
    }
    cancelLiveAnalysis();
    setReviewing(true);
    setEngineMessage(T.reviewing);
    try {
      const response = await fetch(`${engineUrl}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moves: moves.map(({ row, col }) => ({ row, col })),
          timeoutMs: 650,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      const reviewed = body.review as Review[];
      const annotated = moves.map((move, index) => {
        const result = reviewed[index];
        const context: CoachingContext = {
          before: moves.slice(0, index),
          scoreBeforeBlack: index > 0 ? reviewed[index - 1].blackWinRate : 50,
          actualBlackWinRate: result.blackWinRate,
          actualMateIn: result.mateIn,
          actualPv: result.pv,
          bestBlackWinRate: result.bestBlackWinRate,
          bestMateIn: result.bestMateIn,
          bestPv: result.bestPv,
        };
        const coach = coachForMove(index, move, result.best, result.loss, context);
        return {
          ...move,
          score: result.blackWinRate,
          loss: result.loss,
          suggested: [result.best.row, result.best.col] as [number, number],
          engineEvaluation: result.engineEvaluation,
          pv: undefined,
          coach,
          label: coach.title,
          note: coach.summary,
        };
      });
      const worstIndex = annotated.reduce(
        (best, move, index) => move.loss! > annotated[best].loss! ? index : best,
        0,
      );
      setMoves(annotated);
      setStep(worstIndex);
      setMessage(`${T.done}\uff0c${annotated.length} ${T.moves}`);
      setEngineMessage(T.ready);
    } catch (error) {
      setEngineMessage(T.offline);
      setMessage(error instanceof Error ? error.message : T.offline);
    } finally {
      setReviewing(false);
    }
  }

  const nextStone = stoneFor(visible.length);
  const forcedRouteWinner = current?.mateIn
    ? (current.mateIn > 0 ? nextStone : otherSide(nextStone))
    : null;
  const turnText = mode === "demo"
    ? `${T.step} ${Math.max(step + 1, 0)} ${T.hand}`
    : autoReplying
      ? mode === "free"
        ? "Rapfi \u6b63\u5728\u5206\u6790\u4e0a\u4e00\u624b"
        : `Rapfi\uff08${sideName(nextStone)}\uff09\u601d\u8003\u4e2d`
      : mode === "free"
        ? `\u7531\u4f60\u843d${sideName(nextStone)}`
        : nextStone === humanSide
        ? `\u8f6e\u5230\u4f60\uff08${sideName(humanSide)}\uff09`
        : `\u7b49\u5f85 Rapfi\uff08${sideName(nextStone)}\uff09`;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">5</span>
          <span>{T.app}</span>
          <small>PV5.2</small>
        </div>
        <div className="top-actions">
          <input
            ref={fileInput}
            className="file-input"
            type="file"
            accept=".sgf,.renju,text/plain"
            onChange={importSgf}
          />
          <button className="text-button review-button" onClick={runReview} disabled={reviewing}>
            {reviewing ? "..." : T.review}
          </button>
          <button className="text-button engine-button" onClick={configureEngine}>Rapfi</button>
          <button className="text-button" onClick={() => fileInput.current?.click()}>{T.import}</button>
          <button className="text-button sample-button" onClick={resetDemo}>{T.sample}</button>
          <button className="primary-button" onClick={() => startManual()}>{T.create}</button>
        </div>
      </header>

      <section className="workspace">
        <section className="board-panel">
          <div className="board-header">
            <div>
              <p className="eyebrow">{mode === "demo" ? T.demo : mode === "free" ? "\u81ea\u7531\u590d\u76d8" : T.myGame}</p>
              <h1>{mode === "demo" ? "Black vs White" : mode === "free" ? "\u4f60\u64cd\u4f5c\u9ed1\u767d\u53cc\u65b9" : roleStatus(humanSide)}</h1>
              <p className="import-status">{message}</p>
            </div>
            <div className="board-controls">
              <div className="side-choice" role="group" aria-label="Choose play mode">
                <button
                  className={mode === "manual" && humanSide === "black" ? "active" : ""}
                  onClick={() => chooseSide("black")}
                  disabled={reviewing || autoReplying}
                >
                  {"\u5148\u624b\uff08\u9ed1\uff09"}
                </button>
                <button
                  className={mode === "manual" && humanSide === "white" ? "active" : ""}
                  onClick={() => chooseSide("white")}
                  disabled={reviewing || autoReplying}
                >
                  {"\u540e\u624b\uff08\u767d\uff09"}
                </button>
                <button
                  className={mode === "free" ? "active" : ""}
                  onClick={startFreeReview}
                  disabled={reviewing || autoReplying}
                >
                  {"\u81ea\u7531\u590d\u76d8"}
                </button>
              </div>
              <div className="turn-chip">
                <span className={`mini-stone ${nextStone}`} />
                {turnText}
              </div>
            </div>
          </div>

          <div className="board-wrap">
            <div className="rank-labels">
              {Array.from({ length: 15 }, (_, index) => <span key={index}>{index + 1}</span>)}
            </div>
            <div className="file-labels">
              {columns.map((letter) => <span key={letter}>{letter}</span>)}
            </div>
            <div className={`gomoku-board ${boardLocked ? "locked" : ""}`}>
              {Array.from({ length: 225 }, (_, index) => {
                const row = Math.floor(index / 15);
                const col = index % 15;
                const cellKey = `${row},${col}`;
                const moveIndex = visible.findIndex((move) => move.row === row && move.col === col);
                const hintIndex = primaryHint?.row === row && primaryHint?.col === col ? 0 : -1;
                const hintStone = hintIndex === 0 ? nextStone : null;
                const isCoachCurrent = moveIndex === coachIndex && cellKey === coachCurrentKey;
                const coachRelation = coachRelated.get(cellKey);
                const isCoachBest = moveIndex < 0 && cellKey === coachBestKey;
                const isDanger = moveIndex < 0 && coachDangerKeys.has(cellKey);
                const markerLabel = isCoachBest
                  ? "，教练推荐"
                  : isDanger
                    ? "，对手成五威胁"
                    : hintIndex >= 0
                      ? "，Rapfi 当前首选"
                      : "";
                const label = `${columns[col]}${row + 1}${markerLabel}`;
                return (
                  <button
                    key={`${row}-${col}`}
                    className="intersection"
                    aria-label={label}
                    onClick={() => place(row, col)}
                    disabled={boardLocked}
                  >
                    {moveIndex >= 0 && (
                      <span className={`stone ${stoneFor(moveIndex)} ${isCoachCurrent ? "current-move" : ""} ${coachRelation ? `coach-related ${coachRelation}` : ""}`}>
                        {moveIndex + 1}
                      </span>
                    )}
                    {isCoachBest && <span className="coach-point coach-best" aria-hidden="true" />}
                    {isDanger && <span className="coach-point coach-danger" aria-hidden="true" />}
                    {moveIndex < 0 && !isCoachBest && !isDanger && hintIndex >= 0 && hintStone && (
                      <span className={`stone pv-stone ${hintStone}`}>{hintIndex + 1}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="stepper">
            <button
              onClick={() => setStep(Math.max(-1, step - 1))}
              disabled={step < 0 || autoReplying}
              aria-label="Previous"
            >
              &larr;
            </button>
            <input
              aria-label="Review progress"
              type="range"
              min="-1"
              max={Math.max(moves.length - 1, -1)}
              value={step}
              onChange={(event) => setStep(Number(event.target.value))}
              disabled={autoReplying}
            />
            <button
              onClick={() => setStep(Math.min(moves.length - 1, step + 1))}
              disabled={step >= moves.length - 1 || autoReplying}
              aria-label="Next"
            >
              &rarr;
            </button>
          </div>
        </section>

        <aside className="analysis-panel">
          <section className="score-card">
            <div>
              <p className="eyebrow">{T.blackWin}</p>
              <strong>{score}%</strong>
              <p className={score >= 50 ? "good" : "warn"}>
                {score >= 50 ? "\u9ed1\u65b9\u5360\u4f18" : "\u767d\u65b9\u5360\u4f18"}
              </p>
            </div>
            <div className="score-ring" style={{ "--score": `${score}%` } as CSSProperties}>
              <span>{score}</span>
            </div>
          </section>

          <section className={`engine-status ${reviewing || autoReplying ? "busy" : ""}`}>
            {engineMessage}
          </section>

          <section className="pv-section">
            <div className="section-title">
              <h2>{forcedRouteWinner ? "\u5f3a\u5236\u80dc\u8def\u7ebf" : T.route}</h2>
              <span>{forcedRouteWinner
                ? `${sideName(forcedRouteWinner)}\u5fc5\u80dc \u00b7 ${principalVariation.length} \u624b`
                : principalVariation.length
                  ? `${principalVariation.length}/5`
                  : "AUTO"}</span>
            </div>
            {principalVariation.length ? (
              <>
                <div
                  className="pv-track"
                  style={{ gridTemplateColumns: `repeat(${principalVariation.length}, minmax(0, 1fr))` }}
                >
                  {principalVariation.map((move, index) => {
                    const side = stoneFor(visible.length + index);
                    return (
                      <div className="pv-step" key={`${move.row}-${move.col}-${index}`}>
                        <span className={`pv-route-stone ${side}`}>{index + 1}</span>
                        <b>{coord(move)}</b>
                        <small>{sideName(side)}</small>
                      </div>
                    );
                  })}
                </div>
                <p className="pv-notation">
                  {principalVariation.map((move, index) => `${index + 1}.${coord(move)}`).join(" \u2192 ")}
                </p>
              </>
            ) : (
              <p className="pv-empty">{autoReplying ? T.routeThinking : T.routePending}</p>
            )}
          </section>

          <section className="chart-section">
            <div className="section-title">
              <h2>{T.trend}</h2>
              <span>Rapfi</span>
            </div>
            <div className="chart">
              {moves.length > 1 && (
                <svg viewBox="0 0 300 104" preserveAspectRatio="none">
                  <path
                    className="area"
                    d={`M0,${100 - moves[0].score} ${moves.map((move, index) =>
                      `L${(index / (moves.length - 1)) * 300},${100 - move.score}`).join(" ")} L300,104 L0,104 Z`}
                  />
                  <polyline
                    points={moves.map((move, index) =>
                      `${(index / (moves.length - 1)) * 300},${100 - move.score}`).join(" ")}
                  />
                  {issues.map(({ index }) => (
                    <circle
                      key={index}
                      cx={(index / (moves.length - 1)) * 300}
                      cy={100 - moves[index].score}
                      r="4"
                    />
                  ))}
                </svg>
              )}
              <div className="chart-labels">
                <span>Start</span>
                <span>{T.step} {Math.max(step + 1, 0)}</span>
                <span>End</span>
              </div>
            </div>
          </section>

          <section className="coach-card" aria-live="polite">
            <p className="eyebrow">{T.coach}</p>
            {activeCoach ? (
              <>
                <div className="coach-move-row">
                  <h2>{sideName(activeCoach.movePlayer)} {coord(activeCoach.move)}</h2>
                  <strong className={`coach-impact ${activeCoach.scoreImpact > 0 ? "positive" : activeCoach.scoreImpact < 0 ? "negative" : "neutral"}`}>
                    {coachScoreText(activeCoach.scoreImpact)}
                  </strong>
                </div>
                <div className={`coach-category ${activeCoach.severity}`}>{activeCoach.title}</div>
                <p className="coach-explanation" title={activeCoach.summary}>
                  {activeCoach.summary}
                </p>
                <button
                  className="why-button"
                  type="button"
                  aria-expanded={coachExpanded}
                  onClick={() => setExpandedCoachIndex((expanded) => expanded === coachIndex ? null : coachIndex)}
                >
                  {coachExpanded ? "\u6536\u8d77\u5206\u6790" : "\u4e3a\u4ec0\u4e48\uff1f"}
                </button>
                {coachExpanded && (
                  <div className="coach-details">
                    <div><b>{"\u843d\u5b50\u524d"}</b>{activeCoach.details.before.map((text, index) => <p key={`before-${index}`}>{text}</p>)}</div>
                    <div><b>{"\u672c\u624b"}</b>{activeCoach.details.move.map((text, index) => <p key={`move-${index}`}>{text}</p>)}</div>
                    <div><b>{"\u5c40\u9762\u53d8\u5316"}</b>{activeCoach.details.effect.map((text, index) => <p key={`effect-${index}`}>{text}</p>)}</div>
                    <div><b>{"\u63a8\u8350"}</b>{activeCoach.details.recommendation.map((text, index) => <p key={`recommendation-${index}`}>{text}</p>)}</div>
                    <div><b>{"\u7ed3\u8bba"}</b>{activeCoach.details.conclusion.map((text, index) => <p key={`conclusion-${index}`}>{text}</p>)}</div>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2>{coachMove?.label ?? "\u5173\u6ce8\u5bf9\u624b\u6700\u5feb\u7684\u5a01\u80c1"}</h2>
                <p className="coach-explanation" title={coachMove?.note ?? T.stable}>{coachMove?.note ?? T.stable}</p>
              </>
            )}
          </section>

          <section className="issues-section">
            <div className="section-title">
              <h2>{T.issues}</h2>
              <span>{issues.length}</span>
            </div>
            <div className="issue-list">
              {issues.length ? issues.map(({ move, index, loss }) => (
                <button
                  key={index}
                  className="issue"
                  title={move.note}
                  onClick={() => setStep(index)}
                >
                  <span className="move-no">#{index + 1}</span>
                  <span className="issue-copy">
                    <b>{coord(move)}</b>
                    <small>{move.label ?? "\u5c40\u9762\u53d8\u5316"}</small>
                  </span>
                  <span className="drop">{"\u6263"} {loss} {"\u5206"}</span>
                </button>
              )) : (
                <p className="empty">{"\u6682\u65e0\u6263\u5206\u624b\u3002"}</p>
              )}
            </div>
          </section>
        </aside>
      </section>

      <footer>{T.footer}</footer>
    </main>
  );
}
