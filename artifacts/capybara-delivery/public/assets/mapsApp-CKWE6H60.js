import{t as m}from"./main-CSpZwCDB.js";import"./modulepreload-polyfill-B5Qt9EMX.js";let v=!1;function y(){if(v)return;v=!0;const u=`
    .maps-view {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      background: #E8EDE4;
      font-family: var(--ios-font, -apple-system, system-ui, sans-serif);
      color: #1f2a28;
      user-select: none;
      -webkit-user-select: none;
    }
    .maps-header {
      flex: 0 0 auto;
      padding: 8px 10px 6px;
      display: flex; align-items: center; gap: 8px;
      background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.78));
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 2;
    }
    .btn-maps-back {
      width: 28px; height: 28px; border-radius: 50%;
      border: none; background: #fff; color: #1f2a28;
      font-size: 18px; line-height: 1; font-weight: 600;
      box-shadow: 0 1px 3px rgba(0,0,0,0.18);
      cursor: pointer; flex: 0 0 auto;
    }
    .maps-canvas-wrap {
      position: relative; flex: 1 1 auto; overflow: hidden;
      perspective: 600px;
      background: #E8EDE4;
    }
    .maps-canvas {
      position: absolute;
      left: 0; right: 0;
      top: 0; height: 100%;
      width: 100%;
      display: block;
      transform-origin: center 78%;
      transition: transform 250ms cubic-bezier(0.22, 0.61, 0.36, 1),
                  height 250ms cubic-bezier(0.22, 0.61, 0.36, 1),
                  top 250ms cubic-bezier(0.22, 0.61, 0.36, 1);
      transform: rotateX(0deg) scale(1);
    }
    /* Tilted "driving mode" view — mirrors Google Maps' GPS navigation
       perspective. The scale(1.45) enlarges the tilted plane so its
       foreshortened top still reaches the wrap edges; overflow:hidden on the
       wrap clips the overshoot. Canvas is also taller than the wrap (and
       offset upward) so content drawn "ahead" of the rider at high zoom has
       pixel room before running off the canvas bounds — otherwise road
       strokes get clipped at a hard horizontal edge near the horizon. */
    .maps-canvas-wrap.view-3d .maps-canvas {
      height: 170%;
      top: -60%;
      transform-origin: center 82%;
      transform: rotateX(55deg) scale(1.45);
    }
    .maps-overlay {
      position: absolute; inset: 0;
      pointer-events: none;
    }
    .maps-overlay > * { pointer-events: auto; }
    .maps-compass {
      position: absolute; top: 10px; right: 10px;
      width: 34px; height: 34px; border-radius: 50%;
      background: #fff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      display: flex; align-items: center; justify-content: center;
      pointer-events: none;
    }
    .maps-compass-dial {
      position: relative; width: 100%; height: 100%;
      transition: transform 120ms linear;
    }
    .maps-compass-needle-n,
    .maps-compass-needle-s {
      position: absolute; left: 50%; top: 50%;
      width: 3px; height: 13px;
      transform-origin: 50% 100%;
      transform: translate(-50%, -100%);
      border-radius: 2px;
    }
    .maps-compass-needle-n { background: #EA1D2C; }
    .maps-compass-needle-s {
      background: #7a8683;
      transform: translate(-50%, 0%);
    }
    .maps-compass-N {
      position: absolute; top: -13px; left: 50%;
      transform: translateX(-50%);
      font-size: 9px; font-weight: 700; color: #EA1D2C;
      letter-spacing: 0.5px;
    }
    .maps-zoom-controls {
      position: absolute; right: 10px; bottom: 72px;
      display: flex; flex-direction: column; gap: 1px;
      background: #fff; border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      overflow: hidden;
    }
    .maps-zoom-controls button {
      width: 34px; height: 32px; border: none; background: #fff;
      font-size: 18px; font-weight: 500; color: #3d4a47;
      cursor: pointer;
    }
    .maps-zoom-controls button + button {
      border-top: 1px solid #e6e9e7;
    }
    .maps-zoom-controls button:active { background: #e8edeb; }
    .maps-viewmode {
      position: absolute; right: 10px; bottom: 18px;
      width: 34px; height: 34px; border-radius: 50%;
      background: #fff; color: #2D7FE3; border: none;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      font: 700 11px var(--ios-font, -apple-system, system-ui, sans-serif);
      letter-spacing: 0.3px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .maps-viewmode.active { background: #2D7FE3; color: #fff; }
    .maps-status-pill {
      position: absolute; left: 50%; bottom: 18px;
      transform: translateX(-50%);
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      padding: 6px 12px; border-radius: 16px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.18);
      font-size: 11px; color: #3d4a47; font-weight: 500;
      white-space: nowrap;
    }
  `,e=document.createElement("style");e.textContent=u,document.head.appendChild(e)}class P{constructor(e,t){y(),this.el=e,this.phone=t,this.zoom=5,this.rotate="heading",this.viewMode="3d",this._build()}_build(){this.el.innerHTML=`
      <div class="maps-header">
        <button class="btn-maps-back" aria-label="Back">‹</button>
      </div>
      <div class="maps-canvas-wrap view-3d">
        <canvas class="maps-canvas"></canvas>
        <div class="maps-overlay">
          <div class="maps-compass" aria-hidden="true">
            <div class="maps-compass-dial">
              <div class="maps-compass-N">N</div>
              <div class="maps-compass-needle-n"></div>
              <div class="maps-compass-needle-s"></div>
            </div>
          </div>
          <div class="maps-zoom-controls">
            <button class="btn-maps-zoom-in" aria-label="Zoom in">+</button>
            <button class="btn-maps-zoom-out" aria-label="Zoom out">−</button>
          </div>
          <button class="maps-viewmode active" title="Toggle 3D / aerial view">3D</button>
          <div class="maps-status-pill" style="display:none"></div>
        </div>
      </div>
    `,this._canvas=this.el.querySelector(".maps-canvas"),this._canvasWrap=this.el.querySelector(".maps-canvas-wrap"),this._ctx=this._canvas.getContext("2d"),this._dial=this.el.querySelector(".maps-compass-dial"),this._viewModeBtn=this.el.querySelector(".maps-viewmode"),this._statusPill=this.el.querySelector(".maps-status-pill"),this.el.querySelector(".btn-maps-zoom-in").addEventListener("click",e=>{e.stopPropagation(),this._zoomBy(1.4)}),this.el.querySelector(".btn-maps-zoom-out").addEventListener("click",e=>{e.stopPropagation(),this._zoomBy(1/1.4)}),this._viewModeBtn.addEventListener("click",e=>{e.stopPropagation(),this.viewMode=this.viewMode==="3d"?"2d":"3d",this._applyViewMode()}),this._applyViewMode(),this._canvas.addEventListener("wheel",e=>{e.preventDefault(),this._zoomBy(e.deltaY<0?1.12:1/1.12)},{passive:!1}),this._w=0,this._h=0}_resize(){const e=this._canvas,t=e.clientWidth,o=e.clientHeight;if(!t||!o)return;const i=window.devicePixelRatio||1;e.width=Math.round(t*i),e.height=Math.round(o*i),this._ctx.setTransform(i,0,0,i,0,0),this._w=t,this._h=o}_zoomBy(e){this.zoom=Math.max(1.5,Math.min(12,this.zoom*e))}_applyViewMode(){const e=this.viewMode==="3d";this._canvasWrap.classList.toggle("view-3d",e),this.rotate=e?"heading":"north",this._viewModeBtn.classList.toggle("active",e),this._viewModeBtn.textContent=e?"3D":"2D"}update(){(!this._w||!this._h)&&this._resize(),!(!this._w||!this._h)&&(this._draw(),this._updateCompass(),this._updateStatusPill())}_updateCompass(){if(!this._dial)return;const e=this.phone._playerPos.angle||0,t=this.rotate==="heading"?e:0;this._dial.style.transform=`rotate(${t}rad)`}_updateStatusPill(){const e=this.phone.phase;this.phone.activeOrder;let t=null;e==="drive-to-store"?t=m("phone.capyMaps.toPickup")+" · "+this._fmtDist(this.phone._storePos):e==="delivering"?t=m("phone.capyMaps.toDestination")+" · "+this._fmtDist(this.phone._deliveryPos):e==="in-store"&&(t=m("phone.capyMaps.insideGrocery")),t?(this._statusPill.style.display="",this._statusPill.textContent=t):this._statusPill.style.display="none"}_fmtDist(e){const t=this.phone._playerPos,o=Math.hypot(e.x-t.x,e.z-t.z);return o<1e3?`${Math.round(o)} m`:`${(o/1e3).toFixed(1)} km`}_draw(){const e=this._ctx,t=this._w,o=this._h,i=this.phone._playerPos,a=this.viewMode==="3d"?this.zoom/1.45:this.zoom,n=i.angle||0;e.save(),e.fillStyle="#E8EDE4",e.fillRect(0,0,t,o);const l=t/2,w=this.viewMode==="3d"?o*.82:this.rotate==="heading"?o/2+o*.15:o/2;e.translate(l,w),this.rotate==="heading"&&e.rotate(n+Math.PI);const p=s=>(s-i.x)*a,h=s=>(s-i.z)*a,b=Math.hypot(t,o)/(2*a)+20,f=this.phone._mapRoads;if(f){e.lineCap="round",e.lineJoin="round";for(const s of f){if(!this._roadInView(s,i,b))continue;const r=Math.max(5,(s.halfWidth??2.5)*2*a);e.strokeStyle="#BFC5C1",e.lineWidth=r+2.5,this._strokeRoad(e,s.points,p,h)}for(const s of f){if(!this._roadInView(s,i,b))continue;const r=Math.max(4,(s.halfWidth??2.5)*2*a);e.strokeStyle=s.kind==="dirt"?"#D9B880":"#FFFFFF",e.lineWidth=r,this._strokeRoad(e,s.points,p,h)}}const d=this.phone._mapRoute;if(d&&d.length>=2){e.strokeStyle="rgba(45,127,227,0.35)",e.lineWidth=9,e.lineCap="round",e.lineJoin="round",e.beginPath();for(let s=0;s<d.length;s++){const r=p(d[s].x),c=h(d[s].z);s===0?e.moveTo(r,c):e.lineTo(r,c)}e.stroke(),e.strokeStyle="#2D7FE3",e.lineWidth=5,e.stroke()}if(this.phone.phase==="delivering"||this.phone.phase==="drive-to-store"){const s=this.phone.phase==="delivering"?this.phone._deliveryPos:this.phone._storePos;this._drawPin(e,p(s.x),h(s.z),n)}const g=this.phone.getPartyDots?.()||[];if(g.length)for(const s of g){const r=p(s.x),c=h(s.z);e.beginPath(),e.fillStyle=s.color,e.strokeStyle="rgba(255,255,255,0.95)",e.lineWidth=2,e.arc(r,c,6,0,Math.PI*2),e.fill(),e.stroke()}this._drawPlayer(e,n),e.restore()}_strokeRoad(e,t,o,i){e.beginPath();for(let a=0;a<t.length;a++){const n=o(t[a][0]),l=i(t[a][1]);a===0?e.moveTo(n,l):e.lineTo(n,l)}e.stroke()}_roadInView(e,t,o){const i=e.points;if(!i||i.length<2)return!1;for(const a of i){const n=a[0]-t.x,l=a[1]-t.z;if(n*n+l*l<=o*o)return!0}return!1}_drawPin(e,t,o,i){e.save(),e.translate(t,o),this.rotate==="heading"&&e.rotate(-(i+Math.PI)),e.fillStyle="rgba(0,0,0,0.2)",e.beginPath(),e.ellipse(0,2,6,2,0,0,Math.PI*2),e.fill(),e.fillStyle="#EA1D2C",e.strokeStyle="#fff",e.lineWidth=1.5,e.beginPath(),e.moveTo(0,2),e.bezierCurveTo(-9,-6,-9,-20,0,-20),e.bezierCurveTo(9,-20,9,-6,0,2),e.closePath(),e.fill(),e.stroke(),e.fillStyle="#fff",e.beginPath(),e.arc(0,-13,3,0,Math.PI*2),e.fill(),e.restore()}_drawPlayer(e,t){e.save(),e.rotate(Math.PI-t),e.fillStyle="rgba(45,127,227,0.18)",e.beginPath(),e.arc(0,0,20,0,Math.PI*2),e.fill(),e.fillStyle="#2D7FE3",e.strokeStyle="#fff",e.lineWidth=2,e.beginPath(),e.moveTo(0,-13),e.lineTo(9,9),e.lineTo(0,4),e.lineTo(-9,9),e.closePath(),e.fill(),e.stroke(),e.restore()}dispose(){}}export{P as MapsApp};
