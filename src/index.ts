import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { llmAPI } from './api.ts';

async function main() {
  const api = new llmAPI();

  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    // { role: "user", content: "Hi" },
//     {
//       role: 'system',
//       content: `File: src/cli.ts
// \`\`\`ts
// console.log('Hello World!');
// \`\`\``
//     }
  ];

  
  // console.log('----------;;;;;;;;;;;;;;;;;>>>>>>>>>>>');
  // console.log(response.content);  
  // console.log('----------;;;;;;;;;;;;;;;;;>>>>>>>>>>>');

  const rl = createInterface({ input, output });

  console.log("Digite algo (ou 'exit' para sair):");

  while (true) {
    const line = await rl.question("LLM> ");

    if (line.trim().toLowerCase() === "/exit") {
      console.log("Saindo...");
      break;
    }

    // console.log("Você digitou:", line);
    messages.push({
      role: 'user',
      content: line
    });
    
    const response = await api.call(messages);
    messages.push({
      role: 'assistant',
      content: response.content
    });
  }

  rl.close();
}

main();
