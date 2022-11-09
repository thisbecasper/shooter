import { PistolSkills } from "../lib/skillDefinitions";
import { Gun } from "./Gun";
import { TILE_SIZE } from "../lib/definitions";

export class Pistol extends Gun {
  constructor() {
    super({
      name: "Pistol",
      damage: 1,
      magazineSize: 6,
      reloadTime: 1.6,
      fireRate: 120,
      velocity: 120,
      recoil: 30,
      critChance: 0,
      range: TILE_SIZE * 5,
      numBullets: 1,
      projectileSize: 5,
      projectileColor: "black",
      ammo: 30000,
      price: 0,
      skills: PistolSkills,
    });
  }

  onLevelUp(levelIndex: number): void {
    this.baseDamage *= 1.5;
    this.baseMagazineSize += [0, 0, 1, 0, 0, 1, 0, 0, 2][levelIndex];
    this.baseReloadTime -= 0.05;
    this.baseRecoil -= 1;
    this.baseVelocity += 0.15;
    this.baseFireRate += 5;
    this.baseRange += 10;
  }
}
