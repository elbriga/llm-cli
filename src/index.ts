import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { llmAPI } from './api.ts';

async function main() {
  const api = new llmAPI();

  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Analyze the file" },
    {
      role: 'system',
      content: `File: src/cli.ts
\`\`\`ts
console.log('Hello World!');
\`\`\``
    }
  ];

  await api.call(messages);

//   const rl = createInterface({ input, output });

//   console.log("Digite algo (ou 'exit' para sair):");

//   while (true) {
//     const line = await rl.question("> ");

//     if (line.trim().toLowerCase() === "exit") {
//       console.log("Saindo...");
//       break;
//     }

//     console.log("Você digitou:", line);


//   }

//   rl.close();
}

main();
