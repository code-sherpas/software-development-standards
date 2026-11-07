// The standards index test with the model: an agent that has read only the
// index chooses, for each case, the standards it would read in full, and the
// test fails when most runs of a case miss one the reference labels expect.
//
//   node evals/index/run.ts [--runs 3] [--concurrency 6] [--effort medium] [--cases C01,C14] [--out <dir>]
//   node evals/index/run.ts --dry-run --cases C14   # prints what the agent receives; calls nothing
//
// Needs a credential the Anthropic SDK resolves: in CI, Workload Identity
// Federation through the ANTHROPIC_FEDERATION_* variables; by hand,
// ANTHROPIC_API_KEY or an `ant auth login` profile. Each
// full run is about 30 cases × 3 runs, some 900,000 tokens: CI runs it only
// when the index changes or a standard is added (see model-test-needed.ts).
//
// What the agent receives, in order, as evals/index/README.md says: the
// hook's instruction to read the index, the index itself (as if it had read
// it), its role's brief and the case. The instruction and the briefs are read
// from where agents really get them, on `main` of claude-code-plugins and
// agent-skills, so a change in their wording is tested too. The index is the
// one in this tree: it is what a change to the standards changes.
//
// No fallback model: the test measures the model the agents run on. A refusal
// counts as a failed run, never as an answer from another model.

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { readCorpus } from "./corpus.ts";
import { grade, hookInstruction, type GradedRun } from "./grading.ts";
import { workingTree } from "./scope-changes.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const MODEL = "claude-opus-5-5";
const STANDARDS_RAW = "https://raw.githubusercontent.com/code-sherpas/software-development-standards/main";
const PLUGINS_RAW = process.env.PLUGINS_RAW ?? "https://raw.githubusercontent.com/code-sherpas/claude-code-plugins/main";
const SKILLS_RAW = process.env.SKILLS_RAW ?? "https://raw.githubusercontent.com/code-sherpas/agent-skills/main";
// Where the hook says the index is. Any path does: the agent is given its content.
const INDEX_PATH = "/home/user/.cache/code-sherpas-base/standards-index/README.md";

const BRIEF_SOURCES: Record<string, string> = {
  "increment-builder": `${PLUGINS_RAW}/plugins/base/agents/increment-builder.md`,
  "increment-reviewer": `${PLUGINS_RAW}/plugins/base/agents/increment-reviewer.md`,
  "increment-verifier": `${PLUGINS_RAW}/plugins/base/agents/increment-verifier.md`,
  "ship-increments": `${SKILLS_RAW}/skills/ship-increments/SKILL.md`,
  refine: `${SKILLS_RAW}/skills/refine/SKILL.md`,
  audit: `${SKILLS_RAW}/skills/audit/SKILL.md`,
  "to-increments": `${SKILLS_RAW}/skills/to-increments/SKILL.md`,
  "fix-error": `${SKILLS_RAW}/skills/fix-error/SKILL.md`,
  "build-prototype": `${SKILLS_RAW}/skills/build-prototype/SKILL.md`,
};

const QUESTION =
  "Before you do any of this work, decide which standards from the index you will read in full for it. " +
  "Do not do the work and do not explain: answer only with those standards, each by its file name without `.md`.";

type Run = GradedRun & { usage?: Anthropic.Usage };
type CaseResult = {
  id: string;
  expected: string[];
  nearMiss: string[];
  runs: Run[];
  missed: string[];
  unstable: string[];
  errored: boolean;
  extra: string[];
};

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

function body(markdown: string): string {
  return markdown.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
}

async function pool<T, R>(items: T[], size: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const index = next++;
      results[index] = await work(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
  return results;
}

function report(results: CaseResult[], runsPerCase: number, usage: Record<string, number>): string {
  const failed = results.filter(function hasMiss(result) {
    return result.missed.length > 0 || result.errored;
  });
  const lines = [
    `# Standards index test — ${failed.length === 0 ? "passed" : `failed in ${failed.length} of ${results.length} cases`}`,
    "",
    `${MODEL}, ${runsPerCase} runs per case. Tokens: ${usage.input} input, ${usage.cacheWrite} cache write, ${usage.cacheRead} cache read, ${usage.output} output.`,
    "",
    "| Case | Missed in most runs (blocks) | Missed in one run (unstable, reported) | Chosen beyond the expected (reported only) |",
    "|---|---|---|---|",
  ];
  for (const result of results) {
    function withCount(name: string): string {
      const times = result.runs.filter(function chose(run) {
        return run.chosen.includes(name);
      }).length;
      return `${name} ${times}/${runsPerCase}`;
    }
    const extra = result.extra
      .map(function label(name) {
        return result.nearMiss.includes(name) ? `${name} (near miss)` : name;
      })
      .join(", ");
    const errors = result.runs.flatMap(function errorOf(run) {
      return run.error ? [run.error] : [];
    });
    const missed = result.missed.map(withCount).join(", ") || "—";
    lines.push(
      `| ${result.id} | ${missed}${errors.length ? ` (no answer: ${errors.join("; ")})` : ""} | ${result.unstable.map(withCount).join(", ") || "—"} | ${extra || "—"} |`,
    );
  }
  return lines.join("\n") + "\n";
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      runs: { type: "string", default: "3" },
      concurrency: { type: "string", default: "6" },
      // The effort the agents run at: medium, the default of claude-opus-5-5.
      effort: { type: "string", default: "medium" },
      cases: { type: "string" },
      "dry-run": { type: "boolean", default: false },
      out: { type: "string", default: join(ROOT, "evals/index/results", new Date().toISOString().replaceAll(":", "-")) },
    },
  });
  const runsPerCase = Number(values.runs);
  const effort = values.effort as "low" | "medium" | "high" | "xhigh" | "max";

  const tree = workingTree(ROOT);
  const corpus = readCorpus(tree);
  const names = [...corpus.standards.keys()];
  const ids = values.cases ? values.cases.split(",") : [...corpus.cases.keys()].sort();

  const instruction = hookInstruction(
    await fetchText(`${PLUGINS_RAW}/plugins/base/scripts/require-standards-index.sh`),
    INDEX_PATH,
    STANDARDS_RAW,
  );
  const briefs: Record<string, string> = {};
  for (const [role, url] of Object.entries(BRIEF_SOURCES)) briefs[role] = body(await fetchText(url));

  // Everything before the role and the case is the same for every request,
  // so it is cached once and read by the rest.
  const system: Anthropic.TextBlockParam[] = [
    {
      type: "text",
      text:
        `A hook of this session gave you this instruction:\n\n${instruction}\n\n` +
        `You read the index in full with the Read tool. This is its content:\n\n<index path="${INDEX_PATH}">\n${tree.read("README.md")}\n</index>`,
      cache_control: { type: "ephemeral", ttl: "1h" },
    },
  ];
  const Answer = z.object({ standards: z.array(z.enum(names as [string, ...string[]])) });
  const client = new Anthropic();

  function userMessage(id: string): string {
    const text = corpus.cases.get(id)!;
    const role = /\nrole:\s*([a-z-]+)/.exec(text)![1];
    const brief = role === "none" ? "" : `${briefs[role]}\n\n`;
    return `${brief}${body(text)}\n\n${QUESTION}`;
  }

  if (values["dry-run"]) {
    for (const id of ids) {
      console.log(`=== ${id}\n--- system (cached, ${system[0].text.length} characters, index included)\n${system[0].text.slice(0, 600)}\n[…]\n--- user\n${userMessage(id)}\n`);
    }
    return;
  }

  async function ask(id: string): Promise<Run> {
    try {
      const response = await client.messages.parse({
        model: MODEL,
        max_tokens: 16000,
        output_config: { effort, format: zodOutputFormat(Answer) },
        system,
        messages: [{ role: "user", content: userMessage(id) }],
      });
      if (response.stop_reason === "refusal") {
        return { chosen: [], error: `refusal (${response.stop_details?.category ?? "no category"})`, usage: response.usage };
      }
      if (!response.parsed_output) return { chosen: [], error: `no answer (${response.stop_reason})`, usage: response.usage };
      return { chosen: [...new Set(response.parsed_output.standards)], usage: response.usage };
    } catch (error) {
      if (error instanceof Anthropic.APIError) return { chosen: [], error: `API ${error.status}: ${error.message}` };
      throw error;
    }
  }

  // One request first, so the shared prefix is cached before the rest start.
  const jobs = ids.flatMap(function runsOf(id) {
    return Array.from({ length: runsPerCase }, function job() {
      return id;
    });
  });
  const first = await ask(jobs[0]);
  const rest = await pool(jobs.slice(1), Number(values.concurrency), ask);
  const answers = [first, ...rest];

  const results: CaseResult[] = ids.map(function resultOf(id, index) {
    const runs = answers.slice(index * runsPerCase, (index + 1) * runsPerCase);
    const expected = corpus.expected[id];
    return {
      id,
      expected: expected.expected.map(function nameOf(item) {
        return item.standard;
      }),
      nearMiss: expected.near_miss,
      runs,
      ...grade(expected, runs),
    };
  });
  const usage = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 };
  for (const answer of answers) {
    usage.input += answer.usage?.input_tokens ?? 0;
    usage.cacheWrite += answer.usage?.cache_creation_input_tokens ?? 0;
    usage.cacheRead += answer.usage?.cache_read_input_tokens ?? 0;
    usage.output += answer.usage?.output_tokens ?? 0;
  }

  const markdown = report(results, runsPerCase, usage);
  mkdirSync(values.out!, { recursive: true });
  writeFileSync(join(values.out!, "results.json"), JSON.stringify({ model: MODEL, effort, runsPerCase, usage, results }, null, 2));
  writeFileSync(join(values.out!, "report.md"), markdown);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  console.log(markdown);
  console.log(`Results in ${values.out}`);
  if (results.some(function failed(result) {
    return result.missed.length > 0 || result.errored;
  })) process.exit(1);
}

// Anything but an answer or an API error — no credential, a failed token
// exchange, a brief that cannot be downloaded — means the test could not
// run: it fails, saying why, never passes.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main().catch(function couldNotRun(error: unknown) {
    console.error(`The standards index test could not run: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
