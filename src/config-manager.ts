import * as fs from 'fs';
import * as path from 'path';

export interface Config {
  githubToken?: string;
  defaultDepth: number;
  outputFormat: 'table' | 'json' | 'web';
  databasePath: string;
}

export class ConfigManager {
  private configPath: string;
  private config: Config;

  constructor() {
    this.configPath = path.join(process.cwd(), 'oss-health-config.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): Config {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf-8');
        return JSON.parse(configData);
      }
    } catch {
      console.warn('Warning: Could not load config file, using defaults');
    }

    return this.getDefaultConfig();
  }

  private getDefaultConfig(): Config {
    return {
      defaultDepth: 6,
      outputFormat: 'table',
      databasePath: path.join(process.cwd(), 'health-data.db')
    };
  }

  public getConfig(): Config {
    return this.config;
  }

  public getGitHubToken(): string {
    return this.config.githubToken || process.env.GITHUB_TOKEN || '';
  }

  public setGitHubToken(token: string): void {
    this.config.githubToken = token;
    this.saveConfig();
  }

  public saveConfig(): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  public updateConfig(updates: Partial<Config>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }
}