import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import chalk from "chalk";
import ora from "ora";

import { llmAPI } from "./api.ts";
import { Workspace } from "./workspace.ts";
import { Diff } from "./diff.ts";

export class CLI {
  private api = new llmAPI();
  private ws = new Workspace();
  private diff = new Diff();

  private instruction =
    "You are DeepSeek Coder, an AI programming assistant.\n" +
    "Help with coding tasks and respond with unified diff enclosed in <DIFF></DIFF> so I can do file editing.";

  async execute() {
    console.log("Digite algo (ou 'exit' para sair):");

    const rl = createInterface({ input, output });
    while (true) {
      let line = await rl.question("LLM> ");
      if (!line) continue;
      console.log("");

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
      console.log("");

      spinner.start("Asking...");
      let receivedData = false;
      const response = await this.api.newMessage(
        this.instruction,
        line,
        (chunk) => {
          if (!receivedData) {
            receivedData = true;
            spinner.stop();
            console.log("");
          }
          process.stdout.write(chunk);
        }
      );
      console.log("");

      const diffs = this.diff.parseDiffs(response);
      if (diffs) {
        spinner.start("Editing...");
        // list editing files
        line = await rl.question("<Will now edit the files! Press ENTER> ");
      }
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
