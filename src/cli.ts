import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import chalk from "chalk";
import ora from "ora";

import { llmAPI } from "./api.ts";

export class CLI {
  private api = new llmAPI();
  private temp = 0.1;

  private instruction =
    "You are DeepSeek Coder, an AI programming assistant.\n" +
    "Help with coding tasks and follow best practices.\n";
  //"If any file change is necessary respond with unified diff enclosed in <DIFF></DIFF> so I can do file editing.";

  async execute() {
    this.api.banner();
    this.api.setTemperature(this.temp);

    // // TESTING
    // this.api.debugON();
    // const r = await this.api.newMessage(
    //   "Help the users with his tasks. Remember to use the provided tools.",
    //   "How's the weather in Hangzhou Tomorrow?",
    //   //"Analyze the project",
    //   undefined, //(chunk) => process.stdout.write(chunk),
    //   (chunk) => process.stdout.write(chalk.blue(chunk)),
    //   (toolCall) => {
    //     console.log(chalk.green("Tool Called: ") + chalk.yellow(toolCall));
    //   }
    // );
    // console.log("------------=======>>>>>");
    // console.dir(r, { depth: null });
    // console.log("------------=======>>>>>");
    // return;

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
        },
        (chunk) => {
          if (!receivedData) {
            receivedData = true;
            spinner.stop();
            console.log("");
          }
          process.stdout.write(chalk.blueBright(chunk));
        },
        (chunk) => {
          process.stdout.write(chalk.yellowBright(chunk));
        }
      );
      spinner.stop();
    }
  }

  private execCmd(command: string) {
    const args = command.split(" ");

    switch (args[0]) {
      case "h":
      case "help":
        this.help();
        break;

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

      case "t":
      case "temp":
        this.temp = Number(args[1] ?? 0.1);
        console.log(chalk.yellow(`Setting temperature to ${this.temp}`));
        this.api.setTemperature(this.temp);
        break;

      case "d":
      case "debug":
        this.api.debugON();
        console.log(chalk.red("DEBUG ON"));
        break;

      case "l":
      case "list":
        //this.api.listModels();
        break;

      default:
        console.log(chalk.red(`Unknown Comamnd: ${command}`));
        break;
    }
  }
  private help() {
    console.log(chalk.white("/h"));
    console.log(chalk.white("/help") + chalk.yellow(" This Help!"));
    console.log("");
    console.log(chalk.white("/q"));
    console.log(chalk.white("/x"));
    console.log(chalk.white("/exit"));
    console.log(chalk.white("/quit") + chalk.yellow(" Exit!"));
    console.log("");
    console.log(chalk.white("/c"));
    console.log(
      chalk.white("/clear") + chalk.yellow(" Clear the conversation")
    );
    console.log("");
    console.log(chalk.white("/d"));
    console.log(chalk.white("/debug") + chalk.yellow(" Enable Debugging"));
    console.log("");
    console.log(chalk.white("/t <T>"));
    console.log(chalk.white("/temp <T>") + chalk.yellow(" Set temperature"));
    console.log("\n");
  }

  private async readLine(prompt: string): Promise<string> {
    const rl = createInterface({ input, output }); // Yes, calling inside the while, or else crashes!
    const line = await rl.question(`${prompt}> `);
    rl.close();
    return line.trim();
  }
}
