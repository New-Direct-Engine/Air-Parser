const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);

const RAW_TEXT_TAGS = new Set(["script", "style", "textarea", "title"]);

function findCaseInsensitive(haystack, needle, start = 0) {
  const lowerHaystack = haystack.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  return lowerHaystack.indexOf(lowerNeedle, start);
}

function findTagEnd(html, startIndex) {
  let quote = null;
  for (let i = startIndex + 1; i < html.length; i += 1) {
    const ch = html[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === ">") return i;
  }
  return -1;
}

function parseTagName(tagBody) {
  const trimmed = tagBody.trim();
  const spaceIdx = trimmed.search(/\s/);
  if (spaceIdx === -1) return trimmed.toLowerCase();
  return trimmed.slice(0, spaceIdx).toLowerCase();
}

function parseIdAndClass(attrSource) {
  const result = { id: null, classList: [] };
  const attrRegex =
    /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match = attrRegex.exec(attrSource);
  while (match) {
    const name = (match[1] || "").toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    if (name === "id" && value) {
      result.id = value.trim();
    } else if (name === "class" && value) {
      result.classList = value
        .split(/\s+/)
        .map((x) => x.trim())
        .filter(Boolean);
    }
    match = attrRegex.exec(attrSource);
  }
  return result;
}

function createNode(nodes, parentIndex, tag, id, classList) {
  const index = nodes.length;
  nodes.push({
    index,
    tag,
    parent: parentIndex,
    child: [],
    id: id ?? null,
    class: classList ?? []
  });
  if (parentIndex !== null) {
    nodes[parentIndex].child.push(index);
  }
  return index;
}

export function parseHTMLToJSObj(htmlInput) {
  const html = String(htmlInput ?? "");
  const nodes = [
    {
      index: 0,
      tag: "#document",
      parent: null,
      child: [],
      id: null,
      class: []
    }
  ];
  const stack = [0];
  let i = 0;

  while (i < html.length) {
    const lt = html.indexOf("<", i);
    if (lt === -1) break;

    if (lt > i) {
      i = lt;
    }

    if (html.startsWith("<!--", lt)) {
      const endComment = html.indexOf("-->", lt + 4);
      i = endComment === -1 ? html.length : endComment + 3;
      continue;
    }

    if (/^<!doctype/i.test(html.slice(lt, lt + 10))) {
      const end = html.indexOf(">", lt + 2);
      i = end === -1 ? html.length : end + 1;
      continue;
    }

    if (html.startsWith("</", lt)) {
      const gt = html.indexOf(">", lt + 2);
      if (gt === -1) break;
      const closeTag = html.slice(lt + 2, gt).trim().toLowerCase();
      if (closeTag) {
        while (stack.length > 1) {
          const topIndex = stack[stack.length - 1];
          const topTag = nodes[topIndex].tag;
          stack.pop();
          if (topTag === closeTag) break;
        }
      }
      i = gt + 1;
      continue;
    }

    const tagEnd = findTagEnd(html, lt);
    if (tagEnd === -1) break;

    let tagBody = html.slice(lt + 1, tagEnd).trim();
    const selfClosing = tagBody.endsWith("/");
    if (selfClosing) {
      tagBody = tagBody.slice(0, -1).trim();
    }
    const tagName = parseTagName(tagBody);
    if (!tagName) {
      i = tagEnd + 1;
      continue;
    }
    const attrSource = tagBody.slice(tagName.length).trim();
    const { id, classList } = parseIdAndClass(attrSource);
    const parentIndex = stack[stack.length - 1];
    const newNode = createNode(nodes, parentIndex, tagName, id, classList);

    if (RAW_TEXT_TAGS.has(tagName) && !selfClosing && !VOID_TAGS.has(tagName)) {
      const closeStart = findCaseInsensitive(html, `</${tagName}`, tagEnd + 1);
      if (closeStart === -1) {
        i = html.length;
        continue;
      }
      const closeEnd = html.indexOf(">", closeStart + 2);
      i = closeEnd === -1 ? html.length : closeEnd + 1;
      continue;
    }

    if (!selfClosing && !VOID_TAGS.has(tagName)) {
      stack.push(newNode);
    }
    i = tagEnd + 1;
  }

  return {
    version: "air-jsobj/1",
    root: 0,
    nodes
  };
}

export function toV16InputObject(jsObj, options = {}) {
  const key = options.key || "airdoc";
  return { [key]: jsObj };
}
