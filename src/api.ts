import axios from "axios";
import { AxiosRequestConfig } from "axios";
import * as fs from "fs";
import chalk from "chalk";

enum LLM {
  Ollama,
  DeepSeek,
  ChatGPT,
}
interface Message {
  role: string;
  content: string | { type: string; text: string }[];
}

export class llmAPI {
  private llm: LLM;
  private url: string;
  private model: string;
  private apiKey: string;

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
        this.url = process.env.OLLAMA_HOST
          ? process.env.OLLAMA_HOST
          : "http://localhost:11434/api/chat/";
        break;

      case LLM.DeepSeek:
        this.model = "deepseek-chat";
        this.url = "https://api.deepseek.com/chat/completions";
        this.apiKey = process.env.DEEPSEEK_API_KEY!;
        break;

      case LLM.ChatGPT:
        this.model = "???";
        this.url = "https://...";
        this.apiKey = process.env.OPENAI_API_KEY!;
        break;
    }

    this.clearMessages();
  }

  async newMessage(message: string, onChunk: (chunk: string) => void) {
    if (!message) return;

    this.messages.push({
      role: "user",
      content: message,
    });

    const response = await this.executeRequest(this.messages, onChunk);

    this.messages.push({
      role: "assistant",
      content: response.content,
    });
  }

  async oneConversation(prompt: string, instruction?: string): Promise<string> {
    const messages = [
      {
        role: "system",
        content: instruction ?? this.defaultInstruction,
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    const response = await this.executeRequest(messages, undefined, false);

    return response.content;
  }

  private async executeRequest(
    messages: Message[],
    onChunk?: (chunk: string) => void,
    attachFiles?: boolean
  ): Promise<{ content: string }> {
    const isStream = !!onChunk;
    const doAttach = !(attachFiles === false);

    const postMessages = [...messages];
    if (doAttach && this.attachedFiles) this.addFilesToMessages(postMessages);

    const postData = {
      model: this.model,
      messages: postMessages,
      stream: isStream,
    };

    const postOpts: AxiosRequestConfig = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      ...(isStream && { responseType: "stream" }),
    };

    console.log("------------------------==== Request ===========>>>>>>>>");
    console.log(`POST URL: ${this.url}`);
    console.log("------------------------========================>>>>>>>>");
    console.dir(postData, { depth: 4 });
    console.dir(postOpts, { depth: 4 });
    console.log("------------------------========================>>>>>>>>");

    try {
      const response = await axios.post(this.url, postData, postOpts);

      if (!isStream) {
        const content =
          response.data?.choices?.[0]?.message?.content ?? // Cloud
          response.data?.message?.content; // Ollama

        return {
          content,
          //usage: await this.getUsage(requestMessages, content)
        };
      } else {
        const streamOK = response.data?.on ?? false;
        if (!streamOK) {
          return { content: "API ERROR!" };
        }

        // TODO : use reject
        return new Promise((resolve, reject) => {
          // let receivedData = false;
          let fullContent = "";

          response.data.on("data", (chunk: Buffer) => {
            // console.log("-------------------========================>>>>>>>>>>>>>>>>>>>>>");
            // console.log(chunk);
            // console.log("-------------------========================>>>>>>>>>>>>>>>>>>>>>");

            // if (!receivedData) {
            //   console.log("-------------------========================>>>>>>>>>>>>>>>>>>>>>");
            //   console.log("Handling stream...");
            //   console.log("-------------------========================>>>>>>>>>>>>>>>>>>>>>");
            //   receivedData = true;
            // }

            try {
              const lines = chunk.toString().split("\n");
              for (const line of lines) {
                switch (this.llm) {
                  case LLM.DeepSeek:
                  case LLM.ChatGPT:
                    if (line.startsWith("data: ") && line !== "data: [DONE]") {
                      const jsonData = JSON.parse(line.substring(6));
                      const content =
                        jsonData.choices?.[0]?.delta?.content || "";
                      if (content) {
                        // process.stdout.write(content);
                        fullContent += content;
                        onChunk(content);
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
                          onChunk(content);
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
            console.log("\n");
            // console.log("-------------------========================>>>>>>>>>>>>>>>>>>>>>");
            // console.log("END: Stream finished.");
            // console.log("-------------------========================>>>>>>>>>>>>>>>>>>>>>");

            resolve({ content: fullContent });
          });
        });
      }
    } catch (error: any) {
      // if (error.response) {
      //   console.error("DeepSeek API error response:", error.response.status, error.response.data);
      // } else if (error.request) {
      //   console.error("DeepSeek API no response received:", error.request);
      // } else {
      //   console.error("Error setting up DeepSeek API request:", error.message);
      // }
      console.error("Full error:", error);

      return { content: "API Error!" };
    }
  }

  clearMessages() {
    this.messages = [];
    this.messages.push({
      role: "system",
      content: this.defaultInstruction,
    });
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
    ret += `// ========\n`;
    return ret;
  }

  private addFilesToMessages(messages: Message[]) {
    for (const fileName of this.attachedFiles) {
      if (!fs.existsSync(fileName)) {
        console.error(chalk.red(`Error: File not found: ${fileName}`));
        continue;
      }

      try {
        const fileContent = fs.readFileSync(fileName, "utf8");

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
