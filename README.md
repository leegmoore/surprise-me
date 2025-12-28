# Multi-Agent Chat

A full-featured AI chat application with multi-agent support. Chat with multiple AI agents simultaneously and get diverse perspectives on your questions.

## Features

- **Multi-Agent Chat**: Chat with multiple AI agents at the same time
- **Multiple Providers**: Support for OpenAI, Anthropic (Claude), and Google GenAI
- **Tool Calling**: Agents can use tools like calculator, web search, weather, and more
- **Agentic Loop**: Agents can chain tool calls to solve complex problems
- **Real-time Streaming**: See responses as they're generated
- **Modern UI**: Beautiful, responsive interface with dark mode support
- **Conversation History**: All conversations are saved locally
- **Agent Management**: Create, edit, and customize your AI agents

## Architecture

```
├── client/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── services/      # API services
│   │   ├── store/         # Zustand state management
│   │   └── types/         # TypeScript types
│   └── ...
├── server/                 # Node.js + Express backend
│   ├── src/
│   │   ├── agents/        # Agent runner with agentic loop
│   │   ├── providers/     # LangChain provider factory
│   │   ├── tools/         # Tool definitions
│   │   └── index.ts       # Express server
│   └── ...
└── package.json           # Root package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- API keys for your preferred AI providers

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd multi-agent-chat
```

2. Install all dependencies:
```bash
npm run install:all
```

3. Set up environment variables:
```bash
cp server/.env.example server/.env
# Edit server/.env with your API keys
```

4. Start the development servers:
```bash
npm run dev
```

The client will be available at `http://localhost:3000` and the server at `http://localhost:3001`.

## Configuration

### API Keys

You can configure API keys in two ways:

1. **Environment Variables**: Set in `server/.env`
2. **UI Settings**: Configure directly in the app's settings panel

### Available Tools

The agents have access to the following tools:

| Tool | Description |
|------|-------------|
| `calculator` | Perform mathematical calculations |
| `current_time` | Get current date and time |
| `web_search` | Search the web for information |
| `weather` | Get weather information |
| `code_executor` | Execute JavaScript code |
| `random_data` | Generate random test data |

### Supported Models

**OpenAI:**
- GPT-4 Turbo
- GPT-4
- GPT-4o / GPT-4o Mini
- GPT-3.5 Turbo

**Anthropic:**
- Claude 3 Opus
- Claude 3 Sonnet
- Claude 3 Haiku
- Claude 3.5 Sonnet

**Google:**
- Gemini Pro
- Gemini 1.5 Pro
- Gemini 1.5 Flash

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Non-streaming chat |
| `/api/chat/stream` | POST | Streaming chat (SSE) |
| `/api/tools` | GET | List available tools |
| `/api/models` | GET | List available models |
| `/api/health` | GET | Health check |

## Development

### Client

```bash
cd client
npm run dev      # Start development server
npm run build    # Build for production
```

### Server

```bash
cd server
npm run dev      # Start development server with hot reload
npm run build    # Build TypeScript
npm start        # Start production server
```

## Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Zustand (state management)
- Vite (build tool)
- React Markdown

### Backend
- Node.js
- Express
- LangChain
- TypeScript

## License

MIT
