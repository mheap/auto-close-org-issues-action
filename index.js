const core = require("@actions/core");
const github = require("@actions/github");

async function action() {
  try {
    const token = core.getInput("token", { required: true });
    const octokit = github.getOctokit(token);

    // Process inputs for use later
    const org = core.getInput("org", { required: true });
    const message = core.getInput("message", { required: true });

    // Who triggered the event?
    const username = github.context.payload.issue.user.login;

    // List the orgs that they are a member of
    let userRole;
    try {
      const { data } = await octokit.rest.orgs.getMembershipForUser({
        username,
        org,
      });
      userRole = data.role;
    } catch (e) {}

    // If any match our input, add a comment and auto-close the issue
    if (userRole) {
      await octokit.rest.issues.createComment({
        ...github.context.repo,
        issue_number: github.context.issue.number,
        body: message,
      });
      await octokit.rest.issues.update({
        ...github.context.repo,
        issue_number: github.context.issue.number,
        state: "closed",
      });
      core.setOutput("user_role", userRole);
    }

    core.setOutput("status", "success");
  } catch (e) {
    core.setFailed(e.message);
    core.setOutput("status", "failure");
  }
}

/* istanbul ignore next */
if (require.main === module) {
  action();
}

module.exports = action;
