import { MessageParam } from '@anthropic-ai/sdk/resources/messages'
import { ToolUseBlockParam } from '@anthropic-ai/sdk/resources/messages'
import { listCodeDefinitionNames } from './list_code_definition_names'
import { readFile } from './read_file'
import { writeToFile } from './write_to_file'
import { searchFiles } from './search_files'
import { listFiles } from './list_files'

/**
 * Anthropic API 応答が `type.tool_use` の場合に、ツールを呼び出して結果応答のコンテキストを作る.
 *
 * @param toolUse - The tool use.
 * @returns The context of tool use result.
 */
export async function callTool(toolUse: ToolUseBlockParam): Promise<MessageParam> {
  const tools: { [toolName: string]: (input: any) => Promise<string> } = {  // eslint-disable-line @typescript-eslint/no-explicit-any
    list_files: async (input: { path: string }) => {
      return (await listFiles(input.path)).join('\n')
    },

    search_files: async (input: { path: string, regex: string, file_pattern: string }) => {
      return (await searchFiles(input.path, input.regex, input.file_pattern)).join('\n')
    },

    list_code_definition_names: async (input: { path: string }) => {
      return (await listCodeDefinitionNames(input.path))
    },

    read_file: async (input: { file_path: string }) => {
      return (await readFile(input.file_path))
    },

    write_to_file: async (input: { file_path: string, content: string }) => {
      return (await writeToFile(input.file_path, input.content))
    },
  }

  // select tool.
  const tool = tools[toolUse.name]
  if (!tool) {
    throw new Error(`tool not found: ${toolUse.name}`)
  }

  // call tool.
  const content = await tool(toolUse.input)

  return {
    role: 'user',
    content: [{
      type: 'tool_result',
      tool_use_id: toolUse.id,
      content,
    }],
  }
}