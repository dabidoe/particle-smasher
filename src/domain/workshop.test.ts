import { describe, expect, test } from "vitest";
import { craftWorkshopItem } from "./workshop";

describe("craftWorkshopItem", () => {
  test("crafts a water cannon when there is enough water", () => {
    const result = craftWorkshopItem("waterCannon", { water: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.recipe.result).toEqual({ kind: "tower", id: "waterCannon" });
      expect(result.consumed).toEqual({ water: 1 });
    }
  });

  test("fails when there is not enough water", () => {
    const result = craftWorkshopItem("waterCannon", { water: 0 });
    expect(result.success).toBe(false);
  });

  test("fails for an unknown recipe id", () => {
    const result = craftWorkshopItem("nonsense", { water: 5 });
    expect(result.success).toBe(false);
  });

  test("crafts the tower upgrade recipe", () => {
    const result = craftWorkshopItem("waterCannonMk2", { water: 1 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.recipe.result.kind).toBe("towerUpgrade");
  });

  test("crafts the Robby upgrade recipe", () => {
    const result = craftWorkshopItem("robbyUpgrade", { water: 1 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.recipe.result.kind).toBe("robbyUpgrade");
  });
});
