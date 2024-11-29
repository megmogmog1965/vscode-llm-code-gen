import { parseCodesFrom } from './tree-sitter'

/**
 * List code definition names.
 *
 * @param dirPath - ワークスペースからの相対パス.
 * @returns コード定義名のリスト.
 */
export async function listCodeDefinitionNames(dirPath: string): Promise<string> {
	return await parseCodesFrom(dirPath)
}
