# Multi-Agent Chat

A full-featured AI chat application with multi-agent support. Chat with multiple AI agents simultaneously and get diverse perspectives on your questions.

## Features

- **Multi-Agent Chat**: Chat with multiple AI agents at the same time
- **Multiple Providers**: Support for OpenAI, Anthropic (Claude), and Google GenAI
- **Tool Calling**: Agents can use tools like calculator, web search, weather, and more
- **Agentic Loop**: Agents can chain tool calls to solve complex problems (max 10 iterations)
- **Real-time Streaming**: See responses as they're generated via SSE
- **Modern UI**: Beautiful, responsive interface with dark mode support
- **Keyboard Shortcuts**: `⌘K` new chat, `⌘B` toggle sidebar, `⌘,` settings
- **Conversation History**: All conversations are saved locally with search and export
- **Agent Management**: Create, edit, and customize your AI agents
- **Error Handling**: Comprehensive error boundaries and graceful degradation
- **Rate Limiting**: Built-in protection against API abuse
- **Request Validation**: Zod-based input validation on all endpoints

## Architecture

```
├── client/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/    # UI components with ErrorBoundary
│   │   ├── services/      # API services with AbortController
│   │   ├── store/         # Zustand state management
│   │   └── types/         # TypeScript types
│   └── ...
├── server/                 # Node.js + Express backend
│   ├── src/
│   │   ├── agents/        # Agent runner with agentic loop
│   │   ├── middleware/    # Validation, rate limiting, security
│   │   ├── providers/     # LangChain provider factory
│   │   ├── tools/         # Safe tool definitions
│   │   └── __tests__/     # Test suites
│   └── ...
├── .github/workflows/     # CI/CD pipelines
├── Dockerfile             # Production Docker image
├── docker-compose.yml     # Docker Compose configuration
└── package.json           # Root package.json
```

## Quick Start

### Using Docker (Recommended)

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f
```

### Manual Installation

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

Configure API keys in two ways:

1. **Environment Variables**: Set in `server/.env`
2. **UI Settings**: Configure directly in the app's settings panel (⌘,)

### Available Tools

| Tool | Description |
|------|-------------|
| `calculator` | Safe mathematical calculations (supports sqrt, pow, trig, etc.) |
| `current_time` | Get current date and time in various formats/timezones |
| `web_search` | Search the web for information (simulated) |
| `weather` | Get weather information (simulated) |
| `json_processor` | Process and transform JSON data safely |
| `random_data` | Generate random test data (uuid, name, email, etc.) |
| `url_info` | Parse and extract information from URLs |

### Supported Models

**OpenAI:**
- GPT-4 Turbo, GPT-4, GPT-4o, GPT-4o Mini, GPT-3.5 Turbo

**Anthropic:**
- Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku, Claude 3.5 Sonnet

**Google:**
- Gemini Pro, Gemini 1.5 Pro, Gemini 1.5 Flash

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Non-streaming chat |
| `/api/chat/stream` | POST | Streaming chat (SSE) |
| `/api/tools` | GET | List available tools with schemas |
| `/api/models` | GET | List available models by provider |
| `/api/info` | GET | Server info and capabilities |
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
npm run dev        # Start with hot reload
npm run build      # Build TypeScript
npm run test       # Run tests
npm run test:watch # Run tests in watch mode
npm run lint       # Lint code
npm run format     # Format code
npm run typecheck  # Type check
```

### Testing

```bash
# Run all server tests
cd server && npm test

# Run with coverage
npm run test:coverage
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | New conversation |
| `⌘B` / `Ctrl+B` | Toggle sidebar |
| `⌘,` / `Ctrl+,` | Open settings |
| `Escape` | Cancel ongoing requests |

## Security

- **Safe Code Execution**: Removed dangerous `eval`-like code execution; replaced with safe math parser
- **Input Validation**: All inputs validated with Zod schemas
- **Rate Limiting**: Built-in rate limiting (60 req/min in production)
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- **CORS Protection**: Configurable origin whitelist in production
- **Request Timeouts**: 2-minute timeout on all chat requests
- **Graceful Shutdown**: Proper handling of SIGTERM/SIGINT

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS
- Zustand (state management)
- Vite (build tool)
- React Markdown with syntax highlighting

### Backend
- Node.js + Express
- LangChain (OpenAI, Anthropic, Google GenAI)
- Zod (validation)
- TypeScript
- Vitest (testing)

### DevOps
- Docker + Docker Compose
- GitHub Actions CI/CD
- ESLint + Prettier

## License

MIT
