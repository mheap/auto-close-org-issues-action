# Auto Close Org Issues

Automatically close issues that are raised by people that belong to a specific organization

## Usage

```yaml
name: Auto Close Org Issues
on:
  issues:
    types: [opened, reopened]

jobs:
  auto-close-org-issues:
    name: Auto Close Org Issues
    runs-on: ubuntu-latest
    steps:
      - name: Auto Close Org Issues
        uses: mheap/github-action-readme@main
        with:
          token: ${{ secrets.PAT }}
          org: YOUR_ORG_NAME
          message: Thanks for raising an issue! For YOUR_ORG_NAME employees, we track issues in the ABC Jira project
```

## Available Configuration

### Inputs

| Name      | Description                                                   | Required | Default |
| --------- | ------------------------------------------------------------- | -------- | ------- |
| `token`   | A GitHub API token that has permission to list org membership | true     |
| `org`     | The org to auto-close issues from                             | true     |
| `message` | The comment to add when auto-closing an issue                 | true     |
