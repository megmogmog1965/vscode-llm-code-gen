import { useState } from 'react'

function App() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState('')

  // button click handler.
  const onGenerateCode = () => {
    const vscode = acquireVsCodeApi()

    vscode.postMessage({
      command: 'generateCode',
      params: {
        userPrompt: prompt,
      },
    })
  }

  // receive response handler.
  window.addEventListener('message', event => {
    const message = event.data

    const eventHandlers: { [key: string]: () => void } = {
      generateCode: () => {
        setResult(message.result)
      },
    }

    const handler = eventHandlers[message.command]
    if (handler) {
      handler()
    }
  })

  return (
    <>
      <textarea
        className="w-full h-20 border-2 border-red-500 rounded-md m-2 p-5 space-y-2"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button
        className="bg-blue-500 text-white p-2 rounded-md"
        onClick={() => onGenerateCode()}
      >
        コードを生成する
      </button>

      <textarea
        className="w-full h-80 border-2 border-red-500 rounded-md m-2 p-5 space-y-2"
        value={result}
      />
    </>
  )
}

export default App
