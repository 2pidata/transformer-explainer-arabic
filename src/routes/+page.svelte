<script lang="ts">
  import { onMount } from 'svelte';
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
  // ÉTAT LOCAL
  // ═══════════════════════════════════════════════════════════════════════
  
  let inputElement: HTMLTextAreaElement;
  let debounceTimer: ReturnType<typeof setTimeout>;
  let useDemo = true; // Mode démo par défaut (pas de modèle réel)
  
  // ═══════════════════════════════════════════════════════════════════════
  // INITIALISATION
  // ═══════════════════════════════════════════════════════════════════════
  
  onMount(async () => {
    if (useDemo) {
      // Mode démonstration
      loadDemoData();
      await runAnalysis($inputText);
    } else {
      // Mode réel - charger le modèle
      try {
        await initialize((progress, message) => {
          setLoadingProgress(progress, message);
        });
        setModelLoaded(true);
        setTokenizerLoaded(true);
        await runAnalysis($inputText);
      } catch (error) {
        console.error('Erreur initialisation:', error);
        setError(error instanceof Error ? error.message : 'خطأ غير معروف');
        // Fallback au mode démo
        loadDemoData();
      }
    }
  });
  
  // ═══════════════════════════════════════════════════════════════════════
  // ANALYSE
  // ═══════════════════════════════════════════════════════════════════════
  
  async function runAnalysis(text: string) {
    if (!text.trim()) return;
    
    setInferenceRunning(true);
    
    try {
      let result;
      
      if (useDemo || !checkReady()) {
        // Mode démo
        result = generateDemoData(text);
      } else {
        // Mode réel
        result = await analyzeText(text, {
          temperature: $temperature,
          topK: $topK,
          topP: $topP,
          samplingMethod: $samplingMethod
        });
      }
      
      // Mettre à jour les stores
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
    
    // Debounce
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      runAnalysis(target.value);
    }, 500);
  }
  
  function handleExampleClick(exampleId: number) {
    const example = ARABIC_EXAMPLES.find(e => e.id === exampleId);
    if (example) {
      setInputText(example.text);
      runAnalysis(example.text);
    }
  }
  
  function handlePredictionClick(token: string) {
    const newText = $inputText + token;
    setInputText(newText);
    runAnalysis(newText);
  }
  
  function handleTemperatureChange(event: Event) {
    const target = event.target as HTMLInputElement;
    setTemperature(parseFloat(target.value));
    // Recalculer avec les nouveaux paramètres
    runAnalysis($inputText);
  }
  
  function handleTopKChange(event: Event) {
    const target = event.target as HTMLInputElement;
    setTopK(parseInt(target.value));
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // UTILITAIRES
  // ═══════════════════════════════════════════════════════════════════════
  
  function getAttentionColor(value: number): string {
    // Bleu plus intense pour des valeurs plus élevées
    const intensity = Math.round(value * 255);
    return `rgb(${255 - intensity}, ${255 - intensity}, 255)`;
  }
  
  function formatTokenDisplay(text: string): string {
    return text.replace(/Ġ/g, ' ').replace(/▁/g, ' ') || '␣';
  }
</script>

<!-- ═══════════════════════════════════════════════════════════════════════════
     STRUCTURE DE LA PAGE
     ═══════════════════════════════════════════════════════════════════════════ -->

<div class="container mx-auto px-4 py-8 max-w-7xl">
  
  <!-- ═══════════════════════════════════════════════════════════════════════
       EN-TÊTE
       ═══════════════════════════════════════════════════════════════════════ -->
  <header class="text-center mb-12">
    <h1 class="text-4xl md:text-5xl font-bold text-primary-800 dark:text-primary-300 mb-4">
      {ARABIC_LABELS.title}
    </h1>
    <p class="text-xl text-gray-600 dark:text-gray-400">
      {ARABIC_LABELS.subtitle}
    </p>
    
    <!-- Badge du modèle -->
    <div class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900 rounded-full">
      <span class="w-2 h-2 rounded-full {$isReady ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse"></span>
      <span class="text-sm font-medium text-primary-800 dark:text-primary-200">
        {$modelConfig.name}
      </span>
    </div>
  </header>
  
  <!-- ═══════════════════════════════════════════════════════════════════════
       ZONE D'ENTRÉE
       ═══════════════════════════════════════════════════════════════════════ -->
  <section class="card mb-8">
    <h2 class="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">
      {ARABIC_LABELS.examples}
    </h2>
    
    <!-- Boutons d'exemples -->
    <div class="flex flex-wrap gap-2 mb-6">
      {#each ARABIC_EXAMPLES.slice(0, 6) as example}
        <button
          class="btn btn-outline btn-sm"
          on:click={() => handleExampleClick(example.id)}
        >
          {example.text.slice(0, 25)}...
        </button>
      {/each}
    </div>
    
    <!-- Champ de texte -->
    <div class="relative">
      <textarea
        bind:this={inputElement}
        value={$inputText}
        on:input={handleInputChange}
        class="input-arabic w-full h-32 resize-none"
        placeholder={ARABIC_LABELS.inputPlaceholder}
        dir="rtl"
      ></textarea>
      
      <!-- Indicateur de chargement -->
      {#if $isBusy}
        <div class="absolute top-2 left-2">
          <div class="loading-spinner w-6 h-6"></div>
        </div>
      {/if}
    </div>
    
    <!-- Status -->
    <div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
      {$statusMessage}
    </div>
  </section>
  
  <!-- ═══════════════════════════════════════════════════════════════════════
       VISUALISATION PRINCIPALE
       ═══════════════════════════════════════════════════════════════════════ -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
    
    <!-- ─────────────────────────────────────────────────────────────────────
         COLONNE 1: TOKENS
         ───────────────────────────────────────────────────────────────────── -->
    <section class="card">
      <h3 class="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200">
        {ARABIC_LABELS.embedding}
      </h3>
      
      <div class="flex flex-wrap gap-2" dir="rtl">
        {#each $tokens as token, index}
          <button
            class="token {$hoveredToken === index ? 'token-highlighted' : ''}"
            on:mouseenter={() => setHoveredToken(index)}
            on:mouseleave={() => setHoveredToken(null)}
          >
            <span class="text-xs text-gray-500 ml-1">{index}</span>
            <span class="font-medium">{formatTokenDisplay(token.text)}</span>
          </button>
        {/each}
      </div>
      
      {#if $tokens.length === 0}
        <p class="text-gray-400 text-center py-8">
          اكتب نصاً لرؤية الرموز
        </p>
      {/if}
    </section>
    
    <!-- ─────────────────────────────────────────────────────────────────────
         COLONNE 2: ATTENTION
         ───────────────────────────────────────────────────────────────────── -->
    <section class="card">
      <h3 class="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200">
        {ARABIC_LABELS.attention}
      </h3>
      
      <!-- Navigation couches/têtes -->
      <div class="flex justify-between items-center mb-4 text-sm">
        <div class="layer-nav">
          <button class="layer-nav-btn" on:click={previousLayer} disabled={$currentLayer === 0}>
            ←
          </button>
          <span class="layer-indicator">{$layerInfo.label}</span>
          <button class="layer-nav-btn" on:click={nextLayer} disabled={$currentLayer >= $modelConfig.numLayers - 1}>
            →
          </button>
        </div>
        
        <div class="layer-nav">
          <button class="layer-nav-btn" on:click={previousHead} disabled={$currentHead === 0}>
            ←
          </button>
          <span class="layer-indicator">{$headInfo.label}</span>
          <button class="layer-nav-btn" on:click={nextHead} disabled={$currentHead >= $modelConfig.numHeads - 1}>
            →
          </button>
        </div>
      </div>
      
      <!-- Matrice d'attention -->
      {#if $currentAttentionMatrix && $tokens.length > 0}
        <div class="attention-matrix bg-white dark:bg-gray-800 p-2 rounded-lg overflow-auto">
          <table class="w-full text-xs">
            <thead>
              <tr>
                <th></th>
                {#each $tokens as token, j}
                  <th class="p-1 text-center max-w-[40px] truncate" title={token.text}>
                    {formatTokenDisplay(token.text).slice(0, 3)}
                  </th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each $currentAttentionMatrix as row, i}
                <tr>
                  <td class="p-1 font-medium text-left max-w-[40px] truncate" title={$tokens[i]?.text}>
                    {formatTokenDisplay($tokens[i]?.text || '').slice(0, 3)}
                  </td>
                  {#each row as value, j}
                    <td 
                      class="attention-cell p-1 text-center"
                      style="background-color: {getAttentionColor(value)}"
                      title={`${(value * 100).toFixed(1)}%`}
                    >
                      {#if value > 0.1}
                        <span class="text-[10px] {value > 0.5 ? 'text-white' : 'text-gray-700'}">
                          {(value * 100).toFixed(0)}
                        </span>
                      {/if}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="h-48 flex items-center justify-center text-gray-400">
          جاري تحميل مصفوفة الانتباه...
        </div>
      {/if}
    </section>
    
    <!-- ─────────────────────────────────────────────────────────────────────
         COLONNE 3: PRÉDICTIONS
         ───────────────────────────────────────────────────────────────────── -->
    <section class="card">
      <h3 class="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200">
        {ARABIC_LABELS.predictions}
      </h3>
      
      <!-- Contrôle de température -->
      <div class="mb-6">
        <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          {ARABIC_LABELS.temperature}: {$temperature.toFixed(1)}
        </label>
        <input
          type="range"
          class="slider w-full"
          min="0.1"
          max="2.0"
          step="0.1"
          value={$temperature}
          on:input={handleTemperatureChange}
        />
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>دقيق</span>
          <span>إبداعي</span>
        </div>
      </div>
      
      <!-- Liste des prédictions -->
      <div class="space-y-3">
        {#each $activePredictions as prediction}
          <button
            class="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors text-right"
            on:click={() => handlePredictionClick(prediction.token)}
          >
            <div class="flex-1">
              <span class="font-bold text-lg">{prediction.token}</span>
            </div>
            <div class="text-left">
              <div class="text-sm font-medium text-primary-600 dark:text-primary-400">
                {prediction.percentage}
              </div>
              <div class="w-20 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-primary-500 rounded-full transition-all duration-300"
                  style="width: {prediction.probability * 100}%"
                ></div>
              </div>
            </div>
          </button>
        {/each}
        
        {#if $activePredictions.length === 0}
          <p class="text-gray-400 text-center py-8">
            اكتب نصاً لرؤية التوقعات
          </p>
        {/if}
      </div>
    </section>
  </div>
  
  <!-- ═══════════════════════════════════════════════════════════════════════
       ARTICLE ÉDUCATIF
       ═══════════════════════════════════════════════════════════════════════ -->
  <section class="card">
    <h2 class="text-2xl font-bold mb-6 text-primary-800 dark:text-primary-300">
      {ARABIC_LABELS.articleTitle}
    </h2>
    
    <div class="article-content prose prose-lg dark:prose-invert max-w-none" dir="rtl">
      
      <!-- Section: ما هو المحوّل؟ -->
      <article class="article-section">
        <h3>{ARABIC_LABELS.whatIsTransformer}</h3>
        <p>
          المحوّل (Transformer) هو نوع من الشبكات العصبية يستخدم آلية الانتباه الذاتي (Self-Attention) 
          لمعالجة البيانات المتسلسلة مثل النصوص. تم تقديمه في ورقة بحثية شهيرة عام 2017 بعنوان 
          "Attention Is All You Need".
        </p>
        <p>
          النموذج الذي تستخدمه الآن هو <strong>{$modelConfig.name}</strong>، وهو نموذج مدرب على اللغة العربية 
          يحتوي على {$modelConfig.numLayers} طبقة و{$modelConfig.numHeads} رأس انتباه.
        </p>
      </article>
      
      <!-- Section: التضمين -->
      <article class="article-section">
        <h3>{ARABIC_LABELS.embeddingExplain}</h3>
        <p>
          التضمين (Embedding) هو تحويل الكلمات إلى متجهات رقمية. كل كلمة في النص يتم تمثيلها 
          بمتجه من {$modelConfig.hiddenSize} بُعد. هذه المتجهات تحمل المعنى الدلالي للكلمات.
        </p>
        <p>
          في القسم الأيسر، يمكنك رؤية كيف تم تقسيم النص إلى رموز (Tokens). 
          مرر الفأرة على أي رمز لرؤية تفاصيله.
        </p>
      </article>
      
      <!-- Section: الانتباه الذاتي -->
      <article class="article-section">
        <h3>{ARABIC_LABELS.attentionExplain}</h3>
        <p>
          الانتباه الذاتي يسمح لكل كلمة بـ"النظر" إلى الكلمات الأخرى في الجملة وتحديد أيها أكثر أهمية.
          المصفوفة في الوسط تُظهر قوة الانتباه بين كل زوج من الكلمات.
        </p>
        <p>
          اللون الأزرق الداكن يعني انتباه قوي، بينما الأبيض يعني انتباه ضعيف.
          لاحظ أن الجزء العلوي الأيمن من المصفوفة فارغ - هذا لأن النموذج لا يمكنه "رؤية" الكلمات المستقبلية.
        </p>
      </article>
      
      <!-- Section: التوقعات -->
      <article class="article-section">
        <h3>{ARABIC_LABELS.outputExplain}</h3>
        <p>
          بعد معالجة النص، يُخرج النموذج احتمالات لكل كلمة ممكنة كإكمال للجملة.
          القسم الأيمن يُظهر أعلى التوقعات مع احتمالاتها.
        </p>
        <p>
          يمكنك النقر على أي توقع لإضافته للنص ورؤية كيف تتغير التوقعات التالية.
        </p>
      </article>
      
      <!-- Section: درجة الحرارة -->
      <article class="article-section">
        <h3>درجة الحرارة والإبداعية</h3>
        <p>
          درجة الحرارة تتحكم في "إبداعية" النموذج. قيمة منخفضة (مثل 0.3) تجعل النموذج 
          يختار الكلمات الأكثر احتمالاً دائماً، بينما قيمة عالية (مثل 1.5) تجعله أكثر 
          تنوعاً وإبداعاً في اختياراته.
        </p>
      </article>
    </div>
  </section>
  
  <!-- ═══════════════════════════════════════════════════════════════════════
       FOOTER
       ═══════════════════════════════════════════════════════════════════════ -->
  <footer class="text-center mt-12 py-8 border-t border-gray-200 dark:border-gray-700">
    <p class="text-gray-600 dark:text-gray-400">
      مستوحى من 
      <a href="https://poloclub.github.io/transformer-explainer/" target="_blank" rel="noopener" class="text-primary-600 hover:underline">
        Transformer Explainer
      </a>
      من Georgia Tech
    </p>
    <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">
      #databelarebia | {new Date().getFullYear()}
    </p>
  </footer>
</div>

<style>
  /* Styles spécifiques à cette page */
  .attention-matrix table {
    border-collapse: collapse;
  }
  
  .attention-cell {
    min-width: 30px;
    min-height: 30px;
    transition: all 0.2s;
  }
  
  .attention-cell:hover {
    transform: scale(1.1);
    z-index: 10;
  }
</style>
