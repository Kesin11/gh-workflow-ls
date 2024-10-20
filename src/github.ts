import { normalize } from "@std/path";
import type { Github, WorkflowRun } from "@kesin11/gha-utils/api_client";

type WorkflowUrl = {
  origin: string;
  owner: string;
  repo: string;
  runId: number;
  runAttempt?: number;
};
export const parseWorkflowRunUrl = (runUrl: string): WorkflowUrl => {
  const url = new URL(runUrl);
  const path = url.pathname.split("/");
  const owner = path[1];
  const repo = path[2];
  const runId = Number(path[5]);
  const runAttempt = path[6] === "attempts" ? Number(path[7]) : undefined;
  return {
    origin: url.origin,
    owner,
    repo,
    runId,
    runAttempt: runAttempt,
  };
};

export async function fetchWorkflow(
  github: Github,
  owner: string,
  repo: string,
  runId: number,
  runAttempt?: number,
): Promise<WorkflowRun> {
  const workflow = await github.octokit.rest.actions.getWorkflowRunAttempt({
    owner,
    repo,
    run_id: runId,
    attempt_number: runAttempt ?? 1,
  });
  return workflow.data;
}

// Composite Actionsはaction.ymlかaciton.yamlかが確定しないので、調べてから存在する方をfetchする
export async function fetchCompositeActionContent(
  github: Github,
  owner: string,
  repo: string,
  compositeDir: string,
  ref: string,
) {
  const compositeDirContents = await github.octokit.repos.getContent({
    owner: owner,
    repo: repo,
    path: normalize(compositeDir),
    ref: ref,
  });
  if (!Array.isArray(compositeDirContents.data)) {
    throw new Error("Unexpected response");
  }

  const actionFile = compositeDirContents.data.find((it) =>
    it.name === "action.yml" || it.name === "action.yaml"
  );
  if (!actionFile) throw new Error("action.yml or action.yaml not found");

  if (actionFile.name === "action.yml") {
    return github.fetchContent({
      owner,
      repo,
      // ./.github/actions/my-compisite/action.yml から先頭の./を削除
      path: normalize(`${compositeDir}/action.yml`),
      ref,
    });
  } else {
    return github.fetchContent({
      owner,
      repo,
      path: normalize(`${compositeDir}/action.yaml`),
      ref,
    });
  }
}
