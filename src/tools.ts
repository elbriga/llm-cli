export class Tools {
  private readonly TOOL_CALL_MAP = {
    get_date: this.get_date_mock,
    get_weather: this.get_weather_mock,
  };

  async execute(tool_calls: Array<any>): Promise<Array<any>> {
    let ret: Array<any> = [];

    for (const toolCall of tool_calls) {
      const functionName = toolCall.function?.name ?? "";
      const func = this.TOOL_CALL_MAP[functionName] ?? false;
      if (func) {
        const toolResponse = func(); // TODO args
        ret.push({
          role: "tool",
          name: functionName,
          arguments: "", // TODO args
          tool_call_id: toolCall.id,
          content: toolResponse,
        });
      }
    }

    return ret;
  }

  getDescriptions() {
    return [
      {
        type: "function",
        function: {
          name: "get_date",
          description: "Get the current date",
          parameters: { type: "object", properties: {} },
        },
      },
      {
        type: "function",
        function: {
          name: "get_weather",
          description:
            "Get weather of a location, the user should supply the location and date.",
          parameters: {
            type: "object",
            properties: {
              location: { type: "string", description: "The city name" },
              date: {
                type: "string",
                description: "The date in format YYYY-mm-dd",
              },
            },
            required: ["location", "date"],
          },
        },
      },
    ];
  }

  // The mocked version of the tool calls
  get_date_mock() {
    return "2025-12-01";
  }
  get_weather_mock(location, date) {
    return "Cloudy 7~13°C";
  }
}
