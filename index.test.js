const action = require(".");
const core = require("@actions/core");
const github = require("@actions/github");

const mockedEnv = require("mocked-env");
const nock = require("nock");
nock.disableNetConnect();

describe("Auto Close Org Issues", () => {
  let restore;
  let restoreTest;

  beforeEach(() => {
    restore = mockedEnv({
      GITHUB_EVENT_NAME: "issue",
      GITHUB_EVENT_PATH: "/github/workspace/event.json",
      GITHUB_WORKFLOW: "demo-workflow",
      GITHUB_ACTION: "required-labels",
      GITHUB_ACTOR: "mheap",
      GITHUB_REPOSITORY: "mheap/missing-repo",
      GITHUB_WORKSPACE: "/github/workspace",
      GITHUB_SHA: "e21490305ed7ac0897b7c7c54c88bb47f7a6d6c4",
      INPUT_TOKEN: "this_is_invalid",
    });

    core.setOutput = jest.fn();
    core.warning = jest.fn();
    core.setFailed = jest.fn();
  });

  afterEach(() => {
    restore();
    restoreTest();
    jest.resetModules();

    if (!nock.isDone()) {
      throw new Error(
        `Not all nock interceptors were used: ${JSON.stringify(
          nock.pendingMocks()
        )}`
      );
    }
    nock.cleanAll();
  });

  describe("input handling", () => {
    it("requires 'org'", async () => {
      restoreTest = mockIssue();

      await action();
      expect(core.setOutput).toBeCalledTimes(1);
      expect(core.setOutput).toBeCalledWith("status", "failure");
      expect(core.setFailed).toBeCalledTimes(1);
      expect(core.setFailed).toBeCalledWith(
        "Input required and not supplied: org"
      );
    });

    it("requires 'message'", async () => {
      restoreTest = mockIssue(
        {},
        {
          INPUT_ORG: "demo_org",
        }
      );

      await action();
      expect(core.setOutput).toBeCalledTimes(1);
      expect(core.setOutput).toBeCalledWith("status", "failure");
      expect(core.setFailed).toBeCalledTimes(1);
      expect(core.setFailed).toBeCalledWith(
        "Input required and not supplied: message"
      );
    });
  });

  describe("runs successfully", () => {
    it("user is a member of the org", async () => {
      restoreTest = mockIssue(
        {
          issue: { user: { login: "valid_user" }, number: 27 },
        },
        {
          INPUT_ORG: "demo_org",
          INPUT_MESSAGE: "You can't do that",
        }
      );

      mockOrgMembership("valid_user", "demo_org", "member", 200);
      mockCreateComment("You can't do that");
      mockCloseIssue();

      await action();
      expect(core.setOutput).toBeCalledTimes(2);
      expect(core.setOutput).toBeCalledWith("user_role", "member");
      expect(core.setOutput).toBeCalledWith("status", "success");
    });

    it("user is not a member of the org", async () => {
      restoreTest = mockIssue(
        {
          issue: { user: { login: "valid_user" }, number: 27 },
        },
        {
          INPUT_ORG: "demo_org",
          INPUT_MESSAGE: "You can't do that",
        }
      );

      mockOrgMembership("valid_user", "demo_org", "member", 404);

      await action();
      expect(core.setOutput).toBeCalledTimes(1);
      expect(core.setOutput).toBeCalledWith("status", "success");
    });
  });
});

function mockOrgMembership(user, org, role, httpCode) {
  nock("https://api.github.com")
    .get(`/orgs/${org}/memberships/${user}`)
    .reply(httpCode, {
      role,
    });
}

function mockCreateComment(body) {
  nock("https://api.github.com")
    .post(`/repos/mheap/missing-repo/issues/27/comments`, {
      body,
    })
    .reply(201);
}

function mockCloseIssue(body) {
  nock("https://api.github.com")
    .patch(`/repos/mheap/missing-repo/issues/27`, {
      state: "closed",
      state_reason: "not_planned",
    })
    .reply(200);
}

function mockIssue(payload = {}, envParams = {}) {
  return mockEvent(
    {
      action: "opened",
      ...payload,
    },
    envParams
  );
}

function mockEvent(mockPayload, envParams = {}) {
  github.context.payload = mockPayload;
  const r = mockedEnv(envParams);
  return r;
}
