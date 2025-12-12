import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { llmAPI } from './api.ts';

async function main() {
  const api = new llmAPI();
  api.attachFile('src/api.ts');
  
  initText();
  
  const rl = createInterface({ input, output });
  while (true) {
    const line = await rl.question("LLM> ");
    if (!line) continue;

    if (line.substring(0, 1) == '/') {
      if (handleCommands(line.trim().toLowerCase())) {
        break;
      }
      continue;
    }

    await api.newMessage(line, (chunk) => { process.stdout.write(chunk); });
  }

  rl.close();
}
main();

function initText() {
  console.log("Digite algo (ou 'exit' para sair):");
}

function handleCommands(command: string): number {
  if (command === "/exit" || command == '/q') {
    console.log("Exit");
    return 1;
  }

  return 0;
}
