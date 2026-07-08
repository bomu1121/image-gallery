import type { AIVisionProvider } from './types';

const providerRegistry = new Map<string, () => Promise<{ createProvider: (config: any) => AIVisionProvider }>>();

providerRegistry.set('openai', () => import('./providers/openai'));
providerRegistry.set('google', () => import('./providers/google'));
providerRegistry.set('azure', () => import('./providers/azure'));
providerRegistry.set('baidu', () => import('./providers/baidu'));
providerRegistry.set('qwen', () => import('./providers/qwen'));
providerRegistry.set('zhipu', () => import('./providers/zhipu'));
providerRegistry.set('kimi', () => import('./providers/kimi'));
providerRegistry.set('doubao', () => import('./providers/doubao'));
providerRegistry.set('silicoflow', () => import('./providers/silicoflow'));

export async function createAIProvider(providerName: string, config: any): Promise<AIVisionProvider> {
  const loader = providerRegistry.get(providerName);
  if (!loader) {
    throw new Error(`Unknown AI provider: ${providerName}`);
  }
  const module = await loader();
  return module.createProvider(config);
}

export function getAvailableProviders(): string[] {
  return Array.from(providerRegistry.keys());
}

export type {
  AIVisionProvider,
  AnalyzeOptions,
  AnalyzeResult,
  TagSuggestion,
  ProviderCapabilities,
  RecommendationStrategy,
  DetectedObject,
  ColorPalette,
} from './types';
