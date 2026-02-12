// ═══════════════════════════════════════════════════════════════════════════
// src/lib/components/index.ts
// Export de tous les composants
// ═══════════════════════════════════════════════════════════════════════════

// Layout
export { default as Header } from './layout/Header.svelte';
export { default as Footer } from './layout/Footer.svelte';
export { default as LoadingScreen } from './layout/LoadingScreen.svelte';
export { default as Alert } from './layout/Alert.svelte';

// Input
export { default as InputForm } from './input/InputForm.svelte';
export { default as Examples } from './input/Examples.svelte';

// Controls
export { default as Temperature } from './controls/Temperature.svelte';
export { default as TopKSelector } from './controls/TopKSelector.svelte';
export { default as LayerNavigator } from './controls/LayerNavigator.svelte';

// Visualization - Shared
export { default as Heatmap } from './visualization/shared/Heatmap.svelte';
export { default as ColorScale } from './visualization/shared/ColorScale.svelte';
export { default as Tooltip } from './visualization/shared/Tooltip.svelte';

// Visualization - Embedding
export { default as TokenList } from './visualization/embedding/TokenList.svelte';

// Visualization - Attention
export { default as AttentionMatrix } from './visualization/attention/AttentionMatrix.svelte';

// Visualization - Output
export { default as PredictionList } from './visualization/output/PredictionList.svelte';

// Article
export { default as Article } from './article/Article.svelte';
