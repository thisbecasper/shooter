import { experienceThresholdsNormal, Point, TICK_DURATION_S } from "../lib/definitions";
import { n } from "../lib/functions";
import { GunSkill } from "../lib/skillDefinitions";

export interface GunConfig {
  name: string;
  damage: number;
  magazineSize: number;
  reloadTime: number;
  fireRate: number;
  velocity: number;
  projectileSize: number;
  projectileColor: string;
  ammo: number;
  skillSheet: GunSkill[];
}

// const recoilRecoveryPerSecond = 40;

export abstract class Gun {
  protected level = 1;
  protected experience = 0;
  protected magazineAmmo = 0;
  protected ammo: number;
  protected reloadTime: number;
  protected reloadTimeRemaining = 0;
  protected magazineSize: number;
  protected fireRate: number;
  protected fireTimeRemaining = 0;
  protected velocity: number;
  protected projectileSize: number;
  protected projectileColor: string;
  protected shouldReload = false;
  protected name: string;
  protected currentRecoil = 0;
  protected damage: number;
  protected skillSheet: GunSkill[];
  protected skillPointsUsed: number[];

  constructor(config: GunConfig) {
    this.name = config.name;
    this.ammo = config.ammo;
    this.damage = config.damage;
    this.reloadTime = config.reloadTime;
    this.magazineSize = config.magazineSize;
    this.fireRate = config.fireRate;
    this.velocity = config.velocity;
    this.projectileSize = config.projectileSize;
    this.projectileColor = config.projectileColor;
    this.skillSheet = config.skillSheet.reverse();
    this.skillPointsUsed = n(config.skillSheet.length).map(() => 0);

    this.reload();
  }

  fire(target: Point) {
    if (this.fireTimeRemaining > 0) {
      return;
    }

    if (this.magazineAmmo === 0) {
      return;
    }

    this.ammo--;
    this.magazineAmmo--;
    this.fireTimeRemaining = 60 / this.fireRate;

    this.shoot(target);

    // this.currentRecoil += 15;
  }

  initiateReload() {
    if (this.reloadTimeRemaining === 0 && this.ammo > 0 && this.magazineAmmo !== this.magazineSize) {
      this.reloadTimeRemaining = this.reloadTime;
      this.magazineAmmo = 0;
      this.shouldReload = true;
    }
  }

  getRecoil() {
    return this.currentRecoil;
  }

  reload() {
    this.magazineAmmo = Math.min(this.magazineSize, this.ammo);
    this.shouldReload = false;
  }

  tick() {
    this.reloadTimeRemaining = Math.max(0, this.reloadTimeRemaining - TICK_DURATION_S);
    this.fireTimeRemaining = Math.max(0, this.fireTimeRemaining - TICK_DURATION_S);
    // this.currentRecoil = Math.max(10, this.currentRecoil - recoilRecoveryPerSecond * TICK_DURATION_S);

    if (this.magazineAmmo === 0 && !this.shouldReload) {
      this.initiateReload();
    }

    if (this.shouldReload && this.reloadTimeRemaining <= 0) {
      this.reload();
    }
  }

  addExperience(experience: number) {
    this.experience += experience;

    while (this.experience >= experienceThresholdsNormal[this.level - 1]) {
      this.experience -= experienceThresholdsNormal[this.level - 1];
      this.level++;
    }
  }

  setDamage() {}

  getExperience() {
    return this.experience;
  }

  getReloadProgress() {
    if (!this.shouldReload) {
      return 0;
    }
    return 1 - this.reloadTimeRemaining / this.reloadTime;
  }

  getReloadTime() {
    return this.reloadTime;
  }

  getLevel() {
    return this.level;
  }

  getAmmo() {
    return this.ammo;
  }

  getName() {
    return this.name;
  }

  getMagazineSize() {
    return this.magazineSize;
  }

  getMagazineAmmo() {
    return this.magazineAmmo;
  }

  getFireRate() {
    return this.fireRate;
  }

  getVelocity() {
    return this.velocity;
  }

  getSkillSheet() {
    return this.skillSheet;
  }

  getSkillPointsUsed() {
    return this.skillPointsUsed;
  }

  upSkill(index: number) {
    return this.skillPointsUsed[index]++;
  }

  isReloading() {
    return this.reloadTimeRemaining > 0;
  }

  isLoadingBulletIntoChamber() {
    return this.fireTimeRemaining > 0;
  }

  abstract shoot(target: Point): void;
}
