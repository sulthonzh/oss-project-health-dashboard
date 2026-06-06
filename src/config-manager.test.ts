import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfigManager } from './config-manager';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

vi.mock('fs');
vi.mock('path');

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let mockExistsSync: jest.MockedFunction<typeof existsSync>;
  let mockReadFileSync: jest.MockedFunction<typeof readFileSync>;
  let mockWriteFileSync: jest.MockedFunction<typeof writeFileSync>;
  let mockJoin: jest.MockedFunction<typeof join>;

  beforeEach(() => {
    mockExistsSync = vi.mocked(existsSync);
    mockReadFileSync = vi.mocked(readFileSync);
    mockWriteFileSync = vi.mocked(writeFileSync);
    mockJoin = vi.mocked(join);

    // Setup mock path behavior
    mockJoin.mockImplementation((...args) => args.join('/'));

    configManager = new ConfigManager();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default config when no config file exists', () => {
      mockExistsSync.mockReturnValue(false);

      const manager = new ConfigManager();

      expect(mockExistsSync).toHaveBeenCalledWith(expect.stringContaining('config.json'));
      expect(manager.getConfig()).toEqual({
        busFactor: {
          threshold: 0.8,
          minContributors: 3,
          riskLevels: {
            low: 0.6,
            medium: 0.8,
            high: 1.0
          }
        },
        responseTime: {
          good: 24 * 60 * 60 * 1000, // 24 hours
          acceptable: 72 * 60 * 60 * 1000, // 72 hours
          poor: 168 * 60 * 60 * 1000, // 1 week
        },
        healthWeights: {
          busFactor: 0.3,
          diversity: 0.2,
          responseTime: 0.2,
          activity: 0.15,
          sustainability: 0.15,
        },
        output: {
          colors: true,
          compact: false,
          json: false,
          depth: 6, // months
        },
        analysis: {
          includeForks: false,
          includeArchived: false,
          minStargazers: 0,
          cache: true,
          cacheTTL: 3600000, // 1 hour
        }
      });
    });

    it('should load existing config when file exists', () => {
      const existingConfig = {
        busFactor: {
          threshold: 0.7,
          minContributors: 5,
        },
        responseTime: {
          good: 12 * 60 * 60 * 1000, // 12 hours
        },
        healthWeights: {
          busFactor: 0.4,
          diversity: 0.2,
        }
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(existingConfig));

      const manager = new ConfigManager();

      expect(manager.getConfig()).toEqual(existingConfig);
      expect(mockReadFileSync).toHaveBeenCalledWith(expect.stringContaining('config.json'), 'utf-8');
    });
  });

  describe('getBusFactorThreshold', () => {
    it('should return bus factor threshold from config', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({
        busFactor: {
          threshold: 0.75,
        }
      }));

      const manager = new ConfigManager();
      const result = manager.getBusFactorThreshold();

      expect(result).toBe(0.75);
    });

    it('should return default threshold when not specified', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({
        busFactor: {
          // threshold not specified
        }
      }));

      const manager = new ConfigManager();
      const result = manager.getBusFactorThreshold();

      expect(result).toBe(0.8); // default value
    });
  });

  describe('getResponseTimeThresholds', () => {
    it('should return response time thresholds from config', () => {
      const thresholds = {
        good: 12 * 60 * 60 * 1000,
        acceptable: 48 * 60 * 60 * 1000,
        poor: 168 * 60 * 60 * 1000,
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({
        responseTime: thresholds
      }));

      const manager = new ConfigManager();
      const result = manager.getResponseTimeThresholds();

      expect(result).toEqual(thresholds);
    });

    it('should use default thresholds when not specified', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({}));

      const manager = new ConfigManager();
      const result = manager.getResponseTimeThresholds();

      expect(result).toEqual({
        good: 24 * 60 * 60 * 1000,
        acceptable: 72 * 60 * 60 * 1000,
        poor: 168 * 60 * 60 * 1000,
      });
    });
  });

  describe('getHealthWeights', () => {
    it('should return health weights from config', () => {
      const weights = {
        busFactor: 0.4,
        diversity: 0.25,
        responseTime: 0.15,
        activity: 0.1,
        sustainability: 0.1,
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({
        healthWeights: weights
      }));

      const manager = new ConfigManager();
      const result = manager.getHealthWeights();

      expect(result).toEqual(weights);
    });

    it('should normalize weights that sum to more than 1', () => {
      const weights = {
        busFactor: 0.5,
        diversity: 0.5,
        responseTime: 0.5, // sum = 1.5
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({
        healthWeights: weights
      }));

      const manager = new ConfigManager();
      const result = manager.getHealthWeights();

      expect(result.busFactor).toBeCloseTo(0.333, 2);
      expect(result.diversity).toBeCloseTo(0.333, 2);
      expect(result.responseTime).toBeCloseTo(0.333, 2);
    });

    it('should use default weights when not specified', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({}));

      const manager = new ConfigManager();
      const result = manager.getHealthWeights();

      expect(result).toEqual({
        busFactor: 0.3,
        diversity: 0.2,
        responseTime: 0.2,
        activity: 0.15,
        sustainability: 0.15,
      });
    });
  });

  describe('updateConfig', () => {
    it('should update configuration and save to file', () => {
      const newConfig = {
        busFactor: {
          threshold: 0.9,
        },
        responseTime: {
          good: 6 * 60 * 60 * 1000,
        }
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({}));

      configManager.updateConfig(newConfig);

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('config.json'),
        JSON.stringify({ ...configManager.getConfig(), ...newConfig }, null, 2),
        'utf-8'
      );
    });

    it('should merge new config with existing config', () => {
      const existingConfig = {
        busFactor: { threshold: 0.7 },
        responseTime: { good: 24 * 60 * 60 * 1000 },
        healthWeights: { busFactor: 0.3 }
      };

      const newConfig = {
        busFactor: { threshold: 0.9 },
        responseTime: { acceptable: 48 * 60 * 60 * 1000 }
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(existingConfig));

      configManager.updateConfig(newConfig);

      const updatedConfig = configManager.getConfig();
      expect(updatedConfig.busFactor.threshold).toBe(0.9);
      expect(updatedConfig.responseTime.good).toBe(24 * 60 * 60 * 1000); // preserved
      expect(updatedConfig.responseTime.acceptable).toBe(48 * 60 * 60 * 1000); // added
      expect(updatedConfig.healthWeights.busFactor).toBe(0.3); // preserved
    });
  });

  describe('resetToDefaults', () => {
    it('should reset configuration to defaults', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({
        busFactor: { threshold: 0.9 }
      }));

      configManager.resetToDefaults();

      const config = configManager.getConfig();
      expect(config.busFactor.threshold).toBe(0.8); // default
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('config.json'),
        expect.stringContaining('threshold": 0.8'),
        'utf-8'
      );
    });
  });

  describe('saveConfig', () => {
    it('should save configuration to file', () => {
      const config = {
        busFactor: { threshold: 0.85 },
        responseTime: { good: 18 * 60 * 60 * 1000 }
      };

      configManager.saveConfig(config);

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('config.json'),
        JSON.stringify(config, null, 2),
        'utf-8'
      );
    });
  });

  describe('validateConfig', () => {
    it('should validate valid configuration', () => {
      const validConfig = {
        busFactor: { threshold: 0.8 },
        responseTime: { good: 24 * 60 * 60 * 1000 },
        healthWeights: { busFactor: 0.3, diversity: 0.2 }
      };

      const result = configManager.validateConfig(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid bus factor threshold', () => {
      const invalidConfig = {
        busFactor: { threshold: 1.5 }, // > 1
      };

      const result = configManager.validateConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Bus factor threshold must be between 0 and 1');
    });

    it('should detect invalid health weights', () => {
      const invalidConfig = {
        healthWeights: {
          busFactor: -0.1, // < 0
          diversity: 0.2,
        }
      };

      const result = configManager.validateConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Health weights must be between 0 and 1');
    });

    it('should detect missing required fields', () => {
      const incompleteConfig = {
        // Missing required fields
      };

      const result = configManager.validateConfig(incompleteConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});