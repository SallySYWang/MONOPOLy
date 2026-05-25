import { describe, it, expect } from 'vitest';

// game-logic.js uses a UMD wrapper; in Node/Vitest it exposes via module.exports
const G = require('./game-logic.js');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeStatus(overrides = {}) {
  return {
    shieldActive:   false,
    doubleDamage:   false,
    breathEnhanced: false,
    revengeBlade:   false,
    ...overrides,
  };
}

function makeTeam(id, hp, position, statusOverrides = {}) {
  return { id, hp, position, status: makeStatus(statusOverrides) };
}

// ─────────────────────────────────────────────────────────────────────────────
// movePosition
// ─────────────────────────────────────────────────────────────────────────────

describe('movePosition', () => {
  it('normal move within the ring', () => {
    expect(G.movePosition(1, 3)).toBe(4);
  });

  it('move that wraps around the ring', () => {
    // 15 + 3 = 18 → position 2
    expect(G.movePosition(15, 3)).toBe(2);
  });

  it('move that lands exactly on position 16', () => {
    expect(G.movePosition(13, 3)).toBe(16);
  });

  it('exactly one full loop returns to start', () => {
    expect(G.movePosition(1, 16)).toBe(1);
  });

  it('move from position 16 by 1 wraps to position 1', () => {
    expect(G.movePosition(16, 1)).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ringDistance
// ─────────────────────────────────────────────────────────────────────────────

describe('ringDistance', () => {
  it('adjacent positions are distance 1', () => {
    expect(G.ringDistance(1, 2)).toBe(1);
  });

  it('same position is distance 0', () => {
    expect(G.ringDistance(5, 5)).toBe(0);
  });

  it('takes the shorter path through wrap-around', () => {
    // Direct: |1-15| = 14; wrap: 16-14 = 2 → should return 2
    expect(G.ringDistance(1, 15)).toBe(2);
  });

  it('positions at exactly half the ring apart are 8', () => {
    expect(G.ringDistance(1, 9)).toBe(8);
  });

  it('is symmetric', () => {
    expect(G.ringDistance(3, 11)).toBe(G.ringDistance(11, 3));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// didWrap
// ─────────────────────────────────────────────────────────────────────────────

describe('didWrap', () => {
  it('short move from start does not wrap', () => {
    expect(G.didWrap(1, 5)).toBe(false);
  });

  it('move that just reaches 16 does not wrap (lands on 16, not beyond)', () => {
    // 1 - 1 + 15 = 15 < 16 → false
    expect(G.didWrap(1, 15)).toBe(false);
  });

  it('move that steps past 16 wraps', () => {
    // 1 - 1 + 16 = 16 >= 16 → true
    expect(G.didWrap(1, 16)).toBe(true);
  });

  it('move from mid-board that crosses position 16', () => {
    // 14 - 1 + 5 = 18 >= 16 → true
    expect(G.didWrap(14, 5)).toBe(true);
  });

  it('move from mid-board that does not cross position 16', () => {
    // 14 - 1 + 2 = 15 < 16 → false
    expect(G.didWrap(14, 2)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcTaskDamage
// ─────────────────────────────────────────────────────────────────────────────

describe('calcTaskDamage', () => {
  it('base roll with no modifiers', () => {
    const r = G.calcTaskDamage(4, makeStatus(), 10);
    expect(r.damage).toBe(4);
    expect(r.notes).toHaveLength(0);
  });

  it('breathEnhanced sets damage to 6 regardless of roll', () => {
    const r = G.calcTaskDamage(1, makeStatus({ breathEnhanced: true }), 10);
    expect(r.damage).toBe(6);
    expect(r.status.breathEnhanced).toBe(false); // consumed
  });

  it('breathEnhanced is ignored when roll > 6 (only sets to 6)', () => {
    // breath always sets to exactly 6, not "max(roll,6)"
    const r = G.calcTaskDamage(6, makeStatus({ breathEnhanced: true }), 10);
    expect(r.damage).toBe(6);
  });

  it('revengeBlade with HP ≤ 3 triples damage', () => {
    const r = G.calcTaskDamage(4, makeStatus({ revengeBlade: true }), 3);
    expect(r.damage).toBe(12);
    expect(r.status.revengeBlade).toBe(false); // consumed
  });

  it('revengeBlade with HP > 3 applies no multiplier but is still consumed', () => {
    const r = G.calcTaskDamage(4, makeStatus({ revengeBlade: true }), 5);
    expect(r.damage).toBe(4);
    expect(r.status.revengeBlade).toBe(false); // consumed even with no effect
  });

  it('doubleDamage doubles the damage', () => {
    const r = G.calcTaskDamage(4, makeStatus({ doubleDamage: true }), 10);
    expect(r.damage).toBe(8);
    expect(r.status.doubleDamage).toBe(false); // consumed
  });

  it('breathEnhanced + doubleDamage: 6 × 2 = 12', () => {
    const r = G.calcTaskDamage(4, makeStatus({ breathEnhanced: true, doubleDamage: true }), 10);
    expect(r.damage).toBe(12);
  });

  it('breathEnhanced + revengeBlade (HP ≤ 3): 6 × 3 = 18', () => {
    const r = G.calcTaskDamage(4, makeStatus({ breathEnhanced: true, revengeBlade: true }), 2);
    expect(r.damage).toBe(18);
  });

  it('breathEnhanced + revengeBlade (HP ≤ 3) + doubleDamage: 6 × 3 × 2 = 36', () => {
    const r = G.calcTaskDamage(4, makeStatus({ breathEnhanced: true, revengeBlade: true, doubleDamage: true }), 1);
    expect(r.damage).toBe(36);
  });

  it('breathEnhanced + revengeBlade (HP > 3) + doubleDamage: revenge has no effect → 6 × 2 = 12', () => {
    const r = G.calcTaskDamage(4, makeStatus({ breathEnhanced: true, revengeBlade: true, doubleDamage: true }), 7);
    expect(r.damage).toBe(12);
  });

  it('all flags cleared on the returned status object', () => {
    const r = G.calcTaskDamage(4, makeStatus({ breathEnhanced: true, revengeBlade: true, doubleDamage: true }), 2);
    expect(r.status.breathEnhanced).toBe(false);
    expect(r.status.revengeBlade).toBe(false);
    expect(r.status.doubleDamage).toBe(false);
  });

  it('does not mutate the original status object', () => {
    const status = makeStatus({ doubleDamage: true });
    G.calcTaskDamage(4, status, 10);
    expect(status.doubleDamage).toBe(true); // original unchanged
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcBossTargets
// ─────────────────────────────────────────────────────────────────────────────

describe('calcBossTargets', () => {
  it('with only 1 living team, returns that team', () => {
    const teams = [
      makeTeam(1, 0, 1),
      makeTeam(2, 5, 3),
    ];
    const targets = G.calcBossTargets(5, false, teams);
    expect(targets.map(t => t.id)).toEqual([2]);
  });

  it('with exactly 2 living teams, returns both regardless of distance', () => {
    const teams = [
      makeTeam(1, 5, 1),
      makeTeam(2, 5, 9), // far from boss at position 1
    ];
    const targets = G.calcBossTargets(1, false, teams);
    expect(targets.map(t => t.id).sort()).toEqual([1, 2]);
  });

  it('with 3+ teams, targets the closest team by ring distance', () => {
    // Boss at 1; teams at 2 (dist 1), 8 (dist 7), 14 (dist 3)
    const teams = [
      makeTeam(1, 5, 2),
      makeTeam(2, 5, 8),
      makeTeam(3, 5, 14),
    ];
    const targets = G.calcBossTargets(1, false, teams);
    expect(targets.map(t => t.id)).toEqual([1]);
  });

  it('with 3+ teams, includes all teams tied for closest distance', () => {
    // Boss at 1; teams at 3 (dist 2) and 15 (dist 2) are both closest
    const teams = [
      makeTeam(1, 5, 3),
      makeTeam(2, 5, 15),
      makeTeam(3, 5, 9),
    ];
    const targets = G.calcBossTargets(1, false, teams);
    expect(targets.map(t => t.id).sort()).toEqual([1, 2]);
  });

  it('dead teams are never targeted', () => {
    const teams = [
      makeTeam(1, 0, 2), // dead, closest
      makeTeam(2, 5, 3),
      makeTeam(3, 5, 8),
    ];
    const targets = G.calcBossTargets(1, false, teams);
    expect(targets.every(t => t.hp > 0)).toBe(true);
  });

  it('targetHighest returns the team with the most HP', () => {
    const teams = [
      makeTeam(1, 8, 5),
      makeTeam(2, 10, 6),
      makeTeam(3, 6, 7),
    ];
    const targets = G.calcBossTargets(1, true, teams);
    expect(targets.map(t => t.id)).toEqual([2]);
  });

  it('targetHighest returns ALL teams tied for highest HP (no 2-team cap)', () => {
    // Three teams all at HP 8 — all should be targeted
    const teams = [
      makeTeam(1, 8, 2),
      makeTeam(2, 8, 5),
      makeTeam(3, 8, 9),
    ];
    const targets = G.calcBossTargets(1, true, teams);
    expect(targets.map(t => t.id).sort()).toEqual([1, 2, 3]);
  });

  it('targetHighest: two teams tied for highest, third lower — returns both tied teams', () => {
    const teams = [
      makeTeam(1, 9, 2),
      makeTeam(2, 9, 5),
      makeTeam(3, 5, 9),
    ];
    const targets = G.calcBossTargets(1, true, teams);
    expect(targets.map(t => t.id).sort()).toEqual([1, 2]);
  });

  it('does not mutate the teams array', () => {
    const teams = [makeTeam(1, 5, 2), makeTeam(2, 5, 5), makeTeam(3, 5, 8)];
    const copy = JSON.stringify(teams);
    G.calcBossTargets(1, false, teams);
    expect(JSON.stringify(teams)).toBe(copy);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// applyBossAttack
// ─────────────────────────────────────────────────────────────────────────────

describe('applyBossAttack', () => {
  it('deals damage to a team with no shield', () => {
    const team = makeTeam(1, 8, 1);
    const [r] = G.applyBossAttack([team], 3);
    expect(r.newHP).toBe(5);
    expect(r.shieldConsumed).toBe(false);
  });

  it('HP cannot go below 0', () => {
    const team = makeTeam(1, 2, 1);
    const [r] = G.applyBossAttack([team], 5);
    expect(r.newHP).toBe(0);
  });

  it('shield blocks the attack and is consumed', () => {
    const team = makeTeam(1, 8, 1, { shieldActive: true });
    const [r] = G.applyBossAttack([team], 3);
    expect(r.shieldConsumed).toBe(true);
    expect(r.newHP).toBe(8); // HP unchanged
  });

  it('multiple targets: each result has the correct teamId', () => {
    const t1 = makeTeam(1, 8, 1);
    const t2 = makeTeam(2, 6, 3, { shieldActive: true });
    const results = G.applyBossAttack([t1, t2], 4);
    expect(results[0]).toMatchObject({ teamId: 1, shieldConsumed: false, newHP: 4 });
    expect(results[1]).toMatchObject({ teamId: 2, shieldConsumed: true, newHP: 6 });
  });

  it('does not mutate the team objects', () => {
    const team = makeTeam(1, 8, 1);
    G.applyBossAttack([team], 3);
    expect(team.hp).toBe(8); // original unchanged
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// applyBlast (鬼放大招)
// ─────────────────────────────────────────────────────────────────────────────

describe('applyBlast', () => {
  it('deals 3 damage to all living teams', () => {
    const teams = [makeTeam(1, 8, 1), makeTeam(2, 5, 3)];
    const results = G.applyBlast(teams);
    expect(results.find(r => r.teamId === 1).newHP).toBe(5);
    expect(results.find(r => r.teamId === 2).newHP).toBe(2);
  });

  it('does not affect dead teams', () => {
    const teams = [makeTeam(1, 0, 1), makeTeam(2, 5, 3)];
    const results = G.applyBlast(teams);
    expect(results.find(r => r.teamId === 1)).toBeUndefined();
  });

  it('HP cannot go below 0', () => {
    const teams = [makeTeam(1, 2, 1)];
    const [r] = G.applyBlast(teams);
    expect(r.newHP).toBe(0);
  });

  it('shield blocks blast and is consumed', () => {
    const teams = [makeTeam(1, 8, 1, { shieldActive: true })];
    const [r] = G.applyBlast(teams);
    expect(r.shieldConsumed).toBe(true);
    expect(r.newHP).toBe(8); // HP unchanged
  });

  it('mixed: some shielded, some not', () => {
    const teams = [
      makeTeam(1, 8, 1, { shieldActive: true }),
      makeTeam(2, 8, 3),
    ];
    const results = G.applyBlast(teams);
    expect(results.find(r => r.teamId === 1).shieldConsumed).toBe(true);
    expect(results.find(r => r.teamId === 2).newHP).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// applyPillars (柱の支持)
// ─────────────────────────────────────────────────────────────────────────────

describe('applyPillars', () => {
  it('heals all living teams by 2 HP', () => {
    const teams = [makeTeam(1, 6, 1), makeTeam(2, 4, 3)];
    const results = G.applyPillars(teams);
    expect(results.find(r => r.teamId === 1).newHP).toBe(8);
    expect(results.find(r => r.teamId === 2).newHP).toBe(6);
  });

  it('does not heal dead teams', () => {
    const teams = [makeTeam(1, 0, 1), makeTeam(2, 5, 3)];
    const results = G.applyPillars(teams);
    expect(results.find(r => r.teamId === 1)).toBeUndefined();
  });

  it('caps HP at 10', () => {
    const teams = [makeTeam(1, 9, 1), makeTeam(2, 10, 3)];
    const results = G.applyPillars(teams);
    expect(results.find(r => r.teamId === 1).newHP).toBe(10); // 9+2 capped
    expect(results.find(r => r.teamId === 2).newHP).toBe(10); // already at cap
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// applyHeal (生命藥水)
// ─────────────────────────────────────────────────────────────────────────────

describe('applyHeal', () => {
  it('restores 5 HP', () => {
    expect(G.applyHeal(3, 5, 10)).toBe(8);
  });

  it('is capped at 10', () => {
    expect(G.applyHeal(8, 5, 10)).toBe(10);
  });

  it('team already at cap: no change', () => {
    expect(G.applyHeal(10, 5, 10)).toBe(10);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// applyRegen (無慘再生)
// ─────────────────────────────────────────────────────────────────────────────

describe('applyRegen', () => {
  it('restores 5 HP to the ghost king', () => {
    expect(G.applyRegen(30, 5, 60)).toBe(35);
  });

  it('is capped at 60', () => {
    expect(G.applyRegen(58, 5, 60)).toBe(60);
  });

  it('ghost king already at 60: no change', () => {
    expect(G.applyRegen(60, 5, 60)).toBe(60);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// checkAllDead
// ─────────────────────────────────────────────────────────────────────────────

describe('checkAllDead', () => {
  it('returns true when every team is at 0 HP', () => {
    const teams = [makeTeam(1, 0, 1), makeTeam(2, 0, 3)];
    expect(G.checkAllDead(teams)).toBe(true);
  });

  it('returns false when at least one team is alive', () => {
    const teams = [makeTeam(1, 0, 1), makeTeam(2, 1, 3)];
    expect(G.checkAllDead(teams)).toBe(false);
  });

  it('returns false when all teams are alive', () => {
    const teams = [makeTeam(1, 5, 1), makeTeam(2, 8, 3)];
    expect(G.checkAllDead(teams)).toBe(false);
  });
});
