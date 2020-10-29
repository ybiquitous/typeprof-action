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

    const files = await fg(core.getInput("file"));
    if (files.length === 0) {
      core.warning("No input files.");
      return;
    }

    const errors = await core.group("Analyze files", async () => {
      core.info(`Input files (${files.length}):`);
      files.forEach((file) => core.info(file));

      const useBundler = core.getInput("use-bundler") === "true";
      const allErrors = await Promise.all(files.map(async (file) => analyze(file, useBundler)));
      const errorList = allErrors.reduce((total, errs) => total.concat(errs), []);

      core.info(`${errorList.length} error(s) found.`);

      return errorList;
    });

    await core.group("Finish checking", async () => {
      // NOTE: The maximum size of annotations is limited to 50 by GitHub.
      const LIMIT = 50;
      const limitedErrors = errors.slice(0, LIMIT);
      let summary;
      if (errors.length === 0) {
        summary = "No type errors.";
      } else if (errors.length === 1) {
        summary = `**${errors.length}** type error found.`;
      } else if (errors.length === limitedErrors.length) {
        summary = `**${errors.length}** type errors found.`;
      } else {
        summary = `**${errors.length}** type errors found, but reported errors are limited to ${LIMIT}.`;
      }

      const success = errors.length === 0;

      await octokit.checks.update({
        check_run_id: checkId,
        owner,
        repo,
        conclusion: success ? "success" : "failure",
        status: "completed",
        completed_at: new Date().toISOString(),
        output: {
          title: CHECK_NAME,
          summary,
          annotations: limitedErrors.map(({ path, line, message }) => ({
            path,
            message,
            start_line: line,
            end_line: line,
            annotation_level: "failure",
          })),
        },
      });
    });

    if (errors.length !== 0) {
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
