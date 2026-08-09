import { describe, expect, test } from "vitest";
import { payBounty, resolveToll } from "./economy";

describe("payBounty", () => {
  test("adds the amount to cash", () => {
    expect(payBounty({ cash: 10 }, 5)).toEqual({ cash: 15 });
  });
});

describe("resolveToll", () => {
  test("pays the toll and deducts cash when there's enough", () => {
    const { economy, result } = resolveToll({ cash: 20 }, 15);
    expect(result).toBe("paid");
    expect(economy).toEqual({ cash: 5 });
  });
  test("pays exactly when cash equals the toll", () => {
    const { economy, result } = resolveToll({ cash: 15 }, 15);
    expect(result).toBe("paid");
    expect(economy).toEqual({ cash: 0 });
  });
  test("jails and leaves cash unchanged when cash is short", () => {
    const { economy, result } = resolveToll({ cash: 10 }, 15);
    expect(result).toBe("jailed");
    expect(economy).toEqual({ cash: 10 });
  });
});
