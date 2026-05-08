# Air-Parser

V16 JSエンジン向けの軽量HTML5パーサーです。  
ブラウザDOMは生成せず、`child` / `parent` / `id` / `class` を中心とした `JSObj` を生成します。

## Features

- HTML文字列を要素ツリーへ変換（コメント/doctypeは無視）
- 各ノードに `parent`, `child`, `id`, `class` を保持
- `script` / `style` 等のraw text要素を安全にスキップ
- V16へ渡しやすいJSON形式に変換

## Install

```bash
npm install
```

## Usage

### CLI

```bash
# HTMLファイルをJSObjへ変換
npm start -- --html ./sample.html --out ./tree.json

# V16 input向けJSONを生成（既定キー: airdoc）
npm start -- --html ./sample.html --v16-input --out ./input.json
```

オプション:

- `--html <path>`: 入力HTMLファイル
- `--out <path>`: 出力ファイル（省略時はstdout）
- `--pretty`: 整形JSONで出力
- `--v16-input`: `{ airdoc: <JSObj> }` 形式で出力
- `--key <name>`: `--v16-input` 時の格納キー名（既定 `airdoc`）

### JS API

```js
import { parseHTMLToJSObj, toV16InputObject } from "./src/index.js";

const tree = parseHTMLToJSObj("<div id='app' class='root main'></div>");
const v16Input = toV16InputObject(tree, { key: "airdoc" });
```

## JSObj Format

```json
{
  "version": "air-jsobj/1",
  "root": 0,
  "nodes": [
    {
      "index": 0,
      "tag": "#document",
      "parent": null,
      "child": [1],
      "id": null,
      "class": []
    },
    {
      "index": 1,
      "tag": "div",
      "parent": 0,
      "child": [],
      "id": "app",
      "class": ["root", "main"]
    }
  ]
}
```

## V16 Integration Example

```bash
# 1) Air-Parserでinput.jsonを作る
npm --prefix /Users/tomonori/Documents/GitHub/Air-Parser start -- \
  --html ./sample.html \
  --v16-input \
  --out ./input.json \
  --pretty

# 2) V16へ渡す
node /Users/tomonori/Documents/GitHub/V16/src/cli.js ./your-script.js -- \
  --input-file ./input.json
```
