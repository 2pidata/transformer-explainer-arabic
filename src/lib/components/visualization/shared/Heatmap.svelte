<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import * as d3 from 'd3';
  
  const dispatch = createEventDispatcher();
  
  // Props
  export let data: number[][] = [];
  export let rowLabels: string[] = [];
  export let colLabels: string[] = [];
  export let width: number = 300;
  export let height: number = 300;
  export let colorScheme: 'blues' | 'viridis' | 'plasma' | 'reds' = 'blues';
  export let showValues: boolean = false;
  export let animated: boolean = true;
  export let margin = { top: 40, right: 10, bottom: 10, left: 40 };
  
  let container: HTMLDivElement;
  let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  let tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  
  // Dimensions internes
  $: innerWidth = width - margin.left - margin.right;
  $: innerHeight = height - margin.top - margin.bottom;
  
  // Échelle de couleur
  $: colorScale = getColorScale(colorScheme);
  
  function getColorScale(scheme: string) {
    switch (scheme) {
      case 'viridis': return d3.interpolateViridis;
      case 'plasma': return d3.interpolatePlasma;
      case 'reds': return d3.interpolateReds;
      default: return d3.interpolateBlues;
    }
  }
  
  onMount(() => {
    // Créer le SVG
    svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'heatmap-svg');
    
    // Créer le tooltip
    tooltip = d3.select(container)
      .append('div')
      .attr('class', 'heatmap-tooltip')
      .style('opacity', 0);
    
    renderHeatmap();
  });
  
  afterUpdate(() => {
    if (svg && data.length > 0) {
      renderHeatmap();
    }
  });
  
  function renderHeatmap() {
    if (!data || data.length === 0) return;
    
    const rows = data.length;
    const cols = data[0]?.length || 0;
    
    if (cols === 0) return;
    
    // Échelles
    const xScale = d3.scaleBand()
      .domain(d3.range(cols).map(String))
      .range([0, innerWidth])
      .padding(0.05);
    
    const yScale = d3.scaleBand()
      .domain(d3.range(rows).map(String))
      .range([0, innerHeight])
      .padding(0.05);
    
    // Aplatir les données pour D3
    const flatData: { row: number; col: number; value: number }[] = [];
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        flatData.push({ row: i, col: j, value: data[i][j] || 0 });
      }
    }
    
    // Groupe principal
    let g = svg.select<SVGGElement>('.heatmap-group');
    if (g.empty()) {
      g = svg.append('g')
        .attr('class', 'heatmap-group')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    }
    
    // Cellules
    const cells = g.selectAll<SVGRectElement, typeof flatData[0]>('.cell')
      .data(flatData, d => `${d.row}-${d.col}`);
    
    // Enter
    const cellsEnter = cells.enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', d => xScale(String(d.col)) || 0)
      .attr('y', d => yScale(String(d.row)) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 2)
      .attr('fill', d => colorScale(d.value))
      .style('opacity', 0);
    
    // Animation d'entrée
    if (animated) {
      cellsEnter.transition()
        .duration(300)
        .delay((_, i) => i * 5)
        .style('opacity', 1);
    } else {
      cellsEnter.style('opacity', 1);
    }
    
    // Update
    cells.transition()
      .duration(animated ? 300 : 0)
      .attr('fill', d => colorScale(d.value));
    
    // Exit
    cells.exit().remove();
    
    // Interactions
    g.selectAll<SVGRectElement, typeof flatData[0]>('.cell')
      .on('mouseover', function(event, d) {
        // Highlight
        d3.select(this)
          .attr('stroke', '#000')
          .attr('stroke-width', 2);
        
        // Tooltip
        const rowLabel = rowLabels[d.row] || `Row ${d.row}`;
        const colLabel = colLabels[d.col] || `Col ${d.col}`;
        
        tooltip
          .style('opacity', 1)
          .html(`
            <strong>${rowLabel}</strong> → <strong>${colLabel}</strong><br>
            <span class="value">${(d.value * 100).toFixed(1)}%</span>
          `)
          .style('left', `${event.offsetX + 10}px`)
          .style('top', `${event.offsetY - 10}px`);
        
        dispatch('cellHover', { row: d.row, col: d.col, value: d.value });
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke', 'none');
        
        tooltip.style('opacity', 0);
        dispatch('cellLeave');
      })
      .on('click', (event, d) => {
        dispatch('cellClick', { row: d.row, col: d.col, value: d.value });
      });
    
    // Labels des colonnes (en haut)
    if (colLabels.length > 0) {
      const colLabelGroup = g.selectAll('.col-labels').data([null]);
      const colLabelGroupEnter = colLabelGroup.enter().append('g').attr('class', 'col-labels');
      
      const labels = colLabelGroupEnter.merge(colLabelGroup as any)
        .selectAll<SVGTextElement, string>('.col-label')
        .data(colLabels.slice(0, cols));
      
      labels.enter()
        .append('text')
        .attr('class', 'col-label')
        .merge(labels as any)
        .attr('x', (_, i) => (xScale(String(i)) || 0) + xScale.bandwidth() / 2)
        .attr('y', -8)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', 'currentColor')
        .text(d => d.length > 4 ? d.slice(0, 4) + '..' : d);
      
      labels.exit().remove();
    }
    
    // Labels des lignes (à gauche)
    if (rowLabels.length > 0) {
      const rowLabelGroup = g.selectAll('.row-labels').data([null]);
      const rowLabelGroupEnter = rowLabelGroup.enter().append('g').attr('class', 'row-labels');
      
      const labels = rowLabelGroupEnter.merge(rowLabelGroup as any)
        .selectAll<SVGTextElement, string>('.row-label')
        .data(rowLabels.slice(0, rows));
      
      labels.enter()
        .append('text')
        .attr('class', 'row-label')
        .merge(labels as any)
        .attr('x', -8)
        .attr('y', (_, i) => (yScale(String(i)) || 0) + yScale.bandwidth() / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '10px')
        .attr('fill', 'currentColor')
        .text(d => d.length > 4 ? d.slice(0, 4) + '..' : d);
      
      labels.exit().remove();
    }
    
    // Valeurs dans les cellules
    if (showValues && xScale.bandwidth() > 25) {
      const valueTexts = g.selectAll<SVGTextElement, typeof flatData[0]>('.cell-value')
        .data(flatData.filter(d => d.value > 0.05));
      
      valueTexts.enter()
        .append('text')
        .attr('class', 'cell-value')
        .merge(valueTexts as any)
        .attr('x', d => (xScale(String(d.col)) || 0) + xScale.bandwidth() / 2)
        .attr('y', d => (yScale(String(d.row)) || 0) + yScale.bandwidth() / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '9px')
        .attr('fill', d => d.value > 0.5 ? 'white' : 'black')
        .text(d => (d.value * 100).toFixed(0));
      
      valueTexts.exit().remove();
    }
  }
</script>

<div bind:this={container} class="heatmap-container relative">
  <!-- SVG sera inséré ici par D3 -->
</div>

<style>
  .heatmap-container {
    font-family: inherit;
  }
  
  .heatmap-container :global(.heatmap-svg) {
    display: block;
  }
  
  .heatmap-container :global(.cell) {
    cursor: pointer;
    transition: opacity 0.15s;
  }
  
  .heatmap-container :global(.cell:hover) {
    opacity: 0.8;
  }
  
  .heatmap-container :global(.heatmap-tooltip) {
    position: absolute;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    border-radius: 6px;
    font-size: 12px;
    pointer-events: none;
    z-index: 100;
    white-space: nowrap;
    transition: opacity 0.15s;
  }
  
  .heatmap-container :global(.heatmap-tooltip .value) {
    font-weight: bold;
    color: #60a5fa;
  }
</style>
