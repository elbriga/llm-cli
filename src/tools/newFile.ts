import * as fs from "fs";

import { ToolInterface } from "../tools.ts";
//import { Workspace } from "./workspace.ts";

export class NewFile implements ToolInterface {
  //private ws = new Workspace();

  getDescription(): object {
    return {
      name: "new_file",
      description: "Creates or overwrites a file",
      parameters: {
        type: "object",
        properties: {
          file_name: { type: "string", description: "The file name" },
          content: {
            type: "string",
            description: "The content to write to the file (optional)",
          },
        },
        required: ["file_name"],
      },
    };
  }

  execute({ file_name, content }): string {
    //if (!this.ws.listFiles().includes(file_name)) return "FILE_NOT_FOUND";

    //if (!fs.existsSync(file_name)) return "FILE_NOT_FOUND";

    try {
      fs.writeFileSync(file_name, content);
      return `FILE ${file_name} WRITTEN`;
    } catch (error) {
      return "ERROR!";
    }
  }
}
