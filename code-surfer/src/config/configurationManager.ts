/**
 * Configuration Manager for Code Surfer
 * Handles rule configuration, severity settings, and user preferences
 */

import * as vscode from 'vscode'

export interface RuleConfig {
  enabled: boolean
  severity: 'info' | 'warning' | 'error'
  [key: string]: any // For rule-specific parameters
}

export interface RuleConfigSet {
  [ruleId: string]: RuleConfig
}

export class ConfigurationManager {
  private config: vscode.WorkspaceConfiguration

  constructor() {
    this.config = vscode.workspace.getConfiguration('codeSurfer')
  }

  /**
   * Refresh the configuration from VS Code settings
   */
  refresh(): void {
    this.config = vscode.workspace.getConfiguration('codeSurfer')
  }

  /**
   * Check if Code Surfer is enabled
   */
  isEnabled(): boolean {
    return this.config.get('enabled', true)
  }

  /**
   * Check if analysis should run on file save
   */
  analyzeOnSave(): boolean {
    return this.config.get('analyzeOnSave', true)
  }

  /**
   * Check if analysis should run on file open
   */
  analyzeOnOpen(): boolean {
    return this.config.get('analyzeOnOpen', true)
  }

  /**
   * Check if inline hints should be shown
   */
  showInlineHints(): boolean {
    return this.config.get('showInlineHints', true)
  }

  /**
   * Get rule configuration for a specific language
   */
  getRuleConfig(language: 'javascript' | 'python'): RuleConfigSet {
    const defaultConfigs = this.getDefaultRuleConfig(language)
    const userConfig = this.config.get(`rules.${language}`, {}) as any

    // Merge default and user configurations
    const merged: RuleConfigSet = {}

    // Start with defaults
    Object.keys(defaultConfigs).forEach((ruleId) => {
      merged[ruleId] = { ...defaultConfigs[ruleId] }
    })

    // Override with user settings
    Object.keys(userConfig).forEach((ruleId) => {
      if (merged[ruleId]) {
        merged[ruleId] = { ...merged[ruleId], ...userConfig[ruleId] }
      } else {
        merged[ruleId] = userConfig[ruleId]
      }
    })

    return merged
  }

  /**
   * Get the default rule configuration for a language
   */
  private getDefaultRuleConfig(
    language: 'javascript' | 'python'
  ): RuleConfigSet {
    if (language === 'javascript') {
      return {
        'unused-variable': { enabled: true, severity: 'warning' },
        'async-without-await': { enabled: true, severity: 'warning' },
        'long-function': { enabled: true, severity: 'info', maxLines: 50 },
      }
    } else if (language === 'python') {
      return {
        'missing-docstring': { enabled: true, severity: 'info' },
        'unused-variable': { enabled: true, severity: 'info' },
        'bare-except': { enabled: true, severity: 'warning' },
        'mutable-default-argument': { enabled: true, severity: 'warning' },
        'comparison-with-singleton': { enabled: true, severity: 'info' },
        'old-string-formatting': { enabled: true, severity: 'info' },
        'long-function': { enabled: true, severity: 'warning', maxLines: 50 },
        'high-complexity': {
          enabled: true,
          severity: 'warning',
          maxComplexity: 10,
        },
      }
    }

    return {}
  }

  /**
   * Check if a specific severity level should be shown
   */
  shouldShowSeverity(severity: 'info' | 'warning' | 'error'): boolean {
    return this.config.get(`severity.${severity}`, true)
  }

  /**
   * Get enabled rule IDs for a language
   */
  getEnabledRules(language: 'javascript' | 'python'): string[] {
    const ruleConfig = this.getRuleConfig(language)
    return Object.keys(ruleConfig).filter(
      (ruleId) => ruleConfig[ruleId].enabled
    )
  }

  /**
   * Get rule-specific parameter value
   */
  getRuleParameter(
    language: 'javascript' | 'python',
    ruleId: string,
    paramName: string,
    defaultValue: any
  ): any {
    const ruleConfig = this.getRuleConfig(language)
    return ruleConfig[ruleId]?.[paramName] ?? defaultValue
  }

  /**
   * Update a rule configuration
   */
  async updateRuleConfig(
    language: 'javascript' | 'python',
    ruleId: string,
    config: Partial<RuleConfig>
  ): Promise<void> {
    const currentConfig = this.getRuleConfig(language)
    const updatedConfig = {
      ...currentConfig,
      [ruleId]: { ...currentConfig[ruleId], ...config },
    }

    await this.config.update(
      `rules.${language}`,
      updatedConfig,
      vscode.ConfigurationTarget.Workspace
    )
    this.refresh()
  }

  /**
   * Reset rule configuration to defaults
   */
  async resetRuleConfig(language: 'javascript' | 'python'): Promise<void> {
    await this.config.update(
      `rules.${language}`,
      undefined,
      vscode.ConfigurationTarget.Workspace
    )
    this.refresh()
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): string[] {
    return [
      'javascript',
      'typescript',
      'javascriptreact',
      'typescriptreact',
      'python',
    ]
  }

  /**
   * Map VS Code language ID to our internal language ID
   */
  mapLanguageId(languageId: string): 'javascript' | 'python' {
    switch (languageId) {
      case 'javascript':
      case 'typescript':
      case 'javascriptreact':
      case 'typescriptreact':
        return 'javascript'
      case 'python':
        return 'python'
      default:
        return 'javascript'
    }
  }

  /**
   * Create a command to open settings for a specific rule
   */
  async openRuleSettings(
    language: 'javascript' | 'python',
    ruleId?: string
  ): Promise<void> {
    const settingKey = ruleId
      ? `codeSurfer.rules.${language}.${ruleId}`
      : `codeSurfer.rules.${language}`

    await vscode.commands.executeCommand(
      'workbench.action.openSettings',
      settingKey
    )
  }
}
