import fs from 'fs'
import path from 'path'
import { pathOfWorkspace } from '../../util/utils'

/**
 * Read a file.
 *
 * @param filePath - ワークスペースからの相対パス.
 * @returns ファイルの内容.
 */
export async function readFile(filePath: string): Promise<string> {
  const workspacePath = pathOfWorkspace()
  const content = fs.readFileSync(path.join(workspacePath.fsPath, filePath), 'utf-8')

  return content
}
