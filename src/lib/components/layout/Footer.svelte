<script lang="ts">
  const currentYear = new Date().getFullYear();
</script>

<footer class="border-t border-gray-200 dark:border-gray-700 mt-16">
  <div class="container mx-auto px-4 py-8">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">

      <!-- À propos -->
      <div>
        <h3 class="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200">
          عن المشروع
        </h3>
        <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
          شارح المحوّل هو أداة تعليمية تفاعلية مفتوحة المصدر لفهم كيفية عمل نماذج اللغة الكبيرة مثل GPT.
          مصمم خصيصاً للمجتمع التقني العربي.
        </p>
        <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mt-3">
          مشروع مقدّم من
          <a href="https://2pidata.com" target="_blank" rel="noopener" class="text-primary-600 hover:underline font-bold">
            2PiData
          </a>
          — نساعدك في بناء حلول الذكاء الاصطناعي.
        </p>
      </div>

      <!-- روابط -->
      <div>
        <h3 class="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200">
          روابط مفيدة
        </h3>
        <ul class="space-y-2 text-sm">
          <li>
            <a href="https://2pidata.com" target="_blank" rel="noopener" class="text-primary-600 hover:underline font-medium">
              2PiData.com — موقعنا الرسمي
            </a>
          </li>
          <li>
            <a href="https://poloclub.github.io/transformer-explainer/" target="_blank" rel="noopener" class="text-primary-600 hover:underline">
              Transformer Explainer الأصلي
            </a>
          </li>
          <li>
            <a href="https://github.com/2pidata/transformer-explainer-arabic" target="_blank" rel="noopener" class="text-primary-600 hover:underline">
              الكود المصدري على GitHub
            </a>
          </li>
          <li>
            <a href="https://huggingface.co/aubmindlab/aragpt2-base" target="_blank" rel="noopener" class="text-primary-600 hover:underline">
              AraGPT2 على HuggingFace
            </a>
          </li>
        </ul>
      </div>

      <!-- تواصل -->
      <div>
        <h3 class="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200">
          تواصل معنا
        </h3>
        <ul class="space-y-3 text-sm">
          <li class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
            </svg>
            <a href="https://2pidata.com" target="_blank" rel="noopener" class="text-primary-600 hover:underline">
              2pidata.com
            </a>
          </li>
          <li class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            <a href="mailto:contact@2pidata.fr" class="text-primary-600 hover:underline">
              contact@2pidata.fr
            </a>
          </li>
          <li class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <a href="https://github.com/2pidata" target="_blank" rel="noopener" class="text-primary-600 hover:underline">
              github.com/2pidata
            </a>
          </li>
        </ul>
      </div>
    </div>

    <!-- Copyright + Made by -->
    <div class="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center space-y-3">
      <!-- 2PiData brand -->
      <div class="flex items-center justify-center gap-2">
        <span class="text-gray-600 dark:text-gray-400 text-sm">مشروع مفتوح المصدر من</span>
        <a href="https://2pidata.com" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm font-bold hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors">
          2PiData
        </a>
      </div>

      <p class="text-gray-500 dark:text-gray-400 text-sm">
        © {currentYear} شارح المحوّل — أداة تعليمية تفاعلية مفتوحة المصدر
      </p>

      <!-- Made with love by Miloud -->
      <p class="text-gray-400 dark:text-gray-500 text-sm">
        صُنع بكل حب بواسطة
        <span class="font-semibold text-gray-600 dark:text-gray-300">Miloud Belarebia</span>
        للمجتمع التقني العربي
      </p>
    </div>
  </div>
</footer>
