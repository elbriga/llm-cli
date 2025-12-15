import { globSync } from "glob";
import chalk from "chalk";

import { llmAPI } from "./api";

export class Workspace {
  includeGlob = "{*.md,package.json,src/**/*}";

  async askForIncludes(prompt: string, api: llmAPI): Promise<string[]> {
    const allFiles = this.listWorkdirFiles();
    let history = api.getHistoryString();
    if (history) history = `<HISTORY>\n${history}</HISTORY>\n`;

    const response = await api.oneConversation(
      "Based on the conversation history tell me which files you would like included to solve the user request.\n" +
        "If the user specifies one or more files or patterns using the '@' as a marker include only the requested files.\n" +
        "Please inlcude a <FILES></FILES> tag in your response so I can parse it.\n" +
        history +
        "Here are the users files on the workspace.\n" +
        "<WORKSPACE>\n" +
        allFiles.join("\n") +
        "</WORKSPACE>\n",
      prompt
    );

    let files: string[] = [];
    if (response.includes("<FILES>") && response.includes("</FILES>")) {
      const start = response.indexOf("<FILES>") + 7;
      const end = response.indexOf("</FILES>");

      const strFiles = response.substring(start, end);
      for (const file of strFiles.split("\n")) {
        if (file) files.push(file);
      }
    }
    return files;
  }

  private listWorkdirFiles(): string[] {
    // Encontrar arquivos pelo pattern (ex: "src/*.ts")
    const files = globSync(this.includeGlob);
    return files;
  }
}
