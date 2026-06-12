/**
 * 遊戲流程自動化測試腳本
 * 用途：每次修改後在瀏覽器 console 或 Playwright evaluate 執行，確認四輪完整流程正確。
 *
 * 執行方式：
 *   1. 開啟 http://localhost:3456
 *   2. 在 DevTools console 貼入此腳本內容並執行
 *   3. 或透過 Playwright：page.evaluate(fs.readFileSync('scripts/flow-test.js', 'utf8'))
 */

(async () => {
  const vm = document.querySelector('#app').__vue_app__._instance.proxy;

  // 重置並啟動新生教會版本
  vm.screen = 'title';
  await new Promise(r => setTimeout(r, 100));
  vm.selectVersion('shinsei');
  await new Promise(r => setTimeout(r, 100));

  const rand = () => Math.floor(Math.random() * 6) + 1;
  const delay = ms => new Promise(res => setTimeout(res, ms));
  const waitFor = async (fn, timeout = 8000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (fn()) return true;
      await delay(80);
    }
    return false;
  };

  const allRounds = [];

  for (let rnd = 0; rnd < 4; rnd++) {
    if (vm.screen !== 'game') break;

    const log = { round: vm.globalRound, dice: [], judge: [], bigGame: {}, boss: {} };
    allRounds.push(log);

    // === 1. group-roll：每隊等動畫結束再擲 ===
    while (vm.currentPhase === 'group-roll') {
      await waitFor(() => !vm.isAnimating && !vm.showCardModal && !vm.showCrowModal, 6000);
      if (vm.currentPhase !== 'group-roll') break;

      const prevIdx = vm.rollTeamIndex;
      const teamName = vm.teams[prevIdx].name;
      const dice = rand();
      log.dice.push(`${teamName}: ${dice}`);
      vm.groupRoll(dice);

      await waitFor(() =>
        vm.rollTeamIndex !== prevIdx ||
        vm.showCardModal ||
        vm.showCrowModal ||
        vm.currentPhase !== 'group-roll'
      , 5000);

      if (vm.showCardModal) { vm.closeCardModal(); await delay(80); }
      if (vm.showCrowModal) { vm.closeCrowModal(); await delay(80); }
    }

    // === 2. countdown - 直接跳過 ===
    if (vm.currentPhase === 'countdown') {
      vm.endCountdown();
      await delay(80);
    }

    // === 3. team-judge ===
    await waitFor(() => vm.currentPhase === 'team-judge' || vm.currentPhase === 'big-game', 3000);

    while (vm.currentPhase === 'team-judge') {
      await waitFor(() => !vm.showDmgOverlay && !vm.showCardModal, 6000);
      if (vm.currentPhase !== 'team-judge') break;

      const prevJudge = vm.judgeTeamIndex;
      const teamName = vm.judgeQueue[prevJudge]?.name || '?';
      const pass = Math.random() < 0.5;

      if (pass) {
        const atk = rand();
        log.judge.push(`${teamName}: 過關 ✓ 攻擊${atk}`);
        vm.judgePass();
        await delay(100);
        vm.judgeRoll(atk);
        await waitFor(() => !vm.showDmgOverlay, 5000);
        await delay(50);
      } else {
        log.judge.push(`${teamName}: 失敗 ✗`);
        vm.judgeFail();
        await delay(80);
      }

      if (vm.screen !== 'game') break;
    }

    if (vm.screen !== 'game') break;
    await waitFor(() => vm.currentPhase === 'big-game', 3000);

    // === 4. big-game → 隨機記錄勝負 ===
    vm.startBigGameResults();
    await delay(80);

    const winners = [], losers = [];
    for (const entry of vm.bigGameResults) {
      if (Math.random() < 0.5) { vm.toggleBigGameResult(entry.teamId); winners.push(entry.name); }
      else { losers.push(entry.name); }
    }
    log.bigGame = { 勝: winners, 敗: losers };

    vm.applyBigGameResults();
    await waitFor(() => !vm.showDmgOverlay && (vm.currentPhase === 'boss-roll' || vm.currentPhase === 'boss-next'), 6000);
    if (vm.screen !== 'game') break;

    // === 5. boss-roll ===
    if (vm.currentPhase === 'boss-roll') {
      const bossDice = rand();
      log.boss.移動 = bossDice;
      vm.bossRoll(bossDice);
      await waitFor(() => vm.currentPhase === 'boss-attack', 6000);

      // === 6. boss-attack ===
      const bossAtk = rand();
      log.boss.攻擊 = bossAtk;
      vm.bossAttack(bossAtk);
      await waitFor(() => !vm.showTeamHitOverlay && vm.currentPhase === 'boss-next', 6000);
    }

    if (vm.screen !== 'game') break;

    // === 7. 結束回合 ===
    if (vm.currentPhase === 'boss-next') {
      vm.endBossTurn();
      await delay(200);
    }
  }

  console.log('=== 流程測試結果 ===');
  allRounds.forEach(r => {
    console.log(`\n第 ${r.round} 輪`);
    console.log('  擲骰:', r.dice.join(' | '));
    console.log('  結算:', r.judge.join(' | '));
    console.log('  大遊戲 勝:', r.bigGame.勝?.join('、') || '無');
    console.log('  鬼王:', `移動${r.boss.移動} 攻擊${r.boss.攻擊}`);
  });
  console.log('\n目前鬼王 HP:', vm.ghostKingHP);

  return allRounds;
})();
