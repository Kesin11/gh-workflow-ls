import { assertEquals } from "https://deno.land/std@0.212.0/assert/mod.ts";
import { JobModel, StepModel } from "./workflow_file.ts";

Deno.test(JobModel.name, async (t) => {
  const id = "test1";
  const job = {
    "runs-on": "ubuntu-latest",
    steps: [
      { uses: "actions/checkout@v4" },
      { name: "Echo", run: "echo 'Hello, world!'" },
    ],
  };
  const jobModel = new JobModel(id, job);

  await t.step("isReusable", () => {
    assertEquals(jobModel.isReusable(), false);
  });

  await t.step("steps", () => {
    assertEquals(jobModel.steps.length, 2);
  });
});

Deno.test(StepModel.name, async (t) => {
  const step = { uses: "actions/checkout@v4" };
  const stepModel = new StepModel(step);

  await t.step("isComposite", () => {
    assertEquals(stepModel.isComposite(), false);
  });
});
