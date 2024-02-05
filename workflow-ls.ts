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

import { parseArgs } from "https://deno.land/std@0.214.0/cli/parse_args.ts";
import { Github } from "./src/github.ts";
import { WorkflowTree } from "./src/workflow_tree.ts";

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
const workflowTree = new WorkflowTree(github, owner, repo, ref, token);

await workflowTree.showWorkflow(workflow);
