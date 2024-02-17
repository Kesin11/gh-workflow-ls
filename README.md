# gh-workflow-ls

Show GitHub Actions workflow yaml expanding Reusable Workflow job and Composite
Actions step

# USAGE

```bash
deno run --allow-env --allow-net --allow-read workflow-ls.ts \
  -R Kesin11/actions-newfeature-playground \
  -w reusable_caller.yml \
  -r main \
  -t $(gh auth token)

deno run --allow-env --allow-net --allow-read workflow-ls.ts \
  --repo Kesin11/actions-newfeature-playground \
  --workflow reusable_caller.yml \
  --ref main \
  --token $(gh auth token)

# Sample output
# workflow: Reusable caller
#   reusable: call_reusable (https://github.com/Kesin11/actions-newfeature-playground/blob/main/.github/workflows/reusable_callable.yml)
#     job: echo_foo
#       - step: actions/checkout@v4
#       - step: echo "inputs.foo is ${{ inputs.foo }}"
#     job: notify
#       - step: actions/checkout@v4
#       - composite: ./.github/actions/notify (https://github.com/Kesin11/actions-newfeature-playground/blob/main/.github/actions/notify/action.yml)
#         - step: Notify
#   job: notify
#     - step: actions/checkout@v4
#     - composite: ./.github/actions/notify (https://github.com/Kesin11/actions-newfeature-playground/blob/main/.github/actions/notify/action.yml)
#       - step: Notify
```

# Deno run from URL

```
deno run --allow-env --allow-net --allow-read \
  https://raw.githubusercontent.com/Kesin11/gh-workflow-ls/main/workflow-ls.ts \
  -R YOUR_OWNER/REPO \
  -w YOUR_WORKFLOW.{yml,yaml} \
  -r YOUR_BRANCH \
  -t $(gh auth token)
```

# GHES support

You can use this tool with GitHub Enterprise Server(GHES) by specifying
`GITHUB_API_URL`. Also you should have using a token for GHES.

GITHUB_API_URL=YOUR_ENTERPRISE_HOST/api/v3 deno run --allow-env --allow-net\
--allow-read\
https://raw.githubusercontent.com/Kesin11/gh-workflow-ls/main/workflow-ls.ts\
-R YOUR_OWNER/REPO\
-w YOUR_WORKFLOW.{yml,yaml}\
-r YOUR_BRANCH\
-t $(gh auth token -h YOUR_ENTERPRISE_HOST)

```
export GITHUB_API_URL=https://github.example.com/api/v3
```
