export interface EconomyState {
  cash: number;
}

export function payBounty(economy: EconomyState, amount: number): EconomyState {
  return { cash: economy.cash + amount };
}

export type TollResult = "paid" | "jailed";

export function resolveToll(
  economy: EconomyState,
  toll: number
): { economy: EconomyState; result: TollResult } {
  if (economy.cash >= toll) {
    return { economy: { cash: economy.cash - toll }, result: "paid" };
  }
  return { economy, result: "jailed" };
}
