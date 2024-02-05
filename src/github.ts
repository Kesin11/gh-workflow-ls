import { normalize } from "https://deno.land/std@0.214.0/path/normalize.ts";
import { decodeBase64 } from "https://deno.land/std@0.212.0/encoding/base64.ts";
import { Octokit } from "npm:@octokit/rest@20.0.2";

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

  constructor(token: string | undefined) {
    const baseUrl = Deno.env.get("GITHUB_API_URL") ?? "https://api.github.com";
    this.octokit = new Octokit({
      auth: token ?? Deno.env.get("GITHUB_TOKEN") ?? undefined,
      baseUrl,
    });
  }

  async fetchContent(params: {
    owner: string;
    repo: string;
    path: string;
    ref: string;
  }): Promise<({ raw: FileContent; content: string } | undefined)> {
    // console.debug(`getContent: ${params.owner}/${params.repo}/${params.path}`);

    // TODO: 同じファイルのfetchが多発するのでキャッシュしたい
    const res = await this.octokit.repos.getContent({
      owner: params.owner,
      repo: params.repo,
      path: params.path,
      ref: params.ref,
    });
    // https://github.com/octokit/types.ts/issues/440#issuecomment-1221055881
    if (!Array.isArray(res.data) && res.data.type === "file") {
      const textDecoder = new TextDecoder();
      return {
        raw: res.data,
        content: textDecoder.decode(decodeBase64(res.data.content)),
      };
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