<script lang="ts">
  import { modelConfig, showArticle, toggleArticle } from '$lib/store';
  
  let activeSection: string = 'intro';
  
  const sections = [
    { id: 'intro', title: 'ما هو المحوّل؟', icon: '🤖' },
    { id: 'tokenization', title: 'الترميز', icon: '✂️' },
    { id: 'embedding', title: 'التضمين', icon: '📊' },
    { id: 'attention', title: 'الانتباه الذاتي', icon: '👁️' },
    { id: 'mlp', title: 'الشبكة العصبية', icon: '🧠' },
    { id: 'output', title: 'المخرجات', icon: '🎯' },
    { id: 'temperature', title: 'درجة الحرارة', icon: '🌡️' }
  ];
  
  function scrollToSection(id: string) {
    activeSection = id;
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth' });
  }
</script>

<article class="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8" dir="rtl">
  <header class="mb-8">
    <h2 class="text-3xl font-bold text-primary-800 dark:text-primary-300">
      📚 كيف يعمل المحوّل؟
    </h2>
  </header>
  
  {#if $showArticle}
    <nav class="mb-8 flex flex-wrap gap-2 justify-center">
      {#each sections as section}
        <button
          on:click={() => scrollToSection(section.id)}
          class="px-3 py-1.5 rounded-full text-sm transition-colors
                 {activeSection === section.id ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200'}"
        >
          {section.icon} {section.title}
        </button>
      {/each}
    </nav>
    
    <div class="space-y-12 text-gray-700 dark:text-gray-300">
      
      <!-- Introduction -->
      <section id="section-intro" class="scroll-mt-24">
        <h3 class="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>🤖</span> ما هو المحوّل (Transformer)؟
        </h3>
        <p class="mb-4 leading-relaxed">
          المحوّل هو نوع ثوري من الشبكات العصبية قدمه باحثون من Google في 2017. 
          يستخدم آلية <strong>الانتباه الذاتي</strong> للنظر إلى كل الكلمات معاً بدلاً من معالجتها بالترتيب.
        </p>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
          <div class="bg-primary-50 dark:bg-primary-900/30 rounded-xl p-4 text-center">
            <span class="block text-3xl font-bold text-primary-600">{$modelConfig.numLayers}</span>
            <span class="text-sm">طبقة</span>
          </div>
          <div class="bg-primary-50 dark:bg-primary-900/30 rounded-xl p-4 text-center">
            <span class="block text-3xl font-bold text-primary-600">{$modelConfig.numHeads}</span>
            <span class="text-sm">رأس انتباه</span>
          </div>
          <div class="bg-primary-50 dark:bg-primary-900/30 rounded-xl p-4 text-center">
            <span class="block text-3xl font-bold text-primary-600">{$modelConfig.hiddenSize}</span>
            <span class="text-sm">بُعد مخفي</span>
          </div>
          <div class="bg-primary-50 dark:bg-primary-900/30 rounded-xl p-4 text-center">
            <span class="block text-3xl font-bold text-primary-600">{($modelConfig.vocabSize/1000).toFixed(0)}K</span>
            <span class="text-sm">كلمة</span>
          </div>
        </div>
      </section>
      
      <!-- Tokenization -->
      <section id="section-tokenization" class="scroll-mt-24">
        <h3 class="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>✂️</span> الترميز (Tokenization)
        </h3>
        <p class="mb-4 leading-relaxed">
          قبل الفهم، يُقسم النص إلى وحدات صغيرة تسمى <strong>الرموز (Tokens)</strong> 
          باستخدام خوارزمية BPE. الكلمات الشائعة تبقى كاملة، والنادرة تُقسم.
        </p>
        <div class="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 border-r-4 border-primary-500">
          <strong>مثال:</strong> "الذكاء الاصطناعي" → ["الذكاء", " الا", "صط", "ناعي"]
        </div>
      </section>
      
      <!-- Embedding -->
      <section id="section-embedding" class="scroll-mt-24">
        <h3 class="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>📊</span> التضمين (Embedding)
        </h3>
        <p class="mb-4 leading-relaxed">
          كل رمز يتحول إلى <strong>متجه</strong> من {$modelConfig.hiddenSize} رقم يمثل معناه.
          الكلمات المتشابهة تكون قريبة في هذا الفضاء متعدد الأبعاد.
        </p>
        <div class="bg-gray-900 text-white rounded-xl p-4 text-center font-mono" dir="ltr">
          التضمين النهائي = تضمين الرمز + التضمين الموضعي
        </div>
      </section>
      
      <!-- Attention -->
      <section id="section-attention" class="scroll-mt-24">
        <h3 class="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>👁️</span> الانتباه الذاتي (Self-Attention)
        </h3>
        <p class="mb-4 leading-relaxed">
          قلب المحوّل! يسمح لكل كلمة بالانتباه للكلمات الأخرى. لكل كلمة نحسب:
        </p>
        <div class="grid md:grid-cols-3 gap-4 my-4">
          <div class="bg-red-50 dark:bg-red-900/30 rounded-xl p-4">
            <strong>Q (Query):</strong> "ما أبحث عنه؟"
          </div>
          <div class="bg-green-50 dark:bg-green-900/30 rounded-xl p-4">
            <strong>K (Key):</strong> "ما أقدمه؟"
          </div>
          <div class="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4">
            <strong>V (Value):</strong> "معلوماتي"
          </div>
        </div>
        <div class="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-200">
          <strong>🎯 الماسك السببي:</strong> كل كلمة ترى فقط الكلمات السابقة - لا ترى المستقبل!
        </div>
      </section>
      
      <!-- MLP -->
      <section id="section-mlp" class="scroll-mt-24">
        <h3 class="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>🧠</span> الشبكة العصبية (MLP)
        </h3>
        <p class="leading-relaxed">
          بعد الانتباه، كل كلمة تمر عبر شبكة عصبية: 
          توسيع ({$modelConfig.hiddenSize}→{$modelConfig.mlpDimension}) 
          → تنشيط GELU 
          → تقليص ({$modelConfig.mlpDimension}→{$modelConfig.hiddenSize})
        </p>
      </section>
      
      <!-- Output -->
      <section id="section-output" class="scroll-mt-24">
        <h3 class="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>🎯</span> المخرجات والتوقعات
        </h3>
        <p class="leading-relaxed">
          المتجه النهائي يُحوَّل إلى {$modelConfig.vocabSize.toLocaleString()} رقم (واحد لكل كلمة)،
          ثم <strong>Softmax</strong> يحولها لاحتمالات مجموعها 100%.
        </p>
      </section>
      
      <!-- Temperature -->
      <section id="section-temperature" class="scroll-mt-24">
        <h3 class="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>🌡️</span> درجة الحرارة
        </h3>
        <div class="grid md:grid-cols-3 gap-4">
          <div class="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4">
            <strong>🥶 منخفضة (0.3):</strong> دقيق، يختار الأكثر احتمالاً
          </div>
          <div class="bg-green-50 dark:bg-green-900/30 rounded-xl p-4">
            <strong>😊 متوسطة (0.8):</strong> توازن بين الدقة والتنوع
          </div>
          <div class="bg-red-50 dark:bg-red-900/30 rounded-xl p-4">
            <strong>🔥 عالية (1.5+):</strong> إبداعي، نتائج غير متوقعة
          </div>
        </div>
      </section>
      
      <!-- Conclusion -->
      <div class="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl p-6 text-center">
        <h3 class="text-2xl font-bold mb-2">🎉 تهانينا!</h3>
        <p>الآن تفهم الأساسيات! جرب تغيير النص والمعاملات.</p>
      </div>
    </div>
  {/if}
</article>
