import { ToolInterface } from "../tools.ts";

export class GetDate implements ToolInterface {
  getDescription(): object {
    return {
      name: "get_date",
      description: "Get the current date on the format YYYY-MM-DD",
      parameters: { type: "object", properties: {} },
    };
  }

  execute(): string {
    const now = new Date().toISOString().slice(0, 10);

    return now;
  }
}
