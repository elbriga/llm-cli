import axios from "axios";
import { AxiosRequestConfig } from "axios";
import * as fs from "fs";
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
  private url: string;
  private model: string;
  private apiKey: string;
  private maxTokens: number;

  private debug: boolean = false;

  private tools = new Tools();

  private defaultInstruction = "You are a helpful assistant";
  private messages: Message[] = [];
  private attachedFiles: string[] = [];

  constructor() {
    this.llm = process.env.DEEPSEEK_API_KEY
      ? LLM.DeepSeek
      : process.env.OPENAI_API_KEY
      ? LLM.ChatGPT
      : LLM.Ollama;

    switch (this.llm) {
      case LLM.Ollama:
        this.model = "deepseek-coder:6.7b";
        this.apiKey = "";
        this.maxTokens = 64 * 1024;
        this.url = process.env.OLLAMA_HOST
          ? process.env.OLLAMA_HOST
          : "http://localhost:11434/api/chat/";
        break;

      case LLM.DeepSeek:
        this.model = "deepseek-reasoner";
        this.maxTokens = 64 * 1024;
        this.url = "https://api.deepseek.com/chat/completions";
        this.apiKey = process.env.DEEPSEEK_API_KEY!;
        break;

      case LLM.ChatGPT:
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

  async newMessage(
    instruction: string,
    message: string,
    onChunk?: (chunk: string) => void,
    onReasoning?: (chunk: string) => void,
    onToolCalled?: (toolCalled: string) => void
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
        onReasoning
      );

      if (!response.tool_calls?.length) break;

      this.messages.push({
        role: "assistant",
        content: response.content,
        reasoning_content: response.reasoning,
        tool_calls: response.tool_calls,
      });

      const toolsMessages = await this.tools.execute(
        response.tool_calls,
        onToolCalled
      ); // TODO onTools para feedback
      this.messages.push(...toolsMessages);
    }

    this.messages.push({
      role: "assistant",
      content: response.content,
    });

    return response.content;
  }

  async oneConversation333(
    instruction: string,
    prompt: string
  ): Promise<string> {
    const messages = [
      {
        role: "user",
        content: prompt,
      },
    ];

    const response = await this.executeRequest(
      messages,
      instruction,
      undefined,
      undefined,
      false
    );

    return response.content;
  }

  private async executeRequest(
    messages: Message[],
    instruction?: string,
    onChunk?: (chunk: string) => void,
    onReasoning?: (chunk: string) => void,
    attachFiles?: boolean
  ): Promise<{
    content: string;
    reasoning: string;
    tool_calls: Array<any>;
    usage: object;
  }> {
    const isStream = !!onChunk;
    const doAttach = !(attachFiles === false);

    const postMessages: Message[] = [...messages];
    // Add SYSTEM role
    postMessages.unshift({
      role: "system",
      content: instruction ?? this.defaultInstruction,
    });

    if (doAttach && this.attachedFiles) this.addFilesToMessages(postMessages);

    const postData = {
      model: this.model,
      messages: postMessages,
      max_tokens: this.maxTokens,
      stream: isStream,
      thinking: { type: "enabled" },
      tools: this.tools.getDescriptions(),
    };

    const postOpts: AxiosRequestConfig = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
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
        const content =
          response.data?.choices?.[0]?.message?.content ?? // Cloud
          response.data?.message?.content; // Ollama
        const reasoning =
          response.data?.choices?.[0]?.message?.reasoning_content ?? "";
        const tool_calls =
          response.data?.choices?.[0]?.message?.tool_calls ?? null;

        if (this.debug) {
          console.log("--------==== Response ===========>>>>>>>>");
          console.dir(response.data, {
            depth: null,
          });
          console.log("--------==== Response ===========>>>>>>>>");
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

        ret = await this.handleStream(response, onChunk, onReasoning);
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
    onReasoning?: (chunk: string) => void
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
                    } else if (toolCall) {
                      toolCall.function.arguments += funcionArgs;
                    }
                  }

                  const finish_reason =
                    jsonData.choices?.[0]?.finish_reason ?? "";
                  if (finish_reason) {
                    switch (finish_reason) {
                      case "tool_calls":
                        toolCalls.push(toolCall);
                        break;
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
                if (line) {
                  const jsonData = JSON.parse(line);
                  if (jsonData.done) {
                    // TODO get statistics
                    // console.log(jsonData);
                  } else {
                    const content = jsonData.message?.content || "";
                    if (content) {
                      // process.stdout.write(content);
                      fullContent += content;
                      onChunk?.(content);
                    }
                  }
                }
                break;
            }
          }
        } catch (e) {
          // ignore JSON parsing errors
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
          console.log("\n--------==== Response ===========>");
          console.dir(ret, { depth: null });
          console.log("--------==== Response ===========>");
        }

        resolve(ret);
      });

      response.data.on("error", reject);
    });
  }

  clearMessages() {
    this.messages = [];
  }

  attachFile(file: string) {
    if (this.attachedFiles.includes(file)) {
      return;
    }

    if (!fs.existsSync(file)) {
      console.error(chalk.red(`Error: File not found: ${file}`));
      return;
    }

    this.attachedFiles.push(file);
  }

  getHistoryString(): string {
    let ret = "";
    for (const msg of this.messages) {
      ret += `// ====${msg.role}====\n`;
      ret += `${msg.content}\n`;
    }
    if (ret) ret += `// ========\n`;
    return ret;
  }

  private addFilesToMessages(messages: Message[]) {
    for (const fileName of this.attachedFiles) {
      if (!fs.existsSync(fileName)) {
        console.error(chalk.red(`Error: File not found: ${fileName}`));
        continue;
      }

      try {
        let fileContent = fs.readFileSync(fileName, "utf8");
        fileContent = fileContent.replace(/<DIFF>/gi, "<___D_I_F_F___>");
        fileContent = fileContent.replace(/<\/DIFF>/gi, "</___D_I_F_F___>");

        messages.push({
          role: "user",
          content: [
            { type: "text", text: `Attached file: ${fileName}` },
            { type: "text", text: fileContent },
          ],
        });
      } catch (error) {
        console.error(chalk.red(`Error reading file: ${fileName}`), error);
      }
    }
  }
}
