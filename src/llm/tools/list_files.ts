import path from 'path'
import { findTargetFiles, pathOfWorkspace } from '../../util/utils'

/**
 * @param dirPath これは対象ディレクトリの相対パス.
 * @returns (一貫性がないが) ここではルートからの絶対パスのファイルパス一覧を返す.
 */
export async function listFiles(dirPath: string): Promise<string[]> {
  // glob pattern.
  const workspacePath = pathOfWorkspace()
  const globPattern = path.join(workspacePath.fsPath, dirPath, '**', '*')

  const paths = await findTargetFiles(
    [globPattern],
    ['node_modules/**'],
    false,
  )

  return paths
}
