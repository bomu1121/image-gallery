import type { AIVisionProvider, AnalyzeOptions, AnalyzeResult } from '../types';

export function createProvider(config: any): AIVisionProvider {
  return {
    id: 'google',
    name: 'Google Vision API',
    capabilities: {
      maxTags: 20,
      supportsBatching: false,
      supportsObjectDetection: true,
      supportsColorAnalysis: true,
      maxImageSize: 10 * 1024 * 1024,
    },
    async analyze(imageBase64: string, options?: AnalyzeOptions): Promise<AnalyzeResult> {
      console.warn('Google Vision API provider not yet implemented');
      return {
        tags: [],
        description: '',
        objects: [],
        colors: { dominant: [], accent: [] },
      };
    },
  };
}