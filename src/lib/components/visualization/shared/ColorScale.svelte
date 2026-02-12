<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  
  export let width: number = 200;
  export let height: number = 20;
  export let colorScheme: 'blues' | 'viridis' | 'plasma' | 'reds' = 'blues';
  export let minLabel: string = '0%';
  export let maxLabel: string = '100%';
  export let title: string = '';
  
  let container: HTMLDivElement;
  
  $: interpolator = getInterpolator(colorScheme);
  
  function getInterpolator(scheme: string) {
    switch (scheme) {
      case 'viridis': return d3.interpolateViridis;
      case 'plasma': return d3.interpolatePlasma;
      case 'reds': return d3.interpolateReds;
      default: return d3.interpolateBlues;
    }
  }
  
  onMount(() => {
    renderScale();
  });
  
  function renderScale() {
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height + 20);
    
    // Créer le dégradé
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'color-scale-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');
    
    // Ajouter les stops
    const numStops = 10;
    for (let i = 0; i <= numStops; i++) {
      const t = i / numStops;
      gradient.append('stop')
        .attr('offset', `${t * 100}%`)
        .attr('stop-color', interpolator(t));
    }
    
    // Rectangle avec dégradé
    svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height)
      .attr('rx', 4)
      .attr('fill', 'url(#color-scale-gradient)');
    
    // Labels
    svg.append('text')
      .attr('x', 0)
      .attr('y', height + 14)
      .attr('font-size', '10px')
      .attr('fill', 'currentColor')
      .text(minLabel);
    
    svg.append('text')
      .attr('x', width)
      .attr('y', height + 14)
      .attr('text-anchor', 'end')
      .attr('font-size', '10px')
      .attr('fill', 'currentColor')
      .text(maxLabel);
  }
</script>

<div class="color-scale">
  {#if title}
    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">{title}</p>
  {/if}
  <div bind:this={container}></div>
</div>

<style>
  .color-scale {
    display: inline-block;
  }
</style>
