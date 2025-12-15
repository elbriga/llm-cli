import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import chalk from "chalk";
import ora from "ora";

import { llmAPI } from "./api.ts";
import { Workspace } from "./workspace.ts";

export class CLI {
  private api = new llmAPI();
  private ws = new Workspace();

  async execute() {
    console.log("Digite algo (ou 'exit' para sair):");

    const rl = createInterface({ input, output });
    while (true) {
      const line = await rl.question("LLM> ");
      if (!line) continue;

      if (line.substring(0, 1) == "/") {
        const cmd = line.substring(1).trim().toLowerCase();
        this.execCmd(cmd);
        continue;
      }

      const spinner = ora("Thinking...").start();
      const files = await this.ws.askForIncludes(line, this.api);
      for (const file of files) {
        this.api.attachFile(file);
      }
      spinner.stop();

      await this.api.newMessage(line, (chunk) => {
        process.stdout.write(chunk);
      });
    }
  }

  private execCmd(command: string) {
    switch (command) {
      case "q":
      case "x":
      case "exit":
      case "quit":
        console.log(chalk.green("Exit"));
        process.exit(0);
        break;

      case "clear":
        this.api.clearMessages();
        break;

      default:
        console.log(chalk.red(`Unknown Comamnd: ${command}`));
        break;
    }
  }
}
