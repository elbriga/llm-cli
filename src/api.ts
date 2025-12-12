import axios from 'axios';
import { AxiosRequestConfig } from 'axios';
import * as fs from 'fs';
import chalk from 'chalk';

interface Message {
  role: string;
  content: string | { type: string, text: string }[];
}

export class llmAPI {
  private url: string;
  private model: string;

  private defaultInstruction = 'You are a helpful assistant';

  // TODO :: Alterar para llm = 'DeepSeek', ...
  private isDeepSeek: boolean;
  private isOllama: boolean;
  private isChatGPT: boolean;

  private urlDeepSeek = 'https://api.deepseek.com/chat/completions';
  private urlOllama   = 'http://localhost:11434/api/chat/';
  //private urlChatGPT  = 'https://...';
  
  private DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

  private messages: Message[] = [];
  private attachedFiles: string[] = [];
  
  constructor() {
    this.isDeepSeek = !!this.DEEPSEEK_API_KEY;
    this.isOllama = !this.isDeepSeek;
    this.isChatGPT = false;

    if (process.env.OLLAMA_HOST)
      this.urlOllama = process.env.OLLAMA_HOST;

    this.url = this.isDeepSeek ? this.urlDeepSeek : this.urlOllama;
    this.model = this.isDeepSeek ? 'deepseek-chat' : 'deepseek-coder:6.7b';

    this.clearMessages();
  }

  async newMessage(message: string, onChunk: (chunk: string) => void) {
    if (!message) return;
        
    this.messages.push({
      role: 'user',
      content: message
    });

    const response = await this.executeRequest(this.messages, onChunk);

    this.messages.push({
      role: 'assistant',
      content: response.content
    });
  }

  private async executeRequest(messages: Message[], onChunk?: (chunk: string) => void): Promise<{ content: string }> {
    const isStrem = !!onChunk;

    const postMessages = [...messages];
    if (this.attachedFiles)
      this.addFilesToMessages(postMessages);

    const postData = {
      model: this.model,
      messages: postMessages,
      stream: true,
    }

    const postOpts: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.DEEPSEEK_API_KEY}`,
      },
      responseType: 'stream',
    };

    console.log('------------------------==== Request ===========>>>>>>>>');
    console.log(`POST URL: ${this.url}`)
    console.log('------------------------========================>>>>>>>>');
    console.dir(postData, {depth:4});
    console.dir(postOpts, {depth:4});
    console.log('------------------------========================>>>>>>>>');

    try {
      const response = await axios.post(this.url, postData, postOpts);

      if (!isStrem) {
        const content =
          response.data?.choices?.[0]?.message?.content ?? // Cloud
          response.data?.message?.content;                 // Ollama

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

          response.data.on('data', (chunk: Buffer) => {
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
              const lines = chunk.toString().split('\n');
              for (const line of lines) {
                if (this.isDeepSeek) {
                  if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    const jsonData = JSON.parse(line.substring(6));
                    const content = jsonData.choices?.[0]?.delta?.content || '';
                    if (content) {
                      // process.stdout.write(content);
                      fullContent += content;
                      onChunk(content);
                    }
                  }
                } else if (this.isOllama) {
                  if (line) {
                    const jsonData = JSON.parse(line);
                    if (jsonData.done) {
                      // TODO get statistics
                      // console.log(jsonData);
                    } else {
                      const content = jsonData.message?.content || '';
                      if (content) {
                        // process.stdout.write(content);
                        fullContent += content;
                        onChunk(content);
                      }
                    }
                  }
                }
              }
            } catch (e) {
              // ignore JSON parsing errors
            }
          });

          response.data.on('end', () => {
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

      return { content: 'API Error!' };
    }
  }

  clearMessages() {
    this.messages = [];
    this.messages.push({
      role: "system",
      content: this.defaultInstruction
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
  
  private addFilesToMessages(messages: Message[]) {
    for (const fileName of this.attachedFiles) {
      if (!fs.existsSync(fileName)) {
        console.error(chalk.red(`Error: File not found: ${fileName}`));
        continue;
      }

      try {
        const fileContent = fs.readFileSync(fileName, 'utf8');
  
        messages.push({
          role: "user",
          content: [
            { type: "text", text: `Attached file: ${fileName}` },
            { type: "text", text: fileContent }
          ]
        });
      } catch (error) {
        console.error(chalk.red(`Error reading file: ${fileName}`), error);
      }
    }
  }
}
