import type Ionicons from '@expo/vector-icons/Ionicons';

export interface CbtTool {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

export const CBT_TOOLS: CbtTool[] = [
  {
    id: 'hot-cross-bun',
    label: 'Hot Cross Bun',
    icon: 'sync-outline',
    description: 'Map a moment into thoughts, feelings, body sensations, and behaviors — and see how they feed each other.',
  },
  {
    id: 'downward-arrow',
    label: 'Downward Arrow',
    icon: 'arrow-down-circle-outline',
    description: 'Follow a thought down, step by step, to the core belief sitting beneath it.',
  },
  {
    id: 'distortion-check',
    label: 'Distortion Check',
    icon: 'glasses-outline',
    description: 'Hold a thought up to the light and see which thinking traps might be shaping it.',
  },
  {
    id: 'evidence-log',
    label: 'Evidence Log',
    icon: 'scale-outline',
    description: 'Weigh what actually supports a belief against what argues against it.',
  },
  {
    id: 'responsibility-pie',
    label: 'Responsibility Pie',
    icon: 'pie-chart-outline',
    description: 'Distribute the blame fairly — list every factor that contributed, assign each a share, and see what slice is actually yours.',
  },
];

export function getCbtTool(id: string | undefined): CbtTool | undefined {
  return CBT_TOOLS.find((tool) => tool.id === id);
}
