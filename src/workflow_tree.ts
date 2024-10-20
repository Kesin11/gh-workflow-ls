import { normalize } from "@std/path";
import type { Github } from "@kesin11/gha-utils/api_client";
import {
  CompositeStepModel,
  type JobModel,
  ReusableWorkflowModel,
  type StepModel,
  WorkflowModel,
} from "@kesin11/gha-utils/workflow_file";
import { fetchCompositeActionContent } from "./github.ts";

export class WorkflowTree {
  constructor(
    public github: Github,
    public owner: string,
    public repo: string,
    public ref: string,
  ) {
  }
  async showWorkflow(workflowPath: string) {
    const fileContent = await this.github.fetchContent({
      owner: this.owner,
      repo: this.repo,
      path: workflowPath,
      ref: this.ref,
    });

    const workflowModel = new WorkflowModel(fileContent!);
    console.log(`workflow: ${workflowModel.raw.name}`);
    await this.showJobs(workflowModel.jobs, 1);
  }

  // reusable workflowの場合はjobを展開して再帰的に表示する
  async showJobs(jobs: JobModel[], indent: number): Promise<void> {
    for (const job of jobs) {
      const space = "  ".repeat(indent);
      if (job.isReusable()) {
        const localReusableWorkflowPath = normalize(job.raw.uses!);
        const fileContent = await this.github.fetchContent({
          owner: this.owner,
          repo: this.repo,
          path: localReusableWorkflowPath,
          ref: this.ref,
        });
        console.log(
          `${space}reusable: ${job.id} (${fileContent!.raw.html_url})`,
        );

        const reusableWorkflowModel = new ReusableWorkflowModel(fileContent!);
        await this.showJobs(reusableWorkflowModel.jobs, indent + 1);
      } else {
        // NOTE: 現在は他リポジトリのReusable Workflowには対応していない
        // isReusable() === false判定された上でstepsが[]なので何も表示されない
        console.log(`${space}job: ${job.id}`);

        await this.showSteps(job.steps, indent + 1);
      }
    }
  }

  // 再帰的にcompositeActionのstepを展開して表示する
  async showSteps(steps: StepModel[], indent: number): Promise<void> {
    const space = "  ".repeat(indent);
    for (const step of steps) {
      if (step.isComposite()) {
        const fileContent = await fetchCompositeActionContent(
          this.github,
          this.owner,
          this.repo,
          step.raw.uses!,
          this.ref,
        );
        console.log(
          `${space}- composite: ${step.showable} (${
            fileContent!.raw.html_url
          })`,
        );

        const compositeActionModel = new CompositeStepModel(
          fileContent!,
          step.ast, // It's fake ast
        );
        await this.showSteps(compositeActionModel.steps, indent + 1);
      } else {
        // NOTE: 現在は他リポジトリのComposite Actionには対応していない
        // 単にusesが表示されるだけ
        console.log(`${space}- step: ${step.showable}`);
      }
    }
  }
}
