import { MAP_SIZE } from "../Definitions/Maps";
import { ANIM_COLLECT_TIME, experienceThresholdsPlayer, MapSide, TICK_DURATION_S, TILE_SIZE } from "../lib/definitions";
import {
  COLOR_PLAYER,
  COLOR_HP_BAR_RED,
  COLOR_HP_BAR_GREEN,
  COLOR_EXP,
  COLOR_MONEY,
  COLOR_HP_GREEN,
  COLOR_DMG,
} from "../lib/definitions.colors";
import { toUnitVector } from "../lib/functions";
import { addLog } from "../lib/GameLog";
import { Direction } from "../lib/models";
import { PlayerStat, PlayerStats, Stat } from "../lib/skillDefinitions";
import { currentMap, mousePos, numberAnimations } from "../Shooter";
import { Gun } from "../Weapons/Gun";
import { Pistol } from "../Weapons/Pistol";
import { Shotgun } from "../Weapons/Shotgun";
import { Sniper } from "../Weapons/Sniper";
import { MovingObject } from "./MovingObject";
import { RisingText } from "./RisingText";

// const START_VELOCITY = 120;
const START_VELOCITY = 240;
const START_MAX_HEALTH = 10;

export class Player extends MovingObject {
  private health = START_MAX_HEALTH;
  private money = 0;
  private damageDealt = 0;
  private takedowns = 0;
  private weapons: Gun[] = [new Pistol(), new Sniper(), new Shotgun()];
  private currentWeapon = this.weapons[0];
  private moveDirections: Set<Direction> = new Set();
  private wantFire = false;
  private level = 1;
  private experience = 0;
  private totalExperience = 0;
  private tintTime = 0;
  private tintColor = "255,0,0";
  private lastExpAnim: RisingText | undefined = undefined;
  private lastExpAnimTimeLeft = 0;
  private lastMoneyAnim: RisingText | undefined = undefined;
  private lastMoneyAnimTimeLeft = 0;
  private lastDmgAnim: RisingText | undefined = undefined;
  private lastDmgAnimTimeLeft = 0;
  private lastHealthAnim: RisingText | undefined = undefined;
  private lastHealthAnimTimeLeft = 0;
  private unusedSkillPoints = 300;

  private stats: PlayerStats;

  private skillPointsUsed: { [k in PlayerStat]?: number } = {};

  constructor() {
    super({ position: { x: 180, y: 280 }, size: 13, velocity: START_VELOCITY, color: COLOR_PLAYER });

    this.stats = {
      [Stat.MaxHealth]: START_MAX_HEALTH,
      [Stat.MoveSpeed]: this.velocity,
      [Stat.AmmoCost]: 0,
      [Stat.Damage]: 0,
      [Stat.DropChance]: 0,
      [Stat.Velocity]: 0,
      [Stat.Range]: 0,
      [Stat.Recoil]: 0,
      [Stat.ReloadSpeed]: 0,
      [Stat.FireRate]: 0,
      [Stat.Burn]: 0,
      [Stat.CritChance]: 0,
      [Stat.Penetration]: 0,
    };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const drawPos = this.getDrawPosition();

    ctx.beginPath();
    ctx.arc(drawPos.x, drawPos.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();

    this.drawHealthBar(ctx);
  }

  drawHealthBar(ctx: CanvasRenderingContext2D, doubleLength?: boolean) {
    const width = 40;
    const height = 8;

    const drawPos = this.getDrawPosition();

    ctx.beginPath();
    ctx.rect(
      drawPos.x - (width / 2) * (doubleLength ? 2 : 1),
      drawPos.y - (this.size + height + 4),
      width * (doubleLength ? 2 : 1),
      height
    );
    ctx.fillStyle = COLOR_HP_BAR_RED;
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.rect(
      drawPos.x - (width / 2) * (doubleLength ? 2 : 1),
      drawPos.y - (this.size + height + 4),
      Math.round(width * (doubleLength ? 2 : 1) * (this.health / this.stats[Stat.MaxHealth])),
      height
    );
    ctx.fillStyle = COLOR_HP_BAR_GREEN;
    ctx.fill();
    ctx.closePath();
  }

  tick() {
    this.tintTime = Math.max(0, this.tintTime - TICK_DURATION_S);
    this.currentWeapon.tick();
    this.move();

    if (this.wantFire) {
      this.shoot();
    }

    this.lastExpAnimTimeLeft = Math.max(0, this.lastExpAnimTimeLeft - TICK_DURATION_S);
    this.lastDmgAnimTimeLeft = Math.max(0, this.lastDmgAnimTimeLeft - TICK_DURATION_S);
    this.lastMoneyAnimTimeLeft = Math.max(0, this.lastMoneyAnimTimeLeft - TICK_DURATION_S);
  }

  changeWeapon(weaponSlot: number) {
    if (weaponSlot < 0 || weaponSlot >= this.weapons.length) {
      return;
    }

    if (this.currentWeapon.isReloading() || this.currentWeapon.isLoadingBulletIntoChamber()) {
      return;
    }

    this.currentWeapon = this.weapons[weaponSlot];
  }

  private move() {
    this.moveDirections.forEach((dir) => this.moveDirection(dir));
  }

  private moveDirection(direction: Direction) {
    let newX = this.position.x;
    let newY = this.position.y;

    const actualVelocity =
      this.moveDirections.size > 1 ? (this.velocity * TICK_DURATION_S) / Math.SQRT2 : this.velocity * TICK_DURATION_S;

    if (direction === "w") {
      newY -= actualVelocity;
    } else if (direction === "a") {
      newX -= actualVelocity;
    } else if (direction === "s") {
      newY += actualVelocity;
    } else if (direction === "d") {
      newX += actualVelocity;
    }

    const [isColliding, mayForce] = this.checkCollision({ x: newX, y: newY });

    if (isColliding) {
      if (!mayForce) {
        // we are not stuck on a corner
        return;
      }

      if (direction === "a" || direction === "d") {
        if (!this.checkCollision({ x: newX, y: newY - this.velocity * TICK_DURATION_S })[0]) {
          newY -= actualVelocity;
        } else if (!this.checkCollision({ x: newX, y: newY + this.velocity * TICK_DURATION_S })[0]) {
          newY += actualVelocity;
        } else {
          return;
        }
      }

      if (direction === "w" || direction === "s") {
        if (!this.checkCollision({ x: newX - this.velocity * TICK_DURATION_S, y: newY })[0]) {
          newX -= actualVelocity;
        } else if (!this.checkCollision({ x: newX + this.velocity * TICK_DURATION_S, y: newY })[0]) {
          newX += actualVelocity;
        } else {
          return;
        }
      }
    }

    this.setPosition({ x: newX, y: newY });

    this.updateSurroundingObstacles();
  }

  setMoveDirections(moveDirections: Set<Direction>) {
    this.moveDirections = moveDirections;
  }

  setWantFire(wantFire: boolean) {
    this.wantFire = wantFire;
  }

  private shoot() {
    this.currentWeapon.fire(mousePos);
  }

  addExperience(experience: number) {
    this.totalExperience += experience;
    this.experience += experience;

    if (this.lastExpAnimTimeLeft > 0) {
      this.lastExpAnim?.setText(Number(this.lastExpAnim.getText()) + experience);
    } else {
      const newAnim = new RisingText(this.position, experience, COLOR_EXP);
      numberAnimations.push(newAnim);
      this.lastExpAnim = newAnim;
    }
    this.lastExpAnimTimeLeft = ANIM_COLLECT_TIME;

    while (this.experience >= experienceThresholdsPlayer[this.level + 1]) {
      this.experience -= experienceThresholdsPlayer[this.level + 1];
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    this.unusedSkillPoints++;
    numberAnimations.push(new RisingText({ x: this.position.x, y: this.position.y - 15 }, "Level up!", COLOR_EXP));
    addLog(`Player reached level ${this.level}!`, "level up");
  }

  addTakedown() {
    this.takedowns++;
  }

  addDamageDealt(damage: number) {
    this.damageDealt += damage;
  }

  getDamageDealt() {
    return this.damageDealt;
  }

  getTakedowns() {
    return this.takedowns;
  }

  changeMoney(change: number) {
    if (this.lastMoneyAnimTimeLeft > 0) {
      this.lastMoneyAnim?.setText(Number(this.lastMoneyAnim.getText()) + change);
    } else {
      const newAnim = new RisingText(this.position, change, COLOR_MONEY);
      numberAnimations.push(newAnim);
      this.lastMoneyAnim = newAnim;
    }
    this.lastMoneyAnimTimeLeft = ANIM_COLLECT_TIME;

    this.money += change;
  }

  getTotalExperience() {
    return this.totalExperience;
  }

  enterTeleporter(side: MapSide) {
    const { x, y } = this.position;
    if (side === "up") {
      this.setPosition({ x, y: MAP_SIZE * TILE_SIZE - TILE_SIZE / 2 });
    } else if (side === "right") {
      this.setPosition({ x: TILE_SIZE / 2, y });
    } else if (side === "down") {
      this.setPosition({ x, y: TILE_SIZE / 2 });
    } else {
      this.setPosition({ x: MAP_SIZE * TILE_SIZE - TILE_SIZE / 2, y: y });
    }

    this.updateSurroundingObstacles();
  }

  upgrade(stat: PlayerStat) {
    if (!this.skillPointsUsed[stat]) {
      this.skillPointsUsed[stat] = 0;
    }

    this.skillPointsUsed[stat]!++;

    let newValue = this.getEffect(stat, this.skillPointsUsed[stat] || 0);

    if (stat === Stat.MoveSpeed) {
      this.velocity = newValue;
    }
    if (stat === Stat.MaxHealth) {
      this.health += newValue - this.stats[stat];
    }

    this.stats[stat] = newValue;
  }

  getEffect(stat: PlayerStat, pointsIndex: number): number {
    if (stat === Stat.MaxHealth) return START_MAX_HEALTH + pointsIndex * 5;
    if (stat === Stat.MoveSpeed) return START_VELOCITY + pointsIndex * 5;
    if (stat === Stat.AmmoCost) return pointsIndex * -0.1;
    if (stat === Stat.Damage) return pointsIndex * 0.05;
    if (stat === Stat.CritChance) return pointsIndex * 0.03;
    if (stat === Stat.DropChance) return pointsIndex * 0.02;
    if (stat === Stat.FireRate) return pointsIndex * 0.1;
    if (stat === Stat.Penetration) return pointsIndex * 0;
    if (stat === Stat.Range) return pointsIndex * 0.1;
    if (stat === Stat.Recoil) {
      let sum = 0;
      for (let i = 0; i <= pointsIndex; i++) {
        sum += -0.15 * Math.pow(0.7, i);
      }
      return sum;
    }
    if (stat === Stat.ReloadSpeed) {
      let sum = 0;
      for (let i = 0; i <= pointsIndex; i++) {
        sum += -0.15 * Math.pow(0.7, i);
      }
      return sum;
    }
    if (stat === Stat.Velocity) return pointsIndex * 0.2;

    throw new Error("Called getEffect on a stat that was not provided in method");
  }

  getStat(type: PlayerStat) {
    return this.stats[type];
  }

  getTintColor() {
    return this.tintColor;
  }

  getExperience() {
    return this.experience;
  }

  getTileState() {
    return currentMap.getTileState(this.tile);
  }

  getName() {
    return "Player";
  }

  getLevel() {
    return this.level;
  }

  getCurrentWeapon() {
    return this.currentWeapon;
  }

  getVelocity() {
    return this.velocity;
  }

  getMoney() {
    return this.money;
  }

  getSkillPointsForStat(stat: PlayerStat) {
    return this.skillPointsUsed[stat] || 0;
  }

  getUnusedSkillPoints() {
    return this.unusedSkillPoints;
  }

  getDirection() {
    const direction = { x: 0, y: 0 };

    this.moveDirections.forEach((dir) => {
      if (dir === "a") {
        direction.x--;
      } else if (dir === "d") {
        direction.x++;
      } else if (dir === "s") {
        direction.y++;
      } else {
        direction.y--;
      }
    });

    return toUnitVector(direction);
  }

  getSize() {
    return this.size;
  }

  getWeapons() {
    return this.weapons;
  }

  getHealth() {
    return this.health;
  }

  reload() {
    this.currentWeapon.initiateReload();
  }

  getTintIntencity() {
    return 0.35 * (this.tintTime / 0.7);
  }

  setTint(r: number, g: number, b: number) {
    const newTintColor = `${r},${g},${b}`;

    if (this.tintTime > 0 && this.tintColor !== newTintColor) {
      return;
    }

    this.tintTime = 0.7;
    this.tintColor = newTintColor;
  }

  addHealth(health: number) {
    this.health = Math.min(this.stats[Stat.MaxHealth], this.health + health);
    this.setTint(0, 255, 0);

    if (this.lastHealthAnimTimeLeft > 0) {
      this.lastHealthAnim?.setText(Number(this.lastHealthAnim.getText()) + health);
    } else {
      const newAnim = new RisingText(this.position, health, COLOR_HP_GREEN);
      numberAnimations.push(newAnim);
      this.lastHealthAnim = newAnim;
    }
    this.lastHealthAnimTimeLeft = ANIM_COLLECT_TIME;
  }

  addAmmo(ammo: number, weapon: string) {
    const gun = this.weapons.find((w) => w.getName() === weapon);

    if (!gun) {
      throw new Error("Tried to add ammo to a weapon the player doesn't have");
    }

    gun.addAmmo(ammo);
  }

  inflictDamage(damage: number) {
    const chanceOfHighHit = damage - Math.floor(damage);
    const actualDamage = Math.random() < chanceOfHighHit ? Math.ceil(damage) : Math.floor(damage);

    this.health = Math.max(0, this.health - actualDamage);
    this.setTint(255, 0, 0);

    if (this.lastDmgAnimTimeLeft > 0) {
      this.lastDmgAnim?.setText(Number(this.lastDmgAnim.getText()) + actualDamage);
    } else {
      const newAnim = new RisingText(this.position, actualDamage, COLOR_DMG);
      numberAnimations.push(newAnim);
      this.lastDmgAnim = newAnim;
    }
    this.lastDmgAnimTimeLeft = ANIM_COLLECT_TIME;
  }
}
