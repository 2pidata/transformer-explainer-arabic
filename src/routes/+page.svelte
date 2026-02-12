<script lang="ts">
  import { onMount, tick, onDestroy } from 'svelte';
  import { gsap } from 'gsap';
  import {
    inputText,
    tokens,
    temperature,
    topK,
    topP,
    samplingMethod,
    modelData,
    appState,
    currentLayer,
    currentHead,
    hoveredToken,
    isReady,
    isBusy,
    statusMessage,
    activePredictions,
    currentAttentionMatrix,
    layerInfo,
    headInfo,
    modelConfig,
    setInputText,
    appendToken,
    loadExample,
    setTemperature,
    setTopK,
    setSamplingMethod,
    updateModelData,
    previousLayer,
    nextLayer,
    previousHead,
    nextHead,
    setHoveredToken,
    loadDemoData,
    setLoadingProgress,
    setModelLoaded,
    setTokenizerLoaded,
    setInferenceRunning,
    setError,
    setTokens
  } from '$lib/store';
  import { ARABIC_EXAMPLES, ARABIC_LABELS } from '$lib/utils/constants';
  import { initialize, analyzeText, generateDemoData, isReady as checkReady } from '$lib/utils/data';

  // ═══════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════

  let inputElement: HTMLTextAreaElement;
  let debounceTimer: ReturnType<typeof setTimeout>;
  let useDemo = true;
  let showExamples = false;
  let showArticle = false;
  let isAnimating = false;
  let hoveredMatrixCell: { row: number | null; col: number | null } = { row: null, col: null };
  let currentTimeline: gsap.core.Timeline | null = null;
  let residualAnimation: gsap.core.Tween | null = null;

  // DOM refs
  let mainContainer: HTMLDivElement;
  let sankeyBackSvg: SVGSVGElement;
  let sankeyTopSvg: SVGSVGElement;

  // Sankey path data (dynamically computed)
  let pathsReady = false;

  onDestroy(() => {
    currentTimeline?.kill();
    residualAnimation?.kill();
    if (resizeObserver) resizeObserver.disconnect();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // GRADIENT DEFINITIONS for Sankey paths
  // Mirroring original's gradient.ts with Tailwind 200-brightness colors
  // ═══════════════════════════════════════════════════════════════════════

  // Colors from Tailwind palette at 200 brightness
  const colors = {
    gray200: '#e5e7eb',
    blue200: '#bfdbfe',
    blue300: '#93c5fd',
    red200: '#fecaca',
    red300: '#fca5a5',
    green200: '#bbf7d0',
    green300: '#86efac',
    purple200: '#ddd6fe',
    purple300: '#c4b5fd',
    purple400: '#a78bfa',
    indigo200: '#c7d2fe',
    white: '#ffffff',
  };

  // Gradient definitions matching the original
  const gradientDefs: Record<string, Record<string, string | { color: string; opacity: number }>> = {
    'gray-blue': { '0': colors.gray200, '100': colors.blue200 },
    'transparent-blue': { '0': colors.blue200 + '80', '100': colors.blue200 },
    'blue-blue': { '0': colors.blue300, '100': colors.blue300 },
    'red-red': { '0': colors.red300, '100': colors.red300 },
    'green-green': { '0': colors.green300, '100': colors.green300 },
    'blue-blue2': { '0': colors.blue200, '100': colors.blue200 },
    'red-red2': { '0': colors.red200, '100': colors.red200 },
    'green-green2': { '0': colors.green200, '100': colors.green200 },
    'purple-purple': { '0': colors.purple300, '100': colors.purple300 },
    'purple-indigo': { '0': colors.purple200, '100': colors.indigo200 },
    'indigo-blue': { '0': colors.indigo200, '100': colors.blue200 },
    'transparent-purple': { '0': colors.purple200 + '00', '100': colors.purple200 },
    'transparent-purple2': { '0': colors.purple400 + '00', '100': colors.purple200 },
    'green-purple': { '0': colors.green200, '100': colors.purple200 },
    'blue-gray': { '0': colors.blue200, '50': colors.gray200 },
    'blue-white-blue': { '0': colors.blue200, '40': colors.white, '60': colors.white, '100': colors.blue200 },
    'gray-white-blue': { '0': colors.gray200, '50': colors.white, '60': colors.white, '100': colors.blue200 + 'b3' },
    'blue': { '0': colors.blue200, '100': colors.blue200 },
  };

  // ═══════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════

  let resizeObserver: ResizeObserver | null = null;

  onMount(async () => {
    if (useDemo) {
      loadDemoData();
      await runAnalysis($inputText);
      await tick();

      // Wait for DOM to settle, then draw Sankey paths and animate
      setTimeout(async () => {
        drawAllPaths();
        pathsReady = true;
        await tick();
        setTimeout(() => playFlowAnimation(), 200);
      }, 300);
    } else {
      try {
        await initialize((progress, message) => {
          setLoadingProgress(progress, message);
        });
        setModelLoaded(true);
        setTokenizerLoaded(true);
        await runAnalysis($inputText);
        await tick();
        setTimeout(async () => {
          drawAllPaths();
          pathsReady = true;
          await tick();
          setTimeout(() => playFlowAnimation(), 200);
        }, 300);
      } catch (error) {
        console.error('Erreur initialisation:', error);
        setError(error instanceof Error ? error.message : 'خطأ غير معروف');
        loadDemoData();
      }
    }

    // Observe container resize to redraw paths
    if (mainContainer) {
      resizeObserver = new ResizeObserver(() => {
        drawAllPaths();
      });
      resizeObserver.observe(mainContainer);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // SANKEY PATH DRAWING (D3-style using getBoundingClientRect)
  // ═══════════════════════════════════════════════════════════════════════

  interface PathDef {
    sourceSelector: string;
    targetSelector: string;
    gradientClass: string;
    opacity: number;
    layer: 'back' | 'top';
    bandWidth?: number;
    className?: string;
  }

  // Path definitions connecting stages
  const pathDefinitions: PathDef[] = [
    // Embedding → QKV (main flow)
    { sourceSelector: '.embed-col', targetSelector: '.qkv-col', gradientClass: 'gray-blue', opacity: 0.8, layer: 'back', className: 'embed-to-qkv' },
    // QKV → Attention (Q flow - blue)
    { sourceSelector: '.q-vectors', targetSelector: '.attention-box', gradientClass: 'blue-blue', opacity: 0.5, layer: 'back', className: 'q-to-attn' },
    // QKV → Attention (K flow - red)
    { sourceSelector: '.k-vectors', targetSelector: '.attention-box', gradientClass: 'red-red', opacity: 0.5, layer: 'back', className: 'k-to-attn' },
    // QKV → Attention (V flow - green)
    { sourceSelector: '.v-vectors', targetSelector: '.attention-box', gradientClass: 'green-green', opacity: 0.5, layer: 'back', className: 'v-to-attn' },
    // Attention → MLP (purple)
    { sourceSelector: '.attention-out', targetSelector: '.mlp-in', gradientClass: 'purple-indigo', opacity: 0.5, layer: 'back', className: 'attn-to-mlp' },
    // MLP internal (indigo-blue)
    { sourceSelector: '.mlp-mid', targetSelector: '.mlp-out', gradientClass: 'indigo-blue', opacity: 0.4, layer: 'back', className: 'mlp-internal' },
    // MLP → Blocks
    { sourceSelector: '.mlp-out', targetSelector: '.blocks-col', gradientClass: 'blue-white-blue', opacity: 0.8, layer: 'back', className: 'mlp-to-blocks' },
    // Blocks → Output
    { sourceSelector: '.blocks-col', targetSelector: '.output-col', gradientClass: 'blue-gray', opacity: 0.5, layer: 'back', className: 'blocks-to-output' },
  ];

  function getRect(selector: string): DOMRect | null {
    const el = mainContainer?.querySelector(selector);
    return el ? el.getBoundingClientRect() : null;
  }

  function getContainerRect(): DOMRect | null {
    return mainContainer?.getBoundingClientRect() || null;
  }

  function generateBezierPath(
    sx: number, sy: number, sh: number,
    tx: number, ty: number, th: number,
    curveFactor: number = 40
  ): string {
    // RTL: source is on right, target on left
    const topY = Math.min(sy, ty);
    const botSY = sy + sh;
    const botTY = ty + th;
    const botY = Math.max(botSY, botTY);

    return `M ${sx},${sy} C ${sx - curveFactor},${sy} ${tx + curveFactor},${ty} ${tx},${ty} L ${tx},${ty + th} C ${tx + curveFactor},${ty + th} ${sx - curveFactor},${sy + sh} ${sx},${sy + sh} Z`;
  }

  let sankeyPaths: { d: string; gradClass: string; opacity: number; layer: string; className: string }[] = [];
  let residualPaths: { d: string }[] = [];

  function drawAllPaths() {
    if (!mainContainer) return;
    const containerRect = getContainerRect();
    if (!containerRect) return;

    const newPaths: typeof sankeyPaths = [];
    const newResidual: typeof residualPaths = [];

    const offsetX = containerRect.left;
    const offsetY = containerRect.top;
    const screenWidth = containerRect.width;
    const curveFactor = Math.max(30, Math.floor(screenWidth / 25));

    for (const def of pathDefinitions) {
      const sourceEls = mainContainer.querySelectorAll(def.sourceSelector);
      const targetEls = mainContainer.querySelectorAll(def.targetSelector);

      if (sourceEls.length === 0 || targetEls.length === 0) continue;

      const sourceRect = sourceEls[0].getBoundingClientRect();
      const targetRect = targetEls[0].getBoundingClientRect();

      // In RTL: source right edge → target left edge
      const sx = sourceRect.left - offsetX;
      const sy = sourceRect.top - offsetY;
      const sh = sourceRect.height;
      const tx = targetRect.right - offsetX;
      const ty = targetRect.top - offsetY;
      const th = targetRect.height;

      const d = generateBezierPath(sx, sy, sh, tx, ty, th, curveFactor);

      newPaths.push({
        d,
        gradClass: def.gradientClass,
        opacity: def.opacity,
        layer: def.layer,
        className: def.className || ''
      });
    }

    // Residual connection paths (dashed)
    const embedCol = mainContainer.querySelector('.embed-col');
    const mlpOut = mainContainer.querySelector('.mlp-out');
    if (embedCol && mlpOut) {
      const eRect = embedCol.getBoundingClientRect();
      const mRect = mlpOut.getBoundingClientRect();
      const residualY = Math.min(eRect.top, mRect.top) - offsetY - 15;
      newResidual.push({
        d: `M ${eRect.left - offsetX},${residualY} L ${mRect.right - offsetX},${residualY}`
      });
    }

    sankeyPaths = newPaths;
    residualPaths = newResidual;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FLOW ANIMATION — Faithful to original's animation.ts
  // ═══════════════════════════════════════════════════════════════════════

  function getGradientStops(className: string, stopIdx: number = 1): SVGStopElement[] {
    return Array.from(document.querySelectorAll(`.grad-${className}`)).map(
      (el) => el?.querySelectorAll('stop')[stopIdx]
    ).filter(Boolean) as SVGStopElement[];
  }

  function generateGradientAnimation(
    tl: gsap.core.Timeline,
    gradStop: SVGStopElement | SVGStopElement[] | undefined,
    options: any = {}
  ) {
    if (!gradStop || (Array.isArray(gradStop) && gradStop.length === 0)) return;

    const {
      color = 'rgba(255,255,255,0)',
      duration = 0.1,
      ease = 'power1.in',
      offset = { from: '0%', to: '100%' },
      position = '+=0',
      ...restOptions
    } = options;

    const { from = '0%', to = '100%' } = offset;

    const initialColor = Array.isArray(gradStop)
      ? gradStop.map((d) => d?.getAttribute('stop-color'))
      : gradStop?.getAttribute('stop-color');

    tl.fromTo(
      gradStop,
      { attr: { offset: from, 'stop-color': color } },
      {
        attr: { offset: to, 'stop-color': color },
        duration,
        ease,
        ...restOptions
      },
      position
    ).to(
      gradStop,
      {
        attr: {
          offset: to,
          'stop-color': (i: number) => (Array.isArray(gradStop) ? (initialColor as string[])[i] : initialColor)
        },
        duration,
        ease,
        ...restOptions
      },
      '-=50%'
    );
  }

  async function playFlowAnimation() {
    if (isAnimating || !mainContainer) return;
    isAnimating = true;

    currentTimeline?.kill();
    residualAnimation?.kill();

    const tokenLength = $tokens.length;
    const isNextTokenOnly = true;
    const duration = 0.02;

    return new Promise<void>((resolve) => {
      const tl = gsap.timeline({
        onComplete: () => {
          isAnimating = false;
          startResidualAnimation();
          resolve();
        }
      });
      currentTimeline = tl;

      // ── Step 1: Embedding tokens appear ──
      const tokenEls = mainContainer.querySelectorAll('.token-cell');
      const embedBars = mainContainer.querySelectorAll('.embed-bar');
      const posBars = mainContainer.querySelectorAll('.pos-bar');

      tl.fromTo(
        [tokenEls, embedBars, posBars],
        { opacity: 0 },
        { opacity: 1, duration: 0.2, stagger: 0.02 }
      );

      // ── Step 2: Gradient pulse: Embedding → QKV ──
      const embedToQkvStops = getGradientStops('gray-blue');
      generateGradientAnimation(tl, embedToQkvStops, {
        duration: duration * 10
      });

      // ── Step 3: QKV vectors appear ──
      const qkvCells = mainContainer.querySelectorAll('.qkv-cell');
      tl.fromTo(qkvCells, { opacity: 0 }, { opacity: 1, duration: 0.15, stagger: 0.01 });

      // ── Step 4: Q/K/V gradient pulses to attention ──
      const qStops = getGradientStops('blue-blue');
      const kStops = getGradientStops('red-red');
      const vStops = getGradientStops('green-green');

      generateGradientAnimation(tl, [...qStops, ...kStops, ...vStops], {
        duration: duration * 10
      });

      // ── Step 5: Attention matrix circles scale in ──
      const matrixCircles = mainContainer.querySelectorAll('.matrix-circle');
      if (matrixCircles.length > 0) {
        const QKDuration = 0.7;
        tl.fromTo(
          matrixCircles,
          {
            scale: 0,
            transformOrigin: '50% 50%',
            opacity: 0
          },
          {
            scale: 1,
            opacity: 1,
            transformOrigin: '50% 50%',
            delay: QKDuration / Math.max(tokenLength, 1),
            stagger: Number((QKDuration / Math.max(Math.pow(tokenLength, 2), 1)).toFixed(2)),
            ease: 'power2.out',
            duration: QKDuration
          }
        );
      }

      // ── Step 6: Gradient pulse: Attention → MLP ──
      const attnToMlpStops = getGradientStops('purple-indigo');
      generateGradientAnimation(tl, attnToMlpStops, {
        duration: duration * 10
      });

      // ── Step 7: MLP layers appear ──
      const mlpCells = mainContainer.querySelectorAll('.mlp-cell');
      tl.fromTo(mlpCells, { opacity: 0 }, { opacity: 1, duration: 0.15, stagger: 0.01 });

      // ── Step 8: MLP internal gradient ──
      const mlpInternalStops = getGradientStops('indigo-blue');
      generateGradientAnimation(tl, mlpInternalStops, {
        duration: duration * 10
      });

      // ── Step 9: MLP output appears ──
      const mlpOutputCells = mainContainer.querySelectorAll('.mlp-output-cell');
      tl.fromTo(mlpOutputCells, { opacity: 0 }, { opacity: 1, duration: 0.1 });

      // ── Step 10: Gradient pulse: MLP → Blocks ──
      const mlpToBlocksStops = getGradientStops('blue-white-blue');
      if (mlpToBlocksStops.length > 0) {
        const blockTl = gsap.timeline();
        generateGradientAnimation(blockTl, mlpToBlocksStops.filter((_, i) => i % 2 === 0), {
          duration: duration * 5,
          offset: { to: '50%' },
          ease: 'sine.inOut'
        });
        generateGradientAnimation(blockTl, mlpToBlocksStops.filter((_, i) => i % 2 === 1), {
          duration: duration * 5,
          offset: { from: '50%' },
          ease: 'sine.inOut'
        });
        tl.add(blockTl);
      }

      // ── Step 11: Block cells appear ──
      const blockCells = mainContainer.querySelectorAll('.block-cell');
      tl.fromTo(blockCells, { opacity: 0 }, { opacity: 1, duration: 0.1 });

      // ── Step 12: Gradient pulse: Blocks → Output ──
      const blocksToOutStops = getGradientStops('blue-gray');
      generateGradientAnimation(tl, blocksToOutStops, {
        offset: { to: '50%' }
      });

      // ── Step 13: Probabilities appear ──
      const probItems = mainContainer.querySelectorAll('.prob-item');
      tl.fromTo(probItems, { opacity: 0 }, { opacity: 1, duration: 0.15, stagger: 0.03 });

      // ── Step 14: Probability bars animate ──
      const probBars = mainContainer.querySelectorAll('.prob-bar-fill');
      probBars.forEach((bar, i) => {
        const pred = $activePredictions[i];
        if (pred) {
          tl.to(bar, {
            width: `${pred.probability * 100}%`,
            duration: 0.4,
            ease: 'power2.out'
          }, `-=0.3`);
        }
      });
    });
  }

  function startResidualAnimation() {
    const residualEls = mainContainer?.querySelectorAll('.residual-line');
    if (!residualEls || residualEls.length === 0) return;
    residualAnimation?.kill();
    residualAnimation = gsap.to(residualEls, {
      strokeDashoffset: -50,
      duration: 1,
      repeat: -1,
      ease: 'none'
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════

  async function runAnalysis(text: string) {
    if (!text.trim()) return;
    setInferenceRunning(true);
    try {
      let result;
      if (useDemo || !checkReady()) {
        result = generateDemoData(text);
      } else {
        result = await analyzeText(text, {
          temperature: $temperature,
          topK: $topK,
          topP: $topP,
          samplingMethod: $samplingMethod
        });
      }
      setTokens(result.inputTokens);
      updateModelData({
        attentions: result.attentions,
        predictions: result.predictions,
        logits: result.logits
      });
    } catch (error) {
      console.error('Erreur analyse:', error);
      setError(error instanceof Error ? error.message : 'خطأ في التحليل');
    } finally {
      setInferenceRunning(false);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  function handleInputChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    setInputText(target.value);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      runAnalysis(target.value);
    }, 500);
  }

  async function handleGenerate() {
    if (isAnimating) {
      currentTimeline?.kill();
      residualAnimation?.kill();
      isAnimating = false;
    }
    await runAnalysis($inputText);
    await tick();
    drawAllPaths();
    setTimeout(() => playFlowAnimation(), 100);
  }

  function handleExampleClick(exampleId: number) {
    const example = ARABIC_EXAMPLES.find(e => e.id === exampleId);
    if (example) {
      setInputText(example.text);
      showExamples = false;
      handleGenerate();
    }
  }

  async function handlePredictionClick(token: string) {
    const newText = $inputText + token;
    setInputText(newText);
    await runAnalysis(newText);
    await tick();
    drawAllPaths();
    setTimeout(() => playFlowAnimation(), 100);
  }

  function handleTemperatureChange(event: Event) {
    const target = event.target as HTMLInputElement;
    setTemperature(parseFloat(target.value));
    runAnalysis($inputText);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════

  function getPurpleColor(value: number): string {
    if (value === 0) return 'transparent';
    const alpha = Math.min(1, value);
    return `rgba(139, 92, 246, ${alpha})`;
  }

  function formatToken(text: string): string {
    return text.replace(/Ġ/g, ' ').replace(/▁/g, ' ') || '␣';
  }

  function getEmbedColor(index: number, total: number): string {
    const hue = 220 + (index / Math.max(1, total - 1)) * 80;
    return `hsl(${hue}, 70%, 85%)`;
  }

  function handleMatrixCellEnter(row: number, col: number) {
    hoveredMatrixCell = { row, col };
  }
  function handleMatrixCellLeave() {
    hoveredMatrixCell = { row: null, col: null };
  }
</script>

<!-- ═══════════════════════════════════════════════════════════════════════
     SVG GRADIENT DEFINITIONS
     Creates gradients matching the original's gradient.ts
     Each gradient gets a "-last" variant for animation targeting
     ═══════════════════════════════════════════════════════════════════════ -->
<svg class="svg-defs" width="0" height="0">
  <defs>
    <!-- Gray → Blue (Embedding to QKV) -->
    <linearGradient id="grad-gray-blue" class="grad-gray-blue" x1="100%" y1="0" x2="0%" y2="0">
      <stop offset="0%" stop-color={colors.gray200}/>
      <stop offset="100%" stop-color={colors.blue200}/>
    </linearGradient>
    <!-- Blue → Blue (Q path) -->
    <linearGradient id="grad-blue-blue" class="grad-blue-blue" x1="100%" y1="0" x2="0%" y2="0">
      <stop offset="0%" stop-color={colors.blue300}/>
      <stop offset="100%" stop-color={colors.blue300}/>
    </linearGradient>
    <!-- Red → Red (K path) -->
    <linearGradient id="grad-red-red" class="grad-red-red" x1="100%" y1="0" x2="0%" y2="0">
      <stop offset="0%" stop-color={colors.red300}/>
      <stop offset="100%" stop-color={colors.red300}/>
    </linearGradient>
    <!-- Green → Green (V path) -->
    <linearGradient id="grad-green-green" class="grad-green-green" x1="100%" y1="0" x2="0%" y2="0">
      <stop offset="0%" stop-color={colors.green300}/>
      <stop offset="100%" stop-color={colors.green300}/>
    </linearGradient>
    <!-- Purple → Indigo (Attn to MLP) -->
    <linearGradient id="grad-purple-indigo" class="grad-purple-indigo" x1="100%" y1="0" x2="0%" y2="0">
      <stop offset="0%" stop-color={colors.purple200}/>
      <stop offset="100%" stop-color={colors.indigo200}/>
    </linearGradient>
    <!-- Indigo → Blue (MLP internal) -->
    <linearGradient id="grad-indigo-blue" class="grad-indigo-blue" x1="100%" y1="0" x2="0%" y2="0">
      <stop offset="0%" stop-color={colors.indigo200}/>
      <stop offset="100%" stop-color={colors.blue200}/>
    </linearGradient>
    <!-- Blue → White → Blue (blocks) -->
    <linearGradient id="grad-blue-white-blue" class="grad-blue-white-blue" x1="100%" y1="0" x2="0%" y2="0">
      <stop offset="0%" stop-color={colors.blue200}/>
      <stop offset="40%" stop-color={colors.white}/>
      <stop offset="60%" stop-color={colors.white}/>
      <stop offset="100%" stop-color={colors.blue200}/>
    </linearGradient>
    <!-- Blue → Gray (blocks to output) -->
    <linearGradient id="grad-blue-gray" class="grad-blue-gray" x1="100%" y1="0" x2="0%" y2="0">
      <stop offset="0%" stop-color={colors.blue200}/>
      <stop offset="50%" stop-color={colors.gray200}/>
    </linearGradient>
    <!-- Residual dashed -->
    <linearGradient id="grad-residual" x1="100%" y1="0" x2="0%" y2="0">
      <stop offset="0%" stop-color={colors.blue200} stop-opacity="0.3"/>
      <stop offset="50%" stop-color={colors.purple300} stop-opacity="0.6"/>
      <stop offset="100%" stop-color={colors.blue200} stop-opacity="0.3"/>
    </linearGradient>
  </defs>
</svg>

<!-- ═══════════════════════════════════════════════════════════════════════
     TOP BAR (matching original's header style)
     ═══════════════════════════════════════════════════════════════════════ -->
<div class="top-bar">
  <div class="top-bar-inner">
    <!-- Logo -->
    <div class="logo-area">
      <span class="logo-main">شارح المحوّل</span>
      <span class="logo-en">Transformer Explainer</span>
    </div>

    <!-- Input Area -->
    <div class="input-area">
      <div class="input-group">
        <button class="examples-btn" on:click={() => showExamples = !showExamples}>
          أمثلة ▾
        </button>
        <div class="input-wrapper">
          <textarea
            bind:this={inputElement}
            value={$inputText}
            on:input={handleInputChange}
            class="text-input"
            placeholder={ARABIC_LABELS.inputPlaceholder}
            dir="rtl"
            rows="1"
          ></textarea>
          {#if $activePredictions.length > 0 && !isAnimating}
            <span class="ghost-token" on:click={() => handlePredictionClick($activePredictions[0].token)}>
              {$activePredictions[0].token}
            </span>
          {/if}
        </div>
        <button
          class="gen-btn"
          on:click={handleGenerate}
          disabled={isAnimating || !$inputText.trim()}
        >
          {#if isAnimating}
            <span class="spinner"></span>
          {:else}
            توليد
          {/if}
        </button>
      </div>
      {#if showExamples}
        <div class="examples-panel">
          {#each ARABIC_EXAMPLES.slice(0, 6) as example}
            <button class="example-item" on:click={() => handleExampleClick(example.id)}>
              {example.text}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Controls -->
    <div class="controls-area">
      <div class="temp-controls">
        <label class="ctrl-label">درجة الحرارة</label>
        <div class="temp-row">
          <input type="range" class="temp-slider" min="0.1" max="2.0" step="0.1" value={$temperature} on:input={handleTemperatureChange}/>
          <span class="temp-value isolate-ltr">{$temperature.toFixed(1)}</span>
        </div>
      </div>
      <div class="sampling-controls">
        <label class="ctrl-label">أخذ العينات</label>
        <div class="sampling-row">
          <label class="radio-label">
            <input type="radio" name="sampling" value="top-k" checked={$samplingMethod === 'top-k'} on:change={() => setSamplingMethod('top-k')}/>
            <span class="isolate-ltr">Top-k</span>
          </label>
          <label class="radio-label">
            <input type="radio" name="sampling" value="top-p" checked={$samplingMethod === 'top-p'} on:change={() => setSamplingMethod('top-p')}/>
            <span class="isolate-ltr">Top-p</span>
          </label>
        </div>
        <span class="k-value isolate-ltr">k={$topK}</span>
      </div>
      <div class="header-links">
        <span class="model-badge">
          <span class="status-dot" class:active={$isReady}></span>
          <span class="isolate-ltr">{$modelConfig.name}</span>
        </span>
        <a href="https://github.com/2pidata/transformer-explainer-arabic" target="_blank" rel="noopener" class="gh-link" aria-label="GitHub">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        </a>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════════════════
     MAIN VISUALIZATION — Grid layout matching original
     ═══════════════════════════════════════════════════════════════════════ -->
<div class="viz-container" bind:this={mainContainer}>

  <!-- SANKEY SVG LAYER (back — behind all nodes) -->
  <svg class="sankey-layer sankey-back" bind:this={sankeyBackSvg}>
    {#each sankeyPaths.filter(p => p.layer === 'back') as path}
      <path
        class="sankey-path {path.className}"
        d={path.d}
        fill="url(#grad-{path.gradClass})"
        opacity={path.opacity}
      />
    {/each}
    {#each residualPaths as rpath}
      <path
        class="residual-line"
        d={rpath.d}
        fill="none"
        stroke="url(#grad-residual)"
        stroke-width="2"
        stroke-dasharray="10 6"
        opacity="0.6"
      />
    {/each}
  </svg>

  <!-- SANKEY SVG LAYER (top — for attention-related paths) -->
  <svg class="sankey-layer sankey-top" bind:this={sankeyTopSvg}>
    {#each sankeyPaths.filter(p => p.layer === 'top') as path}
      <path
        class="sankey-path {path.className}"
        d={path.d}
        fill="url(#grad-{path.gradClass})"
        opacity={path.opacity}
      />
    {/each}
  </svg>

  <!-- ═══ GRID LAYOUT — RTL order: Embedding | Block header | QKV+Attention+MLP | Blocks | Output ═══ -->
  <div class="viz-grid">

    <!-- COLUMN 1: EMBEDDING -->
    <div class="viz-col col-embedding">
      <div class="col-title">
        <span class="title-ar">التضمين</span>
        <span class="title-en">Embedding</span>
      </div>
      <div class="col-content">
        <div class="embed-row-container embed-col">
          {#each $tokens as token, idx}
            <div class="embed-row"
              on:mouseenter={() => setHoveredToken(idx)}
              on:mouseleave={() => setHoveredToken(null)}>
              <span class="token-cell" style="background-color: {getEmbedColor(idx, $tokens.length)}">
                {formatToken(token.text)}
              </span>
              <div class="embed-bar" style="background: linear-gradient(to left, {colors.blue200}, {colors.indigo200})">
                <span class="bar-label isolate-ltr">[{$modelConfig.hiddenSize}]</span>
              </div>
              <div class="pos-bar" style="background: linear-gradient(to left, {colors.red200}, {colors.purple200})">
                <span class="bar-label isolate-ltr">+{idx}</span>
              </div>
            </div>
          {/each}
          {#if $tokens.length === 0}
            <div class="empty-msg">اكتب نصاً</div>
          {/if}
        </div>
      </div>
    </div>

    <!-- COLUMN 2: TRANSFORMER BLOCK (QKV + Attention + MLP) -->
    <div class="viz-col col-block">
      <div class="col-title block-title">
        <div class="block-nav">
          <span class="title-ar">المحوّل الطبقة {$currentLayer + 1}</span>
          <span class="title-en">Transformer Block {$currentLayer + 1}</span>
          <div class="block-nav-btns">
            <button class="nav-btn-sm" on:click={previousLayer} disabled={$currentLayer === 0}>‹</button>
            <button class="nav-btn-sm" on:click={nextLayer} disabled={$currentLayer >= $modelConfig.numLayers - 1}>›</button>
          </div>
        </div>
        <div class="block-sections-label">
          <span class="section-label">الانتباه الذاتي متعدد الرؤوس</span>
          <span class="title-en">Multi-head Self Attention</span>
        </div>
        <div class="residual-label">Residual</div>
      </div>

      <div class="col-content block-content">
        <!-- QKV Sub-column -->
        <div class="sub-col sub-qkv">
          <div class="qkv-section qkv-col">
            {#each $tokens as _, idx}
              <div class="qkv-row qkv-cell"
                on:mouseenter={() => setHoveredToken(idx)}
                on:mouseleave={() => setHoveredToken(null)}>
                <div class="qkv-chip q-chip q-vectors"
                  class:qkv-highlight={hoveredMatrixCell.col === idx}
                  class:qkv-fade={hoveredMatrixCell.col !== null && hoveredMatrixCell.col !== idx}>
                  <span class="qkv-label">Q</span>
                </div>
                <div class="qkv-chip k-chip k-vectors"
                  class:qkv-highlight={hoveredMatrixCell.row === idx}
                  class:qkv-fade={hoveredMatrixCell.row !== null && hoveredMatrixCell.row !== idx}>
                  <span class="qkv-label">K</span>
                </div>
                <div class="qkv-chip v-chip v-vectors">
                  <span class="qkv-label">V</span>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- ATTENTION Sub-column -->
        <div class="sub-col sub-attention">
          <div class="attention-section attention-box">
            <!-- Key label -->
            <div class="qkv-side-label key-label"><span style="color: #ef4444">Key</span></div>

            <!-- K token labels (top) -->
            <div class="attn-matrix-container">
              {#if $currentAttentionMatrix && $tokens.length > 0}
                <!-- Column labels (K) -->
                <div class="matrix-grid" style="--matrix-size: {$tokens.length}">
                  <div class="matrix-labels-row">
                    <div class="matrix-corner"></div>
                    {#each $tokens as token, j}
                      <div class="matrix-col-lbl"
                        class:col-hi={hoveredMatrixCell.col === j}>
                        {formatToken(token.text)}
                      </div>
                    {/each}
                  </div>
                  <!-- Matrix rows -->
                  {#each $currentAttentionMatrix as row, i}
                    <div class="matrix-data-row">
                      <div class="matrix-row-lbl"
                        class:row-hi={hoveredMatrixCell.row === i}>
                        {formatToken($tokens[i]?.text || '')}
                      </div>
                      {#each row as value, j}
                        {#if j <= i}
                          <div class="matrix-cell-wrap"
                            on:mouseenter={() => handleMatrixCellEnter(i, j)}
                            on:mouseleave={handleMatrixCellLeave}>
                            <svg class="matrix-svg" viewBox="0 0 30 30">
                              <circle
                                class="matrix-circle"
                                cx="15" cy="15"
                                r={Math.max(3, value * 13)}
                                fill={getPurpleColor(value)}
                                stroke="rgba(139,92,246,0.3)"
                                stroke-width="0.5"
                              />
                            </svg>
                          </div>
                        {:else}
                          <div class="matrix-cell-wrap masked"></div>
                        {/if}
                      {/each}
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="empty-msg">جاري تحميل مصفوفة الانتباه...</div>
              {/if}
            </div>

            <!-- Query label -->
            <div class="qkv-side-label query-label"><span style="color: #3b82f6">Query</span></div>

            <!-- Attention info line -->
            <div class="attention-info">
              <span class="attn-label">Attention</span>
              <span class="head-nav">
                <span class="isolate-ltr">Head {$currentHead + 1} of {$modelConfig.numHeads}</span>
                <button class="nav-btn-xs" on:click={previousHead} disabled={$currentHead === 0}>‹</button>
                <button class="nav-btn-xs" on:click={nextHead} disabled={$currentHead >= $modelConfig.numHeads - 1}>›</button>
              </span>
            </div>

            <!-- Value label -->
            <div class="qkv-side-label value-label"><span style="color: #22c55e">Value</span></div>
          </div>

          <!-- Attention Output -->
          <div class="attention-out-section attention-out">
            <div class="out-label">Out</div>
            {#each $tokens as _, idx}
              <div class="out-cell" on:mouseenter={() => setHoveredToken(idx)} on:mouseleave={() => setHoveredToken(null)}>
                <div class="out-bar"></div>
              </div>
            {/each}
          </div>
        </div>

        <!-- MLP Sub-column -->
        <div class="sub-col sub-mlp">
          <div class="mlp-title">
            <span class="title-ar">MLP</span>
          </div>
          <div class="mlp-section">
            <div class="mlp-layer mlp-in">
              <div class="mlp-layer-label isolate-ltr">{$modelConfig.hiddenSize}</div>
              {#each $tokens as _, idx}
                <div class="mlp-bar mlp-cell" on:mouseenter={() => setHoveredToken(idx)} on:mouseleave={() => setHoveredToken(null)}>
                  <div class="mlp-fill" style="background: {colors.blue200}"></div>
                </div>
              {/each}
            </div>
            <div class="mlp-layer mlp-mid">
              <div class="mlp-layer-label isolate-ltr">{$modelConfig.mlpDimension}</div>
              {#each $tokens as _, idx}
                <div class="mlp-bar mlp-cell expanded" on:mouseenter={() => setHoveredToken(idx)} on:mouseleave={() => setHoveredToken(null)}>
                  <div class="mlp-fill" style="background: {colors.indigo200}"></div>
                </div>
              {/each}
            </div>
            <div class="mlp-layer mlp-out">
              <div class="mlp-layer-label isolate-ltr">{$modelConfig.hiddenSize}</div>
              {#each $tokens as _, idx}
                <div class="mlp-bar mlp-output-cell" on:mouseenter={() => setHoveredToken(idx)} on:mouseleave={() => setHoveredToken(null)}>
                  <div class="mlp-fill" style="background: {colors.blue200}"></div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- COLUMN 3: SUBSEQUENT BLOCKS -->
    <div class="viz-col col-blocks">
      <div class="col-title">
        <span class="blocks-count isolate-ltr">{$modelConfig.numLayers - 1} more identical</span>
        <span class="title-ar">طبقات المحوّل</span>
        <span class="title-en">Transformer Blocks</span>
      </div>
      <div class="col-content blocks-content blocks-col">
        {#each $tokens as _, idx}
          <div class="block-bar block-cell">
            <div class="block-bar-inner">
              {#each Array(Math.min(3, $modelConfig.numLayers - 1)) as _, bi}
                <div class="block-layer-line" style="opacity: {1 - bi * 0.3}"></div>
              {/each}
            </div>
          </div>
        {/each}
        <div class="blocks-last-label">
          {#each $tokens as token}
            <span class="block-token-label">{formatToken(token.text)}</span>
          {/each}
        </div>
      </div>
    </div>

    <!-- COLUMN 4: OUTPUT (Linear + Softmax + Probabilities) -->
    <div class="viz-col col-output">
      <div class="col-title">
        <span class="title-ar">الاحتمالات</span>
        <span class="title-en">Probabilities</span>
      </div>
      <div class="col-content output-content output-col">
        {#each $activePredictions as pred, idx}
          <button class="prob-item" class:prob-top={idx === 0} on:click={() => handlePredictionClick(pred.token)}>
            <span class="prob-token">{pred.token}</span>
            <div class="prob-bar">
              <div class="prob-bar-fill" style="width: 0%"></div>
            </div>
            <span class="prob-pct isolate-ltr">{pred.percentage}</span>
          </button>
        {/each}
        {#if $activePredictions.length === 0}
          <div class="empty-msg">اكتب نصاً لرؤية التوقعات</div>
        {/if}
      </div>
    </div>

  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════════════════
     EDUCATIONAL ARTICLE
     ═══════════════════════════════════════════════════════════════════════ -->
<div class="article-area">
  <button class="article-btn" on:click={() => showArticle = !showArticle}>
    {#if showArticle}إخفاء الشرح{:else}📖 كيف يعمل المحوّل؟{/if}
  </button>
</div>

{#if showArticle}
  <section class="article-container">
    <div class="article-inner" dir="rtl">
      <h2 class="article-title">{ARABIC_LABELS.articleTitle}</h2>
      <article class="edu-block">
        <h3>{ARABIC_LABELS.whatIsTransformer}</h3>
        <p>المحوّل (Transformer) هو نوع من الشبكات العصبية يستخدم آلية الانتباه الذاتي لمعالجة النصوص. تم تقديمه عام 2017 في ورقة "Attention Is All You Need".</p>
        <p>النموذج المستخدم هو <strong>{$modelConfig.name}</strong> — {$modelConfig.numLayers} طبقة و{$modelConfig.numHeads} رأس انتباه.</p>
      </article>
      <article class="edu-block">
        <h3>{ARABIC_LABELS.embeddingExplain}</h3>
        <p>التضمين يحوّل الكلمات إلى متجهات من {$modelConfig.hiddenSize} بُعد تحمل المعنى الدلالي، مع إضافة تضمين الموضع.</p>
      </article>
      <article class="edu-block">
        <h3>QKV — استعلام · مفتاح · قيمة</h3>
        <p>لكل كلمة يُحسب <strong style="color:#3b82f6">استعلام Q</strong> و<strong style="color:#ef4444">مفتاح K</strong> و<strong style="color:#22c55e">قيمة V</strong> لتحديد مدى "انتباه" كل كلمة للأخرى.</p>
      </article>
      <article class="edu-block">
        <h3>{ARABIC_LABELS.attentionExplain}</h3>
        <p>الانتباه الذاتي يحسب حاصل الضرب Q·K ثم softmax للحصول على أوزان الانتباه. الدائرة الأكبر = انتباه أقوى.</p>
      </article>
      <article class="edu-block">
        <h3>{ARABIC_LABELS.mlpExplain}</h3>
        <p>شبكة MLP توسّع البُعد إلى {$modelConfig.mlpDimension} (×4) مع GeLU ثم تضغطه مجدداً إلى {$modelConfig.hiddenSize}.</p>
      </article>
      <article class="edu-block">
        <h3>{ARABIC_LABELS.outputExplain}</h3>
        <p>طبقة خطية + softmax تحوّل المتجه الأخير إلى احتمالات. درجة الحرارة تتحكم في الإبداعية.</p>
      </article>
    </div>
  </section>
{/if}

<!-- Footer -->
<footer class="site-footer">
  <p>شارح المحوّل — أداة تعليمية تفاعلية</p>
  <p class="footer-link"><a href="https://2pidata.com" target="_blank" rel="noopener">2pidata</a> | {new Date().getFullYear()}</p>
</footer>

<style>
  /* ═══ GLOBAL HELPERS ═══ */
  .svg-defs { position: absolute; width: 0; height: 0; overflow: hidden; }
  .isolate-ltr { direction: ltr; unicode-bidi: isolate; }

  /* ═══ TOP BAR ═══ */
  .top-bar {
    position: sticky; top: 0; z-index: 100;
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid #e5e7eb;
    padding: 0.5rem 1.5rem;
  }
  .top-bar-inner {
    max-width: 1800px; margin: 0 auto;
    display: flex; align-items: center; gap: 1.5rem;
    flex-wrap: wrap;
  }
  .logo-area { display: flex; flex-direction: column; flex-shrink: 0; }
  .logo-main {
    font-size: 1.3rem; font-weight: 800;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    font-family: 'Noto Kufi Arabic', sans-serif; line-height: 1.2;
  }
  .logo-en { font-size: 0.6rem; color: #9ca3af; letter-spacing: 0.08em; text-transform: uppercase; direction: ltr; }

  /* Input */
  .input-area { flex: 1; max-width: 550px; position: relative; }
  .input-group {
    display: flex; align-items: center;
    border: 1.5px solid #d1d5db; border-radius: 0.5rem;
    overflow: hidden; background: white;
    transition: border-color 0.2s;
  }
  .input-group:focus-within { border-color: #8b5cf6; }
  .examples-btn {
    padding: 0.45rem 0.7rem; font-size: 0.78rem; font-weight: 500;
    background: #f9fafb; border: none; border-left: 1px solid #e5e7eb;
    cursor: pointer; color: #4b5563; white-space: nowrap;
    transition: background 0.15s;
  }
  .examples-btn:hover { background: #f3f4f6; }
  .input-wrapper { flex: 1; display: flex; align-items: center; position: relative; }
  .text-input {
    width: 100%; padding: 0.45rem 0.7rem; border: none; outline: none;
    font-size: 0.9rem; background: transparent; direction: rtl;
    resize: none; line-height: 1.5; color: #1f2937;
    font-family: 'Noto Sans Arabic', sans-serif;
  }
  .ghost-token {
    position: absolute; left: 0.5rem; font-size: 0.8rem;
    color: #8b5cf6; opacity: 0.4; cursor: pointer;
    transition: opacity 0.2s; white-space: nowrap;
  }
  .ghost-token:hover { opacity: 1; }
  .gen-btn {
    padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 600;
    background: linear-gradient(135deg, #3b82f6, #6366f1);
    color: white; border: none; cursor: pointer; white-space: nowrap;
    transition: all 0.2s; min-height: 36px;
    display: flex; align-items: center; gap: 0.3rem;
  }
  .gen-btn:hover:not(:disabled) { background: linear-gradient(135deg, #2563eb, #4f46e5); }
  .gen-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
    border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .examples-panel {
    position: absolute; top: 100%; right: 0; left: 0;
    background: white; border: 1px solid #e5e7eb;
    border-radius: 0 0 0.5rem 0.5rem;
    box-shadow: 0 4px 16px rgba(0,0,0,0.1); z-index: 50;
    max-height: 200px; overflow-y: auto;
  }
  .example-item {
    display: block; width: 100%; padding: 0.5rem 0.75rem;
    text-align: right; font-size: 0.82rem; border: none;
    background: transparent; cursor: pointer; color: inherit;
    direction: rtl; transition: background 0.1s;
  }
  .example-item:hover { background: #f3f4f6; }

  /* Controls */
  .controls-area { display: flex; align-items: center; gap: 1.5rem; flex-shrink: 0; flex-wrap: wrap; }
  .ctrl-label { font-size: 0.65rem; color: #6b7280; display: block; margin-bottom: 0.1rem; direction: rtl; }
  .temp-controls { display: flex; flex-direction: column; }
  .temp-row { display: flex; align-items: center; gap: 0.4rem; }
  .temp-slider { width: 80px; height: 3px; appearance: none; background: #e5e7eb; border-radius: 2px; }
  .temp-slider::-webkit-slider-thumb { appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #6b7280; cursor: pointer; }
  .temp-value { font-size: 0.75rem; color: #374151; font-weight: 500; min-width: 2rem; }
  .sampling-controls { display: flex; flex-direction: column; }
  .sampling-row { display: flex; gap: 0.5rem; align-items: center; }
  .radio-label { font-size: 0.72rem; color: #4b5563; display: flex; align-items: center; gap: 0.15rem; cursor: pointer; }
  .radio-label input { margin: 0; }
  .k-value { font-size: 0.65rem; color: #6b7280; }
  .header-links { display: flex; align-items: center; gap: 0.5rem; }
  .model-badge {
    display: flex; align-items: center; gap: 0.3rem;
    padding: 0.2rem 0.5rem; background: #f3f4f6;
    border-radius: 999px; font-size: 0.7rem; color: #4b5563;
  }
  .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #fbbf24; }
  .status-dot.active { background: #22c55e; }
  .gh-link { color: #6b7280; padding: 0.3rem; transition: color 0.15s; }
  .gh-link:hover { color: #374151; }

  /* ═══ VISUALIZATION CONTAINER ═══ */
  .viz-container {
    position: relative;
    min-height: calc(100vh - 70px);
    padding: 1rem 1.5rem 2rem;
    overflow-x: auto;
    background: white;
  }

  /* Sankey layers */
  .sankey-layer {
    position: absolute; top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none;
    overflow: visible;
  }
  .sankey-back { z-index: 1; }
  .sankey-top { z-index: 5; }
  .sankey-path { transition: opacity 0.3s; }

  .residual-line {
    stroke-dasharray: 10 6;
    stroke-dashoffset: 0;
  }

  /* ═══ GRID LAYOUT ═══ */
  .viz-grid {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: auto 3.5fr 0.5fr 0.6fr;
    gap: 0;
    min-height: 500px;
    direction: rtl;
    width: 100%;
  }

  /* Column shared */
  .viz-col {
    display: flex; flex-direction: column;
    position: relative;
  }
  .col-title {
    display: flex; flex-direction: column;
    align-items: center; justify-content: flex-end;
    padding-bottom: 1.5rem; min-height: 5rem;
    color: #9ca3af; white-space: nowrap;
    cursor: default; transition: color 0.3s;
  }
  .col-title:hover { color: #6b7280; }
  .title-ar { font-size: 0.85rem; font-weight: 600; font-family: 'Noto Kufi Arabic', sans-serif; direction: rtl; }
  .title-en { font-size: 0.6rem; color: #d1d5db; letter-spacing: 0.03em; direction: ltr; }
  .col-content { flex: 1; }

  /* ═══ EMBEDDING COLUMN ═══ */
  .col-embedding { min-width: 140px; padding-left: 0.5rem; }
  .embed-row-container { display: flex; flex-direction: column; gap: 0.4rem; }
  .embed-row {
    display: flex; align-items: center; gap: 0.4rem;
    direction: rtl; height: var(--vector-h, 28px);
  }
  .token-cell {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 0.15rem 0.4rem; border-radius: 0.25rem;
    font-size: 0.78rem; font-weight: 500; color: #1f2937;
    border: 1px solid rgba(0,0,0,0.08);
    min-width: 50px; text-align: center; direction: rtl;
    cursor: pointer; transition: all 0.2s;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    max-width: 100px;
  }
  .token-cell:hover { transform: scale(1.08); box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
  .embed-bar, .pos-bar {
    height: 100%; width: 12px; border-radius: 2px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; position: relative;
  }
  .bar-label {
    position: absolute; left: 50%; transform: translateX(-50%);
    font-size: 0.45rem; color: #6b7280; white-space: nowrap;
    writing-mode: vertical-rl; text-orientation: mixed;
  }
  .empty-msg { text-align: center; color: #9ca3af; font-size: 0.75rem; padding: 2rem 0; direction: rtl; }

  /* ═══ TRANSFORMER BLOCK COLUMN ═══ */
  .col-block { min-width: 500px; }
  .block-title { align-items: flex-start; padding-right: 1rem; }
  .block-nav { display: flex; align-items: center; gap: 0.5rem; }
  .block-nav-btns { display: flex; gap: 0.2rem; direction: ltr; }
  .nav-btn-sm {
    width: 20px; height: 20px; border-radius: 0.2rem;
    border: 1px solid #e5e7eb; background: #f9fafb;
    font-size: 0.75rem; cursor: pointer; color: #4b5563;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; direction: ltr;
  }
  .nav-btn-sm:hover:not(:disabled) { border-color: #8b5cf6; background: #f3f4f6; }
  .nav-btn-sm:disabled { opacity: 0.3; cursor: not-allowed; }
  .block-sections-label { margin-top: 0.2rem; }
  .section-label { font-size: 0.7rem; direction: rtl; }
  .residual-label { font-size: 0.55rem; color: #d1d5db; margin-top: 0.15rem; direction: ltr; }

  .block-content {
    display: grid;
    grid-template-columns: 0.5fr 2fr 1fr;
    gap: 0;
    height: 100%;
  }

  /* QKV sub-column */
  .sub-qkv { padding: 0 0.3rem; }
  .qkv-section { display: flex; flex-direction: column; gap: 0.4rem; }
  .qkv-row { display: flex; gap: 3px; direction: ltr; height: var(--vector-h, 28px); }
  .qkv-chip {
    flex: 1; height: 100%; border-radius: 3px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; cursor: default;
  }
  .q-chip { background: #bfdbfe; }
  .k-chip { background: #fecaca; }
  .v-chip { background: #bbf7d0; }
  .qkv-label { font-size: 0.6rem; font-weight: 700; font-family: monospace; }
  .q-chip .qkv-label { color: #1d4ed8; }
  .k-chip .qkv-label { color: #dc2626; }
  .v-chip .qkv-label { color: #16a34a; }
  .qkv-highlight { transform: scale(1.15); box-shadow: 0 0 0 2px rgba(139,92,246,0.5); z-index: 3; }
  .qkv-fade { opacity: 0.25; }

  /* Attention sub-column */
  .sub-attention { display: flex; flex-direction: column; position: relative; }
  .attention-section {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; padding: 0 0.5rem;
    position: relative;
  }
  .qkv-side-label {
    font-size: 0.7rem; font-weight: 600;
    position: absolute; z-index: 3;
  }
  .key-label { top: -0.5rem; left: 50%; transform: translateX(-50%); }
  .query-label { bottom: 2.5rem; left: 0; }
  .value-label { bottom: -1rem; left: 50%; transform: translateX(-50%); }

  .attn-matrix-container { width: 100%; padding: 0.5rem 0; direction: ltr; }
  .matrix-grid {
    display: flex; flex-direction: column; gap: 1px;
    font-size: 0.55rem;
  }
  .matrix-labels-row { display: flex; gap: 1px; }
  .matrix-corner { width: 45px; flex-shrink: 0; }
  .matrix-col-lbl {
    flex: 1; min-width: 26px; max-width: 38px;
    text-align: center; color: #9ca3af; padding: 0.1rem 0;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    transition: all 0.15s; direction: rtl;
  }
  .col-hi { color: #1d4ed8; font-weight: 700; }
  .matrix-data-row { display: flex; gap: 1px; align-items: center; }
  .matrix-row-lbl {
    width: 45px; flex-shrink: 0; text-align: right;
    padding-left: 0.2rem; color: #9ca3af;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    transition: all 0.15s; direction: rtl;
  }
  .row-hi { color: #dc2626; font-weight: 700; }
  .matrix-cell-wrap {
    flex: 1; min-width: 26px; max-width: 38px;
    aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
    cursor: default;
  }
  .matrix-cell-wrap.masked { opacity: 0; }
  .matrix-svg { width: 100%; height: 100%; }
  .matrix-circle { transition: all 0.15s; }
  .matrix-cell-wrap:hover .matrix-circle {
    stroke: #8b5cf6; stroke-width: 2;
    filter: drop-shadow(0 0 4px rgba(139,92,246,0.4));
  }

  .attention-info {
    display: flex; align-items: center; justify-content: space-between;
    width: 100%; padding: 0.3rem 0.5rem; font-size: 0.6rem;
    color: #9ca3af; direction: ltr;
  }
  .attn-label { font-weight: 500; }
  .head-nav { display: flex; align-items: center; gap: 0.3rem; }
  .nav-btn-xs {
    width: 16px; height: 16px; border-radius: 2px;
    border: 1px solid #e5e7eb; background: white;
    font-size: 0.65rem; cursor: pointer; color: #9ca3af;
    display: flex; align-items: center; justify-content: center;
  }
  .nav-btn-xs:hover:not(:disabled) { border-color: #8b5cf6; }
  .nav-btn-xs:disabled { opacity: 0.3; cursor: not-allowed; }

  .attention-out-section {
    display: flex; flex-direction: column; gap: 0.3rem;
    align-items: center; padding: 0.3rem;
  }
  .out-label { font-size: 0.6rem; color: #9ca3af; }
  .out-cell { width: 100%; height: var(--vector-h, 28px); }
  .out-bar {
    width: 12px; height: 100%; margin: 0 auto;
    background: #ddd6fe; border-radius: 2px;
  }

  /* MLP sub-column */
  .sub-mlp { padding: 0 0.5rem; }
  .mlp-title { text-align: center; padding-bottom: 0.5rem; }
  .mlp-section {
    display: flex; gap: 0.5rem; align-items: flex-start;
    direction: ltr;
  }
  .mlp-layer {
    display: flex; flex-direction: column; gap: 0.3rem;
    align-items: center;
  }
  .mlp-layer-label { font-size: 0.5rem; color: #9ca3af; margin-bottom: 0.2rem; }
  .mlp-bar {
    width: 12px; height: var(--vector-h, 28px);
    border-radius: 2px; overflow: hidden;
  }
  .mlp-bar.expanded { width: 24px; }
  .mlp-fill { width: 100%; height: 100%; border-radius: 2px; }

  /* ═══ BLOCKS COLUMN ═══ */
  .col-blocks { min-width: 80px; }
  .blocks-count { font-size: 0.55rem; color: #6b7280; }
  .blocks-content {
    display: flex; flex-direction: column; gap: 0.4rem;
    padding: 0 0.5rem; align-items: center;
  }
  .block-bar {
    width: 100%; height: var(--vector-h, 28px);
    position: relative;
  }
  .block-bar-inner {
    width: 100%; height: 100%;
    display: flex; gap: 2px;
    border: 1px dashed #d1d5db; border-radius: 3px;
    padding: 2px; align-items: center; justify-content: center;
  }
  .block-layer-line {
    width: 8px; height: 100%;
    background: #e5e7eb; border-radius: 1px;
  }
  .blocks-last-label {
    display: flex; flex-direction: column; gap: 0.4rem;
    align-items: center; margin-top: 0.5rem;
  }
  .block-token-label {
    font-size: 0.55rem; color: #9ca3af;
    overflow: hidden; text-overflow: ellipsis;
    white-space: nowrap; max-width: 60px; direction: rtl;
  }

  /* ═══ OUTPUT COLUMN ═══ */
  .col-output { min-width: 160px; padding-right: 0.5rem; }
  .output-content {
    display: flex; flex-direction: column; gap: 0.35rem;
  }
  .prob-item {
    display: flex; align-items: center; gap: 0.4rem;
    padding: 0.25rem 0.4rem; border-radius: 0.3rem;
    border: 1px solid transparent; background: transparent;
    cursor: pointer; transition: all 0.2s;
    direction: rtl; width: 100%; text-align: right;
  }
  .prob-item:hover { border-color: #c4b5fd; background: rgba(139,92,246,0.04); }
  .prob-top { font-weight: 700; }
  .prob-top .prob-token { color: #7c3aed; }
  .prob-token {
    font-size: 0.82rem; color: #374151; flex-shrink: 0;
    min-width: 50px; text-align: right;
  }
  .prob-bar {
    flex: 1; height: 6px; background: #f3f4f6;
    border-radius: 3px; overflow: hidden;
  }
  .prob-bar-fill {
    height: 100%;
    background: linear-gradient(to left, #8b5cf6, #6366f1);
    border-radius: 3px;
    transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .prob-pct { font-size: 0.65rem; color: #6b7280; min-width: 40px; text-align: left; }

  /* ═══ ARTICLE ═══ */
  .article-area { text-align: center; padding: 1rem; background: #f9fafb; }
  .article-btn {
    padding: 0.5rem 1.5rem; border-radius: 999px;
    border: 1px solid #d1d5db; background: white;
    font-size: 0.82rem; font-weight: 500; cursor: pointer;
    color: #4b5563; transition: all 0.2s;
    font-family: 'Noto Sans Arabic', sans-serif; direction: rtl;
  }
  .article-btn:hover { border-color: #8b5cf6; color: #8b5cf6; }
  .article-container { max-width: 800px; margin: 0 auto; padding: 2rem 1.5rem; }
  .article-inner { line-height: 1.9; color: #374151; }
  .article-title {
    font-size: 1.5rem; font-weight: 800; color: #1f2937;
    margin-bottom: 1.5rem; font-family: 'Noto Kufi Arabic', sans-serif;
    text-align: center;
  }
  .edu-block { margin-bottom: 1.25rem; }
  .edu-block h3 {
    font-size: 1.05rem; font-weight: 700; color: #1f2937;
    margin-bottom: 0.4rem; font-family: 'Noto Kufi Arabic', sans-serif;
  }
  .edu-block p { font-size: 0.9rem; margin-bottom: 0.5rem; color: #4b5563; }

  /* ═══ FOOTER ═══ */
  .site-footer {
    text-align: center; padding: 1rem; border-top: 1px solid #e5e7eb;
    font-size: 0.7rem; color: #9ca3af; background: #f9fafb; direction: rtl;
  }
  .footer-link { margin-top: 0.25rem; font-size: 0.65rem; }
  .footer-link a { color: #8b5cf6; text-decoration: none; }
  .footer-link a:hover { text-decoration: underline; }

  /* ═══ RESPONSIVE ═══ */
  @media (max-width: 1024px) {
    .viz-grid {
      grid-template-columns: 1fr;
      direction: rtl;
    }
    .col-block { min-width: auto; }
    .block-content { grid-template-columns: 1fr; }
    .top-bar-inner { flex-wrap: wrap; }
    .input-area { flex-basis: 100%; max-width: 100%; }
  }
</style>
