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

import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { Github, parseWorkflowRunUrl } from "@kesin11/gha-utils/api_client";
import { fetchWorkflow } from "./src/github.ts";
import { WorkflowTree } from "./src/workflow_tree.ts";

const { options, args } = await new Command()
  .name("workflow-ls")
  .description(
    "Show GitHub Actions workflow yaml expanding Reusable Workflow job and Composite Actions step",
  )
  .option("-t, --token <token:string>", "GitHub token. ex: $(gh auth token)", {
    default: undefined,
  })
  .arguments("<url:string>")
  .parse(Deno.args);

const url = args[0];
const runUrl = parseWorkflowRunUrl(url);

const host = (runUrl.origin !== "https://github.com")
  ? runUrl.origin
  : undefined;
const github = new Github({ token: options.token, host, debug: false });
const workflow = await fetchWorkflow(
  github,
  runUrl.owner,
  runUrl.repo,
  runUrl.runId,
  runUrl.runAttempt,
);
const workflowTree = new WorkflowTree(
  github,
  runUrl.owner,
  runUrl.repo,
  workflow.head_sha,
);

await workflowTree.showWorkflow(workflow.path);
