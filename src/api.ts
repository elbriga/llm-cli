import axios from 'axios';
import { AxiosRequestConfig } from 'axios';

interface Message {
  role: string;
  content: string;
}

export class llmAPI {
  private url: string;

  private urlDeepSeek = 'https://api.deepseek.com/chat/completions';
  private urlOllama   = 'https://localhost:11434/api/chat/';
  //private urlChatGPT  = 'https://...';
  
  private DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
  
  constructor() {
    if (process.env.OLLAMA_HOST)
      this.urlOllama = process.env.OLLAMA_HOST;

    this.url = this.DEEPSEEK_API_KEY ? this.urlDeepSeek : this.urlOllama;
  }

  async call(messages: Message[]): Promise<{ content: string }> {
    const postData = {
      model: "deepseek-chat",
      messages,
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
    console.dir(postData, {depth:2});
    console.dir(postOpts, {depth:2});
    console.log('------------------------========================>>>>>>>>');

    const response = await axios.post(this.url, postData, postOpts);

    

    return new Promise((resolve, reject) => {
      let receivedData = false;
      let fullContent = "";

      response.data.on('data', (chunk: any) => {
        if (!receivedData) {
          console.log("-------------------========================>>>>>>>>>>>>>>>>>>>>>");
          console.log("Handling stream...");
          console.log("-------------------========================>>>>>>>>>>>>>>>>>>>>>");
          receivedData = true;
        }

        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            const jsonData = JSON.parse(line.substring(6));
            const content = jsonData.choices[0]?.delta?.content || '';
            if (content) {
              process.stdout.write(content);
              fullContent += content;
            }
          }
        }
      });

      response.data.on('end', () => {
        console.log("\n");
        console.log("-------------------========================>>>>>>>>>>>>>>>>>>>>>");
        console.log("END: Stream finished.");
        console.log("-------------------========================>>>>>>>>>>>>>>>>>>>>>");
        
        resolve({ content: fullContent });
      });
    });
  }
}

























async function main22() {
  const STREAM = true;

  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

  if (!DEEPSEEK_API_KEY) {
    console.error("DEEPSEEK_API_KEY is not set in environment variables.");
    process.exit(1);
  }

  try {
    const response = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Hello!" },
          {
            role: 'system',
            content: `File: src/cli.ts
\`\`\`ts
linha 1
linha 2
\`\`\``
          }
        ],
        model: "deepseek-chat",
        stream: STREAM,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        responseType: 'stream',
      }
    );

    if (!STREAM) {
      console.log("-------------------========================>>>>>>>>>>>>>>>>>>>>>");
      console.log("ASSISTANT: ", response.data?.choices?.[0].message?.content);
      console.log("-------------------========================>>>>>>>>>>>>>>>>>>>>>");
    } else {
      console.log("-------------------========================>>>>>>>>>>>>>>>>>>>>>");
      console.log("Handling stream...");
      console.log("-------------------========================>>>>>>>>>>>>>>>>>>>>>");
      response.data.on('data', (chunk: any) => {
        // console.log("CHUNK: ", chunk.toString());
        //data: {"id":"553b036d-1059-4a0b-8b24-24017641c874","object":"chat.completion.chunk","created":1765479108,"model":"deepseek-chat","system_fingerprint":"fp_eaab8d114b_prod0820_fp8_kvcache","choices":[{"index":0,"delta":{"content":" like"},"logprobs":null,"finish_reason":null}]}
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            const jsonData = JSON.parse(line.substring(6));
            const content = jsonData.choices[0]?.delta?.content || '';
            if (content) {
              process.stdout.write(content);
            }
          }
        }
      });
      response.data.on('end', () => {
        console.log("\n");
        console.log("-------------------========================>>>>>>>>>>>>>>>>>>>>>");
        console.log("END: Stream finished.");
        console.log("-------------------========================>>>>>>>>>>>>>>>>>>>>>");
      });
    }
  } catch (error: any) {
    if (error.response) {
      console.error("DeepSeek API error response:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("DeepSeek API no response received:", error.request);
    } else {
      console.error("Error setting up DeepSeek API request:", error.message);
    }
    console.error("Full error:", error);
  }
}
