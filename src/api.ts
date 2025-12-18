import axios from "axios";
import { AxiosRequestConfig } from "axios";
import chalk from "chalk";

import { Tools } from "./tools.ts";

enum LLM {
  Ollama,
  DeepSeek,
  ChatGPT,
}
interface Message {
  role: string;
  content: string | { type: string; text: string }[];
  reasoning_content?: string | { type: string; text: string }[];
  tool_calls?: Array<any>;
}

export class llmAPI {
  private llm: LLM;
  private name: string;
  private url: string;
  private model: string;
  private apiKey: string;
  private maxTokens: number;
  private temperature: number = 0.1;

  private debug: boolean = false;

  private tools = new Tools();

  private defaultInstruction = "You are a helpful assistant";
  private messages: Message[] = [];

  constructor() {
    this.llm = process.env.DEEPSEEK_API_KEY
      ? LLM.DeepSeek
      : process.env.OPENAI_API_KEY
      ? LLM.ChatGPT
      : LLM.Ollama;

    switch (this.llm) {
      case LLM.Ollama:
        this.name = "Ollama";
        this.model = "llama3.2"; //"deepseek-coder:6.7b";
        this.apiKey = "";
        this.maxTokens = 64 * 1024;
        this.url = process.env.OLLAMA_HOST
          ? process.env.OLLAMA_HOST
          : "http://localhost:11434/api/chat/";
        break;

      case LLM.DeepSeek:
        this.name = "DeepSeek";
        this.model = "deepseek-reasoner";
        this.maxTokens = 64 * 1024;
        this.url = "https://api.deepseek.com/chat/completions";
        this.apiKey = process.env.DEEPSEEK_API_KEY!;
        break;

      case LLM.ChatGPT:
        this.name = "ChatGPT";
        this.model = "???";
        this.maxTokens = 64 * 1024;
        this.url = "https://...";
        this.apiKey = process.env.OPENAI_API_KEY!;
        break;
    }

    this.clearMessages();
  }

  debugON() {
    this.debug = true;
  }

  banner() {
    console.log(chalk.green("Welcome to LLM-CLI!"));
    console.log("");
    console.log(chalk.white("LLM         > ") + chalk.blueBright(this.name));
    console.log(chalk.white("Model       > ") + chalk.blueBright(this.model));
    console.log(chalk.white("URL         > ") + chalk.blueBright(this.url));
    console.log(
      chalk.white("Temperature > ") + chalk.blueBright(this.temperature)
    );
    console.log(
      chalk.white("MaxTokens   > ") + chalk.blueBright(this.maxTokens)
    );
    console.log("");
  }

  async newMessage(
    instruction: string,
    message: string,
    onChunk?: (chunk: string) => void,
    onReasoning?: (chunk: string) => void,
    onToolCalling?: (chunk: string) => void
  ): Promise<string> {
    if (!message) return "";

    this.messages.push({
      role: "user",
      content: message,
    });

    let response;
    // Tools Loop
    while (true) {
      response = await this.executeRequest(
        this.messages,
        instruction,
        onChunk,
        onReasoning,
        onToolCalling
      );

      if (!response.tool_calls?.length) break;

      this.messages.push({
        role: "assistant",
        content: response.content,
        reasoning_content: response.reasoning,
        tool_calls: response.tool_calls,
      });

      const toolsMessages = await this.tools.execute(response.tool_calls);
      this.messages.push(...toolsMessages);
    }

    this.messages.push({
      role: "assistant",
      content: response.content,
    });

    return response.content;
  }

  private async executeRequest(
    messages: Message[],
    instruction?: string,
    onChunk?: (chunk: string) => void,
    onReasoning?: (chunk: string) => void,
    onToolArgs?: (chunk: string) => void
  ): Promise<{
    content: string;
    reasoning: string;
    tool_calls: Array<any>;
    usage: object;
  }> {
    const isStream = !!onChunk;

    const postMessages: Message[] = [...messages];
    // Add SYSTEM role
    postMessages.unshift({
      role: "system",
      content: instruction ?? this.defaultInstruction,
    });

    const postData = {
      model: this.model,
      messages: postMessages,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      stream: isStream,
      thinking: { type: "enabled" },
      tools: this.tools.getDescriptions(),
    };

    const postOpts: AxiosRequestConfig = {
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      },
      ...(isStream && { responseType: "stream" }),
    };

    if (this.debug) {
      console.log("------------------------==== Request ===========>>>>>>>>");
      console.log(`POST URL: ${this.url}`);
      console.log("------------------------========================>>>>>>>>");
      console.dir(postData, { depth: null });
      console.dir(postOpts, { depth: null });
      console.log("------------------------========================>>>>>>>>");
    }

    try {
      let ret;
      const response = await axios.post(this.url, postData, postOpts);

      if (!isStream) {
        if (this.debug) {
          console.log("--------==== Response ===========>>>>>>>>");
          console.dir(response.data, { depth: null });
          console.log("--------==== Response ===========>>>>>>>>");
        }

        let content = "";
        let reasoning = "";
        let tool_calls = undefined;

        switch (this.llm) {
          case LLM.DeepSeek:
          case LLM.ChatGPT:
            content = response.data?.choices?.[0]?.message?.content ?? "";
            reasoning =
              response.data?.choices?.[0]?.message?.reasoning_content ?? "";
            tool_calls = response.data?.choices?.[0]?.message?.tool_calls;
            break;

          case LLM.Ollama:
            content = response.data?.message?.content ?? "";
            tool_calls = response.data?.message?.tool_calls;
            break;
        }

        ret = {
          content,
          reasoning,
          tool_calls,
          // TODO usage: await this.getUsage(requestMessages, content)
        };
      } else {
        const streamOK = response.data?.on ?? false;
        if (!streamOK) {
          throw { error: "API ERROR !response.data?.on" };
        }

        ret = await this.handleStream(
          response,
          onChunk,
          onReasoning,
          onToolArgs
        );
      }

      return ret;
    } catch (error: any) {
      // if (error.response) {
      //   console.error("DeepSeek API error response:", error.response.status, error.response.data);
      // } else if (error.request) {
      //   console.error("DeepSeek API no response received:", error.request);
      // } else {
      //   console.error("Error setting up DeepSeek API request:", error.message);
      // }
      console.error("Full error:", error);

      throw error;
    }
  }

  private async handleStream(
    response: any,
    onChunk?: (chunk: string) => void,
    onReasoning?: (chunk: string) => void,
    onToolArgs?: (chunk: string) => void
  ): Promise<{
    content: string;
    reasoning: string;
    tool_calls: Array<any>;
    usage: object;
  }> {
    return new Promise((resolve, reject) => {
      let fullContent = "";
      let fullReasoning = "";
      let reasoningNewLine = false;
      let toolCalls: Array<any> = [];

      let toolCall;

      response.data.on("data", (chunk: Buffer) => {
        // console.log("-------------===========>>>>>>>>>>>>>>>>>>>>>");
        // console.log(chunk.toString());
        // console.log("-------------===========>>>>>>>>>>>>>>>>>>>>>");

        try {
          const lines = chunk.toString().split("\n");
          for (const line of lines) {
            if (!line) continue;

            switch (this.llm) {
              case LLM.DeepSeek:
              case LLM.ChatGPT:
                if (line.startsWith("data: ") && line !== "data: [DONE]") {
                  const jsonData = JSON.parse(line.substring(6));
                  if (this.debug) {
                    console.dir(jsonData, { depth: null });
                  }

                  const reasoning =
                    jsonData.choices?.[0]?.delta?.reasoning_content || "";
                  if (reasoning) {
                    fullReasoning += reasoning;
                    onReasoning?.(reasoning);
                  }
                  if (fullReasoning && !reasoning && !reasoningNewLine) {
                    reasoningNewLine = true;
                    onReasoning?.("\n");
                  }

                  const content = jsonData.choices?.[0]?.delta?.content || "";
                  if (content) {
                    fullContent += content;
                    onChunk?.(content);
                  }

                  const tool_call =
                    jsonData.choices?.[0]?.delta?.tool_calls?.[0];
                  if (tool_call) {
                    const funcionName = tool_call.function?.name ?? "";
                    const funcionArgs = tool_call.function?.arguments ?? "";
                    if (funcionName) {
                      // Start the args capture
                      toolCall = tool_call;
                      toolCall.function.arguments = funcionArgs;
                      onToolArgs?.(`Calling Tool > ${funcionName} (`);
                    } else if (toolCall) {
                      toolCall.function.arguments += funcionArgs;
                    }
                    onToolArgs?.(funcionArgs);
                  }

                  const finish_reason =
                    jsonData.choices?.[0]?.finish_reason ?? "";
                  if (finish_reason) {
                    if (toolCall) {
                      toolCalls.push(toolCall);
                      onToolArgs?.(")\n");
                    }

                    if (fullContent) onChunk?.("\n");

                    const usage = jsonData.usage ?? "";
                    if (usage) {
                      // TODO
                    }
                  }
                }
                break;

              case LLM.Ollama:
                const jsonData = JSON.parse(line);
                // console.log("-------------==>>>>>>>>>>>>>");
                // console.dir(jsonData, { depth: null });
                // console.log("-------------==>>>>>>>>>>>>>");

                const content = jsonData.message?.content || "";
                if (content) {
                  fullContent += content;
                  onChunk?.(content);
                }

                const tool_call = jsonData.message?.tool_calls?.[0];
                if (tool_call && tool_call.function?.name)
                  toolCalls.push(tool_call);

                if (jsonData.done) {
                  // TODO get statistics
                  // console.log(jsonData);
                }
                break;
            }
          }
        } catch (e) {
          // ignore JSON parsing errors
          // TODO mover o try para pegar somente os parse
        }
      });

      response.data.on("end", () => {
        const ret = {
          content: fullContent,
          reasoning: fullReasoning,
          tool_calls: toolCalls,
          usage: {}, // TODO
        };

        if (this.debug) {
          console.log("\n--------==== Stream Response ===========>");
          console.dir(ret, { depth: null });
          console.log("--------==== Stream Response ===========>");
        }

        resolve(ret);
      });

      response.data.on("error", reject);
    });
  }

  clearMessages() {
    this.messages = [];
  }

  setTemperature(t: number) {
    this.temperature = t;
  }
}
