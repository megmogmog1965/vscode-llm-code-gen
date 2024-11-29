import fs from 'fs'
import path from 'path'
import { findTargetFiles, pathOfWorkspace } from '../../util/utils'

/**
 * Search files by regex.
 *
 * @param dirPath - ワークスペースからの相対パス.
 * @param regex - ファイルの内容をフィルタリングするための正規表現.
 * @param filePattern - ファイルパターン. e.g. `*.ts`
 * @returns マッチしたファイルのリスト.
 */
export async function searchFiles(
  dirPath: string,
  regex: string,
  filePattern: string = '*',
): Promise<string[]> {
  // glob pattern.
  const workspacePath = pathOfWorkspace()
  const globPattern = path.join(workspacePath.fsPath, dirPath, '**', filePattern)

  // list all files in the directory.
  const paths = await findTargetFiles(
    [globPattern],
    ['node_modules/**'],
    false,
  )

  // search files by regex.
  const matchedFiles = await filterFilesByRegex(paths, new RegExp(regex, 'g'))

  return matchedFiles
}

/**
 * Filter files by regex.
 *
 * @param paths - The paths.
 * @param regex - The regex.
 * @returns The matched files.
 */
async function filterFilesByRegex(paths: string[], regex: RegExp): Promise<string[]> {
  const matchedFiles = paths.filter((filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8')
    return regex.test(content)
  })

  return matchedFiles
}
