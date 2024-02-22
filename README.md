# gh-workflow-ls

Show GitHub Actions workflow yaml expanding
[Reusable Workflow](https://docs.github.com/en/actions/using-workflows/reusing-workflows)
job and
[Composite Actions](https://docs.github.com/en/actions/creating-actions/creating-a-composite-action)
step.

## Installation

`gh-workflow-ls` can be installed as a
[GitHub CLI extension](https://cli.github.com/manual/gh_extension).

```bash
gh extension install Kesin11/gh-workflow-ls
```

## Usage

```bash
gh workflow-ls \
  -R Kesin11/actions-newfeature-playground \
  -w reusable_caller.yml \
  -r main \
  -t $(gh auth token)
```

## Sample output

```yaml
workflow: Reusable caller
  reusable: call_reusable (https://github.com/Kesin11/actions-newfeature-playground/blob/main/.github/workflows/reusable_callable.yml)
    job: echo_foo
      - step: actions/checkout@v4
      - step: echo "inputs.foo is ${{ inputs.foo }}"
    job: notify
      - step: actions/checkout@v4
      - composite: ./.github/actions/notify (https://github.com/Kesin11/actions-newfeature-playground/blob/main/.github/actions/notify/action.yml)
        - step: Notify
  job: notify
    - step: actions/checkout@v4
    - composite: ./.github/actions/notify (https://github.com/Kesin11/actions-newfeature-playground/blob/main/.github/actions/notify/action.yml)
      - step: Notify
```

## GHES support

You can use `gh-workflow-ls` with GitHub Enterprise Server(GHES) by specifying
--host like `github.example.com`. Also you should have using a token for GHES.

```bash
gh workflow-ls \
  -R YOUR_OWNER/REPO \
  -w YOUR_WORKFLOW.{yml,yaml} \
  -r YOUR_BRANCH \
  --host YOUR_ENTERPRISE_HOST \
  -t $(gh auth token -h YOUR_ENTERPRISE_HOST)
```

Or you can use environment variable `GITHUB_API_URL` instead of --host.

```bash
export GITHUB_API_URL=https://github.example.com/api/v3

gh workflow-ls \
  -R YOUR_OWNER/REPO \
  -w YOUR_WORKFLOW.{yml,yaml} \
  -r YOUR_BRANCH \
  -t $(gh auth token -h YOUR_ENTERPRISE_HOST)
```

## Run using Deno

So `gh-workflow-ls` is written by Deno, you can run using your Deno.

```bash
deno run --allow-env --allow-net --allow-read workflow-ls.ts \
  -R Kesin11/actions-newfeature-playground \
  -w reusable_caller.yml \
  -r main \
  -t $(gh auth token)
```

Also you can run it from URL directly.

```bash
deno run --allow-env --allow-net --allow-read \
  https://raw.githubusercontent.com/Kesin11/gh-workflow-ls/main/workflow-ls.ts \
  --repo Kesin11/actions-newfeature-playground \
  --workflow reusable_caller.yml \
  --ref main \
  --token $(gh auth token)
```

# LICENSE

MIT
