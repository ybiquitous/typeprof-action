import * as core from "@actions/core";
import * as github from "@actions/github";
import fg from "fast-glob";
import analyze from "./analyze";

const CHECK_NAME = "TypeProf";

// eslint-disable-next-line max-lines-per-function, max-statements
const main = async (): Promise<void> => {
  try {
    const octokit = github.getOctokit(core.getInput("token"));

    const { owner, repo } = github.context.repo;

    const checkId = await core.group("Start checking", async () => {
      const { data } = await octokit.checks.create({
        owner,
        repo,
        name: CHECK_NAME,
        head_sha: github.context.sha,
        status: "in_progress",
        started_at: new Date().toISOString(),
      });
      return data.id;
    });

    const [errors, success] = await core.group("Analyze files", async () => {
      const files = await fg(core.getInput("file"));

      core.info("Input files:");
      files.forEach((file) => core.info(file));

      const allErrors = await Promise.all(files.map(async (file) => analyze(file)));
      const errorList = allErrors.reduce((total, errs) => total.concat(errs), []);

      core.info("Errors:");
      errorList.forEach((err) => core.info(JSON.stringify(err)));

      return [errorList, errorList.length === 0];
    });

    await core.group("Finish checking", async () => {
      await octokit.checks.update({
        check_run_id: checkId,
        owner,
        repo,
        conclusion: success ? "success" : "failure",
        status: "completed",
        completed_at: new Date().toISOString(),
        output: {
          title: CHECK_NAME,
          summary: success ? "No errors found." : `**${errors.length}** error(s) found.`,
          annotations: errors.map(({ path, line, message }) => ({
            path,
            message,
            start_line: line,
            end_line: line,
            annotation_level: "failure",
          })),
        },
      });
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
