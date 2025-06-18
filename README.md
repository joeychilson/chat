# Chat

An AI chat application built with SvelteKit that you can host anywhere that supports Node.js!

NOTE: This is in acitve development. Things will change fast.

## Features

### 🤖 Multi-Provider AI Support

- **Anthropic**: Claude Sonnet 4 with thinking mode
- **Google**: Gemini 2.0 Flash with search grounding and thinking capabilities
- **OpenAI**: GPT models with reasoning and o1 series support
- **xAI**: Grok models with reasoning effort control

### 💬 Advanced Chat Features

- Real-time streaming responses
- Message editing and regeneration
- Chat branching and conversation trees
- Automatic chat title generation
- Pinned conversations
- Message retry with different models

### 📁 File Support

- File management with storage
- Recent files tracking to easy reuse.
- If the model supports the file type you can upload it.

### 🎨 Media Generation

- AI-generated images
- Text-to-speech synthesis
- Audio file creation and playback
- Media creations gallery

### 🔧 User Experience

- Responsive design with mobile support
- Dark/light mode switching
- Customizable model settings and options
- Speech synthesis with voice and speed controls
- Auto-scroll with manual override
- Keyboard shortcuts and accessibility features

### 🔐 Authentication & Security

- Secure authentication with Better Auth
- Session management
- User settings and preferences
- Account deletion and data management

## Tech Stack

### Frontend

- **SvelteKit 2** - Full-stack web framework
- **Svelte 5** - Reactive UI components
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Bits UI** - Accessible component primitives
- **Shiki** - Syntax highlighting for code blocks

### Backend

- **Node.js** - Runtime environment
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage
- **MinIO** - Object storage for files
- **Better Auth** - Authentication system

### AI Integration

- **AI SDK** - Unified AI provider interface
- **Streaming** - Real-time response delivery
- **Multiple Providers** - Support for major AI services

## Getting Started

### Prerequisites

- Node.js
- PostgreSQL database
- Redis server
- MinIO object storage (or S3-compatible storage)
- API keys for desired AI providers

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd chat
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:

```bash
pnpm db:migrate
```

5. Start the development server:

```bash
pnpm dev
```

### Environment Configuration

Configure the following environment variables in your `.env` file:

```env
# Application Configuration
PUBLIC_BASE_URL=http://localhost:5173
BODY_SIZE_LIMIT=50M

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/chat
REDIS_URL=redis://localhost:6379

# Object Storage
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=chat-files

# AI Provider API Keys
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key
GOOGLE_API_KEY=your-google-key
XAI_API_KEY=your-xai-key

# Authentication
AUTH_SECRET=your-auth-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Lint code with ESLint and Prettier
- `pnpm check` - Type check with Svelte
- `pnpm format` - Format code with Prettier
- `pnpm flc` - Run format, lint, and check together
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio

## Deployment

### Docker

Build and run with Docker:

```bash
# Build the image
docker build -t chat .

# Run the container
docker run -p 3000:3000 --env-file .env chat
```

### Environment Setup

The application is designed to work with:

- **App Platforms** (Set GCP_BUILDPACKS=true to make adapter-auto build for Node)
- **Google Cloud Platform** (adapter-auto detects GCP)
- **Vercel** or other Node.js platforms supported by adapter-auto
- **Self-hosted** with Docker

## Configuration

### Model Options

Each AI provider supports specific options:

- **Anthropic**: Thinking mode for enhanced reasoning
- **Google**: Search grounding and thinking configuration
- **OpenAI**: Reasoning modes, image quality settings
- **xAI**: Reasoning effort levels

### File Storage

Configure MinIO or S3-compatible storage for file uploads and media generation. The application automatically handles file processing, storage, and serving.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting: `pnpm flc`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
