import { generateCode } from '../llm/generateCode'

/**
 * Generate code COMMAND.
 *
 * @param userPrompt - The user prompt.
 * @returns The last response message from the AI.
 */
export async function commandGenerateCode(userPrompt: string) {
  return await generateCode(userPrompt)
}
