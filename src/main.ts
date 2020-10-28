import core from "@actions/core";
import github from "@actions/github";
import fg from "fast-glob";
import { CHECK_NAME, HEAD_SHA, REPO } from "./constants";
import analyze from "./analyze";

// eslint-disable-next-line max-lines-per-function, max-statements
const main = async (): Promise<void> => {
  try {
    const octokit = github.getOctokit(core.getInput("token"));
    const {
      data: { id: checkId },
    } = await octokit.checks.create({
      owner: REPO.owner,
      repo: REPO.repo,
      name: CHECK_NAME,
      head_sha: HEAD_SHA,
      status: "in_progress",
      started_at: new Date().toISOString(),
    });

    const files = await fg(core.getInput("file"));
    const errors = await analyze(files);
    const success = errors.length === 0;

    await octokit.checks.update({
      check_run_id: checkId,
      owner: REPO.owner,
      repo: REPO.repo,
      output: {
        summary: success ? "No errors found." : `**${errors.length}** error(s) found.`,

        // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
        annotations: errors.map(({ path, line, message }) => ({
          path,
          message,
          start_line: line,
          end_line: line,
          annotation_level: "failure",
        })),
      },
    });

    await octokit.checks.update({
      check_run_id: checkId,
      owner: REPO.owner,
      repo: REPO.repo,
      conclusion: success ? "success" : "failure",
      status: "completed",
      completed_at: new Date().toISOString(),
    });

    if (!success) {
      core.setFailed(`TypeProf failed with ${errors.length} error(s).`);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      core.setFailed(error);
    } else {
      core.setFailed("An unexpected error occurred.");
    }
  }
};

main();
