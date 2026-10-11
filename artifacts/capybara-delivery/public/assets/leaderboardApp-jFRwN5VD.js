import{N as r,E as l,a,t as n}from"./main-CSpZwCDB.js";import"./modulepreload-polyfill-B5Qt9EMX.js";let d=!1;function g(){if(d)return;d=!0;const o=`
    .leaderboard-view {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      background: linear-gradient(180deg, #2a1a05 0%, #120a00 100%);
      color: #fff;
      font-family: var(--ios-font, -apple-system, system-ui, sans-serif);
      user-select: none;
      -webkit-user-select: none;
    }
    .lb-header {
      flex: 0 0 auto;
      padding: 10px 10px 8px;
      display: flex; align-items: center; gap: 8px;
      background: linear-gradient(180deg, rgba(255,211,107,0.18) 0%, rgba(0,0,0,0) 100%);
    }
    .btn-lb-back {
      width: 28px; height: 28px; border-radius: 50%;
      border: none; background: rgba(255,255,255,0.15); color: #fff;
      font-size: 18px; line-height: 1; font-weight: 600;
      cursor: pointer; flex: 0 0 auto;
    }
    .lb-title {
      font-size: 16px; font-weight: 700; letter-spacing: 0.3px;
      flex: 1 1 auto;
    }
    .lb-badge {
      font-size: 18px; opacity: 0.9;
    }
    .lb-subtitle {
      padding: 0 12px 10px;
      font-size: 11px; color: #f0c884; letter-spacing: 0.4px;
      text-transform: uppercase;
    }
    .lb-list {
      flex: 1 1 auto;
      overflow-y: auto;
      padding: 0 10px 10px;
    }
    .lb-row {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px;
      border-radius: 10px;
      background: rgba(255,255,255,0.04);
      margin-bottom: 6px;
      font-size: 14px;
    }
    .lb-row.me {
      background: linear-gradient(180deg, rgba(255,211,107,0.22), rgba(224,137,47,0.16));
      box-shadow: inset 0 0 0 1px rgba(255,211,107,0.45);
    }
    .lb-rank {
      width: 28px; text-align: center;
      font-weight: 700; font-size: 13px;
      color: #f0c884;
    }
    .lb-row.gold   .lb-rank { color: #FFD36B; font-size: 18px; }
    .lb-row.silver .lb-rank { color: #D5D7DD; font-size: 16px; }
    .lb-row.bronze .lb-rank { color: #D48A57; font-size: 15px; }
    .lb-name {
      flex: 1 1 auto;
      font-weight: 500;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .lb-row.me .lb-name::after {
      content: ' (you)';
      color: #f0c884;
      font-weight: 400;
      font-size: 11px;
    }
    .lb-money {
      font-variant-numeric: tabular-nums;
      font-weight: 700;
      color: #7ee18d;
    }
    .lb-empty {
      text-align: center;
      padding: 30px 12px;
      color: rgba(255,255,255,0.45);
      font-size: 13px;
      line-height: 1.5;
    }
    .lb-connecting {
      text-align: center;
      padding: 20px 12px;
      color: rgba(255,211,107,0.7);
      font-size: 12px;
    }
  `,e=document.createElement("style");e.textContent=o,document.head.appendChild(e)}const h=["gold","silver","bronze"];class v{constructor(e){g(),this.el=e,this._rows=[],this._buildDom();const s=r.lastLeaderboard;s&&Array.isArray(s.rows)&&(this._rows=s.rows),this._unsubLb=l.on(a.NET_LEADERBOARD,t=>{this._rows=Array.isArray(t.rows)?t.rows:[],this._render()}),this._unsubConn=l.on(a.NET_CONNECTED,()=>this._render()),this._unsubDisc=l.on(a.NET_DISCONNECTED,()=>this._render()),this._render()}_buildDom(){this.el.innerHTML=`
      <div class="lb-header">
        <button class="btn-lb-back" aria-label="Back">‹</button>
        <span class="lb-title">${n("phone.leaderboard.title")}</span>
        <span class="lb-badge">🏆</span>
      </div>
      <div class="lb-subtitle">${n("phone.leaderboard.subtitle")}</div>
      <div class="lb-list"></div>
    `,this._listEl=this.el.querySelector(".lb-list")}_render(){if(!r.isConnected&&this._rows.length===0){this._listEl.innerHTML=r.isOffline?`<div class="lb-empty">${n("phone.leaderboard.offline")}</div>`:`<div class="lb-connecting">${n("phone.leaderboard.connecting")}</div>`;return}if(this._rows.length===0){this._listEl.innerHTML=`<div class="lb-empty">${n("phone.leaderboard.empty")}</div>`;return}const e=r.id,s=this._rows.map((t,i)=>{const b=i<3?h[i]:"",c=t.id===e,p=i<3?["🥇","🥈","🥉"][i]:`#${i+1}`,u=x(t.username||n("phone.leaderboard.unknownPlayer")),f=Number.isFinite(t.money)?t.money:0;return`
        <div class="lb-row ${b}${c?" me":""}">
          <div class="lb-rank">${p}</div>
          <div class="lb-name">${u}</div>
          <div class="lb-money">$${f}</div>
        </div>`}).join("");this._listEl.innerHTML=s}dispose(){this._unsubLb?.(),this._unsubConn?.(),this._unsubDisc?.()}}function x(o){return String(o).replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}export{v as LeaderboardApp};
