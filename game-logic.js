// Pure game logic — no Vue, no DOM, no side effects.
// Used by index.html (browser global) and game-logic.test.js (Node/Vitest).
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.GameLogic = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  // ── Board movement ──────────────────────────────────────────────────────────

  // 16-tile ring: position 1–16
  function movePosition(pos, steps) {
    return ((pos - 1 + steps) % 16) + 1;
  }

  // Shortest distance between two positions on the ring
  function ringDistance(a, b) {
    var d = Math.abs(a - b);
    return Math.min(d, 16 - d);
  }

  // Returns true if moving `steps` from `startPos` crosses position 16→1
  function didWrap(startPos, steps) {
    return (startPos - 1 + steps) >= 16;
  }

  // ── Task damage ─────────────────────────────────────────────────────────────

  /**
   * Pure task damage calculation.
   * @param {number} roll  Dice result (1–6)
   * @param {{ breathEnhanced, revengeBlade, doubleDamage, shieldActive }} status
   * @param {number} hp    Current HP of the team
   * @returns {{ damage: number, status: object, notes: string[] }}
   *   `status` is a new object with consumed flags cleared.
   *   `notes` is a list of modifier descriptions for logging.
   */
  function calcTaskDamage(roll, status, hp) {
    var dmg = roll;
    var s = {
      breathEnhanced: status.breathEnhanced,
      revengeBlade:   status.revengeBlade,
      doubleDamage:   status.doubleDamage,
      shieldActive:   status.shieldActive,
    };
    var notes = [];

    if (s.breathEnhanced) {
      dmg = 6;
      s.breathEnhanced = false;
      notes.push('呼吸法強化固定 6');
    }

    if (s.revengeBlade && hp <= 3) {
      dmg = dmg * 3;
      s.revengeBlade = false;
      notes.push('復仇之刃 ×3');
    } else if (s.revengeBlade) {
      s.revengeBlade = false; // consumed even when HP > 3
    }

    if (s.doubleDamage) {
      dmg = dmg * 2;
      s.doubleDamage = false;
      notes.push('×2');
    }

    return { damage: dmg, status: s, notes: notes };
  }

  // ── Boss target selection ───────────────────────────────────────────────────

  /**
   * Determine which teams the boss attacks this turn.
   * @param {number} bossPosition
   * @param {boolean} targetHighest  True when 黑死牟 effect is active
   * @param {Array}   teams          Full teams array
   * @returns {Array} Subset of living teams to be attacked
   *
   * Rules:
   *   - ≤ 2 living teams → attack all of them.
   *   - targetHighest → attack ALL teams sharing the highest HP (no cap).
   *   - Otherwise → attack all teams tied for closest ring distance.
   */
  function calcBossTargets(bossPosition, targetHighest, teams) {
    var living = teams.filter(function (t) { return t.hp > 0; });

    if (living.length <= 2) return living.slice();

    if (targetHighest) {
      var sorted = living.slice().sort(function (a, b) {
        return b.hp !== a.hp ? b.hp - a.hp : a.id - b.id;
      });
      var maxHP = sorted[0].hp;
      return sorted.filter(function (t) { return t.hp >= maxHP; });
    }

    var withDist = living.map(function (t) {
      return { team: t, dist: ringDistance(bossPosition, t.position) };
    });
    withDist.sort(function (a, b) {
      return a.dist !== b.dist ? a.dist - b.dist : a.team.id - b.team.id;
    });
    var minDist = withDist[0].dist;
    return withDist
      .filter(function (x) { return x.dist <= minDist; })
      .map(function (x) { return x.team; });
  }

  // ── Boss attack application ─────────────────────────────────────────────────

  /**
   * Apply boss attack damage to a list of target teams.
   * @param {Array}  targets  Living team objects (current state)
   * @param {number} damage   Total damage to deal
   * @returns {Array<{ teamId, shieldConsumed, newHP }>}
   */
  function applyBossAttack(targets, damage) {
    return targets.map(function (team) {
      if (team.status.shieldActive) {
        return { teamId: team.id, shieldConsumed: true, newHP: team.hp };
      }
      return { teamId: team.id, shieldConsumed: false, newHP: Math.max(0, team.hp - damage) };
    });
  }

  // ── Fate card: 鬼放大招 ──────────────────────────────────────────────────────

  /**
   * Apply 3-damage blast to all living teams; shields are consumed.
   * @returns {Array<{ teamId, shieldConsumed, newHP }>}
   */
  function applyBlast(teams) {
    return teams
      .filter(function (t) { return t.hp > 0; })
      .map(function (t) {
        if (t.status.shieldActive) {
          return { teamId: t.id, shieldConsumed: true, newHP: t.hp };
        }
        return { teamId: t.id, shieldConsumed: false, newHP: Math.max(0, t.hp - 3) };
      });
  }

  // ── Chance card: 柱の支持 ────────────────────────────────────────────────────

  /**
   * Heal all **living** teams by 2 HP, capped at 10.
   * @returns {Array<{ teamId, newHP }>}
   */
  function applyPillars(teams) {
    return teams
      .filter(function (t) { return t.hp > 0; })
      .map(function (t) { return { teamId: t.id, newHP: Math.min(10, t.hp + 2) }; });
  }

  // ── Simple HP helpers ───────────────────────────────────────────────────────

  /** Heal a team: return new HP capped at `cap` (10 for teams). */
  function applyHeal(currentHP, amount, cap) {
    return Math.min(cap, currentHP + amount);
  }

  /** Boss regen: return new ghostKingHP capped at `cap` (60). */
  function applyRegen(ghostKingHP, amount, cap) {
    return Math.min(cap, ghostKingHP + amount);
  }

  // ── Win condition ───────────────────────────────────────────────────────────

  /** Returns true when every team is at 0 HP (boss wins). */
  function checkAllDead(teams) {
    return teams.every(function (t) { return t.hp <= 0; });
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  return {
    movePosition:    movePosition,
    ringDistance:    ringDistance,
    didWrap:         didWrap,
    calcTaskDamage:  calcTaskDamage,
    calcBossTargets: calcBossTargets,
    applyBossAttack: applyBossAttack,
    applyBlast:      applyBlast,
    applyPillars:    applyPillars,
    applyHeal:       applyHeal,
    applyRegen:      applyRegen,
    checkAllDead:    checkAllDead,
  };
}));
