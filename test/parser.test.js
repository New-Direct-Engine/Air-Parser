import test from "node:test";
import assert from "node:assert/strict";
import { parseHTMLToJSObj, toV16InputObject } from "../src/index.js";

test("extracts parent-child-id-class relationships", () => {
  const html = `
    <!doctype html>
    <html>
      <body>
        <div id="app" class="root main">
          <section class="panel">
            <h1 id="title">Hello</h1>
          </section>
        </div>
      </body>
    </html>
  `;

  const tree = parseHTMLToJSObj(html);
  const byTag = (tag) => tree.nodes.find((n) => n.tag === tag);

  const htmlNode = byTag("html");
  const bodyNode = byTag("body");
  const divNode = byTag("div");
  const sectionNode = byTag("section");
  const h1Node = byTag("h1");

  assert.ok(htmlNode);
  assert.ok(bodyNode);
  assert.ok(divNode);
  assert.ok(sectionNode);
  assert.ok(h1Node);

  assert.equal(divNode.id, "app");
  assert.deepEqual(divNode.class, ["root", "main"]);
  assert.deepEqual(sectionNode.class, ["panel"]);
  assert.equal(h1Node.id, "title");

  assert.equal(bodyNode.parent, htmlNode.index);
  assert.equal(divNode.parent, bodyNode.index);
  assert.equal(sectionNode.parent, divNode.index);
  assert.equal(h1Node.parent, sectionNode.index);

  assert.deepEqual(divNode.child, [sectionNode.index]);
  assert.deepEqual(sectionNode.child, [h1Node.index]);
});

test("handles self-closing and void elements", () => {
  const tree = parseHTMLToJSObj(`<div id="x"><img class="hero"/><br><input id="i"></div>`);
  const divNode = tree.nodes.find((n) => n.tag === "div");
  const imgNode = tree.nodes.find((n) => n.tag === "img");
  const brNode = tree.nodes.find((n) => n.tag === "br");
  const inputNode = tree.nodes.find((n) => n.tag === "input");

  assert.ok(divNode);
  assert.ok(imgNode);
  assert.ok(brNode);
  assert.ok(inputNode);
  assert.equal(imgNode.parent, divNode.index);
  assert.equal(brNode.parent, divNode.index);
  assert.equal(inputNode.parent, divNode.index);
  assert.equal(inputNode.id, "i");
  assert.deepEqual(imgNode.class, ["hero"]);
});

test("wraps JSObj for V16 input", () => {
  const tree = parseHTMLToJSObj(`<main id="root"></main>`);
  const wrapped = toV16InputObject(tree, { key: "documentTree" });

  assert.ok(wrapped.documentTree);
  assert.equal(wrapped.documentTree.version, "air-jsobj/1");
});
