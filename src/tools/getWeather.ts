import { ToolInterface } from "../tools.ts";

export class GetWeather implements ToolInterface {
  getDescription(): object {
    return {
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
    };
  }

  execute({ location, date }) {
    // Mock
    return `Cloudy 7~13°C at ${location} on ${date}`;
  }
}
