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
    "Help with coding tasks and follow best practices.\n";
  //"If any file change is necessary respond with unified diff enclosed in <DIFF></DIFF> so I can do file editing.";

  async execute() {
    this.api.debugON();
    const r = await this.api.newMessage(
      "Help the users with his tasks",
      "How's the weather in Hangzhou Tomorrow",
      (chunk) => process.stdout.write(chunk), // TODO tentar sync
      (chunk) => process.stdout.write(chalk.blue(chunk))
    );
    console.log("------------=======>>>>>");
    console.dir(r, { depth: null });
    console.log("------------=======>>>>>");
    return;

    console.log("Digite algo (ou 'exit' para sair):");

    while (true) {
      const line = await this.readLine("LLM");
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
      spinner.stop();

      const diffs = this.diff.parseDiffs(response);
      if (diffs.length > 0) {
        // list editing files
        for (const diff of diffs) {
          const line1 = diff.split("\n")?.[0];
          console.log("-------------------==============>>>");
          console.log(line1);
          console.log("-------------------==============>>>");
        }
        await this.readLine("<Will now edit the files! Press ENTER");
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

      case "c":
      case "clear":
        this.api.clearMessages();
        console.log(chalk.yellow("Messages Cleared"));
        break;

      case "d":
      case "debug":
        this.api.debugON();
        console.log(chalk.red("DEBUG ON"));
        break;

      default:
        console.log(chalk.red(`Unknown Comamnd: ${command}`));
        break;
    }
  }

  private async readLine(prompt: string): Promise<string> {
    const rl = createInterface({ input, output }); // Yes, calling inside the while, or else crashes!
    const line = await rl.question(`${prompt}> `);
    rl.close();
    return line;
  }
}
