import { parse } from "https://deno.land/std@0.215.0/yaml/parse.ts";

type Workflow = {
  name: string;
  jobs: {
    [key: string]: Job;
  };
  [key: string]: unknown;
};
export class WorkflowModel {
  yaml: string;
  raw: Workflow;
  constructor(rawYaml: string) {
    this.yaml = rawYaml;
    this.raw = parse(rawYaml) as Workflow;
  }

  get jobs(): JobModel[] {
    return Object.entries(this.raw.jobs).map(([id, job]) =>
      new JobModel(id, job)
    );
  }
}

type ReusableWorkflow = {
  name: string;
  on: {
    workflow_call: unknown;
  };
  jobs: Record<string, Job>;
};
export class ReusableWorkflowModel {
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

export type Job = {
  name?: string;
  "runs-on": string;
  uses?: string;
  steps?: Step[];
  [key: string]: unknown;
};
export class JobModel {
  id: string;
  raw: Job;
  constructor(id: string, obj: Job) {
    this.id = id;
    this.raw = obj;
  }

  get steps(): StepModel[] {
    if (this.raw.steps === undefined) return [];
    return this.raw.steps?.map((step) => new StepModel(step));
  }

  isReusable(): boolean {
    // Local reusable workflow
    if (this.raw.uses?.startsWith("./")) return true;

    // TODO: Remote reusable workflow

    return false;
  }
}

type CompositeAction = {
  name: string;
  description: string | undefined;
  runs: {
    using: "composite";
    steps: Step[];
  };
};
export class CompositeStepModel {
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

export type Step = {
  uses?: string;
  name?: string;
  run?: string;
  [key: string]: unknown;
};
export class StepModel {
  raw: Step;
  constructor(obj: Step) {
    this.raw = obj;
  }

  get showable(): string {
    return this.raw.name ?? this.raw.uses ?? this.raw.run ??
      "Error: Not showable step";
  }

  isComposite(): boolean {
    // Call self as action
    if (this.raw.uses === "./") return false;

    // Local composite action
    if (this.raw.uses?.startsWith("./")) return true;

    // TODO: Remote composite action

    return false;
  }
}
