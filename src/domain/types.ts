export type Point2 = [number, number];

export type ElementId = "hydrogen" | "oxygen";
export type MoleculeId = "water";
export type PartId = "wire" | "valve" | "casing";

export interface ElementDef {
  id: ElementId;
  symbol: string;
  name: string;
  protons: number;
  electrons: number;
  color: string;
  fact: string;
}

export interface MoleculeDef {
  id: MoleculeId;
  name: string;
  recipe: Partial<Record<ElementId, number>>;
  fact: string;
}

export type WorkshopResultKind = "tower" | "towerUpgrade" | "robbyUpgrade";

export interface WorkshopRecipe {
  id: string;
  molecules: Partial<Record<MoleculeId, number>>;
  result: { kind: WorkshopResultKind; id: string };
}

export interface TowerInstance {
  id: string;
  kind: string;
  position: Point2;
  damaged: boolean;
  upgraded: boolean;
  cooldown: number;
}

export interface RobbyInstance {
  position: Point2;
  upgraded: boolean;
  cooldown: number;
}

export type CollectorState = "onPath" | "seekingCurly";

export interface CollectorInstance {
  id: string;
  hp: number;
  maxHp: number;
  speed: number;
  toll: number;
  bounty: number;
  pathProgress: number;
  position: Point2;
  state: CollectorState;
}

export interface ShotEvent {
  fromPosition: Point2;
  toPosition: Point2;
}
