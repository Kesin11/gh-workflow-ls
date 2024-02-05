// reusableやcompositeが多様されたworkflowを展開して流れを把握できるようにするスクリプト
// イメージとしてはnpm lsのように依存関係をツリー、もしくはインデントで表現したい
//
// サンプルの出力イメージ
// main (.github/workflows/medianAbsoluteDeviation.yaml):
//  build:
//    - checkout
//    - run: echo
//    - uses: ../.github/actions/my-compisite (https://github.com/owner/repo/.github/actions/my-compisite/action.yml)
//      - run: build
//      - run: test
//      - uses: ../.github/actions/common (https://github.com/owner/repo/.github/actions/common/action.yml)
//        - run: post.sh
//  reusable: (../.github/workflows/reusable.yml)
//    - lint:
//      - uses: ../.github/actions/my-composite (https://github.com/owner/repo/.github/actions/my-composite/action.yml)
//        - run: build
//        - run: test
//      - run: lint

import { parse } from "https://deno.land/std@0.212.0/yaml/parse.ts";
import { normalize } from "https://deno.land/std@0.214.0/path/normalize.ts";
import { parseArgs } from "https://deno.land/std@0.214.0/cli/parse_args.ts";
import { Github } from "./src/github.ts";
import {
  Job,
  JobModel,
  Step,
  StepModel,
  WorkflowModel,
} from "./src/workflow_file.ts";

type CompositeAction = {
  name: string;
  description: string | undefined;
  runs: {
    using: "composite";
    steps: Step[];
  };
};
class CompositeStepModel {
  yaml: string;
  raw: CompositeAction;
  constructor(rawYaml: string) {
    this.yaml = rawYaml;
    this.raw = parse(rawYaml) as CompositeAction;
  }

  get steps(): StepModel[] {
    return this.raw.runs.steps.map((step) => new StepModel(step));
  }
}

type ReusableWorkflow = {
  name: string;
  on: {
    workflow_call: unknown;
  };
  jobs: Record<string, Job>;
};
class ReusableWorkflowModel {
  yaml: string;
  raw: ReusableWorkflow;
  constructor(rawYaml: string) {
    this.yaml = rawYaml;
    this.raw = parse(rawYaml) as ReusableWorkflow;
  }

  get jobs(): JobModel[] {
    return Object.entries(this.raw.jobs).map(([id, job]) =>
      new JobModel(id, job)
    );
  }
}

const args = parseArgs(Deno.args, {
  string: ["repo", "workflow", "ref", "token"],
  alias: { R: "repo", w: "workflow", r: "ref", t: "token" },
  default: { ref: "main" },
});

if (!args.repo) throw new Error("repo argument is required");
const [owner, repo] = args.repo.split("/");
const workflow = args.workflow;
if (!workflow) throw new Error("workflow argument is required");
if (!(workflow.endsWith(".yml") || workflow.endsWith(".yaml"))) {
  // 最終的にはymlでもworkflow_nameでもどっちでもいけるようにしたい
  throw new Error("workflow argument must be .yml or .yaml");
}
const ref = args.ref;
const token = args.token;

const github = new Github(token);
const workflowPath = `.github/workflows/${workflow}`;
const res = await github.fetchContent({
  owner,
  repo,
  path: workflowPath,
  ref,
});

const workflowModel = new WorkflowModel(res!.content);
console.log(`workflow: ${workflowModel.raw.name}`);
await showJobs(workflowModel.jobs, 1);

// reusable workflowの場合はjobを展開して再帰的に表示する
async function showJobs(jobs: JobModel[], indent: number): Promise<void> {
  for (const job of jobs) {
    const space = "  ".repeat(indent);
    if (job.isReusable()) {
      const localReusableWorkflowPath = normalize(job.raw.uses!);
      const res = await github.fetchContent({
        // TODO: 今はmain関数に直接書いているので参照できているだけ
        owner,
        repo,
        path: localReusableWorkflowPath,
        ref,
      });
      console.log(`${space}reusable: ${job.id} (${res!.raw.html_url})`);

      const reusableWorkflowModel = new ReusableWorkflowModel(res!.content);
      await showJobs(reusableWorkflowModel.jobs, indent + 1);
    } else {
      // NOTE: 現在は他リポジトリのReusable Workflowには対応していない
      // isReusable() === false判定された上でstepsが[]なので何も表示されない
      console.log(`${space}job: ${job.id}`);

      await showSteps(job.steps, indent + 1);
    }
  }
}

// 再帰的にcompositeActionのstepを展開して表示する
async function showSteps(steps: StepModel[], indent: number): Promise<void> {
  const space = "  ".repeat(indent);
  for (const step of steps) {
    if (step.isComposite()) {
      const res = await fetchCompositeActionContent(
        // TODO: 今はmain関数に直接書いているので参照できているだけ
        owner,
        repo,
        step.raw.uses!,
        ref,
      );
      console.log(
        `${space}- composite: ${step.showable} (${res!.raw.html_url})`,
      );

      const compositeActionModel = new CompositeStepModel(res!.content);
      await showSteps(compositeActionModel.steps, indent + 1);
    } else {
      // NOTE: 現在は他リポジトリのComposite Actionには対応していない
      // 単にusesが表示されるだけ
      console.log(`${space}- step: ${step.showable}`);
    }
  }
}

// Composite Actionsはaction.ymlかaciton.yamlかが確定しないので同時にfetchしてエラーにならない方を採用する
async function fetchCompositeActionContent(
  owner: string,
  repo: string,
  compositeDir: string,
  ref: string,
) {
  const promiseYml = github.fetchContent({
    owner,
    repo,
    // ./.github/actions/my-compisite/action.yml から先頭の./を削除
    path: normalize(`${compositeDir}/action.yml`),
    ref,
  });
  const promiseYaml = github.fetchContent({
    owner,
    repo,
    path: normalize(`${compositeDir}/action.yaml`),
    ref,
  });
  return await Promise.any([promiseYml, promiseYaml]);
}
