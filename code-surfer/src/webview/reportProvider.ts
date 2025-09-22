import * as vscode from 'vscode'
import { AnalysisReport, AnalysisResult, IssueCategory } from '../types'

/**
 * Provides the Code Surfer Report webview
 */
export class CodeSurferReportProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'codeSurferReport'

  private _view?: vscode.WebviewView
  private _currentReport?: AnalysisReport

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    console.log('🌐 Code Surfer webview being resolved...')
    this._view = webviewView

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    }

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview)
    console.log('✅ Code Surfer webview HTML set')

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case 'goToIssue': {
          this._goToIssue(data.result)
          break
        }
      }
    })
  }

  /**
   * Update the webview with a new analysis report
   */
  public updateReport(report: AnalysisReport): void {
    console.log('📊 ReportProvider.updateReport called')
    console.log('📄 Report file:', report.filePath)
    console.log('🔢 Report results count:', report.results.length)
    console.log('🌐 Webview available:', !!this._view)

    this._currentReport = report
    if (this._view) {
      console.log('📤 Posting message to webview...')
      this._view.webview.postMessage({
        type: 'updateReport',
        report: report,
      })
      console.log('✅ Message posted to webview')
    } else {
      console.log('⚠️ No webview available to update')
    }
  }

  /**
   * Clear the current report
   */
  public clearReport(): void {
    this._currentReport = undefined
    if (this._view) {
      this._view.webview.postMessage({
        type: 'clearReport',
      })
    }
  }

  private _goToIssue(result: AnalysisResult): void {
    if (this._currentReport) {
      vscode.workspace
        .openTextDocument(vscode.Uri.file(this._currentReport.filePath))
        .then((doc) => {
          vscode.window.showTextDocument(doc).then((editor) => {
            const position = new vscode.Position(
              result.range.start.line,
              result.range.start.character
            )
            const range = new vscode.Range(
              position,
              new vscode.Position(
                result.range.end.line,
                result.range.end.character
              )
            )
            editor.selection = new vscode.Selection(position, position)
            editor.revealRange(
              range,
              vscode.TextEditorRevealType.InCenterIfOutsideViewport
            )
          })
        })
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Surfer Report</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            font-weight: var(--vscode-font-weight);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 10px;
            margin: 0;
        }
        
        .header {
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        
        .no-issues {
            color: var(--vscode-descriptionForeground);
            font-style: italic;
            text-align: center;
            padding: 20px;
        }
        
        .category {
            margin-bottom: 20px;
        }
        
        .category-header {
            font-weight: bold;
            margin-bottom: 8px;
            padding: 5px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .category-header.potential-issue {
            color: var(--vscode-errorForeground);
        }
        
        .category-header.code-smell {
            color: var(--vscode-warningForeground);
        }
        
        .category-header.suggestion {
            color: var(--vscode-infoForeground);
        }
        
        .issue {
            background-color: var(--vscode-list-hoverBackground);
            border-left: 3px solid var(--vscode-panel-border);
            padding: 8px;
            margin-bottom: 8px;
            cursor: pointer;
            border-radius: 3px;
        }
        
        .issue:hover {
            background-color: var(--vscode-list-activeSelectionBackground);
        }
        
        .issue.error {
            border-left-color: var(--vscode-errorForeground);
        }
        
        .issue.warning {
            border-left-color: var(--vscode-warningForeground);
        }
        
        .issue.info {
            border-left-color: var(--vscode-infoForeground);
        }
        
        .issue-message {
            font-weight: 500;
            margin-bottom: 4px;
        }
        
        .issue-details {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
        }
        
        .issue-suggestion {
            font-size: 0.85em;
            color: var(--vscode-textPreformat-foreground);
            background-color: var(--vscode-textBlockQuote-background);
            padding: 4px 8px;
            border-radius: 3px;
            margin-top: 6px;
        }
        
        .file-info {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 10px;
        }
        
        #fileName {
            font-weight: bold;
            color: var(--vscode-foreground);
            margin-bottom: 4px;
        }
        
        #languageInfo {
            font-weight: 500;
            color: var(--vscode-textLink-foreground);
            margin-bottom: 2px;
        }
        
        #analysisStats {
            font-size: 0.8em;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="header">
        <h3>🏄‍♂️ Code Surfer Report</h3>
        <div class="file-info" id="fileInfo">
            <div id="fileName">No file analyzed</div>
            <div id="languageInfo"></div>
            <div id="analysisStats"></div>
        </div>
    </div>
    
    <div id="content">
        <div class="no-issues">
            📄 Open a JavaScript, TypeScript, or Python file to see analysis results
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
                case 'updateReport':
                    updateReport(message.report);
                    break;
                case 'clearReport':
                    clearReport();
                    break;
            }
        });
        
        function updateReport(report) {
            const fileNameEl = document.getElementById('fileName');
            const languageInfoEl = document.getElementById('languageInfo');
            const analysisStatsEl = document.getElementById('analysisStats');
            const content = document.getElementById('content');
            
            const fileName = report.filePath.split(/[\\\\/]/).pop();
            fileNameEl.textContent = fileName;
            
            // Show language with appropriate icon
            const languageIcons = {
                'javascript': '📜 JavaScript',
                'typescript': '📘 TypeScript', 
                'javascriptreact': '⚛️ React (JS)',
                'typescriptreact': '⚛️ React (TS)',
                'python': '🐍 Python'
            };
            languageInfoEl.textContent = languageIcons[report.language] || \`📄 \${report.language}\`;
            
            // Show analysis statistics
            const stats = \`\${report.results.length} issue(s) found • Analyzed \${new Date(report.timestamp).toLocaleTimeString()}\`;
            analysisStatsEl.textContent = stats;
            
            if (report.results.length === 0) {
                content.innerHTML = '<div class="no-issues">✅ No issues found! Your code looks great.</div>';
                return;
            }
            
            // Group results by category
            const categories = {
                'potential-issue': { name: '🚩 Potential Issues', results: [] },
                'code-smell': { name: '⚠️ Code Smells', results: [] },
                'suggestion': { name: '💡 Suggestions', results: [] }
            };
            
            report.results.forEach(result => {
                categories[result.category].results.push(result);
            });
            
            let html = '';
            
            Object.entries(categories).forEach(([key, category]) => {
                if (category.results.length > 0) {
                    html += \`
                        <div class="category">
                            <div class="category-header \${key}">\${category.name} (\${category.results.length})</div>
                            \${category.results.map(result => createIssueHTML(result)).join('')}
                        </div>
                    \`;
                }
            });
            
            content.innerHTML = html;
        }
        
        function createIssueHTML(result) {
            const line = result.range.start.line + 1;
            const char = result.range.start.character + 1;
            
            return \`
                <div class="issue \${result.severity}" onclick="goToIssue('\${result.id}', \${JSON.stringify(result).replace(/"/g, '&quot;')})">
                    <div class="issue-message">\${result.message}</div>
                    <div class="issue-details">Line \${line}, Column \${char}</div>
                    \${result.suggestion ? \`<div class="issue-suggestion">💡 \${result.suggestion}</div>\` : ''}
                </div>
            \`;
        }
        
        function goToIssue(id, result) {
            vscode.postMessage({
                type: 'goToIssue',
                result: JSON.parse(result)
            });
        }
        
        function clearReport() {
            const content = document.getElementById('content');
            const fileInfo = document.getElementById('fileInfo');
            
            fileInfo.textContent = 'No file analyzed';
            content.innerHTML = '<div class="no-issues">📄 Open a JavaScript or TypeScript file to see analysis results</div>';
        }
    </script>
</body>
</html>`
  }
}
