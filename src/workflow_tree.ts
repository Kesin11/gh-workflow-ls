import { normalize } from "https://deno.land/std@0.214.0/path/normalize.ts";
import { Github } from "./github.ts";
import {
  CompositeStepModel,
  JobModel,
  ReusableWorkflowModel,
  StepModel,
  WorkflowModel,
} from "./workflow_file.ts";

export class WorkflowTree {
  constructor(
    public github: Github,
    public owner: string,
    public repo: string,
    public ref: string,
    public token?: string,
  ) {
  }
  async showWorkflow(workflow: string) {
    const workflowPath = `.github/workflows/${workflow}`;
    const res = await this.github.fetchContent({
      owner: this.owner,
      repo: this.repo,
      path: workflowPath,
      ref: this.ref,
    });

    const workflowModel = new WorkflowModel(res!.content);
    console.log(`workflow: ${workflowModel.raw.name}`);
    await this.showJobs(workflowModel.jobs, 1);
  }

  // reusable workflowの場合はjobを展開して再帰的に表示する
  async showJobs(jobs: JobModel[], indent: number): Promise<void> {
    for (const job of jobs) {
      const space = "  ".repeat(indent);
      if (job.isReusable()) {
        const localReusableWorkflowPath = normalize(job.raw.uses!);
        const res = await this.github.fetchContent({
          owner: this.owner,
          repo: this.repo,
          path: localReusableWorkflowPath,
          ref: this.ref,
        });
        console.log(`${space}reusable: ${job.id} (${res!.raw.html_url})`);

        const reusableWorkflowModel = new ReusableWorkflowModel(res!.content);
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
        const res = await this.github.fetchCompositeActionContent(
          this.owner,
          this.repo,
          step.raw.uses!,
          this.ref,
        );
        console.log(
          `${space}- composite: ${step.showable} (${res!.raw.html_url})`,
        );

        const compositeActionModel = new CompositeStepModel(res!.content);
        await this.showSteps(compositeActionModel.steps, indent + 1);
      } else {
        // NOTE: 現在は他リポジトリのComposite Actionには対応していない
        // 単にusesが表示されるだけ
        console.log(`${space}- step: ${step.showable}`);
      }
    }
  }
}
