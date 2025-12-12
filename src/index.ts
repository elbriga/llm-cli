import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { llmAPI } from './api.ts';

async function main() {
  const api = new llmAPI();

  api.attachFile('src/api.ts');

  // TODO :: move messages to llmAPI and create newMessage()
  const messages = [
    { role: "system", content: "You are a helpful assistant." },
  ];

  
  // console.log('----------;;;;;;;;;;;;;;;;;>>>>>>>>>>>');
  // console.log(response.content);  
  // console.log('----------;;;;;;;;;;;;;;;;;>>>>>>>>>>>');

  const rl = createInterface({ input, output });

  console.log("Digite algo (ou 'exit' para sair):");

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

    // console.log("Você digitou:", line);
    messages.push({
      role: 'user',
      content: line
    });
    
    const response = await api.call(messages, (chunk) => { process.stdout.write(chunk); });

    messages.push({
      role: 'assistant',
      content: response.content
    });
  }

  rl.close();
}

main();
