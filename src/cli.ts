import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { llmAPI } from './api.ts';

export class CLI {
  private api = new llmAPI();

  async execute() {
    this.api.attachFile('src/api.ts');
    
    console.log("Digite algo (ou 'exit' para sair):");
    
    const rl = createInterface({ input, output });
    while (true) {
      const line = await rl.question("LLM> ");
      if (!line) continue;

      if (line.substring(0, 1) == '/') {
        const command = line.trim().toLowerCase();
        if (command === "/exit" || command == '/q') {
          console.log("Exit");
          break;
        }

        continue;
      }

      await this.api.newMessage(line, (chunk) => { process.stdout.write(chunk); });
    }

    rl.close();
  }
}

