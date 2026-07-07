import type { AIVisionProvider, AnalyzeOptions, AnalyzeResult } from '../types';

export function createProvider(config: any): AIVisionProvider {
  return {
    id: 'openai',
    name: 'OpenAI GPT-4 Vision',
    capabilities: {
      maxTags: 20,
      supportsBatching: false,
      supportsObjectDetection: true,
      supportsColorAnalysis: true,
      maxImageSize: 10 * 1024 * 1024,
    },
    async analyze(imageBase64: string, options?: AnalyzeOptions): Promise<AnalyzeResult> {
      console.warn('OpenAI GPT-4 Vision provider not yet implemented');
      return {
        tags: [],
        description: '',
        objects: [],
        colors: { dominant: [], accent: [] },
      };
    },
  };
}