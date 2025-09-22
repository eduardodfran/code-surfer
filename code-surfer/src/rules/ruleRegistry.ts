import { AnalysisEngine } from '../analysisEngine'
import { UnusedVariableRule } from './unusedVariableRule'
import { AsyncWithoutAwaitRule } from './asyncWithoutAwaitRule'
import { LongFunctionRule } from './longFunctionRule'

/**
 * Registry for all analysis rules
 */
export class RuleRegistry {
  static registerAllRules(engine: AnalysisEngine): void {
    // Register all available rules
    engine.registerRule(new UnusedVariableRule(engine))
    engine.registerRule(new AsyncWithoutAwaitRule(engine))
    engine.registerRule(new LongFunctionRule(engine))
  }

  static getDefaultEnabledRules(): string[] {
    return ['unused-variable', 'async-without-await', 'long-function']
  }
}
