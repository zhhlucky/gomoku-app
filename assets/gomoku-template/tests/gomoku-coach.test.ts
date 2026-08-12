import assert from "node:assert/strict";
import test from "node:test";
import {
  createGomokuCoach,
  type BoardPoint,
  type GomokuCoachInput,
  type PlacedStone,
  type Stone,
} from "../app/gomoku-coach.ts";

const columns = "ABCDEFGHIJKLMNO";

function point(value: string): BoardPoint {
  const match = value.match(/^([A-O])(1[0-5]|[1-9])$/);
  if (!match) throw new Error(`Invalid test coordinate: ${value}`);
  return { col: columns.indexOf(match[1]), row: Number(match[2]) - 1 };
}

function stones(side: Stone, values: string[]): PlacedStone[] {
  return values.map((value) => ({ ...point(value), side }));
}

function coach(overrides: Partial<GomokuCoachInput> & Pick<GomokuCoachInput, "movePlayer" | "move">) {
  return createGomokuCoach({
    movesBefore: [],
    bestMove: overrides.move,
    loss: 0,
    scoreBeforeBlack: 50,
    scoreAfterBlack: 50,
    ...overrides,
  });
}

function assertNarratesLastMover(result: ReturnType<typeof createGomokuCoach>, side: Stone) {
  const expected = side === "black" ? "黑方这一步" : "白方这一步";
  const forbidden = side === "black" ? "白方这一步" : "黑方这一步";
  assert.equal(result.movePlayer, side);
  assert.ok(result.summary.startsWith(expected), result.summary);
  assert.ok(!result.summary.startsWith(forbidden), result.summary);
}

test("black good move: identifies an open three from the real board", () => {
  const result = coach({
    movePlayer: "black",
    movesBefore: stones("black", ["F8", "G8"]),
    move: point("H8"),
    bestMove: point("H8"),
    scoreAfterBlack: 58,
  });
  assertNarratesLastMover(result, "black");
  assert.equal(result.category, "STRONG_ATTACK");
  assert.equal(result.createdThreat, "OPEN_THREE");
  assert.match(result.summary, /活三/);
  assert.ok(result.scoreImpact > 0);
});

test("white good move: explanation stays on the white side", () => {
  const result = coach({
    movePlayer: "white",
    movesBefore: stones("white", ["F8", "G8"]),
    move: point("H8"),
    bestMove: point("H8"),
    scoreBeforeBlack: 50,
    scoreAfterBlack: 40,
  });
  assertNarratesLastMover(result, "white");
  assert.equal(result.createdThreat, "OPEN_THREE");
  assert.match(result.summary, /白方这一步很好/);
});

for (const side of ["black", "white"] as const) {
  test(`${side} direct five is reported as a win`, () => {
    const result = coach({
      movePlayer: side,
      movesBefore: stones(side, ["C8", "D8", "E8", "F8"]),
      move: point("G8"),
      bestMove: point("G8"),
      scoreAfterBlack: side === "black" ? 100 : 0,
    });
    assertNarratesLastMover(result, side);
    assert.equal(result.category, "WIN");
    assert.equal(result.createdThreat, "FIVE");
    assert.match(result.summary, /已经获胜/);
  });
}

test("rush four and open four are distinguished by the blocked end", () => {
  const rush = coach({
    movePlayer: "black",
    movesBefore: [...stones("black", ["C8", "D8", "E8"]), ...stones("white", ["B8"])],
    move: point("F8"),
    bestMove: point("F8"),
  });
  const open = coach({
    movePlayer: "black",
    movesBefore: stones("black", ["C8", "D8", "E8"]),
    move: point("F8"),
    bestMove: point("F8"),
  });
  assert.equal(rush.createdThreat, "RUSH_FOUR");
  assert.equal(open.createdThreat, "OPEN_FOUR");
  assert.match(rush.summary, /冲四/);
  assert.match(open.summary, /活四/);
});

test("two open threes created by one move become a double threat", () => {
  const result = coach({
    movePlayer: "black",
    movesBefore: stones("black", ["F8", "G8", "H6", "H7"]),
    move: point("H8"),
    bestMove: point("H8"),
    scoreAfterBlack: 72,
  });
  assert.equal(result.category, "DOUBLE_THREAT");
  assert.equal(result.createdThreat, "DOUBLE_THREE");
  assert.match(result.summary, /两个方向/);
  assert.ok(result.markers.relatedStones.length >= 5);
});

test("black missed defense outranks its own small attack", () => {
  const result = coach({
    movePlayer: "black",
    movesBefore: [
      ...stones("white", ["C8", "D8", "E8", "F8"]),
      ...stones("black", ["B8", "F1", "G1"]),
    ],
    move: point("H1"),
    bestMove: point("G8"),
    loss: 72,
    scoreAfterBlack: 4,
  });
  assertNarratesLastMover(result, "black");
  assert.equal(result.category, "MISSED_DEFENSE");
  assert.equal(result.createdThreat, "OPEN_THREE");
  assert.deepEqual(result.markers.dangerPoints, [point("G8")]);
  assert.match(result.summary, /白方.*直接成五/);
});

test("white missed defense is explained from white's point of view", () => {
  const result = coach({
    movePlayer: "white",
    movesBefore: [
      ...stones("black", ["C8", "D8", "E8", "F8"]),
      ...stones("white", ["B8"]),
    ],
    move: point("A1"),
    bestMove: point("G8"),
    loss: 80,
    scoreAfterBlack: 98,
  });
  assertNarratesLastMover(result, "white");
  assert.equal(result.category, "MISSED_DEFENSE");
  assert.match(result.summary, /黑方.*直接成五/);
});

test("a required block is recognized before positional scoring", () => {
  const result = coach({
    movePlayer: "black",
    movesBefore: [
      ...stones("white", ["C8", "D8", "E8", "F8"]),
      ...stones("black", ["B8"]),
    ],
    move: point("G8"),
    bestMove: point("G8"),
    scoreAfterBlack: 45,
  });
  assert.equal(result.category, "NECESSARY_DEFENSE");
  assert.equal(result.defendedThreat, true);
  assert.equal(result.evidence.opponentWinningPointsAfter.length, 0);
  assert.match(result.summary, /封住了白方/);
});

test("a block that also builds a line is attack and defense", () => {
  const result = coach({
    movePlayer: "black",
    movesBefore: [
      ...stones("white", ["C8", "D8", "E8", "F8"]),
      ...stones("black", ["B8", "H8", "I8"]),
    ],
    move: point("G8"),
    bestMove: point("G8"),
    scoreAfterBlack: 55,
  });
  assert.equal(result.category, "ATTACK_DEFENSE");
  assert.equal(result.defendedThreat, true);
  assert.equal(result.createdThreat, "SLEEP_THREE");
  assert.match(result.summary, /同时/);
});

test("missing an immediate own win is more serious than making another move", () => {
  const result = coach({
    movePlayer: "black",
    movesBefore: [...stones("black", ["C8", "D8", "E8", "F8"]), ...stones("white", ["B8"])],
    move: point("A1"),
    bestMove: point("G8"),
    loss: 90,
    scoreAfterBlack: 12,
  });
  assert.equal(result.category, "MISSED_WIN");
  assert.deepEqual(result.evidence.ownWinningPointsBefore, [point("G8")]);
  assert.match(result.summary, /直接成五点/);
});

test("a tiny score movement without a pattern remains an ordinary move", () => {
  const result = coach({
    movePlayer: "black",
    move: point("H8"),
    bestMove: point("H8"),
    scoreBeforeBlack: 52,
    scoreAfterBlack: 53,
  });
  assert.equal(result.category, "NORMAL_MOVE");
  assert.equal(result.scoreImpact, 0);
  assert.match(result.summary, /局面变化不大/);
});

test("an isolated bad move is tied to the real main-board distance", () => {
  const result = coach({
    movePlayer: "black",
    movesBefore: [...stones("black", ["H8"]), ...stones("white", ["I8"])],
    move: point("A1"),
    bestMove: point("H7"),
    loss: 35,
    scoreAfterBlack: 30,
  });
  assert.equal(result.category, "IRRELEVANT");
  assert.equal(result.scoreImpact, -35);
  assert.match(result.summary, /主战场较远/);
});

test("best move equality and inequality produce different recommendations", () => {
  const exact = coach({ movePlayer: "black", move: point("H8"), bestMove: point("H8") });
  const different = coach({
    movePlayer: "black",
    movesBefore: stones("black", ["H8"]),
    move: point("H9"),
    bestMove: point("I8"),
    loss: 6,
  });
  assert.equal(exact.markers.best, null);
  assert.ok(!exact.summary.includes("更好的选择"));
  assert.deepEqual(different.markers.best, point("I8"));
  assert.match(different.summary, /更好的选择是 I8/);
});

test("renju mode rejects a black double three instead of praising it", () => {
  const result = coach({
    movePlayer: "black",
    movesBefore: stones("black", ["F8", "G8", "H6", "H7"]),
    move: point("H8"),
    bestMove: point("H8"),
    rules: "renju",
  });
  assert.equal(result.category, "FORBIDDEN");
  assert.match(result.summary, /禁手规则/);
});

test("a Rapfi-confirmed forced win takes priority over ordinary pattern wording", () => {
  const result = coach({
    movePlayer: "black",
    movesBefore: stones("black", ["F8", "G8"]),
    move: point("H8"),
    bestMove: point("H8"),
    actualMateIn: -7,
    scoreAfterBlack: 96,
  });
  assert.equal(result.category, "FORCED_WIN");
  assert.match(result.summary, /约 7 手内/);
});

test("a Rapfi-confirmed forced loss is not softened into a normal score drop", () => {
  const result = coach({
    movePlayer: "white",
    movesBefore: [...stones("black", ["H8", "I8"]), ...stones("white", ["H9"])],
    move: point("A1"),
    bestMove: point("G8"),
    loss: 60,
    actualMateIn: 9,
    scoreAfterBlack: 99,
  });
  assertNarratesLastMover(result, "white");
  assert.equal(result.category, "FORCED_LOSS");
  assert.match(result.summary, /约 9 手的强制胜路/);
});
