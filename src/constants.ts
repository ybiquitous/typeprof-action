import github from "@actions/github";

export const REPO = github.context.repo;

export const CHECK_NAME = "TypeProf";

export const HEAD_SHA = (() => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const sha = github.context.payload.pull_request?.head?.sha;
  if (typeof sha === "string") {
    return sha;
  }
  return github.context.sha;
})();
