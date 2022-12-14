import { Point } from "./definitions";
import { Skill } from "./skillDefinitions";

export interface UserInfo {
  email: string;
  firstname: string;
  lastname: string;
  nickname: string;
}

export interface User {
  email: string;
  firstname: string;
  lastname: string;
  fullName: string;
  nickname: string;
}

export interface LeaderboardEntry {
  player: string;
  score: number;
  ticks: number;
  lives: number;
  wave: number;
  won: boolean;
  timestamp: number;
}

export interface SNode {
  key: string;
  pos: Point;
  tilePos: Point;
}

export type Direction = "a" | "s" | "d" | "w";

export type EffectFunction = (points: number) => { effect: number; isAbsolute: boolean };

export interface SkillExtended<T> extends Skill<T> {
  points: number;
  skillTreeIndex: number;
}

export type SkillSheet<T extends number> = { [stat in T]?: SkillExtended<T> };
