#!/usr/bin/env node

import { runHyperbitsCli } from "./index";

const exitCode = await runHyperbitsCli(process.argv.slice(2));
process.exitCode = exitCode;
