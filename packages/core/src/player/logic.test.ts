import { describe, expect, it } from "vitest";
import type { Song } from "../types";
import {
  RESTART_THRESHOLD_SEC,
  buildShuffledQueue,
  crossedMilestones,
  formatTime,
  isSkip,
  resolveEnded,
  resolveNext,
  resolvePrevious,
  shuffleArray,
} from "./logic";

const song = (id: string): Song => ({
  id,
  slug: id,
  title: id.toUpperCase(),
  description: "",
  mp3Url: `https://example.test/${id}.mp3`,
  coverArtUrl: "",
  lyrics: "",
  labels: [],
  tags: [],
  published: true,
  createdAt: "2026-01-01 00:00:00",
});

const [a, b, c] = [song("a"), song("b"), song("c")];
const queue = [a, b, c];

describe("resolveEnded", () => {
  it("advances to the next track mid-queue", () => {
    expect(resolveEnded(queue, "a", "all")).toEqual({ action: "play", song: b });
  });

  it("wraps to the first track on the last one when repeat=all", () => {
    expect(resolveEnded(queue, "c", "all")).toEqual({ action: "play", song: a });
  });

  it("stops on the last track when repeat=off", () => {
    expect(resolveEnded(queue, "c", "off")).toEqual({ action: "stop" });
  });

  it("still advances mid-queue when repeat=off", () => {
    expect(resolveEnded(queue, "a", "off")).toEqual({ action: "play", song: b });
  });

  it("restarts rather than advancing when repeat=one", () => {
    // Guards the regression where native looping is used instead: that would
    // suppress the end event and never re-fire song_complete.
    expect(resolveEnded(queue, "a", "one")).toEqual({ action: "restart" });
    expect(resolveEnded(queue, "c", "one")).toEqual({ action: "restart" });
  });

  it("stops on an empty queue or an unknown current track", () => {
    expect(resolveEnded([], "a", "all")).toEqual({ action: "stop" });
    expect(resolveEnded(queue, "missing", "all")).toEqual({ action: "stop" });
    expect(resolveEnded(queue, undefined, "all")).toEqual({ action: "stop" });
  });
});

describe("resolveNext", () => {
  it("advances mid-queue", () => {
    expect(resolveNext(queue, "a", "off")).toBe(b);
  });

  it("wraps from the last track when repeat is on", () => {
    expect(resolveNext(queue, "c", "all")).toBe(a);
    // An explicit next under repeat=one means "move on", not "replay".
    expect(resolveNext(queue, "c", "one")).toBe(a);
  });

  it("returns null past the end when repeat=off", () => {
    expect(resolveNext(queue, "c", "off")).toBeNull();
  });
});

describe("resolvePrevious", () => {
  it("restarts when past the threshold", () => {
    expect(resolvePrevious(queue, "b", RESTART_THRESHOLD_SEC + 0.1)).toEqual({
      action: "restart",
    });
  });

  it("steps back when before the threshold", () => {
    expect(resolvePrevious(queue, "b", 1)).toEqual({ action: "play", song: a });
  });

  it("does nothing on the first track before the threshold", () => {
    expect(resolvePrevious(queue, "a", 1)).toEqual({ action: "none" });
  });

  it("restarts on the first track past the threshold", () => {
    expect(resolvePrevious(queue, "a", 10)).toEqual({ action: "restart" });
  });
});

describe("buildShuffledQueue", () => {
  it("pins the current track first and keeps every track exactly once", () => {
    const out = buildShuffledQueue(queue, b);
    expect(out[0]).toBe(b);
    expect(out).toHaveLength(3);
    expect(new Set(out.map((s) => s.id))).toEqual(new Set(["a", "b", "c"]));
  });

  it("handles no current track", () => {
    expect(buildShuffledQueue(queue, null)).toHaveLength(3);
  });

  it("does not mutate its input", () => {
    const original = [...queue];
    buildShuffledQueue(queue, a);
    expect(queue).toEqual(original);
  });
});

describe("shuffleArray", () => {
  it("preserves length and membership", () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffleArray(input);
    expect(out).toHaveLength(5);
    expect([...out].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("crossedMilestones", () => {
  it("reports only milestones not already fired", () => {
    expect(crossedMilestones(0.3, new Set())).toEqual([25]);
    expect(crossedMilestones(0.8, new Set([25, 50]))).toEqual([75]);
    expect(crossedMilestones(0.8, new Set([25, 50, 75]))).toEqual([]);
  });

  it("reports every milestone crossed at once after a forward seek", () => {
    expect(crossedMilestones(0.99, new Set())).toEqual([25, 50, 75]);
  });

  it("reports nothing early in the track", () => {
    expect(crossedMilestones(0.1, new Set())).toEqual([]);
  });
});

describe("isSkip", () => {
  it("counts leaving mid-track as a skip", () => {
    expect(isSkip(0.4)).toBe(true);
  });

  it("does not count the very start or a near-complete play", () => {
    expect(isSkip(0.01)).toBe(false);
    expect(isSkip(0.99)).toBe(false);
  });
});

describe("formatTime", () => {
  it("formats mm:ss and pads seconds", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(5)).toBe("0:05");
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(196.3)).toBe("3:16");
  });

  it("survives NaN and the not-yet-loaded state", () => {
    expect(formatTime(NaN)).toBe("0:00");
    expect(formatTime(undefined as unknown as number)).toBe("0:00");
  });
});
