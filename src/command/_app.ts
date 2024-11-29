import { z } from 'zod'
import { createCommandRouter, CommandFactory } from './_utils'
import type { Command } from './_utils'
import { commandGenerateCode } from './generateCode'

/**
 * exported command router.
 * 
 * @type (message: ICommand, sendResponse: SendResponse) => Promise<void>
 */
export const commandRouter = createCommandRouter(getHandlers)

/**
 * Client JS から `vscode.postMessage()` で呼び出し可能なコマンド (APIs) の定義.
 *
 * @returns handlers by command names.
 */
function getHandlers(): Command[] {
  return [
    // コード生成のコマンド.
    CommandFactory
      .command('generateCode')
      .input(z.object({
        userPrompt: z.string(),
      }))
      .query(async (message) => {
        const result = await commandGenerateCode(message.params.userPrompt)

        // send response.
        return result
      }),
  ]
}
