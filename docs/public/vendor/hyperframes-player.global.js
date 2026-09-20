"use strict";var HyperframesPlayer=(()=>{var ee=Object.defineProperty;var ot=Object.getOwnPropertyDescriptor;var st=Object.getOwnPropertyNames;var at=Object.prototype.hasOwnProperty;var dt=(r,e)=>{for(var t in e)ee(r,t,{get:e[t],enumerable:!0})},lt=(r,e,t,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let n of st(e))!at.call(r,n)&&n!==t&&ee(r,n,{get:()=>e[n],enumerable:!(i=ot(e,n))||i.enumerable});return r};var ut=r=>lt(ee({},"__esModule",{value:!0}),r);var Kt={};dt(Kt,{HyperframesPlayer:()=>K,SPEED_PRESETS:()=>re,formatSpeed:()=>N,formatTime:()=>G});function ke(r){return r.hasRuntime||r.runtimeInjected?!1:!!(r.hasNestedCompositions||r.hasTimelines&&r.attempts>=5)}function P(r){return typeof r=="object"&&r!==null}function xe(r){return P(r)&&typeof r.getDuration=="function"}function Me(r){return P(r)&&typeof r.duration=="function"&&typeof r.time=="function"&&typeof r.seek=="function"&&typeof r.play=="function"&&typeof r.pause=="function"}var k="https://cdn.jsdelivr.net/npm/@hyperframes/core@0.8.50/dist/hyperframe.runtime.iife.js";function O(r){if(r===null)return null;let e=Number.parseInt(r,10);return Number.isFinite(e)&&e>0?e:null}function ct(r){let e=r?.querySelector("[data-composition-id][data-width][data-height]")??r?.querySelector("[data-width][data-height]");if(!e)return null;let t=O(e.getAttribute("data-width")),i=O(e.getAttribute("data-height"));return t!==null&&i!==null?{width:t,height:i}:null}var q=class{constructor(e,t){this._iframe=e;this._callbacks=t}_iframe;_callbacks;_interval=null;_runtimeInjected=!1;get runtimeInjected(){return this._runtimeInjected}start(){this.stop(),this._runtimeInjected=!1;let e=0;this._interval=setInterval(()=>{e++;try{let t=this._iframe.contentWindow;if(!t)return;let i=!!(t.__hf||t.__player),n=!!(t.__timelines&&Object.keys(t.__timelines).length>0),o=!!this._iframe.contentDocument?.querySelector("[data-composition-src]");if(ke({hasRuntime:i,hasTimelines:n,hasNestedCompositions:o,runtimeInjected:this._runtimeInjected,attempts:e})){this._injectRuntime();return}if(this._runtimeInjected&&!i)return;let s=this._resolvePlaybackDurationAdapter(t);if(s&&s.getDuration()>0){this.stop();let a=ct(this._iframe.contentDocument);this._callbacks.onReady({duration:s.getDuration(),adapter:s,compositionSize:a});return}}catch{}e>=40&&(this.stop(),this._callbacks.onError("Composition timeline not found after 8s"))},200)}stop(){this._interval!==null&&(clearInterval(this._interval),this._interval=null)}resolveDirectTimelineAdapter(){try{let e=this._iframe.contentWindow;return e?this._resolveDirectTimelineAdapterFromWindow(e):null}catch{return null}}resolveDirectTimelineAdapterFromWindow(e){return this._resolveDirectTimelineAdapterFromWindow(e)}hasRuntimeBridge(e){return Reflect.get(e,"__hf")!==void 0||P(Reflect.get(e,"__player"))}_injectRuntime(){this._runtimeInjected=!0;try{let e=this._iframe.contentDocument;if(!e)return;let t=e.createElement("script");t.src=k,(e.head||e.documentElement).appendChild(t),this._callbacks.onRuntimeInjected?.()}catch{}}_resolveDirectTimelineAdapterFromWindow(e){if(this.hasRuntimeBridge(e))return null;let t=Reflect.get(e,"__timelines");if(!P(t))return null;let i=Object.keys(t);if(i.length===0)return null;let n=this._iframe.contentDocument?.querySelector("[data-composition-id]")?.getAttribute("data-composition-id"),o=n&&n in t?n:i[i.length-1],s=t[o];return Me(s)?s:null}_resolvePlaybackDurationAdapter(e){let t=Reflect.get(e,"__player");if(xe(t))return{kind:"runtime",getDuration:()=>t.getDuration()};let i=this._resolveDirectTimelineAdapterFromWindow(e);return i?{kind:"direct-timeline",timeline:i,getDuration:()=>i.duration()}:null}};var Le=`
  :host {
    display: block;
    position: relative;
    overflow: hidden;
    background: #000;
    contain: layout style;
  }

  .hfp-container {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }


  .hfp-iframe {
    position: absolute;
    top: 50%;
    left: 50%;
    border: none;
    pointer-events: none;
  }

  /* Opt-in: an interactive composition (e.g. a live slideshow/app with playable
     media or controls) \u2014 let pointer events reach the iframe content. */
  :host([interactive]) .hfp-container,
  :host([interactive]) .hfp-iframe {
    pointer-events: auto;
  }

  .hfp-poster {
    position: absolute;
    inset: 0;
    object-fit: contain;
    z-index: 1;
    pointer-events: none;
  }

  .hfp-shader-loader {
    position: absolute;
    inset: 0;
    z-index: 20;
    display: grid;
    place-items: center;
    visibility: hidden;
    opacity: 0;
    pointer-events: none;
    background: #030504;
    color: #f4f7fb;
    cursor: default;
    user-select: none;
    -webkit-user-select: none;
    transition: opacity 420ms ease-out, visibility 420ms ease-out;
  }

  .hfp-shader-loader.hfp-visible,
  .hfp-shader-loader.hfp-hiding {
    visibility: visible;
  }

  .hfp-shader-loader.hfp-visible {
    opacity: 1;
    pointer-events: auto;
  }

  .hfp-shader-loader.hfp-hiding {
    opacity: 0;
    pointer-events: none;
  }

  .hfp-shader-loader-panel {
    display: grid;
    grid-template-rows: 86px 40px 26px 12px 44px;
    justify-items: center;
    align-items: center;
    gap: 8px;
    width: min(620px, 82%);
    text-align: center;
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .hfp-shader-loader-mark {
    width: 86px;
    height: 86px;
    display: grid;
    place-items: center;
    overflow: visible;
  }

  .hfp-shader-loader-mark svg {
    display: block;
    overflow: visible;
    filter: drop-shadow(0 0 5px rgba(79, 219, 94, 0.16));
    pointer-events: none;
  }

  .hfp-shader-loader-title {
    width: 100%;
    height: 40px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 26px;
    line-height: 40px;
    font-weight: 700;
    letter-spacing: 0;
  }

  .hfp-shader-loader-title-text {
    color: transparent;
    background: linear-gradient(
      90deg,
      rgba(244, 247, 251, 0.84) 0%,
      #ffffff 42%,
      #80efe4 52%,
      #ffffff 62%,
      rgba(244, 247, 251, 0.84) 100%
    );
    background-size: 220% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    animation: hfp-shader-loader-sheen 1.9s linear infinite;
  }

  .hfp-shader-loader:not(.hfp-visible):not(.hfp-hiding) .hfp-shader-loader-title-text {
    animation-play-state: paused;
  }

  .hfp-shader-loader-detail {
    width: 100%;
    height: 26px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: rgba(244, 247, 251, 0.62);
    font-size: 15px;
    line-height: 26px;
    font-weight: 500;
  }

  .hfp-shader-loader-track {
    width: min(360px, 100%);
    height: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
  }

  .hfp-shader-loader-fill {
    width: 100%;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #06e3fa, #4fdb5e);
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform 160ms ease;
  }

  .hfp-shader-loader-progress {
    width: min(420px, 100%);
    height: 44px;
    display: grid;
    grid-template-rows: repeat(2, 22px);
    color: rgba(244, 247, 251, 0.48);
    font: 600 13px/22px "IBM Plex Mono", "SF Mono", "Fira Code", "Courier New", monospace;
    font-variant-numeric: tabular-nums;
  }

  .hfp-shader-loader-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 74px;
    align-items: center;
    column-gap: 20px;
    width: 100%;
    white-space: nowrap;
  }

  .hfp-shader-loader-label {
    min-width: 0;
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
  }

  .hfp-shader-loader-value {
    text-align: right;
  }

  @keyframes hfp-shader-loader-sheen {
    from {
      background-position: 140% 0;
    }
    to {
      background-position: -140% 0;
    }
  }

  /* \u2500\u2500 Theming via CSS custom properties \u2500\u2500
   *
   * Override from outside the shadow DOM:
   *   hyperframes-player {
   *     --hfp-controls-bg: linear-gradient(transparent, rgba(0,0,0,0.9));
   *     --hfp-accent: #ff6b6b;
   *     --hfp-font: "Inter", sans-serif;
   *   }
   */

  .hfp-controls {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    gap: var(--hfp-controls-gap, 12px);
    padding: var(--hfp-controls-padding, 8px 16px);
    background: var(--hfp-controls-bg, linear-gradient(transparent, rgba(0, 0, 0, 0.7)));
    color: var(--hfp-color, #fff);
    font-family: var(--hfp-font, system-ui, -apple-system, sans-serif);
    font-size: var(--hfp-font-size, 13px);
    z-index: 10;
    pointer-events: auto;
    opacity: 1;
    transition: opacity 0.3s ease;
    user-select: none;
  }

  .hfp-controls.hfp-hidden {
    opacity: 0;
    pointer-events: none;
  }

  .hfp-play-btn {
    position: relative;
    background: none;
    border: none;
    color: var(--hfp-color, #fff);
    cursor: pointer;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    z-index: 10;
  }

  .hfp-play-btn:hover {
    opacity: 0.8;
  }

  /* Stacked play/pause glyphs that crossfade-morph on toggle (rotate + scale). */
  .hfp-play-btn .hfp-ico {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      opacity 200ms ease,
      transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .hfp-play-btn .hfp-ico-play {
    opacity: 1;
    transform: rotate(0) scale(1);
  }
  .hfp-play-btn .hfp-ico-pause {
    opacity: 0;
    transform: rotate(-90deg) scale(0.4);
  }
  .hfp-play-btn.hfp-playing .hfp-ico-play {
    opacity: 0;
    transform: rotate(90deg) scale(0.4);
  }
  .hfp-play-btn.hfp-playing .hfp-ico-pause {
    opacity: 1;
    transform: rotate(0) scale(1);
  }
  @media (prefers-reduced-motion: reduce) {
    .hfp-play-btn .hfp-ico {
      transition-duration: 0ms;
      transform: none;
    }
  }

  .hfp-play-btn svg,
  .hfp-play-btn svg * {
    pointer-events: none;
  }

  .hfp-scrubber {
    flex: 1;
    min-width: 0;
    height: var(--hfp-scrubber-height, 4px);
    background: var(--hfp-scrubber-bg, rgba(255, 255, 255, 0.3));
    border-radius: var(--hfp-scrubber-radius, 2px);
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .hfp-scrubber:hover {
    height: var(--hfp-scrubber-height-hover, 6px);
  }

  .hfp-progress {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: var(--hfp-accent, #fff);
    pointer-events: none;
  }

  .hfp-time {
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
    opacity: 0.9;
  }

  .hfp-speed-wrap {
    position: relative;
    flex-shrink: 0;
  }

  .hfp-speed-btn {
    background: var(--hfp-speed-btn-bg, rgba(255, 255, 255, 0.15));
    border: none;
    border-radius: var(--hfp-speed-btn-radius, 4px);
    color: var(--hfp-color, #fff);
    cursor: pointer;
    font-family: var(--hfp-font, system-ui, -apple-system, sans-serif);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    padding: 4px 8px;
    min-width: 40px;
    text-align: center;
    transition: background 0.15s ease;
  }

  .hfp-speed-btn:hover {
    background: var(--hfp-speed-btn-bg-hover, rgba(255, 255, 255, 0.3));
  }

  .hfp-speed-menu {
    position: absolute;
    bottom: calc(100% + 8px);
    right: 0;
    background: var(--hfp-menu-bg, rgba(20, 20, 20, 0.95));
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--hfp-menu-border, rgba(255, 255, 255, 0.1));
    border-radius: var(--hfp-menu-radius, 8px);
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 80px;
    opacity: 0;
    visibility: hidden;
    transform: translateY(4px);
    transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s;
    box-shadow: var(--hfp-menu-shadow, 0 8px 24px rgba(0, 0, 0, 0.4));
  }

  .hfp-speed-menu.hfp-open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .hfp-speed-option {
    background: none;
    border: none;
    border-radius: 4px;
    color: var(--hfp-menu-color, rgba(255, 255, 255, 0.7));
    cursor: pointer;
    font-family: var(--hfp-font, system-ui, -apple-system, sans-serif);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    padding: 6px 12px;
    text-align: left;
    transition: background 0.1s ease, color 0.1s ease;
    white-space: nowrap;
  }

  .hfp-speed-option:hover {
    background: var(--hfp-menu-hover-bg, rgba(255, 255, 255, 0.1));
    color: var(--hfp-color, #fff);
  }

  .hfp-speed-option.hfp-active {
    color: var(--hfp-accent, #fff);
    font-weight: 600;
  }

  .hfp-volume-wrap {
    position: relative;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 0;
  }

  .hfp-mute-btn {
    background: none;
    border: none;
    color: var(--hfp-color, #fff);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
  }

  .hfp-mute-btn:hover {
    opacity: 0.8;
  }

  .hfp-mute-btn svg,
  .hfp-mute-btn svg * {
    pointer-events: none;
  }

  .hfp-volume-slider-wrap {
    width: 0;
    overflow: hidden;
    transition: width 0.2s ease;
    display: flex;
    align-items: center;
  }

  .hfp-volume-wrap:hover .hfp-volume-slider-wrap {
    width: 64px;
  }

  .hfp-volume-slider {
    width: 56px;
    height: var(--hfp-scrubber-height, 4px);
    background: var(--hfp-scrubber-bg, rgba(255, 255, 255, 0.3));
    border-radius: var(--hfp-scrubber-radius, 2px);
    cursor: pointer;
    position: relative;
    overflow: hidden;
    margin-left: 4px;
    margin-right: 4px;
  }

  .hfp-volume-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: var(--hfp-accent, #fff);
    pointer-events: none;
  }
`,De='<svg width="24" height="24" viewBox="46 21 54 56" fill="currentColor"><path d="M87.5129 57.5141L56.9696 73.5433C52.8371 75.7098 48.7046 73.2553 49.6688 69.2104L58.9483 30.1391C59.9125 26.0942 65.2097 23.6397 68.3154 25.8062L91.2447 41.8354C96.4668 45.4796 94.4631 53.8699 87.5129 57.5141Z"/></svg>',Ie='<svg width="24" height="24" viewBox="0 0 18 18" fill="currentColor"><rect x="3" y="2" width="4" height="14"/><rect x="11" y="2" width="4" height="14"/></svg>',te='<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3z"/><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/><path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',ie='<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3z"/><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>',Pe='<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3z"/><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" opacity="0.3"/><line x1="18" y1="7" x2="14" y2="17" stroke="currentColor" stroke-width="2"/></svg>';var re=[.25,.5,1,1.5,2,4];function N(r){return Number.isInteger(r)?`${r}x`:`${r}x`}function G(r){if(!Number.isFinite(r)||r<0)return"0:00";let e=Math.floor(r),t=Math.floor(e/60),i=e%60;return`${t}:${i.toString().padStart(2,"0")}`}function Oe(r,e,t={}){let i=t.speedPresets??re,n=document.createElement("div");n.className="hfp-controls",n.addEventListener("click",d=>{d.stopPropagation()});let o=document.createElement("button");o.className="hfp-play-btn",o.type="button",o.innerHTML=`<span class="hfp-ico hfp-ico-play">${De}</span><span class="hfp-ico hfp-ico-pause">${Ie}</span>`,o.setAttribute("aria-label","Play");let s=document.createElement("div");s.className="hfp-scrubber";let a=document.createElement("div");a.className="hfp-progress",a.style.width="0%",s.appendChild(a);let u=document.createElement("span");u.className="hfp-time",u.textContent="0:00 / 0:00";let c=document.createElement("div");c.className="hfp-speed-wrap";let p=document.createElement("button");p.className="hfp-speed-btn",p.type="button",p.textContent="1x",p.setAttribute("aria-label","Playback speed");let v=document.createElement("div");v.className="hfp-speed-menu",v.setAttribute("role","menu");for(let d of i){let l=document.createElement("button");l.className="hfp-speed-option",l.type="button",l.setAttribute("role","menuitem"),l.dataset.speed=String(d),l.textContent=N(d),d===1&&l.classList.add("hfp-active"),v.appendChild(l)}c.appendChild(v),c.appendChild(p);let y=document.createElement("div");y.className="hfp-volume-wrap";let f=document.createElement("button");f.className="hfp-mute-btn",f.type="button",f.innerHTML=te,f.setAttribute("aria-label","Mute");let S=document.createElement("div");S.className="hfp-volume-slider-wrap";let h=document.createElement("div");h.className="hfp-volume-slider",h.setAttribute("role","slider"),h.setAttribute("aria-label","Volume"),h.setAttribute("aria-valuemin","0"),h.setAttribute("aria-valuemax","100"),h.setAttribute("aria-valuenow","100"),h.tabIndex=0;let E=document.createElement("div");E.className="hfp-volume-fill",E.style.width="100%",h.appendChild(E),S.appendChild(h),y.appendChild(S),y.appendChild(f),t.audioLocked&&(y.style.display="none"),n.appendChild(o),n.appendChild(s),n.appendChild(u),n.appendChild(y),n.appendChild(c),r.appendChild(n);let V=!1,R=!1,A=1,I=null,j=i.indexOf(1);j===-1&&(j=0);let W=(d,l)=>d?Pe:l===0?ie:l<.5?ie:te;o.addEventListener("click",d=>{d.stopPropagation(),V?e.onPause():e.onPlay()}),f.addEventListener("click",d=>{d.stopPropagation(),e.onMuteToggle()});let C=!1,$=d=>{let l=h.getBoundingClientRect(),_=Math.max(0,Math.min(1,(d-l.left)/l.width));A=_,E.style.width=`${_*100}%`,h.setAttribute("aria-valuenow",String(Math.round(_*100))),R&&_>0&&e.onMuteToggle(),f.innerHTML=W(R,_),e.onVolumeChange(_)};h.addEventListener("mousedown",d=>{d.stopPropagation(),C=!0,$(d.clientX)});let he=d=>{C&&$(d.clientX)},fe=()=>{C=!1};document.addEventListener("mousemove",he),document.addEventListener("mouseup",fe),h.addEventListener("touchstart",d=>{C=!0;let l=d.touches[0];l&&$(l.clientX)},{passive:!0});let _e=d=>{if(C){let l=d.touches[0];l&&$(l.clientX)}},ge=()=>{C=!1};document.addEventListener("touchmove",_e,{passive:!0}),document.addEventListener("touchend",ge);let ve=.05;h.addEventListener("keydown",d=>{let l=A;if(d.key==="ArrowRight"||d.key==="ArrowUp")l=Math.min(1,A+ve);else if(d.key==="ArrowLeft"||d.key==="ArrowDown")l=Math.max(0,A-ve);else return;d.preventDefault(),d.stopPropagation(),A=l,E.style.width=`${l*100}%`,h.setAttribute("aria-valuenow",String(Math.round(l*100))),R&&l>0&&e.onMuteToggle(),f.innerHTML=W(R,l),e.onVolumeChange(l)});let be=d=>{for(let l of v.querySelectorAll(".hfp-speed-option"))l.classList.toggle("hfp-active",l.dataset.speed===String(d))};p.addEventListener("click",d=>{d.stopPropagation();let l=v.classList.toggle("hfp-open");p.setAttribute("aria-expanded",String(l))}),v.addEventListener("click",d=>{d.stopPropagation();let l=d.target.closest(".hfp-speed-option");if(!l)return;let _=parseFloat(l.dataset.speed);j=i.indexOf(_),p.textContent=N(_),be(_),v.classList.remove("hfp-open"),p.setAttribute("aria-expanded","false"),e.onSpeedChange(_)});let ye=()=>{v.classList.remove("hfp-open"),p.setAttribute("aria-expanded","false")};document.addEventListener("click",ye);let z=d=>{let l=s.getBoundingClientRect(),_=Math.max(0,Math.min(1,(d-l.left)/l.width));e.onSeek(_)},T=!1;s.addEventListener("mousedown",d=>{d.stopPropagation(),T=!0,e.onScrubStart?.(),z(d.clientX)});let Ee=d=>{T&&z(d.clientX)},Se=()=>{T&&(T=!1,e.onScrubEnd?.())};document.addEventListener("mousemove",Ee),document.addEventListener("mouseup",Se),s.addEventListener("touchstart",d=>{T=!0,e.onScrubStart?.();let l=d.touches[0];l&&z(l.clientX)},{passive:!0});let Te=d=>{if(T){let l=d.touches[0];l&&z(l.clientX)}},Ae=()=>{T&&(T=!1,e.onScrubEnd?.())};document.addEventListener("touchmove",Te,{passive:!0}),document.addEventListener("touchend",Ae);let we=()=>{I&&clearTimeout(I),I=setTimeout(()=>{V&&n.classList.add("hfp-hidden")},3e3)},B=r instanceof ShadowRoot?r.host:r,Re=()=>{n.classList.remove("hfp-hidden"),we()},Ce=()=>{V&&n.classList.add("hfp-hidden")};return B.addEventListener("mousemove",Re),B.addEventListener("mouseleave",Ce),{updateTime(d,l){let _=l>0?Math.min(d,l):d,nt=l>0?_/l*100:0;a.style.width=`${nt}%`,u.textContent=`${G(_)} / ${G(l)}`},updatePlaying(d){V=d,o.classList.toggle("hfp-playing",d),o.setAttribute("aria-label",d?"Pause":"Play"),d?we():n.classList.remove("hfp-hidden")},updateSpeed(d){let l=i.indexOf(d);l!==-1&&(j=l),p.textContent=N(d),be(d)},updateMuted(d){R=d,f.innerHTML=W(d,A),f.setAttribute("aria-label",d?"Unmute":"Mute")},updateVolume(d){A=d,E.style.width=`${d*100}%`,h.setAttribute("aria-valuenow",String(Math.round(d*100))),f.innerHTML=W(R,d)},setVolumeControlsHidden(d){y.style.display=d?"none":""},show(){n.style.display=""},hide(){n.style.display="none"},destroy(){document.removeEventListener("mousemove",Ee),document.removeEventListener("mouseup",Se),document.removeEventListener("touchmove",Te),document.removeEventListener("touchend",Ae),document.removeEventListener("mousemove",he),document.removeEventListener("mouseup",fe),document.removeEventListener("touchmove",_e),document.removeEventListener("touchend",ge),document.removeEventListener("click",ye),B.removeEventListener("mousemove",Re),B.removeEventListener("mouseleave",Ce),I&&clearTimeout(I),n.remove()}}}function Ne(r,e,t,i,n,o=!1){let s=i?i.split(",").map(Number).filter(c=>!isNaN(c)&&c>0):void 0,a={...s?{speedPresets:s}:{},audioLocked:o},u=Oe(r,n,a);return u.updateMuted(e),u.updateVolume(t),u}function ne(r,e,t){return e?(t||(t=document.createElement("img"),t.className="hfp-poster",r.appendChild(t)),t.src=e,t):(t?.remove(),null)}function Fe(r){return r.composedPath().some(e=>e instanceof HTMLElement&&e.classList.contains("hfp-controls"))}var Y=null;function He(r,e){if(typeof CSSStyleSheet<"u")try{Y||(Y=new CSSStyleSheet,Y.replaceSync(e)),r.adoptedStyleSheets=[Y];return}catch{}let t=document.createElement("style");t.textContent=e,r.appendChild(t)}function Ue(){let r=document.createElement("div");r.className="hfp-container";let e=document.createElement("iframe");return e.className="hfp-iframe",e.sandbox.add("allow-scripts","allow-same-origin"),e.allow="autoplay; fullscreen",e.referrerPolicy="no-referrer",e.title="HyperFrames Composition",r.appendChild(e),{container:r,iframe:e}}function Ve(r,e,t,i){let n=r.offsetWidth,o=r.offsetHeight;if(n===0||o===0)return!1;let s=Math.min(n/t,o/i);return e.style.width=`${t}px`,e.style.height=`${i}px`,e.style.transform=`translate(-50%, -50%) scale(${s})`,!0}var X=class{constructor(e){this._callbacks=e}_callbacks;_raf=null;_lastUpdateMs=0;start(e,t,i,n){this.stop();let o=()=>{if(n()){this._raf=null;return}let s;try{s=e.time()}catch{this._raf=null;return}let a=i();a>0&&(s=Math.min(s,a));let u=a>0&&s>=a,c=performance.now();if((c-this._lastUpdateMs>100||u)&&(this._lastUpdateMs=c,this._callbacks.onTimeUpdate(s,a)),u){if(this._callbacks.getLoop()){this._callbacks.restart();return}try{e.pause()}catch{}this._callbacks.onPaused(),this._raf=null;return}this._raf=requestAnimationFrame(o)};this._raf=requestAnimationFrame(o)}stop(){this._raf!==null&&(cancelAnimationFrame(this._raf),this._raf=null)}get isRunning(){return this._raf!==null}};function je(r){let e=Array.from(r.querySelectorAll("[data-composition-id]"));if(e.length===0)return r.body?[r.body]:[];let t=[];for(let i of e)mt(i)||t.push(i);return pt(r),t}function pt(r){let e=r.body;if(!e||typeof console>"u"||typeof console.warn!="function")return;let t=e.querySelectorAll("audio[data-start], video[data-start]");if(t.length===0)return;let i=[];for(let n of t)n.closest("[data-composition-id]")||i.push(n);i.length!==0&&console.warn(`[hyperframes-player] selectMediaObserverTargets: composition hosts are present, but ${i.length} body-level timed media element(s) sit outside every [data-composition-id] subtree and will not be observed. Move them inside a composition host or the parent-frame proxy will never adopt them.`,i)}function mt(r){let e=r.parentElement;for(;e;){if(e.hasAttribute("data-composition-id"))return!0;e=e.parentElement}return!1}function F(r){let e=r.ownerDocument?.defaultView;return e&&r instanceof e.Element?!0:r instanceof Element}function b(r){if(!F(r)||r.tagName!=="AUDIO"&&r.tagName!=="VIDEO")return!1;let e=r.ownerDocument?.defaultView;return e&&r instanceof e.HTMLMediaElement?!0:r instanceof HTMLMediaElement}function se(r){let e=Array.from(r.querySelectorAll("video, audio")).filter(b).filter(n=>n.readyState<3),t=Array.from(r.querySelectorAll("img")).filter(n=>!n.complete),i=r.fonts?.status==="loading";return{pendingMedia:e,pendingImages:t,fontsLoading:i}}function ht(r,{pendingMedia:e,pendingImages:t,fontsLoading:i},n){let o=e.map(u=>new Promise(c=>{if(u.error){c();return}let p=()=>{u.removeEventListener("canplay",p),u.removeEventListener("error",p),n.removeEventListener("abort",p),c()};u.addEventListener("canplay",p),u.addEventListener("error",p),n.addEventListener("abort",p,{once:!0})})),s=t.map(u=>u.decode?u.decode().catch(()=>{}):Promise.resolve()),a=i&&r.fonts?r.fonts.ready.then(()=>{}):Promise.resolve();return Promise.all([...o,...s,a]).then(()=>{})}function ft(r,e){let t=se(r);return t.pendingMedia.length===0&&t.pendingImages.length===0&&!t.fontsLoading?null:ht(r,t,e)}var _t=50;function gt(r,e){let t=r.defaultView;return!t||t.__renderReady||!t.__hf?null:new Promise(i=>{let n,o=()=>{n!==void 0&&clearTimeout(n),e.removeEventListener("abort",o),i()};if(e.aborted){o();return}e.addEventListener("abort",o,{once:!0});let s=()=>{if(t.__renderReady){o();return}n=setTimeout(s,_t)};s()})}var vt=50,bt=2,yt=1500;function oe(r,e){return new Promise(t=>{if(e.aborted){t(-1);return}let i=0,n=()=>{r.cancelAnimationFrame?.(i),t(-1)};e.addEventListener("abort",n,{once:!0}),i=r.requestAnimationFrame(o=>{e.removeEventListener("abort",n),t(o)})})}function Et(r,e){let t=r.defaultView;return t?(async()=>{let i=await oe(t,e);if(e.aborted)return;let n=await oe(t,e),o=0;for(;!e.aborted&&o<bt;){if(n-i>=yt)return;let s=await oe(t,e);if(e.aborted)return;o=s-n<vt?o+1:0,n=s}})():null}var St=8e3;function We(r,e,t={}){let i=t.inputs??[ft,gt,Et],n=new AbortController,o=i.map(c=>c(r,n.signal)).filter(c=>c!==null);if(o.length===0){e({timedOut:!1});return}let s=t.timeoutMs??St,a,u=new Promise(c=>{a=setTimeout(()=>c("timed-out"),s)});Promise.race([Promise.all(o).then(()=>"done"),u]).then(c=>{clearTimeout(a),n.abort(),e({timedOut:c==="timed-out"})})}var m=Object.freeze({start:"data-start",duration:"data-duration",trackIndex:"data-track-index",derivedEnd:"data-end",legacyTrack:"data-layer"}),yi=Object.freeze([m.start,m.duration,m.trackIndex]),Ei=Object.freeze([m.derivedEnd]),Si=Object.freeze([m.derivedEnd,m.legacyTrack]);function x(r){if(r==null||r.trim()==="")return null;let e=Number(r);return Number.isFinite(e)?e:null}var Be=/^[A-Za-z0-9_.:-]+$/;function qe(r,e){let t=r.charCodeAt(e);return t>=48&&t<=57}function $e(r,e){let t=e;for(;t>=0&&qe(r,t);)t--;return t}function Tt(r,e){let t=e;for(;t>=0&&(r[t]??"").trim()==="";)t--;return t}function At(r){let e=r.length-1;if(!qe(r,e))return null;let t=$e(r,e);return r[t]==="."&&(t=$e(r,t-1)),t+1}function wt(r){let e=At(r);if(e==null)return null;let t=Tt(r,e-1),i=r[t];if(i!=="+"&&i!=="-")return null;let n=r.slice(0,t).trim();if(!Be.test(n))return null;let o=Number(r.slice(e));return Number.isFinite(o)?{refId:n,operator:i,magnitude:o}:null}function Rt(r){let e=(r??"").trim();if(!e)return null;let t=x(e);if(t!=null)return{kind:"absolute",value:t};if(Be.test(e))return{kind:"reference",refId:e,offset:0};let i=wt(e);return i?{kind:"reference",refId:i.refId,offset:i.operator==="-"?-i.magnitude:i.magnitude}:null}function g(r,e,t,i){r.push({code:e,attribute:t,value:i})}function Ct(r,e,t,i){if(e==null||e.trim()==="")return t.defaultStart===void 0?0:t.defaultStart;if(!r)return g(i,"invalid-start",m.start,e),null;if(r.kind==="absolute")return Math.max(0,r.value);let n=t.resolveReferenceEnd?.(r.refId);return n==null||!Number.isFinite(n)?(g(i,"unresolved-start-reference",m.start,e),null):Math.max(0,n+r.offset)}var kt=1e-9;function xt(r,e){return Math.abs(r-e)<=kt}function Mt(r,e,t){let i=x(r);if(i==null){g(t,"deprecated-end",m.derivedEnd,r),g(t,"invalid-end",m.derivedEnd,r);return}if(e==null){g(t,"deprecated-end",m.derivedEnd,r);return}xt(i,e)||(g(t,"deprecated-end",m.derivedEnd,r),g(t,"conflicting-end",m.derivedEnd,r))}function Lt(r,e,t){let i=x(r);return i==null||i<0?(g(t,"invalid-duration",m.duration,r),{duration:null,end:null,durationSource:"invalid"}):{duration:i,end:e==null?null:e+i,durationSource:"duration"}}function Dt(r,e,t){g(t,"deprecated-end",m.derivedEnd,r);let i=x(r);return i==null?(g(t,"invalid-end",m.derivedEnd,r),{duration:null,end:null,durationSource:"invalid"}):e==null?{duration:null,end:i,durationSource:"legacy-end"}:i<e?(g(t,"end-before-start",m.derivedEnd,r),{duration:null,end:null,durationSource:"invalid"}):{duration:i-e,end:i,durationSource:"legacy-end"}}function It(r,e,t){let i=r.getAttribute(m.duration),n=r.getAttribute(m.derivedEnd);if(i==null)return n==null?{duration:null,end:null,durationSource:"missing"}:Dt(n,e,t);let o=Lt(i,e,t);return n!=null&&Mt(n,o.end,t),o}function ze(r,e,t,i){let n=x(r);return n==null||!Number.isInteger(n)?(g(i,"invalid-track-index",e,r),{trackIndex:0,trackSource:"invalid"}):{trackIndex:n,trackSource:t}}function Pt(r,e){let t=r.getAttribute(m.trackIndex),i=r.getAttribute(m.legacyTrack);if(t==null&&i==null)return{trackIndex:0,trackSource:"default"};if(t==null&&i!=null)return g(e,"deprecated-layer",m.legacyTrack,i),ze(i,m.legacyTrack,"legacy-layer",e);let n=ze(t??"",m.trackIndex,"track-index",e);if(i==null)return n;g(e,"deprecated-layer",m.legacyTrack,i);let o=x(i);return o!=null&&o!==n.trackIndex&&g(e,"conflicting-layer",m.legacyTrack,i),n}function ae(r,e={}){let t=[],i=r.getAttribute(m.start),n=Rt(i),o=Ct(n,i,e,t),s=It(r,o,t),a=Pt(r,t);return{startExpression:n,start:o,...s,...a,diagnostics:t}}var Ot=.05,Nt=2,Z=class{_entries=[];_mediaObserver;_playbackErrorPosted=!1;_audioOwner="runtime";_urlAudioEntry=null;_urlAudioSrc=null;_dispatchEvent;_getMuted;_getVolume;_getPlaybackRate;_getCurrentTime;_isPaused;constructor(e){this._dispatchEvent=e.dispatchEvent,this._getMuted=e.getMuted,this._getVolume=e.getVolume,this._getPlaybackRate=e.getPlaybackRate,this._getCurrentTime=e.getCurrentTime,this._isPaused=e.isPaused}get audioOwner(){return this._audioOwner}get entries(){return this._entries}resetForIframeLoad(){this._playbackErrorPosted=!1;let e=this._audioOwner==="parent";this._audioOwner="runtime",this.pauseAll(),this.teardownObserver(),e&&this._dispatchEvent(new CustomEvent("audioownershipchange",{detail:{owner:"runtime",reason:"iframe-reload"}}))}destroy(){this.teardownObserver();for(let e of this._entries)e.el.pause(),e.el.src="";this._entries=[],this._urlAudioEntry=null,this._urlAudioSrc=null,this._audioOwner="runtime",this._playbackErrorPosted=!1}updateMuted(e){for(let t of this._entries)t.el.muted=e}updateVolume(e){for(let t of this._entries)t.el.volume=e}updatePlaybackRate(e){for(let t of this._entries)t.el.playbackRate=e}_playEntry(e){e.el.src&&e.el.play().catch(t=>this._reportPlaybackError(t))}_playEntryIfActive(e){this._refreshEntryBounds(e);let t=this._getCurrentTime()-e.start;t<0||t>=e.duration||this._playEntry(e)}_refreshEntryBounds(e){if(!e.source?.isConnected)return;let t=ae(e.source);e.start=t.start??0,e.duration=t.duration!=null&&t.duration>0?t.duration:Number.POSITIVE_INFINITY}_gateEntryPlayback(e,t){return t<0||t>=e.duration?(e.el.paused||e.el.pause(),e.driftSamples=0,!1):(this._audioOwner==="parent"&&!this._isPaused()&&e.el.paused&&this._playEntry(e),!0)}playAll(){for(let e of this._entries)this._playEntryIfActive(e)}pauseAll(){for(let e of this._entries)e.el.pause()}stopAdoptedMedia(){for(let e of this._entries)e.source&&e.el.pause()}seekAll(e){for(let t of this._entries){this._refreshEntryBounds(t);let i=e-t.start;i>=0&&i<t.duration&&(t.el.currentTime=i)}}scrubAll(e){for(let t of this._entries){this._refreshEntryBounds(t);let i=e-t.start;i>=0&&i<t.duration?(t.el.currentTime=i,this._playEntry(t)):t.el.paused||t.el.pause()}}mirrorTime(e,t){let i=t?.force===!0;for(let n of this._entries){this._refreshEntryBounds(n);let o=e-n.start;this._gateEntryPlayback(n,o)&&(Math.abs(n.el.currentTime-o)>Ot?(n.driftSamples+=1,(i||n.driftSamples>=Nt)&&(n.el.currentTime=o,n.driftSamples=0)):n.driftSamples=0)}}promoteToParentProxy(e,t){if(this._audioOwner==="parent")return;if(this._audioOwner="parent",e)for(let n of e.querySelectorAll("video, audio"))b(n)&&(n.muted=!0);let i=this._getCurrentTime();t?t(i,{force:!0}):this.mirrorTime(i,{force:!0}),this._isPaused()||this.playAll(),this._dispatchEvent(new CustomEvent("audioownershipchange",{detail:{owner:"parent",reason:"autoplay-blocked"}}))}setupFromIframe(e){let t=e.querySelectorAll("audio[data-start], video[data-start]");for(let i of t)b(i)&&this._adoptIframeMedia(i);this._observeDynamicMedia(e)}setupFromUrl(e){if(this._urlAudioSrc===e&&this._urlAudioEntry)return;this.teardownUrlAudio();let t=this._createEntry(e,"audio",0,1/0);this._urlAudioEntry=t,this._urlAudioSrc=t?e:null,t&&this._audioOwner==="parent"&&!this._isPaused()&&(this.mirrorTime(this._getCurrentTime(),{force:!0}),this.playAll())}teardownUrlAudio(){let e=this._urlAudioEntry;if(this._urlAudioEntry=null,this._urlAudioSrc=null,!e)return;e.el.pause(),e.el.src="";let t=this._entries.indexOf(e);t!==-1&&this._entries.splice(t,1)}teardownObserver(){this._mediaObserver?.disconnect(),this._mediaObserver=void 0}_reportPlaybackError(e){this._playbackErrorPosted||(this._playbackErrorPosted=!0,this._dispatchEvent(new CustomEvent("playbackerror",{detail:{source:"parent-proxy",error:e}})))}_createEntry(e,t,i,n,o){if(this._entries.some(c=>c.el.src===e))return null;let s=t==="video"?document.createElement("video"):new Audio;s.preload="auto",s.src=e,s.load(),s.muted=this._getMuted(),s.volume=this._getVolume();let a=this._getPlaybackRate();a!==1&&(s.playbackRate=a);let u={el:s,start:i,duration:n,driftSamples:0,source:o};return this._entries.push(u),u}_resolveIframeMediaSrc(e){let t=e.getAttribute("src")||e.querySelector("source")?.getAttribute("src");return t?new URL(t,e.ownerDocument.baseURI).href:null}_adoptIframeMedia(e){if(e.preload==="metadata"||e.preload==="none")return;let t=this._resolveIframeMediaSrc(e);if(!t)return;let i=ae(e),n=i.start??0,o=i.duration??Number.POSITIVE_INFINITY,s=e.tagName==="VIDEO"?"video":"audio",a=this._createEntry(t,s,n,o,e);a&&this._audioOwner==="parent"&&(this.mirrorTime(this._getCurrentTime(),{force:!0}),this._isPaused()||this._playEntryIfActive(a))}_detachIframeMedia(e){let t=this._resolveIframeMediaSrc(e);if(!t)return;let i=this._entries.findIndex(o=>o.el.src===t);if(i===-1)return;let n=this._entries[i];n.el.pause(),n.el.src="",this._entries.splice(i,1)}_observeDynamicMedia(e){if(this.teardownObserver(),typeof MutationObserver>"u"||!e.body)return;let t=new MutationObserver(o=>{for(let s of o){if(s.type==="attributes"&&s.attributeName==="preload"){let a=s.target;b(a)&&a.matches("audio[data-start], video[data-start]")&&a.preload==="auto"&&this._adoptIframeMedia(a);continue}for(let a of s.addedNodes){if(!F(a))continue;let u=[];b(a)&&a.matches("audio[data-start], video[data-start]")&&u.push(a);let c=a.querySelectorAll("audio[data-start], video[data-start]");for(let p of c)b(p)&&u.push(p);for(let p of u)this._adoptIframeMedia(p)}for(let a of s.removedNodes){if(!F(a))continue;let u=[];b(a)&&a.matches("audio[data-start], video[data-start]")&&u.push(a);let c=a.querySelectorAll("audio[data-start], video[data-start]");for(let p of c)b(p)&&u.push(p);for(let p of u)this._detachIframeMedia(p)}}}),i={childList:!0,subtree:!0,attributes:!0,attributeFilter:["preload"]},n=je(e);for(let o of n)t.observe(o,i);this._mediaObserver=t}};function Ge(r,e,t,i){let n=(r.frame??0)/e,o=t.duration>0?Math.min(n,t.duration):n,s=!t.paused,a=!r.isPlaying,u=t.duration>0&&o>=t.duration&&(s||r.isPlaying);if(u&&i.getLoop())return i.media.audioOwner==="parent"&&i.media.pauseAll(),i.seek(0),i.play(),{...t,currentTime:o,paused:!1};let c={...t,currentTime:o,paused:a};i.media.audioOwner==="parent"&&(s&&a?i.media.pauseAll():!s&&!a&&i.media.playAll(),i.media.mirrorTime(o));let p=performance.now(),v=a!==t.paused;return(p-t.lastUpdateMs>100||v)&&(c.lastUpdateMs=p,i.updateControlsTime(o,t.duration),i.updateControlsPlaying(!a),i.dispatchEvent(new CustomEvent("timeupdate",{detail:{currentTime:o}}))),u&&(i.media.audioOwner==="parent"&&i.media.pauseAll(),c.paused=!0,i.updateControlsPlaying(!1),i.dispatchEvent(new Event("ended"))),c}var Ft=["seconds-time","rational-fps","seek-keep-playing","composition-manifest-v1","runtime-data"];function Ht(r,e){let t=Math.abs(r),i=Math.abs(e);for(;i!==0;){let n=t%i;t=i,i=n}return t||1}function Ut(r){let e=Number.isFinite(r)&&r>0?r:30,t=Number.isInteger(e)?1:1e6,i=Math.round(e*t),n=Ht(i,t);return{numerator:i/n,denominator:t/n}}function Vt(r){if(typeof r!="object"||r===null)return null;let e=r;return!Number.isFinite(e.numerator)||!Number.isFinite(e.denominator)||(e.numerator??0)<=0||(e.denominator??0)<=0?null:Number(e.numerator)/Number(e.denominator)}function Ye(r){return{protocolVersion:1,capabilities:Ft,fps:Ut(r)}}function jt(r){return Array.isArray(r)&&r.every(e=>typeof e=="string")}function Xe(r,e=30){if(typeof r!="object"||r===null)return{status:"legacy",fps:e};let t=r;if(t.protocolVersion===void 0)return{status:"legacy",fps:e};if(t.protocolVersion!==1)return{status:"unsupported",code:"unsupported_protocol_version",receivedVersion:t.protocolVersion};let i=Vt(t.fps);return i===null||!jt(t.capabilities)?{status:"unsupported",code:"invalid_protocol_metadata",receivedVersion:t.protocolVersion}:{status:"supported",fps:i,metadata:t}}function Wt(r){return Array.isArray(r)?r.filter(e=>typeof e=="object"&&e!==null&&typeof e.id=="string"&&typeof e.start=="number"&&typeof e.duration=="number"):[]}function Ze(r,e,t){if(r.source!==e)return;let i=r.data;if(!i||i.source!=="hf-preview")return;let n=Xe(i);if(n.status==="unsupported"){t.dispatchEvent(new CustomEvent("runtimeprotocolerror",{detail:{code:n.code,receivedVersion:n.receivedVersion}}));return}if(t.setRuntimeFps?.(n.fps),i.type==="shader-transition-state"){let o=i.state&&typeof i.state=="object"?i.state:{};t.shaderLoader.update(o,t.getShaderLoadingMode()),t.dispatchEvent(new CustomEvent("shadertransitionstate",{detail:{compositionId:i.compositionId,state:o}}));return}if(i.type==="ready"){t.onRuntimeReady();return}if(i.type==="assets-ready"){t.onRuntimeAssetsReady?.(i.timedOut===!0);return}if(i.type==="runtime-data-error"){t.onRuntimeDataError?.(i.channel,i.requestId,i.message);return}if(i.type==="runtime-data-applied"){t.onRuntimeDataApplied?.(i.channel,i.requestId);return}if(i.type==="state"){t.setPlaybackState(Ge({frame:i.frame??0,isPlaying:!!i.isPlaying},n.fps,t.getPlaybackState(),t));return}if(i.type==="media-autoplay-blocked"){if(t.shouldPromoteMediaAutoplayFallback?.()===!1)return;let o=null;try{o=t.getIframeDoc()}catch{}t.media.promoteToParentProxy(o,(s,a)=>t.media.mirrorTime(s,a)),t.sendControl("set-media-output-muted",{muted:!0});return}if(i.type==="timeline"&&i.durationInFrames>0){let o=Number(i.durationSeconds),s=Number(i.durationInFrames),a=Number.isFinite(o)&&o>0?o:s/n.fps;if(Number.isFinite(a)&&a>0){let u=t.getPlaybackState();t.setPlaybackState({...u,duration:a}),t.updateControlsTime(u.currentTime,a),t.onRuntimeTimelineReady(a,typeof i.assetsReady=="boolean"?i.assetsReady:void 0)}Number.isFinite(i.compositionWidth)&&i.compositionWidth>0&&Number.isFinite(i.compositionHeight)&&i.compositionHeight>0&&t.setCompositionSize(i.compositionWidth,i.compositionHeight),t.setScenes(Wt(i.scenes));return}i.type==="stage-size"&&Number.isFinite(i.width)&&i.width>0&&Number.isFinite(i.height)&&i.height>0&&t.setCompositionSize(i.width,i.height)}function $t(r,e){return r.includes(e)?!0:/hyperframe\.runtime\.iife\.js|__hyperframes\s*=/.test(r)}var zt=new Set([">"," ","	",`
`,"\r","\f"]);function de(r,e){let t=r.toLowerCase(),i=`<${e}`,n=0;for(;n<t.length;){let o=t.indexOf(i,n);if(o<0)return null;let s=t[o+i.length];if(zt.has(s)){let a=t.indexOf(">",o+i.length);return a<0?null:{index:o,end:a+1}}n=o+i.length}return null}function Qe(r,e){if(!r||$t(r,e))return r;let t=`<script src="${e}"></script>`,i=de(r,"head");if(i)return r.slice(0,i.end)+t+r.slice(i.end);let n=de(r,"body");if(n)return r.slice(0,n.index)+t+r.slice(n.index);let o=de(r,"html");return o?r.slice(0,o.end)+t+r.slice(o.end):t+r}var w="shader-capture-scale",M="shader-loading",Q="runtime-src",Je="__hf_shader_capture_scale",Ke="__hf_shader_loading",L=["Preparing scene transitions","Sampling outgoing scene motion","Sampling incoming scene motion","Caching transition frames","Finalizing transition preview"];function le(r){if(r===null)return null;let e=Number(r);return!Number.isFinite(e)||e<=0?null:String(Math.min(1,Math.max(.25,e)))}function Bt(r){if(r===null||r.trim()==="")return"composition";let e=r.trim().toLowerCase();return e==="none"||e==="false"||e==="0"||e==="off"?"none":e==="player"||e==="true"||e==="1"||e==="on"?"player":"composition"}function et(r,e){return r.filter(t=>t!==""&&t.split("=")[0]!==e)}function qt(r,e,t){let i=r.indexOf("#"),n=i>=0?r.slice(0,i):r,o=i>=0?r.slice(i):"",s=n.indexOf("?"),a=s>=0?n.slice(0,s):n,u=s>=0?n.slice(s+1):"",c=et(u.split("&"),Je);c=et(c,Ke),e!==null&&c.push(`${Je}=${encodeURIComponent(e)}`),t!=="composition"&&c.push(`${Ke}=${encodeURIComponent(t)}`);let p=c.join("&");return`${a}${p?`?${p}`:""}${o}`}function Gt(r,e,t){if(e===null&&t==="composition")return r;let i=[];e!==null&&i.push(`window.__HF_SHADER_CAPTURE_SCALE=${JSON.stringify(e)};`),t!=="composition"&&i.push(`window.__HF_SHADER_LOADING=${JSON.stringify(t)};`);let n=`<script data-hyperframes-player-shader-options>${i.join("")}</script>`;return/<head\b[^>]*>/i.test(r)?r.replace(/<head\b[^>]*>/i,o=>`${o}${n}`):/<html\b[^>]*>/i.test(r)?r.replace(/<html\b[^>]*>/i,o=>`${o}${n}`):`${n}${r}`}function D(r){return Bt(r.getAttribute(M))}function tt(r){return Number(le(r.getAttribute(w))??"1")}function H(r,e){return qt(e,le(r.getAttribute(w)),D(r))}function U(r,e){return Qe(Gt(e,le(r.getAttribute(w)),D(r)),Yt(r))}function Yt(r){let e=r.getAttribute(Q)?.trim();if(!e)return k;try{let t=new URL(e,document.baseURI),i=t.protocol==="http:"||t.protocol==="https:",n=t.hostname==="127.0.0.1"||t.hostname==="localhost"||t.hostname==="[::1]";return i&&(n||t.origin===location.origin)?t.href:k}catch{return k}}function it(){let r=document.createElement("div");r.className="hfp-shader-loader",r.setAttribute("role","status"),r.setAttribute("aria-live","polite"),r.setAttribute("aria-label","Preparing scene transitions"),r.setAttribute("data-hyperframes-ignore",""),r.draggable=!1;let e=f=>{f.preventDefault(),f.stopPropagation()};for(let f of["selectstart","dragstart","pointerdown","mousedown","click","dblclick","contextmenu","touchstart"])r.addEventListener(f,e,{capture:!0});let t=document.createElement("div");t.className="hfp-shader-loader-panel",t.draggable=!1;let i=document.createElement("div");i.className="hfp-shader-loader-mark",i.draggable=!1,i.innerHTML=['<svg width="78" height="78" viewBox="0 0 100 100" fill="none" aria-hidden="true" draggable="false">','<path d="M10.1851 57.8021L33.1145 73.8313C36.2202 75.9978 41.5173 73.5433 42.4816 69.4984L51.7611 30.4271C52.7253 26.3822 48.5802 23.9277 44.4602 26.0942L13.917 42.1235C6.96677 45.7676 4.97564 54.1579 10.1851 57.8021Z" fill="url(#hfp-shader-loader-grad-left)"/>','<path d="M87.5129 57.5141L56.9696 73.5433C52.8371 75.7098 48.7046 73.2553 49.6688 69.2104L58.9483 30.1391C59.9125 26.0942 65.2097 23.6397 68.3154 25.8062L91.2447 41.8354C96.4668 45.4796 94.4631 53.8699 87.5129 57.5141Z" fill="url(#hfp-shader-loader-grad-right)"/>',"<defs>",'<linearGradient id="hfp-shader-loader-grad-left" x1="48.5676" y1="25" x2="44.7804" y2="71.9384" gradientUnits="userSpaceOnUse">','<stop stop-color="#06E3FA"/>','<stop offset="1" stop-color="#4FDB5E"/>',"</linearGradient>",'<linearGradient id="hfp-shader-loader-grad-right" x1="54.8282" y1="73.8392" x2="72.0989" y2="32.8932" gradientUnits="userSpaceOnUse">','<stop stop-color="#06E3FA"/>','<stop offset="1" stop-color="#4FDB5E"/>',"</linearGradient>","</defs>","</svg>"].join("");let n=document.createElement("div");n.className="hfp-shader-loader-title";let o=document.createElement("span");o.className="hfp-shader-loader-title-text",o.textContent=L[0]||"Preparing scene transitions",n.appendChild(o);let s=document.createElement("div");s.className="hfp-shader-loader-detail",s.textContent="Rendering animated scene samples for shader transitions.";let a=document.createElement("div");a.className="hfp-shader-loader-track",a.setAttribute("aria-hidden","true");let u=document.createElement("div");u.className="hfp-shader-loader-fill",a.appendChild(u);let c=document.createElement("div");c.className="hfp-shader-loader-progress";let p=f=>{let S=document.createElement("div");S.className="hfp-shader-loader-row";let h=document.createElement("span");h.className="hfp-shader-loader-label",h.textContent=f;let E=document.createElement("span");return E.className="hfp-shader-loader-value",S.appendChild(h),S.appendChild(E),c.appendChild(S),{row:S,label:h,value:E}},v=p("transition"),y=p("transition frame");return t.appendChild(i),t.appendChild(n),t.appendChild(s),t.appendChild(a),t.appendChild(c),r.appendChild(t),{root:r,fill:u,title:o,detail:s,transitionValue:v.value,frameLabel:y.label,frameValue:y.value,frameRow:y.row}}var Xt=420,J=class{_el;_hideTimeout=null;constructor(e){this._el=e}show(){this._hideTimeout&&(clearTimeout(this._hideTimeout),this._hideTimeout=null),this._el.root.classList.remove("hfp-hiding"),this._el.root.classList.add("hfp-visible")}hide(){if(this._el.root.classList.contains("hfp-hiding")){this._hideTimeout||this._scheduleCleanup();return}this._el.root.classList.contains("hfp-visible")&&(this._el.root.classList.add("hfp-hiding"),this._el.root.classList.remove("hfp-visible"),this._scheduleCleanup())}reset(){this._hideTimeout&&(clearTimeout(this._hideTimeout),this._hideTimeout=null),this._el.root.classList.remove("hfp-visible","hfp-hiding"),this._el.fill.style.transform="scaleX(0)",this._el.transitionValue.textContent="",this._el.frameValue.textContent="",this._el.frameRow.style.visibility="hidden"}update(e,t){if(t!=="player"){this.reset();return}if(e.ready||!e.loading){this.hide();return}this._el.root.setAttribute("aria-label","Preparing scene transitions");let i=typeof e.progress=="number"&&Number.isFinite(e.progress)?e.progress:0,n=typeof e.total=="number"&&Number.isFinite(e.total)?e.total:0,o=n>0?Math.min(1,Math.max(0,i/n)):0,s=Math.min(L.length-1,Math.floor(o*L.length));this._el.title.textContent=L[s]||"Preparing scene transitions",this._el.detail.textContent=e.phase==="cached"?"Loading cached transition frames before playback.":e.phase==="finalizing"?"Uploading transition textures for smooth playback.":"Rendering animated scene samples for shader transitions.",this._el.fill.style.transform=`scaleX(${o})`,this._el.transitionValue.textContent=e.currentTransition!==void 0&&e.transitionTotal!==void 0?`${e.currentTransition}/${e.transitionTotal}`:n>0?`${i}/${n}`:"";let a=e.transitionFrame!==void 0&&e.transitionFrames!==void 0?`${e.transitionFrame}/${e.transitionFrames}`:"";this._el.frameLabel.textContent=e.phase==="cached"?"cached transition frames":e.phase==="finalizing"?"finalizing transition frames":"rendering transition frames",this._el.frameValue.textContent=a,this._el.frameRow.style.visibility=a?"visible":"hidden",this._el.root.setAttribute("aria-valuenow",String(Math.round(o*100))),this.show()}showAssetsLoading(){this.reset(),this._el.title.textContent="Loading assets",this._el.detail.textContent="Waiting for images, video and fonts to finish loading.",this._el.root.setAttribute("aria-label","Loading assets"),this.show()}get hideTimeout(){return this._hideTimeout}destroy(){this._hideTimeout&&(clearTimeout(this._hideTimeout),this._hideTimeout=null)}_scheduleCleanup(){this._hideTimeout&&clearTimeout(this._hideTimeout),this._hideTimeout=setTimeout(()=>{this._el.root.classList.remove("hfp-hiding"),this._hideTimeout=null},Xt)}};var Zt=.1,Qt=5,ue="sandbox-origin",rt=1e4,ce=8e3,pe="assets-loading",Jt=150;function me(r){return!Number.isFinite(r)||r<=0?1:Math.max(Zt,Math.min(Qt,r))}var K=class extends HTMLElement{static get observedAttributes(){return["src","srcdoc","width","height","controls","muted","audio-locked","volume","poster","playback-rate","audio-src",ue,Q,w,M]}shadow;container;iframe;posterEl=null;controlsApi=null;resizeObserver;shaderLoader;probe;_ready=!1;_assetsReady=!1;_pendingPlay=!1;_assetsGeneration=0;_assetsLoadingShowTimer=null;_currentTime=0;_duration=0;_paused=!0;_scrubbing=!1;_lastUpdateMs=0;_volume=1;_compositionWidth=1920;_compositionHeight=1080;_rescaleWarned=!1;_directTimelineAdapter=null;_directTimelineClock;_parentTickRaf=null;_media;_scenes=[];_runtimeFps=30;_runtimeBridgeReady=!1;_runtimeAssetsReadyGeneration=-1;_runtimeData=new Map;_runtimeDataRequestId=0;_pendingRuntimeData=new Map;constructor(){super(),this.shadow=this.attachShadow({mode:"open"}),He(this.shadow,Le),{container:this.container,iframe:this.iframe}=Ue(),this.shadow.appendChild(this.container);let e=it();this.shadow.appendChild(e.root),this.shaderLoader=new J(e),this._media=new Z({dispatchEvent:t=>this.dispatchEvent(t),getMuted:()=>this.muted,getVolume:()=>this._volume,getPlaybackRate:()=>this.playbackRate,getCurrentTime:()=>this._currentTime,isPaused:()=>this._paused}),this._directTimelineClock=new X({onTimeUpdate:(t,i)=>{this._currentTime=t,this.controlsApi?.updateTime(t,i),this.dispatchEvent(new CustomEvent("timeupdate",{detail:{currentTime:t}}))},getLoop:()=>this.loop,restart:()=>{this.seek(0),this.play()},onPaused:()=>{this._media.audioOwner==="parent"&&this._media.pauseAll(),this._paused=!0,this.controlsApi?.updatePlaying(!1),this.dispatchEvent(new Event("ended"))},onEnded:()=>this.loop}),this.probe=new q(this.iframe,{onReady:t=>this._onProbeReady(t),onError:t=>this.dispatchEvent(new CustomEvent("error",{detail:{message:t}}))}),this.addEventListener("click",t=>{Fe(t)||(this._paused?this.play():this.pause())}),this.resizeObserver=new ResizeObserver(()=>this._rescale()),this._onMessage=this._onMessage.bind(this),this._onIframeLoad=this._onIframeLoad.bind(this)}connectedCallback(){this._applySandboxOriginPolicy(),this.resizeObserver.observe(this),window.addEventListener("message",this._onMessage),this.iframe.addEventListener("load",this._onIframeLoad),this.hasAttribute("controls")&&this._setupControls(),this.hasAttribute("poster")&&(this.posterEl=ne(this.shadow,this.getAttribute("poster"),this.posterEl)),this.hasAttribute("audio-src")&&this._media.setupFromUrl(this.getAttribute("audio-src")),this.hasAttribute("srcdoc")&&(this.iframe.srcdoc=U(this,this.getAttribute("srcdoc"))),this.hasAttribute("src")&&(this.iframe.src=H(this,this.getAttribute("src"))),!this.hasAttribute("audio-locked")&&this._isLockedHostEnvironment()&&this._applyAudioLock(!0)}disconnectedCallback(){this._sendControl("pause"),this._stopIframeMedia(),this.resizeObserver.disconnect(),window.removeEventListener("message",this._onMessage),this.iframe.removeEventListener("load",this._onIframeLoad),this.probe.stop(),this._directTimelineClock.stop(),this._stopParentTickClock(),this._directTimelineAdapter=null,this.shaderLoader.destroy(),this._media.destroy(),this.controlsApi?.destroy(),this.controlsApi=null,this._paused=!0,this._ready=!1,this._invalidateAssetsWait(),this._runtimeBridgeReady=!1,this._rejectAllRuntimeDataDeliveries("Player disconnected before runtime data was applied")}attributeChangedCallback(e,t,i){switch(e){case"src":if(!this.isConnected)break;i&&(this._ready=!1,this._invalidateAssetsWait(),this._runtimeBridgeReady=!1,this._rejectAllRuntimeDataDeliveries("Composition navigated before runtime data was applied"),this.iframe.src=H(this,i));break;case"srcdoc":if(!this.isConnected)break;this._ready=!1,this._invalidateAssetsWait(),this._runtimeBridgeReady=!1,this._rejectAllRuntimeDataDeliveries("Composition navigated before runtime data was applied"),i!==null?this.iframe.srcdoc=U(this,i):this.iframe.removeAttribute("srcdoc");break;case ue:this._applySandboxOriginPolicy(this.isConnected&&t!==i);break;case"width":this._compositionWidth=O(i)??1920,this._rescale();break;case"height":this._compositionHeight=O(i)??1080,this._rescale();break;case"controls":i!==null?this._setupControls():(this.controlsApi?.destroy(),this.controlsApi=null);break;case"poster":this.posterEl=ne(this.shadow,i,this.posterEl);break;case"playback-rate":{let n=me(parseFloat(i||"1"));this._media.updatePlaybackRate(n),this._sendControl("set-playback-rate",{playbackRate:n}),this._directTimelineAdapter?.timeScale?.(n),this.controlsApi?.updateSpeed(n),this.dispatchEvent(new Event("ratechange"));break}case"muted":this._handleMutedChange(i);break;case"audio-locked":this._applyAudioLock(i!==null);break;case"volume":{let n=Math.max(0,Math.min(1,parseFloat(i||"1")));this._volume=n,this._media.updateVolume(n),this._sendControl("set-volume",{volume:n}),this.controlsApi?.updateVolume(n),this.dispatchEvent(new Event("volumechange"));break}case"audio-src":i?this._media.setupFromUrl(i):this._media.teardownUrlAudio();break;case w:case M:case Q:if(!this.isConnected)break;this._reloadShaderOptions();break}}_applySandboxOriginPolicy(e=!1){this.hasAttribute(ue)?this.iframe.sandbox.remove("allow-same-origin"):this.iframe.sandbox.add("allow-same-origin"),e&&this._reloadForSandboxOriginPolicy()}_reloadForSandboxOriginPolicy(){this._ready=!1,this._invalidateAssetsWait(),this._runtimeBridgeReady=!1,this._rejectAllRuntimeDataDeliveries("Sandbox policy changed before runtime data was applied");let e=this.getAttribute("srcdoc");if(e!==null){this.iframe.srcdoc=U(this,e);return}let t=this.getAttribute("src");this.iframe.src=t===null?"about:blank":H(this,t)}get iframeElement(){return this.iframe}get scenes(){return this._scenes}play(){if(this._ready&&!this._assetsReady){this._pendingPlay=!0;return}this._pendingPlay=!1,this.posterEl?.remove(),this.posterEl=null,this._duration>0&&this._currentTime>=this._duration&&this.seek(0),this._paused=!1;let e=this._tryDirectTimelinePlay(),t=!1;e||(this._sendControl("play"),this._ready&&!this._directTimelineAdapter?this._startParentTickClock():this._ready||(this._pendingPlay=!0,t=!0)),this._media.audioOwner==="parent"&&this._media.playAll(),this.controlsApi?.updatePlaying(!0),t||this.dispatchEvent(new Event("play")),e&&this._directTimelineAdapter&&this._directTimelineClock.start(this._directTimelineAdapter,()=>this._currentTime,()=>this._duration,()=>this._paused)}pause(){this._pendingPlay=!1,this._tryDirectTimelinePause()||this._sendControl("pause"),this._directTimelineClock.stop(),this._stopParentTickClock(),this._media.audioOwner==="parent"&&this._media.pauseAll(),this._paused=!0,this.controlsApi?.updatePlaying(!1),this.dispatchEvent(new Event("pause"))}stopMedia(){this._sendControl("stop-media"),this._stopIframeMedia(),this._media.stopAdoptedMedia()}seek(e){this._pendingPlay=!1,!this._trySyncSeek(e)&&!this._tryDirectTimelineSeek(e)&&this._sendControl("seek",{timeSeconds:e,frame:Math.round(e*this._runtimeFps)}),this._directTimelineClock.stop(),this._stopParentTickClock(),this._currentTime=e,this._media.audioOwner==="parent"&&(this._scrubbing?this._media.scrubAll(e):(this._media.pauseAll(),this._media.seekAll(e))),this._paused=!0,this.controlsApi?.updatePlaying(!1),this.controlsApi?.updateTime(this._currentTime,this._duration)}setColorGrading(e,t){this._sendControl("set-color-grading",{target:e,grading:t})}clearColorGrading(e){this._sendControl("set-color-grading",{target:e,grading:null})}setColorGradingCompare(e,t){this._sendControl("set-color-grading-compare",{target:e,compare:t})}clearColorGradingCompare(e){this._sendControl("set-color-grading-compare",{target:e,compare:{enabled:!1}})}setRuntimeData(e,t){if(!/^[a-z][a-z0-9-]{0,63}$/.test(e))throw new Error(`Invalid HyperFrames runtime-data channel: ${e}`);if(typeof structuredClone!="function")throw new Error("HyperFrames runtime data requires structuredClone support; refusing an unverified payload");let i=structuredClone(t);this._runtimeData.set(e,i),this._deliverRuntimeData(e,i)}clearRuntimeData(e){if(!/^[a-z][a-z0-9-]{0,63}$/.test(e))throw new Error(`Invalid HyperFrames runtime-data channel: ${e}`);this._runtimeData.delete(e),this._deliverRuntimeDataClear(e)}get currentTime(){return this._currentTime}set currentTime(e){this.seek(e)}get duration(){return this._duration}get paused(){return this._paused}get ready(){return this._ready}get assetsReady(){return this._assetsReady}get playbackRate(){return me(parseFloat(this.getAttribute("playback-rate")||"1"))}set playbackRate(e){this.setAttribute("playback-rate",String(me(e)))}get shaderCaptureScale(){return tt(this)}set shaderCaptureScale(e){this.setAttribute(w,String(e))}get shaderLoading(){return D(this)}set shaderLoading(e){e==="composition"?this.removeAttribute(M):this.setAttribute(M,e)}get muted(){return this.hasAttribute("muted")}set muted(e){e?this.setAttribute("muted",""):this.removeAttribute("muted")}get audioLocked(){return this.hasAttribute("audio-locked")}set audioLocked(e){e?this.setAttribute("audio-locked",""):this.removeAttribute("audio-locked")}_isLockedHostEnvironment(){if(typeof navigator>"u")return!1;let e=navigator.userAgent||"";return/\bClaude\/\d/.test(e)&&/\bElectron\b/.test(e)}_isAudioLocked(){return this.hasAttribute("audio-locked")||this._isLockedHostEnvironment()}_isSlideshowPlayer(){return this.closest("hyperframes-slideshow")!==null}_handleMutedChange(e){if(e===null&&this._isAudioLocked()){this.setAttribute("muted","");return}this._media.updateMuted(e!==null),this._setIframeMediaMuted(e!==null),this._sendControl("set-muted",{muted:e!==null}),this.controlsApi?.updateMuted(e!==null),this.dispatchEvent(new Event("volumechange"))}_applyAudioLock(e){e&&(this.muted=!0),this.controlsApi?.setVolumeControlsHidden(e)}get volume(){return this._volume}set volume(e){this.setAttribute("volume",String(Math.max(0,Math.min(1,e))))}get loop(){return this.hasAttribute("loop")}set loop(e){e?this.setAttribute("loop",""):this.removeAttribute("loop")}_sendControl(e,t={}){try{let i=this.iframe.contentWindow;return i?(i.postMessage({...t,source:"hf-parent",type:"control",action:e,...Ye(this._runtimeFps)},"*"),!0):((e==="set-runtime-data"||e==="clear-runtime-data")&&this._rejectRuntimeDataDelivery(t.channel,t.requestId,"Composition iframe is unavailable"),!1)}catch(i){return(e==="set-runtime-data"||e==="clear-runtime-data")&&this._rejectRuntimeDataDelivery(t.channel,t.requestId,i instanceof Error?i.message:String(i)),!1}}_deliverRuntimeData(e,t){if(!this.isConnected||!this._runtimeBridgeReady)return;let i=this._beginRuntimeDataDelivery(e);this._trySetRuntimeDataDirect(e,t,i)||this._sendControl("set-runtime-data",{channel:e,payload:t,requestId:i})}_deliverRuntimeDataClear(e){if(!this.isConnected||!this._runtimeBridgeReady)return;let t=this._beginRuntimeDataDelivery(e);this._tryClearRuntimeDataDirect(e,t)||this._sendControl("clear-runtime-data",{channel:e,requestId:t})}_trySetRuntimeDataDirect(e,t,i){try{let n=this.iframe.contentWindow?.__hyperframes;return typeof n?.setRuntimeData!="function"?!1:(n.setRuntimeData(e,t,i),!0)}catch{return!1}}_tryClearRuntimeDataDirect(e,t){try{let i=this.iframe.contentWindow?.__hyperframes;return typeof i?.clearRuntimeData!="function"?!1:(i.clearRuntimeData(e,t),!0)}catch{return!1}}_replayRuntimeData(){for(let[e,t]of this._runtimeData)this._deliverRuntimeData(e,t)}_beginRuntimeDataDelivery(e){let t=this._pendingRuntimeData.get(e);t&&window.clearTimeout(t.timeoutId),this._runtimeDataRequestId+=1;let i=this._runtimeDataRequestId,n=window.setTimeout(()=>{this._rejectRuntimeDataDelivery(e,i,`Runtime data delivery timed out after ${rt}ms`)},rt);return this._pendingRuntimeData.set(e,{requestId:i,timeoutId:n}),i}_resolveRuntimeDataDelivery(e,t){let i=this._takeRuntimeDataDelivery(e,t);i&&this.dispatchEvent(new CustomEvent("runtimedataapplied",{detail:{channel:e,requestId:i.requestId}}))}_rejectRuntimeDataDelivery(e,t,i){let n=this._takeRuntimeDataDelivery(e,t);n&&this.dispatchEvent(new CustomEvent("runtimedataerror",{detail:{channel:e,requestId:n.requestId,message:typeof i=="string"?i:String(i)}}))}_takeRuntimeDataDelivery(e,t){if(typeof e!="string"||typeof t!="number"||!Number.isSafeInteger(t))return null;let i=this._pendingRuntimeData.get(e);return!i||i.requestId!==t?null:(window.clearTimeout(i.timeoutId),this._pendingRuntimeData.delete(e),i)}_rejectAllRuntimeDataDeliveries(e){for(let[t,i]of[...this._pendingRuntimeData])this._rejectRuntimeDataDelivery(t,i.requestId,e)}_getSameOriginIframeDocument(){try{return this.iframe.contentDocument}catch{return null}}_setIframeMediaMuted(e){let t=this._getSameOriginIframeDocument();if(t)for(let i of t.querySelectorAll("video, audio"))b(i)&&(i.muted=e||i.defaultMuted)}_stopIframeMedia(){let e=this._getSameOriginIframeDocument();if(e)for(let t of e.querySelectorAll("video, audio"))b(t)&&t.pause()}_replayBridgeState(){this._sendControl("set-muted",{muted:this.muted}),this._sendControl("set-volume",{volume:this._volume}),this._sendControl("set-playback-rate",{playbackRate:this.playbackRate}),this._sendControl("set-native-media-sync-disabled",{disabled:this._isSlideshowPlayer()}),this._sendControl("set-web-audio-media-disabled",{disabled:this._isSlideshowPlayer()})}_reloadShaderOptions(){if(this._ready=!1,this._invalidateAssetsWait(),this._runtimeBridgeReady=!1,this._rejectAllRuntimeDataDeliveries("Shader options changed before runtime data was applied"),D(this)!=="player"&&this.shaderLoader.reset(),this.hasAttribute("srcdoc")){this.iframe.srcdoc=U(this,this.getAttribute("srcdoc")||"");return}this.hasAttribute("src")&&(this.iframe.src=H(this,this.getAttribute("src")||""))}_trySyncSeek(e){try{let i=this.iframe.contentWindow?.__player;return typeof i?.seek!="function"?!1:(i.seek.call(i,e),!0)}catch{return!1}}_withDirectTimeline(e){let t=this.probe.resolveDirectTimelineAdapter(),i=t||this._directTimelineAdapter;if(!i)return!1;try{if(e(i),t&&t!==this._directTimelineAdapter){let n=t.duration();Number.isFinite(n)&&n>0&&(this._duration=n,this.controlsApi?.updateTime(this._currentTime,n))}return this._directTimelineAdapter=i,!0}catch{return!1}}_tryDirectTimelineSeek(e){return this._withDirectTimeline(t=>{t.seek(e,!1),t.pause()})}_tryDirectTimelinePlay(){return this._withDirectTimeline(e=>{e.play()})}_tryDirectTimelinePause(){return this._withDirectTimeline(e=>{e.pause()})}_startParentTickClock(){this._stopParentTickClock();let e=()=>{if(this._paused){this._parentTickRaf=null;return}this._sendControl("tick"),this._parentTickRaf=requestAnimationFrame(e)};this._parentTickRaf=requestAnimationFrame(e)}_stopParentTickClock(){this._parentTickRaf!==null&&(cancelAnimationFrame(this._parentTickRaf),this._parentTickRaf=null)}_onMessage(e){Ze(e,this.iframe.contentWindow,{getPlaybackState:()=>({currentTime:this._currentTime,duration:this._duration,paused:this._paused,lastUpdateMs:this._lastUpdateMs}),setPlaybackState:({currentTime:t,duration:i,paused:n,lastUpdateMs:o})=>{this._currentTime=t,this._duration=i,this._paused=n,this._lastUpdateMs=o},getShaderLoadingMode:()=>D(this),shaderLoader:this.shaderLoader,setCompositionSize:(t,i)=>{this._compositionWidth=t,this._compositionHeight=i,this._rescale()},sendControl:(t,i)=>this._sendControl(t,i),getIframeDoc:()=>this.iframe.contentDocument,onRuntimeReady:()=>{this._runtimeBridgeReady=!0,this._replayBridgeState(),this._replayRuntimeData()},onRuntimeAssetsReady:()=>{this._runtimeAssetsReadyGeneration===this._assetsGeneration&&this._settleAssetsReady(this._assetsGeneration)},onRuntimeDataApplied:(t,i)=>this._resolveRuntimeDataDelivery(t,i),onRuntimeDataError:(t,i,n)=>this._rejectRuntimeDataDelivery(t,i,n),onRuntimeTimelineReady:(t,i)=>this._onRuntimeTimelineReady(t,i),setRuntimeFps:t=>{this._runtimeFps=t},shouldPromoteMediaAutoplayFallback:()=>!this._isSlideshowPlayer(),setScenes:t=>{this._scenes=t,this.dispatchEvent(new CustomEvent("scenes",{detail:{scenes:t}}))},updateControlsTime:(t,i)=>this.controlsApi?.updateTime(t,i),updateControlsPlaying:t=>this.controlsApi?.updatePlaying(t),dispatchEvent:t=>this.dispatchEvent(t),seek:t=>this.seek(t),play:()=>this.play(),getLoop:()=>this.loop,media:this._media})}_onRuntimeTimelineReady(e,t){if(this._ready)return;this.probe.stop(),this._duration=e,this._directTimelineAdapter=null,this._ready=!0,this.controlsApi?.updateTime(this._currentTime,e),this.dispatchEvent(new CustomEvent("ready",{detail:{duration:e}})),this._rescale();let i=this._getSameOriginIframeDocument();i&&this._media.setupFromIframe(i),this._replayBridgeState(),this._setIframeMediaMuted(this.muted),this._waitForAssetsReady(i,t),(this.hasAttribute("autoplay")||this._pendingPlay)&&this.play()}_onProbeReady({duration:e,adapter:t,compositionSize:i}){this._duration=e,this._directTimelineAdapter=t.kind==="direct-timeline"?t.timeline:null,this._ready=!0,this.controlsApi?.updateTime(0,e),this.dispatchEvent(new CustomEvent("ready",{detail:{duration:e}})),i&&(this._compositionWidth=i.width,this._compositionHeight=i.height,this._rescale());let n=this._getSameOriginIframeDocument();n&&this._media.setupFromIframe(n),this._setIframeMediaMuted(this.muted),this._waitForAssetsReady(n),(this.hasAttribute("autoplay")||this._pendingPlay)&&this.play()}_waitForAssetsReady(e,t){this._clearAssetsLoadingShowTimer(),this._assetsReady=!1;let i=++this._assetsGeneration;if(!e){t===!1?(this._runtimeAssetsReadyGeneration=i,this._startAssetsLoadingOverlayTimer(i),setTimeout(()=>this._settleAssetsReady(i),ce)):this._settleAssetsReady(i);return}We(e,({timedOut:n})=>{i===this._assetsGeneration&&(n&&this._warnStuckAssets(e),this._settleAssetsReady(i))},{timeoutMs:ce}),this._assetsReady||this._startAssetsLoadingOverlayTimer(i)}_startAssetsLoadingOverlayTimer(e){this._assetsLoadingShowTimer=setTimeout(()=>{this._assetsLoadingShowTimer=null,!(e!==this._assetsGeneration||this._assetsReady)&&(this.setAttribute(pe,""),this.shaderLoader.showAssetsLoading())},Jt)}_warnStuckAssets(e){let{pendingMedia:t,pendingImages:i,fontsLoading:n}=se(e),o=e.defaultView;console.warn(`[hyperframes-player] assets-loading timed out after ${ce}ms \u2014 playing anyway`,{stuckMedia:t.map(s=>s.currentSrc||s.getAttribute("src")||`<${s.tagName.toLowerCase()}>`),stuckImages:i.map(s=>s.currentSrc||s.getAttribute("src")||"<img>"),fontsLoading:n,computeReady:o?.__renderReady===!0,documentHidden:e.hidden===!0})}_settleAssetsReady(e){e!==this._assetsGeneration||this._assetsReady||(this._clearAssetsLoadingShowTimer(),this._assetsReady=!0,this.removeAttribute(pe),this.shaderLoader.hide(),this.dispatchEvent(new Event("assetsready")),this._pendingPlay&&this.play())}_invalidateAssetsWait(){this._clearAssetsLoadingShowTimer(),this._assetsReady=!1,this._pendingPlay=!1,this._assetsGeneration++,this.removeAttribute(pe),this.shaderLoader.hide()}_clearAssetsLoadingShowTimer(){this._assetsLoadingShowTimer!==null&&(clearTimeout(this._assetsLoadingShowTimer),this._assetsLoadingShowTimer=null)}_rescale(){!Ve(this,this.iframe,this._compositionWidth,this._compositionHeight)&&this._ready&&!this._rescaleWarned&&(this._rescaleWarned=!0,console.warn("[hyperframes-player] rescale no-op after ready \u2014 zero-size player element",{src:this.getAttribute("src"),offsetWidth:this.offsetWidth,offsetHeight:this.offsetHeight,compositionWidth:this._compositionWidth,compositionHeight:this._compositionHeight}))}_onIframeLoad(){this._ready&&this._getSameOriginIframeDocument()===null||(this._ready=!1,this._directTimelineAdapter=null,this._directTimelineClock.stop(),this._stopParentTickClock(),this._invalidateAssetsWait(),this.shaderLoader.reset(),this._media.resetForIframeLoad(),this.probe.start())}_setupControls(){this.controlsApi||(this.controlsApi=Ne(this.shadow,this.muted,this._volume,this.getAttribute("speed-presets"),{onPlay:()=>this.play(),onPause:()=>this.pause(),onSeek:e=>this.seek(e*this._duration),onScrubStart:()=>{this._scrubbing=!0},onScrubEnd:()=>{this._scrubbing=!1,this.seek(this._currentTime)},onSpeedChange:e=>{this.playbackRate=e},onMuteToggle:()=>{this.muted=!this.muted},onVolumeChange:e=>{this.volume=e}},this._isAudioLocked()))}get _audioOwner(){return this._media.audioOwner}get _parentMedia(){return this._media.entries}_mirrorParentMediaTime(e,t){this._media.mirrorTime(e,t)}_promoteToParentProxy(){let e=null;try{e=this.iframe.contentDocument}catch{}this._media.promoteToParentProxy(e,(t,i)=>this._mirrorParentMediaTime(t,i)),this._sendControl("set-media-output-muted",{muted:!0})}_observeDynamicMedia(e){this._media.setupFromIframe(e)}};customElements.get("hyperframes-player")||customElements.define("hyperframes-player",K);return ut(Kt);})();
//# sourceMappingURL=hyperframes-player.global.js.map