import * as fs from "fs";
import * as path from "path";

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

    // Ensure the directory exists
    const dir = path.dirname(file_name);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (error) {
        return `ERROR CREATING DIRECTORY: ${error}`;
      }
    }

    try {
      fs.writeFileSync(file_name, content);
      return `FILE ${file_name} WRITTEN`;
    } catch (error) {
      return `ERROR WRITING FILE: ${error}`;
    }
  }
}