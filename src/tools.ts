export interface ToolInterface {
  execute(args: object): string;
  getDescription(): object;
}

import { Workspace } from "./tools/workspace.ts";
import { GetFile } from "./tools/getFile.ts";
import { GetFiles } from "./tools/getFiles.ts";
import { NewFile } from "./tools/newFile.ts";
//import { EditFile } from "./tools/editFile.ts";
//import { NpmInstall } from "./tools/npmInstall.ts";

import { GetDate } from "./tools/getDate.ts";
import { GetWeather } from "./tools/getWeather.ts";

export class Tools {
  private readonly TOOL_CALL_MAP: Record<string, ToolInterface> = {
    get_date: new GetDate(),
    get_weather: new GetWeather(),
    list_workspace: new Workspace(),
    get_file: new GetFile(),
    get_files: new GetFiles(),
    new_file: new NewFile(),
    //edit_file: new EditFile(),
    //pm_install: new NpmInstall(),
  };

  async execute(tool_calls: Array<any>): Promise<Array<any>> {
    let ret: Array<any> = [];

    for (const toolCall of tool_calls) {
      const functionName = toolCall.function?.name ?? "";
      const tool = this.TOOL_CALL_MAP[functionName];
      if (!tool) continue;

      let functionArgs = {};
      let functionArgsStr = toolCall.function.arguments ?? "{}";
      if (typeof functionArgsStr === "string") {
        try {
          functionArgs = JSON.parse(functionArgsStr);
        } catch {}
      } else {
        // TODO Check if is object?
        functionArgs = functionArgsStr;
        functionArgsStr = JSON.stringify(functionArgs);
      }

      // console.log("===== CALLING =====---------->>");
      // console.log(functionName);
      // console.dir(toolCall, { depth: null });
      // console.log("===================---------->>");

      const toolResponse = tool.execute(functionArgs);
      ret.push({
        role: "tool",
        name: functionName,
        tool_call_id: toolCall.id,
        content: toolResponse,
      });
    }

    return ret;
  }

  getDescriptions() {
    let ret: Array<object> = [];

    for (const [name, tool] of Object.entries(this.TOOL_CALL_MAP)) {
      ret.push({ type: "function", function: tool.getDescription() });
    }

    return ret;
  }
}
