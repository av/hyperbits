export const usage = `Usage:
  hyperbits find [query]
  hyperbits fetch <id-or-name>
  hyperbits add <bit> [--into compositions/]
  hyperbits mcp
`;

export const runHyperbitsCli = async (argv: string[]): Promise<number> => {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(usage);
    return 0;
  }

  process.stderr.write("hyperbits: not implemented yet\n");
  return 1;
};
