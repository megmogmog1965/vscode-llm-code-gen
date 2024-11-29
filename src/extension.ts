import * as vscode from 'vscode'
import { commandRouter } from './command/_app'

/**
 * これが Extension のルート.
 * @param context この VSCode Context に対して Webview Panel とかを登録する.
 */
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('vscode-llm-code-gen.codegen', () => {
      // create webview panel.
      const panel = vscode.window.createWebviewPanel(
        'vscode-llm-code-gen',
        'vscode-llm-code-gen',
        vscode.ViewColumn.One,
        {
          localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'webview', 'dist')],
          enableScripts: true,  // with CSP.
          retainContextWhenHidden: true,  // https://code.visualstudio.com/api/extension-guides/webview#retaincontextwhenhidden
        },
      )

      // load script file.
      const scriptPath = vscode.Uri.joinPath(context.extensionUri, 'webview', 'dist', 'assets', 'index.js')
      const script = panel.webview.asWebviewUri(scriptPath)

      // load css file.
      const cssPath = vscode.Uri.joinPath(context.extensionUri, 'webview', 'dist', 'assets', 'index.css')
      const css = panel.webview.asWebviewUri(cssPath)

      // show webview html.
      panel.webview.html = getWebviewContent(panel.webview.cspSource, script, css)

      // handle ALL messages from the webview.
      panel.webview.onDidReceiveMessage(
        message => commandRouter(
          message as { command: string, params: object },
          res => panel.webview.postMessage(res),
        ),
        undefined,
        context.subscriptions,
      )
    }),
  )
}

/**
 * Webview の HTML を返す.
 *
 * @param cspSource CSP のソース.
 * @param script Webview のスクリプトの URI.
 * @param css Webview の CSS の URI.
 * @returns Webview の HTML.
 */
function getWebviewContent(cspSource: string, script: vscode.Uri, css: vscode.Uri) {
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; img-src ${cspSource} https:; script-src ${cspSource}; style-src ${cspSource};"
    />
    <title>Vite + React + TS</title>
    <script type="module" crossorigin src="${script.toString()}"></script>
    <link rel="stylesheet" crossorigin href="${css.toString()}">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`.trim()
}