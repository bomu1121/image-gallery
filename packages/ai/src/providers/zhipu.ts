import type { AIVisionProvider, AnalyzeOptions, AnalyzeResult } from '../types';

export function createProvider(config: any): AIVisionProvider {
  return {
    id: 'zhipu',
    name: 'Zhipu GLM-4V',
    capabilities: {
      maxTags: 20,
      supportsBatching: false,
      supportsObjectDetection: true,
      supportsColorAnalysis: true,
      maxImageSize: 10 * 1024 * 1024,
    },
    async analyze(imageBase64: string, options?: AnalyzeOptions): Promise<AnalyzeResult> {
      console.warn('Zhipu GLM-4V provider not yet implemented');
      return {
        tags: [],
        description: '',
        objects: [],
        colors: { dominant: [], accent: [] },
      };
    },
  };
}