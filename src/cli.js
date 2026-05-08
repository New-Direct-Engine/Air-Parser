#!/usr/bin/env node
import fs from "node:fs";
import { parseHTMLToJSObj, toV16InputObject } from "./parser.js";

function parseArgs(argv) {
  const args = {
    htmlPath: null,
    outPath: null,
    pretty: false,
    v16Input: false,
    key: "airdoc"
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--html") {
      args.htmlPath = argv[i + 1] || null;
      i += 1;
      continue;
    }
    if (token === "--out") {
      args.outPath = argv[i + 1] || null;
      i += 1;
      continue;
    }
    if (token === "--pretty") {
      args.pretty = true;
      continue;
    }
    if (token === "--v16-input") {
      args.v16Input = true;
      continue;
    }
    if (token === "--key") {
      args.key = argv[i + 1] || "airdoc";
      i += 1;
      continue;
    }
    if (token === "--help" || token === "-h") {
      args.help = true;
      continue;
    }
  }

  return args;
}

function usage() {
  return [
    "Usage:",
    "  node src/cli.js --html <file> [--out <file>] [--pretty] [--v16-input] [--key <name>]",
    "",
    "Options:",
    "  --html <file>   Input HTML file path",
    "  --out <file>    Output file path (default: stdout)",
    "  --pretty        Pretty-print JSON",
    "  --v16-input     Output wrapper object for V16: { <key>: JSObj }",
    "  --key <name>    Key name for --v16-input (default: airdoc)"
  ].join("\n");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.htmlPath) {
    process.stdout.write(`${usage()}\n`);
    process.exit(args.help ? 0 : 1);
  }

  const html = fs.readFileSync(args.htmlPath, "utf8");
  const tree = parseHTMLToJSObj(html);
  const output = args.v16Input ? toV16InputObject(tree, { key: args.key }) : tree;

  const json = args.pretty
    ? `${JSON.stringify(output, null, 2)}\n`
    : `${JSON.stringify(output)}\n`;

  if (args.outPath) {
    fs.writeFileSync(args.outPath, json, "utf8");
  } else {
    process.stdout.write(json);
  }
}

main();
