var Vue3 = Vue;
var createApp = Vue3.createApp;

var ringDistance = GameLogic.ringDistance;

createApp({
  data: function() {
    return {
      version: null,
      screen:'splash',
      currentTurnType:'player', currentTeamIndex:0, currentPhase:'roll',
      globalRound:1, ghostKingHP:80, bossPosition:1,
      bossStatus:{nextAttackMultiplier:1,isBossTurnSkip:false,sealedMovement:false,targetHighest:false},
      MUZAN_AVATAR:MUZAN_AVATAR,
      teams:defaultTeams(),
      lastSnapshot:null, bossTargets:[],
      gameLog:[],
      showSaveModal:false, showReviveModal:false,
      deadTeams:[], saveJsonStr:'',
      showCrowModal:false, crowMission:null, showCrowDesc:false,
      hasSavedGame:false, autoSaveMsg:'',
      animatingPositions:{}, hoppingTeam:null, isAnimating:false,
      showCardModal:false, cardModalData:null, pendingCardChoice:null,
      flashingCells:{}, floatingDamages:[],
      showTurnTransition:false, turnTransitionName:'', turnTransitionColor:'#e0d4c0', turnTransitionIsBoss:false,
      showUbuyashikiOverlay:false, ubuyashikiFadingOut:false,
      showDmgOverlay:false, dmgOverlayDmg:0, dmgOverlayTeam:'', dmgOverlayHP:0,
      showTeamHitOverlay:false, teamHitDmg:0, teamHitResults:[],
      flashingTeams:{},
      bossAnimatingPosition:null, hoppingBoss:false,
      rollTeamIndex:0,
      bigGameResults:[],
      judgeQueue:[],
      judgeTeamIndex:0,
      judgeWaitingRoll:false,
      countdownRemaining:600,
      countdownRunning:false,
    };
  },

  mounted: function() {
    try {
      var raw = localStorage.getItem('ds_monopoly_save');
      if (raw) { var d = JSON.parse(raw); if (d && d.screen === 'game') this.hasSavedGame = true; }
    } catch(e) {}
  },

  computed: {
    ringSize: function() { return this.version === 'danei' ? 12 : 16; },
    boardSize: function() { return this.version === 'danei' ? 4 : 5; },
    currentSquares: function() { return this.version === 'danei' ? SQUARES_DANEI : SQUARES; },
    currentBoardLayout: function() { return this.version === 'danei' ? BOARD_LAYOUT_DANEI : BOARD_LAYOUT; },
    controlPanelGridStyle: function() {
      return this.version === 'danei'
        ? 'grid-column:2/4;grid-row:2/4;'
        : 'grid-column:2/5;grid-row:2/5;';
    },
    nextTurnInfo: function() {
      if (this.currentPhase==='group-roll') {
        for (var i=this.rollTeamIndex+1;i<this.teams.length;i++) if(this.teams[i].hp>0) return {name:this.teams[i].name,color:this.teams[i].color};
        return null;
      }
      if (this.currentTurnType==='boss') {
        for (var j=0;j<this.teams.length;j++) if(this.teams[j].hp>0) return {name:this.teams[j].name,color:this.teams[j].color};
        return null;
      }
      return null;
    },
    phaseLabel: function() {
      return {'group-roll':'擲骰中','countdown':'任務執行中','team-judge':'逐隊結算','big-game':'大遊戲','big-game-results':'大遊戲結算','boss-roll':'鬼王移動','boss-attack':'鬼王攻擊','boss-next':'回合結算'}[this.currentPhase]||'';
    },
    countdownDisplay: function() {
      var m=Math.floor(this.countdownRemaining/60); var s=this.countdownRemaining%60;
      return (m<10?'0':'')+m+':'+(s<10?'0':'')+s;
    },
    rankedTeams: function() {
      return this.teams.slice().sort(function(a,b){return b.damageDealt-a.damageDealt;});
    },
    mostTraveledId: function() {
      var max=-1; var id=-1;
      for (var i=0;i<this.teams.length;i++) if (this.teams[i].totalSteps>max){max=this.teams[i].totalSteps;id=this.teams[i].id;}
      return id;
    },
    bossDisplayPos: function() {
      return this.bossAnimatingPosition!==null ? this.bossAnimatingPosition : this.bossPosition;
    },
    anyModalOpen: function() {
      return this.showCardModal || this.showCrowModal || this.showSaveModal || this.showReviveModal || this.showTurnTransition || this.showDmgOverlay || this.showTeamHitOverlay || this.showUbuyashikiOverlay;
    },
  },

  methods: {
    saveSnapshot: function() {
      this.lastSnapshot={
        ghostKingHP:this.ghostKingHP, bossPosition:this.bossPosition,
        currentTurnType:this.currentTurnType, currentTeamIndex:this.currentTeamIndex,
        currentPhase:this.currentPhase, globalRound:this.globalRound,
        bossStatus:{nextAttackMultiplier:this.bossStatus.nextAttackMultiplier,isBossTurnSkip:this.bossStatus.isBossTurnSkip,sealedMovement:this.bossStatus.sealedMovement,targetHighest:this.bossStatus.targetHighest},
        bossTargets:this.bossTargets.slice(),
        teams:this.teams.map(function(t){return{id:t.id,position:t.position,hp:t.hp,damageDealt:t.damageDealt,totalSteps:t.totalSteps||0,status:{shieldActive:t.status.shieldActive,doubleDamage:t.status.doubleDamage,breathEnhanced:t.status.breathEnhanced,revengeBlade:t.status.revengeBlade}};}),
      };
    },
    undoLastAction: function() {
      if (!this.lastSnapshot) return;
      var s=this.lastSnapshot;
      this.ghostKingHP=s.ghostKingHP; this.bossPosition=s.bossPosition;
      this.currentTurnType=s.currentTurnType; this.currentTeamIndex=s.currentTeamIndex;
      this.currentPhase=s.currentPhase; this.globalRound=s.globalRound;
      this.bossStatus={nextAttackMultiplier:s.bossStatus.nextAttackMultiplier,isBossTurnSkip:s.bossStatus.isBossTurnSkip,sealedMovement:s.bossStatus.sealedMovement,targetHighest:s.bossStatus.targetHighest};
      this.bossTargets=s.bossTargets.slice();
      var self=this;
      s.teams.forEach(function(saved){
        var team=self.teams.find(function(t){return t.id===saved.id;});
        if (team){team.position=saved.position;team.hp=saved.hp;team.damageDealt=saved.damageDealt;team.totalSteps=saved.totalSteps||0;team.status.shieldActive=saved.status.shieldActive;team.status.doubleDamage=saved.status.doubleDamage;team.status.breathEnhanced=saved.status.breathEnhanced||false;team.status.revengeBlade=saved.status.revengeBlade||false;}
      });
      this.addLog('system','↩ 已還原上一步'); this.lastSnapshot=null;
    },
    startGame: function() {
      localStorage.removeItem('ds_monopoly_save');
      this.hasSavedGame=false;
      this.screen='versionSelect';
    },
    selectVersion: function(v) {
      this.version=v;
      this.teams=v==='danei'?defaultTeams_DANEI():defaultTeams();
      this.ghostKingHP=v==='danei'?56:80; this.bossPosition=1;
      this.currentTurnType='player'; this.currentTeamIndex=0;
      this.currentPhase='group-roll'; this.globalRound=1;
      this.rollTeamIndex=0; this.bigGameResults=[]; this.judgeQueue=[]; this.judgeTeamIndex=0; this.judgeWaitingRoll=false;
      this.countdownRemaining=600; this.countdownRunning=false;
      this.bossStatus={nextAttackMultiplier:1,isBossTurnSkip:false,sealedMovement:false,targetHighest:false};
      this.gameLog=[]; this.bossTargets=[];
      localStorage.removeItem('ds_monopoly_save');
      this.screen='game';
      this.addLog('system','遊戲開始！第 1 輪，從 '+this.teams[0].name+' 開始擲骰！');
    },
    addLog: function(type,msg) {
      this.gameLog.unshift({type:type,msg:msg,time:nowStr()});
      if (this.screen==='game') this.autoSave();
    },
    autoSave: function() {
      try {
        localStorage.setItem('ds_monopoly_save', JSON.stringify({
          screen:'game',
          version:this.version,
          ghostKingHP:this.ghostKingHP, bossPosition:this.bossPosition,
          currentTurnType:this.currentTurnType, currentTeamIndex:this.currentTeamIndex,
          currentPhase:this.currentPhase, globalRound:this.globalRound,
          bossStatus:{nextAttackMultiplier:this.bossStatus.nextAttackMultiplier,isBossTurnSkip:this.bossStatus.isBossTurnSkip,sealedMovement:this.bossStatus.sealedMovement,targetHighest:this.bossStatus.targetHighest},
          teams:this.teams.map(function(t){return{id:t.id,position:t.position,hp:t.hp,damageDealt:t.damageDealt,totalSteps:t.totalSteps||0,status:{shieldActive:t.status.shieldActive,doubleDamage:t.status.doubleDamage,breathEnhanced:t.status.breathEnhanced,revengeBlade:t.status.revengeBlade}};}),
        }));
        var self=this;
        self.autoSaveMsg='● 已儲存';
        clearTimeout(self._saveTimer);
        self._saveTimer=setTimeout(function(){self.autoSaveMsg='';},1800);
      } catch(e) {}
    },
    restoreAutoSave: function() {
      try {
        var data=JSON.parse(localStorage.getItem('ds_monopoly_save'));
        this.ghostKingHP=data.ghostKingHP; this.bossPosition=data.bossPosition;
        this.currentTurnType=data.currentTurnType; this.currentTeamIndex=data.currentTeamIndex;
        this.currentPhase=data.currentPhase||'group-roll'; this.globalRound=data.globalRound;
        this.bossStatus={nextAttackMultiplier:data.bossStatus.nextAttackMultiplier,isBossTurnSkip:data.bossStatus.isBossTurnSkip,sealedMovement:data.bossStatus.sealedMovement||false,targetHighest:data.bossStatus.targetHighest||false};
        this.version=data.version||'xinsheng';
        var defaults=this.version==='danei'?defaultTeams_DANEI():defaultTeams();
        this.teams=data.teams.map(function(saved){
          var def=null; for(var i=0;i<defaults.length;i++)if(defaults[i].id===saved.id){def=defaults[i];break;}
          return{id:def.id,name:def.name,color:def.color,avatar:def.avatar,position:saved.position,hp:saved.hp,damageDealt:saved.damageDealt,totalSteps:saved.totalSteps||0,status:{shieldActive:saved.status.shieldActive,doubleDamage:saved.status.doubleDamage,breathEnhanced:saved.status.breathEnhanced||false,revengeBlade:saved.status.revengeBlade||false}};
        });
        this.bossTargets=[]; this.screen='game'; this.gameLog=[];
        this.addLog('system','↩ 已從自動儲存還原，第 '+this.globalRound+' 輪');
      } catch(e) { alert('還原失敗：'+e.message); }
    },
    logEntryClass: function(type) {
      return {damage:'text-red-400',success:'text-green-400',card:'text-yellow-400',system:'text-slate-400',fail:'text-orange-400',heal:'text-teal-400',shield:'text-cyan-400'}[type]||'text-slate-400';
    },
    squareAt: function(row,col) {
      var id=this.currentBoardLayout[row+'-'+col]; if (!id) return null;
      var squares=this.currentSquares;
      for (var i=0;i<squares.length;i++) if (squares[i].id===id) return squares[i];
      return null;
    },
    cellClass: function(row,col) {
      var sq=this.squareAt(row,col); if (!sq) return '';
      if (sq.type==='start') return 'cell-trace-red';
      if (sq.type==='card')  return 'cell-trace-purple';
      return 'cell-trace';
    },
    movePosition: function(pos,steps) { return GameLogic.movePosition(pos,steps,this.ringSize); },
    teamDisplayPos: function(team) {
      return this.animatingPositions[team.id] !== undefined
        ? this.animatingPositions[team.id]
        : team.position;
    },
    groupRoll: function(n) {
      this.saveSnapshot();
      var team=this.teams[this.rollTeamIndex];
      var startPos=team.position; var step=0; var self=this;
      this.isAnimating=true;
      function moveStep(){
        step++;
        var midPos=self.movePosition(startPos,step);
        var ap={}; for(var k in self.animatingPositions) ap[k]=self.animatingPositions[k];
        ap[team.id]=midPos; self.animatingPositions=ap;
        self.hoppingTeam=team.id;
        setTimeout(function(){self.hoppingTeam=null;},220);
        if(step<n){ setTimeout(moveStep,280); }
        else {
          setTimeout(function(){
            var wrapped=GameLogic.didWrap(startPos,n,self.ringSize);
            team.position=midPos; team.totalSteps=(team.totalSteps||0)+n;
            self.animatingPositions={}; self.isAnimating=false;
            if(wrapped){
              if(team.status.shieldActive){self.addLog('shield',team.name+' 繞完一圈！已有護盾，護盾保留。');}
              else{team.status.shieldActive=true;self.addLog('shield',team.name+' 繞完一圈！自動獲得護盾！');}
            }
            var sq=null; var squares=self.currentSquares;
            for(var i=0;i<squares.length;i++) if(squares[i].id===midPos){sq=squares[i];break;}
            var sqLabel=(sq&&sq.name)||('格'+midPos);
            self.addLog('system',team.name+' 擲出 '+n+'，移動到格 '+midPos+'「'+sqLabel+'」');
            if(sq && sq.type==='card'){
              self.currentTeamIndex=self.rollTeamIndex;
              var chanceCard=CHANCE_CARDS[Math.floor(Math.random()*CHANCE_CARDS.length)];
              self.pendingCardChoice={card:chanceCard,isChance:true};
              self.cardModalData={isChance:true,type:'機會卡',name:chanceCard.name,effect:chanceCard.effect};
              self.addLog('card',team.name+' 抽到機會卡：'+chanceCard.name);
              self.showCardModal=true;
            } else {
              self.advanceGroupRoll();
            }
          },280);
        }
      }
      setTimeout(moveStep,80);
    },
    advanceGroupRoll: function() {
      var nextIdx=-1;
      for(var i=this.rollTeamIndex+1;i<this.teams.length;i++) if(this.teams[i].hp>0){nextIdx=i;break;}
      if(nextIdx!==-1){
        this.rollTeamIndex=nextIdx; this.currentTeamIndex=nextIdx;
      } else {
        this.currentPhase='countdown'; this.countdownRemaining=600; this.countdownRunning=false;
        this.addLog('system','所有隊伍擲骰完畢！準備倒數計時。');
      }
    },
    startMission: function() {
      this.countdownRemaining=600; this.countdownRunning=true;
      var self=this;
      if(this._countdownInterval) clearInterval(this._countdownInterval);
      this._countdownInterval=setInterval(function(){
        if(self.countdownRemaining>0){self.countdownRemaining--;}
        else{self.countdownRunning=false;clearInterval(self._countdownInterval);}
      },1000);
      this.addLog('system','出發！10 分鐘倒數開始！');
    },
    endCountdown: function() {
      this.countdownRunning=false;
      if(this._countdownInterval) clearInterval(this._countdownInterval);
      this.addLog('system','時間到！開始逐隊結算。');
      this.judgeQueue=this.teams.filter(function(t){return t.hp>0;});
      this.judgeTeamIndex=0; this.judgeWaitingRoll=false;
      if(this.judgeQueue.length===0){this.currentPhase='big-game';return;}
      this.currentPhase='team-judge';
    },
    judgePass: function() {
      var t=this.judgeQueue[this.judgeTeamIndex];
      this.addLog('success',t.name+' 任務成功！擲骰攻擊鬼王。');
      this.judgeWaitingRoll=true;
    },
    judgeFail: function() {
      var t=this.judgeQueue[this.judgeTeamIndex];
      this.addLog('fail',t.name+' 任務失敗。');
      this.judgeWaitingRoll=false;
      this._judgeNext();
    },
    judgeRoll: function(n) {
      this.saveSnapshot();
      var t=this.judgeQueue[this.judgeTeamIndex];
      var actual=null; for(var j=0;j<this.teams.length;j++){if(this.teams[j].id===t.id){actual=this.teams[j];break;}}
      if(!actual) return;
      var result=GameLogic.calcTaskDamage(n,actual.status,actual.hp);
      var dmg=result.damage; var modNote=result.notes.join(' ');
      actual.status.breathEnhanced=result.status.breathEnhanced;
      actual.status.revengeBlade=result.status.revengeBlade;
      actual.status.doubleDamage=result.status.doubleDamage;
      actual.damageDealt+=dmg; this.ghostKingHP=Math.max(0,this.ghostKingHP-dmg);
      this.addLog('success',actual.name+' 攻擊鬼王 '+dmg+' 點'+(modNote?' （'+modNote.trim()+'）':'')+' ！鬼王剩 '+this.ghostKingHP+' HP');
      this.dmgOverlayDmg=dmg; this.dmgOverlayTeam=actual.name; this.dmgOverlayHP=this.ghostKingHP;
      this.showDmgOverlay=true;
      var self=this;
      setTimeout(function(){
        self.showDmgOverlay=false;
        if(self.ghostKingHP<=0){self.screen='finalStrike';return;}
        self.judgeWaitingRoll=false;
        self._judgeNext();
      },2000);
    },
    _judgeNext: function() {
      this.judgeTeamIndex++;
      if(this.judgeTeamIndex>=this.judgeQueue.length){this.currentPhase='big-game';}
    },
    startBigGameResults: function() {
      this.bigGameResults=this.teams.filter(function(t){return t.hp>0;})
        .map(function(t){return{teamId:t.id,name:t.name,color:t.color,won:false};});
      this.currentPhase='big-game-results';
    },
    toggleBigGameResult: function(teamId) {
      for(var i=0;i<this.bigGameResults.length;i++){
        if(this.bigGameResults[i].teamId===teamId){this.bigGameResults[i].won=!this.bigGameResults[i].won;break;}
      }
    },
    applyBigGameResults: function() {
      this.saveSnapshot();
      var wins=this.bigGameResults.filter(function(r){return r.won;}).length;
      if(wins>0){
        this.ghostKingHP=Math.max(0,this.ghostKingHP-wins);
        this.addLog('success','大遊戲結算：'+wins+' 隊獲勝，鬼王扣 '+wins+' HP！鬼王剩 '+this.ghostKingHP+' HP');
        if(this.ghostKingHP<=0){this.screen='finalStrike';return;}
      } else {
        this.addLog('system','大遊戲結算：無隊伍獲勝。');
      }
      var self=this;
      var startBoss=function(){
        self.currentTurnType='boss';
        if(self.bossStatus.isBossTurnSkip){
          self.bossStatus.isBossTurnSkip=false;
          self.addLog('system','白天來了：鬼王跳過本回合行動！');
          self.currentPhase='boss-next';
        } else { self.currentPhase='boss-roll'; }
        self.showTurnCard('鬼王無慘','#ff6818',true);
      };
      if(wins>0){
        this.dmgOverlayDmg=wins; this.dmgOverlayTeam='大遊戲'; this.dmgOverlayHP=this.ghostKingHP;
        this.showDmgOverlay=true;
        setTimeout(function(){self.showDmgOverlay=false;startBoss();},2000);
      } else { startBoss(); }
    },
    showTurnCard: function(name, color, isBoss) {
      this.turnTransitionName=name; this.turnTransitionColor=color; this.turnTransitionIsBoss=isBoss;
      this.showTurnTransition=true;
      var self=this; if(self._turnTimer) clearTimeout(self._turnTimer);
      self._turnTimer=setTimeout(function(){self.showTurnTransition=false;},1400);
    },
    closeCrowModal: function() {
      this.showCrowModal=false; this.showCrowDesc=false;
      if (this.currentPhase==='group-roll') this.advanceGroupRoll();
    },
    closeCardModal: function() {
      this.showCardModal=false;
      if(this.pendingCardChoice){
        var team=this.teams[this.rollTeamIndex];
        this.applyCard(this.pendingCardChoice.card,this.pendingCardChoice.isChance,team);
        this.pendingCardChoice=null;
        this.advanceGroupRoll();
      }
    },
    triggerDamageEffect: function(teamId, damage) {
      var team=null;
      for (var i=0;i<this.teams.length;i++) if(this.teams[i].id===teamId){team=this.teams[i];break;}
      if (!team) return;
      var sqId=this.teamDisplayPos(team);
      var nf=Object.assign({},this.flashingCells); nf[sqId]=true; this.flashingCells=nf;
      var nt=Object.assign({},this.flashingTeams); nt[teamId]=true; this.flashingTeams=nt;
      var entry={id:Date.now()+Math.random(),squareId:sqId,damage:damage};
      this.floatingDamages=this.floatingDamages.concat([entry]);
      var self=this;
      setTimeout(function(){var nf2=Object.assign({},self.flashingCells);delete nf2[sqId];self.flashingCells=nf2;},650);
      setTimeout(function(){var nt2=Object.assign({},self.flashingTeams);delete nt2[teamId];self.flashingTeams=nt2;},650);
      setTimeout(function(){self.floatingDamages=self.floatingDamages.filter(function(d){return d.id!==entry.id;});},950);
    },
    applyCard: function(card,isChance,team) {
      if (isChance) {
        if (card.id==='revive'){var dead=this.teams.filter(function(t){return t.hp<=0;});if(dead.length===0){this.addLog('system','死者甦醒：目前沒有陣亡隊伍，無效果。');}else if(dead.length===1){dead[0].hp=5;this.addLog('heal','死者甦醒：'+dead[0].name+' 復活，HP 恢復為 5！');}else{this.deadTeams=dead;this.showReviveModal=true;}}
        else if (card.id==='heal'){var prev=team.hp;team.hp=GameLogic.applyHeal(team.hp,5,12);this.addLog('heal','生命藥水：'+team.name+' 回復 '+(team.hp-prev)+' HP（現在 '+team.hp+' HP）');}
        else if (card.id==='shield'){team.status.shieldActive=true;this.addLog('shield','防護盾：'+team.name+' 獲得護盾標記！');}
        else if (card.id==='double'){team.status.doubleDamage=true;this.addLog('system','強化攻擊：'+team.name+' 獲得雙倍攻擊標記！');}
        else if (card.id==='breath'){team.status.breathEnhanced=true;this.addLog('system','呼吸法強化：'+team.name+' 下一次任務成功傷害固定為 6！');}
        else if (card.id==='revenge'){team.status.revengeBlade=true;this.addLog('system','復仇之刃：'+team.name+' 獲得標記，HP ≤ 3 時任務傷害 ×3！');}
        else if (card.id==='seal'){this.bossStatus.sealedMovement=true;this.addLog('system','鬼王封印：鬼王下一回合移動步數固定為 1！');}
        else if (card.id==='pillars'){
          this.addLog('heal','柱的支持：所有存活隊伍各回復 2 HP！');
          var pillarsResults=GameLogic.applyPillars(this.teams,12);
          for (var i=0;i<pillarsResults.length;i++){var pr=pillarsResults[i];var t=null;for(var j=0;j<this.teams.length;j++)if(this.teams[j].id===pr.teamId){t=this.teams[j];break;}if(!t)continue;var prev2=t.hp;t.hp=pr.newHP;this.addLog('heal',t.name+' 回復 '+(t.hp-prev2)+' HP（現在 '+t.hp+'）');}
        }
      } else {
        if (card.id==='night'){this.bossStatus.nextAttackMultiplier=2;this.addLog('system','夜晚來臨：鬼王下一次攻擊傷害 ×2！');}
        else if (card.id==='day'){this.bossStatus.isBossTurnSkip=true;this.addLog('system','白天來了：鬼王下一回合將跳過行動！');}
        else if (card.id==='blast'){
          this.addLog('damage','鬼放大招：無慘對所有存活隊伍造成 3 點傷害！');
          var blastResults=GameLogic.applyBlast(this.teams);
          for (var i=0;i<blastResults.length;i++){var br=blastResults[i];var t=null;for(var j=0;j<this.teams.length;j++)if(this.teams[j].id===br.teamId){t=this.teams[j];break;}if(!t)continue;if(br.shieldConsumed){t.status.shieldActive=false;this.addLog('shield',t.name+' 護盾抵擋了大招！');}else{t.hp=br.newHP;this.addLog('damage',t.name+' 受到 3 點傷害，剩餘 '+t.hp+' HP'+(t.hp<=0?'（已陣亡！）':''));this.triggerDamageEffect(t.id,3);}}
          this.checkAllDead();
        } else if (card.id==='peace'){this.addLog('system','真是個平安的一天：無事發生。');}
        else if (card.id==='regen'){var prev3=this.ghostKingHP;this.ghostKingHP=GameLogic.applyRegen(this.ghostKingHP,5,this.version==='danei'?56:80);this.addLog('system','無慘再生：鬼王回復 '+(this.ghostKingHP-prev3)+' HP（現在 '+this.ghostKingHP+'）！');}
        else if (card.id==='kokushibo'){this.bossStatus.targetHighest=true;this.addLog('system','黑死牟降臨：鬼王本回合攻擊目標改為血量最多的隊伍！');}
      }
    },
    reviveTeam: function(teamId) {
      for (var i=0;i<this.teams.length;i++) if(this.teams[i].id===teamId){this.teams[i].hp=5;this.addLog('heal','死者甦醒：'+this.teams[i].name+' 復活，HP 恢復為 5！');break;}
      this.showReviveModal=false; this.deadTeams=[];
    },
    calcBossTargets: function() {
      var targets=GameLogic.calcBossTargets(this.bossPosition,this.bossStatus.targetHighest,this.teams,this.ringSize);
      this.bossStatus.targetHighest=false;
      return targets;
    },
    bossRoll: function(n) {
      this.saveSnapshot();
      if(this.bossStatus.sealedMovement){n=1;this.bossStatus.sealedMovement=false;this.addLog('system','鬼王封印：移動步數被強制為 1！');}
      var startPos=this.bossPosition; var step=0; var self=this;
      this.isAnimating=true;
      function moveBossStep(){
        step++;
        var midPos=self.movePosition(startPos,step);
        self.bossAnimatingPosition=midPos;
        self.hoppingBoss=true;
        setTimeout(function(){self.hoppingBoss=false;},220);
        if(step<n){
          setTimeout(moveBossStep,280);
        } else {
          setTimeout(function(){
            self.bossPosition=midPos; self.bossAnimatingPosition=null; self.isAnimating=false;
            self.addLog('system','鬼王無慘擲出 '+n+'，移動到格 '+midPos);
            self.bossTargets=self.calcBossTargets(); self.currentPhase='boss-attack';
          },280);
        }
      }
      setTimeout(moveBossStep,80);
    },
    bossAttack: function(n) {
      this.saveSnapshot();
      var mult=this.bossStatus.nextAttackMultiplier; var baseDmg=n*mult; this.bossStatus.nextAttackMultiplier=1;
      this.addLog('damage','鬼王無慘發動攻擊！骰子 '+n+(mult>1?' ×'+mult:'')+' = '+baseDmg+' 傷害');
      var self=this;
      var currentTargets=this.bossTargets.map(function(ref){return self.teams.find(function(t){return t.id===ref.id;});}).filter(function(t){return t&&t.hp>0;});
      var attackResults=GameLogic.applyBossAttack(currentTargets,baseDmg);
      for (var i=0;i<attackResults.length;i++){
        var r=attackResults[i]; var team=null;
        for (var j=0;j<this.teams.length;j++) if(this.teams[j].id===r.teamId){team=this.teams[j];break;}
        if(!team) continue;
        if(r.shieldConsumed){team.status.shieldActive=false;this.addLog('shield',team.name+' 的護盾擋下了攻擊！');}
        else{team.hp=r.newHP;this.addLog('damage',team.name+' 受到 '+baseDmg+' 點傷害，剩餘 '+team.hp+' HP'+(team.hp<=0?'（已陣亡！）':''));this.triggerDamageEffect(team.id,baseDmg);}
      }
      this.currentPhase='boss-next'; this.checkAllDead();
      var hitResults=[];
      for (var k=0;k<attackResults.length;k++){
        var ar=attackResults[k]; if(ar.shieldConsumed) continue;
        var ht=null; for(var m=0;m<this.teams.length;m++) if(this.teams[m].id===ar.teamId){ht=this.teams[m];break;}
        if(ht) hitResults.push({id:ht.id,name:ht.name,color:ht.color,hp:ht.hp,dead:ht.hp<=0});
      }
      if(hitResults.length>0){
        this.teamHitDmg=baseDmg; this.teamHitResults=hitResults; this.showTeamHitOverlay=true;
        setTimeout(function(){ self.showTeamHitOverlay=false; }, 2500);
      }
    },
    endBossTurn: function() {
      this.saveSnapshot(); this.globalRound++;
      var firstIdx=-1;
      for(var i=0;i<this.teams.length;i++) if(this.teams[i].hp>0){firstIdx=i;break;}
      if(firstIdx===-1){this.screen='bossVictory';return;}
      this.bossTargets=[]; this.addLog('system','第 '+this.globalRound+' 輪開始！');
      this.currentTurnType='player'; this.currentTeamIndex=firstIdx;
      this.rollTeamIndex=firstIdx; this.bigGameResults=[];
      this.currentPhase='group-roll';
    },
    checkAllDead: function() {
      for (var i=0;i<this.teams.length;i++) if(this.teams[i].hp>0) return;
      var self=this;
      this.showUbuyashikiOverlay=true; this.ubuyashikiFadingOut=false;
      this.addLog('system','御館様降臨！全隊伍起死回生，HP 回復至 3。');
      setTimeout(function(){
        self.ubuyashikiFadingOut=true;
        setTimeout(function(){
          self.showUbuyashikiOverlay=false; self.ubuyashikiFadingOut=false;
          for(var i=0;i<self.teams.length;i++){ if(self.teams[i].hp<=0) self.teams[i].hp=3; }
        }, 800);
      }, 3800);
    },
    generateSave: function() {
      var data={ghostKingHP:this.ghostKingHP,bossPosition:this.bossPosition,currentTurnType:this.currentTurnType,currentTeamIndex:this.currentTeamIndex,currentPhase:this.currentPhase,globalRound:this.globalRound,bossStatus:{nextAttackMultiplier:this.bossStatus.nextAttackMultiplier,isBossTurnSkip:this.bossStatus.isBossTurnSkip,sealedMovement:this.bossStatus.sealedMovement,targetHighest:this.bossStatus.targetHighest},teams:this.teams.map(function(t){return{id:t.id,position:t.position,hp:t.hp,damageDealt:t.damageDealt,totalSteps:t.totalSteps||0,status:{shieldActive:t.status.shieldActive,doubleDamage:t.status.doubleDamage,breathEnhanced:t.status.breathEnhanced,revengeBlade:t.status.revengeBlade}};})};
      this.saveJsonStr=JSON.stringify(data,null,2);
    },
    loadSave: function() {
      try {
        var data=JSON.parse(this.saveJsonStr);
        this.ghostKingHP=data.ghostKingHP;this.bossPosition=data.bossPosition;this.currentTurnType=data.currentTurnType;this.currentTeamIndex=data.currentTeamIndex;this.currentPhase=data.currentPhase||'group-roll';this.globalRound=data.globalRound;
        this.bossStatus={nextAttackMultiplier:data.bossStatus.nextAttackMultiplier,isBossTurnSkip:data.bossStatus.isBossTurnSkip,sealedMovement:data.bossStatus.sealedMovement||false,targetHighest:data.bossStatus.targetHighest||false};
        var defaults=defaultTeams();
        this.teams=data.teams.map(function(saved){var def=null;for(var i=0;i<defaults.length;i++)if(defaults[i].id===saved.id){def=defaults[i];break;}return{id:def.id,name:def.name,color:def.color,avatar:def.avatar,position:saved.position,hp:saved.hp,damageDealt:saved.damageDealt,totalSteps:saved.totalSteps||0,status:{shieldActive:saved.status.shieldActive,doubleDamage:saved.status.doubleDamage,breathEnhanced:saved.status.breathEnhanced||false,revengeBlade:saved.status.revengeBlade||false}};});
        this.bossTargets=[];this.showSaveModal=false;this.screen='game';this.gameLog=[];
        this.addLog('system','已從存檔還原，第 '+this.globalRound+' 輪');
      } catch(e) { alert('讀取失敗，JSON 格式錯誤：'+e.message); }
    },
  },
}).mount('#app');
