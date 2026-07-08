import { describe, it, expect } from 'vitest';
import { createAIProvider, getAvailableProviders } from '../factory';

describe('AI Provider Factory', () => {
  it('should create an OpenAI provider', async () => {
    const provider = await createAIProvider('openai', { apiKey: 'test' });
    expect(provider.id).toBe('openai');
    expect(provider.name).toBe('OpenAI GPT-4 Vision');
  });

  it('should throw for unknown provider', async () => {
    await expect(createAIProvider('unknown', {})).rejects.toThrow('Unknown AI provider');
  });

  it('should list all available providers', () => {
    const providers = getAvailableProviders();
    expect(providers).toContain('openai');
    expect(providers).toContain('qwen');
    expect(providers.length).toBeGreaterThanOrEqual(9);
  });
});
