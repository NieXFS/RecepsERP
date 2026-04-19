/**
 * Prefixa todos os seletores de src/styles/landing.css com `.receps-landing`
 * exceto os dentro de @keyframes. Move :root/html/body para o wrapper.
 */
const fs = require("fs");
const path = require("path");
const postcss = require("postcss");

const FILE = path.resolve(__dirname, "../src/styles/landing.css");
const PREFIX = ".receps-landing";

const plugin = () => ({
  postcssPlugin: "scope-landing",
  Rule(rule) {
    let parent = rule.parent;
    while (parent) {
      if (parent.type === "atrule" && /keyframes$/i.test(parent.name)) {
        return;
      }
      parent = parent.parent;
    }

    rule.selectors = rule.selectors.map((selector) => {
      const normalized = selector.trim();

      if (
        normalized === ":root" ||
        normalized === "html" ||
        normalized === "body"
      ) {
        return PREFIX;
      }

      return `${PREFIX} ${normalized}`;
    });
  },
});

plugin.postcss = true;

const css = fs.readFileSync(FILE, "utf8");

postcss([plugin()])
  .process(css, { from: FILE, to: FILE })
  .then((result) => {
    fs.writeFileSync(FILE, result.css);
    console.log(`Scoped ${FILE}`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
