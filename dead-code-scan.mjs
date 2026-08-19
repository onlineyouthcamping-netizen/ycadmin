import fs from "fs";
import path from "path";

const srcRoot = path.join(process.cwd(), "src");
const exts = [".ts", ".tsx"];

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === "dist") continue;
      walk(p, files);
    } else if (exts.some((e) => ent.name.endsWith(e))) {
      files.push(p);
    }
  }
  return files;
}

const allFiles = walk(srcRoot);
const fileContents = new Map();
for (const f of allFiles) {
  fileContents.set(f, fs.readFileSync(f, "utf8"));
}

const appContent = fileContents.get(path.join(srcRoot, "App.tsx")) || "";

// Lazy imports never used in JSX
const lazyMatches = [
  ...appContent.matchAll(/const (\w+) = lazy\(\(\) => import\(["'](.+?)["']\)/g),
];
const unusedLazy = [];
for (const m of lazyMatches) {
  const compName = m[1];
  const importPath = m[2];
  const jsxUsed =
    appContent.includes(`<${compName}`) || appContent.includes(`<${compName}/`);
  if (!jsxUsed) unusedLazy.push({ compName, importPath });
}
console.log("=== LAZY IMPORTS NEVER USED IN JSX (App.tsx) ===");
unusedLazy.forEach((u) => console.log(`${u.compName} -> ${u.importPath}`));

// Pages not referenced anywhere
const pageFiles = allFiles.filter((f) => f.includes(`${path.sep}pages${path.sep}`));
const orphanPages = [];
for (const pf of pageFiles) {
  const rel = path.relative(process.cwd(), pf).replace(/\\/g, "/");
  const basename = path.basename(pf, path.extname(pf));
  let refs = 0;
  for (const [f, content] of fileContents) {
    if (f === pf) continue;
    if (content.includes(basename) || content.includes(rel.replace(/\.tsx?$/, ""))) {
      refs++;
    }
  }
  if (refs === 0) orphanPages.push(rel);
}
console.log("\n=== ORPHAN PAGES (0 external refs) ===");
orphanPages.forEach((p) => console.log(p));

// Components orphan (non-ui)
const compFiles = allFiles.filter(
  (f) => f.includes(`${path.sep}components${path.sep}`) && f.endsWith(".tsx"),
);
const orphanComps = [];
for (const cf of compFiles) {
  const rel = path.relative(process.cwd(), cf).replace(/\\/g, "/");
  if (rel.includes("/ui/")) continue;
  const basename = path.basename(cf, ".tsx");
  let refs = 0;
  const importPath = rel.replace(/^src\//, "").replace(/\.tsx$/, "");
  for (const [f, content] of fileContents) {
    if (f === cf) continue;
    if (
      content.includes(basename) ||
      content.includes(importPath) ||
      content.includes(`@/${importPath}`)
    ) {
      refs++;
    }
  }
  if (refs === 0) orphanComps.push(rel);
}
console.log("\n=== ORPHAN COMPONENTS (0 refs, excl ui/) ===");
orphanComps.forEach((c) => console.log(c));

// Module files
const moduleFiles = allFiles.filter((f) => f.includes(`${path.sep}modules${path.sep}`));
console.log("\n=== MODULE FILES ===");
for (const mf of moduleFiles) {
  const rel = path.relative(process.cwd(), mf).replace(/\\/g, "/");
  const importPath = rel.replace(/^src\//, "").replace(/\.tsx?$/, "");
  const basename = path.basename(mf, path.extname(mf));
  let refs = 0;
  for (const [f, content] of fileContents) {
    if (f === mf) continue;
    if (
      content.includes(basename) ||
      content.includes(importPath) ||
      content.includes(`@/${importPath}`)
    ) {
      refs++;
    }
  }
  console.log(`${rel} -> refs: ${refs}`);
}

// Duplicate filenames
const nameMap = new Map();
for (const f of allFiles) {
  const bn = path.basename(f);
  if (!nameMap.has(bn)) nameMap.set(bn, []);
  nameMap.get(bn).push(path.relative(process.cwd(), f).replace(/\\/g, "/"));
}
console.log("\n=== DUPLICATE FILE NAMES ===");
for (const [bn, paths] of nameMap) {
  if (paths.length > 1 && bn.endsWith(".tsx")) {
    console.log(`${bn}: ${paths.join(", ")}`);
  }
}
