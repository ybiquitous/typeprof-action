import { exec } from "@actions/exec";

type TypeCheckError = {
  path: string;
  line: number;
  message: string;
};

const PATTERN = /^(?<path>[^:]+):(?<line>\d+): (?<message>.+)$/u;

const parseOutput = (output: string): TypeCheckError[] => {
  const checks: TypeCheckError[] = [];

  for (const line of output.split("\n")) {
    if (line.startsWith("# Classes")) {
      break;
    }

    const groups = PATTERN.exec(line)?.groups;
    if (groups) {
      checks.push({ path: groups.path, line: Number(groups.line), message: groups.message });
    }
  }

  return checks;
};

const analyze = async (file: string, useBundler: boolean): Promise<TypeCheckError[]> => {
  let cmd;
  let cmdArgs;
  if (useBundler) {
    cmd = "bundle";
    cmdArgs = ["exec", "typeprof", "--verbose", file];
  } else {
    cmd = "typeprof";
    cmdArgs = ["--verbose", file];
  }

  let stdout = "";
  await exec(cmd, cmdArgs, {
    listeners: {
      stdout: (data) => {
        stdout += data.toString();
      },
    },
    ignoreReturnCode: true,
  });

  return parseOutput(stdout);
};

export default analyze;
