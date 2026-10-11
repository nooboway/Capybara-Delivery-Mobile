import{t as o,N as m,A as p,r as _,R as y}from"./main-CSpZwCDB.js";import"./modulepreload-polyfill-B5Qt9EMX.js";async function v(e){try{const t=await fetch(e);if(!t.ok)return{};const a=new Uint8Array(await t.arrayBuffer());return g(a)}catch{return{}}}function g(e){if(e.length<10||e[0]!==73||e[1]!==68||e[2]!==51)return{};const t=e[3],a=(e[6]&127)<<21|(e[7]&127)<<14|(e[8]&127)<<7|e[9]&127,r=Math.min(e.length,10+a),s={};let i=10;for(;i+10<r;){const c=String.fromCharCode(e[i],e[i+1],e[i+2],e[i+3]);if(!/^[A-Z0-9]{4}$/.test(c))break;let l;if(t>=4?l=(e[i+4]&127)<<21|(e[i+5]&127)<<14|(e[i+6]&127)<<7|e[i+7]&127:l=e[i+4]<<24|e[i+5]<<16|e[i+6]<<8|e[i+7],l<=0||i+10+l>r)break;const n=i+10;if(c==="TIT2")s.title=h(e,n,l);else if(c==="TPE1")s.artist=h(e,n,l);else if(c==="APIC"){const u=f(e,n,l);u&&(s.coverUrl=URL.createObjectURL(new Blob([u.data],{type:u.mime})))}i=n+l}return s}function h(e,t,a){if(a<=0)return"";const r=e[t],s=e.subarray(t+1,t+a);let i;return r===0?i=new TextDecoder("iso-8859-1").decode(s):r===1?i=new TextDecoder("utf-16").decode(s):r===2?i=new TextDecoder("utf-16be").decode(s):r===3?i=new TextDecoder("utf-8").decode(s):i=new TextDecoder("iso-8859-1").decode(s),i.replace(/\u0000+$/g,"").trim()}function f(e,t,a){const r=e[t];let s=t+1;const i=t+a,c=s;for(;s<i&&e[s]!==0;)s++;const l=new TextDecoder("iso-8859-1").decode(e.subarray(c,s))||"image/jpeg";if(s>=i)return null;if(s++,s++,r===1||r===2){for(;s+1<i&&!(e[s]===0&&e[s+1]===0);)s+=2;s+=2}else{for(;s<i&&e[s]!==0;)s++;s++}return s>=i?null:{mime:l,data:e.subarray(s,i)}}const b=y.map(e=>({url:e.url,trackId:e.trackId,fallbackTitle:e.title})),E=3e3;function d(e){(!isFinite(e)||e<0)&&(e=0);const t=Math.floor(e/60),a=Math.floor(e%60);return`${t}:${a.toString().padStart(2,"0")}`}function q(e){return e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}class S{constructor(t){this.el=t,this.songs=b,this.idx=0,this.audio=new Audio,this.audio.preload="metadata",this.audio.volume=.6,this._shuffle=!1,this._repeat="none",this._metaCache=new Map,this._scrubbing=!1,this._build(),this.songs.length>0&&this._load(0,{autoplay:!1})}_build(){this.el.innerHTML=`
      <div class="music-header">
        <button class="btn-music-back" aria-label="Back">‹</button>
        <div class="music-header-center">
          <div class="music-header-label">${o("phone.capify.playingFromRadio")}</div>
          <div class="music-header-title">${o("phone.capify.capyFmTracks",{count:this.songs.length})}</div>
        </div>
        <div class="music-header-actions">
          <button class="btn-music-lyrics" aria-label="Lyrics">Aa</button>
          <button class="btn-music-queue" aria-label="Queue">☰</button>
        </div>
      </div>

      <div class="music-cover">
        <div class="music-cover-inner">
          <div class="music-cover-placeholder">♪</div>
          <img class="music-cover-img" alt="" draggable="false" />
        </div>
      </div>

      <div class="music-meta">
        <div class="music-title">—</div>
        <div class="music-artist">${o("phone.capify.capybaraRadio")}</div>
      </div>

      <div class="music-progress">
        <div class="music-scrub">
          <div class="music-scrub-fill"></div>
          <div class="music-scrub-knob"></div>
        </div>
        <div class="music-times">
          <span class="music-time-cur">0:00</span>
          <span class="music-time-tot">0:00</span>
        </div>
      </div>

      <div class="music-controls">
        <button class="music-btn music-shuffle" aria-label="Shuffle">🔀</button>
        <button class="music-btn music-prev" aria-label="Previous">⏮</button>
        <button class="music-btn music-play" aria-label="Play">▶</button>
        <button class="music-btn music-next" aria-label="Next">⏭</button>
        <button class="music-btn music-repeat" aria-label="Repeat">🔁</button>
      </div>

      <div class="music-queue" aria-hidden="true">
        <div class="music-queue-header">
          <div class="music-queue-title">${o("phone.capify.upNext")}</div>
          <button class="btn-queue-close" aria-label="Close queue">×</button>
        </div>
        <div class="music-queue-list"></div>
      </div>

      <div class="music-lyrics" aria-hidden="true">
        <div class="music-queue-header">
          <div class="music-queue-title">${o("phone.capify.lyrics")}</div>
          <button class="btn-lyrics-close" aria-label="Close lyrics">×</button>
        </div>
        <div class="music-lyrics-list"></div>
      </div>
    `,this._coverImg=this.el.querySelector(".music-cover-img"),this._coverPh=this.el.querySelector(".music-cover-placeholder"),this._titleEl=this.el.querySelector(".music-title"),this._artistEl=this.el.querySelector(".music-artist"),this._curTimeEl=this.el.querySelector(".music-time-cur"),this._totTimeEl=this.el.querySelector(".music-time-tot"),this._scrubEl=this.el.querySelector(".music-scrub"),this._scrubFill=this.el.querySelector(".music-scrub-fill"),this._scrubKnob=this.el.querySelector(".music-scrub-knob"),this._playBtn=this.el.querySelector(".music-play"),this._shuffleBtn=this.el.querySelector(".music-shuffle"),this._repeatBtn=this.el.querySelector(".music-repeat"),this._queueEl=this.el.querySelector(".music-queue"),this._queueListEl=this.el.querySelector(".music-queue-list"),this._lyricsEl=this.el.querySelector(".music-lyrics"),this._lyricsListEl=this.el.querySelector(".music-lyrics-list"),this.el.querySelector(".btn-music-queue").addEventListener("click",()=>this._toggleQueue()),this.el.querySelector(".btn-queue-close").addEventListener("click",()=>this._toggleQueue(!1)),this.el.querySelector(".btn-music-lyrics").addEventListener("click",()=>this._toggleLyrics()),this.el.querySelector(".btn-lyrics-close").addEventListener("click",()=>this._toggleLyrics(!1)),this._renderQueue(),this._renderLyrics(),this._playBtn.addEventListener("click",()=>this.toggle()),this.el.querySelector(".music-prev").addEventListener("click",()=>this.prev()),this.el.querySelector(".music-next").addEventListener("click",()=>this.next()),this._shuffleBtn.addEventListener("click",()=>{this._shuffle=!this._shuffle,this._shuffleBtn.classList.toggle("active",this._shuffle)}),this._repeatBtn.addEventListener("click",()=>{this._repeat=this._repeat==="none"?"all":this._repeat==="all"?"one":"none",this._repeatBtn.classList.toggle("active",this._repeat!=="none"),this._repeatBtn.textContent=this._repeat==="one"?"🔂":"🔁"}),this.audio.addEventListener("timeupdate",()=>this._renderProgress()),this.audio.addEventListener("loadedmetadata",()=>this._renderProgress()),this.audio.addEventListener("ended",()=>this._onEnded()),this.audio.addEventListener("play",()=>{this._renderPlayState(),this._broadcastCapify(),this._startCapifyHeartbeat()}),this.audio.addEventListener("pause",()=>{this._renderPlayState(),this._broadcastCapify(),this._stopCapifyHeartbeat()}),this.audio.addEventListener("seeked",()=>this._broadcastCapify()),this._bindScrub()}_broadcastCapify(){const t=this.songs[this.idx];t&&m.sendCapify({trackId:t.trackId,currentTime:this.audio.currentTime||0,isPlaying:this.isPlaying()})}_startCapifyHeartbeat(){this._stopCapifyHeartbeat(),this._capifyHeartbeat=setInterval(()=>{if(!this.isPlaying()){this._stopCapifyHeartbeat();return}this._broadcastCapify()},E)}_stopCapifyHeartbeat(){this._capifyHeartbeat&&(clearInterval(this._capifyHeartbeat),this._capifyHeartbeat=null)}_bindScrub(){const t=this._scrubEl,a=i=>{const c=t.getBoundingClientRect(),l=(i.touches?i.touches[0].clientX:i.clientX)-c.left,n=Math.max(0,Math.min(1,l/c.width));this._scrubFill.style.width=`${n*100}%`,this._scrubKnob.style.left=`${n*100}%`,isNaN(this.audio.duration)||(this.audio.currentTime=n*this.audio.duration)},r=i=>{this._scrubbing&&a(i)},s=()=>{this._scrubbing=!1};t.addEventListener("mousedown",i=>{this._scrubbing=!0,a(i)}),t.addEventListener("touchstart",i=>{this._scrubbing=!0,a(i)},{passive:!0}),window.addEventListener("mousemove",r),window.addEventListener("touchmove",r,{passive:!0}),window.addEventListener("mouseup",s),window.addEventListener("touchend",s)}_renderQueue(){this._queueListEl.innerHTML=this.songs.map((t,a)=>`
      <button class="queue-item${a===this.idx?" active":""}" data-idx="${a}">
        <span class="queue-item-num">${a+1}</span>
        <span class="queue-item-title">${q(t.fallbackTitle)}</span>
      </button>
    `).join(""),this._queueListEl.querySelectorAll(".queue-item").forEach(t=>{t.addEventListener("click",()=>{const a=Number(t.dataset.idx);this._load(a),this._toggleQueue(!1)})})}_toggleQueue(t){const a=t!==void 0?t:!this._queueEl.classList.contains("open");this._queueEl.classList.toggle("open",a),this._queueEl.setAttribute("aria-hidden",a?"false":"true"),a&&this._toggleLyrics(!1)}_toggleLyrics(t){const a=t!==void 0?t:!this._lyricsEl.classList.contains("open");this._lyricsEl.classList.toggle("open",a),this._lyricsEl.setAttribute("aria-hidden",a?"false":"true"),a&&this._toggleQueue(!1)}_renderLyrics(){this._lyricsListEl.innerHTML=`
      <div class="lyrics-line active">${o("phone.capify.lyricsLine")}</div>
    `}_updateLyricsActive(){}isPlaying(){return!!this.audio&&!this.audio.paused&&!this.audio.ended}getVolume(){return this.audio.volume}setVolume(t){this.audio.volume=Math.max(0,Math.min(1,t))}adjustVolume(t){return this.setVolume((this.audio.volume||0)+t),this.audio.volume}async _load(t,{autoplay:a=!0}={}){if(!this.songs.length)return;this.idx=(t%this.songs.length+this.songs.length)%this.songs.length;const r=this.songs[this.idx];p.track("song.play",{a:r.fallbackTitle}),this.audio.src=await _(r.url),this._titleEl.textContent=r.fallbackTitle,this._artistEl.textContent=o("phone.capify.capybaraRadio"),this._coverImg.removeAttribute("src"),this._coverImg.style.opacity="0",this._coverPh.style.opacity="1",a&&this.audio.play().catch(()=>{}),this._renderPlayState(),this._renderProgress(),this._queueListEl&&this._queueListEl.querySelectorAll(".queue-item").forEach((i,c)=>{i.classList.toggle("active",c===this.idx)});let s=this._metaCache.get(r.url);s||(s=await v(r.url),this._metaCache.set(r.url,s)),this.songs[this.idx]===r&&(s.artist&&(this._artistEl.textContent=s.artist),s.coverUrl&&(this._coverImg.src=s.coverUrl,this._coverImg.style.opacity="1",this._coverPh.style.opacity="0"))}_renderProgress(){const t=this.audio.currentTime||0,a=this.audio.duration||0;this._curTimeEl.textContent=d(t),this._totTimeEl.textContent=d(a);const r=a>0?t/a*100:0;this._scrubFill.style.width=`${r}%`,this._scrubKnob.style.left=`${r}%`}_renderPlayState(){const t=!this.audio.paused&&!this.audio.ended;this._playBtn.textContent=t?"❚❚":"▶",this._playBtn.setAttribute("aria-label",t?"Pause":"Play")}_onEnded(){if(this._repeat==="one"){this.audio.currentTime=0,this.audio.play().catch(()=>{});return}if(this.idx===this.songs.length-1&&this._repeat==="none"&&!this._shuffle){this._renderPlayState();return}this.next()}toggle(){this.audio.paused?this.audio.play().catch(()=>{}):this.audio.pause()}next(){if(this.songs.length)if(this._shuffle&&this.songs.length>1){let t;do t=Math.floor(Math.random()*this.songs.length);while(t===this.idx);this._load(t)}else this._load(this.idx+1)}prev(){if(this.songs.length){if((this.audio.currentTime||0)>3){this.audio.currentTime=0;return}this._load(this.idx-1)}}onAppOpened(){}}export{S as MusicApp};
