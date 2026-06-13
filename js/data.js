var SQUARES = [
  { id:1,  type:'start', name:'【牧師館的點心時間】',   desc:'到牧師館合力把愛玉吃完' },
  { id:2,  type:'task',  name:'【默契大考驗】',          desc:'請到主日學教室，全員合力將氣球拍進呼拉圈裡。' },
  { id:3,  type:'card',  name:'【猜拳命運】',             desc:'原地跟鬼王猜拳，獲勝獲得技能卡' },
  { id:4,  type:'task',  name:'【K歌王】',               desc:'請到禮拜堂，挑一首詩歌，大合唱' },
  { id:5,  type:'task',  name:'【金句密碼】',             desc:'請到禮拜堂，解開一段聖經密碼，找出關鍵經文' },
  { id:6,  type:'task',  name:'【體能測試】',             desc:'請到禮拜堂，全隊一起完成開合跳 30 下' },
  { id:7,  type:'task',  name:'【失落的寶物】',           desc:'主日學教室藏了神秘物品，找到就有獎' },
  { id:8,  type:'task',  name:'【潛行修煉】',             desc:'請到禮拜堂，地板不出聲到下一關，不能說話' },
  { id:9,  type:'task',  name:'【光天化日】',             desc:'和新生教會招牌和老師拍一張搞怪合照' },
  { id:10, type:'task',  name:'【智力風暴】',             desc:'請到會議室挑戰聖經知識考卷，通過他！' },
  { id:11, type:'task',  name:'【劍客修煉】',             desc:'請到車棚，手持日輪刀，全體累積揮刀 100 下。' },
  { id:12, type:'card',  name:'【正反命運】',             desc:'原地跟鬼王玩拼運氣遊戲（丟銅板），抽卡！' },
  { id:13, type:'task',  name:'【十字架拼】',             desc:'請到主日學教室合力拼完成一個十字架或教會主題圖案' },
  { id:14, type:'task',  name:'【命運的籌組】',           desc:'請到禮拜堂，抽四張牌，必須加減成指定的數字' },
  { id:15, type:'task',  name:'【飲用聖水】',             desc:'到備課室全隊把飲料喝完' },
  { id:16, type:'task',  name:'【聖經接龍】',             desc:'到會議室接力說出聖經金句，看誰最不會卡' },
];

var BOARD_LAYOUT = {
  '1-1':1, '1-2':2, '1-3':3, '1-4':4, '1-5':5,
  '2-5':6, '3-5':7, '4-5':8,
  '5-5':9, '5-4':10,'5-3':11,'5-2':12,'5-1':13,
  '4-1':14,'3-1':15,'2-1':16,
};

var CHANCE_CARDS = [
  { id:'revive',  name:'死者甦醒',   effect:'復活一隊已陣亡的小組，HP 重置為 5' },
  { id:'heal',    name:'生命藥水',   effect:'本組回復 5 HP（上限 12）' },
  { id:'shield',  name:'防護盾',     effect:'獲得護盾標記，下次鬼王攻擊無效' },
  { id:'double',  name:'強化攻擊',   effect:'獲得雙倍標記，任務成功時傷害加倍' },
  { id:'breath',  name:'呼吸法強化', effect:'下一次任務成功，傷害固定為 6（不受骰子影響）' },
  { id:'revenge', name:'復仇之刃',   effect:'若本組 HP ≤ 3，下一次任務傷害 ×3；HP 較高則無效' },
  { id:'seal',    name:'鬼王封印',   effect:'鬼王下一回合移動步數固定為 1' },
  { id:'pillars', name:'柱的支持',   effect:'場上所有存活隊伍各立即回復 2 HP' },
];


var MUZAN_AVATAR = 'assets/avatar-muzan.png';

function defaultTeams() {
  return [
    { id:1, name:'霞柱 ‧ 時透',   color:'#14b8a6', position:1, hp:12, damageDealt:0, status:{shieldActive:false,doubleDamage:false,breathEnhanced:false,revengeBlade:false}, totalSteps:0, avatar:'assets/avatar-tokito.png'  },
    { id:2, name:'水柱 ‧ 義勇',   color:'#3b82f6', position:1, hp:12, damageDealt:0, status:{shieldActive:false,doubleDamage:false,breathEnhanced:false,revengeBlade:false}, totalSteps:0, avatar:'assets/avatar-tomioka.png' },
    { id:3, name:'炎柱 ‧ 杏壽郎', color:'#f97316', position:1, hp:12, damageDealt:0, status:{shieldActive:false,doubleDamage:false,breathEnhanced:false,revengeBlade:false}, totalSteps:0, avatar:'assets/avatar-rengoku.png' },
    { id:4, name:'蛇柱 ‧ 伊黑',   color:'#a855f7', position:1, hp:12, damageDealt:0, status:{shieldActive:false,doubleDamage:false,breathEnhanced:false,revengeBlade:false}, totalSteps:0, avatar:'assets/avatar-iguro.png'   },
    { id:5, name:'蟲柱 ‧ 忍',     color:'#ec4899', position:1, hp:12, damageDealt:0, status:{shieldActive:false,doubleDamage:false,breathEnhanced:false,revengeBlade:false}, totalSteps:0, avatar:'assets/avatar-shinobu.png' },
    { id:6, name:'風柱 ‧ 實彌',   color:'#22c55e', position:1, hp:12, damageDealt:0, status:{shieldActive:false,doubleDamage:false,breathEnhanced:false,revengeBlade:false}, totalSteps:0, avatar:'assets/avatar-sanemi.png'  },
  ];
}

function nowStr() {
  var d=new Date();
  return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0')+':'+d.getSeconds().toString().padStart(2,'0');
}

var SQUARES_DANEI = [
  { id:1,  type:'start', name:'【起點】',               desc:'所有隊伍從這裡出發。' },
  { id:2,  type:'task',  name:'【任務 2】',              desc:'（大內教會版本任務，待補充）' },
  { id:3,  type:'task',  name:'【任務 3】',              desc:'（大內教會版本任務，待補充）' },
  { id:4,  type:'task',  name:'【任務 4】',              desc:'（大內教會版本任務，待補充）' },
  { id:5,  type:'task',  name:'【任務 5】',              desc:'（大內教會版本任務，待補充）' },
  { id:6,  type:'card',  name:'【猜拳命運抽】',          desc:'原地跟鬼王猜拳，抽取隨機卡片' },
  { id:7,  type:'task',  name:'【任務 7】',              desc:'（大內教會版本任務，待補充）' },
  { id:8,  type:'task',  name:'【任務 8】',              desc:'（大內教會版本任務，待補充）' },
  { id:9,  type:'task',  name:'【任務 9】',              desc:'（大內教會版本任務，待補充）' },
  { id:10, type:'task',  name:'【任務 10】',             desc:'（大內教會版本任務，待補充）' },
  { id:11, type:'task',  name:'【任務 11】',             desc:'（大內教會版本任務，待補充）' },
  { id:12, type:'card',  name:'【正反面命運】',          desc:'原地跟鬼王拼運氣（丟銅板），抽取隨機卡片' },
];

var BOARD_LAYOUT_DANEI = {
  '1-1':1, '1-2':2, '1-3':3, '1-4':4,
  '2-4':5, '3-4':6,
  '4-4':7, '4-3':8, '4-2':9, '4-1':10,
  '3-1':11,'2-1':12,
};

function defaultTeams_DANEI() {
  return [
    { id:1, name:'蟲柱 ‧ 胡蝶忍', color:'#ec4899', position:1, hp:12, damageDealt:0, status:{shieldActive:false,doubleDamage:false,breathEnhanced:false,revengeBlade:false}, totalSteps:0, avatar:'assets/avatar-shinobu.png' },
    { id:2, name:'水柱 ‧ 義勇',   color:'#3b82f6', position:1, hp:12, damageDealt:0, status:{shieldActive:false,doubleDamage:false,breathEnhanced:false,revengeBlade:false}, totalSteps:0, avatar:'assets/avatar-tomioka.png' },
    { id:3, name:'霞柱 ‧ 時透',   color:'#14b8a6', position:1, hp:12, damageDealt:0, status:{shieldActive:false,doubleDamage:false,breathEnhanced:false,revengeBlade:false}, totalSteps:0, avatar:'assets/avatar-tokito.png'  },
    { id:4, name:'蛇柱 ‧ 伊黑',   color:'#a855f7', position:1, hp:12, damageDealt:0, status:{shieldActive:false,doubleDamage:false,breathEnhanced:false,revengeBlade:false}, totalSteps:0, avatar:'assets/avatar-iguro.png'   },
  ];
}
