(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=class{ctx=null;master;sfx;amb;noise;hiss;wind;breath;crackleT=0;birdT=2;stepT=0;volume=.8;effects=1;muted=!1;listener={x:0,z:0,yaw:0};unlock(){if(this.ctx){this.ctx.state===`suspended`&&this.ctx.resume();return}let e=window.AudioContext||window.webkitAudioContext;if(!e)return;let t=this.ctx=new e;this.master=t.createGain(),this.master.connect(t.destination),this.sfx=t.createGain(),this.sfx.connect(this.master),this.amb=t.createGain(),this.amb.connect(this.master);let n=t.sampleRate*2;this.noise=t.createBuffer(1,n,t.sampleRate);let r=this.noise.getChannelData(0);for(let e=0;e<n;e++)r[e]=Math.random()*2-1;this.hiss=this.loop(2600,`highpass`,0),this.wind=this.loop(320,`lowpass`,.05),this.breath=this.loop(900,`bandpass`,0),this.applyVolume()}loop(e,t,n){let r=this.ctx,i=r.createBufferSource();i.buffer=this.noise,i.loop=!0;let a=r.createBiquadFilter();a.type=t,a.frequency.value=e;let o=r.createGain();return o.gain.value=n,i.connect(a).connect(o).connect(this.amb),i.start(),o}applyVolume(){this.ctx&&(this.master.gain.value=this.muted?0:this.volume,this.sfx.gain.value=this.effects)}suspend(e){this.ctx&&(e?this.ctx.suspend():this.ctx.resume())}place(e,t,n){let r=this.listener,i=e-r.x,a=t-r.z,o=Math.hypot(i,a),s=Math.cos(r.yaw),c=-Math.sin(r.yaw),l=o<.3?0:(i*s+a*c)/o;return{pan:Math.max(-1,Math.min(1,l)),gain:Math.max(0,1-o/n)**1.5}}out(e,t){let n=this.ctx,r=n.createGain();if(r.gain.value=t,n.createStereoPanner){let t=n.createStereoPanner();t.pan.value=e,r.connect(t).connect(this.sfx)}else r.connect(this.sfx);return r}tone(e,t,n,r,i,a=`sine`,o=0){let s=this.ctx,c=s.currentTime+o,l=s.createOscillator();l.type=a,l.frequency.setValueAtTime(t,c),n!==t&&l.frequency.exponentialRampToValueAtTime(Math.max(1,n),c+r);let u=s.createGain();u.gain.setValueAtTime(1e-4,c),u.gain.exponentialRampToValueAtTime(i,c+.006),u.gain.exponentialRampToValueAtTime(1e-4,c+r),l.connect(u).connect(e),l.start(c),l.stop(c+r+.05)}burst(e,t,n,r,i,a=`bandpass`,o=0){let s=this.ctx,c=s.currentTime+o,l=s.createBufferSource();l.buffer=this.noise,l.loopStart=Math.random();let u=s.createBiquadFilter();u.type=a,u.frequency.value=t,u.Q.value=n;let d=s.createGain();d.gain.setValueAtTime(i,c),d.gain.exponentialRampToValueAtTime(1e-4,c+r),l.connect(u).connect(d).connect(e),l.start(c,Math.random()*1.5,r+.05)}bell(e,t,n,r,i=0){for(let[a,o,s]of[[1,1,1],[2,.55,.8],[2.76,.4,.6],[5.4,.22,.35],[8.9,.1,.2]])this.tone(e,t*a,t*a*.997,n*s,r*o,`sine`,i);this.burst(e,t*6,2,.03,r*.5,`bandpass`,i)}chop(){if(!this.ctx)return;let e=this.out(.15,.9);this.tone(e,150,70,.12,.5,`triangle`),this.burst(e,1800,.8,.07,.5)}timber(){if(!this.ctx)return;let e=this.out(0,.8);for(let t=0;t<5;t++)this.burst(e,900+Math.random()*1500,2,.05,.35,`bandpass`,t*.05);this.tone(e,90,45,.3,.5,`triangle`,.22)}feed(){if(!this.ctx)return;let e=this.out(0,.9);this.burst(e,500,.6,.5,.4,`lowpass`);for(let t=0;t<6;t++)this.burst(e,2500+Math.random()*3e3,4,.02,.4,`bandpass`,.08+t*.06)}pickup(){if(!this.ctx)return;let e=this.out(0,.6);this.burst(e,3200,5,.05,.4),this.tone(e,1400,1900,.06,.12,`square`,.03)}eat(){if(!this.ctx)return;let e=this.out(0,.5);this.burst(e,700,1.5,.08,.4),this.burst(e,600,1.5,.08,.3,`bandpass`,.14)}click(e=!0){this.ctx&&this.tone(this.out(0,.5),e?1900:1300,e?1700:1100,.03,.2,`square`)}deny(){this.ctx&&this.tone(this.out(0,.5),180,140,.09,.2,`square`)}torch(){this.ctx&&this.burst(this.out(0,.8),900,.5,.6,.4,`lowpass`)}chime(e,t){if(!this.ctx)return;let n=this.place(e,t,38);this.bell(this.out(n.pan,.25+n.gain*.75),640,1.4,.3)}strike(e,t){if(!this.ctx)return;let n=this.place(e,t,44),r=this.out(n.pan,.45+n.gain*.55);this.bell(r,262,1.7,.5),this.tone(r,82,50,.3,.6,`triangle`)}tin(e,t){if(!this.ctx)return;let n=this.place(e,t,40),r=this.out(n.pan,.3+n.gain*.7);for(let e=0;e<4;e++)this.tone(r,3100+Math.random()*900,2900,.12,.16,`triangle`,e*.11),this.tone(r,5200+Math.random()*800,5e3,.07,.08,`sine`,e*.11)}deerStep(e,t,n){if(!this.ctx)return;let r=this.place(e,t,26);if(r.gain<=.01)return;let i=this.out(r.pan,r.gain);this.tone(i,n?95:70,38,.16,n?.75:.5,`triangle`),this.burst(i,500,.7,.06,.25,`lowpass`)}swing(e,t){if(!this.ctx)return;let n=this.place(e,t,20);this.burst(this.out(n.pan,.9),700,.7,.45,.5,`bandpass`,.25)}hit(){if(!this.ctx)return;let e=this.out(0,1);this.tone(e,110,35,.35,.9,`triangle`);for(let t=0;t<4;t++)this.burst(e,1500+Math.random()*2500,3,.04,.5,`bandpass`,t*.03)}trapSnap(e,t){if(!this.ctx)return;let n=this.place(e,t,40),r=this.out(n.pan,.4+n.gain*.6);this.burst(r,4200,3,.05,.9,`highpass`),this.tone(r,1750,1500,.2,.3,`square`)}trapSet(){if(!this.ctx)return;let e=this.out(0,.7);this.burst(e,3e3,4,.03,.5),this.tone(e,900,700,.05,.15,`square`,.02)}flare(e,t){if(!this.ctx)return;let n=this.place(e,t,50),r=this.out(n.pan,.9);this.burst(r,1200,.5,.15,.5,`highpass`),this.burst(r,300,.5,.9,.9,`lowpass`,.12),this.tone(r,900,200,.5,.25,`sawtooth`,.12)}stunned(){if(!this.ctx)return;this.listener;let e=this.out(0,.7);this.bell(e,180,.9,.35),this.burst(e,400,.6,.35,.4,`lowpass`)}dawn(){if(!this.ctx)return;let e=this.out(0,.7);[392,494,587,784].forEach((t,n)=>this.tone(e,t,t,1.6,.14,`sine`,n*.16))}bank(){if(!this.ctx)return;let e=this.out(0,.6);this.tone(e,2100,2100,.3,.14,`triangle`),this.tone(e,3150,3150,.4,.1,`triangle`,.09)}death(){if(!this.ctx)return;let e=this.out(0,1);this.tone(e,140,30,1.2,.7,`sawtooth`),this.bell(e,131,3,.4,.3)}cardPick(){if(!this.ctx)return;let e=this.out(0,.6);this.tone(e,660,660,.25,.16,`triangle`),this.tone(e,990,990,.35,.12,`triangle`,.08)}playerStep(e){this.ctx&&this.burst(this.out((Math.random()-.5)*.3,e?.32:.2),260+Math.random()*120,.8,.07,.8,`lowpass`)}ambient(e,t){if(!this.ctx||!t.active)return;let n=Math.max(0,1-t.fireDist/16),r=this.ctx.currentTime;if(this.hiss.gain.setTargetAtTime(t.fuel>0&&!t.bright?.05*n:.006*n*(t.fuel>0),r,.3),this.wind.gain.setTargetAtTime(.035+.05*t.night,r,1),this.breath.gain.setTargetAtTime(t.stamina<35?.05*(.5+.5*Math.sin(r*5.5))*(1-t.stamina/35):0,r,.08),this.crackleT-=e,this.crackleT<=0&&t.fuel>0&&(this.crackleT=(t.bright?.12:.5)+Math.random()*(t.bright?.45:.9),n>.02&&this.burst(this.out((Math.random()-.5)*.4,n*(t.bright?.5:.25)),1800+Math.random()*4e3,6,.018,.9)),this.birdT-=e,this.birdT<=0&&(this.birdT=1.5+Math.random()*4,t.birds)){let e=this.out(Math.random()*2-1,.12),t=2400+Math.random()*1800,n=2+Math.floor(Math.random()*3);for(let r=0;r<n;r++)this.tone(e,t,t*(.8+Math.random()*.5),.07,.3,`sine`,r*.1)}t.speed>.5?(this.stepT-=e*(t.sprint?1.5:1),this.stepT<=0&&(this.stepT=.46,this.playerStep(t.sprint))):this.stepT=.1}},t=1/30,n={cycle:{daySeconds:60,nightSeconds:90,lastNight:99},world:{radius:36,eyeHeight:1.65,playerRadius:.35},player:{walk:4,sprint:6.2,sprintCost:16,staminaMax:100,staminaRegen:12,staminaRegenDelay:1,staminaUnlock:20,hpMax:100,reach:2,chopSeconds:2,pickupSeconds:.4,eatSeconds:.5,berryHp:18,berryStamina:25,invulnSeconds:1.2},limits:{logs:6,scrap:8,berries:3,traps:2,flares:2,placedTraps:2},fire:{start:42,max:75,burnDay:.15,burnNightBase:.64,burnNightPerNight:.003,fuelPerLog:20,weakAt:24,brightAt:30,radiusBase:2.5,radiusPerFuel:.08,bankRadius:2},flashlight:{max:100,drain:1.25,range:14,coneDeg:36,dawnCharge:35,revealSeconds:1},torch:{seconds:18,light:7},trap:{cost:2,craftSeconds:1,placeSeconds:.8,placeRange:2.5,armSeconds:.7,radius:.8,stun:3},flare:{cost:2,craftSeconds:1,range:18,radius:4,stun:2},recharge:{cost:1,amount:40,seconds:1.5},pulse:{cost:20,stun:1.3,cooldown:20},bench:{leave:2.5},cache:{times:[22,58],openSeconds:12,cueLead:1},deer:{appearSeconds:4,threatBase:8,threatPerNight:.04,threatDecay:20,threatTrigger:32,sight:22,hearStep:6,hearRun:12,hearChop:16,cueSeconds:1.2,huntBase:4.9,huntPerNight:.01,walk:2.6,stalkSpeed:3.2,swingRange:2,swingSeconds:.65,swingArcDeg:70,swingGap:2.4,damage:40,lostSeconds:4,retreatSeconds:3,patrolSeconds:4,ringMin:18,ringMax:26,stalkMin:2,stalkMax:5,radius:.55,chargeSpeed:8,chargeSeconds:.8,recoverSeconds:3,maneuverGap:6},revive:{scrap:4,hp:50,fuel:42,shield:4},reroll:{scrap:2},draft:{weights:{common:.6,rare:.3,epic:.1},slots:4}},r=[{id:`C01`,rarity:`common`,tag:`fire`,kind:`passive`,stat:`fuel`,from:`20`,to:`24`},{id:`C02`,rarity:`common`,tag:`fire`,kind:`passive`,stat:`chop`,from:`2 s`,to:`1.5 s`},{id:`C03`,rarity:`common`,tag:`beam`,kind:`passive`,stat:`beamDrain`,from:`1.25`,to:`1`},{id:`C04`,rarity:`common`,tag:`run`,kind:`passive`,stat:`sprintCost`,from:`16`,to:`12`},{id:`C05`,rarity:`common`,tag:`traps`,kind:`passive`,stat:`trapStun`,from:`3 s`,to:`4 s`},{id:`C06`,rarity:`common`,tag:`run`,kind:`passive`,stat:`berry`,from:`18 / 25`,to:`28 / 35`},{id:`C07`,rarity:`common`,tag:`supply`,kind:`supply`,stat:`logsNow`,from:``,to:`+2`},{id:`C08`,rarity:`common`,tag:`supply`,kind:`supply`,stat:`scrapNow`,from:``,to:`+2`},{id:`R01`,rarity:`rare`,tag:`fire`,kind:`passive`,stat:`radius`,from:`8.5 m`,to:`10.2 m`},{id:`R02`,rarity:`rare`,tag:`traps`,kind:`passive`,stat:`trapCost`,from:`2`,to:`1`},{id:`R03`,rarity:`rare`,tag:`beam`,kind:`passive`,stat:`pulse`,from:``,to:`1.3 s`},{id:`R04`,rarity:`rare`,tag:`run`,kind:`passive`,stat:`sprint`,from:`6.2`,to:`7 m/s`},{id:`R05`,rarity:`rare`,tag:`beam`,kind:`passive`,stat:`beamRange`,from:`14 m`,to:`20 m`},{id:`R06`,rarity:`rare`,tag:`fire`,kind:`passive`,stat:`torch`,from:`18 s`,to:`27 s`},{id:`R07`,rarity:`rare`,tag:`run`,kind:`passive`,stat:`noise`,from:`6 / 12 m`,to:`3 / 6 m`},{id:`E01`,rarity:`epic`,tag:`fire`,kind:`passive`,stat:`ember`,from:``,to:`+14`},{id:`E02`,rarity:`epic`,tag:`traps`,kind:`passive`,stat:`autoTrap`,from:``,to:`+1`},{id:`E03`,rarity:`epic`,tag:`beam`,kind:`passive`,stat:`dynamo`,from:``,to:`+25`},{id:`E04`,rarity:`epic`,tag:`traps`,kind:`passive`,stat:`flare`,from:`4 m · 2 s`,to:`6 m · 2.5 s`}],i=Object.fromEntries(r.map(e=>[e.id,e])),a=[{index:0,firstNight:1,lastNight:9,ability:`direct`},{index:1,firstNight:10,lastNight:19,ability:`feintHop`},{index:2,firstNight:20,lastNight:29,ability:`trapSense`},{index:3,firstNight:30,lastNight:49,ability:`decoyChime`},{index:4,firstNight:50,lastNight:74,ability:`straightCharge`},{index:5,firstNight:75,lastNight:99,ability:`secondLunge`}];function o(e){for(let t=a.length-1;t>=0;t--)if(e>=a[t].firstNight)return t;return 0}function s(e,t){return e===`day`?n.fire.burnDay:n.fire.burnNightBase+n.fire.burnNightPerNight*(t-1)}function c(e,t){return e<=0?0:(n.fire.radiusBase+n.fire.radiusPerFuel*e)*t}function l(e){return n.deer.threatBase+n.deer.threatPerNight*(e-1)}function u(e){return n.deer.huntBase+n.deer.huntPerNight*(e-1)}var d=`belldeer.save.v1`,f=()=>({best:0,runs:0,nights:0,seenStages:[],seals:[],bonusTrap:!1,settings:{lang:null,volume:.8,effects:1,shake:!0,flash:!0,subtitles:!0,lowQuality:!1}});function p(e){let t=e;return!!t&&typeof t.seed==`number`&&typeof t.night==`number`&&t.night>=1&&t.night<=99&&typeof t.fuel==`number`&&!!t.player&&typeof t.player.hp==`number`&&Array.isArray(t.cards)&&t.contentVersion===1&&(t.phase===`day`||t.phase===`night`||t.phase===`draft`||t.phase===`deathOffer`)}function m(){let e=new Map;return{getItem:t=>e.get(t)??null,setItem:(t,n)=>void e.set(t,n)}}var h=class{profile=f();run=null;prev=null;backend;constructor(e){let t=e;if(!t)try{window.localStorage.setItem(`belldeer.probe`,`1`),t=window.localStorage}catch{t=m()}this.backend=t,this.load()}load(){try{let e=this.backend.getItem(d);if(!e)return;let t=JSON.parse(e);if(!t||t.v!==1)return;let n=f();this.profile={...n,...t.profile,settings:{...n.settings,...t.profile?.settings??{}}},this.run=p(t.run)?t.run:p(t.prev)?t.prev:null,this.prev=p(t.prev)?t.prev:null}catch{this.run=null}}write(){try{let e={v:1,profile:this.profile,run:this.run,prev:this.prev};this.backend.setItem(d,JSON.stringify(e))}catch{}}saveRun(e){this.prev=this.run&&this.run.runId===e.runId?this.run:null,this.run=e,this.write()}clearRun(){this.run=null,this.prev=null,this.write()}saveProfile(){this.write()}},g=class{playing=!1;get sdk(){return window.CrazyGames?.SDK}adsEnabled=!1;gameplay(e){if(e!==this.playing){this.playing=e;try{e?this.sdk?.game?.gameplayStart?.():this.sdk?.game?.gameplayStop?.()}catch{}}}},_=[];function v(e,t){_.push({e,t:Math.round(performance.now()),data:t}),_.length>500&&_.shift()}var y=_,b=1e3,x=1001,S=1002,C=1003,w=1004,T=1005,E=1006,D=1007,O=1008,k=1009,A=1010,j=1011,M=1012,ee=1013,te=1014,ne=1015,re=1016,ie=1017,ae=1018,oe=1020,se=35902,N=35899,ce=1021,le=1022,ue=1023,de=1026,fe=1027,pe=1028,me=1029,he=1030,ge=1031,_e=1033,ve=33776,ye=33777,be=33778,xe=33779,Se=35840,Ce=35841,we=35842,Te=35843,Ee=36196,De=37492,Oe=37496,ke=37488,Ae=37489,je=37490,Me=37491,Ne=37808,Pe=37809,Fe=37810,P=37811,Ie=37812,Le=37813,Re=37814,F=37815,ze=37816,I=37817,L=37818,Be=37819,Ve=37820,He=37821,Ue=36492,We=36494,Ge=36495,Ke=36283,qe=36284,Je=36285,Ye=36286,Xe=2300,Ze=2301,Qe=2302,$e=2303,et=2400,tt=2401,nt=2402,rt=3200,it=`srgb`,at=`srgb-linear`,ot=`linear`,st=`srgb`,ct=7680,lt=35044,ut=2e3;function dt(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function ft(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function pt(e){return document.createElementNS(`http://www.w3.org/1999/xhtml`,e)}function mt(){let e=pt(`canvas`);return e.style.display=`block`,e}var ht={};function gt(...e){let t=`THREE.`+e.shift();console.log(t,...e)}function _t(e){let t=e[0];if(typeof t==`string`&&t.startsWith(`TSL:`)){let t=e[1];t&&t.isStackTrace?e[0]+=` `+t.getLocation():e[1]=`Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.`}return e}function R(...e){e=_t(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function z(...e){e=_t(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function vt(...e){let t=e.join(` `);t in ht||(ht[t]=!0,R(...e))}function yt(e,t,n){return new Promise(function(r,i){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:i();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:r()}}setTimeout(a,n)})}var bt={0:0,2:6,4:4,3:5,1:1,6:2,7:7,5:3},xt=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n!==void 0&&n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let r=n[e];if(r!==void 0){let e=r.indexOf(t);e!==-1&&r.splice(e,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let t=n.slice(0);for(let n=0,r=t.length;n<r;n++)t[n].call(this,e);e.target=null}}},St=`00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a.1b.1c.1d.1e.1f.20.21.22.23.24.25.26.27.28.29.2a.2b.2c.2d.2e.2f.30.31.32.33.34.35.36.37.38.39.3a.3b.3c.3d.3e.3f.40.41.42.43.44.45.46.47.48.49.4a.4b.4c.4d.4e.4f.50.51.52.53.54.55.56.57.58.59.5a.5b.5c.5d.5e.5f.60.61.62.63.64.65.66.67.68.69.6a.6b.6c.6d.6e.6f.70.71.72.73.74.75.76.77.78.79.7a.7b.7c.7d.7e.7f.80.81.82.83.84.85.86.87.88.89.8a.8b.8c.8d.8e.8f.90.91.92.93.94.95.96.97.98.99.9a.9b.9c.9d.9e.9f.a0.a1.a2.a3.a4.a5.a6.a7.a8.a9.aa.ab.ac.ad.ae.af.b0.b1.b2.b3.b4.b5.b6.b7.b8.b9.ba.bb.bc.bd.be.bf.c0.c1.c2.c3.c4.c5.c6.c7.c8.c9.ca.cb.cc.cd.ce.cf.d0.d1.d2.d3.d4.d5.d6.d7.d8.d9.da.db.dc.dd.de.df.e0.e1.e2.e3.e4.e5.e6.e7.e8.e9.ea.eb.ec.ed.ee.ef.f0.f1.f2.f3.f4.f5.f6.f7.f8.f9.fa.fb.fc.fd.fe.ff`.split(`.`),Ct=Math.PI/180,wt=180/Math.PI;function Tt(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(St[e&255]+St[e>>8&255]+St[e>>16&255]+St[e>>24&255]+`-`+St[t&255]+St[t>>8&255]+`-`+St[t>>16&15|64]+St[t>>24&255]+`-`+St[n&63|128]+St[n>>8&255]+`-`+St[n>>16&255]+St[n>>24&255]+St[r&255]+St[r>>8&255]+St[r>>16&255]+St[r>>24&255]).toLowerCase()}function Et(e,t,n){return Math.max(t,Math.min(n,e))}function Dt(e,t){return(e%t+t)%t}function Ot(e,t,n){return(1-n)*e+n*t}function kt(e){return 2**Math.floor(Math.log(e)/Math.LN2)}function At(e){switch(e.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function jt(e,t){if(t.constructor===Float32Array)return e;let n=At(t);if(n===void 0)throw Error(`THREE.MathUtils: Invalid component type.`);return Math.max(e/n,-1)}function Mt(e,t){if(t.constructor===Float32Array)return e;let n=At(t);if(n===void 0)throw Error(`THREE.MathUtils: Invalid component type.`);return Math.round(e*n)}var Nt=class{static{this.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw Error(`THREE.Vector2: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw Error(`THREE.Vector2: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Et(this.x,e.x,t.x),this.y=Et(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Et(this.x,e,t),this.y=Et(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Et(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Et(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),r=Math.sin(t),i=this.x-e.x,a=this.y-e.y;return this.x=i*n-a*r+e.x,this.y=i*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Pt=class{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,i,a,o){let s=n[r+0],c=n[r+1],l=n[r+2],u=n[r+3],d=i[a+0],f=i[a+1],p=i[a+2],m=i[a+3];if(u!==m||s!==d||c!==f||l!==p){let e=s*d+c*f+l*p+u*m;e<0&&(d=-d,f=-f,p=-p,m=-m,e=-e);let t=1-o;if(e<.9995){let n=Math.acos(e),r=Math.sin(n);t=Math.sin(t*n)/r,o=Math.sin(o*n)/r,s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o}else{s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o;let e=1/Math.sqrt(s*s+c*c+l*l+u*u);s*=e,c*=e,l*=e,u*=e}}e[t]=s,e[t+1]=c,e[t+2]=l,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,r,i,a){let o=n[r],s=n[r+1],c=n[r+2],l=n[r+3],u=i[a],d=i[a+1],f=i[a+2],p=i[a+3];return e[t]=o*p+l*u+s*f-c*d,e[t+1]=s*p+l*d+c*u-o*f,e[t+2]=c*p+l*f+o*d-s*u,e[t+3]=l*p-o*u-s*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,r=e._y,i=e._z,a=e._order,o=Math.cos,s=Math.sin,c=o(n/2),l=o(r/2),u=o(i/2),d=s(n/2),f=s(r/2),p=s(i/2);switch(a){case`XYZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`YXZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`ZXY`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`ZYX`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`YZX`:this._x=d*l*u+c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u-d*f*p;break;case`XZY`:this._x=d*l*u-c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u+d*f*p;break;default:R(`Quaternion: .setFromEuler() encountered an unknown order: `+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],r=t[4],i=t[8],a=t[1],o=t[5],s=t[9],c=t[2],l=t[6],u=t[10],d=n+o+u;if(d>0){let e=.5/Math.sqrt(d+1);this._w=.25/e,this._x=(l-s)*e,this._y=(i-c)*e,this._z=(a-r)*e}else if(n>o&&n>u){let e=2*Math.sqrt(1+n-o-u);this._w=(l-s)/e,this._x=.25*e,this._y=(r+a)/e,this._z=(i+c)/e}else if(o>u){let e=2*Math.sqrt(1+o-n-u);this._w=(i-c)/e,this._x=(r+a)/e,this._y=.25*e,this._z=(s+l)/e}else{let e=2*Math.sqrt(1+u-n-o);this._w=(a-r)/e,this._x=(i+c)/e,this._y=(s+l)/e,this._z=.25*e}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Et(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x*=e,this._y*=e,this._z*=e,this._w*=e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=t._x,s=t._y,c=t._z,l=t._w;return this._x=n*l+a*o+r*c-i*s,this._y=r*l+a*s+i*o-n*c,this._z=i*l+a*c+n*s-r*o,this._w=a*l-n*o-r*s-i*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,i=-i,a=-a,o=-o);let s=1-t;if(o<.9995){let e=Math.acos(o),c=Math.sin(e);s=Math.sin(s*e)/c,t=Math.sin(t*e)/c,this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this._onChangeCallback()}else this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),i=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},B=class{static{this.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw Error(`THREE.Vector3: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error(`THREE.Vector3: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(It.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(It.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6]*r,this.y=i[1]*t+i[4]*n+i[7]*r,this.z=i[2]*t+i[5]*n+i[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=e.elements,a=1/(i[3]*t+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*t+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*t+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*t+i[6]*n+i[10]*r+i[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,r=this.z,i=e.x,a=e.y,o=e.z,s=e.w,c=2*(a*r-o*n),l=2*(o*t-i*r),u=2*(i*n-a*t);return this.x=t+s*c+a*u-o*l,this.y=n+s*l+o*c-i*u,this.z=r+s*u+i*l-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[4]*n+i[8]*r,this.y=i[1]*t+i[5]*n+i[9]*r,this.z=i[2]*t+i[6]*n+i[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Et(this.x,e.x,t.x),this.y=Et(this.y,e.y,t.y),this.z=Et(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Et(this.x,e,t),this.y=Et(this.y,e,t),this.z=Et(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Et(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,r=e.y,i=e.z,a=t.x,o=t.y,s=t.z;return this.x=r*s-i*o,this.y=i*a-n*s,this.z=n*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Ft.copy(this).projectOnVector(e),this.sub(Ft)}reflect(e){return this.sub(Ft.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Et(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Ft=new B,It=new Pt,V=class{static{this.prototype.isMatrix3=!0}constructor(e,t,n,r,i,a,o,s,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c)}set(e,t,n,r,i,a,o,s,c){let l=this.elements;return l[0]=e,l[1]=r,l[2]=o,l[3]=t,l[4]=i,l[5]=s,l[6]=n,l[7]=a,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[3],s=n[6],c=n[1],l=n[4],u=n[7],d=n[2],f=n[5],p=n[8],m=r[0],h=r[3],g=r[6],_=r[1],v=r[4],y=r[7],b=r[2],x=r[5],S=r[8];return i[0]=a*m+o*_+s*b,i[3]=a*h+o*v+s*x,i[6]=a*g+o*y+s*S,i[1]=c*m+l*_+u*b,i[4]=c*h+l*v+u*x,i[7]=c*g+l*y+u*S,i[2]=d*m+f*_+p*b,i[5]=d*h+f*v+p*x,i[8]=d*g+f*y+p*S,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8];return t*a*l-t*o*c-n*i*l+n*o*s+r*i*c-r*a*s}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=l*a-o*c,d=o*s-l*i,f=c*i-a*s,p=t*u+n*d+r*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=u*m,e[1]=(r*c-l*n)*m,e[2]=(o*n-r*a)*m,e[3]=d*m,e[4]=(l*t-r*s)*m,e[5]=(r*i-o*t)*m,e[6]=f*m,e[7]=(n*s-c*t)*m,e[8]=(a*t-n*i)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,i,a,o){let s=Math.cos(i),c=Math.sin(i);return this.set(n*s,n*c,-n*(s*a+c*o)+a+e,-r*c,r*s,-r*(-c*a+s*o)+o+t,0,0,1),this}scale(e,t){return vt(`Matrix3: .scale() is deprecated. Use .makeScale() instead.`),this.premultiply(Lt.makeScale(e,t)),this}rotate(e){return vt(`Matrix3: .rotate() is deprecated. Use .makeRotation() instead.`),this.premultiply(Lt.makeRotation(-e)),this}translate(e,t){return vt(`Matrix3: .translate() is deprecated. Use .makeTranslation() instead.`),this.premultiply(Lt.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<9;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Lt=new V,Rt=new V().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),zt=new V().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Bt(){let e={enabled:!0,workingColorSpace:at,spaces:{},convert:function(e,t,n){return this.enabled===!1||t===n||!t||!n||(this.spaces[t].transfer===`srgb`&&(e.r=Ht(e.r),e.g=Ht(e.g),e.b=Ht(e.b)),this.spaces[t].primaries!==this.spaces[n].primaries&&(e.applyMatrix3(this.spaces[t].toXYZ),e.applyMatrix3(this.spaces[n].fromXYZ)),this.spaces[n].transfer===`srgb`&&(e.r=Ut(e.r),e.g=Ut(e.g),e.b=Ut(e.b))),e},workingToColorSpace:function(e,t){return this.convert(e,this.workingColorSpace,t)},colorSpaceToWorking:function(e,t){return this.convert(e,t,this.workingColorSpace)},getPrimaries:function(e){return this.spaces[e].primaries},getTransfer:function(e){return e===``?ot:this.spaces[e].transfer},getToneMappingMode:function(e){return this.spaces[e].outputColorSpaceConfig.toneMappingMode||`standard`},getLuminanceCoefficients:function(e,t=this.workingColorSpace){return e.fromArray(this.spaces[t].luminanceCoefficients)},define:function(e){Object.assign(this.spaces,e)},_getMatrix:function(e,t,n){return e.copy(this.spaces[n].fromXYZ).multiply(this.spaces[t].toXYZ)},_getDrawingBufferColorSpace:function(e){return this.spaces[e].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(e=this.workingColorSpace){return this.spaces[e].workingColorSpaceConfig.unpackColorSpace}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],r=[.3127,.329];return e.define({[at]:{primaries:t,whitePoint:r,transfer:ot,toXYZ:Rt,fromXYZ:zt,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:it},outputColorSpaceConfig:{drawingBufferColorSpace:it}},[it]:{primaries:t,whitePoint:r,transfer:st,toXYZ:Rt,fromXYZ:zt,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:it}}}),e}var Vt=Bt();function Ht(e){return e<.04045?e*.0773993808:(e*.9478672986+.0521327014)**2.4}function Ut(e){return e<.0031308?e*12.92:1.055*e**.41666-.055}var Wt,Gt=class{static getDataURL(e,t=`image/png`){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>`u`)return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{Wt===void 0&&(Wt=pt(`canvas`)),Wt.width=e.width,Wt.height=e.height;let t=Wt.getContext(`2d`);e instanceof ImageData?t.putImageData(e,0,0):t.drawImage(e,0,0,e.width,e.height),n=Wt}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap){let t=pt(`canvas`);t.width=e.width,t.height=e.height;let n=t.getContext(`2d`);n.drawImage(e,0,0,e.width,e.height);let r=n.getImageData(0,0,e.width,e.height),i=r.data;for(let e=0;e<i.length;e++)i[e]=Ht(i[e]/255)*255;return n.putImageData(r,0,0),t}if(e.data){let t=e.data.slice(0);for(let e=0;e<t.length;e++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[e]=Math.floor(Ht(t[e]/255)*255):t[e]=Ht(t[e]);return{data:t,width:e.width,height:e.height}}return R(`ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`),e}},Kt=0,qt=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Kt++}),this.uuid=Tt(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<`u`&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<`u`&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t===null?e.set(0,0,0):e.set(t.width||0,t.height||0,t.depth||0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:``},r=this.data;if(r!==null){let e;if(Array.isArray(r)){e=[];for(let t=0,n=r.length;t<n;t++)r[t].isDataTexture?e.push(Jt(r[t].image)):e.push(Jt(r[t]))}else e=Jt(r);n.url=e}return t||(e.images[this.uuid]=n),n}};function Jt(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap?Gt.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(R(`Texture: Unable to serialize Texture.`),{})}var Yt=0,Xt=new B,Zt=class e extends xt{constructor(t=e.DEFAULT_IMAGE,n=e.DEFAULT_MAPPING,r=x,i=x,a=E,o=O,s=ue,c=k,l=e.DEFAULT_ANISOTROPY,u=``){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Yt++}),this.uuid=Tt(),this.name=``,this.source=new qt(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=r,this.wrapT=i,this.magFilter=a,this.minFilter=o,this.anisotropy=l,this.format=s,this.internalFormat=null,this.type=c,this.offset=new Nt(0,0),this.repeat=new Nt(1,1),this.center=new Nt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new V,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(Xt).x}get height(){return this.source.getSize(Xt).y}get depth(){return this.source.getSize(Xt).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.mipmapsAutoUpdate=e.mipmapsAutoUpdate,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isPMREMTexture=e.isPMREMTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){R(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?R(`Texture.setValues(): property '${t}' does not exist.`):r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:`Texture`,generator:`Texture.toJSON`},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:`dispose`})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case b:e.x-=Math.floor(e.x);break;case x:e.x=e.x<0?0:1;break;case S:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x-=Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case b:e.y-=Math.floor(e.y);break;case x:e.y=e.y<0?0:1;break;case S:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y-=Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Zt.DEFAULT_IMAGE=null,Zt.DEFAULT_MAPPING=300,Zt.DEFAULT_ANISOTROPY=1;var Qt=class{static{this.prototype.isVector4=!0}constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error(`THREE.Vector4: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error(`THREE.Vector4: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w===void 0?1:e.w,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*i,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*i,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*i,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*i,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,i,a=.01,o=.1,s=e.elements,c=s[0],l=s[4],u=s[8],d=s[1],f=s[5],p=s[9],m=s[2],h=s[6],g=s[10];if(Math.abs(l-d)<a&&Math.abs(u-m)<a&&Math.abs(p-h)<a){if(Math.abs(l+d)<o&&Math.abs(u+m)<o&&Math.abs(p+h)<o&&Math.abs(c+f+g-3)<o)return this.set(1,0,0,0),this;t=Math.PI;let e=(c+1)/2,s=(f+1)/2,_=(g+1)/2,v=(l+d)/4,y=(u+m)/4,b=(p+h)/4;return e>s&&e>_?e<a?(n=0,r=.707106781,i=.707106781):(n=Math.sqrt(e),r=v/n,i=y/n):s>_?s<a?(n=.707106781,r=0,i=.707106781):(r=Math.sqrt(s),n=v/r,i=b/r):_<a?(n=.707106781,r=.707106781,i=0):(i=Math.sqrt(_),n=y/i,r=b/i),this.set(n,r,i,t),this}let _=Math.sqrt((h-p)*(h-p)+(u-m)*(u-m)+(d-l)*(d-l));return Math.abs(_)<.001&&(_=1),this.x=(h-p)/_,this.y=(u-m)/_,this.z=(d-l)/_,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Et(this.x,e.x,t.x),this.y=Et(this.y,e.y,t.y),this.z=Et(this.z,e.z,t.z),this.w=Et(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Et(this.x,e,t),this.y=Et(this.y,e,t),this.z=Et(this.z,e,t),this.w=Et(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Et(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},$t=class extends xt{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:E,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new Qt(0,0,e,t),this.scissorTest=!1,this.viewport=new Qt(0,0,e,t),this.textures=[];let r=n.count;for(let i=0;i<r;i++)this.textures[i]=new Zt({width:e,height:t,depth:n.depth}),this.textures[i].isRenderTargetTexture=!0,this.textures[i].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:E,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.mipmapsAutoUpdate!==void 0&&(t.mipmapsAutoUpdate=e.mipmapsAutoUpdate),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let e=0;e<this.textures.length;e++)this.textures[e].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,i=this.textures.length;r<i;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let n=Object.assign({},e.textures[t].image);this.textures[t].source=new qt(n)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null){if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture}else this.depthTexture=null;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:`dispose`})}},en=class extends $t{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},tn=class extends Zt{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=C,this.minFilter=C,this.wrapR=x,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},nn=class extends Zt{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=C,this.minFilter=C,this.wrapR=x,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}},rn=class e{static{this.prototype.isMatrix4=!0}constructor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h)}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=r,g[1]=i,g[5]=a,g[9]=o,g[13]=s,g[2]=c,g[6]=l,g[10]=u,g[14]=d,g[3]=f,g[7]=p,g[11]=m,g[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new e().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,r=1/an.setFromMatrixColumn(e,0).length(),i=1/an.setFromMatrixColumn(e,1).length(),a=1/an.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*i,t[5]=n[5]*i,t[6]=n[6]*i,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,r=e.y,i=e.z,a=Math.cos(n),o=Math.sin(n),s=Math.cos(r),c=Math.sin(r),l=Math.cos(i),u=Math.sin(i);if(e.order===`XYZ`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=-s*u,t[8]=c,t[1]=n+r*c,t[5]=e-i*c,t[9]=-o*s,t[2]=i-e*c,t[6]=r+n*c,t[10]=a*s}else if(e.order===`YXZ`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e+i*o,t[4]=r*o-n,t[8]=a*c,t[1]=a*u,t[5]=a*l,t[9]=-o,t[2]=n*o-r,t[6]=i+e*o,t[10]=a*s}else if(e.order===`ZXY`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e-i*o,t[4]=-a*u,t[8]=r+n*o,t[1]=n+r*o,t[5]=a*l,t[9]=i-e*o,t[2]=-a*c,t[6]=o,t[10]=a*s}else if(e.order===`ZYX`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=r*c-n,t[8]=e*c+i,t[1]=s*u,t[5]=i*c+e,t[9]=n*c-r,t[2]=-c,t[6]=o*s,t[10]=a*s}else if(e.order===`YZX`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=i-e*u,t[8]=r*u+n,t[1]=u,t[5]=a*l,t[9]=-o*l,t[2]=-c*l,t[6]=n*u+r,t[10]=e-i*u}else if(e.order===`XZY`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=-u,t[8]=c*l,t[1]=e*u+i,t[5]=a*l,t[9]=n*u-r,t[2]=r*u-n,t[6]=o*l,t[10]=i*u+e}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(sn,e,cn)}lookAt(e,t,n){let r=this.elements;return dn.subVectors(e,t),dn.lengthSq()===0&&(dn.z=1),dn.normalize(),ln.crossVectors(n,dn),ln.lengthSq()===0&&(Math.abs(n.z)===1?dn.x+=1e-4:dn.z+=1e-4,dn.normalize(),ln.crossVectors(n,dn)),ln.normalize(),un.crossVectors(dn,ln),r[0]=ln.x,r[4]=un.x,r[8]=dn.x,r[1]=ln.y,r[5]=un.y,r[9]=dn.y,r[2]=ln.z,r[6]=un.z,r[10]=dn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[4],s=n[8],c=n[12],l=n[1],u=n[5],d=n[9],f=n[13],p=n[2],m=n[6],h=n[10],g=n[14],_=n[3],v=n[7],y=n[11],b=n[15],x=r[0],S=r[4],C=r[8],w=r[12],T=r[1],E=r[5],D=r[9],O=r[13],k=r[2],A=r[6],j=r[10],M=r[14],ee=r[3],te=r[7],ne=r[11],re=r[15];return i[0]=a*x+o*T+s*k+c*ee,i[4]=a*S+o*E+s*A+c*te,i[8]=a*C+o*D+s*j+c*ne,i[12]=a*w+o*O+s*M+c*re,i[1]=l*x+u*T+d*k+f*ee,i[5]=l*S+u*E+d*A+f*te,i[9]=l*C+u*D+d*j+f*ne,i[13]=l*w+u*O+d*M+f*re,i[2]=p*x+m*T+h*k+g*ee,i[6]=p*S+m*E+h*A+g*te,i[10]=p*C+m*D+h*j+g*ne,i[14]=p*w+m*O+h*M+g*re,i[3]=_*x+v*T+y*k+b*ee,i[7]=_*S+v*E+y*A+b*te,i[11]=_*C+v*D+y*j+b*ne,i[15]=_*w+v*O+y*M+b*re,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[12],a=e[1],o=e[5],s=e[9],c=e[13],l=e[2],u=e[6],d=e[10],f=e[14],p=e[3],m=e[7],h=e[11],g=e[15],_=s*f-c*d,v=o*f-c*u,y=o*d-s*u,b=a*f-c*l,x=a*d-s*l,S=a*u-o*l;return t*(m*_-h*v+g*y)-n*(p*_-h*b+g*x)+r*(p*v-m*b+g*S)-i*(p*y-m*x+h*S)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[1],a=e[5],o=e[9],s=e[2],c=e[6],l=e[10];return t*(a*l-o*c)-n*(i*l-o*s)+r*(i*c-a*s)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=t*c-i*a,b=n*s-r*o,x=n*c-i*o,S=r*c-i*s,C=l*m-u*p,w=l*h-d*p,T=l*g-f*p,E=u*h-d*m,D=u*g-f*m,O=d*g-f*h,k=_*O-v*D+y*E+b*T-x*w+S*C;if(k===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/k;return e[0]=(o*O-s*D+c*E)*A,e[1]=(r*D-n*O-i*E)*A,e[2]=(m*S-h*x+g*b)*A,e[3]=(d*x-u*S-f*b)*A,e[4]=(s*T-a*O-c*w)*A,e[5]=(t*O-r*T+i*w)*A,e[6]=(h*y-p*S-g*v)*A,e[7]=(l*S-d*y+f*v)*A,e[8]=(a*D-o*T+c*C)*A,e[9]=(n*T-t*D-i*C)*A,e[10]=(p*x-m*y+g*_)*A,e[11]=(u*y-l*x-f*_)*A,e[12]=(o*w-a*E-s*C)*A,e[13]=(t*E-n*w+r*C)*A,e[14]=(m*v-p*b-h*_)*A,e[15]=(l*b-u*v+d*_)*A,this}scale(e){let t=this.elements,n=e.x,r=e.y,i=e.z;return t[0]*=n,t[4]*=r,t[8]*=i,t[1]*=n,t[5]*=r,t[9]*=i,t[2]*=n,t[6]*=r,t[10]*=i,t[3]*=n,t[7]*=r,t[11]*=i,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),r=Math.sin(t),i=1-n,a=e.x,o=e.y,s=e.z,c=i*a,l=i*o;return this.set(c*a+n,c*o-r*s,c*s+r*o,0,c*o+r*s,l*o+n,l*s-r*a,0,c*s-r*o,l*s+r*a,i*s*s+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,i,a){return this.set(1,n,i,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){let r=this.elements,i=t._x,a=t._y,o=t._z,s=t._w,c=i+i,l=a+a,u=o+o,d=i*c,f=i*l,p=i*u,m=a*l,h=a*u,g=o*u,_=s*c,v=s*l,y=s*u,b=n.x,x=n.y,S=n.z;return r[0]=(1-(m+g))*b,r[1]=(f+y)*b,r[2]=(p-v)*b,r[3]=0,r[4]=(f-y)*x,r[5]=(1-(d+g))*x,r[6]=(h+_)*x,r[7]=0,r[8]=(p+v)*S,r[9]=(h-_)*S,r[10]=(1-(d+m))*S,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let i=this.determinantAffine();if(i===0)return n.set(1,1,1),t.identity(),this;let a=an.set(r[0],r[1],r[2]).length(),o=an.set(r[4],r[5],r[6]).length(),s=an.set(r[8],r[9],r[10]).length();i<0&&(a=-a),on.copy(this);let c=1/a,l=1/o,u=1/s;return on.elements[0]*=c,on.elements[1]*=c,on.elements[2]*=c,on.elements[4]*=l,on.elements[5]*=l,on.elements[6]*=l,on.elements[8]*=u,on.elements[9]*=u,on.elements[10]*=u,t.setFromRotationMatrix(on),n.x=a,n.y=o,n.z=s,this}makePerspective(e,t,n,r,i,a,o=ut,s=!1){let c=this.elements,l=2*i/(t-e),u=2*i/(n-r),d=(t+e)/(t-e),f=(n+r)/(n-r),p,m;if(s)p=i/(a-i),m=a*i/(a-i);else if(o===2e3)p=-(a+i)/(a-i),m=-2*a*i/(a-i);else if(o===2001)p=-a/(a-i),m=-a*i/(a-i);else throw Error(`THREE.Matrix4.makePerspective(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,i,a,o=ut,s=!1){let c=this.elements,l=2/(t-e),u=2/(n-r),d=-(t+e)/(t-e),f=-(n+r)/(n-r),p,m;if(s)p=1/(a-i),m=a/(a-i);else if(o===2e3)p=-2/(a-i),m=-(a+i)/(a-i);else if(o===2001)p=-1/(a-i),m=-i/(a-i);else throw Error(`THREE.Matrix4.makeOrthographic(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<16;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},an=new B,on=new rn,sn=new B(0,0,0),cn=new B(1,1,1),ln=new B,un=new B,dn=new B,fn=new rn,pn=new Pt,mn=class e{constructor(t=0,n=0,r=0,i=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=r,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let r=e.elements,i=r[0],a=r[4],o=r[8],s=r[1],c=r[5],l=r[9],u=r[2],d=r[6],f=r[10];switch(t){case`XYZ`:this._y=Math.asin(Et(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-l,f),this._z=Math.atan2(-a,i)):(this._x=Math.atan2(d,c),this._z=0);break;case`YXZ`:this._x=Math.asin(-Et(l,-1,1)),Math.abs(l)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(s,c)):(this._y=Math.atan2(-u,i),this._z=0);break;case`ZXY`:this._x=Math.asin(Et(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(s,i));break;case`ZYX`:this._y=Math.asin(-Et(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(s,i)):(this._x=0,this._z=Math.atan2(-a,c));break;case`YZX`:this._z=Math.asin(Et(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,i)):(this._x=0,this._y=Math.atan2(o,f));break;case`XZY`:this._z=Math.asin(-Et(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,i)):(this._x=Math.atan2(-l,f),this._y=0);break;default:R(`Euler: .setFromRotationMatrix() encountered an unknown order: `+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return fn.makeRotationFromQuaternion(e),this.setFromRotationMatrix(fn,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return pn.setFromEuler(this),this.setFromQuaternion(pn,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};mn.DEFAULT_ORDER=`XYZ`;var hn=class{constructor(){this.mask=1}set(e){this.mask=1<<e>>>0}enable(e){this.mask|=1<<e}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e}disable(e){this.mask&=~(1<<e)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return!!(this.mask&1<<e)}},gn=0,_n=new B,vn=new Pt,yn=new rn,bn=new B,xn=new B,Sn=new B,Cn=new Pt,wn=new B(1,0,0),Tn=new B(0,1,0),En=new B(0,0,1),Dn={type:`added`},On={type:`removed`},kn={type:`childadded`,child:null},An={type:`childremoved`,child:null},jn=class e extends xt{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:gn++}),this.uuid=Tt(),this.name=``,this.type=`Object3D`,this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new B,n=new mn,r=new Pt,i=new B(1,1,1);function a(){r.setFromEuler(n,!1)}function o(){n.setFromQuaternion(r,void 0,!1)}n._onChange(a),r._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new rn},normalMatrix:{value:new V}}),this.matrix=new rn,this.matrixWorld=new rn,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new hn,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return vn.setFromAxisAngle(e,t),this.quaternion.multiply(vn),this}rotateOnWorldAxis(e,t){return vn.setFromAxisAngle(e,t),this.quaternion.premultiply(vn),this}rotateX(e){return this.rotateOnAxis(wn,e)}rotateY(e){return this.rotateOnAxis(Tn,e)}rotateZ(e){return this.rotateOnAxis(En,e)}translateOnAxis(e,t){return _n.copy(e).applyQuaternion(this.quaternion),this.position.add(_n.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(wn,e)}translateY(e){return this.translateOnAxis(Tn,e)}translateZ(e){return this.translateOnAxis(En,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(yn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?bn.copy(e):bn.set(e,t,n);let r=this.parent;this.updateWorldMatrix(!0,!1),xn.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?yn.lookAt(xn,bn,this.up):yn.lookAt(bn,xn,this.up),this.quaternion.setFromRotationMatrix(yn),r&&(yn.extractRotation(r.matrixWorld),vn.setFromRotationMatrix(yn),this.quaternion.premultiply(vn.invert()))}add(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return e===this?(z(`Object3D.add: object can't be added as a child of itself.`,e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Dn),kn.child=e,this.dispatchEvent(kn),kn.child=null):z(`Object3D.add: object not an instance of THREE.Object3D.`,e),this)}remove(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.remove(arguments[e]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(On),An.child=e,this.dispatchEvent(An),An.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),yn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),yn.multiply(e.parent.matrixWorld)),e.applyMatrix4(yn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Dn),kn.child=e,this.dispatchEvent(kn),kn.child=null,this}getObjectById(e){return this.getObjectByProperty(`id`,e)}getObjectByName(e){return this.getObjectByProperty(`name`,e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){let r=this.children[n].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let r=this.children;for(let i=0,a=r.length;i<a;i++)r[i].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(xn,e,Sn),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(xn,Cn,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(e){e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,r=e.z,i=this.matrix.elements;i[12]+=t-i[0]*t-i[4]*n-i[8]*r,i[13]+=n-i[1]*t-i[5]*n-i[9]*r,i[14]+=r-i[2]*t-i[6]*n-i[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let e=this.children;for(let t=0,r=e.length;t<r;t++)e[t].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e==`string`,n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:`Object`,generator:`Object3D.toJSON`});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type=`InstancedMesh`,r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type=`BatchedMesh`,r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(e=>({...e,boundingBox:e.boundingBox?e.boundingBox.toJSON():void 0,boundingSphere:e.boundingSphere?e.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(e=>({...e})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function i(t,n){return t[n.uuid]===void 0&&(t[n.uuid]=n.toJSON(e)),n.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=i(e.geometries,this.geometry);let t=this.geometry.parameters;if(t!==void 0&&t.shapes!==void 0){let n=t.shapes;if(Array.isArray(n))for(let t=0,r=n.length;t<r;t++){let r=n[t];i(e.shapes,r)}else i(e.shapes,n)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0){if(Array.isArray(this.material)){let t=[];for(let n=0,r=this.material.length;n<r;n++)t.push(i(e.materials,this.material[n]));r.material=t}else r.material=i(e.materials,this.material)}if(this.children.length>0){r.children=[];for(let t=0;t<this.children.length;t++)r.children.push(this.children[t].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let t=0;t<this.animations.length;t++){let n=this.animations[t];r.animations.push(i(e.animations,n))}}if(t){let t=a(e.geometries),r=a(e.materials),i=a(e.textures),o=a(e.images),s=a(e.shapes),c=a(e.skeletons),l=a(e.animations),u=a(e.nodes);t.length>0&&(n.geometries=t),r.length>0&&(n.materials=r),i.length>0&&(n.textures=i),o.length>0&&(n.images=o),s.length>0&&(n.shapes=s),c.length>0&&(n.skeletons=c),l.length>0&&(n.animations=l),u.length>0&&(n.nodes=u)}return n.object=r,n;function a(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot===null?null:e.pivot.clone(),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let t=0;t<e.children.length;t++){let n=e.children[t];this.add(n.clone())}return this}dispose(){this.dispatchEvent({type:`dispose`})}};jn.DEFAULT_UP=new B(0,1,0),jn.DEFAULT_MATRIX_AUTO_UPDATE=!0,jn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Mn=class extends jn{constructor(){super(),this.isGroup=!0,this.type=`Group`}},Nn={type:`move`},Pn=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Mn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Mn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new B,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new B),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Mn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new B,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new B,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:`connected`,data:e}),this}disconnect(e){return this.dispatchEvent({type:`disconnected`,data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,i=null,a=null,o=this._targetRay,s=this._grip,c=this._hand;if(e&&t.session.visibilityState!==`visible-blurred`){if(c&&e.hand){a=!0;for(let r of e.hand.values()){let e=t.getJointPose(r,n),i=this._getHandJoint(c,r);e!==null&&(i.matrix.fromArray(e.transform.matrix),i.matrix.decompose(i.position,i.quaternion,i.scale),i.matrixWorldNeedsUpdate=!0,i.jointRadius=e.radius),i.visible=e!==null}let r=c.joints[`index-finger-tip`],i=c.joints[`thumb-tip`],o=r.position.distanceTo(i.position);c.inputState.pinching&&o>.025?(c.inputState.pinching=!1,this.dispatchEvent({type:`pinchend`,handedness:e.handedness,target:this})):!c.inputState.pinching&&o<=.015&&(c.inputState.pinching=!0,this.dispatchEvent({type:`pinchstart`,handedness:e.handedness,target:this}))}else s!==null&&e.gripSpace&&(i=t.getPose(e.gripSpace,n),i!==null&&(s.matrix.fromArray(i.transform.matrix),s.matrix.decompose(s.position,s.quaternion,s.scale),s.matrixWorldNeedsUpdate=!0,i.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(i.linearVelocity)):s.hasLinearVelocity=!1,i.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(i.angularVelocity)):s.hasAngularVelocity=!1,s.eventsEnabled&&s.dispatchEvent({type:`gripUpdated`,data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&i!==null&&(r=i),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Nn)))}return o!==null&&(o.visible=r!==null),s!==null&&(s.visible=i!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Mn;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},Fn={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},In={h:0,s:0,l:0},Ln={h:0,s:0,l:0};function Rn(e,t,n){return n<0&&(n+=1),n>1&&--n,n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var H=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let t=e;t&&t.isColor?this.copy(t):typeof t==`number`?this.setHex(t):typeof t==`string`&&this.setStyle(t)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=it){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Vt.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=Vt.workingColorSpace){return this.r=e,this.g=t,this.b=n,Vt.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=Vt.workingColorSpace){if(e=Dt(e,1),t=Et(t,0,1),n=Et(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,i=2*n-r;this.r=Rn(i,r,e+1/3),this.g=Rn(i,r,e),this.b=Rn(i,r,e-1/3)}return Vt.colorSpaceToWorking(this,r),this}setStyle(e,t=it){function n(t){t!==void 0&&parseFloat(t)<1&&R(`Color: Alpha component of `+e+` will be ignored.`)}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let i,a=r[1],o=r[2];switch(a){case`rgb`:case`rgba`:if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(100,parseFloat(i[1]))/100,Math.min(100,parseFloat(i[2]))/100,Math.min(100,parseFloat(i[3]))/100,t);break;case`hsl`:case`hsla`:if(i=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:R(`Color: Unknown color model `+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let n=r[1],i=n.length;if(i===3)return this.setRGB(parseInt(n.charAt(0),16)/15,parseInt(n.charAt(1),16)/15,parseInt(n.charAt(2),16)/15,t);if(i===6)return this.setHex(parseInt(n,16),t);R(`Color: Invalid hex color `+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=it){let n=Fn[e.toLowerCase()];return n===void 0?R(`Color: Unknown color `+e):this.setHex(n,t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Ht(e.r),this.g=Ht(e.g),this.b=Ht(e.b),this}copyLinearToSRGB(e){return this.r=Ut(e.r),this.g=Ut(e.g),this.b=Ut(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=it){return Vt.workingToColorSpace(zn.copy(this),e),Math.round(Et(zn.r*255,0,255))*65536+Math.round(Et(zn.g*255,0,255))*256+Math.round(Et(zn.b*255,0,255))}getHexString(e=it){return(`000000`+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Vt.workingColorSpace){Vt.workingToColorSpace(zn.copy(this),t);let n=zn.r,r=zn.g,i=zn.b,a=Math.max(n,r,i),o=Math.min(n,r,i),s,c,l=(o+a)/2;if(o===a)s=0,c=0;else{let e=a-o;switch(c=l<=.5?e/(a+o):e/(2-a-o),a){case n:s=(r-i)/e+(r<i?6:0);break;case r:s=(i-n)/e+2;break;case i:s=(n-r)/e+4}s/=6}return e.h=s,e.s=c,e.l=l,e}getRGB(e,t=Vt.workingColorSpace){return Vt.workingToColorSpace(zn.copy(this),t),e.r=zn.r,e.g=zn.g,e.b=zn.b,e}getStyle(e=it){Vt.workingToColorSpace(zn.copy(this),e);let t=zn.r,n=zn.g,r=zn.b;return e===`srgb`?`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`:`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`}offsetHSL(e,t,n){return this.getHSL(In),this.setHSL(In.h+e,In.s+t,In.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(In),e.getHSL(Ln);let n=Ot(In.h,Ln.h,t),r=Ot(In.s,Ln.s,t),i=Ot(In.l,Ln.l,t);return this.setHSL(n,r,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,r=this.b,i=e.elements;return this.r=i[0]*t+i[3]*n+i[6]*r,this.g=i[1]*t+i[4]*n+i[7]*r,this.b=i[2]*t+i[5]*n+i[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},zn=new H;H.NAMES=Fn;var Bn=class e{constructor(e,t=1,n=1e3){this.isFog=!0,this.name=``,this.color=new H(e),this.near=t,this.far=n}clone(){return new e(this.color,this.near,this.far)}toJSON(){return{type:`Fog`,name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},Vn=class extends jn{constructor(){super(),this.isScene=!0,this.type=`Scene`,this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new mn,this.environmentIntensity=1,this.environmentRotation=new mn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}copy(e,t){return super.copy(e,t),this.background=e.background===null?null:e.background.clone(),this.environment=e.environment===null?null:e.environment.clone(),this.fog=e.fog===null?null:e.fog.clone(),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),this.overrideMaterial=e.overrideMaterial===null?null:e.overrideMaterial.clone(),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},Hn=new B,Un=new B,Wn=new B,Gn=new B,Kn=new B,qn=new B,Jn=new B,Yn=new B,Xn=new B,Zn=new B,Qn=new Qt,$n=new Qt,er=new Qt,tr=class e{constructor(e=new B,t=new B,n=new B){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),Hn.subVectors(e,t),r.cross(Hn);let i=r.lengthSq();return i>0?r.multiplyScalar(1/Math.sqrt(i)):r.set(0,0,0)}static getBarycoord(e,t,n,r,i){Hn.subVectors(r,t),Un.subVectors(n,t),Wn.subVectors(e,t);let a=Hn.dot(Hn),o=Hn.dot(Un),s=Hn.dot(Wn),c=Un.dot(Un),l=Un.dot(Wn),u=a*c-o*o;if(u===0)return i.set(0,0,0),null;let d=1/u,f=(c*s-o*l)*d,p=(a*l-o*s)*d;return i.set(1-f-p,p,f)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,Gn)!==null&&Gn.x>=0&&Gn.y>=0&&Gn.x+Gn.y<=1}static getInterpolation(e,t,n,r,i,a,o,s){return this.getBarycoord(e,t,n,r,Gn)===null?(s.x=0,s.y=0,`z`in s&&(s.z=0),`w`in s&&(s.w=0),null):(s.setScalar(0),s.addScaledVector(i,Gn.x),s.addScaledVector(a,Gn.y),s.addScaledVector(o,Gn.z),s)}static getInterpolatedAttribute(e,t,n,r,i,a){return Qn.setScalar(0),$n.setScalar(0),er.setScalar(0),Qn.fromBufferAttribute(e,t),$n.fromBufferAttribute(e,n),er.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(Qn,i.x),a.addScaledVector($n,i.y),a.addScaledVector(er,i.z),a}static isFrontFacing(e,t,n,r){return Hn.subVectors(n,t),Un.subVectors(e,t),Hn.cross(Un).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Hn.subVectors(this.c,this.b),Un.subVectors(this.a,this.b),Hn.cross(Un).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,r,i,a){return e.getInterpolation(t,this.a,this.b,this.c,n,r,i,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,r=this.b,i=this.c,a,o;Kn.subVectors(r,n),qn.subVectors(i,n),Yn.subVectors(e,n);let s=Kn.dot(Yn),c=qn.dot(Yn);if(s<=0&&c<=0)return t.copy(n);Xn.subVectors(e,r);let l=Kn.dot(Xn),u=qn.dot(Xn);if(l>=0&&u<=l)return t.copy(r);let d=s*u-l*c;if(d<=0&&s>=0&&l<=0&&s-l>0)return a=s/(s-l),t.copy(n).addScaledVector(Kn,a);Zn.subVectors(e,i);let f=Kn.dot(Zn),p=qn.dot(Zn);if(p>=0&&f<=p)return t.copy(i);let m=f*c-s*p;if(m<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(qn,o);let h=l*p-f*u;if(h<=0&&u-l>=0&&f-p>=0)return Jn.subVectors(i,r),o=(u-l)/(u-l+(f-p)),t.copy(r).addScaledVector(Jn,o);let g=1/(h+m+d);return a=m*g,o=d*g,t.copy(n).addScaledVector(Kn,a).addScaledVector(qn,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},nr=class{constructor(e=new B(1/0,1/0,1/0),t=new B(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(ir.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(ir.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=ir.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute(`position`);if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0&&e.isBatchedMesh!==!0)for(let t=0,n=r.count;t<n;t++)e.isMesh===!0?e.getVertexPosition(t,ir):ir.fromBufferAttribute(r,t),ir.applyMatrix4(e.matrixWorld),this.expandByPoint(ir);else e.boundingBox===void 0?(n.boundingBox===null&&n.computeBoundingBox(),ar.copy(n.boundingBox)):(e.boundingBox===null&&e.computeBoundingBox(),ar.copy(e.boundingBox)),ar.applyMatrix4(e.matrixWorld),this.union(ar)}let r=e.children;for(let e=0,n=r.length;e<n;e++)this.expandByObject(r[e],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,ir),ir.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(fr),pr.subVectors(this.max,fr),or.subVectors(e.a,fr),sr.subVectors(e.b,fr),cr.subVectors(e.c,fr),lr.subVectors(sr,or),ur.subVectors(cr,sr),dr.subVectors(or,cr);let t=[0,-lr.z,lr.y,0,-ur.z,ur.y,0,-dr.z,dr.y,lr.z,0,-lr.x,ur.z,0,-ur.x,dr.z,0,-dr.x,-lr.y,lr.x,0,-ur.y,ur.x,0,-dr.y,dr.x,0];return!gr(t,or,sr,cr,pr)||(t=[1,0,0,0,1,0,0,0,1],!gr(t,or,sr,cr,pr))?!1:(mr.crossVectors(lr,ur),t=[mr.x,mr.y,mr.z],gr(t,or,sr,cr,pr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,ir).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(ir).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()||(rr[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),rr[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),rr[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),rr[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),rr[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),rr[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),rr[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),rr[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(rr)),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},rr=[new B,new B,new B,new B,new B,new B,new B,new B],ir=new B,ar=new nr,or=new B,sr=new B,cr=new B,lr=new B,ur=new B,dr=new B,fr=new B,pr=new B,mr=new B,hr=new B;function gr(e,t,n,r,i){for(let a=0,o=e.length-3;a<=o;a+=3){hr.fromArray(e,a);let o=i.x*Math.abs(hr.x)+i.y*Math.abs(hr.y)+i.z*Math.abs(hr.z),s=t.dot(hr),c=n.dot(hr),l=r.dot(hr);if(Math.max(-Math.max(s,c,l),Math.min(s,c,l))>o)return!1}return!0}var _r=new B,vr=new Nt,yr=0,br=class extends xt{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw TypeError(`THREE.BufferAttribute: array should be a Typed Array.`);this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:yr++}),this.name=``,this.array=e,this.itemSize=t,this.count=e===void 0?0:e.length/t,this.normalized=n,this.usage=lt,this.updateRanges=[],this.gpuType=ne,this.version=0,this._normalizationScale=e===void 0?void 0:At(e)}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this._normalizationScale=e._normalizationScale,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,i=this.itemSize;r<i;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)vr.fromBufferAttribute(this,t),vr.applyMatrix3(e),this.setXY(t,vr.x,vr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)_r.fromBufferAttribute(this,t),_r.applyMatrix3(e),this.setXYZ(t,_r.x,_r.y,_r.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)_r.fromBufferAttribute(this,t),_r.applyMatrix4(e),this.setXYZ(t,_r.x,_r.y,_r.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)_r.fromBufferAttribute(this,t),_r.applyNormalMatrix(e),this.setXYZ(t,_r.x,_r.y,_r.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)_r.fromBufferAttribute(this,t),_r.transformDirection(e),this.setXYZ(t,_r.x,_r.y,_r.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=this._denormalize(n)),n}setComponent(e,t,n){return this.normalized&&(n=this._normalize(n)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=this._denormalize(t)),t}setX(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=this._denormalize(t)),t}setY(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=this._denormalize(t)),t}setZ(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=this._denormalize(t)),t}setW(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r),i=this._normalize(i)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:`dispose`})}_denormalize(e){let t=this._normalizationScale;return t===void 0?jt(e,this.array):Math.max(e/t,-1)}_normalize(e){let t=this._normalizationScale;return t===void 0?Mt(e,this.array):Math.round(e*t)}},xr=class extends br{constructor(e,t,n){super(new Uint16Array(e),t,n)}},Sr=class extends br{constructor(e,t,n){super(new Uint32Array(e),t,n)}},Cr=class extends br{constructor(e,t,n){super(new Float32Array(e),t,n)}},wr=new nr,Tr=new B,Er=new B,Dr=class{constructor(e=new B,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t===void 0?wr.setFromPoints(e).getCenter(n):n.copy(t);let r=0;for(let t=0,i=e.length;t<i;t++)r=Math.max(r,n.distanceToSquared(e[t]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius*=e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Tr.subVectors(e,this.center);let t=Tr.lengthSq();if(t>this.radius*this.radius){let e=Math.sqrt(t),n=(e-this.radius)*.5;this.center.addScaledVector(Tr,n/e),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Er.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Tr.copy(e.center).add(Er)),this.expandByPoint(Tr.copy(e.center).sub(Er))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},Or=0,kr=new rn,Ar=new jn,jr=new B,Mr=new nr,Nr=new nr,Pr=new B,Fr=class e extends xt{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Or++}),this.uuid=Tt(),this.name=``,this.type=`BufferGeometry`,this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return this.index=Array.isArray(e)?new(dt(e)?Sr:xr)(e,1):e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let t=new V().getNormalMatrix(e);n.applyNormalMatrix(t),n.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return kr.makeRotationFromQuaternion(e),this.applyMatrix4(kr),this}rotateX(e){return kr.makeRotationX(e),this.applyMatrix4(kr),this}rotateY(e){return kr.makeRotationY(e),this.applyMatrix4(kr),this}rotateZ(e){return kr.makeRotationZ(e),this.applyMatrix4(kr),this}translate(e,t,n){return kr.makeTranslation(e,t,n),this.applyMatrix4(kr),this}scale(e,t,n){return kr.makeScale(e,t,n),this.applyMatrix4(kr),this}lookAt(e){return Ar.lookAt(e),Ar.updateMatrix(),this.applyMatrix4(Ar.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(jr).negate(),this.translate(jr.x,jr.y,jr.z),this}setFromPoints(e){let t=this.getAttribute(`position`);if(t===void 0){let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}this.setAttribute(`position`,new Cr(t,3))}else{let n=Math.min(e.length,t.count);for(let r=0;r<n;r++){let n=e[r];t.setXYZ(r,n.x,n.y,n.z||0)}e.length>t.count&&R(`BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new nr);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)z(`BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`,this),this.boundingBox.set(new B(-1/0,-1/0,-1/0),new B(1/0,1/0,1/0));else{if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];Mr.setFromBufferAttribute(n),this.morphTargetsRelative?(Pr.addVectors(this.boundingBox.min,Mr.min),this.boundingBox.expandByPoint(Pr),Pr.addVectors(this.boundingBox.max,Mr.max),this.boundingBox.expandByPoint(Pr)):(this.boundingBox.expandByPoint(Mr.min),this.boundingBox.expandByPoint(Mr.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&z(`BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`,this)}}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Dr);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)z(`BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`,this),this.boundingSphere.set(new B,1/0);else if(e){let n=this.boundingSphere.center;if(Mr.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];Nr.setFromBufferAttribute(n),this.morphTargetsRelative?(Pr.addVectors(Mr.min,Nr.min),Mr.expandByPoint(Pr),Pr.addVectors(Mr.max,Nr.max),Mr.expandByPoint(Pr)):(Mr.expandByPoint(Nr.min),Mr.expandByPoint(Nr.max))}Mr.getCenter(n);let r=0;for(let t=0,i=e.count;t<i;t++)Pr.fromBufferAttribute(e,t),r=Math.max(r,n.distanceToSquared(Pr));if(t)for(let i=0,a=t.length;i<a;i++){let a=t[i],o=this.morphTargetsRelative;for(let t=0,i=a.count;t<i;t++)Pr.fromBufferAttribute(a,t),o&&(jr.fromBufferAttribute(e,t),Pr.add(jr)),r=Math.max(r,n.distanceToSquared(Pr))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&z(`BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`,this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){z(`BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`);return}let n=t.position,r=t.normal,i=t.uv,a=this.getAttribute(`tangent`);(a===void 0||a.count!==n.count)&&(a=new br(new Float32Array(4*n.count),4),this.setAttribute(`tangent`,a));let o=[],s=[],c=new Uint8Array(n.count);for(let e=0;e<n.count;e++)o[e]=new B,s[e]=new B;let l=new B,u=new B,d=new B,f=new Nt,p=new Nt,m=new Nt,h=new B,g=new B;function _(e,t,r){c[e]=c[t]=c[r]=1,l.fromBufferAttribute(n,e),u.fromBufferAttribute(n,t),d.fromBufferAttribute(n,r),f.fromBufferAttribute(i,e),p.fromBufferAttribute(i,t),m.fromBufferAttribute(i,r),u.sub(l),d.sub(l),p.sub(f),m.sub(f);let a=1/(p.x*m.y-m.x*p.y);isFinite(a)&&(h.copy(u).multiplyScalar(m.y).addScaledVector(d,-p.y).multiplyScalar(a),g.copy(d).multiplyScalar(p.x).addScaledVector(u,-m.x).multiplyScalar(a),o[e].add(h),o[t].add(h),o[r].add(h),s[e].add(g),s[t].add(g),s[r].add(g))}let v=this.groups;v.length===0&&(v=[{start:0,count:e.count}]);for(let t=0,n=v.length;t<n;++t){let n=v[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)_(e.getX(t+0),e.getX(t+1),e.getX(t+2))}let y=new B,b=new B,x=new B,S=new B;function C(e){x.fromBufferAttribute(r,e),S.copy(x);let t=o[e];y.copy(t),y.sub(x.multiplyScalar(x.dot(t))).normalize(),b.crossVectors(S,t);let n=b.dot(s[e])<0?-1:1;a.setXYZW(e,y.x,y.y,y.z,n)}for(let e=0,t=n.count;e<t;++e)c[e]&&C(e);this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute(`position`);if(t!==void 0){let n=this.getAttribute(`normal`);if(n===void 0||n.count!==t.count)n=new br(new Float32Array(t.count*3),3),this.setAttribute(`normal`,n);else for(let e=0,t=n.count;e<t;e++)n.setXYZ(e,0,0,0);let r=new B,i=new B,a=new B,o=new B,s=new B,c=new B,l=new B,u=new B;if(e)for(let d=0,f=e.count;d<f;d+=3){let f=e.getX(d+0),p=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,f),i.fromBufferAttribute(t,p),a.fromBufferAttribute(t,m),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),o.fromBufferAttribute(n,f),s.fromBufferAttribute(n,p),c.fromBufferAttribute(n,m),o.add(l),s.add(l),c.add(l),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(p,s.x,s.y,s.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let e=0,o=t.count;e<o;e+=3)r.fromBufferAttribute(t,e+0),i.fromBufferAttribute(t,e+1),a.fromBufferAttribute(t,e+2),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),n.setXYZ(e+0,l.x,l.y,l.z),n.setXYZ(e+1,l.x,l.y,l.z),n.setXYZ(e+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Pr.fromBufferAttribute(e,t),Pr.normalize(),e.setXYZ(t,Pr.x,Pr.y,Pr.z)}toNonIndexed(){function t(e,t){let n=e.array,r=e.itemSize,i=e.normalized,a=new n.constructor(t.length*r),o=0,s=0;for(let i=0,c=t.length;i<c;i++){o=e.isInterleavedBufferAttribute?t[i]*e.data.stride+e.offset:t[i]*r;for(let e=0;e<r;e++)a[s++]=n[o++]}return new br(a,r,i)}if(this.index===null)return R(`BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`),this;let n=new e,r=this.index.array,i=this.attributes;for(let e in i){let a=i[e],o=t(a,r);n.setAttribute(e,o)}let a=this.morphAttributes;for(let e in a){let i=[],o=a[e];for(let e=0,n=o.length;e<n;e++){let n=o[e],a=t(n,r);i.push(a)}n.morphAttributes[e]=i}n.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let e=0,t=o.length;e<t;e++){let t=o[e];n.addGroup(t.start,t.count,t.materialIndex)}return n}toJSON(){let e={metadata:{version:4.7,type:`BufferGeometry`,generator:`BufferGeometry.toJSON`}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?`BufferGeometry`:this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let t=this.parameters;for(let n in t)t[n]!==void 0&&(e[n]=t[n]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let t in n){let r=n[t];e.data.attributes[t]=r.toJSON(e.data)}let r={},i=!1;for(let t in this.morphAttributes){let n=this.morphAttributes[t],a=[];for(let t=0,r=n.length;t<r;t++){let r=n[t];a.push(r.toJSON(e.data))}a.length>0&&(r[t]=a,i=!0)}i&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let r=e.attributes;for(let e in r){let n=r[e];this.setAttribute(e,n.clone(t))}let i=e.morphAttributes;for(let e in i){let n=[],r=i[e];for(let e=0,i=r.length;e<i;e++)n.push(r[e].clone(t));this.morphAttributes[e]=n}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let e=0,t=a.length;e<t;e++){let t=a[e];this.addGroup(t.start,t.count,t.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let s=e.boundingSphere;return s!==null&&(this.boundingSphere=s.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:`dispose`})}},Ir=new B,Lr=new B,Rr=new V,zr=class{constructor(e=new B(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let r=Ir.subVectors(n,t).cross(Lr.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let r=e.delta(Ir),i=this.normal.dot(r);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/i;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||Rr.getNormalMatrix(e),r=this.coplanarPoint(Ir).applyMatrix4(e),i=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},Br=0,Vr=class extends xt{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Br++}),this.uuid=Tt(),this.name=``,this.type=`Material`,this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new H(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=ct,this.stencilZFail=ct,this.stencilZPass=ct,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){R(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?R(`Material: '${t}' is not a property of THREE.${this.type}.`):r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:`Material`,generator:`Material.toJSON`}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(n.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(n.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(e).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(n.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(n.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(e=>e.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}if(t){let t=r(e.textures),i=r(e.images);t.length>0&&(n.textures=t),i.length>0&&(n.images=i)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new H().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.diffuseRoughness!==void 0&&(this.diffuseRoughness=e.diffuseRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessMinimum),e.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=e.iridescenceThicknessMaximum),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=e.iridescenceThicknessRange[1]),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(e=>new zr().fromJSON(e))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(this.vertexColors=typeof e.vertexColors==`number`?e.vertexColors>0:e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let t=e.normalScale;Array.isArray(t)===!1&&(t=[t,t]),this.normalScale=new Nt().fromArray(t)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Nt().fromArray(e.clearcoatNormalScale)),e.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=t[e.diffuseRoughnessMap]||null),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let e=t.length;n=Array(e);for(let r=0;r!==e;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:`dispose`})}set needsUpdate(e){e===!0&&this.version++}},Hr=new B,Ur=new B,Wr=new B,Gr=new B,Kr=class{constructor(e=new B,t=new B(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Hr)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Hr.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Hr.copy(this.origin).addScaledVector(this.direction,t),Hr.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){Ur.copy(e).add(t).multiplyScalar(.5),Wr.copy(t).sub(e).normalize(),Gr.copy(this.origin).sub(Ur);let i=e.distanceTo(t)*.5,a=-this.direction.dot(Wr),o=Gr.dot(this.direction),s=-Gr.dot(Wr),c=Gr.lengthSq(),l=Math.abs(1-a*a),u,d,f,p;if(l>0){if(u=a*s-o,d=a*o-s,p=i*l,u>=0){if(d>=-p){if(d<=p){let e=1/l;u*=e,d*=e,f=u*(u+a*d+2*o)+d*(a*u+d+2*s)+c}else d=i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d=-i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d<=-p?(u=Math.max(0,-(-a*i+o)),d=u>0?-i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c):d<=p?(u=0,d=Math.min(Math.max(-i,-s),i),f=d*(d+2*s)+c):(u=Math.max(0,-(a*i+o)),d=u>0?i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c)}else d=a>0?-i:i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(Ur).addScaledVector(Wr,d),f}intersectSphere(e,t){if(e.radius<0)return null;Hr.subVectors(e.center,this.origin);let n=Hr.dot(this.direction),r=Hr.dot(Hr)-n*n,i=e.radius*e.radius;if(r>i)return null;let a=Math.sqrt(i-r),o=n-a,s=n+a;return s<0?null:o<0?this.at(s,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,i,a,o,s,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),l>=0?(i=(e.min.y-d.y)*l,a=(e.max.y-d.y)*l):(i=(e.max.y-d.y)*l,a=(e.min.y-d.y)*l),n>a||i>r||((i>n||isNaN(n))&&(n=i),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-d.z)*u,s=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,s=(e.min.z-d.z)*u),n>s||o>r)||((o>n||n!==n)&&(n=o),(s<r||r!==r)&&(r=s),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,Hr)!==null}intersectTriangle(e,t,n,r,i){let a=this.origin,o=this.direction,s=o.x,c=o.y,l=o.z,u=e.x-a.x,d=e.y-a.y,f=e.z-a.z,p=t.x-a.x,m=t.y-a.y,h=t.z-a.z,g=n.x-a.x,_=n.y-a.y,v=n.z-a.z,y=Math.abs(s),b=Math.abs(c),x=Math.abs(l),S,C,w,T,E,D,O,k,A,j,M,ee;if(y>=b&&y>=x?(w=s,D=u,A=p,ee=g,s>=0?(S=c,C=l,T=d,E=f,O=m,k=h,j=_,M=v):(S=l,C=c,T=f,E=d,O=h,k=m,j=v,M=_)):b>=x?(w=c,D=d,A=m,ee=_,c>=0?(S=l,C=s,T=f,E=u,O=h,k=p,j=v,M=g):(S=s,C=l,T=u,E=f,O=p,k=h,j=g,M=v)):(w=l,D=f,A=h,ee=v,l>=0?(S=s,C=c,T=u,E=d,O=p,k=m,j=g,M=_):(S=c,C=s,T=d,E=u,O=m,k=p,j=_,M=g)),w===0)return null;let te=S/w,ne=C/w,re=1/w,ie=T-te*D,ae=E-ne*D,oe=O-te*A,se=k-ne*A,N=j-te*ee,ce=M-ne*ee,le=N*se-ce*oe,ue=ie*ce-ae*N,de=oe*ae-se*ie;if(r){if(le<0||ue<0||de<0)return null}else if((le<0||ue<0||de<0)&&(le>0||ue>0||de>0))return null;let fe=le+ue+de;if(fe===0)return null;let pe=re*(le*D+ue*A+de*ee);return(fe>0?pe<0:pe>0)?null:this.at(pe/fe,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},qr=class extends Vr{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type=`MeshBasicMaterial`,this.color=new H(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new mn,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},Jr=new rn,Yr=new Kr,Xr=new Dr,Zr=new B,Qr=new B,$r=new B,ei=new B,ti=new B,ni=new B,ri=new B,ii=new B,ai=class extends jn{constructor(e=new Fr,t=new qr){super(),this.isMesh=!0,this.type=`Mesh`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.morphTargetInfluences=e.morphTargetInfluences===void 0?void 0:e.morphTargetInfluences.slice(),this.morphTargetDictionary=e.morphTargetDictionary===void 0?void 0:Object.assign({},e.morphTargetDictionary),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}getVertexPosition(e,t){let n=this.geometry,r=n.attributes.position,i=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(i&&o){ni.set(0,0,0);for(let n=0,r=i.length;n<r;n++){let r=o[n],s=i[n];r!==0&&(ti.fromBufferAttribute(s,e),a?ni.addScaledVector(ti,r):ni.addScaledVector(ti.sub(t),r))}t.add(ni)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.material,i=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Xr.copy(n.boundingSphere),Xr.applyMatrix4(i),Yr.copy(e.ray).recast(e.near),Xr.containsPoint(Yr.origin)===!1&&(Yr.intersectSphere(Xr,Zr)===null||Yr.origin.distanceToSquared(Zr)>(e.far-e.near)**2)||(Jr.copy(i).invert(),Yr.copy(e.ray).applyMatrix4(Jr),(n.boundingBox===null||Yr.intersectsBox(n.boundingBox)!==!1)&&this._computeIntersections(e,t,Yr)))}_computeIntersections(e,t,n){let r,i=this.geometry,a=this.material,o=i.index,s=i.attributes.position,c=i.attributes.uv,l=i.attributes.uv1,u=i.attributes.normal,d=i.groups,f=i.drawRange;if(o!==null){if(Array.isArray(a))for(let i=0,s=d.length;i<s;i++){let s=d[i],p=a[s.materialIndex],m=Math.max(s.start,f.start),h=Math.min(o.count,Math.min(s.start+s.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=o.getX(i),d=o.getX(i+1),f=o.getX(i+2);r=si(this,p,e,n,c,l,u,a,d,f),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=s.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),s=Math.min(o.count,f.start+f.count);for(let d=i,f=s;d<f;d+=3){let i=o.getX(d),s=o.getX(d+1),f=o.getX(d+2);r=si(this,a,e,n,c,l,u,i,s,f),r&&(r.faceIndex=Math.floor(d/3),t.push(r))}}}else if(s!==void 0){if(Array.isArray(a))for(let i=0,o=d.length;i<o;i++){let o=d[i],p=a[o.materialIndex],m=Math.max(o.start,f.start),h=Math.min(s.count,Math.min(o.start+o.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=i,s=i+1,d=i+2;r=si(this,p,e,n,c,l,u,a,s,d),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=o.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),o=Math.min(s.count,f.start+f.count);for(let s=i,d=o;s<d;s+=3){let i=s,o=s+1,d=s+2;r=si(this,a,e,n,c,l,u,i,o,d),r&&(r.faceIndex=Math.floor(s/3),t.push(r))}}}}};function oi(e,t,n,r,i,a,o,s){let c;if(c=t.side===1?r.intersectTriangle(o,a,i,!0,s):r.intersectTriangle(i,a,o,t.side===0,s),c===null)return null;ii.copy(s),ii.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(ii);return l<n.near||l>n.far?null:{distance:l,point:ii.clone(),object:e}}function si(e,t,n,r,i,a,o,s,c,l){e.getVertexPosition(s,Qr),e.getVertexPosition(c,$r),e.getVertexPosition(l,ei);let u=oi(e,t,n,r,Qr,$r,ei,ri);if(u){let e=new B;tr.getBarycoord(ri,Qr,$r,ei,e),i&&(u.uv=tr.getInterpolatedAttribute(i,s,c,l,e,new Nt)),a&&(u.uv1=tr.getInterpolatedAttribute(a,s,c,l,e,new Nt)),o&&(u.normal=tr.getInterpolatedAttribute(o,s,c,l,e,new B),u.normal.dot(r.direction)>0&&u.normal.multiplyScalar(-1));let t={a:s,b:c,c:l,normal:new B,materialIndex:0};tr.getNormal(Qr,$r,ei,t.normal),u.face=t,u.barycoord=e}return u}var ci=class extends Zt{constructor(e=null,t=1,n=1,r,i,a,o,s,c=C,l=C,u,d){super(null,a,o,s,c,l,r,i,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},li=class extends br{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},ui=new rn,di=new rn,fi=[],pi=new nr,mi=new rn,hi=new ai,gi=new Dr,_i=class extends ai{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new li(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let e=0;e<n;e++)this.setMatrixAt(e,mi)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new nr),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,ui),pi.copy(e.boundingBox).applyMatrix4(ui),this.boundingBox.union(pi)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Dr),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,ui),gi.copy(e.boundingSphere).applyMatrix4(ui),this.boundingSphere.union(gi)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),this.morphTexture=e.morphTexture===null?null:e.morphTexture.clone(),this.instanceColor=e.instanceColor===null?null:e.instanceColor.clone(),this.count=e.count,this.boundingBox=e.boundingBox===null?null:e.boundingBox.clone(),this.boundingSphere=e.boundingSphere===null?null:e.boundingSphere.clone(),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,r=this.morphTexture.source.data.data,i=e*(n.length+1)+1;for(let e=0;e<n.length;e++)n[e]=r[i+e]}raycast(e,t){let n=this.matrixWorld,r=this.count;if(hi.geometry=this.geometry,hi.material=this.material,hi.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),gi.copy(this.boundingSphere),gi.applyMatrix4(n),e.ray.intersectsSphere(gi)!==!1))for(let i=0;i<r;i++){this.getMatrixAt(i,ui),di.multiplyMatrices(n,ui),hi.matrixWorld=di,hi.raycast(e,fi);for(let e=0,n=fi.length;e<n;e++){let n=fi[e];n.instanceId=i,n.object=this,t.push(n)}fi.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new li(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,r=n.length+1;this.morphTexture===null&&(this.morphTexture=new ci(new Float32Array(r*this.count),r,this.count,pe,ne));let i=this.morphTexture.source.data.data,a=0;for(let e=0;e<n.length;e++)a+=n[e];let o=this.geometry.morphTargetsRelative?1:1-a,s=r*e;return i[s]=o,i.set(n,s+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.instanceMatrix.dispose(),this.instanceColor!==null&&this.instanceColor.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},vi=new Dr,yi=new Nt(.5,.5),bi=new B,xi=class{constructor(e=new zr,t=new zr,n=new zr,r=new zr,i=new zr,a=new zr){this.planes=[e,t,n,r,i,a]}set(e,t,n,r,i,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(i),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=ut,n=!1){let r=this.planes,i=e.elements,a=i[0],o=i[1],s=i[2],c=i[3],l=i[4],u=i[5],d=i[6],f=i[7],p=i[8],m=i[9],h=i[10],g=i[11],_=i[12],v=i[13],y=i[14],b=i[15];if(r[0].setComponents(c-a,f-l,g-p,b-_).normalize(),r[1].setComponents(c+a,f+l,g+p,b+_).normalize(),r[2].setComponents(c+o,f+u,g+m,b+v).normalize(),r[3].setComponents(c-o,f-u,g-m,b-v).normalize(),n)r[4].setComponents(s,d,h,y).normalize(),r[5].setComponents(c-s,f-d,g-h,b-y).normalize();else if(r[4].setComponents(c-s,f-d,g-h,b-y).normalize(),t===2e3)r[5].setComponents(c+s,f+d,g+h,b+y).normalize();else if(t===2001)r[5].setComponents(s,d,h,y).normalize();else throw Error(`THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: `+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),vi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),vi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(vi)}intersectsSprite(e){return vi.center.set(0,0,0),vi.radius=.7071067811865476+yi.distanceTo(e.center),vi.applyMatrix4(e.matrixWorld),this.intersectsSphere(vi)}intersectsSphere(e){let t=this.planes,n=e.center,r=-e.radius;for(let e=0;e<6;e++)if(t[e].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let r=t[n];if(bi.x=r.normal.x>0?e.max.x:e.min.x,bi.y=r.normal.y>0?e.max.y:e.min.y,bi.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(bi)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},Si=new rn,Ci=class e{constructor(){this.coordinateSystem=ut,this._frustums=[],this._count=0}setFromArrayCamera(e){let t=e.cameras,n=this._frustums;for(let e=0;e<t.length;e++){let r=t[e];Si.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),n[e]===void 0&&(n[e]=new xi),n[e].setFromProjectionMatrix(Si,r.coordinateSystem,r.reversedDepth)}return this._count=t.length,this}getFrustum(e){return this._frustums[e]}intersectsObject(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsObject(e))return!0;return!1}intersectsSprite(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSprite(e))return!0;return!1}intersectsSphere(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSphere(e))return!0;return!1}intersectsBox(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsBox(e))return!0;return!1}containsPoint(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].containsPoint(e))return!0;return!1}copy(e){this.coordinateSystem=e.coordinateSystem;let t=this._frustums,n=e._frustums;for(let r=0;r<e._count;r++)t[r]===void 0&&(t[r]=new xi),t[r].copy(n[r]);return this._count=e._count,this}clone(){return new e().copy(this)}},wi=class extends Vr{constructor(e){super(),this.isPointsMaterial=!0,this.type=`PointsMaterial`,this.color=new H(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Ti=new rn,Ei=new Kr,Di=new Dr,Oi=new B,ki=class extends jn{constructor(e=new Fr,t=new wi){super(),this.isPoints=!0,this.type=`Points`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.morphTargetInfluences=e.morphTargetInfluences===void 0?void 0:e.morphTargetInfluences.slice(),this.morphTargetDictionary=e.morphTargetDictionary===void 0?void 0:Object.assign({},e.morphTargetDictionary),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Di.copy(n.boundingSphere),Di.applyMatrix4(r),Di.radius+=i,e.ray.intersectsSphere(Di)===!1)return;Ti.copy(r).invert(),Ei.copy(e.ray).applyMatrix4(Ti);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=n.index,l=n.attributes.position;if(c!==null){let n=Math.max(0,a.start),i=Math.min(c.count,a.start+a.count);for(let a=n,o=i;a<o;a++){let n=c.getX(a);Oi.fromBufferAttribute(l,n),Ai(Oi,n,s,r,e,t,this)}}else{let n=Math.max(0,a.start),i=Math.min(l.count,a.start+a.count);for(let a=n,o=i;a<o;a++)Oi.fromBufferAttribute(l,a),Ai(Oi,a,s,r,e,t,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function Ai(e,t,n,r,i,a,o){let s=Ei.distanceSqToPoint(e);if(s<n){let n=new B;Ei.closestPointToPoint(e,n),n.applyMatrix4(r);let c=i.ray.origin.distanceTo(n);if(c<i.near||c>i.far)return;a.push({distance:c,distanceToRay:Math.sqrt(s),point:n,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}var ji=class extends Zt{constructor(e=[],t=301,n,r,i,a,o,s,c,l){super(e,t,n,r,i,a,o,s,c,l),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Mi=class extends Zt{constructor(e,t,n=te,r,i,a,o=C,s=C,c,l=de,u=1){if(l!==1026&&l!==1027)throw Error(`THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat`);super({width:e,height:t,depth:u},r,i,a,o,s,l,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new qt(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},Ni=class extends Mi{constructor(e,t=te,n=301,r,i,a=C,o=C,s,c=de){let l={width:e,height:e,depth:1},u=[l,l,l,l,l,l];super(e,e,t,n,r,i,a,o,s,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},Pi=class extends Zt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},Fi=class e extends Fr{constructor(e=1,t=1,n=1,r=1,i=1,a=1){super(),this.type=`BoxGeometry`,this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:i,depthSegments:a};let o=this;r=Math.floor(r),i=Math.floor(i),a=Math.floor(a);let s=[],c=[],l=[],u=[],d=0,f=0;p(`z`,`y`,`x`,-1,-1,n,t,e,a,i,0),p(`z`,`y`,`x`,1,-1,n,t,-e,a,i,1),p(`x`,`z`,`y`,1,1,e,n,t,r,a,2),p(`x`,`z`,`y`,1,-1,e,n,-t,r,a,3),p(`x`,`y`,`z`,1,-1,e,t,n,r,i,4),p(`x`,`y`,`z`,-1,-1,e,t,-n,r,i,5),this.setIndex(s),this.setAttribute(`position`,new Cr(c,3)),this.setAttribute(`normal`,new Cr(l,3)),this.setAttribute(`uv`,new Cr(u,2));function p(e,t,n,r,i,a,p,m,h,g,_){let v=a/h,y=p/g,b=a/2,x=p/2,S=m/2,C=h+1,w=g+1,T=0,E=0,D=new B;for(let a=0;a<w;a++){let o=a*y-x;for(let s=0;s<C;s++)D[e]=(s*v-b)*r,D[t]=o*i,D[n]=S,c.push(D.x,D.y,D.z),D[e]=0,D[t]=0,D[n]=m>0?1:-1,l.push(D.x,D.y,D.z),u.push(s/h),u.push(1-a/g),T+=1}for(let e=0;e<g;e++)for(let t=0;t<h;t++){let n=d+t+C*e,r=d+t+C*(e+1),i=d+(t+1)+C*(e+1),a=d+(t+1)+C*e;s.push(n,r,a),s.push(r,i,a),E+=6}o.addGroup(f,E,_),f+=E,d+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},Ii=class e extends Fr{constructor(e=1,t=32,n=0,r=Math.PI*2){super(),this.type=`CircleGeometry`,this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:r},t=Math.max(3,t);let i=[],a=[],o=[],s=[],c=new B,l=new Nt;a.push(0,0,0),o.push(0,0,1),s.push(.5,.5);for(let i=0,u=3;i<=t;i++,u+=3){let d=n+i/t*r;c.x=e*Math.cos(d),c.y=e*Math.sin(d),a.push(c.x,c.y,c.z),o.push(0,0,1),l.x=(a[u]/e+1)/2,l.y=(a[u+1]/e+1)/2,s.push(l.x,l.y)}for(let e=1;e<=t;e++)i.push(e,e+1,0);this.setIndex(i),this.setAttribute(`position`,new Cr(a,3)),this.setAttribute(`normal`,new Cr(o,3)),this.setAttribute(`uv`,new Cr(s,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.segments,t.thetaStart,t.thetaLength)}},Li=class e extends Fr{constructor(e=1,t=1,n=1,r=32,i=1,a=!1,o=0,s=Math.PI*2){super(),this.type=`CylinderGeometry`,this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:r,heightSegments:i,openEnded:a,thetaStart:o,thetaLength:s};let c=this;r=Math.floor(r),i=Math.floor(i);let l=[],u=[],d=[],f=[],p=0,m=[],h=n/2,g=0;_(),a===!1&&(e>0&&v(!0),t>0&&v(!1)),this.setIndex(l),this.setAttribute(`position`,new Cr(u,3)),this.setAttribute(`normal`,new Cr(d,3)),this.setAttribute(`uv`,new Cr(f,2));function _(){let a=new B,_=new B,v=0,y=(t-e)/n;for(let c=0;c<=i;c++){let l=[],g=c/i,v=g*(t-e)+e;for(let e=0;e<=r;e++){let t=e/r,i=t*s+o,c=Math.sin(i),m=Math.cos(i);_.x=v*c,_.y=-g*n+h,_.z=v*m,u.push(_.x,_.y,_.z),a.set(c,y,m).normalize(),d.push(a.x,a.y,a.z),f.push(t,1-g),l.push(p++)}m.push(l)}for(let n=0;n<r;n++)for(let r=0;r<i;r++){let a=m[r][n],o=m[r+1][n],s=m[r+1][n+1],c=m[r][n+1];(e>0||r!==0)&&(l.push(a,o,c),v+=3),(t>0||r!==i-1)&&(l.push(o,s,c),v+=3)}c.addGroup(g,v,0),g+=v}function v(n){let i=p,a=new Nt,m=new B,_=0,v=n===!0?e:t,y=n===!0?1:-1;for(let e=1;e<=r;e++)u.push(0,h*y,0),d.push(0,y,0),f.push(.5,.5),p++;let b=p;for(let e=0;e<=r;e++){let t=e/r*s+o,n=Math.cos(t),i=Math.sin(t);m.x=v*i,m.y=h*y,m.z=v*n,u.push(m.x,m.y,m.z),d.push(0,y,0),a.x=n*.5+.5,a.y=i*.5*y+.5,f.push(a.x,a.y),p++}for(let e=0;e<r;e++){let t=i+e,r=b+e;n===!0?l.push(r,r+1,t):l.push(r+1,r,t),_+=3}c.addGroup(g,_,n===!0?1:2),g+=_}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},Ri=class e extends Li{constructor(e=1,t=1,n=32,r=1,i=!1,a=0,o=Math.PI*2){super(0,e,t,n,r,i,a,o),this.type=`ConeGeometry`,this.parameters={radius:e,height:t,radialSegments:n,heightSegments:r,openEnded:i,thetaStart:a,thetaLength:o}}static fromJSON(t){return new e(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},zi=class e extends Fr{constructor(e=[],t=[],n=1,r=0){super(),this.type=`PolyhedronGeometry`,this.parameters={vertices:e,indices:t,radius:n,detail:r};let i=[],a=[];o(r),c(n),l(),this.setAttribute(`position`,new Cr(i,3)),this.setAttribute(`normal`,new Cr(i.slice(),3)),this.setAttribute(`uv`,new Cr(a,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function o(e){let n=new B,r=new B,i=new B;for(let a=0;a<t.length;a+=3)f(t[a+0],n),f(t[a+1],r),f(t[a+2],i),s(n,r,i,e)}function s(e,t,n,r){let i=r+1,a=[];for(let r=0;r<=i;r++){a[r]=[];let o=e.clone().lerp(n,r/i),s=t.clone().lerp(n,r/i),c=i-r;for(let e=0;e<=c;e++)e===0&&r===i?a[r][e]=o:a[r][e]=o.clone().lerp(s,e/c)}for(let e=0;e<i;e++)for(let t=0;t<2*(i-e)-1;t++){let n=Math.floor(t/2);t%2==0?(d(a[e][n+1]),d(a[e+1][n]),d(a[e][n])):(d(a[e][n+1]),d(a[e+1][n+1]),d(a[e+1][n]))}}function c(e){let t=new B;for(let n=0;n<i.length;n+=3)t.x=i[n+0],t.y=i[n+1],t.z=i[n+2],t.normalize().multiplyScalar(e),i[n+0]=t.x,i[n+1]=t.y,i[n+2]=t.z}function l(){let e=new B;for(let t=0;t<i.length;t+=3){e.x=i[t+0],e.y=i[t+1],e.z=i[t+2];let n=h(e)/2/Math.PI+.5,r=g(e)/Math.PI+.5;a.push(n,1-r)}p(),u()}function u(){for(let e=0;e<a.length;e+=6){let t=a[e+0],n=a[e+2],r=a[e+4];Math.max(t,n,r)>.9&&Math.min(t,n,r)<.1&&(t<.2&&(a[e+0]+=1),n<.2&&(a[e+2]+=1),r<.2&&(a[e+4]+=1))}}function d(e){i.push(e.x,e.y,e.z)}function f(t,n){let r=t*3;n.x=e[r+0],n.y=e[r+1],n.z=e[r+2]}function p(){let e=new B,t=new B,n=new B,r=new B,o=new Nt,s=new Nt,c=new Nt;for(let l=0,u=0;l<i.length;l+=9,u+=6){e.set(i[l+0],i[l+1],i[l+2]),t.set(i[l+3],i[l+4],i[l+5]),n.set(i[l+6],i[l+7],i[l+8]),o.set(a[u+0],a[u+1]),s.set(a[u+2],a[u+3]),c.set(a[u+4],a[u+5]),r.copy(e).add(t).add(n).divideScalar(3);let d=h(r);m(o,u+0,e,d),m(s,u+2,t,d),m(c,u+4,n,d)}}function m(e,t,n,r){r<0&&e.x===1&&(a[t]=e.x-1),n.x===0&&n.z===0&&(a[t]=r/2/Math.PI+.5)}function h(e){return Math.atan2(e.z,-e.x)}function g(e){return Math.atan2(-e.y,Math.sqrt(e.x*e.x+e.z*e.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.vertices,t.indices,t.radius,t.detail)}},Bi=class e extends zi{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,r=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1];super(r,[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1],e,t),this.type=`IcosahedronGeometry`,this.parameters={radius:e,detail:t}}static fromJSON(t){return new e(t.radius,t.detail)}},Vi=class e extends Fr{constructor(e=1,t=1,n=1,r=1){super(),this.type=`PlaneGeometry`,this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};let i=e/2,a=t/2,o=Math.floor(n),s=Math.floor(r),c=o+1,l=s+1,u=e/o,d=t/s,f=[],p=[],m=[],h=[];for(let e=0;e<l;e++){let t=e*d-a;for(let n=0;n<c;n++){let r=n*u-i;p.push(r,-t,0),m.push(0,0,1),h.push(n/o),h.push(1-e/s)}}for(let e=0;e<s;e++)for(let t=0;t<o;t++){let n=t+c*e,r=t+c*(e+1),i=t+1+c*(e+1),a=t+1+c*e;f.push(n,r,a),f.push(r,i,a)}this.setIndex(f),this.setAttribute(`position`,new Cr(p,3)),this.setAttribute(`normal`,new Cr(m,3)),this.setAttribute(`uv`,new Cr(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}},Hi=class e extends Fr{constructor(e=.5,t=1,n=32,r=1,i=0,a=Math.PI*2){super(),this.type=`RingGeometry`,this.parameters={innerRadius:e,outerRadius:t,thetaSegments:n,phiSegments:r,thetaStart:i,thetaLength:a},n=Math.max(3,n),r=Math.max(1,r);let o=[],s=[],c=[],l=[],u=e,d=(t-e)/r,f=new B,p=new Nt;for(let e=0;e<=r;e++){for(let e=0;e<=n;e++){let r=i+e/n*a;f.x=u*Math.cos(r),f.y=u*Math.sin(r),s.push(f.x,f.y,f.z),c.push(0,0,1),p.x=(f.x/t+1)/2,p.y=(f.y/t+1)/2,l.push(p.x,p.y)}u+=d}for(let e=0;e<r;e++){let t=e*(n+1);for(let e=0;e<n;e++){let r=e+t,i=r,a=r+n+1,s=r+n+2,c=r+1;o.push(i,a,c),o.push(a,s,c)}}this.setIndex(o),this.setAttribute(`position`,new Cr(s,3)),this.setAttribute(`normal`,new Cr(c,3)),this.setAttribute(`uv`,new Cr(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}},Ui=class e extends Fr{constructor(e=1,t=32,n=16,r=0,i=Math.PI*2,a=0,o=Math.PI){super(),this.type=`SphereGeometry`,this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:r,phiLength:i,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let s=Math.min(a+o,Math.PI),c=0,l=[],u=new B,d=new B,f=[],p=[],m=[],h=[];for(let f=0;f<=n;f++){let g=[],_=f/n,v=a+_*o,y=e*Math.cos(v),b=Math.sqrt(e*e-y*y),x=0;f===0&&a===0?x=.5/t:f===n&&s===Math.PI&&(x=-.5/t);for(let e=0;e<=t;e++){let n=e/t,a=r+n*i;u.x=-b*Math.cos(a),u.y=y,u.z=b*Math.sin(a),p.push(u.x,u.y,u.z),d.copy(u).normalize(),m.push(d.x,d.y,d.z),h.push(n+x,1-_),g.push(c++)}l.push(g)}for(let e=0;e<n;e++)for(let r=0;r<t;r++){let t=l[e][r+1],i=l[e][r],o=l[e+1][r],c=l[e+1][r+1];(e!==0||a>0)&&f.push(t,i,c),(e!==n-1||s<Math.PI)&&f.push(i,o,c)}this.setIndex(f),this.setAttribute(`position`,new Cr(p,3)),this.setAttribute(`normal`,new Cr(m,3)),this.setAttribute(`uv`,new Cr(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}},Wi=class e extends zi{constructor(e=1,t=0){super([1,1,1,-1,-1,1,-1,1,-1,1,-1,-1],[2,1,0,0,3,2,1,3,0,2,3,1],e,t),this.type=`TetrahedronGeometry`,this.parameters={radius:e,detail:t}}static fromJSON(t){return new e(t.radius,t.detail)}},Gi=class e extends Fr{constructor(e=1,t=.4,n=12,r=48,i=Math.PI*2,a=0,o=Math.PI*2){super(),this.type=`TorusGeometry`,this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:r,arc:i,thetaStart:a,thetaLength:o},n=Math.floor(n),r=Math.floor(r);let s=[],c=[],l=[],u=[],d=new B,f=new B,p=new B;for(let s=0;s<=n;s++){let m=a+s/n*o;for(let a=0;a<=r;a++){let o=a/r*i;f.x=(e+t*Math.cos(m))*Math.cos(o),f.y=(e+t*Math.cos(m))*Math.sin(o),f.z=t*Math.sin(m),c.push(f.x,f.y,f.z),d.x=e*Math.cos(o),d.y=e*Math.sin(o),p.subVectors(f,d).normalize(),l.push(p.x,p.y,p.z),u.push(a/r),u.push(s/n)}}for(let e=1;e<=n;e++)for(let t=1;t<=r;t++){let n=(r+1)*e+t-1,i=(r+1)*(e-1)+t-1,a=(r+1)*(e-1)+t,o=(r+1)*e+t;s.push(n,i,o),s.push(i,a,o)}this.setIndex(s),this.setAttribute(`position`,new Cr(c,3)),this.setAttribute(`normal`,new Cr(l,3)),this.setAttribute(`uv`,new Cr(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc,t.thetaStart,t.thetaLength)}};function Ki(e){let t={};for(let n in e){t[n]={};for(let r in e[n]){let i=e[n][r];if(Ji(i))i.isRenderTargetTexture?(R(`UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().`),t[n][r]=null):t[n][r]=i.clone();else if(Array.isArray(i)){if(Ji(i[0])){let e=[];for(let t=0,n=i.length;t<n;t++)e[t]=i[t].clone();t[n][r]=e}else t[n][r]=i.slice()}else t[n][r]=i}}return t}function qi(e){let t={};for(let n=0;n<e.length;n++){let r=Ki(e[n]);for(let e in r)t[e]=r[e]}return t}function Ji(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function Yi(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function Xi(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Vt.workingColorSpace}var Zi={clone:Ki,merge:qi},Qi=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,$i=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,ea=class extends Vr{constructor(e){super(),this.isShaderMaterial=!0,this.type=`ShaderMaterial`,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Qi,this.fragmentShader=$i,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Ki(e.uniforms),this.uniformsGroups=Yi(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let r=this.uniforms[n].value;r&&r.isTexture?t.uniforms[n]={type:`t`,value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[n]={type:`c`,value:r.getHex()}:r&&r.isVector2?t.uniforms[n]={type:`v2`,value:r.toArray()}:r&&r.isVector3?t.uniforms[n]={type:`v3`,value:r.toArray()}:r&&r.isVector4?t.uniforms[n]={type:`v4`,value:r.toArray()}:r&&r.isMatrix3?t.uniforms[n]={type:`m3`,value:r.toArray()}:r&&r.isMatrix4?t.uniforms[n]={type:`m4`,value:r.toArray()}:t.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let e in this.extensions)this.extensions[e]===!0&&(n[e]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let r=e.uniforms[n];switch(this.uniforms[n]={},r.type){case`t`:this.uniforms[n].value=t[r.value]||null;break;case`c`:this.uniforms[n].value=new H().setHex(r.value);break;case`v2`:this.uniforms[n].value=new Nt().fromArray(r.value);break;case`v3`:this.uniforms[n].value=new B().fromArray(r.value);break;case`v4`:this.uniforms[n].value=new Qt().fromArray(r.value);break;case`m3`:this.uniforms[n].value=new V().fromArray(r.value);break;case`m4`:this.uniforms[n].value=new rn().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let t in e.extensions)this.extensions[t]=e.extensions[t];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},ta=class extends ea{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type=`RawShaderMaterial`}},na=class extends Vr{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type=`MeshLambertMaterial`,this.color=new H(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new H(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new Nt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new mn,this.combine=0,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},ra=class extends Vr{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type=`MeshDepthMaterial`,this.depthPacking=rt,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},ia=class extends Vr{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type=`MeshDistanceMaterial`,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function aa(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT==`number`?new t(e):Array.prototype.slice.call(e)}function oa(e){return e!==void 0&&e.inTangents!==void 0&&e.outTangents!==void 0}var sa=class{constructor(e,t,n,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r===void 0?new t.constructor(n):r,this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,r=t[n],i=t[n-1];validate_interval:{seek:{let a;linear_scan:{forward_scan:if(!(e<r)){for(let a=n+2;;){if(r===void 0){if(e<i)break forward_scan;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(i=r,r=t[++n],e<r)break seek}a=t.length;break linear_scan}if(!(e>=i)){let o=t[1];e<o&&(n=2,i=o);for(let a=n-2;;){if(i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(r=i,i=t[--n-1],e>=i)break seek}a=n,n=0;break linear_scan}break validate_interval}for(;n<a;){let r=n+a>>>1;e<t[r]?a=r:n=r+1}if(r=t[n],i=t[n-1],i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,i,r)}return this.interpolate_(n,i,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,r=this.valueSize,i=e*r;for(let e=0;e!==r;++e)t[e]=n[i+e];return t}interpolate_(){throw Error(`THREE.Interpolant: Call to abstract method.`)}intervalChanged_(){}},ca=class extends sa{constructor(e,t,n,r){super(e,t,n,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:et,endingEnd:et}}intervalChanged_(e,t,n){let r=this.parameterPositions,i=e-2,a=e+1,o=r[i],s=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case tt:i=e,o=2*t-n;break;case nt:i=r.length-2,o=t+r[i]-r[i+1];break;default:i=e,o=n}if(s===void 0)switch(this.getSettings_().endingEnd){case tt:a=e,s=2*n-t;break;case nt:a=1,s=n+r[1]-r[0];break;default:a=e-1,s=t}let c=(n-t)*.5,l=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(s-n),this._offsetPrev=i*l,this._offsetNext=a*l}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(r-t),m=p*p,h=m*p,g=-d*h+2*d*m-d*p,_=(1+d)*h+(-1.5-2*d)*m+(-.5+d)*p+1,v=(-1-f)*h+(1.5+f)*m+.5*p,y=f*h-f*m;for(let e=0;e!==o;++e)i[e]=g*a[l+e]+_*a[c+e]+v*a[s+e]+y*a[u+e];return i}},la=class extends sa{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=(n-t)/(r-t),u=1-l;for(let e=0;e!==o;++e)i[e]=a[c+e]*u+a[s+e]*l;return i}},ua=class extends sa{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e){return this.copySampleValue_(e-1)}},da=class extends sa{interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this.inTangents,u=this.outTangents;if(!l||!u){let e=(n-t)/(r-t),l=1-e;for(let t=0;t!==o;++t)i[t]=a[c+t]*l+a[s+t]*e;return i}let d=o*2,f=e-1;for(let p=0;p!==o;++p){let o=a[c+p],m=a[s+p],h=f*d+p*2,g=u[h],_=u[h+1],v=e*d+p*2,y=l[v],b=l[v+1],x=ma(n,t,g,y,r);i[p]=fa(x,o,_,b,m)}return i}};function fa(e,t,n,r,i){let a=1-e;return a*a*a*t+3*a*a*e*n+3*a*e*e*r+e*e*e*i}function pa(e,t,n,r,i){let a=1-e;return 3*a*a*(n-t)+6*a*e*(r-n)+3*e*e*(i-r)}function ma(e,t,n,r,i){let a=(e-t)/(i-t);for(let o=0;o<8;o++){let o=fa(a,t,n,r,i)-e;if(Math.abs(o)<1e-10)break;let s=pa(a,t,n,r,i);if(Math.abs(s)<1e-10)break;a=Math.max(0,Math.min(1,a-o/s))}return a}var ha=class{constructor(e,t,n,r){if(e===void 0)throw Error(`THREE.KeyframeTrack: track name is undefined`);if(t===void 0||t.length===0)throw Error(`THREE.KeyframeTrack: no keyframes in track named `+e);this.name=e,this.times=aa(t,this.TimeBufferType),this.values=aa(n,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:aa(e.times,Array),values:aa(e.values,Array)};let t=e.getInterpolation();t!==e.DefaultInterpolation&&(n.interpolation=t),oa(e.settings)&&(n.settings={inTangents:aa(e.settings.inTangents,Array),outTangents:aa(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new ua(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new la(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new ca(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new da(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case Xe:t=this.InterpolantFactoryMethodDiscrete;break;case Ze:t=this.InterpolantFactoryMethodLinear;break;case Qe:t=this.InterpolantFactoryMethodSmooth;break;case $e:t=this.InterpolantFactoryMethodBezier}if(t===void 0){let t=`unsupported interpolation for `+this.ValueTypeName+` keyframe track named `+this.name;if(this.createInterpolant===void 0){if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(t)}return R(`KeyframeTrack:`,t),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Xe;case this.InterpolantFactoryMethodLinear:return Ze;case this.InterpolantFactoryMethodSmooth:return Qe;case this.InterpolantFactoryMethodBezier:return $e}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]+=e;oa(this.settings)&&(ga(this.settings.inTangents,e),ga(this.settings.outTangents,e))}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]*=e;oa(this.settings)&&(_a(this.settings.inTangents,e),_a(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,r=n.length,i=0,a=r-1;for(;i!==r&&n[i]<e;)++i;for(;a!==-1&&n[a]>t;)--a;if(++a,i!==0||a!==r){i>=a&&(a=Math.max(a,1),i=a-1);let e=this.getValueSize();this.times=n.slice(i,a),this.values=this.values.slice(i*e,a*e)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(z(`KeyframeTrack: Invalid value size in track.`,this),e=!1);let n=this.times,r=this.values,i=n.length;i===0&&(z(`KeyframeTrack: Track is empty.`,this),e=!1);let a=null;for(let t=0;t!==i;t++){let r=n[t];if(typeof r==`number`&&isNaN(r)){z(`KeyframeTrack: Time is not a valid number.`,this,t,r),e=!1;break}if(a!==null&&a>r){z(`KeyframeTrack: Out of order keys.`,this,t,r,a),e=!1;break}a=r}if(r!==void 0&&ft(r))for(let t=0,n=r.length;t!==n;++t){let n=r[t];if(isNaN(n)){z(`KeyframeTrack: Value is not a valid number.`,this,t,n),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),r=this.getInterpolation()===Qe,i=e.length-1,a=1;for(let o=1;o<i;++o){let i=!1,s=e[o];if(s!==e[o+1]&&(o!==1||s!==e[0])){if(r)i=!0;else{let e=o*n,r=e-n,a=e+n;for(let o=0;o!==n;++o){let n=t[e+o];if(n!==t[r+o]||n!==t[a+o]){i=!0;break}}}}if(i){if(o!==a){e[a]=e[o];let r=o*n,i=a*n;for(let e=0;e!==n;++e)t[i+e]=t[r+e]}++a}}if(i>0){e[a]=e[i];for(let e=i*n,r=a*n,o=0;o!==n;++o)t[r+o]=t[e+o];++a}return a===e.length?(this.times=e,this.values=t):(this.times=e.slice(0,a),this.values=t.slice(0,a*n)),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,r=new n(this.name,e,t);return r.createInterpolant=this.createInterpolant,oa(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};function ga(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]+=t}function _a(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]*=t}ha.prototype.ValueTypeName=``,ha.prototype.TimeBufferType=Float32Array,ha.prototype.ValueBufferType=Float32Array,ha.prototype.DefaultInterpolation=Ze;var va=class extends ha{constructor(e,t,n){super(e,t,n)}};va.prototype.ValueTypeName=`bool`,va.prototype.ValueBufferType=Array,va.prototype.DefaultInterpolation=Xe,va.prototype.InterpolantFactoryMethodLinear=void 0,va.prototype.InterpolantFactoryMethodSmooth=void 0;var ya=class extends ha{constructor(e,t,n,r){super(e,t,n,r)}};ya.prototype.ValueTypeName=`color`;var ba=class extends ha{constructor(e,t,n,r){super(e,t,n,r)}};ba.prototype.ValueTypeName=`number`;var xa=class extends sa{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=(n-t)/(r-t),c=e*o;for(let e=c+o;c!==e;c+=4)Pt.slerpFlat(i,0,a,c-o,a,c,s);return i}},Sa=class extends ha{constructor(e,t,n,r){super(e,t,n,r)}InterpolantFactoryMethodLinear(e){return new xa(this.times,this.values,this.getValueSize(),e)}};Sa.prototype.ValueTypeName=`quaternion`,Sa.prototype.InterpolantFactoryMethodSmooth=void 0;var Ca=class extends ha{constructor(e,t,n){super(e,t,n)}};Ca.prototype.ValueTypeName=`string`,Ca.prototype.ValueBufferType=Array,Ca.prototype.DefaultInterpolation=Xe,Ca.prototype.InterpolantFactoryMethodLinear=void 0,Ca.prototype.InterpolantFactoryMethodSmooth=void 0;var wa=class extends ha{constructor(e,t,n,r){super(e,t,n,r)}};wa.prototype.ValueTypeName=`vector`;var Ta=class extends jn{static registerNode(e){this.prototype._lightNode=e}constructor(e,t=1){super(),this.isLight=!0,this.type=`Light`,this.color=new H(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},Ea=class extends Ta{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type=`HemisphereLight`,this.position.copy(jn.DEFAULT_UP),this.updateMatrix(),this.groundColor=new H(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},Da=new rn,Oa=new B,ka=new B,Aa=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Nt(512,512),this.mapType=k,this.map=null,this.mapPass=null,this.matrix=new rn,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new xi,this._frameExtents=new Nt(1,1),this._viewportCount=1,this._viewports=[new Qt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;Oa.setFromMatrixPosition(e.matrixWorld),t.position.copy(Oa),ka.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(ka),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,r){Da.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix(Da,e.coordinateSystem,e.reversedDepth);let i=this._frameExtents,a=r?r.z/i.x:1,o=r?r.w/i.y:1,s=r?r.x/i.x:0,c=r?r.y/i.y:0;e.coordinateSystem===2001||e.reversedDepth?t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply(Da)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.mapType=e.mapType,this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.mapType=this.mapType,e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},ja=new B,Ma=new Pt,Na=new B,Pa=class extends jn{constructor(){super(),this.isCamera=!0,this.type=`Camera`,this.matrixWorldInverse=new rn,this.projectionMatrix=new rn,this.projectionMatrixInverse=new rn,this.coordinateSystem=ut,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(ja,Ma,Na),Na.x===1&&Na.y===1&&Na.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ja,Ma,Na.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(ja,Ma,Na),Na.x===1&&Na.y===1&&Na.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ja,Ma,Na.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Fa=new B,Ia=new Nt,La=new Nt,Ra=class extends Pa{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type=`PerspectiveCamera`,this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=wt*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Ct*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return wt*2*Math.atan(Math.tan(Ct*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Fa.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Fa.x,Fa.y).multiplyScalar(-e/Fa.z),Fa.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Fa.x,Fa.y).multiplyScalar(-e/Fa.z)}getViewSize(e,t){return this.getViewBounds(e,Ia,La),t.subVectors(La,Ia)}setViewOffset(e,t,n,r,i,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Ct*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,i=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let e=a.fullWidth,o=a.fullHeight;i+=a.offsetX*r/e,t-=a.offsetY*n/o,r*=a.width/e,n*=a.height/o}let o=this.filmOffset;o!==0&&(i+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},za=class extends Aa{constructor(){super(new Ra(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){let t=this.camera,n=wt*2*e.angle*this.focus,r=this.mapSize.width/this.mapSize.height*this.aspect,i=e.distance||t.far;(n!==t.fov||r!==t.aspect||i!==t.far)&&(t.fov=n,t.aspect=r,t.far=i,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this.aspect=e.aspect,this}toJSON(){let e=super.toJSON();return e.focus=this.focus,e.aspect=this.aspect,e}},Ba=class extends Ta{constructor(e,t,n=0,r=Math.PI/3,i=0,a=2){super(e,t),this.isSpotLight=!0,this.type=`SpotLight`,this.position.copy(jn.DEFAULT_UP),this.updateMatrix(),this.target=new jn,this.distance=n,this.angle=r,this.penumbra=i,this.decay=a,this.map=null,this.shadow=new za}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.map=e.map,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.angle=this.angle,t.object.decay=this.decay,t.object.penumbra=this.penumbra,t.object.target=this.target.uuid,this.map&&this.map.isTexture&&(t.object.map=this.map.toJSON(e).uuid),t.object.shadow=this.shadow.toJSON(),t}},Va=class extends Aa{constructor(){super(new Ra(90,1,.5,500)),this.isPointLightShadow=!0}},Ha=class extends Ta{constructor(e,t,n=0,r=2){super(e,t),this.isPointLight=!0,this.type=`PointLight`,this.distance=n,this.decay=r,this.shadow=new Va}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}},Ua=class extends Pa{constructor(e=-1,t=1,n=1,r=-1,i=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type=`OrthographicCamera`,this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=i,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,i,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2,i=n-e,a=n+e,o=r+t,s=r-t;if(this.view!==null&&this.view.enabled){let e=(this.right-this.left)/this.view.fullWidth/this.zoom,t=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=e*this.view.offsetX,a=i+e*this.view.width,o-=t*this.view.offsetY,s=o-t*this.view.height}this.projectionMatrix.makeOrthographic(i,a,o,s,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Wa=class extends Aa{constructor(){super(new Ua(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Ga=class extends Ta{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type=`DirectionalLight`,this.position.copy(jn.DEFAULT_UP),this.updateMatrix(),this.target=new jn,this.shadow=new Wa}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}},Ka=-90,qa=1,Ja=class extends jn{constructor(e,t,n){super(),this.type=`CubeCamera`,this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new Ra(Ka,qa,e,t);r.layers=this.layers,this.add(r);let i=new Ra(Ka,qa,e,t);i.layers=this.layers,this.add(i);let a=new Ra(Ka,qa,e,t);a.layers=this.layers,this.add(a);let o=new Ra(Ka,qa,e,t);o.layers=this.layers,this.add(o);let s=new Ra(Ka,qa,e,t);s.layers=this.layers,this.add(s);let c=new Ra(Ka,qa,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,r,i,a,o,s]=t;for(let e of t)this.remove(e);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),i.up.set(0,0,-1),i.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),s.up.set(0,1,0),s.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),i.up.set(0,0,1),i.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),s.up.set(0,-1,0),s.lookAt(0,0,-1);else throw Error(`THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: `+e);for(let e of t)this.add(e),e.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[i,a,o,s,c,l]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=n.texture.mipmapsAutoUpdate;n.texture.mipmapsAutoUpdate=!1;let h=!1;h=e.isWebGLRenderer===!0?e.state.buffers.depth.getReversed():e.reversedDepthBuffer,e.setRenderTarget(n,0,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,i),e.setRenderTarget(n,1,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,4,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.mipmapsAutoUpdate=m,e.setRenderTarget(n,5,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(u,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},Ya=class extends Ra{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e,this.perCameraFrustumCulled=!1}},Xa=`\\[\\]\\.:\\/`,Za=RegExp(`[\\[\\]\\.:\\/]`,`g`),Qa=`[^\\[\\]\\.:\\/]`,$a=`[^`+Xa.replace(`\\.`,``)+`]`,eo=`((?:WC+[\\/:])*)`.replace(`WC`,Qa),to=`(WCOD+)?`.replace(`WCOD`,$a),no=`(?:\\.(WC+)(?:\\[(.+)\\])?)?`.replace(`WC`,Qa),ro=`\\.(WC+)(?:\\[(.+)\\])?`.replace(`WC`,Qa),io=RegExp(`^`+eo+to+no+ro+`$`),ao=[`material`,`materials`,`bones`,`map`],oo=class{constructor(e,t,n){let r=n||so.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,r=this._bindings[n];r!==void 0&&r.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let r=this._targetGroup.nCachedObjects_,i=n.length;r!==i;++r)n[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},so=class e{constructor(t,n,r){this.path=n,this.parsedPath=r||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,r){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,r):new e(t,n,r)}static sanitizeNodeName(e){return e.replace(/\s/g,`_`).replace(Za,``)}static parseTrackName(e){let t=io.exec(e);if(t===null)throw Error(`THREE.PropertyBinding: Cannot parse trackName: `+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=n.nodeName&&n.nodeName.lastIndexOf(`.`);if(r!==void 0&&r!==-1){let e=n.nodeName.substring(r+1);ao.indexOf(e)!==-1&&(n.nodeName=n.nodeName.substring(0,r),n.objectName=e)}if(n.propertyName===null||n.propertyName.length===0)throw Error(`THREE.PropertyBinding: can not parse propertyName from trackName: `+e);return n}static findNode(e,t){if(t===void 0||t===``||t===`.`||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(e){for(let r=0;r<e.length;r++){let i=e[r];if(i.name===t||i.uuid===t)return i;let a=n(i.children);if(a)return a}return null},r=n(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)e[t++]=n[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let t=this.node,n=this.parsedPath,r=n.objectName,i=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){R(`PropertyBinding: No target node found for track: `+this.path+`.`);return}if(r){let e=n.objectIndex;switch(r){case`materials`:if(!t.material){z(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.materials){z(`PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.`,this);return}t=t.material.materials;break;case`bones`:if(!t.skeleton){z(`PropertyBinding: Can not bind to bones as node does not have a skeleton.`,this);return}t=t.skeleton.bones;for(let n=0;n<t.length;n++)if(t[n].name===e){e=n;break}break;case`map`:if(`map`in t){t=t.map;break}if(!t.material){z(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.map){z(`PropertyBinding: Can not bind to material.map as node.material does not have a map.`,this);return}t=t.material.map;break;default:if(t[r]===void 0){z(`PropertyBinding: Can not bind to objectName of node undefined.`,this);return}t=t[r]}if(e!==void 0){if(t[e]===void 0){z(`PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.`,this,t);return}t=t[e]}}let o=t[i];if(o===void 0){let e=n.nodeName;z(`PropertyBinding: Trying to update property for track: `+e+`.`+i+` but it wasn't found.`,t);return}let s=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?s=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(s=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(a!==void 0){if(i===`morphTargetInfluences`){if(!t.geometry){z(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.`,this);return}if(!t.geometry.morphAttributes){z(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.`,this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=a}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][s]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};so.Composite=oo,so.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},so.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},so.prototype.GetterByBindingType=[so.prototype._getValue_direct,so.prototype._getValue_array,so.prototype._getValue_arrayElement,so.prototype._getValue_toArray],so.prototype.SetterByBindingTypeAndVersioning=[[so.prototype._setValue_direct,so.prototype._setValue_direct_setNeedsUpdate,so.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[so.prototype._setValue_array,so.prototype._setValue_array_setNeedsUpdate,so.prototype._setValue_array_setMatrixWorldNeedsUpdate],[so.prototype._setValue_arrayElement,so.prototype._setValue_arrayElement_setNeedsUpdate,so.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[so.prototype._setValue_fromArray,so.prototype._setValue_fromArray_setNeedsUpdate,so.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]],class{static{this.prototype.isMatrix2=!0}constructor(e,t,n,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,r){let i=this.elements;return i[0]=e,i[2]=t,i[1]=n,i[3]=r,this}};function co(e,t,n,r){let i=lo(r);switch(n){case ce:return e*t;case pe:return e*t/i.components*i.byteLength;case me:return e*t/i.components*i.byteLength;case he:return e*t*2/i.components*i.byteLength;case ge:return e*t*2/i.components*i.byteLength;case le:return e*t*3/i.components*i.byteLength;case ue:return e*t*4/i.components*i.byteLength;case _e:return e*t*4/i.components*i.byteLength;case ve:case ye:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case be:case xe:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Ce:case Te:return Math.max(e,16)*Math.max(t,8)/4;case Se:case we:return Math.max(e,8)*Math.max(t,8)/2;case Ee:case De:case ke:case Ae:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case Oe:case je:case Me:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Ne:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Pe:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case Fe:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case P:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case Ie:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case Le:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case Re:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case F:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case ze:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case I:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case L:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case Be:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case Ve:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case He:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case Ue:case We:case Ge:return Math.ceil(e/4)*Math.ceil(t/4)*16;case Ke:case qe:return Math.ceil(e/4)*Math.ceil(t/4)*8;case Je:case Ye:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function lo(e){switch(e){case k:case A:return{byteLength:1,components:1};case M:case j:case re:return{byteLength:2,components:1};case ie:case ae:return{byteLength:2,components:4};case te:case ee:case ne:return{byteLength:4,components:1};case se:case N:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`register`,{detail:{revision:`187`}})),typeof window<`u`&&(window.__THREE__?R(`WARNING: Multiple instances of Three.js being imported.`):window.__THREE__=`187`);function uo(){let e=null,t=!1,n=null,r=null;function i(t,a){r=e.requestAnimationFrame(i),n(t,a)}return{start:function(){t!==!0&&n!==null&&e!==null&&(r=e.requestAnimationFrame(i),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),t=!1},setAnimationLoop:function(e){n=e},setContext:function(t){e=t}}}function fo(e){let t=new WeakMap;function n(t,n){let r=t.array,i=t.usage,a=r.byteLength,o=e.createBuffer();e.bindBuffer(n,o),e.bufferData(n,r,i),t.onUploadCallback();let s;if(r instanceof Float32Array)s=e.FLOAT;else if(typeof Float16Array<`u`&&r instanceof Float16Array)s=e.HALF_FLOAT;else if(r instanceof Uint16Array)s=t.isFloat16BufferAttribute?e.HALF_FLOAT:e.UNSIGNED_SHORT;else if(r instanceof Int16Array)s=e.SHORT;else if(r instanceof Uint32Array)s=e.UNSIGNED_INT;else if(r instanceof Int32Array)s=e.INT;else if(r instanceof Int8Array)s=e.BYTE;else if(r instanceof Uint8Array)s=e.UNSIGNED_BYTE;else if(r instanceof Uint8ClampedArray)s=e.UNSIGNED_BYTE;else throw Error(`THREE.WebGLAttributes: Unsupported buffer data format: `+r);return{buffer:o,type:s,bytesPerElement:r.BYTES_PER_ELEMENT,version:t.version,size:a}}function r(t,n,r){let i=n.array,a=n.updateRanges;if(e.bindBuffer(r,t),a.length===0)e.bufferSubData(r,0,i);else{a.sort((e,t)=>e.start-t.start);let t=0;for(let e=1;e<a.length;e++){let n=a[t],r=a[e];r.start<=n.start+n.count+1?n.count=Math.max(n.count,r.start+r.count-n.start):(++t,a[t]=r)}a.length=t+1;for(let t=0,n=a.length;t<n;t++){let n=a[t];e.bufferSubData(r,n.start*i.BYTES_PER_ELEMENT,i,n.start,n.count)}n.clearUpdateRanges()}n.onUploadCallback()}function i(e){return e.isInterleavedBufferAttribute&&(e=e.data),t.get(e)}function a(n){n.isInterleavedBufferAttribute&&(n=n.data);let r=t.get(n);r&&(e.deleteBuffer(r.buffer),t.delete(n))}function o(e,i){if(e.isInterleavedBufferAttribute&&(e=e.data),e.isGLBufferAttribute){let n=t.get(e);(!n||n.version<e.version)&&t.set(e,{buffer:e.buffer,type:e.type,bytesPerElement:e.elementSize,version:e.version});return}let a=t.get(e);if(a===void 0)t.set(e,n(e,i));else if(a.version<e.version){if(a.size!==e.array.byteLength)throw Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);r(a.buffer,e,i),a.version=e.version}}return{get:i,remove:a,update:o}}var U={alphahash_fragment:`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,alphahash_pars_fragment:`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,alphamap_fragment:`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,alphamap_pars_fragment:`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,alphatest_fragment:`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,alphatest_pars_fragment:`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,aomap_fragment:`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,aomap_pars_fragment:`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,batching_pars_vertex:`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,batching_vertex:`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,begin_vertex:`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,beginnormal_vertex:`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,bsdfs:`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,iridescence_fragment:`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,bumpmap_pars_fragment:`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,clipping_planes_fragment:`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,clipping_planes_pars_fragment:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,clipping_planes_pars_vertex:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,clipping_planes_vertex:`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,color_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,common:`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,displacementmap_pars_vertex:`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,displacementmap_vertex:`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,emissivemap_fragment:`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,emissivemap_pars_fragment:`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,colorspace_fragment:`gl_FragColor = linearToOutputTexel( gl_FragColor );`,colorspace_pars_fragment:`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,envmap_fragment:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	uniform samplerCube envMap;
	#ifdef ENVMAP_TYPE_PMREM
		float roughnessToMip( const in float roughness ) {
			float r = clamp( roughness, 0.0, 1.0 );
			return ENVMAP_MAX_LOD * r * ( 2.0 - r );
		}
	#endif
#endif`,envmap_pars_fragment:`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,envmap_pars_vertex:`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,envmap_physical_pars_fragment:`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * worldNormal, ENVMAP_MAX_LOD );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * reflectVec, roughnessToMip( roughness ) );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureLod( envMap, envMapRotation * retroVec, roughnessToMip( roughness ) );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_PMREM
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,envmap_vertex:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,fog_vertex:`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fog_pars_vertex:`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fog_fragment:`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,fog_pars_fragment:`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gradientmap_pars_fragment:`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,lightmap_pars_fragment:`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lights_lambert_fragment:`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lights_lambert_pars_fragment:`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lights_pars_begin:`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,lights_toon_fragment:`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lights_toon_pars_fragment:`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lights_phong_fragment:`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lights_phong_pars_fragment:`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lights_physical_fragment:`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.045 );
material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef USE_DIFFUSE_ROUGHNESS
	float diffuseRoughnessFactor = diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		diffuseRoughnessFactor *= texture2D( diffuseRoughnessMap, vDiffuseRoughnessMapUv ).r;
	#endif
	material.diffuseRoughness = saturate( diffuseRoughnessFactor );
#endif
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.045 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,lights_physical_pars_fragment:`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float diffuseRoughness;
	#endif
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
#ifdef USE_DIFFUSE_ROUGHNESS
	const float EON_EPSILON = 1e-7;
	float FON_DirectionalAlbedo( const in float mu, const in float roughness, const in float A ) {
		float muComp = 1.0 - mu;
		float gOverPi = muComp * ( 0.0571085289 + muComp * ( 0.491881867 + muComp * ( - 0.332181442 + muComp * 0.0714429953 ) ) );
		return A * ( 1.0 + roughness * gOverPi );
	}
	vec3 BRDF_EON( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 diffuseColor, const in float roughness ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return BRDF_Lambert( rho );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float s = dot( lightDir, viewDir ) - dotNL * dotNV;
		float sOverT = ( s > 0.0 ) ? s / max( max( dotNL, dotNV ), EON_EPSILON ) : s;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		vec3 singleScatter = rho * RECIPROCAL_PI * A * ( 1.0 + roughness * sOverT );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		float albedoV = FON_DirectionalAlbedo( dotNV, roughness, A );
		float albedoL = FON_DirectionalAlbedo( dotNL, roughness, A );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		vec3 multiScatter = rhoMultiScatter * RECIPROCAL_PI
			* max( EON_EPSILON, 1.0 - albedoV )
			* max( EON_EPSILON, 1.0 - albedoL )
			/ max( EON_EPSILON, 1.0 - averageAlbedo );
		return singleScatter + multiScatter;
	}
	vec3 EON_DirectionalAlbedo( const in vec3 diffuseColor, const in float roughness, const in float dotNV ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return rho;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		float directionalAlbedo = FON_DirectionalAlbedo( dotNV, roughness, A );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		return rho * directionalAlbedo + rhoMultiScatter * ( 1.0 - directionalAlbedo );
	}
#endif
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = max( material.clearcoatRoughness, 0.045 );
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = max( material.roughness, 0.045 );
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float alphaT = max( material.alphaT, alpha );
		float V = V_GGX_SmithCorrelated_Anisotropic( alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		vec3 diffuseBRDF = BRDF_EON( directLight.direction, geometryViewDir, geometryNormal, material.diffuseColor, material.diffuseRoughness ) * ( 1.0 - material.metalness );
	#else
		vec3 diffuseBRDF = BRDF_Lambert( material.diffuseContribution );
	#endif
	reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuseAlbedo = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness );
		vec3 diffuse = irradiance * RECIPROCAL_PI * diffuseAlbedo * ( 1.0 - singleScattering - multiScattering );
	#else
		vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#endif
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuse = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness ) * ( 1.0 - totalScatteringDielectric );
	#else
		vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	#endif
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,lights_fragment_begin:`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_LIGHT_PROBE_GRIDS > 0
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		int probeGrid = - 1;
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( isInsideLightProbeGrid( probeWorldPos, probeWorldNormal, probesMin[ i ], probesMax[ i ], probesResolution[ i ] ) ) probeGrid = UNROLLED_LOOP_INDEX;
		}
		#pragma unroll_loop_end
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( probeGrid == UNROLLED_LOOP_INDEX ) irradiance += getLightProbeGridIrradiance( probesSH[ i ], probesMin[ i ], probesMax[ i ], probesResolution[ i ], probeWorldPos, probeWorldNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,lights_fragment_maps:`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_PMREM )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,lightprobes_pars_fragment:`#if NUM_LIGHT_PROBE_GRIDS > 0
uniform highp sampler3D probesSH[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMin[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMax[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesResolution[ NUM_LIGHT_PROBE_GRIDS ];
bool isInsideLightProbeGrid( vec3 worldPos, vec3 worldNormal, vec3 probesMin, vec3 probesMax, vec3 probesResolution ) {
	vec3 spacing = ( probesMax - probesMin ) / probesResolution;
	vec3 samplePos = worldPos + worldNormal * spacing * 0.5;
	vec3 margin = spacing * 0.01;
	return all( greaterThanEqual( samplePos, probesMin - margin ) ) && all( lessThanEqual( samplePos, probesMax + margin ) );
}
vec3 getLightProbeGridIrradiance( highp sampler3D probesSH, vec3 probesMin, vec3 probesMax, vec3 probesResolution, vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 probeSpacing = gridRange / res;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.5 / res, 1.0 - 0.5 / res );
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,map_fragment:`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,map_pars_fragment:`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,map_particle_fragment:`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,map_particle_pars_fragment:`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,metalnessmap_fragment:`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,metalnessmap_pars_fragment:`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,morphinstance_vertex:`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,morphcolor_vertex:`#if defined( USE_MORPHCOLORS )
	#if defined( USE_COLOR_ALPHA )
		vColor *= morphTargetBaseInfluence;
	#elif defined( USE_COLOR )
		vColor.rgb *= morphTargetBaseInfluence;
	#endif
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor.rgb += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,morphnormal_vertex:`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,morphtarget_pars_vertex:`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,morphtarget_vertex:`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,normal_fragment_begin:`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,normal_fragment_maps:`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,normal_pars_fragment:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_pars_vertex:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_vertex:`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,normalmap_pars_fragment:`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,clearcoat_normal_fragment_begin:`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,clearcoat_normal_fragment_maps:`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,clearcoat_pars_fragment:`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iridescence_pars_fragment:`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,opaque_fragment:`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,packing:`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,premultiplied_alpha_fragment:`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,project_vertex:`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dithering_fragment:`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dithering_pars_fragment:`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,roughnessmap_fragment:`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,roughnessmap_pars_fragment:`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,shadowmap_pars_fragment:`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				vec2 radius = shadowRadius * texelSize;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float lightDistance = length( lightToPosition );
			float depthRange = shadowCameraFar - shadowCameraNear;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float depthA = - shadowCameraNear / depthRange - shadowBias;
				float depthB = shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#else
				float depthA = shadowCameraFar / depthRange + shadowBias;
				float depthB = - shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			shadow = 0.0;
			for ( int i = 0; i < 5; i ++ ) {
				vec2 offset = vogelDiskSample( i, 5, phi );
				vec3 direction = bd3D + ( tangent * offset.x + bitangent * offset.y ) * texelSize;
				vec3 absDirection = abs( direction );
				float dp = depthA + depthB / max( max( absDirection.x, absDirection.y ), absDirection.z );
				shadow += texture( shadowMap, vec4( direction, dp ) );
			}
			shadow *= 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,shadowmask_pars_fragment:`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,skinbase_vertex:`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,skinning_pars_vertex:`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,skinning_vertex:`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,skinnormal_vertex:`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,specularmap_fragment:`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,specularmap_pars_fragment:`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tonemapping_fragment:`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tonemapping_pars_fragment:`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,transmission_fragment:`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,transmission_pars_fragment:`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,uv_pars_fragment:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_pars_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	uniform mat3 diffuseRoughnessMapTransform;
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	vDiffuseRoughnessMapUv = ( diffuseRoughnessMapTransform * vec3( DIFFUSE_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,worldpos_vertex:`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <envmap_common_pars_fragment>
void main() {
	#ifdef ENVMAP_TYPE_PMREM
		vec4 texColor = textureLod( envMap, backgroundRotation * vWorldDirection, roughnessToMip( backgroundBlurriness ) );
	#else
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,depth_frag:`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,distance_vert:`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,distance_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,linedashed_frag:`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,meshbasic_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,meshbasic_frag:`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshlambert_vert:`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshmatcap_vert:`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,meshmatcap_frag:`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshnormal_vert:`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshphysical_vert:`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,meshphysical_frag:`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DIFFUSE_ROUGHNESS
	uniform float diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		uniform sampler2D diffuseRoughnessMap;
	#endif
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshtoon_vert:`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,points_vert:`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,points_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,shadow_vert:`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sprite_vert:`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sprite_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`},W={common:{diffuse:{value:new H(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new V},alphaMap:{value:null},alphaMapTransform:{value:new V},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new V}},envmap:{envMap:{value:null},envMapRotation:{value:new V},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new V}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new V}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new V},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new V},normalScale:{value:new Nt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new V},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new V}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new V}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new V}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new H(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new H(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new V},alphaTest:{value:0},uvTransform:{value:new V}},sprite:{diffuse:{value:new H(16777215)},opacity:{value:1},center:{value:new Nt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new V},alphaMap:{value:null},alphaMapTransform:{value:new V},alphaTest:{value:0}}},po={basic:{uniforms:qi([W.common,W.specularmap,W.envmap,W.aomap,W.lightmap,W.fog]),vertexShader:U.meshbasic_vert,fragmentShader:U.meshbasic_frag},lambert:{uniforms:qi([W.common,W.specularmap,W.envmap,W.aomap,W.lightmap,W.emissivemap,W.bumpmap,W.normalmap,W.displacementmap,W.fog,W.lights,{emissive:{value:new H(0)},envMapIntensity:{value:1}}]),vertexShader:U.meshlambert_vert,fragmentShader:U.meshlambert_frag},phong:{uniforms:qi([W.common,W.specularmap,W.envmap,W.aomap,W.lightmap,W.emissivemap,W.bumpmap,W.normalmap,W.displacementmap,W.fog,W.lights,{emissive:{value:new H(0)},specular:{value:new H(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:U.meshphong_vert,fragmentShader:U.meshphong_frag},standard:{uniforms:qi([W.common,W.envmap,W.aomap,W.lightmap,W.emissivemap,W.bumpmap,W.normalmap,W.displacementmap,W.roughnessmap,W.metalnessmap,W.fog,W.lights,{emissive:{value:new H(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:U.meshphysical_vert,fragmentShader:U.meshphysical_frag},toon:{uniforms:qi([W.common,W.aomap,W.lightmap,W.emissivemap,W.bumpmap,W.normalmap,W.displacementmap,W.gradientmap,W.fog,W.lights,{emissive:{value:new H(0)}}]),vertexShader:U.meshtoon_vert,fragmentShader:U.meshtoon_frag},matcap:{uniforms:qi([W.common,W.bumpmap,W.normalmap,W.displacementmap,W.fog,{matcap:{value:null}}]),vertexShader:U.meshmatcap_vert,fragmentShader:U.meshmatcap_frag},points:{uniforms:qi([W.points,W.fog]),vertexShader:U.points_vert,fragmentShader:U.points_frag},dashed:{uniforms:qi([W.common,W.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:U.linedashed_vert,fragmentShader:U.linedashed_frag},depth:{uniforms:qi([W.common,W.displacementmap]),vertexShader:U.depth_vert,fragmentShader:U.depth_frag},normal:{uniforms:qi([W.common,W.bumpmap,W.normalmap,W.displacementmap,{opacity:{value:1}}]),vertexShader:U.meshnormal_vert,fragmentShader:U.meshnormal_frag},sprite:{uniforms:qi([W.sprite,W.fog]),vertexShader:U.sprite_vert,fragmentShader:U.sprite_frag},background:{uniforms:{uvTransform:{value:new V},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:U.background_vert,fragmentShader:U.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new V}},vertexShader:U.backgroundCube_vert,fragmentShader:U.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:U.cube_vert,fragmentShader:U.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:U.equirect_vert,fragmentShader:U.equirect_frag},distance:{uniforms:qi([W.common,W.displacementmap,{referencePosition:{value:new B},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:U.distance_vert,fragmentShader:U.distance_frag},shadow:{uniforms:qi([W.lights,W.fog,{color:{value:new H(0)},opacity:{value:1}}]),vertexShader:U.shadow_vert,fragmentShader:U.shadow_frag}};po.physical={uniforms:qi([po.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new V},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new V},clearcoatNormalScale:{value:new Nt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new V},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new V},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new V},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new V},sheen:{value:0},sheenColor:{value:new H(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new V},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new V},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new V},transmissionSamplerSize:{value:new Nt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new V},attenuationDistance:{value:0},attenuationColor:{value:new H(0)},specularColor:{value:new H(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new V},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new V},anisotropyVector:{value:new Nt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new V}}]),vertexShader:U.meshphysical_vert,fragmentShader:U.meshphysical_frag};var mo={r:0,b:0,g:0},ho=new rn,go=new V;go.set(-1,0,0,0,1,0,0,0,1);function _o(e,t,n,r,i,a){let o=new H(0),s=i===!0?0:1,c,l,u=null,d=0,f=null;function p(e){let n=e.isScene===!0?e.background:null;if(n&&n.isTexture){let r=e.backgroundBlurriness>0;n=t.get(n,r)}return n}function m(t){let r=!1,i=p(t);i===null?g(o,s):i&&i.isColor&&(g(i,1),r=!0);let c=e.xr.getEnvironmentBlendMode();c===`additive`?n.buffers.color.setClear(0,0,0,1,a):c===`alpha-blend`&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||r)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function h(t,n){let i=p(n);i&&i.isCubeTexture?(l===void 0&&(l=new ai(new Fi(1,1,1),new ea({name:`BackgroundCubeMaterial`,uniforms:Ki(po.backgroundCube.uniforms),vertexShader:po.backgroundCube.vertexShader,fragmentShader:po.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute(`normal`),l.geometry.deleteAttribute(`uv`),l.onBeforeRender=function(e,t,n){this.matrixWorld.copyPosition(n.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(l)),l.material.uniforms.envMap.value=i,l.material.uniforms.backgroundBlurriness.value=n.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(ho.makeRotationFromEuler(n.backgroundRotation)).transpose(),i.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(go),l.material.toneMapped=Vt.getTransfer(i.colorSpace)!==st,(u!==i||d!==i.version||f!==e.toneMapping)&&(l.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),l.layers.enableAll(),t.unshift(l,l.geometry,l.material,0,0,null)):i&&i.isTexture&&(c===void 0&&(c=new ai(new Vi(2,2),new ea({name:`BackgroundMaterial`,uniforms:Ki(po.background.uniforms),vertexShader:po.background.vertexShader,fragmentShader:po.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute(`normal`),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=i,c.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,c.material.toneMapped=Vt.getTransfer(i.colorSpace)!==st,i.matrixAutoUpdate===!0&&i.updateMatrix(),c.material.uniforms.uvTransform.value.copy(i.matrix),(u!==i||d!==i.version||f!==e.toneMapping)&&(c.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),c.layers.enableAll(),t.unshift(c,c.geometry,c.material,0,0,null))}function g(t,r){t.getRGB(mo,Xi(e)),n.buffers.color.setClear(mo.r,mo.g,mo.b,r,a)}function _(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(e,t=1){o.set(e),s=t,g(o,s)},getClearAlpha:function(){return s},setClearAlpha:function(e){s=e,g(o,s)},render:m,addToRenderList:h,dispose:_}}function vo(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},i=f(null),a=i,o=!1;function s(n,r,i,s,c){let u=!1,f=d(n,s,i,r);a!==f&&(a=f,l(a.object)),u=p(n,s,i,c),u&&m(n,s,i,c),c!==null&&t.update(c,e.ELEMENT_ARRAY_BUFFER),(u||o)&&(o=!1,b(n,r,i,s),c!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(c).buffer))}function c(){return e.createVertexArray()}function l(t){return e.bindVertexArray(t)}function u(t){return e.deleteVertexArray(t)}function d(e,t,n,i){let a=i.wireframe===!0,o=r[t.id];o===void 0&&(o={},r[t.id]=o);let s=e.isInstancedMesh===!0?e.id:0,l=o[s];l===void 0&&(l={},o[s]=l);let u=l[n.id];u===void 0&&(u={},l[n.id]=u);let d=u[a];return d===void 0&&(d=f(c()),u[a]=d),d}function f(e){let t=[],r=[],i=[];for(let e=0;e<n;e++)t[e]=0,r[e]=0,i[e]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:t,enabledAttributes:r,attributeDivisors:i,object:e,attributes:{},index:null}}function p(e,t,n,r){let i=a.attributes,o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=i[t],r=o[t];if(r===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(r=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(r=e.instanceColor)),n===void 0||n.attribute!==r||r&&n.data!==r.data)return!0;s++}return a.attributesNum!==s||a.index!==r}function m(e,t,n,r){let i={},o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=o[t];n===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(n=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(n=e.instanceColor));let r={};r.attribute=n,n&&n.data&&(r.data=n.data),i[t]=r,s++}a.attributes=i,a.attributesNum=s,a.index=r}function h(){let e=a.newAttributes;for(let t=0,n=e.length;t<n;t++)e[t]=0}function g(e){_(e,0)}function _(t,n){let r=a.newAttributes,i=a.enabledAttributes,o=a.attributeDivisors;r[t]=1,i[t]===0&&(e.enableVertexAttribArray(t),i[t]=1),o[t]!==n&&(e.vertexAttribDivisor(t,n),o[t]=n)}function v(){let t=a.newAttributes,n=a.enabledAttributes;for(let r=0,i=n.length;r<i;r++)n[r]!==t[r]&&(e.disableVertexAttribArray(r),n[r]=0)}function y(t,n,r,i,a,o,s){s===!0?e.vertexAttribIPointer(t,n,r,a,o):e.vertexAttribPointer(t,n,r,i,a,o)}function b(n,r,i,a){h();let o=a.attributes,s=i.getAttributes(),c=r.defaultAttributeValues;for(let r in s){let i=s[r];if(i.location>=0){let s=o[r];if(s===void 0&&(r===`instanceMatrix`&&n.instanceMatrix&&(s=n.instanceMatrix),r===`instanceColor`&&n.instanceColor&&(s=n.instanceColor)),s!==void 0){let r=s.normalized,o=s.itemSize,c=t.get(s);if(c===void 0)continue;let l=c.buffer,u=c.type,d=c.bytesPerElement,f=u===e.INT||u===e.UNSIGNED_INT||s.gpuType===1013;if(s.isInterleavedBufferAttribute){let t=s.data,c=t.isInterleavedBuffer===!0?t.stride:t.itemSize,p=s.offset;if(t.isInstancedInterleavedBuffer||t.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,t.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=t.meshPerAttribute*t.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,c*d,(p+o/i.locationSize*e)*d,f)}else{if(s.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,s.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=s.meshPerAttribute*s.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,o*d,o/i.locationSize*e*d,f)}}else if(c!==void 0){let t=c[r];if(t!==void 0)switch(t.length){case 2:e.vertexAttrib2fv(i.location,t);break;case 3:e.vertexAttrib3fv(i.location,t);break;case 4:e.vertexAttrib4fv(i.location,t);break;default:e.vertexAttrib1fv(i.location,t)}}}}v()}function x(){T();for(let e in r){let t=r[e];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e]}}function S(e){if(r[e.id]===void 0)return;let t=r[e.id];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e.id]}function C(e){for(let t in r){let n=r[t];for(let t in n){let r=n[t];if(r[e.id]===void 0)continue;let i=r[e.id];for(let e in i)u(i[e].object),delete i[e];delete r[e.id]}}}function w(e){for(let t in r){let n=r[t],i=e.isInstancedMesh===!0?e.id:0,a=n[i];if(a!==void 0){for(let e in a){let t=a[e];for(let e in t)u(t[e].object),delete t[e];delete a[e]}delete n[i],Object.keys(n).length===0&&delete r[t]}}}function T(){E(),o=!0,a!==i&&(a=i,l(a.object))}function E(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:s,reset:T,resetDefaultState:E,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfObject:w,releaseStatesOfProgram:C,initAttributes:h,enableAttribute:g,disableUnusedAttributes:v}}function yo(e,t,n){let r;function i(e){r=e}function a(t,i){e.drawArrays(r,t,i),n.update(i,r,1)}function o(t,i,a){a!==0&&(e.drawArraysInstanced(r,t,i,a),n.update(i,r,a))}function s(e,i,a){if(a===0)return;t.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(r,e,0,i,0,a);let o=0;for(let e=0;e<a;e++)o+=i[e];n.update(o,r,1)}this.setMode=i,this.render=a,this.renderInstances=o,this.renderMultiDraw=s}function bo(e,t,n,r){let i;function a(){if(i!==void 0)return i;if(t.has(`EXT_texture_filter_anisotropic`)===!0){let n=t.get(`EXT_texture_filter_anisotropic`);i=e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(t){return t===1023||r.convert(t)===e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT)}function s(n){let i=n===1016&&(t.has(`EXT_color_buffer_half_float`)||t.has(`EXT_color_buffer_float`));return!(n!==1009&&n!==1015&&!i&&r.convert(n)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function c(t){if(t===`highp`){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return`highp`;t=`mediump`}return t===`mediump`&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?`mediump`:`lowp`}let l=n.precision===void 0?`highp`:n.precision,u=c(l);u!==l&&(R(`WebGLRenderer:`,l,`not supported, using`,u,`instead.`),l=u);let d=n.reversedDepthBuffer===!0&&t.has(`EXT_clip_control`),f=n.logarithmicDepthBuffer===!0&&d===!1;n.reversedDepthBuffer===!0&&d===!1&&R(`WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.`),n.logarithmicDepthBuffer===!0&&d===!0&&R(`WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.`);let p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),h=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),_=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),b=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),x=e.getParameter(e.MAX_SAMPLES),S=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:s,precision:l,logarithmicDepthBuffer:f,reversedDepthBuffer:d,maxTextures:p,maxVertexTextures:m,maxTextureSize:h,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:b,maxSamples:x,samples:S}}function xo(e){let t=this,n=null,r=0,i=!1,a=!1,o=new zr,s=new V,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(e,t){let n=e.length!==0||t||r!==0||i;return i=t,r=e.length,n},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(e,t){n=u(e,t,0)},this.setState=function(t,o,s){let d=t.clippingPlanes,f=t.clipIntersection,p=t.clipShadows,m=e.get(t);if(!i||d===null||d.length===0||a&&!p)a?u(null):l();else{let e=a?0:r,t=e*4,i=m.clippingState||null;c.value=i,i=u(d,o,t,s);for(let e=0;e!==t;++e)i[e]=n[e];m.clippingState=i,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=e}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=r>0),t.numPlanes=r,t.numIntersection=0}function u(e,n,r,i){let a=e===null?0:e.length,l=null;if(a!==0){if(l=c.value,i!==!0||l===null){let t=r+a*4,i=n.matrixWorldInverse;s.getNormalMatrix(i),(l===null||l.length<t)&&(l=new Float32Array(t));for(let t=0,n=r;t!==a;++t,n+=4)o.copy(e[t]).applyMatrix4(i,s),o.normal.toArray(l,n),l[n+3]=o.constant}c.value=l,c.needsUpdate=!0}return t.numPlanes=a,t.numIntersection=0,l}}var So=class extends en{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new ji(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new Fi(5,5,5),i=new ea({name:`CubemapFromEquirect`,uniforms:Ki(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});i.uniforms.tEquirect.value=t;let a=new ai(r,i),o=t.minFilter;return t.minFilter===1008&&(t.minFilter=E),new Ja(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){let i=e.getRenderTarget();for(let i=0;i<6;i++)e.setRenderTarget(this,i),e.clear(t,n,r);e.setRenderTarget(i)}},Co=256,wo=3,To=20,Eo=256,Do=16,Oo=3,ko=new B,Ao=new H,jo=class e{constructor(e){this._renderer=e,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new Ja(1,10,null),this._boxMesh=new ai(new Fi(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(e,t=0,n=.1,r=100,i={}){let{size:a=256,position:o=ko}=i,s=this._renderer;this._setSize(a);let c=this._allocateTarget(),l=this._getSourceTarget(!0);t>0&&(l.texture.mipmapsAutoUpdate=!1);let u=s.autoClear,d=s.autoClearColor,f=s.autoClearDepth,p=s.autoClearStencil,m=e.background;s.autoClear=!0,s.autoClearColor=!0,s.autoClearDepth=!0,s.autoClearStencil=!0,m===null&&(e.background=s.getClearColor(Ao));let h=new Ja(n,r,l);return h.position.copy(o),h.update(s,e),s.autoClear=u,s.autoClearColor=d,s.autoClearDepth=f,s.autoClearStencil=p,e.background=m,t>0&&(l.texture.mipmapsAutoUpdate=!0,this._blur(c,t)),this._applyPMREM(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Ro(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Lo(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(e,t){return t>0?1-Math.sqrt(1-e/t):0}_setSize(e){this._cubeSize=Math.max(Co,kt(e))}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?Co:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4);let n=t||this._allocateTarget();return this._textureToCubemap(e),this._applyPMREM(n),n}_allocateTarget(){let e=this._cubeSize,t=Mo(e,!1,!1),n=Math.log2(e)-wo;for(let r=0;r<=n;r++)t.texture.mipmaps.push({width:e>>r,height:e>>r});return t.texture.name=`PMREM`,t.texture.isPMREMTexture=!0,t}_getSourceTarget(e=!1){let t=this._cubeSize,n=this._sourceTarget;return(n===null||n.width!==t||e&&n.depthBuffer===!1)&&(n!==null&&n.dispose(),this._sourceTarget=Mo(t,!0,e)),this._sourceTarget}_compileMaterial(e){this._boxMesh.material=e,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(e,t,n){let r=this._boxMesh,i=this._cubeCamera;r.material=n,i.renderTarget=e,i.activeMipmapLevel=t;let a=e.width>>t;e.viewport.set(0,0,a,a),i.update(this._renderer,r),e.viewport.set(0,0,e.width,e.height)}_textureToCubemap(e){let t;e.mapping===301||e.mapping===302?(this._cubemapMaterial===null&&(this._cubemapMaterial=Ro()),t=this._cubemapMaterial,t.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=Lo()),t=this._equirectMaterial),t.uniforms.envMap.value=e,this._renderCube(this._getSourceTarget(),0,t)}_applyPMREM(t){this._ggxMaterial===null&&(this._ggxMaterial=Po(),this._integrationMaterial=Fo());let n=this._cubeSize,r=t.texture.mipmaps.length-1,i=this._ggxMaterial.uniforms;i.envMap.value=this._sourceTarget.texture;let a=this._integrationMaterial.uniforms;a.envMap.value=this._sourceTarget.texture,a.sourceLod.value=Math.log2(n/Do);for(let o=0;o<=r;o++){let s=e.lodToRoughness(o,r);if(o>r-Oo)a.roughness.value=s,this._renderCube(t,o,this._integrationMaterial);else{let e=s>0?Math.log2(n)+.5*Math.log2(6/(Eo*s**4))+.5:0;i.roughness.value=s,i.lodBias.value=e,this._renderCube(t,o,this._ggxMaterial)}}}_blur(e,t){this._blurMaterial===null&&(this._blurMaterial=Io());let n=this._blurMaterial,r=n.uniforms,i=this._sourceTarget;r.sigma.value=Math.min(t,Math.PI)/Math.SQRT2,r.envMap.value=i.texture,this._renderCube(e,0,n),r.envMap.value=e.texture,this._renderCube(i,0,n)}};function Mo(e,t,n){return new So(e,{minFilter:O,generateMipmaps:t,type:re,colorSpace:at,depthBuffer:n})}function No(e,t,n){return new ea({name:e,uniforms:t,vertexShader:U.cube_vert,fragmentShader:n,side:1,blending:0,depthTest:!1,depthWrite:!1})}function Po(){return No(`PMREMGGXConvolution`,{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${Eo}u

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float lodBias;

		#include <common>

		// Van der Corput radical inverse
		float radicalInverse_VdC( uint bits ) {

			bits = ( bits << 16u ) | ( bits >> 16u );
			bits = ( ( bits & 0x55555555u ) << 1u ) | ( ( bits & 0xAAAAAAAAu ) >> 1u );
			bits = ( ( bits & 0x33333333u ) << 2u ) | ( ( bits & 0xCCCCCCCCu ) >> 2u );
			bits = ( ( bits & 0x0F0F0F0Fu ) << 4u ) | ( ( bits & 0xF0F0F0F0u ) >> 4u );
			bits = ( ( bits & 0x00FF00FFu ) << 8u ) | ( ( bits & 0xFF00FF00u ) >> 8u );
			return float( bits ) * 2.3283064365386963e-10; // / 0x100000000

		}

		// Hammersley sequence
		vec2 hammersley( uint i, uint N ) {

			return vec2( float( i ) / float( N ), radicalInverse_VdC( i ) );

		}

		void main() {

			vec3 N = normalize( vWorldDirection );

			// For very low roughness, just sample the environment directly
			if ( roughness < 0.001 ) {

				gl_FragColor = vec4( textureLod( envMap, N, 0.0 ).rgb, 1.0 );
				return;

			}

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			// Tangent space basis for VNDF sampling
			vec3 up = abs( N.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, N ) );
			vec3 bitangent = cross( N, tangent );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			for ( uint i = 0u; i < GGX_SAMPLES; i ++ ) {

				vec2 Xi = hammersley( i, GGX_SAMPLES );

				// With V = N, sample the reflected direction directly.
				float invQ = 1.0 / ( 1.0 - Xi.x + alpha2 * Xi.x );
				float NdotL = ( 1.0 - Xi.x - alpha2 * Xi.x ) * invQ;

				if ( NdotL > 0.0 ) {

					float phi = 2.0 * PI * Xi.y;
					float sinTheta = 2.0 * alpha * sqrt( Xi.x * ( 1.0 - Xi.x ) ) * invQ;
					vec3 L = N * NdotL + ( tangent * cos( phi ) + bitangent * sin( phi ) ) * sinTheta;

					// Match the source mip to the sample's solid angle. The terms
					// independent of the sample are precomputed in lodBias.
					float d = alpha2 * invQ;
					float lod = max( log2( d ) + lodBias, 0.0 );

					// Weight by NdotL for the split-sum approximation
					prefilteredColor += textureLod( envMap, L, lod ).rgb * NdotL;
					totalWeight += NdotL;

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function Fo(){return No(`PMREMGGXIntegration`,{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:Do}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float sourceLod;
		uniform int sourceSize;

		void main() {

			vec3 N = normalize( vWorldDirection );

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			float texelSize = 2.0 / float( sourceSize );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			// Pair opposite texels: only the one in N's hemisphere contributes.
			for ( int face = 0; face < 3; face ++ ) {

				for ( int y = 0; y < sourceSize; y ++ ) {

					for ( int x = 0; x < sourceSize; x ++ ) {

						vec2 uv = ( vec2( x, y ) + 0.5 ) * texelSize - 1.0;
						vec3 texelDirection = face == 0 ? vec3( 1.0, uv ) : ( face == 1 ? vec3( uv.x, 1.0, uv.y ) : vec3( uv, 1.0 ) );

						float invDistance = inversesqrt( 1.0 + dot( uv, uv ) );
						float NdotL = dot( N, texelDirection );
						texelDirection *= NdotL < 0.0 ? - 1.0 : 1.0;
						NdotL = abs( NdotL ) * invDistance;

						// With V = N, NdotH squared is ( 1 + NdotL ) / 2. Common factors
						// in the GGX distribution and texel solid angle cancel when normalized.
						float d = 1.0 + alpha2 + ( alpha2 - 1.0 ) * NdotL;
						float weight = NdotL * invDistance * invDistance * invDistance / ( d * d );

						prefilteredColor += textureLod( envMap, texelDirection, sourceLod ).rgb * weight;
						totalWeight += weight;

					}

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function Io(){return No(`PMREMSphericalGaussianBlur`,{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${To}
		#define GOLDEN_ANGLE 2.39996322973

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float sigma;

		#include <common>

		void main() {

			vec3 outputDirection = normalize( vWorldDirection );

			vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, outputDirection ) );
			vec3 bitangent = cross( outputDirection, tangent );

			// Truncate the kernel at three standard deviations or at the antipode.
			float thetaMax = min( 3.0 * sigma, PI );
			float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

			vec3 accumColor = vec3( 0.0 );
			float accumWeight = 0.0;

			for ( int i = 0; i < SAMPLES; i ++ ) {

				// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
				float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
				float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
				float phi = float( i ) * GOLDEN_ANGLE;

				vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
				vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

				// Correct the planar sample density to solid angle.
				float weight = sin( theta ) / theta;

				accumColor += weight * textureLod( envMap, sampleDirection, 0.0 ).rgb;
				accumWeight += weight;

			}

			gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

		}
	`)}function Lo(){return No(`PMREMEquirectangularToCubemap`,{envMap:{value:null}},`

		varying vec3 vWorldDirection;

		uniform sampler2D envMap;

		#include <common>

		void main() {

			// Average four subpixel samples to preserve small, bright features.
			vec3 direction = normalize( vWorldDirection );
			vec3 dx = dFdx( direction ) * 0.25;
			vec3 dy = dFdy( direction ) * 0.25;

			vec3 color = textureLod( envMap, equirectUv( normalize( direction - dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction - dx + dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx + dy ) ), 0.0 ).rgb;
			gl_FragColor = vec4( color * 0.25, 1.0 );

		}
	`)}function Ro(){return No(`PMREMCubemapToCubemap`,{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function zo(e){let t=new WeakMap,n=new WeakMap,r=null;function i(e,t=!1){return e==null?null:t?o(e):a(e)}function a(n){if(n&&n.isTexture){let r=n.mapping;if(r===303||r===304){if(t.has(n)){let e=t.get(n).texture;return s(e,n.mapping)}{let r=n.image;if(r&&r.height>0){let i=new So(r.height);return i.fromEquirectangularTexture(e,n),t.set(n,i),n.addEventListener(`dispose`,l),s(i.texture,n.mapping)}return null}}}return n}function o(t){if(t&&t.isTexture&&t.isPMREMTexture!==!0){let i=t.mapping,a=i===303||i===304,o=i===301||i===302;if(a||o){let i=n.get(t),s=i===void 0?0:i.texture.pmremVersion;if(t.isRenderTargetTexture&&t.pmremVersion!==s)return r===null&&(r=new jo(e)),i=a?r.fromEquirectangular(t,i):r.fromCubemap(t,i),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),i.texture;if(i!==void 0)return i.texture;{let s=t.image;return a&&s&&s.height>0||o&&s&&c(s)?(r===null&&(r=new jo(e)),i=a?r.fromEquirectangular(t):r.fromCubemap(t),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),t.addEventListener(`dispose`,u),i.texture):null}}}return t}function s(e,t){return t===303?e.mapping=301:t===304&&(e.mapping=302),e}function c(e){let t=0;for(let n=0;n<6;n++)e[n]!==void 0&&t++;return t===6}function l(e){let n=e.target;n.removeEventListener(`dispose`,l);let r=t.get(n);r!==void 0&&(t.delete(n),r.dispose())}function u(e){let t=e.target;t.removeEventListener(`dispose`,u);let r=n.get(t);r!==void 0&&(n.delete(t),r.dispose())}function d(){t=new WeakMap,n=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:i,dispose:d}}function Bo(e){let t={};function n(n){if(t[n]!==void 0)return t[n];let r=e.getExtension(n);return t[n]=r,r}return{has:function(e){return n(e)!==null},init:function(){n(`EXT_color_buffer_float`),n(`WEBGL_clip_cull_distance`),n(`OES_texture_float_linear`),n(`EXT_color_buffer_half_float`),n(`WEBGL_multisampled_render_to_texture`),n(`WEBGL_render_shared_exponent`)},get:function(e){let t=n(e);return t===null&&vt(`WebGLRenderer: `+e+` extension not supported.`),t}}}function Vo(e,t,n,r){let i={},a=new WeakMap,o=new FinalizationRegistry(e=>delete i[e]);function s(e){c(e.target)}function c(e){e.index!==null&&t.remove(e.index);for(let n in e.attributes)t.remove(e.attributes[n]);e.removeEventListener(`dispose`,s),delete i[e.id],o.unregister(e);let c=a.get(e);c&&(t.remove(c),a.delete(e)),r.releaseStatesOfGeometry(e),e.isInstancedBufferGeometry===!0&&delete e._maxInstanceCount,n.memory.geometries--}function l(e,t){return i[t.id]===void 0&&(t.addEventListener(`dispose`,s),i[t.id]=new WeakRef(t),o.register(t,t.id,t),n.memory.geometries++),t}function u(n){let r=n.attributes;for(let n in r)t.update(r[n],e.ARRAY_BUFFER)}function d(e){let n=e.index,r=e.attributes.position,i=0;if(r===void 0)return;let o=n===null?r.array.length/3-1:n.array.length,s=new(r.count>=65535?Sr:xr)(Math.ceil(o/3)*6,1),c=s.array;if(n!==null){let e=n.array;i=n.version;for(let t=0,n=0;t<o;t+=3){let r=e[t+0],i=e[t+1],a=e[t+2];c[n++]=r,c[n++]=i,c[n++]=i,c[n++]=a,c[n++]=a,c[n++]=r}}else{i=r.version;for(let e=0,t=0;e<o;e+=3){let n=e+0,r=e+1,i=e+2;c[t++]=n,c[t++]=r,c[t++]=r,c[t++]=i,c[t++]=i,c[t++]=n}}s.version=i;let l=a.get(e);l&&t.remove(l),a.set(e,s)}function f(e){let t=a.get(e);if(t){let n=e.index;n!==null&&t.version<n.version&&d(e)}else d(e);return a.get(e)}function p(){for(let e in i){let t=i[e].deref();t!==void 0&&c(t)}}return{get:l,update:u,getWireframeAttribute:f,dispose:p}}function Ho(e,t,n){let r;function i(e){r=e}let a,o;function s(e){a=e.type,o=e.bytesPerElement}function c(t,i){e.drawElements(r,i,a,t*o),n.update(i,r,1)}function l(t,i,s){s!==0&&(e.drawElementsInstanced(r,i,a,t*o,s),n.update(i,r,s))}function u(e,i,o){if(o===0)return;t.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(r,i,0,a,e,0,o);let s=0;for(let e=0;e<o;e++)s+=i[e];n.update(s,r,1)}this.setMode=i,this.setIndex=s,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function Uo(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function r(t,r,i){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=t/3*i;break;case e.LINES:n.lines+=t/2*i;break;case e.LINE_STRIP:n.lines+=i*(t-1);break;case e.LINE_LOOP:n.lines+=i*t;break;case e.POINTS:n.points+=i*t;break;default:z(`WebGLInfo: Unknown draw mode:`,r)}}function i(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:i,update:r}}function Wo(e,t,n){let r=new WeakMap,i=new Qt;function a(a,o,s){let c=a.morphTargetInfluences,l=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=l===void 0?0:l.length,d=r.get(o);if(d===void 0||d.count!==u){d!==void 0&&d.texture.dispose();let e=o.morphAttributes.position!==void 0,n=o.morphAttributes.normal!==void 0,a=o.morphAttributes.color!==void 0,s=o.morphAttributes.position||[],c=o.morphAttributes.normal||[],l=o.morphAttributes.color||[],f=0;e===!0&&(f=1),n===!0&&(f=2),a===!0&&(f=3);let p=o.attributes.position.count*f,m=1;p>t.maxTextureSize&&(m=Math.ceil(p/t.maxTextureSize),p=t.maxTextureSize);let h=new Float32Array(p*m*4*u),g=new tn(h,p,m,u);g.type=ne,g.needsUpdate=!0;let _=f*4;for(let t=0;t<u;t++){let r=s[t],o=c[t],u=l[t],d=p*m*4*t;for(let t=0;t<r.count;t++){let s=t*_;e===!0&&(i.fromBufferAttribute(r,t),h[d+s+0]=i.x,h[d+s+1]=i.y,h[d+s+2]=i.z,h[d+s+3]=0),n===!0&&(i.fromBufferAttribute(o,t),h[d+s+4]=i.x,h[d+s+5]=i.y,h[d+s+6]=i.z,h[d+s+7]=0),a===!0&&(i.fromBufferAttribute(u,t),h[d+s+8]=i.x,h[d+s+9]=i.y,h[d+s+10]=i.z,h[d+s+11]=u.itemSize===4?i.w:1)}}d={count:u,texture:g,size:new Nt(p,m)},r.set(o,d);function v(){g.dispose(),r.delete(o),o.removeEventListener(`dispose`,v)}o.addEventListener(`dispose`,v)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)s.getUniforms().setValue(e,`morphTexture`,a.morphTexture,n);else{let t=0;for(let e=0;e<c.length;e++)t+=c[e];let n=o.morphTargetsRelative?1:1-t;s.getUniforms().setValue(e,`morphTargetBaseInfluence`,n),s.getUniforms().setValue(e,`morphTargetInfluences`,c)}s.getUniforms().setValue(e,`morphTargetsTexture`,d.texture,n),s.getUniforms().setValue(e,`morphTargetsTextureSize`,d.size)}return{update:a}}function Go(e,t,n,r,i){let a=new WeakMap;function o(r){let o=i.render.frame,s=r.geometry,l=t.get(r,s);if(a.get(l)!==o&&(t.update(l),a.set(l,o)),r.isInstancedMesh&&(r.hasEventListener(`dispose`,c)===!1&&r.addEventListener(`dispose`,c),a.get(r)!==o&&(n.update(r.instanceMatrix,e.ARRAY_BUFFER),r.instanceColor!==null&&n.update(r.instanceColor,e.ARRAY_BUFFER),a.set(r,o))),r.isSkinnedMesh){let e=r.skeleton;a.get(e)!==o&&(e.update(),a.set(e,o))}return l}function s(){a=new WeakMap}function c(e){let t=e.target;t.removeEventListener(`dispose`,c),r.releaseStatesOfObject(t),n.remove(t.instanceMatrix),t.instanceColor!==null&&n.remove(t.instanceColor)}return{update:o,dispose:s}}var Ko={1:`LINEAR_TONE_MAPPING`,2:`REINHARD_TONE_MAPPING`,3:`CINEON_TONE_MAPPING`,4:`ACES_FILMIC_TONE_MAPPING`,6:`AGX_TONE_MAPPING`,7:`NEUTRAL_TONE_MAPPING`,5:`CUSTOM_TONE_MAPPING`};function qo(e,t,n,r,i,a){let o=new en(t,n,{type:e,depthBuffer:i,stencilBuffer:a,samples:r?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),s=null,c=null,l=null,u=new Fr;u.setAttribute(`position`,new Cr([-1,3,0,-1,-1,0,3,-1,0],3)),u.setAttribute(`uv`,new Cr([0,2,0,0,2,0],2));let d=new ta({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),f=new ai(u,d),p=new Ua(-1,1,1,-1,0,1),m=null,h=null,g=!1,_,v=null,y=[],b=!1;this.setSize=function(e,t){o.setSize(e,t),s!==null&&s.setSize(e,t),c!==null&&c.setSize(e,t);for(let n=0;n<y.length;n++){let r=y[n];r.setSize&&r.setSize(e,t)}},this.setEffects=function(e){y=e,b=y.length>0&&y[0].isRenderPass===!0;let t=o.width,n=o.height;y.length>0&&s===null&&(s=new en(t,n,{type:re,depthBuffer:!1,stencilBuffer:!1}),c=new en(t,n,{type:re,depthBuffer:!1,stencilBuffer:!1}));let r=i===!0&&y.some(e=>e.needsDepthTexture===!0);r!==(o.depthTexture!==null)&&(r===!0&&l===null&&(l=new Mi(t,n),a===!0&&(l.format=fe,l.type=oe)),o.dispose(),o.depthTexture=r?l:null,o.resolveDepthBuffer=r,o.storeMultisampledDepthBuffer=r);for(let e=0;e<y.length;e++){let i=y[e];i.setSize&&i.setSize(t,n),r&&i.needsDepthTexture===!0&&i.setDepthTexture&&i.setDepthTexture(l)}},this.begin=function(e,t){if(g||e.toneMapping===0&&y.length===0)return!1;if(v=t,t!==null){let e=t.width,n=t.height;(o.width!==e||o.height!==n)&&this.setSize(e,n)}return b===!1&&e.setRenderTarget(o),_=e.toneMapping,e.toneMapping=0,!0},this.hasRenderPass=function(){return b},this.end=function(e,t){e.toneMapping=_,g=!0;let n=o,r=s;for(let i=0;i<y.length;i++){let a=y[i];a.enabled!==!1&&(a.render(e,r,n,t),a.needsSwap!==!1&&(n=r,r=r===s?c:s))}if(m!==e.outputColorSpace||h!==e.toneMapping){m=e.outputColorSpace,h=e.toneMapping,d.defines={},Vt.getTransfer(m)===`srgb`&&(d.defines.SRGB_TRANSFER=``);let t=Ko[h];t&&(d.defines[t]=``),d.needsUpdate=!0}d.uniforms.tDiffuse.value=n.texture,e.setRenderTarget(v),e.render(f,p),v=null,g=!1},this.isCompositing=function(){return g},this.dispose=function(){o.dispose(),s!==null&&s.dispose(),c!==null&&c.dispose(),u.dispose(),d.dispose()}}var Jo=new Zt,Yo=new Mi(1,1),Xo=new Ni(1),Zo=new tn,Qo=new nn,$o=new ji,es=[],ts=[],ns=new Float32Array(16),rs=new Float32Array(9),is=new Float32Array(4);function as(e,t,n){let r=e[0];if(r<=0||r>0)return e;let i=t*n,a=es[i];if(a===void 0&&(a=new Float32Array(i),es[i]=a),t!==0){r.toArray(a,0);for(let r=1,i=0;r!==t;++r)i+=n,e[r].toArray(a,i)}return a}function os(e,t){if(e.length!==t.length)return!1;for(let n=0,r=e.length;n<r;n++)if(e[n]!==t[n])return!1;return!0}function ss(e,t){for(let n=0,r=t.length;n<r;n++)e[n]=t[n]}function cs(e,t){let n=ts[t];n===void 0&&(n=new Int32Array(t),ts[t]=n);for(let r=0;r!==t;++r)n[r]=e.allocateTextureUnit();return n}function ls(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function us(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(os(n,t))return;e.uniform2fv(this.addr,t),ss(n,t)}}function ds(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(os(n,t))return;e.uniform3fv(this.addr,t),ss(n,t)}}function fs(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(os(n,t))return;e.uniform4fv(this.addr,t),ss(n,t)}}function ps(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(os(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),ss(n,t)}else{if(os(n,r))return;is.set(r),e.uniformMatrix2fv(this.addr,!1,is),ss(n,r)}}function ms(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(os(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),ss(n,t)}else{if(os(n,r))return;rs.set(r),e.uniformMatrix3fv(this.addr,!1,rs),ss(n,r)}}function hs(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(os(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),ss(n,t)}else{if(os(n,r))return;ns.set(r),e.uniformMatrix4fv(this.addr,!1,ns),ss(n,r)}}function gs(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function _s(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(os(n,t))return;e.uniform2iv(this.addr,t),ss(n,t)}}function vs(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(os(n,t))return;e.uniform3iv(this.addr,t),ss(n,t)}}function ys(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(os(n,t))return;e.uniform4iv(this.addr,t),ss(n,t)}}function bs(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function xs(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(os(n,t))return;e.uniform2uiv(this.addr,t),ss(n,t)}}function Ss(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(os(n,t))return;e.uniform3uiv(this.addr,t),ss(n,t)}}function Cs(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(os(n,t))return;e.uniform4uiv(this.addr,t),ss(n,t)}}function ws(e){return e.version===0&&(e.compareFunction=519,e.needsUpdate=!0),e}function Ts(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;a=this.type===e.SAMPLER_2D_SHADOW?ws(Yo):Jo,n.setTexture2D(t||a,i)}function Es(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture3D(t||Qo,i)}function Ds(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;a=this.type===e.SAMPLER_CUBE_SHADOW?ws(Xo):$o,n.setTextureCube(t||a,i)}function Os(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture2DArray(t||Zo,i)}function ks(e){switch(e){case 5126:return ls;case 35664:return us;case 35665:return ds;case 35666:return fs;case 35674:return ps;case 35675:return ms;case 35676:return hs;case 5124:case 35670:return gs;case 35667:case 35671:return _s;case 35668:case 35672:return vs;case 35669:case 35673:return ys;case 5125:return bs;case 36294:return xs;case 36295:return Ss;case 36296:return Cs;case 35678:case 36198:case 36298:case 36306:case 35682:return Ts;case 35679:case 36299:case 36307:return Es;case 35680:case 36300:case 36308:case 36293:return Ds;case 36289:case 36303:case 36311:case 36292:return Os}}function As(e,t){e.uniform1fv(this.addr,t)}function js(e,t){let n=as(t,this.size,2);e.uniform2fv(this.addr,n)}function Ms(e,t){let n=as(t,this.size,3);e.uniform3fv(this.addr,n)}function Ns(e,t){let n=as(t,this.size,4);e.uniform4fv(this.addr,n)}function Ps(e,t){let n=as(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function Fs(e,t){let n=as(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function Is(e,t){let n=as(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function Ls(e,t){e.uniform1iv(this.addr,t)}function Rs(e,t){e.uniform2iv(this.addr,t)}function zs(e,t){e.uniform3iv(this.addr,t)}function Bs(e,t){e.uniform4iv(this.addr,t)}function Vs(e,t){e.uniform1uiv(this.addr,t)}function Hs(e,t){e.uniform2uiv(this.addr,t)}function Us(e,t){e.uniform3uiv(this.addr,t)}function Ws(e,t){e.uniform4uiv(this.addr,t)}function Gs(e,t,n){let r=this.cache,i=t.length,a=cs(n,i);os(r,a)||(e.uniform1iv(this.addr,a),ss(r,a));let o;o=this.type===e.SAMPLER_2D_SHADOW?ws(Yo):Jo;for(let e=0;e!==i;++e)n.setTexture2D(t[e]||o,a[e])}function Ks(e,t,n){let r=this.cache,i=t.length,a=cs(n,i);os(r,a)||(e.uniform1iv(this.addr,a),ss(r,a));for(let e=0;e!==i;++e)n.setTexture3D(t[e]||Qo,a[e])}function qs(e,t,n){let r=this.cache,i=t.length,a=cs(n,i);os(r,a)||(e.uniform1iv(this.addr,a),ss(r,a));let o;o=this.type===e.SAMPLER_CUBE_SHADOW?ws(Xo):$o;for(let e=0;e!==i;++e)n.setTextureCube(t[e]||o,a[e])}function Js(e,t,n){let r=this.cache,i=t.length,a=cs(n,i);os(r,a)||(e.uniform1iv(this.addr,a),ss(r,a));for(let e=0;e!==i;++e)n.setTexture2DArray(t[e]||Zo,a[e])}function Ys(e){switch(e){case 5126:return As;case 35664:return js;case 35665:return Ms;case 35666:return Ns;case 35674:return Ps;case 35675:return Fs;case 35676:return Is;case 5124:case 35670:return Ls;case 35667:case 35671:return Rs;case 35668:case 35672:return zs;case 35669:case 35673:return Bs;case 5125:return Vs;case 36294:return Hs;case 36295:return Us;case 36296:return Ws;case 35678:case 36198:case 36298:case 36306:case 35682:return Gs;case 35679:case 36299:case 36307:return Ks;case 35680:case 36300:case 36308:case 36293:return qs;case 36289:case 36303:case 36311:case 36292:return Js}}var Xs=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=ks(t.type)}},Zs=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Ys(t.type)}},Qs=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let r=this.seq;for(let i=0,a=r.length;i!==a;++i){let a=r[i];a.setValue(e,t[a.id],n)}}},$s=/(\w+)(\])?(\[|\.)?/g;function ec(e,t){e.seq.push(t),e.map[t.id]=t}function tc(e,t,n){let r=e.name,i=r.length;for($s.lastIndex=0;;){let a=$s.exec(r),o=$s.lastIndex,s=a[1],c=a[2]===`]`,l=a[3];if(c&&(s|=0),l===void 0||l===`[`&&o+2===i){ec(n,l===void 0?new Xs(s,e,t):new Zs(s,e,t));break}{let e=n.map[s];e===void 0&&(e=new Qs(s),ec(n,e)),n=e}}}var nc=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let n=e.getActiveUniform(t,r);tc(n,e.getUniformLocation(t,n.name),this)}let r=[],i=[];for(let t of this.seq)t.type===e.SAMPLER_2D_SHADOW||t.type===e.SAMPLER_CUBE_SHADOW||t.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(t):i.push(t);r.length>0&&(this.seq=r.concat(i))}setValue(e,t,n,r){let i=this.map[t];i!==void 0&&i.setValue(e,n,r)}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let i=0,a=t.length;i!==a;++i){let a=t[i],o=n[a.id];o.needsUpdate!==!1&&a.setValue(e,o.value,r)}}static seqWithValue(e,t){let n=[];for(let r=0,i=e.length;r!==i;++r){let i=e[r];i.id in t&&n.push(i)}return n}};function rc(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r}var ic=37297,ac=0;function oc(e,t){let n=e.split(`
`),r=[],i=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let e=i;e<a;e++){let i=e+1;r.push(`${i===t?`>`:` `} ${i}: ${n[e]}`)}return r.join(`
`)}var sc=new V;function cc(e){Vt._getMatrix(sc,Vt.workingColorSpace,e);let t=`mat3( ${sc.elements.map(e=>e.toFixed(4))} )`;switch(Vt.getTransfer(e)){case ot:return[t,`LinearTransferOETF`];case st:return[t,`sRGBTransferOETF`];default:return R(`WebGLProgram: Unsupported color space: `,e),[t,`LinearTransferOETF`]}}function lc(e,t,n){let r=e.getShaderParameter(t,e.COMPILE_STATUS),i=(e.getShaderInfoLog(t)||``).trim();if(r&&i===``)return``;let a=/ERROR: 0:(\d+)/.exec(i);if(a){let r=parseInt(a[1]);return n.toUpperCase()+`

`+i+`

`+oc(e.getShaderSource(t),r)}return i}function uc(e,t){let n=cc(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( ${n[0]} * value.rgb, value.a ) );`,`}`].join(`
`)}var dc={1:`Linear`,2:`Reinhard`,3:`Cineon`,4:`ACESFilmic`,6:`AgX`,7:`Neutral`,5:`Custom`};function fc(e,t){let n=dc[t];return n===void 0?(R(`WebGLProgram: Unsupported toneMapping:`,t),`vec3 `+e+`( vec3 color ) { return LinearToneMapping( color ); }`):`vec3 `+e+`( vec3 color ) { return `+n+`ToneMapping( color ); }`}var pc=new B;function mc(){return Vt.getLuminanceCoefficients(pc),[`float luminance( const in vec3 rgb ) {`,`	const vec3 weights = vec3( ${pc.x.toFixed(4)}, ${pc.y.toFixed(4)}, ${pc.z.toFixed(4)} );`,`	return dot( weights, rgb );`,`}`].join(`
`)}function hc(e){return[e.extensionClipCullDistance?`#extension GL_ANGLE_clip_cull_distance : require`:``,e.extensionMultiDraw?`#extension GL_ANGLE_multi_draw : require`:``].filter(vc).join(`
`)}function gc(e){let t=[];for(let n in e){let r=e[n];r!==!1&&t.push(`#define `+n+` `+r)}return t.join(`
`)}function _c(e,t){let n={},r=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let i=0;i<r;i++){let r=e.getActiveAttrib(t,i),a=r.name,o=1;r.type===e.FLOAT_MAT2&&(o=2),r.type===e.FLOAT_MAT3&&(o=3),r.type===e.FLOAT_MAT4&&(o=4),n[a]={type:r.type,location:e.getAttribLocation(t,a),locationSize:o}}return n}function vc(e){return e!==``}function yc(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,t.numLightProbeGrids)}function bc(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var xc=/^[ \t]*#include +<([\w\d./]+)>/gm;function Sc(e){return e.replace(xc,Cc)}function Cc(e,t){let n=U[t];if(n===void 0)throw Error(`THREE.WebGLProgram: Can not resolve #include <`+t+`>`);return Sc(n)}var wc=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Tc(e){return e.replace(wc,Ec)}function Ec(e,t,n,r){let i=``;for(let e=parseInt(t);e<parseInt(n);e++)i+=r.replace(/\[\s*i\s*\]/g,`[ `+e+` ]`).replace(/UNROLLED_LOOP_INDEX/g,e);return i}function Dc(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision===`highp`?t+=`
#define HIGH_PRECISION`:e.precision===`mediump`?t+=`
#define MEDIUM_PRECISION`:e.precision===`lowp`&&(t+=`
#define LOW_PRECISION`),t}var Oc={1:`SHADOWMAP_TYPE_PCF`,3:`SHADOWMAP_TYPE_VSM`};function kc(e){return Oc[e.shadowMapType]||`SHADOWMAP_TYPE_BASIC`}var Ac={302:`ENVMAP_MODE_REFRACTION`};function jc(e){return e.envMap===!1?`ENVMAP_MODE_REFLECTION`:Ac[e.envMapMode]||`ENVMAP_MODE_REFLECTION`}var Mc={0:`ENVMAP_BLENDING_MULTIPLY`,1:`ENVMAP_BLENDING_MIX`,2:`ENVMAP_BLENDING_ADD`};function Nc(e){return e.envMap===!1?`ENVMAP_BLENDING_NONE`:Mc[e.combine]||`ENVMAP_BLENDING_NONE`}function Pc(e,t,n,r){let i=e.getContext(),a=n.defines,o=n.vertexShader,s=n.fragmentShader,c=kc(n),l=n.envMapPMREM===!0?`ENVMAP_TYPE_PMREM`:`ENVMAP_TYPE_CUBE`,u=jc(n),d=Nc(n),f=hc(n),p=gc(a),m=i.createProgram(),h,g,_=n.glslVersion?`#version `+n.glslVersion+`
`:``;n.isRawShaderMaterial?(h=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p].filter(vc).join(`
`),h.length>0&&(h+=`
`),g=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p].filter(vc).join(`
`),g.length>0&&(g+=`
`)):(h=[Dc(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p,n.extensionClipCullDistance?`#define USE_CLIP_DISTANCE`:``,n.batching?`#define USE_BATCHING`:``,n.batchingColor?`#define USE_BATCHING_COLOR`:``,n.instancing?`#define USE_INSTANCING`:``,n.instancingColor?`#define USE_INSTANCING_COLOR`:``,n.instancingMorph?`#define USE_INSTANCING_MORPH`:``,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.map?`#define USE_MAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+u:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.displacementMap?`#define USE_DISPLACEMENTMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.diffuseRoughnessMap?`#define USE_DIFFUSE_ROUGHNESSMAP`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.mapUv?`#define MAP_UV `+n.mapUv:``,n.alphaMapUv?`#define ALPHAMAP_UV `+n.alphaMapUv:``,n.lightMapUv?`#define LIGHTMAP_UV `+n.lightMapUv:``,n.aoMapUv?`#define AOMAP_UV `+n.aoMapUv:``,n.emissiveMapUv?`#define EMISSIVEMAP_UV `+n.emissiveMapUv:``,n.bumpMapUv?`#define BUMPMAP_UV `+n.bumpMapUv:``,n.normalMapUv?`#define NORMALMAP_UV `+n.normalMapUv:``,n.displacementMapUv?`#define DISPLACEMENTMAP_UV `+n.displacementMapUv:``,n.metalnessMapUv?`#define METALNESSMAP_UV `+n.metalnessMapUv:``,n.roughnessMapUv?`#define ROUGHNESSMAP_UV `+n.roughnessMapUv:``,n.anisotropyMapUv?`#define ANISOTROPYMAP_UV `+n.anisotropyMapUv:``,n.clearcoatMapUv?`#define CLEARCOATMAP_UV `+n.clearcoatMapUv:``,n.clearcoatNormalMapUv?`#define CLEARCOAT_NORMALMAP_UV `+n.clearcoatNormalMapUv:``,n.clearcoatRoughnessMapUv?`#define CLEARCOAT_ROUGHNESSMAP_UV `+n.clearcoatRoughnessMapUv:``,n.diffuseRoughnessMapUv?`#define DIFFUSE_ROUGHNESSMAP_UV `+n.diffuseRoughnessMapUv:``,n.iridescenceMapUv?`#define IRIDESCENCEMAP_UV `+n.iridescenceMapUv:``,n.iridescenceThicknessMapUv?`#define IRIDESCENCE_THICKNESSMAP_UV `+n.iridescenceThicknessMapUv:``,n.sheenColorMapUv?`#define SHEEN_COLORMAP_UV `+n.sheenColorMapUv:``,n.sheenRoughnessMapUv?`#define SHEEN_ROUGHNESSMAP_UV `+n.sheenRoughnessMapUv:``,n.specularMapUv?`#define SPECULARMAP_UV `+n.specularMapUv:``,n.specularColorMapUv?`#define SPECULAR_COLORMAP_UV `+n.specularColorMapUv:``,n.specularIntensityMapUv?`#define SPECULAR_INTENSITYMAP_UV `+n.specularIntensityMapUv:``,n.transmissionMapUv?`#define TRANSMISSIONMAP_UV `+n.transmissionMapUv:``,n.thicknessMapUv?`#define THICKNESSMAP_UV `+n.thicknessMapUv:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexNormals?`#define HAS_NORMAL`:``,n.vertexColors?`#define USE_COLOR`:``,n.vertexAlphas?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.flatShading?`#define FLAT_SHADED`:``,n.skinning?`#define USE_SKINNING`:``,n.morphTargets?`#define USE_MORPHTARGETS`:``,n.morphNormals&&n.flatShading===!1?`#define USE_MORPHNORMALS`:``,n.morphColors?`#define USE_MORPHCOLORS`:``,n.morphTargetsCount>0?`#define MORPHTARGETS_TEXTURE_STRIDE `+n.morphTextureStride:``,n.morphTargetsCount>0?`#define MORPHTARGETS_COUNT `+n.morphTargetsCount:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.sizeAttenuation?`#define USE_SIZEATTENUATION`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 modelMatrix;`,`uniform mat4 modelViewMatrix;`,`uniform mat4 projectionMatrix;`,`uniform mat4 viewMatrix;`,`uniform mat3 normalMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,`#ifdef USE_INSTANCING`,`	attribute mat4 instanceMatrix;`,`#endif`,`#ifdef USE_INSTANCING_COLOR`,`	attribute vec3 instanceColor;`,`#endif`,`#ifdef USE_INSTANCING_MORPH`,`	uniform sampler2D morphTexture;`,`#endif`,`attribute vec3 position;`,`attribute vec3 normal;`,`attribute vec2 uv;`,`#ifdef USE_UV1`,`	attribute vec2 uv1;`,`#endif`,`#ifdef USE_UV2`,`	attribute vec2 uv2;`,`#endif`,`#ifdef USE_UV3`,`	attribute vec2 uv3;`,`#endif`,`#ifdef USE_TANGENT`,`	attribute vec4 tangent;`,`#endif`,`#if defined( USE_COLOR_ALPHA )`,`	attribute vec4 color;`,`#elif defined( USE_COLOR )`,`	attribute vec3 color;`,`#endif`,`#ifdef USE_SKINNING`,`	attribute vec4 skinIndex;`,`	attribute vec4 skinWeight;`,`#endif`,`
`].filter(vc).join(`
`),g=[Dc(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.alphaToCoverage?`#define ALPHA_TO_COVERAGE`:``,n.map?`#define USE_MAP`:``,n.matcap?`#define USE_MATCAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+l:``,n.envMap?`#define `+u:``,n.envMap?`#define `+d:``,n.envMapPMREM?`#define ENVMAP_MAX_LOD `+n.envMapMaxLod+`.0`:``,n.envMapPMREM?`#define ENVMAP_SIZE `+n.envMapSize+`.0`:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.packedNormalMap?`#define USE_PACKED_NORMALMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoat?`#define USE_CLEARCOAT`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.diffuseRoughness?`#define USE_DIFFUSE_ROUGHNESS`:``,n.diffuseRoughnessMap?`#define USE_DIFFUSE_ROUGHNESSMAP`:``,n.dispersion?`#define USE_DISPERSION`:``,n.retroreflection?`#define USE_RETROREFLECTION`:``,n.iridescence?`#define USE_IRIDESCENCE`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaTest?`#define USE_ALPHATEST`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.sheen?`#define USE_SHEEN`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexColors||n.instancingColor?`#define USE_COLOR`:``,n.vertexAlphas||n.batchingColor?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.gradientMap?`#define USE_GRADIENTMAP`:``,n.flatShading?`#define FLAT_SHADED`:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.premultipliedAlpha?`#define PREMULTIPLIED_ALPHA`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.decodeVideoTexture?`#define DECODE_VIDEO_TEXTURE`:``,n.decodeVideoTextureEmissive?`#define DECODE_VIDEO_TEXTURE_EMISSIVE`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 viewMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,n.toneMapping===0?``:`#define TONE_MAPPING`,n.toneMapping===0?``:U.tonemapping_pars_fragment,n.toneMapping===0?``:fc(`toneMapping`,n.toneMapping),n.dithering?`#define DITHERING`:``,n.opaque?`#define OPAQUE`:``,U.colorspace_pars_fragment,uc(`linearToOutputTexel`,n.outputColorSpace),mc(),n.useDepthPacking?`#define DEPTH_PACKING `+n.depthPacking:``,`
`].filter(vc).join(`
`)),o=Sc(o),o=yc(o,n),o=bc(o,n),s=Sc(s),s=yc(s,n),s=bc(s,n),o=Tc(o),s=Tc(s),n.isRawShaderMaterial!==!0&&(_=`#version 300 es
`,h=[f,`#define attribute in`,`#define varying out`,`#define texture2D texture`].join(`
`)+`
`+h,g=[`#define varying in`,n.glslVersion===`300 es`?``:`layout(location = 0) out highp vec4 pc_fragColor;`,n.glslVersion===`300 es`?``:`#define gl_FragColor pc_fragColor`,`#define gl_FragDepthEXT gl_FragDepth`,`#define texture2D texture`,`#define textureCube texture`,`#define texture2DProj textureProj`,`#define texture2DLodEXT textureLod`,`#define texture2DProjLodEXT textureProjLod`,`#define textureCubeLodEXT textureLod`,`#define texture2DGradEXT textureGrad`,`#define texture2DProjGradEXT textureProjGrad`,`#define textureCubeGradEXT textureGrad`].join(`
`)+`
`+g);let v=_+h+o,y=_+g+s,b=rc(i,i.VERTEX_SHADER,v),x=rc(i,i.FRAGMENT_SHADER,y);i.attachShader(m,b),i.attachShader(m,x),n.index0AttributeName===void 0?n.hasPositionAttribute===!0&&i.bindAttribLocation(m,0,`position`):i.bindAttribLocation(m,0,n.index0AttributeName),i.linkProgram(m);function S(t){if(e.debug.checkShaderErrors){let n=i.getProgramInfoLog(m)||``,r=i.getShaderInfoLog(b)||``,a=i.getShaderInfoLog(x)||``,o=n.trim(),s=r.trim(),c=a.trim(),l=!0,u=!0;if(i.getProgramParameter(m,i.LINK_STATUS)===!1){if(l=!1,typeof e.debug.onShaderError==`function`)e.debug.onShaderError(i,m,b,x);else{let e=lc(i,b,`vertex`),n=lc(i,x,`fragment`);z(`WebGLProgram: Shader Error `+i.getError()+` - VALIDATE_STATUS `+i.getProgramParameter(m,i.VALIDATE_STATUS)+`

Material Name: `+t.name+`
Material Type: `+t.type+`

Program Info Log: `+o+`
`+e+`
`+n)}}else o===``?(s===``||c===``)&&(u=!1):R(`WebGLProgram: Program Info Log:`,o);u&&(t.diagnostics={runnable:l,programLog:o,vertexShader:{log:s,prefix:h},fragmentShader:{log:c,prefix:g}})}i.deleteShader(b),i.deleteShader(x),C=new nc(i,m),w=_c(i,m)}let C;this.getUniforms=function(){return C===void 0&&S(this),C};let w;this.getAttributes=function(){return w===void 0&&S(this),w};let T=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return T===!1&&(T=i.getProgramParameter(m,ic)),T},this.destroy=function(){r.releaseStatesOfProgram(this),i.deleteProgram(m),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=ac++,this.cacheKey=t,this.usedTimes=1,this.program=m,this.vertexShader=b,this.fragmentShader=x,this}var Fc=0,Ic=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let e of t)e.usedTimes--,e.usedTimes===0&&this.shaderCache.delete(e.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Lc(e),t.set(e,n)),n}},Lc=class{constructor(e){this.id=Fc++,this.code=e,this.usedTimes=0}};function Rc(e){return e===1030||e===37490||e===36285}function zc(e,t,n,r,i,a){let o=new hn,s=new Ic,c=new Set,l=[],u=new Map,d=r.logarithmicDepthBuffer,f={MeshDepthMaterial:`depth`,MeshDistanceMaterial:`distance`,MeshNormalMaterial:`normal`,MeshBasicMaterial:`basic`,MeshLambertMaterial:`lambert`,MeshPhongMaterial:`phong`,MeshToonMaterial:`toon`,MeshStandardMaterial:`physical`,MeshPhysicalMaterial:`physical`,MeshMatcapMaterial:`matcap`,LineBasicMaterial:`basic`,LineDashedMaterial:`dashed`,PointsMaterial:`points`,ShadowMaterial:`shadow`,SpriteMaterial:`sprite`};function p(e){return c.add(e),e===0?`uv`:`uv${e}`}function m(i,o,l,u,m,h){let g=u.fog,_=m.geometry,v=i.isMeshStandardMaterial||i.isMeshLambertMaterial||i.isMeshPhongMaterial?u.environment:null,y=i.isMeshStandardMaterial||i.isMeshLambertMaterial&&!i.envMap||i.isMeshPhongMaterial&&!i.envMap,b=t.get(i.envMap||v,y),x=f[i.type],S=r.precision;i.precision!==null&&(S=r.getMaxPrecision(i.precision),S!==i.precision&&R(`WebGLProgram.getParameters:`,i.precision,`not supported, using`,S,`instead.`));let C=_.morphAttributes.position||_.morphAttributes.normal||_.morphAttributes.color,w=C===void 0?0:C.length,T=0;_.morphAttributes.position!==void 0&&(T=1),_.morphAttributes.normal!==void 0&&(T=2),_.morphAttributes.color!==void 0&&(T=3);let E,D,O,k;if(x){let e=po[x];E=e.vertexShader,D=e.fragmentShader}else{E=i.vertexShader,D=i.fragmentShader;let e=s.getVertexShaderStage(i),t=s.getFragmentShaderStage(i);s.update(i,e,t),O=e.id,k=t.id}let A=e.getRenderTarget(),j=e.state.buffers.depth.getReversed(),M=m.isInstancedMesh===!0,ee=m.isBatchedMesh===!0,te=!!i.map,ne=!!i.matcap,re=!!b,ie=re&&b.isPMREMTexture===!0,ae=!!i.aoMap,oe=!!i.lightMap,se=!!i.bumpMap&&i.wireframe===!1,N=!!i.normalMap,ce=!!i.displacementMap,le=!!i.emissiveMap,ue=!!i.metalnessMap,de=!!i.roughnessMap,fe=i.anisotropy>0,pe=i.clearcoat>0,me=i.diffuseRoughness>0,he=i.dispersion>0,ge=i.retroreflectivity>0,_e=i.iridescence>0,ve=i.sheen>0,ye=i.transmission>0,be=fe&&!!i.anisotropyMap,xe=pe&&!!i.clearcoatMap,Se=pe&&!!i.clearcoatNormalMap,Ce=pe&&!!i.clearcoatRoughnessMap,we=me&&!!i.diffuseRoughnessMap,Te=_e&&!!i.iridescenceMap,Ee=_e&&!!i.iridescenceThicknessMap,De=ve&&!!i.sheenColorMap,Oe=ve&&!!i.sheenRoughnessMap,ke=!!i.specularMap,Ae=!!i.specularColorMap,je=!!i.specularIntensityMap,Me=ye&&!!i.transmissionMap,Ne=ye&&!!i.thicknessMap,Pe=!!i.gradientMap,Fe=!!i.alphaMap,P=i.alphaTest>0,Ie=!!i.alphaHash,Le=!!i.extensions,Re=0;i.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(Re=e.toneMapping);let F=ie?b.isCompressedCubeTexture?b.image[0].mipmaps:b.mipmaps:null,ze={shaderID:x,shaderType:i.type,shaderName:i.name,vertexShader:E,fragmentShader:D,defines:i.defines,customVertexShaderID:O,customFragmentShaderID:k,isRawShaderMaterial:i.isRawShaderMaterial===!0,glslVersion:i.glslVersion,precision:S,batching:ee,batchingColor:ee&&m._colorsTexture!==null,instancing:M,instancingColor:M&&m.instanceColor!==null,instancingMorph:M&&m.morphTexture!==null,outputColorSpace:A===null?e.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:Vt.workingColorSpace,alphaToCoverage:!!i.alphaToCoverage,map:te,matcap:ne,envMap:re,envMapMode:re&&b.mapping,envMapPMREM:ie,envMapMaxLod:ie?F.length-1:null,envMapSize:ie?F[0].width:null,aoMap:ae,lightMap:oe,bumpMap:se,normalMap:N,displacementMap:ce,emissiveMap:le,normalMapObjectSpace:N&&i.normalMapType===1,normalMapTangentSpace:N&&i.normalMapType===0,packedNormalMap:N&&i.normalMapType===0&&Rc(i.normalMap.format),metalnessMap:ue,roughnessMap:de,anisotropy:fe,anisotropyMap:be,clearcoat:pe,clearcoatMap:xe,clearcoatNormalMap:Se,clearcoatRoughnessMap:Ce,diffuseRoughness:me,diffuseRoughnessMap:we,dispersion:he,retroreflection:ge,iridescence:_e,iridescenceMap:Te,iridescenceThicknessMap:Ee,sheen:ve,sheenColorMap:De,sheenRoughnessMap:Oe,specularMap:ke,specularColorMap:Ae,specularIntensityMap:je,transmission:ye,transmissionMap:Me,thicknessMap:Ne,gradientMap:Pe,opaque:i.transparent===!1&&i.blending===1&&i.alphaToCoverage===!1,alphaMap:Fe,alphaTest:P,alphaHash:Ie,combine:i.combine,mapUv:te&&p(i.map.channel),aoMapUv:ae&&p(i.aoMap.channel),lightMapUv:oe&&p(i.lightMap.channel),bumpMapUv:se&&p(i.bumpMap.channel),normalMapUv:N&&p(i.normalMap.channel),displacementMapUv:ce&&p(i.displacementMap.channel),emissiveMapUv:le&&p(i.emissiveMap.channel),metalnessMapUv:ue&&p(i.metalnessMap.channel),roughnessMapUv:de&&p(i.roughnessMap.channel),anisotropyMapUv:be&&p(i.anisotropyMap.channel),clearcoatMapUv:xe&&p(i.clearcoatMap.channel),clearcoatNormalMapUv:Se&&p(i.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Ce&&p(i.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:we&&p(i.diffuseRoughnessMap.channel),iridescenceMapUv:Te&&p(i.iridescenceMap.channel),iridescenceThicknessMapUv:Ee&&p(i.iridescenceThicknessMap.channel),sheenColorMapUv:De&&p(i.sheenColorMap.channel),sheenRoughnessMapUv:Oe&&p(i.sheenRoughnessMap.channel),specularMapUv:ke&&p(i.specularMap.channel),specularColorMapUv:Ae&&p(i.specularColorMap.channel),specularIntensityMapUv:je&&p(i.specularIntensityMap.channel),transmissionMapUv:Me&&p(i.transmissionMap.channel),thicknessMapUv:Ne&&p(i.thicknessMap.channel),alphaMapUv:Fe&&p(i.alphaMap.channel),vertexTangents:!!_.attributes.tangent&&(N||fe),vertexNormals:!!_.attributes.normal,vertexColors:i.vertexColors,vertexAlphas:i.vertexColors===!0&&!!_.attributes.color&&_.attributes.color.itemSize===4,pointsUvs:m.isPoints===!0&&!!_.attributes.uv&&(te||Fe),fog:!!g,useFog:i.fog===!0,fogExp2:!!g&&g.isFogExp2,flatShading:i.wireframe===!1&&(i.flatShading===!0||_.attributes.normal===void 0&&N===!1&&(i.isMeshLambertMaterial||i.isMeshPhongMaterial||i.isMeshStandardMaterial||i.isMeshPhysicalMaterial)),sizeAttenuation:i.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:j,skinning:m.isSkinnedMesh===!0,hasPositionAttribute:_.attributes.position!==void 0,morphTargets:_.morphAttributes.position!==void 0,morphNormals:_.morphAttributes.normal!==void 0,morphColors:_.morphAttributes.color!==void 0,morphTargetsCount:w,morphTextureStride:T,numSunLights:o.sun.length,numDirLights:o.directional.length,numPointLights:o.point.length,numSpotLights:o.spot.length,numSpotLightMaps:o.spotLightMap.length,numRectAreaLights:o.rectArea.length,numHemiLights:o.hemi.length,numSunLightShadows:o.sunShadowMap.length,numDirLightShadows:o.directionalShadowMap.length,numPointLightShadows:o.pointShadowMap.length,numSpotLightShadows:o.spotShadowMap.length,numSpotLightShadowsWithMaps:o.numSpotLightShadowsWithMaps,numLightProbes:o.numLightProbes,numLightProbeGrids:h.filter(e=>e.texture!==null).length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:i.dithering,shadowMapEnabled:e.shadowMap.enabled&&l.length>0,shadowMapType:e.shadowMap.type,toneMapping:Re,decodeVideoTexture:te&&i.map.isVideoTexture===!0&&Vt.getTransfer(i.map.colorSpace)===`srgb`,decodeVideoTextureEmissive:le&&i.emissiveMap.isVideoTexture===!0&&Vt.getTransfer(i.emissiveMap.colorSpace)===`srgb`,premultipliedAlpha:i.premultipliedAlpha,doubleSided:i.side===2,flipSided:i.side===1,useDepthPacking:i.depthPacking>=0,depthPacking:i.depthPacking||0,index0AttributeName:i.index0AttributeName,extensionClipCullDistance:Le&&i.extensions.clipCullDistance===!0&&n.has(`WEBGL_clip_cull_distance`),extensionMultiDraw:(Le&&i.extensions.multiDraw===!0||ee)&&n.has(`WEBGL_multi_draw`),rendererExtensionParallelShaderCompile:n.has(`KHR_parallel_shader_compile`),customProgramCacheKey:i.customProgramCacheKey()};return ze.vertexUv1s=c.has(1),ze.vertexUv2s=c.has(2),ze.vertexUv3s=c.has(3),c.clear(),ze}function h(t){let n=[];if(t.shaderID?n.push(t.shaderID):(n.push(t.customVertexShaderID),n.push(t.customFragmentShaderID)),t.defines!==void 0)for(let e in t.defines)n.push(e),n.push(t.defines[e]);return t.isRawShaderMaterial===!1&&(g(n,t),_(n,t),n.push(e.outputColorSpace)),n.push(t.customProgramCacheKey),n.join()}function g(e,t){e.push(t.precision),e.push(t.outputColorSpace),e.push(t.envMapMode),e.push(t.envMapPMREM),e.push(t.envMapMaxLod),e.push(t.envMapSize),e.push(t.mapUv),e.push(t.alphaMapUv),e.push(t.lightMapUv),e.push(t.aoMapUv),e.push(t.bumpMapUv),e.push(t.normalMapUv),e.push(t.displacementMapUv),e.push(t.emissiveMapUv),e.push(t.metalnessMapUv),e.push(t.roughnessMapUv),e.push(t.anisotropyMapUv),e.push(t.clearcoatMapUv),e.push(t.clearcoatNormalMapUv),e.push(t.clearcoatRoughnessMapUv),e.push(t.diffuseRoughnessMapUv),e.push(t.iridescenceMapUv),e.push(t.iridescenceThicknessMapUv),e.push(t.sheenColorMapUv),e.push(t.sheenRoughnessMapUv),e.push(t.specularMapUv),e.push(t.specularColorMapUv),e.push(t.specularIntensityMapUv),e.push(t.transmissionMapUv),e.push(t.thicknessMapUv),e.push(t.combine),e.push(t.fogExp2),e.push(t.sizeAttenuation),e.push(t.morphTargetsCount),e.push(t.numSunLights),e.push(t.numDirLights),e.push(t.numPointLights),e.push(t.numSpotLights),e.push(t.numSpotLightMaps),e.push(t.numHemiLights),e.push(t.numRectAreaLights),e.push(t.numSunLightShadows),e.push(t.numDirLightShadows),e.push(t.numPointLightShadows),e.push(t.numSpotLightShadows),e.push(t.numSpotLightShadowsWithMaps),e.push(t.numLightProbes),e.push(t.numLightProbeGrids),e.push(t.shadowMapType),e.push(t.toneMapping),e.push(t.numClippingPlanes),e.push(t.numClipIntersection),e.push(t.depthPacking)}function _(e,t){o.disableAll(),t.instancing&&o.enable(0),t.instancingColor&&o.enable(1),t.instancingMorph&&o.enable(2),t.matcap&&o.enable(3),t.envMap&&o.enable(4),t.normalMapObjectSpace&&o.enable(5),t.normalMapTangentSpace&&o.enable(6),t.clearcoat&&o.enable(7),t.iridescence&&o.enable(8),t.alphaTest&&o.enable(9),t.vertexColors&&o.enable(10),t.vertexAlphas&&o.enable(11),t.vertexUv1s&&o.enable(12),t.vertexUv2s&&o.enable(13),t.vertexUv3s&&o.enable(14),t.vertexTangents&&o.enable(15),t.anisotropy&&o.enable(16),t.alphaHash&&o.enable(17),t.batching&&o.enable(18),t.dispersion&&o.enable(19),t.retroreflection&&o.enable(24),t.diffuseRoughness&&o.enable(25),t.batchingColor&&o.enable(20),t.gradientMap&&o.enable(21),t.packedNormalMap&&o.enable(22),t.vertexNormals&&o.enable(23),e.push(o.mask),o.disableAll(),t.fog&&o.enable(0),t.useFog&&o.enable(1),t.flatShading&&o.enable(2),t.logarithmicDepthBuffer&&o.enable(3),t.reversedDepthBuffer&&o.enable(4),t.skinning&&o.enable(5),t.morphTargets&&o.enable(6),t.morphNormals&&o.enable(7),t.morphColors&&o.enable(8),t.premultipliedAlpha&&o.enable(9),t.shadowMapEnabled&&o.enable(10),t.doubleSided&&o.enable(11),t.flipSided&&o.enable(12),t.useDepthPacking&&o.enable(13),t.dithering&&o.enable(14),t.transmission&&o.enable(15),t.sheen&&o.enable(16),t.opaque&&o.enable(17),t.pointsUvs&&o.enable(18),t.decodeVideoTexture&&o.enable(19),t.decodeVideoTextureEmissive&&o.enable(20),t.alphaToCoverage&&o.enable(21),t.numLightProbeGrids>0&&o.enable(22),t.hasPositionAttribute&&o.enable(23),e.push(o.mask)}function v(e){let t=f[e.type],n;if(t){let e=po[t];n=Zi.clone(e.uniforms)}else n=e.uniforms;return n}function y(t,n){let r=u.get(n);return r===void 0?(r=new Pc(e,n,t,i),l.push(r),u.set(n,r)):++r.usedTimes,r}function b(e){if(--e.usedTimes===0){let t=l.indexOf(e);l[t]=l[l.length-1],l.pop(),u.delete(e.cacheKey),e.destroy()}}function x(e){s.remove(e)}function S(){s.dispose()}return{getParameters:m,getProgramCacheKey:h,getUniforms:v,acquireProgram:y,releaseProgram:b,releaseShaderCache:x,programs:l,dispose:S}}function Bc(){let e=new WeakMap;function t(t){return e.has(t)}function n(t){let n=e.get(t);return n===void 0&&(n={},e.set(t,n)),n}function r(t){e.delete(t)}function i(t,n,r){e.get(t)[n]=r}function a(){e=new WeakMap}return{has:t,get:n,remove:r,update:i,dispose:a}}function Vc(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.material.id===t.material.id?e.materialVariant===t.materialVariant?e.z===t.z?e.id-t.id:e.z-t.z:e.materialVariant-t.materialVariant:e.material.id-t.material.id:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function Hc(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.z===t.z?e.id-t.id:t.z-e.z:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function Uc(){let e=[],t=0,n=[],r=[],i=[];function a(){t=0,n.length=0,r.length=0,i.length=0}function o(e){let t=0;return e.isInstancedMesh&&(t+=2),e.isSkinnedMesh&&(t+=1),t}function s(n,r,i,a,s,c){let l=e[t];return l===void 0?(l={id:n.id,object:n,geometry:r,material:i,materialVariant:o(n),groupOrder:a,renderOrder:n.renderOrder,z:s,group:c},e[t]=l):(l.id=n.id,l.object=n,l.geometry=r,l.material=i,l.materialVariant=o(n),l.groupOrder=a,l.renderOrder=n.renderOrder,l.z=s,l.group=c),t++,l}function c(e,t,a,o,c,l,u){u.reversedDepth===!0&&(c=-c);let d=s(e,t,a,o,c,l);a.transmission>0?r.push(d):a.transparent===!0?i.push(d):n.push(d)}function l(e,t,a,o,c,l){let u=s(e,t,a,o,c,l);a.transmission>0?r.unshift(u):a.transparent===!0?i.unshift(u):n.unshift(u)}function u(e,t){n.length>1&&n.sort(e||Vc),r.length>1&&r.sort(t||Hc),i.length>1&&i.sort(t||Hc)}function d(){for(let n=t,r=e.length;n<r;n++){let t=e[n];if(t.id===null)break;t.id=null,t.object=null,t.geometry=null,t.material=null,t.group=null}}return{opaque:n,transmissive:r,transparent:i,init:a,push:c,unshift:l,finish:d,sort:u}}function Wc(){let e=new WeakMap;function t(t,n){let r=e.get(t),i;return r===void 0?(i=new Uc,e.set(t,[i])):n>=r.length?(i=new Uc,r.push(i)):i=r[n],i}function n(){e=new WeakMap}return{get:t,dispose:n}}function Gc(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={direction:new B,color:new H};break;case`SpotLight`:n={position:new B,direction:new B,color:new H,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case`PointLight`:n={position:new B,color:new H,distance:0,decay:0};break;case`HemisphereLight`:n={direction:new B,skyColor:new H,groundColor:new H};break;case`RectAreaLight`:n={color:new H,position:new B,halfWidth:new B,halfHeight:new B}}return e[t.id]=n,n}}}function Kc(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Nt};break;case`SpotLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Nt};break;case`PointLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Nt,shadowCameraNear:1,shadowCameraFar:1e3}}return e[t.id]=n,n}}}var qc=0;function Jc(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+ +!!t.map-!!e.map}function Yc(e){let t=new Gc,n=Kc(),r={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let e=0;e<9;e++)r.probe.push(new B);let i=new B,a=new rn,o=new rn;function s(i){let a=0,o=0,s=0;for(let e=0;e<9;e++)r.probe[e].set(0,0,0);let c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0,y=0,b=0,x=0;i.sort(Jc);for(let e=0,S=i.length;e<S;e++){let S=i[e],C=S.color,w=S.intensity,T=S.distance,E=null;if(S.shadow&&S.shadow.map&&(E=S.shadow.map.texture.format===1030?S.shadow.map.texture:S.shadow.map.depthTexture||S.shadow.map.texture),S.isAmbientLight)a+=C.r*w,o+=C.g*w,s+=C.b*w;else if(S.isLightProbe){for(let e=0;e<9;e++)r.probe[e].addScaledVector(S.sh.coefficients[e],w);x++}else if(S.isSunLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize.copy(e.mapSize).multiply(e.getFrameExtents()),r.sunShadow[l]=t,r.sunShadowMap[l]=E;let i=e.getViewportCount();for(let t=0;t<i;t++)r.sunShadowMatrix[u+t]=e.getMatrix(t),r.sunShadowCascade[u+t]=e._cascadeData[t];u+=i,l++}r.sun[c]=e,c++}else if(S.isDirectionalLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,r.directionalShadow[d]=t,r.directionalShadowMap[d]=E,r.directionalShadowMatrix[d]=S.shadow.matrix,g++}r.directional[d]=e,d++}else if(S.isSpotLight){let e=t.get(S);e.position.setFromMatrixPosition(S.matrixWorld),e.color.copy(C).multiplyScalar(w),e.distance=T,e.coneCos=Math.cos(S.angle),e.penumbraCos=Math.cos(S.angle*(1-S.penumbra)),e.decay=S.decay,r.spot[p]=e;let i=S.shadow;if(S.map&&(r.spotLightMap[y]=S.map,y++,i.updateMatrices(S),S.castShadow&&b++),r.spotLightMatrix[p]=i.matrix,S.castShadow){let e=n.get(S);e.shadowIntensity=i.intensity,e.shadowBias=i.bias,e.shadowNormalBias=i.normalBias,e.shadowRadius=i.radius,e.shadowMapSize=i.mapSize,r.spotShadow[p]=e,r.spotShadowMap[p]=E,v++}p++}else if(S.isRectAreaLight){let e=t.get(S);e.color.copy(C).multiplyScalar(w),e.halfWidth.set(S.width*.5,0,0),e.halfHeight.set(0,S.height*.5,0),r.rectArea[m]=e,m++}else if(S.isPointLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),e.distance=S.distance,e.decay=S.decay,S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,t.shadowCameraNear=e.camera.near,t.shadowCameraFar=e.camera.far,r.pointShadow[f]=t,r.pointShadowMap[f]=E,r.pointShadowMatrix[f]=S.shadow.matrix,_++}r.point[f]=e,f++}else if(S.isHemisphereLight){let e=t.get(S);e.skyColor.copy(S.color).multiplyScalar(w),e.groundColor.copy(S.groundColor).multiplyScalar(w),r.hemi[h]=e,h++}}m>0&&(e.has(`OES_texture_float_linear`)===!0?(r.rectAreaLTC1=W.LTC_FLOAT_1,r.rectAreaLTC2=W.LTC_FLOAT_2):(r.rectAreaLTC1=W.LTC_HALF_1,r.rectAreaLTC2=W.LTC_HALF_2)),r.ambient[0]=a,r.ambient[1]=o,r.ambient[2]=s;let S=r.hash;(S.sunLength!==c||S.directionalLength!==d||S.pointLength!==f||S.spotLength!==p||S.rectAreaLength!==m||S.hemiLength!==h||S.numSunShadows!==l||S.numDirectionalShadows!==g||S.numPointShadows!==_||S.numSpotShadows!==v||S.numSpotMaps!==y||S.numLightProbes!==x)&&(r.sun.length=c,r.directional.length=d,r.spot.length=p,r.rectArea.length=m,r.point.length=f,r.hemi.length=h,r.sunShadow.length=l,r.sunShadowMap.length=l,r.sunShadowMatrix.length=u,r.sunShadowCascade.length=u,r.directionalShadow.length=g,r.directionalShadowMap.length=g,r.directionalShadowMatrix.length=g,r.pointShadow.length=_,r.pointShadowMap.length=_,r.pointShadowMatrix.length=_,r.spotShadow.length=v,r.spotShadowMap.length=v,r.spotLightMatrix.length=v+y-b,r.spotLightMap.length=y,r.numSpotLightShadowsWithMaps=b,r.numLightProbes=x,S.sunLength=c,S.directionalLength=d,S.pointLength=f,S.spotLength=p,S.rectAreaLength=m,S.hemiLength=h,S.numSunShadows=l,S.numDirectionalShadows=g,S.numPointShadows=_,S.numSpotShadows=v,S.numSpotMaps=y,S.numLightProbes=x,r.version=qc++)}function c(e,t){let n=0,s=0,c=0,l=0,u=0,d=0,f=t.matrixWorldInverse;for(let t=0,p=e.length;t<p;t++){let p=e[t];if(p.isSunLight){let e=r.sun[n];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),n++}else if(p.isDirectionalLight){let e=r.directional[s];e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),s++}else if(p.isSpotLight){let e=r.spot[l];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),l++}else if(p.isRectAreaLight){let e=r.rectArea[u];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),o.identity(),a.copy(p.matrixWorld),a.premultiply(f),o.extractRotation(a),e.halfWidth.set(p.width*.5,0,0),e.halfHeight.set(0,p.height*.5,0),e.halfWidth.applyMatrix4(o),e.halfHeight.applyMatrix4(o),u++}else if(p.isPointLight){let e=r.point[c];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),c++}else if(p.isHemisphereLight){let e=r.hemi[d];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),d++}}}return{setup:s,setupView:c,state:r}}function Xc(e){let t=new Yc(e),n=[],r=[],i=[];function a(e){u.camera=e,n.length=0,r.length=0,i.length=0}function o(e){e.isLightProbeGrid?i.push(e):n.push(e)}function s(e){r.push(e)}function c(){t.setup(n),i.sort((e,t)=>e.priority-t.priority||e.id-t.id)}function l(e){t.setupView(n,e)}let u={lightsArray:n,shadowsArray:r,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:u,setupLights:c,setupLightsView:l,pushLight:o,pushShadow:s}}function Zc(e){let t=new WeakMap;function n(n,r=0){let i=t.get(n),a;return i===void 0?(a=new Xc(e),t.set(n,[a])):r>=i.length?(a=new Xc(e),i.push(a)):a=i[r],a}function r(){t=new WeakMap}return{get:n,dispose:r}}var Qc=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,$c=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,el=[new B(1,0,0),new B(-1,0,0),new B(0,1,0),new B(0,-1,0),new B(0,0,1),new B(0,0,-1)],tl=[new B(0,-1,0),new B(0,-1,0),new B(0,0,1),new B(0,0,-1),new B(0,-1,0),new B(0,-1,0)],nl=new rn,rl=new B,il=new B;function al(e,t,n){let r=new xi,i=new Nt,a=new Nt,o=new Qt,s=new ra,c=new ia,l={},u=n.maxTextureSize,d={0:1,1:0,2:2},f=new ea({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Nt},radius:{value:4}},vertexShader:Qc,fragmentShader:$c}),p=f.clone();p.defines.HORIZONTAL_PASS=1;let m=new Fr;m.setAttribute(`position`,new br(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let h=new ai(m,f),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let _=this.type;this.render=function(t,n,s){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||t.length===0)return;this.type===2&&(R(`WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.`),this.type=1);let c=e.getRenderTarget(),l=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),f=e.state;f.setBlending(0),f.buffers.depth.getReversed()===!0?f.buffers.color.setClear(0,0,0,0):f.buffers.color.setClear(1,1,1,1),f.buffers.depth.setTest(!0),f.setScissorTest(!1);let p=_!==this.type;p&&n.traverse(function(e){e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.needsUpdate=!0):e.material.needsUpdate=!0)});for(let c=0,l=t.length;c<l;c++){let l=t[c],d=l.shadow;if(d===void 0){R(`WebGLShadowMap:`,l,`has no shadow.`);continue}if(d.autoUpdate===!1&&d.needsUpdate===!1)continue;i.copy(d.mapSize);let m=d.getFrameExtents();i.multiply(m),a.copy(d.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(a.x=Math.floor(u/m.x),i.x=a.x*m.x,d.mapSize.x=a.x),i.y>u&&(a.y=Math.floor(u/m.y),i.y=a.y*m.y,d.mapSize.y=a.y));let h=e.state.buffers.depth.getReversed();if(d.camera._reversedDepth=h,d.map===null||p===!0){if(d.map!==null&&(d.map.depthTexture!==null&&(d.map.depthTexture.dispose(),d.map.depthTexture=null),d.map.dispose()),this.type===3){if(l.isPointLight){R(`WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.`);continue}d.map=new en(i.x,i.y,{format:he,type:re,minFilter:E,magFilter:E,generateMipmaps:!1}),d.map.texture.name=l.name+`.shadowMap`,d.map.depthTexture=new Mi(i.x,i.y,ne),d.map.depthTexture.name=l.name+`.shadowMapDepth`,d.map.depthTexture.format=de,d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=C,d.map.depthTexture.magFilter=C}else l.isPointLight?(d.map=new So(i.x),d.map.depthTexture=new Ni(i.x,te)):(d.map=new en(i.x,i.y),d.map.depthTexture=new Mi(i.x,i.y,te)),d.map.depthTexture.name=l.name+`.shadowMap`,d.map.depthTexture.format=de,this.type===1?(d.map.depthTexture.compareFunction=h?518:515,d.map.depthTexture.minFilter=E,d.map.depthTexture.magFilter=E):(d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=C,d.map.depthTexture.magFilter=C);d.camera.updateProjectionMatrix()}d.map.isWebGLCubeRenderTarget!==!0&&(d.map.width!==i.x||d.map.height!==i.y)&&d.map.setSize(i.x,i.y);let g=d.map.isWebGLCubeRenderTarget?6:d.getViewportCount();l.isPointLight!==!0&&d.updateMatrices(l,s);let _=d.camera.layers.mask&4294967294?d.camera.layers:s.layers;for(let t=0;t<g;t++){let i=d.getCamera(t);if(l.isPointLight){let e=d.camera,n=d.matrix,r=l.distance||e.far;r!==e.far&&(e.far=r,e.updateProjectionMatrix()),rl.setFromMatrixPosition(l.matrixWorld),e.position.copy(rl),il.copy(e.position),il.add(el[t]),e.up.copy(tl[t]),e.lookAt(il),e.updateMatrixWorld(),n.makeTranslation(-rl.x,-rl.y,-rl.z),nl.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),d._frustum.setFromProjectionMatrix(nl,e.coordinateSystem,e.reversedDepth)}if(d.map.isWebGLCubeRenderTarget)e.setRenderTarget(d.map,t),e.clear();else{t===0&&(e.setRenderTarget(d.map),e.clear());let n=d.getViewport(t);o.set(a.x*n.x,a.y*n.y,a.x*n.z,a.y*n.w),f.viewport(o)}r=d.getFrustum(t),b(n,s,i,l,_,this.type)}d.isPointLightShadow!==!0&&this.type===3&&v(d,s),d.needsUpdate=!1}_=this.type,g.needsUpdate=!1,e.setRenderTarget(c,l,d)};function v(n,r){let a=t.update(h);f.defines.VSM_SAMPLES!==n.blurSamples&&(f.defines.VSM_SAMPLES=n.blurSamples,p.defines.VSM_SAMPLES=n.blurSamples,f.needsUpdate=!0,p.needsUpdate=!0),n.mapPass===null?n.mapPass=new en(i.x,i.y,{format:he,type:re}):(n.mapPass.width!==n.map.width||n.mapPass.height!==n.map.height)&&n.mapPass.setSize(n.map.width,n.map.height),f.uniforms.shadow_pass.value=n.map.depthTexture,f.uniforms.resolution.value.set(n.map.width,n.map.height),f.uniforms.radius.value=n.radius,e.setRenderTarget(n.mapPass),e.clear(),e.renderBufferDirect(r,null,a,f,h,null),p.uniforms.shadow_pass.value=n.mapPass.texture,p.uniforms.resolution.value.set(n.map.width,n.map.height),p.uniforms.radius.value=n.radius,e.setRenderTarget(n.map),e.clear(),e.renderBufferDirect(r,null,a,p,h,null)}function y(t,n,r,i){let a=null,o=r.isPointLight===!0?t.customDistanceMaterial:t.customDepthMaterial;if(o!==void 0)a=o;else if(a=r.isPointLight===!0?c:s,e.localClippingEnabled&&n.clipShadows===!0&&Array.isArray(n.clippingPlanes)&&n.clippingPlanes.length!==0||n.displacementMap&&n.displacementScale!==0||n.alphaMap&&n.alphaTest>0||n.map&&n.alphaTest>0||n.alphaToCoverage===!0){let e=a.uuid,t=n.uuid,r=l[e];r===void 0&&(r={},l[e]=r);let i=r[t];i===void 0&&(i=a.clone(),r[t]=i,n.addEventListener(`dispose`,x)),a=i}if(a.visible=n.visible,a.wireframe=n.wireframe,i===3?a.side=n.shadowSide===null?n.side:n.shadowSide:a.side=n.shadowSide===null?d[n.side]:n.shadowSide,a.alphaMap=n.alphaMap,a.alphaTest=n.alphaToCoverage===!0?.5:n.alphaTest,a.map=n.map,a.clipShadows=n.clipShadows,a.clippingPlanes=n.clippingPlanes,a.clipIntersection=n.clipIntersection,a.displacementMap=n.displacementMap,a.displacementScale=n.displacementScale,a.displacementBias=n.displacementBias,a.wireframeLinewidth=n.wireframeLinewidth,a.linewidth=n.linewidth,r.isPointLight===!0&&a.isMeshDistanceMaterial===!0){let t=e.properties.get(a);t.light=r}return a}function b(n,i,a,o,s,c){if(n.visible===!1)return;if(n.layers.test(s)&&(n.isMesh||n.isLine||n.isPoints)&&(n.castShadow||n.receiveShadow&&c===3)&&(!n.frustumCulled||n.intersectsFrustum(r))){n.modelViewMatrix.multiplyMatrices(a.matrixWorldInverse,n.matrixWorld);let r=t.update(n),s=n.material;if(Array.isArray(s)){let t=r.groups;for(let l=0,u=t.length;l<u;l++){let u=t[l],d=s[u.materialIndex];if(d&&d.visible){let t=y(n,d,o,c);n.onBeforeShadow(e,n,i,a,r,t,u),e.renderBufferDirect(a,null,r,t,n,u),n.onAfterShadow(e,n,i,a,r,t,u)}}}else if(s.visible){let t=y(n,s,o,c);n.onBeforeShadow(e,n,i,a,r,t,null),e.renderBufferDirect(a,null,r,t,n,null),n.onAfterShadow(e,n,i,a,r,t,null)}}let l=n.children;for(let e=0,t=l.length;e<t;e++)b(l[e],i,a,o,s,c)}function x(e){e.target.removeEventListener(`dispose`,x);for(let t in l){let n=l[t],r=e.target.uuid;r in n&&(n[r].dispose(),delete n[r])}}}function ol(e,t){function n(){let t=!1,n=new Qt,r=null,i=new Qt(0,0,0,0);return{setMask:function(n){r!==n&&!t&&(e.colorMask(n,n,n,n),r=n)},setLocked:function(e){t=e},setClear:function(t,r,a,o,s){s===!0&&(t*=o,r*=o,a*=o),n.set(t,r,a,o),i.equals(n)===!1&&(e.clearColor(t,r,a,o),i.copy(n))},reset:function(){t=!1,r=null,i.set(-1,0,0,0)}}}function r(){let n=!1,r=!1,i=null,a=null,o=null;return{setReversed:function(e){if(r!==e){let n=t.get(`EXT_clip_control`);e?n.clipControlEXT(n.LOWER_LEFT_EXT,n.ZERO_TO_ONE_EXT):n.clipControlEXT(n.LOWER_LEFT_EXT,n.NEGATIVE_ONE_TO_ONE_EXT),r=e;let i=o;o=null,this.setClear(i)}},getReversed:function(){return r},setTest:function(t){t?ue(e.DEPTH_TEST):de(e.DEPTH_TEST)},setMask:function(t){i!==t&&!n&&(e.depthMask(t),i=t)},setFunc:function(t){if(r&&(t=bt[t]),a!==t){switch(t){case 0:e.depthFunc(e.NEVER);break;case 1:e.depthFunc(e.ALWAYS);break;case 2:e.depthFunc(e.LESS);break;case 3:e.depthFunc(e.LEQUAL);break;case 4:e.depthFunc(e.EQUAL);break;case 5:e.depthFunc(e.GEQUAL);break;case 6:e.depthFunc(e.GREATER);break;case 7:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}a=t}},setLocked:function(e){n=e},setClear:function(t){o!==t&&(o=t,r&&(t=1-t),e.clearDepth(t))},reset:function(){n=!1,i=null,a=null,o=null,r=!1}}}function i(){let t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null;return{setTest:function(n){t||(n?ue(e.STENCIL_TEST):de(e.STENCIL_TEST))},setMask:function(r){n!==r&&!t&&(e.stencilMask(r),n=r)},setFunc:function(t,n,o){(r!==t||i!==n||a!==o)&&(e.stencilFunc(t,n,o),r=t,i=n,a=o)},setOp:function(t,n,r){(o!==t||s!==n||c!==r)&&(e.stencilOp(t,n,r),o=t,s=n,c=r)},setLocked:function(e){t=e},setClear:function(t){l!==t&&(e.clearStencil(t),l=t)},reset:function(){t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null}}}let a=new n,o=new r,s=new i,c={},l=new WeakMap,u={},d={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new H(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,M=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),ee=!1,te=0,ne=e.getParameter(e.VERSION);ne.indexOf(`WebGL`)===-1?ne.indexOf(`OpenGL ES`)!==-1&&(te=parseFloat(/^OpenGL ES (\d)/.exec(ne)[1]),ee=te>=2):(te=parseFloat(/^WebGL (\d)/.exec(ne)[1]),ee=te>=1);let re=null,ie={},ae=e.getParameter(e.SCISSOR_BOX),oe=e.getParameter(e.VIEWPORT),se=new Qt().fromArray(ae),N=new Qt().fromArray(oe);function ce(t,n,r,i){let a=new Uint8Array(4),o=e.createTexture();e.bindTexture(t,o),e.texParameteri(t,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(t,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let o=0;o<r;o++)t===e.TEXTURE_3D||t===e.TEXTURE_2D_ARRAY?e.texImage3D(n,0,e.RGBA,1,1,i,0,e.RGBA,e.UNSIGNED_BYTE,a):e.texImage2D(n+o,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,a);return o}let le={};le[e.TEXTURE_2D]=ce(e.TEXTURE_2D,e.TEXTURE_2D,1),le[e.TEXTURE_CUBE_MAP]=ce(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),le[e.TEXTURE_2D_ARRAY]=ce(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),le[e.TEXTURE_3D]=ce(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),s.setClear(0),ue(e.DEPTH_TEST),o.setFunc(3),ye(!1),be(1),ue(e.CULL_FACE),_e(0);function ue(t){u[t]!==!0&&(e.enable(t),u[t]=!0)}function de(t){u[t]!==!1&&(e.disable(t),u[t]=!1)}function fe(t,n){return f[t]!==n&&(e.bindFramebuffer(t,n),f[t]=n,t===e.DRAW_FRAMEBUFFER&&(f[e.FRAMEBUFFER]=n),t===e.FRAMEBUFFER&&(f[e.DRAW_FRAMEBUFFER]=n),!0)}function pe(t,n){let r=m,i=!1;if(t){r=p.get(n),r===void 0&&(r=[],p.set(n,r));let a=t.textures;if(r.length!==a.length||r[0]!==e.COLOR_ATTACHMENT0){for(let t=0,n=a.length;t<n;t++)r[t]=e.COLOR_ATTACHMENT0+t;r.length=a.length,i=!0}}else r[0]!==e.BACK&&(r[0]=e.BACK,i=!0);i&&e.drawBuffers(r)}function me(t){return h!==t&&(e.useProgram(t),h=t,!0)}let he={100:e.FUNC_ADD,101:e.FUNC_SUBTRACT,102:e.FUNC_REVERSE_SUBTRACT};he[103]=e.MIN,he[104]=e.MAX;let ge={200:e.ZERO,201:e.ONE,202:e.SRC_COLOR,204:e.SRC_ALPHA,210:e.SRC_ALPHA_SATURATE,208:e.DST_COLOR,206:e.DST_ALPHA,203:e.ONE_MINUS_SRC_COLOR,205:e.ONE_MINUS_SRC_ALPHA,209:e.ONE_MINUS_DST_COLOR,207:e.ONE_MINUS_DST_ALPHA,211:e.CONSTANT_COLOR,212:e.ONE_MINUS_CONSTANT_COLOR,213:e.CONSTANT_ALPHA,214:e.ONE_MINUS_CONSTANT_ALPHA};function _e(t,n,r,i,a,o,s,c,l,u){if(t===0)g===!0&&(de(e.BLEND),g=!1);else if(g===!1&&(ue(e.BLEND),g=!0),t!==5){if(t!==_||u!==E){if((v!==100||x!==100)&&(e.blendEquation(e.FUNC_ADD),v=100,x=100),u)switch(t){case 1:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFunc(e.ONE,e.ONE);break;case 3:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case 4:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:z(`WebGLState: Invalid blending: `,t)}else switch(t){case 1:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case 3:z(`WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true`);break;case 4:z(`WebGLState: MultiplyBlending requires material.premultipliedAlpha = true`);break;default:z(`WebGLState: Invalid blending: `,t)}y=null,b=null,S=null,C=null,w.set(0,0,0),T=0,_=t,E=u}}else a||=n,o||=r,s||=i,(n!==v||a!==x)&&(e.blendEquationSeparate(he[n],he[a]),v=n,x=a),(r!==y||i!==b||o!==S||s!==C)&&(e.blendFuncSeparate(ge[r],ge[i],ge[o],ge[s]),y=r,b=i,S=o,C=s),(c.equals(w)===!1||l!==T)&&(e.blendColor(c.r,c.g,c.b,l),w.copy(c),T=l),_=t,E=!1}function ve(t,n){t.side===2?de(e.CULL_FACE):ue(e.CULL_FACE);let r=t.side===1;n&&(r=!r),ye(r),t.blending===1&&t.transparent===!1?_e(0):_e(t.blending,t.blendEquation,t.blendSrc,t.blendDst,t.blendEquationAlpha,t.blendSrcAlpha,t.blendDstAlpha,t.blendColor,t.blendAlpha,t.premultipliedAlpha),o.setFunc(t.depthFunc),o.setTest(t.depthTest),o.setMask(t.depthWrite),a.setMask(t.colorWrite);let i=t.stencilWrite;s.setTest(i),i&&(s.setMask(t.stencilWriteMask),s.setFunc(t.stencilFunc,t.stencilRef,t.stencilFuncMask),s.setOp(t.stencilFail,t.stencilZFail,t.stencilZPass)),Se(t.polygonOffset,t.polygonOffsetFactor,t.polygonOffsetUnits),t.alphaToCoverage===!0?ue(e.SAMPLE_ALPHA_TO_COVERAGE):de(e.SAMPLE_ALPHA_TO_COVERAGE)}function ye(t){D!==t&&(t?e.frontFace(e.CW):e.frontFace(e.CCW),D=t)}function be(t){t===0?de(e.CULL_FACE):(ue(e.CULL_FACE),t!==O&&(t===1?e.cullFace(e.BACK):t===2?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))),O=t}function xe(t){t!==k&&(ee&&e.lineWidth(t),k=t)}function Se(t,n,r){t?(ue(e.POLYGON_OFFSET_FILL),(A!==n||j!==r)&&(A=n,j=r,o.getReversed()&&(n=-n,r=-r),e.polygonOffset(n,r))):de(e.POLYGON_OFFSET_FILL)}function Ce(t){t?ue(e.SCISSOR_TEST):de(e.SCISSOR_TEST)}function we(t){t===void 0&&(t=e.TEXTURE0+M-1),re!==t&&(e.activeTexture(t),re=t)}function Te(t,n,r){r===void 0&&(r=re===null?e.TEXTURE0+M-1:re);let i=ie[r];i===void 0&&(i={type:void 0,texture:void 0},ie[r]=i),(i.type!==t||i.texture!==n)&&(re!==r&&(e.activeTexture(r),re=r),e.bindTexture(t,n||le[t]),i.type=t,i.texture=n)}function Ee(){let t=ie[re];t!==void 0&&t.type!==void 0&&(e.bindTexture(t.type,null),t.type=void 0,t.texture=void 0)}function De(){try{e.compressedTexImage2D(...arguments)}catch(e){z(`WebGLState:`,e)}}function Oe(){try{e.compressedTexImage3D(...arguments)}catch(e){z(`WebGLState:`,e)}}function ke(){try{e.texSubImage2D(...arguments)}catch(e){z(`WebGLState:`,e)}}function Ae(){try{e.texSubImage3D(...arguments)}catch(e){z(`WebGLState:`,e)}}function je(){try{e.compressedTexSubImage2D(...arguments)}catch(e){z(`WebGLState:`,e)}}function Me(){try{e.compressedTexSubImage3D(...arguments)}catch(e){z(`WebGLState:`,e)}}function Ne(){try{e.texStorage2D(...arguments)}catch(e){z(`WebGLState:`,e)}}function Pe(){try{e.texStorage3D(...arguments)}catch(e){z(`WebGLState:`,e)}}function Fe(){try{e.texImage2D(...arguments)}catch(e){z(`WebGLState:`,e)}}function P(){try{e.texImage3D(...arguments)}catch(e){z(`WebGLState:`,e)}}function Ie(t){return d[t]===void 0?e.getParameter(t):d[t]}function Le(t,n){d[t]!==n&&(e.pixelStorei(t,n),d[t]=n)}function Re(t){se.equals(t)===!1&&(e.scissor(t.x,t.y,t.z,t.w),se.copy(t))}function F(t){N.equals(t)===!1&&(e.viewport(t.x,t.y,t.z,t.w),N.copy(t))}function ze(t,n){let r=l.get(n);r===void 0&&(r=new WeakMap,l.set(n,r));let i=r.get(t);i===void 0&&(i=e.getUniformBlockIndex(n,t.name),e.uniformBlockBinding(n,i,i),r.set(t,i))}function I(t,n,r){let i=l.get(n).get(t);c[i]!==r&&(e.bindBufferBase(e.UNIFORM_BUFFER,i,r),c[i]=r)}function L(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),u={},d={},re=null,ie={},f={},c={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new H(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,se.set(0,0,e.canvas.width,e.canvas.height),N.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),s.reset()}return{buffers:{color:a,depth:o,stencil:s},enable:ue,disable:de,bindFramebuffer:fe,drawBuffers:pe,useProgram:me,setBlending:_e,setMaterial:ve,setFlipSided:ye,setCullFace:be,setLineWidth:xe,setPolygonOffset:Se,setScissorTest:Ce,activeTexture:we,bindTexture:Te,unbindTexture:Ee,compressedTexImage2D:De,compressedTexImage3D:Oe,texImage2D:Fe,texImage3D:P,pixelStorei:Le,getParameter:Ie,updateUBOMapping:ze,uniformBlockBinding:I,texStorage2D:Ne,texStorage3D:Pe,texSubImage2D:ke,texSubImage3D:Ae,compressedTexSubImage2D:je,compressedTexSubImage3D:Me,scissor:Re,viewport:F,reset:L}}function sl(e,t,n,r,i,a,o){let s=t.has(`WEBGL_multisampled_render_to_texture`)?t.get(`WEBGL_multisampled_render_to_texture`):null,c=typeof navigator>`u`?!1:/OculusBrowser/g.test(navigator.userAgent),l=new Nt,u=new WeakMap,d=new Set,f,p=new WeakMap,m=new Set,h=new FinalizationRegistry(e=>m.delete(e)),g=!1;try{g=typeof OffscreenCanvas<`u`&&new OffscreenCanvas(1,1).getContext(`2d`)!==null}catch{}function _(e,t){return g?new OffscreenCanvas(e,t):pt(`canvas`)}function v(e,t,n){let r=1,i=L(e);if((i.width>n||i.height>n)&&(r=n/Math.max(i.width,i.height)),r<1){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof VideoFrame<`u`&&e instanceof VideoFrame){let n=Math.floor(r*i.width),a=Math.floor(r*i.height);f===void 0&&(f=_(n,a));let o=t?_(n,a):f;return o.width=n,o.height=a,o.getContext(`2d`).drawImage(e,0,0,n,a),R(`WebGLRenderer: Texture has been resized from (`+i.width+`x`+i.height+`) to (`+n+`x`+a+`).`),o}return`data`in e&&R(`WebGLRenderer: Image in DataTexture is too big (`+i.width+`x`+i.height+`).`),e}return e}function y(e){return e.generateMipmaps}function k(t){e.generateMipmap(t)}function A(t){return t.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:t.isWebGL3DRenderTarget?e.TEXTURE_3D:t.isWebGLArrayRenderTarget||t.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function j(n,r,i,a,o,s=!1){if(n!==null){if(e[n]!==void 0)return e[n];R(`WebGLRenderer: Attempt to use non-existing WebGL internal format '`+n+`'`)}let c;a&&(c=t.get(`EXT_texture_norm16`),c||R(`WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension`));let l=r;if(r===e.RED&&(i===e.FLOAT&&(l=e.R32F),i===e.HALF_FLOAT&&(l=e.R16F),i===e.UNSIGNED_BYTE&&(l=e.R8),i===e.UNSIGNED_SHORT&&c&&(l=c.R16_EXT),i===e.SHORT&&c&&(l=c.R16_SNORM_EXT)),r===e.RED_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.R8UI),i===e.UNSIGNED_SHORT&&(l=e.R16UI),i===e.UNSIGNED_INT&&(l=e.R32UI),i===e.BYTE&&(l=e.R8I),i===e.SHORT&&(l=e.R16I),i===e.INT&&(l=e.R32I)),r===e.RG&&(i===e.FLOAT&&(l=e.RG32F),i===e.HALF_FLOAT&&(l=e.RG16F),i===e.UNSIGNED_BYTE&&(l=e.RG8),i===e.UNSIGNED_SHORT&&c&&(l=c.RG16_EXT),i===e.SHORT&&c&&(l=c.RG16_SNORM_EXT)),r===e.RG_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RG8UI),i===e.UNSIGNED_SHORT&&(l=e.RG16UI),i===e.UNSIGNED_INT&&(l=e.RG32UI),i===e.BYTE&&(l=e.RG8I),i===e.SHORT&&(l=e.RG16I),i===e.INT&&(l=e.RG32I)),r===e.RGB_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGB8UI),i===e.UNSIGNED_SHORT&&(l=e.RGB16UI),i===e.UNSIGNED_INT&&(l=e.RGB32UI),i===e.BYTE&&(l=e.RGB8I),i===e.SHORT&&(l=e.RGB16I),i===e.INT&&(l=e.RGB32I)),r===e.RGBA_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGBA8UI),i===e.UNSIGNED_SHORT&&(l=e.RGBA16UI),i===e.UNSIGNED_INT&&(l=e.RGBA32UI),i===e.BYTE&&(l=e.RGBA8I),i===e.SHORT&&(l=e.RGBA16I),i===e.INT&&(l=e.RGBA32I)),r===e.RGB&&(i===e.UNSIGNED_SHORT&&c&&(l=c.RGB16_EXT),i===e.SHORT&&c&&(l=c.RGB16_SNORM_EXT),i===e.UNSIGNED_INT_5_9_9_9_REV&&(l=e.RGB9_E5),i===e.UNSIGNED_INT_10F_11F_11F_REV&&(l=e.R11F_G11F_B10F)),r===e.RGBA){let t=s?ot:Vt.getTransfer(o);i===e.FLOAT&&(l=e.RGBA32F),i===e.HALF_FLOAT&&(l=e.RGBA16F),i===e.UNSIGNED_BYTE&&(l=t===`srgb`?e.SRGB8_ALPHA8:e.RGBA8),i===e.UNSIGNED_SHORT&&c&&(l=c.RGBA16_EXT),i===e.SHORT&&c&&(l=c.RGBA16_SNORM_EXT),i===e.UNSIGNED_SHORT_4_4_4_4&&(l=e.RGBA4),i===e.UNSIGNED_SHORT_5_5_5_1&&(l=e.RGB5_A1)}return(l===e.R16F||l===e.R32F||l===e.RG16F||l===e.RG32F||l===e.RGBA16F||l===e.RGBA32F)&&t.get(`EXT_color_buffer_float`),l}function M(t,n){let r;return t?n===null||n===1014||n===1020?r=e.DEPTH24_STENCIL8:n===1015?r=e.DEPTH32F_STENCIL8:n===1012&&(r=e.DEPTH24_STENCIL8,R(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)):n===null||n===1014||n===1020?r=e.DEPTH_COMPONENT24:n===1015?r=e.DEPTH_COMPONENT32F:n===1012&&(r=e.DEPTH_COMPONENT16),r}function ee(e,t){return y(e)===!0||e.isFramebufferTexture&&e.minFilter!==1003&&e.minFilter!==1006?Math.log2(Math.max(t.width,t.height))+1:e.mipmaps.length>0?e.mipmaps.length:e.isCompressedTexture&&Array.isArray(e.image)?t.mipmaps.length:1}function te(e){let t=new WeakRef(e);r.get(e).__ref=t,m.add(t),h.register(e,t,t)}function ne(e){let t=r.get(e).__ref;t!==void 0&&(m.delete(t),h.unregister(t))}function re(e){ae(e.target)}function ie(e){oe(e.target)}function ae(e){e.removeEventListener(`dispose`,re),ne(e),N(e),e.isVideoTexture&&u.delete(e),e.isHTMLTexture&&d.delete(e)}function oe(e){e.removeEventListener(`dispose`,ie),ne(e),le(e)}function se(){for(let e of m){let t=e.deref();t!==void 0&&(t.isRenderTarget===!0?oe(t):ae(t))}m.clear(),d.clear()}function N(e){let t=r.get(e);if(t.__webglInit===void 0)return;let n=e.source,i=p.get(n);if(i){let r=i[t.__cacheKey];r.usedTimes--,r.usedTimes===0&&ce(e),Object.keys(i).length===0&&p.delete(n)}r.remove(e)}function ce(t){let n=r.get(t);e.deleteTexture(n.__webglTexture);let i=t.source,a=p.get(i);delete a[n.__cacheKey],o.memory.textures--}function le(t){let n=r.get(t);n.__depthDisposeCallback&&n.__depthDisposeCallback();let i=t.depthTexture;if(i&&i.renderTarget===t&&ae(i),t.isWebGLCubeRenderTarget)for(let t=0;t<6;t++){if(Array.isArray(n.__webglFramebuffer[t]))for(let r=0;r<n.__webglFramebuffer[t].length;r++)e.deleteFramebuffer(n.__webglFramebuffer[t][r]);else e.deleteFramebuffer(n.__webglFramebuffer[t]);n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer[t])}else{if(Array.isArray(n.__webglFramebuffer))for(let t=0;t<n.__webglFramebuffer.length;t++)e.deleteFramebuffer(n.__webglFramebuffer[t]);else e.deleteFramebuffer(n.__webglFramebuffer);if(n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer),n.__webglMultisampledFramebuffer&&e.deleteFramebuffer(n.__webglMultisampledFramebuffer),n.__webglColorRenderbuffer)for(let t=0;t<n.__webglColorRenderbuffer.length;t++)n.__webglColorRenderbuffer[t]&&e.deleteRenderbuffer(n.__webglColorRenderbuffer[t]);n.__webglDepthRenderbuffer&&e.deleteRenderbuffer(n.__webglDepthRenderbuffer)}let a=t.textures;for(let t=0,n=a.length;t<n;t++){let n=r.get(a[t]);n.__webglTexture&&(e.deleteTexture(n.__webglTexture),o.memory.textures--),r.remove(a[t])}r.remove(t)}let ue=0;function de(){ue=0}function pe(){return ue}function me(e){ue=e}function he(){let e=ue;return e>=i.maxTextures&&R(`WebGLTextures: Trying to use `+(e+1)+` texture units while this GPU supports only `+i.maxTextures),ue+=1,e}function ge(e){let t=[];return t.push(e.wrapS),t.push(e.wrapT),t.push(e.wrapR||0),t.push(e.magFilter),t.push(e.minFilter),t.push(e.anisotropy),t.push(e.internalFormat),t.push(e.format),t.push(e.type),t.push(e.generateMipmaps),t.push(e.mipmapsAutoUpdate),t.push(e.premultiplyAlpha),t.push(e.flipY),t.push(e.unpackAlignment),t.push(e.colorSpace),t.join()}function _e(t,i){let a=r.get(t);if(t.isVideoTexture&&ze(t),t.isRenderTargetTexture===!1&&t.isExternalTexture!==!0&&t.version>0&&a.__version!==t.version){let e=t.image;if(e===null)R(`WebGLRenderer: Texture marked for update but no image data found.`);else if(e.complete===!1)R(`WebGLRenderer: Texture marked for update but image is incomplete`);else{Oe(a,t,i);return}}else t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null);n.bindTexture(e.TEXTURE_2D,a.__webglTexture,e.TEXTURE0+i)}function ve(t,i){let a=r.get(t);t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version?Oe(a,t,i):(t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null),n.bindTexture(e.TEXTURE_2D_ARRAY,a.__webglTexture,e.TEXTURE0+i))}function ye(t,i){let a=r.get(t);t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version?Oe(a,t,i):n.bindTexture(e.TEXTURE_3D,a.__webglTexture,e.TEXTURE0+i)}function be(t,i){let a=r.get(t);t.version>0&&a.__version!==t.version?ke(a,t,i):n.bindTexture(e.TEXTURE_CUBE_MAP,a.__webglTexture,e.TEXTURE0+i)}let xe={[b]:e.REPEAT,[x]:e.CLAMP_TO_EDGE,[S]:e.MIRRORED_REPEAT},Se={[C]:e.NEAREST,[w]:e.NEAREST_MIPMAP_NEAREST,[T]:e.NEAREST_MIPMAP_LINEAR,[E]:e.LINEAR,[D]:e.LINEAR_MIPMAP_NEAREST,[O]:e.LINEAR_MIPMAP_LINEAR},Ce={512:e.NEVER,519:e.ALWAYS,513:e.LESS,515:e.LEQUAL,514:e.EQUAL,518:e.GEQUAL,516:e.GREATER,517:e.NOTEQUAL};function we(n,a){if(a.type===1015&&t.has(`OES_texture_float_linear`)===!1&&(a.magFilter===1006||a.magFilter===1007||a.magFilter===1005||a.magFilter===1008||a.minFilter===1006||a.minFilter===1007||a.minFilter===1005||a.minFilter===1008)&&R(`WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`),e.texParameteri(n,e.TEXTURE_WRAP_S,xe[a.wrapS]),e.texParameteri(n,e.TEXTURE_WRAP_T,xe[a.wrapT]),(n===e.TEXTURE_3D||n===e.TEXTURE_2D_ARRAY)&&e.texParameteri(n,e.TEXTURE_WRAP_R,xe[a.wrapR]),e.texParameteri(n,e.TEXTURE_MAG_FILTER,Se[a.magFilter]),e.texParameteri(n,e.TEXTURE_MIN_FILTER,Se[a.minFilter]),a.compareFunction&&(e.texParameteri(n,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(n,e.TEXTURE_COMPARE_FUNC,Ce[a.compareFunction])),t.has(`EXT_texture_filter_anisotropic`)===!0){if(a.magFilter===1003||a.minFilter!==1005&&a.minFilter!==1008||a.type===1015&&t.has(`OES_texture_float_linear`)===!1)return;if(a.anisotropy>1||r.get(a).__currentAnisotropy){let o=t.get(`EXT_texture_filter_anisotropic`);e.texParameterf(n,o.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(a.anisotropy,i.getMaxAnisotropy())),r.get(a).__currentAnisotropy=a.anisotropy}}}function Te(t,n){let r=!1;t.__webglInit===void 0&&(t.__webglInit=!0,n.addEventListener(`dispose`,re),te(n));let i=n.source,a=p.get(i);a===void 0&&(a={},p.set(i,a));let s=ge(n);if(s!==t.__cacheKey){a[s]===void 0&&(a[s]={texture:e.createTexture(),usedTimes:0},o.memory.textures++,r=!0),a[s].usedTimes++;let i=a[t.__cacheKey];i!==void 0&&(a[t.__cacheKey].usedTimes--,i.usedTimes===0&&ce(n)),t.__cacheKey=s,t.__webglTexture=a[s].texture}return r}function Ee(e,t,n){return Math.floor(Math.floor(e/n)/t)}function De(t,r,i,a){let o=t.updateRanges;if(o.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,r.width,r.height,i,a,r.data);else{o.sort((e,t)=>e.start-t.start);let s=0;for(let e=1;e<o.length;e++){let t=o[s],n=o[e],i=t.start+t.count,a=Ee(n.start,r.width,4),c=Ee(t.start,r.width,4);n.start<=i+1&&a===c&&Ee(n.start+n.count-1,r.width,4)===a?t.count=Math.max(t.count,n.start+n.count-t.start):(++s,o[s]=n)}o.length=s+1;let c=n.getParameter(e.UNPACK_ROW_LENGTH),l=n.getParameter(e.UNPACK_SKIP_PIXELS),u=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,r.width);for(let t=0,s=o.length;t<s;t++){let s=o[t],c=Math.floor(s.start/4),l=Math.ceil(s.count/4),u=c%r.width,d=Math.floor(c/r.width),f=l;n.pixelStorei(e.UNPACK_SKIP_PIXELS,u),n.pixelStorei(e.UNPACK_SKIP_ROWS,d),n.texSubImage2D(e.TEXTURE_2D,0,u,d,f,1,i,a,r.data)}t.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,c),n.pixelStorei(e.UNPACK_SKIP_PIXELS,l),n.pixelStorei(e.UNPACK_SKIP_ROWS,u)}}function Oe(t,o,s){let c=e.TEXTURE_2D;(o.isDataArrayTexture||o.isCompressedArrayTexture)&&(c=e.TEXTURE_2D_ARRAY),o.isData3DTexture&&(c=e.TEXTURE_3D);let l=Te(t,o),u=o.source;n.bindTexture(c,t.__webglTexture,e.TEXTURE0+s);let f=r.get(u);if(u.version!==f.__version||l===!0){if(n.activeTexture(e.TEXTURE0+s),!(typeof ImageBitmap<`u`&&o.image instanceof ImageBitmap)){let t=Vt.getPrimaries(Vt.workingColorSpace),r=o.colorSpace===``?null:Vt.getPrimaries(o.colorSpace),i=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,i)}n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment);let t=v(o.image,!1,i.maxTextureSize);t=I(o,t);let r=a.convert(o.format,o.colorSpace),p=a.convert(o.type),m=j(o.internalFormat,r,p,o.normalized,o.colorSpace,o.isVideoTexture);we(c,o);let h,g=o.mipmaps,_=o.isVideoTexture!==!0,b=f.__version===void 0||l===!0,x=u.dataReady,S=ee(o,t);if(o.isDepthTexture)m=M(o.format===fe,o.type),b&&(_?n.texStorage2D(e.TEXTURE_2D,1,m,t.width,t.height):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,null));else if(o.isDataTexture){if(g.length>0){_&&b&&n.texStorage2D(e.TEXTURE_2D,S,m,g[0].width,g[0].height);for(let t=0,i=g.length;t<i;t++)h=g[t],_?x&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data);o.generateMipmaps=!1}else _?(b&&n.texStorage2D(e.TEXTURE_2D,S,m,t.width,t.height),x&&De(o,t,r,p)):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,t.data)}else if(o.isCompressedTexture){if(o.isCompressedArrayTexture){_&&b&&n.texStorage3D(e.TEXTURE_2D_ARRAY,S,m,g[0].width,g[0].height,t.depth);for(let i=0,a=g.length;i<a;i++)if(h=g[i],o.format!==1023){if(r!==null){if(_){if(x){if(o.layerUpdates.size>0){let t=co(h.width,h.height,o.format,o.type);for(let a of o.layerUpdates){let o=h.data.subarray(a*t/h.data.BYTES_PER_ELEMENT,(a+1)*t/h.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,a,h.width,h.height,1,r,o)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,h.data)}}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,h.data,0,0)}else R(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`)}else _?x&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,p,h.data):n.texImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,r,p,h.data);o.layerUpdates.size>0&&o.clearLayerUpdates()}else{_&&b&&n.texStorage2D(e.TEXTURE_2D,S,m,g[0].width,g[0].height);for(let t=0,i=g.length;t<i;t++)h=g[t],o.format===1023?_?x&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data):r===null?R(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`):_?x&&n.compressedTexSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,h.data):n.compressedTexImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,h.data)}}else if(o.isDataArrayTexture){if(_){if(b&&n.texStorage3D(e.TEXTURE_2D_ARRAY,S,m,t.width,t.height,t.depth),x){if(o.layerUpdates.size>0){let i=co(t.width,t.height,o.format,o.type);for(let a of o.layerUpdates){let o=t.data.subarray(a*i/t.data.BYTES_PER_ELEMENT,(a+1)*i/t.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,a,t.width,t.height,1,r,p,o)}o.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)}}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,m,t.width,t.height,t.depth,0,r,p,t.data)}else if(o.isData3DTexture)_?(b&&n.texStorage3D(e.TEXTURE_3D,S,m,t.width,t.height,t.depth),x&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)):n.texImage3D(e.TEXTURE_3D,0,m,t.width,t.height,t.depth,0,r,p,t.data);else if(o.isFramebufferTexture){if(b){if(_)n.texStorage2D(e.TEXTURE_2D,S,m,t.width,t.height);else{let i=t.width,a=t.height;for(let t=0;t<S;t++)n.texImage2D(e.TEXTURE_2D,t,m,i,a,0,r,p,null),i>>=1,a>>=1}}}else if(o.isHTMLTexture){if(`texElementImage2D`in e){let n=e.canvas;if(n.hasAttribute(`layoutsubtree`)||n.setAttribute(`layoutsubtree`,`true`),t.parentNode!==n){n.appendChild(t),d.add(o),n.onpaint=e=>{let t=e.changedElements;for(let e of d)t.includes(e.image)&&(e.needsUpdate=!0)},n.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,t);else{let n=e.RGBA,r=e.RGBA,i=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,n,r,i,t)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(g.length>0){if(_&&b){let t=L(g[0]);n.texStorage2D(e.TEXTURE_2D,S,m,t.width,t.height)}for(let t=0,i=g.length;t<i;t++)h=g[t],_?x&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,r,p,h):n.texImage2D(e.TEXTURE_2D,t,m,r,p,h);o.generateMipmaps=!1}else if(_){if(b){let r=L(t);n.texStorage2D(e.TEXTURE_2D,S,m,r.width,r.height)}x&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,r,p,t)}else n.texImage2D(e.TEXTURE_2D,0,m,r,p,t);y(o)&&o.mipmapsAutoUpdate===!0&&k(c),f.__version=u.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function ke(t,o,s){if(o.image.length!==6)return;let c=Te(t,o),l=o.source;n.bindTexture(e.TEXTURE_CUBE_MAP,t.__webglTexture,e.TEXTURE0+s);let u=r.get(l);if(l.version!==u.__version||c===!0){n.activeTexture(e.TEXTURE0+s);let t=Vt.getPrimaries(Vt.workingColorSpace),r=o.colorSpace===``?null:Vt.getPrimaries(o.colorSpace),d=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,d);let f=o.isCompressedTexture||o.image[0].isCompressedTexture,p=o.image[0]&&o.image[0].isDataTexture,m=[];for(let e=0;e<6;e++)!f&&!p?m[e]=v(o.image[e],!0,i.maxCubemapSize):m[e]=p?o.image[e].image:o.image[e],m[e]=I(o,m[e]);let h=m[0],g=a.convert(o.format,o.colorSpace),_=a.convert(o.type),b=j(o.internalFormat,g,_,o.normalized,o.colorSpace),x=o.isVideoTexture!==!0,S=u.__version===void 0||c===!0,C=l.dataReady,w=ee(o,h);we(e.TEXTURE_CUBE_MAP,o);let T;if(o.isDepthTexture){if(b=M(o.format===fe,o.type),S){if(x)n.texStorage2D(e.TEXTURE_CUBE_MAP,1,b,h.width,h.height);else for(let t=0;t<6;t++)n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,b,h.width,h.height,0,g,_,null)}}else if(f){x&&S&&n.texStorage2D(e.TEXTURE_CUBE_MAP,w,b,h.width,h.height);for(let t=0;t<6;t++){T=m[t].mipmaps;for(let r=0;r<T.length;r++){let i=T[r];o.format===1023?x?C&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,g,_,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,b,i.width,i.height,0,g,_,i.data):g===null?R(`WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`):x?C&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,g,i.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,b,i.width,i.height,0,i.data)}}}else{if(T=o.mipmaps,x&&S){T.length>0&&w++;let t=L(m[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,w,b,t.width,t.height)}for(let t=0;t<6;t++)if(p){x?C&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,m[t].width,m[t].height,g,_,m[t].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,b,m[t].width,m[t].height,0,g,_,m[t].data);for(let r=0;r<T.length;r++){let i=T[r].image[t].image;x?C&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,i.width,i.height,g,_,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,b,i.width,i.height,0,g,_,i.data)}}else{x?C&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,g,_,m[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,b,g,_,m[t]);for(let r=0;r<T.length;r++){let i=T[r];x?C&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,g,_,i.image[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,b,g,_,i.image[t])}}}y(o)&&o.mipmapsAutoUpdate===!0&&k(e.TEXTURE_CUBE_MAP),u.__version=l.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function Ae(t,i,o,c,l,u){let d=a.convert(o.format,o.colorSpace),f=a.convert(o.type),p=j(o.internalFormat,d,f,o.normalized,o.colorSpace),m=r.get(i),h=r.get(o);if(h.__renderTarget=i,!m.__hasExternalTextures){let t=Math.max(1,i.width>>u),r=Math.max(1,i.height>>u);l===e.TEXTURE_3D||l===e.TEXTURE_2D_ARRAY?n.texImage3D(l,u,p,t,r,i.depth,0,d,f,null):n.texImage2D(l,u,p,t,r,0,d,f,null)}n.bindFramebuffer(e.FRAMEBUFFER,t),F(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,c,l,h.__webglTexture,0,Re(i)):(l===e.TEXTURE_2D||l>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&l<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,c,l,h.__webglTexture,u),n.bindFramebuffer(e.FRAMEBUFFER,null)}function je(t,n,r){if(e.bindRenderbuffer(e.RENDERBUFFER,t),n.depthBuffer){let i=n.depthTexture,a=i&&i.isDepthTexture?i.type:null,o=M(n.stencilBuffer,a),c=n.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;F(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Re(n),o,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,Re(n),o,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,o,n.width,n.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,c,e.RENDERBUFFER,t)}else{let t=n.textures;for(let i=0;i<t.length;i++){let o=t[i],c=a.convert(o.format,o.colorSpace),l=a.convert(o.type),u=j(o.internalFormat,c,l,o.normalized,o.colorSpace);F(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Re(n),u,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,Re(n),u,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,u,n.width,n.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function Me(t,i,a){let o=i.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,t),!(i.depthTexture&&i.depthTexture.isDepthTexture))throw Error(`THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.`);let c=r.get(i.depthTexture);c.__renderTarget=i;let l=o?i.depthTexture.image[0]:i.depthTexture.image;c.__webglTexture&&l.width===i.width&&l.height===i.height||(l.width=i.width,l.height=i.height,i.depthTexture.needsUpdate=!0),o?be(i.depthTexture,0):_e(i.depthTexture,0);let u=c.__webglTexture,d=Re(i),f=o?e.TEXTURE_CUBE_MAP_POSITIVE_X+a:e.TEXTURE_2D,p=i.depthTexture.format===1027?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(i.depthTexture.format===1026)F(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else if(i.depthTexture.format===1027)F(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else throw Error(`THREE.WebGLTextures: Unknown depthTexture format.`)}function Ne(t){let i=r.get(t),a=t.isWebGLCubeRenderTarget===!0;if(i.__boundDepthTexture!==t.depthTexture){let e=t.depthTexture;if(i.__depthDisposeCallback&&i.__depthDisposeCallback(),e){let t=()=>{delete i.__boundDepthTexture,delete i.__depthDisposeCallback,e.removeEventListener(`dispose`,t)};e.addEventListener(`dispose`,t),i.__depthDisposeCallback=t}i.__boundDepthTexture=e}if(t.depthTexture&&!i.__autoAllocateDepthBuffer){if(a)for(let e=0;e<6;e++)Me(i.__webglFramebuffer[e],t,e);else t.texture.mipmaps.length>0?Me(i.__webglFramebuffer[0],t,0):Me(i.__webglFramebuffer,t,0)}else if(a){i.__webglDepthbuffer=[];for(let r=0;r<6;r++)if(n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[r]),i.__webglDepthbuffer[r]===void 0)i.__webglDepthbuffer[r]=e.createRenderbuffer(),je(i.__webglDepthbuffer[r],t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,a=i.__webglDepthbuffer[r];e.bindRenderbuffer(e.RENDERBUFFER,a),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,a)}}else if(t.texture.mipmaps.length>0?n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[0]):n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer),i.__webglDepthbuffer===void 0)i.__webglDepthbuffer=e.createRenderbuffer(),je(i.__webglDepthbuffer,t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,r=i.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,r),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,r)}n.bindFramebuffer(e.FRAMEBUFFER,null)}function Pe(t,n,i){let a=r.get(t);n!==void 0&&Ae(a.__webglFramebuffer,t,t.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),i!==void 0&&Ne(t)}function Fe(t){let i=t.texture,s=r.get(t),c=r.get(i);t.addEventListener(`dispose`,ie),te(t);let l=t.textures,u=t.isWebGLCubeRenderTarget===!0,d=l.length>1;if(d||(c.__webglTexture===void 0&&(c.__webglTexture=e.createTexture()),c.__version=i.version,o.memory.textures++),u){s.__webglFramebuffer=[];for(let t=0;t<6;t++)if(i.mipmaps.length>0){s.__webglFramebuffer[t]=[];for(let n=0;n<i.mipmaps.length;n++)s.__webglFramebuffer[t][n]=e.createFramebuffer()}else s.__webglFramebuffer[t]=e.createFramebuffer()}else{if(i.mipmaps.length>0){s.__webglFramebuffer=[];for(let t=0;t<i.mipmaps.length;t++)s.__webglFramebuffer[t]=e.createFramebuffer()}else s.__webglFramebuffer=e.createFramebuffer();if(d)for(let t=0,n=l.length;t<n;t++){let n=r.get(l[t]);n.__webglTexture===void 0&&(n.__webglTexture=e.createTexture(),o.memory.textures++)}if(t.samples>0&&F(t)===!1){s.__webglMultisampledFramebuffer=e.createFramebuffer(),s.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,s.__webglMultisampledFramebuffer);for(let n=0;n<l.length;n++){let r=l[n];s.__webglColorRenderbuffer[n]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,s.__webglColorRenderbuffer[n]);let i=a.convert(r.format,r.colorSpace),o=a.convert(r.type),c=j(r.internalFormat,i,o,r.normalized,r.colorSpace,t.isXRRenderTarget===!0),u=Re(t);e.renderbufferStorageMultisample(e.RENDERBUFFER,u,c,t.width,t.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+n,e.RENDERBUFFER,s.__webglColorRenderbuffer[n])}e.bindRenderbuffer(e.RENDERBUFFER,null),t.depthBuffer&&(s.__webglDepthRenderbuffer=e.createRenderbuffer(),je(s.__webglDepthRenderbuffer,t,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(u){n.bindTexture(e.TEXTURE_CUBE_MAP,c.__webglTexture),we(e.TEXTURE_CUBE_MAP,i);for(let n=0;n<6;n++)if(i.mipmaps.length>0)for(let r=0;r<i.mipmaps.length;r++)Ae(s.__webglFramebuffer[n][r],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,r);else Ae(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0);y(i)?k(e.TEXTURE_CUBE_MAP):i.mipmaps.length>0&&e.texParameteri(e.TEXTURE_CUBE_MAP,e.TEXTURE_MAX_LEVEL,i.mipmaps.length-1),n.unbindTexture()}else if(d){for(let i=0,a=l.length;i<a;i++){let a=l[i],o=r.get(a),c=e.TEXTURE_2D;(t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(c=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(c,o.__webglTexture),we(c,a),Ae(s.__webglFramebuffer,t,a,e.COLOR_ATTACHMENT0+i,c,0),y(a)&&k(c)}n.unbindTexture()}else{let r=e.TEXTURE_2D;if((t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(r=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(r,c.__webglTexture),we(r,i),i.mipmaps.length>0)for(let n=0;n<i.mipmaps.length;n++)Ae(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,r,n);else Ae(s.__webglFramebuffer,t,i,e.COLOR_ATTACHMENT0,r,0);y(i)?k(r):i.mipmaps.length>0&&e.texParameteri(r,e.TEXTURE_MAX_LEVEL,i.mipmaps.length-1),n.unbindTexture()}t.depthBuffer&&Ne(t)}function P(e){let t=e.textures;for(let i=0,a=t.length;i<a;i++){let a=t[i];if(y(a)&&a.mipmapsAutoUpdate===!0){let t=A(e),i=r.get(a).__webglTexture;n.bindTexture(t,i),k(t),n.unbindTexture()}}}let Ie=[];function Le(t){if(t.samples>0){if(F(t)===!1){let i=t.textures,a=t.width,o=t.height,s=e.COLOR_BUFFER_BIT,l=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,u=r.get(t),d=i.length>1;if(d)for(let t=0;t<i.length;t++)n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,u.__webglMultisampledFramebuffer),t.texture.mipmaps.length>0?n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer[0]):n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer);for(let n=0;n<i.length;n++){if(t.resolveDepthBuffer&&(t.depthBuffer&&(s|=e.DEPTH_BUFFER_BIT),t.stencilBuffer&&t.resolveStencilBuffer&&(s|=e.STENCIL_BUFFER_BIT)),d){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,u.__webglColorRenderbuffer[n]);let t=r.get(i[n]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0)}e.blitFramebuffer(0,0,a,o,0,0,a,o,s,e.NEAREST),c===!0&&(Ie.length=0,Ie.push(e.COLOR_ATTACHMENT0+n),t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&Ie.push(l),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,Ie))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),d)for(let t=0;t<i.length;t++){n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,u.__webglColorRenderbuffer[t]);let a=r.get(i[t]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,a,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglMultisampledFramebuffer)}else if(t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&c){let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[n])}}}function Re(e){return Math.min(i.maxSamples,e.samples)}function F(e){let n=r.get(e);return e.samples>0&&t.has(`WEBGL_multisampled_render_to_texture`)===!0&&n.__useRenderToTexture!==!1}function ze(e){let t=o.render.frame;u.get(e)!==t&&(u.set(e,t),e.update())}function I(e,t){let n=e.colorSpace,r=e.format,i=e.type;return e.isCompressedTexture===!0||e.isVideoTexture===!0||n!==`srgb-linear`&&n!==``&&(Vt.getTransfer(n)===`srgb`?(r!==1023||i!==1009)&&R(`WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`):z(`WebGLTextures: Unsupported texture color space:`,n)),t}function L(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement?(l.width=e.naturalWidth||e.width,l.height=e.naturalHeight||e.height):typeof VideoFrame<`u`&&e instanceof VideoFrame?(l.width=e.displayWidth,l.height=e.displayHeight):(l.width=e.width,l.height=e.height),l}this.allocateTextureUnit=he,this.resetTextureUnits=de,this.getTextureUnits=pe,this.setTextureUnits=me,this.setTexture2D=_e,this.setTexture2DArray=ve,this.setTexture3D=ye,this.setTextureCube=be,this.rebindTextures=Pe,this.setupRenderTarget=Fe,this.updateRenderTargetMipmap=P,this.updateMultisampleRenderTarget=Le,this.setupDepthRenderbuffer=Ne,this.setupFrameBufferTexture=Ae,this.useMultisampledRTT=F,this.dispose=se}function cl(e,t){function n(n,r=``){let i,a=Vt.getTransfer(r);if(n===1009)return e.UNSIGNED_BYTE;if(n===1017)return e.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return e.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return e.UNSIGNED_INT_5_9_9_9_REV;if(n===35899)return e.UNSIGNED_INT_10F_11F_11F_REV;if(n===1010)return e.BYTE;if(n===1011)return e.SHORT;if(n===1012)return e.UNSIGNED_SHORT;if(n===1013)return e.INT;if(n===1014)return e.UNSIGNED_INT;if(n===1015)return e.FLOAT;if(n===1016)return e.HALF_FLOAT;if(n===1021)return e.ALPHA;if(n===1022)return e.RGB;if(n===1023)return e.RGBA;if(n===1026)return e.DEPTH_COMPONENT;if(n===1027)return e.DEPTH_STENCIL;if(n===1028)return e.RED;if(n===1029)return e.RED_INTEGER;if(n===1030)return e.RG;if(n===1031)return e.RG_INTEGER;if(n===1033)return e.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779){if(a===`srgb`){if(i=t.get(`WEBGL_compressed_texture_s3tc_srgb`),i!==null){if(n===33776)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null}else if(i=t.get(`WEBGL_compressed_texture_s3tc`),i!==null){if(n===33776)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null}if(n===35840||n===35841||n===35842||n===35843){if(i=t.get(`WEBGL_compressed_texture_pvrtc`),i!==null){if(n===35840)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null}if(n===36196||n===37492||n===37496||n===37488||n===37489||n===37490||n===37491){if(i=t.get(`WEBGL_compressed_texture_etc`),i!==null){if(n===36196||n===37492)return a===`srgb`?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(n===37496)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(n===37488)return i.COMPRESSED_R11_EAC;if(n===37489)return i.COMPRESSED_SIGNED_R11_EAC;if(n===37490)return i.COMPRESSED_RG11_EAC;if(n===37491)return i.COMPRESSED_SIGNED_RG11_EAC}else return null}if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821){if(i=t.get(`WEBGL_compressed_texture_astc`),i!==null){if(n===37808)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null}if(n===36492||n===36494||n===36495){if(i=t.get(`EXT_texture_compression_bptc`),i!==null){if(n===36492)return a===`srgb`?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null}if(n===36283||n===36284||n===36285||n===36286){if(i=t.get(`EXT_texture_compression_rgtc`),i!==null){if(n===36283)return i.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null}return n===1020?e.UNSIGNED_INT_24_8:e[n]===void 0?null:e[n]}return{convert:n}}var ll=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,ul=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,dl=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new Pi(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new ea({vertexShader:ll,fragmentShader:ul,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new ai(new Vi(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},fl=class extends xt{constructor(e,t){super();let n=this,r=null,i=1,a=null,o=`local-floor`,s=1,c=null,l=null,u=null,d=null,f=null,p=null,m=typeof XRWebGLBinding<`u`,h=new dl,g={},_=t.getContextAttributes(),v=null,y=null,b=[],x=[],S=new Nt,C=null,w=null,T=new Ra;T.viewport=new Qt;let E=new Ra;E.viewport=new Qt;let D=[T,E],O=new Ya,A=null,j=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(e){let t=b[e];return t===void 0&&(t=new Pn,b[e]=t),t.getTargetRaySpace()},this.getControllerGrip=function(e){let t=b[e];return t===void 0&&(t=new Pn,b[e]=t),t.getGripSpace()},this.getHand=function(e){let t=b[e];return t===void 0&&(t=new Pn,b[e]=t),t.getHandSpace()};function M(e){let t=x.indexOf(e.inputSource);if(t===-1)return;let n=b[t];n!==void 0&&(n.update(e.inputSource,e.frame,c||a),n.dispatchEvent({type:e.type,data:e.inputSource}))}function ee(){r.removeEventListener(`select`,M),r.removeEventListener(`selectstart`,M),r.removeEventListener(`selectend`,M),r.removeEventListener(`squeeze`,M),r.removeEventListener(`squeezestart`,M),r.removeEventListener(`squeezeend`,M),r.removeEventListener(`end`,ee),r.removeEventListener(`inputsourceschange`,ne);for(let e=0;e<b.length;e++){let t=x[e];t!==null&&(x[e]=null,b[e].disconnect(t))}A=null,j=null,h.reset();for(let e in g)delete g[e];if(e.setRenderTarget(v),f=null,d=null,u=null,r=null,y=null,N.stop(),n.isPresenting=!1,e.setPixelRatio(C),e.setSize(S.width,S.height,!1),w!==null){let e=w.camera;e.fov=w.fov,e.zoom=w.zoom,e.updateProjectionMatrix(),w=null}n.dispatchEvent({type:`sessionend`})}this.setFramebufferScaleFactor=function(e){i=e,n.isPresenting===!0&&R(`WebXRManager: Cannot change framebuffer scale while presenting.`)},this.setReferenceSpaceType=function(e){o=e,n.isPresenting===!0&&R(`WebXRManager: Cannot change reference space type while presenting.`)},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(e){c=e},this.getBaseLayer=function(){return d===null?f:d},this.getBinding=function(){return u===null&&m&&(u=new XRWebGLBinding(r,t)),u},this.getFrame=function(){return p},this.getSession=function(){return r},this.setSession=async function(l){if(r=l,r!==null){if(v=e.getRenderTarget(),r.addEventListener(`select`,M),r.addEventListener(`selectstart`,M),r.addEventListener(`selectend`,M),r.addEventListener(`squeeze`,M),r.addEventListener(`squeezestart`,M),r.addEventListener(`squeezeend`,M),r.addEventListener(`end`,ee),r.addEventListener(`inputsourceschange`,ne),_.xrCompatible!==!0&&await t.makeXRCompatible(),C=e.getPixelRatio(),e.getSize(S),m&&`createProjectionLayer`in XRWebGLBinding.prototype){let n=null,a=null,o=null;_.depth&&(o=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,n=_.stencil?fe:de,a=_.stencil?oe:te);let s={colorFormat:t.RGBA8,depthFormat:o,scaleFactor:i};u=this.getBinding(),d=u.createProjectionLayer(s),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),y=new en(d.textureWidth,d.textureHeight,{format:ue,type:k,depthTexture:new Mi(d.textureWidth,d.textureHeight,a,void 0,void 0,void 0,void 0,void 0,void 0,n),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{let n={antialias:_.antialias,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:i};f=new XRWebGLLayer(r,t,n),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),y=new en(f.framebufferWidth,f.framebufferHeight,{format:ue,type:k,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(s),c=null,a=await r.requestReferenceSpace(o),N.setContext(r),N.start(),n.isPresenting=!0,n.dispatchEvent({type:`sessionstart`})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return h.getDepthTexture()};function ne(e){for(let t=0;t<e.removed.length;t++){let n=e.removed[t],r=x.indexOf(n);r>=0&&(x[r]=null,b[r].disconnect(n))}for(let t=0;t<e.added.length;t++){let n=e.added[t],r=x.indexOf(n);if(r===-1){for(let e=0;e<b.length;e++)if(e>=x.length){x.push(n),r=e;break}else if(x[e]===null){x[e]=n,r=e;break}if(r===-1)break}let i=b[r];i&&i.connect(n)}}function re(e,t){t===null?e.matrixWorld.copy(e.matrix):e.matrixWorld.multiplyMatrices(t.matrixWorld,e.matrix),e.matrixWorldInverse.copy(e.matrixWorld).invert()}this.updateCamera=function(e){if(r===null)return;let t=e.near,n=e.far;h.texture!==null&&(h.depthNear>0&&(t=h.depthNear),h.depthFar>0&&(n=h.depthFar)),O.near=E.near=T.near=t,O.far=E.far=T.far=n,(A!==O.near||j!==O.far)&&(r.updateRenderState({depthNear:O.near,depthFar:O.far}),A=O.near,j=O.far),O.layers.mask=e.layers.mask|6,T.layers.mask=O.layers.mask&-5,E.layers.mask=O.layers.mask&-3;let i=e.parent,a=O.cameras;re(O,i);for(let e=0;e<a.length;e++)re(a[e],i);O.projectionMatrix.copy(T.projectionMatrix),O.projectionMatrixInverse.copy(T.projectionMatrixInverse),w===null&&e.isPerspectiveCamera&&(w={camera:e,fov:e.fov,zoom:e.zoom}),ie(e,O,i)};function ie(e,t,n){n===null?e.matrix.copy(t.matrixWorld):(e.matrix.copy(n.matrixWorld),e.matrix.invert(),e.matrix.multiply(t.matrixWorld)),e.matrix.decompose(e.position,e.quaternion,e.scale),e.updateMatrixWorld(!0),e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse),e.isPerspectiveCamera&&(e.fov=wt*2*Math.atan(1/e.projectionMatrix.elements[5]),e.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(d!==null||f!==null)return s},this.setFoveation=function(e){s=e,d!==null&&(d.fixedFoveation=e),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=e)},this.hasDepthSensing=function(){return h.texture!==null},this.getDepthSensingMesh=function(){return h.getMesh(O)},this.getCameraTexture=function(e){return g[e]};let ae=null;function se(t,i){if(l=i.getViewerPose(c||a),p=i,l!==null){let t=l.views;f!==null&&(e.setRenderTargetFramebuffer(y,f.framebuffer),e.setRenderTarget(y));let i=!1;t.length!==O.cameras.length&&(O.cameras.length=0,i=!0);for(let n=0;n<t.length;n++){let r=t[n],a=null;if(f!==null)a=f.getViewport(r);else{let t=u.getViewSubImage(d,r);a=t.viewport,n===0&&(e.setRenderTargetTextures(y,t.colorTexture,t.depthStencilTexture),e.setRenderTarget(y))}let o=D[n];o===void 0&&(o=new Ra,o.layers.enable(n),o.viewport=new Qt,D[n]=o),o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.projectionMatrix.fromArray(r.projectionMatrix),o.projectionMatrixInverse.copy(o.projectionMatrix).invert(),o.viewport.set(a.x,a.y,a.width,a.height),n===0&&(O.matrix.copy(o.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),i===!0&&O.cameras.push(o)}let a=r.enabledFeatures;if(a&&a.includes(`depth-sensing`)&&r.depthUsage==`gpu-optimized`&&m){u=n.getBinding();let e=u.getDepthInformation(t[0]);e&&e.isValid&&e.texture&&h.init(e,r.renderState)}if(a&&a.includes(`camera-access`)&&m){e.state.unbindTexture(),u=n.getBinding();for(let e=0;e<t.length;e++){let n=t[e].camera;if(n){let e=g[n];e||(e=new Pi,g[n]=e);let t=u.getCameraImage(n);e.sourceTexture=t}}}}for(let e=0;e<b.length;e++){let t=x[e],n=b[e];t!==null&&n!==void 0&&n.update(t,i,c||a)}ae&&ae(t,i),i.detectedPlanes&&n.dispatchEvent({type:`planesdetected`,data:i}),p=null}let N=new uo;N.setAnimationLoop(se),this.setAnimationLoop=function(e){ae=e},this.dispose=function(){}}},pl=new rn,ml=new V;ml.set(-1,0,0,0,1,0,0,0,1);function hl(e,t){function n(e,t){e.matrixAutoUpdate===!0&&e.updateMatrix(),t.value.copy(e.matrix)}function r(t,n){n.color.getRGB(t.fogColor.value,Xi(e)),n.isFog?(t.fogNear.value=n.near,t.fogFar.value=n.far):n.isFogExp2&&(t.fogDensity.value=n.density)}function i(e,t,n,r,i){t.isNodeMaterial?t.uniformsNeedUpdate=!1:t.isMeshBasicMaterial?a(e,t):t.isMeshLambertMaterial?(a(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshToonMaterial?(a(e,t),d(e,t)):t.isMeshPhongMaterial?(a(e,t),u(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshStandardMaterial?(a(e,t),f(e,t),t.isMeshPhysicalMaterial&&p(e,t,i)):t.isMeshMatcapMaterial?(a(e,t),m(e,t)):t.isMeshDepthMaterial?a(e,t):t.isMeshDistanceMaterial?(a(e,t),h(e,t)):t.isMeshNormalMaterial?a(e,t):t.isLineBasicMaterial?(o(e,t),t.isLineDashedMaterial&&s(e,t)):t.isPointsMaterial?c(e,t,n,r):t.isSpriteMaterial?l(e,t):t.isShadowMaterial?(e.color.value.copy(t.color),e.opacity.value=t.opacity):t.isShaderMaterial&&(t.uniformsNeedUpdate=!1)}function a(e,r){e.opacity.value=r.opacity,r.color&&e.diffuse.value.copy(r.color),r.emissive&&e.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(e.map.value=r.map,n(r.map,e.mapTransform)),r.alphaMap&&(e.alphaMap.value=r.alphaMap,n(r.alphaMap,e.alphaMapTransform)),r.bumpMap&&(e.bumpMap.value=r.bumpMap,n(r.bumpMap,e.bumpMapTransform),e.bumpScale.value=r.bumpScale,r.side===1&&(e.bumpScale.value*=-1)),r.normalMap&&(e.normalMap.value=r.normalMap,n(r.normalMap,e.normalMapTransform),e.normalScale.value.copy(r.normalScale),r.side===1&&e.normalScale.value.negate()),r.displacementMap&&(e.displacementMap.value=r.displacementMap,n(r.displacementMap,e.displacementMapTransform),e.displacementScale.value=r.displacementScale,e.displacementBias.value=r.displacementBias),r.emissiveMap&&(e.emissiveMap.value=r.emissiveMap,n(r.emissiveMap,e.emissiveMapTransform)),r.specularMap&&(e.specularMap.value=r.specularMap,n(r.specularMap,e.specularMapTransform)),r.alphaTest>0&&(e.alphaTest.value=r.alphaTest);let i=t.get(r),a=i.envMap,o=i.envMapRotation;a&&(e.envMap.value=a,e.envMapRotation.value.setFromMatrix4(pl.makeRotationFromEuler(o)).transpose(),a.isCubeTexture&&a.isRenderTargetTexture===!1&&e.envMapRotation.value.premultiply(ml),e.reflectivity.value=r.reflectivity,e.ior.value=r.ior,e.refractionRatio.value=r.refractionRatio),r.lightMap&&(e.lightMap.value=r.lightMap,e.lightMapIntensity.value=r.lightMapIntensity,n(r.lightMap,e.lightMapTransform)),r.aoMap&&(e.aoMap.value=r.aoMap,e.aoMapIntensity.value=r.aoMapIntensity,n(r.aoMap,e.aoMapTransform))}function o(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform))}function s(e,t){e.dashSize.value=t.dashSize,e.totalSize.value=t.dashSize+t.gapSize,e.scale.value=t.scale}function c(e,t,r,i){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.size.value=t.size*r,e.scale.value=i*.5,t.map&&(e.map.value=t.map,n(t.map,e.uvTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function l(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.rotation.value=t.rotation,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function u(e,t){e.specular.value.copy(t.specular),e.shininess.value=Math.max(t.shininess,1e-4)}function d(e,t){t.gradientMap&&(e.gradientMap.value=t.gradientMap)}function f(e,t){e.metalness.value=t.metalness,t.metalnessMap&&(e.metalnessMap.value=t.metalnessMap,n(t.metalnessMap,e.metalnessMapTransform)),e.roughness.value=t.roughness,t.roughnessMap&&(e.roughnessMap.value=t.roughnessMap,n(t.roughnessMap,e.roughnessMapTransform)),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)}function p(e,t,r){e.ior.value=t.ior,t.diffuseRoughness>0&&(e.diffuseRoughness.value=t.diffuseRoughness,t.diffuseRoughnessMap&&(e.diffuseRoughnessMap.value=t.diffuseRoughnessMap,n(t.diffuseRoughnessMap,e.diffuseRoughnessMapTransform))),t.sheen>0&&(e.sheenColor.value.copy(t.sheenColor).multiplyScalar(t.sheen),e.sheenRoughness.value=t.sheenRoughness,t.sheenColorMap&&(e.sheenColorMap.value=t.sheenColorMap,n(t.sheenColorMap,e.sheenColorMapTransform)),t.sheenRoughnessMap&&(e.sheenRoughnessMap.value=t.sheenRoughnessMap,n(t.sheenRoughnessMap,e.sheenRoughnessMapTransform))),t.clearcoat>0&&(e.clearcoat.value=t.clearcoat,e.clearcoatRoughness.value=t.clearcoatRoughness,t.clearcoatMap&&(e.clearcoatMap.value=t.clearcoatMap,n(t.clearcoatMap,e.clearcoatMapTransform)),t.clearcoatRoughnessMap&&(e.clearcoatRoughnessMap.value=t.clearcoatRoughnessMap,n(t.clearcoatRoughnessMap,e.clearcoatRoughnessMapTransform)),t.clearcoatNormalMap&&(e.clearcoatNormalMap.value=t.clearcoatNormalMap,n(t.clearcoatNormalMap,e.clearcoatNormalMapTransform),e.clearcoatNormalScale.value.copy(t.clearcoatNormalScale),t.side===1&&e.clearcoatNormalScale.value.negate())),t.dispersion>0&&(e.dispersion.value=t.dispersion),t.retroreflectivity>0&&(e.retroreflectivity.value=t.retroreflectivity),t.iridescence>0&&(e.iridescence.value=t.iridescence,e.iridescenceIOR.value=t.iridescenceIOR,e.iridescenceThicknessMinimum.value=t.iridescenceThicknessMinimum,e.iridescenceThicknessMaximum.value=t.iridescenceThicknessMaximum,t.iridescenceMap&&(e.iridescenceMap.value=t.iridescenceMap,n(t.iridescenceMap,e.iridescenceMapTransform)),t.iridescenceThicknessMap&&(e.iridescenceThicknessMap.value=t.iridescenceThicknessMap,n(t.iridescenceThicknessMap,e.iridescenceThicknessMapTransform))),t.transmission>0&&(e.transmission.value=t.transmission,e.transmissionSamplerMap.value=r.texture,e.transmissionSamplerSize.value.set(r.width,r.height),t.transmissionMap&&(e.transmissionMap.value=t.transmissionMap,n(t.transmissionMap,e.transmissionMapTransform)),e.thickness.value=t.thickness,t.thicknessMap&&(e.thicknessMap.value=t.thicknessMap,n(t.thicknessMap,e.thicknessMapTransform)),e.attenuationDistance.value=t.attenuationDistance,e.attenuationColor.value.copy(t.attenuationColor)),t.anisotropy>0&&(e.anisotropyVector.value.set(t.anisotropy*Math.cos(t.anisotropyRotation),t.anisotropy*Math.sin(t.anisotropyRotation)),t.anisotropyMap&&(e.anisotropyMap.value=t.anisotropyMap,n(t.anisotropyMap,e.anisotropyMapTransform))),e.specularIntensity.value=t.specularIntensity,e.specularColor.value.copy(t.specularColor),t.specularColorMap&&(e.specularColorMap.value=t.specularColorMap,n(t.specularColorMap,e.specularColorMapTransform)),t.specularIntensityMap&&(e.specularIntensityMap.value=t.specularIntensityMap,n(t.specularIntensityMap,e.specularIntensityMapTransform))}function m(e,t){t.matcap&&(e.matcap.value=t.matcap)}function h(e,n){let r=t.get(n).light;e.referencePosition.value.setFromMatrixPosition(r.matrixWorld),e.nearDistance.value=r.shadow.camera.near,e.farDistance.value=r.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:i}}function gl(e,t,n,r){let i={},a={};function o(e,t){let n=t.program;r.uniformBlockBinding(e,n,i[e.id])}function s(e,n){let o=i[e.id];o===void 0&&(m(e),o=c(e),i[e.id]=o,e.addEventListener(`dispose`,g));let s=n.program;r.updateUBOMapping(e,s);let u=t.render.frame;a[e.id]!==u&&(l(e),a[e.id]=u)}function c(t){let n=e.createBuffer(),r=t.__size,i=t.usage;return e.bindBuffer(e.UNIFORM_BUFFER,n),e.bufferData(e.UNIFORM_BUFFER,r,i),e.bindBuffer(e.UNIFORM_BUFFER,null),n}function l(t){let n=i[t.id],r=t.uniforms,a=t.__cache;e.bindBuffer(e.UNIFORM_BUFFER,n);for(let e=0,t=r.length;e<t;e++){let t=r[e];if(Array.isArray(t))for(let n=0,r=t.length;n<r;n++)u(t[n],e,n,a);else u(t,e,0,a)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function u(t,n,r,i){if(f(t,n,r,i)===!0){let n=t.__offset,r=t.value;if(Array.isArray(r)){let e=0;for(let n=0;n<r.length;n++){let i=r[n],a=h(i,!0);d(i,t.__data,e),e+=a.storage/Float32Array.BYTES_PER_ELEMENT}}else d(r,t.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,n,t.__data)}}function d(e,t,n){typeof e==`number`||typeof e==`boolean`?t[n]=e:e.isMatrix3?(t[n]=e.elements[0],t[n+1]=e.elements[1],t[n+2]=e.elements[2],t[n+3]=0,t[n+4]=e.elements[3],t[n+5]=e.elements[4],t[n+6]=e.elements[5],t[n+7]=0,t[n+8]=e.elements[6],t[n+9]=e.elements[7],t[n+10]=e.elements[8],t[n+11]=0):ArrayBuffer.isView(e)?t.set(e.subarray(0,t.length-n),n):e.toArray(t,n)}function f(e,t,n,r){let i=e.value,a=t+`_`+n;if(Array.isArray(i)){r[a]===void 0&&(r[a]=[]);let e=r[a],t=!1;for(let n=0;n<i.length;n++)p(i[n],e,n)===!0&&(t=!0);return t}return p(i,r,a)}function p(e,t,n){if(t[n]===void 0)return t[n]=typeof e==`number`||typeof e==`boolean`?e:ArrayBuffer.isView(e)?e.slice():e.clone(),!0;{let r=t[n];if(typeof e==`number`||typeof e==`boolean`){if(r!==e)return t[n]=e,!0}else if(ArrayBuffer.isView(e))return!0;else if(r.equals(e)===!1)return r.copy(e),!0}return!1}function m(e){let t=e.uniforms,n=0;for(let e=0,r=t.length;e<r;e++){let r=Array.isArray(t[e])?t[e]:[t[e]];for(let i=0,a=r.length;i<a;i++){let a=r[i],o=Array.isArray(a.value)?a.value:[a.value],s=Array.isArray(t[e])||Array.isArray(a.value),c=n;for(let e=0,t=o.length;e<t;e++){let t=o[e],r=h(t,s),i=n%16,a=i%r.boundary,l=i+a;n+=a,l!==0&&16-l<r.storage&&(n+=16-l),e===0&&(c=n),n+=r.storage}a.__data=new(a.type===`int`?Int32Array:a.type===`uint`?Uint32Array:Float32Array)((n-c)/Float32Array.BYTES_PER_ELEMENT),a.__offset=c}}let r=n%16;return r>0&&(n+=16-r),e.__size=n,e.__cache={},this}function h(e,t){let n={boundary:0,storage:0};return typeof e==`number`||typeof e==`boolean`?(n.boundary=4,n.storage=4):e.isVector2?(n.boundary=8,n.storage=8):e.isVector3||e.isColor?(n.boundary=16,n.storage=12):e.isVector4?(n.boundary=16,n.storage=16):e.isMatrix3?(n.boundary=16,n.storage=48):e.isMatrix4?(n.boundary=16,n.storage=64):e.isTexture?R(`WebGLRenderer: Texture samplers can not be part of an uniforms group.`):ArrayBuffer.isView(e)?(n.boundary=16,n.storage=e.byteLength):R(`WebGLRenderer: Unsupported uniform value type.`,e),t===!0&&(n.boundary=16,n.storage=Math.ceil(n.storage/16)*16),n}function g(t){let n=t.target;n.removeEventListener(`dispose`,g),e.deleteBuffer(i[n.id]),delete i[n.id],delete a[n.id]}function _(){for(let t in i)e.deleteBuffer(i[t]);i={},a={}}return{bind:o,update:s,dispose:_}}var _l=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),vl=null;function yl(){return vl===null&&(vl=new ci(_l,16,16,he,re),vl.name=`DFG_LUT`,vl.minFilter=E,vl.magFilter=E,vl.wrapS=x,vl.wrapT=x,vl.generateMipmaps=!1,vl.needsUpdate=!0),vl}var bl=class{constructor(e={}){let{canvas:t=mt(),context:n=null,depth:r=!0,stencil:i=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:s=!0,preserveDrawingBuffer:c=!1,powerPreference:l=`default`,failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:f=k}=e;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<`u`&&n instanceof WebGLRenderingContext)throw Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);p=n.getContextAttributes().alpha}else p=a;let m=f,h=new Set([_e,ge,me]),g=new Set([k,te,M,oe,ie,ae]),_=new Uint32Array(4),v=new Int32Array(4),y={textures:[],min:[],max:[],resolution:[]},b=null,x=null,S=[],C=[],w=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let T=this,E=!1,D=null,A=null,j=null,ee=null;this._outputColorSpace=it;let ne=0,se=0,N=null,ce=-1,le=null,ue=new Qt,de=new Qt,fe=null,pe=new H(0),he=0,ve=t.width,ye=t.height,be=1,xe=null,Se=null,Ce=new Qt(0,0,ve,ye),we=new Qt(0,0,ve,ye),Te=!1,Ee=new xi,De=new Ci,Oe=!1,ke=!1,Ae=new rn,je=new B,Me=new Qt,Ne={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Pe=!1;function Fe(){return N===null?be:1}let P=n;function Ie(e,n){return t.getContext(e,n)}let Le,Re,F,ze,I,L,Be,Ve,He,Ue,We,Ge,Ke,qe,Je,Ye,Xe,Ze,Qe,$e,et,tt,nt;try{let e={alpha:!0,depth:r,stencil:i,antialias:o,premultipliedAlpha:s,preserveDrawingBuffer:c,powerPreference:l,failIfMajorPerformanceCaveat:u};if(`setAttribute`in t&&t.setAttribute(`data-engine`,`three.js r187`),t.addEventListener(`webglcontextlost`,ot,!1),t.addEventListener(`webglcontextrestored`,st,!1),t.addEventListener(`webglcontextcreationerror`,ct,!1),P===null){let t=`webgl2`;if(P=Ie(t,e),P===null)throw Ie(t)?Error(`THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.`):Error(`THREE.WebGLRenderer: Error creating WebGL context.`)}rt()}catch(e){throw t.removeEventListener(`webglcontextlost`,ot,!1),t.removeEventListener(`webglcontextrestored`,st,!1),t.removeEventListener(`webglcontextcreationerror`,ct,!1),z(`WebGLRenderer: `+e.message),e}function rt(){Le=new Bo(P),Le.init(),et=new cl(P,Le),Re=new bo(P,Le,e,et),F=new ol(P,Le),Re.reversedDepthBuffer&&d&&F.buffers.depth.setReversed(!0),A=P.createFramebuffer(),j=P.createFramebuffer(),ee=P.createFramebuffer(),ze=new Uo(P),I=new Bc,L=new sl(P,Le,F,I,Re,et,ze),Be=new zo(T),Ve=new fo(P),tt=new vo(P,Ve),He=new Vo(P,Ve,ze,tt),Ue=new Go(P,He,Ve,tt,ze),Ze=new Wo(P,Re,L),Je=new xo(I),We=new zc(T,Be,Le,Re,tt,Je),Ge=new hl(T,I),Ke=new Wc,qe=new Zc(Le),Xe=new _o(T,Be,F,Ue,p,s),Ye=new al(T,Ue,Re),nt=new gl(P,ze,Re,F),Qe=new yo(P,Le,ze),$e=new Ho(P,Le,ze),ze.programs=We.programs,T.capabilities=Re,T.extensions=Le,T.properties=I,T.renderLists=Ke,T.shadowMap=Ye,T.state=F,T.info=ze}m!==1009&&(w=new qo(m,t.width,t.height,o,r,i));let at=new fl(T,P);this.xr=at,this.getContext=function(){return P},this.getContextAttributes=function(){return P.getContextAttributes()},this.forceContextLoss=function(){let e=Le.get(`WEBGL_lose_context`);e&&e.loseContext()},this.forceContextRestore=function(){let e=Le.get(`WEBGL_lose_context`);e&&e.restoreContext()},this.getPixelRatio=function(){return be},this.setPixelRatio=function(e){e!==void 0&&(be=e,this.setSize(ve,ye,!1))},this.getSize=function(e){return e.set(ve,ye)},this.setSize=function(e,n,r=!0){at.isPresenting?R(`WebGLRenderer: Can't change size while VR device is presenting.`):(ve=e,ye=n,t.width=Math.floor(e*be),t.height=Math.floor(n*be),r===!0&&(t.style.width=e+`px`,t.style.height=n+`px`),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,e,n))},this.getDrawingBufferSize=function(e){return e.set(ve*be,ye*be).floor()},this.setDrawingBufferSize=function(e,n,r){ve=e,ye=n,be=r,t.width=Math.floor(e*r),t.height=Math.floor(n*r),this.setViewport(0,0,e,n)},this.setEffects=function(e){if(m===1009)z(`WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.`);else{if(e){for(let t=0;t<e.length;t++)if(e[t].isOutputPass===!0){R(`WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.`);break}}w.setEffects(e||[])}},this.getCurrentViewport=function(e){return e.copy(ue)},this.getViewport=function(e){return e.copy(Ce)},this.setViewport=function(e,t,n,r){e.isVector4?Ce.set(e.x,e.y,e.z,e.w):Ce.set(e,t,n,r),F.viewport(ue.copy(Ce).multiplyScalar(Fe()).round())},this.getScissor=function(e){return e.copy(we)},this.setScissor=function(e,t,n,r){e.isVector4?we.set(e.x,e.y,e.z,e.w):we.set(e,t,n,r),F.scissor(de.copy(we).multiplyScalar(Fe()).round())},this.getScissorTest=function(){return Te},this.setScissorTest=function(e){F.setScissorTest(Te=e)},this.setOpaqueSort=function(e){xe=e},this.setTransparentSort=function(e){Se=e},this.getClearColor=function(e){return e.copy(Xe.getClearColor())},this.setClearColor=function(){Xe.setClearColor(...arguments)},this.getClearAlpha=function(){return Xe.getClearAlpha()},this.setClearAlpha=function(){Xe.setClearAlpha(...arguments)},this.clear=function(e=!0,t=!0,n=!0){let r=0;if(e){let e=!1;if(N!==null){let t=N.texture.format;e=h.has(t)}if(e){let e=N.texture.type,t=g.has(e),n=Xe.getClearColor(),r=Xe.getClearAlpha(),i=n.r,a=n.g,o=n.b;t?(_[0]=i,_[1]=a,_[2]=o,_[3]=r,P.clearBufferuiv(P.COLOR,0,_)):(v[0]=i,v[1]=a,v[2]=o,v[3]=r,P.clearBufferiv(P.COLOR,0,v))}else r|=P.COLOR_BUFFER_BIT}t&&(r|=P.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),n&&(r|=P.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),r!==0&&P.clear(r)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(e){e.setRenderer(this),D=e},this.dispose=function(){t.removeEventListener(`webglcontextlost`,ot,!1),t.removeEventListener(`webglcontextrestored`,st,!1),t.removeEventListener(`webglcontextcreationerror`,ct,!1),Xe.dispose(),Ke.dispose(),qe.dispose(),L.dispose(),I.dispose(),Be.dispose(),Ue.dispose(),He.dispose(),tt.dispose(),nt.dispose(),We.dispose(),at.dispose(),at.removeEventListener(`sessionstart`,vt),at.removeEventListener(`sessionend`,bt),xt.stop()};function ot(e){e.preventDefault(),gt(`WebGLRenderer: Context Lost.`),E=!0}function st(){gt(`WebGLRenderer: Context Restored.`),E=!1;let e=ze.autoReset,t=Ye.enabled,n=Ye.autoUpdate,r=Ye.needsUpdate,i=Ye.type;rt(),ze.autoReset=e,Ye.enabled=t,Ye.autoUpdate=n,Ye.needsUpdate=r,Ye.type=i}function ct(e){z(`WebGLRenderer: A WebGL context could not be created. Reason: `,e.statusMessage)}function lt(e){let t=e.target;t.removeEventListener(`dispose`,lt),dt(t)}function dt(e){ft(e),I.remove(e)}function ft(e){let t=I.get(e).programs;t!==void 0&&(t.forEach(function(e){We.releaseProgram(e)}),e.isShaderMaterial&&We.releaseShaderCache(e))}this.renderBufferDirect=function(e,t,n,r,i,a){t===null&&(t=Ne);let o=i.isMesh&&i.matrixWorld.determinantAffine()<0,s=Mt(e,t,n,r,i);F.setMaterial(r,o);let c=n.index,l=1;if(r.wireframe===!0){if(c=He.getWireframeAttribute(n),c===void 0)return;l=2}let u=n.drawRange,d=n.attributes.position,f=u.start*l,p=(u.start+u.count)*l;a!==null&&(f=Math.max(f,a.start*l),p=Math.min(p,(a.start+a.count)*l)),c===null?d!=null&&(f=Math.max(f,0),p=Math.min(p,d.count)):(f=Math.max(f,0),p=Math.min(p,c.count));let m=p-f;if(m<0||m===1/0)return;tt.setup(i,r,s,n,c);let h,g=Qe;if(c!==null&&(h=Ve.get(c),g=$e,g.setIndex(h)),i.isMesh)r.wireframe===!0?(F.setLineWidth(r.wireframeLinewidth*Fe()),g.setMode(P.LINES)):g.setMode(P.TRIANGLES);else if(i.isLine){let e=r.linewidth;e===void 0&&(e=1),F.setLineWidth(e*Fe()),i.isLineSegments?g.setMode(P.LINES):i.isLineLoop?g.setMode(P.LINE_LOOP):g.setMode(P.LINE_STRIP)}else i.isPoints?g.setMode(P.POINTS):i.isSprite&&g.setMode(P.TRIANGLES);if(i.isBatchedMesh){if(Le.get(`WEBGL_multi_draw`))g.renderMultiDraw(i._multiDrawStarts,i._multiDrawCounts,i._multiDrawCount);else{let e=i._multiDrawStarts,t=i._multiDrawCounts,n=i._multiDrawCount,a=c?Ve.get(c).bytesPerElement:1,o=I.get(r).currentProgram.getUniforms();for(let r=0;r<n;r++)o.setValue(P,`_gl_DrawID`,r),g.render(e[r]/a,t[r])}}else if(i.isInstancedMesh)g.renderInstances(f,m,i.count);else if(n.isInstancedBufferGeometry){let e=n._maxInstanceCount===void 0?1/0:n._maxInstanceCount,t=Math.min(n.instanceCount,e);g.renderInstances(f,m,t)}else g.render(f,m)};function pt(e,t,n,r){D!==null&&e.isNodeMaterial&&D.setObject(r,e),Oe===!0&&Je.setState(e,n,!1),e.transparent===!0&&e.side===2&&e.forceSinglePass===!1?(e.side=1,e.needsUpdate=!0,Ot(e,t,r),e.side=0,e.needsUpdate=!0,Ot(e,t,r),e.side=2):Ot(e,t,r)}this.compile=function(e,t,n=null){n===null&&(n=e),D!==null&&D.renderStart(e,t,n),x=qe.get(n),x.init(t),C.push(x),n.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),e!==n&&e.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),x.setupLights(),D!==null&&D.updateLights(x.state.lightsArray),ke=this.localClippingEnabled,Oe=Je.init(this.clippingPlanes,ke),Oe===!0&&Je.setGlobalState(this.clippingPlanes,t),D!==null&&Ye.render(x.state.shadowsArray,n,t);let r=new Set;return e.traverse(function(e){if(!(e.isMesh||e.isPoints||e.isLine||e.isSprite))return;let i=e.material;if(i){if(Array.isArray(i))for(let a=0;a<i.length;a++){let o=i[a];pt(o,n,t,e),r.add(o)}else pt(i,n,t,e),r.add(i)}}),x=C.pop(),D!==null&&D.renderEnd(),r},this.compileAsync=function(e,t,n=null){let r=this.compile(e,t,n);return new Promise(t=>{function n(){r.forEach(function(e){let t=I.get(e).currentProgram;(t===void 0||t.isReady())&&r.delete(e)}),r.size===0?t(e):setTimeout(n,10)}Le.get(`KHR_parallel_shader_compile`)===null?setTimeout(n,10):n()})};let ht=null;function _t(e){ht&&ht(e)}function vt(){xt.stop()}function bt(){xt.start()}let xt=new uo;xt.setAnimationLoop(_t),typeof self<`u`&&xt.setContext(self),this.setAnimationLoop=function(e){ht=e,at.setAnimationLoop(e),e===null?xt.stop():xt.start()},at.addEventListener(`sessionstart`,vt),at.addEventListener(`sessionend`,bt),this.render=function(e,t){if(t!==void 0&&t.isCamera!==!0){z(`WebGLRenderer.render: camera is not an instance of THREE.Camera.`);return}if(E===!0)return;D!==null&&D.renderStart(e,t);let n=at.enabled===!0&&at.isPresenting===!0,r=w!==null&&(N===null||n)&&w.begin(T,N);if(e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),at.enabled===!0&&at.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(at.cameraAutoUpdate===!0&&at.updateCamera(t),t=at.getCamera()),e.isScene===!0&&e.onBeforeRender(T,e,t,N),x=qe.get(e,C.length),x.init(t),x.state.textureUnits=L.getTextureUnits(),C.push(x),Ae.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),t.isArrayCamera?De.setFromArrayCamera(t):Ee.setFromProjectionMatrix(Ae,ut,t.reversedDepth),ke=this.localClippingEnabled,Oe=Je.init(this.clippingPlanes,ke),b=Ke.get(e,S.length),b.init(),S.push(b),this.info.render.frame++,at.enabled===!0&&at.isPresenting===!0){let e=T.xr.getDepthSensingMesh();e!==null&&St(e,t,-1/0,T.sortObjects)}St(e,t,0,T.sortObjects),b.finish(),D!==null&&D.updateLights(x.state.lightsArray),T.sortObjects===!0&&b.sort(xe,Se),Pe=at.enabled===!1||at.isPresenting===!1||at.hasDepthSensing()===!1,Pe&&Xe.addToRenderList(b,e),this.info.autoReset===!0&&this.info.reset(),Oe===!0&&Je.beginShadows();let i=x.state.shadowsArray;if(Ye.render(i,e,t),Oe===!0&&Je.endShadows(),(r&&w.hasRenderPass())===!1){let n=b.opaque,r=b.transmissive;if(x.setupLights(),t.isArrayCamera){let i=t.cameras;if(r.length>0)for(let t=0,a=i.length;t<a;t++){let a=i[t];wt(n,r,e,a)}Pe&&Xe.render(e);for(let t=0,n=i.length;t<n;t++){let n=i[t];Ct(b,e,n,n.viewport)}}else r.length>0&&wt(n,r,e,t),Pe&&Xe.render(e),Ct(b,e,t)}N!==null&&se===0&&(L.updateMultisampleRenderTarget(N),L.updateRenderTargetMipmap(N)),r&&w.end(T),e.isScene===!0&&e.onAfterRender(T,e,t),tt.resetDefaultState(),ce=-1,le=null,C.pop(),C.length>0?(x=C[C.length-1],L.setTextureUnits(x.state.textureUnits),Oe===!0&&Je.setGlobalState(T.clippingPlanes,x.state.camera)):x=null,S.pop(),b=S.length>0?S[S.length-1]:null,D!==null&&D.renderEnd()};function St(e,t,n,r){if(e.visible===!1)return;if(e.layers.test(t.layers)){if(e.isGroup)n=e.renderOrder;else if(e.isLOD)e.autoUpdate===!0&&e.update(t);else if(e.isLight)x.pushLight(e),e.castShadow&&x.pushShadow(e);else if(e.isSprite){let i=t.isArrayCamera?De:Ee;if(!e.frustumCulled||e.intersectsFrustum(i)){r&&Me.setFromMatrixPosition(e.matrixWorld).applyMatrix4(Ae);let i=Ue.update(e),a=e.material;a.visible&&b.push(e,i,a,n,Me.z,null,t)}}else if(e.isMesh||e.isLine||e.isPoints){let i=t.isArrayCamera?De:Ee;if(!e.frustumCulled||e.intersectsFrustum(i)){let i=Ue.update(e),a=e.material;if(r&&(e.boundingSphere===void 0?(i.boundingSphere===null&&i.computeBoundingSphere(),Me.copy(i.boundingSphere.center)):(e.boundingSphere===null&&e.computeBoundingSphere(),Me.copy(e.boundingSphere.center)),Me.applyMatrix4(e.matrixWorld).applyMatrix4(Ae)),Array.isArray(a)){let r=i.groups;for(let o=0,s=r.length;o<s;o++){let s=r[o],c=a[s.materialIndex];c&&c.visible&&b.push(e,i,c,n,Me.z,s,t)}}else a.visible&&b.push(e,i,a,n,Me.z,null,t)}}}let i=e.children;for(let e=0,a=i.length;e<a;e++)St(i[e],t,n,r)}function Ct(e,t,n,r){let{opaque:i,transmissive:a,transparent:o}=e;x.setupLightsView(n),Oe===!0&&Je.setGlobalState(T.clippingPlanes,n),r&&F.viewport(ue.copy(r)),i.length>0&&Tt(i,t,n),a.length>0&&Tt(a,t,n),o.length>0&&Tt(o,t,n),F.buffers.depth.setTest(!0),F.buffers.depth.setMask(!0),F.buffers.color.setMask(!0),F.setPolygonOffset(!1)}function wt(e,t,n,r){if((n.isScene===!0?n.overrideMaterial:null)!==null)return;if(x.state.transmissionRenderTarget[r.id]===void 0){let e=Le.has(`EXT_color_buffer_half_float`)||Le.has(`EXT_color_buffer_float`);x.state.transmissionRenderTarget[r.id]=new en(1,1,{generateMipmaps:!0,type:e?re:k,minFilter:O,samples:Math.max(4,Re.samples),stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Vt.workingColorSpace})}let a=x.state.transmissionRenderTarget[r.id],o=r.viewport||ue;a.setSize(o.z*T.transmissionResolutionScale,o.w*T.transmissionResolutionScale);let s=T.getRenderTarget(),c=T.getActiveCubeFace(),l=T.getActiveMipmapLevel();T.setRenderTarget(a),T.getClearColor(pe),he=T.getClearAlpha(),he<1&&T.setClearColor(16777215,.5),T.clear(),Pe&&Xe.render(n);let u=T.toneMapping;T.toneMapping=0;let d=r.viewport;if(r.viewport!==void 0&&(r.viewport=void 0),x.setupLightsView(r),Oe===!0&&Je.setGlobalState(T.clippingPlanes,r),Tt(e,n,r),L.updateMultisampleRenderTarget(a),L.updateRenderTargetMipmap(a),Le.has(`WEBGL_multisampled_render_to_texture`)===!1){let e=!1;for(let i=0,a=t.length;i<a;i++){let{object:a,geometry:o,material:s,group:c}=t[i];if(s.side===2&&a.layers.test(r.layers)){let t=s.side;s.side=1,s.needsUpdate=!0,Et(a,n,r,o,s,c),s.side=t,s.needsUpdate=!0,e=!0}}e===!0&&(L.updateMultisampleRenderTarget(a),L.updateRenderTargetMipmap(a))}T.setRenderTarget(s,c,l),T.setClearColor(pe,he),d!==void 0&&(r.viewport=d),T.toneMapping=u}function Tt(e,t,n){let r=t.isScene===!0?t.overrideMaterial:null;for(let i=0,a=e.length;i<a;i++){let a=e[i],{object:o,geometry:s,group:c}=a,l=a.material;l.allowOverride===!0&&r!==null&&(l=r),o.layers.test(n.layers)&&Et(o,t,n,s,l,c)}}function Et(e,t,n,r,i,a){D!==null&&i.isNodeMaterial&&D.setObject(e,i),e.onBeforeRender(T,t,n,r,i,a),e.modelViewMatrix.multiplyMatrices(n.matrixWorldInverse,e.matrixWorld),e.normalMatrix.getNormalMatrix(e.modelViewMatrix),i.onBeforeRender(T,t,n,r,e,a),i.transparent===!0&&i.side===2&&i.forceSinglePass===!1?(i.side=1,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=0,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=2):T.renderBufferDirect(n,t,r,i,e,a),e.onAfterRender(T,t,n,r,i,a)}function Dt(e){let t=0;for(let n of e)n.texture!==null&&t++;return t}function Ot(e,t,n){t.isScene!==!0&&(t=Ne);let r=I.get(e),i=x.state.lights,a=x.state.shadowsArray,o=i.state.version,s=We.getParameters(e,i.state,a,t,n,x.state.lightProbeGridArray),c=We.getProgramCacheKey(s),l=r.programs;r.environment=e.isMeshStandardMaterial||e.isMeshLambertMaterial||e.isMeshPhongMaterial?t.environment:null,r.fog=t.fog;let u=e.isMeshStandardMaterial||e.isMeshLambertMaterial&&!e.envMap||e.isMeshPhongMaterial&&!e.envMap;r.envMap=Be.get(e.envMap||r.environment,u),r.envMapRotation=r.environment!==null&&e.envMap===null?t.environmentRotation:e.envMapRotation,l===void 0&&(e.addEventListener(`dispose`,lt),l=new Map,r.programs=l,r.programVariants=new Map);let d=l.get(c);if(d!==void 0){if(r.currentProgram===d&&r.lightsStateVersion===o)return jt(e,s),d}else s.uniforms=We.getUniforms(e),D!==null&&e.isNodeMaterial&&D.build(e,n,s),e.onBeforeCompile(s,T),d=We.acquireProgram(s,c),l.set(c,d),r.uniforms=s.uniforms;let f=r.uniforms;return(!e.isShaderMaterial&&!e.isRawShaderMaterial||e.clipping===!0)&&(f.clippingPlanes=Je.uniform),jt(e,s),r.needsLights=Pt(e),r.lightsStateVersion=o,r.needsLights&&(f.ambientLightColor.value=i.state.ambient,f.lightProbe.value=i.state.probe,f.sunLights.value=i.state.sun,f.sunLightShadows.value=i.state.sunShadow,f.directionalLights.value=i.state.directional,f.directionalLightShadows.value=i.state.directionalShadow,f.spotLights.value=i.state.spot,f.spotLightShadows.value=i.state.spotShadow,f.rectAreaLights.value=i.state.rectArea,f.ltc_1.value=i.state.rectAreaLTC1,f.ltc_2.value=i.state.rectAreaLTC2,f.pointLights.value=i.state.point,f.pointLightShadows.value=i.state.pointShadow,f.hemisphereLights.value=i.state.hemi,f.sunShadowMatrix.value=i.state.sunShadowMatrix,f.sunShadowCascade.value=i.state.sunShadowCascade,f.directionalShadowMatrix.value=i.state.directionalShadowMatrix,f.spotLightMatrix.value=i.state.spotLightMatrix,f.spotLightMap.value=i.state.spotLightMap,f.pointShadowMatrix.value=i.state.pointShadowMatrix),r.numLightProbeGrids=Dt(x.state.lightProbeGridArray),r.currentProgram=d,r.uniformsList=null,d}function kt(e,t,n,r,i){let a=I.get(e),o=a.currentProgram.id+`,`+r+`,`+i,s=a.programVariants.get(o);return s===void 0?(s=Ot(e,t,n),a.programVariants.set(o,s)):(a.currentProgram=s,a.uniformsList=null,a.outputColorSpace=r,a.toneMapping=i),s}function At(e){if(e.uniformsList===null){let t=e.currentProgram.getUniforms();e.uniformsList=nc.seqWithValue(t.seq,e.uniforms)}return e.uniformsList}function jt(e,t){let n=I.get(e);n.outputColorSpace=t.outputColorSpace,n.batching=t.batching,n.batchingColor=t.batchingColor,n.instancing=t.instancing,n.instancingColor=t.instancingColor,n.instancingMorph=t.instancingMorph,n.skinning=t.skinning,n.morphTargets=t.morphTargets,n.morphNormals=t.morphNormals,n.morphColors=t.morphColors,n.morphTargetsCount=t.morphTargetsCount,n.numClippingPlanes=t.numClippingPlanes,n.numIntersection=t.numClipIntersection,n.vertexAlphas=t.vertexAlphas,n.vertexTangents=t.vertexTangents,n.toneMapping=t.toneMapping}function Mt(e,t,n,r,i){t.isScene!==!0&&(t=Ne),L.resetTextureUnits();let a=t.fog,o=r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial?t.environment:null,s=N===null?T.outputColorSpace:N.isXRRenderTarget===!0?N.texture.colorSpace:Vt.workingColorSpace,c=r.isMeshStandardMaterial||r.isMeshLambertMaterial&&!r.envMap||r.isMeshPhongMaterial&&!r.envMap,l=Be.get(r.envMap||o,c),u=r.vertexColors===!0&&!!n.attributes.color&&n.attributes.color.itemSize===4,d=!!n.attributes.tangent&&(!!r.normalMap||r.anisotropy>0),f=!!n.morphAttributes.position,p=!!n.morphAttributes.normal,m=!!n.morphAttributes.color,h=0;r.toneMapped&&(N===null||N.isXRRenderTarget===!0)&&(h=T.toneMapping);let g=n.morphAttributes.position||n.morphAttributes.normal||n.morphAttributes.color,_=g===void 0?0:g.length,v=I.get(r),b=x.state.lights;if(Oe===!0&&(ke===!0||e!==le)){let t=e===le&&r.id===ce;Je.setState(r,e,t)}let S=!1,C=!1;r.version===v.__version?v.needsLights&&v.lightsStateVersion!==b.state.version||i.isBatchedMesh&&v.batching===!1||!i.isBatchedMesh&&v.batching===!0||i.isBatchedMesh&&v.batchingColor===!0&&i._colorsTexture===null||i.isBatchedMesh&&v.batchingColor===!1&&i._colorsTexture!==null||i.isInstancedMesh&&v.instancing===!1||!i.isInstancedMesh&&v.instancing===!0||i.isSkinnedMesh&&v.skinning===!1||!i.isSkinnedMesh&&v.skinning===!0||i.isInstancedMesh&&v.instancingColor===!0&&i.instanceColor===null||i.isInstancedMesh&&v.instancingColor===!1&&i.instanceColor!==null||i.isInstancedMesh&&v.instancingMorph===!0&&i.morphTexture===null||i.isInstancedMesh&&v.instancingMorph===!1&&i.morphTexture!==null?S=!0:v.envMap===l?r.fog===!0&&v.fog!==a||v.numClippingPlanes!==void 0&&(v.numClippingPlanes!==Je.numPlanes||v.numIntersection!==Je.numIntersection)?S=!0:v.vertexAlphas===u&&v.vertexTangents===d&&v.morphTargets===f&&v.morphNormals===p&&v.morphColors===m&&v.morphTargetsCount===_&&v.numLightProbeGrids===Dt(x.state.lightProbeGridArray)?(v.outputColorSpace!==s||v.toneMapping!==h)&&(C=!0):S=!0:S=!0:(S=!0,v.__version=r.version);let w=v.currentProgram;(S===!0||C===!0)&&(w=C===!0?kt(r,t,i,s,h):Ot(r,t,i),D&&r.isNodeMaterial&&D.onUpdateProgram(r,w,v));let E=!1,O=!1,k=!1,A=w.getUniforms(),j=v.uniforms;if(F.useProgram(w.program)&&(E=!0,O=!0,k=!0),r.id!==ce&&(ce=r.id,O=!0),E||le!==e){F.buffers.depth.getReversed()&&e.reversedDepth!==!0&&(e._reversedDepth=!0,e.updateProjectionMatrix()),A.setValue(P,`projectionMatrix`,e.projectionMatrix),A.setValue(P,`viewMatrix`,e.matrixWorldInverse);let t=A.map.cameraPosition;t!==void 0&&t.setValue(P,je.setFromMatrixPosition(e.matrixWorld)),Re.logarithmicDepthBuffer&&A.setValue(P,`logDepthBufFC`,2/(Math.log(e.far+1)/Math.LN2)),(r.isMeshPhongMaterial||r.isMeshToonMaterial||r.isMeshLambertMaterial||r.isMeshBasicMaterial||r.isMeshStandardMaterial||r.isShaderMaterial)&&A.setValue(P,`isOrthographic`,e.isOrthographicCamera===!0),le!==e&&(le=e,O=!0,k=!0)}if(v.needsLights&&(b.state.sunShadowMap.length>0&&A.setValue(P,`sunShadowMap`,b.state.sunShadowMap,L),b.state.directionalShadowMap.length>0&&A.setValue(P,`directionalShadowMap`,b.state.directionalShadowMap,L),b.state.spotShadowMap.length>0&&A.setValue(P,`spotShadowMap`,b.state.spotShadowMap,L),b.state.pointShadowMap.length>0&&A.setValue(P,`pointShadowMap`,b.state.pointShadowMap,L)),i.isSkinnedMesh){A.setOptional(P,i,`bindMatrix`),A.setOptional(P,i,`bindMatrixInverse`);let e=i.skeleton;e&&(e.boneTexture===null&&e.computeBoneTexture(),A.setValue(P,`boneTexture`,e.boneTexture,L))}i.isBatchedMesh&&(A.setOptional(P,i,`batchingTexture`),A.setValue(P,`batchingTexture`,i._matricesTexture,L),A.setOptional(P,i,`batchingIdTexture`),A.setValue(P,`batchingIdTexture`,i._indirectTexture,L),A.setOptional(P,i,`batchingColorTexture`),i._colorsTexture!==null&&A.setValue(P,`batchingColorTexture`,i._colorsTexture,L));let M=n.morphAttributes;if((M.position!==void 0||M.normal!==void 0||M.color!==void 0)&&Ze.update(i,n,w),(O||v.receiveShadow!==i.receiveShadow)&&(v.receiveShadow=i.receiveShadow,A.setValue(P,`receiveShadow`,i.receiveShadow)),(r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial)&&r.envMap===null&&t.environment!==null&&(j.envMapIntensity.value=t.environmentIntensity),j.dfgLUT!==void 0&&(j.dfgLUT.value=yl()),O){if(A.setValue(P,`toneMappingExposure`,T.toneMappingExposure),v.needsLights&&Nt(j,k),a&&r.fog===!0&&Ge.refreshFogUniforms(j,a),Ge.refreshMaterialUniforms(j,r,be,ye,x.state.transmissionRenderTarget[e.id]),v.needsLights&&v.numLightProbeGrids>0){let e=y,t=0;for(let n of x.state.lightProbeGridArray)n.texture!==null&&(e.textures[t]=n.texture,e.min[t]=n.boundingBox.min,e.max[t]=n.boundingBox.max,e.resolution[t]=n.resolution,t++);for(let n in e)e[n].length=t;j.probesSH.value=e.textures,j.probesMin.value=e.min,j.probesMax.value=e.max,j.probesResolution.value=e.resolution}nc.upload(P,At(v),j,L)}if(r.isShaderMaterial&&r.uniformsNeedUpdate===!0&&(nc.upload(P,At(v),j,L),r.uniformsNeedUpdate=!1),r.isSpriteMaterial&&A.setValue(P,`center`,i.center),A.setValue(P,`modelViewMatrix`,i.modelViewMatrix),A.setValue(P,`normalMatrix`,i.normalMatrix),A.setValue(P,`modelMatrix`,i.matrixWorld),r.uniformsGroups!==void 0){let e=r.uniformsGroups;for(let t=0,n=e.length;t<n;t++){let n=e[t];nt.update(n,w),nt.bind(n,w)}}return w}function Nt(e,t){e.ambientLightColor.needsUpdate=t,e.lightProbe.needsUpdate=t,e.sunLights.needsUpdate=t,e.sunLightShadows.needsUpdate=t,e.directionalLights.needsUpdate=t,e.directionalLightShadows.needsUpdate=t,e.pointLights.needsUpdate=t,e.pointLightShadows.needsUpdate=t,e.spotLights.needsUpdate=t,e.spotLightShadows.needsUpdate=t,e.rectAreaLights.needsUpdate=t,e.hemisphereLights.needsUpdate=t}function Pt(e){return e.isMeshLambertMaterial||e.isMeshToonMaterial||e.isMeshPhongMaterial||e.isMeshStandardMaterial||e.isShadowMaterial||e.isShaderMaterial&&e.lights===!0}this.getActiveCubeFace=function(){return ne},this.getActiveMipmapLevel=function(){return se},this.getRenderTarget=function(){return N},this.setRenderTargetTextures=function(e,t,n){let r=I.get(e);r.__autoAllocateDepthBuffer=e.resolveDepthBuffer===!1,r.__autoAllocateDepthBuffer===!1&&(r.__useRenderToTexture=!1),I.get(e.texture).__webglTexture=t,I.get(e.depthTexture).__webglTexture=r.__autoAllocateDepthBuffer?void 0:n,r.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(e,t){let n=I.get(e);n.__webglFramebuffer=t,n.__useDefaultFramebuffer=t===void 0},this.setRenderTarget=function(e,t=0,n=0){N=e,ne=t,se=n;let r=null,i=!1,a=!1;if(e){let o=I.get(e);if(o.__useDefaultFramebuffer!==void 0){F.bindFramebuffer(P.FRAMEBUFFER,o.__webglFramebuffer),ue.copy(e.viewport),de.copy(e.scissor),fe=e.scissorTest,F.viewport(ue),F.scissor(de),F.setScissorTest(fe),ce=-1;return}if(o.__webglFramebuffer===void 0)L.setupRenderTarget(e);else if(o.__hasExternalTextures)L.rebindTextures(e,I.get(e.texture).__webglTexture,I.get(e.depthTexture).__webglTexture);else if(e.depthBuffer){let t=e.depthTexture;if(o.__boundDepthTexture!==t){if(t!==null&&I.has(t)&&(e.width!==t.image.width||e.height!==t.image.height))throw Error(`THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.`);L.setupDepthRenderbuffer(e)}}let s=e.texture;(s.isData3DTexture||s.isDataArrayTexture||s.isCompressedArrayTexture)&&(a=!0);let c=I.get(e).__webglFramebuffer;e.isWebGLCubeRenderTarget?(r=Array.isArray(c[t])?c[t][n]:c[t],i=!0):r=e.samples>0&&L.useMultisampledRTT(e)===!1?I.get(e).__webglMultisampledFramebuffer:Array.isArray(c)?c[n]:c,ue.copy(e.viewport),de.copy(e.scissor),fe=e.scissorTest}else ue.copy(Ce).multiplyScalar(be).floor(),de.copy(we).multiplyScalar(be).floor(),fe=Te;if(n!==0&&(r=A),F.bindFramebuffer(P.FRAMEBUFFER,r)&&F.drawBuffers(e,r),F.viewport(ue),F.scissor(de),F.setScissorTest(fe),i){let r=I.get(e.texture);P.framebufferTexture2D(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_CUBE_MAP_POSITIVE_X+t,r.__webglTexture,n)}else if(a){let r=t;for(let t=0;t<e.textures.length;t++){let i=I.get(e.textures[t]);P.framebufferTextureLayer(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0+t,i.__webglTexture,n,r)}}else if(e!==null&&n!==0){let t=I.get(e.texture);P.framebufferTexture2D(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_2D,t.__webglTexture,n)}ce=-1};function Ft(e){let t=I.get(e);return(t.__readFormat!==e.format||t.__readType!==e.type)&&(t.__readFormat=e.format,t.__readType=e.type,t.__formatReadable=Re.textureFormatReadable(e.format),t.__typeReadable=Re.textureTypeReadable(e.type)),t}this.readRenderTargetPixels=function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget)){z(`WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);return}let c=I.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o],Array.isArray(c)&&(c=c[0])),c){F.bindFramebuffer(P.FRAMEBUFFER,c);try{let o=e.textures[s],c=o.format,l=o.type;e.textures.length>1&&P.readBuffer(P.COLOR_ATTACHMENT0+s);let u=Ft(o);if(u.__formatReadable===!1){z(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);return}if(u.__typeReadable===!1){z(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);return}t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i&&P.readPixels(t,n,r,i,et.convert(c),et.convert(l),a)}finally{let e=N===null?null:I.get(N).__webglFramebuffer;F.bindFramebuffer(P.FRAMEBUFFER,e)}}},this.readRenderTargetPixelsAsync=async function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget))throw Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);let c=I.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o],Array.isArray(c)&&(c=c[0])),c){if(t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i){F.bindFramebuffer(P.FRAMEBUFFER,c);let o=e.textures[s],l=o.format,u=o.type;e.textures.length>1&&P.readBuffer(P.COLOR_ATTACHMENT0+s);let d=Ft(o);if(d.__formatReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);if(d.__typeReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);let f=P.createBuffer();P.bindBuffer(P.PIXEL_PACK_BUFFER,f),P.bufferData(P.PIXEL_PACK_BUFFER,a.byteLength,P.STREAM_READ),P.readPixels(t,n,r,i,et.convert(l),et.convert(u),0),P.bindBuffer(P.PIXEL_PACK_BUFFER,null);let p=N===null?null:I.get(N).__webglFramebuffer;F.bindFramebuffer(P.FRAMEBUFFER,p);let m=P.fenceSync(P.SYNC_GPU_COMMANDS_COMPLETE,0);return P.flush(),await yt(P,m,4),P.bindBuffer(P.PIXEL_PACK_BUFFER,f),P.getBufferSubData(P.PIXEL_PACK_BUFFER,0,a),P.bindBuffer(P.PIXEL_PACK_BUFFER,null),P.deleteBuffer(f),P.deleteSync(m),a}throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`)}},this.copyFramebufferToTexture=function(e,t=null,n=0){let r=2**-n,i=Math.floor(e.image.width*r),a=Math.floor(e.image.height*r),o=t===null?0:t.x,s=t===null?0:t.y;L.setTexture2D(e,0),P.copyTexSubImage2D(P.TEXTURE_2D,n,0,0,o,s,i,a),F.unbindTexture()},this.copyTextureToTexture=function(e,t,n=null,r=null,i=0,a=0){let o,s,c,l,u,d,f,p,m,h=e.isCompressedTexture?e.mipmaps[a]:e.image;if(n!==null)o=n.max.x-n.min.x,s=n.max.y-n.min.y,c=n.isBox3?n.max.z-n.min.z:1,l=n.min.x,u=n.min.y,d=n.isBox3?n.min.z:0;else{let t=2**-i;o=Math.floor(h.width*t),s=Math.floor(h.height*t),c=e.isDataArrayTexture?h.depth:e.isData3DTexture?Math.floor(h.depth*t):1,l=0,u=0,d=0}r===null?(f=0,p=0,m=0):(f=r.x,p=r.y,m=r.z);let g=et.convert(t.format),_=et.convert(t.type),v;t.isData3DTexture?(L.setTexture3D(t,0),v=P.TEXTURE_3D):t.isDataArrayTexture||t.isCompressedArrayTexture?(L.setTexture2DArray(t,0),v=P.TEXTURE_2D_ARRAY):(L.setTexture2D(t,0),v=P.TEXTURE_2D),F.activeTexture(P.TEXTURE0),F.pixelStorei(P.UNPACK_FLIP_Y_WEBGL,t.flipY),F.pixelStorei(P.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),F.pixelStorei(P.UNPACK_ALIGNMENT,t.unpackAlignment);let y=F.getParameter(P.UNPACK_ROW_LENGTH),b=F.getParameter(P.UNPACK_IMAGE_HEIGHT),x=F.getParameter(P.UNPACK_SKIP_PIXELS),S=F.getParameter(P.UNPACK_SKIP_ROWS),C=F.getParameter(P.UNPACK_SKIP_IMAGES);F.pixelStorei(P.UNPACK_ROW_LENGTH,h.width),F.pixelStorei(P.UNPACK_IMAGE_HEIGHT,h.height),F.pixelStorei(P.UNPACK_SKIP_PIXELS,l),F.pixelStorei(P.UNPACK_SKIP_ROWS,u),F.pixelStorei(P.UNPACK_SKIP_IMAGES,d);let w=e.isDataArrayTexture||e.isData3DTexture,T=t.isDataArrayTexture||t.isData3DTexture;if(e.isDepthTexture){let n=I.get(e),r=I.get(t),h=I.get(n.__renderTarget),g=I.get(r.__renderTarget);F.bindFramebuffer(P.READ_FRAMEBUFFER,h.__webglFramebuffer),F.bindFramebuffer(P.DRAW_FRAMEBUFFER,g.__webglFramebuffer);for(let n=0;n<c;n++)w&&(P.framebufferTextureLayer(P.READ_FRAMEBUFFER,P.COLOR_ATTACHMENT0,I.get(e).__webglTexture,i,d+n),P.framebufferTextureLayer(P.DRAW_FRAMEBUFFER,P.COLOR_ATTACHMENT0,I.get(t).__webglTexture,a,m+n)),P.blitFramebuffer(l,u,l+o,u+s,f,p,f+o,p+s,P.DEPTH_BUFFER_BIT,P.NEAREST);F.bindFramebuffer(P.READ_FRAMEBUFFER,null),F.bindFramebuffer(P.DRAW_FRAMEBUFFER,null)}else if(i!==0||e.isRenderTargetTexture||I.has(e)){let n=I.get(e),r=I.get(t);F.bindFramebuffer(P.READ_FRAMEBUFFER,j),F.bindFramebuffer(P.DRAW_FRAMEBUFFER,ee);for(let e=0;e<c;e++)w?P.framebufferTextureLayer(P.READ_FRAMEBUFFER,P.COLOR_ATTACHMENT0,n.__webglTexture,i,d+e):P.framebufferTexture2D(P.READ_FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_2D,n.__webglTexture,i),T?P.framebufferTextureLayer(P.DRAW_FRAMEBUFFER,P.COLOR_ATTACHMENT0,r.__webglTexture,a,m+e):P.framebufferTexture2D(P.DRAW_FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_2D,r.__webglTexture,a),i===0?T?P.copyTexSubImage3D(v,a,f,p,m+e,l,u,o,s):P.copyTexSubImage2D(v,a,f,p,l,u,o,s):P.blitFramebuffer(l,u,l+o,u+s,f,p,f+o,p+s,P.COLOR_BUFFER_BIT,P.NEAREST);F.bindFramebuffer(P.READ_FRAMEBUFFER,null),F.bindFramebuffer(P.DRAW_FRAMEBUFFER,null)}else T?e.isDataTexture||e.isData3DTexture?P.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h.data):t.isCompressedArrayTexture?P.compressedTexSubImage3D(v,a,f,p,m,o,s,c,g,h.data):P.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h):e.isDataTexture?P.texSubImage2D(P.TEXTURE_2D,a,f,p,o,s,g,_,h.data):e.isCompressedTexture?P.compressedTexSubImage2D(P.TEXTURE_2D,a,f,p,h.width,h.height,g,h.data):P.texSubImage2D(P.TEXTURE_2D,a,f,p,o,s,g,_,h);F.pixelStorei(P.UNPACK_ROW_LENGTH,y),F.pixelStorei(P.UNPACK_IMAGE_HEIGHT,b),F.pixelStorei(P.UNPACK_SKIP_PIXELS,x),F.pixelStorei(P.UNPACK_SKIP_ROWS,S),F.pixelStorei(P.UNPACK_SKIP_IMAGES,C),a===0&&t.generateMipmaps===!0&&t.mipmapsAutoUpdate===!0&&P.generateMipmap(v),F.unbindTexture()},this.initRenderTarget=function(e){I.get(e).__webglFramebuffer===void 0&&L.setupRenderTarget(e)},this.initTexture=function(e){e.isCubeTexture?L.setTextureCube(e,0):e.isData3DTexture?L.setTexture3D(e,0):e.isDataArrayTexture||e.isCompressedArrayTexture?L.setTexture2DArray(e,0):L.setTexture2D(e,0),F.unbindTexture()},this.resetState=function(){ne=0,se=0,N=null,F.reset(),tt.reset()},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}get coordinateSystem(){return ut}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=Vt._getDrawingBufferColorSpace(e),t.unpackColorSpace=Vt._getUnpackColorSpace()}},xl=class{state;constructor(e){this.state=e>>>0}next(){let e=this.state=this.state+1831565813>>>0;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}range(e,t){return e+(t-e)*this.next()}int(e){return Math.floor(this.next()*e)}pick(e){return e[this.int(e.length)]}sign(){return this.next()<.5?-1:1}shuffle(e){for(let t=e.length-1;t>0;t--){let n=this.int(t+1);[e[t],e[n]]=[e[n],e[t]]}return e}};function Sl(e,t){let n=(e^2654435769)>>>0;for(let e=0;e<t.length;e++)n=Math.imul(n^t.charCodeAt(e),2246822507)>>>0,n=(n^n>>>13)>>>0;return n>>>0}var Cl=Math.PI*2,wl=(e,t)=>Math.hypot(e.x-t.x,e.z-t.z),Tl=(e,t)=>({x:Math.cos(e)*t,z:Math.sin(e)*t});function El(e,t,n){let r=n.x-t.x,i=n.z-t.z,a=r*r+i*i||1e-9,o=Math.max(0,Math.min(1,((e.x-t.x)*r+(e.z-t.z)*i)/a));return Math.hypot(e.x-(t.x+r*o),e.z-(t.z+i*o))}function Dl(e,t){let n=1/0;for(let r of t)for(let t=0;t+1<r.length;t++)n=Math.min(n,El(e,r[t],r[t+1]));return n}function Ol(e,t,n,r=0){let i=n.x-t.x,a=n.z-t.z,o=i*i+a*a;if(o<1e-6)return!0;for(let n of e){if(!n.sight)continue;let e=((n.x-t.x)*i+(n.z-t.z)*a)/o;if(e<=.02||e>=.98)continue;let s=t.x+i*e-n.x,c=t.z+a*e-n.z,l=n.r+r;if(s*s+c*c<l*l)return!1}return!0}function kl(e,t,n,r){let i=r;for(let r of e){let e=t.x-r.x,a=t.z-r.z,o=e*n.x+a*n.z,s=e*e+a*a-r.r*r.r;if(s>0&&o>0)continue;let c=o*o-s;if(c<0)continue;let l=-o-Math.sqrt(c);l>=0&&l<i&&(i=l)}return i}function Al(e,t,n,r){for(let r=0;r<2;r++)for(let r of e){let e=t.x-r.x,i=t.z-r.z,a=r.r+n,o=e*e+i*i;if(o<a*a){let n=Math.sqrt(o)||1e-4;t.x=r.x+e/n*a,t.z=r.z+i/n*a}}let i=Math.hypot(t.x,t.z);i>r&&(t.x*=r/i,t.z*=r/i)}var jl=class{half=38;size=76;blocked;g;from;closed;constructor(e,t,n){let r=this.size*this.size;this.blocked=new Uint8Array(r),this.g=new Float32Array(r),this.from=new Int32Array(r),this.closed=new Uint8Array(r);for(let r=0;r<this.size;r++)for(let i=0;i<this.size;i++){let a=i-this.half+.5,o=r-this.half+.5,s=+(Math.hypot(a,o)>n-.5);if(!s)for(let n of e){let e=n.r+t,r=a-n.x,i=o-n.z;if(r*r+i*i<e*e){s=1;break}}this.blocked[r*this.size+i]=s}}cell(e){let t=Math.max(0,Math.min(this.size-1,Math.floor(e.x+this.half)));return Math.max(0,Math.min(this.size-1,Math.floor(e.z+this.half)))*this.size+t}center(e){return{x:e%this.size-this.half+.5,z:Math.floor(e/this.size)-this.half+.5}}walkable(e){return!this.blocked[this.cell(e)]}nearestFree(e){let t=this.cell(e);if(!this.blocked[t])return t;let n=t%this.size,r=Math.floor(t/this.size),i=-1,a=1/0;for(let t=1;t<=6&&i<0;t++)for(let o=r-t;o<=r+t;o++)for(let r=n-t;r<=n+t;r++){if(r<0||o<0||r>=this.size||o>=this.size)continue;let t=o*this.size+r;if(this.blocked[t])continue;let n=wl(e,this.center(t));n<a&&(a=n,i=t)}return i}findPath(e,t,n=0){let r=this.nearestFree(e),i=this.nearestFree(t);if(r<0||i<0)return null;if(r===i)return[{x:t.x,z:t.z}];let a=this.size;this.g.fill(1/0),this.closed.fill(0);let o=[r],s=[0];this.g[r]=0,this.from[r]=-1;let c=i%a,l=Math.floor(i/a),u=e=>{let t=Math.abs(e%a-c),n=Math.abs(Math.floor(e/a)-l);return Math.max(t,n)+.4142*Math.min(t,n)},d=0;for(;o.length&&d++<6e3;){let e=0;for(let t=1;t<o.length;t++)s[t]<s[e]&&(e=t);let t=o[e];if(o[e]=o[o.length-1],s[e]=s[s.length-1],o.pop(),s.pop(),t===i)break;if(this.closed[t])continue;this.closed[t]=1;let r=t%a,c=Math.floor(t/a);for(let e=-1;e<=1;e++)for(let l=-1;l<=1;l++){if(!l&&!e)continue;let d=r+l,f=c+e;if(d<0||f<0||d>=a||f>=a)continue;let p=f*a+d;if(this.blocked[p]||this.closed[p]||l&&e&&(this.blocked[c*a+d]||this.blocked[f*a+r])||n>0&&p!==i&&Math.hypot(d-this.half+.5,f-this.half+.5)<n)continue;let m=this.g[t]+(l&&e?1.4142:1);m<this.g[p]&&(this.g[p]=m,this.from[p]=t,o.push(p),s.push(m+u(p)))}}if(this.g[i]===1/0)return null;let f=[];for(let e=i;e!==-1&&e!==r;e=this.from[e])f.push(e);f.reverse();let p=f.map(e=>this.center(e));p[p.length-1]=this.walkable(t)?{x:t.x,z:t.z}:p[p.length-1];let m=[],h=e,g=0;for(;g<p.length;){let e=g;for(let t=p.length-1;t>g;t--)if(this.segmentFree(h,p[t],n)){e=t;break}m.push(p[e]),h=p[e],g=e+1}return m}segmentFree(e,t,n=0){let r=wl(e,t),i=Math.ceil(r/.4);for(let r=1;r<=i;r++){let a=r/i,o=e.x+(t.x-e.x)*a,s=e.z+(t.z-e.z)*a;if(this.blocked[this.cell({x:o,z:s})]||n>0&&r<i&&Math.hypot(o,s)<n)return!1}return!0}pathLength(e,t){let n=this.findPath(e,t);if(!n)return 1/0;let r=0,i=e;for(let e of n)r+=wl(i,e),i=e;return r}},Ml={snags:[{ang:158,r:7.4},{ang:196,r:9.4},{ang:318,r:8.6},{ang:62,r:13.5},{ang:232,r:17.5},{ang:288,r:18.5}],scrap:[{ang:176,r:14.2},{ang:28,r:19.5},{ang:262,r:23},{ang:105,r:21}],bushes:[{ang:132,r:11.5},{ang:338,r:13.5},{ang:216,r:21}],posts:[{ang:12,r:15.2},{ang:300,r:16.4},{ang:118,r:15.6}],whiteSnag:{ang:186,r:11.6},boulder:{ang:268,r:12.2}},Nl=[186,268,12,118],Pl=15.6;function Fl(e){let t=[],n=t=>e?e.range(-.5,.5):Math.sin(t*2.1)*.3;Nl.forEach((e,r)=>{let i=e*Math.PI/180,a=[],o=r<3?27:Pl;for(let e=4;e<=o;e+=3)a.push(Tl(i+n(r*9+e)*.5/Math.max(e,6),e));t.push(a)});let r=[];for(let e=0;e<=48;e++){let t=e/48*Cl;r.push(Tl(t,Pl+Math.sin(t*3+.7)*1.1))}return t.push(r),t}function Il(e,t){let r=new xl(Sl(e,`forest`)),i=(e,n=7,i=1.2)=>Tl((e.ang+(t?r.range(-n,n):0))*Math.PI/180,e.r+(t?r.range(-i,i):0)),a=Fl(t?r:null),o=(e,t,n,a)=>({...i(e,n,a),id:t,rot:r.range(0,Cl)}),s=Ml.snags.map((e,t)=>o(e,t,t===0?3:7,t===0?.4:1.2)),c=Ml.scrap.map((e,t)=>o(e,t)),l=Ml.bushes.map((e,t)=>o(e,t)),u=Ml.posts.map((e,t)=>{let n=o(e,t,5,.8),r=Math.hypot(n.x,n.z),i=Math.max(14.2,Math.min(16.8,r))/r;return{...n,x:n.x*i,z:n.z*i}}),d=i(Ml.whiteSnag,3,.6),f=i(Ml.boulder,3,.6),p={x:2,z:.25},m=[{x:0,z:0,r:.85,sight:!1,kind:`fire`},{...p,r:.6,sight:!1,kind:`bench`},{...d,r:.55,sight:!0,kind:`landmark`}],h=Math.atan2(f.z,f.x)+Math.PI/2,g=[{x:f.x+Math.cos(h)*1.55,z:f.z+Math.sin(h)*1.55,r:1.15,h:2.3,rot:h,seed:11},{x:f.x-Math.cos(h)*1.55,z:f.z-Math.sin(h)*1.55,r:1.15,h:2,rot:h+2.6,seed:12}];for(let e of s)m.push({x:e.x,z:e.z,r:.32,sight:!0,kind:`snag`});for(let e of u)m.push({x:e.x,z:e.z,r:.2,sight:!1,kind:`post`});let _=[{p:{x:0,z:0},r:6.8},...s.map(e=>({p:e,r:2.2})),...c.map(e=>({p:e,r:2})),...l.map(e=>({p:e,r:1.8})),...u.map(e=>({p:e,r:2.6})),{p:d,r:3.2},{p:f,r:3.6}],v=(e,t)=>_.every(n=>wl(e,n.p)>n.r+t)&&Dl(e,a)>1.7+t,y=g.map(e=>({p:e,r:e.r}));for(let e=0;e<400&&g.length<20;e++){let e=Tl(r.range(0,Cl),r.range(7.5,34)),t=r.range(.7,1.5);v(e,t-.4)&&!y.some(n=>wl(e,n.p)<n.r+t+1.6)&&(g.push({...e,r:t,h:t*r.range(.9,1.5),rot:r.range(0,Cl),seed:r.int(1e3)}),y.push({p:e,r:t}))}for(let e of g)m.push({x:e.x,z:e.z,r:e.r*.86,sight:e.r>=1,kind:`rock`});let b=[];for(let e=0;e<5200&&b.length<250;e++){let e=Math.sqrt(r.range(51.84,2500)),t=Tl(r.range(0,Cl),e),i=e<=n.world.radius;if(i&&!v(t,0)||!i&&Dl(t,a.slice(0,3))<1.6)continue;let o=i?3.3:2.6;if(y.some(e=>wl(t,e.p)<e.r+o))continue;let s=r.next(),c={...t,r:.3+s*.22,h:7.5+s*6+r.range(-1,1),variant:r.int(3),rot:r.range(0,Cl)};b.push(c),y.push({p:t,r:c.r}),i&&m.push({x:c.x,z:c.z,r:c.r,sight:!0,kind:`tree`})}let x=new jl(m,n.deer.radius,n.world.radius-.5),S=s[0],C=Math.atan2(-S.z,-S.x),w={x:0,z:0,yaw:0};for(let e of[-.95,.95,-.6,.6]){let t={x:S.x+Math.cos(C+e)*1.45,z:S.z+Math.sin(C+e)*1.45},n=S.x-t.x,r=S.z-t.z,i=n*-t.z-r*-t.x;if(w={...t,yaw:Math.atan2(-n,-r)},i>0&&x.walkable(t))break}let T=[];for(let e of a.slice(0,4))for(let t of e){let e=Math.hypot(t.x,t.z);e>=9&&e<=12&&T.push(t)}let E={seed:e,genVersion:1,template:!t,trees:b,rocks:g,snags:s,scrap:c,bushes:l,posts:u,whiteSnag:d,boulder:f,bench:p,spawn:w,paths:a,trailMarks:T,obstacles:m,nav:x};return Ll(E)?E:null}function Ll(e){let t={x:1.6,z:-1.2},{nav:n}=e;if(!n.walkable(e.spawn))return!1;let r=[...e.snags,...e.scrap,...e.bushes,...e.posts];for(let e of r)if(n.pathLength(t,e)>80)return!1;return!e.posts.some(e=>Math.hypot(e.x,e.z)<14||Math.hypot(e.x,e.z)>17)&&Rl(e)<=60}function Rl(e){let t={x:1.6,z:-1.2},{nav:n}=e,r=1/0;for(let i of e.scrap){let a=n.pathLength(t,e.snags[0])+n.pathLength(e.snags[0],e.snags[1])+n.pathLength(e.snags[1],i)+n.pathLength(i,t);r=Math.min(r,a)}return r}function zl(e){return Il(e,!0)??Il(e,!1)??Il(1,!1)}var Bl=1234567;function Vl(e){Bl=e>>>0||1}function G(){return Bl^=Bl<<13,Bl>>>=0,Bl^=Bl>>>17,Bl^=Bl<<5,Bl>>>=0,Bl/4294967296}var K=(e,t)=>e+(t-e)*G(),Hl=new H,Ul=class{pos=[];col=[];add(e,t,n,r=.08,i=!1){let a=e.index?e.toNonIndexed():e,o=a.getAttribute(`position`),s=new B;Hl.set(n);let c=i?6:3,l=1;for(let e=0;e<o.count;e++)e%c===0&&(l=1+(G()*2-1)*r),s.fromBufferAttribute(o,e).applyMatrix4(t),this.pos.push(s.x,s.y,s.z),this.col.push(Hl.r*l,Hl.g*l,Hl.b*l);return a!==e&&a.dispose(),e.dispose(),this}box(e,t,n,r,i,a=.1){return this.add(new Fi(e,t,n),r,i,a,!0)}tint(e,t){for(let n=e;n<this.pos.length/3;n++)Hl.setRGB(this.col[n*3],this.col[n*3+1],this.col[n*3+2]),t(this.pos[n*3],this.pos[n*3+1],this.pos[n*3+2],Hl),this.col[n*3]=Hl.r,this.col[n*3+1]=Hl.g,this.col[n*3+2]=Hl.b;return this}get count(){return this.pos.length/3}build(){let e=new Fr;return e.setAttribute(`position`,new Cr(this.pos,3)),e.setAttribute(`color`,new Cr(this.col,3)),e.computeVertexNormals(),e.computeBoundingSphere(),e}},Wl=new B,Gl=new Pt,Kl=new B,ql=new mn;function q(e=0,t=0,n=0,r=0,i=0,a=0,o=1,s=o,c=o){return Wl.set(e,t,n),Gl.setFromEuler(ql.set(r,i,a,`YXZ`)),Kl.set(o,s,c),new rn().compose(Wl,Gl,Kl)}function Jl(){return new na({vertexColors:!0,flatShading:!0})}var Yl=`#3a2d2b`,Xl=`#57402f`,Zl=`#6a4a33`,Ql=`#241d1f`,$l=`#d9d2c4`,eu=`#c98a3a`,tu=`#e0a850`,nu=`#7c4f22`,ru=1.5,iu=.2,au=-.11,ou=.24,su=.4,cu=-.74,lu=.63,uu=1.56,du=.8,fu=new B,pu=new B,mu=new B,hu=new rn,gu=new B;function _u(e,t,n,r,i){let a=new Fi(e,t,n),o=a.getAttribute(`position`);for(let a=0;a<o.count;a++){let s=o.getY(a)>0;o.setXYZ(a,o.getX(a)*(s?r/e:1),o.getY(a)+t/2,o.getZ(a)*(s?i/n:1))}return a}function vu(e,t,n,r,i,a,o,s,c=[1,0,0],l=.2){pu.set(n[0]-t[0],n[1]-t[1],n[2]-t[2]);let u=pu.length();pu.divideScalar(u),fu.set(c[0],c[1],c[2]),fu.addScaledVector(pu,-fu.dot(pu)),fu.lengthSq()<1e-6&&fu.set(0,0,1).addScaledVector(pu,-pu.z),fu.normalize(),mu.crossVectors(fu,pu);let d=new rn().makeBasis(fu,pu,mu).setPosition(t[0],t[1],t[2]);e.add(_u(r,u,i,a,o),d,s,l,!0)}var yu=(e,t,n)=>{let r=Math.min(1,Math.max(0,(n-e)/(t-e)));return r*r*(3-2*r)},bu=class{root=new Mn;body=new Mn;torso=new Mn;head=new Mn;bell=new Mn;legs=[];shoulders=[];arms=[];staged=[];rim={value:new H(`#000000`)};material;bellMaterial;constructor(){Vl(404),this.material=new na({vertexColors:!0,flatShading:!0}),this.material.onBeforeCompile=e=>{e.uniforms.uRim=this.rim,e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>
uniform vec3 uRim;`).replace(`#include <opaque_fragment>`,`float rimF = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 2.5);
outgoingLight += uRim * rimF;
#include <opaque_fragment>`)},this.bellMaterial=new na({color:`#ffffff`,emissive:`#5a3410`,vertexColors:!0,flatShading:!0});let e=(e,t,n=this.material,r=[])=>{let i=e.count,a=[];for(let[t,n]of r)n(e),a.push([t,e.count]);let o=e.build();a.length&&this.staged.push({geo:o,base:i,cuts:a});let s=new ai(o,n);return t.add(s),s},t=(e,t,n,r,i,a,o,s=0,c=0,l=0,u=Yl)=>e.box(t,n,r,q(i,a,o,s,c,l),u,.22),n=e=>e%3==0?Ql:e%3==1?Yl:Xl;this.root.add(this.body);let r=new Ul;t(r,.42,.2,.24,0,ru,0,0,0,0,Ql),t(r,.52,.07,.3,0,1.6,0,0,.04,.02,Yl);let i=(e,t,n,i,a,o,s,c,l)=>{for(let u=0;u<e;u++){let d=(u+c)/e*Math.PI*2+K(-.08,.08),f=Math.sin(d),p=Math.cos(d),m=K(a,o)*(1+.22*Math.abs(p)),h=s*K(.7,1.2),g=K(-.05,.05);vu(r,[f*n,t,p*i],[f*(n+h)+p*g,t-m,p*(i+h)-f*g],K(.15,.2),.035,K(.02,.07),.02,l(u),[p,0,-f],.22)}},a=r.count;i(9,1.6,.25,.15,.4,.52,.07,.5,e=>e%2?Ql:Yl),i(10,1.63,.28,.17,.22,.34,.1,0,e=>n(e+1)),r.tint(a,(e,t,n,r)=>r.multiplyScalar(.62+.38*yu(1,1.5,t))),e(r,this.body);for(let n of[-1,1]){let r=new Mn;r.position.set(n*iu,ru,0),r.rotation.order=`YXZ`;let i=new Mn;i.position.set(0,-.68,0);let a=new Ul;t(a,.15,.62,.14,0,-.35,0,0,0,0,Yl),t(a,.045,.44,.15,n*.08,-.3,0,0,0,n*.02,Xl),t(a,.17,.13,.16,0,-.03,0,0,0,0,Ql),e(a,r,this.material,[[4,e=>e.box(.2,.1,.19,q(0,-.02,.005),$l,.04)]]);let o=new Ul;t(o,.185,.6,.15,0,-.37,0,0,0,0,Yl),t(o,.15,.15,.06,0,-.03,.075,.12,0,0,Ql),t(o,.08,.42,.04,-n*.02,-.4,-.085,0,0,.03,Xl),t(o,.2,.17,.24,0,-.735,.01,0,0,0,Ql),vu(o,[0,-.82+.055,.1],[0,-.7775,.27],.19,.11,.17,.085,Yl);for(let e of[-1,1])vu(o,[e*.045,-.82+.04,ou],[e*.085,-.7549999999999999,su],.075,.08,.035,.04,Ql,[1,0,0]);let s=[];n===1&&s.push([2,e=>{vu(e,[.04,-.06,.1],[.075,-.6,.47],.075,.06,.06,.05,Xl),vu(e,[.075,-.6,.47],[.08,cu,lu],.06,.05,.02,.02,Zl),vu(e,[.06,-.36,.3],[.05,-.4,.07],.05,.04,.04,.04,Ql)}]),s.push([4,e=>{e.box(.21,.12,.19,q(0,0,.01),$l,.04),e.box(.22,.07,.21,q(0,-.82+.19,.01),$l,.04)}]),e(o,i,this.material,s),r.add(i),this.body.add(r),this.legs.push({thigh:r,shin:i})}this.torso.position.set(0,uu,0),this.body.add(this.torso);let o=new Ul;t(o,.64,.09,.22,0,.085,0,0,0,.015,Ql),t(o,.09,.58,.2,-.265,.39,0,0,0,.02,Yl),t(o,.09,.58,.2,.265,.39,0,0,0,-.02,Yl),t(o,.65,.1,.22,0,.67,0,0,0,-.01,Yl);for(let e of[-1,1])t(o,.16,.065,.19,e*.178,.545,0,0,0,e*-.95,Ql),t(o,.14,.06,.19,e*.082,.612,0,0,0,e*-.3,Ql),t(o,.12,.48,.03,e*.277,.38,.105,0,0,e*-.03,Xl),t(o,.11,.42,.03,e*.277,.35,-.105,0,0,e*.04,Xl);t(o,.64,.1,.24,0,.765,0,0,0,0,Ql),t(o,.2,.1,.2,0,.85,.01,0,0,0,Yl),t(o,.045,.06,.045,0,.595,0,0,0,0,Ql),e(o,this.torso),this.bell.position.set(0,.585,0),this.torso.add(this.bell);let s=new Ul,c=1.12,l=e=>q(0,e*c,0,0,0,0,c);s.box(.035,.07,.035,l(-.04),nu,.1),s.add(new Li(.028,.062,.05,8),l(-.095),tu,.12),s.add(new Li(.062,.088,.12,8,1,!0),l(-.18),eu,.14),s.add(new Li(.088,.118,.055,8),l(-.2675),tu,.12),s.box(.04,.06,.04,l(-.32),nu,.1),e(s,this.bell,this.bellMaterial,[[3,e=>{e.box(.034,.3,.034,q(.158,-.15,0,0,0,.05),nu,.1),e.add(_u(.085,.14,.085,.04,.04),q(.15,-.43,0),tu,.12,!0)}]]);for(let r of[-1,1]){let i=new Mn;i.position.set(r*.17,du,0);let a=new Ul,o=(e,t,i,o,s,c,l,u)=>{for(let d=0;d<e;d++){let f=t+(i-t)*d/(e-1)+K(-.06,.06),p=Math.abs(Math.sin(f)),m=K(c,l)*(1-.42*p),h=s+K(-.05,.05)+p*.42,g=Math.cos(f)*Math.cos(h),_=Math.sin(f)*Math.cos(h),v=.04+u*.02,y=-.07+Math.cos(f)*v,b=Math.sin(f)*(v+.05);vu(a,[r*y,o,b],[r*(y+g*m),o-Math.sin(h)*m,b+_*m],.17,.04,K(.1,.2),.03,n(d+u*2+ +(r>0)),[-Math.sin(f)*r,0,Math.cos(f)],.22)}};o(6,-1.45,1.45,.08,.46,.46,.56,0),o(5,-1.2,1.2,.125,.38,.26,.34,1),vu(a,[r*.12,-.06,-.17],[r*.07,-.52,-.16],.25,.05,.06,.035,Yl),vu(a,[r*.2,-.07,-.2],[r*.08,-.5,-.185],.05,.035,.025,.02,Zl),vu(a,[r*.01,-.09,-.195],[r*.24,-.05,-.2],.05,.03,.04,.03,Xl),e(a,i),this.torso.add(i),this.shoulders.push(i);let s=new Mn;s.position.set(r*.27,-.12,0);let c=new Mn;c.position.set(0,-.52,0);let l=new Ul;t(l,.12,.5,.11,0,-.27,0,0,0,0,Yl),t(l,.14,.11,.13,0,-.02,0,0,0,0,Ql),t(l,.04,.34,.12,r*.07,-.28,0,0,0,r*.03,Xl),e(l,s);let u=new Ul;t(u,.13,.44,.11,0,-.27,0,0,0,0,Yl),t(u,.1,.1,.1,0,-.01,0,0,0,0,Ql),t(u,.14,.12,.07,0,-.55,0,0,0,0,Ql);for(let e=-1;e<=1;e++){let t=e*.048;vu(u,[t,-.6,0],[t*2.1,-.79,.02],.042,.045,.036,.036,Ql),vu(u,[t*2.1,-.79,.02],[t*2.7-r*.02,-.97,.075],.036,.036,.012,.012,Yl)}vu(u,[-r*.06,-.54,.02],[-r*.14,-.72,.08],.042,.04,.012,.012,Ql),e(u,c),s.add(c),i.add(s),this.arms.push({upper:s,fore:c})}this.head.position.set(0,.84,.03),this.torso.add(this.head);let u=new Ul;vu(u,[0,-.03,0],[0,.17,.16],.12,.13,.11,.12,Ql),vu(u,[0,.235,.13],[0,.1,.25],.17,.15,.23,.19,Yl),vu(u,[0,.1,.25],[0,-.17,.45],.23,.19,.055,.045,Yl),vu(u,[0,.165,.33],[0,-.15,.48],.16,.025,.045,.02,Xl),vu(u,[0,.03,.2],[0,-.14,.4],.12,.03,.04,.02,Ql);for(let e of[-1,1])vu(u,[e*.075,.2,.15],[e*.11,.3,.12],.08,.07,.06,.05,Ql);let d=e=>.12-.36*(e-.27),f=(e,t,n,r,i,a,o,s,c=Yl,l=0,u=0)=>vu(e,[t*n,r,d(r)+l],[t*i,a,d(a)+u],o,o,s,s,c,[1,0,0],.2);for(let e of[-1,1])f(u,e,.09,.27,.22,.37,.12,.105),f(u,e,.22,.37,.37,.5,.105,.09,Yl,0,-.04),f(u,e,.37,.5,.48,.68,.09,.075,Yl,-.04,-.02),f(u,e,.48,.68,.5,.9,.075,.034,Yl,-.02,-.1),f(u,e,.15,.31,.13,.56,.08,.032,Yl,.02,.26),f(u,e,.22,.37,.25,.73,.085,.032,Yl,0,-.14),f(u,e,.37,.5,.37,.88,.08,.032,Yl,-.04,.16),f(u,e,.48,.68,.6,.84,.072,.032,Yl,-.02,.06),f(u,e,.495,.8,.42,.95,.06,.03,Yl,-.07,.05);e(u,this.head,this.material,[[1,e=>{f(e,-1,.17,.33,.35,.27,.075,.06,Xl,.02,.06),f(e,-1,.35,.27,.48,.36,.06,.026,Xl,.06,.1),f(e,-1,.35,.27,.45,.13,.06,.026,Xl,.06,.08)}],[5,e=>{for(let t of[-1,1])f(e,t,.5,.9,.46,1.08,.065,.06,Yl,-.1,0),f(e,t,.46,1.08,.34,1.22,.06,.055),f(e,t,.34,1.22,.18,1.28,.055,.05),f(e,t,.18,1.28,.05,1.2,.05,.022),f(e,t,.18,1.28,.13,1.44,.05,.022),f(e,t,.46,1.08,.59,1.2,.05,.022)}]]),this.setStage(0),this.apply({walk:0,gait:0,crouch:0,swing:0,stun:0,bell:0,hop:0,stage:0})}setStage(e){for(let t of this.staged){let n=t.base;for(let[r,i]of t.cuts)e>=r&&(n=i);t.geo.setDrawRange(0,n)}}apply(e){let t=Math.sin(e.walk),n=Math.cos(e.walk),r=e.gait,i=e.crouch,a=e.stun,o=Math.min(1,r*2.5),s=e.stage>=4?1.28:1,c=yu(0,.4,e.swing)*(1-yu(.42,.75,e.swing)),l=yu(.42,.85,e.swing),u=Math.min(1,Math.max(0,e.hop*(2-e.hop))),d=this.body;d.rotation.x=.07*r+.05*i,d.rotation.y=l*.25-c*.2,d.position.set(0,0,-e.hop-.17*i*s+l*.22);let f=this.torso;f.rotation.x=.07+i*.68+r*.14+a*.5-c*.3+l*.25-u*.12,f.rotation.z=t*.05*o+a*.08,f.rotation.y=l*.45-c*.35-t*.06*o;let p=d.rotation.x+f.rotation.x;this.head.rotation.x=-.02-i*.72-r*.1+a*1+n*.03*r+c*.2,this.head.rotation.z=a*.28,this.head.rotation.y=-f.rotation.y*.6,this.legs.forEach((r,c)=>{let l=c===0?-1:1,d=c===0?t:-t,f=Math.max(0,c===0?n:-n),p=c===1&&e.stage>=2,m=d<0?(-d)**.6*(p?.3:.75):0,h=f*1.15,g=i*1.15*s,_=i*i*(p?.25:.55)*s;r.thigh.rotation.x=-(d*.46+f*.5)*o-g-a*.3-u*.45,r.thigh.rotation.y=l*(i*.5+a*.12),r.thigh.rotation.z=l*.055,r.shin.rotation.x=(h+m)*o+g+_+a*.55+u*.9});let m=i*.5+a*.15;this.shoulders.forEach((e,t)=>{let n=t===0?-1:1;e.position.y=du-i*.09-a*.04+c*.04,e.rotation.x=m,e.rotation.z=-n*(i*.4+a*.2-c*.15)});let h=p+m;this.arms.forEach((e,n)=>{let r=n===0?-1:1,s=n===0?-t:t,u=n===0?1:.8;e.upper.rotation.x=-h*(.55+.25*i+.35*a)+s*.42*o+i*.1+c*.8*u-l*1.45*u,e.upper.rotation.z=r*(.13+i*1.25+c*.75-l*1.55-a*.06),e.fore.rotation.x=-.18-i*.55-Math.max(0,s)*.35*o-c*.6+l*.15+a*.1,e.fore.rotation.z=-r*(.04+i*.55-l*.35)}),this.bell.rotation.x=-p*.9+Math.sin(e.walk*2)*.14*r+e.bell,this.bell.rotation.z=e.bell*.6+t*.08*r,d.updateMatrix();let g=1/0;for(let e of this.legs)e.thigh.updateMatrix(),e.shin.updateMatrix(),hu.multiplyMatrices(d.matrix,e.thigh.matrix).multiply(e.shin.matrix),g=Math.min(g,gu.set(0,-.82,au).applyMatrix4(hu).y,gu.set(0,-.82,ou).applyMatrix4(hu).y,gu.set(0,-.7749999999999999,su).applyMatrix4(hu).y);d.position.y=-g+u*.22}},J={needle:`#495442`,needleDark:`#36413a`,trunk:`#6d4034`,chip:`#d7b887`,rock:`#666a78`,moss:`#59664d`,bark:`#6a5242`,post:`#5a4233`,tin:`#b9c6cf`,rust:`#7d4a33`,steel:`#7c8792`,berry:`#c23b34`,leaf:`#8a3f2c`,ember:`#bf532f`,flame:`#ffc56f`},xu=Math.PI*2,Y=new rn,Su=(e,t)=>[e[0]+t[0],e[1]+t[1],e[2]+t[2]],Cu=(e,t)=>[e[0]-t[0],e[1]-t[1],e[2]-t[2]],wu=(e,t)=>[e[0]*t,e[1]*t,e[2]*t],Tu=(e,t)=>[e[1]*t[2]-e[2]*t[1],e[2]*t[0]-e[0]*t[2],e[0]*t[1]-e[1]*t[0]],Eu=e=>{let t=Math.hypot(e[0],e[1],e[2])||1;return[e[0]/t,e[1]/t,e[2]/t]},Du=(e,t,n)=>[e[0]+(t[0]-e[0])*n,e[1]+(t[1]-e[1])*n,e[2]+(t[2]-e[2])*n],Ou=e=>{let t=[0,0,0];for(let n of e)t[0]+=n[0]/e.length,t[1]+=n[1]/e.length,t[2]+=n[2]/e.length;return t};function X(e,t=0,n=1){return new H(e).multiplyScalar(n*(1+(G()*2-1)*t))}var ku=(e,t,n)=>new H(e).lerp(new H(t),n);function Au(e,t,n,r=Y,i){let a=[],o=r.determinant()<0;for(let e=0;e+2<t.length;e+=3){let n=t[e],r=t[e+1],s=t[e+2],c=Tu(Cu(r,n),Cu(s,n));if(c[0]*c[0]+c[1]*c[1]+c[2]*c[2]<1e-16)continue;let l=o;i&&c[0]*((n[0]+r[0]+s[0])/3-i[0])+c[1]*((n[1]+r[1]+s[1])/3-i[1])+c[2]*((n[2]+r[2]+s[2])/3-i[2])<0&&(l=!l),l?a.push(n[0],n[1],n[2],s[0],s[1],s[2],r[0],r[1],r[2]):a.push(n[0],n[1],n[2],r[0],r[1],r[2],s[0],s[1],s[2])}if(!a.length)return;let s=new Fr;s.setAttribute(`position`,new Cr(a,3)),e.add(s,r,n,0)}function ju(e,t,n,r=Y,i){let a=[];for(let e=1;e+1<t.length;e++)a.push(t[0],t[e],t[e+1]);Au(e,a,n,r,i)}function Mu(e,t,n,r=0,i=0,a=0,o=1){let s=[];for(let c=0;c<e;c++){let l=a+c/e*xu,u=typeof t==`number`?t:t(c);s.push([r+Math.cos(l)*u,n,i+Math.sin(l)*u*o])}return s}function Nu(e,t,n,r=.1,i=Y){for(let a=0;a+1<t.length;a++){let o=t[a],s=t[a+1],c=Du(Ou(o),Ou(s),.5);for(let t=0;t<o.length;t++){let l=(t+1)%o.length,u=typeof n==`function`?n(a,t):X(n,r);Au(e,[o[t],s[t],o[l],o[l],s[t],s[l]],u,i,c)}}}function Pu(e,t,n,r,i,a=.12,o=Y,s=0){let c=Eu(Cu(t[t.length-1],t[0])),l=Math.abs(c[1])>.8?[1,0,0]:[0,1,0],u=t.map((e,i)=>{let a=Eu(Cu(t[Math.min(i+1,t.length-1)],t[Math.max(i-1,0)])),o=Eu(Tu(l,a)),c=Tu(a,o),u=[];for(let t=0;t<r;t++){let a=s+t/r*xu,l=Math.cos(a)*n[i],d=Math.sin(a)*n[i];u.push([e[0]+o[0]*l+c[0]*d,e[1]+o[1]*l+c[1]*d,e[2]+o[2]*l+c[2]*d])}return u});return Nu(e,u,i,a,o),u}function Fu(e,t,n,r,i,a,o=.12,s={}){let c=s.skew??.006,l=(e,n)=>{let i=[[-t/2,e,-r/2],[t/2,e,-r/2],[t/2,e,r/2],[-t/2,e,r/2]].map(e=>[e[0]*n+K(-c,c),e[1]+K(-c,c),e[2]*n+K(-c,c)]),a=[];for(let e=0;e<4;e++){let t=e%2==0?s.gx??1:s.gz??1;for(let n=0;n<t;n++)a.push(Du(i[e],i[(e+1)%4],n/t))}return a},u=l(-n/2,1),d=l(n/2,s.top??1);Nu(e,[u,d],a,o,i),ju(e,u,X(s.end??a,o),i,[0,0,0]),ju(e,d,X(s.end??a,o),i,[0,0,0])}var Iu=(e,t,n,r,i,a,o=.08)=>Fu(e,t,n,r,i,a,o,{skew:0});function Lu(e,t,n,r,i,a=Y){let o=0,s=0,c=0;for(let e=0;e<t.length;e++){let n=t[e],r=t[(e+1)%t.length];o+=(n[1]-r[1])*(n[2]+r[2]),s+=(n[2]-r[2])*(n[0]+r[0]),c+=(n[0]-r[0])*(n[1]+r[1])}let l=Ou(t),u=s/(Math.hypot(o,s,c)||1);o*(l[0]-n[0])+s*(l[1]-n[1])+c*(l[2]-n[2])<0&&(u=-u);let d=X(r,.12,1+u*.2),f=Math.max(0,Math.min(1,(u-.5)/.35))*i;f>0&&d.lerp(X(J.moss,.12),Math.min(1,f*K(.8,1.1))),ju(e,t,d,a,n)}function Ru(e,t,n,r,i,a=Y,o=1){let s=[];for(let e=0;e<t;e++)s.push((e+K(-.28,.28))/t*xu);let c=n.map(e=>s.map(t=>{let n=e.r*(1+K(-1,1)*(e.jit??.1)),r=(e.cx??0)+Math.cos(t)*n,i=(e.cz??0)+Math.sin(t)*n*o;return[r,e.y+(e.tx??0)*r+(e.tz??0)*i,i]}));for(let n=0;n+1<c.length;n++){let o=c[n],s=c[n+1],l=Du(Ou(o),Ou(s),.5);for(let n=0;n<t;n++){let c=(n+1)%t;Lu(e,[o[n],s[n],s[c],o[c]],l,r,i,a)}}Lu(e,c[c.length-1],Ou(c[0]),r,i,a)}function zu(e,t,n,r,i,a,o=0,s=5){Ru(e,s,[{y:-.02,r,jit:.12},{y:i*K(.5,.7),r:r*K(.82,.95),jit:.1,tx:K(-.2,.2)},{y:i,r:r*K(.42,.58),jit:.12,tx:K(-.25,.25),tz:K(-.25,.25)}],a,o,q(t,0,n,0,G()*xu,0),K(.75,1))}function Bu(e,t,n,r,i,a=.1,o=Y){Pu(e,[t,n],[r,0],3,i,a,o,G()*xu)}function Vu(e,t,n,r,i,a,o,s=.014){let c=K(.08,.3),l=K(.7,.92),u=K(.03,.35),d=Math.min(.97,u+K(.35,.6)),f=(e,a)=>Du(Du(t,n,e),Du(i,r,e),a),p=(c+l)/2,m=[f(p+K(-.12,.12),u),f(l,u+.08),f(l,d-.1),f(p+K(-.12,.12),d),f(c,d-.06),f(c,u+.12)],h=Ou(m),g=Eu(Cu(h,[a[0],h[1],a[2]]));ju(e,m.map(e=>Su(e,wu(g,s))),o,Y,a)}var Hu=[{pts:[6,6,5,5,5,4,4],start:.3,spread:.215,h0:.14,droop:1,lop:.08,stubs:2,hang:2},{pts:[7,6,6,5,5,4],start:.225,spread:.25,h0:.165,droop:1.35,lop:.12,stubs:2,hang:3},{pts:[5,5,5,5,4,4],start:.45,spread:.165,h0:.13,droop:.9,lop:.3,stubs:5,hang:0}];function Uu(e){let t=((e|0)%3+3)%3;Vl(900+t*17);let n=new Ul,r=Hu[t],i=G()*xu,a=K(-.008,.008),o=K(-.008,.008),s=[Mu(5,()=>.042*K(1,1.14),0,0,0,i),Mu(5,.034,.05,0,0,i+.12)];t===2&&s.push(Mu(5,.029,r.start*.52,-a,-o,i+.3)),s.push(Mu(5,.023,r.start+.05,a,o,i+.45)),s.push(Mu(5,0,.92,0,0,i)),Nu(n,s,e=>X(J.trunk,.17,e===0?.8:1));for(let e=0;e<3;e++){let t=i+e/3*xu+K(-.4,.4),r=Math.cos(t),a=Math.sin(t),o=[r*.03,K(.085,.12),a*.03],s=[r*.072,-.004,a*.072];Au(n,[o,s,[r*.03-a*.022,-.004,a*.03+r*.022]],X(J.trunk,.12,.95)),Au(n,[o,[r*.03+a*.022,-.004,a*.03-r*.022],s],X(J.trunk,.12,.7))}for(let e=0;e<r.stubs;e++){let e=G()*xu,t=K(.14,r.start-.02),i=K(.03,.06),a=Math.cos(e),o=Math.sin(e);Au(n,[[a*.02,t-.006,o*.02],[a*.02,t+.007,o*.02],[a*(.03+i),t+i*K(-.25,.45),o*(.03+i)]],X(`#3d2a22`,.15))}let c=G()*xu,l=r.pts.length;for(let e=0;e<l;e++){let t=e/(l-1),i=e===l-1,a=r.start+(.872-r.start)*t**.94,o=(r.spread*(1-t)**.9+.036*t)*K(.94,1.07),s=i?1-a:r.h0*(1-t)+.125*t,u=1-t,d=[K(-.008,.008)*u,a+s,K(-.008,.008)*u],f=r.pts[e],p=G()*xu,m=[],h=[];for(let e=0;e<f;e++){let t=p+(e+K(-.2,.2))/f*xu,n=p+(e+.5+K(-.14,.14))/f*xu,l=o*K(.8,1.16)*(1+r.lop*Math.cos(t-c)),u=o*K(.66,.82)*(1+r.lop*Math.cos(n-c));m.push([Math.cos(t)*l,a-s*r.droop*K(.04,.4)*(i?.3:1),Math.sin(t)*l]),h.push([Math.cos(n)*u,a+s*K(.1,.24),Math.sin(n)*u])}let g=ku(J.needleDark,J.needle,Math.max(0,Math.min(1,.3+.55*t+K(-.2,.2)))),_=n.count;for(let e=0;e<f;e++){let t=m[(e+1)%f];Au(n,[d,m[e],h[e]],X(g,.14,1.07)),Au(n,[d,h[e],t],X(g,.14,.9))}if(n.tint(_,(e,t,n,r)=>{Math.hypot(e,n)<.012&&r.multiplyScalar(.66)}),e===0)for(let e=0;e<r.hang;e++){let e=G()*xu,t=Math.cos(e),r=Math.sin(e),i=a-K(.03,.07),s=o*K(.55,.8);Au(n,[[t*.015,i+.03,r*.015],[t*s-r*.022,i-.025,r*s+t*.022],[t*s*1.12+r*.02,i-.05,r*s*1.12-t*.02]],X(J.needleDark,.14,.9))}}return n.build()}function Wu(e){let t=+!!e;Vl(300+t*31);let n=new Ul;return t===0?Ru(n,6,[{y:0,r:1,jit:.07},{y:.8,r:.9,jit:.08,tx:.08,tz:-.06},{y:1.17,r:.62,jit:.1,cx:.08,cz:-.05,tx:.16,tz:-.1}],J.rock,1):(Ru(n,7,[{y:0,r:1,jit:.07},{y:.52,r:.94,jit:.08,tx:-.06,tz:.08},{y:.88,r:.7,jit:.1,cx:-.1,cz:.06,tx:-.14,tz:.1}],J.rock,1,q(-.04,0,-.03),.92),Ru(n,5,[{y:0,r:.36,jit:.1},{y:.2,r:.33,jit:.1,tx:.2},{y:.36,r:.17,jit:.1,tx:.5}],J.rock,.6,q(.72,0,.56,0,.6,0))),n.build()}var Gu=`#a36c46`;function Ku(e,t=J.bark){let n=[];for(let t=0;t<e;t++)n.push(G());return(e,r)=>{G()<.3&&(n[r]=G());let i=n[r];return i<.58?X(t,.14):i<.86?X(J.trunk,.14,.9):X(Gu,.1)}}function qu(e){Vl(700+e*13);let t=new Ul,n=K(-.02,.02),r=K(-.02,.008),i=e=>{let t=Math.max(0,e-1.5);return[n*t*t,r*t*t]},a=e=>.3-.036*e,o=[[0,.33,0],[.34,.297,0],[1.04,.278,0],[1.2,.272,0],[1.39,.267,0],[2.3,.225,.14],[3.3,.19,.3],[4.3,.155,.42],[5.05,.128,.5],[5.5,.1,.56]],s=o.map(([e,t,n],r)=>{let[a,s]=i(e),c=Mu(8,()=>t*(r===0?K(.96,1.24):r>=2&&r<=4?K(.98,1.02):K(.93,1.07)),e,a,s,n);if(r===o.length-1)for(let e of c)e[1]+=K(-.18,.2);return c});s[3][1][2]=s[3][3][2]=.075,s[3][2][2]=.005;let c=Ku(8);Nu(t,s.slice(0,3),c),Nu(t,s.slice(4),c);for(let e of[!1,!0]){let n=s[e?3:2],r=s[e?4:3],i=Du(Ou(n),Ou(r),.5);for(let a=0;a<8;a++){let o=(a+1)%8;if(a>=4)Au(t,[n[a],r[a],n[o],n[o],r[a],r[o]],c(2,a),Y,i);else if(a===1||a===2)Au(t,[n[a],r[a],n[o],n[o],r[a],r[o]],X(e?`#cfa26c`:J.chip,.05,e?1:1.08),Y,i);else{let s=a===0?a:o,l=a===0?o:a,u=X(`#c9a573`,.05,e?.8:.96);e?(Au(t,[n[s],r[s],r[l]],c(3,a),Y,i),Au(t,[n[s],r[l],n[l]],u,Y,i)):(Au(t,[n[s],r[s],n[l]],c(2,a),Y,i),Au(t,[n[l],r[s],r[l]],u,Y,i))}}}for(let e=0;e<12;e++){let e=[0,1,1,4,4,5,5,6][Math.floor(G()*8)],n=e<2?4+Math.floor(G()*4)+(G()<.3?4:0):Math.floor(G()*8),r=s[e],i=s[e+1],a=n%8,o=(a+1)%8;Vu(t,r[a],r[o],i[o],i[a],Du(Ou(r),Ou(i),.5),G()<.35?X(Gu,.1):X(J.bark,.12,K(.7,1.15)))}let l=s[s.length-1],u=Ou(l);ju(t,l,X(`#8a6f52`,.1),Y,[u[0],0,u[2]]);for(let e=0;e<5;e++){let e=G()*xu,n=[u[0]+Math.cos(e)*.05,u[1]-.1,u[2]+Math.sin(e)*.05];Bu(t,n,[n[0]+K(-.06,.06),u[1]+K(.3,.8),n[2]+K(-.06,.06)],.045,X(J.chip,.1,.92),.08)}let d=ku(J.bark,`#2e2420`,.35);for(let n=0;n<7;n++){let r=2.35+n*.42+K(-.15,.15),o=n*2.4+K(-.5,.5)+e,[s,c]=i(r),l=a(r),u=K(.55,1.25)*(1-(r-2.3)/6.5),f=[s+Math.cos(o)*l*.55,r,c+Math.sin(o)*l*.55],p=Su(f,wu(Eu([Math.cos(o),K(.15,.55),Math.sin(o)]),u*.55)),m=o+K(-.6,.6),h=Su(p,wu(Eu([Math.cos(m),K(-.15,.8),Math.sin(m)]),u*.5));G()<.3?ju(t,Pu(t,[f,p],[.062,.042],4,d,.16,Y,G())[1],X(J.chip,.08,.8),Y,f):(Pu(t,[f,p,h],[.056,.034,0],4,d,.16,Y,G()),G()<.6&&Bu(t,p,Su(p,wu(Eu([Math.cos(o-.9),K(.2,.9),Math.sin(o-.9)]),u*.3)),.02,d,.16))}for(let e=0;e<6;e++){let e=[K(-.45,.45),.02,K(.36,.95)],n=G()*xu;Bu(t,e,[e[0]+Math.cos(n)*K(.09,.15),.035,e[2]+Math.sin(n)*K(.09,.15)],.04,X(J.chip,.08))}return t.build()}function Ju(){Vl(55);let e=new Ul,t=e=>.47-e*.22,n=Mu(8,()=>.285*K(.96,1.04),0).map(e=>[e[0],t(e[2]),e[2]]);Nu(e,[Mu(8,()=>.33*K(.96,1.24),0),Mu(8,()=>.297*K(.96,1.04),.3),n],Ku(8));let r=[.02,t(.03)+.012,.03];for(let t=0;t<8;t++)Au(e,[r,n[t],n[(t+1)%8]],X(J.chip,.07),Y,[0,0,0]);for(let n=0;n<5;n++){let r=-.17+n*.085+K(-.02,.02),i=-.12+K(-.03,.03);Bu(e,[r,t(i)-.03,i],[r+K(-.03,.03),t(i)+K(.1,.3),i+K(-.04,.02)],.04,X(J.chip,.1,.94))}for(let t=0;t<9;t++){let t=G()*xu,n=K(.42,.9),r=[Math.cos(t)*n,.02,Math.sin(t)*n],i=G()*xu;Bu(e,r,[r[0]+Math.cos(i)*K(.1,.17),.035,r[2]+Math.sin(i)*K(.1,.17)],.045,X(J.chip,.08))}return e.build()}function Yu(){Vl(81);let e=new Ul,t=`#22252b`;return Fu(e,.175,1.78,.175,q(0,.875,0,.012,.2,.02),J.post,.14,{gx:2,gz:2,top:.9,skew:.009,end:`#7b6450`}),Fu(e,.13,.84,.12,q(.1,1.565,.04,0,0,Math.PI/2+.035),J.post,.14,{gz:2,skew:.007,end:`#806a55`}),Fu(e,.07,.34,.07,q(.165,1.37,.03,0,0,-.62),ku(J.post,`#2e2420`,.3),.12,{skew:.005}),Iu(e,.034,.034,.02,q(.03,1.59,.108,0,0,.6),t,.1),Iu(e,.03,.03,.02,q(-.03,1.54,.108,0,0,.2),t,.1),Iu(e,.02,.152,.142,q(.38,1.552,.04,0,0,.035),t,.12),Pu(e,[[.38,1.49,.02],[.38,1.352,0]],[.008,.007],3,t,.1),zu(e,.13,.11,.12,.13,J.rock,.5),zu(e,-.15,.03,.1,.1,J.rock,.5),zu(e,.02,-.16,.11,.09,J.rock,.5),e.build()}function Xu(){Vl(83);let e=new Ul,t=.075,n=[[-.053,0],[.053,0],[t,-.022],[t,-.198],[.053,-.22],[-.053,-.22],[-.075,-.198],[-.075,-.022]],r=[0,-.22/2,0],i=n.map(([e,t])=>[e,t,.005]),a=n.map(([e,t])=>[e,t,-.005]);Nu(e,[a,i],`#ffffff`,0),ju(e,i,`#ffffff`,Y,r),ju(e,a,`#ffffff`,Y,r);for(let t of[1,-1]){let n=t*.0055,i=t*.011;for(let[t,a,o]of[[-.062,-.108,.03],[-.094,-.148,.04]]){let s=[0,t,n],c=[-o,a,i],l=[o,a,i];Au(e,[s,c,l],`#ffffff`,Y,r),Au(e,[c,[-o,a,n],[o,a,n],c,[o,a,n],l],`#ffffff`,Y,[0,a+.02,n])}Iu(e,.012,.03,.008,q(0,-.163,t*.007),`#ffffff`,0)}return e.add(new Gi(.017,.0045,3,6),q(0,.003,0,0,0,.5),`#ffffff`,0),e.build()}function Zu(){Vl(21);let e=new Ul,t=`#7a5a3c`,n=`#5d4330`,r=Math.PI/2;for(let n=0;n<3;n++){let i=(n-1)*.172;Fu(e,.066,1.15+K(-.04,.02),.166,q(K(-.012,.012),.628+K(-.004,.004),i,0,K(-.012,.012),r),n===1?`#86643f`:t,.12,{gz:2,skew:.005,end:`#9a7850`})}for(let t of[-.45,.45])for(let r of[-.18,.18])Fu(e,.09,.61,.09,q(t+Math.sign(t)*.02,.3,r+Math.sign(r)*.012,Math.sign(r)*.06,0,Math.sign(t)*.1),n,.13,{skew:.006,top:.9});for(let t of[-.2,.2])Fu(e,.075,.86,.034,q(0,.557,t,0,0,r),n,.12,{skew:.004});for(let t of[-.46,.46])Fu(e,.05,.36,.05,q(t,.2,0,r,0,0),n,.12,{skew:.004});Fu(e,.05,.92,.055,q(0,.2,0,0,0,r),ku(n,t,.4),.12,{skew:.004}),Iu(e,.13,.035,.1,q(.3,.678,-.02,0,.35,0),`#4f555e`,.1),Fu(e,.21,.07,.115,q(.3,.73,-.02,0,.35,0),J.steel,.1,{skew:.004,top:1}),Fu(e,.07,.05,.07,q(.42,.728,-.065,0,.35,0),J.steel,.1,{skew:.003}),Fu(e,.026,.27,.03,q(-.2,.675,.07,0,-.5,r),`#a8703c`,.1,{skew:.002}),Iu(e,.05,.05,.115,q(-.31,.687,.13,0,-.5,0),J.rust,.12),ju(e,Pu(e,[[-.42,.662,-.14],[-.42,.76,-.14]],[.04,.043],6,J.tin,.12)[1],X(`#5c626b`,.1),Y,[-.42,.6,-.14]);let i=(t,n,r,i)=>{let a=[Math.cos(i)*.19,0,Math.sin(i)*.19],o=[t,n,r],s=Pu(e,[Cu(o,a),Su(o,a)],[.072,.066],6,Ku(6,J.trunk),0,Y,G());ju(e,s[0],X(J.chip,.08),Y,o),ju(e,s[1],X(J.chip,.08,.92),Y,o)};return i(-.22,.068,.4,.1),i(-.2,.068,.545,-.12),i(-.23,.185,.47,.22),e.build()}function Qu(){Vl(33);let e=new Ul,t=e.count;for(let t=0;t<10;t++){let n=t/10*xu+K(-.08,.08),r=K(.145,.2);zu(e,Math.cos(n)*.63,Math.sin(n)*.63,r,K(.14,.22),t%3==0?`#77727f`:`#66616c`,0,5)}e.tint(t,(e,t,n,r)=>{let i=Math.hypot(e,n);i<.6&&r.multiplyScalar(.68+.32*Math.max(0,(i-.44)/.16))}),ju(e,Mu(9,()=>K(.47,.54),.016),X(`#3a3230`,.05),Y,[0,-1,0]),ju(e,Mu(7,()=>K(.2,.28),.024,.02,-.02,.4),X(`#5a4c46`,.05),Y,[0,-1,0]);for(let t=0;t<8;t++){let n=G()*xu,r=K(.06,.3),i=[Math.cos(n)*r,.02,Math.sin(n)*r],a=G()*xu;Bu(e,i,[i[0]+Math.cos(a)*.11,.055,i[2]+Math.sin(a)*.11],.05,X(t%3==0?J.flame:J.ember,.12))}let n=`#33261f`,r=`#6a442c`;for(let t=0;t<5;t++){let i=t/5*xu+.3+K(-.12,.12),a=Math.cos(i),o=Math.sin(i),s=[a*.37,.04,o*.37],c=[-a*.07-o*.05,K(.44,.54),-o*.07+a*.05],l=Pu(e,[s,Du(s,c,.55),c],[.066,.06,.052],5,e=>X(e===0?n:r,.2),0,Y,G());ju(e,l[2],X(`#a88660`,.08),Y,s),ju(e,l[0],X(n,.1),Y,c)}for(let[t,i,a]of[[.6,.075,.42],[2.3,.1,.36]]){let o=[Math.cos(t)*a,0,Math.sin(t)*a],s=Pu(e,[[-o[0],i,-o[2]],[0,i+.01,0],[o[0],i,o[2]]],[.062,.066,.058],5,e=>X(e===0?n:r,.2,.85),0,Y,G());ju(e,s[0],X(n,.1),Y,[0,i,0]),ju(e,s[2],X(`#8a6a48`,.08),Y,[0,i,0])}return e.build()}function $u(e){Vl(600+e);let t=new Ul,n=`#4a4e57`,r=()=>G()<.3?`#93593a`:J.rust,i=G()*xu,a=(e,t)=>[e*Math.cos(i)-t*Math.sin(i),e*Math.sin(i)+t*Math.cos(i)];{let[e,n]=a(0,0);t.box(K(.4,.5),.016,K(.28,.34),q(e,.05,n,K(-.1,.1),i,.16),r(),.18);let[o,s]=a(-.27,.02);t.box(K(.2,.26),.016,K(.26,.32),q(o,.1,s,K(-.1,.1),i,-.75),r(),.18)}{let[n,o]=a(-.02,-.24);t.box(K(.3,.38),.016,K(.3,.36),q(n,.15,o,1.05+K(-.12,.12),i+K(-.2,.2),K(-.1,.1)),e%3==0?J.steel:r(),.18)}{let e=i+K(.6,1.2),[n,r]=a(.05,K(-.06,.06)),o=[Math.cos(e)*.27,.035,Math.sin(e)*.27],s=[n,.13,r],c=Pu(t,[Cu(s,o),Su(s,o)],[.045,.045],6,J.steel,.16,Y,G());ju(t,c[0],`#17181c`,Y,s),ju(t,c[1],`#17181c`,Y,s)}{let[e,r]=a(.14,-.2),o=i+K(-.4,.4);t.box(.46,.014,.055,q(e,.1,r,.25,o,.22),n,.16),t.box(.46,.055,.014,q(e-Math.sin(o)*.02,.125,r-Math.cos(o)*.02,.25,o,.22),n,.16)}{let[n,o]=a(K(-.12,.02),.2);t.add(new Gi(.15,.03,4,7),q(n,.14,o,1.05,i+K(-.5,.5),.3),e%2?J.steel:r(),.16)}{let[e,n]=a(.3,.14);ju(t,Pu(t,[[e,0,n],[e+.02,.14,n+.01]],[.055,.06],6,J.tin,.14,Y,G())[1],`#3a3d45`,Y,[e,0,n])}for(let n=0;n<2+e%2;n++){let e=G()*xu,i=K(.3,.46);t.box(K(.1,.18),.014,K(.07,.12),q(Math.cos(e)*i,.022,Math.sin(e)*i,K(-.15,.15),G()*xu,K(-.15,.15)),n%2?J.steel:r(),.18)}return t.build()}function ed(e){Vl(500+e);let t=[];for(let e=0;e<6;e++){let n=e/6*xu+K(-.4,.4),r=K(.18,.36),i=K(.5,.86),a=Math.cos(n),o=Math.sin(n);t.push([[a*.04,0,o*.04],[a*r*.42+K(-.04,.04),i*.55,o*r*.42+K(-.04,.04)],[a*r,i,o*r]])}return t}function td(e,t,n,r,i,a,o){let s=[Math.cos(n)*Math.cos(r),Math.sin(r),Math.sin(n)*Math.cos(r)],c=[-Math.sin(n),0,Math.cos(n)],l=Su(t,wu(s,i*.42)),u=Su(Su(l,wu(c,a)),[0,a*.4,0]),d=Su(Cu(l,wu(c,a)),[0,a*.4,0]),f=Su(t,wu(s,i));f[1]-=i*.14,Au(e,[t,u,f,t,f,u],X(o,.16,1.06)),Au(e,[t,f,d,t,d,f],X(o,.16,.84))}function nd(e){let t=ed(e),n=new Ul,r=[J.leaf,`#6d3527`,J.leaf,`#9c4a2b`];t.forEach((e,t)=>{Pu(n,e,[.015,.011,.005],3,`#3f2620`,.15,Y,G());let i=Math.atan2(e[2][2],e[2][0]);for(let a=0;a<4;a++){let o=.22+a*.2+K(-.04,.04),s=o<.5?Du(e[0],e[1],o*2):Du(e[1],e[2],o*2-1),c=a%2?1:-1;td(n,s,i+c*K(.7,1.3),K(.15,.55),K(.19,.28),K(.055,.075),r[(t+a)%4])}t%3==2&&td(n,e[2],i,.7,.25,.065,r[t%4])});for(let e=0;e<5;e++)td(n,[0,.03,0],e/5*xu+K(-.3,.3),K(.12,.3),K(.26,.36),K(.08,.1),r[e%4]);return n.build()}function rd(e){let t=ed(e),n=new Ul;return t.forEach((e,t)=>{if(t%3==2)return;let r=e[2],i=3+t%2;for(let e=0;e<i;e++){let t=e/i*xu+G(),a=e===0?0:K(.04,.062);n.add(new Bi(K(.034,.045),0),q(r[0]+Math.cos(t)*a,r[1]+(e===0?.03:K(-.035,.02)),r[2]+Math.sin(t)*a,G(),G()*3,0),J.berry,.14)}}),n.build()}function id(){Vl(71);let e=new Ul,t=[J.leaf,`#9a5a34`,`#a8502c`,J.leaf,`#7a3a2a`];for(let n=0;n<5;n++){let r=n/5*xu+K(-.35,.35),i=K(.3,.52),a=K(.055,.085),o=K(.13,.26),s=Math.cos(r),c=Math.sin(r),l=(e,t,n)=>[s*e*i-c*t*a,n,c*e*i+s*t*a],u=l(.03,0,.01),d=l(1,0,o*K(.15,.55));Au(e,[u,l(.5,1,o),d],X(t[n],.16,1.06)),Au(e,[u,d,l(.56,-1,o*.85)],X(t[n],.16,.84))}return Au(e,[[-.02,0,.01],[.025,0,-.01],[.03,.34,.04]],X(`#6d3527`,.1)),Au(e,[[.012,.14,.014],[.11,.3,-.03],[.03,.25,.03]],X(`#9c4a2b`,.1)),e.build()}function ad(){Vl(91);let e=new Ul,t=`#4f555e`,n=`#8d98a3`,r=.34;e.box(.76,.02,.06,q(0,.014,0),t,.1),e.box(.05,.016,.3,q(0,.012,0),t,.1);for(let i of[1,-1])e.box(.045,.06,.08,q(i*r,.036,0),t,.12),e.box(.2,.014,.046,q(i*.22,.04,0,0,0,i*.13),n,.12);let i=Mu(6,.085,.03,0,0,.3),a=Mu(6,.115,.052,0,0,.3);Nu(e,[i,a],J.rust,.14),ju(e,a,X(J.rust,.1,1.1),Y,[0,0,0]);for(let t of[1,-1]){let i=[];for(let e=0;e<=6;e++){let n=e/6*Math.PI,a=Math.sin(n)*r;i.push([Math.cos(n)*r,.045+a*.2,t*a])}Pu(e,i,i.map(()=>.021),4,n,.14,Y,Math.PI/4);for(let t=0;t<6;t++){let n=Du(i[t],i[t+1],.5),r=Eu([-n[0],0,-n[2]]);Bu(e,[n[0],n[1],n[2]],[n[0]+r[0]*.035,n[1]+.105,n[2]+r[2]*.035],.026,X(`#a9b3bc`,.1))}}return e.build()}function od(e,t,n,r=.028,i=!1){let a=`#c98b62`,o=`#b67a54`,s=(e,n,r,i=0,a=0,o=0)=>t.clone().multiply(q(e,n,r,i,a,o));Fu(e,.054,.124,.114,s(r+.022,0,.004,0,.08,0),a,.06,{skew:.004,top:.93});let c=[.0465,.0155,-.0155,-.0455],l=[.07,.084,.079,.062];c.forEach((t,n)=>{Iu(e,2*r+.036,.028,.034,s(-.003,t,-(r+.015)),o,.07),Iu(e,.034,.0275,l[n],s(-(r+.017),t,-(r+.032)+l[n]/2,0,n*.03-.03,0),a,.07)}),i?Iu(e,.034,.092,.03,s(.006,.07,r+.014,-.06,0,.14),a,.06):Iu(e,2*r+.04,.034,.032,s(-.006,.052,r+.015,0,0,-.3),a,.06),Iu(e,.062,.086,.044,s(r+.014,-.014,r+.03,0,.1,0),o,.06);let u=Eu(n),d=[r+.022,-.022,.034],f=e=>Su(d,wu(u,e));Pu(e,[f(.01),f(.12)],[.04,.044],6,a,.06,t,.3),ju(e,Pu(e,[f(.095),f(.16)],[.06,.063],6,`#454254`,.1,t,.3)[0],X(`#2c2a36`,.08),t,f(.2)),ju(e,Pu(e,[f(.16),f(.36),f(.66)],[.056,.066,.078],6,e=>X(e?`#5e5a6c`:`#686377`,.1),0,t,.3)[2],X(`#3b394a`,.05),t,f(.3))}function sd(){Vl(13);let e=new Ul,t=[[-.272,.013,.025],[-.245,.011,.03],[-.19,.005,.0225],[.08,-.004,.021],[.33,0,.022],[.494,0,.0205]].map(([e,t,n])=>Mu(6,n,e,t,0,0,1.38));Nu(e,t,e=>X(e<2?`#875634`:`#a06a42`,.1)),ju(e,t[0],X(`#7c4f2a`,.05),Y,[0,0,0]),ju(e,t[5],X(`#b98a58`,.05),Y,[0,0,0]);let n=[[.09,.352,.45,.033],[.045,.343,.459,.04],[-.04,.338,.463,.037],[-.13,.312,.478,.025],[-.212,.272,.501,.012]].map(([e,t,n,r])=>{let i=t+(n-t)*.44;return[[e,t,-r*.7],[e,t,r*.7],[e,i,r],[e,n,r*.76],[e,n,-r*.76],[e,i,-r]]});Nu(e,n,(e,t)=>t===0?X(`#6d2c22`,.08):t===3?X(`#a84a34`,.08):X(e===0?`#7a3026`:t===2||t===4?`#9a3f2e`:`#84352a`,.09,e===3?1.08:1)),ju(e,n[0],X(`#632720`,.06),Y,[0,.4,0]);let r=[-.258,.256,0],i=[-.274,.382,0],a=[-.258,.515,0],o=[-.2,.385,0],s=n[4],c=`#c9c2b8`;for(let[t,n,l]of[[s[1],s[2],s[3]],[s[0],s[5],s[4]]])Au(e,[t,r,i,t,i,n],X(c,.05,.92),Y,o),Au(e,[n,i,a,n,a,l],X(c,.05,1.06),Y,o);return Au(e,[s[3],s[4],a],X(`#a59f97`,.05),Y,o),Au(e,[s[0],s[1],r],X(`#8d8882`,.05),Y,o),od(e,q(.001,-.085,0),[-.11,-.675,.73],.029),e.build()}function cd(){Vl(17);let e=new Ul,t=[[.13,.027],[.112,.036],[-.06,.036],[-.088,.053],[-.106,.059],[-.18,.059]],n=(e,t)=>Mu(8,t,0,0,0,Math.PI/8).map(t=>[t[0],t[2],e]),r=t.map(([e,t])=>n(e,t)),i=[`#2e3036`,`#383a42`,`#3d4048`,`#474a54`,`#4d505a`];Nu(e,r,e=>X(i[e],.12)),ju(e,r[0],X(`#1d1f23`,.05),Y,[0,0,0]);let a=n(-.18,.047),o=n(-.168,.047);return Nu(e,[r[5],a],`#5a5e68`,.08),ju(e,o,`#e6dfc0`,Y,[0,0,0]),Iu(e,.02,.012,.034,q(.004,.04,-.036),`#8a3a2a`,.08),od(e,new rn().makeBasis(new B(-.8,-.6,0),new B(0,0,-1),new B(-.6,.8,0)).setPosition(0,0,.045),[.43,-.85,-.3],.037,!0),e.build()}function ld(){Vl(19);let e=new Ul;Pu(e,[[.004,-.25,0],[-.004,0,.003],[.003,.27,-.002]],[.022,.021,.02],5,`#6b4a30`,.12);let t=[Mu(6,.028,.235),Mu(6,.05,.275,.003,0,.3),Mu(6,.053,.35,-.003,.002,.55),Mu(6,.036,.405,0,0,.8)];return Nu(e,t,e=>X(e===0?`#6b5a48`:e===1?`#2a1c16`:`#4a2219`,.14)),ju(e,t[3],X(J.ember,.1,.8),Y,[0,0,0]),ju(e,t[0],X(`#2a1c16`,.1),Y,[0,1,0]),od(e,q(0,-.12,0,0,0,0,-1,1,1),[.2,-.45,.87],.026),e.build()}function ud(e){Vl(4242);let t=new Ul,n=`#5a463b`;for(let r=0;r<96;r++){let i=r/96*xu+K(-.03,.03),a=e+K(.25,1.9),o=K(3.6,6.6),s=i+Math.PI/2+K(-.65,.65),c=[Math.cos(s),0,Math.sin(s)],l=[Math.cos(i)*a,0,Math.sin(i)*a],u=K(.15,1.25),d=[l[0]-c[0]*o/2,.14,l[2]-c[2]*o/2],f=[l[0]+c[0]*o/2,.1+u,l[2]+c[2]*o/2],p=r%4==0,m=p?`#8f8674`:n,h=Pu(t,[d,Du(d,f,.5),f],[K(.23,.31),.19,.1],5,m,.18,Y,G());ju(t,h[0],X(p?`#b5aa92`:`#8a7458`,.1),Y,l),ju(t,h[2],X(m,.1,.8),Y,l);for(let e=0;e<2;e++){let n=Du(d,f,K(.25,.9)),r=i+K(-1.2,1.2)+(e?Math.PI:0);Bu(t,n,[n[0]+Math.cos(r)*K(.2,.8),n[1]+K(.6,1.7),n[2]+Math.sin(r)*K(.2,.8)],.06,X(m,.15,.85),.15)}if(r%6==2){let e=i+K(-1.5,1.5),r=K(2.6,4.6),o=[Math.cos(i)*(a+.6),0,Math.sin(i)*(a+.6)],s=[o[0]+Math.cos(e)*r*.35,r,o[2]+Math.sin(e)*r*.35];Pu(t,[o,Du(o,s,.6),s],[.17,.11,0],5,p?n:`#5d4b40`,.18,Y,G())}}return t.build()}function dd(){Vl(61);let e=new Ul,t=`#d6d0c2`,n=`#e8e3d6`,r=`#b0aa9a`,i=()=>{let e=G();return e<.68?X(t,.07):e<.9?X(n,.05):X(r,.08)},a=[Mu(7,()=>.44*K(.95,1.3),0),Mu(7,()=>.4*K(.95,1.06),.32,.01),Mu(7,()=>.35*K(.95,1.05),1.25,.04,-.03,.2),Mu(7,()=>.31*K(.94,1.06),2.15,.09,-.05,.4)];Nu(e,a,i);let o=a[3],s=Ou(o);ju(e,o,X(`#8d8778`,.08),Y,[s[0],0,s[2]]);for(let n=0;n<7;n++){let a=o[n],c=o[(n+1)%7],l=Du(Du(a,c,.5),s,.62),u=Du(Du(a,c,K(.2,.8)),s,K(.05,.3));u[1]+=n%3==0?K(.9,1.35):K(.3,.8);let d=[(a[0]+c[0]+l[0])/3,s[1]-.2,(a[2]+c[2]+l[2])/3];Au(e,[a,c,u],i(),Y,d),Au(e,[c,l,u],X(r,.08),Y,d),Au(e,[l,a,u],X(t,.06,.92),Y,d)}for(let[n,i,a]of[[1.5,2.6,.5],[1.95,5.2,.38]]){let o=[Math.cos(i)*.22,n,Math.sin(i)*.22];ju(e,Pu(e,[o,[Math.cos(i)*(.3+a),n+a*.5,Math.sin(i)*(.3+a)]],[.075,.05],4,t,.08,Y,G())[1],X(r,.08),Y,o)}let c=[.62,.52,.42],l=[2.1,.3,1.05],u=[3.55,.2,1.5],d=Pu(e,[c,l,u],[.3,.27,.2],7,i,0,Y,.2);ju(e,d[2],X(r,.08),Y,l),ju(e,d[0],X(`#8d8778`,.08),Y,l);let f=Eu(Cu(c,l));for(let t=0;t<7;t+=2){let n=d[0][t],r=d[0][(t+1)%7],a=Su(Du(Du(n,r,.5),c,.2),wu(f,K(.35,.8)));Au(e,[n,r,a,n,a,c,r,c,a],i(),Y,Su(c,wu(f,.05)))}for(let[n,i,a]of[[.35,.3,.55],[.7,-.5,.42]]){let o=n<.5?Du(c,l,n*2):Du(l,u,n*2-1);ju(e,Pu(e,[o,[o[0]+Math.sin(i)*.2,o[1]+a,o[2]-Math.cos(i)*a*.5]],[.07,.045],4,t,.08,Y,G())[1],X(r,.08),Y,o)}let p=[.45,.16,-.75],m=[1.95,.13,-1.25],h=Pu(e,[p,m],[.15,.11],6,i,0,Y,.4);ju(e,h[0],X(`#8d8778`,.08),Y,m),ju(e,h[1],X(r,.08),Y,p);for(let t=0;t<6;t++){let t=[K(.5,1.5),.03,K(-.5,.9)],r=G()*xu,i=K(.22,.5);Bu(e,t,[t[0]+Math.cos(r)*i,.06,t[2]+Math.sin(r)*i],K(.05,.08),X(n,.08))}return e.build()}var fd=(e,t,n,r,i,a,o,s,c,l,u)=>({top:new H(e),horizon:new H(t),fog:new H(n),near:r,far:i,hemiSky:new H(a),hemiGround:new H(o),hemi:s,sun:new H(c),sunI:l,rim:u}),pd={day:fd(`#6c6079`,`#96848f`,`#86788a`,18,40,`#cdbdc8`,`#8d776c`,2.7,`#ffbe98`,1.5,.03),night:fd(`#0a1220`,`#34507a`,`#263a58`,10,27,`#5f84b8`,`#1a2438`,1.2,`#9dbbe2`,.9,.75),dawn:fd(`#5a5270`,`#c79aa2`,`#8f8094`,16,38,`#c2acbf`,`#7a6466`,2.2,`#ffc3a0`,.9,.08)},md=new rn,hd=new H,gd=(e,t,n)=>e+(t-e)*n,_d=(e,t,n)=>{let r=Math.max(0,Math.min(1,(n-e)/(t-e)));return r*r*(3-2*r)},vd=class{renderer;scene=new Vn;camera=new Ra(55,16/9,.06,140);wood=Jl();woodDouble;world3d=new Mn;cur={...pd.day,top:pd.day.top.clone(),horizon:pd.day.horizon.clone(),fog:pd.day.fog.clone(),hemiSky:pd.day.hemiSky.clone(),hemiGround:pd.day.hemiGround.clone(),sun:pd.day.sun.clone()};skyMat;hemi=new Ea(`#ffffff`,`#444444`,1);sun=new Ga(`#ffffff`,1);fireLight=new Ha(`#ff9040`,0,20,1.7);handLight=new Ha(`#8fa6c8`,.25,3.2,1.6);spot=new Ba(`#d4e4ff`,0,14,Math.PI/10,.45,1.1);torchLight=new Ha(`#ff8a3a`,0,9,1.6);flashLight=new Ha(`#ffd9c8`,0,22,1.4);beam;moon;sunDisc;flames;embers;ring;ringSparks;ferns=null;fernCount=0;snagMeshes=[];scrapMeshes=[];berryMeshes=[];tags=[];trapMeshes=[];trapGhost;trapGeo=ad();deer=new bu;pose={walk:0,gait:0,crouch:0,swing:0,stun:0,bell:0,hop:0,stage:0};deerYaw=0;bellKick=0;axe;lightModel;torchModel;chips=[];chipGeo=new Wi(.07,0);chipMat=new na({color:J.chip,flatShading:!0});chopKick=0;feedKick=0;shakeT=0;flashT=0;flashPos=new B;bob=0;time=0;scale=1;basePixelRatio=1;frameAvg=16;slowFor=0;autoQuality=!0;lowQuality=!1;titleMode=!1;settings={shake:!0,flash:!0};hitPulse=0;constructor(e){this.renderer=new bl({canvas:e,antialias:!0,powerPreference:`high-performance`}),this.renderer.toneMapping=7,this.renderer.toneMappingExposure=1,this.basePixelRatio=Math.min(window.devicePixelRatio||1,1.5),this.woodDouble=Jl(),this.woodDouble.side=2,this.scene.fog=new Bn(pd.day.fog,pd.day.near,pd.day.far),this.scene.add(this.hemi,this.sun,this.sun.target,this.world3d,this.camera),this.fireLight.position.set(0,.9,0),this.scene.add(this.fireLight,this.flashLight),this.skyMat=new ea({side:1,depthWrite:!1,fog:!1,uniforms:{uTop:{value:new H},uHorizon:{value:new H},uFog:{value:new H}},vertexShader:`varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,fragmentShader:`uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uFog; varying vec3 vDir;
void main(){ float h = clamp(vDir.y, 0.0, 1.0); vec3 c = mix(uHorizon, uTop, pow(h, 0.55)); c = mix(uFog, c, smoothstep(0.0, 0.16, vDir.y));
gl_FragColor = vec4(c, 1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});let t=new ai(new Ui(120,20,10),this.skyMat);t.renderOrder=-10,t.frustumCulled=!1,this.scene.add(t),this.moon=new ai(new Ii(4.2,20),new qr({color:`#c9d6e6`,fog:!1,transparent:!0,depthWrite:!1})),this.moon.position.set(48,46,-88),this.moon.lookAt(0,0,0),this.moon.renderOrder=-9,this.sunDisc=new ai(new Ii(4.2,20),new qr({color:`#f0a070`,fog:!1,transparent:!0,depthWrite:!1})),this.sunDisc.position.set(62,20,-84),this.sunDisc.lookAt(0,0,0),this.sunDisc.renderOrder=-9,this.scene.add(this.moon,this.sunDisc),this.buildFire(),this.buildViewModel(),this.deer.root.visible=!1,this.scene.add(this.deer.root),this.trapGhost=new ai(this.trapGeo,new qr({color:`#9fe0a0`,transparent:!0,opacity:.55,depthWrite:!1})),this.trapGhost.visible=!1,this.scene.add(this.trapGhost),this.resize()}buildFire(){let e=new ai(Qu(),this.wood);this.scene.add(e);let t=new Ri(.17,.62,4,1);t.translate(0,.31,0),this.flames=new _i(t,new qr({fog:!1,toneMapped:!1}),8),this.flames.frustumCulled=!1,this.scene.add(this.flames);let n=new Fr;n.setAttribute(`position`,new Cr(new Float32Array(108),3)),n.setAttribute(`seed`,new Cr(Array.from({length:36},()=>Math.random()),1)),this.embers=new ki(n,new wi({color:`#ffb060`,size:.07,sizeAttenuation:!0,transparent:!0,depthWrite:!1,blending:2,fog:!1,toneMapped:!1})),this.embers.frustumCulled=!1,this.scene.add(this.embers);let r=new Hi(.985,1.015,96,1);r.rotateX(-Math.PI/2),this.ring=new ai(r,new qr({color:J.ember,transparent:!0,opacity:.8,depthWrite:!1,blending:2,fog:!1,toneMapped:!1})),this.ring.position.y=.035,this.scene.add(this.ring);let i=new Fr,a=new Float32Array(450);for(let e=0;e<150;e++){let t=e/150*Math.PI*2+Math.random()*.03,n=1+(Math.random()-.5)*.04;a[e*3]=Math.cos(t)*n,a[e*3+1]=.05+Math.random()*.02,a[e*3+2]=Math.sin(t)*n}i.setAttribute(`position`,new Cr(a,3)),this.ringSparks=new ki(i,new wi({color:J.flame,size:.09,sizeAttenuation:!0,transparent:!0,depthWrite:!1,blending:2,fog:!1,toneMapped:!1})),this.ringSparks.frustumCulled=!1,this.scene.add(this.ringSparks)}buildViewModel(){let e=this.camera;this.axe=new ai(sd(),this.wood),this.axe.scale.setScalar(.72),e.add(this.axe),this.lightModel=new ai(cd(),this.wood),this.lightModel.scale.setScalar(.85),e.add(this.lightModel),this.torchModel=new Mn,this.torchModel.add(new ai(ld(),this.wood));let t=new ai(new Ri(.055,.24,4),new qr({color:`#ffb050`,fog:!1,toneMapped:!1}));t.position.y=.5,this.torchModel.add(t),e.add(this.torchModel),this.handLight.position.set(.1,-.1,0),e.add(this.handLight),this.spot.position.set(-.21,-.19,-.72),this.spot.target.position.set(-.06,-.5,-7),e.add(this.spot,this.spot.target),this.torchLight.position.set(-.3,.2,-.3),e.add(this.torchLight);let n=new Ri(1,1,16,1,!0);n.translate(0,-.5,0),n.rotateX(Math.PI/2);let r=n.getAttribute(`position`),i=new Float32Array(r.count*3);for(let e=0;e<r.count;e++)i.fill(Math.max(0,1+r.getZ(e))**2,e*3,e*3+3);n.setAttribute(`color`,new Cr(i,3)),this.beam=new ai(n,new qr({color:`#b9d2ff`,vertexColors:!0,transparent:!0,opacity:.16,depthWrite:!1,blending:2,fog:!1})),this.beam.position.set(-.21,-.19,-.72),this.beam.rotation.x=-.05,this.beam.scale.set(1,1,9),e.add(this.beam)}setForest(e){let t=this.world3d;for(let e of[...t.children]){t.remove(e);let n=e;n.geometry&&n.geometry!==this.trapGeo&&n.geometry.dispose()}this.snagMeshes=[],this.scrapMeshes=[],this.berryMeshes=[],this.tags=[],Vl(e.seed+5);let r=new Vi(112,112,84,84);r.rotateX(-Math.PI/2);let i=r.getAttribute(`position`);for(let e=0;e<i.count;e++){let t=i.getX(e)+K(-.35,.35),n=i.getZ(e)+K(-.35,.35),r=Math.hypot(t,n);i.setXYZ(e,t,r<5?K(-.02,.02):K(-.07,.07),n)}let a=new Ul;a.add(r,new rn,`#ffffff`,0);let o=new H(`#7a5c49`),s=new H(`#7f5d42`),c=new H(`#4c5448`),l=new H(`#525667`),u=new H,d=0;a.tint(0,(t,n,r,i)=>{if(d%3==0){let n={x:t,z:r},i=Math.hypot(t,r),a=Dl(n,e.paths);u.copy(G()<.5?c:l),a<2.1&&u.lerp(o,1-_d(.9,2.1,a)),i<7.5&&u.lerp(s,1-_d(5,7.5,i)),u.multiplyScalar(K(.82,1.12)),i>37&&u.multiplyScalar(.8)}d++,i.copy(u)});let f=new ai(a.build(),this.wood);t.add(f);for(let n=0;n<3;n++){let r=e.trees.filter(e=>e.variant===n),i=new _i(Uu(n),this.woodDouble,r.length);r.forEach((e,t)=>{let n=e.r/.042/e.h*.95;md.copy(q(e.x,-.05,e.z,0,e.rot,0,e.h*n,e.h,e.h*n)),i.setMatrixAt(t,md)}),i.instanceMatrix.needsUpdate=!0,i.computeBoundingSphere(),t.add(i)}for(let n=0;n<2;n++){let r=e.rocks.filter((e,t)=>t%2===n),i=new _i(Wu(n),this.wood,r.length);r.forEach((e,t)=>{md.copy(q(e.x,-.12,e.z,0,e.rot,0,e.r,e.h*.8,e.r*(.8+e.seed%10/10*.35))),i.setMatrixAt(t,md)}),i.instanceMatrix.needsUpdate=!0,i.computeBoundingSphere(),t.add(i)}let p=new _i(id(),this.woodDouble,620);Vl(e.seed+9);let m=0;for(let t=0;t<6e3&&m<620;t++){let t=G()*6.283,n=Math.sqrt(K(16,1600)),r={x:Math.cos(t)*n,z:Math.sin(t)*n};if(Dl(r,e.paths)<1.1)continue;let i=K(.7,1.7);md.copy(q(r.x,0,r.z,0,G()*6.283,0,i,i,i)),p.setMatrixAt(m++,md)}p.count=m,this.fernCount=m,p.instanceMatrix.needsUpdate=!0,p.computeBoundingSphere(),this.ferns=p,t.add(p),t.add(new ai(ud(n.world.radius+.4),this.wood));let h=(e,n,r,i=0)=>(e.position.set(n,0,r),e.rotation.y=i,t.add(e),e);h(new ai(Zu(),this.wood),e.bench.x,e.bench.z,.25),h(new ai(dd(),this.wood),e.whiteSnag.x,e.whiteSnag.z,.6),e.snags.forEach((t,n)=>{let r=n===0?e.spawn.x:0,i=n===0?e.spawn.z:0,a=Math.atan2(r-t.x,i-t.z),o=h(new ai(qu(n),this.wood),t.x,t.z,a),s=h(new ai(Ju(),this.wood),t.x,t.z,a);this.snagMeshes.push({trunk:o,stump:s})}),e.scrap.forEach((e,t)=>this.scrapMeshes.push(h(new ai($u(t),this.wood),e.x,e.z,e.rot))),e.bushes.forEach((e,t)=>{h(new ai(nd(t),this.wood),e.x,e.z,e.rot),this.berryMeshes.push(h(new ai(rd(t),this.wood),e.x,e.z,e.rot))});let g=Yu(),_=Xu();e.posts.forEach(e=>{let n=Math.atan2(e.x,e.z);h(new ai(g,this.wood),e.x,e.z,n);let r=new na({color:J.tin,emissive:`#000000`,flatShading:!0}),i=new ai(_,r);i.position.set(e.x+Math.cos(-n)*.38,1.35,e.z+Math.sin(-n)*.38),i.rotation.y=n,t.add(i),this.tags.push({mesh:i,mat:r})})}onEvent(e,t){switch(e.type){case`chopHit`:{this.chopKick=1;let n=t.forest.snags[e.node],r=t.state.player,i=r.x-n.x,a=r.z-n.z,o=Math.hypot(i,a)||1;for(let e=0;e<3;e++){let e=new ai(this.chipGeo,this.chipMat);e.position.set(n.x+i/o*.34,1.2+Math.random()*.15,n.z+a/o*.34),e.scale.setScalar(.7+Math.random()*.9),this.scene.add(e),this.chips.push({mesh:e,v:new B(i/o*1.4+(Math.random()-.5)*2.4,1.6+Math.random()*1.6,a/o*1.4+(Math.random()-.5)*2.4),life:.9})}break}case`feed`:this.feedKick=1;break;case`hit`:this.shakeT=.45,this.hitPulse=1;break;case`flare`:this.flashT=.7,this.flashPos.set(e.x,1.6,e.z);break;case`pulse`:this.flashT=.25,this.flashPos.copy(this.camera.position);break;case`deerStrike`:case`deerChime`:this.bellKick=1;break;case`deerMiss`:e.dist<2.6&&(this.shakeT=Math.max(this.shakeT,.18))}}resize(){let e=this.renderer.domElement,t=e.clientWidth||window.innerWidth,n=e.clientHeight||window.innerHeight;this.renderer.setPixelRatio(this.basePixelRatio*this.scale),this.renderer.setSize(t,n,!1),this.camera.aspect=t/n,this.camera.fov=2*Math.atan(Math.tan(85*Math.PI/360)/Math.max(this.camera.aspect,1))*180/Math.PI,this.camera.updateProjectionMatrix()}watchFrame(e){this.frameAvg=gd(this.frameAvg,e*1e3,.05),this.lowQuality||this.autoQuality&&(this.slowFor=this.frameAvg>21?this.slowFor+e:0,this.slowFor>2.5&&this.setLowQuality(!0))}setLowQuality(e,t=!1){t&&(this.autoQuality=!1),this.slowFor=0,this.lowQuality=e,this.scale=e?.75:1,this.ferns&&(this.ferns.count=Math.floor(this.fernCount*(e?.4:1))),this.resize()}get frameMs(){return this.frameAvg}update(e,t,r,i,a){this.time+=r;let o=this.time,s=e.state,c=s.player;this.watchFrame(r);let l=pd.day,u=0;s.phase===`day`?(l=pd.night,u=_d(40,60,s.t)*.9):s.phase===`night`||s.phase===`deathOffer`||s.phase===`end`?(l=pd.night,u=1):(l=pd.dawn,u=1);let d=this.titleMode;d&&(l=pd.night,u=1);let f=1-Math.exp(-r*(d?6:1.6)),p=this.cur,m=(e,t,n)=>e.lerp(hd.copy(t).lerp(n,u),f),h=pd.day;m(p.top,h.top,l.top),m(p.horizon,h.horizon,l.horizon),m(p.fog,h.fog,l.fog),m(p.hemiSky,h.hemiSky,l.hemiSky),m(p.hemiGround,h.hemiGround,l.hemiGround),m(p.sun,h.sun,l.sun),p.near=gd(p.near,gd(h.near,l.near,u),f),p.far=gd(p.far,gd(h.far,l.far,u),f),p.hemi=gd(p.hemi,gd(h.hemi,l.hemi,u),f),p.sunI=gd(p.sunI,gd(h.sunI,l.sunI,u),f),p.rim=gd(p.rim,gd(h.rim,l.rim,u),f);let g=this.scene.fog;g.color.copy(p.fog),g.near=p.near,g.far=p.far,this.skyMat.uniforms.uTop.value.copy(p.top),this.skyMat.uniforms.uHorizon.value.copy(p.horizon),this.skyMat.uniforms.uFog.value.copy(p.fog),this.hemi.color.copy(p.hemiSky),this.hemi.groundColor.copy(p.hemiGround),this.hemi.intensity=p.hemi,this.sun.color.copy(p.sun),this.sun.intensity=p.sunI;let _=d?1:s.phase===`day`?_d(46,60,s.t):+(s.phase===`night`||s.phase===`deathOffer`||s.phase===`end`);this.sun.position.set(gd(30,20,_),gd(14,30,_),gd(-40,-38,_)),this.moon.material.opacity=_,this.sunDisc.material.opacity=(1-_)*(s.phase===`draft`||s.phase===`victory`?.5:.9),this.deer.rim.value.set(`#7794a8`).multiplyScalar(p.rim);let v=s.fuel,y=e.radius,b=v/n.fire.max;this.feedKick=Math.max(0,this.feedKick-r*1.6);let x=.9+.1*Math.sin(o*13)*Math.sin(o*7.3)+this.feedKick*.35,S=v>0?s.bright?1:.38:0;this.fireLight.distance=Math.max(4,y*2.1+3),this.fireLight.intensity=S*(10+62*b)*x*gd(.55,1,_),this.fireLight.color.set(s.bright?`#ff9a48`:`#d8582e`);let C=this.flames.count;for(let e=0;e<C;e++){let t=e/C*6.283,n=e<3,r=v<=0?.001:(n?1.25:.8)*(.35+b*.95)*(s.bright?1:.5)*(.82+.3*Math.sin(o*(9+e*1.7)+e*2.1))+this.feedKick*.4,i=n?.09:.26;md.copy(q(Math.cos(t+o*.6)*i,.14,Math.sin(t+o*.6)*i,Math.sin(o*5+e)*.12,t+o,Math.cos(o*4+e)*.12,n?1.1:.85,r,n?1.1:.85)),this.flames.setMatrixAt(e,md),this.flames.setColorAt(e,hd.set(n?`#ffd27a`:e%2?`#ff8a2a`:`#f0622a`))}this.flames.instanceMatrix.needsUpdate=!0,this.flames.instanceColor&&(this.flames.instanceColor.needsUpdate=!0);let w=this.embers.geometry.getAttribute(`position`),T=this.embers.geometry.getAttribute(`seed`);for(let e=0;e<w.count;e++){let t=T.getX(e),n=(o*(.28+t*.3)+t*7)%1,r=t*40+n*2;w.setXYZ(e,Math.cos(r)*(.15+n*.5),.4+n*(1.6+b*2.2),Math.sin(r)*(.15+n*.5))}for(w.needsUpdate=!0,this.embers.material.opacity=v>0?s.bright?.9:.35:0,this.ring.visible=this.ringSparks.visible=s.bright&&y>0,this.ring.scale.set(y,1,y),this.ringSparks.scale.set(y,1,y),this.ring.material.opacity=(.3+.5*_)*(.75+.25*Math.sin(o*3.1)),this.ringSparks.material.opacity=(.35+.65*_)*(.6+.4*Math.sin(o*9.7)),this.ringSparks.rotation.y=o*.02,this.snagMeshes.forEach((e,t)=>{let n=s.snagLogs[t]>0;e.trunk.visible=n,e.stump.visible=!n,e.trunk.rotation.z=c.chopNode===t?Math.sin(o*40)*.012*this.chopKick:0}),this.scrapMeshes.forEach((e,t)=>e.visible=s.scrapLeft[t]>0),this.berryMeshes.forEach((e,t)=>e.visible=s.berryLeft[t]>0),this.tags.forEach((e,t)=>{let r=s.caches.find(e=>e.post===t),i=r?.status===`open`,a=r?.status===`pending`&&s.t>r.openAt-n.cache.cueLead,c=s.phase===`day`&&s.t>52;e.mesh.rotation.z=i||a?Math.sin(o*9+t)*.35:Math.sin(o*1.3+t)*.05;let l=i?r.revealed?1.5:.55+.45*Math.sin(o*8):a?.5:c?.18+.1*Math.sin(o*4+t):.02;e.mat.emissive.set(`#9fc4e8`).multiplyScalar(l),e.mesh.visible=r?.status!==`claimed`});this.trapMeshes.length<s.traps.length;){let e=new ai(this.trapGeo,this.wood);this.scene.add(e),this.trapMeshes.push(e)}this.trapMeshes.forEach((e,t)=>{let n=s.traps[t];e.visible=!!n,n&&e.position.set(n.x,n.arm>0?.08:0,n.z)});let E=e.trapGhost;this.trapGhost.visible=!!E&&c.trapHold>=0,E&&(this.trapGhost.position.set(E.x,.02,E.z),this.trapGhost.material.color.set(E.ok?`#a8e6a0`:`#e07a6a`));for(let e=this.chips.length-1;e>=0;e--){let t=this.chips[e];t.life-=r,t.v.y-=9.8*r,t.mesh.position.addScaledVector(t.v,r),t.mesh.rotation.x+=r*9,t.mesh.rotation.z+=r*7,t.mesh.position.y<.03&&(t.mesh.position.y=.03,t.v.set(0,0,0)),t.life<=0&&(this.scene.remove(t.mesh),this.chips.splice(e,1))}let D=gd(e.prev.px,c.x,t),O=gd(e.prev.pz,c.z,t),k=Math.hypot(c.x-e.prev.px,c.z-e.prev.pz)*30;this.bob+=r*k*1.9;let A=Math.sin(this.bob)*.035*Math.min(1,k/4);this.shakeT=Math.max(0,this.shakeT-r);let j=this.settings.shake?this.shakeT*.16:0,M=e.forest.posts[0],ee=Math.atan2(M.z,M.x);if(d){let e=ee+Math.PI+.55+Math.sin(o*.11)*.22;this.camera.position.set(Math.cos(e)*3.4,1.75,Math.sin(e)*3.4),this.camera.lookAt(Math.cos(ee-.5)*6,1.9,Math.sin(ee-.5)*6)}else this.camera.position.set(D+(Math.random()-.5)*j,n.world.eyeHeight+A+(Math.random()-.5)*j,O+(Math.random()-.5)*j),this.camera.rotation.set(a,i,Math.sin(this.bob*.5)*.006*Math.min(1,k/4)+(this.settings.shake?this.shakeT*.1*Math.sin(o*50):0),`YXZ`);this.hitPulse=Math.max(0,this.hitPulse-r*1.8),this.chopKick=Math.max(0,this.chopKick-r*3.2);let te=c.chop>0?Math.sin(Math.min(1,c.chop%.5/.5*1.15)*Math.PI):0,ne=Math.sin(this.bob)*.012;this.axe.position.set(.42-te*.26+ne,-.2+Math.abs(Math.cos(this.bob))*.012+te*.06,-.78-te*.06),this.axe.rotation.set(-.22-te*.9,.42+te*.3,-.16+te*.8);let re=c.lightOn&&!d;this.axe.visible=!d,this.lightModel.visible=re,this.lightModel.position.set(-.24+ne,-.2,-.55),this.lightModel.rotation.set(.06,-.22,0),this.torchModel.visible=c.torch>0&&!d,this.torchModel.position.set(-.34+ne,-.3,-.5),this.torchModel.rotation.set(.1,0,.12),this.torchModel.children[1].scale.setScalar(.85+.25*Math.sin(o*17)),this.spot.distance=e.mods.beamRange*1.25,this.spot.intensity=re?46*(.5+.5*Math.min(1,c.battery/12)):0,this.beam.visible=re&&_>.3,this.torchLight.intensity=c.torch>0?9*(.85+.15*Math.sin(o*15)):0,this.handLight.intensity=.2+.5*_,this.flashT=Math.max(0,this.flashT-r),this.flashLight.intensity=this.flashT>0?420*(this.flashT/.7):0,this.flashLight.position.copy(this.flashPos);let ie=s.deer,ae=this.deer;if(ae.root.visible=ie.mode!==`hidden`&&s.phase!==`day`&&s.phase!==`draft`&&s.phase!==`victory`,d){ae.root.visible=!0;let e=Math.max(y,4)+2.6;ae.root.position.set(Math.cos(ee)*e,0,Math.sin(ee)*e),ae.root.rotation.y=Math.atan2(-Math.cos(ee),-Math.sin(ee))+Math.sin(o*.3)*.15;let t=this.pose;t.stage=0,t.gait=0,t.crouch=.12+.06*Math.sin(o*.7),t.swing=0,t.stun=0,t.hop=0,t.bell=Math.sin(o*1.7)*.12,ae.setStage(0),ae.apply(t)}else if(ae.root.visible){let i=gd(e.prev.dx,ie.x,t),a=gd(e.prev.dz,ie.z,t),s=Math.hypot(ie.x-e.prev.dx,ie.z-e.prev.dz)*30,c=(Math.PI/2-ie.heading-this.deerYaw+Math.PI)%(Math.PI*2)-Math.PI;c<-Math.PI&&(c+=Math.PI*2),this.deerYaw+=c*Math.min(1,r*9),ae.root.position.set(i,0,a),ae.root.rotation.y=this.deerYaw;let l=this.pose,u=(e,t,n)=>e+(t-e)*Math.min(1,r*n);l.stage=e.stage,l.walk+=r*s*1.55,l.gait=u(l.gait,Math.min(1,s/4.4),8);let d=ie.mode===`cue`;l.crouch=u(l.crouch,d?1:ie.mode===`swing`?.75:ie.mode===`lunge`?.8:ie.mode===`hunt`?.22:ie.mode===`feint`?.12:0,d?10:7),l.swing=ie.mode===`swing`?Math.min(1,ie.timer/n.deer.swingSeconds):u(l.swing,0,8),l.stun=u(l.stun,+(ie.mode===`stunned`),7);let f=ie.mode===`feint`&&e.stage>=1?_d(0,.2,ie.timer)*(1-_d(1,1.2,ie.timer))*2:0;l.hop=u(l.hop,f,14),this.bellKick=Math.max(0,this.bellKick-r*2.2),l.bell=Math.sin(o*16)*.5*this.bellKick,ae.setStage(e.stage),ae.apply(l)}this.renderer.render(this.scene,this.camera)}get info(){return{calls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles}}},yd=[`common`,`rare`,`epic`];function bd(e,t){let i=e.state,a=i.player;return r.filter(e=>t.includes(e.id)?!1:e.kind===`passive`?!i.cards.includes(e.id):i.supplyRest.includes(e.id)?!1:e.id===`C07`?a.logs<n.limits.logs:e.id!==`C08`||a.scrap<n.limits.scrap)}function xd(e,t){if(!t.length)return null;let r=yd.filter(e=>t.some(t=>t.rarity===e)),i=r.reduce((e,t)=>e+n.draft.weights[t],0),a=e.rngCards.next()*i,o=r[r.length-1];for(let e of r)if(a-=n.draft.weights[e],a<0){o=e;break}return e.rngCards.pick(t.filter(e=>e.rarity===o))}function Sd(e,t){let n=e.state,r=[],i=bd(e,t);for(let t=0;t<3;t++){let a=t===0&&n.lastTag?i.filter(e=>e.tag===n.lastTag):[],o=xd(e,a.length?a:i);if(!o)break;r.push(o.id),i=i.filter(e=>e.id!==o.id)}return r}function Cd(e,t){let r=e.state;if(r.phase!==`draft`||!r.hand||r.pendingCard)return`invalid`;let a=r.hand[t],o=a?i[a]:void 0;if(!o)return`invalid`;if(r.supplyRest=[],o.kind===`supply`){let e=r.player;return a===`C07`&&(e.logs=Math.min(n.limits.logs,e.logs+2)),a===`C08`&&(e.scrap=Math.min(n.limits.scrap,e.scrap+2)),r.supplyRest=[a],r.hand=[],`done`}return r.cards.length>=n.draft.slots?(r.pendingCard=a,`needReplace`):(r.cards.push(a),r.lastTag=o.tag,r.hand=[],e.refreshMods(),`done`)}function wd(e,t){let n=e.state;return n.phase!==`draft`||!n.pendingCard||t>=n.cards.length?!1:(n.hand=[],t>=0&&(n.cards[t]=n.pendingCard,n.lastTag=i[n.pendingCard].tag,e.refreshMods()),n.pendingCard=null,!0)}function Td(e){let t=e.state;return t.phase!==`draft`||t.pendingCard||!t.hand?.length?!1:(t.supplyRest=[],t.hand=[],!0)}function Ed(e){let t=e.state;return t.phase===`draft`&&!!t.hand?.length&&!t.pendingCard&&t.stats.nightsSurvived>=2&&t.rerollChapter!==e.chapterOf(t.night)&&t.player.scrap>=n.reroll.scrap}function Dd(e){let t=e.state;return Ed(e)?(t.player.scrap-=n.reroll.scrap,t.rerollChapter=e.chapterOf(t.night),t.hand=Sd(e,t.hand??[]),e.syncRng(),!0):!1}var Od=()=>({mx:0,mz:0,sprint:!1,yaw:0,pitch:0,chop:!1,trapHold:!1,interact:!1,eat:!1,light:!1,pulse:!1,torch:!1,flare:!1,craft:0});function kd(e){let t=t=>e.includes(t);return{fuelPerLog:t(`C01`)?24:n.fire.fuelPerLog,chopSeconds:t(`C02`)?1.5:n.player.chopSeconds,beamDrain:t(`C03`)?1:n.flashlight.drain,sprintCost:t(`C04`)?12:n.player.sprintCost,trapStun:t(`C05`)?4:n.trap.stun,berryHp:t(`C06`)?28:n.player.berryHp,berryStamina:t(`C06`)?35:n.player.berryStamina,radiusMult:t(`R01`)?1.2:1,trapCost:t(`R02`)?1:n.trap.cost,pulse:t(`R03`),sprint:t(`R04`)?7:n.player.sprint,beamRange:t(`R05`)?20:n.flashlight.range,revealSeconds:t(`R05`)?.5:n.flashlight.revealSeconds,torchSeconds:t(`R06`)?27:n.torch.seconds,hearStep:t(`R07`)?3:n.deer.hearStep,hearRun:t(`R07`)?6:n.deer.hearRun,ember:t(`E01`),autoTrap:t(`E02`),dynamo:t(`E03`),flareRadius:t(`E04`)?6:n.flare.radius,flareStun:t(`E04`)?2.5:n.flare.stun}}var Ad=n.deer,jd=Math.PI*2,Md=1.7;function Nd(){return{mode:`hidden`,x:0,z:-24,heading:0,threat:0,timer:0,appear:0,orbitDir:1,orbitTimer:7,patrolAngle:0,lastKnown:null,lostT:0,swingDirX:0,swingDirZ:0,sinceSwing:9,stunLeft:0,secondCue:!1,maneuver:`none`,maneuverUsed:!1,sinceManeuver:9,chargeX:0,chargeZ:0,chargeLeft:0,detour:null,path:[],repath:0,goalX:0,goalZ:0,nearMiss:99,search:null}}function Pd(e,t){let n=e.state.deer;n.mode=t,n.timer=0}function Fd(e,t,n=1){let r=(Math.atan2(t.z-e.z,t.x-e.x)-e.heading+Math.PI)%jd-Math.PI;r<-Math.PI&&(r+=jd),e.heading+=r*Math.min(1,n)}function Id(e){let t=e.state.deer,n=e.state.player,r=wl(t,n);return r<=n.noise||r<=Ad.sight&&Ol(e.forest.obstacles,t,n)}function Ld(e,n,r){let i=e.state.deer,a=e.forest.nav,o=e.radius+.3,s=e.state.bright&&Math.hypot(n.x,n.z)>o?o:0,c=n;if(a.segmentFree(i,n,s))i.path.length=0;else{i.repath-=t;let e=Math.hypot(n.x-i.goalX,n.z-i.goalZ);for((i.repath<=0||e>1.5||i.path.length===0)&&(i.path=a.findPath(i,n,s)??[],i.repath=.25,i.goalX=n.x,i.goalZ=n.z);i.path.length>1&&wl(i,i.path[0])<.6;)i.path.shift();i.path.length&&(c=i.path[0])}let l=c.x-i.x,u=c.z-i.z,d=Math.hypot(l,u);if(d<.05)return wl(i,n);let f=Math.min(d,r*t);return i.x+=l/d*f,i.z+=u/d*f,Fd(i,c,.25),Rd(e),wl(i,n)}function Rd(e){let t=e.state.deer;Al(e.forest.obstacles,t,Ad.radius*.8,n.world.radius-1),zd(e)}function zd(e){let t=e.state.deer;if(e.state.bright){let n=e.radius+.4,r=Math.hypot(t.x,t.z);r<n&&r>.001&&(t.x*=n/r,t.z*=n/r)}}function Bd(e){if(e.state.deer.sinceManeuver<Ad.maneuverGap)return`none`;let t=e.stage,n=[];return t>=2&&e.state.traps.length&&n.push(`trapSense`),t>=3&&n.push(`decoyChime`),t>=4&&n.push(`straightCharge`),t>=5&&n.push(`secondLunge`),n.length?e.rngThreat.pick(n):`none`}function Vd(e,t){let n=e.state,r=n.deer,i=n.player;Pd(e,`cue`),r.secondCue=t;let a=Id(e)?i:r.lastKnown??i;if(Fd(r,a),!t){r.maneuver=Bd(e),r.maneuverUsed=!1,r.detour=null,r.search=null,r.lostT=0;let t=wl(r,a)||1;if(r.chargeX=(a.x-r.x)/t,r.chargeZ=(a.z-r.z)/t,r.maneuver===`decoyChime`){let t=e.rngThreat.sign();e.emit({type:`deerChime`,x:r.x-r.chargeZ*6*t,z:r.z+r.chargeX*6*t,decoy:!0}),r.maneuverUsed=!0,r.sinceManeuver=0}}e.emit({type:`deerCue`,x:r.x,z:r.z,second:t}),e.emit({type:`deerStrike`,x:r.x,z:r.z})}function Hd(e){let t=e.state.deer;Pd(e,`retreat`),t.threat=0,t.path.length=0,t.detour=null,t.chargeLeft=0,e.emit({type:`deerRetreat`})}function Ud(e,t,n){let r=e.state.deer;return r.mode===`hidden`||r.mode===`stunned`||r.mode===`retreat`?!1:(Pd(e,`stunned`),r.stunLeft=t,r.threat=0,r.chargeLeft=0,e.emit({type:`deerStunned`,by:n}),!0)}function Wd(e){let n=e.state,r=n.deer,i=n.player;if(r.mode===`hidden`)return;let a=n.night,o=e.playerProtected,s=!o;r.timer+=t,r.sinceSwing+=t,r.sinceManeuver+=t,r.appear=Math.min(1,n.t/Ad.appearSeconds),r.threat=r.mode===`stunned`||r.mode===`retreat`?0:o?Math.max(0,r.threat-Ad.threatDecay*t):Math.min(100,r.threat+l(a)*(i.torch>0?.5:1)*t);let c=Id(e);c?(r.lastKnown={x:i.x,z:i.z},r.lostT=0):r.lostT+=t;let d=r.threat>=Ad.threatTrigger&&s,f=r.x,p=r.z;switch(r.mode){case`patrol`:r.patrolAngle+=r.orbitDir*Ad.walk*t/22,Ld(e,{x:Math.cos(r.patrolAngle)*22,z:Math.sin(r.patrolAngle)*22},Ad.walk),d&&n.t>=Ad.appearSeconds?Vd(e,!1):(r.timer>=Ad.patrolSeconds||c&&n.t>=Ad.appearSeconds)&&(Pd(e,`stalk`),r.orbitTimer=e.rngThreat.range(6,10));break;case`stalk`:{let n=Math.max(e.radius,5.5)+2.8,a=Math.atan2(r.z,r.x)+r.orbitDir*1.4/n,o=Math.hypot(r.x,r.z);Ld(e,{x:Math.cos(a)*n,z:Math.sin(a)*n},Math.abs(o-n)>3?Ad.stalkSpeed*1.5:Ad.stalkSpeed),i.noise>0&&wl(r,i)<=i.noise&&Fd(r,i,.1),r.orbitTimer-=t,d?Vd(e,!1):r.orbitTimer<=0&&(Pd(e,`feint`),Fd(r,i),e.emit({type:`deerChime`,x:r.x,z:r.z,decoy:!1}));break}case`feint`:Fd(r,i,.2),d?Vd(e,!1):r.timer>=Ad.cueSeconds&&(Pd(e,`stalk`),r.orbitDir=-r.orbitDir,r.orbitTimer=e.rngThreat.range(6,10));break;case`cue`:if((r.maneuver!==`straightCharge`||r.secondCue)&&Fd(r,c?i:r.lastKnown??i,.2),r.timer-.03333333333333333<.45&&r.timer>=.45&&e.emit({type:`deerStrike`,x:r.x,z:r.z}),o)Hd(e);else if(r.timer>=Ad.cueSeconds){if(r.secondCue){Pd(e,`lunge`);let t=wl(r,i)||1;r.chargeX=(i.x-r.x)/t,r.chargeZ=(i.z-r.z)/t,r.chargeLeft=.5}else Pd(e,`hunt`),n.stats.hunts++,e.emit({type:`deerHunt`}),r.maneuver===`straightCharge`&&(r.chargeLeft=Ad.chargeSeconds,r.maneuverUsed=!0,r.sinceManeuver=0)}break;case`hunt`:if(o){Hd(e);break}if(r.chargeLeft>0)r.chargeLeft-=t,r.x+=r.chargeX*Ad.chargeSpeed*t,r.z+=r.chargeZ*Ad.chargeSpeed*t,r.heading=Math.atan2(r.chargeZ,r.chargeX),Rd(e);else{if(r.maneuver===`trapSense`&&!r.maneuverUsed)for(let t of n.traps){if(t.arm>0)continue;let n=wl(r,t);if(n>4||n<.9||((t.x-r.x)*Math.cos(r.heading)+(t.z-r.z)*Math.sin(r.heading))/n<.9)continue;r.maneuverUsed=!0,r.sinceManeuver=0;let a=-(t.z-r.z)/n,o=(t.x-r.x)/n,s={x:t.x+a*3,z:t.z+o*3},c={x:t.x-a*3,z:t.z-o*3},l=e.forest.nav.segmentFree(r,s),u=e.forest.nav.segmentFree(r,c);(l||u)&&(r.detour=l&&(!u||wl(s,i)<=wl(c,i))?s:c);break}let t,o=!1;if(r.detour)t=r.detour,wl(r,r.detour)<.9&&(r.detour=null);else if(c)t=i;else if(r.lastKnown)t=r.lastKnown;else{for(o=!0,r.search||=Gd(e);r.search.length&&wl(r,e.forest.posts[r.search[0]])<2.2;)r.search.shift();if(!r.search.length){Hd(e);break}t=e.forest.posts[r.search[0]]}let s=c&&!r.detour&&wl(r,i)<=Md;s&&Fd(r,i,.3);let l=s?wl(r,i):Ld(e,t,u(a));if(!c&&!o&&r.lostT>=Ad.lostSeconds&&(l<1.2||r.lostT>=9)){Hd(e);break}}c&&wl(r,i)<=Ad.swingRange&&r.sinceSwing>=Ad.swingGap&&r.chargeLeft<=0&&Kd(e);break;case`lunge`:if(o){Hd(e);break}r.chargeLeft>0&&wl(r,i)>Md?(r.chargeLeft-=t,r.x+=r.chargeX*Ad.chargeSpeed*t,r.z+=r.chargeZ*Ad.chargeSpeed*t,r.heading=Math.atan2(r.chargeZ,r.chargeX),Rd(e)):r.sinceSwing>=Ad.swingGap&&Kd(e);break;case`swing`:break;case`recover`:r.timer>=Ad.recoverSeconds&&(o?Hd(e):Pd(e,`hunt`));break;case`stunned`:r.stunLeft-=t,r.stunLeft<=0&&Hd(e);break;case`retreat`:{let t=Math.hypot(r.x,r.z)||1;Ld(e,{x:r.x/t*24,z:r.z/t*24},Ad.stalkSpeed*1.4),r.timer>=Ad.retreatSeconds&&(Pd(e,`patrol`),r.patrolAngle=Math.atan2(r.z,r.x),r.orbitDir=e.rngThreat.sign(),r.lastKnown=null);break}}if(zd(e),Math.hypot(r.x-f,r.z-p)>.01){let t=r.mode===`hunt`||r.mode===`lunge`?.36:.62;Math.floor((r.timer-.03333333333333333)/t)!==Math.floor(r.timer/t)&&e.emit({type:`deerStep`,x:r.x,z:r.z,run:t<.5})}}function Gd(e){let t=e.state.deer,n=e.state.caches.find(e=>e.status===`open`)?.post;return e.forest.posts.map((e,t)=>t).sort((r,i)=>r===n?-1:i===n?1:wl(e.forest.posts[r],t)-wl(e.forest.posts[i],t))}function Kd(e){let t=e.state.deer,n=e.state.player;Pd(e,`swing`);let r=wl(t,n)||1;t.swingDirX=(n.x-t.x)/r,t.swingDirZ=(n.z-t.z)/r,t.heading=Math.atan2(t.swingDirZ,t.swingDirX),t.sinceSwing=0,e.emit({type:`deerSwing`,x:t.x,z:t.z})}function qd(e){let t=e.state,n=t.deer,r=t.player;if(n.mode!==`swing`)return;if(e.playerProtected){Hd(e);return}if(n.timer<Ad.swingSeconds)return;let i=r.x-n.x,a=r.z-n.z,o=Math.hypot(i,a),s=(o<.01?1:(i*n.swingDirX+a*n.swingDirZ)/o)>=Math.cos(Ad.swingArcDeg/2*Math.PI/180);if(o<=Ad.swingRange&&s&&Ol(e.forest.obstacles,n,r)&&r.invuln<=0){if(e.damagePlayer(Ad.damage),t.phase!==`night`)return;Pd(e,n.secondCue?`recover`:`hunt`),n.secondCue=!1}else n.nearMiss=Math.min(n.nearMiss,o),e.emit({type:`deerMiss`,dist:o}),n.secondCue?(n.secondCue=!1,Pd(e,`recover`)):n.maneuver===`secondLunge`&&!n.maneuverUsed?(n.maneuverUsed=!0,n.sinceManeuver=0,Vd(e,!0)):Pd(e,`hunt`)}var Jd=n.player,Yd=1,Xd=(e,t,n)=>Math.max(t,Math.min(n,e)),Zd=1e-6,Qd=e=>({x:-Math.sin(e),z:-Math.cos(e)}),$d=class e{state;forest;mods;events=[];focus=null;trapGhost=null;prev={px:0,pz:0,dx:0,dz:0,dh:0};rngLoot;rngThreat;rngCards;constructor(e){this.state=e,this.forest=zl(e.seed),this.mods=kd(e.cards),this.rngLoot=new xl(e.rng.loot),this.rngThreat=new xl(e.rng.threat),this.rngCards=new xl(e.rng.cards),this.snapPrev()}static start(t){let r=t.seed>>>0,i=zl(r),a=Xd(Math.floor(t.night??1),1,n.cycle.lastNight),o={runId:`${r.toString(36)}-${Date.now().toString(36)}`,revision:0,seed:r,genVersion:1,contentVersion:1,phase:`day`,night:a,t:0,tick:0,dayStarted:!1,player:{x:i.spawn.x,z:i.spawn.z,yaw:i.spawn.yaw,pitch:-.2,hp:Jd.hpMax,stamina:Jd.staminaMax,exhausted:!1,sinceSprint:9,sprinting:!1,battery:n.flashlight.max,lightOn:!1,torch:0,invuln:0,shield:0,pulseCd:0,logs:0,scrap:0,berries:0,traps:+!!t.bonusTrap,flares:1,tags:0,chop:0,chopNode:-1,pick:0,pickKind:``,pickNode:-1,eat:0,trapHold:0,bench:!1,craft:0,craftT:0,dynamoDist:0,dynamoDay:0,noise:0},fuel:n.fire.start,bright:!0,emberUsed:!1,deer:Nd(),snagLogs:i.snags.map(()=>2),scrapLeft:i.scrap.map(()=>2),berryLeft:i.bushes.map(()=>1),traps:[],nextTrapId:1,caches:[],cards:[],hand:null,pendingCard:null,lastTag:null,supplyRest:[],rerollChapter:0,reviveUsed:!1,deathReason:``,fedOnce:!1,choppedOnce:!1,stats:{nightsSurvived:0,tagsBanked:0,cachesClaimed:0,hunts:0,logsChopped:0,feeds:0,activeSeconds:0,seals:[]},rng:{loot:Sl(r,`loot`),threat:Sl(r,`threat`),cards:Sl(r,`cards`)}};return new e(o)}get stage(){return o(this.state.night)}get radius(){return c(this.state.fuel,this.mods.radiusMult)}isProtected(e){return this.state.bright&&Math.hypot(e.x,e.z)<=this.radius}get playerProtected(){return this.state.player.shield>0||this.isProtected(this.state.player)}chapterOf(e){return Math.floor((e-1)/3)+1}emit(e){this.events.push(e)}drainEvents(){let e=this.events;return this.events=[],e}snapPrev(){let e=this.state;this.prev.px=e.player.x,this.prev.pz=e.player.z,this.prev.dx=e.deer.x,this.prev.dz=e.deer.z,this.prev.dh=e.deer.heading}syncRng(){this.state.rng={loot:this.rngLoot.state,threat:this.rngThreat.state,cards:this.rngCards.state}}refreshMods(){this.mods=kd(this.state.cards)}step(e){let r=this.state;if(r.phase!==`day`&&r.phase!==`night`)return;let i=r.player;this.snapPrev(),i.yaw=e.yaw,i.pitch=e.pitch;let a=e.mx!==0||e.mz!==0||e.chop||e.interact||e.trapHold||e.eat||e.torch||e.flare||e.light;if(!r.dayStarted){if(!a){this.updateFocus();return}r.dayStarted=!0}if(r.tick++,r.t+=t,r.stats.activeSeconds+=t,r.phase===`day`&&r.t>=n.cycle.daySeconds-Zd)this.beginNight();else if(r.phase===`night`&&r.t>=n.cycle.nightSeconds-Zd){this.beginDawn();return}if(r.phase===`day`){let e=r.t-t;if(e<43&&r.t>=43&&this.emit({type:`dusk`}),e<55&&r.t>=55){let e=Math.atan2(-i.z,-i.x)+.3;this.emit({type:`duskStep`,x:Math.cos(e)*22,z:Math.sin(e)*22})}}let o=this.stepPlayer(e);if(this.stepFire(o),r.phase===`night`)this.stepCaches(),Wd(this),this.stepTraps(),qd(this);else for(let e of r.traps)e.arm>0&&(e.arm-=t);this.updateFocus()}stepPlayer(e){let r=this.state,i=r.player,a=this.mods,o=0;i.noise=0,i.invuln=Math.max(0,i.invuln-t),i.shield=Math.max(0,i.shield-t),i.pulseCd=Math.max(0,i.pulseCd-t),this.updateFocus();let s=this.focus,c=!1;if(e.chop&&s&&s.kind===`snag`&&s.usable&&!i.bench){i.chopNode!==s.id&&(i.chopNode=s.id,i.chop=0),c=!0;let e=i.chop;if(i.chop+=t,i.noise=n.deer.hearChop,(Math.floor(e/.5)!==Math.floor(i.chop/.5)||e===0)&&this.emit({type:`chopHit`,node:s.id}),i.chop>=a.chopSeconds){let e=Math.min(r.snagLogs[s.id],n.limits.logs-i.logs);r.snagLogs[s.id]-=e,i.logs+=e,r.stats.logsChopped+=e,r.choppedOnce=!0,i.chop=0,i.chopNode=-1,this.emit({type:`chopDone`,node:s.id,logs:e})}}else i.chop=0,i.chopNode=-1;let l=e.mx,u=e.mz,d=Math.hypot(l,u),f=d>.01&&!c;d>1&&(l/=d,u/=d);let p=e.sprint&&f&&!i.exhausted&&i.stamina>0;if(i.sprinting=p,p?(i.stamina=Math.max(0,i.stamina-a.sprintCost*t),i.sinceSprint=0,i.stamina<=0&&(i.exhausted=!0)):(i.sinceSprint+=t,i.sinceSprint>=Jd.staminaRegenDelay&&(i.stamina=Math.min(Jd.staminaMax,i.stamina+Jd.staminaRegen*t)),i.exhausted&&i.stamina>=Jd.staminaUnlock&&(i.exhausted=!1)),f){let e=p?a.sprint:Jd.walk,o=Qd(i.yaw),s=-o.z,c=o.x,d=i.x,f=i.z;i.x+=(o.x*u+s*l)*e*t,i.z+=(o.z*u+c*l)*e*t;let m=r.deer;if(r.phase===`night`&&m.mode!==`hidden`){let e=i.x-m.x,t=i.z-m.z,r=Math.hypot(e,t),a=n.deer.radius+n.world.playerRadius;r<a&&r>1e-4&&(i.x=m.x+e/r*a,i.z=m.z+t/r*a)}Al(this.forest.obstacles,i,n.world.playerRadius,n.world.radius-.6);let h=Math.hypot(i.x-d,i.z-f);if(i.noise=Math.max(i.noise,p?a.hearRun:a.hearStep),a.dynamo&&r.phase===`day`&&i.dynamoDay<25)for(i.dynamoDist+=h;i.dynamoDist>=4&&i.dynamoDay<25;)i.dynamoDist-=4,i.dynamoDay++,i.battery=Math.min(n.flashlight.max,i.battery+1)}if(i.torch>0&&(i.torch=Math.max(0,i.torch-t),i.lightOn=!1),e.light&&i.torch<=0&&(i.battery>0?(i.lightOn=!i.lightOn,this.emit({type:`light`,on:i.lightOn})):this.emit({type:`denied`,why:`battery`})),i.lightOn&&(i.battery=Math.max(0,i.battery-a.beamDrain*t),i.battery<=0&&(i.lightOn=!1,this.emit({type:`light`,on:!1}))),e.torch&&i.torch<=0&&(i.logs>0?(i.logs--,i.torch=a.torchSeconds,i.lightOn=!1,this.emit({type:`torch`})):this.emit({type:`denied`,why:`logs`})),e.pulse&&a.pulse){if(i.lightOn&&i.pulseCd<=0&&i.battery>=n.pulse.cost){i.battery-=n.pulse.cost,i.pulseCd=n.pulse.cooldown;let e=this.inBeam(r.deer)&&Ud(this,n.pulse.stun,`pulse`);this.emit({type:`pulse`,hit:e})}else this.emit({type:`denied`,why:`pulse`})}if(i.eat>0?(i.eat+=t,i.eat>=Jd.eatSeconds&&(i.eat=0,i.berries--,i.hp=Math.min(Jd.hpMax,i.hp+a.berryHp),i.stamina=Math.min(Jd.staminaMax,i.stamina+a.berryStamina),i.stamina>=Jd.staminaUnlock&&(i.exhausted=!1),this.emit({type:`eat`}))):e.eat&&(i.berries>0?i.eat=t:this.emit({type:`denied`,why:`berries`})),i.pick>0){let e=i.pickKind===`scrap`?this.forest.scrap[i.pickNode]:this.forest.bushes[i.pickNode];if(!e||wl(i,e)>Jd.reach+.8)i.pick=0;else if(i.pick+=t,i.pick>=Jd.pickupSeconds){if(i.pick=0,i.pickKind===`scrap`){let e=Math.min(r.scrapLeft[i.pickNode],n.limits.scrap-i.scrap);r.scrapLeft[i.pickNode]-=e,i.scrap+=e,this.emit({type:`pickup`,kind:`scrap`,n:e})}else{let e=Math.min(r.berryLeft[i.pickNode],n.limits.berries-i.berries);r.berryLeft[i.pickNode]-=e,i.berries+=e,this.emit({type:`pickup`,kind:`berry`,n:e})}}}if(i.bench){if(wl(i,this.forest.bench)>n.bench.leave+.6)this.closeBench();else if(i.craft){i.craftT+=t;let e=i.craft===3?n.recharge.seconds:n.trap.craftSeconds;i.craftT>=e&&this.finishCraft()}else e.craft&&this.startCraft(e.craft)}if(e.interact){if(i.bench)this.closeBench();else if(s&&s.usable){if(s.kind===`fire`){let e=Math.min(a.fuelPerLog,n.fire.max-r.fuel);i.logs>0&&e>=Yd&&(i.logs--,o+=e,r.fedOnce=!0,r.stats.feeds++,this.emit({type:`feed`,gain:e,relit:r.fuel<=0}))}else s.kind===`scrap`||s.kind===`bush`?(i.pick=t,i.pickKind=s.kind,i.pickNode=s.id):s.kind===`cache`?this.claimCache(s.id):s.kind===`bench`&&(i.bench=!0,i.craft=0,this.emit({type:`bench`,open:!0}))}else s&&this.emit({type:`denied`,why:s.info})}if(this.trapGhost=null,e.trapHold&&!i.bench&&!c){let e=Qd(i.yaw),o=Xd(1.2+Math.max(0,-i.pitch)*2.2,1.2,n.trap.placeRange),s={x:i.x+e.x*o,z:i.z+e.z*o},c=i.traps>0||i.scrap>=a.trapCost,l=this.forest.nav.walkable(s)&&Math.hypot(s.x,s.z)>1.6&&r.traps.every(e=>wl(e,s)>1.2)&&this.forest.obstacles.every(e=>wl(e,s)>e.r+.35),u=c&&l&&r.traps.length<n.limits.placedTraps;this.trapGhost={...s,ok:u},u?(i.trapHold+=t,i.trapHold>=n.trap.placeSeconds&&(i.traps>0?i.traps--:i.scrap-=a.trapCost,r.traps.push({id:r.nextTrapId++,x:s.x,z:s.z,arm:n.trap.armSeconds}),i.trapHold=-99,this.emit({type:`trapPlaced`,x:s.x,z:s.z}))):i.trapHold>=0&&(i.trapHold=0)}else i.trapHold=0;if(e.flare){if(i.flares>0){i.flares--;let e=Qd(i.yaw),t=Math.cos(i.pitch),o=n.flare.range;i.pitch<-.02&&(o=Math.min(o,n.world.eyeHeight/Math.tan(-i.pitch))),o=Math.min(o,kl(this.forest.obstacles,i,e,o/Math.max(t,.2)));let s=r.deer;if(s.mode!==`hidden`){let t=(s.x-i.x)*e.x+(s.z-i.z)*e.z,n=Math.hypot(i.x+e.x*t-s.x,i.z+e.z*t-s.z);t>0&&t<o&&n<.7&&(o=Math.max(.5,t-.6))}let c={x:i.x+e.x*o,z:i.z+e.z*o},l=wl(c,s)<=a.flareRadius&&Ol(this.forest.obstacles,c,s)&&Ud(this,a.flareStun,`flare`);this.emit({type:`flare`,x:c.x,z:c.z,hit:l})}else this.emit({type:`denied`,why:`flares`})}if(i.tags>0&&Math.hypot(i.x,i.z)<=n.fire.bankRadius+.85){let e=this.chapterOf(r.night),t=0;r.stats.seals.includes(e)||(r.stats.seals.push(e),t=e),r.stats.tagsBanked+=i.tags,this.emit({type:`tagsBanked`,n:i.tags,seal:t}),i.tags=0}return o}closeBench(){let e=this.state.player;e.bench&&(e.bench=!1,e.craft=0,e.craftT=0,this.emit({type:`bench`,open:!1}))}canCraft(e){let t=this.state.player;return e===1?t.scrap>=this.mods.trapCost&&t.traps<n.limits.traps:e===2?t.scrap>=n.flare.cost&&t.flares<n.limits.flares:e===3&&t.scrap>=n.recharge.cost&&t.battery<n.flashlight.max}startCraft(e){this.canCraft(e)?(this.state.player.craft=e,this.state.player.craftT=0):this.emit({type:`denied`,why:`craft`})}finishCraft(){let e=this.state.player,t=e.craft;e.craft=0,e.craftT=0,this.canCraft(t)&&(t===1?(e.scrap-=this.mods.trapCost,e.traps++):t===2?(e.scrap-=n.flare.cost,e.flares++):(e.scrap-=n.recharge.cost,e.battery=Math.min(n.flashlight.max,e.battery+n.recharge.amount)),this.emit({type:`craft`,recipe:t}))}inBeam(e,t=0){let r=this.state.player;if(!r.lightOn)return!1;let i=wl(r,e);if(i>this.mods.beamRange||i<.01)return!1;let a=Qd(r.yaw),o=((e.x-r.x)*a.x+(e.z-r.z)*a.z)/i,s=(n.flashlight.coneDeg/2+t)*Math.PI/180;return o>=Math.cos(s)&&Ol(this.forest.obstacles,r,e)}stepFire(e){let r=this.state,i=n.fire,a=r.fuel;r.fuel=Xd(r.fuel-s(r.phase===`night`?`night`:`day`,r.night)*t+e,0,i.max),this.mods.ember&&r.phase===`night`&&!r.emberUsed&&a>i.weakAt&&r.fuel<=i.weakAt&&(r.emberUsed=!0,r.fuel=Math.min(i.max,r.fuel+14),this.emit({type:`ember`})),r.bright&&r.fuel<=i.weakAt?(r.bright=!1,this.emit({type:`fireWeak`})):!r.bright&&r.fuel>=i.brightAt&&(r.bright=!0,this.emit({type:`fireBright`}))}stepCaches(){let e=this.state;e.player;for(let r of e.caches){let i=this.forest.posts[r.post],a=e.t-t;r.status===`pending`&&(a<r.openAt-n.cache.cueLead&&e.t>=r.openAt-n.cache.cueLead&&this.emit({type:`cacheCue`,post:r.post}),e.t>=r.openAt&&(r.status=`open`,this.emit({type:`cacheOpen`,post:r.post}))),r.status===`open`&&(!r.revealed&&this.inBeam(i)&&(r.reveal+=t,r.reveal>=this.mods.revealSeconds&&(r.revealed=!0,this.emit({type:`cacheRevealed`,post:r.post}))),e.t>=r.openAt+n.cache.openSeconds&&(r.status=`closed`,this.emit({type:`cacheClosed`,post:r.post})))}}claimCache(e){let t=this.state,r=t.player,i=t.caches.find(t=>t.post===e&&t.status===`open`&&t.revealed);i&&(i.status=`claimed`,i.reward===`scrap`?r.scrap=Math.min(n.limits.scrap,r.scrap+2):r.flares=Math.min(n.limits.flares,r.flares+1),r.tags++,t.stats.cachesClaimed++,this.emit({type:`cacheClaim`,post:e,reward:i.reward}))}stepTraps(){let e=this.state,r=e.deer;for(let i=e.traps.length-1;i>=0;i--){let a=e.traps[i];a.arm>0?a.arm-=t:r.mode!==`hidden`&&wl(a,r)<=n.trap.radius&&Ud(this,this.mods.trapStun,`trap`)&&(e.traps.splice(i,1),this.emit({type:`trapSnap`,x:a.x,z:a.z}))}}updateFocus(){let e=this.state,t=e.player,r=Qd(t.yaw),i=null,a=1/0,o=(e,n,o,s,c,l,u=.62)=>{let d=o.x-t.x,f=o.z-t.z,p=Math.hypot(d,f);if(p-s>Jd.reach)return;let m=p<.05?1:(d*r.x+f*r.z)/p;if(m<u)return;let h=(1-m)*4+(p-s)*.3;h<a&&(a=h,i={kind:e,id:n,x:o.x,z:o.z,info:c,usable:l})},s=this.forest;s.snags.forEach((r,i)=>{if(e.snagLogs[i]<=0)return;let a=t.logs>=n.limits.logs;o(`snag`,i,r,.32,a?`full`:`chop`,!a)});{let r=Math.min(this.mods.fuelPerLog,n.fire.max-e.fuel),i=t.logs>0&&r>=Yd;o(`fire`,0,{x:0,z:0},.85,r<Yd?`fireFull`:t.logs<=0?`noLogs`:`+${Math.round(r)}`,i,.5)}s.scrap.forEach((r,i)=>{if(e.scrapLeft[i]<=0)return;let a=t.scrap>=n.limits.scrap;o(`scrap`,i,r,.5,a?`full`:`take`,!a)}),s.bushes.forEach((r,i)=>{if(e.berryLeft[i]<=0)return;let a=t.berries>=n.limits.berries;o(`bush`,i,r,.5,a?`full`:`take`,!a)});for(let t of e.caches)t.status===`open`&&o(`cache`,t.post,s.posts[t.post],.2,t.revealed?t.reward:`needLight`,t.revealed);o(`bench`,0,s.bench,.6,`bench`,!0),this.focus=i}beginNight(){let e=this.state;e.phase=`night`,e.t=0,e.emberUsed=!1;let t=this.rngLoot.shuffle(this.forest.posts.map((e,t)=>t));if(e.caches=n.cache.times.map((e,n)=>({post:t[n],openAt:e,reward:n===0?`scrap`:`flare`,reveal:0,revealed:!1,status:`pending`})),this.mods.autoTrap&&e.traps.length<n.limits.placedTraps){let t=this.forest.trailMarks.filter(t=>e.traps.every(e=>wl(e,t)>1.5)&&this.forest.nav.walkable(t)).sort((e,t)=>Math.hypot(e.x,e.z)-Math.hypot(t.x,t.z))[0];t&&(e.traps.push({id:e.nextTrapId++,x:t.x,z:t.z,arm:0}),this.emit({type:`trapPlaced`,x:t.x,z:t.z}))}let r=e.player,i=e.deer={...Nd(),nearMiss:e.deer.nearMiss},a=Math.atan2(-r.z,-r.x)+this.rngThreat.range(-.5,.5),o=this.forest.nav.center(this.forest.nav.nearestFree({x:Math.cos(a)*22,z:Math.sin(a)*22}));i.x=o.x,i.z=o.z,i.heading=a+Math.PI/2,i.patrolAngle=Math.atan2(i.z,i.x),i.orbitDir=this.rngThreat.sign(),i.mode=`patrol`,this.prev.dx=i.x,this.prev.dz=i.z,this.prev.dh=i.heading,this.emit({type:`nightStart`,n:e.night})}beginDawn(){let e=this.state,t=e.player;e.stats.nightsSurvived++,e.deer.mode=`hidden`,e.deer.threat=0,e.caches=[],t.bench=!1,t.craft=0,t.chop=0,t.pick=0,t.eat=0,t.lightOn=!1,t.battery=Math.min(n.flashlight.max,t.battery+n.flashlight.dawnCharge),t.dynamoDay=0,this.replenish(),this.emit({type:`dawn`,n:e.night}),e.night>=n.cycle.lastNight?(e.phase=`victory`,this.emit({type:`victory`})):(e.phase=`draft`,e.hand=Sd(this,[]),e.pendingCard=null),this.syncRng(),this.emit({type:`save`})}replenish(){let e=this.state,t=(e,t,n)=>{let r=e.filter(e=>e>=t).length,i=this.rngLoot.shuffle(e.map((e,t)=>t));for(let a of i){if(r>=n)break;e[a]<t&&(e[a]=t,r++)}};t(e.snagLogs,2,3),t(e.scrapLeft,2,3),t(e.berryLeft,1,2)}beginDay(){let e=this.state;e.phase===`draft`&&(e.hand=null,e.pendingCard=null,e.night++,e.phase=`day`,e.t=0,this.refreshMods(),this.syncRng(),this.emit({type:`dayStart`,n:e.night}),this.emit({type:`save`}))}damagePlayer(e){let t=this.state,n=t.player;n.invuln>0||(n.hp=Math.max(0,n.hp-e),n.invuln=Jd.invulnSeconds,this.closeBench(),this.emit({type:`hit`,hp:n.hp}),n.hp<=0&&(t.phase=`deathOffer`,t.deathReason=`deer`,this.emit({type:`death`}),this.syncRng(),this.emit({type:`save`})))}get canRevive(){let e=this.state;return e.phase===`deathOffer`&&!e.reviveUsed&&e.player.scrap>=n.revive.scrap}revive(){let e=this.state;if(!this.canRevive)return!1;let t=e.player;t.scrap-=n.revive.scrap,e.reviveUsed=!0,t.hp=n.revive.hp,t.x=1.4,t.z=1.5,t.invuln=0,t.shield=n.revive.shield,e.fuel=Math.max(e.fuel,n.revive.fuel),e.bright=e.fuel>=n.fire.brightAt||e.bright,e.phase=`night`;let r=e.deer;return r.mode=`retreat`,r.timer=0,r.threat=0,this.snapPrev(),this.emit({type:`revived`}),this.emit({type:`save`}),!0}endRun(){let e=this.state;e.phase===`deathOffer`&&(e.phase=`end`)}serialize(){return this.syncRng(),this.state.revision++,JSON.parse(JSON.stringify(this.state))}},ef=new URL(`jetbrains-mono-latin-400-normal-V6pRDFza.woff2`,import.meta.url).href,tf=new URL(`jetbrains-mono-cyrillic-400-normal-BEIGL1Tu.woff2`,import.meta.url).href;function nf(){if(typeof FontFace>`u`)return;let e=[new FontFace(`BD Mono`,`url(${ef}) format('woff2')`,{weight:`400`,unicodeRange:`U+0000-00FF, U+2010-2027, U+2212`}),new FontFace(`BD Mono`,`url(${tf}) format('woff2')`,{weight:`400`,unicodeRange:`U+0400-04FF, U+2116`})];for(let t of e)document.fonts.add(t),t.load().catch(()=>void 0)}var rf=e=>`<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">${e}</svg>`,af={C01:rf(`<path fill="#8a5a36" d="M22 38 38 31 90 11 74 18zM90 11 106 18 54 38 38 31z"/><path fill="#6b4329" d="M106 18 112 36 60 56 54 38z"/><path fill="#54341f" d="M112 36 106 54 54 74 60 56z"/><path fill="#c99a62" d="M47 32 91 15 95 17 51 34z"/><path fill="#6b4329" d="M38 31 54 38 60 56 54 74 38 81 22 74 16 56 22 38z"/><path fill="#c99a62" d="M38 34 51.5 40.5 57 56 51.5 71.5 38 78 24.5 71.5 19 56 24.5 40.5z"/><path fill="#8a5a36" d="M38 41.5 47 45.5 50.5 56 47 66.5 38 70.5 29 66.5 25.5 56 29 45.5z"/><path fill="#e0b97c" d="M38 43.5 45.5 47 48.5 56 45.5 65 38 68.5 30.5 65 27.5 56 30.5 47z"/><path fill="#c99a62" d="M38 52 41 54 41 58 38 60 35 58 35 54z"/><path fill="#6b4329" d="M40 54 51 41 52.5 43.5z"/><path fill="#8a5a36" d="M66 80 82 67 112 57 98 69z"/><path fill="#d7b887" d="M82 67 112 57 115 77 86 88z"/><path fill="#c99a62" d="M66 80 82 67 86 88z"/><path fill="#e0b97c" d="M82 67 86 88 77 80z"/><path fill="#c99a62" d="M90 70 108 64 109 67 91 73z"/><path fill="#d7b887" d="M14 90 27 86 33 91 20 95z"/><path fill="#c99a62" d="M44 90 53 88 56 93 47 95z"/>`),C02:rf(`<path fill="#5c626b" d="M10 68 44 82 44 94 10 80z"/><path fill="#484d55" d="M44 82 108 64 108 76 44 94z"/><path fill="#7794a8" d="M10 68 74 52 108 64 44 82z"/><path fill="#b9d2ff" d="M30 67.5 70 57.5 78 60.5 38 70.5z"/><path fill="#c99a62" d="M40 20 41.5 15.5 116 34 114.5 38.5z"/><path fill="#8a5a36" d="M38.5 24.5 40 20 114.5 38.5 113 43z"/><path fill="#c2cad2" d="M33 55.5 66 64 68 71 28 61z"/><path fill="#9aa5b0" d="M33 55.5 45 42 49 14 57 16 50 60z"/><path fill="#7c8792" d="M50 60 57 16 65 18 62 46 66 64z"/><path fill="#5c626b" d="M49 14 65 18 64 25 48 21z"/><path fill="#ffc56f" d="M24 52 30 55 25 58zM30 43 34 47 29 48zM16 58 20 59 17 62z"/>`),C03:rf(`<path fill="#7794a8" d="M63 43.5 96 24.5 104.5 42.5 69 56z"/><path fill="#b9d2ff" d="M64.5 47 94 32 97.5 39 67.5 52.5z"/><path fill="#484d55" d="M4 71 8.5 69 15.5 83 11 85.5z"/><path fill="#9aa5b0" d="M8.5 69 44.5 51.5 48 58.5 12 76z"/><path fill="#5c626b" d="M12 76 48 58.5 51.5 66 15.5 83z"/><path fill="#bf532f" d="M25.5 62.5 33.5 58.5 35 62 27 66z"/><path fill="#c2cad2" d="M44.5 51.5 52.5 41 62.5 36 68.5 48.5 48 58.5z"/><path fill="#7c8792" d="M48 58.5 68.5 48.5 75 61 65 66 51.5 66z"/><path fill="#eef4ff" d="M62.5 36 69 39.5 76 54 75 61 70.5 56.5 63.5 42.5z"/><path fill="#9aa5b0" d="M90 58 99 58 99 63 90 63z"/><path fill="#5c626b" d="M83 63 106 63 106 95 83 95z"/><path fill="#2b2d33" d="M86 66 103 66 103 92 86 92z"/><path fill="#ffc56f" d="M88 84.5 101 84.5 101 90 88 90zM88 76.5 101 76.5 101 82 88 82z"/><path fill="#484d55" d="M88 68.5 101 68.5 101 74 88 74z"/>`),C04:rf(`<path fill="#9aa5b0" d="M35.5 37.5 48 39.5 51.5 50.5 28 46z"/><path fill="#7c8792" d="M27.5 48.5 51 53 49.5 61.5 26 57zM26 59.5 48 64 41 72.5 28.5 69.5z"/><path fill="#5c626b" d="M26.5 73.5 41 76.5 40.5 85 35 91.5 25 89.5 23.5 81z"/><path fill="#9aa5b0" d="M75.5 31.5 87.5 35 89.5 47 67 39z"/><path fill="#7c8792" d="M66 41.5 88.5 49 86 57.5 63.5 50zM63 52.5 84.5 59.5 76 67 64.5 62.5z"/><path fill="#5c626b" d="M61.5 66 75.5 71 73.5 79.5 67.5 85 58 82 57.5 73z"/><path fill="#484d55" d="M14 46 20 44 21 49 16 50zM98 84 104 82 106 87 100 89zM52 92 57 91 57 95z"/><path fill="none" stroke="#b9d2ff" stroke-width="3.5" stroke-linejoin="bevel" d="M80 31 74 24 76 15 85 9 95 12 98 20 93 26 86 23 87 18"/><path fill="none" stroke="#7794a8" stroke-width="3" stroke-linejoin="bevel" d="M102 30 106 24 104 18"/>`),C05:rf(`<path fill="#7c8792" d="M8 52 20 26 100 26 112 52 105 52 96 33 24 33 15 52z"/><path fill="#9aa5b0" d="M27.5 14 33 26 22 26zM40.5 14 46 26 35 26zM53.5 14 59 26 48 26zM66.5 14 72 26 61 26zM79.5 14 85 26 74 26zM92.5 14 98 26 87 26z"/><path fill="#7d4a33" d="M30 26 44 26 42 33 33 33z"/><path fill="#484d55" d="M10 50 110 50 110 57 10 57z"/><path fill="#c2cad2" d="M22.5 44 28 44 25.5 63 20 63z"/><path fill="#7c8792" d="M28 44 33.5 44 31 63 25.5 63z"/><path fill="#c2cad2" d="M33.5 44 39 44 36.5 63 31 63z"/><path fill="#7c8792" d="M39 44 44.5 44 42 63 36.5 63z"/><path fill="#c2cad2" d="M78 44 83.5 44 81 63 75.5 63z"/><path fill="#7c8792" d="M83.5 44 89 44 86.5 63 81 63z"/><path fill="#c2cad2" d="M89 44 94.5 44 92 63 86.5 63z"/><path fill="#7c8792" d="M94.5 44 100 44 97.5 63 92 63z"/><path fill="#9aa5b0" d="M65 45 72 50 72 57 65 62 55 62 48 57 48 50 55 45z"/><path fill="#c2cad2" d="M51 47 69 47 72 52 48 52z"/><path fill="#5c626b" d="M2 47 15 47 15 60 2 60zM105 47 118 47 118 60 105 60z"/><path fill="#9aa5b0" d="M8 57 15 57 25 78 95 78 105 57 112 57 100 86 20 86z"/><path fill="#5c626b" d="M18 81.5 102 81.5 100 86 20 86z"/><path fill="#c2cad2" d="M31.5 66 36 78 27 78zM43 66 47.5 78 38.5 78zM54.5 66 59 78 50 78zM65.5 66 70 78 61 78zM77 66 81.5 78 72.5 78zM88.5 66 93 78 84 78z"/>`),C06:rf(`<path fill="none" stroke="#6b4329" stroke-width="1.5" d="M21 19 20 40.5"/><path fill="none" stroke="#6b4329" stroke-width="1.5" d="M42 18 41 59"/><path fill="none" stroke="#6b4329" stroke-width="1.5" d="M63 16.5 62 42.5"/><path fill="none" stroke="#6b4329" stroke-width="1.5" d="M85 15.5 84 61"/><path fill="none" stroke="#6b4329" stroke-width="1.5" d="M102 14.5 101 41.5"/><path fill="#6b4329" d="M4 17 58 14 116 9 117 14 58 20 5 23z"/><path fill="#8a5a36" d="M4 17 58 14 116 9 116.5 11 58 16.5 4.5 19.5z"/><path fill="#6b4329" d="M70 15 76 4 79 5 74 17z"/><path fill="#8a3f2c" d="M30 20 36 32 30 44 25 32z"/><path fill="#bf532f" d="M30 20 30 44 25 32z"/><path fill="#c23b34" d="M17 39.5 25.5 40.5 30.5 48 28.5 56.5 21 60.5 12.5 58.5 9.5 50 11.5 43.5zM35 59 44.5 58 52 65 52 75 45 81.5 35 81 29.5 72.5 30 65zM61.5 41 69.5 44 72.5 52.5 68.5 60 60.5 62.5 53 58.5 52 49.5 55.5 44zM82 59.5 91.5 62 96 71.5 92.5 80.5 83.5 84 74.5 80.5 72 70.5 75.5 63.5zM99.5 40 107 42 110.5 49.5 108 56.5 101 59.5 93.5 56.5 91.5 49 94 43.5z"/><path fill="#8a3f2c" d="M30.5 48 28.5 56.5 21 60.5 12.5 58.5 21 54 25.5 48zM52 65 52 75 45 81.5 35 81 43 74.5 46.5 66.5zM72.5 52.5 68.5 60 60.5 62.5 53 58.5 62 56.5 67.5 51zM96 71.5 92.5 80.5 83.5 84 74.5 80.5 84.5 77 90.5 70.5zM110.5 49.5 108 56.5 101 59.5 93.5 56.5 101.5 54 106 48.5z"/><path fill="#e06a5c" d="M12.5 45 18 41.5 20 46 15 49zM31.5 66 36.5 61 40 65.5 35 70zM56 45 62 43.5 63 48 57 49.5zM76.5 65 83 62 84.5 67 78 70zM95 44.5 100 42 101.5 46 96.5 48.5z"/>`),C07:rf(`<path fill="#8a5a36" d="M48 55 110 45 118 51.5 118 58 48 68z"/><path fill="#6b4329" d="M48 68 118 58 118 64.5 110 71 48 81z"/><path fill="#54341f" d="M52 56 57.5 63 57.5 73 52 80 44 80 38.5 73 38.5 63 44 56z"/><path fill="#c99a62" d="M51 58.5 55.5 64 55.5 72 51 77.5 45 77.5 40.5 72 40.5 64 45 58.5z"/><path fill="#e0b97c" d="M48 63 51.5 65.5 51.5 70.5 48 73 44.5 70.5 44.5 65.5z"/><path fill="#8a5a36" d="M38 37 100 27 108 33.5 108 40 38 50z"/><path fill="#6b4329" d="M38 50 108 40 108 46.5 100 53 38 63z"/><path fill="#54341f" d="M42 38 47.5 45 47.5 55 42 62 34 62 28.5 55 28.5 45 34 38z"/><path fill="#c99a62" d="M41 40.5 45.5 46 45.5 54 41 59.5 35 59.5 30.5 54 30.5 46 35 40.5z"/><path fill="#e0b97c" d="M38 45 41.5 47.5 41.5 52.5 38 55 34.5 52.5 34.5 47.5z"/><path fill="#8a5a36" d="M26 61 88 51 96 57.5 96 64 26 74z"/><path fill="#6b4329" d="M26 74 96 64 96 70.5 88 77 26 87z"/><path fill="#54341f" d="M30 62 35.5 69 35.5 79 30 86 22 86 16.5 79 16.5 69 22 62z"/><path fill="#c99a62" d="M29 64.5 33.5 70 33.5 78 29 83.5 23 83.5 18.5 78 18.5 70 23 64.5z"/><path fill="#e0b97c" d="M26 69 29.5 71.5 29.5 76.5 26 79 22.5 76.5 22.5 71.5z"/><path fill="#d9d2c4" d="M52 33.5 56 33 54.5 57 47.5 84 43.5 84.5 50 57z"/><path fill="#b3a893" d="M56 33 60 32.5 59 57 51.5 83.5 47.5 84 54.5 57z"/><path fill="#d9d2c4" d="M78 29.5 82 29 80.5 53 73.5 80 69.5 80.5 76 53z"/><path fill="#b3a893" d="M82 29 86 28.5 85 53 77.5 79.5 73.5 80 80.5 53zM51 58 55 57 49 73 44 71zM57 57 61 56 66 70 62 72z"/><path fill="#d9d2c4" d="M49 54 56 50 61 54 55 60z"/>`),C08:rf(`<path fill="#5c626b" d="M64 13.5 71.5 16.5 66 31.5 59.5 37.5 58.5 28.5z"/><path fill="#484d55" d="M98 26 105.5 28.5 100 43.5 93.5 50 92.5 41z"/><path fill="#7c8792" d="M66 8 107.5 23 104.5 30.5 63.5 15.5z"/><path fill="#9aa5b0" d="M67 8.5 106.5 22.5 103.5 24.5 68 11.5z"/><path fill="#7c8792" d="M9.5 30 17.5 28 21.5 44.5 19.5 53.5 13.5 46.5z"/><path fill="#5c626b" d="M46 21 54.5 19 58.5 35 56.5 44.5 50.5 37.5z"/><path fill="#9aa5b0" d="M8 24 53 13 55 21 10 32z"/><path fill="#c2cad2" d="M9 23.5 52 13 50.5 16 11.5 26z"/><path fill="#5e3626" d="M65.5 72 74 69.5 78.5 86 76.5 95 70.5 88z"/><path fill="#54341f" d="M102 61.5 110 59.5 115 75.5 113 84.5 106.5 78z"/><path fill="#7d4a33" d="M64 66 108.5 53.5 110.5 61.5 66.5 74z"/><path fill="#bf532f" d="M65 65.5 107.5 53.5 106 56.5 68 67.5z"/><path fill="#7c8792" d="M15 64.5 23.5 66 21 83.5 15 91.5 12 82z"/><path fill="#5c626b" d="M54 70.5 63 72 60 89.5 54.5 97.5 51.5 88z"/><path fill="#9aa5b0" d="M16 58 64 65.5 62.5 74.5 14.5 66.5z"/><path fill="#c2cad2" d="M17 58 62.5 65.5 60 68 19 61z"/>`),R01:rf(`<path fill="#5c626b" d="M10 34 30 22 30 72 10 86z"/><path fill="#9aa5b0" d="M30 22 60 17 60 67 30 72z"/><path fill="#7c8792" d="M60 17 90 22 90 72 60 67z"/><path fill="#484d55" d="M90 22 110 34 110 86 90 72z"/><path fill="#c2cad2" d="M10 34 30 22 60 17 90 22 110 34 110 37 90 25 60 20 30 25 10 37z"/><path fill="#bf532f" d="M40 86 36 71.5 43.5 60 41.5 49 51 56.5 56.5 36.5 65.5 53 71 45.5 76.5 62 82 69.5 78.5 86z"/><path fill="#ffc56f" d="M46 86 44.5 74 51.5 65 55.5 51 63 63 68.5 59.5 73 72 72 86z"/><path fill="#ffe9b8" d="M52.5 86 51.5 77 58 66 64.5 76 65.5 86z"/><path fill="#6b4329" d="M25 88.5 89 75.5 91 84.5 27 97.5z"/><path fill="#8a5a36" d="M31 75.5 95 88.5 93 97.5 29 84.5z"/><path fill="#c99a62" d="M89 87.5 95 88.5 93 97.5 87 96zM25 88.5 31 87.5 27 97.5 21 97z"/>`),R02:rf(`<path fill="#5c626b" d="M91.5 27 98.5 69 87.5 71 80.5 29zM87.5 69 98.5 67.5 97 88z"/><path fill="#7c8792" d="M29 36.5 18 58.5 8 53.5 19 31.5z"/><path fill="#7d4a33" d="M17.5 51 31.5 73 22.5 79 8.5 57zM22 79.5 32 73.5 35 90z"/><path fill="#9aa5b0" d="M20 30 55 34 86 21 92 31 56 46 22 42z"/><path fill="#c2cad2" d="M20 30 55 34 86 21 87.5 23.5 55.5 37 20.5 33z"/><path fill="#7d4a33" d="M48 35 62 33 64 42.5 52 45z"/><path fill="#bf532f" d="M52 36 60 34.5 59 38.5 53 39.5z"/><path fill="#5e3626" d="M11 52 19 50 21 56 14 59z"/>`),R03:rf(`<path fill="#b9d2ff" d="M57 24.5 77.5 6.5 65 30.5z"/><path fill="#eef4ff" d="M67 33 101.5 23 72.5 44z"/><path fill="#b9d2ff" d="M73 45 114 52 73 59z"/><path fill="#eef4ff" d="M72.5 60 101.5 81 67 71z"/><path fill="#b9d2ff" d="M65 73.5 77.5 97.5 57 79.5z"/><path fill="#ffc56f" d="M100 22 103 26 100 30 97 26zM104 72 107 76 104 80 101 76zM112 36 115 40 112 44 109 40z"/><path fill="#5c626b" d="M51.5 24.5 65 40.5 65 63.5 51.5 79.5 32.5 79.5 19 63.5 19 40.5 32.5 24.5z"/><path fill="#9aa5b0" d="M51.5 24.5 19 63.5 19 40.5 32.5 24.5 34.5 29 23.5 42.5 23.5 61.5 49.5 29z"/><path fill="#b9d2ff" d="M39 48 49.5 29 60.5 42.5z"/><path fill="#7794a8" d="M39 48 60.5 42.5 60.5 61.5z"/><path fill="#b9d2ff" d="M39 48 60.5 61.5 49.5 75z"/><path fill="#7794a8" d="M39 48 49.5 75 34.5 75z"/><path fill="#5f7c91" d="M39 48 34.5 75 23.5 61.5z"/><path fill="#7794a8" d="M39 48 23.5 61.5 23.5 42.5z"/><path fill="#b9d2ff" d="M39 48 23.5 42.5 34.5 29z"/><path fill="#eef4ff" d="M39 48 34.5 29 49.5 29zM30 40 36 36 38 42 32 46z"/>`),R04:rf(`<path fill="#54341f" d="M84.5 15 96.5 24 97.5 37 89.5 51.5 75.5 62 64.5 68.5 55 82.5 45 90.5 34.5 88.5 30 79 36 66.5 48.5 55.5 53.5 41 62 26 74 17z"/><path fill="#6b4329" d="M81.5 11 93.5 20 94.5 33 86.5 47.5 72.5 58 61.5 64.5 52 78.5 42 86.5 31.5 84.5 27 75 33 62.5 45.5 51.5 50.5 37 59 22 71 13z"/><path fill="#8a5a36" d="M80 16.5 89.5 23 90.5 33.5 83 45 70.5 53.5 55 38 62 24.5 72 18zM44.5 56 57 66.5 50 76.5 42 82.5 34.5 80.5 31 73 35.5 64.5z"/><path fill="#c2cad2" d="M73 14.5 75 25.5 70.5 24.5z"/><path fill="#7c8792" d="M73 14.5 78.5 23.5 75 25.5z"/><path fill="#c2cad2" d="M85 23 87 34 82.5 33z"/><path fill="#7c8792" d="M85 23 90.5 32 87 34z"/><path fill="#c2cad2" d="M62 24 64 35 59.5 34z"/><path fill="#7c8792" d="M62 24 67.5 33 64 35z"/><path fill="#c2cad2" d="M78 36 80 47 75.5 46z"/><path fill="#7c8792" d="M78 36 83.5 45 80 47z"/><path fill="#c2cad2" d="M74 24.5 76 35.5 71.5 34.5z"/><path fill="#7c8792" d="M74 24.5 79.5 33.5 76 35.5z"/><path fill="#c2cad2" d="M64.5 37.5 66.5 48.5 62 47.5z"/><path fill="#7c8792" d="M64.5 37.5 70 46.5 66.5 48.5z"/><path fill="#c2cad2" d="M42.5 55.5 44.5 66.5 40 65.5z"/><path fill="#7c8792" d="M42.5 55.5 48 64.5 44.5 66.5z"/><path fill="#c2cad2" d="M49 62.5 51 73.5 46.5 72.5z"/><path fill="#7c8792" d="M49 62.5 54.5 71.5 51 73.5z"/><path fill="#c2cad2" d="M38 67.5 40 78.5 35.5 77.5z"/><path fill="#7c8792" d="M38 67.5 43.5 76.5 40 78.5z"/>`),R05:rf(`<path fill="#5e3626" d="M8 80 13 77 21 88.5 16 92z"/><path fill="#c99a62" d="M13.5 77.5 38.5 61 42 66 17 82.5z"/><path fill="#8a5a36" d="M17 82.5 42 66 45 71 20.5 87.5z"/><path fill="#c2cad2" d="M35 59 39 56.5 44.5 64 40 67z"/><path fill="#7c8792" d="M40 67 44.5 64 49.5 72 45.5 75z"/><path fill="#c99a62" d="M39.5 57 65.5 40 70 47 44.5 64z"/><path fill="#8a5a36" d="M44.5 64 70 47 75 54 49 71.5z"/><path fill="#c2cad2" d="M61.5 37.5 65.5 35 72.5 45 68.5 48z"/><path fill="#7c8792" d="M68.5 48 72.5 45 79.5 55.5 75.5 58.5z"/><path fill="#c99a62" d="M66 35.5 92 18.5 98 28 72.5 45z"/><path fill="#8a5a36" d="M72.5 45 98 28 104.5 37.5 79 54.5z"/><path fill="#e0b97c" d="M70 36 90.5 22 92.5 24.5 71.5 38.5z"/><path fill="#c2cad2" d="M90 17 95 14 102.5 25 97.5 28.5z"/><path fill="#7c8792" d="M97.5 28.5 102.5 25 110 36.5 105 39.5z"/><path fill="#7794a8" d="M95 14 102.5 16.5 110.5 28 110 36.5 104 32.5 96.5 20.5z"/><path fill="#b9d2ff" d="M95 14 102.5 16.5 106.5 22.5 100.5 26.5 96.5 20.5z"/><path fill="#eef4ff" d="M96 50 98.5 57.5 106 60 98.5 62.5 96 70 93.5 62.5 86 60 93.5 57.5z"/>`),R06:rf(`<path fill="#bf532f" d="M65.5 47.5 58 35.5 61.5 26.5 60 15.5 67 21.5 71.5 3.5 78.5 17 83 11 86.5 25 89.5 32.5 82 47.5z"/><path fill="#ffc56f" d="M67.5 47 63 36 67.5 28 70.5 15.5 76 25.5 80 22.5 83 33 79 47z"/><path fill="#ffe9b8" d="M70.5 45.5 68.5 37 73 28 77 36 76 45.5z"/><path fill="#c99a62" d="M25 94 52.5 59 55 61.5 28 96z"/><path fill="#8a5a36" d="M28 96 55 61.5 58 63.5 31 98z"/><path fill="#5e3626" d="M46.5 61.5 49.5 56 64 63 59 67.5z"/><path fill="#7d4a33" d="M49.5 56 53 50 68.5 58.5 64 63z"/><path fill="#5e3626" d="M53 50 56 44.5 73 54.5 68.5 58.5z"/><path fill="#7d4a33" d="M56 44.5 59.5 39 78 50 73 54.5z"/><path fill="#5e3626" d="M59.5 39 62.5 33.5 82.5 45.5 78 50z"/><path fill="#e0b97c" d="M49.5 55.5 53 49.5 57 51 53 57zM61.5 48.5 66 42 70.5 44 66 51z"/><path fill="#ffc56f" d="M63.5 57.5 67 54 70.5 55.5 67 59.5z"/><path fill="#e0b97c" d="M66 68 69 74 66 79 63 74zM74 62 76 66 74 69.5 72 66z"/><path fill="#7d4a33" d="M58 67.5 61.5 65 67.5 76.5 61.5 77.5z"/>`),R07:rf(`<path fill="#6b4329" d="M38 10 50 10 50 48 28 62 30 80 44 80 44 48 36 28z"/><path fill="#8a5a36" d="M50 10 62 10 65 42 84 52 100 62 104 80 44 80 44 48 50 48z"/><path fill="#c99a62" d="M84 52 100 62 104 80 88 80 80 62z"/><path fill="#d9d2c4" d="M34 5 66 5 67 14 62 19 57 14 52 20 46 14 40 20 36 14 32 17zM18 78 22 69 28 63 34 71 40 65 47 72 54 66 61 73 68 67 75 74 82 68 89 75 96 69 103 75 110 70 115 79 113 86 106 93 98 89 90 95 82 90 74 95 66 90 58 95 50 90 42 95 34 90 26 94 19 87z"/><path fill="#b3a893" d="M18 81 115 81 113 86 106 93 98 89 90 95 82 90 74 95 66 90 58 95 50 90 42 95 34 90 26 94 19 87z"/><path fill="#5e3626" d="M46 69 51 68 58 93 53 94zM76 72 81 70 72 94 67 93zM96 70 100 72 98 91 94 92z"/>`),E01:rf(`<path fill="#484d55" d="M6 88 22 72 40 88z"/><path fill="#5c626b" d="M22 72 40 62 60 60 40 88zM60 60 82 62 84 88 40 88z"/><path fill="#484d55" d="M82 62 100 72 114 88 84 88z"/><path fill="#bf532f" d="M38 60 45 34 60 45 54 70z"/><path fill="#e58a3c" d="M45 34 63 23 81 32 60 45z"/><path fill="#8a3f2c" d="M60 45 81 32 87 56 75 68 54 70z"/><path fill="#5e3626" d="M70 47 81 32 87 56 76 60z"/><path fill="#ffc56f" d="M45 34 47 33 61.5 43.5 79 33 81 32 61 47 56 70 54 70 59 45.5z"/><path fill="#ffe9b8" d="M57 42 65 42.5 62 50 58 48z"/><path fill="#7c8792" d="M26 88 42 64 58 72 56 88z"/><path fill="#9aa5b0" d="M52 60 66 64 58 72 42 64z"/><path fill="#7c8792" d="M58 72 74 62 84 70 96 88 56 88z"/><path fill="#9aa5b0" d="M74 62 84 70 78 74z"/><path fill="#484d55" d="M10 88 110 88 104 93 16 93z"/><path fill="#2b2d33" d="M30 80 36 78 37 83 32 84zM80 80 86 79 86 84z"/><path fill="#ffc56f" d="M28 40 32 36 33 43zM92 24 96 21 96 27z"/><path fill="#e58a3c" d="M100 46 104 44 103 50zM40 18 43 15 44 21z"/>`),E02:rf(`<path fill="#54341f" d="M14 84 30 70 54 52 84 38 112 32 112 48 86 58 62 74 50 96 4 96z"/><path fill="#6b4329" d="M34 74 52 60 82 44 112 36 112 44 80 56 56 72 42 96 14 96z"/><path fill="#59664d" d="M8 70 14 56 18 70zM16 72 23 60 26 72z"/><path fill="#465240" d="M60 96 68 82 74 96z"/><path fill="#59664d" d="M70 96 76 86 82 96z"/><path fill="#465240" d="M64 40 69 30 73 40z"/><path fill="#7c8792" d="M28.5 68.5 33 55 73 50.5 80.5 63 77 63.5 71.5 54.5 35.5 58 32 68z"/><path fill="#9aa5b0" d="M36.5 48.5 39.5 54 34 55zM43 48 46 53.5 40.5 54zM49 47 52.5 53 47 53.5zM55.5 46.5 59 52 53.5 52.5zM62 46 65.5 51.5 60 52zM68.5 45 72 51 66.5 51.5z"/><path fill="#484d55" d="M29.5 67.5 79 62 79.5 65.5 30 71z"/><path fill="#9aa5b0" d="M56.5 62 60.5 64 60.5 67.5 57.5 70.5 52.5 71 48.5 69 48.5 65.5 51.5 62.5z"/><path fill="#5c626b" d="M25.5 66.5 32 65.5 32.5 72 26 72.5zM76.5 61 83 60 83.5 66.5 77 67.5z"/><path fill="#9aa5b0" d="M29 71 32.5 70.5 38.5 80.5 73 77 77 66 80.5 65.5 76 80.5 36.5 84.5z"/><path fill="#c2cad2" d="M41 74 44 80 39.5 80.5zM46.5 73.5 49.5 79.5 45 80zM52.5 73 55 78.5 50.5 79zM58 72.5 61 78 56.5 78.5zM63.5 72 66.5 77.5 62 78zM69.5 71 72 77 67.5 77.5z"/><path fill="#7c8792" d="M80 68 85 66 86 69 81 71zM88 70 93 70 93 73 88 73z"/><path fill="#c99a62" d="M94 12 98 12 98 80 94 72z"/><path fill="#8a5a36" d="M98 12 102 12 102 72 98 80z"/><path fill="#c23b34" d="M102 15 118 19 111 25 102 24z"/><path fill="#8a3f2c" d="M102 24 111 25 118 33 102 31z"/><path fill="#e06a5c" d="M92 16 104 16 104 20 92 20z"/>`),E03:rf(`<path fill="#c2cad2" d="M48.5 34.5 52.5 25 60 28 56 37.5z"/><path fill="#7c8792" d="M62.5 44 72 40 75 47.5 65.5 51.5zM65.5 60.5 75 64.5 72 72 62.5 68z"/><path fill="#5c626b" d="M56 74.5 60 84 52.5 87 48.5 77.5z"/><path fill="#c2cad2" d="M39.5 77.5 35.5 87 28 84 32 74.5zM25.5 68 16 72 13 64.5 22.5 60.5zM22.5 51.5 13 47.5 16 40 25.5 44zM32 37.5 28 28 35.5 25 39.5 34.5z"/><path fill="#7c8792" d="M44 32 53 34 61 39 66 47 68 56 66 65 61 73 53 78 44 80 35 78 27 73 22 65 20 56 22 47 27 39 35 34z"/><path fill="#9aa5b0" d="M44 32 53 34 61 39 27 73 22 65 20 56 22 47 27 39 35 34 44 56z"/><path fill="#5c626b" d="M49.5 42 58 50.5 58 61.5 49.5 70 38.5 70 30 61.5 30 50.5 38.5 42z"/><path fill="#484d55" d="M58 50.5 58 61.5 49.5 70 38.5 70 44 56z"/><path fill="#c2cad2" d="M41.5 53.5 67.5 25.5 72.5 30.5 46.5 58.5z"/><path fill="#9aa5b0" d="M44 49.5 49.5 53 49.5 59.5 44 62.5 38.5 59.5 38.5 53z"/><path fill="#c99a62" d="M63 23 69 17 80 28 74 34z"/><path fill="#8a5a36" d="M66.5 26.5 72 21 80 28 74 34z"/><path fill="#ffc56f" d="M107 34 99 53 110 52 88 88 94 61 84 62 97 34z"/><path fill="#ffe9b8" d="M102 38 97 57.5 90 58 99 38z"/><path fill="#ffc56f" d="M82 44 86 40 86 47zM108 74 113 72 111 78z"/>`),E04:rf(`<path fill="#c23b34" d="M12.5 88 47 51.5 51.5 55.5 17 92z"/><path fill="#8a3f2c" d="M17 92 51.5 55.5 55.5 59.5 21.5 96z"/><path fill="#d9d2c4" d="M19.5 80.5 23.5 76 28 80.5 24 84.5z"/><path fill="#b3a893" d="M24 84.5 28 80.5 32.5 84.5 28 89z"/><path fill="#9aa5b0" d="M46 51 49.5 47 60 57 56.5 60.5z"/><path fill="#7794a8" d="M71 3.5 72.5 29 87 24.5 78.5 36.5 102.5 45 77 46.5 81.5 61 69.5 52.5 61 76.5 59.5 51 45 55.5 53.5 43.5 29.5 35 55 33.5 50.5 19 62.5 27.5z"/><path fill="#b9d2ff" d="M70.5 8.5 71 31.5 83 27.5 75.5 37.5 97.5 44.5 74.5 45 78.5 57 68.5 49.5 61.5 71.5 61 48.5 49 52.5 56.5 42.5 34.5 35.5 57.5 35 53.5 23 63.5 30.5z"/><path fill="#eef4ff" d="M69.5 15 69.5 34 78 31 73 38 91 43.5 72 43.5 75 52 68 47 62.5 65 62.5 46 54 49 59 42 41 36.5 60 36.5 57 28 64 33zM20 22 23 26 20 30 17 26zM108 74 111 78 108 82 105 78zM104 9 106 12 104 15 102 12zM30 55 32 58 30 61 28 58zM92 83 94 86 92 89 90 86z"/>`)},of={title:`99 Nights by the Fire`,tagline:`Chop by day. At night something with a bell in its chest walks the edge of your light.`,play:`Play`,continue:`Continue`,continueRun:`Continue · night {n}`,newRun:`New run`,resume:`Resume`,paused:`Paused`,clickToPlay:`Click to return to the forest`,toTitle:`Save and quit to title`,language:`Language`,volume:`Volume`,effects:`Effects`,shake:`Camera shake`,flash:`Brightness pulse`,subtitles:`Sound subtitles`,lowQuality:`Low quality`,on:`on`,off:`off`,controls:`WASD move · Shift run · hold LMB chop · E use · F light · hold Q trap · T torch · G flare · B berry · P pause`,best:`Best: night {n}`,day:`DAY`,night:`NIGHT`,dawn:`DAWN`,chooseUpgrade:`Choose an upgrade`,skip:`Skip`,reroll:`New cards · 2 scrap`,replaceWhich:`All four slots are taken. Which card should it replace?`,keepBuild:`Keep the current build`,chapterDone:`Chapter {n} survived`,chapterSeal:`Forest seal no. {n} is yours`,chapterNoSeal:`No tag was carried to the fire this chapter`,nextDay:`Continue`,endSession:`End session`,sessionSaved:`Run saved at dawn. It will be here when you come back.`,lastChance:`Last chance`,reviveScrap:`Crawl back to the fire · 4 scrap`,reviveNone:`Not enough scrap to get back up`,endRun:`End the run`,runOver:`Lived to night {n}`,runOverDay:`Survived {n} nights`,survivedNights:`Full nights survived: {n}`,continueDawn:`Continue · dawn after night {n}`,confirmNew:`Erase the saved run and start over`,reviveUsed:`The last chance was already used in this run`,hTrapLimit:`Two traps are already set`,hTrapNoScrap:`No trap and not enough scrap`,hTrapSpot:`No room for a trap here`,scrapCost:`scrap × {n}`,cause:`Taken by the Bell-stag outside the light`,tagsOut:`Tags carried out: {n}`,build:`Build`,noCards:`no cards`,victory:`All 99 nights`,victoryText:`The last dawn. Both halves of the crown lie in the ash.`,again:`New run`,menu:`Main menu`,saveFrame:`Save frame`,hChop:`hold`,hChopLabel:`Chop`,hFeed:`Add a log`,hTake:`Take`,hScrap:`Scrap`,hBerry:`Berries`,hBench:`Workbench`,hCache:`Open the cache`,hNeedLight:`Hold the beam on the tag`,hFull:`Pack is full`,hFireFull:`The fire is full`,hNoLogs:`No logs`,hintMove:`WASD — move · Shift — run`,hintFire:`Carry the logs to the fire`,hintNight:`Stay inside the ember ring. Tags ring at 14–17 m.`,hintLight:`F — flashlight`,bench:`Workbench`,rTrap:`Trap`,rFlare:`Flare charge`,rBattery:`Battery +40`,scrap:`scrap`,close:`E — close`,sLeft:`on the left`,sRight:`on the right`,sAhead:`ahead`,sBehind:`behind`,sSteps:`Heavy steps {d}`,sRun:`It is running {d}`,sChime:`A single chime {d}`,sDouble:`Double strike {d}`,sTin:`A tin tag rings {d}`,sTrap:`The trap snaps {d}`,sFireWeak:`The fire hisses — the ring is gone`,sFireBright:`The fire is bright again`,sBirds:`The birds fall silent`,sStunned:`The Bell-stag is stunned`,sRetreat:`It backs into the fog`,tLogs:`+{n} [log|logs]`,tScrap:`Scrap +{n}`,tBerry:`+{n} [berry|berries]`,tFlare:`+1 flare`,tTag:`Forest tag taken — carry it to the fire`,tBank:`Tags handed in: {n}`,tSeal:`Forest seal no. {n}`,tTrap:`Trap set`,tTrapReady:`+1 trap`,tBattery:`Battery +40`,tEmber:`Coal under the ash: +14`,tCacheGone:`The cache has closed`,tRevived:`Back at the fire`,tLow:`Low quality is on`,dBattery:`Battery is empty`,dLogs:`No logs`,dBerries:`No berries`,dFlares:`No flares`,dPulse:`Pulse is not ready`,dCraft:`Not enough scrap`,hp:`HP`,stamina:`Stamina`,battery:`Battery`,tagFire:`Fire`,tagBeam:`Beam`,tagRun:`Run`,tagTraps:`Traps`,tagSupply:`Supply`,stFuel:`Fuel per log`,stChop:`Chopping`,stBeamDrain:`Beam drain`,stSprintCost:`Stamina use`,stTrapStun:`Trap stun`,stBerry:`Berry: HP / stamina`,stLogsNow:`Logs, now`,stScrapNow:`Scrap, now`,stRadius:`Fire circle`,stTrapCost:`Trap cost`,stPulse:`V pulse stuns`,stSprint:`Sprint`,stBeamRange:`Beam range`,stTorch:`Torch`,stNoise:`Step / run noise`,stEmber:`Once a night at 24`,stAutoTrap:`Trap at dusk`,stDynamo:`Battery per day`,stFlare:`Flare burst`,C01:`Dry Heartwood`,C02:`Whetstone`,C03:`Thrifty Lantern`,C04:`Steady Breath`,C05:`Double Spring`,C06:`Dried Berries`,C07:`Bundle`,C08:`Handful of Staples`,R01:`Fire Reflector`,R02:`Bent Staple`,R03:`Pulse Lens`,R04:`Running Spikes`,R05:`Warden's Optics`,R06:`Resin Wrap`,R07:`Soft Sole`,E01:`Coal Under Ash`,E02:`Self-Setter`,E03:`Step Dynamo`,E04:`Magnesium Star`},sf={en:of,ru:{title:`99 Ночей у Костра`,tagline:`Днём руби дрова. Ночью по краю света ходит тот, у кого в груди колокол.`,play:`Играть`,continue:`Продолжить`,continueRun:`Продолжить · ночь {n}`,newRun:`Новый забег`,resume:`Вернуться`,paused:`Пауза`,clickToPlay:`Нажми, чтобы вернуться в лес`,toTitle:`Сохранить и выйти в меню`,language:`Язык`,volume:`Громкость`,effects:`Эффекты`,shake:`Тряска камеры`,flash:`Импульс яркости`,subtitles:`Субтитры звуков`,lowQuality:`Низкое качество`,on:`вкл`,off:`выкл`,controls:`WASD ходьба · Shift бег · держать ЛКМ — рубить · E действие · F фонарь · держать Q — капкан · T факел · G ракета · B ягода · P пауза`,best:`Рекорд: ночь {n}`,day:`ДЕНЬ`,night:`НОЧЬ`,dawn:`РАССВЕТ`,chooseUpgrade:`Выбери улучшение`,skip:`Пропустить`,reroll:`Сменить карты · 2 лома`,replaceWhich:`Все четыре слота заняты. Какую карту заменить?`,keepBuild:`Оставить прежнюю сборку`,chapterDone:`Глава {n} пройдена`,chapterSeal:`Лесная печать № {n} твоя`,chapterNoSeal:`В этой главе к огню не вынесено ни одной бирки`,nextDay:`Продолжить`,endSession:`Закончить сессию`,sessionSaved:`Забег сохранён на рассвете. Он подождёт твоего возвращения.`,lastChance:`Последний шанс`,reviveScrap:`Доползти до костра · 4 лома`,reviveNone:`Лома не хватает, чтобы подняться`,endRun:`Завершить забег`,runOver:`Дожил до ночи {n}`,runOverDay:`Пережито {n} ночей`,survivedNights:`Пережито полных ночей: {n}`,continueDawn:`Продолжить · рассвет после ночи {n}`,confirmNew:`Стереть сохранённый забег и начать заново`,reviveUsed:`Последний шанс в этом забеге уже использован`,hTrapLimit:`Два капкана уже стоят`,hTrapNoScrap:`Нет капкана и не хватает лома`,hTrapSpot:`Здесь капкан не поставить`,scrapCost:`лом × {n}`,cause:`Звонарь настиг за границей света`,tagsOut:`Вынесено бирок: {n}`,build:`Сборка`,noCards:`без карт`,victory:`Все 99 ночей`,victoryText:`Последний рассвет. Обе половины венца лежат в золе.`,again:`Новый забег`,menu:`В меню`,saveFrame:`Сохранить кадр`,hChop:`удерживать`,hChopLabel:`Рубить`,hFeed:`Подбросить полено`,hTake:`Взять`,hScrap:`Лом`,hBerry:`Ягоды`,hBench:`Верстак`,hCache:`Открыть тайник`,hNeedLight:`Наведи луч на бирку`,hFull:`Рюкзак полон`,hFireFull:`Костёр полон`,hNoLogs:`Нет поленьев`,hintMove:`WASD — ходьба · Shift — бег`,hintFire:`Отнеси поленья к костру`,hintNight:`Держись внутри кольца золы. Бирки звенят в 14–17 м.`,hintLight:`F — фонарь`,bench:`Верстак`,rTrap:`Капкан`,rFlare:`Ракетный заряд`,rBattery:`Батарея +40`,scrap:`лома`,close:`E — закрыть`,sLeft:`слева`,sRight:`справа`,sAhead:`впереди`,sBehind:`сзади`,sSteps:`Тяжёлые шаги {d}`,sRun:`Он бежит {d}`,sChime:`Одиночный звон {d}`,sDouble:`Двойной удар {d}`,sTin:`Жестянка звенит {d}`,sTrap:`Щёлкнул капкан {d}`,sFireWeak:`Огонь шипит — кольцо погасло`,sFireBright:`Огонь снова яркий`,sBirds:`Птицы затихли`,sStunned:`Звонарь оглушён`,sRetreat:`Он отступает в туман`,tLogs:`+{n} [полено|полена|поленьев]`,tScrap:`Лом +{n}`,tBerry:`+{n} [ягода|ягоды|ягод]`,tFlare:`+1 ракета`,tTag:`Лесная бирка у тебя — донеси её до костра`,tBank:`Сдано бирок: {n}`,tSeal:`Лесная печать № {n}`,tTrap:`Капкан поставлен`,tTrapReady:`+1 капкан`,tBattery:`Батарея +40`,tEmber:`Уголь под золой: +14`,tCacheGone:`Тайник закрылся`,tRevived:`Снова у костра`,tLow:`Включено низкое качество`,dBattery:`Батарея пуста`,dLogs:`Нет поленьев`,dBerries:`Нет ягод`,dFlares:`Нет ракет`,dPulse:`Импульс не готов`,dCraft:`Не хватает лома`,hp:`HP`,stamina:`Стамина`,battery:`Батарея`,tagFire:`Огонь`,tagBeam:`Луч`,tagRun:`Бег`,tagTraps:`Ловушки`,tagSupply:`Припас`,stFuel:`Топливо`,stChop:`Рубка`,stBeamDrain:`Расход луча`,stSprintCost:`Расход стамины`,stTrapStun:`Оглушение`,stBerry:`Ягода: HP / стамина`,stLogsNow:`Поленья сейчас`,stScrapNow:`Лом сейчас`,stRadius:`Круг костра`,stTrapCost:`Цена капкана`,stPulse:`Импульс V оглушает`,stSprint:`Спринт`,stBeamRange:`Дальность луча`,stTorch:`Факел`,stNoise:`Шум шага / бега`,stEmber:`Раз за ночь при 24`,stAutoTrap:`Капкан на закате`,stDynamo:`Батарея за день`,stFlare:`Вспышка ракеты`,C01:`Сухая сердцевина`,C02:`Оселок`,C03:`Экономный фонарь`,C04:`Ровное дыхание`,C05:`Двойная пружина`,C06:`Сушёные ягоды`,C07:`Вязанка`,C08:`Горсть скоб`,R01:`Отражатель костра`,R02:`Гнутая скоба`,R03:`Импульсная линза`,R04:`Беговые шипы`,R05:`Оптика смотрителя`,R06:`Смоляная обмотка`,R07:`Мягкая подошва`,E01:`Уголь под золой`,E02:`Самолов`,E03:`Шаговая динамо`,E04:`Магниевая звезда`}},cf=`en`;function lf(e){cf=e,document.documentElement.lang=e,document.title=sf[e].title}function uf(){return cf}function df(){let e=(navigator.languages?.[0]??navigator.language??`en`).toLowerCase();return e.startsWith(`ru`)||e.startsWith(`be`)||e.startsWith(`uk`)||e.startsWith(`kk`)?`ru`:`en`}function ff(e,t){if(e.length<3)return t===1?e[0]:e[e.length-1];let n=Math.abs(t)%100,r=n%10;return r===1&&n!==11?e[0]:r>=2&&r<=4&&(n<12||n>14)?e[1]:e[2]}function Z(e,t){let n=sf[cf][e]??of[e]??e;if(t)for(let e in t)n=n.replace(`{${e}}`,String(t[e]));return n.includes(`[`)&&(n=n.replace(/\[([^\]]+)\]/g,(e,n)=>ff(n.split(`|`),Number(t?.n??0)))),n}function pf(e){return cf===`ru`?e.replace(/m\/s/g,`м/с`).replace(/(\d) s\b/g,`$1 с`).replace(/(\d) m\b/g,`$1 м`).replace(/(\d)\.(\d)/g,`$1,$2`):e}var mf={fuel:`stFuel`,chop:`stChop`,beamDrain:`stBeamDrain`,sprintCost:`stSprintCost`,trapStun:`stTrapStun`,berry:`stBerry`,logsNow:`stLogsNow`,scrapNow:`stScrapNow`,radius:`stRadius`,trapCost:`stTrapCost`,pulse:`stPulse`,sprint:`stSprint`,beamRange:`stBeamRange`,torch:`stTorch`,noise:`stNoise`,ember:`stEmber`,autoTrap:`stAutoTrap`,dynamo:`stDynamo`,flare:`stFlare`},hf=e=>Z(mf[e]??e),gf=e=>document.getElementById(e),_f=(e,t=`0 0 24 24`)=>`<svg viewBox="${t}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">${e}</svg>`,vf={flame:_f(`<path d="M12 3c1 3 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4.2.3 1.4 1 2 1.6 2.2C10.2 8.5 11 5.5 12 3z"/><path d="M12 14.5c.8 1 1.6 1.7 1.6 2.9a1.6 1.6 0 0 1-3.2 0c0-1.2.8-1.9 1.6-2.9z"/>`),logs:_f(`<path d="M3 15.5l11-5.5 3.5 2-11 5.5z"/><ellipse cx="18.5" cy="11" rx="2.2" ry="2.6" transform="rotate(-25 18.5 11)"/><path d="M4 10.5l9-4.5 3 1.7"/><path d="M6.5 18.5l9-4.5"/>`),scrap:_f(`<path d="M4 17l5-9 4 3 3-6 4 12z"/><path d="M9 8l-1 9M13 11l1 6"/>`),berry:_f(`<circle cx="8" cy="15" r="3.2"/><circle cx="15.5" cy="14" r="3.2"/><path d="M8 11.8C9 8 11 5.5 14 4M15.5 10.8C15 8 14.5 6 14 4"/>`),trap:_f(`<path d="M3 15h18"/><path d="M4 15l2-5 2 5 2-5 2 5 2-5 2 5 2-5 2 5"/><path d="M6 18h12"/>`),flare:_f(`<path d="M6 19l8-8"/><path d="M12 9l3 3"/><path d="M17 3v3M21 7h-3M19.5 4.5l-1.6 1.6"/>`),tag:_f(`<path d="M8 6h8l2 3v9H6V9z"/><circle cx="12" cy="9.5" r="1"/><path d="M12 3v3"/>`)},yf=class{h;cache={};subs=[];hint=``;hintUntil=0;vitalSeen={hp:100,st:100,bt:100};vitalAt={hp:-9,st:-9,bt:-9};screenKey=``;screen=`none`;focusCard=0;showSubs=!0;constructor(e){this.h=e;let t=gf(`screen`);t.addEventListener(`click`,e=>{let t=e.target.closest(`[data-act],[data-card],[data-slot]`);t&&(t.dataset.act?this.h.action(t.dataset.act):t.dataset.card?this.h.card(Number(t.dataset.card)):t.dataset.slot&&this.h.replace(Number(t.dataset.slot)))}),t.addEventListener(`input`,e=>{let t=e.target;t.dataset.vol&&this.h.volume(t.dataset.vol,Number(t.value))}),t.addEventListener(`mousemove`,e=>{let t=e.target.closest(`[data-card]`);t&&Number(t.dataset.card)!==this.focusCard&&this.setFocusCard(Number(t.dataset.card))});let n=gf(`track`);for(let e of a.slice(1)){let t=document.createElement(`i`);t.style.left=`${(e.firstNight-1)/98*100}%`,n.appendChild(t)}this.buildBottom()}set(e,t,n){let r=e+t;if(this.cache[r]===n)return;this.cache[r]=n;let i=gf(e);i&&(t===`text`?i.textContent=n:t===`html`?i.innerHTML=n:t===`class`?i.className=n:i.setAttribute(`style`,n))}buildBottom(){gf(`bottom`).innerHTML=`<div class="fuel" id="fuel">${vf.flame}<div class="bar"><i id="fuelFill"></i><span class="gain" id="fuelGain"></span><b style="left:${n.fire.weakAt/n.fire.max*100}%"></b><b style="left:${n.fire.brightAt/n.fire.max*100}%"></b></div></div><div class="sep"></div>`+[`logs`,`scrap`,`berry`,`trap`,`flare`,`tag`].map(e=>`<div class="item" id="i_${e}">${vf[e]}<span id="n_${e}">0</span></div>`).join(``),gf(`vitals`).innerHTML=[`hp`,`st`,`bt`].map(e=>`<div class="vital ${e}" id="v_${e}"><span id="vl_${e}"></span><div class="bar"><i id="vf_${e}"></i></div></div>`).join(``)}relabel(){this.cache={},this.screenKey=``,this.subs=[],this.hintUntil=0,document.getElementById(`toasts`).innerHTML=``}subtitle(e,t,n=!1,r=e){if(!this.showSubs)return;let i=this.subs.find(e=>e.kind===r);i?(i.text=e,i.alarm=n,i.until=t+2.2):(this.subs.push({text:e,until:t+2.4,alarm:n,kind:r}),this.subs.length>3&&this.subs.shift())}toast(e){let t=gf(`toasts`);for(let n of Array.from(t.children))n.textContent===e&&n.remove();let n=document.createElement(`div`);for(n.textContent=e,t.appendChild(n);t.children.length>4;)t.firstElementChild.remove();setTimeout(()=>n.remove(),3e3)}setHint(e,t,n=5){this.hint=e,this.hintUntil=t+n}clearHint(){this.hintUntil=0}dirWord(e,t,n){let r=e.state.player,i=t-r.x,a=n-r.z,o=-Math.sin(r.yaw),s=-Math.cos(r.yaw),c=i*o+a*s,l=i*-s+a*o;return Z(Math.abs(c)>=Math.abs(l)?c>=0?`sAhead`:`sBehind`:l>=0?`sRight`:`sLeft`)}update(e,t,r,i){let a=e.state,o=a.player,s=a.phase===`night`||a.phase===`deathOffer`,c=a.phase===`draft`||a.phase===`victory`?Z(`dawn`):Z(s?`night`:`day`);this.set(`phase`,`text`,`${c} ${a.night} / ${n.cycle.lastNight}`),this.set(`trackPos`,`style`,`left:${(a.night-1)/98*100}%`);let l=(a.phase===`night`?n.cycle.nightSeconds:n.cycle.daySeconds)-a.t,u=(a.phase===`day`||a.phase===`night`)&&a.dayStarted&&l<=10;this.set(`timer`,`text`,u?String(Math.max(0,Math.ceil(l))):``),this.set(`timer`,`class`,u&&a.phase===`day`?`warn`:``),this.set(`fuelFill`,`style`,`width:${a.fuel/n.fire.max*100}%`),this.set(`fuel`,`class`,`fuel${a.bright?``:` weak`}`);let d=e.focus,f=d&&d.kind===`fire`&&d.usable?Math.min(e.mods.fuelPerLog,n.fire.max-a.fuel):0;this.set(`fuelGain`,`style`,`left:${a.fuel/n.fire.max*100}%;width:${f/n.fire.max*100}%`);let p={logs:o.logs,scrap:o.scrap,berry:o.berries,trap:o.traps,flare:o.flares,tag:o.tags};for(let e in p){this.set(`n_${e}`,`text`,String(p[e]));let t=p[e]===0&&e!==`logs`;this.set(`i_${e}`,`class`,`item${p[e]===0?` zero`:``}`),this.set(`i_${e}`,`style`,t&&(e===`tag`||e===`trap`||e===`berry`||e===`scrap`)?`display:none`:``)}let m={hp:[o.hp,Z(`hp`),o.hp<=40],st:[o.stamina,Z(`stamina`),o.exhausted],bt:[o.battery,Z(`battery`),o.battery<15]};for(let e of[`hp`,`st`,`bt`]){let[n,r,i]=m[e];Math.abs(n-this.vitalSeen[e])>.01&&(this.vitalSeen[e]=n,this.vitalAt[e]=t);let a=t-this.vitalAt[e]<3||i||e===`hp`&&n<100;this.set(`v_${e}`,`class`,`vital ${e}${a?` on`:``}${i?` low`:``}`),this.set(`vf_${e}`,`style`,`width:${n}%`),this.set(`vl_${e}`,`text`,r)}let h=``,g=``,_=!1,v=0;o.bench||d&&(_=!d.usable,d.kind===`snag`?(h=uf()===`ru`?`ЛКМ`:`LMB`,g=d.usable?`${Z(`hChop`)} · ${Z(`hChopLabel`)}`:Z(`hFull`),v=o.chop/e.mods.chopSeconds):d.kind===`fire`?(h=`E`,g=d.info===`fireFull`?Z(`hFireFull`):d.info===`noLogs`?Z(`hNoLogs`):`${d.info}`):d.kind===`scrap`||d.kind===`bush`?(h=`E`,g=d.usable?`${Z(`hTake`)} · ${Z(d.kind===`scrap`?`hScrap`:`hBerry`)}`:Z(`hFull`),v=o.pick/n.player.pickupSeconds):d.kind===`cache`?(h=d.usable?`E`:`F`,g=d.usable?`${Z(`hCache`)} · ${d.info===`scrap`?Z(`tScrap`,{n:2}):Z(`tFlare`)}`:Z(`hNeedLight`),_=!1):d.kind===`bench`&&(h=`E`,g=Z(`hBench`)));let y=e.trapGhost;y&&!y.ok&&o.trapHold>=0?(h=`Q`,_=!0,v=0,g=a.traps.length>=n.limits.placedTraps?Z(`hTrapLimit`):o.traps<=0&&o.scrap<e.mods.trapCost?Z(`hTrapNoScrap`):Z(`hTrapSpot`)):o.trapHold>0&&(h=`Q`,g=Z(`rTrap`),v=o.trapHold/n.trap.placeSeconds,_=!1),o.eat>0&&(v=o.eat/n.player.eatSeconds);let b=a.phase===`day`||a.phase===`night`;gf(`prompt`).hidden=!h||!b,this.set(`promptKey`,`text`,h),this.set(`promptText`,`text`,g),this.set(`prompt`,`class`,_?`off`:``),this.set(`promptBar`,`class`,v>0?`on`:``),document.querySelector(`#promptBar i`).style.width=`${Math.min(1,v)*100}%`;let x=gf(`bench`);if(x.hidden=!o.bench,o.bench){let t=[[1,Z(`rTrap`),e.mods.trapCost],[2,Z(`rFlare`),n.flare.cost],[3,Z(`rBattery`),n.recharge.cost]],r=o.craft===3?n.recharge.seconds:n.trap.craftSeconds;this.set(`bench`,`html`,`<h3>${Z(`bench`)}</h3>`+t.map(([t,n,i])=>`<div class="row${e.canCraft(t)?``:` off`}"><span class="key">${t}</span><span>${n}</span><span class="cost">${Z(`scrapCost`,{n:i})}</span>`+(o.craft===t?`<i class="prog" style="width:${Math.round(o.craftT/r*20)*5}%"></i>`:``)+`</div>`).join(``)+`<p>${Z(`close`)}</p>`)}this.set(`hint`,`text`,this.hint),this.set(`hint`,`class`,t<this.hintUntil&&b?`on`:``),this.subs=this.subs.filter(e=>e.until>t),this.set(`subs`,`html`,this.subs.map(e=>`<div class="${e.alarm?`alarm`:``}">${e.text}</div>`).join(``)),gf(`vignette`).style.opacity=String(Math.min(1,(o.hp<100?(1-o.hp/100)*.8:0)+r*.6)),gf(`flash`).style.opacity=i?String(r*.22):`0`}setFocusCard(e){this.focusCard=e,document.querySelectorAll(`.card`).forEach((t,n)=>t.classList.toggle(`focus`,n===e))}cardHtml(e,t){let n=i[e],r=n.from.length+n.to.length>11,a=n.from?`${pf(n.from)} →${r?`<br>`:` `}${pf(n.to)}`:pf(n.to);return`<button class="card${t===this.focusCard?` focus`:``}" data-card="${t}"><i class="rar ${n.rarity}"></i><div class="name">${Z(e)}</div>${af[e]??``}<div class="stat">${hf(n.stat)}</div><div class="delta${r?` long`:``}">${a}</div><span class="key">${t+1}</span></button>`}settingsHtml(e,t){let n=e.settings,r=(e,t)=>`<button class="small" data-act="${e}">${Z(t?`on`:`off`)}</button>`;return`<div class="settings"><span>${Z(`language`)}</span><button class="small" data-act="lang">${uf()===`ru`?`Русский`:`English`}</button><span>${Z(`volume`)}</span><input type="range" min="0" max="1" step="0.05" value="${n.volume}" data-vol="volume"><span>${Z(`effects`)}</span><input type="range" min="0" max="1" step="0.05" value="${n.effects}" data-vol="effects"><span>${Z(`subtitles`)}</span>${r(`subs`,n.subtitles)}<span>${Z(`shake`)}</span>${r(`shake`,n.shake)}<span>${Z(`flash`)}</span>${r(`flash`,n.flash)}<span>${Z(`lowQuality`)}</span>${r(`low`,t)}</div>`}buildChips(e){return e.cards.length?`<div class="chips"><em>${Z(`build`)}</em>${e.cards.map(e=>`<span>${Z(e)}</span>`).join(``)}</div>`:`<p>${Z(`noCards`)}</p>`}controlsHtml(){return`<div class="controls">${Z(`controls`).split(` · `).map(e=>`<span>${e}</span>`).join(``)}</div>`}show(e,t,n,r,i,a=!1){let o=t?.state,s=[e,uf(),o?.hand?.join(`,`),o?.pendingCard,o?.night,o?.player.scrap,JSON.stringify(n.settings),i,r?.revision,a].join(`|`);if(s===this.screenKey)return;let c=this.screen!==e;this.screenKey=s,this.screen=e;let l=gf(`screen`);if(l.hidden=e===`none`,e===`none`){l.innerHTML=``;return}c&&(this.focusCard=0);let u=``,d=``;if(e===`title`)d=`title`,u=`<div class="box"><div class="eyebrow">BellDeer · prototype 0.1</div><h1>${Z(`title`)}</h1><p>${Z(`tagline`)}</p><div class="btns">`+(r?`<button class="primary" data-act="continue">${Z(r.phase===`draft`?`continueDawn`:`continueRun`,{n:r.night})}</button><button data-act="new">${Z(a?`confirmNew`:`newRun`)}</button>`:`<button class="primary" data-act="play">${Z(`play`)}</button>`)+`</div>${this.settingsHtml(n,i)}${this.controlsHtml()}`+(n.best?`<p class="fine">${Z(`best`,{n:n.best})}</p>`:``)+`</div>`;else if(e===`pause`)u=`<div class="box"><div class="eyebrow">${Z(`paused`)}</div><div class="btns"><button class="primary" data-act="resume">${Z(`resume`)}</button><button data-act="title">${Z(`toTitle`)}</button></div>${this.settingsHtml(n,i)}${this.controlsHtml()}</div>`;else if(e===`draft`&&o?.hand)d=`draft`,u=`<div class="box"><div class="eyebrow">${Z(`dawn`)}</div><h2>${Z(`chooseUpgrade`)}</h2><div class="cards">${o.hand.map((e,t)=>this.cardHtml(e,t)).join(``)}</div><div class="btns"><button class="small" data-act="skip">${Z(`skip`)}</button>`+(Ed(t)?`<button class="small" data-act="reroll">${Z(`reroll`)}</button>`:``)+`</div>${o.cards.length?this.buildChips(o):``}</div>`;else if(e===`replace`&&o?.pendingCard)d=`draft`,u=`<div class="box"><div class="eyebrow">${Z(o.pendingCard)}</div><p>${Z(`replaceWhich`)}</p><div class="slots">`+o.cards.map((e,t)=>`<button data-slot="${t}"><span class="key">${t+1}</span> ${Z(e)}</button>`).join(``)+`</div><div class="btns"><button class="small" data-slot="-1">${Z(`keepBuild`)}</button></div></div>`;else if(e===`chapter`&&o){d=`draft`;let e=t.chapterOf(o.night);u=`<div class="box"><div class="eyebrow">${Z(`dawn`)}</div><h2>${Z(`chapterDone`,{n:e})}</h2><p>${o.stats.seals.includes(e)?Z(`chapterSeal`,{n:e}):Z(`chapterNoSeal`)}</p>${this.buildChips(o)}<div class="btns"><button class="primary" data-act="nextDay">${Z(`nextDay`)}</button><button data-act="endSession">${Z(`endSession`)}</button></div></div>`}else e===`session`?(d=`title`,u=`<div class="box"><h2>${Z(`endSession`)}</h2><p>${Z(`sessionSaved`)}</p><div class="btns"><button class="primary" data-act="title">OK</button></div></div>`):e===`death`&&o?(d=`dead`,u=`<div class="box"><div class="eyebrow">${Z(`night`)} ${o.night} / 99</div><h2>${Z(`lastChance`)}</h2><div class="btns"><button class="primary" data-act="revive" ${t.canRevive?``:`disabled`}>${Z(`reviveScrap`)}</button><button data-act="endRun">${Z(`endRun`)}</button></div>`+(t.canRevive?``:`<p class="fine">${Z(o.reviveUsed?`reviveUsed`:`reviveNone`)}</p>`)+`</div>`):e===`end`&&o?(d=`dead`,u=`<div class="box"><h1>${Z(`runOver`,{n:o.night})}</h1><p>${Z(`survivedNights`,{n:o.stats.nightsSurvived})}</p><p>${Z(`cause`)}</p><p>${Z(`tagsOut`,{n:o.stats.tagsBanked})}</p>${this.buildChips(o)}<div class="btns"><button class="primary" data-act="again">${Z(`again`)}</button><button data-act="saveFrame">${Z(`saveFrame`)}</button><button data-act="title">${Z(`menu`)}</button></div></div>`):e===`victory`&&o&&(d=`draft`,u=`<div class="box"><div class="eyebrow">${Z(`dawn`)}</div><h1>${Z(`victory`)}</h1><p>${Z(`victoryText`)}</p><p>${Z(`tagsOut`,{n:o.stats.tagsBanked})}</p>${this.buildChips(o)}<div class="btns"><button class="primary" data-act="again">${Z(`again`)}</button><button data-act="saveFrame">${Z(`saveFrame`)}</button></div></div>`);l.className=d,l.innerHTML=u}},bf=1080,xf=1920,Sf=72,Cf=bf/2,wf=936,Tf=.73,Ef=`'BD Mono', ui-monospace, Consolas, monospace`,Df=[1,10,20,30,50,75],Of=99;function Q(e){let t=parseInt(e.slice(1),16);return[t>>16&255,t>>8&255,t&255]}function kf(e,t,n){let r=Math.min(1,Math.max(0,n));return[e[0]+(t[0]-e[0])*r,e[1]+(t[1]-e[1])*r,e[2]+(t[2]-e[2])*r]}function Af(e,t){return[Math.min(255,e[0]*t),Math.min(255,e[1]*t),Math.min(255,e[2]*t)]}function $(e,t=1){return`rgba(${Math.round(e[0])},${Math.round(e[1])},${Math.round(e[2])},${t})`}var jf=Q(`#ece6d8`),Mf=Q(`#bf532f`),Nf=Q(`#ffc56f`),Pf=Q(`#c08338`),Ff=Q(`#23262f`),If={skyTop:Q(`#0a1220`),skyMid:Q(`#101b2e`),skyLow:Q(`#2c4261`),fog:Q(`#3a5577`),firFar:Q(`#22354f`),firMid:Q(`#142035`),firNear:Q(`#080e18`),groundCold:Q(`#121925`),groundEdge:Q(`#4d2c22`),groundWarm:Q(`#b0602e`),wood:Q(`#2b2224`),rim:Q(`#7794a8`),scrim:Q(`#06090f`)},Lf={skyTop:Q(`#5a5270`),skyMid:Q(`#6b5d7b`),skyLow:Q(`#c79aa2`),fog:Q(`#d9b3b0`),firFar:Q(`#a17f93`),firMid:Q(`#6a5873`),firNear:Q(`#2f283a`),groundCold:Q(`#473d4c`),groundEdge:Q(`#6c4d4c`),groundWarm:Q(`#a8704c`),wood:Q(`#2b2224`),rim:Q(`#e2bfb0`),scrim:Q(`#17121c`)};function Rf(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}function zf(e,t,n){return Math.min(n,Math.max(t,e))}function Bf(e,t,n=0,r=0){e.beginPath();for(let i=0;i<t.length;i++){let a=t[i];i===0?e.moveTo(a[0]+n,a[1]+r):e.lineTo(a[0]+n,a[1]+r)}e.closePath()}function Vf(e,t,n){Bf(e,t),e.fillStyle=n,e.fill()}function Hf(e,t,n,r){let i=t[0]-e[0],a=t[1]-e[1],o=Math.hypot(i,a)||1,s=-a/o,c=i/o;return[[e[0]+s*n/2,e[1]+c*n/2],[t[0]+s*r/2,t[1]+c*r/2],[t[0]-s*r/2,t[1]-c*r/2],[e[0]-s*n/2,e[1]-c*n/2]]}function Uf(e,t){let n=[],r=0;for(let t=1;t<e.length;t++){let i=Math.hypot(e[t][0]-e[t-1][0],e[t][1]-e[t-1][1]);n.push(i),r+=i}let i=zf(t,0,1)*r;for(let t=0;t<n.length;t++){if(i<=n[t]||t===n.length-1){let r=n[t]>0?i/n[t]:0;return[e[t][0]+(e[t+1][0]-e[t][0])*r,e[t][1]+(e[t+1][1]-e[t][1])*r]}i-=n[t]}return e[e.length-1]}function Wf(e,t,n,r){let i=Math.cos(r),a=Math.sin(r);return e.map(e=>{let r=e[0]-t,o=e[1]-n;return[t+r*i-o*a,n+r*a+o*i]})}function Gf(e,t){e.font=`400 ${t.size}px ${t.family}`}function Kf(e){if(typeof Intl<`u`&&typeof Intl.Segmenter==`function`){let t=[];for(let n of new Intl.Segmenter(void 0,{granularity:`grapheme`}).segment(e))t.push(n.segment);return t}return Array.from(e)}function qf(e,t,n){let r=Kf(t),i=0;for(let t of r)i+=e.measureText(t).width;return i+n*Math.max(0,r.length-1)}function Jf(e,t,n){return Gf(e,n),qf(e,t,n.size*n.tracking)}function Yf(e,t,n,r,i,a,o=.5){Gf(e,i),e.textBaseline=`alphabetic`,e.textAlign=`left`;let s=i.size*i.tracking,c=Kf(t),l=t=>{e.save(),t&&(e.shadowColor=`rgba(4,6,10,${o})`,e.shadowBlur=Math.max(6,i.size*.22),e.shadowOffsetY=Math.max(1,i.size*.03)),e.fillStyle=a;let l=n;for(let t of c)e.fillText(t,l,r),l+=e.measureText(t).width+s;e.restore()};o>0&&l(!0),l(!1)}function Xf(e){return String(e??``).replace(/\s+/g,` `).trim()}function Zf(e,t,n,r){if(Jf(e,t,n)<=r)return t;let i=Kf(t);for(;i.length>1;){i.pop();let t=i.join(``).trimEnd()+`…`;if(Jf(e,t,n)<=r)return t}return`…`}function Qf(e,t,n,r){let i=[],a=``,o=t=>{if(Jf(e,t,n)<=r){a=t;return}let o=``;for(let a of Kf(t))o&&Jf(e,o+a,n)>r?(i.push(o),o=a):o+=a;a=o};for(let s of t.split(` `))s&&(a?Jf(e,`${a} ${s}`,n)<=r?a=`${a} ${s}`:(i.push(a),a=``,o(s)):o(s));return a&&i.push(a),i}function $f(e,t,n,r,i,a,o,s){for(let c=i;c>=a;c-=2){let i={size:c,tracking:r,family:n},a=Qf(e,t,i,o);if(a.length<=s)return{lines:a,st:i}}let c={size:a,tracking:r,family:n},l=Qf(e,t,c,o).slice(0,s),u=Qf(e,t,c,o).slice(s-1).join(` `);return l[s-1]=Zf(e,u,c,o),{lines:l,st:c}}function ep(e,t,n,r){let i=.04;for(let a=104;a>=78;a-=2){let o={size:a,tracking:i,family:n};if(Jf(e,t,o)<=r)return{lines:[t],st:o}}let a=t.split(` `).filter(Boolean);for(let o=104;o>=46;o-=2){let s={size:o,tracking:i,family:n};if(Jf(e,t,s)<=r)return{lines:[t],st:s};let c=null,l=1/0;for(let t=1;t<a.length;t++){let n=a.slice(0,t).join(` `),i=a.slice(t).join(` `),o=Math.max(Jf(e,n,s),Jf(e,i,s));o<=r&&o<l&&(c=[n,i],l=o)}if(c)return{lines:c,st:s}}return $f(e,t,n,i,46,46,r,2)}function tp(e,t,n,r){let i=e.createLinearGradient(0,0,0,n.horizon);i.addColorStop(0,$(t.skyTop)),i.addColorStop(.42,$(t.skyMid)),i.addColorStop(1,$(t.skyLow)),e.fillStyle=i,e.fillRect(0,0,bf,xf);let a=Rf(r?7001:4242);if(r)for(let t=0;t<6;t++){let t=a()*bf,r=n.horizon*(.42+a()*.4),i=180+a()*320,o=8+a()*14;e.fillStyle=$(Q(`#e7b9ad`),.12+a()*.12),Bf(e,[[t-i/2,r],[t-i*.2,r-o],[t+i*.3,r-o*.7],[t+i/2,r+2],[t+i*.1,r+o*.5],[t-i*.3,r+o*.4]]),e.fill()}else for(let t=0;t<70;t++){let t=a()*bf,r=a()*a()*n.horizon*.8,i=1.2+a()*2.2;e.fillStyle=$(Q(`#c9d6e6`),.12+a()*.4),Bf(e,[[t,r-i],[t+i,r],[t,r+i],[t-i,r]]),e.fill()}}function np(e,t,n,r){let i=e.createRadialGradient(t,n,r*.6,t,n,r*4.2);i.addColorStop(0,`rgba(150,180,214,0.34)`),i.addColorStop(.35,`rgba(120,150,190,0.12)`),i.addColorStop(1,`rgba(120,150,190,0)`),e.fillStyle=i,e.fillRect(t-r*4.2,n-r*4.2,r*8.4,r*8.4);let a=[];for(let e=0;e<14;e++){let i=e/14*Math.PI*2+.2;a.push([t+Math.cos(i)*r,n+Math.sin(i)*r])}Vf(e,a,`#d7dee6`),e.save(),Bf(e,a),e.clip(),Vf(e,[[t-r,n-r],[t+r*.2,n-r],[t-r*.1,n+r*.1],[t-r,n+r*.5]],`rgba(240,244,248,0.55)`),Vf(e,[[t+r*.15,n+r*.2],[t+r,n-r*.2],[t+r,n+r],[t-r*.2,n+r]],`rgba(120,140,164,0.34)`),Vf(e,[[t-r*.45,n-r*.3],[t-r*.1,n-r*.42],[t+r*.05,n-r*.12],[t-r*.3,n+r*.04]],`rgba(140,158,180,0.42)`),Vf(e,[[t+r*.2,n+r*.3],[t+r*.5,n+r*.22],[t+r*.42,n+r*.55],[t+r*.14,n+r*.56]],`rgba(130,148,172,0.4)`),Vf(e,[[t-r*.5,n+r*.4],[t-r*.24,n+r*.34],[t-r*.3,n+r*.62]],`rgba(140,158,180,0.36)`),e.restore()}function rp(e,t,n,r){let i=e.createRadialGradient(t,n,r*.4,t,n,r*9);i.addColorStop(0,`rgba(255,226,196,0.62)`),i.addColorStop(.3,`rgba(250,196,170,0.24)`),i.addColorStop(1,`rgba(250,196,170,0)`),e.fillStyle=i,e.fillRect(0,n-r*9,bf,r*18);let a=[];for(let e=0;e<12;e++){let i=e/12*Math.PI*2+.3;a.push([t+Math.cos(i)*r,n+Math.sin(i)*r])}Vf(e,a,`#f8e2cc`)}function ip(e,t,n,r,i,a,o,s,c,l){let u=n-r,d=r-r*.07,f=(o()-.5)*i*.12,p=e=>{let n=[];for(let r=0;r<a;r++){let s=(r+1)/a,c=d/a,l=u+d*s+(o()-.5)*c*.18,p=i*(.16+.84*s**.92)*(.86+o()*.26),m=p*(.36+o()*.14);n.push([t+f*(1-s)+e*p,l]),r<a-1&&n.push([t+f*(1-s)+e*m,l-c*(.22+o()*.12)])}return n},m=p(1),h=p(-1),g=Math.max(2,i*.07),_=[t+f,u],v=u+d;Vf(e,[_,...m,[t+g,v-2],[t+g,n],[t-g,n],[t-g,v-2],...h.slice().reverse()],$(s)),c&&(Bf(e,[_,...l===1?m:h,[t,v-2]]),e.fillStyle=c,e.fill())}function ap(e,t,n,r){let i=Rf(r?911:137);for(let r=-30;r<1120;r+=34+i()*40){let a=110+i()*150;ip(e,r,n.horizon+14+i()*10,a,a*(.2+i()*.06),4+Math.floor(i()*2),i,t.firFar,null,1)}let a=e.createLinearGradient(0,n.horizon-330,0,n.horizon+60);a.addColorStop(0,$(t.fog,0)),a.addColorStop(1,$(t.fog,r?.5:.42)),e.fillStyle=a,e.fillRect(0,n.horizon-330,bf,390);let o=kf(t.firMid,t.fog,r?.2:.14);for(let r=-40;r<1140;r+=70+i()*70){let a=zf(Math.abs(r-Cf)/400,0,1),s=(230+i()*150)*(.5+.8*a*a);ip(e,r,n.horizon+26+i()*16,s,s*(.2+i()*.05),5+Math.floor(i()*2),i,t.firMid,$(o),1)}a=e.createLinearGradient(0,n.horizon-200,0,n.horizon+60),a.addColorStop(0,$(t.fog,0)),a.addColorStop(1,$(t.fog,r?.4:.34)),e.fillStyle=a,e.fillRect(0,n.horizon-200,bf,260)}function op(e,t,n,r){let i=Rf(r?3131:2718),a=Q(r?`#7a565a`:`#6a3220`),o=e.createLinearGradient(0,n.ringCY+80,0,n.ringCY-620);o.addColorStop(0,$(kf(t.firNear,a,r?.4:.55))),o.addColorStop(.45,$(kf(t.firNear,a,.16))),o.addColorStop(1,$(kf(t.firNear,t.skyLow,.1)));let s=[[-70,n.ringCY+150,1270,250,1,!1],[1160,n.ringCY+170,1340,270,-1,!1],[62,n.ringCY+60,880,150,1,!0],[1036,n.ringCY+40,800,140,-1,!0]];for(let[n,r,a,c,l,u]of s)ip(e,n,r,a,c,8+Math.floor(i()*2),i,t.firNear,u?o:null,l)}function sp(e,t,n,r){let i=Rf(r?606:505),a=1260,o=xf-n.horizon+40,s=[];for(let e=0;e<=22;e++){let t=[],r=n.horizon+o*(e/22)**1.45,c=n.horizon+o*((e+1)/22)**1.45-r;for(let n=0;n<=17;n++){let o=(i()-.5)*(a/17)*.62,s=e===0?(i()-.5)*12:(i()-.5)*c*.62;t.push([-90+a*n/17+o,r+s])}s.push(t)}let c=Cf,l=n.ringCY,u=(e,a,o,s)=>{let u=(e[0]+a[0]+o[0])/3,d=(e[1]+a[1]+o[1])/3,f=Math.hypot((u-c)/n.rx,(d-l)/n.ry),p;return p=f<1?kf(t.groundEdge,t.groundWarm,(1-f)**.85):kf(t.groundCold,t.groundEdge,Math.exp(-(f-1)*(r?1.6:3.4))*(r?.9:.72)),$(Af(p,.9+i()*.2+s))};for(let t=0;t<22;t++)for(let n=0;n<17;n++){let r=s[t][n],a=s[t][n+1],o=s[t+1][n+1],c=s[t+1][n],l=i()>.5,d=l?[r,a,o]:[r,a,c],f=l?[r,o,c]:[a,o,c];for(let[t,n]of[[d,.04],[f,-.04]]){let r=u(t[0],t[1],t[2],n);Bf(e,t),e.fillStyle=r,e.fill(),e.strokeStyle=r,e.lineWidth=1,e.stroke()}}let d=e.createLinearGradient(0,n.horizon-70,0,n.horizon+190);d.addColorStop(0,$(t.fog,0)),d.addColorStop(.3,$(t.fog,r?.62:.5)),d.addColorStop(1,$(t.fog,0)),e.fillStyle=d,e.fillRect(0,n.horizon-70,bf,260)}function cp(e,t,n,r,i,a,o,s,c){let l=c.length;e.beginPath();for(let a=0;a<=l;a++){let o=a/l*Math.PI*2,s=c[a%l],u=t+Math.cos(o)*r*s,d=n+Math.sin(o)*i*s;a===0?e.moveTo(u,d):e.lineTo(u,d)}e.closePath();for(let r=l;r>=0;r--){let i=r/l*Math.PI*2,u=c[r%l],d=t+Math.cos(i)*a*u,f=n-s+Math.sin(i)*o*u;r===l?e.moveTo(d,f):e.lineTo(d,f)}e.closePath(),e.fill(`evenodd`)}function lp(e,t,n){let r=Rf(99),i=[];for(let e=0;e<64;e++)i.push(.985+r()*.03);let a=n?.55:1;e.fillStyle=$(Mf,.14*a),cp(e,Cf,t.ringCY,t.rx+20,t.ry+9,t.rx-26,t.ry-11,0,i),e.fillStyle=$(Mf,.22*a),cp(e,Cf,t.ringCY,t.rx+9,t.ry+4,t.rx-14,t.ry-6,0,i),e.fillStyle=$(n?kf(Mf,Q(`#6c4d4c`),.45):Mf,n?.85:1),cp(e,Cf,t.ringCY,t.rx,t.ry,t.rx-9,t.ry-4,1.2,i),e.fillStyle=$(Nf,n?.5:.95),cp(e,Cf,t.ringCY,t.rx-8,t.ry-3.6,t.rx-11.5,t.ry-5.2,.9,i);for(let i=0;i<34;i++){let i=r()*Math.PI*2,a=.955+r()*.07,o=Cf+Math.cos(i)*t.rx*a,s=t.ringCY+Math.sin(i)*t.ry*a,c=(2+r()*3.4)*(.75+.35*(Math.sin(i)+1));e.fillStyle=$(r()>.45?Nf:Mf,(.6+r()*.4)*(n?.6:1)),Bf(e,[[o-c,s],[o,s-c*.6],[o+c,s],[o,s+c*.6]]),e.fill()}}function up(e,t,n){let r=Cf,i=t.ringCY+8,a=n?.74:1,o=e=>e.map(([e,t])=>[r+e*a,i+t*a]),s=Rf(n?81:80);Vf(e,o([[-78,14],[-40,-6],[44,-8],[82,12],[52,28],[-50,30]]),$(Q(`#7a2f1c`))),Vf(e,o([[-52,12],[-20,0],[30,-2],[54,12],[26,22],[-30,22]]),$(Q(`#e0772f`)));let c=(t,n,o)=>{let s=Hf([r+t[0]*a,i+t[1]*a],[r+n[0]*a,i+n[1]*a],o*a,o*a*.9);Vf(e,s,`#2a1912`),Vf(e,[s[0],s[1],[(s[1][0]+s[2][0])/2,(s[1][1]+s[2][1])/2],[(s[0][0]+s[3][0])/2,(s[0][1]+s[3][1])/2]],`#8a4a26`)};c([-84,16],[34,-30],22),c([88,18],[-30,-34],22),Vf(e,o([[-54,4],[-62,-40],[-40,-76],[-47,-122],[-16,-92],[-5,-164],[15,-106],[36,-134],[32,-76],[58,-44],[52,4]]),$(Q(`#d05a2a`))),Vf(e,o([[-38,4],[-42,-34],[-23,-64],[-19,-98],[0,-74],[9,-124],[23,-70],[40,-38],[36,4]]),$(Q(`#f08a30`))),Vf(e,o([[-22,4],[-24,-26],[-9,-50],[2,-86],[15,-44],[24,-22],[20,4]]),$(Nf)),Vf(e,o([[-10,4],[-9,-18],[2,-44],[11,-16],[9,4]]),`#fff2cf`),c([-66,26],[64,30],24);let l=(t,r,i)=>{let s=o([[t-i,r+i*.5],[t-i*.7,r-i*.4],[t+i*.2,r-i*.7],[t+i,r-i*.1],[t+i*.8,r+i*.6]]);Vf(e,s,n?`#3a3340`:`#1b1a22`),Vf(e,[s[1],s[2],s[3],[(s[1][0]+s[3][0])/2,(s[1][1]+s[3][1])/2+i*.3*a]],n?`#8b6a66`:`#6a3a28`)};l(-104,26,20),l(108,30,22),l(-58,48,17),l(70,50,16);for(let t=0;t<(n?8:13);t++){let t=20+s()*s()*260,n=r+(s()-.5)*(60+t*.7)*a,o=i-(120+t)*a,c=2+s()*3.5;e.fillStyle=$(s()>.5?Nf:Q(`#f08a30`),zf(1-t/300,.15,.95)),Bf(e,[[n,o-c],[n+c*.8,o],[n,o+c],[n-c*.8,o]]),e.fill()}e.save(),e.globalCompositeOperation=`lighter`;let u=e.createRadialGradient(r,i-50*a,10,r,i-50*a,380*a);u.addColorStop(0,`rgba(255,170,90,${n?.3:.42})`),u.addColorStop(.35,`rgba(220,100,50,${n?.1:.16})`),u.addColorStop(1,`rgba(200,80,40,0)`),e.fillStyle=u,e.fillRect(140,i-450,800,800),e.restore()}function dp(e,t,n){let r=1+.045*t,i=[],a=[[0,0],[34,-50],[96,-80],[146,-128],[170,-196]].map(([t,n])=>[t*r*e,n*r]),o=[33,28,22,15,5];for(let e=0;e<a.length-1;e++)i.push({pts:Hf(a[e],a[e+1],o[e],o[e+1]),kind:`wood`,tone:n()*2-1,rim:.6});let s=2+t;for(let o=0;o<s;o++){let c=Math.max(.13,.3-.035*s),l=c+(Math.min(.89,.6+.06*s)-c)*(s===1?.5:o/(s-1)),u=Uf(a,l),d=(88-36*l)*r*(.84+n()*.32),f=-Math.PI/2+e*(.04+.3*l+(n()-.5)*.22),p=[u[0]+Math.cos(f)*d*.58,u[1]+Math.sin(f)*d*.58],m=f-e*.32,h=[p[0]+Math.cos(m)*d*.42,p[1]+Math.sin(m)*d*.42],g=18-6*l;if(i.push({pts:Hf(u,p,g,g*.62),kind:`wood`,tone:n()*2-1,rim:.45}),i.push({pts:Hf(p,h,g*.62,2),kind:`wood`,tone:n()*2-1,rim:.45}),t>=3&&o%2==1){let t=f+e*.78,r=d*.42;i.push({pts:Hf(p,[p[0]+Math.cos(t)*r,p[1]+Math.sin(t)*r],g*.52,1.8),kind:`wood`,tone:n()*2-1,rim:.4})}}return i}function fp(e){let t=Rf(1700+e*13),n=[],r=(e,r=1)=>{n.push({pts:e,kind:`wood`,tone:t()*2-1,rim:r})},i=e=>e.map(e=>[-e[0],e[1]]);r(Hf([-46,-272],[-57,-142],48,38)),r(Hf([-57,-152],[-64,-24],36,44)),r([[-96,0],[-38,0],[-41,-30],[-86,-34]]),r(Hf([48,-272],[53,-140],48,38)),r(Hf([53,-150],[70,-24],36,44)),r([[44,0],[104,0],[95,-34],[49,-30]]),r([[-78,-160],[-38,-164],[-40,-132],[-76,-130]]),r([[34,-162],[74,-158],[72,-128],[36,-132]]),r(Hf([-132,-482],[-166,-320],42,34)),r(Hf([-166,-334],[-158,-176],34,28)),r([[-178,-184],[-140,-182],[-138,-140],[-180,-142]]);for(let e=0;e<3;e++){let t=-172+e*15,n=[t-6,-104];r(Hf([t,-146],n,12,8),.4),r(Hf(n,[t+5+e*2,-52-(e===1?10:0)],8,1.6),.4)}r(Hf([132,-482],[174,-326],42,34)),r(Hf([174,-340],[190,-186],34,28)),r([[172,-194],[210,-190],[210,-148],[174,-152]]);for(let e=0;e<3;e++){let t=180+e*15,n=[t+8,-112];r(Hf([t,-154],n,12,8),.4),r(Hf(n,[t-3+e*2,-60-(e===1?10:0)],8,1.6),.4)}r([[-72,-344],[72,-344],[66,-274],[-66,-274]]),n.push({pts:[[-56,-470],[56,-470],[56,-356],[-56,-356]],kind:`hollow`,tone:0,rim:0}),n.push({pts:[[-2.5,-470],[2.5,-470],[2.5,-444],[-2.5,-444]],kind:`bellDark`,tone:0,rim:0}),n.push({pts:[[-8,-448],[8,-448],[15,-436],[20,-400],[27,-389],[-27,-389],[-20,-400],[-15,-436]],kind:`bell`,tone:0,rim:0}),n.push({pts:[[-8,-448],[-1,-448],[-4,-389],[-27,-389],[-20,-400],[-15,-436]],kind:`bellDark`,tone:0,rim:0}),n.push({pts:[[8,-448],[15,-436],[20,-400],[27,-389],[15,-389],[11,-436]],kind:`bellLight`,tone:0,rim:0}),n.push({pts:[[0,-389],[7,-381],[0,-373],[-7,-381]],kind:`bellDark`,tone:0,rim:0}),r([[-92,-496],[-52,-494],[-50,-338],[-88,-340]]),r([[52,-494],[92,-496],[88,-340],[50,-338]]),r([[-90,-368],[90,-366],[86,-334],[-86,-332]]),r([[-98,-504],[98,-506],[94,-466],[-94,-464]]);for(let e=0;e<8;e++){let n=-88+e*21.5+(t()-.5)*4,i=25+t()*7,a=-248+t()*46-(e===3||e===4?34:0);r([[n,-344],[n+i,-344],[n+i-2,a-20],[n+i/2+(t()-.5)*8,a],[n+2,a-14]],.6)}let a=Hf([-28,-518],[-154,-464],32,27);r(Hf([-74,-490],[-176,-436],25,20)),r(i(Hf([-74,-492],[-180,-440],25,20))),r(a),r(i(Hf([-28,-518],[-158,-468],32,27))),r(Hf([0,-504],[3,-566],34,26));let o=[];for(let t of[-1,1]){let n=Rf(5200+e*31+(t===1?7:0));for(let r of dp(t,e,n))o.push({...r,pts:r.pts.map(e=>[e[0]+t*24,e[1]-640])})}o.push({pts:[[-41,-654],[41,-654],[35,-596],[15,-514],[-13,-514],[-35,-596]],kind:`wood`,tone:-.3,rim:1}),o.push({pts:[[4,-654],[41,-654],[35,-596],[15,-514],[2,-514]],kind:`woodLit`,tone:0,rim:1}),o.push({pts:[[-47,-662],[47,-664],[44,-640],[-45,-638]],kind:`wood`,tone:.4,rim:1});for(let e of o)n.push({...e,pts:Wf(e.pts,0,-560,-.075)});return n}function pp(e,t,n,r,i,a,o){let s=Q(`#5a2c20`);for(let c of t){let t=c.pts.map(r);if(c.kind===`hollow`){Vf(e,t,o);continue}if(c.kind===`bell`){Vf(e,t,$(Pf));continue}if(c.kind===`bellDark`){Vf(e,t,$(Af(Pf,.62)));continue}if(c.kind===`bellLight`){Vf(e,t,$(kf(Pf,Q(`#ffe0a0`),.5)));continue}let l=0;for(let e of c.pts)l+=e[1];l/=c.pts.length;let u=c.tone>=0?kf(n.wood,Q(`#3b3033`),c.tone*.55):kf(n.wood,Q(`#1c1618`),-c.tone*.6);c.kind===`woodLit`&&(u=kf(n.wood,n.rim,.16)),a>0&&(u=kf(u,s,zf(1- -l/a,0,1)*.5));let d=i*c.rim;e.save(),Bf(e,t),e.clip(),e.fillStyle=$(n.rim),e.fill(),Bf(e,t,-d,d*.72),e.fillStyle=$(u),e.fill(),e.strokeStyle=$(u),e.lineWidth=1,e.stroke(),e.restore()}}function mp(e,t,n,r){let i=fp(r),a=0;for(let e of i)for(let t of e.pts)a=Math.min(a,t[1]);let o=(n.feetY-n.figureTop)/Math.max(980,-a),s=e=>[Cf+e[0]*o,n.feetY+e[1]*o];e.fillStyle=`rgba(8,10,16,0.5)`,e.beginPath(),e.ellipse(Cf,n.feetY+2,128*o,13*o,0,0,Math.PI*2),e.fill(),pp(e,i,t,s,Math.max(2.6,5.2*o),330,`rgba(10,8,12,0.82)`),e.save(),e.globalCompositeOperation=`lighter`;let c=s([0,-414]),l=e.createRadialGradient(c[0],c[1],2,c[0],c[1],70*o);l.addColorStop(0,`rgba(192,131,56,0.3)`),l.addColorStop(1,`rgba(192,131,56,0)`),e.fillStyle=l,e.fillRect(c[0]-80*o,c[1]-80*o,160*o,160*o),e.restore()}function hp(e,t,n){let r=Rf(404),i=(n,i,a,o,s)=>{let c=[];for(let e=0;e<11;e++){let t=e/11*Math.PI*2,o=.82+r()*.3;c.push([i+n*130*s+Math.cos(t)*170*s*o,a-8*s+Math.sin(t)*34*s*o])}Vf(e,c,`rgba(70,60,72,0.5)`),Vf(e,c.slice(0,6),`rgba(168,154,158,0.36)`);let l=dp(n,4,Rf(n===1?5407:5400));l.unshift({pts:[[-n*26,14],[n*16,18],[n*22,-18],[-n*8,-26],[-n*30,-8]],kind:`wood`,tone:-.4,rim:.8});let u=Math.cos(o),d=Math.sin(o),f=e=>{let t=e[0]*u-e[1]*d,n=e[0]*d+e[1]*u;return[i+t*s,a+n*s*.78]};for(let t of l)Bf(e,t.pts.map(f),4,7),e.fillStyle=`rgba(40,30,44,0.42)`,e.fill();pp(e,l,t,f,3.4,0,``)};i(-1,456,n.ringCY+60,-.62,.98),i(1,636,n.ringCY+70,.66,.92)}function gp(e,t){let n=e.createRadialGradient(Cf,xf*.52,xf*.3,Cf,xf*.52,xf*.66);n.addColorStop(0,`rgba(0,0,0,0)`),n.addColorStop(1,t?`rgba(24,16,30,0.26)`:`rgba(0,0,0,0.5)`),e.fillStyle=n,e.fillRect(0,0,bf,xf)}function _p(e,t,n,r,i,a){e.beginPath(),e.moveTo(t+a,n),e.lineTo(t+r-a,n),e.lineTo(t+r,n+a),e.lineTo(t+r,n+i-a),e.lineTo(t+r-a,n+i),e.lineTo(t+a,n+i),e.lineTo(t,n+i-a),e.lineTo(t,n+a),e.closePath()}function vp(e,t,n){let r={chips:[],rows:0};for(let i of[28,26,24,22]){let a=[],o=0,s=0;for(let r of t){let t={size:i,tracking:.03,family:n};for(let a=i;a>=18&&Jf(e,r,t)>888;a-=2)t={size:a,tracking:.03,family:n};let c=Zf(e,r,t,888),l=Math.min(wf,Math.ceil(Jf(e,c,t))+48);o>0&&o+l>wf&&(o=0,s++),a.push({text:c,st:t,x:o,row:s,w:l}),o+=l+14}if(r={chips:a,rows:a.length?s+1:0},r.rows<=2)break}return r}function yp(e){let t=document.createElement(`canvas`);t.width=bf,t.height=xf;let n=t.getContext(`2d`);if(!n)throw Error(`resultCard: 2D canvas is not available`);let r=e.fontFamily&&e.fontFamily.trim()?e.fontFamily:Ef,i=!!e.victory,a=i?Lf:If,o=zf(Math.round(Number.isFinite(e.night)?e.night:1),1,Of),s=zf(Math.round(Number.isFinite(e.stage)?e.stage:0),0,5),c=Nf,l=i?.62:1,u=(e,t,r,i,a,o=.5)=>Yf(n,e,t,r,i,a,o*l),d=Xf(e.headline),f=Xf(e.subline),p=Xf(e.cause),m=Xf(e.tagsLine),h=Xf(e.buildLabel),g=Xf(e.footer),_=(Array.isArray(e.build)?e.build:[]).map(Xf).filter(Boolean).slice(0,4),v={size:148,tracking:-.02,family:r},y=String(o),b=Jf(n,y,v),x=Sf+v.size*Tf,S=d?ep(n,d,r,wf):{lines:[],st:{size:96,tracking:.04,family:r}},C=S.st.size*1.14,w=x+58,T=w+S.st.size*Tf+C*Math.max(0,S.lines.length-1),E=f?$f(n,f,r,.05,38,26,wf,2):{lines:[],st:{size:38,tracking:.05,family:r}},D=E.st.size*1.3,O=(S.lines.length?T:x)+40+E.st.size*Tf,k=E.lines.length?O+D*(E.lines.length-1)+12:T+12,A=p?$f(n,p,r,.03,36,28,910,3):{lines:[],st:{size:36,tracking:.03,family:r}},j=A.st.size*1.32,M=m?$f(n,m,r,.05,30,24,910,2):{lines:[],st:{size:30,tracking:.05,family:r}},ee=M.st.size*1.34,te={size:22,tracking:.22,family:r},ne=h?Zf(n,h,te,wf):``,re=vp(n,_,r),ie={size:30,tracking:.2,family:r};if(g)for(let e=30;e>=20&&Jf(n,g,ie)>876;e-=2)ie.size=e;let ae=g?Zf(n,g,ie,876):``,oe=1848,se=oe-ie.size*Tf-30,N=se-36,ce=re.rows>0?re.rows*60+(re.rows-1)*14:0,le=N-ce;re.rows>0&&(N=le-20);let ue=N;re.rows>0&&ne?N-=te.size*Tf+40:re.rows>0&&(N-=20);let de=N;M.lines.length&&(N-=M.st.size*Tf+ee*(M.lines.length-1)+26);let fe=N;A.lines.length&&(N-=A.st.size*Tf+j*(A.lines.length-1));let pe=N,me=Math.max(Math.min(1440,pe-178),k+430),he=me-88-46,ge={ringCY:me,rx:372,ry:88,feetY:he,horizon:he-74,figureTop:Math.max(k+30,he-880)};if(tp(n,a,ge,i),i)rp(n,716,ge.horizon-150,50);else{let e=(ge.feetY-ge.figureTop)/980;np(n,Cf+250*e,ge.figureTop+172*e,zf(100*e,54,88))}ap(n,a,ge,i),sp(n,a,ge,i),i||mp(n,a,ge,s),lp(n,ge,i),i&&hp(n,a,ge),up(n,ge,i),op(n,a,ge,i),gp(n,i);let _e=n.createLinearGradient(0,0,0,k+120);_e.addColorStop(0,$(a.scrim,i?.24:.55)),_e.addColorStop(.7,$(a.scrim,i?.14:.3)),_e.addColorStop(1,$(a.scrim,0)),n.fillStyle=_e,n.fillRect(0,0,bf,k+120);let ve=pe-104,ye=n.createLinearGradient(0,ve,0,xf);ye.addColorStop(0,$(a.scrim,0)),ye.addColorStop(Math.min(.5,104/(xf-ve)),$(a.scrim,.8)),ye.addColorStop(1,$(a.scrim,.94)),n.fillStyle=ye,n.fillRect(0,ve,bf,xf-ve);let be=$(jf),xe=$(jf,.62);u(y,Sf-v.size*.04,x,v,be);let Se=Sf+b+40,Ce=1008,we=x-40,Te=e=>Se+(e-1)/98*(Ce-Se),Ee={size:28,tracking:.1,family:r};u(`/ ${Of}`,Se,we-30,Ee,xe),n.fillStyle=$(jf,.26),n.fillRect(Se,we-1,Ce-Se,2),n.fillStyle=$(c),n.fillRect(Se,we-1.5,Math.max(0,Te(o)-Se),3);let De={size:18,tracking:.02,family:r},Oe=-1/0;for(let e of Df){let t=Math.round(Te(e)),r=e<=o;n.fillStyle=r?$(c):$(jf,.5),n.fillRect(t-1,we-9,2,18);let i=String(e),a=Jf(n,i,De),s=zf(t-a/2,Se,Ce-a);s>Oe+8&&(u(i,s,x,De,r?$(jf,.8):$(jf,.46),.4),Oe=s+a)}n.fillStyle=$(jf,.5),n.fillRect(1006,we-9,2,18);let ke=Te(o);if(n.fillStyle=$(a.scrim,.9),Bf(n,[[ke,we-13],[ke+13,we],[ke,we+13],[ke-13,we]]),n.fill(),n.fillStyle=$(c),Bf(n,[[ke,we-9],[ke+9,we],[ke,we+9],[ke-9,we]]),n.fill(),S.lines.forEach((e,t)=>u(e,Sf,w+S.st.size*Tf+C*t,S.st,be,.6)),E.lines.forEach((e,t)=>u(e,Sf,O+D*t,E.st,$(jf,.86))),A.lines.length){let e=fe-j*(A.lines.length-1),t=e-A.st.size*Tf-4,r=(M.lines.length?de:fe)+6;n.fillStyle=$(i?c:Mf),n.fillRect(Sf,t,5,r-t),A.lines.forEach((t,n)=>u(t,98,e+j*n,A.st,be))}if(M.lines.forEach((e,t)=>u(e,Sf+(A.lines.length?26:0),de-ee*(M.lines.length-1-t),M.st,$(jf,.78))),re.rows>0){ne&&u(ne,Sf,ue,te,xe,.4);for(let e of re.chips){let t=Sf+e.x,r=le+e.row*74;_p(n,t+.5,r+.5,e.w-1,59,9),n.fillStyle=$(Ff,.94),n.fill(),n.strokeStyle=`rgba(236,230,216,0.25)`,n.lineWidth=2,n.stroke();let i=Jf(n,e.text,e.st);u(e.text,t+(e.w-i)/2,r+30+e.st.size*Tf/2,e.st,be,0)}}n.fillStyle=$(jf,.22),n.fillRect(Sf,se,wf,2),ae&&u(ae,Sf,oe,ie,$(jf,.74),.4);let Ae=oe-ie.size*Tf/2;return n.fillStyle=$(Mf),Bf(n,[[996,Ae-12],[1008,Ae],[996,Ae+12],[984,Ae]]),n.fill(),n.fillStyle=$(Nf),Bf(n,[[996,Ae-5],[1001,Ae],[996,Ae+5],[991,Ae]]),n.fill(),t}function bp(e,t=`99-nights-result.png`){let n=yp(e),r=(e,n)=>{let r=document.createElement(`a`);r.href=e,r.download=t,r.rel=`noopener`,r.style.display=`none`,document.body.appendChild(r),r.click(),r.remove(),setTimeout(n,1500)};typeof n.toBlob==`function`?n.toBlob(e=>{if(!e)return;let t=URL.createObjectURL(e);r(t,()=>URL.revokeObjectURL(t))},`image/png`):r(n.toDataURL(`image/png`),()=>void 0)}var xp=new URLSearchParams(location.search),Sp=xp.has(`debug`),Cp=xp.has(`nolock`),wp=new class{canvas=document.getElementById(`view`);store=new h;platform=new g;audio=new e;view=new vd(this.canvas);hud;world;mode=`title`;chapterPanel=!1;confirmNew=!1;keys=new Set;edge=Od();yaw=0;pitch=0;lmb=!1;freeLook=Cp;releasing=!1;lockPromise=!1;acc=0;last=performance.now();now=0;stepSubAt=-9;moved=!1;birdsNoted=!1;frames=[];lowNoted=!1;constructor(){nf();let e=this.store.profile.settings,t=xp.get(`lang`);lf(e.lang??(t===`ru`||t===`en`?t:df())),this.audio.volume=e.volume,this.audio.effects=e.effects,this.view.settings.shake=e.shake,this.view.settings.flash=e.flash,(e.lowQuality||xp.has(`low`))&&this.view.setLowQuality(!0),this.hud=new yf({action:e=>this.action(e),card:e=>this.chooseCard(e),replace:e=>this.chooseReplace(e),volume:(t,n)=>{e[t]=n,this.audio[t]=n,this.audio.applyVolume(),this.store.saveProfile()}}),this.hud.showSubs=e.subtitles;let n=this.store.run;this.setWorld(n?new $d(structuredClone(n)):$d.start({seed:this.newSeed()})),this.bind(),document.getElementById(`boot`)?.remove(),document.getElementById(`hud`).hidden=!1,Sp&&(document.getElementById(`debug`).hidden=!1),v(`playable`),requestAnimationFrame(e=>this.frame(e))}newSeed(){let e=xp.get(`seed`);return e?Number(e)>>>0:Math.random()*4294967295>>>0}setWorld(e){this.world=e,this.view.setForest(e.forest),this.yaw=e.state.player.yaw,this.pitch=e.state.player.pitch,this.acc=0,this.moved=!1,this.birdsNoted=!1,this.chapterPanel=!1}bind(){let e=this.canvas;window.addEventListener(`resize`,()=>this.view.resize()),window.addEventListener(`keydown`,e=>this.keyDown(e)),window.addEventListener(`keyup`,e=>this.keys.delete(e.code)),window.addEventListener(`blur`,()=>{this.keys.clear(),this.lmb=!1,this.pause()}),document.addEventListener(`visibilitychange`,()=>{document.hidden&&this.pause()}),e.addEventListener(`mousedown`,e=>{e.button===0&&(this.audio.unlock(),this.mode===`play`&&this.simActive&&(this.lmb=!0,this.lock()))}),window.addEventListener(`mouseup`,e=>{e.button===0&&(this.lmb=!1)}),e.addEventListener(`contextmenu`,e=>e.preventDefault()),document.addEventListener(`mousemove`,t=>{this.mode===`play`&&this.simActive&&(document.pointerLockElement===e||this.freeLook)&&(this.yaw-=t.movementX*.0022,this.pitch=Math.max(-1.45,Math.min(1.45,this.pitch-t.movementY*.0022)))}),document.addEventListener(`pointerlockchange`,()=>{let t=document.pointerLockElement===e;e.classList.toggle(`playing`,t||this.freeLook&&this.mode===`play`),!t&&!this.releasing&&!this.freeLook&&this.mode===`play`&&this.simActive&&this.pause(),this.releasing=!1}),document.addEventListener(`pointerlockerror`,()=>{this.lockPromise||(this.freeLook=!0)})}get simActive(){let e=this.world.state.phase;return e===`day`||e===`night`}lock(){if(!(this.freeLook||document.pointerLockElement===this.canvas))try{let e=this.canvas.requestPointerLock();e&&typeof e.catch==`function`&&(this.lockPromise=!0,e.catch(e=>{let t=e?.name;(t===`SecurityError`||t===`NotSupportedError`)&&(this.freeLook=!0)}))}catch{this.freeLook=!0}}unlock(){document.pointerLockElement===this.canvas&&(this.releasing=!0,document.exitPointerLock())}keyDown(e){if(e.repeat)return;let t=e.code;[`Space`,`ArrowUp`,`ArrowDown`,`Tab`].includes(t)&&e.preventDefault(),this.audio.unlock();let n=t.startsWith(`Digit`)?Number(t.slice(5)):t.startsWith(`Numpad`)?Number(t.slice(6)):NaN,r=this.hud.screen;if(r===`draft`){let e=this.world.state.hand?.length??0;n>=1&&n<=e?this.chooseCard(n-1):t===`ArrowRight`||t===`KeyD`?this.hud.setFocusCard((this.hud.focusCard+1)%Math.max(1,e)):t===`ArrowLeft`||t===`KeyA`?this.hud.setFocusCard((this.hud.focusCard+e-1)%Math.max(1,e)):(t===`Enter`||t===`Space`)&&this.chooseCard(this.hud.focusCard)}else if(r===`replace`)n>=1&&n<=4?this.chooseReplace(n-1):(t===`Escape`||n===0)&&this.chooseReplace(-1);else if(r===`chapter`)(t===`Enter`||t===`Space`)&&this.action(`nextDay`);else if(r===`pause`)(t===`KeyP`||t===`Enter`)&&this.action(`resume`);else if(r===`title`)t===`Enter`&&this.action(this.store.run?`continue`:`play`);else if(r===`none`)switch(this.keys.add(t),t){case`KeyE`:this.edge.interact=!0;break;case`KeyB`:this.edge.eat=!0;break;case`KeyF`:this.edge.light=!0;break;case`KeyV`:this.edge.pulse=!0;break;case`KeyT`:this.edge.torch=!0;break;case`KeyG`:this.edge.flare=!0;break;case`KeyP`:this.pause();break;default:n>=1&&n<=3&&(this.edge.craft=n)}}buildInput(){let e=this.keys,t=this.edge;return t.mx=(e.has(`KeyD`)||e.has(`ArrowRight`)?1:0)-(e.has(`KeyA`)||e.has(`ArrowLeft`)?1:0),t.mz=(e.has(`KeyW`)||e.has(`ArrowUp`)?1:0)-(e.has(`KeyS`)||e.has(`ArrowDown`)?1:0),t.sprint=e.has(`ShiftLeft`)||e.has(`ShiftRight`),t.chop=this.lmb,t.trapHold=e.has(`KeyQ`),t.yaw=this.yaw,t.pitch=this.pitch,this.edge=Od(),t}pause(){this.mode===`play`&&this.simActive&&(this.mode=`pause`,this.lmb=!1,this.unlock(),this.platform.gameplay(!1),this.audio.suspend(!0))}startPlay(){this.mode=`play`,this.audio.unlock(),this.audio.suspend(!1),this.last=performance.now(),this.simActive&&(this.lock(),this.platform.gameplay(!0),this.canvas.classList.toggle(`playing`,this.freeLook),this.canvas.focus())}action(e){let t=this.store.profile.settings,n=this.world;switch(this.audio.unlock(),this.audio.click(),e){case`play`:case`new`:case`again`:{if(e===`new`&&this.store.run&&!this.confirmNew){this.confirmNew=!0;break}this.confirmNew=!1,this.store.run&&this.finishRun(`abandoned`);let t=this.store.profile,n=Number(xp.get(`night`))||1;this.setWorld($d.start({seed:this.newSeed(),night:n,bonusTrap:t.bonusTrap})),t.bonusTrap=!1,this.store.saveRun(this.world.serialize()),this.startPlay();break}case`continue`:this.confirmNew=!1,v(`run_resumed`,{night:n.state.night}),this.resumeDraftIfPicked(),this.startPlay();break;case`resume`:this.startPlay();break;case`title`:(this.simActive||n.state.phase===`draft`)&&this.saveNow(),this.mode=`title`,this.unlock(),this.platform.gameplay(!1),this.store.run||this.setWorld($d.start({seed:this.newSeed()}));break;case`lang`:lf(uf()===`ru`?`en`:`ru`),t.lang=uf(),this.hud.relabel(),this.store.saveProfile();break;case`shake`:t.shake=this.view.settings.shake=!t.shake,this.store.saveProfile();break;case`flash`:t.flash=this.view.settings.flash=!t.flash,this.store.saveProfile();break;case`subs`:t.subtitles=this.hud.showSubs=!t.subtitles,this.store.saveProfile();break;case`low`:t.lowQuality=!this.view.lowQuality,this.view.setLowQuality(t.lowQuality,!0),this.store.saveProfile();break;case`skip`:Td(n)&&this.afterPick(`skip`);break;case`reroll`:Dd(n)&&this.saveNow();break;case`nextDay`:this.chapterPanel=!1,n.beginDay(),this.handleEvents(),this.startPlay();break;case`endSession`:this.saveNow(),this.mode=`session`;break;case`revive`:n.revive()&&(this.handleEvents(),this.yaw=Math.atan2(n.state.player.x,n.state.player.z),this.pitch=0,this.startPlay());break;case`endRun`:n.endRun(),this.finishRun(`deer`);break;case`saveFrame`:{let e=n.state,t=e.phase===`victory`,r={headline:t?Z(`victory`):Z(`runOver`,{n:e.night}),subline:Z(`survivedNights`,{n:e.stats.nightsSurvived}),cause:Z(t?`victoryText`:`cause`),tagsLine:Z(`tagsOut`,{n:e.stats.tagsBanked}),buildLabel:Z(`build`),build:e.cards.map(e=>Z(e)),footer:Z(`title`),night:e.night,stage:n.stage,victory:t},i=()=>bp(r,`99-nights-night-${e.night}.png`);document.fonts?.load?document.fonts.load(`400 96px 'BD Mono'`,r.headline).then(i,i):i();break}}}saveNow(){this.store.saveRun(this.world.serialize())}resumeDraftIfPicked(){let e=this.world.state;e.phase===`draft`&&e.hand&&e.hand.length===0&&!e.pendingCard&&(e.stats.nightsSurvived%3==0?this.chapterPanel=!0:(this.world.beginDay(),this.handleEvents()))}chooseCard(e){let t=this.world.state.hand?.[e]??``,n=Cd(this.world,e);n!==`invalid`&&(this.audio.cardPick(),n===`done`&&this.afterPick(t))}chooseReplace(e){let t=this.world.state.pendingCard;wd(this.world,e)&&this.afterPick(e>=0?t??``:`keep`)}afterPick(e){let t=this.world,n=t.state;v(`draft_picked`,{id:e,night:n.night}),n.hand=[],n.stats.nightsSurvived%3==0?(this.chapterPanel=!0,this.saveNow()):(t.beginDay(),this.handleEvents(),this.startPlay())}finishRun(e){let t=this.world.state,n=this.store.profile;n.best=Math.max(n.best,e===`victory`?99:t.night),n.runs++,n.nights+=t.stats.nightsSurvived;for(let e of t.stats.seals)n.seals.includes(e)||n.seals.push(e);let r=this.world.stage;for(let e=0;e<=r;e++)n.seenStages.includes(e)||n.seenStages.push(e);t.stats.nightsSurvived>=3&&(n.bonusTrap=!0),this.store.clearRun(),this.platform.gameplay(!1),v(`run_ended`,{reason:e,night:t.night,nights:t.stats.nightsSurvived})}handleEvents(){let e=this.world,t=this.hud,n=this.audio,r=this.now;for(let i of e.drainEvents())switch(this.view.onEvent(i,e),i.type){case`chopHit`:n.chop();break;case`chopDone`:n.timber(),t.toast(Z(`tLogs`,{n:i.logs})),e.state.stats.logsChopped===i.logs&&v(`first_chop`,{t:e.state.t}),e.state.fedOnce||t.setHint(Z(`hintFire`),r,7);break;case`feed`:n.feed(),t.clearHint(),e.state.stats.feeds===1&&v(`first_feed`,{t:e.state.t});break;case`pickup`:n.pickup(),i.n>0&&t.toast(Z(i.kind===`scrap`?`tScrap`:`tBerry`,{n:i.n}));break;case`eat`:n.eat();break;case`light`:n.click(i.on);break;case`torch`:n.torch();break;case`trapPlaced`:n.trapSet(),t.toast(Z(`tTrap`));break;case`trapSnap`:n.trapSnap(i.x,i.z),t.subtitle(Z(`sTrap`,{d:t.dirWord(e,i.x,i.z)}),r,!0);break;case`flare`:n.flare(i.x,i.z);break;case`pulse`:n.click(!0);break;case`craft`:n.pickup(),t.toast(Z(i.recipe===1?`tTrapReady`:i.recipe===2?`tFlare`:`tBattery`));break;case`bench`:n.click(i.open);break;case`cacheCue`:{let a=e.forest.posts[i.post];n.tin(a.x,a.z),t.subtitle(Z(`sTin`,{d:t.dirWord(e,a.x,a.z)}),r);break}case`cacheOpen`:{let a=e.forest.posts[i.post];n.tin(a.x,a.z),!e.state.player.lightOn&&e.state.stats.cachesClaimed===0&&t.setHint(Z(`hintLight`),r,5);break}case`cacheRevealed`:n.bank();break;case`cacheClaim`:n.pickup(),t.toast(i.reward===`scrap`?Z(`tScrap`,{n:2}):Z(`tFlare`)),t.toast(Z(`tTag`)),v(`cache_claim`,{night:e.state.night});break;case`cacheClosed`:t.toast(Z(`tCacheGone`));break;case`tagsBanked`:n.bank(),t.toast(Z(`tBank`,{n:i.n})),i.seal&&t.toast(Z(`tSeal`,{n:i.seal}));break;case`fireWeak`:t.subtitle(Z(`sFireWeak`),r,!0);break;case`fireBright`:t.subtitle(Z(`sFireBright`),r);break;case`ember`:t.toast(Z(`tEmber`));break;case`nightStart`:v(`night_start`,{n:i.n}),i.n===1&&t.setHint(Z(`hintNight`),r,8);break;case`duskStep`:n.deerStep(i.x,i.z,!1),n.deerStep(i.x,i.z,!1),t.subtitle(Z(`sSteps`,{d:t.dirWord(e,i.x,i.z)}),r,!1,`steps`);break;case`dawn`:n.dawn(),v(`night_survived`,{n:i.n}),this.unlock(),this.platform.gameplay(!1),this.keys.clear(),this.lmb=!1;break;case`dayStart`:this.birdsNoted=!1;break;case`deerChime`:n.chime(i.x,i.z),t.subtitle(Z(`sChime`,{d:t.dirWord(e,i.x,i.z)}),r);break;case`deerCue`:t.subtitle(Z(`sDouble`,{d:t.dirWord(e,i.x,i.z)}),r,!0);break;case`deerStrike`:n.strike(i.x,i.z);break;case`deerHunt`:v(`hunt_started`,{night:e.state.night});break;case`deerSwing`:n.swing(i.x,i.z);break;case`deerStunned`:n.stunned(),t.subtitle(Z(`sStunned`),r);break;case`deerRetreat`:t.subtitle(Z(`sRetreat`),r);break;case`deerStep`:{n.deerStep(i.x,i.z,i.run);let a=e.state.player;Math.hypot(i.x-a.x,i.z-a.z)<20&&r-this.stepSubAt>3&&(this.stepSubAt=r,t.subtitle(Z(i.run?`sRun`:`sSteps`,{d:t.dirWord(e,i.x,i.z)}),r,i.run,`steps`));break}case`hit`:n.hit();break;case`death`:n.death(),this.unlock(),this.platform.gameplay(!1),this.keys.clear(),this.lmb=!1;break;case`revived`:t.toast(Z(`tRevived`));break;case`victory`:this.finishRun(`victory`);break;case`denied`:{let e={battery:`dBattery`,logs:`dLogs`,berries:`dBerries`,flares:`dFlares`,pulse:`dPulse`,craft:`dCraft`}[i.why];e&&(n.deny(),t.toast(Z(e)));break}case`save`:e.state.phase!==`victory`&&this.saveNow()}}frame(e){requestAnimationFrame(e=>this.frame(e));let n=Math.min(.1,Math.max(0,(e-this.last)/1e3));this.last=e,this.now+=n;let r=this.world,i=r.state;if(this.mode===`play`&&this.simActive){this.acc+=n;let e=0;for(;this.acc>=.03333333333333333&&e++<5;)if(r.step(this.buildInput()),this.acc-=t,this.handleEvents(),!this.simActive){this.acc=0;break}e>=5&&(this.acc=0),this.tips()}let a=this.simActive&&this.mode===`play`?this.acc/t:1,o=i.player;this.audio.listener={x:o.x,z:o.z,yaw:this.yaw};let s=Math.hypot(o.x-r.prev.px,o.z-r.prev.pz)*30;this.audio.ambient(n,{fuel:i.fuel,bright:i.bright,fireDist:Math.hypot(o.x,o.z),night:+(i.phase===`night`),birds:i.phase===`day`&&i.t<52,stamina:o.stamina,speed:this.mode===`play`&&this.simActive?s:0,sprint:o.sprinting,active:this.mode!==`pause`}),this.view.titleMode=this.mode===`title`||this.mode===`session`,this.view.update(r,a,n,this.yaw,this.pitch),this.mode===`play`&&this.simActive&&!this.freeLook&&document.pointerLockElement!==this.canvas&&this.hud.setHint(Z(`clickToPlay`),this.now,.3),this.view.lowQuality&&!this.lowNoted&&!this.store.profile.settings.lowQuality&&!xp.has(`low`)&&(this.lowNoted=!0,this.hud.toast(Z(`tLow`)));let c=`none`;this.mode===`title`?c=`title`:this.mode===`session`?c=`session`:this.mode===`pause`?c=`pause`:i.phase===`draft`?c=i.pendingCard?`replace`:this.chapterPanel?`chapter`:`draft`:i.phase===`deathOffer`?c=`death`:i.phase===`end`?c=`end`:i.phase===`victory`&&(c=`victory`),this.hud.show(c,r,this.store.profile,this.store.run,this.view.lowQuality,this.confirmNew),this.hud.update(r,this.now,this.view.hitPulse,this.view.settings.flash),document.getElementById(`hud`).classList.toggle(`menu`,c!==`none`),Sp&&this.debug(n)}tips(){let e=this.world.state;e.player,!this.moved&&(this.keys.has(`KeyW`)||this.keys.has(`KeyA`)||this.keys.has(`KeyS`)||this.keys.has(`KeyD`))&&(this.moved=!0,this.hud.clearHint()),e.night===1&&e.phase===`day`&&!this.moved&&e.dayStarted&&e.t>3&&e.t<3.1&&this.hud.setHint(Z(`hintMove`),this.now,6),e.phase===`day`&&e.t>=52&&!this.birdsNoted&&(this.birdsNoted=!0,this.hud.subtitle(Z(`sBirds`),this.now))}debug(e){this.frames.push(e*1e3),this.frames.length>240&&this.frames.shift();let t=[...this.frames].sort((e,t)=>e-t),n=t[Math.floor(t.length/2)]||16,r=t[Math.floor(t.length*.95)]||16,i=this.world.state,a=this.view.info;document.getElementById(`debug`).textContent=`fps ${(1e3/n).toFixed(0)}  med ${n.toFixed(1)} ms  p95 ${r.toFixed(1)} ms\ncalls ${a.calls}  tris ${a.triangles}  low ${this.view.lowQuality}\n${i.phase} n${i.night} t${i.t.toFixed(1)}  F ${i.fuel.toFixed(1)} R ${this.world.radius.toFixed(1)} ${i.bright?`bright`:`weak`}\ndeer ${i.deer.mode} A ${i.deer.threat.toFixed(0)} d ${Math.hypot(i.deer.x-i.player.x,i.deer.z-i.player.z).toFixed(1)} stage ${this.world.stage}\nseed ${i.seed} ${this.world.forest.template?`template`:`jitter`}  events ${y.length}`}api={start:()=>this.action(this.store.run?`continue`:`play`),newRun:()=>this.action(`new`),look:(e,t)=>{this.yaw=e,this.pitch=t},key:(e,t)=>{t?this.keyDown(new KeyboardEvent(`keydown`,{code:e})):this.keys.delete(e)},mouse:e=>this.lmb=e,act:e=>this.action(e),card:e=>this.chooseCard(e),state:()=>this.world.state,world:()=>this.world,screen:()=>this.hud.screen,info:()=>({...this.view.info,frameMs:this.view.frameMs,low:this.view.lowQuality}),events:()=>y,freeLook:()=>{this.freeLook=!0}}};window.__bd=wp.api;