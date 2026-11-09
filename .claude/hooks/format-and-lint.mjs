// PostToolUse hook for Write/Edit:
// 1. Code files (TS/JS): removes blank lines (outside string/template literals) so code stays compact.
// 2. Formats code and Markdown with Prettier.
// 3. Runs ESLint --fix on code files; remaining problems are reported back to Claude (stderr + exit 2).
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const MD_EXT = new Set([".md", ".mdx"]);
const IGNORED_DIRS = ["node_modules", ".next", "references"];
const readStdin = async () => {
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data;
};
const run = (cmd, args, cwd) =>
  spawnSync(cmd, args, { cwd, encoding: "utf8", shell: true });
const scriptKind = (ext) =>
  ({
    ".ts": ts.ScriptKind.TS,
    ".tsx": ts.ScriptKind.TSX,
    ".jsx": ts.ScriptKind.JSX,
  })[ext] ?? ts.ScriptKind.JS;
// Removes whitespace-only lines, except those inside string/template literals (where they are content).
const stripBlankLines = (absPath, ext) => {
  const src = readFileSync(absPath, "utf8");
  const sf = ts.createSourceFile(
    absPath,
    src,
    ts.ScriptTarget.Latest,
    false,
    scriptKind(ext),
  );
  const literals = [];
  const visit = (node) => {
    if (ts.isTemplateLiteral(node) || ts.isStringLiteral(node)) {
      literals.push([node.getStart(sf), node.end]);
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  const insideLiteral = (pos) =>
    literals.some(([start, end]) => pos > start && pos < end);
  let pos = 0;
  const out = src
    .split(/(?<=\n)/)
    .filter((line) => {
      const start = pos;
      pos += line.length;
      return !(/^[ \t]*\r?\n?$/.test(line) && !insideLiteral(start));
    })
    .join("");
  if (out !== src) writeFileSync(absPath, out, "utf8");
};
const main = async () => {
  let input;
  try {
    input = JSON.parse(await readStdin());
  } catch {
    process.exit(0);
  }
  const filePath = input?.tool_input?.file_path;
  if (!filePath) process.exit(0);
  const projectDir =
    process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const absPath = path.resolve(projectDir, filePath);
  const relPath = path.relative(projectDir, absPath);
  if (relPath.startsWith("..") || path.isAbsolute(relPath)) process.exit(0);
  const segments = relPath.split(path.sep);
  if (segments.some((s) => IGNORED_DIRS.includes(s))) process.exit(0);
  const ext = path.extname(absPath).toLowerCase();
  const isCode = CODE_EXT.has(ext);
  if (!isCode && !MD_EXT.has(ext)) process.exit(0);
  if (isCode) {
    try {
      stripBlankLines(absPath, ext);
    } catch (err) {
      process.stderr.write(
        `Blank-line removal skipped for ${relPath}: ${err.message}\n`,
      );
    }
  }
  const quoted = `"${relPath}"`;
  const prettier = run(
    "npx",
    ["prettier", "--write", "--log-level", "warn", quoted],
    projectDir,
  );
  if (prettier.status !== 0) {
    process.stderr.write(
      `Prettier failed on ${relPath}:\n${prettier.stderr || prettier.stdout}`,
    );
    process.exit(2);
  }
  if (isCode) {
    const eslint = run("npx", ["eslint", "--fix", quoted], projectDir);
    if (eslint.status !== 0) {
      process.stderr.write(
        `ESLint found problems in ${relPath}:\n${eslint.stdout}${eslint.stderr}`,
      );
      process.exit(2);
    }
  }
  process.exit(0);
};
main();
