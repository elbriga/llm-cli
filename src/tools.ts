export interface ToolInterface {
  execute(args: object): string;
  getDescription(): object;
}

import { Workspace } from "./tools/workspace.ts";
import { GetFile } from "./tools/getFile.ts";
import { GetFiles } from "./tools/getFiles.ts";

import { GetDate } from "./tools/getDate.ts";
import { GetWeather } from "./tools/getWeather.ts";

export class Tools {
  private readonly TOOL_CALL_MAP: Record<string, ToolInterface> = {
    get_date: new GetDate(),
    get_weather: new GetWeather(),
    list_workspace: new Workspace(),
    get_file: new GetFile(),
    get_files: new GetFiles(),
  };

  async execute(tool_calls: Array<any>): Promise<Array<any>> {
    let ret: Array<any> = [];

    for (const toolCall of tool_calls) {
      const functionName = toolCall.function?.name ?? "";
      const tool = this.TOOL_CALL_MAP[functionName];
      if (!tool) continue;

      let functionArgs = {};
      try {
        functionArgs = JSON.parse(toolCall.function?.arguments ?? "{}");
      } catch {}

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

  // The mocked version of the tool calls
  get_date_mock() {
    return "2025-12-01";
  }
  get_weather_mock({ location, date }) {
    return `Cloudy 7~13°C at ${location} on ${date}`;
  }
}
