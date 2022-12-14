import { calculateDistance } from "./util.canvas";
import { MapSide, Point, TICK_DURATION } from "./definitions";
import { LeaderboardEntry } from "./models";

export async function doFetch(
  httpMethod: "GET" | "POST" | "PUT" | "DELETE",
  url: string,
  onOK: (json: any) => void,
  onNotOK: (json: any) => void,
  finallyCallback?: () => void,
  body?: any
) {
  try {
    const response = await fetch(url, {
      headers: await getHeaders(),
      method: httpMethod,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (response.ok) {
      try {
        onOK(await response.json());
      } catch {
        onOK(`${response.status} ${response.statusText}`);
      }
    } else {
      try {
        onNotOK(await response.json());
      } catch (error) {
        onNotOK(response.statusText);
      }
    }
  } catch (error) {
    console.log(error);
    onNotOK("An error occured");
  } finally {
    if (finallyCallback) {
      finallyCallback();
    }
  }
}

export async function getHeaders(extraHeaders?: any) {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");

  if (extraHeaders) {
    Object.entries(extraHeaders).forEach(([key, val]) => headers.append(key, val + ""));
  }

  return headers;
}

export function toDateAndTime(
  timestamp: number | undefined,
  withYear?: boolean,
  excludeTime?: boolean,
  onlyYear?: boolean
) {
  if (!timestamp) {
    return "No date";
  }

  const date = new Date(timestamp);
  const day = `${date.getDate()}/${date.getMonth() + 1}`;
  const time = `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
  const year = date.getFullYear().toString().slice(2);

  if (onlyYear) {
    return date.getFullYear().toString();
  }

  return `${day}${withYear ? `-${year}` : ""}${excludeTime ? "" : " " + time}`;
}

export function leaderboardEntryComparator(a: LeaderboardEntry, b: LeaderboardEntry): number {
  if (a.won !== b.won) {
    return Number(b.won) - Number(a.won);
  }

  if (a.won) {
    // win case
    if (a.lives !== b.lives) {
      return b.lives - a.lives;
    }

    if (a.ticks !== b.ticks) {
      return a.ticks - b.ticks;
    }

    return a.timestamp - b.timestamp;
  }
  // lose case

  return b.score - a.score;
}

export function ticksToPrettyTime(ticks: number, onlySeconds?: boolean) {
  const seconds = ticks * (TICK_DURATION / 1000);
  const hundreths = Math.round(seconds * 100);
  const minutes = Math.floor(seconds / 60);

  return (
    minutes +
    ":" +
    Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0") +
    (onlySeconds ? "" : "." + (hundreths % 100).toString().padStart(2, "0"))
  );
}

export function intersects(a: Point, b: Point, c: Point, d: Point) {
  var det, gamma, lambda;
  det = (b.x - a.x) * (d.y - c.y) - (d.x - c.x) * (b.y - a.y);
  if (det === 0) {
    return false;
  } else {
    lambda = ((d.y - c.y) * (d.x - a.x) + (c.x - d.x) * (d.y - a.y)) / det;
    gamma = ((a.y - b.y) * (d.x - a.x) + (b.x - a.x) * (d.y - a.y)) / det;
    return 0 < lambda && lambda < 1 && 0 < gamma && gamma < 1;
  }
}

/**
 * Return the firing solution for a projectile starting at 'src' with
 * velocity 'v', to hit a target, 'dst'.
 *
 * @param ({x, y}) src position of shooter
 * @param ({x, y, vx, vy}) dst position & velocity of target
 * @param (Number) v   speed of projectile
 *
 * @return ({x, y}) Coordinate at which to fire (and where intercept occurs). Or `null` if target cannot be hit.
 */
export function intercept(src: Point, dst: { x: number; y: number; vx: number; vy: number }, v: number) {
  const tx = dst.x - src.x;
  const ty = dst.y - src.y;
  const tvx = dst.vx;
  const tvy = dst.vy;

  // Get quadratic equation components
  const a = tvx * tvx + tvy * tvy - v * v;
  const b = 2 * (tvx * tx + tvy * ty);
  const c = tx * tx + ty * ty;

  // Solve quadratic
  const ts = quad(a, b, c); // See quad(), below

  // Find smallest positive solution
  let sol = null;
  if (ts) {
    const t0 = ts[0];
    const t1 = ts[1];
    let t = Math.min(t0, t1);
    if (t < 0) t = Math.max(t0, t1);
    if (t > 0) {
      sol = {
        x: dst.x + dst.vx * t,
        y: dst.y + dst.vy * t,
      };
    }
  }

  return sol;
}

/**
 * Return solutions for quadratic
 */
function quad(a: number, b: number, c: number) {
  let sol = null;
  if (Math.abs(a) < 1e-6) {
    if (Math.abs(b) < 1e-6) {
      sol = Math.abs(c) < 1e-6 ? [0, 0] : null;
    } else {
      sol = [-c / b, -c / b];
    }
  } else {
    let disc = b * b - 4 * a * c;
    if (disc >= 0) {
      disc = Math.sqrt(disc);
      a = 2 * a;
      sol = [(-b - disc) / a, (-b + disc) / a];
    }
  }
  return sol;
}

export function changeDirection(direction: Point, angle: number) {
  const ang = angle * (Math.PI / 180);

  const angledDirection = {
    x: direction.x * Math.cos(ang) - direction.y * Math.sin(ang),
    y: direction.x * Math.sin(ang) + direction.y * Math.cos(ang),
  };

  return angledDirection;
}

export function toUnitVector(direction: Point) {
  const magnitude = calculateDistance({ x: 0, y: 0 }, direction);
  if (magnitude === 0) {
    throw new Error("Direction was the 0,0 vector");
  }
  return { x: direction.x / magnitude, y: direction.y / magnitude };
}

export function nTimes(n: number) {
  return Array.from(new Array(n)).map((_, i) => i);
}

export function getSeededRandomGenerator(seed: number) {
  let m_w = 123456789;
  let m_z = 987654321;
  let mask = 0xffffffff;

  function doSeed(i: number) {
    m_w = (123456789 + i) & mask;
    m_z = (987654321 - i) & mask;
  }

  function random() {
    m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
    m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;
    var result = ((m_z << 16) + (m_w & 65535)) >>> 0;
    result /= 4294967296;
    return result;
  }

  doSeed(seed);
  return random;
}

export function flipCoords(x: number, y: number, flipOne: boolean, flipTwo: boolean) {
  if (flipOne) {
    if (flipTwo) {
      return [x, y];
    } else {
      return [-y, x];
    }
  } else {
    if (flipTwo) {
      return [-x, -y];
    } else {
      return [y, -x];
    }
  }
}

export function flipSide(side: MapSide): MapSide {
  return ({ up: "down", right: "left", down: "up", left: "right" } as { [side in MapSide]: MapSide })[side];
}

export function n(num: number) {
  return Array.from(new Array(num)).map((_, i) => i);
}

export function isTileOccupied(map: boolean[][], tile: Point) {
  if (!map[tile.y]) {
    return false;
  }

  return map[tile.y][tile.x];
}

export function percentFormatter(num: number, isPercentagePoints?: boolean) {
  return (
    (num * 100).toFixed(Math.abs(num) < 0.1 ? 2 : 1).replace(Math.abs(num) < 0.1 ? ".00" : ".0", "") +
    "%" +
    (isPercentagePoints ? "p" : "")
  );
}

export function round(num: number) {
  if (Math.abs(num) < 0.1) {
    return Math.round(num * 10000) / 10000;
  }

  if (Math.abs(num) < 1) {
    return Math.round(num * 1000) / 1000;
  }

  return Math.round(num * 100) / 100;
}
