import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
const html=readFileSync(new URL('../solar-shift.html',import.meta.url),'utf8');
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
const context=vm.createContext({});
vm.runInContext(script.slice(0,script.indexOf('function safeError'))+'\nglobalThis.Game=SolarGame;globalThis.projects=PROJECTS;',context);
const {Game,projects}=context;
test('dust takes four times as long, stops at night, and upgrades stay cleaner',()=>{
 for(const [tier,base] of [[1,85],[2,125],[3,170]]){
  const g=new Game(),r=g.racks[0];r.owned=true;r.dirt=0;r.tier=tier;
  for(let i=0;i<1000;i++)g.tick(.1);
  assert.ok(Math.abs(r.dirt-100/(base*4))<1e-9);
  g.time=190;const dust=r.dirt;g.tick(.1);assert.equal(r.dirt,dust);
 }
});
test('sun points come from generation, not collecting cash, and stop with dirty racks or at night',()=>{
 const g=new Game();g.racks.forEach(r=>{r.dirt=1;r.pending=0;});
 g.tick(.1);assert.equal(g.community.energy,0);
 const r=g.racks[0];r.owned=true;r.dirt=0;r.cycle=7.95;g.tick(.1);assert.equal(g.community.energy,1);assert.equal(g.community.generated,1);
 g.player={x:r.x,z:r.z};g.tick(.1);assert.equal(g.community.energy,1);assert.equal(g.money,304);
 g.time=190;r.cycle=7.95;g.tick(.1);assert.equal(g.community.energy,1);
});
test('projects enforce care and energy requirements, spend once and unlock repeat requests',()=>{
 const g=new Game();g.community.energy=5000;
 assert.equal(g.contribute().ok,false);assert.equal(g.community.energy,5000);
 g.stats.cleaned=3;g.community.energy=199;assert.equal(g.contribute().ok,false);
 g.community.energy=5000;
 for(let i=0;i<projects.length;i++){
  g.stats.upgrades=3;g.tool=1;const before=g.money,energy=g.community.energy,p=projects[i];
  assert.equal(g.contribute().ok,true);assert.equal(g.community.projects,i+1);assert.equal(g.money,before+p.reward);assert.equal(g.community.energy,energy-p.cost);
 }
 assert.equal(g.communityGoal().repeat,true);const before=g.community.energy;
 assert.equal(g.contribute().ok,true);assert.equal(g.community.deliveries,1);assert.equal(g.community.energy,before-500);assert.equal(g.communityGoal().cost,650);
});
test('legacy saves, new progress, malformed data, and fresh starts',()=>{
 const g=new Game();g.money=222;g.community={energy:321,generated:600,projects:2,deliveries:0};
 const saved=JSON.parse(JSON.stringify(g.snapshot())),loaded=new Game(saved);
 assert.equal(loaded.money,222);assert.equal(loaded.community.projects,2);assert.equal(loaded.community.energy,321);
 delete saved.community;assert.equal(new Game(saved).community.projects,0);assert.equal(new Game(saved).money,222);
 saved.community={energy:-1,projects:Infinity,deliveries:2.7,generated:null};const safe=new Game(saved);
 assert.equal(safe.community.energy,0);assert.equal(safe.community.projects,0);assert.equal(safe.community.deliveries,2);
 assert.equal(new Game().community.generated,0);
});
test('all rack collection points remain reachable around community buildings',()=>{
 const farm=new Game();farm.racks.forEach(r=>r.owned=true);const nav=vm.createContext({game:farm});
 const start=script.indexOf('const obstacles=[]'),end=script.indexOf('function updateHUD()');
 vm.runInContext(script.slice(start,end)+'\nglobalThis.route=findPath;globalThis.collision=blocked;',nav);
 assert.equal(nav.collision(0,0),true);assert.equal(nav.collision(0,6),false);
 for(const r of nav.game.racks){const path=nav.route({x:r.x,z:r.z});assert.ok(path.length>0,`rack ${r.id} reachable`);const last=path.at(-1);assert.ok(Math.hypot(last.x-r.x,last.z-r.z)<3.3,`rack ${r.id} within collection range`);for(const p of path)assert.equal(nav.collision(p.x,p.z),false);}
});

test('new farms have capital, no owned panels, no free revenue and safe empty interactions',()=>{
 const g=new Game();assert.equal(g.money,300);assert.equal(g.installed.length,0);assert.equal(g.nearest(),null);
 assert.equal(g.clean(.1),false);assert.equal(g.upgrade(undefined).ok,false);assert.equal(g.buyTool().ok,false);
 for(let i=0;i<1000;i++)g.tick(.1);
 assert.equal(g.money,300);assert.equal(g.community.energy,0);assert.ok(g.racks.every(r=>r.dirt===0&&r.pending===0));
});
test('purchases cost money once and reject invalid, occupied, unaffordable and player-blocked plots',()=>{
 const g=new Game();assert.equal(g.buyRack(32).ok,true);assert.equal(g.money,200);assert.equal(g.installed.length,1);assert.equal(g.nearest().id,32);
 assert.equal(g.racks[32].dirt,0);assert.equal(g.racks[32].cycle,0);assert.equal(g.stats.installed,1);
 for(const id of [32,-1,48,NaN,1.5,'1'])assert.equal(g.buyRack(id).ok,false);
 assert.equal(g.money,200);assert.equal(g.installed.length,1);
 const r=g.racks[0];g.player={x:r.x+5.6,z:r.z};assert.equal(g.buyRack(0).ok,false);
 g.player={x:0,z:6};g.money=99;assert.equal(g.buyRack(0).ok,false);assert.equal(g.money,99);
});
test('first purchase produces earnings, allows tools and survives reloading with empty plots preserved',()=>{
 const g=new Game();g.buyRack(32);g.player={x:0,z:10.9};
 for(let i=0;i<81;i++)g.tick(.1);
 assert.equal(g.money,204);assert.equal(g.community.energy,1);
 assert.equal(g.buyTool().ok,true);assert.equal(g.money,114);
 const saved=JSON.parse(JSON.stringify(g.snapshot())),loaded=new Game(saved);
 assert.equal(saved.version,3);assert.equal(loaded.installed.length,1);assert.equal(loaded.racks[32].owned,true);assert.equal(loaded.racks[0].owned,false);assert.equal(loaded.money,114);assert.equal(loaded.tool,1);
 const empty=new Game(new Game().snapshot());assert.equal(empty.installed.length,0);assert.equal(empty.money,300);
});
test('version 1 preserves the old full farm and offsets its completed mission IDs',()=>{
 const old=new Game().snapshot();old.version=1;old.money=222;old.completed=[0,2];old.racks.forEach(r=>delete r.owned);old.racks[0].tier=2;old.racks[0].pending=10;
 const migrated=new Game(old);assert.equal(migrated.installed.length,48);assert.equal(migrated.money,222);assert.equal(migrated.racks[0].tier,2);assert.equal(migrated.racks[0].pending,10);assert.ok(migrated.completed.includes(3));assert.ok(migrated.completed.includes(5));
 migrated.tick(.1);assert.equal(migrated.money,222+120+250+400+800); // Newly added expansion milestones award once; old starter rewards do not repeat.
 const after=migrated.money;migrated.tick(.1);assert.equal(migrated.money,after);
});
test('navigation changes after construction without blocking cash collection or allowing paths through panels',()=>{
 const farm=new Game(),nav=vm.createContext({game:farm});
 vm.runInContext(script.slice(script.indexOf('const obstacles=[]'),script.indexOf('function updateHUD()'))+'\nglobalThis.route=findPath;globalThis.collision=blocked;globalThis.rebuild=rebuildNavigation;',nav);
 const r=farm.racks[32];assert.equal(nav.collision(r.x+5.6,r.z),false);
 farm.buyRack(32);nav.rebuild();assert.equal(nav.collision(r.x+5.6,r.z),true);
 const route=nav.route({x:r.x,z:r.z});assert.ok(route.length);for(const point of route)assert.equal(nav.collision(point.x,point.z),false);
});

test('hiring and worker upgrades enforce prerequisites, prices, levels and crew cap',()=>{
 const g=new Game();assert.equal(g.hireWorker('cleaner').ok,false);g.buyRack(32);g.money=10000;
 assert.equal(g.hireWorker('invalid').ok,false);assert.equal(g.hireWorker('cleaner').ok,true);assert.equal(g.money,9810); // $250 hire, $60 milestone
 assert.equal(g.upgradeWorker(0).ok,true);assert.equal(g.workers[0].level,2);assert.equal(g.money,9690); // $200 upgrade, $80 milestone
 assert.equal(g.upgradeWorker(0).ok,true);assert.equal(g.workers[0].level,3);assert.equal(g.upgradeWorker(0).ok,false);assert.equal(g.upgradeWorker(99).ok,false);
 for(let i=1;i<6;i++)assert.equal(g.hireWorker('collector').ok,true);
 assert.equal(g.hireWorker('cleaner').ok,false);g.money=0;assert.equal(g.upgradeWorker(1).ok,false);
});
test('workers navigate around real obstacles and clean and collect automatically',()=>{
 const g=new Game();g.buyRack(0);g.money=1000;g.hireWorker('cleaner');g.hireWorker('collector');g.racks[0].dirt=1;g.racks[0].pending=24;
 const nav=vm.createContext({game:g});vm.runInContext(script.slice(script.indexOf('const obstacles=[]'),script.indexOf('function updateHUD()'))+'\nglobalThis.route=findPath;globalThis.collision=blocked;',nav);
 for(let i=0;i<1500;i++){g.tick(.1,nav.route);for(const w of g.workers)assert.equal(nav.collision(w.x,w.z),false);}
 assert.ok(g.stats.workerCleaned>=1);assert.ok(g.stats.workerCollected>=24);assert.ok(g.stats.cleaned>=g.stats.workerCleaned);
});
test('upgraded workers travel and complete tasks faster',()=>{
 const completeAt=level=>{const g=new Game();g.buyRack(32);g.money=1000;g.hireWorker('cleaner');g.workers[0].level=level;g.racks[32].dirt=1;let t=0;while(!g.stats.workerCleaned&&t<200){g.tick(.1);t++;}return t;};
 assert.ok(completeAt(3)<completeAt(2));assert.ok(completeAt(2)<completeAt(1));
});
test('two collectors and the player never duplicate rack money',()=>{
 const g=new Game();g.buyRack(32);g.money=1000;g.hireWorker('collector');g.hireWorker('collector');g.racks[32].dirt=1;g.racks[32].pending=12;g.player={x:0,z:10.9};
 const before=g.money;for(let i=0;i<200;i++)g.tick(.1);
 assert.equal(g.money,before+12);assert.equal(g.stats.earned,12);assert.equal(g.stats.workerCollected,0);
});
test('workers persist with upgrades; old saves start without a crew',()=>{
 const g=new Game();g.buyRack(32);g.money=1000;g.hireWorker('cleaner');g.upgradeWorker(0);
 const saved=JSON.parse(JSON.stringify(g.snapshot())),loaded=new Game(saved);assert.equal(loaded.workers.length,1);assert.equal(loaded.workers[0].level,2);assert.equal(loaded.workers[0].role,'cleaner');assert.equal(loaded.workers[0].target,null);
 saved.version=2;delete saved.workers;assert.equal(new Game(saved).workers.length,0);
});
test('all completed missions unlock repeatable goals which pay once and survive saves',()=>{
 const g=new Game();g.completed=Array.from({length:22},(_,i)=>i);g.checkMissions();const m=g.nextMission();assert.equal(m.progress,0);assert.equal(m.target,2000);
 g.stats.earned+=2000;const before=g.money;g.checkMissions();assert.equal(g.money,before+250);assert.equal(g.repeatMission.round,1);g.checkMissions();assert.equal(g.money,before+250);
 const loaded=new Game(JSON.parse(JSON.stringify(g.snapshot())));assert.equal(loaded.nextMission().target,3000);assert.equal(loaded.nextMission().progress,0);
});

test('completion screen becomes ready only after every main mission and acknowledges once',()=>{
 const g=new Game();assert.equal(g.completionReady,false);assert.equal(g.acknowledgeCompletion(),false);
 g.completed=Array.from({length:21},(_,i)=>i);assert.equal(g.completionReady,false);
 g.completed.push(21);assert.equal(g.completionReady,true);assert.equal(g.acknowledgeCompletion(),true);assert.equal(g.completionReady,false);assert.equal(g.acknowledgeCompletion(),false);
 const loaded=new Game(JSON.parse(JSON.stringify(g.snapshot())));assert.equal(loaded.campaignComplete,true);assert.equal(loaded.completionReady,false);assert.equal(new Game().completionShown,false);
});
test('previously finished saves receive the finale without losing their farm or repeatable progress',()=>{
 const g=new Game();g.completed=Array.from({length:22},(_,i)=>i);g.checkMissions();g.money=1234;g.repeatMission.round=3;
 const saved=JSON.parse(JSON.stringify(g.snapshot()));delete saved.completionShown;
 const loaded=new Game(saved);assert.equal(loaded.completionReady,true);loaded.acknowledgeCompletion();assert.equal(loaded.money,1234);assert.equal(loaded.repeatMission.round,3);assert.equal(loaded.nextMission().target,5000);
 const incomplete=new Game().snapshot();incomplete.completionShown=true;assert.equal(new Game(incomplete).completionShown,false);
});
