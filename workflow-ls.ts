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

import yargs from "https://deno.land/x/yargs@v17.7.2-deno/deno.ts";
import { Github } from "./src/github.ts";
import { WorkflowTree } from "./src/workflow_tree.ts";

const args = yargs(Deno.args)
  .options({
    repo: {
      type: "string",
      alias: "R",
      demandOption: true,
      describe: "Repository. ex: OWNER/REPO",
    },
    workflow: {
      type: "string",
      alias: "w",
      demandOption: true,
      describe: "Workflow file. ex: ci.yml",
    },
    ref: {
      type: "string",
      alias: "r",
      default: "main",
      describe: "git ref like branch or tag. ex: main, v1.0.0",
    },
    token: {
      type: "string",
      alias: "t",
      demandOption: true,
      describe: "GitHub token. ex: $(gh auth token)",
    },
    host: {
      type: "string",
      demandOption: false,
      describe: "GHES hostname. ex: github.example.com",
    },
  })
  .parse();

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
const host = args.host;

const github = new Github({ token, host });
const workflowTree = new WorkflowTree(github, owner, repo, ref, token);

await workflowTree.showWorkflow(workflow);
