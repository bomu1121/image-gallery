export interface TagSuggestion {
  name: string;
  confidence: number;
  source: 'ai' | 'similarity' | 'semantic' | 'visual';
}

export interface DetectedObject {
  label: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface ColorPalette {
  dominant: string[];
  accent: string[];
}

export interface ProviderCapabilities {
  maxTags: number;
  supportsBatching: boolean;
  supportsObjectDetection: boolean;
  supportsColorAnalysis: boolean;
  maxImageSize: number;
}

export type RecommendationStrategy =
  | 'ai-direct'
  | 'similarity-match'
  | 'semantic'
  | 'visual-similarity';

export interface AnalyzeOptions {
  maxTags?: number;
  language?: 'zh' | 'en';
  existingTags?: string[];
  strategy?: RecommendationStrategy;
  prompt?: string;
}

export interface AnalyzeResult {
  tags: TagSuggestion[];
  description: string;
  objects: DetectedObject[];
  colors: ColorPalette;
  rawResponse?: unknown;
}

export interface AIVisionProvider {
  readonly id: string;
  readonly name: string;
  readonly capabilities: ProviderCapabilities;
  analyze(imageBase64: string, options?: AnalyzeOptions): Promise<AnalyzeResult>;
}
