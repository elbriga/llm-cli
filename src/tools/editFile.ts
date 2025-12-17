import * as fs from "fs";
import { ToolInterface } from "../tools.ts";
import { Workspace } from "./workspace.ts";

export class EditFile implements ToolInterface {
  private ws = new Workspace();

  getDescription(): object {
    return {
      name: "edit_file",
      description: "Edit an existing file with new content",
      parameters: {
        type: "object",
        properties: {
          file_name: { type: "string", description: "The file name" },
          content: {
            type: "string",
            description: "The new content to write to the file",
          },
        },
        required: ["file_name", "content"],
      },
    };
  }

  execute({ file_name, content }): string {
    // Ensure the file exists in workspace
    if (!this.ws.listFiles().includes(file_name)) {
      return "FILE_NOT_FOUND";
    }
    if (!fs.existsSync(file_name)) {
      return "FILE_NOT_FOUND";
    }

    try {
      fs.writeFileSync(file_name, content);
      return "FILE_EDITED_SUCCESSFULLY";
    } catch (error) {
      return "ERROR_EDITING_FILE";
    }
  }
}