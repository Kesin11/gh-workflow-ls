import { normalize } from "https://deno.land/std@0.220.1/path/normalize.ts";
import { decodeBase64 } from "https://deno.land/std@0.220.1/encoding/base64.ts";
import { Octokit, RestEndpointMethodTypes } from "npm:@octokit/rest@20.0.2";

export type Workflow =
  RestEndpointMethodTypes["actions"]["getWorkflowRunAttempt"]["response"][
    "data"
  ];

export type FileContent = {
  type: "file";
  size: number;
  name: string;
  path: string;
  content?: string | undefined;
  sha: string;
  url: string;
  git_url: string | null;
  html_url: string | null;
  download_url: string | null;
};

export class Github {
  octokit: Octokit;
  token?: string;
  baseUrl: string;
  contentCache: Map<string, { raw: FileContent; content: string }> = new Map();

  constructor(
    options: { token?: string; origin?: string },
  ) {
    this.token = options.token ?? Deno.env.get("GITHUB_TOKEN") ?? undefined;
    this.baseUrl = (options.origin === "https://github.com")
      ? "https://api.github.com" // gitHub.com
      : `${options.origin}/api/v3`; // GHES
    this.octokit = new Octokit({
      auth: this.token,
      baseUrl: this.baseUrl,
    });
  }

  async fetchWorkflow(
    owner: string,
    repo: string,
    runId: number,
    runAttempt?: number,
  ): Promise<Workflow> {
    const workflow = await this.octokit.rest.actions.getWorkflowRunAttempt({
      owner,
      repo,
      run_id: runId,
      attempt_number: runAttempt ?? 1,
    });
    return workflow.data;
  }

  async fetchContent(params: {
    owner: string;
    repo: string;
    path: string;
    ref: string;
  }): Promise<({ raw: FileContent; content: string } | undefined)> {
    // console.debug(`getContent: ${params.owner}/${params.repo}/${params.path}`);

    const cache = this.contentCache.get(JSON.stringify(params));
    if (cache) return cache;

    const res = await this.octokit.repos.getContent({
      owner: params.owner,
      repo: params.repo,
      path: params.path,
      ref: params.ref,
    });
    // https://github.com/octokit/types.ts/issues/440#issuecomment-1221055881
    if (!Array.isArray(res.data) && res.data.type === "file") {
      const textDecoder = new TextDecoder();
      const result = {
        raw: res.data,
        content: textDecoder.decode(decodeBase64(res.data.content)),
      };

      this.contentCache.set(JSON.stringify(params), result);
      return result;
    }
    // Unexpected response
    return undefined;
  }

  // Composite Actionsはaction.ymlかaciton.yamlかが確定しないので同時にfetchしてエラーにならない方を採用する
  async fetchCompositeActionContent(
    owner: string,
    repo: string,
    compositeDir: string,
    ref: string,
  ) {
    const promiseYml = this.fetchContent({
      owner,
      repo,
      // ./.github/actions/my-compisite/action.yml から先頭の./を削除
      path: normalize(`${compositeDir}/action.yml`),
      ref,
    });
    const promiseYaml = this.fetchContent({
      owner,
      repo,
      path: normalize(`${compositeDir}/action.yaml`),
      ref,
    });
    return await Promise.any([promiseYml, promiseYaml]);
  }
}

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
