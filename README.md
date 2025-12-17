# LLM CLI

A command-line interface for interacting with various Large Language Models (LLMs) with built-in tool support for development tasks.

#LLM #DeepSeek #Ollama #ChatGPT #CLI #Tools

## Overview

LLM-CLI is a TypeScript-based command-line interface that allows you to interact with multiple LLM providers (DeepSeek, Ollama, ChatGPT) through a unified interface. The tool features built-in capabilities for file management, workspace operations, and development tasks through an extensible tool system.

## Features

- **Multi-LLM Support**: Switch between DeepSeek, Ollama, and ChatGPT
- **Tool Integration**: Built-in tools for file operations, npm package management, weather info, and more
- **Streaming Responses**: Real-time response streaming with reasoning display
- **Conversation Management**: Maintain conversation context with temperature control
- **File Operations**: Read, write, edit, and list files in your workspace
- **Development Tools**: Install npm packages, manage dependencies, and more

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- For Ollama: Ollama installed and running locally

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd llm-cli
```

2. Install dependencies:
```bash
npm install
```

3. Configure API keys (optional):
   - For DeepSeek: Set `DEEPSEEK_API_KEY` environment variable
   - For ChatGPT: Set `OPENAI_API_KEY` environment variable
   - For Ollama: Ensure Ollama is running (default: http://localhost:11434)

4. Start the CLI:
```bash
npm start
```

## Usage

### Basic Commands

Once started, you'll see a banner with LLM configuration. Type your questions or commands:

```
LLM> What's the weather in Tokyo tomorrow?
```

### Interactive Commands

Use slash commands for system operations:

- `/help` or `/h` - Show help
- `/exit`, `/quit`, `/q`, or `/x` - Exit the program
- `/clear` or `/c` - Clear conversation history
- `/temp <value>` or `/t <value>` - Set temperature (0.0 to 1.0)
- `/debug` or `/d` - Enable debug mode

## Available Tools

The LLM has access to the following tools for assisting with development tasks:

### File Operations
- **`list_workspace`** - List files in the workspace
- **`get_file`** - Read the contents of a single file
- **`get_files`** - Read multiple files using glob patterns
- **`new_file`** - Create or overwrite a file
- **`edit_file`** - Edit an existing file with new content

### Development Tools
- **`npm_install`** - Install npm packages (specific packages or all dependencies)
  - Parameters:
    - `packages` (array): Package names to install (optional)
    - `dev` (boolean): Install as dev dependency (default: false)
    - `global` (boolean): Install globally (default: false)

### Utility Tools
- **`get_date`** - Get current date (YYYY-MM-DD)
- **`get_weather`** - Get weather information for a location and date

## Examples

### File Operations
```
LLM> Show me the contents of src/tools.ts
[Tool Called: get_file({"file_name":"src/tools.ts"})]
... file contents displayed ...

LLM> Create a new file called test.js with console.log("Hello World")
[Tool Called: new_file({"file_name":"test.js","content":"console.log(\"Hello World\")"})]
FILE WRITTEN

LLM> Edit test.js to add a function
[Tool Called: edit_file({"file_name":"test.js","content":"function greet() {\\n  console.log(\"Hello World\");\\n}\\n\\ngreet();"})]
FILE_EDITED_SUCCESSFULLY
```

### Package Management
```
LLM> Install express and cors as dependencies
[Tool Called: npm_install({"packages":["express","cors"]})]
Successfully installed packages: express, cors

LLM> Install jest as a dev dependency
[Tool Called: npm_install({"packages":["jest"],"dev":true})]
Successfully installed packages: jest

LLM> Install all dependencies from package.json
[Tool Called: npm_install({})]
Successfully installed all dependencies from package.json
```

### Project Analysis
```
LLM> List all TypeScript files in the project
[Tool Called: get_files({"glob_pattern":"**/*.ts"})]
... files displayed ...

LLM> What's the current date?
[Tool Called: get_date({})]
2024-01-15
```

## Configuration

### LLM Selection
The CLI automatically selects the LLM based on available API keys:
1. DeepSeek (if `DEEPSEEK_API_KEY` is set)
2. ChatGPT (if `OPENAI_API_KEY` is set) 
3. Ollama (default, requires Ollama running locally)

### Environment Variables
- `DEEPSEEK_API_KEY`: Your DeepSeek API key
- `OPENAI_API_KEY`: Your OpenAI API key
- `OLLAMA_HOST`: Custom Ollama host URL (default: http://localhost:11434)

### Default Settings
- Model: DeepSeek uses `deepseek-reasoner`, Ollama uses `llama3.2`
- Temperature: 0.1 (adjustable with `/temp` command)
- Max Tokens: 65536

## Project Structure

```
llm-cli/
├── src/
│   ├── api.ts              # LLM API communication
│   ├── cli.ts              # Command-line interface
│   ├── index.ts            # Main entry point
│   ├── tools.ts            # Tool registry and interface
│   └── tools/              # Individual tool implementations
│       ├── workspace.ts    # List workspace files
│       ├── getFile.ts      # Read single file
│       ├── getFiles.ts     # Read multiple files
│       ├── newFile.ts      # Create files
│       ├── editFile.ts     # Edit files
│       ├── npmInstall.ts   # Install npm packages
│       ├── getDate.ts      # Get current date
│       └── getWeather.ts   # Get weather info
├── package.json
└── README.md
```

## Development

### Adding New Tools
To add a new tool:
1. Create a new file in `src/tools/` implementing the `ToolInterface`
2. Import and register the tool in `src/tools.ts`
3. Update the README with tool documentation

### Building
The project uses TypeScript with tsx for execution. No separate build step is required for development.

## License

[Add appropriate license information here]

## Contributing

[Add contribution guidelines here]

## Acknowledgments

- Built with TypeScript and Node.js
- Uses Axios for HTTP requests
- Supports DeepSeek, Ollama, and ChatGPT APIs
- Inspired by various CLI tools and AI assistants

## This file was generated by Deepseek! Using this tool :)
