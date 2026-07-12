"use strict";
/* Симулятор Жизни: РФ — v2 (расширенная сборка).
   Всё в одном файле: движок, финансы, карьера-грейды, отношения/семья, события, старение/смерть, UI. */

/* ================= КОНФИГ ================= */
const CFG={DAY_HOURS:16,decay:{sat:1.5,energy:1.0,mood:0.4},rentDay:30,utilities:3500,inflMonthly:0.004};
const START_YEAR=2025;
const HAIR=["#2b2b2b","#6b4423","#c99a3b","#b23b3b","#8b5cf6","#e5e5e5"];
const CITIES={
  "Москва":{money:800,cost:1.35,payK:1.35,note:"дорого, но зарплаты выше"},
  "Санкт-Петербург":{money:650,cost:1.15,payK:1.15,note:"средние цены и зарплаты"},
  "Казань":{money:500,cost:1.0,payK:1.0,note:"баланс цен и возможностей"},
  "Новосибирск":{money:450,cost:0.9,payK:0.92,note:"дешевле жизнь, ниже зарплаты"},
  "Екатеринбург":{money:500,cost:0.95,payK:0.98,note:"стабильный промышленный"},
};
const SKILL_KEYS={intellect:"🧠 Интеллект",charisma:"💬 Харизма",strength:"💪 Сила",tech:"💻 Тех-навык",creativity:"🎨 Креатив",craft:"🔧 Руки"};
const TRACKS={craft:"🔧 Рабочие",sales:"🛍️ Продажи",it:"💻 IT",creative:"🎨 Креатив",office:"📊 Офис",biz:"🚀 Своё дело"};
const TRACK_ORDER=["craft","sales","it","creative","office","biz"];
const EDU=[{t:"Школа (11 кл)",v:20},{t:"Колледж",v:40,target:60},{t:"Бакалавр",v:70,target:120},{t:"Магистр",v:85,target:80},{t:"Аспирантура (PhD)",v:95,target:120},{t:"MBA",v:100,target:90}];

/* ================= ЧЕРТЫ ХАРАКТЕРА ================= */
const TRAITS=[
  {id:"workaholic",n:"🐝 Трудоголик",d:"+15% к оплате, но −настроение быстрее"},
  {id:"charmer",n:"😎 Обаятельный",d:"старт 💬+8, легче отношения"},
  {id:"lucky",n:"🍀 Везучий",d:"чаще удачные события"},
  {id:"sickly",n:"🤒 Болезненный",d:"−здоровье, но старт 🧠+8"},
  {id:"genius",n:"🧠 Способный",d:"учёба и книги дают +50%"},
  {id:"athlete",n:"🏃 Спортивный",d:"старт 💪+8, медленнее теряет здоровье"},
  {id:"saver",n:"💰 Бережливый",d:"−10% ко всем ценам"},
  {id:"none",n:"⚪ Обычный",d:"без модификаторов"},
];

/* ================= ЖИЛЬЁ (14 ступеней) ================= */
const HOUSING=[
  {t:"У бабушки",v:20,rent:0,sleep:70,moodDay:-1.2,parentsFeed:true},
  {t:"Комната в коммуналке",v:28,rent:9000,sleep:64,moodDay:-0.6},
  {t:"Общага",v:32,rent:6000,sleep:66,moodDay:-0.3},
  {t:"Съём студии",v:48,rent:22000,sleep:80,moodDay:0.2},
  {t:"Съём 1-к квартиры",v:56,rent:28000,sleep:82,moodDay:0.4},
  {t:"Съём 2-к с соседом",v:52,rent:16000,sleep:78,moodDay:0.0},
  {t:"Апартаменты",v:66,rent:45000,sleep:86,moodDay:0.6},
  {t:"Ипотека-студия",v:70,rent:28000,sleep:86,moodDay:0.5,mortgage:true},
  {t:"Ипотека 2-к (семейная)",v:80,rent:40000,sleep:90,moodDay:0.7,mortgage:true},
  {t:"Своя квартира (вторичка)",v:88,rent:0,sleep:90,moodDay:0.8,owned:true},
  {t:"Квартира в новостройке",v:92,rent:0,sleep:92,moodDay:0.9,owned:true},
  {t:"Загородный дом / дача",v:90,rent:0,sleep:91,moodDay:1.0,owned:true},
  {t:"Таунхаус",v:94,rent:0,sleep:93,moodDay:1.0,owned:true},
  {t:"Элитное жильё",v:100,rent:0,sleep:95,moodDay:1.3,owned:true},
];

/* ================= ТРАНСПОРТ (16 ступеней) ================= */
const TRANSPORT=[
  {t:"🚶 Пешком",v:10,commute:1.5,daily:0,health:0,moodDay:0,buy:0,note:"бесплатно, но долго"},
  {t:"🛴 Свой самокат",v:20,commute:1.2,daily:0,health:0.1,moodDay:0.1,buy:25000,note:"свой, чуть быстрее пешком"},
  {t:"🛴 Кикшеринг",v:24,commute:1.15,daily:200,health:0.1,moodDay:0.1,buy:0,note:"самокат по подписке"},
  {t:"🚇 Проездной",v:34,commute:1.0,daily:120,health:0,moodDay:0,buy:2500,note:"метро/автобус"},
  {t:"🚲 Велосипед",v:46,commute:0.9,daily:0,health:0.4,moodDay:0.2,buy:15000,note:"своё, +здоровье"},
  {t:"🚕 Такси-режим",v:50,commute:0.6,daily:1200,health:0,moodDay:0.3,buy:0,note:"дорого, зато быстро, без прав"},
  {t:"🏍️ Мотоцикл",v:58,commute:0.55,daily:250,health:0,moodDay:0.5,buy:250000,license:"A",note:"быстро, нужны права A"},
  {t:"🚗 Каршеринг",v:62,commute:0.65,daily:600,health:0,moodDay:0.2,buy:0,license:"B",note:"по минутам, нужны права"},
  {t:"🚙 Лада",v:80,commute:0.5,daily:300,health:0,moodDay:0.3,buy:400000,license:"B",note:"своя машина, бензин"},
  {t:"🚗 Иномарка",v:88,commute:0.45,daily:500,health:0,moodDay:0.6,buy:1800000,license:"B",note:"комфорт и статус"},
  {t:"⚡ Электромобиль",v:92,commute:0.42,daily:150,health:0,moodDay:0.7,buy:3000000,license:"B",note:"дорого купить, дёшево в обслуживании"},
  {t:"🚙 Внедорожник",v:94,commute:0.42,daily:700,health:0,moodDay:0.7,buy:3500000,license:"B",note:"проходимость и статус"},
  {t:"🏎️ Бизнес-класс",v:100,commute:0.38,daily:900,health:0,moodDay:1.0,buy:7000000,license:"B",note:"максимальный комфорт"},
];

/* ================= ВАКАНСИИ (48, гейт по возрасту+навыку+опыту+диплому) ================= */
const JOBS=[
  /* craft */
  {id:"courier",t:"Курьер",track:"craft",req:{},base:950,energy:28,skill:"strength",gain:{strength:1.2,charisma:0.3}},
  {id:"loader",t:"Грузчик",track:"craft",req:{age:18,strength:20},base:1350,energy:42,skill:"strength",gain:{strength:2}},
  {id:"handyman",t:"Разнорабочий",track:"craft",req:{age:18,strength:15},base:1200,energy:36,skill:"strength",gain:{strength:1.5,craft:0.5}},
  {id:"auto_mechanic",t:"Автослесарь",track:"craft",req:{age:19,craft:30,strength:20},base:2400,energy:30,skill:"craft",gain:{craft:2,strength:0.5}},
  {id:"electrician",t:"Электрик",track:"craft",req:{age:20,craft:35,intellect:15},base:2600,energy:26,skill:"craft",gain:{craft:2,intellect:0.5}},
  {id:"welder",t:"Сварщик",track:"craft",req:{age:20,craft:45,strength:25},base:3100,energy:34,skill:"craft",gain:{craft:2}},
  {id:"turner",t:"Токарь-фрезеровщик",track:"craft",req:{age:21,craft:50},base:3300,energy:30,skill:"craft",gain:{craft:2}},
  {id:"foreman",t:"Мастер участка",track:"craft",req:{age:24,craft:55,charisma:30,edu:1},base:4600,energy:28,skill:"craft",gain:{craft:1.5,charisma:1}},
  {id:"prorab",t:"Прораб",track:"craft",req:{age:27,craft:60,charisma:35,exp:{job:"foreman",n:40}},base:5800,energy:28,skill:"craft",gain:{craft:1.2,charisma:1}},
  {id:"shopchief",t:"Начальник цеха",track:"craft",req:{age:32,craft:65,charisma:45,exp:{job:"prorab",n:40}},base:8000,energy:28,skill:"charisma",gain:{charisma:1,craft:0.5}},
  /* sales */
  {id:"barista",t:"Бариста",track:"sales",req:{age:18,charisma:8,strength:5},base:1050,energy:24,skill:"charisma",gain:{charisma:1.4}},
  {id:"callcenter",t:"Оператор call-центра",track:"sales",req:{age:18,charisma:12,intellect:10},base:1200,energy:20,skill:"charisma",gain:{charisma:1.2,intellect:0.8}},
  {id:"seller",t:"Продавец-консультант",track:"sales",req:{age:18,charisma:20,intellect:8},base:1300,energy:22,skill:"charisma",gain:{charisma:2}},
  {id:"cashier_sr",t:"Старший кассир",track:"sales",req:{age:20,charisma:22},base:1600,energy:24,skill:"charisma",gain:{charisma:1.6,intellect:0.4}},
  {id:"sales_manager",t:"Менеджер по продажам",track:"sales",req:{age:21,charisma:35,intellect:20},base:2700,energy:24,skill:"charisma",gain:{charisma:1.8,intellect:0.6}},
  {id:"realtor",t:"Риелтор",track:"sales",req:{age:22,charisma:45,intellect:25},base:3600,energy:26,skill:"charisma",risky:true,gain:{charisma:1.6}},
  {id:"sales_lead",t:"Тимлид продаж",track:"sales",req:{age:26,charisma:55,exp:{job:"sales_manager",n:30}},base:5000,energy:26,skill:"charisma",gain:{charisma:1.4,intellect:0.6}},
  {id:"sales_head",t:"РОП (глава продаж)",track:"sales",req:{age:30,charisma:60,exp:{job:"sales_lead",n:30}},base:6800,energy:28,skill:"charisma",gain:{charisma:1.2,intellect:0.8}},
  {id:"commercial_dir",t:"Коммерческий директор",track:"sales",req:{age:35,charisma:70,intellect:40,exp:{job:"sales_head",n:40}},base:11000,energy:30,skill:"charisma",gain:{charisma:1,intellect:0.8}},
  /* it */
  {id:"tester",t:"Тестировщик QA",track:"it",req:{age:18,tech:20,intellect:15},base:1800,energy:22,skill:"tech",gain:{tech:1.6,intellect:0.6}},
  {id:"webdev_jr",t:"Верстальщик",track:"it",req:{age:19,tech:30,creativity:15},base:2200,energy:22,skill:"tech",gain:{tech:1.8,creativity:0.4}},
  {id:"junior_dev",t:"Junior-разработчик",track:"it",req:{age:19,tech:35,intellect:20},base:2600,energy:24,skill:"tech",gain:{tech:2,intellect:0.6}},
  {id:"middle_dev",t:"Middle-разработчик",track:"it",req:{age:22,tech:60,exp:{job:"junior_dev",n:25}},base:5200,energy:26,skill:"tech",gain:{tech:2}},
  {id:"devops",t:"DevOps-инженер",track:"it",req:{age:24,tech:75,intellect:40},base:8200,energy:28,skill:"tech",gain:{tech:1.6,intellect:0.6}},
  {id:"senior_dev",t:"Senior-разработчик",track:"it",req:{age:26,tech:85,exp:{job:"middle_dev",n:30}},base:9500,energy:28,skill:"tech",gain:{tech:1.5}},
  {id:"data_sci",t:"Data Scientist",track:"it",req:{age:26,tech:75,intellect:60,edu:2},base:9800,energy:28,skill:"tech",gain:{tech:1.4,intellect:1}},
  {id:"team_lead",t:"Тимлид / архитектор",track:"it",req:{age:30,tech:90,charisma:40,exp:{job:"senior_dev",n:40}},base:13000,energy:30,skill:"tech",gain:{tech:1,charisma:1}},
  {id:"cto",t:"CTO",track:"it",req:{age:36,tech:95,charisma:55,exp:{job:"team_lead",n:40}},base:20000,energy:32,skill:"charisma",gain:{charisma:1,tech:0.5}},
  /* creative */
  {id:"smm",t:"SMM-специалист",track:"creative",req:{age:18,creativity:20,charisma:15},base:1600,energy:20,skill:"creativity",gain:{creativity:1.8,charisma:0.6}},
  {id:"copywriter",t:"Копирайтер",track:"creative",req:{age:19,creativity:25,intellect:20},base:1900,energy:20,skill:"creativity",gain:{creativity:1.8,intellect:0.6}},
  {id:"designer",t:"Дизайнер",track:"creative",req:{age:20,creativity:35,tech:15},base:2500,energy:22,skill:"creativity",gain:{creativity:2,tech:0.4}},
  {id:"video_editor",t:"Видеомонтажёр",track:"creative",req:{age:20,creativity:35,tech:20},base:2600,energy:22,skill:"creativity",gain:{creativity:1.8,tech:0.6}},
  {id:"marketer",t:"Маркетолог",track:"creative",req:{age:22,creativity:40,intellect:30},base:3300,energy:24,skill:"creativity",gain:{creativity:1.6,intellect:0.8}},
  {id:"blogger",t:"Блогер",track:"creative",req:{age:21,creativity:45,charisma:40},base:5200,energy:22,skill:"creativity",risky:true,gain:{creativity:1.8,charisma:1}},
  {id:"art_dir",t:"Арт-директор",track:"creative",req:{age:28,creativity:65,charisma:35,exp:{job:"designer",n:30}},base:6500,energy:26,skill:"creativity",gain:{creativity:1.2,charisma:0.8}},
  {id:"creative_dir",t:"Креативный директор",track:"creative",req:{age:34,creativity:75,charisma:50,exp:{job:"art_dir",n:40}},base:12000,energy:28,skill:"creativity",gain:{creativity:1,charisma:1}},
  /* office */
  {id:"assistant",t:"Ассистент",track:"office",req:{age:18,intellect:20},base:1500,energy:20,skill:"intellect",gain:{intellect:1.4,charisma:0.4}},
  {id:"accountant",t:"Бухгалтер",track:"office",req:{age:21,intellect:35,edu:1},base:2500,energy:22,skill:"intellect",gain:{intellect:1.6}},
  {id:"hr",t:"HR-менеджер",track:"office",req:{age:22,charisma:35,intellect:25},base:2800,energy:22,skill:"charisma",gain:{charisma:1.4,intellect:0.6}},
  {id:"analyst",t:"Аналитик данных",track:"office",req:{age:22,intellect:50,tech:20},base:4200,energy:24,skill:"intellect",gain:{intellect:1.6,tech:0.5}},
  {id:"lawyer",t:"Юрист",track:"office",req:{age:24,intellect:55,charisma:25,edu:2},base:5200,energy:26,skill:"intellect",gain:{intellect:1.4,charisma:0.6}},
  {id:"financier",t:"Финансист",track:"office",req:{age:25,intellect:60,edu:2},base:6200,energy:26,skill:"intellect",gain:{intellect:1.4}},
  {id:"fin_dir",t:"Финансовый директор",track:"office",req:{age:35,intellect:70,charisma:45,exp:{job:"financier",n:40}},base:13000,energy:28,skill:"intellect",gain:{intellect:1,charisma:0.8}},
  {id:"ceo",t:"Топ-менеджер / гендир",track:"office",req:{age:40,intellect:65,charisma:65,edu:5,exp:{job:"fin_dir",n:40}},base:22000,energy:32,skill:"charisma",gain:{charisma:1,intellect:0.6}},
  /* biz */
  {id:"selfemp",t:"Самозанятый (услуги)",track:"biz",req:{age:18,charisma:20},base:1500,energy:24,skill:"charisma",risky:true,gain:{charisma:1,creativity:0.6}},
  {id:"ip",t:"ИП / своя точка",track:"biz",req:{age:22,charisma:40,money:150000},base:4000,energy:28,shift:9,skill:"charisma",risky:true,gain:{charisma:1.4}},
  {id:"biz",t:"Свой бизнес",track:"biz",req:{age:24,charisma:45,money:250000},base:9000,energy:30,shift:9,skill:"charisma",risky:true,gain:{charisma:1.5}},
  {id:"startup",t:"IT-стартап",track:"biz",req:{age:23,tech:70,creativity:40},base:12000,energy:32,shift:9,skill:"tech",risky:true,gain:{tech:1,creativity:1}},
  {id:"franchise",t:"Сеть / франшиза",track:"biz",req:{age:33,charisma:60,money:3000000,exp:{job:"biz",n:60}},base:25000,energy:32,shift:9,skill:"charisma",risky:true,gain:{charisma:1.2}},
];
const ACH=[
  {id:"firstpay",n:"Первая зарплата 💵"},{id:"switch",n:"Сменил профессию 🔀"},{id:"grad",n:"Дипломированный 🎓"},
  {id:"rent",n:"Своё гнездо 🏠"},{id:"skill50",n:"Профи: навык 50 ⭐"},{id:"wheels",n:"За рулём 🚗"},
  {id:"k100",n:"Первые 100 000₽ 💰"},{id:"skill100",n:"Мастер: навык 100 🏅"},{id:"own",n:"Своя квартира 🔑"},
  {id:"mil",n:"Миллионер 💎"},{id:"qol80",n:"Высокий класс 👑"},
  {id:"love",n:"Вторая половинка ❤️"},{id:"married",n:"Свадьба 💍"},{id:"parent",n:"Родитель 👶"},
  {id:"investor",n:"Инвестор 📈"},{id:"phd",n:"Учёный 🔬"},{id:"grade",n:"Повышение по грейду ⬆️"},{id:"boss",n:"Топ-должность 🏢"},
];

/* ================= СОСТОЯНИЕ ================= */
let S=null;
const tg=(typeof window!=="undefined"&&window.Telegram)?window.Telegram.WebApp:null;
if(tg){tg.ready();tg.expand();}
function freshState(cfg){
  const sk={intellect:0,charisma:0,strength:0,tech:0,creativity:0,craft:0};const c=CITIES[cfg.city];
  return {sex:cfg.sex,name:cfg.name,hair:cfg.hair,city:cfg.city,age:17,day:0,startDOY:145,hoursLeft:CFG.DAY_HOURS,
    energy:90,sat:80,health:95,mood:60,fatigue:0,attention:60,generation:(cfg.generation||1),story:[],money:c.money,skills:Object.assign(sk,cfg.skills),
    edu:0,enrolled:null,eduProgress:0,job:null,grade:0,reviewPts:0,reputation:50,exp:{},
    housing:0,transport:0,license:{},trait:cfg.trait||"none",
    priceMul:1,deposit:0,stocks:0,crypto:0,rentalUnits:0,loan:0,passive:0,subs:{},
    partner:null,dating:0,married:false,kids:0,friends:20,
    addiction:{smoke:0,alcohol:0},chronic:[],
    quest:0,sandbox:false,flags:{},known:{},ach:{},rankTitle:"",peakMoney:c.money,dead:false,
    fate:null,robust:false,frail:false,log:[]};
}

/* ================= ХЕЛПЕРЫ ================= */
const clamp=v=>Math.max(0,Math.min(100,v));
function saverMul(){return S.trait==="saver"?0.9:1;}
function price(x){return Math.round(x*CITIES[S.city].cost*(S.priceMul||1)*saverMul());}
function priceRaw(x){return Math.round(x*CITIES[S.city].cost*(S.priceMul||1));}
function wageInfl(){return 1+((S.priceMul||1)-1)*0.6;}
function luck(){return 1+(S.skills.intellect*0.002)+(S.trait==="lucky"?0.12:0);}
function moodFactor(){return 0.7+S.mood/100*0.4;}
function healthFactor(){return 0.6+S.health/100*0.4;}
function jobById(id){return JOBS.find(j=>j.id===id);}
function gradeMul(){return 1+(S.grade||0)*0.22;}
function traitPay(){return S.trait==="workaholic"?1.15:1;}
function primeFactor(age){if(age<22)return 0.8+(age-17)*0.04;if(age<=40)return 1.0;if(age<60)return 1.0-(age-40)*0.015;return Math.max(0.35,0.7-(age-60)*0.015);}
function jobPay(job){
  let p=job.base*(1+(job.skill?S.skills[job.skill]:0)/100*0.9)*moodFactor()*healthFactor()*CITIES[S.city].payK*gradeMul()*wageInfl()*traitPay();
  if(S.sat<30)p*=0.85;
  if(S.reputation<30)p*=0.9;
  if(job.risky){const fl=0.55+Math.min(0.35,(S.skills[job.skill]||0)/300);p*=(fl+Math.random()*(1.55-fl));}
  p*=primeFactor(S.age);if((S.fatigue||0)>70)p*=0.7;
  return Math.round(p);
}
function spend(h){S.hoursLeft-=h;S.sat=clamp(S.sat-h*CFG.decay.sat);S.energy=clamp(S.energy-h*CFG.decay.energy);S.mood=clamp(S.mood-h*CFG.decay.mood*(S.trait==="workaholic"?1.15:1));if(S.hoursLeft<=0)newDay(false);}
function go(h){spend(h+travel());}
function awayT(h){return (h+travel()).toFixed(1);}
function shiftHours(job){return (job.shift||8)+travel();}
function hasLicense(cat){return !!(S.license&&S.license[cat]);}
function jobConditions(job){
  const r=job.req||{},out=[];
  if(r.age)out.push({l:`Возраст ≥ ${r.age}`,ok:S.age>=r.age});
  for(const k in SKILL_KEYS){if(r[k])out.push({l:`${SKILL_KEYS[k]} ≥ ${r[k]}`,ok:S.skills[k]>=r[k]});}
  if(r.edu)out.push({l:`Диплом: ${EDU[r.edu].t}`,ok:S.edu>=r.edu});
  if(r.exp)out.push({l:`Опыт «${jobById(r.exp.job).t}»: ${S.exp[r.exp.job]||0}/${r.exp.n} см`,ok:(S.exp[r.exp.job]||0)>=r.exp.n});
  if(r.money)out.push({l:`Капитал ${r.money.toLocaleString('ru')}₽`,ok:S.money>=r.money});
  (job.flavor||[]).forEach(f=>out.push({l:f,ok:true}));
  return out;
}
function qualified(job){return jobConditions(job).every(c=>c.ok);}
function netWorth(){return Math.round(S.money+(S.deposit||0)+(S.stocks||0)+(S.crypto||0)+(S.rentalUnits||0)*price(2500000)-(S.loan||0));}
function qol(){const jv=S.job?Math.min(100,jobById(S.job).base/95):0;let q=S.health*0.14+S.mood*0.14+EDU[S.edu].v*0.13+jv*0.22+HOUSING[S.housing].v*0.18+TRANSPORT[S.transport].v*0.09;if(S.partner)q+=4;if(S.married)q+=3;q+=Math.min(6,S.friends/20);return Math.round(Math.min(100,q));}
function addSkill(obj,mult){const gen=S.trait==="genius"?1.5:1;for(const k in obj)S.skills[k]=Math.min(100,S.skills[k]+obj[k]*(mult==null?1:mult)*((k==="intellect"||k==="creativity")?gen:1));}
function rank(){const q=qol();return q<25?"🌱 Новичок":q<42?"📈 На старте":q<60?"💼 Специалист":q<78?"🚀 Успешный":"👑 Легенда";}

/* ================= ВРЕМЯ / ДАТА ================= */
const MONTHS=["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const DOW=["вс","пн","вт","ср","чт","пт","сб"];
function isLeap(y){return (y%4===0&&y%100!==0)||y%400===0;}
function dateParts(){let d=S.startDOY+S.day,y=START_YEAR,yl=isLeap(y)?366:365;while(d>yl){d-=yl;y++;yl=isLeap(y)?366:365;}const md=[31,(isLeap(y)?29:28),31,30,31,30,31,31,30,31,30,31];let m=0;while(d>md[m]){d-=md[m];m++;}return {d,m,y};}
function dateStr(){const p=dateParts();return `${p.d} ${MONTHS[p.m]} ${p.y}, ${DOW[(1+S.day)%7]}`;}
function season(){const m=dateParts().m;return m<=1||m===11?"winter":m<=4?"spring":m<=7?"summer":"autumn";}
function seasonName(){return {winter:"❄️ Зима",spring:"🌱 Весна",summer:"☀️ Лето",autumn:"🍂 Осень"}[season()];}

/* ================= ФИНАНСЫ (ежемесячно) ================= */
function subsCost(){let c=0;if(S.subs.gym)c+=price(3000);if(S.subs.stream)c+=price(800);if(S.subs.internet)c+=price(1200);if(S.subs.dms)c+=price(4000);if(S.subs.school)c+=price(40000);return c;}
function financeCheck(){
  if(S.money>=0)return;
  const interest=Math.round(-S.money*0.05);
  if(interest>0){S.money-=interest;S.mood=clamp(S.mood-4);log(`Долги: −${interest.toLocaleString('ru')}₽ процентов по кредиту`,"bad");}
  if(S.money< -price(150000)){S.money=0;S.job=null;S.grade=0;S.housing=0;S.transport=Math.min(S.transport,3);S.mood=clamp(S.mood-30);S.health=clamp(S.health-10);log("💥 Банкротство: долги списаны, но ты остался без работы и вернулся к родителям.","bad");return;}
  if(S.money< -price(40000)&&S.housing>1){S.housing--;S.mood=clamp(S.mood-15);log(`⚠️ Не потянул жильё — выселение в «${HOUSING[S.housing].t}».`,"bad");}
}
function monthlyFinance(){
  // жильё
  const h=HOUSING[S.housing];let rent=h.rent;if(S.married&&rent)rent=Math.round(rent*0.6); // партнёр делит аренду
  if(rent){S.money-=price(rent);log(`Платёж за жильё: −${price(rent).toLocaleString('ru')}₽`,"bad");}
  if(h.owned||h.mortgage){S.money-=price(CFG.utilities);}
  // транспорт-владение: страховка мелко учтена в daily
  // подписки
  const sc=subsCost();if(sc){S.money-=sc;}
  // депозит
  if(S.deposit>0){const i=Math.round(S.deposit*0.01);S.deposit+=i;if(i>0)log(`Вклад: +${i.toLocaleString('ru')}₽ процентов`,"good");}
  // инвестиции — дрейф
  if(S.stocks>0){S.stocks=Math.max(0,Math.round(S.stocks*(1+(0.008+(Math.random()-0.5)*0.12))));}
  if(S.crypto>0){S.crypto=Math.max(0,Math.round(S.crypto*(1+(0.015+(Math.random()-0.5)*0.5))));}
  // рента
  if(S.rentalUnits>0){const inc=S.rentalUnits*priceRaw(12000);S.money+=inc;log(`Доход от аренды: +${inc.toLocaleString('ru')}₽`,"good");}
  if(S.passive>0){S.money+=S.passive;log(`Пассивный доход: +${S.passive.toLocaleString('ru')}₽`,"good");}
  if(S.loan>0){const pay=Math.round(S.loan*0.06);S.money-=pay;S.loan=Math.max(0,S.loan-Math.round(pay*0.55));log(`Платёж по кредиту: −${pay.toLocaleString('ru')}₽`,"bad");}
  // партнёр-доход
  if(S.married){const pi=priceRaw(35000);S.money+=pi;}
  // дети
  if(S.kids>0){const kc=S.kids*price(15000);S.money-=kc;log(`Расходы на детей: −${kc.toLocaleString('ru')}₽`,"bad");}
  // пенсия
  if(S.age>=65){const p=priceRaw(8000)+Math.round(((S.deposit||0)+(S.stocks||0))*0.0008);S.money+=p;log(`Пенсия: +${p.toLocaleString('ru')}₽`,"good");}
  // инфляция
  S.priceMul=(S.priceMul||1)*(1+CFG.inflMonthly);
  financeCheck();
}
function monthlyCosts(){if(S.day%CFG.rentDay===0)monthlyFinance();}
function transportDaily(){if(TRANSPORT[S.transport].daily)S.money-=price(TRANSPORT[S.transport].daily);}

/* ================= СТАРЕНИЕ / ЗДОРОВЬЕ / СМЕРТЬ ================= */
function healthDrains(){
  const a=S.addiction;
  if(a.smoke>0&&Math.random()<0.02*a.smoke)S.health=clamp(S.health-2);
  if(a.alcohol>0&&Math.random()<0.02*a.alcohol)S.health=clamp(S.health-2);
  (S.chronic||[]).forEach(()=>{if(Math.random()<0.03)S.health=clamp(S.health-1);});
}
function agingDeath(){
  if(!S||S.dead)return;
  S.peakMoney=Math.max(S.peakMoney||0,netWorth());
  const age=S.age;const athl=S.trait==="athlete"?0.6:1,sick=(S.trait==="sickly"||S.frail)?1.4:1;
  healthDrains();
  if(age>=45 && Math.random()<(0.02+(age-45)*0.002)*sick) S.health=Math.max(0,S.health-(1+Math.floor((age-45)/10))*athl);
  if(S.frail && Math.random()<0.04) S.health=Math.max(0,S.health-6);
  // хронь появляется с возрастом/зависимостями
  if(age>=40 && Math.random()<0.0008*(1+(S.addiction.smoke+S.addiction.alcohol)) && S.chronic.length<3){S.chronic.push("хроническое");log("🩺 Появилось хроническое заболевание — лечи системно.","bad");}
  if(S.health<=0) return die("подорванное здоровье");
  let yearly=0;
  if(age>=60){yearly=Math.min(0.6,Math.pow((age-55)/40,2)*0.6); if(S.robust)yearly*=0.6;}
  if(S.health<20) yearly+=0.05;
  if(age>=95) yearly=1;
  if(Math.random()<yearly/365) return die(age>=80?"старость":"болезнь");
}

/* ================= ЛОГ / МЕЛКИЕ ХЕЛПЕРЫ ================= */
function log(text,cls=""){if(!S.log)S.log=[];S.log.unshift({t:dateStr(),text,cls});if(S.log.length>120)S.log.pop();const box=(typeof document!=="undefined")&&document.getElementById('log');if(box)box.innerHTML=S.log.map(l=>`<p class="${l.cls}"><span class="d">${l.t}.</span> ${l.text}</p>`).join("");}
function money(x){return x>=0?`+${x.toLocaleString('ru')}₽`:`${x.toLocaleString('ru')}₽`;}
function needEnergy(e){return S.energy>=e?true:"мало энергии";}
function needMoney(m){return S.money>=m?true:"не хватает денег";}
function seasonMood(){const s=season();return s==="winter"?-0.25:s==="summer"?0.2:0;}
function statWarn(){if(S.health<25&&!S._wH){S._wH=1;log("❤️ Здоровье критически низкое — сходи в клинику.","bad");}if(S.health>=40)S._wH=0;if(S.mood<20&&!S._wM){S._wM=1;log("🙂 Настроение на дне — нужен отдых или досуг.","bad");}if(S.mood>=40)S._wM=0;}

function newDay(slept){
  S.hoursLeft=CFG.DAY_HOURS;S.day++;S.age=17+Math.floor(S.day/365);
  if(!slept)S.energy=clamp(S.energy-12);
  S.mood=clamp(S.mood+HOUSING[S.housing].moodDay+TRANSPORT[S.transport].moodDay+seasonMood());
  if(HOUSING[S.housing].parentsFeed)S.sat=clamp(S.sat+8);
  if(S.partner)S.mood=clamp(S.mood+0.4);
  if(S.dating>0&&!S.partner)S.dating=Math.max(0,S.dating-1);
  transportDaily();
  if(S.sat<15){S.health=clamp(S.health-6);log("Ты недоедаешь — здоровье падает.","bad");}
  if(S.health<12)S.mood=clamp(S.mood-5);
  monthlyCosts();if(Math.random()<0.10)randomEvent();checkStory();statWarn();agingDeath();
}

/* ================= СОБЫТИЯ ================= */
/* события-развилки: кладём в очередь, UI показывает модалку выбора; в node — авто-первый выбор */
let PENDING_EVENT=null;

/* ================= СМЕРТЬ / ИТОГИ / ПЕРЕРОЖДЕНИЕ ================= */
function grade(s){return s>=85?"S":s>=70?"A":s>=55?"B":s>=40?"C":s>=25?"D":"E";}
function lifeScore(){
  const jv=S.job?Math.min(100,jobById(S.job).base/95):0;
  const m=Math.min(25,Math.log10(Math.max(1,S.peakMoney||1))/Math.log10(20000000)*25);
  const edu=EDU[S.edu].v*0.08, house=HOUSING[S.housing].v*0.08;
  const ach=(Object.keys(S.ach||{}).length/ACH.length)*13;
  const longevity=Math.min(12,(S.age-17)/70*12);
  const career=jv*0.18, q=qol()*0.08;
  const fam=(S.married?4:0)+(S.kids*2);
  return Math.round(Math.min(100,Math.max(0,m+edu+house+ach+longevity+career+q+fam)));
}
function die(cause){S.dead=true;S.cause=cause;S.deathAge=S.age;if(typeof save==="function")save();if(typeof showSummary==="function")showSummary();}

/* ================= ДЕЙСТВИЯ: РАЗВИТИЕ (22) ================= */
const DEV_ACTIONS=[
  {id:"read",cat:"📈 Развитие",show:()=>true,title:()=>"Читать книги 🏠",sub:()=>`2ч · −8⚡ · 🧠+3 · бесплатно`,ok:()=>needEnergy(8),run:()=>{spend(2);S.energy=clamp(S.energy-8);addSkill({intellect:3});log("Читал книги. 🧠 растёт.");}},
  {id:"yt",cat:"📈 Развитие",show:()=>true,title:()=>"YouTube-туториалы 🏠",sub:()=>`2ч · −8⚡ · 💻+2.5 · бесплатно`,ok:()=>needEnergy(8),run:()=>{spend(2);S.energy=clamp(S.energy-8);addSkill({tech:2.5});log("Смотрел туториалы. 💻");}},
  {id:"podcasts",cat:"📈 Развитие",show:()=>true,title:()=>"Подкасты в дороге 🚗",sub:()=>`${awayT(1)}ч · −3⚡ · 🧠+2 · бесплатно`,ok:()=>needEnergy(3),run:()=>{go(1);S.energy=clamp(S.energy-3);addSkill({intellect:2});log("Слушал подкасты. 🧠");}},
  {id:"online",cat:"📈 Развитие",show:()=>true,title:()=>"Онлайн-курс по IT 🏠",sub:()=>`3ч · −12⚡ · −${price(2000)}₽ · 💻+6`,ok:()=>S.money<price(2000)?"не хватает денег":needEnergy(12),run:()=>{spend(3);S.energy=clamp(S.energy-12);S.money-=price(2000);addSkill({tech:6});log("Прошёл модуль курса. 💻");}},
  {id:"design_course",cat:"📈 Развитие",show:()=>true,title:()=>"Курс по дизайну 🏠",sub:()=>`3ч · −10⚡ · −${price(2000)}₽ · 🎨+6`,ok:()=>S.money<price(2000)?"не хватает денег":needEnergy(10),run:()=>{spend(3);S.energy=clamp(S.energy-10);S.money-=price(2000);addSkill({creativity:6});log("Учил дизайн. 🎨");}},
  {id:"sales_course",cat:"📈 Развитие",show:()=>true,title:()=>"Курс продаж 🏠",sub:()=>`3ч · −10⚡ · −${price(1500)}₽ · 💬+5`,ok:()=>S.money<price(1500)?"не хватает денег":needEnergy(10),run:()=>{spend(3);S.energy=clamp(S.energy-10);S.money-=price(1500);addSkill({charisma:5});log("Учил продажи. 💬");}},
  {id:"copy_course",cat:"📈 Развитие",show:()=>true,title:()=>"Курс копирайтинга 🏠",sub:()=>`3ч · −10⚡ · −${price(1500)}₽ · 🎨+3 🧠+2`,ok:()=>S.money<price(1500)?"не хватает денег":needEnergy(10),run:()=>{spend(3);S.energy=clamp(S.energy-10);S.money-=price(1500);addSkill({creativity:3,intellect:2});log("Учил тексты. 🎨🧠");}},
  {id:"language",cat:"📈 Развитие",show:()=>true,title:()=>"Языковые курсы 🏠",sub:()=>`2ч · −8⚡ · −${price(1000)}₽ · 🧠+2 💬+2`,ok:()=>S.money<price(1000)?"не хватает денег":needEnergy(8),run:()=>{spend(2);S.energy=clamp(S.energy-8);S.money-=price(1000);addSkill({intellect:2,charisma:2});log("Учил язык. 🧠💬");}},
  {id:"fin_literacy",cat:"📈 Развитие",show:()=>true,title:()=>"Финансовая грамотность 🏠",sub:()=>`2ч · −8⚡ · −${price(1500)}₽ · 🧠+3 · откроет инвестиции`,ok:()=>S.money<price(1500)?"не хватает денег":needEnergy(8),run:()=>{spend(2);S.energy=clamp(S.energy-8);S.money-=price(1500);addSkill({intellect:3});S.flags.finEdu=true;log("Разобрался в финансах. 📈 инвестиции доступны.","unlock");}},
  {id:"public_speak",cat:"📈 Развитие",show:()=>true,title:()=>"Публичные выступления 🚗",sub:()=>`${awayT(2)}ч · −8⚡ · −${price(1200)}₽ · 💬+5`,ok:()=>S.money<price(1200)?"не хватает денег":needEnergy(8),run:()=>{go(2);S.energy=clamp(S.energy-8);S.money-=price(1200);addSkill({charisma:5});log("Тренировал речь. 💬");}},
  {id:"timemgmt",cat:"📈 Развитие",show:()=>!S.flags.tm,title:()=>"Тайм-менеджмент 🏠",sub:()=>`3ч · −10⚡ · −${price(2000)}₽ · +0.5ч к каждому дню`,ok:()=>S.money<price(2000)?"не хватает денег":needEnergy(10),run:()=>{spend(3);S.energy=clamp(S.energy-10);S.money-=price(2000);S.flags.tm=true;CFG.DAY_HOURS=16.5;log("Освоил тайм-менеджмент. Дни стали длиннее.","unlock");}},
  {id:"workshop",cat:"📈 Развитие",show:()=>true,title:()=>"Мастерская (руки) 🚗",sub:()=>`${awayT(2)}ч · −10⚡ · −${price(800)}₽ · 🔧+5`,ok:()=>S.money<price(800)?"не хватает денег":needEnergy(10),run:()=>{go(2);S.energy=clamp(S.energy-10);S.money-=price(800);addSkill({craft:5});log("Работал руками. 🔧");}},
  {id:"gym",cat:"📈 Развитие",show:()=>true,title:()=>"Спортзал 🚗",sub:()=>`${awayT(1.5)}ч · −10⚡ · −${price(500)}₽ · 💪+4 ❤️+5`,ok:()=>S.money<price(500)?"не хватает денег":needEnergy(10),run:()=>{go(1.5);S.energy=clamp(S.energy-10);S.money-=price(500);addSkill({strength:4});S.health=clamp(S.health+5);log("Тренировка. 💪❤️");}},
  {id:"network",cat:"📈 Развитие",show:()=>true,title:()=>"Нетворкинг 🚗",sub:()=>`${awayT(3)}ч · −6⚡ · −${price(800)}₽ · 💬+4 🙂+8`,ok:()=>S.money<price(800)?"не хватает денег":needEnergy(6),run:()=>{go(3);S.energy=clamp(S.energy-6);S.money-=price(800);addSkill({charisma:4});S.mood=clamp(S.mood+8);S.friends=Math.min(100,S.friends+3);log("Новые знакомства. 💬🙂");}},
  {id:"hackathon",cat:"📈 Развитие",show:()=>S.skills.tech>=25,title:()=>"Хакатон 🚗",sub:()=>`${awayT(6)}ч · −20⚡ · 💻+4 🎨+2 · шанс приза`,ok:()=>needEnergy(20),run:()=>{go(6);S.energy=clamp(S.energy-20);addSkill({tech:4,creativity:2});if(Math.random()<0.4){const p=price(30000);S.money+=p;log(`Взял приз хакатона: +${p}₽!`,"good");}else log("Хакатон окончен. Опыт есть. 💻");}},
  {id:"volunteer",cat:"📈 Развитие",show:()=>true,title:()=>"Волонтёрство 🚗",sub:()=>`${awayT(4)}ч · −8⚡ · 💬+3 🙂+5 +репутация`,ok:()=>needEnergy(8),run:()=>{go(4);S.energy=clamp(S.energy-8);addSkill({charisma:3});S.mood=clamp(S.mood+5);S.reputation=clamp(S.reputation+3);log("Помогал людям. 💬🙂");}},
  {id:"book_club",cat:"📈 Развитие",show:()=>true,title:()=>"Книжный клуб 🚗",sub:()=>`${awayT(2)}ч · −6⚡ · 🧠+2 💬+2 🙂+4`,ok:()=>needEnergy(6),run:()=>{go(2);S.energy=clamp(S.energy-6);addSkill({intellect:2,charisma:2});S.mood=clamp(S.mood+4);log("Книжный клуб. 🧠💬");}},
  {id:"chess",cat:"📈 Развитие",show:()=>true,title:()=>"Шахматы / логика 🏠",sub:()=>`1.5ч · −6⚡ · 🧠+3 · бесплатно`,ok:()=>needEnergy(6),run:()=>{spend(1.5);S.energy=clamp(S.energy-6);addSkill({intellect:3});log("Играл в шахматы. 🧠");}},
  {id:"first_aid",cat:"📈 Развитие",show:()=>!S.flags.firstAid,title:()=>"Курсы первой помощи 🚗",sub:()=>`${awayT(3)}ч · −10⚡ · −${price(1000)}₽ · ❤️+знания`,ok:()=>S.money<price(1000)?"не хватает денег":needEnergy(10),run:()=>{go(3);S.energy=clamp(S.energy-10);S.money-=price(1000);S.flags.firstAid=true;S.health=clamp(S.health+4);log("Прошёл курсы первой помощи. ❤️","unlock");}},
  {id:"mentor_session",cat:"📈 Развитие",show:()=>true,title:()=>"Менторская сессия 🏠",sub:()=>`2ч · −8⚡ · −${price(4000)}₽ · +8 к профильному навыку`,ok:()=>S.money<price(4000)?"не хватает денег":needEnergy(8),run:()=>{spend(2);S.energy=clamp(S.energy-8);S.money-=price(4000);const k=S.job?jobById(S.job).skill:"intellect";addSkill({[k]:8});log(`Менторская сессия по ${SKILL_KEYS[k]}. +8`,"good");}},
  {id:"music_school",cat:"📈 Развитие",show:()=>true,title:()=>"Музыкальная школа 🚗",sub:()=>`${awayT(2)}ч · −10⚡ · −${price(1500)}₽ · 🎨+4 🙂+3`,ok:()=>S.money<price(1500)?"не хватает денег":needEnergy(10),run:()=>{go(2);S.energy=clamp(S.energy-10);S.money-=price(1500);addSkill({creativity:4});S.mood=clamp(S.mood+3);log("Занимался музыкой. 🎨🙂");}},
  {id:"meditate",cat:"📈 Развитие",show:()=>true,title:()=>"Медитация 🏠",sub:()=>`0.5ч · 🙂+6 ⚡+4 · бесплатно`,ok:()=>true,run:()=>{spend(0.5);S.mood=clamp(S.mood+6);S.energy=clamp(S.energy+4);log("Помедитировал. 🙂");}},
];

/* ================= ДЕЙСТВИЯ: ОБРАЗОВАНИЕ (20) ================= */
const EDU_ACTIONS=[
  {id:"tutor",cat:"🎓 Образование",show:()=>S.edu===0&&!S.enrolled,title:()=>"Репетитор (подготовка к ЕГЭ) 🏠",sub:()=>`2ч · −8⚡ · −${price(3000)}₽ · 🧠+4`,ok:()=>S.money<price(3000)?"не хватает денег":needEnergy(8),run:()=>{spend(2);S.energy=clamp(S.energy-8);S.money-=price(3000);addSkill({intellect:4});log("Занимался с репетитором. 🧠");}},
  {id:"college",cat:"🎓 Образование",show:()=>S.edu===0&&!S.enrolled,title:()=>"Пойти в колледж",sub:()=>`−${price(20000)}₽ · потом «Учёба»`,ok:()=>needMoney(price(20000)),run:()=>{S.money-=price(20000);S.enrolled=1;S.eduProgress=0;log("Поступил в колледж.","good");}},
  {id:"uni_free",cat:"🎓 Образование",show:()=>S.edu<2&&!S.enrolled&&S.skills.intellect>=45&&(S.edu>=1||S.skills.intellect>=40),title:()=>"Вуз (бюджет, 🧠≥45)",sub:()=>`бесплатно`,ok:()=>true,run:()=>{S.enrolled=2;S.eduProgress=0;log("Поступил на бюджет!","good");}},
  {id:"uni_paid",cat:"🎓 Образование",show:()=>S.edu<2&&!S.enrolled&&S.skills.intellect<45&&(S.edu>=1||S.skills.intellect>=40),title:()=>"Вуз (платно)",sub:()=>`−${price(60000)}₽`,ok:()=>needMoney(price(60000)),run:()=>{S.money-=price(60000);S.enrolled=2;S.eduProgress=0;log("Поступил на платное.","good");}},
  {id:"online_master",cat:"🎓 Образование",show:()=>S.edu===2&&!S.enrolled,title:()=>"Онлайн-магистратура",sub:()=>`−${price(30000)}₽ · дешевле, но дольше`,ok:()=>needMoney(price(30000)),run:()=>{S.money-=price(30000);S.enrolled=3;S.eduProgress=-20;log("Поступил в онлайн-магистратуру.","good");}},
  {id:"master",cat:"🎓 Образование",show:()=>S.edu===2&&!S.enrolled,title:()=>"Магистратура",sub:()=>`−${price(40000)}₽`,ok:()=>needMoney(price(40000)),run:()=>{S.money-=price(40000);S.enrolled=3;S.eduProgress=0;log("Поступил в магистратуру.","good");}},
  {id:"phd",cat:"🎓 Образование",show:()=>S.edu===3&&!S.enrolled&&S.skills.intellect>=60,title:()=>"Аспирантура (PhD, 🧠≥60)",sub:()=>`−${price(20000)}₽`,ok:()=>needMoney(price(20000)),run:()=>{S.money-=price(20000);S.enrolled=4;S.eduProgress=0;log("Поступил в аспирантуру.","good");}},
  {id:"mba",cat:"🎓 Образование",show:()=>S.edu>=3&&S.edu<5&&!S.enrolled&&S.age>=28,title:()=>"MBA (для топ-должностей)",sub:()=>`−${price(300000)}₽`,ok:()=>needMoney(price(300000)),run:()=>{S.money-=price(300000);S.enrolled=5;S.eduProgress=0;log("Поступил на MBA.","good");}},
  {id:"studyuni",cat:"🎓 Образование",show:()=>!!S.enrolled,title:()=>`Учёба (${EDU[S.enrolled].t}: ${Math.round(Math.max(0,S.eduProgress))}/${EDU[S.enrolled].target}) 🚗`,sub:()=>`${awayT(3)}ч · −10⚡ · 🧠+2`,ok:()=>needEnergy(10),run:()=>{go(3);S.energy=clamp(S.energy-10);addSkill({intellect:2});S.eduProgress+=6*(1+S.skills.intellect/200);if(S.eduProgress>=EDU[S.enrolled].target){S.edu=S.enrolled;S.enrolled=null;S.eduProgress=0;addSkill({intellect:8});if(S.edu>=4)S.reputation=clamp(S.reputation+8);log(`🎓 Диплом: ${EDU[S.edu].t}!`,"good");}else log("Учёба идёт.");}},
  {id:"coursework",cat:"🎓 Образование",show:()=>!!S.enrolled,title:()=>"Курсовая / проект 🏠",sub:()=>`4ч · −14⚡ · большой рывок прогресса`,ok:()=>needEnergy(14),run:()=>{spend(4);S.energy=clamp(S.energy-14);S.eduProgress+=14;addSkill({intellect:2});log("Сдал курсовую. Прогресс скакнул.","good");}},
  {id:"honors",cat:"🎓 Образование",show:()=>!!S.enrolled,title:()=>"Учиться усерднее (на红 диплом) 🏠",sub:()=>`3ч · −16⚡ · прогресс + 🧠+3`,ok:()=>needEnergy(16),run:()=>{spend(3);S.energy=clamp(S.energy-16);S.eduProgress+=9;addSkill({intellect:3});S.flags.honors=true;log("Грыз гранит науки. 🧠");}},
  {id:"scholarship",cat:"🎓 Образование",show:()=>!!S.enrolled&&S.skills.intellect>=40,title:()=>"Подать на стипендию/грант 🏠",sub:()=>`1ч · шанс +${price(30000)}₽`,ok:()=>needEnergy(2),run:()=>{spend(1);if(Math.random()<0.5+S.skills.intellect/300){const g=price(30000);S.money+=g;log(`Дали грант: +${g}₽!`,"good");}else log("В стипендии отказали. В другой раз.");}},
  {id:"exchange",cat:"🎓 Образование",show:()=>!!S.enrolled&&S.skills.intellect>=45,title:()=>"Студобмен за рубежом ✈️",sub:()=>`3 дня · −${price(80000)}₽ · 💬+8 🧠+4`,ok:()=>needMoney(price(80000)),run:()=>{S.money-=price(80000);newDay(true);newDay(true);newDay(true);addSkill({charisma:8,intellect:4});S.mood=clamp(S.mood+15);log("Съездил по обмену. 💬🧠","good");}},
  {id:"lang_intensive",cat:"🎓 Образование",show:()=>!!S.enrolled,title:()=>"Языковой интенсив при вузе 🚗",sub:()=>`${awayT(3)}ч · −10⚡ · −${price(2000)}₽ · 💬+4`,ok:()=>S.money<price(2000)?"не хватает денег":needEnergy(10),run:()=>{go(3);S.energy=clamp(S.energy-10);S.money-=price(2000);addSkill({charisma:4});log("Языковой интенсив. 💬");}},
  {id:"military_dept",cat:"🎓 Образование",show:()=>!!S.enrolled&&S.sex==="М"&&S.age<24&&!S.flags.mil,title:()=>"Военная кафедра",sub:()=>`отсрочка/освобождение от армии`,ok:()=>true,run:()=>{S.flags.mil=true;log("Записался на военную кафедру. Армия не грозит.","unlock");}},
  {id:"academ",cat:"🎓 Образование",show:()=>!!S.enrolled,title:()=>"Академический отпуск",sub:()=>`пауза в учёбе (можно вернуться)`,ok:()=>true,run:()=>{S.flags.academ=(S.enrolled);S.flags.academProg=S.eduProgress;S.enrolled=null;log("Взял академ. Учёба на паузе.");}},
  {id:"academ_back",cat:"🎓 Образование",show:()=>!S.enrolled&&S.flags.academ,title:()=>"Вернуться из академа",sub:()=>`продолжить учёбу`,ok:()=>true,run:()=>{S.enrolled=S.flags.academ;S.eduProgress=S.flags.academProg||0;S.flags.academ=null;log("Вернулся к учёбе.","good");}},
  {id:"prof_retrain",cat:"🎓 Образование",show:()=>S.edu>=1&&!S.enrolled,title:()=>"Профпереподготовка 🏠",sub:()=>`3ч · −${price(15000)}₽ · +6 к выбору навыка под новую сферу`,ok:()=>S.money<price(15000)?"не хватает денег":needEnergy(10),run:()=>{spend(3);S.money-=price(15000);addSkill({intellect:3,tech:3});log("Прошёл переподготовку. Сменить сферу проще.","good");}},
  {id:"second_higher",cat:"🎓 Образование",show:()=>S.edu>=3&&!S.enrolled&&!S.flags.second,title:()=>"Второе высшее",sub:()=>`−${price(80000)}₽ · +престиж`,ok:()=>needMoney(price(80000)),run:()=>{S.money-=price(80000);S.flags.second=true;S.reputation=clamp(S.reputation+6);addSkill({intellect:5});log("Получил второе высшее. +престиж.","good");}},
  {id:"science_paper",cat:"🎓 Образование",show:()=>S.edu>=4,title:()=>"Научная статья / конференция 🚗",sub:()=>`${awayT(4)}ч · −12⚡ · +репутация 🧠+3`,ok:()=>needEnergy(12),run:()=>{go(4);S.energy=clamp(S.energy-12);addSkill({intellect:3});S.reputation=clamp(S.reputation+5);log("Опубликовал статью. 🔬 престиж.","good");}},
];

/* ================= ДЕЙСТВИЯ: БЫТ (22) ================= */
const HOME_ACTIONS=[
  {id:"eat_home",cat:"🍔 Быт",show:()=>HOUSING[S.housing].parentsFeed,title:()=>"Поесть у бабушки 🏠",sub:()=>`0.5ч · бесплатно · 🍔+35`,ok:()=>true,run:()=>{spend(0.5);S.sat=clamp(S.sat+35);S.health=clamp(S.health+1);S.flags.ate=true;log("Бабушка накормила. 🍔");}},
  {id:"cook",cat:"🍔 Быт",show:()=>!HOUSING[S.housing].parentsFeed,title:()=>"Приготовить дома 🏠",sub:()=>`1ч · −${price(150)}₽ · 🍔+40 ❤️+1`,ok:()=>needMoney(price(150)),run:()=>{spend(1);S.money-=price(150);S.sat=clamp(S.sat+40);S.health=clamp(S.health+1);S.flags.ate=true;log("Приготовил ужин. 🍔");}},
  {id:"healthy",cat:"🍔 Быт",show:()=>!HOUSING[S.housing].parentsFeed,title:()=>"Здоровое питание 🏠",sub:()=>`1ч · −${price(350)}₽ · 🍔+38 ❤️+4`,ok:()=>needMoney(price(350)),run:()=>{spend(1);S.money-=price(350);S.sat=clamp(S.sat+38);S.health=clamp(S.health+4);S.flags.ate=true;log("ПП-ужин. 🍔❤️");}},
  {id:"mealprep",cat:"🍔 Быт",show:()=>!HOUSING[S.housing].parentsFeed,title:()=>"Готовка впрок 🏠",sub:()=>`2ч · −${price(500)}₽ · 🍔+55 · запас на дни`,ok:()=>needMoney(price(500)),run:()=>{spend(2);S.money-=price(500);S.sat=clamp(S.sat+55);S.flags.ate=true;log("Наготовил впрок. 🍔");}},
  {id:"grocery",cat:"🍔 Быт",show:()=>!HOUSING[S.housing].parentsFeed,title:()=>"Закупка продуктов на неделю 🚗",sub:()=>`${awayT(1)}ч · −${price(2500)}₽ · 🍔+45 · дешевле за порцию`,ok:()=>needMoney(price(2500)),run:()=>{go(1);S.money-=price(2500);S.sat=clamp(S.sat+45);S.flags.ate=true;log("Затарился на неделю. 🍔");}},
  {id:"fastfood",cat:"🍔 Быт",show:()=>true,title:()=>"Фастфуд 🚗",sub:()=>`${awayT(0.5)}ч · −${price(300)}₽ · 🍔+35 🙂+5 ❤️−3`,ok:()=>needMoney(price(300)),run:()=>{go(0.5);S.money-=price(300);S.sat=clamp(S.sat+35);S.mood=clamp(S.mood+5);S.health=clamp(S.health-3);S.flags.ate=true;log("Перекусил фастфудом. 🍔🙂");}},
  {id:"cafe",cat:"🍔 Быт",show:()=>true,title:()=>"Кафе / столовая 🚗",sub:()=>`${awayT(0.7)}ч · −${price(500)}₽ · 🍔+35 🙂+6`,ok:()=>needMoney(price(500)),run:()=>{go(0.7);S.money-=price(500);S.sat=clamp(S.sat+35);S.mood=clamp(S.mood+6);S.flags.ate=true;log("Поел в кафе. 🍔🙂");}},
  {id:"delivery",cat:"🍔 Быт",show:()=>!HOUSING[S.housing].parentsFeed,title:()=>"Доставка 🏠",sub:()=>`0.3ч · −${price(700)}₽ · 🍔+40`,ok:()=>needMoney(price(700)),run:()=>{spend(0.3);S.money-=price(700);S.sat=clamp(S.sat+40);S.flags.ate=true;log("Заказал доставку. 🍔");}},
  {id:"sleep",cat:"🍔 Быт",show:()=>true,title:()=>`Поспать (⚡ до ${HOUSING[S.housing].sleep}) 🏠`,sub:()=>`сон · новый день`,ok:()=>true,run:()=>{const q=HOUSING[S.housing].sleep;newDay(true);S.energy=Math.max(S.energy,q);S.mood=clamp(S.mood+4);S.health=clamp(S.health+2);S.fatigue=Math.max(0,(S.fatigue||0)-25);log("Лёг спать. Новый день.");}},
  {id:"nap",cat:"🍔 Быт",show:()=>true,title:()=>"Дневной сон 🏠",sub:()=>`1.5ч · ⚡+18 🙂+3`,ok:()=>needEnergy(0),run:()=>{spend(1.5);S.energy=clamp(S.energy+18);S.mood=clamp(S.mood+3);log("Вздремнул. ⚡");}},
  {id:"coffee",cat:"🍔 Быт",show:()=>true,title:()=>"Утренний кофе 🏠",sub:()=>`0.3ч · −${price(120)}₽ · ⚡+8 🙂+3`,ok:()=>needMoney(price(120)),run:()=>{spend(0.3);S.money-=price(120);S.energy=clamp(S.energy+8);S.mood=clamp(S.mood+3);log("Взбодрился кофе. ⚡");}},
  {id:"chores",cat:"🍔 Быт",show:()=>HOUSING[S.housing].parentsFeed,title:()=>"Помочь родителям 🏠",sub:()=>`1ч · −5⚡ · 🙂+5`,ok:()=>needEnergy(5),run:()=>{spend(1);S.energy=clamp(S.energy-5);S.mood=clamp(S.mood+5);log("Помог по дому.");}},
  {id:"clean",cat:"🍔 Быт",show:()=>!HOUSING[S.housing].parentsFeed,title:()=>"Уборка дома 🏠",sub:()=>`1ч · −6⚡ · 🙂+5 · комфорт`,ok:()=>needEnergy(6),run:()=>{spend(1);S.energy=clamp(S.energy-6);S.mood=clamp(S.mood+5);log("Прибрался. 🙂");}},
  {id:"laundry",cat:"🍔 Быт",show:()=>!HOUSING[S.housing].parentsFeed,title:()=>"Стирка / химчистка 🏠",sub:()=>`0.7ч · −${price(400)}₽ · 🙂+3`,ok:()=>needMoney(price(400)),run:()=>{spend(0.7);S.money-=price(400);S.mood=clamp(S.mood+3);log("Постирал вещи.");}},
  {id:"cleaner",cat:"🍔 Быт",show:()=>!HOUSING[S.housing].parentsFeed,title:()=>"Нанять клинера 🏠",sub:()=>`0.2ч · −${price(2000)}₽ · 🙂+6 · экономит время`,ok:()=>needMoney(price(2000)),run:()=>{spend(0.2);S.money-=price(2000);S.mood=clamp(S.mood+6);log("Клинер навёл порядок. 🙂");}},
  {id:"appliance",cat:"🍔 Быт",show:()=>HOUSING[S.housing].v>=48,title:()=>"Купить бытовую технику 🚗",sub:()=>`${awayT(2)}ч · −${price(30000)}₽ · 🙂+12 комфорт`,ok:()=>needMoney(price(30000)),run:()=>{go(2);S.money-=price(30000);S.mood=clamp(S.mood+12);log("Обновил технику дома. 🙂","good");}},
  {id:"furnish",cat:"🍔 Быт",show:()=>HOUSING[S.housing].v>=48,title:()=>"Обустроить квартиру 🚗",sub:()=>`${awayT(3)}ч · −${price(50000)}₽ · 🙂+18`,ok:()=>needMoney(price(50000)),run:()=>{go(3);S.money-=price(50000);S.mood=clamp(S.mood+18);log("Обустроил жильё под себя. 🙂","good");}},
  {id:"pet_get",cat:"🍔 Быт",show:()=>!S.pet&&HOUSING[S.housing].v>=32,title:()=>"Завести питомца 🐈",sub:()=>`−${price(15000)}₽ · 🙂+15 · нужен уход`,ok:()=>needMoney(price(15000)),run:()=>{S.money-=price(15000);S.pet=true;S.mood=clamp(S.mood+15);log("Завёл питомца. 🐈🙂","good");}},
  {id:"pet_care",cat:"🍔 Быт",show:()=>!!S.pet,title:()=>"Уход за питомцем 🏠",sub:()=>`1ч · −${price(500)}₽ · 🙂+8 ❤️+2`,ok:()=>needMoney(price(500)),run:()=>{spend(1);S.money-=price(500);S.mood=clamp(S.mood+8);S.health=clamp(S.health+2);log("Погулял/поиграл с питомцем. 🐈");}},
  {id:"wardrobe",cat:"🍔 Быт",show:()=>true,title:()=>"Шопинг одежды 🚗",sub:()=>`${awayT(2)}ч · −${price(8000)}₽ · 🙂+10`,ok:()=>needMoney(price(8000)),run:()=>{go(2);S.money-=price(8000);S.mood=clamp(S.mood+10);log("Обновил гардероб. 🙂");}},
  {id:"seasonal",cat:"🍔 Быт",show:()=>season()==="winter"||season()==="autumn",title:()=>"Сезонная подготовка (тёплые вещи) 🚗",sub:()=>`${awayT(1.5)}ч · −${price(6000)}₽ · ❤️+4 🙂+4`,ok:()=>needMoney(price(6000)),run:()=>{go(1.5);S.money-=price(6000);S.health=clamp(S.health+4);S.mood=clamp(S.mood+4);log("Подготовился к холодам. ❤️");}},
  {id:"pay_utils",cat:"🍔 Быт",show:()=>HOUSING[S.housing].owned||HOUSING[S.housing].mortgage,title:()=>"Оплатить ЖКХ вручную 🏠",sub:()=>`0.3ч · −${price(3500)}₽ · спокойствие 🙂+2`,ok:()=>needMoney(price(3500)),run:()=>{spend(0.3);S.money-=price(3500);S.mood=clamp(S.mood+2);log("Оплатил ЖКХ.");}},
];

/* ================= ДЕЙСТВИЯ: ЗДОРОВЬЕ (22) ================= */
const HEALTH_ACTIONS=[
  {id:"pharmacy",cat:"❤️ Здоровье",show:()=>true,title:()=>"Аптека 🚗",sub:()=>`${awayT(0.5)}ч · −${price(600)}₽ · ❤️+6`,ok:()=>needMoney(price(600)),run:()=>{go(0.5);S.money-=price(600);S.health=clamp(S.health+6);log("Купил лекарства. ❤️");}},
  {id:"oms",cat:"❤️ Здоровье",show:()=>true,title:()=>"Поликлиника (ОМС) 🚗",sub:()=>`${awayT(2)}ч · бесплатно · ❤️+12 🙂−3`,ok:()=>needEnergy(3),run:()=>{go(2);S.energy=clamp(S.energy-3);S.health=clamp(S.health+12);S.mood=clamp(S.mood-3);log("Сходил по ОМС. Очереди, но ❤️.");}},
  {id:"dentist",cat:"❤️ Здоровье",show:()=>true,title:()=>"Стоматолог 🚗",sub:()=>`${awayT(1)}ч · −${price(3000)}₽ · ❤️+10 🙂+2`,ok:()=>needMoney(price(3000)),run:()=>{go(1);S.money-=price(3000);S.health=clamp(S.health+10);S.mood=clamp(S.mood+2);log("Полечил зубы. ❤️");}},
  {id:"clinic",cat:"❤️ Здоровье",show:()=>true,title:()=>"Платная клиника 🚗",sub:()=>`${awayT(1)}ч · −${price(S.subs.dms?1500:4000)}₽ · ❤️+18`,ok:()=>needMoney(price(S.subs.dms?1500:4000)),run:()=>{go(1);S.money-=price(S.subs.dms?1500:4000);S.health=clamp(S.health+18);log("Платная клиника. ❤️+18");}},
  {id:"checkup",cat:"❤️ Здоровье",show:()=>true,title:()=>"Диспансеризация / чекап 🚗",sub:()=>`${awayT(2)}ч · −${price(2000)}₽ · ❤️+8 · раннее выявление`,ok:()=>needMoney(price(2000)),run:()=>{go(2);S.money-=price(2000);S.health=clamp(S.health+8);if(S.chronic.length&&Math.random()<0.5){S.chronic.pop();log("Чекап помог взять хронь под контроль. ❤️","good");}else log("Чекап пройден. Всё под контролем. ❤️");}},
  {id:"analyses",cat:"❤️ Здоровье",show:()=>true,title:()=>"Сдать анализы 🚗",sub:()=>`${awayT(1)}ч · −${price(1500)}₽ · ❤️+5`,ok:()=>needMoney(price(1500)),run:()=>{go(1);S.money-=price(1500);S.health=clamp(S.health+5);log("Сдал анализы. ❤️");}},
  {id:"vaccine",cat:"❤️ Здоровье",show:()=>true,title:()=>"Вакцинация 🚗",sub:()=>`${awayT(0.5)}ч · −${price(1000)}₽ · ❤️+4 · меньше простуд`,ok:()=>needMoney(price(1000)),run:()=>{go(0.5);S.money-=price(1000);S.health=clamp(S.health+4);S.flags.vax=true;log("Поставил прививку. ❤️");}},
  {id:"optician",cat:"❤️ Здоровье",show:()=>true,title:()=>"Окулист + очки 🚗",sub:()=>`${awayT(1)}ч · −${price(5000)}₽ · ❤️+5 🙂+3`,ok:()=>needMoney(price(5000)),run:()=>{go(1);S.money-=price(5000);S.health=clamp(S.health+5);S.mood=clamp(S.mood+3);log("Подобрал очки. Видно лучше.");}},
  {id:"therapist",cat:"❤️ Здоровье",show:()=>true,title:()=>"Психотерапевт 🚗",sub:()=>`${awayT(1.5)}ч · −${price(4000)}₽ · 🙂+20 ❤️+3`,ok:()=>needMoney(price(4000)),run:()=>{go(1.5);S.money-=price(4000);S.mood=clamp(S.mood+20);S.health=clamp(S.health+3);log("Поговорил с психотерапевтом. 🙂 полегчало.","good");}},
  {id:"dietician",cat:"❤️ Здоровье",show:()=>true,title:()=>"Диетолог 🚗",sub:()=>`${awayT(1)}ч · −${price(3000)}₽ · ❤️+8`,ok:()=>needMoney(price(3000)),run:()=>{go(1);S.money-=price(3000);S.health=clamp(S.health+8);log("Составил рацион с диетологом. ❤️");}},
  {id:"vitamins",cat:"❤️ Здоровье",show:()=>true,title:()=>"Витамины / добавки 🏠",sub:()=>`0.2ч · −${price(1200)}₽ · ❤️+5`,ok:()=>needMoney(price(1200)),run:()=>{spend(0.2);S.money-=price(1200);S.health=clamp(S.health+5);log("Пропил витамины. ❤️");}},
  {id:"fitness_sub",cat:"❤️ Здоровье",show:()=>!S.subs.gym,title:()=>"Абонемент в фитнес",sub:()=>`подписка ${price(3000)}₽/мес · регулярно ❤️💪`,ok:()=>true,run:()=>{S.subs.gym=true;log("Оформил абонемент в фитнес.","good");}},
  {id:"fitness_cancel",cat:"❤️ Здоровье",show:()=>!!S.subs.gym,title:()=>"Отменить абонемент фитнеса",sub:()=>`−${price(3000)}₽/мес расход уйдёт`,ok:()=>true,run:()=>{S.subs.gym=false;log("Отменил абонемент фитнеса.");}},
  {id:"pool",cat:"❤️ Здоровье",show:()=>true,title:()=>"Бассейн 🚗",sub:()=>`${awayT(1.5)}ч · −${price(700)}₽ · ❤️+6 💪+2 🙂+4`,ok:()=>needMoney(price(700)),run:()=>{go(1.5);S.money-=price(700);S.health=clamp(S.health+6);addSkill({strength:2});S.mood=clamp(S.mood+4);log("Поплавал. ❤️💪");}},
  {id:"yoga",cat:"❤️ Здоровье",show:()=>true,title:()=>"Йога 🚗",sub:()=>`${awayT(1.5)}ч · −${price(800)}₽ · 🙂+10 ❤️+4`,ok:()=>needMoney(price(800)),run:()=>{go(1.5);S.money-=price(800);S.mood=clamp(S.mood+10);S.health=clamp(S.health+4);log("Йога. 🙂❤️");}},
  {id:"run",cat:"❤️ Здоровье",show:()=>true,title:()=>"Пробежка по утрам 🏠",sub:()=>`1ч · −6⚡ · ❤️+5 💪+2 · бесплатно`,ok:()=>needEnergy(6),run:()=>{spend(1);S.energy=clamp(S.energy-6);S.health=clamp(S.health+5);addSkill({strength:2});log("Пробежался. ❤️💪");}},
  {id:"quit_smoke",cat:"❤️ Здоровье",show:()=>S.addiction.smoke>0,title:()=>"Бросить курить 🏠",sub:()=>`тяжело · 🙂−6 сейчас · ❤️ потом`,ok:()=>true,run:()=>{S.addiction.smoke=0;S.mood=clamp(S.mood-6);log("Бросил курить. Ломает, но здоровье скажет спасибо.","good");}},
  {id:"quit_alcohol",cat:"❤️ Здоровье",show:()=>S.addiction.alcohol>0,title:()=>"Завязать с алкоголем 🏠",sub:()=>`🙂−6 сейчас · ❤️ потом`,ok:()=>true,run:()=>{S.addiction.alcohol=0;S.mood=clamp(S.mood-6);log("Завязал с алкоголем.","good");}},
  {id:"rehab",cat:"❤️ Здоровье",show:()=>S.addiction.smoke>1||S.addiction.alcohol>1||S.chronic.length>0,title:()=>"Реабилитация 🚗",sub:()=>`3 дня · −${price(60000)}₽ · ❤️+40 сброс зависимостей`,ok:()=>needMoney(price(60000)),run:()=>{S.money-=price(60000);newDay(true);newDay(true);newDay(true);S.health=clamp(S.health+40);S.addiction={smoke:0,alcohol:0};log("Прошёл реабилитацию. ❤️","good");}},
  {id:"dms",cat:"❤️ Здоровье",show:()=>!S.subs.dms,title:()=>"Оформить ДМС",sub:()=>`подписка ${price(4000)}₽/мес · скидка на лечение`,ok:()=>true,run:()=>{S.subs.dms=true;log("Оформил ДМС. Клиника теперь дешевле.","good");}},
  {id:"sanatorium",cat:"❤️ Здоровье",show:()=>true,title:()=>"Санаторий ✈️",sub:()=>`3 дня · −${price(50000)}₽ · ❤️+35 🙂+25`,ok:()=>needMoney(price(50000)),run:()=>{S.money-=price(50000);newDay(true);newDay(true);newDay(true);S.health=clamp(S.health+35);S.mood=clamp(S.mood+25);log("Отдохнул в санатории. ❤️🙂","good");}},
  {id:"surgery",cat:"❤️ Здоровье",show:()=>S.health<40,title:()=>"Плановая операция 🚗",sub:()=>`2 дня · −${price(120000)}₽ · ❤️ до 90`,ok:()=>needMoney(price(120000)),run:()=>{S.money-=price(120000);newDay(true);newDay(true);S.health=Math.max(S.health,90);log("Сделал операцию. Здоровье восстановлено. ❤️","good");}},
];

/* ================= ДЕЙСТВИЯ: ДОСУГ (22) ================= */
const FUN_ACTIONS=[
  {id:"games",cat:"🎮 Досуг",show:()=>true,title:()=>"Игры дома 🏠",sub:()=>`2ч · −3⚡ · 🙂+10 ❤️−2`,ok:()=>needEnergy(3),run:()=>{spend(2);S.energy=clamp(S.energy-3);S.mood=clamp(S.mood+10);S.health=clamp(S.health-2);log("Залип в игры. 🙂");}},
  {id:"streaming",cat:"🎮 Досуг",show:()=>true,title:()=>"Сериалы / стриминг 🏠",sub:()=>`2ч · −2⚡ · 🙂+9 ❤️−2`,ok:()=>needEnergy(2),run:()=>{spend(2);S.energy=clamp(S.energy-2);S.mood=clamp(S.mood+9);S.health=clamp(S.health-2);log("Смотрел сериалы. 🙂");}},
  {id:"friends",cat:"🎮 Досуг",show:()=>true,title:()=>"Погулять с друзьями 🚗",sub:()=>`${awayT(3)}ч · −6⚡ · 🙂+15 +дружба`,ok:()=>needEnergy(6),run:()=>{go(3);S.energy=clamp(S.energy-6);S.mood=clamp(S.mood+15);S.friends=Math.min(100,S.friends+4);log("Гулял с друзьями. 🙂");}},
  {id:"boardgames",cat:"🎮 Досуг",show:()=>true,title:()=>"Настолки с друзьями 🏠",sub:()=>`2.5ч · −4⚡ · 🙂+12 +дружба 🧠+1`,ok:()=>needEnergy(4),run:()=>{spend(2.5);S.energy=clamp(S.energy-4);S.mood=clamp(S.mood+12);S.friends=Math.min(100,S.friends+3);addSkill({intellect:1});log("Играли в настолки. 🙂");}},
  {id:"cinema",cat:"🎮 Досуг",show:()=>true,title:()=>"Кино 🚗",sub:()=>`${awayT(2)}ч · −${price(800)}₽ · 🙂+12`,ok:()=>needMoney(price(800)),run:()=>{go(2);S.money-=price(800);S.mood=clamp(S.mood+12);log("Сходил в кино. 🙂");}},
  {id:"museum",cat:"🎮 Досуг",show:()=>true,title:()=>"Музей / выставка 🚗",sub:()=>`${awayT(2)}ч · −${price(600)}₽ · 🙂+8 🧠+2`,ok:()=>needMoney(price(600)),run:()=>{go(2);S.money-=price(600);S.mood=clamp(S.mood+8);addSkill({intellect:2});log("Культурно обогатился. 🧠🙂");}},
  {id:"theater",cat:"🎮 Досуг",show:()=>true,title:()=>"Театр 🚗",sub:()=>`${awayT(3)}ч · −${price(2500)}₽ · 🙂+16 💬+1`,ok:()=>needMoney(price(2500)),run:()=>{go(3);S.money-=price(2500);S.mood=clamp(S.mood+16);addSkill({charisma:1});log("Вечер в театре. 🙂");}},
  {id:"bar",cat:"🎮 Досуг",show:()=>true,title:()=>"Бар с друзьями 🚗",sub:()=>`${awayT(3)}ч · −${price(1500)}₽ · 🙂+18 ❤️−3 +дружба`,ok:()=>needMoney(price(1500)),run:()=>{go(3);S.money-=price(1500);S.mood=clamp(S.mood+18);S.health=clamp(S.health-3);S.friends=Math.min(100,S.friends+3);if(Math.random()<0.15)S.addiction.alcohol=Math.min(3,S.addiction.alcohol+1);log("Посидел в баре. 🙂");}},
  {id:"karaoke",cat:"🎮 Досуг",show:()=>true,title:()=>"Караоке 🚗",sub:()=>`${awayT(3)}ч · −${price(1800)}₽ · 🙂+16 💬+1`,ok:()=>needMoney(price(1800)),run:()=>{go(3);S.money-=price(1800);S.mood=clamp(S.mood+16);addSkill({charisma:1});log("Пел в караоке. 🙂");}},
  {id:"bowling",cat:"🎮 Досуг",show:()=>true,title:()=>"Боулинг / бильярд 🚗",sub:()=>`${awayT(2.5)}ч · −${price(1500)}₽ · 🙂+14 +дружба`,ok:()=>needMoney(price(1500)),run:()=>{go(2.5);S.money-=price(1500);S.mood=clamp(S.mood+14);S.friends=Math.min(100,S.friends+2);log("Боулинг с компанией. 🙂");}},
  {id:"escape",cat:"🎮 Досуг",show:()=>true,title:()=>"Квест-комната 🚗",sub:()=>`${awayT(2)}ч · −${price(2000)}₽ · 🙂+15 🧠+2`,ok:()=>needMoney(price(2000)),run:()=>{go(2);S.money-=price(2000);S.mood=clamp(S.mood+15);addSkill({intellect:2});log("Прошли квест-комнату. 🙂🧠");}},
  {id:"stadium",cat:"🎮 Досуг",show:()=>true,title:()=>"Матч на стадионе 🚗",sub:()=>`${awayT(3)}ч · −${price(2500)}₽ · 🙂+20`,ok:()=>needMoney(price(2500)),run:()=>{go(3);S.money-=price(2500);S.mood=clamp(S.mood+20);log("Болел за наших. 🙂");}},
  {id:"concert",cat:"🎮 Досуг",show:()=>true,title:()=>"Концерт 🚗",sub:()=>`${awayT(4)}ч · −${price(3000)}₽ · 🙂+30`,ok:()=>needMoney(price(3000)),run:()=>{go(4);S.money-=price(3000);S.mood=clamp(S.mood+30);log("Оторвался на концерте. 🙂");}},
  {id:"festival",cat:"🎮 Досуг",show:()=>season()==="summer",title:()=>"Фестиваль / опен-эйр 🚗",sub:()=>`${awayT(6)}ч · −${price(5000)}₽ · 🙂+35`,ok:()=>needMoney(price(5000)),run:()=>{go(6);S.money-=price(5000);S.mood=clamp(S.mood+35);log("Гулял на фестивале. 🙂","good");}},
  {id:"hike",cat:"🎮 Досуг",show:()=>true,title:()=>"Поход на природу 🚗",sub:()=>`${awayT(5)}ч · −12⚡ · 🙂+18 ❤️+8`,ok:()=>needEnergy(12),run:()=>{go(5);S.energy=clamp(S.energy-12);S.mood=clamp(S.mood+18);S.health=clamp(S.health+8);log("Сходил в поход. 🙂❤️");}},
  {id:"fishing",cat:"🎮 Досуг",show:()=>true,title:()=>"Рыбалка 🚗",sub:()=>`${awayT(5)}ч · −8⚡ · 🙂+16 ❤️+4`,ok:()=>needEnergy(8),run:()=>{go(5);S.energy=clamp(S.energy-8);S.mood=clamp(S.mood+16);S.health=clamp(S.health+4);log("Рыбачил. Тишина и покой. 🙂");}},
  {id:"beach",cat:"🎮 Досуг",show:()=>season()==="summer",title:()=>"День на пляже 🚗",sub:()=>`${awayT(4)}ч · −6⚡ · 🙂+20 ❤️+5`,ok:()=>needEnergy(6),run:()=>{go(4);S.energy=clamp(S.energy-6);S.mood=clamp(S.mood+20);S.health=clamp(S.health+5);log("Отдохнул на пляже. 🙂");}},
  {id:"skating",cat:"🎮 Досуг",show:()=>season()==="winter",title:()=>"Каток 🚗",sub:()=>`${awayT(2)}ч · −8⚡ · 🙂+14 💪+1`,ok:()=>needEnergy(8),run:()=>{go(2);S.energy=clamp(S.energy-8);S.mood=clamp(S.mood+14);addSkill({strength:1});log("Катался на коньках. 🙂");}},
  {id:"shopping_fun",cat:"🎮 Досуг",show:()=>true,title:()=>"Шопинг ради удовольствия 🚗",sub:()=>`${awayT(2)}ч · −${price(6000)}₽ · 🙂+14`,ok:()=>needMoney(price(6000)),run:()=>{go(2);S.money-=price(6000);S.mood=clamp(S.mood+14);log("Порадовал себя покупками. 🙂");}},
  {id:"house_party",cat:"🎮 Досуг",show:()=>HOUSING[S.housing].v>=48,title:()=>"Вечеринка дома 🏠",sub:()=>`3ч · −${price(4000)}₽ · 🙂+22 +дружба`,ok:()=>needMoney(price(4000)),run:()=>{spend(3);S.money-=price(4000);S.mood=clamp(S.mood+22);S.friends=Math.min(100,S.friends+8);log("Устроил вечеринку. 🙂","good");}},
  {id:"trip",cat:"🎮 Досуг",show:()=>true,title:()=>"Уехать на выходные ✈️",sub:()=>`2 дня · −${price(40000)}₽ · 🙂+40 ❤️+8`,ok:()=>needMoney(price(40000)),run:()=>{S.money-=price(40000);newDay(true);newDay(true);S.mood=clamp(S.mood+40);S.health=clamp(S.health+8);log("Съездил отдохнуть. 🙂 перезагрузка.","good");}},
  {id:"abroad",cat:"🎮 Досуг",show:()=>true,title:()=>"Путешествие за границу ✈️",sub:()=>`4 дня · −${price(120000)}₽ · 🙂+55 ❤️+12 💬+2`,ok:()=>needMoney(price(120000)),run:()=>{S.money-=price(120000);for(let i=0;i<4;i++)newDay(true);S.mood=clamp(S.mood+55);S.health=clamp(S.health+12);addSkill({charisma:2});log("Слетал за границу. 🙂✈️","good");}},
];

/* ================= ДЕЙСТВИЯ: ЖИЛЬЁ (22) ================= */
function hMove(i,mood){S.housing=i;S.mood=clamp(S.mood+(mood||0));log(`🏠 Новое жильё: ${HOUSING[i].t}.`,"good");}
const HOUSE_ACTIONS=[
  {id:"h_parents",cat:"🏠 Жильё",show:()=>S.housing>0&&S.housing<9,title:()=>"Вернуться к родителям",sub:()=>`экономия · но −комфорт`,ok:()=>true,run:()=>{hMove(0,-6);}},
  {id:"h_komm",cat:"🏠 Жильё",show:()=>S.housing!==1&&S.housing<7,title:()=>"Комната в коммуналке",sub:()=>`залог −${price(11000)}₽ · аренда ${price(9000)}₽/мес`,ok:()=>needMoney(price(11000)),run:()=>{S.money-=price(11000);hMove(1,2);}},
  {id:"h_dorm",cat:"🏠 Жильё",show:()=>!!S.enrolled&&S.housing!==2,title:()=>"Общага (студентам)",sub:()=>`аренда ${price(6000)}₽/мес`,ok:()=>true,run:()=>{hMove(2,5);}},
  {id:"h_studio",cat:"🏠 Жильё",show:()=>S.housing<3||S.housing>6,title:()=>"Снять студию",sub:()=>`залог −${price(26000)}₽ · аренда ${price(22000)}₽/мес`,ok:()=>needMoney(price(26000)),run:()=>{S.money-=price(26000);hMove(3,10);}},
  {id:"h_1k",cat:"🏠 Жильё",show:()=>S.housing<4||S.housing>6,title:()=>"Снять 1-к квартиру",sub:()=>`залог −${price(34000)}₽ · аренда ${price(28000)}₽/мес`,ok:()=>needMoney(price(34000)),run:()=>{S.money-=price(34000);hMove(4,12);}},
  {id:"h_2k",cat:"🏠 Жильё",show:()=>S.housing<5,title:()=>"Снять 2-к с соседом",sub:()=>`залог −${price(20000)}₽ · аренда ${price(16000)}₽/мес · дешевле`,ok:()=>needMoney(price(20000)),run:()=>{S.money-=price(20000);hMove(5,4);}},
  {id:"h_apart",cat:"🏠 Жильё",show:()=>S.housing<6||S.housing>6&&S.housing<7,title:()=>"Апартаменты",sub:()=>`залог −${price(50000)}₽ · аренда ${price(45000)}₽/мес · статус`,ok:()=>needMoney(price(50000)),run:()=>{S.money-=price(50000);hMove(6,14);}},
  {id:"h_mort_studio",cat:"🏠 Жильё",show:()=>S.housing<7&&!!S.job,title:()=>"Ипотека — студия",sub:()=>`взнос −${price(300000)}₽ · платёж ${price(28000)}₽/мес`,ok:()=>needMoney(price(300000)),run:()=>{S.money-=price(300000);hMove(7,15);}},
  {id:"h_mort_2k",cat:"🏠 Жильё",show:()=>S.housing<8&&!!S.job,title:()=>"Ипотека — 2-к семейная",sub:()=>`взнос −${price(500000)}₽ · платёж ${price(40000)}₽/мес`,ok:()=>needMoney(price(500000)),run:()=>{S.money-=price(500000);hMove(8,18);}},
  {id:"h_own",cat:"🏠 Жильё",show:()=>S.housing<9,title:()=>"Купить квартиру (вторичка)",sub:()=>`−${price(3500000)}₽ · без аренды`,ok:()=>needMoney(price(3500000)),run:()=>{S.money-=price(3500000);hMove(9,25);}},
  {id:"h_new",cat:"🏠 Жильё",show:()=>S.housing<10,title:()=>"Купить в новостройке",sub:()=>`−${price(3000000)}₽ · ждать сдачи, но новее`,ok:()=>needMoney(price(3000000)),run:()=>{S.money-=price(3000000);hMove(10,22);}},
  {id:"h_dacha",cat:"🏠 Жильё",show:()=>S.housing<11&&S.housing>=9,title:()=>"Загородный дом / дача",sub:()=>`−${price(2500000)}₽ · тишина и природа`,ok:()=>needMoney(price(2500000)),run:()=>{S.money-=price(2500000);hMove(11,20);}},
  {id:"h_town",cat:"🏠 Жильё",show:()=>S.housing<12&&S.housing>=9,title:()=>"Таунхаус",sub:()=>`−${price(6000000)}₽`,ok:()=>needMoney(price(6000000)),run:()=>{S.money-=price(6000000);hMove(12,25);}},
  {id:"h_elite",cat:"🏠 Жильё",show:()=>S.housing<13,title:()=>"Элитное жильё",sub:()=>`−${price(15000000)}₽ · максимальный статус`,ok:()=>needMoney(price(15000000)),run:()=>{S.money-=price(15000000);hMove(13,30);}},
  {id:"h_cosmetic",cat:"🏠 Жильё",show:()=>HOUSING[S.housing].v>=48,title:()=>"Косметический ремонт 🏠",sub:()=>`−${price(80000)}₽ · 🙂+15 комфорт`,ok:()=>needMoney(price(80000)),run:()=>{S.money-=price(80000);S.mood=clamp(S.mood+15);log("Освежил ремонт. 🙂","good");}},
  {id:"h_capital",cat:"🏠 Жильё",show:()=>HOUSING[S.housing].owned,title:()=>"Капитальный ремонт 🏠",sub:()=>`−${price(400000)}₽ · 🙂+30`,ok:()=>needMoney(price(400000)),run:()=>{S.money-=price(400000);S.mood=clamp(S.mood+30);log("Сделал капитальный ремонт. 🙂","good");}},
  {id:"h_sublet",cat:"🏠 Жильё",show:()=>HOUSING[S.housing].owned&&!S.subletOn,title:()=>"Сдать комнату в аренду",sub:()=>`+${price(15000)}₽/мес пассивно`,ok:()=>true,run:()=>{S.subletOn=true;S.passive=(S.passive||0)+priceRaw(15000);log("Сдал комнату — пассивный доход +15к/мес.","good");}},
  {id:"h_buy_rental",cat:"🏠 Жильё",show:()=>true,title:()=>"Купить объект под аренду 🏢",sub:()=>`−${price(2500000)}₽ · +${price(12000)}₽/мес`,ok:()=>needMoney(price(2500000)),run:()=>{S.money-=price(2500000);S.rentalUnits=(S.rentalUnits||0)+1;log("Купил квартиру под сдачу. 🏢","good");}},
  {id:"h_sell_rental",cat:"🏠 Жильё",show:()=>(S.rentalUnits||0)>0,title:()=>"Продать объект аренды 🏢",sub:()=>`+${price(2400000)}₽`,ok:()=>true,run:()=>{S.rentalUnits--;S.money+=price(2400000);log("Продал арендный объект.","good");}},
  {id:"h_sell_home",cat:"🏠 Жильё",show:()=>HOUSING[S.housing].owned,title:()=>"Продать своё жильё",sub:()=>`+${price(2000000)}₽ · переезд в съём`,ok:()=>true,run:()=>{S.money+=price(2000000);hMove(4,-5);}},
  {id:"h_relocate",cat:"🏠 Жильё",show:()=>true,title:()=>"Переехать в другой город ✈️",sub:()=>`−${price(60000)}₽ · сменить город/цены`,ok:()=>needMoney(price(60000)),run:()=>{S.money-=price(60000);if(typeof openRelocate==="function")openRelocate();else{const ks=Object.keys(CITIES).filter(c=>c!==S.city);S.city=ks[0];log(`Переехал в ${S.city}.`,"unlock");}}},
  {id:"h_closer",cat:"🏠 Жильё",show:()=>!S.flags.closer&&HOUSING[S.housing].v>=48,title:()=>"Переехать ближе к работе",sub:()=>`−${price(30000)}₽ · дорога −15%`,ok:()=>needMoney(price(30000)),run:()=>{S.money-=price(30000);S.flags.closer=true;log("Переехал ближе к работе — дорога короче.","good");}},
];

/* ================= ДЕЙСТВИЯ: ЛИЧНОЕ (22) ================= */
const RUNAMES=["Алекс","Женя","Саша","Ким","Влад","Настя","Маша","Даша","Ира","Оля","Ник","Рома"];
const PERSONAL_ACTIONS=[
  {id:"dating_app",cat:"❤️‍🔥 Личное",show:()=>!S.partner,title:()=>"Знакомства (приложения/офлайн) 🚗",sub:()=>`${awayT(2)}ч · −6⚡ · 💬+1 · шанс на пару`,ok:()=>needEnergy(6),run:()=>{go(2);S.energy=clamp(S.energy-6);addSkill({charisma:1});S.dating=Math.min(100,(S.dating||0)+18+(S.trait==="charmer"?10:0)+S.skills.charisma/10);log(`Ищу вторую половинку… (симпатия ${Math.round(S.dating)}%)`);}},
  {id:"ask_out",cat:"❤️‍🔥 Личное",show:()=>!S.partner&&(S.dating||0)>=40,title:()=>"Позвать на серьёзные отношения ❤️",sub:()=>`шанс начать отношения`,ok:()=>true,run:()=>{if(Math.random()<0.4+(S.dating/200)+(S.skills.charisma/300)){S.partner={name:RUNAMES[Math.floor(Math.random()*RUNAMES.length)],engaged:false};S.dating=0;S.mood=clamp(S.mood+20);log(`❤️ Теперь вы вместе — ${S.partner.name}!`,"good");}else{S.dating=Math.max(0,S.dating-15);S.mood=clamp(S.mood-6);log("Не сложилось. Бывает.","bad");}}},
  {id:"date_partner",cat:"❤️‍🔥 Личное",show:()=>!!S.partner,title:()=>`Свидание с ${S.partner?S.partner.name:''} 🚗`,sub:()=>`${awayT(3)}ч · −${price(2000)}₽ · 🙂+18`,ok:()=>needMoney(price(2000)),run:()=>{go(3);S.money-=price(2000);S.mood=clamp(S.mood+18);S.attention=clamp((S.attention||60)+12);log("Романтический вечер вдвоём. 🙂","good");}},
  {id:"gift_partner",cat:"❤️‍🔥 Личное",show:()=>!!S.partner,title:()=>"Подарок второй половинке 🚗",sub:()=>`${awayT(1)}ч · −${price(8000)}₽ · 🙂+12`,ok:()=>needMoney(price(8000)),run:()=>{go(1);S.money-=price(8000);S.mood=clamp(S.mood+12);S.attention=clamp((S.attention||60)+10);log("Порадовал любимого человека. 🙂");}},
  {id:"romantic_trip",cat:"❤️‍🔥 Личное",show:()=>!!S.partner,title:()=>"Поездка вдвоём ✈️",sub:()=>`2 дня · −${price(50000)}₽ · 🙂+35 ❤️+6`,ok:()=>needMoney(price(50000)),run:()=>{S.money-=price(50000);newDay(true);newDay(true);S.mood=clamp(S.mood+35);S.health=clamp(S.health+6);log("Уехали вдвоём отдохнуть. 🙂","good");}},
  {id:"move_in",cat:"❤️‍🔥 Личное",show:()=>!!S.partner&&!S.married&&HOUSING[S.housing].v>=48&&!S.livingTogether,title:()=>"Съехаться вместе",sub:()=>`🙂+15 · делите быт`,ok:()=>true,run:()=>{S.livingTogether=true;S.mood=clamp(S.mood+15);log("Съехались. Совместная жизнь началась. 🙂","good");}},
  {id:"propose",cat:"❤️‍🔥 Личное",show:()=>!!S.partner&&!S.partner.engaged&&!S.married,title:()=>"Сделать предложение 💍",sub:()=>`кольцо −${price(80000)}₽ · шанс «да»`,ok:()=>needMoney(price(80000)),run:()=>{S.money-=price(80000);if(Math.random()<0.85){S.partner.engaged=true;S.mood=clamp(S.mood+25);log("💍 Предложение принято!","good");}else{S.mood=clamp(S.mood-20);log("Отказ… Тяжёлый момент.","bad");}}},
  {id:"wedding",cat:"❤️‍🔥 Личное",show:()=>!!S.partner&&S.partner.engaged&&!S.married,title:()=>"Свадьба 💒",sub:()=>`−${price(400000)}₽ · 🙂+40`,ok:()=>needMoney(price(400000)),run:()=>{S.money-=price(400000);S.married=true;S.mood=clamp(S.mood+40);S.friends=Math.min(100,S.friends+10);log("💒 Свадьба! Вы теперь семья.","good");}},
  {id:"anniversary",cat:"❤️‍🔥 Личное",show:()=>!!S.married,title:()=>"Годовщина 🚗",sub:()=>`${awayT(3)}ч · −${price(10000)}₽ · 🙂+20`,ok:()=>needMoney(price(10000)),run:()=>{go(3);S.money-=price(10000);S.mood=clamp(S.mood+20);S.attention=clamp((S.attention||60)+12);log("Отметили годовщину. 🙂");}},
  {id:"have_child",cat:"❤️‍🔥 Личное",show:()=>!!S.married&&S.kids<4&&S.age<48,title:()=>"Завести ребёнка 👶",sub:()=>`🙂+30 · расходы ${price(15000)}₽/мес`,ok:()=>true,run:()=>{S.kids++;S.mood=clamp(S.mood+30);log(`👶 В семье пополнение! Детей: ${S.kids}.`,"good");}},
  {id:"kid_time",cat:"❤️‍🔥 Личное",show:()=>S.kids>0,title:()=>"Время с детьми 🏠",sub:()=>`2ч · −6⚡ · 🙂+15`,ok:()=>needEnergy(6),run:()=>{spend(2);S.energy=clamp(S.energy-6);S.mood=clamp(S.mood+15);log("Провёл время с детьми. 🙂","good");}},
  {id:"kid_edu",cat:"❤️‍🔥 Личное",show:()=>S.kids>0,title:()=>"Вложиться в образование детей 🚗",sub:()=>`${awayT(1)}ч · −${price(20000)}₽ · 🙂+8`,ok:()=>needMoney(price(20000)),run:()=>{go(1);S.money-=price(20000);S.mood=clamp(S.mood+8);log("Оплатил кружки/репетиторов детям.");}},
  {id:"family_day",cat:"❤️‍🔥 Личное",show:()=>S.kids>0||S.married,title:()=>"Семейный выходной 🚗",sub:()=>`${awayT(4)}ч · −${price(5000)}₽ · 🙂+22 ❤️+4`,ok:()=>needMoney(price(5000)),run:()=>{go(4);S.money-=price(5000);S.mood=clamp(S.mood+22);S.health=clamp(S.health+4);log("Семейный выходной. 🙂","good");}},
  {id:"breakup",cat:"❤️‍🔥 Личное",show:()=>!!S.partner&&!S.married,title:()=>"Расстаться",sub:()=>`🙂−15 · освободиться`,ok:()=>true,run:()=>{S.partner=null;S.livingTogether=false;S.dating=0;S.mood=clamp(S.mood-15);log("Расстались. Непросто.","bad");}},
  {id:"divorce",cat:"❤️‍🔥 Личное",show:()=>!!S.married,title:()=>"Развод",sub:()=>`−половина капитала · 🙂−25`,ok:()=>true,run:()=>{S.money=Math.round(S.money/2);S.married=false;S.partner=null;S.livingTogether=false;S.mood=clamp(S.mood-25);log("Развод. Половину пришлось отдать.","bad");}},
  {id:"call_friends",cat:"❤️‍🔥 Личное",show:()=>true,title:()=>"Созвон с друзьями 🏠",sub:()=>`0.5ч · 🙂+6 +дружба`,ok:()=>true,run:()=>{spend(0.5);S.mood=clamp(S.mood+6);S.friends=Math.min(100,S.friends+3);log("Созвонился с друзьями. 🙂");}},
  {id:"host_dinner",cat:"❤️‍🔥 Личное",show:()=>HOUSING[S.housing].v>=48,title:()=>"Позвать друзей на ужин 🏠",sub:()=>`2ч · −${price(3000)}₽ · 🙂+14 +дружба`,ok:()=>needMoney(price(3000)),run:()=>{spend(2);S.money-=price(3000);S.mood=clamp(S.mood+14);S.friends=Math.min(100,S.friends+6);log("Ужин с друзьями. 🙂");}},
  {id:"friend_help",cat:"❤️‍🔥 Личное",show:()=>true,title:()=>"Помочь другу с делом 🚗",sub:()=>`${awayT(3)}ч · −8⚡ · +дружба +репутация`,ok:()=>needEnergy(8),run:()=>{go(3);S.energy=clamp(S.energy-8);S.friends=Math.min(100,S.friends+8);S.reputation=clamp(S.reputation+3);log("Выручил друга. 🤝","good");}},
  {id:"friends_trip",cat:"❤️‍🔥 Личное",show:()=>S.friends>=40,title:()=>"Поездка с друзьями ✈️",sub:()=>`2 дня · −${price(35000)}₽ · 🙂+35 +дружба`,ok:()=>needMoney(price(35000)),run:()=>{S.money-=price(35000);newDay(true);newDay(true);S.mood=clamp(S.mood+35);S.friends=Math.min(100,S.friends+10);log("Оторвались с друзьями. 🙂","good");}},
  {id:"visit_parents",cat:"❤️‍🔥 Личное",show:()=>true,title:()=>"Навестить родителей 🚗",sub:()=>`${awayT(2)}ч · 🙂+10 ❤️+2`,ok:()=>needEnergy(4),run:()=>{go(2);S.mood=clamp(S.mood+10);S.health=clamp(S.health+2);log("Побывал у родителей. 🙂","good");}},
  {id:"help_parents_money",cat:"❤️‍🔥 Личное",show:()=>true,title:()=>"Помочь родителям деньгами 🏠",sub:()=>`−${price(15000)}₽ · 🙂+10 +репутация`,ok:()=>needMoney(price(15000)),run:()=>{S.money-=price(15000);S.mood=clamp(S.mood+10);S.reputation=clamp(S.reputation+3);log("Помог родителям. 🙂","good");}},
  {id:"reconcile",cat:"❤️‍🔥 Личное",show:()=>!!S.partner,title:()=>"Помириться после ссоры 🏠",sub:()=>`1ч · 🙂+10`,ok:()=>needEnergy(2),run:()=>{spend(1);S.mood=clamp(S.mood+10);S.attention=clamp((S.attention||60)+15);log("Помирились. 🙂");}},
];

/* ================= ДЕЙСТВИЯ: ФИНАНСЫ (22) ================= */
const FIN_STEP=50000;
function fin(x){return price(x);}
const FIN_ACTIONS=[
  {id:"deposit_open",cat:"💰 Финансы",show:()=>true,title:()=>`Положить на вклад (${(S.deposit||0).toLocaleString('ru')}₽) 🏦`,sub:()=>`−${fin(FIN_STEP).toLocaleString('ru')}₽ на счёт · +1%/мес`,ok:()=>needMoney(fin(FIN_STEP)),run:()=>{S.money-=fin(FIN_STEP);S.deposit=(S.deposit||0)+fin(FIN_STEP);log("Пополнил вклад. 🏦","good");}},
  {id:"deposit_big",cat:"💰 Финансы",show:()=>S.money>=fin(FIN_STEP*4),title:()=>"Положить крупно на вклад 🏦",sub:()=>`−${fin(FIN_STEP*4).toLocaleString('ru')}₽`,ok:()=>needMoney(fin(FIN_STEP*4)),run:()=>{S.money-=fin(FIN_STEP*4);S.deposit=(S.deposit||0)+fin(FIN_STEP*4);log("Крупный вклад открыт. 🏦","good");}},
  {id:"deposit_withdraw",cat:"💰 Финансы",show:()=>(S.deposit||0)>0,title:()=>"Снять с вклада 🏦",sub:()=>`+ весь вклад ${(S.deposit||0).toLocaleString('ru')}₽`,ok:()=>true,run:()=>{S.money+=S.deposit;log(`Снял вклад: +${S.deposit.toLocaleString('ru')}₽`,"good");S.deposit=0;}},
  {id:"bonds",cat:"💰 Финансы",show:()=>!!S.flags.finEdu,title:()=>"Купить облигации (надёжно) 🏦",sub:()=>`−${fin(FIN_STEP).toLocaleString('ru')}₽ · +1.2%/мес`,ok:()=>needMoney(fin(FIN_STEP)),run:()=>{S.money-=fin(FIN_STEP);S.deposit=(S.deposit||0)+fin(FIN_STEP);log("Купил облигации.","good");}},
  {id:"stocks_buy",cat:"💰 Финансы",show:()=>!!S.flags.finEdu,title:()=>`Купить акции (${(S.stocks||0).toLocaleString('ru')}₽) 📈`,sub:()=>`−${fin(FIN_STEP).toLocaleString('ru')}₽ · доход/риск средний`,ok:()=>needMoney(fin(FIN_STEP)),run:()=>{S.money-=fin(FIN_STEP);S.stocks=(S.stocks||0)+fin(FIN_STEP);log("Купил акций. 📈","good");}},
  {id:"stocks_sell",cat:"💰 Финансы",show:()=>(S.stocks||0)>0,title:()=>"Продать акции 📈",sub:()=>`+ ${(S.stocks||0).toLocaleString('ru')}₽ по текущей цене`,ok:()=>true,run:()=>{S.money+=S.stocks;log(`Продал акции: +${S.stocks.toLocaleString('ru')}₽`,"good");S.stocks=0;}},
  {id:"crypto_buy",cat:"💰 Финансы",show:()=>!!S.flags.finEdu,title:()=>`Купить крипту (${(S.crypto||0).toLocaleString('ru')}₽) 🪙`,sub:()=>`−${fin(FIN_STEP).toLocaleString('ru')}₽ · высокий риск/доход`,ok:()=>needMoney(fin(FIN_STEP)),run:()=>{S.money-=fin(FIN_STEP);S.crypto=(S.crypto||0)+fin(FIN_STEP);log("Купил криптовалюту. 🪙 держись!","good");}},
  {id:"crypto_sell",cat:"💰 Финансы",show:()=>(S.crypto||0)>0,title:()=>"Продать крипту 🪙",sub:()=>`+ ${(S.crypto||0).toLocaleString('ru')}₽ по курсу`,ok:()=>true,run:()=>{S.money+=S.crypto;log(`Продал крипту: +${S.crypto.toLocaleString('ru')}₽`,"good");S.crypto=0;}},
  {id:"invest_property",cat:"💰 Финансы",show:()=>true,title:()=>"Инвест-квартира под аренду 🏢",sub:()=>`−${fin(2500000).toLocaleString('ru')}₽ · +${fin(12000).toLocaleString('ru')}₽/мес`,ok:()=>needMoney(fin(2500000)),run:()=>{S.money-=fin(2500000);S.rentalUnits=(S.rentalUnits||0)+1;log("Купил инвест-недвижимость. 🏢","good");}},
  {id:"loan_take",cat:"💰 Финансы",show:()=>S.money<fin(50000)&&!!S.job,title:()=>"Взять потреб-кредит 🏦",sub:()=>`+${fin(100000).toLocaleString('ru')}₽ сейчас · платёж ~6%/мес`,ok:()=>true,run:()=>{S.money+=fin(100000);S.loan=(S.loan||0)+fin(100000);log("Взял кредит. Платёж будет списываться ежемесячно.","bad");}},
  {id:"loan_repay",cat:"💰 Финансы",show:()=>(S.money<0)||((S.loan||0)>0),title:()=>"Погасить кредит/долг 🏦",sub:()=>`кредит: ${(S.loan||0).toLocaleString('ru')}₽`,ok:()=>true,run:()=>{if((S.loan||0)>0&&S.money>0){const pay=Math.min(S.loan,S.money);S.money-=pay;S.loan-=pay;log("Досрочно погасил часть кредита.","good");}if(S.money<0&&S.deposit>0){const need=Math.min(S.deposit,-S.money);S.deposit-=need;S.money+=need;log("Закрыл минус со вклада.","good");}}},
  {id:"selfemployed",cat:"💰 Финансы",show:()=>!S.flags.selfEmp&&!S.flags.ipReg,title:()=>"Оформить самозанятость",sub:()=>`налог с подработок ниже`,ok:()=>true,run:()=>{S.flags.selfEmp=true;log("Оформил самозанятость. Подработки выгоднее.","unlock");}},
  {id:"open_ip",cat:"💰 Финансы",show:()=>!S.flags.ipReg&&S.money>=fin(20000),title:()=>"Открыть ИП",sub:()=>`−${fin(20000).toLocaleString('ru')}₽ · выше потолок дохода`,ok:()=>needMoney(fin(20000)),run:()=>{S.money-=fin(20000);S.flags.ipReg=true;log("Открыл ИП.","unlock");}},
  {id:"advisor",cat:"💰 Финансы",show:()=>!!S.flags.finEdu,title:()=>"Финансовый советник 🚗",sub:()=>`${awayT(1)}ч · −${fin(5000).toLocaleString('ru')}₽ · 🧠+2 совет по портфелю`,ok:()=>needMoney(fin(5000)),run:()=>{go(1);S.money-=fin(5000);addSkill({intellect:2});log("Составил финансовый план с советником.");}},
  {id:"sub_stream",cat:"💰 Финансы",show:()=>!S.subs.stream,title:()=>"Подписка на стриминг",sub:()=>`${fin(800).toLocaleString('ru')}₽/мес · досуг дома дешевле`,ok:()=>true,run:()=>{S.subs.stream=true;log("Оформил подписку на стриминг.");}},
  {id:"sub_internet",cat:"💰 Финансы",show:()=>!S.subs.internet&&!HOUSING[S.housing].parentsFeed,title:()=>"Домашний интернет",sub:()=>`${fin(1200).toLocaleString('ru')}₽/мес`,ok:()=>true,run:()=>{S.subs.internet=true;log("Подключил интернет дома.");}},
  {id:"subs_cancel",cat:"💰 Финансы",show:()=>S.subs.stream||S.subs.internet||S.subs.gym||S.subs.dms,title:()=>"Отменить все подписки",sub:()=>`убрать регулярные списания`,ok:()=>true,run:()=>{S.subs={};log("Отменил все подписки.");}},
  {id:"charity",cat:"💰 Финансы",show:()=>true,title:()=>"Благотворительность 🏠",sub:()=>`−${fin(10000).toLocaleString('ru')}₽ · 🙂+12 +репутация`,ok:()=>needMoney(fin(10000)),run:()=>{S.money-=fin(10000);S.mood=clamp(S.mood+12);S.reputation=clamp(S.reputation+5);log("Пожертвовал на благотворительность. 🙂","good");}},
  {id:"buy_watch",cat:"💰 Финансы",show:()=>S.money>=fin(300000),title:()=>"Статусные часы ⌚",sub:()=>`−${fin(300000).toLocaleString('ru')}₽ · 🙂+15 статус`,ok:()=>needMoney(fin(300000)),run:()=>{S.money-=fin(300000);S.mood=clamp(S.mood+15);log("Купил статусные часы. ⌚","good");}},
  {id:"buy_art",cat:"💰 Финансы",show:()=>S.money>=fin(800000),title:()=>"Коллекционное искусство 🖼️",sub:()=>`−${fin(800000).toLocaleString('ru')}₽ · 🙂+18 · может дорожать`,ok:()=>needMoney(fin(800000)),run:()=>{S.money-=fin(800000);S.stocks=(S.stocks||0)+fin(600000);S.mood=clamp(S.mood+18);log("Купил предмет искусства. 🖼️","good");}},
  {id:"buy_yacht",cat:"💰 Финансы",show:()=>S.money>=fin(15000000),title:()=>"Яхта 🛥️",sub:()=>`−${fin(15000000).toLocaleString('ru')}₽ · 🙂+40 статус`,ok:()=>needMoney(fin(15000000)),run:()=>{S.money-=fin(15000000);S.mood=clamp(S.mood+40);log("Купил яхту. 🛥️","good");}},
  {id:"private_jet",cat:"💰 Финансы",show:()=>S.money>=fin(60000000),title:()=>"Частный самолёт ✈️",sub:()=>`−${fin(60000000).toLocaleString('ru')}₽ · 🙂+50 статус`,ok:()=>needMoney(fin(60000000)),run:()=>{S.money-=fin(60000000);S.mood=clamp(S.mood+50);log("Купил частный самолёт. ✈️","good");}},
  {id:"foundation",cat:"💰 Финансы",show:()=>S.money>=fin(5000000)&&!S.flags.foundation,title:()=>"Именной благотворительный фонд 🏛️",sub:()=>`−${fin(5000000).toLocaleString('ru')}₽ · репутация до 100 · тебя запомнят`,ok:()=>needMoney(fin(5000000)),run:()=>{S.money-=fin(5000000);S.flags.foundation=true;S.reputation=100;S.mood=clamp(S.mood+25);log("Основал именной фонд. 🏛️","ach");}},
  {id:"school_sub",cat:"💰 Финансы",show:()=>S.kids>0&&!S.subs.school,title:()=>"Частная школа детям 🎒",sub:()=>`${fin(40000).toLocaleString('ru')}₽/мес · будущее детей`,ok:()=>true,run:()=>{S.subs.school=true;log("Отдал детей в частную школу.","good");}},
  {id:"emergency_fund",cat:"💰 Финансы",show:()=>!S.flags.efund&&S.money>=fin(100000),title:()=>"Собрать подушку безопасности",sub:()=>`−${fin(100000).toLocaleString('ru')}₽ на вклад · спокойствие 🙂+8`,ok:()=>needMoney(fin(100000)),run:()=>{S.money-=fin(100000);S.deposit=(S.deposit||0)+fin(100000);S.flags.efund=true;S.mood=clamp(S.mood+8);log("Собрал финансовую подушку. 🙂","good");}},
];

/* ================= РАБОТА: статические действия ================= */
const WORK_STATIC=[
  {id:"side_gig",cat:"💼 Работа",show:()=>true,title:()=>"Разовая подработка / шабашка 🚗",sub:()=>`${awayT(4)}ч · −16⚡ · ${money(Math.round(price(1500)*(S.flags.selfEmp?1.1:1)))}`,ok:()=>needEnergy(16),run:()=>{go(4);S.energy=clamp(S.energy-16);const p=Math.round(price(1500)*(S.flags.selfEmp?1.1:1)*luck());S.money+=p;log(`Подработка: ${money(p)}`,"good");}},
  {id:"freelance",cat:"💼 Работа",show:()=>Math.max(S.skills.tech,S.skills.creativity,S.skills.intellect)>=25,title:()=>"Фриланс-заказ 🏠",sub:()=>`4ч · −14⚡ · оплата по навыку`,ok:()=>needEnergy(14),run:()=>{spend(4);S.energy=clamp(S.energy-14);const sk=Math.max(S.skills.tech,S.skills.creativity,S.skills.intellect);const p=Math.round(price(sk*120)*(S.flags.selfEmp?1.1:1)*luck());S.money+=p;log(`Сдал фриланс-заказ: ${money(p)}`,"good");}},
];

/* ================= травел с учётом удалёнки/близости ================= */
function travel(){let c=TRANSPORT[S.transport].commute;if(S.flags&&S.flags.remote)c*=0.25;if(S.flags&&S.flags.closer)c*=0.85;return c;};

/* ================= ГЕНЕРАТОР: КАРЬЕРА ================= */
function gradeName(g){return ["","(грейд II)","(грейд III)","(грейд IV)"][g]||"";}
function gradeNeed(){return 20*((S.grade||0)+1);}
function careerActions(){
  const acts=[];
  if(S.job){
    const j=jobById(S.job);
    acts.push({id:"shift",cat:"💼 Работа",show:()=>true,title:()=>`Выйти на смену: ${j.t} ${gradeName(S.grade)}`,sub:()=>`${shiftHours(j).toFixed(1)}ч (с дорогой) · −${j.energy}⚡ · ${money(jobPay(j))}${j.risky?" (плавает)":""}`,ok:()=>S.energy<j.energy?"мало энергии":true,run:()=>{const pay=jobPay(j);spend(shiftHours(j));S.energy=clamp(S.energy-j.energy);S.money+=pay;S.exp[j.id]=(S.exp[j.id]||0)+1;S.reviewPts=(S.reviewPts||0)+1;S.fatigue=Math.min(100,(S.fatigue||0)+j.energy*0.4);addSkill(j.gain);if(TRANSPORT[S.transport].health)S.health=clamp(S.health+TRANSPORT[S.transport].health);log(`Смена «${j.t}»: ${money(pay)}`,"good");}});
    acts.push({id:"overtime",cat:"💼 Работа",show:()=>true,title:()=>"Переработка (овертайм)",sub:()=>`${(shiftHours(j)+3).toFixed(1)}ч · −${j.energy+15}⚡ · +50% оплаты · ❤️−3`,ok:()=>S.energy<j.energy+15?"мало энергии":true,run:()=>{const pay=Math.round(jobPay(j)*1.5);spend(shiftHours(j)+3);S.energy=clamp(S.energy-(j.energy+15));S.money+=pay;S.exp[j.id]=(S.exp[j.id]||0)+1;S.reviewPts=(S.reviewPts||0)+1;S.health=clamp(S.health-3);S.fatigue=Math.min(100,(S.fatigue||0)+18);addSkill(j.gain);log(`Овертайм «${j.t}»: ${money(pay)}`,"good");}});
    acts.push({id:"night",cat:"💼 Работа",show:()=>true,title:()=>"Ночная смена",sub:()=>`${shiftHours(j).toFixed(1)}ч · −${j.energy}⚡ · +40% оплаты · ❤️−4 🙂−4`,ok:()=>S.energy<j.energy?"мало энергии":true,run:()=>{const pay=Math.round(jobPay(j)*1.4);spend(shiftHours(j));S.energy=clamp(S.energy-j.energy);S.money+=pay;S.exp[j.id]=(S.exp[j.id]||0)+1;S.reviewPts=(S.reviewPts||0)+1;S.health=clamp(S.health-4);S.fatigue=Math.min(100,(S.fatigue||0)+15);S.mood=clamp(S.mood-4);log(`Ночная смена: ${money(pay)}`,"good");}});
    acts.push({id:"review",cat:"💼 Работа",show:()=>true,title:()=>`Перфоманс-ревью (${S.reviewPts||0}/${gradeNeed()})`,sub:()=>`1ч · +результаты к грейду · 🧠+1`,ok:()=>needEnergy(3),run:()=>{spend(1);S.reviewPts=(S.reviewPts||0)+4;addSkill({[j.skill]:1});S.mood=clamp(S.mood+2);log("Собрал результаты к ревью.");}});
    if((S.grade||0)<3)acts.push({id:"grade_up",cat:"💼 Работа",show:()=>true,title:()=>"⬆️ Повышение по грейду",sub:()=>(S.reviewPts||0)>=gradeNeed()?`готово! +22% к оплате`:`нужно ${gradeNeed()} результатов (есть ${S.reviewPts||0})`,ok:()=>((S.reviewPts||0)>=gradeNeed()&&S.reputation>=35)?true:(S.reputation<35?"низкая репутация":"мало результатов"),run:()=>{S.reviewPts-=gradeNeed();S.grade=(S.grade||0)+1;S.reputation=clamp(S.reputation+5);S.mood=clamp(S.mood+10);log(`⬆️ Повышение! Теперь ${jobById(S.job).t} ${gradeName(S.grade)}.`,"ach");}});
    acts.push({id:"emp_course",cat:"💼 Работа",show:()=>true,title:()=>"Обучение от работодателя",sub:()=>`3ч · −10⚡ · +5 к профнавыку бесплатно`,ok:()=>needEnergy(10),run:()=>{spend(3);S.energy=clamp(S.energy-10);addSkill({[j.skill]:5});log("Компания оплатила обучение. Навык вырос.","good");}});
    if((S.grade||0)>=1)acts.push({id:"mentor_jr",cat:"💼 Работа",show:()=>true,title:()=>"Наставничество (менторить джунов)",sub:()=>`2ч · −8⚡ · 💬+2 +репутация`,ok:()=>needEnergy(8),run:()=>{spend(2);S.energy=clamp(S.energy-8);addSkill({charisma:2});S.reputation=clamp(S.reputation+4);log("Наставлял младших. +репутация.","good");}});
    acts.push({id:"btrip",cat:"💼 Работа",show:()=>true,title:()=>"Командировка",sub:()=>`2 дня · ${money(Math.round(jobPay(j)*3))} · 🙂−6`,ok:()=>true,run:()=>{const pay=Math.round(jobPay(j)*3);newDay(true);newDay(true);S.money+=pay;S.exp[j.id]=(S.exp[j.id]||0)+2;S.mood=clamp(S.mood-6);log(`Съездил в командировку: ${money(pay)}`,"good");}});
    acts.push({id:"corporate",cat:"💼 Работа",show:()=>true,title:()=>"Корпоратив",sub:()=>`3ч · 🙂+14 +связи ❤️−3`,ok:()=>needEnergy(4),run:()=>{spend(3);S.mood=clamp(S.mood+14);S.friends=Math.min(100,S.friends+4);S.health=clamp(S.health-3);log("Погулял на корпоративе. 🙂");}});
    acts.push({id:"sick_leave",cat:"💼 Работа",show:()=>S.health<60,title:()=>"Уйти на больничный",sub:()=>`1 день · ❤️+15 без потери места`,ok:()=>true,run:()=>{newDay(true);S.health=clamp(S.health+15);log("Отлежался на больничном. ❤️","good");}});
    acts.push({id:"vacation",cat:"💼 Работа",show:()=>true,title:()=>"Отпуск (оплачиваемый)",sub:()=>`7 дней · 🙂+35 ❤️+15 · зарплата идёт`,ok:()=>true,run:()=>{const pay=Math.round(jobPay(j)*5);for(let i=0;i<7;i++)newDay(true);S.money+=pay;S.mood=clamp(S.mood+35);S.health=clamp(S.health+15);log(`Сходил в отпуск. Отдохнул, ЗП сохранилась (${money(pay)}).`,"good");}});
    acts.push({id:"remote",cat:"💼 Работа",show:()=>j.track!=="craft",title:()=>S.flags.remote?"Вернуться в офис":"Перейти на удалёнку",sub:()=>S.flags.remote?"дорога вернётся":"дорога −75%",ok:()=>true,run:()=>{S.flags.remote=!S.flags.remote;log(S.flags.remote?"Перешёл на удалёнку. Дорога почти исчезла.":"Вернулся в офис.","good");}});
    acts.push({id:"switch_emp",cat:"💼 Работа",show:()=>S.reputation>=45,title:()=>"Сменить работодателя (та же роль)",sub:()=>`+репутация до 60 · свежий старт грейда чуть выше оплата`,ok:()=>true,run:()=>{S.reputation=Math.max(S.reputation,60);S.mood=clamp(S.mood+5);log("Перешёл к новому работодателю на лучших условиях.","good");}});
    if(j.track==="biz"){
      acts.push({id:"staff_hire",cat:"💼 Работа",show:()=>true,title:()=>"Нанять сотрудника",sub:()=>`−${price(60000)}₽ · +${priceRaw(30000).toLocaleString('ru')}₽/мес пассив`,ok:()=>needMoney(price(60000)),run:()=>{S.money-=price(60000);S.passive=(S.passive||0)+priceRaw(30000);log("Нанял сотрудника — бизнес приносит больше.","good");}});
      acts.push({id:"scale_biz",cat:"💼 Работа",show:()=>true,title:()=>"Масштабировать бизнес",sub:()=>`−${price(500000)}₽ · рост оборота (риск)`,ok:()=>needMoney(price(500000)),run:()=>{S.money-=price(500000);if(Math.random()<0.6){S.passive=(S.passive||0)+priceRaw(60000);S.mood=clamp(S.mood+10);log("Масштабирование удалось! Доход вырос.","good");}else{S.mood=clamp(S.mood-10);log("Расширение не окупилось. Урок на будущее.","bad");}}});
    }
    acts.push({id:"quit",cat:"💼 Работа",show:()=>true,title:()=>"Уволиться",sub:()=>"освободить время под другое",ok:()=>true,run:()=>{log(`Уволился с «${j.t}».`);S.job=null;S.grade=0;S.reviewPts=0;}});
  } else acts.push({id:"nojob",cat:"💼 Работа",show:()=>true,title:()=>"Ты без работы",sub:()=>"выбери вакансию в «Биржа труда» ↓",ok:()=>"—",run:()=>{}});
  JOBS.slice().sort((a,b)=>TRACK_ORDER.indexOf(a.track)-TRACK_ORDER.indexOf(b.track)||a.base-b.base).forEach(job=>{
    acts.push({id:"hire_"+job.id,cat:"🔎 Биржа труда",show:()=>S.job!==job.id,title:()=>`${TRACKS[job.track].split(' ')[0]} ${job.t} — ${job.base.toLocaleString('ru')}₽/см`,sub:()=>jobConditions(job).map(c=>`<span class="${c.ok?'ok':'no'}">${c.ok?'✓':'✗'} ${c.l}</span>`).join(" · "),ok:()=>qualified(job)?true:"не проходишь по условиям",run:()=>{S.job=job.id;S.grade=0;S.reviewPts=0;log(`📄 Устроился: ${job.t} (${TRACKS[job.track]}).`,"good");}});
  });
  return acts;
}

/* ================= ГЕНЕРАТОР: ТРАНСПОРТ ================= */
function transportActions(){
  const acts=[];
  // права
  acts.push({id:"license_B",cat:"🚗 Транспорт",show:()=>!hasLicense("B"),title:()=>"Автошкола — права кат. B",sub:()=>`−${price(35000)}₽ · открывает авто/каршеринг`,ok:()=>needMoney(price(35000)),run:()=>{S.money-=price(35000);S.license.B=true;log("Получил права категории B! 🚗","good");}});
  acts.push({id:"license_A",cat:"🚗 Транспорт",show:()=>!hasLicense("A"),title:()=>"Автошкола — права кат. A (мото)",sub:()=>`−${price(20000)}₽ · открывает мотоцикл`,ok:()=>needMoney(price(20000)),run:()=>{S.money-=price(20000);S.license.A=true;log("Получил права категории A! 🏍️","good");}});
  TRANSPORT.forEach((tr,i)=>{
    if(i===S.transport)return;
    const savePct=Math.round((1-tr.commute/TRANSPORT[S.transport].commute)*100);
    acts.push({id:"tr_"+i,cat:"🚗 Транспорт",show:()=>true,
      title:()=>`${tr.t}${tr.buy?` — ${price(tr.buy).toLocaleString('ru')}₽`:" — подключить"}`,
      sub:()=>`<span class="tm">дорога ${savePct>0?"−"+savePct+"%":savePct+"%"} времени</span> · ${tr.daily?`${price(tr.daily)}₽/день`:"без расходов"}${tr.license?` · <span class="${hasLicense(tr.license)?'ok':'no'}">${hasLicense(tr.license)?'✓':'✗'} права ${tr.license}</span>`:""} · ${tr.note}`,
      ok:()=>{if(tr.license&&!hasLicense(tr.license))return "нужны права "+tr.license;if(tr.buy&&S.money<price(tr.buy))return "не хватает денег";return true;},
      run:()=>{if(tr.buy)S.money-=price(tr.buy);S.transport=i;S.mood=clamp(S.mood+(i>=8?12:4));log(`🚗 Пересел на: ${tr.t}.`,"good");}});
  });
  // обслуживание (для владельцев ТС)
  const ownsCar=S.transport>=6&&TRANSPORT[S.transport].buy>0;
  acts.push({id:"osago",cat:"🚗 Транспорт",show:()=>ownsCar&&!S.flags.osago,title:()=>"Оформить ОСАГО",sub:()=>`−${price(8000)}₽ · обязательная страховка`,ok:()=>needMoney(price(8000)),run:()=>{S.money-=price(8000);S.flags.osago=true;log("Оформил ОСАГО.","good");}});
  acts.push({id:"kasko",cat:"🚗 Транспорт",show:()=>S.transport>=8&&!S.flags.kasko,title:()=>"Оформить КАСКО",sub:()=>`−${price(40000)}₽ · защита от ремонтов`,ok:()=>needMoney(price(40000)),run:()=>{S.money-=price(40000);S.flags.kasko=true;log("Оформил КАСКО. Ремонты застрахованы.","good");}});
  acts.push({id:"to_service",cat:"🚗 Транспорт",show:()=>ownsCar,title:()=>"Пройти ТО / сервис 🚗",sub:()=>`${awayT(2)}ч · −${price(12000)}₽ · надёжность 🙂+4`,ok:()=>needMoney(price(12000)),run:()=>{go(2);S.money-=price(12000);S.mood=clamp(S.mood+4);log("Прошёл ТО. Машина как новая.");}});
  acts.push({id:"winter_tires",cat:"🚗 Транспорт",show:()=>ownsCar&&season()!=="summer"&&!S.flags.wtires,title:()=>"Зимняя резина 🚗",sub:()=>`−${price(25000)}₽ · безопасность ❤️`,ok:()=>needMoney(price(25000)),run:()=>{S.money-=price(25000);S.flags.wtires=true;S.health=clamp(S.health+2);log("Переобулся в зимнюю резину.");}});
  acts.push({id:"tuning",cat:"🚗 Транспорт",show:()=>S.transport>=8,title:()=>"Тюнинг авто 🚗",sub:()=>`−${price(150000)}₽ · 🙂+15 статус`,ok:()=>needMoney(price(150000)),run:()=>{S.money-=price(150000);S.mood=clamp(S.mood+15);log("Затюнинговал машину. 🙂","good");}});
  return acts;
}

const STATIC_ALL=[].concat(DEV_ACTIONS,EDU_ACTIONS,HOME_ACTIONS,HEALTH_ACTIONS,FUN_ACTIONS,HOUSE_ACTIONS,PERSONAL_ACTIONS,FIN_ACTIONS,WORK_STATIC);
function allActions(){return STATIC_ALL.concat(careerActions(),transportActions());}

/* ================= ОНБОРДИНГ / ЦЕЛИ ================= */
const QUESTS=[
  {short:"Поесть дома",text:"Освойся: поешь дома — бабушка кормит бесплатно («Быт»).",done:s=>s.flags.ate},
  {short:"Найти работу",text:"Открой «Биржа труда» и устройся на первую работу (курьер доступен сразу).",done:s=>!!s.job},
  {short:"Первая смена",text:"Выйди на смену и заработай первые деньги («Работа»).",done:s=>Object.values(s.exp).reduce((a,b)=>a+b,0)>=1},
  {short:"Прокачать навык",text:"Прокачай любой навык до 15 («Развитие») — откроются новые вакансии.",done:s=>Math.max.apply(null,Object.values(s.skills))>=15},
  {short:"Сменить профессию",text:"Устройся на новую вакансию, которую открыл навыком (не курьер).",done:s=>!!s.job&&s.job!=="courier"},
  {short:"Ускорить дорогу",text:"Улучши транспорт («Транспорт») — время в дороге сократится.",done:s=>s.transport>=1},
  {short:"Первый капитал",text:"Накопи 25 000₽ — первый шаг к своему жилью.",done:s=>s.money>=25000,final:true},
];
function checkQuests(){
  if(S.sandbox)return;const q=QUESTS[S.quest];
  if(q&&q.done(S)){log("✅ "+q.short+" — выполнено!","good");S.quest++;const nx=QUESTS[S.quest];
    if(!nx||q.final){S.sandbox=true;log("🏁 Обучение пройдено! Дальше — песочница: карьера, финансы, отношения, семья, своё дело. Твоя жизнь — твои правила.","good");}
    else log("🎯 "+nx.text,"unlock");}
}
function nextGoal(){
  if(!S.job)return "Найди работу на «Бирже труда».";
  if(S.transport<3)return "Улучши транспорт — экономь время в дороге.";
  if(S.housing<3)return `Накопи на съём (${price(26000).toLocaleString('ru')}₽ залог).`;
  if(!hasLicense("B"))return "Получи права категории B в автошколе.";
  if(!S.flags.finEdu)return "Пройди финансовую грамотность — откроются инвестиции.";
  if((S.deposit+S.stocks+S.crypto)<=0&&(S.rentalUnits||0)===0)return "Начни инвестировать — пусть деньги работают.";
  if(!S.partner&&!S.married)return "Найди свою половинку в разделе «Личное».";
  if(!S.married)return "Сделай предложение и сыграй свадьбу.";
  if(S.kids===0&&S.age<45)return "Задумайся о детях — семья даёт смысл.";
  if(S.housing<9)return "Купи своё жильё: ипотека или покупка.";
  if((S.grade||0)<2&&S.job)return "Расти по грейду — перфоманс-ревью и повышение.";
  if(qol()<80)return "Дотяни качество жизни до 80 — стань Легендой.";
  return "Ты на вершине. Живи в удовольствие 👑";
}

/* ================= ДОСТИЖЕНИЯ + РАНГ ================= */
function achMet(id){const s=S,mx=Math.max.apply(null,Object.values(s.skills));switch(id){
  case"firstpay":return Object.values(s.exp).reduce((a,b)=>a+b,0)>=1;
  case"switch":return !!s.job&&s.job!=="courier";
  case"grad":return s.edu>=2;case"rent":return s.housing>=3;
  case"skill50":return mx>=50;case"skill100":return mx>=100;
  case"wheels":return s.transport>=8;case"k100":return netWorth()>=100000;
  case"own":return s.housing>=9;case"mil":return netWorth()>=1000000;
  case"qol80":return qol()>=80;
  case"love":return !!s.partner;case"married":return !!s.married;case"parent":return s.kids>0;
  case"investor":return (s.deposit+s.stocks+s.crypto)>0||(s.rentalUnits||0)>0;
  case"phd":return s.edu>=4;case"grade":return (s.grade||0)>=1;
  case"boss":return s.job&&jobById(s.job).base>=13000;}return false;}
function checkAch(){ACH.forEach(a=>{if(!S.ach[a.id]&&achMet(a.id)){S.ach[a.id]=1;S.mood=clamp(S.mood+5);log("🏆 Достижение: "+a.n,"ach");if(typeof toast==="function")toast("🏆 "+a.n);}});
  const r=rank();if(r!==S.rankTitle){if(S.rankTitle)log("⬆️ Новый жизненный ранг: "+r,"ach");S.rankTitle=r;}}
function scanUnlocks(){allActions().filter(a=>a.show()&&a.ok()===true).forEach(a=>{if(a.id.indexOf("hire_")===0){const jid=a.id.slice(5);const jj=jobById(jid);if(jj&&!S.known["job_"+jid]){S.known["job_"+jid]=1;log(`🔓 Новая вакансия по силам: ${jj.t} (${TRACKS[jj.track]})`,"unlock");}}});}

/* ================= ЦИКЛ ================= */
function afterAct(){checkQuests();checkAch();scanUnlocks();if(typeof render==="function")render();if(typeof save==="function")save();}
function doAction(a){if(S&&S.dead)return;const ok=a.ok();if(ok!==true){if(typeof toast==="function")toast(typeof ok==="string"?ok:"недоступно");return;}a.run();afterAct();}
function fastForward(n){if(S&&S.dead)return;if(typeof window!=="undefined")window._ffActive=true;let earned=0,shifts=0;const t0=Object.assign({},S.skills);for(let i=0;i<n&&!S.dead;i++){const p=autoDay();earned+=p;if(p>0)shifts++;}if(typeof window!=="undefined")window._ffActive=false;S.hoursLeft=CFG.DAY_HOURS;S.flags.ff=true;const grew=Object.keys(S.skills).filter(k=>S.skills[k]-t0[k]>=1).map(k=>SKILL_KEYS[k].split(' ')[0]);log(`⏩ Перемотка ${n} дн${shifts?`: ${shifts} смен, ${money(earned)}`:""}${grew.length?` · навыки: ${grew.join(" ")}`:""}.`,earned>0?"good":"");afterAct();}

/* ================= UI ================= */
const $=id=>document.getElementById(id);
const TILES=[
  {name:"Работа",icon:"💼",cats:["💼 Работа","🔎 Биржа труда"],color:"#f6a609"},
  {name:"Развитие",icon:"📈",cats:["📈 Развитие"],color:"#12b76a"},
  {name:"Учёба",icon:"🎓",cats:["🎓 Образование"],color:"#7a5af8"},
  {name:"Быт",icon:"🍔",cats:["🍔 Быт"],color:"#fb923c"},
  {name:"Здоровье",icon:"❤️",cats:["❤️ Здоровье"],color:"#f0426b"},
  {name:"Досуг",icon:"🎮",cats:["🎮 Досуг"],color:"#ee46bc"},
  {name:"Личное",icon:"❤️‍🔥",cats:["❤️‍🔥 Личное"],color:"#e0398b"},
  {name:"Жильё",icon:"🏠",cats:["🏠 Жильё"],color:"#0ba5ec"},
  {name:"Транспорт",icon:"🚗",cats:["🚗 Транспорт"],color:"#6172f3"},
  {name:"Финансы",icon:"💰",cats:["💰 Финансы"],color:"#0e9f6e"},
];
const ASSETS={dir:"assets/",avatar:{ok:"avatar_ok.png",tired:"avatar_tired.png",happy:"avatar_happy.png",sad:"avatar_sad.png"}};
function avState(){if(S.health<28||S.energy<18)return "tired";if(S.mood>=75)return "happy";if(S.mood<30)return "sad";return "ok";}
function avImgTag(){return `<img src="${ASSETS.dir}${ASSETS.avatar[avState()]}" alt="" onerror="this.remove()">`;}
function avatarFace(){if(S.health<28||S.energy<18)return "😫";if(S.mood>=75)return "😄";if(S.mood<30)return "😞";return "🙂";}
function level(){return Math.max(1,Math.floor(qol()/4));}
function monthlyIncome(){let inc=0;if(S.job)inc+=Math.round(jobPay(jobById(S.job))*20);inc-=price(HOUSING[S.housing].rent);if(TRANSPORT[S.transport].daily)inc-=price(TRANSPORT[S.transport].daily)*30;if(S.rentalUnits)inc+=S.rentalUnits*price(20000);if(S.married)inc+=price(35000);if(S.kids)inc-=S.kids*price(15000);if(S.passive)inc+=S.passive;if(S.loan)inc-=Math.round(S.loan*0.06);inc-=subsCost();return inc;}
function kfmt(n){const s=n<0?"−":"+",a=Math.abs(n);return s+(a>=1000?(a/1000).toFixed(a>=10000?0:1).replace('.0','')+"к":a);}
function pill2(ic,v,c){return `<div class="pill2"><span>${ic}</span><b style="color:${c}">${Math.round(v)}</b></div>`;}
function runId(id){const a=allActions().find(x=>x.id===id);if(a)doAction(a);}
function stageName2(age){return age<22?"Юность":age<35?"Молодость":age<50?"Зрелость":age<65?"Взрослый":"Пожилой";}
function render(){
  if(S.dead){showSummary();return;}
  $('hLevel').textContent=level();
  $('hMoney').textContent=S.money.toLocaleString('ru');
  $('hInc').textContent=kfmt(monthlyIncome())+"/мес";
  $('hPills').innerHTML=pill2("⚡",S.energy,"var(--energy)")+pill2("🍔",S.sat,"var(--sat)")+pill2("❤️",S.health,"var(--health)")+pill2("🙂",S.mood,"var(--mood)");
  $('hAva').innerHTML=avImgTag()+avatarFace();
  $('avatarMood').innerHTML=avImgTag()+avatarFace();
  const ha=$('hAge');if(ha)ha.textContent=S.age+" · "+stageName2(S.age);
  $('stageGoal').textContent=(S.sandbox?"🎯 "+nextGoal():"🎯 "+QUESTS[S.quest].text)+`  ·  ${seasonName()} ${dateParts().y}, день ${S.day+1}, ${S.hoursLeft.toFixed(1)}ч`;
  const c=cta();$('ctaBtn').textContent=c.t;$('ctaBtn').onclick=c.act;
  $('tiles').innerHTML=TILES.map((t,i)=>`<button class="tile" style="--tc:${t.color}" onclick="openTile(${i})"><span class="ti">${t.icon}</span><span class="tn">${t.name}</span></button>`).join("");
  if(openTileIdx!=null)renderModal();
  if(PENDING_EVENT)showEvent();
}
function cta(){
  if(S.energy<22)return {t:"😴 Поспать",act:()=>runId('sleep')};
  if(S.sat<25)return {t:"🍔 Поесть",act:()=>openTileByName('Быт')};
  if(!S.job)return {t:"💼 Найти работу",act:()=>openTileByName('Работа')};
  const j=jobById(S.job);
  if(S.energy<j.energy)return {t:"😴 Отдохнуть перед сменой",act:()=>runId('sleep')};
  return {t:"💼 Выйти на смену",act:()=>runId('shift')};
}
let openTileIdx=null, MODAL_ACTS=[];
function openTile(i){openTileIdx=i;$('modal').classList.remove('hidden');renderModal();}
function openTileByName(n){const i=TILES.findIndex(t=>t.name===n);if(i>=0)openTile(i);}
function closeModal(){openTileIdx=null;$('modal').classList.add('hidden');}
function card(a){MODAL_ACTS.push(a);const i=MODAL_ACTS.length-1,ok=a.ok(),dis=ok!==true;return `<button class="acard${dis?' dis':''}" data-i="${i}" ${dis?'disabled':''}><div class="acT">${a.title()}</div><div class="acC">${a.sub()}</div></button>`;}
function renderModal(){
  const t=TILES[openTileIdx];if(!t){closeModal();return;}
  $('sheetTitle').textContent=t.name;
  const acts=allActions().filter(a=>t.cats.indexOf(a.cat)>=0&&a.show());
  const jobs=acts.filter(a=>a.id.indexOf('hire_')===0), others=acts.filter(a=>a.id.indexOf('hire_')!==0);
  MODAL_ACTS=[];
  let html=others.map(card).join("");
  if(jobs.length){
    html+='<div class="modHint">Вакансии по направлениям</div>';
    TRACK_ORDER.forEach(tr=>{
      const list=jobs.filter(a=>{const jj=jobById(a.id.slice(5));return jj&&jj.track===tr;});if(!list.length)return;
      const okc=list.filter(a=>a.ok()===true).length;
      html+='<div class="trk'+(okc>0?' op':'')+'"><div class="trkH" onclick="this.parentElement.classList.toggle(\'op\')"><span>'+TRACKS[tr]+' <span class="muted">('+okc+'/'+list.length+' доступно)</span></span><span class="chev">▾</span></div><div class="trkB">'+list.map(card).join("")+'</div></div>';
    });
  }
  $('sheetBody').innerHTML=html||'<div class="muted center" style="padding:24px;font-weight:700">Здесь пока пусто</div>';
  $('sheetBody').querySelectorAll('button.acard').forEach(b=>{b.onclick=()=>doAction(MODAL_ACTS[+b.dataset.i]);});
}
/* событие-развилка */
function showEvent(){
  if(!PENDING_EVENT)return;const e=PENDING_EVENT;
  let o=$('eventOv');if(!o){o=document.createElement('div');o.id='eventOv';o.className='deathOv';document.body.appendChild(o);}
  o.innerHTML='<div class="deathCard"><div class="deathTop" style="font-size:18px">🔀 Событие</div><div class="epi" style="font-style:normal;margin:12px 0">'+e.t+'</div>'+
    e.opts.map((op,i)=>'<button class="btnBig" style="margin-bottom:8px" data-i="'+i+'">'+op.l+'</button>').join("")+'</div>';
  o.style.display='flex';
  o.querySelectorAll('button').forEach(b=>b.onclick=()=>{e.opts[+b.dataset.i].run();PENDING_EVENT=null;o.style.display='none';afterAct();});
}
function openRelocate(){
  const ks=Object.keys(CITIES).filter(c=>c!==S.city);
  let o=$('eventOv');if(!o){o=document.createElement('div');o.id='eventOv';o.className='deathOv';document.body.appendChild(o);}
  o.innerHTML='<div class="deathCard"><div class="deathTop" style="font-size:18px">✈️ Куда переезжаем?</div>'+
    ks.map(c=>'<button class="btnBig" style="margin-bottom:8px" data-c="'+c+'">'+c+' · '+CITIES[c].note+'</button>').join("")+
    '<button class="pill" style="width:100%;margin-top:6px" onclick="document.getElementById(\'eventOv\').style.display=\'none\'">Отмена</button></div>';
  o.style.display='flex';
  o.querySelectorAll('button[data-c]').forEach(b=>b.onclick=()=>{S.city=b.dataset.c;o.style.display='none';log(`✈️ Переехал в ${S.city}.`,"unlock");afterAct();});
}
function openLog(){openTileIdx=null;$('sheetTitle').textContent="Лог событий";$('sheetBody').innerHTML='<div class="log">'+S.log.map(l=>'<p class="'+l.cls+'"><span class="d">'+l.t+'.</span> '+l.text+'</p>').join("")+'</div>';$('modal').classList.remove('hidden');}
function openHero(){openTileIdx=null;$('sheetTitle').textContent="Профиль";$('sheetBody').innerHTML=heroHTML();$('modal').classList.remove('hidden');}
function traitName(){const t=TRAITS.find(x=>x.id===S.trait);return t?t.n:"⚪ Обычный";}
function heroHTML(){
  const fam=S.married?`в браке с ${S.partner?S.partner.name:''}`:(S.partner?`отношения с ${S.partner.name}`:"не в отношениях");
  return '<div class="card" style="box-shadow:none">'
    +'<div class="stat-ctrl" style="border:none"><span>🏆 Ранг</span><b>'+rank()+' · Ур.'+level()+'</b></div>'
    +'<div class="stat-ctrl"><span>🎂 Возраст</span><span>'+S.age+' · '+stageName2(S.age)+'</span></div>'
    +'<div class="stat-ctrl"><span>🧬 Черта</span><span>'+traitName()+'</span></div>'
    +'<div class="stat-ctrl"><span>💰 Кэш</span><b>'+S.money.toLocaleString('ru')+'₽</b></div>'
    +'<div class="stat-ctrl"><span>💎 Капитал (всё)</span><b>'+netWorth().toLocaleString('ru')+'₽</b></div>'
    +'<div class="stat-ctrl"><span>🏦 Вклад / 📈 Акции / 🪙 Крипта</span><span>'+(S.deposit||0).toLocaleString('ru')+' / '+(S.stocks||0).toLocaleString('ru')+' / '+(S.crypto||0).toLocaleString('ru')+'</span></div>'
    +'<div class="stat-ctrl"><span>🏢 Аренд. объекты</span><span>'+(S.rentalUnits||0)+'</span></div>'
    +'<div class="stat-ctrl"><span>📈 Доход</span><b>'+kfmt(monthlyIncome())+'/мес</b></div>'
    +'<div class="stat-ctrl"><span>💼 Работа</span><span>'+(S.job?jobById(S.job).t+' '+gradeName(S.grade):'без работы')+'</span></div>'
    +'<div class="stat-ctrl"><span>⭐ Репутация</span><span>'+Math.round(S.reputation)+'</span></div>'
    +'<div class="stat-ctrl"><span>🎓 Образование</span><span>'+EDU[S.edu].t+(S.enrolled?' · учится':'')+'</span></div>'
    +'<div class="stat-ctrl"><span>🏠 Жильё</span><span>'+HOUSING[S.housing].t+'</span></div>'
    +'<div class="stat-ctrl"><span>🚗 Транспорт</span><span>'+TRANSPORT[S.transport].t+'</span></div>'
    +'<div class="stat-ctrl"><span>❤️‍🔥 Личное</span><span>'+fam+(S.kids?' · дети: '+S.kids:'')+'</span></div>'
    +'<div class="stat-ctrl"><span>🤝 Друзья</span><span>'+Math.round(S.friends)+'</span></div></div>'
    +'<div class="card" style="box-shadow:none"><b>Навыки</b><div style="margin-top:8px">'+Object.keys(SKILL_KEYS).map(k=>'<span class="skchip">'+SKILL_KEYS[k]+': '+Math.round(S.skills[k])+'</span>').join("")+'</div></div>'
    +'<div class="card" style="box-shadow:none"><b>Достижения '+Object.keys(S.ach).length+'/'+ACH.length+'</b><div style="margin-top:8px">'+ACH.map(a=>'<span class="skchip" style="opacity:'+(S.ach[a.id]?1:.45)+'">'+(S.ach[a.id]?'🏆':'🔒')+' '+a.n+'</span>').join("")+'</div></div>'
    +'<button class="btnBig" style="background:linear-gradient(180deg,#5aa0ff,#3b7fe0);box-shadow:0 4px 0 #2f6fce;margin-bottom:10px" onclick="openLog()">📜 Лог событий</button>'
    +'<button class="btnBig" style="background:linear-gradient(180deg,#ff6b6b,#e04848);box-shadow:0 4px 0 #c23c3c" onclick="resetGame()">↺ Начать жизнь заново</button>';
}

/* ================= ИТОГИ / ПЕРЕРОЖДЕНИЕ ================= */
function row(k,v){return '<div class="deathRow"><span>'+k+'</span><b>'+v+'</b></div>';}
function showSummary(){
  if(typeof document==="undefined")return;
  const sc=lifeScore(),g=grade(sc);
  const job=S.job?jobById(S.job).t:"без карьеры";
  const epi=({S:"Легендарная жизнь. О тебе будут помнить.",A:"Отличная жизнь — многого добился.",B:"Достойная, крепкая жизнь.",C:"Обычная жизнь со своими радостями.",D:"Жизнь вышла тяжёлой.",E:"Не сложилось. В следующий раз повезёт."})[g];
  let o=$('deathOv');if(!o){o=document.createElement('div');o.id='deathOv';o.className='deathOv';document.body.appendChild(o);}
  const legacy=Math.round((S.peakMoney||0)*0.1);
  o.innerHTML='<div class="deathCard">'
    +'<div class="deathTop">🪦 Жизнь окончена</div>'
    +'<div class="deathAge">'+S.deathAge+' лет · '+S.cause+'</div>'
    +'<div class="grade grade-'+g+'">'+g+'</div>'
    +'<div class="scoreLine">Оценка жизни: <b>'+sc+'/100</b></div>'
    +'<div class="deathRows">'
      +row("Кем стал",job)+row("Образование",EDU[S.edu].t)+row("Жильё",HOUSING[S.housing].t)
      +row("Семья",(S.married?"в браке":"—")+(S.kids?", детей: "+S.kids:""))
      +row("Пик капитала",(S.peakMoney||0).toLocaleString('ru')+"₽")
      +row("Достижения",Object.keys(S.ach||{}).length+"/"+ACH.length)
      +row("🌱 Наследство детям",legacy.toLocaleString('ru')+"₽")
    +'</div>'
    +'<div class="epi">«'+epi+'»</div>'
    +'<button class="cta" style="margin-top:14px" onclick="rebirth('+legacy+')">🌱 Прожить новую жизнь (New Game+)</button>'
    +'</div>';
  o.style.display='flex';
}
function rebirth(legacy){try{localStorage.setItem('sim_legacy',String(legacy||0));localStorage.setItem('sim_gen',String((S&&S.generation||1)+1));}catch(e){}try{localStorage.removeItem('sim_save_v2');}catch(e){}if(tg&&tg.CloudStorage)tg.CloudStorage.removeItem('sim_save_v2',()=>{});location.reload();}

/* ================= ЛОГ UI / TOAST / СЕЙВ ================= */
function toast(m){if(typeof document==="undefined")return;const t=$('toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(t._x);t._x=setTimeout(()=>t.classList.remove('show'),1600);}
function save(){const d=JSON.stringify(S);try{localStorage.setItem('sim_save_v2',d);}catch(e){}if(tg&&tg.CloudStorage)tg.CloudStorage.setItem('sim_save_v2',d,()=>{});}
function lsGet(k){try{return typeof localStorage!=="undefined"?localStorage.getItem(k):null}catch(e){return null}}
function load(cb){if(tg&&tg.CloudStorage){tg.CloudStorage.getItem('sim_save_v2',(e,v)=>cb((!e&&v)?v:lsGet('sim_save_v2')));}else cb(lsGet('sim_save_v2'));}
function resetGame(){if(!confirm("Начать заново? Прогресс сотрётся."))return;try{localStorage.removeItem('sim_save_v2');}catch(e){}if(tg&&tg.CloudStorage)tg.CloudStorage.removeItem('sim_save_v2',()=>{});location.reload();}

/* ================= СУДЬБА (старт) ================= */
const FAMILIES=[{id:"poor",n:"👪 Бедная семья",d:"мало денег на старте",w:30},{id:"mid",n:"👪 Средний класс",d:"обычный старт",w:45},{id:"rich",n:"👪 Обеспеченная семья",d:"деньги и транспорт на старте",w:25}];
const HEALTHS=[{id:"robust",n:"❤️ Крепкое здоровье",d:"реже болеешь, дольше живёшь",w:30},{id:"normal",n:"❤️ Обычное здоровье",d:"как у всех",w:50},{id:"frail",n:"❤️ Слабое здоровье",d:"чаще болеешь",w:20}];
function wpick(a){let t=a.reduce((s,x)=>s+x.w,0),r=Math.random()*t;for(const x of a){if((r-=x.w)<0)return x;}return a[0];}
function applyFate(fate,legacy){
  S.fate=fate;
  if(fate.family==="poor")S.money=Math.round(S.money*0.4);
  if(fate.family==="rich"){S.money+=1500;if(S.transport<3)S.transport=3;}
  if(fate.health==="robust"){S.health=100;S.robust=true;}
  if(fate.health==="frail"){S.health=80;S.frail=true;}
  S.skills[fate.talent]=Math.min(100,(S.skills[fate.talent]||0)+12);
  // черта
  if(S.trait==="charmer")S.skills.charisma=Math.min(100,S.skills.charisma+8);
  if(S.trait==="sickly"){S.health=clamp(S.health-10);S.skills.intellect=Math.min(100,S.skills.intellect+8);S.frail=true;}
  if(S.trait==="athlete")S.skills.strength=Math.min(100,S.skills.strength+8);
  if(legacy>0){S.money+=legacy;log(`🌱 Наследство прошлой жизни: +${legacy.toLocaleString('ru')}₽`,"good");}
  S.peakMoney=S.money;
}

/* ================= СОЗДАНИЕ ПЕРСОНАЖА ================= */
if(typeof document!=="undefined" && document.getElementById('sexPick')){
  const cfg={sex:"М",name:"Артём",hair:HAIR[0],city:"Казань",skills:{},trait:"none"};let ptsLeft=5;
  let fate={family:"mid",health:"normal",talent:"intellect"},rerolls=3;
  function roll(){fate={family:wpick(FAMILIES).id,health:wpick(HEALTHS).id,talent:Object.keys(SKILL_KEYS)[Math.floor(Math.random()*6)]};mountFate();}
  function mountFate(){const c=document.getElementById('fateCard');if(!c)return;const F=FAMILIES.find(x=>x.id===fate.family),H=HEALTHS.find(x=>x.id===fate.health);
    c.innerHTML='<div class="card"><h2>🎲 Твоя судьба</h2><div class="stat-ctrl" style="border:none"><span>'+F.n+'</span></div><div class="muted" style="font-size:11px">'+F.d+'</div><div class="stat-ctrl"><span>'+H.n+'</span></div><div class="muted" style="font-size:11px">'+H.d+'</div><div class="stat-ctrl"><span>⭐ Талант: '+SKILL_KEYS[fate.talent]+'</span><b style="color:var(--good2)">+12</b></div><button class="pill" style="margin-top:10px;width:100%" onclick="window._reroll()">🎲 Перебросить судьбу ('+rerolls+')</button></div>';}
  window._reroll=function(){if(rerolls<=0)return;rerolls--;roll();};
  document.querySelectorAll('#sexPick button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#sexPick button').forEach(x=>x.classList.remove('on'));b.classList.add('on');cfg.sex=b.dataset.v;});
  document.getElementById('nameInput').oninput=e=>cfg.name=e.target.value||"Игрок";
  const hp=document.getElementById('hairPick');HAIR.forEach((h,i)=>{const s=document.createElement('div');s.className='swatch'+(i===0?' on':'');s.style.background=h;s.onclick=()=>{hp.querySelectorAll('.swatch').forEach(x=>x.classList.remove('on'));s.classList.add('on');cfg.hair=h;};hp.appendChild(s);});
  const cp=document.getElementById('cityPick');Object.keys(CITIES).forEach(c=>{const b=document.createElement('button');b.className='pill'+(c==="Казань"?' on':'');b.textContent=c;b.onclick=()=>{cp.querySelectorAll('.pill').forEach(x=>x.classList.remove('on'));b.classList.add('on');cfg.city=c;ci();};cp.appendChild(b);});
  function ci(){const c=CITIES[cfg.city];document.getElementById('cityInfo').textContent=`Старт: ${c.money}₽ · цены ×${c.cost} · ${c.note}`;}ci();
  const tp=document.getElementById('traitPick');if(tp)TRAITS.forEach((t,i)=>{const b=document.createElement('button');b.className='pill'+(t.id==="none"?' on':'');b.textContent=t.n;b.title=t.d;b.onclick=()=>{tp.querySelectorAll('.pill').forEach(x=>x.classList.remove('on'));b.classList.add('on');cfg.trait=t.id;document.getElementById('traitInfo').textContent=t.d;};tp.appendChild(b);});
  const sp=document.getElementById('skillPick');Object.keys(SKILL_KEYS).forEach(k=>{cfg.skills[k]=0;const row=document.createElement('div');row.className='stat-ctrl';row.innerHTML=`<span>${SKILL_KEYS[k]}</span>`;const ctr=document.createElement('div');ctr.className='row';const mi=document.createElement('button');mi.className='b';mi.textContent='−';const va=document.createElement('span');va.style.cssText='min-width:20px;text-align:center';va.textContent='0';const pl=document.createElement('button');pl.className='b';pl.textContent='+';mi.onclick=()=>{if(cfg.skills[k]>0){cfg.skills[k]-=5;ptsLeft++;va.textContent=cfg.skills[k];document.getElementById('ptsLeft').textContent=ptsLeft;}};pl.onclick=()=>{if(ptsLeft>0){cfg.skills[k]+=5;ptsLeft--;va.textContent=cfg.skills[k];document.getElementById('ptsLeft').textContent=ptsLeft;}};ctr.append(mi,va,pl);row.appendChild(ctr);sp.appendChild(row);});
  roll();
  window.startGame=function(){cfg.name=(document.getElementById('nameInput').value||"Игрок").trim();let legacy=0;try{legacy=parseInt(lsGet('sim_legacy')||"0",10)||0;localStorage.removeItem('sim_legacy');}catch(e){}
    S=freshState(cfg);applyFate(fate,legacy);
    log(`17 лет, ${S.city}, конец мая. Последний школьный экзамен позади. Родители дали ${S.money}₽ и сказали: «Дальше сам». Время пошло.`);
    log("Судьба: талант — "+SKILL_KEYS[fate.talent]+", черта — "+traitName()+".","unlock");
    log("🎯 "+QUESTS[0].text,"unlock");
    document.getElementById('creation').classList.add('hidden');document.getElementById('game').classList.remove('hidden');
    checkAch();scanUnlocks();render();save();};
  window.fastForward=fastForward;window.resetGame=resetGame;window.openTile=openTile;window.openTileByName=openTileByName;window.closeModal=closeModal;window.openHero=openHero;window.openLog=openLog;window.rebirth=rebirth;
  load(v=>{if(v){try{S=JSON.parse(v);document.getElementById('creation').classList.add('hidden');document.getElementById('game').classList.remove('hidden');render();}catch(e){console.warn(e);}}});
}

/* ================= экспорт для тестов ================= */
if(typeof module!=="undefined")module.exports={freshState,allActions,getS:()=>S,setS:s=>{S=s;},
  doActionSim:function(id){const a=allActions().find(x=>x.id===id);if(!a||!a.show()||a.ok()!==true)return false;a.run();checkQuests();checkAch();scanUnlocks();return true;},
  ffSim:function(n){for(let i=0;i<n;i++)autoDay();S.hoursLeft=CFG.DAY_HOURS;checkQuests();checkAch();},
  applyFateSim:(f,l)=>applyFate(f,l),qol,rank,netWorth,dateStr,lifeScore,ACH,JOBS,TRANSPORT,HOUSING,TILES};

/* ================= ОВЕРРАЙДЫ / ФИКСЫ ================= */
(function(){var h=EDU_ACTIONS.find(a=>a.id==='honors');if(h)h.title=()=>"Учиться усерднее (на красный диплом) 🏠";})();
function choiceEvent(){
  var bank=[
    {t:"На работе предлагают серую зарплату «в конверте» — больше денег, но без соцгарантий.",
     opts:[{l:"Согласиться (+деньги, −репутация)",run:()=>{S.money+=price(20000);S.reputation=clamp(S.reputation-12);log("Взял серую зарплату. Быстрые деньги, но риск.","bad");}},
           {l:"Отказаться (+репутация)",run:()=>{S.reputation=clamp(S.reputation+4);log("Отказался от серой схемы. Чисто.","good");}}]},
    {t:"Знакомый зовёт в сомнительный «быстрый заработок».",
     opts:[{l:"Рискнуть капиталом",run:()=>{if(Math.random()<0.5){const g=price(60000);S.money+=g;log(`Схема сработала: +${g}₽`,"good");}else{const l=price(40000);S.money-=l;log(`Прогорел: −${l}₽`,"bad");}}},
           {l:"Пройти мимо",run:()=>{log("Не повёлся на лёгкие деньги.","good");}}]},
    {t:"Компания открывает офис в другом городе и зовёт с повышением.",
     opts:[{l:"Переехать (+грейд, −друзья)",run:()=>{S.grade=(S.grade||0)+1;S.friends=clamp(S.friends-15);S.mood=clamp(S.mood-5);log("Переехал ради карьеры. Грейд вырос, связи ослабли.","unlock");}},
           {l:"Остаться",run:()=>{S.mood=clamp(S.mood+3);log("Остался на месте — свои люди дороже.","good");}}]},
    {t:"Друг просит денег в долг в трудной ситуации.",
     opts:[{l:"Дать в долг (−деньги, +дружба)",run:()=>{S.money-=price(30000);S.friends=Math.min(100,S.friends+12);log("Помог другу. Он это запомнит.","good");}},
           {l:"Отказать",run:()=>{S.friends=clamp(S.friends-8);log("Отказал другу. Осадок остался.","bad");}}]},
    {t:"Нашёл кошелёк с крупной суммой и документами.",
     opts:[{l:"Вернуть владельцу",run:()=>{S.reputation=clamp(S.reputation+6);S.mood=clamp(S.mood+8);log("Вернул кошелёк. Совесть чиста.","good");}},
           {l:"Оставить себе",run:()=>{S.money+=price(25000);S.reputation=clamp(S.reputation-6);log("Оставил находку себе.","bad");}}]},
  ];
  PENDING_EVENT=bank[Math.floor(Math.random()*bank.length)];
  var ff=(typeof window!=="undefined"&&window._ffActive);
  if(typeof document==="undefined"||ff){PENDING_EVENT.opts[0].run();PENDING_EVENT=null;}
  else if(typeof showEvent==="function")showEvent();
};

/* входные вакансии доступны с 17 (школьники-выпускники) */
(function(){['handyman','loader','barista','callcenter','seller','smm','copywriter','tester','assistant','selfemp'].forEach(function(id){var j=JOBS.find(x=>x.id===id);if(j&&j.req)j.req.age=17;});})();

/* ФИКС БАЛАНСА: здоровье на автопилоте дрейфует к базе (молодой не умирает от простоя); события-развилки только в ручной игре */
function autoDay(){
  if(S&&S.dead)return 0;
  S.day++;S.age=17+Math.floor(S.day/365);let pay=0;
  S.fatigue=S.fatigue||0;
  const dow=(1+S.day)%7,weekend=(dow===0||dow===6),burnout=S.fatigue>70;
  const canWork=S.job&&!weekend&&S.energy>15&&!(burnout&&Math.random()<0.5);
  if(canWork){const j=jobById(S.job);pay=jobPay(j);S.money+=pay;S.exp[j.id]=(S.exp[j.id]||0)+1;S.reviewPts=(S.reviewPts||0)+1;addSkill(j.gain,0.25);S.fatigue=Math.min(100,S.fatigue+j.energy*0.35*(S.trait==="workaholic"?1.2:1));S.energy=clamp(S.energy-6);}
  else{S.fatigue=Math.max(0,S.fatigue-(weekend?16:13));S.energy=clamp(S.energy+(weekend?12:15));}
  if(S.enrolled){S.eduProgress+=2.2*(1+S.skills.intellect/300);if(canWork)pay=Math.round(pay*0.8);if(S.eduProgress>=EDU[S.enrolled].target){S.edu=S.enrolled;S.enrolled=null;S.eduProgress=0;addSkill({intellect:8});if(S.edu>=4)S.reputation=clamp(S.reputation+8);log("🎓 Диплом получен: "+EDU[S.edu].t+"!","good");}}
  const meal=HOUSING[S.housing].parentsFeed?0:price(300);S.money-=meal;S.sat=clamp(S.sat+(HOUSING[S.housing].parentsFeed?26:22)-4);
  transportDaily();S.flags.ate=true;
  if(S.partner){S.attention=clamp((S.attention||60)-0.6);if(S.attention<15&&Math.random()<0.03){if(S.married){S.money=Math.round(S.money/2);S.married=false;}S.partner=null;S.mood=clamp(S.mood-18);log('💔 Партнёр ушёл — ты давно не уделял внимания.','bad');}}
  S.mood=clamp(S.mood-1.0-(burnout?1.4:0)+HOUSING[S.housing].moodDay+TRANSPORT[S.transport].moodDay+seasonMood()+(S.partner?((S.attention||60)>40?0.6:-0.2):0)+(S.kids?0.3:0));
  if(S.mood<28&&S.money>price(1200)&&Math.random()<0.35){S.money-=price(500);S.mood=clamp(S.mood+14);}
  let hd=(TRANSPORT[S.transport].health||0)+(S.health<62?0.4:-0.14);
  if(S.age>=45)hd-=0.28;if(burnout)hd-=0.25;hd-=0.3*(S.addiction.smoke+S.addiction.alcohol);if(S.sat<30)hd-=0.4;
  S.health=clamp(S.health+hd);
  monthlyCosts();if(Math.random()<0.06)randomEvent();checkStory();statWarn();agingDeath();return pay;
};
function randomEvent(){
  var auto=(typeof document==="undefined")||(typeof window!=="undefined"&&window._ffActive);
  if(!auto && Math.random()<0.30){choiceEvent();return;}
  const pool=[
    ()=>{const f=price(300);S.money-=f;log(`Штраф ГИБДД по камере: −${f}₽`,"bad");},
    ()=>{S.mood=clamp(S.mood+10);S.friends=Math.min(100,S.friends+2);log("Друзья позвали на праздник. +настроение","good");},
    ()=>{if(S.trait==="athlete")return;S.health=clamp(S.health-8);log("Подхватил простуду. −здоровье","bad");},
    ()=>{const b=Math.round(price(400)*luck());S.money+=b;log(`Разовая подработка: +${b}₽`,"good");},
    ()=>{if(HOUSING[S.housing].v>=48){const r=price(4000);S.money-=r;log(`Сломалась техника дома: −${r}₽`,"bad");}},
    ()=>{S.skills.charisma=Math.min(100,S.skills.charisma+2);log("Удачное знакомство. +харизма","good");},
    ()=>{if(S.transport>=8&&!S.flags.kasko){const r=price(5000);S.money-=r;log(`Машина попросила ремонта: −${r}₽`,"bad");}},
    ()=>{S.mood=clamp(S.mood-8);log("Застрял в пробке/очереди. −настроение","bad");},
    ()=>{if(S.stocks>0){const d=Math.round(S.stocks*0.08);S.stocks+=d;log(`Рынок вырос: акции +${d.toLocaleString('ru')}₽`,"good");}},
    ()=>{if(S.friends>30){const b=price(2000);S.money+=b;log(`Друг вернул старый долг: +${b}₽`,"good");}},
  ];
  pool[Math.floor(Math.random()*pool.length)]();
};

/* ================= БЛОК 3: СОБЫТИЯ (контекст + цепочки + кризисы) ================= */
function startStory(type,minMonths,maxMonths,data){if(!S.story)S.story=[];const due=S.day+Math.round((minMonths+Math.random()*(maxMonths-minMonths))*30);S.story.push(Object.assign({type,due},data||{}));}
function checkStory(){
  if(!S.story||!S.story.length)return;
  const due=[];S.story=S.story.filter(st=>{if(S.day>=st.due){due.push(st);return false;}return true;});
  due.forEach(st=>{
    if(st.type==="startup"){
      if(Math.random()<(0.42+(S.trait==="lucky"?0.12:0))){const g=Math.round(st.inv*(3+Math.random()*3));S.money+=g;S.mood=clamp(S.mood+15);log(`🚀 Стартап, в который ты вложился, сделал экзит: +${g.toLocaleString('ru')}₽!`,"ach");}
      else{S.mood=clamp(S.mood-10);log(`Стартап, в который ты вложил ${st.inv.toLocaleString('ru')}₽, закрылся. Деньги сгорели.`,"bad");}
    } else if(st.type==="illness"){
      if(!S.chronic)S.chronic=[];S.chronic.push("хроническое");S.health=clamp(S.health-28);S.mood=clamp(S.mood-8);log("🩺 Запущенный симптом дал осложнение: хроническая болезнь и удар по здоровью. Надо было обследоваться.","bad");
    } else if(st.type==="promo"){
      if(S.job&&(S.grade||0)<3){S.grade=(S.grade||0)+1;S.mood=clamp(S.mood+12);log("⬆️ Тебя заметили и повысили по грейду за прошлые заслуги!","ach");}
    }
  });
}
const EVENTS=[
  /* --- INSTANT: мелкие, контекстные --- */
  {kind:"instant",w:3,tag:"bad",when:s=>s.transport>=6,run:s=>{const f=price(300);s.money-=f;log(`Штраф ГИБДД по камере: −${f}₽`,"bad");}},
  {kind:"instant",w:3,tag:"good",run:s=>{s.mood=clamp(s.mood+10);s.friends=Math.min(100,s.friends+2);log("Друзья позвали на праздник. +настроение","good");}},
  {kind:"instant",w:2,tag:"bad",when:s=>s.trait!=="athlete",run:s=>{s.health=clamp(s.health-(s.flags.vax?4:9));log("Подхватил простуду. −здоровье","bad");}},
  {kind:"instant",w:3,tag:"good",run:s=>{const b=Math.round(price(500)*luck());s.money+=b;log(`Разовая подработка подвернулась: +${b}₽`,"good");}},
  {kind:"instant",w:2,tag:"bad",when:s=>HOUSING[s.housing].v>=48,run:s=>{const r=price(6000);s.money-=r;log(`Сломалась техника дома: −${r}₽`,"bad");}},
  {kind:"instant",w:2,tag:"good",run:s=>{s.skills.charisma=Math.min(100,s.skills.charisma+2);log("Удачное знакомство. +харизма","good");}},
  {kind:"instant",w:2,tag:"bad",when:s=>s.transport>=8&&!s.flags.kasko,run:s=>{const r=price(8000);s.money-=r;log(`Машина попросила ремонта: −${r}₽`,"bad");}},
  {kind:"instant",w:2,tag:"bad",run:s=>{s.mood=clamp(s.mood-8);log("Застрял в пробке/очереди. −настроение","bad");}},
  {kind:"instant",w:2,tag:"good",when:s=>s.stocks>0,run:s=>{const d=Math.round(s.stocks*0.09);s.stocks+=d;log(`Рынок вырос: акции +${d.toLocaleString('ru')}₽`,"good");}},
  {kind:"instant",w:2,tag:"bad",when:s=>s.crypto>0,run:s=>{const d=Math.round(s.crypto*0.22);s.crypto=Math.max(0,s.crypto-d);log(`Крипта просела: −${d.toLocaleString('ru')}₽`,"bad");}},
  {kind:"instant",w:1,tag:"good",when:s=>s.friends>30,run:s=>{const b=price(3000);s.money+=b;log(`Друг вернул старый долг: +${b}₽`,"good");}},
  {kind:"instant",w:2,tag:"good",when:s=>!!s.job,run:s=>{const b=Math.round(jobPay(jobById(s.job))*0.6);s.money+=b;s.reviewPts=(s.reviewPts||0)+2;log(`Премия на работе: +${b}₽`,"good");}},
  {kind:"instant",w:2,tag:"bad",when:s=>s.kids>0,run:s=>{const r=price(5000);s.money-=r;s.mood=clamp(s.mood-4);log(`Ребёнок заболел — врач и лекарства: −${r}₽`,"bad");}},
  {kind:"instant",w:1,tag:"good",when:s=>s.kids>0,run:s=>{s.mood=clamp(s.mood+14);log("Ребёнок победил на олимпиаде! Гордость. 🙂","good");}},
  {kind:"instant",w:2,tag:"good",when:s=>!!s.partner,run:s=>{s.mood=clamp(s.mood+12);s.attention=clamp((s.attention||60)+8);log("Партнёр сделал приятный сюрприз. 🙂","good");}},
  {kind:"instant",w:1,tag:"good",when:s=>s.age>=30,run:s=>{const b=price(80000)*(1+Math.random());const g=Math.round(b);s.money+=g;log(`Небольшое наследство от родственника: +${g.toLocaleString('ru')}₽`,"good");}},
  {kind:"instant",w:1,tag:"bad",when:s=>s.subs.gym,run:s=>{s.health=clamp(s.health-6);log("Потянул спину в зале. −здоровье","bad");}},
  {kind:"instant",w:1,tag:"good",when:s=>!!s.pet,run:s=>{s.mood=clamp(s.mood+8);log("Питомец поднял настроение. 🐈","good");}},
  {kind:"instant",w:1,tag:"good",run:s=>{const b=price(2000);s.money+=b;log(`Налоговый вычет вернулся: +${b}₽`,"good");}},
  {kind:"instant",w:2,tag:"bad",run:s=>{const r=price(4000);s.money-=r;log(`Потерял/разбил телефон: −${r}₽`,"bad");}},
  {kind:"instant",w:2,tag:"bad",when:s=>s.fatigue>60,run:s=>{s.mood=clamp(s.mood-10);s.health=clamp(s.health-4);log("Выгорание накрыло — апатия и усталость. Отдохни.","bad");}},
  {kind:"instant",w:1,tag:"bad",when:s=>!!s.partner&&(s.attention||60)<20,run:s=>{if(Math.random()<0.5){if(s.married){s.money=Math.round(s.money/2);s.married=false;s.partner=null;s.mood=clamp(s.mood-25);log("💔 Партнёр ушёл: слишком долго без внимания. Развод, половина капитала потеряна.","bad");}else{s.partner=null;s.mood=clamp(s.mood-15);log("💔 Отношения кончились — ты их забросил.","bad");}}else{s.mood=clamp(s.mood-6);log("Дома напряжённо — давно не уделял внимания близкому.","bad");}}},
  /* --- CRISIS: редкие, тяжёлые --- */
  {kind:"instant",w:0.7,tag:"bad",when:s=>s.age>=25,run:s=>{
    s.priceMul=(s.priceMul||1)*1.2;if(s.stocks>0)s.stocks=Math.round(s.stocks*0.6);if(s.crypto>0)s.crypto=Math.round(s.crypto*0.5);
    let msg="📉 Экономический кризис: цены ×1.2, рынки рухнули.";
    if(s.job&&Math.random()<0.25){s.job=null;s.grade=0;msg+=" Тебя сократили!";}
    s.mood=clamp(s.mood-15);log(msg,"bad");}},
  /* --- CHOICE (только ручная игра) --- */
  {kind:"choice",w:2,tag:"neutral",when:s=>!!s.job,t:"На работе предлагают зарплату «в конверте» — больше денег, но без гарантий.",
   opts:[{l:"Согласиться (+деньги, −репутация)",run:s=>{s.money+=price(25000);s.reputation=clamp(s.reputation-12);log("Взял серую зарплату.","bad");}},{l:"Отказаться (+репутация)",run:s=>{s.reputation=clamp(s.reputation+4);log("Отказался от серой схемы.","good");}}]},
  {kind:"choice",w:2,tag:"neutral",when:s=>!!s.partner&&(s.attention||60)<30,t:"Дома копится напряжение — вы отдалились. Что делаешь?",
   opts:[{l:"Наладить (время + подарок)",run:s=>{s.money-=price(5000);s.attention=clamp((s.attention||60)+30);s.mood=clamp(s.mood+8);log("Помирились, стало теплее. 🙂","good");}},{l:"Пустить на самотёк",run:s=>{s.attention=clamp((s.attention||60)-15);log("Оставил как есть. Риск растёт.","bad");}}]},
  {kind:"choice",w:1.5,tag:"neutral",when:s=>!!s.job&&(s.grade||0)>=1,t:"Хантер зовёт к конкуренту: +20% к деньгам, но грейд с нуля и испытательный срок.",
   opts:[{l:"Перейти",run:s=>{s.grade=0;s.reviewPts=0;s.reputation=clamp(s.reputation+5);s.mood=clamp(s.mood-4);log("Сменил компанию на деньги. Начинаешь грейд заново.","unlock");}},{l:"Остаться",run:s=>{s.mood=clamp(s.mood+3);log("Остался — стабильность дороже.","good");}}]},
  {kind:"choice",w:1.5,tag:"neutral",run:s=>0,t:"Нашёл кошелёк с деньгами и документами.",
   opts:[{l:"Вернуть владельцу",run:s=>{s.reputation=clamp(s.reputation+6);s.mood=clamp(s.mood+8);log("Вернул кошелёк. Совесть чиста.","good");}},{l:"Оставить себе",run:s=>{s.money+=price(25000);s.reputation=clamp(s.reputation-6);log("Оставил находку.","bad");}}]},
  /* --- CHAIN-STARTERS (только ручная игра, платят через месяцы) --- */
  {kind:"choice",w:1.2,tag:"neutral",when:s=>s.age>=20&&s.age<=45&&s.money>=price(200000),t:"Знакомый зовёт соинвестором в стартап. Вложение окупится или сгорит через полгода-полтора.",
   opts:[{l:()=>`Вложить ${price(150000).toLocaleString('ru')}₽`,run:s=>{const inv=price(150000);s.money-=inv;startStory("startup",6,18,{inv});log("Вложился в стартап. Ждём результат…","unlock");}},{l:"Пройти мимо",run:s=>{log("Не рискнул со стартапом.");}}]},
  {kind:"choice",w:1.4,tag:"bad",when:s=>s.age>=35&&s.chronic.length<2,t:"Появился тревожный симптом. Обследоваться сейчас или забить?",
   opts:[{l:()=>`Обследоваться (−${price(6000).toLocaleString('ru')}₽)`,run:s=>{s.money-=price(6000);s.health=clamp(s.health+4);log("Прошёл обследование — всё под контролем.","good");}},{l:"Забить, само пройдёт",run:s=>{startStory("illness",4,12,{});log("Проигнорировал симптом…","bad");}}]},
  {kind:"choice",w:1,tag:"good",when:s=>!!s.job&&(s.reviewPts||0)>=10,t:"Начальник намекает: покажешь себя на проекте — будет повышение через пару месяцев.",
   opts:[{l:"Впрячься в проект (−настроение сейчас)",run:s=>{s.mood=clamp(s.mood-6);s.fatigue=Math.min(100,(s.fatigue||0)+15);startStory("promo",2,4,{});log("Взял сложный проект ради грейда.","unlock");}},{l:"Не рвать жилы",run:s=>{log("Решил не перерабатывать.");}}]},
];
function pickWeighted(pool){let tw=0;pool.forEach(e=>{tw+=e._w;});let r=Math.random()*tw;for(const e of pool){r-=e._w;if(r<0)return e;}return pool[pool.length-1];}
randomEvent=function(){
  const auto=(typeof document==="undefined")||(typeof window!=="undefined"&&window._ffActive);
  const pool=EVENTS.filter(e=>(!e.when||e.when(S))&&(auto?e.kind==="instant":true));
  if(!pool.length)return;
  pool.forEach(e=>{let w=e.w;if(S.trait==="lucky"&&e.tag==="good")w*=1.5;if(S.trait==="sickly"&&e.tag==="bad")w*=1.25;e._w=w;});
  const e=pickWeighted(pool);
  if(e.kind==="instant")e.run(S);
  else if(e.kind==="choice"){PENDING_EVENT={t:e.t,opts:e.opts.map(o=>({l:(typeof o.l==="function"?o.l():o.l),run:()=>o.run(S)}))};if(typeof document!=="undefined"&&typeof showEvent==="function")showEvent();}
};

/* ================= БЛОК 5: ВИЗУАЛ (живая сцена, тикер, оффлайн, бейджи, празднования) ================= */
(function(){
if(typeof document==="undefined")return;
var _lastMoney=null,_ach=0,_offChecked=false;
var _origRender=render;
render=function(){
  _origRender();
  try{
    var hp=document.getElementById('hPills');
    if(hp&&S){ if(!document.getElementById('pillFat')){var d=document.createElement('div');d.className='pill2';d.id='pillFat';hp.appendChild(d);}
      var f=Math.round(S.fatigue||0);document.getElementById('pillFat').innerHTML='<span>🔥</span><b style="color:'+(f>70?'#ff5a5f':f>45?'#ffab2e':'#12b76a')+'">'+f+'</b>';}
    renderScene();decorateTiles();
    var hm=document.getElementById('hMoney');
    if(hm&&S){var tg2=S.money;if(_lastMoney===null)_lastMoney=tg2;if(_lastMoney!==tg2){rollMoney(hm,_lastMoney,tg2);if(tg2>_lastMoney)floatGain(tg2-_lastMoney);}_lastMoney=tg2;}
    var n=Object.keys(S&&S.ach||{}).length;if(n>_ach){if(_ach>0)celebrate();_ach=n;}
    if(!_offChecked){_offChecked=true;setTimeout(checkOffline,60);}
  }catch(e){}
};
function renderScene(){
  var sc=document.getElementById('scene');if(!sc||!S)return;
  var h=HOUSING[S.housing],tr=TRANSPORT[S.transport];
  var houseIcon=S.housing>=13?'🏰':S.housing>=11?'🏡':S.housing>=9?'🏢':S.housing>=3?'🏬':'🏚️';
  var fam='';if(S.partner)fam+='<span class="sf">🧑‍🤝‍🧑</span>';for(var i=0;i<Math.min(4,S.kids||0);i++)fam+='<span class="sf">🧒</span>';if(S.pet)fam+='<span class="sf">🐈</span>';
  var carTok=(tr.t.match(/\S+/)||[''])[0];
  var car=S.transport>=6?'<span class="scar">'+carTok+'</span>':'';
  sc.innerHTML='<div class="scRoom"><span class="scHouse">'+houseIcon+'</span><span class="scAva">'+avatarFace()+'</span><span class="scFam">'+fam+'</span>'+car+'</div><div class="scLabel">'+h.t+' · '+tr.t+' · 🔥'+Math.round(S.fatigue||0)+'</div>';
}
function decorateTiles(){
  var tiles=document.querySelectorAll('#tiles .tile');if(!tiles.length)return;
  TILES.forEach(function(t,i){var el=tiles[i];if(!el)return;
    var acts=allActions().filter(function(a){return t.cats.indexOf(a.cat)>=0&&a.show();});
    var avail=acts.some(function(a){return a.ok()===true&&a.id.indexOf('hire_')!==0;});
    var old=el.querySelector('.tbadge');if(old)old.remove();
    if(avail){var b=document.createElement('span');b.className='tbadge';el.appendChild(b);}
  });
}
function rollMoney(el,from,to){var t0=performance.now();function step(t){var k=Math.min(1,(t-t0)/450);var v=Math.round(from+(to-from)*(k*k*(3-2*k)));el.textContent=v.toLocaleString('ru');if(k<1)requestAnimationFrame(step);}requestAnimationFrame(step);}
function floatGain(amt){var st=document.getElementById('scene')||document.getElementById('hud');if(!st)return;var f=document.createElement('div');f.className='floatGain';f.textContent='+'+amt.toLocaleString('ru')+'₽';st.appendChild(f);setTimeout(function(){f.remove();},1100);}
function celebrate(){var o=document.createElement('div');o.className='confetti';for(var i=0;i<26;i++){var p=document.createElement('i');p.style.left=(Math.random()*100)+'%';p.style.background=['#f6a609','#12b76a','#2b8cff','#ee46bc','#f0426b','#7a5af8'][i%6];p.style.animationDelay=(Math.random()*0.35)+'s';o.appendChild(p);}document.body.appendChild(o);setTimeout(function(){o.remove();},1900);}
function checkOffline(){
  if(!S||S.dead)return;var last=parseInt(lsGet('sim_time_v3')||'0',10),now=Date.now();
  if(!last)return;var hrs=(now-last)/3600000,days=Math.min(45,Math.floor(hrs));
  if(days>=1){var m0=S.money;window._ffActive=true;for(var i=0;i<days&&!S.dead;i++)autoDay();window._ffActive=false;S.hoursLeft=CFG.DAY_HOURS;showOffline(days,S.money-m0);afterAct();}
}
function showOffline(days,earned){var o=document.createElement('div');o.className='deathOv';o.style.display='flex';o.innerHTML='<div class="deathCard"><div class="deathTop" style="font-size:20px">⏳ Пока тебя не было</div><div class="epi" style="font-style:normal;margin:12px 0">Прошло '+days+' дн — жизнь шла на автопилоте.</div><div class="scoreLine">Итог: <b>'+(earned>=0?'+':'')+earned.toLocaleString('ru')+'₽</b></div><button class="cta" style="margin-top:12px">Собрать</button></div>';document.body.appendChild(o);o.querySelector('button').onclick=function(){o.remove();render();};}
var _origSave=save;save=function(){_origSave();try{localStorage.setItem('sim_time_v3',String(Date.now()));}catch(e){}};
})();

/* ================= ИНТРО: сюжетная завязка (мажор теряет всё) ================= */
(function(){
if(typeof document==="undefined")return;
var _sg=window.startGame;
window.startGame=function(){ if(_sg)_sg(); showIntro(); };
function showIntro(){
  if(!S)return;
  var city=S.city, nm=S.name||"друг";
  var slides=[
    {e:"🏙️💳",t:"Москва. Тебе 17. Отец — большая шишка, а ты живёшь на его деньги: тачка, клубы, всё самое лучшее."},
    {e:"💝🚗",t:"Ты по уши влюблён в Кристину и ни в чём ей не отказываешь. На прошлой неделе подарил ей машину…"},
    {e:"🏢💸",t:"…а вчера — квартиру. С папиной карты, разумеется. А чего мелочиться?"},
    {e:"😠",t:"«Ты хоть рубль в жизни сам заработал? Пустышка, живёшь на моих деньгах!» — отец узнал обо всём."},
    {e:"🧥❌",t:"Он забрал всё: карты, машину, ту самую квартиру. Даже брендовые шмотки заставил снять."},
    {e:"🚪🧳",t:"«Вот тебе прописка у бабушки в городе "+city+", 500 рублей и симка. Через год приеду — посмотрим, чего ты стоишь. Дальше сам.»"},
    {e:"💔⏳",t:"Кристина, узнав, что денег больше нет, ушла в тот же вечер. Ты совсем один, "+nm+". Часы пошли."}
  ];
  var i=0;
  var ov=document.getElementById('introOv');
  if(!ov){ov=document.createElement('div');ov.id='introOv';ov.className='introOv';document.body.appendChild(ov);}
  function draw(){
    var sl=slides[i];
    ov.innerHTML='<div class="introCard"><div class="introEmoji">'+sl.e+'</div><div class="introText">'+sl.t+'</div>'
      +'<div class="introDots">'+slides.map(function(_,k){return '<span class="'+(k===i?'on':'')+'"></span>';}).join('')+'</div>'
      +'<button class="cta introBtn">'+(i<slides.length-1?'Далее ▶':'Начать с нуля ▶')+'</button>'
      +(i<slides.length-1?'<div class="introSkip">пропустить</div>':'')+'</div>';
    ov.querySelector('.introBtn').onclick=function(){ if(i<slides.length-1){i++;draw();} else finish(); };
    var sk=ov.querySelector('.introSkip'); if(sk)sk.onclick=finish;
  }
  function finish(){
    ov.remove();
    S.log=[];
    log("Ты на пороге бабушкиной квартиры в городе "+city+". В кармане — жалкие копейки. Год, чтобы доказать отцу (и себе), что ты чего-то стоишь.");
    log("🎯 "+QUESTS[0].text,"unlock");
    render();save();
  }
  ov.style.display='flex';draw();
}
})();

/* ================= БЛОК 6: АРТ-СЛОЙ (иллюстрированные вакансии, аватар+фон, иконки) ================= */
(function(){
if(typeof document==="undefined")return;
var A=ASSETS.dir;
card=function(a){
  MODAL_ACTS.push(a);var i=MODAL_ACTS.length-1,ok=a.ok(),dis=ok!==true;
  if(a.id.indexOf('hire_')===0){
    var jid=a.id.slice(5),j=jobById(jid),cur=(S.job===jid);
    var btn=cur?'<span class="jok">✓</span>':(dis?'<span class="jlock">🔒</span>':'<span class="jtake">ПРИНЯТЬ</span>');
    return '<button class="acard jcard'+((dis&&!cur)?' locked':'')+'" data-i="'+i+'"'+(dis?' disabled':'')+'>'
      +'<div class="jart"><img src="'+A+'jobs/'+jid+'.png" alt="" onerror="this.remove()"><span class="jartfb">'+TRACKS[j.track].split(' ')[0]+'</span></div>'
      +'<div class="jinfo"><div class="jt">'+j.t+'</div><div class="jpay"><b>'+j.base.toLocaleString('ru')+'</b> ₽/см</div><div class="jcond">'+a.sub()+'</div></div>'
      +'<div class="jbtnwrap">'+btn+'</div></button>';
  }
  return '<button class="acard'+(dis?' dis':'')+'" data-i="'+i+'"'+(dis?' disabled':'')+'><div class="acT">'+a.title()+'</div><div class="acC">'+a.sub()+'</div></button>';
};
var _r6=render;
render=function(){ _r6(); try{ scene2(); tileIcons(); }catch(e){} };
function scene2(){
  var sc=document.getElementById('scene'); if(!sc||!S)return;
  var st=(S.health<28||S.energy<18)?'tired':(S.mood>=75?'happy':(S.mood<30?'sad':'ok'));
  var tier=S.housing>=13?'elite':S.housing>=9?'own':S.housing>=3?'rent':'parents';
  var carTok=(TRANSPORT[S.transport].t.match(/\S+/)||[''])[0];
  var fam=''; if(S.partner)fam+='🧑‍🤝‍🧑'; for(var k=0;k<Math.min(4,S.kids||0);k++)fam+='🧒'; if(S.pet)fam+='🐈';
  sc.innerHTML='<img class="scBg" src="'+A+'bg/'+tier+'.png" alt="" onerror="this.remove()">'
    +'<img class="scChar" src="'+A+'avatar/'+st+'.png" alt="" onerror="this.remove()">'
    +'<div class="scEmoji">'+avatarFace()+'</div>'
    +(fam?'<div class="scFam2">'+fam+'</div>':'')
    +(S.transport>=6?'<div class="scCar2">'+carTok+'</div>':'')
    +'<div class="scLabel">'+HOUSING[S.housing].t+' · '+TRANSPORT[S.transport].t+' · 🔥'+Math.round(S.fatigue||0)+'</div>';
}
function tileIcons(){
  var tiles=document.querySelectorAll('#tiles .tile'); if(!tiles.length)return;
  var map={"Работа":"work","Развитие":"dev","Учёба":"edu","Быт":"home","Здоровье":"health","Досуг":"fun","Личное":"personal","Жильё":"house","Транспорт":"transport","Финансы":"finance"};
  TILES.forEach(function(t,i){var el=tiles[i]; if(!el)return; var ti=el.querySelector('.ti'); if(!ti||ti.querySelector('img'))return;
    var img=document.createElement('img'); img.className='tileImg'; img.src=A+'tiles/'+(map[t.name]||'x')+'.png'; img.onerror=function(){this.remove();}; ti.appendChild(img);});
}
})();

/* ================= БЛОК 7: ВСТРОЕННЫЕ КАРТИНКИ (data URI, работает по file://) ================= */
(function(){
if(typeof document==="undefined")return;
window.IMGSRC=function(rel){return (window.EMBEDDED_ASSETS&&window.EMBEDDED_ASSETS[rel])||(ASSETS.dir+rel);};
avImgTag=function(){return '<img src="'+IMGSRC('avatar_'+avState()+'.png')+'" alt="" onerror="this.remove()">';};
var _r7=render;
render=function(){ _r7(); try{ scene3(); }catch(e){} };
function scene3(){
  var sc=document.getElementById('scene'); if(!sc||!S)return;
  var st=(S.health<28||S.energy<18)?'tired':(S.mood>=75?'happy':(S.mood<30?'sad':'ok'));
  var tier=S.housing>=13?'elite':S.housing>=9?'own':S.housing>=3?'rent':'parents';
  var carTok=(TRANSPORT[S.transport].t.match(/\S+/)||[''])[0];
  var fam=''; if(S.partner)fam+='🧑‍🤝‍🧑'; for(var k=0;k<Math.min(4,S.kids||0);k++)fam+='🧒'; if(S.pet)fam+='🐈';
  sc.innerHTML='<img class="scBg" src="'+IMGSRC('bg/'+tier+'.png')+'" alt="" onerror="this.remove()">'
    +'<img class="scChar" src="'+IMGSRC('avatar/'+st+'.png')+'" alt="" onerror="this.remove()">'
    +'<div class="scEmoji">'+avatarFace()+'</div>'
    +(fam?'<div class="scFam2">'+fam+'</div>':'')
    +(S.transport>=6?'<div class="scCar2">'+carTok+'</div>':'')
    +'<div class="scLabel">'+HOUSING[S.housing].t+' · '+TRANSPORT[S.transport].t+' · 🔥'+Math.round(S.fatigue||0)+'</div>';
}
})();

/* ================= ФИНАЛЬНЫЙ РЕ-РЕНДЕР ================= */
/* Сейв мог загрузиться в bootstrap ДО определения блоков 5/6/7 — перерисуем полностью, когда все обёртки render уже на месте. */
(function(){
  if(typeof document==="undefined")return;
  function full(){ try{ if(typeof S!=="undefined" && S && document.getElementById('game') && !document.getElementById('game').classList.contains('hidden')) render(); }catch(e){} }
  full();
  if(document.readyState==="loading")document.addEventListener('DOMContentLoaded',full);
  setTimeout(full,60);
})();

/* ================= БЛОК 8: ИКОНКИ РАЗДЕЛОВ через IMGSRC (data-URI, работает по file://) ================= */
(function(){
if(typeof document==="undefined")return;
var _r8=render;
render=function(){ _r8(); try{ tileImgs(); }catch(e){} };
function tileImgs(){
  var tiles=document.querySelectorAll('#tiles .tile'); if(!tiles.length)return;
  var map={"Работа":"work","Развитие":"dev","Учёба":"edu","Быт":"home","Здоровье":"health","Досуг":"fun","Личное":"personal","Жильё":"house","Транспорт":"transport","Финансы":"finance"};
  TILES.forEach(function(t,i){var el=tiles[i]; if(!el)return; var ti=el.querySelector('.ti'); if(!ti)return;
    var key='tiles/'+(map[t.name]||'x')+'.png';
    var src=(typeof IMGSRC==="function")?IMGSRC(key):('assets/'+key);
    var img=ti.querySelector('img.tileImg2');
    if(!img){img=document.createElement('img');img.className='tileImg2';ti.appendChild(img);}
    if(img.getAttribute('src')!==src){img.setAttribute('src',src);img.onerror=function(){this.style.display='none';};}
  });
}
})();

/* ================= БЛОК 9: ЭКРАН ПО РЕФЕРЕНСУ (герой-персонаж, comic-панели, нав 4+6) ================= */
(function(){
if(typeof document==="undefined")return;
var bound=false;
function $(id){return document.getElementById(id);}
function fmtMoney(n){n=Math.round(n||0);var a=Math.abs(n),s=n<0?'-':'';if(a>=1e6)return s+(a/1e6).toFixed(a>=1e7?0:1).replace('.0','')+'M';if(a>=1000)return s+(a/1000).toFixed(a>=1e4?0:1).replace('.0','')+'K';return s+a;}
function avSt(){return (S.health<28||S.energy<18)?'tired':(S.mood>=75?'happy':(S.mood<30?'sad':'ok'));}
function hTier(){return S.housing>=13?'elite':S.housing>=9?'own':S.housing>=3?'rent':'parents';}
function img(rel){return (typeof IMGSRC==='function')?IMGSRC(rel):('assets/'+rel);}
function setImg(el,src){if(!el)return;if(el.getAttribute('src')!==src){el.setAttribute('src',src);el.onerror=function(){this.style.visibility='hidden';};el.style.visibility='visible';}}
function lifeLeft(){return Math.max(1,Math.round(83+(S.health-70)/6-(S.age-17)));}
function dateShort(){try{var p=dateParts();return p.d+' '+MONTHS[p.m].slice(0,3)+'. '+p.y;}catch(e){return '';}}
function incomeMonthly(){var inc=0;if(S.job)inc+=Math.round(jobPay(jobById(S.job))*20);if(S.rentalUnits)inc+=S.rentalUnits*priceRaw(12000);if(S.passive)inc+=S.passive;if(S.married)inc+=priceRaw(35000);return inc;}
function expenseMonthly(){var e=0;var h=HOUSING[S.housing];var rent=h.rent;if(S.married&&rent)rent=Math.round(rent*0.6);if(rent)e+=price(rent);if(h.owned||h.mortgage)e+=price(3500);if(!h.parentsFeed)e+=price(300)*30;if(TRANSPORT[S.transport].daily)e+=price(TRANSPORT[S.transport].daily)*30;e+=subsCost();if(S.kids)e+=S.kids*price(15000);return e;}

var _r9=render;
render=function(){ _r9(); try{ ref9(); }catch(e){} };

function ref9(){
  if(!S)return;
  if(!bound)bindOnce();
  $('rHealth').textContent=Math.round(S.health)+'%';
  $('rMood').textContent=Math.round(S.mood)+'%';
  $('rMoney').textContent=fmtMoney(S.money);
  $('rName').textContent=S.name||'Игрок';
  $('rAge').textContent=S.age+' лет';
  $('rLife').textContent='Жить осталось '+lifeLeft()+' лет';
  var inc=incomeMonthly(),exp=expenseMonthly();
  $('rInc').textContent='Доход: '+(inc>0?fmtMoney(inc):'--');
  $('rExp').textContent='Расход: '+(exp>0?('−'+fmtMoney(exp)):'0');
  $('rDate').textContent=dateShort();
  $('rEnergy').textContent='⚡'+Math.round(S.energy);
  $('rSat').textContent='🍔'+Math.round(S.sat);
  $('rFat').textContent='🔥'+Math.round(S.fatigue||0);
  setImg($('sceneBg'),img('bg/'+hTier()+'.png'));
  setImg($('hero'),img('avatar/'+avSt()+'.png'));
  // цель дня
  var gc=$('goalChip'); if(gc){try{gc.textContent=(S.sandbox?('🎯 '+nextGoal()):('🎯 '+QUESTS[S.quest].text))+' · '+seasonName().split(' ')[1]+', день '+(S.day+1);}catch(e){}}
  renderQuick();
  fixBadges();
}
function renderQuick(){
  var q=$('quick'); if(!q)return;
  var acts=[
    {t:'Поесть',i:'🍔',run:function(){openTileByName('Быт');}},
    {t:'Пойти учиться',i:'🎓',run:function(){openTileByName('Учёба');}},
    S.job?{t:'Выйти на смену',i:'💼',run:function(){runId('shift');}}:{t:'Найти работу',i:'💼',run:function(){openTileByName('Работа');}}
  ];
  q.innerHTML=acts.map(function(a,i){return '<button class="qbtn" data-qi="'+i+'"><span class="qi">'+a.i+'</span>'+a.t+'</button>';}).join('');
  q.querySelectorAll('.qbtn').forEach(function(b){b.onclick=function(){acts[+b.dataset.qi].run();};});
}
function fixBadges(){
  document.querySelectorAll('#tiles .tbadge').forEach(function(b){b.remove();});
  // «!» только на Работе, когда нет работы
  if(!S.job){var tiles=document.querySelectorAll('#tiles .tile'); if(tiles[0]){var s=document.createElement('span');s.className='tbadge';tiles[0].appendChild(s);}}
}
function bindOnce(){
  bound=true;
  var pmap={plusH:'Здоровье',plusM:'Досуг',plusMoney:'Работа'};
  Object.keys(pmap).forEach(function(id){var b=$(id);if(b)b.onclick=function(){openTileByName(pmap[id]);};});
  var m=$('btnMenu'); if(m)m.onclick=function(){openHero();};
}
})();
