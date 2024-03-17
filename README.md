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
  -t $(gh auth token) \
  https://github.com/OWNER/REPO/actions/runs/RUN_ID
```

`-t (--token)` can ommit by using `GITHUB_TOKEN` environment variable.

## Sample output

```yaml
$ gh workflow-ls.ts https://github.com/Kesin11/actions-newfeature-playground/actions/runs/7772753912

workflow: Reusable caller
  reusable: call_reusable (https://github.com/Kesin11/actions-newfeature-playground/blob/f05f80f4c370179b42dd9e8d6824ddbcf9f9a5cc/.github/workflows/reusable_callable.yml)
    job: echo_foo
      - step: actions/checkout@v4
      - step: echo "inputs.foo is ${{ inputs.foo }}"
    job: notify
      - step: actions/checkout@v4
      - composite: ./.github/actions/notify (https://github.com/Kesin11/actions-newfeature-playground/blob/f05f80f4c370179b42dd9e8d6824ddbcf9f9a5cc/.github/actions/notify/action.yml)
        - step: Notify
  job: notify
    - step: actions/checkout@v4
    - composite: ./.github/actions/notify (https://github.com/Kesin11/actions-newfeature-playground/blob/f05f80f4c370179b42dd9e8d6824ddbcf9f9a5cc/.github/actions/notify/action.yml)
      - step: Notify
```

## GHES support

You can use `gh-workflow-ls` with GitHub Enterprise Server(GHES)`. Although, you
should have using a token for GHES.

```bash
gh workflow-ls \
  -t $(gh auth token -h YOUR_ENTERPRISE_HOST) \
  https://YOUR_ENTERPRISE_HOST/OWNER/REPO/actions/runs/RUN_ID
```

## Run using Deno

`gh-workflow-ls` is written by Deno, so you can run using your Deno.

```bash
deno run --allow-env --allow-net workflow-ls.ts \
  -t $(gh auth token) \
  https://github.com/OWNER/REPO/actions/runs/RUN_ID
```

Also you can run it from URL directly.

```bash
deno run --allow-env --allow-net \
  https://raw.githubusercontent.com/Kesin11/gh-workflow-ls/main/workflow-ls.ts \
  -t $(gh auth token) \
  https://github.com/OWNER/REPO/actions/runs/RUN_ID
```

# LICENSE

MIT
