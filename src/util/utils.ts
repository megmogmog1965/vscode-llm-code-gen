import { glob } from 'glob'
import { dirname } from 'path'
import * as vscode from 'vscode'

/**
 * 本 VSCode Extension Project のルート.
 *
 * NOTE: ワークスペースのルートではないよ！！
 */
export const rootDir = dirname(dirname(__dirname))

/**
 * ワークスペースのルートを返す.
 *
 * @param children ワークスペースのルートからのパス.
 * @returns ワークスペースのルート.
 */
export function pathOfWorkspace(children: string[] = []): vscode.Uri {
  if (vscode.workspace.workspaceFolders === undefined) {
    // return undefined
    throw new Error('Workspace path not found')
  }

  return vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, ...children)
}

/**
 * find all target files.
 * 
 * NOTE: `blobIncludes` が相対か絶対かによって、変える結果も相対・絶対がブレるので注意.
 *
 * @param {string[]} blobIncludes e.g. `*.{js,mjs,cjs,ts,tsx}`
 * @param {string[]} blobExcludes e.g. `node_modules/**`, `dist/**`
 * @param {boolean} dot false = ignores files start with dot.
 * @returns {Promise<string[]>} a list of file paths.
 */
export async function findTargetFiles(
  blobIncludes: string[],
  blobExcludes: string[],
  dot: boolean,
): Promise<string[]> {
  const workspaceRoot = pathOfWorkspace()
  const paths = await glob(
    blobIncludes,
    {
      nodir: true,
      ignore: blobExcludes,
      dot: dot,
      cwd: workspaceRoot.fsPath,
    },
  )

  return paths.sort()
}