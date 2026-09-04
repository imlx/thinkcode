import * as fs from "fs";
import * as path from "path";

const WEB_DIR = path.resolve(__dirname, "..");
const REPO_ROOT = WEB_DIR;
const MAPPINGS_DIR = path.join(WEB_DIR, "src", "data", "ideology-mappings");
const OUT_DIR = path.join(WEB_DIR, "src", "data", "generated");

interface IdeologyMappingEntry {
  tech: string;
  ideology: string;
}

interface IdeologyModule {
  id: string;
  title: string;
  source: string;
  codePath: string;
  code: string;
  mapping: IdeologyMappingEntry[];
  scenario: { bank: string; securities: string; insurance: string };
  ahaPrompt: string;
  ahaOptions: string[];
}

function parseQuoted(text: string): string {
  return text
    .trim()
    .replace(/^"(.*)"$/, "$1")
    .replace(/^'(.*)'$/, "$1");
}

function parseYamlSubset(content: string): IdeologyModule {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const mod: IdeologyModule = {
    id: "",
    title: "",
    source: "",
    codePath: "",
    code: "",
    mapping: [],
    scenario: { bank: "", securities: "", insurance: "" },
    ahaPrompt: "",
    ahaOptions: [],
  };

  let section = "";
  let currentMapEntry: IdeologyMappingEntry | null = null;

  for (const raw of lines) {
    const line = raw.replace(/\s+#.*$/, "");
    if (!line.trim() || line.trimStart().startsWith("#")) continue;

    const indent = raw.length - raw.trimStart().length;

    if (indent === 0) {
      const top = line.match(/^([^\s:：]+):\s*(.*)$/);
      if (!top) continue;
      const key = top[1];
      const value = parseQuoted(top[2]);
      if (key === "title") {
        mod.title = value;
        section = "";
      } else if (key === "source") {
        mod.source = value;
        section = "";
      } else if (key === "code_path") {
        mod.codePath = value;
        section = "";
      } else {
        section = key;
        if (key === "aha_prompt") mod.ahaPrompt = value;
      }
      continue;
    }

    if (section === "mapping") {
      const item = line.match(/^\s+(-\s*)?([^\s:：]+):\s*(.+)$/);
      if (item) {
        if (item[2] === "技术概念") {
          currentMapEntry = { tech: parseQuoted(item[3]), ideology: "" };
          mod.mapping.push(currentMapEntry);
        } else if (item[2] === "思政概念" && currentMapEntry) {
          currentMapEntry.ideology = parseQuoted(item[3]);
        }
      }
      continue;
    }

    if (section === "scenario") {
      const item = line.match(/^\s+([^\s:：]+):\s*(.+)$/);
      if (item) {
        if (item[1] === "银行") mod.scenario.bank = parseQuoted(item[2]);
        if (item[1] === "证券") mod.scenario.securities = parseQuoted(item[2]);
        if (item[1] === "保险") mod.scenario.insurance = parseQuoted(item[2]);
      }
      continue;
    }

    if (section === "aha_prompt") {
      if (line.includes("aha_prompt:")) {
        mod.ahaPrompt = parseQuoted(line.split("aha_prompt:")[1]);
      }
      continue;
    }

    if (section === "aha_options") {
      const item = line.match(/^\s+-\s+(.+)$/);
      if (item) mod.ahaOptions.push(parseQuoted(item[1]));
      continue;
    }
  }

  return mod;
}

function moduleIdFromFilename(filename: string): string {
  return path.basename(filename, path.extname(filename));
}

function main() {
  console.log("Extracting ideology mappings...");

  if (!fs.existsSync(MAPPINGS_DIR)) {
    console.log(`  Mappings dir not found: ${MAPPINGS_DIR}`);
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(OUT_DIR, "ideology.json"),
      JSON.stringify({ modules: [] }, null, 2)
    );
    return;
  }

  const files = fs
    .readdirSync(MAPPINGS_DIR)
    .filter((name) => /\.(yml|yaml)$/.test(name))
    .sort();

  const modules: IdeologyModule[] = [];
  for (const filename of files) {
    const content = fs.readFileSync(path.join(MAPPINGS_DIR, filename), "utf-8");
    const mod = parseYamlSubset(content);
    mod.id = moduleIdFromFilename(filename);
    if (mod.codePath) {
      const codeFile = path.join(REPO_ROOT, mod.codePath);
      if (fs.existsSync(codeFile)) {
        mod.code = fs.readFileSync(codeFile, "utf-8");
      } else {
        console.log(`  [warn] code file not found: ${mod.codePath}`);
      }
    }
    modules.push(mod);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, "ideology.json"),
    JSON.stringify({ modules }, null, 2)
  );

  console.log(`  ${modules.length} ideology modules -> ${path.join("src", "data", "generated", "ideology.json")}`);
  for (const mod of modules) {
    console.log(
      `    ${mod.id}: ${mod.title} (${mod.mapping.length} mappings, ${mod.ahaOptions.length} options)`
    );
  }
}

main();
