import { GameObject } from "./GameObject";

export class Player extends GameObject {
  protected moveSpeed = 2.5;
  protected health = 100;
  protected color = "#c67c16";

  constructor() {
    super(20, { x: 500, y: 400 });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.arc(this.drawPosition.x, this.drawPosition.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }

  tick(): void {}

  move(direction: string) {
    let newX = this.drawPosition.x;
    let newY = this.drawPosition.y;

    if (direction === "w") {
      newY -= this.moveSpeed;
    } else if (direction === "a") {
      newX -= this.moveSpeed;
    } else if (direction === "s") {
      newY += this.moveSpeed;
    } else if (direction === "d") {
      newX += this.moveSpeed;
    }

    const [isColliding, mayForce] = this.checkCollision({ x: newX, y: newY });

    if (isColliding) {
      if (!mayForce) {
        // we are not stuck on a corner
        return;
      }

      if (direction === "a" || direction === "d") {
        if (!this.checkCollision({ x: newX, y: newY - this.moveSpeed })[0]) {
          newY -= this.moveSpeed;
        } else if (!this.checkCollision({ x: newX, y: newY + this.moveSpeed })[0]) {
          newY += this.moveSpeed;
        } else {
          return;
        }
      }

      if (direction === "w" || direction === "s") {
        if (!this.checkCollision({ x: newX - this.moveSpeed, y: newY })[0]) {
          newX -= this.moveSpeed;
        } else if (!this.checkCollision({ x: newX + this.moveSpeed, y: newY })[0]) {
          newX += this.moveSpeed;
        } else {
          return;
        }
      }
    }

    this.drawPosition.x = newX;
    this.drawPosition.y = newY;

    this.updateSurroundingObstacles();
  }

  getPosition() {
    return { x: this.drawPosition.x, y: this.drawPosition.y };
  }

  getSize() {
    return this.size;
  }

  getHealth() {
    return this.health;
  }

  inflictDamage(damage: number) {
    this.health -= damage;
  }
}
