// https://docs.anthropic.com/ja/docs/build-with-claude/tool-use
import fs from 'fs'
import path from 'path'
import Anthropic from '@anthropic-ai/sdk'
import { pathOfWorkspace } from '../util/utils'
import { Message, MessageParam } from '@anthropic-ai/sdk/resources/messages'
import { callTool } from './tools'

// singleton client.
const anthropic = new Anthropic()

/**
 * Generate code.
 *
 * NOTE: この関数内では再帰的に生成 AI を呼び出します.
 * NOTE: 結果は tool `write_to_file` で直接ファイルに書き込まれます.
 *
 * @param userPrompt - The user prompt.
 * @returns 最後の生成 AI の応答メッセージ.
 */
export async function generateCode(userPrompt: string) {
  // first context.
  const contexts: MessageParam[] = [{
    role: 'user',
    content: userPrompt,
  }]

  // call first time.
  let res = await callAnthropic(contexts)
  let toolUseContent = res.content.find((content) => content.type === 'tool_use')

  // call recursively until no tool use.
  try {
    while (toolUseContent) {
      // push previous response.
      contexts.push({
        role: res.role,
        content: res.content,
      })

      // execute tool & create `tool_result` context.
      const toolResult = await callTool(toolUseContent)
      contexts.push(toolResult)

      // FIXME: logging...
      console.log(res)
      console.log(toolResult)

      // call anthropic.
      res = await callAnthropic(contexts)
      toolUseContent = res.content.find((content) => content.type === 'tool_use')
    }
  } finally {
    // FIXME: logging...
    console.log(res)
    loggingApiResult(contexts, res)
  }

  const content = res.content[0]
  if (content.type !== 'text') {
    throw new Error(`Unexpected response type: ${content.type}`)
  }

  return content.text
}

/**
 * デバッグ目的で、複数回 Anthropic API を呼び出した経過のログを `./_debug_api_calls.log` に出力する.
 *
 * @param message - The message.
 * @param response - The response.
 */
function loggingApiResult(message: MessageParam[], response: Message) {
  const workspacePath = pathOfWorkspace()
  const dstPath = path.join(workspacePath.fsPath, '_debug_api_calls.log')
  const dst = fs.openSync(dstPath, 'w')

  fs.writeSync(dst, JSON.stringify(message, null, '  '))
  fs.writeSync(dst, JSON.stringify(response, null, '  '))
  fs.closeSync(dst)
}

/**
 * Call Anthropic API.
 *
 * @param contexts - The contexts.
 * @returns The response.
 */
async function callAnthropic(contexts: MessageParam[]): Promise<Message> {
  const workspacePath = pathOfWorkspace()

  const res = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: 8192,  // 'max_tokens: 8192, which is the maximum allowed number of output tokens for claude-3-5-sonnet-20240620'
    temperature: 0,
    system: `
      あなたは TypeScript を用いたアプリケーションの開発に精通した AI エージェントです。
      あなたはユーザーが指示した内容に従ってソースコードを生成し、そのコードをファイルに書き込むことで、ユーザーが期待する機能を完成させて下さい。

      ユーザーは TypeScript 製のアプリケーションの開発を行っており、あなたはそのプロジェクトのワークスペースに tools でアクセスできます。
      あなたが、ソースコードを生成するにあたって必要な情報は tools で提供されます。

      一例として、次の手順でソースコードを分析し、コードを生成することができます。

      1. "list_files" ツールを使用して、ワークスペースの全てのファイルの一覧を取得します。最初の一度は必ずワークスペースのルートディレクトリを指定して下さい！
      2. 次に "list_code_definition_names" ツールを使用して、ソースコード中の定義名（関数名、クラス名、変数名、etc...）の一覧を取得します。
      3. コードのより詳細な内容を知りたい場合は "read_file" ツールを使用して、特定したファイルの内容を読み込みます。
      4. 読み込んだファイルの内容をもとに、ソースコードを生成します。
      5. 生成したソースコードをファイルに書き込むために "write_to_file" ツールを使用します。
      6. 他にも変更の必要なファイルがある場合は、再度 2〜5 の手順を踏んで下さい。
    `,
    tools: [
      {
        'name': 'list_files',
        'description': 'VSCode ワークスペースのルートディレクトリから再帰的にファイル一覧を取得します。',
        'input_schema': {
          'type': 'object',
          'properties': {
            'path': {
              'type': 'string',
              'description': `検索対象のディレクトリです。VSCode ワークスペースのルートディレクトリ "${workspacePath.fsPath}" からの相対パスで指定して下さい。`,
            },
          },
          'required': ['path'],
        },
      },
      {
        'name': 'list_code_definition_names',
        'description': '指定したディレクトリから再帰的にソースコードファイルを読み込み、定義名 (関数名、クラス名、変数名、etc...) の一覧を取得します。',
        'input_schema': {
          'type': 'object',
          'properties': {
            'path': {
              'type': 'string',
              'description': `検索対象のディレクトリです。VSCode ワークスペースのルートディレクトリ "${workspacePath.fsPath}" からの相対パスで指定して下さい。`,
            },
          },
          'required': ['path'],
        },
      },
      {
        'name': 'read_file',
        'description': '指定したパスのファイル内容を読み込んで返します。',
        'input_schema': {
          'type': 'object',
          'properties': {
            'file_path': {
              'type': 'string',
              'description': `対象ファイルのパスを指定します。VSCode ワークスペースのルートディレクトリ "${workspacePath.fsPath}" からの相対パスで指定して下さい。`,
            },
          },
          'required': ['file_path'],
        },
      },
      {
        'name': 'write_to_file',
        'description': '指定したパスのファイル内容の全文を書き換えます。',
        'input_schema': {
          'type': 'object',
          'properties': {
            'file_path': {
              'type': 'string',
              'description': `対象ファイルのパスを指定します。VSCode ワークスペースのルートディレクトリ "${workspacePath.fsPath}" からの相対パスで指定して下さい。`,
            },
            'content': {
              'type': 'string',
              'description': '書き換える内容を指定します。',
            },
          },
          'required': ['file_path', 'content'],
        },
      },
      {
        'name': 'search_files',
        'description': '指定したディレクトリから再帰的にソースコードファイルを読み込み、ファイルの内容が正規表現にマッチしたファイルパスの一覧を返します。',
        'input_schema': {
          'type': 'object',
          'properties': {
            'path': {
              'type': 'string',
              'description': `検索対象のディレクトリです。VSCode ワークスペースのルートディレクトリ "${workspacePath.fsPath}" からの相対パスで指定して下さい。`,
            },
            'regex': {
              'type': 'string',
              'description': '検索対象としたいファイル内容にマッチする正規表現を指定して下さい。 正規表現は JavaScript の正規表現形式とし、"new RegExp()" の第一引数に渡されます。',
            },
            'file_pattern': {
              'type': 'string',
              'description': '検索対象としたいファイル名のパターンを Glob パターンで指定して下さい。省略した場合は "*" とみなします。 e.g., "*.ts"',
            },
          },
          'required': ['path', 'regex'],
        },
      },
    ],
    messages: [
      ...contexts,
    ],
  })

  return res
}