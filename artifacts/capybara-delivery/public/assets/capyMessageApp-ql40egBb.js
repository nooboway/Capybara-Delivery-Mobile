import{E as i,a as o,t as s,N as r}from"./main-CSpZwCDB.js";import"./modulepreload-polyfill-B5Qt9EMX.js";let l=!1;function h(){if(l)return;l=!0;const n=`
    .message-view {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      background: #f3f3f7;
      color: #111;
      font-family: var(--ios-font, -apple-system, system-ui, sans-serif);
      user-select: none;
      -webkit-user-select: none;
    }
    .msg-header {
      flex: 0 0 auto;
      padding: 10px 10px 8px;
      display: flex; align-items: center; gap: 8px;
      background: linear-gradient(180deg, #34D667 0%, #0F9A3F 100%);
      color: #fff;
    }
    .btn-msg-back {
      width: 28px; height: 28px; border-radius: 50%;
      border: none; background: rgba(255,255,255,0.25); color: #fff;
      font-size: 18px; line-height: 1; font-weight: 600;
      cursor: pointer; flex: 0 0 auto;
    }
    .msg-title {
      font-size: 16px; font-weight: 700;
      flex: 1 1 auto;
    }
    .msg-badge { font-size: 18px; }
    .btn-msg-mute {
      width: 28px; height: 28px; border-radius: 50%;
      border: none; background: rgba(255,255,255,0.25); color: #fff;
      font-size: 14px; line-height: 1;
      cursor: pointer; flex: 0 0 auto;
      display: flex; align-items: center; justify-content: center;
    }
    .btn-msg-mute.muted { background: rgba(0,0,0,0.28); }
    .btn-msg-mute:hover { background: rgba(255,255,255,0.35); }
    .btn-msg-mute.muted:hover { background: rgba(0,0,0,0.38); }
    .msg-list {
      flex: 1 1 auto;
      overflow-y: auto;
      padding: 10px 10px 8px;
      display: flex; flex-direction: column; gap: 6px;
    }
    .msg-empty {
      text-align: center;
      margin: auto;
      color: rgba(0,0,0,0.35);
      font-size: 13px;
      line-height: 1.5;
      user-select: none;
    }
    .msg-item {
      max-width: 85%;
      padding: 7px 11px;
      border-radius: 14px;
      font-size: 13px;
      line-height: 1.3;
      word-wrap: break-word;
      overflow-wrap: anywhere;
    }
    .msg-author {
      font-size: 10px;
      font-weight: 700;
      opacity: 0.75;
      margin-bottom: 2px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .msg-item.other {
      align-self: flex-start;
      background: #fff;
      color: #111;
      box-shadow: 0 1px 2px rgba(0,0,0,0.06);
      border-top-left-radius: 4px;
    }
    .msg-item.me {
      align-self: flex-end;
      background: #34C759;
      color: #fff;
      border-top-right-radius: 4px;
    }
    .msg-item.me .msg-author { color: rgba(255,255,255,0.9); }
    .msg-input-bar {
      flex: 0 0 auto;
      display: flex; gap: 6px;
      box-sizing: border-box;
      width: 100%;
      /* Extra bottom padding so the bar clears the phone frame's rounded
         bottom corners. Symmetric side padding is fine once the input no
         longer forces the row to overflow. */
      padding: 8px 14px 18px 14px;
      background: #fff;
      border-top: 1px solid rgba(0,0,0,0.08);
    }
    .msg-input {
      /* flex basis 0 + min-width 0 = row actually respects its container
         width. Without min-width:0, <input>'s intrinsic default width
         (~154px plus padding) forces the row wider than the phone frame,
         shoving the Send button off to the right. */
      flex: 1 1 0;
      min-width: 0;
      box-sizing: border-box;
      padding: 8px 12px;
      border: 1px solid rgba(0,0,0,0.12);
      border-radius: 16px;
      font-size: 13px;
      font-family: inherit;
      outline: none;
      background: #f3f3f7;
      color: #111;
    }
    .msg-input:focus {
      border-color: #34C759;
      background: #fff;
    }
    .msg-send {
      padding: 0 14px;
      border: none;
      border-radius: 16px;
      background: #34C759;
      color: #fff;
      font-size: 13px; font-weight: 600;
      cursor: pointer;
    }
    .msg-send:disabled { opacity: 0.45; cursor: not-allowed; }
  `,t=document.createElement("style");t.textContent=n,document.head.appendChild(t)}class m{constructor(t,e=null){h(),this.el=t,this.phone=e,this._buildDom(),this._unsubChat=i.on(o.NET_CHAT,a=>{this._appendOne(a),this._scrollToBottom()}),this._unsubHello=i.on(o.NET_HELLO,()=>{this._render(),this._scrollToBottom()}),this._unsubConn=i.on(o.NET_CONNECTED,()=>this._updateSendEnabled()),this._unsubDisc=i.on(o.NET_DISCONNECTED,()=>this._updateSendEnabled()),this._render(),this._scrollToBottom(),this._updateSendEnabled()}get _messages(){return this.phone?.getChatHistory?.()||[]}get _muted(){return this.phone?.isChatMuted?.()??!1}_buildDom(){this.el.innerHTML=`
      <div class="msg-header">
        <button class="btn-msg-back" aria-label="Back">‹</button>
        <span class="msg-title">${s("phone.capyMessage.title")}</span>
        <button class="btn-msg-mute" type="button" aria-label="Toggle notifications" title="Mute notifications"></button>
      </div>
      <div class="msg-list"></div>
      <div class="msg-input-bar">
        <input class="msg-input" type="text" maxlength="140" placeholder="${s("phone.capyMessage.placeholder")}"
          autocomplete="off" data-1p-ignore data-lpignore="true">
        <button class="msg-send" type="button" disabled>${s("phone.capyMessage.send")}</button>
      </div>
    `,this._listEl=this.el.querySelector(".msg-list"),this._inputEl=this.el.querySelector(".msg-input"),this._sendBtn=this.el.querySelector(".msg-send"),this._muteBtn=this.el.querySelector(".btn-msg-mute"),this._inputEl.addEventListener("input",()=>this._updateSendEnabled()),this._inputEl.addEventListener("keydown",t=>{t.key==="Enter"&&(t.preventDefault(),this._send())}),this._sendBtn.addEventListener("click",()=>this._send()),this._muteBtn.addEventListener("click",()=>this._toggleMute()),this._renderMuteButton()}_toggleMute(){this.phone?.setChatMuted?.(!this._muted),this._renderMuteButton()}_renderMuteButton(){if(!this._muteBtn)return;const t=this._muted;this._muteBtn.textContent=t?"🔕":"🔔",this._muteBtn.classList.toggle("muted",t),this._muteBtn.title=t?s("phone.capyMessage.unmuteHint"):s("phone.capyMessage.muteHint")}_send(){const t=this._inputEl.value.trim();!t||!r.isConnected||(r.sendChat(t),this._inputEl.value="",this._updateSendEnabled())}_updateSendEnabled(){const e=this._inputEl?.value.trim().length>0&&r.isConnected;this._sendBtn&&(this._sendBtn.disabled=!e)}_render(){if(this._messages.length===0){this._listEl.innerHTML=`<div class="msg-empty">${s("phone.capyMessage.empty")}</div>`;return}this._listEl.innerHTML=this._messages.map(t=>this._messageHtml(t)).join("")}_appendOne(t){const e=this._listEl.querySelector(".msg-empty");e&&e.remove(),this._listEl.insertAdjacentHTML("beforeend",this._messageHtml(t))}_messageHtml(t){const e=t.id===r.id,a=e?"me":"other",u=e?s("phone.capyMessage.you"):d(t.username||s("phone.capyMessage.unknownPlayer")),p=d(t.text||"");return`
      <div class="msg-item ${a}">
        <div class="msg-author">${u}</div>
        <div class="msg-body">${p}</div>
      </div>
    `}_scrollToBottom(){this._listEl&&(this._listEl.scrollTop=this._listEl.scrollHeight)}dispose(){this._unsubHello?.(),this._unsubChat?.(),this._unsubConn?.(),this._unsubDisc?.()}}function d(n){return String(n).replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}export{m as CapyMessageApp};
