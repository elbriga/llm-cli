import * as fs from "fs";
import { globSync } from "glob";

import { ToolInterface } from "../tools.ts";
import { Workspace } from "./workspace.ts";

export class GetFiles implements ToolInterface {
  private ws = new Workspace();

  getDescription(): object {
    return {
      name: "get_files",
      description: "Get the contents of many files from a glob pattern",
      parameters: {
        type: "object",
        properties: {
          glob_pattern: {
            type: "string",
            description: "The glob pattern to match files",
          },
        },
        required: ["glob_pattern"],
      },
    };
  }

  execute({ glob_pattern }): string {
    const files = globSync(glob_pattern);

    let ret = "";
    for (const file_name of files) {
      ret += `// ========== FILE ${file_name} =============\n`;

      if (!this.ws.listFiles().includes(file_name)) {
        ret += "FILE_NOT_FOUND\n\n";
        continue;
      }

      if (!fs.existsSync(file_name)) {
        ret += "FILE_NOT_FOUND\n\n";
        continue;
      }

      try {
        let fileContent = fs.readFileSync(file_name, "utf8");
        ret += fileContent + "\n";
      } catch (error) {
        ret += "ERROR!\n";
      }
    }

    return ret;
  }
}
