import * as fs from 'fs/promises'
import * as path from 'path'
import Parser, { QueryCapture } from 'web-tree-sitter'
import { pathOfWorkspace, rootDir } from '../../../util/utils'
import { TypeScriptQuery } from './query'
import { listFiles } from '../list_files'

/**
 * 拡張子毎の構文解析器.
 */
interface AstQueries {
  [key: string]: AstQuery
}

/**
 * 構文解析器.
 */
class AstQuery {
  private parser: Parser
  private query: Parser.Query

  constructor(parser: Parser, query: Parser.Query) {
    this.parser = parser
    this.query = query
  }

  /**
   * ソースコードの定義を構文解析して、そのキャプチャ結果（クラス名、メソッド名、関数名）だけを返す.
   *
   * @param fileContent 解析するソースコード本文.
   * @returns キャプチャ結果.（クラス名、メソッド名、関数名）
   */
  captures(fileContent: string): QueryCapture[] {
    const tree = this.parser.parse(fileContent)
    const captures = this.query
      .captures(tree.rootNode)
      .sort((a, b) => a.node.startPosition.row - b.node.startPosition.row)

    return captures
  }
}

/**
 * ソースコードの定義を解析して、その結果（クラス名、メソッド名、関数名...）を返す.
 *
 * @param dirPath 解析するディレクトリのパス. これは対象ディレクトリの相対パス.
 * @returns 解析結果.（クラス名、メソッド名、関数名...）
 */
export async function parseCodesFrom(dirPath: string): Promise<string> {
  const asts = await loadParsers()
  const allFiles = await listFiles(dirPath)
  let result = ''

  for (const file of allFiles) {
    const definitions = await parseFile(file, asts)

    if (definitions) {
      // <file> tag.
      const fileTag = '  <file>\n'
        + `    <path>${path.relative(pathOfWorkspace().fsPath, file)}</path>\n`  // FIXME: XMLエスケープ処理してない.
        + `    <definitions>\n${definitions}    </definitions>\n`
        + '  </file>\n'

      result += fileTag
    }
  }

  return result ? `<files>\n${result}</files>` : 'ソースコード定義が見つかりません.'
}

/**
 * .wasm をロードして、構文解析器を返す.
 *
 * @returns コードのファイル拡張子毎の構文解析器のマップ.
 */
async function loadParsers(): Promise<AstQueries> {
  const loadTsParser = async () => {
    const wasmPath = path.join(pathOfWasmDir(), 'tree-sitter-typescript.wasm')
    const lang = await Parser.Language.load(wasmPath)

    const parser = new Parser()
    parser.setLanguage(lang)
    const query = lang.query(TypeScriptQuery)

    return new AstQuery(parser, query)
  }

  await Parser.init()

  // FIXME: 本来は入力ファイルに応じた言語のパーサーのみを返すようにすべき. 面倒なので今は全部を返している.
  return {
    ts: await loadTsParser(),
    tsx: await loadTsParser(),
  }
}

/**
 * @returns The path to the wasm directory.
 */
export function pathOfWasmDir(): string {
  const dir = path.join(rootDir, 'wasm')
  return dir
}

/**
 * ソースコードの定義を構文解析して、そのキャプチャ結果（クラス名、メソッド名、関数名）の XML tags を返す.
 *
 * @param filePath 解析するソースコードのパス.
 * @param asts 拡張子毎の構文解析器のマップ.
 * @returns e.g. `<class>className</class>\n<method>methodName</method>\n<function>functionName</function>\n`
 */
async function parseFile(filePath: string, asts: AstQueries): Promise<string | undefined> {
  const fileContent = await fs.readFile(filePath, 'utf8')
  const ext = path.extname(filePath).toLowerCase().slice(1)

  const ast = asts[ext]
  if (ast === undefined) {
    return undefined
  }

  const captures = ast.captures(fileContent)

  const definitions = captures.reduce((pre, capture) => {
    const posLf = capture.node.text.indexOf('\n')
    const line = capture.node.text.substring(0, (posLf > 0) ? posLf : capture.node.text.length)
    const tag = capture.name

    // <{function|method|class}> tag.
    return pre + `      <${tag}>${line}</${tag}>\n`  // FIXME: XMLエスケープ処理してない.
  }, '')

  return definitions.length > 0 ? definitions : undefined
}
