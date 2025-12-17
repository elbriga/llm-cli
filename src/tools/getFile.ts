import * as fs from "fs";

import { ToolInterface } from "../tools.ts";
import { Workspace } from "./workspace.ts";

export class GetFile implements ToolInterface {
  private ws = new Workspace();

  getDescription(): object {
    return {
      name: "get_file",
      description: "Get the contents of one file",
      parameters: {
        type: "object",
        properties: {
          file_name: { type: "string", description: "The file name" },
        },
        required: ["file_name"],
      },
    };
  }

  execute({ file_name }): string {
    if (!this.ws.listFiles().includes(file_name)) return "FILE_NOT_FOUND";

    if (!fs.existsSync(file_name)) return "FILE_NOT_FOUND";

    try {
      let fileContent = fs.readFileSync(file_name, "utf8");
      return fileContent;
    } catch (error) {
      return "ERROR!";
    }
  }
}
