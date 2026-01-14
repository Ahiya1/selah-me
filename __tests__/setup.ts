import { vi, beforeEach, afterEach } from 'vitest';

// Mock environment variables
beforeEach(() => {
  vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test-key-for-testing');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
