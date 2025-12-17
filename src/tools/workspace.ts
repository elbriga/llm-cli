import { globSync } from "glob";

import { ToolInterface } from "../tools.ts";

export class Workspace implements ToolInterface {
  includeGlob = "{*.md,package.json,src/**/*}";

  getDescription(): object {
    return {
      name: "list_workspace",
      description: "List the files on the user workspace",
      parameters: { type: "object", properties: {} },
    };
  }

  execute(): string {
    const files = this.listFiles();
    return files.join("\n");
  }

  listFiles(): Array<string> {
    return globSync(this.includeGlob);
  }
}
