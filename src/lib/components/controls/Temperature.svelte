<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { temperature } from '$lib/store';
  import { PARAMETER_LIMITS } from '$lib/utils/constants';
  
  const dispatch = createEventDispatcher();
  
  const { min, max, step } = PARAMETER_LIMITS.temperature;
  
  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = parseFloat(target.value);
    dispatch('change', { value });
  }
  
  // Couleur selon la valeur
  $: sliderColor = $temperature < 0.5 
    ? 'from-blue-500 to-blue-600' 
    : $temperature > 1.2 
      ? 'from-red-500 to-orange-500' 
      : 'from-primary-500 to-primary-600';
  
  // Description selon la valeur
  $: description = $temperature < 0.5 
    ? 'دقيق جداً - يختار الكلمات الأكثر احتمالاً'
    : $temperature < 0.8 
      ? 'متوازن - مزيج من الدقة والتنوع'
      : $temperature < 1.2 
        ? 'إبداعي - تنوع أكثر في الاختيارات'
        : 'عشوائي جداً - نتائج غير متوقعة';
</script>

<div class="space-y-3">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <label for="temperature-slider" class="text-sm font-medium text-gray-700 dark:text-gray-300">
      درجة الحرارة
    </label>
    <span class="text-lg font-bold text-primary-600 dark:text-primary-400 tabular-nums">
      {$temperature.toFixed(1)}
    </span>
  </div>
  
  <!-- Slider -->
  <div class="relative">
    <input
      id="temperature-slider"
      type="range"
      class="slider w-full"
      {min}
      {max}
      {step}
      value={$temperature}
      on:input={handleChange}
    />
    
    <!-- Barre de progression colorée -->
    <div 
      class="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r {sliderColor} pointer-events-none"
      style="width: {(($temperature - min) / (max - min)) * 100}%"
    ></div>
  </div>
  
  <!-- Labels -->
  <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
    <span>🎯 دقيق ({min})</span>
    <span>🎨 إبداعي ({max})</span>
  </div>
  
  <!-- Description -->
  <p class="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
    {description}
  </p>
</div>

<style>
  /* Personnalisation du slider */
  .slider {
    -webkit-appearance: none;
    appearance: none;
    height: 8px;
    border-radius: 9999px;
    background: transparent;
    cursor: pointer;
  }
  
  .slider::-webkit-slider-runnable-track {
    height: 8px;
    border-radius: 9999px;
    background: #e5e7eb;
  }
  
  :global(.dark) .slider::-webkit-slider-runnable-track {
    background: #374151;
  }
  
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    border: 3px solid #3b82f6;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    cursor: pointer;
    margin-top: -6px;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  
  .slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  
  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    border: 3px solid #3b82f6;
    cursor: pointer;
  }
</style>
