var SQUARES = [
  { id:1,  type:'start', name:'【牧師館的點心時間】',   desc:'請到牧師館，全員必須用湯匙吃完愛玉。',                                                                     name2:'START',          desc2:'請到牧師館，吃水果。',                        damage:10 },
  { id:2,  type:'task',  name:'【主日學的默契考驗】',   desc:'請到主日學教室，全員合力將氣球拍進呼拉圈裡。',                                    name2:'接力搬物',       desc2:'請到主日學教室，全隊接力每人搬一樣東西回原位',              damage:10 },
  { id:3,  type:'card',  name:'【猜拳命運抽】',          desc:'原地跟鬼王猜拳，抽取隨機卡片',                   taskName:'【齊聲宣告】', taskDesc:'全隊同聲喊出本週金句一次，聲音要整齊響亮。', taskName2:'【齊聲宣告】', taskDesc2:'全隊同聲喊出本週金句一次，聲音要整齊響亮。', taskDamage:10 },
  { id:4,  type:'task',  name:'【副歌大挑戰】',          desc:'請挑一首夏令營的詩歌，唱一次副歌。',                                                                       name2:'隊伍舞蹈',       desc2:'全隊模仿工作人員指定動作，維持 10 秒。',                            damage:5  },
  { id:5,  type:'task',  name:'【密室解碼：背金句】',   desc:'請到會議室，全隊接力，一字不漏地背誦指定經文。',                                  name2:'合唱詩歌',       desc2:'請到會議室，全隊合唱一首夏令營歌曲。',                              damage:10 },
  { id:6,  type:'task',  name:'【體能試煉：開合跳】',   desc:'請到車棚，全隊一起完成開合跳 30 下（或累積加總 100 下），動作須整齊劃一。',                               name2:'最快排列',       desc2:'請到車棚，全隊累積跳繩 100 下。',                                damage:10 },
  { id:7,  type:'task',  name:'【失落的教會寶物】',     desc:'請到主日學教室，根據關主提示找出隱藏的「物品」，找到後回來。',                              name2:'找紙條',         desc2:'請到主日學教室，找到工作人員藏的紙條並唸出來',              damage:10 },
  { id:8,  type:'task',  name:'【潛行修煉】',             desc:'原地不發出聲音直到下回合。',                                                                                 name2:'全隊伏地挺身',   desc2:'原地全隊同時做伏地挺身 5 下',                               damage:5  },
  { id:9,  type:'task',  name:'【聖光普照大合照】',     desc:'全員與新生教會招牌拍照',                                                                                   name2:'創意合照',       desc2:'請到備課教室，模仿一個場景拍照。',                  damage:10 },
  { id:10, type:'task',  name:'【智力風暴：聖經測驗】', desc:'請到會議室，全隊合力完成一張特殊考卷，通過後回來。',                                                      name2:'白板接龍',       desc2:'請到會議室，白板寫出戲劇中的五個角色。',                  damage:10 },
  { id:11, type:'task',  name:'【車棚的劍客修煉】',     desc:'請到車棚，手持日輪刀，全體累積揮刀 100 下。',                                                              name2:'喊隊伍口號',     desc2:'請到車棚，全隊需將沙灘球向上拍打 10 下。',                        damage:10 },
  { id:12, type:'card',  name:'【正反面命運】',          desc:'原地跟鬼王拼運氣（丟銅板），抽取隨機卡片',       taskName:'【全隊深蹲】', taskDesc:'全隊原地一起做深蹲 10 下，動作要同步整齊。', taskName2:'【全隊深蹲】', taskDesc2:'全隊原地一起做深蹲 10 下，動作要同步整齊。', taskDamage:10 },
  { id:13, type:'task',  name:'【造方舟拼圖挑戰】',     desc:'請到主日學教室，用巧拼地墊在地上拼出十字架圖案。',                                                         name2:'自創圖案',       desc2:'請到主日學教室，將球池的球依照顏色分類。', damage:10 },
  { id:14, type:'task',  name:'【命運骰子對決】',        desc:'原地跟鬼王骰子比大小',                                                                                     name2:'猜拳淘汰賽',     desc2:'原地折 30 架紙飛機。',                      damage:10 },
  { id:15, type:'task',  name:'【備課室的聖水試煉】',   desc:'請到備課教室，全隊將合力將飲料全部喝完。',         name2:'蓋章任務',       desc2:'請到備課教室，找到工作人員並完成一個指定挑戰。',                            damage:10 },
  { id:16, type:'task',  name:'【聖言宣讀】',            desc:'請到會議室，念一段聖經。',                                                                                                                                                         name2:'【甩杯絕技】',    desc2:'請到會議室，成功甩寶特瓶 5 次。',                          damage:10 },
];

var BOARD_LAYOUT = {
  '1-1':1, '1-2':2, '1-3':3, '1-4':4, '1-5':5,
  '2-5':6, '3-5':7, '4-5':8,
  '5-5':9, '5-4':10,'5-3':11,'5-2':12,'5-1':13,
  '4-1':14,'3-1':15,'2-1':16,
};

var CHANCE_CARDS = [
  { id:'revive',  name:'死者甦醒',   effect:'復活一隊已陣亡的小組，HP 重置為 5' },
  { id:'heal',    name:'生命藥水',   effect:'本組回復 5 HP（上限 10）' },
  { id:'shield',  name:'防護盾',     effect:'獲得護盾標記，下次鬼王攻擊無效' },
  { id:'double',  name:'強化攻擊',   effect:'獲得雙倍標記，任務成功時傷害加倍' },
  { id:'breath',  name:'呼吸法強化', effect:'下一次任務成功，傷害固定為 6（不受骰子影響）' },
  { id:'revenge', name:'復仇之刃',   effect:'若本組 HP ≤ 3，下一次任務傷害 ×3；HP 較高則無效' },
  { id:'seal',    name:'鬼王封印',   effect:'鬼王下一回合移動步數固定為 1' },
  { id:'pillars', name:'柱的支持',   effect:'場上所有存活隊伍各立即回復 2 HP' },
];

var FATE_CARDS = [
  { id:'night',     name:'夜晚來臨',         effect:'鬼王下一回合攻擊傷害 ×2' },
  { id:'day',       name:'白天來了',          effect:'鬼王下一回合暫停行動' },
  { id:'blast',     name:'鬼放大招',          effect:'無慘立即對所有存活隊伍造成 3 點傷害' },
  { id:'peace',     name:'真是個平安的一天', effect:'無事發生' },
  { id:'regen',     name:'無慘再生',          effect:'鬼王立即回復 5 HP（上限 100）' },
  { id:'kokushibo', name:'黑死牟降臨',        effect:'鬼王本回合攻擊目標改為血量最多的隊伍' },
];

var MUZAN_AVATAR = 'assets/avatar-muzan.png';

function defaultTeams() {
  return [
    { id:1, name:'霞柱 ‧ 時透',   color:'#14b8a6', position:1, hp:10, damageDealt:0, status:{shieldActive:false,doubleDamage:false,breathEnhanced:false,revengeBlade:false}, totalSteps:0, avatar:'assets/avatar-tokito.png',  pendingTask:null },
    { id:2, name:'水柱 ‧ 義勇',   color:'#3b82f6', position:1, hp:10, damageDealt:0, status:{shieldActive:false,doubleDamage:false,breathEnhanced:false,revengeBlade:false}, totalSteps:0, avatar:'assets/avatar-tomioka.png', pendingTask:null },
    { id:3, name:'炎柱 ‧ 杏壽郎', color:'#f97316', position:1, hp:10, damageDealt:0, status:{shieldActive:false,doubleDamage:false,breathEnhanced:false,revengeBlade:false}, totalSteps:0, avatar:'assets/avatar-rengoku.png', pendingTask:null },
    { id:4, name:'蛇柱 ‧ 伊黑',   color:'#a855f7', position:1, hp:10, damageDealt:0, status:{shieldActive:false,doubleDamage:false,breathEnhanced:false,revengeBlade:false}, totalSteps:0, avatar:'assets/avatar-iguro.png',   pendingTask:null },
    { id:5, name:'蟲柱 ‧ 忍',     color:'#ec4899', position:1, hp:10, damageDealt:0, status:{shieldActive:false,doubleDamage:false,breathEnhanced:false,revengeBlade:false}, totalSteps:0, avatar:'assets/avatar-shinobu.png', pendingTask:null },
    { id:6, name:'風柱 ‧ 實彌',   color:'#22c55e', position:1, hp:10, damageDealt:0, status:{shieldActive:false,doubleDamage:false,breathEnhanced:false,revengeBlade:false}, totalSteps:0, avatar:'assets/avatar-sanemi.png',  pendingTask:null },
  ];
}

function nowStr() {
  var d=new Date();
  return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0')+':'+d.getSeconds().toString().padStart(2,'0');
}

var SQUARES_DANEI = [
  { id:1,  type:'start', name:'【起點】',               desc:'所有隊伍從這裡出發。',                           name2:'START',         desc2:'所有隊伍從這裡出發。',           damage:10 },
  { id:2,  type:'task',  name:'【任務 2】',              desc:'（大內教會版本任務，待補充）',                  name2:'任務 2',        desc2:'（待補充）',                      damage:10 },
  { id:3,  type:'task',  name:'【任務 3】',              desc:'（大內教會版本任務，待補充）',                  name2:'任務 3',        desc2:'（待補充）',                      damage:10 },
  { id:4,  type:'task',  name:'【任務 4】',              desc:'（大內教會版本任務，待補充）',                  name2:'任務 4',        desc2:'（待補充）',                      damage:10 },
  { id:5,  type:'task',  name:'【任務 5】',              desc:'（大內教會版本任務，待補充）',                  name2:'任務 5',        desc2:'（待補充）',                      damage:10 },
  { id:6,  type:'card',  name:'【猜拳命運抽】',          desc:'原地跟鬼王猜拳，抽取隨機卡片',                 taskName:'【齊聲宣告】', taskDesc:'全隊同聲喊出本週金句一次。', taskName2:'【齊聲宣告】', taskDesc2:'全隊同聲喊出本週金句一次。', taskDamage:10 },
  { id:7,  type:'task',  name:'【任務 7】',              desc:'（大內教會版本任務，待補充）',                  name2:'任務 7',        desc2:'（待補充）',                      damage:10 },
  { id:8,  type:'task',  name:'【任務 8】',              desc:'（大內教會版本任務，待補充）',                  name2:'任務 8',        desc2:'（待補充）',                      damage:10 },
  { id:9,  type:'task',  name:'【任務 9】',              desc:'（大內教會版本任務，待補充）',                  name2:'任務 9',        desc2:'（待補充）',                      damage:10 },
  { id:10, type:'task',  name:'【任務 10】',             desc:'（大內教會版本任務，待補充）',                  name2:'任務 10',       desc2:'（待補充）',                      damage:10 },
  { id:11, type:'task',  name:'【任務 11】',             desc:'（大內教會版本任務，待補充）',                  name2:'任務 11',       desc2:'（待補充）',                      damage:10 },
  { id:12, type:'card',  name:'【正反面命運】',          desc:'原地跟鬼王拼運氣（丟銅板），抽取隨機卡片',     taskName:'【全隊深蹲】', taskDesc:'全隊原地一起做深蹲 10 下。', taskName2:'【全隊深蹲】', taskDesc2:'全隊原地一起做深蹲 10 下。', taskDamage:10 },
];

var BOARD_LAYOUT_DANEI = {
  '1-1':1, '1-2':2, '1-3':3, '1-4':4,
  '2-4':5, '3-4':6,
  '4-4':7, '4-3':8, '4-2':9, '4-1':10,
  '3-1':11,'2-1':12,
};

function defaultTeams_DANEI() {
  return [
    { id:1, name:'蟲柱 ‧ 胡蝶忍', color:'#ec4899', position:1, hp:10, damageDealt:0, status:{shieldActive:false,doubleDamage:false,breathEnhanced:false,revengeBlade:false}, totalSteps:0, avatar:'assets/avatar-shinobu.png', pendingTask:null },
    { id:2, name:'水柱 ‧ 義勇',   color:'#3b82f6', position:1, hp:10, damageDealt:0, status:{shieldActive:false,doubleDamage:false,breathEnhanced:false,revengeBlade:false}, totalSteps:0, avatar:'assets/avatar-tomioka.png', pendingTask:null },
    { id:3, name:'霞柱 ‧ 時透',   color:'#14b8a6', position:1, hp:10, damageDealt:0, status:{shieldActive:false,doubleDamage:false,breathEnhanced:false,revengeBlade:false}, totalSteps:0, avatar:'assets/avatar-tokito.png',  pendingTask:null },
    { id:4, name:'蛇柱 ‧ 伊黑',   color:'#a855f7', position:1, hp:10, damageDealt:0, status:{shieldActive:false,doubleDamage:false,breathEnhanced:false,revengeBlade:false}, totalSteps:0, avatar:'assets/avatar-iguro.png',   pendingTask:null },
  ];
}
