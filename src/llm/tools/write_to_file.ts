import fs from 'fs'
import path from 'path'
import { pathOfWorkspace } from '../../util/utils'

/**
 * Write to a file.
 *
 * @param filePath - ワークスペースからの相対パス.
 * @param content - ファイルに書き込む内容.
 * @returns AI 向けのメッセージ応答 (結果).
 */
export async function writeToFile(filePath: string, content: string): Promise<string> {
  const workspacePath = pathOfWorkspace()
  fs.writeFileSync(path.join(workspacePath.fsPath, filePath), content)

  return 'The file was written successfully.'
}
