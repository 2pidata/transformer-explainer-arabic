<script lang="ts">
  export let visible: boolean = false;
  export let x: number = 0;
  export let y: number = 0;
  export let content: string = '';
  export let position: 'top' | 'bottom' | 'left' | 'right' = 'top';
  
  $: style = getStyle(x, y, position);
  
  function getStyle(x: number, y: number, pos: string) {
    let transform = '';
    switch (pos) {
      case 'top':
        transform = 'translate(-50%, -100%) translateY(-8px)';
        break;
      case 'bottom':
        transform = 'translate(-50%, 0) translateY(8px)';
        break;
      case 'left':
        transform = 'translate(-100%, -50%) translateX(-8px)';
        break;
      case 'right':
        transform = 'translate(0, -50%) translateX(8px)';
        break;
    }
    return `left: ${x}px; top: ${y}px; transform: ${transform};`;
  }
</script>

{#if visible}
  <div 
    class="tooltip"
    class:visible
    style={style}
    role="tooltip"
  >
    {#if content}
      {@html content}
    {:else}
      <slot />
    {/if}
    
    <!-- Flèche -->
    <div class="tooltip-arrow tooltip-arrow-{position}"></div>
  </div>
{/if}

<style>
  .tooltip {
    position: fixed;
    z-index: 9999;
    padding: 8px 12px;
    background: rgba(17, 24, 39, 0.95);
    color: white;
    border-radius: 6px;
    font-size: 12px;
    line-height: 1.4;
    max-width: 250px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
  
  .tooltip.visible {
    opacity: 1;
  }
  
  .tooltip-arrow {
    position: absolute;
    width: 8px;
    height: 8px;
    background: rgba(17, 24, 39, 0.95);
    transform: rotate(45deg);
  }
  
  .tooltip-arrow-top {
    bottom: -4px;
    left: 50%;
    margin-left: -4px;
  }
  
  .tooltip-arrow-bottom {
    top: -4px;
    left: 50%;
    margin-left: -4px;
  }
  
  .tooltip-arrow-left {
    right: -4px;
    top: 50%;
    margin-top: -4px;
  }
  
  .tooltip-arrow-right {
    left: -4px;
    top: 50%;
    margin-top: -4px;
  }
  
  :global(.dark) .tooltip {
    background: rgba(255, 255, 255, 0.95);
    color: #111827;
  }
  
  :global(.dark) .tooltip-arrow {
    background: rgba(255, 255, 255, 0.95);
  }
</style>
