import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { basename, dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const engineDirectory = join(here, "rapfi-engine");
const platformEngines = process.platform === "win32"
  ? ["pbrain-rapfi-windows-avx2.exe", "pbrain-rapfi-windows-sse.exe"]
  : process.platform === "linux"
    ? ["pbrain-rapfi-linux-clang-avx2", "pbrain-rapfi-linux-clang-sse"]
    : ["pbrain-rapfi-macos-apple-silicon"];
const configuredEngine = process.env.RAPFI_BINARY;
const preferredEnginePath = join(engineDirectory, configuredEngine || platformEngines[0]);
const fallbackEnginePath = platformEngines[1] ? join(engineDirectory, platformEngines[1]) : null;
let activeEnginePath = preferredEnginePath;
const WIN_VALUE = 10000;
const RAPFI_WINRATE_SCALE = 200;
const PRINCIPAL_VARIATION_LENGTH = 5;

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type",
  });
  response.end(JSON.stringify(data));
}

function askEngineOnce(enginePath, moves, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(enginePath, [], { cwd: engineDirectory, windowsHide: true });
    let output = "";
    let settled = false;
    const finish = (callback) => (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback(value);
    };
    const timer = setTimeout(() => {
      child.kill();
      finish(reject)(new Error("Rapfi analysis timed out"));
    }, timeoutMs + 4000);

    child.stdout.on("data", (chunk) => { output += chunk.toString(); });
    child.stderr.on("data", (chunk) => { output += chunk.toString(); });
    child.on("error", finish(reject));
    child.on("close", finish(() => {
      const lines = output.trim().split(/\r?\n/);
      const coordinate = [...lines].reverse().find((line) => /^\d+,\d+$/.test(line.trim()));
      const messageEval = [...output.matchAll(/MESSAGE[^\r\n]*\bEval\s+([+-]?M\d+|-?\d+)/g)].at(-1);
      const infoEval = [...output.matchAll(/INFO EVAL\s+([+-]?M\d+|-?\d+)/g)].at(-1);
      const infoWinRate = [...output.matchAll(/INFO WINRATE\s+([01](?:\.\d+)?)/g)].at(-1);
      const bestLine = [...output.matchAll(/(?:^|\r?\n)INFO BESTLINE\s+([^\r\n]+)/g)].at(-1);
      const evaluationToken = messageEval?.[1] ?? infoEval?.[1] ?? null;
      const mate = evaluationToken?.match(/^([+-]?)M(\d+)$/);
      const mateIn = mate ? (mate[1] === "-" ? -1 : 1) * Number(mate[2]) : null;
      const evaluation = mateIn !== null
        ? Math.sign(mateIn) * (WIN_VALUE - Math.min(Math.abs(mateIn), 999))
        : evaluationToken !== null
          ? Number(evaluationToken)
          : null;
      const sideWinRate = infoWinRate ? Math.round(Number(infoWinRate[1]) * 100) : null;
      if (!coordinate) return reject(new Error("Rapfi did not return a legal move"));
      const [col, row] = coordinate.split(",").map(Number);
      const pv = bestLine
        ? (bestLine[1].match(/\d+,\d+/g) ?? []).map((point) => {
            const [pvCol, pvRow] = point.split(",").map(Number);
            return { row: pvRow, col: pvCol };
          })
        : [];
      resolve({ row, col, evaluation, mateIn, sideWinRate, pv });
    }));

    const board = moves.map((move, index) => `${move.col},${move.row},${index % 2 ? 2 : 1}`);
    child.stdin.end(["START 15", `INFO timeout_turn ${timeoutMs}`, "INFO show_detail 2", "BOARD", ...board, "DONE", "END"].join("\n") + "\n");
  });
}

async function askEngine(moves, timeoutMs) {
  try {
    return await askEngineOnce(activeEnginePath, moves, timeoutMs);
  } catch (error) {
    if (!fallbackEnginePath || activeEnginePath === fallbackEnginePath || configuredEngine) throw error;
    activeEnginePath = fallbackEnginePath;
    return askEngineOnce(activeEnginePath, moves, timeoutMs);
  }
}

function nextSideIsBlack(moves) {
  return moves.length % 2 === 0;
}

function winnerFor(moves) {
  const board = Array.from({ length: 15 }, () => Array(15).fill(null));
  for (let index = 0; index < moves.length; index += 1) {
    const move = moves[index];
    if (!Number.isInteger(move.row) || !Number.isInteger(move.col) || move.row < 0 || move.row >= 15 || move.col < 0 || move.col >= 15) continue;
    board[move.row][move.col] = index % 2 === 0 ? "black" : "white";
  }

  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let row = 0; row < 15; row += 1) {
    for (let col = 0; col < 15; col += 1) {
      const stone = board[row][col];
      if (!stone) continue;
      for (const [rowDelta, colDelta] of directions) {
        let length = 1;
        for (let offset = 1; offset < 5; offset += 1) {
          const nextRow = row + rowDelta * offset;
          const nextCol = col + colDelta * offset;
          if (nextRow < 0 || nextRow >= 15 || nextCol < 0 || nextCol >= 15 || board[nextRow][nextCol] !== stone) break;
          length += 1;
        }
        if (length >= 5) return stone;
      }
    }
  }
  return null;
}

function toBlackWinRate(evaluation, nextSideIsBlack) {
  if (evaluation === null) return 50;
  const blackEvaluation = nextSideIsBlack ? evaluation : -evaluation;
  return Math.round(100 / (1 + Math.exp(-blackEvaluation / RAPFI_WINRATE_SCALE)));
}

function terminalScore(winner, moves) {
  const blackWon = winner === "black";
  const nextBlack = nextSideIsBlack(moves);
  return {
    terminal: true,
    winner,
    next: null,
    best: null,
    pv: [],
    mateIn: null,
    blackWinRate: blackWon ? 100 : 0,
    engineEvaluation: blackWon === nextBlack ? WIN_VALUE : -WIN_VALUE,
  };
}

function samePoint(left, right) {
  return left?.row === right?.row && left?.col === right?.col;
}

function legalPrincipalVariation(moves, candidates, limit = PRINCIPAL_VARIATION_LENGTH) {
  const occupied = new Set(moves.map((move) => `${move.row},${move.col}`));
  const line = [];

  for (const move of candidates) {
    if (line.length >= limit) break;
    if (!Number.isInteger(move?.row) || !Number.isInteger(move?.col)) break;
    if (move.row < 0 || move.row >= 15 || move.col < 0 || move.col >= 15) break;
    const key = `${move.row},${move.col}`;
    if (occupied.has(key)) break;
    occupied.add(key);
    line.push({ row: move.row, col: move.col });
    if (winnerFor([...moves, ...line])) break;
  }

  return line;
}

function isLegalMove(moves, move) {
  return legalPrincipalVariation(moves, [move], 1).length === 1;
}

function winChanceForSide(analysis, side) {
  return side === "black" ? analysis.blackWinRate : 100 - analysis.blackWinRate;
}

function chebyshevDistance(left, right) {
  return Math.max(Math.abs(left.row - right.row), Math.abs(left.col - right.col));
}

function positionalDeviation(before, best, actual) {
  const center = { row: 7, col: 7 };
  const distanceFromBest = chebyshevDistance(best, actual);
  const nearestDistance = (point) => before.length
    ? Math.min(...before.map((move) => chebyshevDistance(point, move)))
    : chebyshevDistance(point, center);
  const isolationGap = Math.max(0, nearestDistance(actual) - nearestDistance(best));
  const openingWeight = Math.max(0, (10 - before.length) / 10);
  const centerGap = Math.max(0, chebyshevDistance(actual, center) - chebyshevDistance(best, center));

  return Math.min(70, Math.round(
    distanceFromBest * 4
    + isolationGap * 6
    + centerGap * 4 * openingWeight,
  ));
}

function movePenalty(bestLine, actualLine, mover, sameMove, before, best, actual) {
  if (sameMove) return 0;
  const chanceDrop = Math.max(0, winChanceForSide(bestLine, mover) - winChanceForSide(actualLine, mover));
  const evaluationLoss = bestLine.engineEvaluation === null || actualLine.engineEvaluation === null
    ? 0
    : Math.max(0, actualLine.engineEvaluation - bestLine.engineEvaluation);
  const evaluationPenalty = 100 * (1 - Math.exp(-evaluationLoss / 450));
  const positionPenalty = positionalDeviation(before, best, actual);
  return Math.max(1, Math.min(100, Math.round(Math.max(chanceDrop, evaluationPenalty, positionPenalty))));
}

async function scorePosition(moves, timeoutMs) {
  const winner = winnerFor(moves);
  if (winner) return terminalScore(winner, moves);

  const engine = await askEngine(moves, timeoutMs);
  const best = { row: engine.row, col: engine.col };
  const candidates = samePoint(engine.pv[0], best) ? engine.pv : [best];
  return {
    terminal: false,
    winner: null,
    next: nextSideIsBlack(moves) ? "black" : "white",
    best,
    pv: legalPrincipalVariation(moves, candidates),
    mateIn: engine.mateIn,
    blackWinRate: toBlackWinRate(engine.evaluation, nextSideIsBlack(moves)),
    engineEvaluation: engine.evaluation,
  };
}

async function analyzePosition(moves, timeoutMs) {
  const analysis = await scorePosition(moves, timeoutMs);
  if (analysis.terminal) return analysis;

  const pv = [...analysis.pv];
  while (pv.length < PRINCIPAL_VARIATION_LENGTH && !winnerFor([...moves, ...pv])) {
    const branch = [...moves, ...pv];
    const continuation = await askEngine(branch, Math.max(180, Math.min(timeoutMs, 420)));
    const nextBest = { row: continuation.row, col: continuation.col };
    const candidates = samePoint(continuation.pv[0], nextBest) ? continuation.pv : [nextBest];
    const extension = legalPrincipalVariation(branch, candidates, PRINCIPAL_VARIATION_LENGTH - pv.length);
    if (!extension.length) break;
    pv.push(...extension);
  }

  return { ...analysis, best: pv[0] ?? analysis.best, pv };
}

async function analyzeWithGrade(moves, recommended, timeoutMs) {
  const analysisPromise = analyzePosition(moves, timeoutMs);
  if (!moves.length) return analysisPromise;

  const before = moves.slice(0, -1);
  if (winnerFor(before)) return analysisPromise;
  const actualMove = moves.at(-1);
  let best = isLegalMove(before, recommended) ? { row: recommended.row, col: recommended.col } : null;
  if (!best) {
    const engine = await askEngine(before, timeoutMs);
    best = { row: engine.row, col: engine.col };
  }

  const sameMove = samePoint(actualMove, best);
  if (sameMove) {
    const analysis = await analysisPromise;
    return {
      ...analysis,
      grade: {
        best,
        penalty: 0,
        bestBlackWinRate: analysis.blackWinRate,
        bestEngineEvaluation: analysis.engineEvaluation,
        bestMateIn: analysis.mateIn,
        bestPv: analysis.pv,
      },
    };
  }

  const [analysis, bestLine] = await Promise.all([
    analysisPromise,
    scorePosition([...before, best], timeoutMs),
  ]);
  const mover = nextSideIsBlack(before) ? "black" : "white";
  return {
    ...analysis,
    grade: {
      best,
      penalty: movePenalty(bestLine, analysis, mover, false, before, best, actualMove),
      bestBlackWinRate: bestLine.blackWinRate,
      bestEngineEvaluation: bestLine.engineEvaluation,
      bestMateIn: bestLine.mateIn,
      bestPv: bestLine.pv,
    },
  };
}

async function reviewGame(moves, timeoutMs) {
  const reviewed = [];
  for (let index = 0; index < moves.length; index += 1) {
    const before = moves.slice(0, index);
    const actualMove = moves[index];
    const existingWinner = winnerFor(before);
    if (existingWinner) {
      const terminal = terminalScore(existingWinner, before);
      reviewed.push({
        index,
        actual: actualMove,
        best: actualMove,
        loss: 0,
        blackWinRate: terminal.blackWinRate,
        engineEvaluation: terminal.engineEvaluation,
      });
      continue;
    }

    const bestMove = await askEngine(before, timeoutMs);
    const bestLine = await scorePosition([...before, { row: bestMove.row, col: bestMove.col }], timeoutMs);
    const sameMove = actualMove.row === bestMove.row && actualMove.col === bestMove.col;
    const actualLine = sameMove ? bestLine : await scorePosition([...before, actualMove], timeoutMs);
    const mover = nextSideIsBlack(before) ? "black" : "white";
    const loss = movePenalty(bestLine, actualLine, mover, sameMove, before, bestMove, actualMove);
    reviewed.push({
      index,
      actual: actualMove,
      best: { row: bestMove.row, col: bestMove.col },
      loss: sameMove ? 0 : loss,
      blackWinRate: actualLine.blackWinRate,
      engineEvaluation: actualLine.engineEvaluation,
      mateIn: actualLine.mateIn,
      pv: actualLine.pv,
      bestBlackWinRate: bestLine.blackWinRate,
      bestEngineEvaluation: bestLine.engineEvaluation,
      bestMateIn: bestLine.mateIn,
      bestPv: bestLine.pv,
    });
  }
  return reviewed;
}

const server = createServer((request, response) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type" });
    return response.end();
  }
  if (request.method === "GET" && request.url === "/health") return sendJson(response, 200, {
    ok: true,
    engine: "Rapfi 0.43.01",
    engineBinary: basename(activeEnginePath),
    apiVersion: "pv5.2",
  });
  if (request.method !== "POST" || !["/analyze", "/evaluate", "/best-move", "/review"].includes(request.url)) return sendJson(response, 404, { error: "Not found" });

  let raw = "";
  request.on("data", (chunk) => { raw += chunk; });
  request.on("end", async () => {
    try {
      const { moves = [], timeoutMs = 180, recommended = null, gradeLastMove = false } = JSON.parse(raw);
      if (!Array.isArray(moves) || moves.length > 100) throw new Error("Moves must contain 0 to 100 positions");
      const time = Math.max(50, Math.min(Number(timeoutMs), 3000));
      const data = request.url === "/review"
        ? { review: await reviewGame(moves, time) }
        : request.url === "/analyze"
          ? gradeLastMove
            ? await analyzeWithGrade(moves, recommended, time)
            : await analyzePosition(moves, time)
          : request.url === "/evaluate"
            ? await scorePosition(moves, time)
          : await askEngine(moves, time);
      sendJson(response, 200, data);
    } catch (error) {
      sendJson(response, 400, { error: error instanceof Error ? error.message : "Analysis failed" });
    }
  });
});
const host = process.env.RAPFI_HOST || "127.0.0.1";
const port = Number(process.env.RAPFI_PORT || 8795);
server.listen(port, host, () => console.log(`Rapfi bridge listening on http://${host}:${port}`));
