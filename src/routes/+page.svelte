<script lang="ts">
  import { onMount, tick, onDestroy } from 'svelte';
  import { gsap } from 'gsap';
  import {
    inputText, tokens, temperature, topK, topP, samplingMethod,
    modelData, appState, currentLayer, currentHead, hoveredToken,
    isReady, isBusy, statusMessage, activePredictions,
    currentAttentionMatrix, layerInfo, headInfo, modelConfig,
    setInputText, appendToken, loadExample, setTemperature, setTopK,
    setSamplingMethod, updateModelData, previousLayer, nextLayer,
    previousHead, nextHead, setHoveredToken, loadDemoData,
    setLoadingProgress, setModelLoaded, setTokenizerLoaded,
    setInferenceRunning, setError, setTokens
  } from '$lib/store';
  import { ARABIC_EXAMPLES, ARABIC_LABELS } from '$lib/utils/constants';
  import { initialize, analyzeText, generateDemoData, isReady as checkReady } from '$lib/utils/data';

  // ═══ STATE ═══
  let inputElement: HTMLTextAreaElement;
  let debounceTimer: ReturnType<typeof setTimeout>;
  let useDemo = true;
  let showExamples = false;
  let showArticle = false;
  let isAnimating = false;
  let hoveredMatrixCell: {row:number|null, col:number|null} = {row:null, col:null};
  let currentTimeline: gsap.core.Timeline | null = null;
  let residualAnimation: gsap.core.Tween | null = null;
  let mainContainer: HTMLDivElement;
  let sankeyBackSvg: SVGSVGElement;
  let resizeObserver: ResizeObserver | null = null;
  let active = false;

  // Vector height
  let vizHeight = 0;
  let vectorHeight = 28;
  const titleHeight = 80;

  $: {
    if (vizHeight && $tokens.length) {
      const gaps = 8 * ($tokens.length - 1);
      vectorHeight = Math.min(Math.max((vizHeight - titleHeight - gaps) / $tokens.length / 3, 16), 36);
    }
  }

  onDestroy(() => {
    currentTimeline?.kill();
    residualAnimation?.kill();
    if (resizeObserver) resizeObserver.disconnect();
  });

  // ═══ COLORS ═══
  const C = {
    gray200: '#e5e7eb', gray300: '#d1d5db', gray400: '#9ca3af',
    blue200: '#bfdbfe', blue300: '#93c5fd',
    red200: '#fecaca', red300: '#fca5a5',
    green200: '#bbf7d0', green300: '#86efac',
    purple200: '#ddd6fe', purple300: '#c4b5fd',
    indigo200: '#c7d2fe',
    white: '#ffffff',
  };

  // ═══ INIT ═══
  onMount(async () => {
    if (useDemo) {
      loadDemoData();
      await runAnalysis($inputText);
      await tick();
      setTimeout(async () => {
        drawAllSankeyPaths();
        active = true;
        await tick();
        setTimeout(() => playFlowAnimation(), 300);
      }, 400);
    } else {
      try {
        await initialize((p: number, m: string) => setLoadingProgress(p, m));
        setModelLoaded(true); setTokenizerLoaded(true);
        await runAnalysis($inputText);
        await tick();
        setTimeout(async () => {
          drawAllSankeyPaths();
          active = true;
          await tick();
          setTimeout(() => playFlowAnimation(), 300);
        }, 400);
      } catch (e) {
        console.error('Init error:', e);
        setError(e instanceof Error ? e.message : 'خطأ');
        loadDemoData(); active = true;
      }
    }
    if (mainContainer) {
      resizeObserver = new ResizeObserver(() => drawAllSankeyPaths());
      resizeObserver.observe(mainContainer);
    }
  });

  // ═══════════════ SANKEY PATHS (LTR: source.right → target.left) ═══════════════
  type SPath = { d: string; fill: string; opacity: number; cls: string };
  let sankeyPaths: SPath[] = [];
  let residualPathD = '';

  function allRects(sel: string): DOMRect[] {
    if (!mainContainer) return [];
    return Array.from(mainContainer.querySelectorAll(sel)).map(e => e.getBoundingClientRect());
  }
  function oneRect(sel: string): DOMRect | null {
    const el = mainContainer?.querySelector(sel);
    return el ? el.getBoundingClientRect() : null;
  }

  /** LTR band path: source.right → target.left with cubic bezier */
  function bandPath(sr: DOMRect, tr: DOMRect, curve = 80): string {
    const off = mainContainer.getBoundingClientRect();
    const sx = sr.right - off.left;
    const sy = sr.top - off.top;
    const sb = sr.bottom - off.top;
    const tx = tr.left - off.left;
    const ty = tr.top - off.top;
    const tb = tr.bottom - off.top;
    if ([sx,sy,sb,tx,ty,tb].some(v => !isFinite(v))) return '';
    // Adjust curve to distance
    const dist = Math.abs(tx - sx);
    const c = Math.min(curve, dist * 0.8);
    return `M${sx},${sy} C${sx+c},${sy} ${tx-c},${ty} ${tx},${ty} L${tx},${tb} C${tx-c},${tb} ${sx+c},${sb} ${sx},${sb} Z`;
  }

  function drawAllSankeyPaths() {
    if (!mainContainer) return;
    const paths: SPath[] = [];
    const W = mainContainer.getBoundingClientRect().width;
    const curve = Math.max(40, Math.floor(W / 15));

    // Embedding → QKV (per token)
    const embVecs = allRects('.emb-vec');
    const qkvGroups = allRects('.qkv-group');
    for (let i = 0; i < Math.min(embVecs.length, qkvGroups.length); i++) {
      const d = bandPath(embVecs[i], qkvGroups[i], curve * 0.15);
      if (d) paths.push({ d, fill: 'url(#sg-gray-blue)', opacity: 0.8, cls: 'p-emb-qkv' });
    }

    // Q → attention area (per token)
    const qChips = allRects('.q-chip');
    const attnArea = oneRect('.attn-matrix');
    if (attnArea && qChips.length) {
      const slotH = attnArea.height / qChips.length;
      for (let i = 0; i < qChips.length; i++) {
        const tr = new DOMRect(attnArea.left, attnArea.top + slotH * i, attnArea.width, slotH);
        const d = bandPath(qChips[i], tr, curve * 0.8);
        if (d) paths.push({ d, fill: 'url(#sg-blue)', opacity: 0.3, cls: 'p-q-attn' });
      }
    }

    // K → attention area (per token)
    const kChips = allRects('.k-chip');
    if (attnArea && kChips.length) {
      const slotH = attnArea.height / kChips.length;
      for (let i = 0; i < kChips.length; i++) {
        const tr = new DOMRect(attnArea.left, attnArea.top + slotH * i, attnArea.width, slotH);
        const d = bandPath(kChips[i], tr, curve * 0.8);
        if (d) paths.push({ d, fill: 'url(#sg-red)', opacity: 0.25, cls: 'p-k-attn' });
      }
    }

    // V → attention area (per token)
    const vChips = allRects('.v-chip');
    if (attnArea && vChips.length) {
      const slotH = attnArea.height / vChips.length;
      for (let i = 0; i < vChips.length; i++) {
        const tr = new DOMRect(attnArea.left, attnArea.top + slotH * i, attnArea.width, slotH);
        const d = bandPath(vChips[i], tr, curve * 0.8);
        if (d) paths.push({ d, fill: 'url(#sg-green)', opacity: 0.25, cls: 'p-v-attn' });
      }
    }

    // Attention out → MLP first (per token)
    const attnOuts = allRects('.attn-out-vec');
    const mlpIns = allRects('.mlp-first-vec');
    for (let i = 0; i < Math.min(attnOuts.length, mlpIns.length); i++) {
      const d = bandPath(attnOuts[i], mlpIns[i], curve);
      if (d) paths.push({ d, fill: 'url(#sg-purple)', opacity: 0.35, cls: 'p-attn-mlp' });
    }

    // MLP mid → MLP out (per token)
    const mlpMids = allRects('.mlp-mid-vec');
    const mlpOuts = allRects('.mlp-out-vec');
    for (let i = 0; i < Math.min(mlpMids.length, mlpOuts.length); i++) {
      const d = bandPath(mlpMids[i], mlpOuts[i], curve * 0.5);
      if (d) paths.push({ d, fill: 'url(#sg-indigo-blue)', opacity: 0.3, cls: 'p-mlp-int' });
    }

    // MLP out → Blocks (per token)
    const mlpOutVecs = allRects('.mlp-out-vec');
    const blockVecs = allRects('.block-vec');
    for (let i = 0; i < Math.min(mlpOutVecs.length, blockVecs.length); i++) {
      const d = bandPath(mlpOutVecs[i], blockVecs[i], curve);
      if (d) paths.push({ d, fill: 'url(#sg-blue-white-blue)', opacity: 0.5, cls: 'p-mlp-blocks' });
    }

    // Last block vec → output area
    const outArea = oneRect('.output-area');
    if (outArea && blockVecs.length) {
      const d = bandPath(blockVecs[blockVecs.length - 1], outArea, curve);
      if (d) paths.push({ d, fill: 'url(#sg-blue-gray)', opacity: 0.35, cls: 'p-blocks-out' });
    }

    // Residual arc
    const resStart = oneRect('.residual-start');
    const resEnd = oneRect('.residual-end');
    if (resStart && resEnd) {
      const off = mainContainer.getBoundingClientRect();
      const x1 = resStart.right - off.left;
      const y1 = resStart.top - off.top;
      const x2 = resEnd.left - off.left;
      const y2 = resEnd.top - off.top;
      const arcY = Math.min(y1, y2) - 20;
      residualPathD = `M${x1},${y1} Q${x1},${arcY} ${(x1+x2)/2},${arcY} Q${x2},${arcY} ${x2},${y2}`;
    }

    sankeyPaths = paths;
  }

  // ═══ GRADIENT ANIMATION ═══
  function getGradStops(cls: string, idx = 1): SVGStopElement[] {
    return Array.from(document.querySelectorAll(`.${cls}`)).map(
      e => e?.querySelectorAll('stop')[idx]
    ).filter(Boolean) as SVGStopElement[];
  }

  function gradAnim(tl: gsap.core.Timeline, stops: SVGStopElement | SVGStopElement[] | undefined, opts: any = {}) {
    if (!stops || (Array.isArray(stops) && !stops.length)) return;
    const { color='rgba(255,255,255,0)', duration=0.1, ease='power1.in', offset={from:'0%',to:'100%'}, position='+=0', ...rest } = opts;
    const { from='0%', to='100%' } = offset;
    const initColor = Array.isArray(stops) ? stops.map(d => d?.getAttribute('stop-color')) : stops?.getAttribute('stop-color');
    tl.fromTo(stops, { attr: { offset: from, 'stop-color': color } },
      { attr: { offset: to, 'stop-color': color }, duration, ease, ...rest }, position
    ).to(stops, { attr: { offset: to, 'stop-color': (i: number) => Array.isArray(stops) ? (initColor as string[])[i] : initColor }, duration, ease, ...rest }, '-=50%');
  }

  async function playFlowAnimation() {
    if (isAnimating || !mainContainer) return;
    isAnimating = true;
    currentTimeline?.kill();
    residualAnimation?.kill();
    const dur = 0.02;
    const tLen = $tokens.length;

    return new Promise<void>(resolve => {
      const tl = gsap.timeline({ onComplete: () => { isAnimating = false; startResidual(); resolve(); } });
      currentTimeline = tl;

      tl.fromTo('.emb-vec, .token-label', { opacity: 0 }, { opacity: 1, duration: 0.2, stagger: 0.02 });
      gradAnim(tl, getGradStops('sg-gray-blue'), { duration: dur * 10 });
      tl.fromTo('.qkv-chip', { opacity: 0 }, { opacity: 1, duration: 0.15, stagger: 0.01 });
      gradAnim(tl, [...getGradStops('sg-blue'), ...getGradStops('sg-red'), ...getGradStops('sg-green')], { duration: dur * 10 });
      tl.fromTo('.attn-token-label', { opacity: 0 }, { opacity: 1, duration: 0.15, stagger: 0.01 });

      const circles = mainContainer.querySelectorAll('.matrix-circle');
      if (circles.length > 0) {
        const QKD = 0.7;
        tl.fromTo(circles, { scale: 0, transformOrigin: '50% 50%', opacity: 0 },
          { scale: 1, opacity: 1, transformOrigin: '50% 50%',
            delay: QKD / Math.max(tLen, 1),
            stagger: Number((QKD / Math.max(tLen * tLen, 1)).toFixed(3)),
            ease: 'power2.out', duration: QKD });
      }

      gradAnim(tl, getGradStops('sg-purple'), { duration: dur * 10, position: '<50%' });
      tl.fromTo('.attn-out-vec', { opacity: 0 }, { opacity: 1, duration: 0.12 });
      tl.fromTo('.mlp-first-vec', { opacity: 0 }, { opacity: 1, duration: dur });
      gradAnim(tl, getGradStops('sg-indigo-blue'), { duration: dur * 8 });
      tl.fromTo('.mlp-mid-vec', { opacity: 0 }, { opacity: 1, duration: dur });
      tl.fromTo('.mlp-out-vec', { opacity: 0 }, { opacity: 1, duration: dur });
      gradAnim(tl, getGradStops('sg-blue-white-blue'), { duration: dur * 5, offset: { to: '50%' }, ease: 'sine.inOut' });
      tl.fromTo('.block-vec', { opacity: 0 }, { opacity: 1, duration: 0.1 });
      gradAnim(tl, getGradStops('sg-blue-gray'), { offset: { to: '50%' } });
      tl.fromTo('.prob-row', { opacity: 0 }, { opacity: 1, duration: 0.15, stagger: 0.03 });
      const bars = mainContainer.querySelectorAll('.prob-fill');
      bars.forEach((bar, i) => {
        const pred = $activePredictions[i];
        if (pred) tl.to(bar, { width: `${pred.probability * 100}%`, duration: 0.4, ease: 'power2.out' }, '-=0.3');
      });
    });
  }

  function startResidual() {
    const el = mainContainer?.querySelectorAll('.residual-path');
    if (!el?.length) return;
    residualAnimation?.kill();
    residualAnimation = gsap.to(el, { strokeDashoffset: -50, duration: 1, repeat: -1, ease: 'none' });
  }

  // ═══ ANALYSIS ═══
  async function runAnalysis(text: string) {
    if (!text.trim()) return;
    setInferenceRunning(true);
    try {
      const result = (useDemo || !checkReady()) ? generateDemoData(text) : await analyzeText(text, { temperature: $temperature, topK: $topK, topP: $topP, samplingMethod: $samplingMethod });
      setTokens(result.inputTokens);
      updateModelData({ attentions: result.attentions, predictions: result.predictions, logits: result.logits });
    } catch (e) { console.error(e); setError(e instanceof Error ? e.message : 'خطأ'); }
    finally { setInferenceRunning(false); }
  }

  // ═══ HANDLERS ═══
  function handleInput(ev: Event) {
    const v = (ev.target as HTMLTextAreaElement).value;
    setInputText(v);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => runAnalysis(v), 500);
  }
  async function handleGenerate() {
    if (isAnimating) { currentTimeline?.kill(); residualAnimation?.kill(); isAnimating = false; }
    await runAnalysis($inputText);
    await tick(); drawAllSankeyPaths();
    setTimeout(() => playFlowAnimation(), 100);
  }
  function handleExample(id: number) {
    const ex = ARABIC_EXAMPLES.find(e => e.id === id);
    if (ex) { setInputText(ex.text); showExamples = false; handleGenerate(); }
  }
  async function handlePredClick(tok: string) {
    setInputText($inputText + tok);
    await runAnalysis($inputText + tok);
    await tick(); drawAllSankeyPaths();
    setTimeout(() => playFlowAnimation(), 100);
  }
  function handleTemp(ev: Event) { setTemperature(parseFloat((ev.target as HTMLInputElement).value)); runAnalysis($inputText); }
  function fmt(t: string) { return t.replace(/Ġ/g, ' ').replace(/▁/g, ' ') || '␣'; }
  function purpleColor(v: number) { return v === 0 ? 'transparent' : `rgba(139,92,246,${Math.min(1,v)})`; }
</script>

<!-- ═══ SVG GRADIENT DEFS ═══ -->
<svg style="position:absolute;width:0;height:0;overflow:hidden">
  <defs>
    <linearGradient id="sg-gray-blue" class="sg-gray-blue" x1="0%" y1="0" x2="100%" y2="0">
      <stop offset="0%" stop-color={C.gray200}/><stop offset="100%" stop-color={C.blue200}/>
    </linearGradient>
    <linearGradient id="sg-blue" class="sg-blue" x1="0%" y1="0" x2="100%" y2="0">
      <stop offset="0%" stop-color={C.blue300}/><stop offset="100%" stop-color={C.blue300}/>
    </linearGradient>
    <linearGradient id="sg-red" class="sg-red" x1="0%" y1="0" x2="100%" y2="0">
      <stop offset="0%" stop-color={C.red300}/><stop offset="100%" stop-color={C.red300}/>
    </linearGradient>
    <linearGradient id="sg-green" class="sg-green" x1="0%" y1="0" x2="100%" y2="0">
      <stop offset="0%" stop-color={C.green300}/><stop offset="100%" stop-color={C.green300}/>
    </linearGradient>
    <linearGradient id="sg-purple" class="sg-purple" x1="0%" y1="0" x2="100%" y2="0">
      <stop offset="0%" stop-color={C.purple200}/><stop offset="100%" stop-color={C.indigo200}/>
    </linearGradient>
    <linearGradient id="sg-indigo-blue" class="sg-indigo-blue" x1="0%" y1="0" x2="100%" y2="0">
      <stop offset="0%" stop-color={C.indigo200}/><stop offset="100%" stop-color={C.blue200}/>
    </linearGradient>
    <linearGradient id="sg-blue-white-blue" class="sg-blue-white-blue" x1="0%" y1="0" x2="100%" y2="0">
      <stop offset="0%" stop-color={C.blue200}/><stop offset="40%" stop-color={C.white}/>
      <stop offset="60%" stop-color={C.white}/><stop offset="100%" stop-color={C.blue200}/>
    </linearGradient>
    <linearGradient id="sg-blue-gray" class="sg-blue-gray" x1="0%" y1="0" x2="100%" y2="0">
      <stop offset="0%" stop-color={C.blue200}/><stop offset="50%" stop-color={C.gray200}/>
    </linearGradient>
  </defs>
</svg>

<!-- ═══ HEADER ═══ -->
<header class="top-bar" class:active>
  <div class="bar-inner">
    <div class="logo"><span class="logo-ar">شارح المحوّل</span><span class="logo-sub">TRANSFORMER EXPLAINER</span></div>
    <div class="input-area">
      <div class="input-row">
        <button class="ex-btn" on:click={() => showExamples = !showExamples}>أمثلة ▾</button>
        <div class="inp-wrap">
          <textarea bind:this={inputElement} value={$inputText} on:input={handleInput} class="inp" placeholder={ARABIC_LABELS.inputPlaceholder} dir="rtl" rows="1"></textarea>
          {#if $activePredictions.length > 0 && !isAnimating}
            <span class="ghost" on:click={() => handlePredClick($activePredictions[0].token)}>{$activePredictions[0].token}</span>
          {/if}
        </div>
        <button class="gen-btn" on:click={handleGenerate} disabled={isAnimating || !$inputText.trim()}>
          {#if isAnimating}<span class="spin"></span>{:else}Generate{/if}
        </button>
      </div>
      {#if showExamples}
        <div class="ex-panel">{#each ARABIC_EXAMPLES.slice(0,6) as ex}<button class="ex-item" on:click={() => handleExample(ex.id)}>{ex.text}</button>{/each}</div>
      {/if}
    </div>
    <div class="ctrls">
      <div class="ctrl-grp">
        <span class="ctrl-lbl">Temperature</span>
        <div class="ctrl-row"><input type="range" class="slider" min="0.1" max="2" step="0.1" value={$temperature} on:input={handleTemp}/><span class="ctrl-val">{$temperature.toFixed(1)}</span></div>
      </div>
      <div class="ctrl-grp">
        <span class="ctrl-lbl">Sampling</span>
        <div class="ctrl-row">
          <label class="rad"><input type="radio" name="s" value="top-k" checked={$samplingMethod==='top-k'} on:change={() => setSamplingMethod('top-k')}/>Top-k</label>
          <label class="rad"><input type="radio" name="s" value="top-p" checked={$samplingMethod==='top-p'} on:change={() => setSamplingMethod('top-p')}/>Top-p</label>
        </div>
        <span class="ctrl-val" style="font-size:0.6rem">k={$topK}</span>
      </div>
      <div class="hdr-links">
        <span class="badge"><span class="dot" class:on={$isReady}></span>{$modelConfig.name}</span>
        <a href="https://github.com/2pidata/transformer-explainer-arabic" target="_blank" rel="noopener" aria-label="GitHub">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        </a>
      </div>
    </div>
  </div>
</header>

<!-- ═══ MAIN VIZ ═══ -->
<div class="main-viz" class:active bind:this={mainContainer} style="--vh:{vectorHeight}px;--th:{titleHeight}px">
  <!-- Sankey SVG -->
  <svg class="sankey-svg" bind:this={sankeyBackSvg}>
    {#each sankeyPaths as p}{#if p.d}<path class="sk-path {p.cls}" d={p.d} fill={p.fill} opacity={p.opacity}/>{/if}{/each}
    {#if residualPathD}
      <path class="residual-path" d={residualPathD} fill="none" stroke={C.gray400} stroke-width="1.5" stroke-dasharray="8 5" opacity="0.4"/>
    {/if}
  </svg>

  <!-- 4-column LTR grid like original: Embedding | Blocks(QKV+Attn+MLP) | SubsequentBlocks | Probabilities -->
  <div class="viz-grid" bind:offsetHeight={vizHeight}>

    <!-- COL 1: EMBEDDING -->
    <div class="step emb-step">
      <div class="step-title">
        <span class="t-main">Embedding</span>
        <span class="t-sub">التضمين</span>
      </div>
      <div class="step-body">
        <div class="column emb-column residual-start">
          {#each $tokens as token, i}
            <div class="cell" on:mouseenter={() => setHoveredToken(i)} on:mouseleave={() => setHoveredToken(null)}>
              <span class="label">{fmt(token.text)}</span>
              <div class="emb-vec vec" style="background:{C.gray300}"></div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- COL 2: TRANSFORMER BLOCK (contains QKV + Attention + MLP sub-grid) -->
    <div class="step blocks-step">
      <div class="step-title block-title">
        <div class="block-hdr">
          <span>Transformer Block {$currentLayer + 1}</span>
          <span class="nav-btns">
            <button class="nb" on:click={previousLayer} disabled={$currentLayer===0}>‹</button>
            <button class="nb" on:click={nextLayer} disabled={$currentLayer>=$modelConfig.numLayers-1}>›</button>
          </span>
        </div>
        <div class="block-sub">Multi-head Self Attention · الانتباه الذاتي متعدد الرؤوس</div>
        <div class="block-sub dim">Residual</div>
      </div>
      <div class="step-body">
        <div class="inner-grid">
          <!-- QKV column -->
          <div class="inner-col qkv-col">
            {#each $tokens as token, i}
              <div class="qkv-group" on:mouseenter={() => setHoveredToken(i)} on:mouseleave={() => setHoveredToken(null)}>
                <div class="qkv-chip q-chip" class:hi={hoveredMatrixCell.col===i} class:fade={hoveredMatrixCell.col!==null && hoveredMatrixCell.col!==i}>
                  <span class="ql" style="color:#1d4ed8">Q</span>
                </div>
                <div class="qkv-chip k-chip" class:hi={hoveredMatrixCell.row===i} class:fade={hoveredMatrixCell.row!==null && hoveredMatrixCell.row!==i}>
                  <span class="ql" style="color:#dc2626">K</span>
                </div>
                <div class="qkv-chip v-chip">
                  <span class="ql" style="color:#16a34a">V</span>
                </div>
              </div>
            {/each}
          </div>

          <!-- Attention column -->
          <div class="inner-col attn-col">
            <div class="attn-section">
              <div class="attn-head-nav">
                <span>Head {$currentHead + 1} of {$modelConfig.numHeads}</span>
                <button class="nb xs" on:click={previousHead} disabled={$currentHead===0}>‹</button>
                <button class="nb xs" on:click={nextHead} disabled={$currentHead>=$modelConfig.numHeads-1}>›</button>
              </div>
              <div class="attn-labels-area">
                <div class="side-lbl key-lbl">Key</div>
                <div class="side-lbl query-lbl">Query</div>
                <div class="side-lbl value-lbl">Value</div>
              </div>
              <!-- Key/Query token labels + attention matrix -->
              <div class="attn-matrix">
                {#if $currentAttentionMatrix && $tokens.length > 0}
                  <div class="attn-grid">
                    <!-- Column headers (Key tokens) -->
                    <div class="attn-hdr-row">
                      <div class="attn-corner"></div>
                      {#each $tokens as t, j}
                        <div class="attn-col-lbl attn-token-label" class:col-hi={hoveredMatrixCell.col===j}>{fmt(t.text)}</div>
                      {/each}
                    </div>
                    <!-- Matrix rows -->
                    {#each $currentAttentionMatrix as row, i}
                      <div class="attn-data-row">
                        <div class="attn-row-lbl attn-token-label" class:row-hi={hoveredMatrixCell.row===i}>{fmt($tokens[i]?.text || '')}</div>
                        {#each row as val, j}
                          {#if j <= i}
                            <div class="attn-cell" on:mouseenter={() => { hoveredMatrixCell = {row:i,col:j}; }} on:mouseleave={() => { hoveredMatrixCell = {row:null,col:null}; }}>
                              <svg viewBox="0 0 24 24" class="circle-svg"><circle class="matrix-circle" cx="12" cy="12" r={Math.max(2, val * 10)} fill={purpleColor(val)} stroke="rgba(139,92,246,0.15)" stroke-width="0.5"/></svg>
                            </div>
                          {:else}
                            <div class="attn-cell masked"></div>
                          {/if}
                        {/each}
                      </div>
                    {/each}
                  </div>
                {:else}
                  <div class="empty-msg">...</div>
                {/if}
              </div>
              <div class="attn-bottom-label">Attention</div>
            </div>
            <!-- Out column -->
            <div class="attn-out-col">
              <div class="out-lbl">Out</div>
              {#each $tokens as _, i}
                <div class="attn-out-vec vec" style="background:{C.purple200}"></div>
              {/each}
            </div>
          </div>

          <!-- MLP column -->
          <div class="inner-col mlp-col">
            <div class="mlp-title">MLP</div>
            <div class="mlp-layers">
              <!-- First (input) -->
              <div class="mlp-layer">
                {#each $tokens as t, i}
                  <div class="cell">
                    <span class="mlp-label">{fmt(t.text)}</span>
                    <div class="mlp-first-vec vec" style="background:{C.purple200}"></div>
                  </div>
                {/each}
              </div>
              <!-- Mid (4x) -->
              <div class="mlp-layer">
                {#each $tokens as _, i}
                  <div class="cell">
                    <div class="mlp-mid-vec vec wide" style="background:{C.indigo200}"></div>
                  </div>
                {/each}
              </div>
              <!-- Out -->
              <div class="mlp-layer residual-end">
                {#each $tokens as t, i}
                  <div class="cell">
                    <div class="mlp-out-vec vec" style="background:{C.blue200}"></div>
                    <span class="mlp-label right">{fmt(t.text)}</span>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- COL 3: SUBSEQUENT BLOCKS -->
    <div class="step subblocks-step">
      <div class="step-title">
        <span class="blocks-note">{$modelConfig.numLayers - $currentLayer - 1} more identical<br/><strong>Transformer<br/>Blocks</strong></span>
        <svg class="arrow-down" viewBox="0 0 3 5" fill="none"><path d="M1.18 4.58a.13.13 0 00.18 0l.8-.8a.13.13 0 000-.18.13.13 0 00-.18 0L1.27 4.32l-.7-.71a.13.13 0 00-.18 0 .13.13 0 000 .18l.8.8zM1.15.29v4.2h.25V.29h-.25z" fill="currentColor"/></svg>
      </div>
      <div class="step-body">
        <div class="column blocks-column">
          {#each $tokens as _, i}
            <div class="cell"><div class="block-vec vec" style="background:{C.blue200}"></div></div>
          {/each}
        </div>
      </div>
    </div>

    <!-- COL 4: PROBABILITIES -->
    <div class="step prob-step">
      <div class="step-title">
        <span class="t-main">Probabilities</span>
        <span class="t-sub">الاحتمالات</span>
      </div>
      <div class="step-body output-area">
        {#each $activePredictions as pred, i}
          <button class="prob-row" class:top={i===0} on:click={() => handlePredClick(pred.token)}>
            <span class="prob-tok">{pred.token}</span>
            <div class="prob-bar"><div class="prob-fill" style="width:0%"></div></div>
            <span class="prob-pct">{pred.percentage}</span>
          </button>
        {/each}
      </div>
    </div>
  </div>
</div>

<!-- Article -->
<div class="article-area">
  <button class="article-btn" on:click={() => showArticle = !showArticle}>
    {#if showArticle}إخفاء{:else}📖 كيف يعمل المحوّل؟{/if}
  </button>
</div>
{#if showArticle}
  <section class="article" dir="rtl">
    <h2>{ARABIC_LABELS.articleTitle}</h2>
    <p>المحوّل (Transformer) هو البنية الأساسية وراء الذكاء الاصطناعي الحديث. تم تقديمه عام 2017. هنا نستخدم <strong>{$modelConfig.name}</strong> — {$modelConfig.numLayers} طبقة، {$modelConfig.numHeads} رأس انتباه.</p>
    <h3>التضمين</h3><p>يحوّل الكلمات إلى متجهات من {$modelConfig.hiddenSize} بُعد.</p>
    <h3>QKV</h3><p>لكل كلمة: <strong style="color:#3b82f6">Q</strong> + <strong style="color:#ef4444">K</strong> + <strong style="color:#22c55e">V</strong></p>
    <h3>الانتباه</h3><p>Q·K^T → softmax → أوزان انتباه. الدائرة الأكبر = انتباه أقوى.</p>
    <h3>MLP</h3><p>{$modelConfig.hiddenSize} → {$modelConfig.mlpDimension} → {$modelConfig.hiddenSize} مع GeLU</p>
    <h3>المخرجات</h3><p>Linear + Softmax = احتمالات الكلمة التالية.</p>
  </section>
{/if}
<footer class="footer"><a href="https://2pidata.com" target="_blank" rel="noopener">2pidata</a> · {new Date().getFullYear()}</footer>

<style>
  :global(body) { margin: 0; font-family: system-ui, -apple-system, sans-serif; }

  /* ═══ HEADER ═══ */
  .top-bar { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-bottom: 1px solid #e5e7eb; padding: 0.4rem 1rem; opacity: 0; transition: opacity 0.3s; }
  .top-bar.active { opacity: 1; }
  .bar-inner { max-width: 1800px; margin: 0 auto; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
  .logo { display: flex; flex-direction: column; flex-shrink: 0; }
  .logo-ar { font-size: 1.2rem; font-weight: 800; background: linear-gradient(135deg,#3b82f6,#8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1.2; }
  .logo-sub { font-size: 0.55rem; color: #9ca3af; letter-spacing: 0.12em; text-transform: uppercase; }
  .input-area { flex: 1; max-width: 520px; position: relative; }
  .input-row { display: flex; border: 1.5px solid #d1d5db; border-radius: 6px; overflow: hidden; background: white; }
  .input-row:focus-within { border-color: #8b5cf6; }
  .ex-btn { padding: 0.4rem 0.6rem; font-size: 0.75rem; background: #f9fafb; border: none; border-right: 1px solid #e5e7eb; cursor: pointer; color: #4b5563; white-space: nowrap; }
  .inp-wrap { flex: 1; display: flex; align-items: center; position: relative; }
  .inp { width: 100%; padding: 0.4rem 0.6rem; border: none; outline: none; font-size: 0.85rem; background: transparent; direction: rtl; resize: none; line-height: 1.4; }
  .ghost { position: absolute; right: 0.4rem; font-size: 0.75rem; color: #8b5cf6; opacity: 0.35; cursor: pointer; }
  .ghost:hover { opacity: 1; }
  .gen-btn { padding: 0.45rem 0.8rem; font-size: 0.8rem; font-weight: 600; background: linear-gradient(135deg,#3b82f6,#6366f1); color: white; border: none; cursor: pointer; white-space: nowrap; }
  .gen-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .spin { width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: sp 0.6s linear infinite; display: inline-block; }
  @keyframes sp { to { transform: rotate(360deg); } }
  .ex-panel { position: absolute; top: 100%; right: 0; left: 0; background: white; border: 1px solid #e5e7eb; border-radius: 0 0 6px 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); z-index: 50; }
  .ex-item { display: block; width: 100%; padding: 0.4rem 0.6rem; text-align: right; font-size: 0.78rem; border: none; background: transparent; cursor: pointer; direction: rtl; }
  .ex-item:hover { background: #f3f4f6; }
  .ctrls { display: flex; align-items: center; gap: 1rem; flex-shrink: 0; }
  .ctrl-grp { display: flex; flex-direction: column; }
  .ctrl-lbl { font-size: 0.6rem; color: #6b7280; }
  .ctrl-row { display: flex; align-items: center; gap: 0.3rem; }
  .ctrl-val { font-size: 0.7rem; color: #374151; font-weight: 500; }
  .slider { width: 70px; }
  .rad { font-size: 0.65rem; color: #4b5563; display: flex; align-items: center; gap: 0.15rem; cursor: pointer; }
  .rad input { margin: 0; }
  .hdr-links { display: flex; align-items: center; gap: 0.4rem; }
  .badge { display: flex; align-items: center; gap: 0.25rem; padding: 0.15rem 0.4rem; background: #f3f4f6; border-radius: 999px; font-size: 0.65rem; color: #4b5563; }
  .dot { width: 5px; height: 5px; border-radius: 50%; background: #fbbf24; }
  .dot.on { background: #22c55e; }
  .hdr-links a { color: #6b7280; }

  /* ═══ MAIN VIZ ═══ */
  .main-viz { position: relative; min-height: calc(100vh - 60px); padding: 1rem 1rem 3rem; background: white; opacity: 0; transition: opacity 0.3s; overflow: hidden; }
  .main-viz.active { opacity: 1; }
  .sankey-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; z-index: 12; }
  .sk-path { transition: opacity 0.3s; }

  /* 4-column LTR grid matching original structure */
  .viz-grid {
    position: relative;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: 100px 1fr 80px 180px;
    direction: ltr;
    overflow: hidden;
  }

  .step { height: 100%; display: grid; grid-template-rows: var(--th) 1fr; overflow: hidden; }
  .step-title { display: flex; flex-direction: column; justify-content: flex-end; padding-bottom: 2rem; color: #9ca3af; white-space: nowrap; cursor: default; z-index: 13; }
  .step-title:hover { color: #6b7280; }
  .t-main { font-size: 0.85rem; color: #9ca3af; }
  .t-sub { font-size: 0.55rem; color: #d1d5db; direction: rtl; }
  .step-body { grid-row: 2; height: fit-content; overflow: hidden; }

  /* Shared column/cell/vec */
  .column { display: flex; flex-direction: column; gap: 0.5rem; position: relative; }
  .cell { height: var(--vh); display: flex; gap: 0.5rem; align-items: center; position: relative; }
  .vec { position: relative; z-index: 13; width: 12px; height: var(--vh); flex-shrink: 0; border-radius: 2px; }
  .vec.wide { width: 24px; }
  .label { font-size: 0.7rem; color: #374151; z-index: 13; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: right; line-height: var(--vh); height: var(--vh); flex-shrink: 0; direction: rtl; }

  /* ═══ EMBEDDING ═══ */
  .emb-step { overflow: hidden; }

  /* ═══ BLOCKS (main transformer block column) ═══ */
  .blocks-step { position: relative; }
  .block-title { align-items: flex-start; padding-left: 0.5rem; }
  .block-hdr { display: flex; align-items: center; gap: 0.3rem; font-size: 0.85rem; color: #9ca3af; }
  .block-sub { font-size: 0.55rem; color: #d1d5db; }
  .block-sub.dim { font-size: 0.5rem; color: #e5e7eb; }
  .nav-btns { display: flex; gap: 2px; }
  .nb { width: 18px; height: 18px; border-radius: 3px; border: 1px solid #e5e7eb; background: #f9fafb; font-size: 0.7rem; cursor: pointer; color: #4b5563; display: flex; align-items: center; justify-content: center; }
  .nb:disabled { opacity: 0.25; cursor: not-allowed; }
  .nb.xs { width: 14px; height: 14px; font-size: 0.6rem; }

  /* Inner 3-column grid: QKV | Attention | MLP */
  .inner-grid {
    display: grid;
    grid-template-columns: 0.5fr 2fr 1fr;
    height: 100%;
    width: 100%;
  }

  .inner-col { display: flex; flex-direction: column; }

  /* QKV */
  .qkv-col { gap: 0.5rem; padding: 0 0.3rem; }
  .qkv-group { display: flex; flex-direction: column; gap: 1px; height: calc(var(--vh) * 3); }
  .qkv-chip { flex: 1; border-radius: 2px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; min-width: 28px; }
  .q-chip { background: #bfdbfe; }
  .k-chip { background: #fecaca; }
  .v-chip { background: #bbf7d0; }
  .ql { font-size: 0.55rem; font-weight: 700; font-family: monospace; }
  .qkv-chip.hi { box-shadow: 0 0 0 2px rgba(139,92,246,0.5); z-index: 15; transform: scale(1.1); }
  .qkv-chip.fade { opacity: 0.2; }

  /* Attention */
  .attn-col { display: flex; flex-direction: row; gap: 0.3rem; position: relative; }
  .attn-section { flex: 1; display: flex; flex-direction: column; position: relative; }
  .attn-head-nav { font-size: 0.6rem; color: #9ca3af; display: flex; align-items: center; gap: 0.3rem; margin-bottom: 0.3rem; }
  .attn-labels-area { position: relative; }
  .side-lbl { font-size: 0.6rem; font-weight: 600; position: absolute; z-index: 15; }
  .key-lbl { color: #ef4444; top: -1rem; left: 50%; transform: translateX(-50%); }
  .query-lbl { color: #3b82f6; bottom: 1.5rem; left: -0.5rem; }
  .value-lbl { color: #22c55e; bottom: -0.5rem; left: 50%; transform: translateX(-50%); }
  .attn-matrix { position: relative; }
  .attn-grid { display: flex; flex-direction: column; gap: 0; font-size: 0.5rem; }
  .attn-hdr-row { display: flex; gap: 0; }
  .attn-corner { width: 38px; flex-shrink: 0; }
  .attn-col-lbl { flex: 1; min-width: 22px; max-width: 32px; text-align: center; color: #9ca3af; transition: all 0.1s; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 1px 0; direction: rtl; }
  .col-hi { color: #1d4ed8; font-weight: 700; }
  .attn-data-row { display: flex; gap: 0; align-items: center; }
  .attn-row-lbl { width: 38px; flex-shrink: 0; text-align: right; padding-right: 2px; color: #9ca3af; transition: all 0.1s; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; direction: rtl; }
  .row-hi { color: #dc2626; font-weight: 700; }
  .attn-cell { flex: 1; min-width: 22px; max-width: 32px; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; }
  .attn-cell.masked { opacity: 0; }
  .circle-svg { width: 100%; height: 100%; }
  .matrix-circle { transition: all 0.12s; }
  .attn-cell:hover .matrix-circle { stroke: #8b5cf6; stroke-width: 1.5; filter: drop-shadow(0 0 3px rgba(139,92,246,0.4)); }
  .attn-bottom-label { font-size: 0.6rem; color: #9ca3af; text-align: center; margin-top: 0.3rem; }
  .attn-out-col { display: flex; flex-direction: column; gap: 0.5rem; align-items: center; padding-top: 0.5rem; }
  .out-lbl { font-size: 0.55rem; color: #9ca3af; }

  /* MLP */
  .mlp-col { position: relative; }
  .mlp-title { font-size: 0.85rem; color: #9ca3af; text-align: center; margin-bottom: 0.5rem; }
  .mlp-layers { display: grid; grid-template-columns: 1fr 1.5fr 1fr; gap: 0.3rem; }
  .mlp-layer { display: flex; flex-direction: column; gap: 0.5rem; }
  .mlp-label { font-size: 0.6rem; color: #9ca3af; max-width: 50px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; direction: rtl; }
  .mlp-label.right { order: 1; }

  /* ═══ SUBSEQUENT BLOCKS ═══ */
  .subblocks-step { overflow: hidden; }
  .blocks-note { font-size: 0.6rem; color: #9ca3af; line-height: 1.2; text-align: center; }
  .blocks-note strong { color: #6b7280; }
  .arrow-down { width: 8px; color: #d1d5db; margin: 0.2rem auto; display: block; }
  .blocks-column { align-items: center; }

  /* ═══ PROBABILITIES ═══ */
  .prob-step { overflow: hidden; }
  .prob-row { display: flex; align-items: center; gap: 0.3rem; padding: 0.15rem 0.3rem; border-radius: 4px; border: 1px solid transparent; background: transparent; cursor: pointer; transition: all 0.15s; width: 100%; text-align: left; }
  .prob-row:hover { border-color: #c4b5fd; background: rgba(139,92,246,0.03); }
  .prob-row.top { font-weight: 700; }
  .prob-row.top .prob-tok { color: #7c3aed; }
  .prob-tok { font-size: 0.78rem; color: #374151; min-width: 40px; flex-shrink: 0; direction: rtl; }
  .prob-bar { flex: 1; height: 5px; background: #f3f4f6; border-radius: 3px; overflow: hidden; }
  .prob-fill { height: 100%; background: linear-gradient(to right, #8b5cf6, #6366f1); border-radius: 3px; transition: width 0.5s ease; }
  .prob-pct { font-size: 0.6rem; color: #6b7280; min-width: 35px; text-align: right; }
  .empty-msg { color: #d1d5db; font-size: 0.7rem; text-align: center; padding: 1rem; }

  /* ═══ ARTICLE / FOOTER ═══ */
  .article-area { text-align: center; padding: 0.8rem; background: #fafafa; }
  .article-btn { padding: 0.4rem 1.2rem; border-radius: 999px; border: 1px solid #d1d5db; background: white; font-size: 0.78rem; cursor: pointer; color: #4b5563; direction: rtl; }
  .article-btn:hover { border-color: #8b5cf6; color: #8b5cf6; }
  .article { max-width: 700px; margin: 0 auto; padding: 1.5rem; line-height: 1.8; color: #374151; }
  .article h2 { font-size: 1.3rem; font-weight: 800; text-align: center; margin-bottom: 1rem; }
  .article h3 { font-size: 0.95rem; font-weight: 700; margin: 0.8rem 0 0.2rem; }
  .article p { font-size: 0.85rem; margin-bottom: 0.4rem; }
  .footer { text-align: center; padding: 0.6rem; border-top: 1px solid #e5e7eb; font-size: 0.6rem; color: #9ca3af; background: #fafafa; }
  .footer a { color: #8b5cf6; text-decoration: none; }

  @media (max-width: 1024px) {
    .viz-grid { grid-template-columns: 1fr; }
  }
</style>
