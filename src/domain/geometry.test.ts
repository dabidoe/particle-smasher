import { describe, expect, test } from "vitest";
import { distance, lerp2, stepToward } from "./geometry";

describe("distance", () => {
  test("computes straight-line distance", () => {
    expect(distance([0, 0], [3, 4])).toBe(5);
  });
});

describe("lerp2", () => {
  test("interpolates halfway between two points", () => {
    expect(lerp2([0, 0], [10, 0], 0.5)).toEqual([5, 0]);
  });
  test("returns start point at t=0 and end point at t=1", () => {
    expect(lerp2([1, 1], [5, 9], 0)).toEqual([1, 1]);
    expect(lerp2([1, 1], [5, 9], 1)).toEqual([5, 9]);
  });
});

describe("stepToward", () => {
  test("moves partway when speed*dt is less than the distance", () => {
    const result = stepToward([0, 0], [10, 0], 2, 1);
    expect(result).toEqual([2, 0]);
  });
  test("reaches the target exactly when speed*dt covers the distance", () => {
    const result = stepToward([0, 0], [10, 0], 20, 1);
    expect(result).toEqual([10, 0]);
  });
  test("stops short by stopDistance and does not overshoot", () => {
    const result = stepToward([0, 0], [10, 0], 20, 1, 2);
    expect(result).toEqual([8, 0]);
  });
  test("returns the current position unchanged when already within stopDistance", () => {
    const result = stepToward([9, 0], [10, 0], 5, 1, 2);
    expect(result).toEqual([9, 0]);
  });
});
