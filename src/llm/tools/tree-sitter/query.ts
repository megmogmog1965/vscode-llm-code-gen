/**
 * tree-sitter で構文解析をした後に、定義名（クラス名、メソッド名、関数名...）だけを取得するためのクエリ.
 */
export const TypeScriptQuery = `
(function_signature) @function

(function_declaration) @function

(method_signature) @method

(method_definition) @method

(class_declaration) @class
`
