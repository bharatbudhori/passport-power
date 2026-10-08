import { esc } from '../core/utils.js';
import { getPhoto } from './photos.js';
import * as d3 from 'd3';
import { ccol, hsh } from './covers.js';

/* ---------- illustrated landmark backdrops for the passport viewer ---------- */
export const G=1000;
export const rng=seed=>()=>{seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296;};
export const P=(pts,f,extra='')=>`<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="${f}" ${extra}/>`;
export const R=(x,y,w,h,f,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${extra}/>`;
export const PA=(d,f,extra='')=>`<path d="${d}" fill="${f}" ${extra}/>`;
export const dome=(cx,r,b,f,k=1)=>PA(`M${cx-r} ${b}A${r} ${r*k} 0 0 1 ${cx+r} ${b}Z`,f);
export const onion=(cx,r,b,f)=>PA(`M${cx-r*.55} ${b}C${cx-r*1.25} ${b-r*.6} ${cx-r*.9} ${b-r*1.35} ${cx} ${b-r*1.9}C${cx+r*.9} ${b-r*1.35} ${cx+r*1.25} ${b-r*.6} ${cx+r*.55} ${b}Z`,f)+R(cx-1.5,b-r*2.35,3,r*.5,f);
export const minaret=(cx,w,h,b,f)=>R(cx-w/2,b-h,w,h,f)+R(cx-w*.8,b-h*.72,w*1.6,6,f)+P([[cx-w/2,b-h],[cx,b-h-w*2.6],[cx+w/2,b-h]],f);
export const spire=(cx,w,h,b,f)=>P([[cx-w/2,b],[cx,b-h],[cx+w/2,b]],f);
export const ground=(f,y=970)=>PA(`M0 ${y}Q400 ${y-14} 800 ${y-4}T1600 ${y-10}V1000H0Z`,f);
export function ridge(r,base,amp,step,f,jag){ let d=`M0 ${G}L0 ${base}`; for(let x=0;x<=1600+step;x+=step){ const y=base-amp*(.35+r()*.65); d+=jag?`L${x} ${y.toFixed(0)}`:`Q${x-step/2} ${(y-amp*.25).toFixed(0)} ${x} ${y.toFixed(0)}`; } return PA(d+`L1600 ${G}Z`,f); }
export const palm=(x,h,b,f,lean=1)=>{ const tx=x+lean*h*.18, ty=b-h; let s=PA(`M${x-4} ${b}Q${x+lean*h*.05} ${b-h*.5} ${tx-2} ${ty}L${tx+2} ${ty}Q${x+lean*h*.08} ${b-h*.5} ${x+4} ${b}Z`,f);
  [[-1,.1],[-1,-.35],[1,.1],[1,-.35],[0,-.6]].forEach(([dx,dy])=>{ s+=PA(`M${tx} ${ty}Q${tx+dx*h*.25} ${ty+dy*h*.3-h*.05} ${tx+dx*h*.42+(dx?0:lean*h*.12)} ${ty+h*(dy>0?.12:.02)}Q${tx+dx*h*.22} ${ty+dy*h*.2} ${tx} ${ty+4}Z`,f); }); return s; };
export const acacia=(x,h,b,f)=>PA(`M${x-3} ${b}L${x-2} ${b-h*.6}L${x-20} ${b-h*.8}L${x-18} ${b-h*.82}L${x} ${b-h*.66}L${x+16} ${b-h*.84}L${x+18} ${b-h*.82}L${x+3} ${b-h*.6}L${x+3} ${b}Z`,f)+PA(`M${x-h*.62} ${b-h*.8}Q${x} ${b-h*1.08} ${x+h*.62} ${b-h*.8}Q${x} ${b-h*.86} ${x-h*.62} ${b-h*.8}Z`,f);
export const house=(x,w,h,b,f)=>R(x,b-h,w,h,f)+P([[x-3,b-h],[x+w/2,b-h-w*.5],[x+w+3,b-h]],f);
export function town(r,x0,x1,b,f){ let s='', x=x0; while(x<x1){ const w=26+r()*30, h=30+r()*55; s+=house(x,w,h,b,f); if(r()<.12) s+=R(x+w/2-6,b-h-90,12,90,f)+spire(x+w/2,16,60,b-h-90,f); x+=w+2+r()*6; } return s; }
export const L={
  FR:['Eiffel Tower, Paris',f=>PA('M1150 1000Q1205 900 1232 760L1222 760L1222 742L1238 742Q1246 570 1250 430L1247 430L1247 414L1253 414L1253 350L1256 350L1259 414L1265 414L1265 430L1262 430Q1266 570 1274 742L1290 742L1290 760L1280 760Q1307 900 1362 1000L1322 1000Q1290 905 1256 868Q1222 905 1190 1000Z',f)+R(1232,742,48,8,f)],
  IN:['Taj Mahal, Agra',f=>R(1040,950,420,50,f)+R(1150,800,200,150,f)+onion(1250,62,800,f)+R(1236,690,28,20,f)+onion(1185,22,800,f)+onion(1315,22,800,f)+minaret(1060,14,250,950,f)+minaret(1440,14,250,950,f)+minaret(1110,12,190,950,f)+minaret(1390,12,190,950,f)],
  EG:['Pyramids of Giza',f=>P([[1020,1000],[1210,700],[1400,1000]],f)+P([[1300,1000],[1440,780],[1580,1000]],f)+P([[880,1000],[960,880],[1040,1000]],f)],
  US:['Statue of Liberty, New York',f=>R(1200,860,120,140,f)+R(1215,800,90,60,f)+P([[1236,800],[1284,800],[1272,610],[1248,610]],f)+`<circle cx="1260" cy="594" r="15" fill="${f}"/>`+[0,1,2,3,4,5,6].map(k=>{const a=(-160+k*23)*Math.PI/180;return P([[1260+12*Math.cos(a),594+12*Math.sin(a)],[1260+30*Math.cos(a),594+30*Math.sin(a)],[1260+14*Math.cos(a+.15),594+14*Math.sin(a+.15)]],f);}).join('')+P([[1268,630],[1296,505],[1306,508],[1280,634]],f)+P([[1292,505],[1310,505],[1306,488],[1296,488]],f)+`<circle cx="1301" cy="478" r="9" fill="#ffd27a" opacity=".9"/>`],
  GB:['Big Ben, London',f=>R(980,850,240,150,f)+[1000,1040,1080,1120,1160,1200].map(x=>spire(x,10,40,850,f)).join('')+R(1220,560,62,440,f)+P([[1214,560],[1251,450],[1288,560]],f)+R(1249,400,4,50,f)+`<circle cx="1251" cy="610" r="20" fill="#ffe2a0" opacity=".55"/>`],
  IT:['Colosseum, Rome',f=>PA('M1000 1000L1000 770Q1250 700 1520 790L1520 1000Z'+[0,1,2].map(row=>Array.from({length:12},(_,k)=>{const x=1020+k*40, y=800+row*60-(row===0?(k>5?(k-6)*4:0):0);return `M${x} ${y+40}L${x} ${y+14}Q${x+12} ${y} ${x+24} ${y+14}L${x+24} ${y+40}Z`;}).join('')).join(''),f,'fill-rule="evenodd"')],
  AU:['Sydney Opera House',f=>R(1040,955,470,45,f)+PA('M1090 955Q1130 820 1215 790Q1185 870 1190 955Z',f)+PA('M1170 955Q1220 800 1310 770Q1275 860 1280 955Z',f)+PA('M1270 955Q1320 840 1390 820Q1365 890 1370 955Z',f)+PA('M1360 955Q1395 880 1450 868Q1430 915 1435 955Z',f)+PA('M560 1000Q740 760 920 1000L900 1000Q740 790 580 1000Z',f)+R(560,900,360,6,f)],
  JP:['Mount Fuji with a pagoda',(f,p)=>P([[700,1000],[1050,560],[1110,560],[1460,1000]],p.mid)+P([[1000,624],[1050,560],[1110,560],[1160,624],[1120,610],[1090,640],[1060,606]],'#e9e6f7','opacity=".55"')+[0,1,2,3,4].map(k=>{const b=1000-k*58, w=110-k*14;return R(1370-w*.35,b-40,w*.7,40,f)+PA(`M${1370-w*.6} ${b-40}Q${1370} ${b-56} ${1370+w*.6} ${b-40}L${1370+w*.45} ${b-48}L${1370-w*.45} ${b-48}Z`,f);}).join('')+R(1368,650,4,60,f)],
  CN:['Great Wall of China',(f,p)=>{const r=rng(7); let d='M0 1000'; const pts=[]; for(let x=0;x<=1600;x+=40){const y=840-Math.sin(x/230)*90-r()*20; pts.push([x,y]); d+=`L${x} ${y.toFixed(0)}`;} let s=PA(d+'L1600 1000Z',p.mid); let w=''; pts.forEach(([x,y],k)=>{ if(k%2===0) w+=R(x,y-14,14,14,f); if(k%8===3) w+=R(x-12,y-60,40,60,f)+R(x-16,y-66,48,8,f);}); return s+PA('M0 1000'+pts.map(([x,y])=>`L${x} ${y}`).join('')+'L1600 1000Z',f,'transform="translate(0 8)"')+w;}],
  BR:['Christ the Redeemer, Rio',(f,p)=>PA('M900 1000Q1060 880 1160 700Q1200 640 1250 630Q1300 640 1330 700Q1430 880 1600 1000Z',f)+R(1244,540,12,92,f)+R(1196,566,108,10,f)+`<circle cx="1250" cy="532" r="9" fill="${f}"/>`+PA('M300 1000Q420 700 520 720Q600 760 640 1000Z',p.mid)],
  MY:['Petronas Towers, Kuala Lumpur',f=>[1180,1320].map(x=>P([[x-34,1000],[x-34,640],[x-26,640],[x-26,560],[x-18,560],[x-18,500],[x-8,500],[x,400],[x+8,500],[x+18,500],[x+18,560],[x+26,560],[x+26,640],[x+34,640],[x+34,1000]],f)).join('')+R(1214,700,72,8,f)],
  AE:['Burj Khalifa, Dubai',f=>P([[1200,1000],[1210,800],[1222,800],[1230,640],[1240,640],[1244,480],[1250,480],[1253,330],[1256,480],[1262,480],[1266,640],[1276,640],[1284,800],[1296,800],[1306,1000]],f)+town(rng(3),900,1190,1000,f).replace(/house/g,'')],
  SG:['Marina Bay Sands, Singapore',f=>[1150,1260,1370].map(x=>P([[x-28,1000],[x-22,760],[x+22,760],[x+28,1000]],f)).join('')+PA('M1090 760L1440 740L1450 752L1100 770Z',f)],
  DE:['Brandenburg Gate, Berlin',f=>R(1080,780,340,40,f)+R(1070,820,360,14,f)+[0,1,2,3,4,5].map(k=>R(1090+k*62,834,18,166,f)).join('')+R(1220,740,60,40,f)+P([[1230,740],[1250,710],[1270,740]],f)],
  NL:['Windmill among tulip fields',f=>P([[1210,1000],[1225,780],[1275,780],[1290,1000]],f)+P([[1215,790],[1250,745],[1285,790]],f)+`<g class="sails" style="transform-origin:1250px 770px">${[0,90,180,270].map(a=>`<rect x="1244" y="600" width="12" height="170" fill="${f}" transform="rotate(${a} 1250 770)"/>`).join('')}</g>`+Array.from({length:14},(_,k)=>R(0,960+k*3,1600,1.5,f,'opacity=".5"')).join('')],
  GR:['Parthenon, Athens',(f,p)=>PA('M700 1000Q900 850 1150 830L1380 830Q1520 860 1600 1000Z',p.mid)+R(1120,800,280,30,f)+R(1110,826,300,10,f)+[0,1,2,3,4,5,6,7].map(k=>R(1130+k*36,700,14,100,f)).join('')+R(1120,684,280,18,f)+P([[1120,684],[1260,640],[1400,684]],f)],
  RU:["St Basil's Cathedral, Moscow",f=>R(1120,860,280,140,f)+[[1150,90,22],[1200,150,26],[1260,230,30],[1320,150,26],[1370,90,22]].map(([x,h,r])=>R(x-r*.7,860-h,r*1.4,h,f)+onion(x,r,860-h,f)).join('')],
  CA:['CN Tower, Toronto',f=>P([[1236,1000],[1244,620],[1256,620],[1264,1000]],f)+PA('M1222 640Q1250 600 1278 640Q1250 660 1222 640Z',f)+R(1248,380,4,240,f)+town(rng(11),1000,1220,1000,f)+town(rng(12),1280,1500,1000,f)],
  PE:['Machu Picchu',(f,p)=>PA('M1050 1000Q1150 820 1240 700Q1280 600 1320 560Q1360 600 1380 700Q1420 860 1500 1000Z',f)+PA('M700 1000Q860 850 1000 860Q1100 880 1200 1000Z',p.mid)+Array.from({length:6},(_,k)=>R(820+k*30,900+k*12,260-k*40,4,f,'opacity=".7"')).join('')],
  KH:['Angkor Wat',f=>R(1060,930,380,70,f)+R(1100,880,300,50,f)+[[1130,120],[1190,160],[1250,230],[1310,160],[1370,120]].map(([x,h])=>PA(`M${x-22} 880C${x-26} ${880-h*.5} ${x-12} ${880-h*.8} ${x} ${880-h}C${x+12} ${880-h*.8} ${x+26} ${880-h*.5} ${x+22} 880Z`,f)).join('')],
  TR:['Hagia Sophia, Istanbul',f=>R(1110,860,280,140,f)+dome(1250,110,860,f,.62)+dome(1160,50,880,f,.6)+dome(1340,50,880,f,.6)+R(1246,778,8,22,f)+minaret(1080,14,280,1000,f)+minaret(1420,14,280,1000,f)+minaret(1110,12,230,1000,f)+minaret(1390,12,230,1000,f)],
  ES:['Sagrada Família, Barcelona',f=>R(1100,860,300,140,f)+[[1130,200],[1170,260],[1210,300],[1250,380],[1290,300],[1330,260],[1370,200]].map(([x,h])=>PA(`M${x-14} 860C${x-14} ${860-h*.6} ${x-6} ${860-h*.9} ${x} ${860-h}C${x+6} ${860-h*.9} ${x+14} ${860-h*.6} ${x+14} 860Z`,f)).join('')],
  CH:['The Matterhorn',(f,p)=>P([[820,1000],[1180,600],[1230,430],[1290,520],[1320,600],[1600,1000]],p.mid)+P([[1150,640],[1180,600],[1230,430],[1290,520],[1300,600],[1260,560],[1220,600]],'#eef0ff','opacity=".5"')+town(rng(5),900,1300,1000,f)],
  KE:['Mount Kilimanjaro and acacia',(f,p)=>PA('M700 1000Q900 800 1050 720L1350 710Q1500 800 1600 1000Z',p.mid)+PA('M1050 722L1350 712L1300 690L1100 692Z','#eef0ff','opacity=".45"')+acacia(1150,110,1000,f)+acacia(420,80,1000,f)],
  TZ:['Mount Kilimanjaro',(f,p)=>PA('M500 1000Q700 790 900 700L1250 692Q1450 790 1600 1000Z',p.mid)+PA('M900 702L1250 694L1200 670L960 672Z','#eef0ff','opacity=".45"')+acacia(1320,100,1000,f)],
  ZA:['Table Mountain, Cape Town',(f,p)=>PA('M500 1000L760 780L800 700L1400 690L1460 780L1600 860L1600 1000Z',p.mid)+town(rng(9),600,1500,1000,f)],
  MX:['Chichén Itzá',f=>[0,1,2,3,4,5,6].map(k=>R(1060+k*26,1000-(k+1)*36,380-k*52,36,f)).join('')+R(1215,712,70,40,f)+P([[1236,1000],[1264,1000],[1264,748],[1236,748]],f,'opacity=".6"')],
  CL:['Moai, Easter Island',f=>[1100,1210,1320,1430].map((x,k)=>{const h=180+(k%2)*30;return PA(`M${x-30} 1000L${x-30} ${1000-h*.55}Q${x-36} ${1000-h} ${x-6} ${1000-h}L${x+20} ${1000-h}Q${x+34} ${1000-h*.8} ${x+26} ${1000-h*.62}L${x+34} ${1000-h*.55}L${x+30} 1000Z`,f);}).join('')],
  TH:['Wat Arun, Bangkok',f=>R(1120,920,260,80,f)+PA('M1210 920C1205 800 1230 700 1250 560C1270 700 1295 800 1290 920Z',f)+[1150,1350].map(x=>PA(`M${x-18} 920C${x-16} 860 ${x-6} 800 ${x} 740C${x+6} 800 ${x+16} 860 ${x+18} 920Z`,f)).join('')],
  MM:['Shwedagon Pagoda, Yangon',f=>R(1120,930,260,70,f)+PA('M1170 930Q1180 840 1250 800Q1320 840 1330 930Z',f)+PA('M1232 805Q1238 700 1250 560Q1262 700 1268 805Z',f)],
  ID:['Borobudur and a volcano',(f,p)=>P([[700,1000],[1050,640],[1120,640],[1480,1000]],p.mid)+[0,1,2,3,4].map(k=>R(1100+k*30,1000-(k+1)*26,300-k*60,26,f)).join('')+PA('M1235 870Q1250 830 1265 870Z',f)+R(1248,812,4,24,f)],
  KR:['Gyeongbokgung Palace, Seoul',(f,p)=>PA('M600 1000Q900 760 1200 820Q1450 760 1600 1000Z',p.mid)+R(1150,900,200,100,f)+PA('M1110 905Q1250 850 1390 905L1370 880Q1250 846 1130 880Z',f)+R(1180,840,140,40,f)+PA('M1150 845Q1250 800 1350 845L1335 826Q1250 800 1165 826Z',f)],
  VN:['Hạ Long Bay',(f,p)=>[[900,180],[1050,280],[1200,220],[1330,340],[1480,200]].map(([x,h],k)=>PA(`M${x-55} 940Q${x-60} ${940-h} ${x} ${940-h}Q${x+60} ${940-h} ${x+55} 940Z`,k%2?f:p.mid)).join('')+R(0,940,1600,60,p.water)],
  JO:['Petra Treasury',(f,p)=>PA('M950 1000L960 600L1550 590L1560 1000Z',p.mid)+R(1150,700,200,300,f)+P([[1140,700],[1250,640],[1360,700]],f)+[0,1,2,3].map(k=>R(1165+k*50,760,12,240,p.mid,'opacity=".7"')).join('')],
  IE:['Cliffs of Moher',(f,p)=>PA('M900 1000L900 760L1000 740L1080 770L1180 730L1300 760L1420 720L1600 740L1600 1000Z',f)+R(0,960,900,40,p.water)],
  BE:['Atomium, Brussels',f=>{const pts=[[1250,560],[1180,640],[1320,640],[1250,720],[1180,800],[1320,800],[1250,880],[1180,720],[1320,720]];return pts.map(([x,y])=>pts.map(([a,b])=>Math.hypot(a-x,b-y)<120&&Math.hypot(a-x,b-y)>0?`<line x1="${x}" y1="${y}" x2="${a}" y2="${b}" stroke="${f}" stroke-width="9"/>`:'').join('')).join('')+pts.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="26" fill="${f}"/>`).join('')+R(1240,880,20,120,f);}],
  DK:['Nyhavn harbour, Copenhagen',(f,p)=>town(rng(21),900,1600,940,f)+R(0,940,1600,60,p.water)+PA('M1000 940L1010 860L1014 860L1014 930L1060 930L1050 950L990 950Z',f)],
  AR:['Obelisco, Buenos Aires',(f,p)=>ridge(rng(31),800,160,140,p.far,true)+P([[1236,1000],[1240,620],[1250,590],[1260,620],[1264,1000]],f)+town(rng(32),980,1520,1000,f)],
  NZ:['Southern Alps',(f,p)=>ridge(rng(41),760,260,120,p.mid,true)+R(0,950,1600,50,p.water)],
  IS:['Northern lights over Iceland',(f,p)=>ridge(rng(51),880,140,160,f,true)],
  NO:['Fjords and northern lights',(f,p)=>PA('M0 1000L0 640L260 700L420 900L420 1000Z',f)+PA('M1600 1000L1600 600L1300 680L1150 900L1150 1000Z',f)+R(0,930,1600,70,p.water)],
  PH:['Chocolate Hills, Bohol',(f,p)=>Array.from({length:9},(_,k)=>dome(700+k*110,46+(k%3)*12,1000,k%2?f:p.mid,1.1)).join('')],
  NP:['Himalayas',(f,p)=>ridge(rng(61),720,330,110,p.mid,true)+R(1240,880,20,120,f)+PA('M1210 900Q1250 830 1290 900Z',f)],
  LK:['Sigiriya, Sri Lanka',(f,p)=>PA('M1120 1000L1150 760Q1160 700 1250 690Q1340 700 1350 760L1380 1000Z',f)+palm(800,180,1000,p.mid)+palm(1500,150,1000,f,-1)],
  PK:['Badshahi Mosque, Lahore',f=>R(1100,860,300,140,f)+onion(1250,48,860,f)+onion(1175,28,860,f)+onion(1325,28,860,f)+minaret(1070,16,260,1000,f)+minaret(1430,16,260,1000,f)],
  SA:['Desert dunes and palms',(f,p)=>palm(1150,220,1000,f)+palm(1240,180,1000,f,-1)],
  CZ:['Prague Castle',f=>town(rng(71),900,1600,1000,f)+R(1200,820,100,180,f)+spire(1215,24,160,820,f)+spire(1285,24,160,820,f)+spire(1250,30,90,820,f)],
  HU:['Hungarian Parliament, Budapest',(f,p)=>R(980,880,540,120,f)+dome(1250,70,880,f,1.2)+spire(1250,20,140,800,f)+[1030,1100,1400,1470].map(x=>spire(x,16,80,880,f)).join('')+R(0,960,1600,40,p.water)],
  PL:['Old Town, Kraków',f=>town(rng(81),900,1600,1000,f)+R(1240,760,40,240,f)+spire(1260,52,120,760,f)],
  AT:['Alps and a chapel',(f,p)=>ridge(rng(91),760,260,130,p.mid,true)+house(1220,60,60,1000,f)+R(1240,860,20,80,f)+spire(1250,28,60,860,f)],
  QA:['Doha skyline',f=>[1080,1150,1210,1270,1340,1410].map((x,k)=>{const h=180+(k*67%5)*50;return k===2?PA(`M${x-22} 1000L${x-22} ${1000-h}Q${x} ${1000-h-60} ${x+22} ${1000-h}L${x+22} 1000Z`,f):R(x-20,1000-h,40,h,f);}).join('')],
  MA:['Hassan II Mosque, Casablanca',(f,p)=>R(1060,900,320,100,f)+minaret(1410,40,380,1000,f)+R(0,960,1060,40,p.water)],
  IR:['Azadi Tower, Tehran',f=>PA('M1150 1000Q1200 820 1220 680L1280 680Q1300 820 1350 1000L1300 1000Q1280 880 1250 860Q1220 880 1200 1000Z',f)+R(1210,660,80,24,f)],
};
L.TZ[0]='Mount Kilimanjaro'; L.FI=['Northern lights and forests',(f,p)=>{const r=rng(13); let s=''; for(let x=0;x<1600;x+=22){const h=60+r()*90; s+=spire(x,26,h,1000,f);} return s;}]; L.SE=L.FI;
export const ISLANDS=new Set('AG BS BB CU DM DO GD HT JM KN LC VC TT FJ KI MH FM NR PW WS SB TO TV VU PG TL MV MU SC CV KM ST BH MT CY BN'.split(' '));
export const MOUNT=new Set('AM GE AZ KG TJ AF BT BO EC CO LS SZ AD LI MN KZ UZ TM SI ME MK AL BA RS ET RW BI'.split(' '));
export function sceneType(c){ if(L[c.code]) return 'land'; if(ISLANDS.has(c.code)) return 'tropic'; if(MOUNT.has(c.code)) return 'mount';
  if(Math.abs(c.lat)>=56) return 'arctic'; if(c.reg===3) return 'desert'; if(c.reg===6) return 'savanna'; if(c.reg===1) return 'europe';
  if(Math.abs(c.lat)<20) return 'tropic'; return 'hills'; }
export const AURORA=new Set(['IS','NO','FI','SE']);
export function sceneSVG(c){
  const base=ccol(c), r=rng(hsh(c.code)*97+13), mix=(a,b,t)=>d3.interpolateRgb(a,b)(t);
  const p={sky0:mix(base,'#04030c',.72),sky1:mix(base,'#0b0920',.12),glow:mix(base,'#ffb35c',.58),far:mix(base,'#05040f',.38),mid:mix(base,'#05040f',.6),sil:mix(base,'#030208',.84),water:mix(base,'#05040f',.55)};
  const type=sceneType(c), aur=AURORA.has(c.code)||type==='arctic', id='g'+c.code;
  let stars=''; for(let k=0;k<70;k++){ stars+=`<circle cx="${(r()*1600).toFixed(0)}" cy="${(r()*560).toFixed(0)}" r="${(r()*1.4+.3).toFixed(2)}" fill="#fff" opacity="${(r()*.6+.2).toFixed(2)}" class="${k%5?'':'tw'}" style="animation-delay:${(r()*4).toFixed(2)}s"/>`; }
  const sunX=180+r()*260, sunY=640+r()*120;
  let back=ridge(rng(hsh(c.code)+1),type==='mount'||type==='arctic'?760:860,type==='mount'||type==='arctic'?240:90,type==='mount'||type==='arctic'?120:170,p.far,type==='mount'||type==='arctic');
  let fore='';
  if(type==='land'){ const lm=L[c.code]; fore=lm[1](p.sil,p); }
  else if(type==='tropic') fore=R(0,930,1600,70,p.water)+PA('M900 940Q1100 820 1300 830Q1450 850 1560 940Z',p.mid)+palm(1180,230,930,p.sil)+palm(1260,190,930,p.sil,-1)+palm(1360,150,935,p.sil);
  else if(type==='mount') fore=ridge(rng(hsh(c.code)+2),820,220,110,p.mid,true);
  else if(type==='arctic') fore=ridge(rng(hsh(c.code)+3),900,120,140,p.mid,true);
  else if(type==='desert') fore=PA('M0 1000L0 900Q300 820 600 900T1200 880T1600 890L1600 1000Z',p.mid)+palm(1200,200,960,p.sil)+palm(1290,160,960,p.sil,-1);
  else if(type==='savanna') fore=acacia(1180,130,1000,p.sil)+acacia(1420,90,1000,p.sil)+acacia(380,70,1000,p.sil);
  else if(type==='europe') fore=PA('M0 1000L0 900Q400 840 800 880T1600 870L1600 1000Z',p.mid)+town(rng(hsh(c.code)+4),980,1560,1000,p.sil);
  else fore=PA('M0 1000L0 880Q400 800 800 860T1600 850L1600 1000Z',p.mid);
  const cap=type==='land'?L[c.code][0]:'';
  const aurora=aur?`<g class="aurora" opacity=".55"><path d="M0 380Q300 240 600 340T1200 300T1600 260L1600 420Q1200 460 900 420T300 470T0 470Z" fill="url(#au${id})"/></g>`:'';
  return {cap,svg:`<svg viewBox="0 0 1600 1150" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs>
    <linearGradient id="s${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky0}"/><stop offset=".62" stop-color="${p.sky1}"/><stop offset="1" stop-color="${p.glow}"/></linearGradient>
    <radialGradient id="sun${id}"><stop offset="0" stop-color="#ffe6b0" stop-opacity=".9"/><stop offset=".25" stop-color="${p.glow}" stop-opacity=".55"/><stop offset="1" stop-color="${p.glow}" stop-opacity="0"/></radialGradient>
    <linearGradient id="au${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3dffb0" stop-opacity="0"/><stop offset=".3" stop-color="#3dffb0" stop-opacity=".6"/><stop offset=".7" stop-color="#8f6bff" stop-opacity=".5"/><stop offset="1" stop-color="#8f6bff" stop-opacity="0"/></linearGradient></defs>
    <rect width="1600" height="1000" fill="url(#s${id})"/>${stars}${aurora}
    <circle cx="${sunX.toFixed(0)}" cy="${sunY.toFixed(0)}" r="230" fill="url(#sun${id})"/><circle cx="${sunX.toFixed(0)}" cy="${sunY.toFixed(0)}" r="34" fill="#ffd89a" opacity=".85"/>
    <g class="cloud"><ellipse cx="500" cy="300" rx="190" ry="16" fill="#fff" opacity=".05"/><ellipse cx="1150" cy="220" rx="240" ry="14" fill="#fff" opacity=".04"/></g>
    ${back}<g class="lm">${fore}</g>${ground(p.sil)}<rect x="0" y="999" width="1600" height="160" fill="${p.sil}"/></svg>`};
}
export let sceneCur=null, sceneTimer=null;
export function showScene(c){
  const host=document.getElementById('vscene'); if(!host) return;
  const {svg,cap}=sceneSVG(c);
  const layer=document.createElement('div'); layer.className='vlayer'; layer.innerHTML=svg; host.appendChild(layer);
  void layer.offsetWidth; layer.classList.add('in');
  const old=sceneCur; sceneCur=layer; if(old){ old.classList.remove('in'); old.classList.add('out'); setTimeout(()=>old.remove(),1200); }
  const capEl=document.getElementById('vcap'); capEl.classList.remove('show');
  clearTimeout(sceneTimer); sceneTimer=setTimeout(()=>{ if(sceneCur!==layer||layer.dataset.photo) return; capEl.textContent=cap?`Illustration: ${cap}`:''; if(cap) capEl.classList.add('show'); },380);
  // swap in a real photo when one is available; the illustration stays as the fallback
  getPhoto(c.code).then(ph=>{
    if(!ph||sceneCur!==layer) return;
    const img=new Image(); img.decoding='async';
    img.onload=()=>{
      if(sceneCur!==layer) return;
      const el=document.createElement('div'); el.className='vphoto'; el.style.backgroundImage=`url("${ph.url}")`; layer.appendChild(el);
      layer.dataset.photo='1'; requestAnimationFrame(()=>el.classList.add('in'));
      capEl.innerHTML=`Photo: <a href="${esc(ph.source||'#')}" target="_blank" rel="noopener">${esc(ph.title)}</a> by ${esc(ph.artist)}, ${esc(ph.license)}`;
      capEl.classList.add('show');
    };
    img.src=ph.url;
  });
}
