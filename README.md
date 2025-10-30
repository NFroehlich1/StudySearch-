# StudySearch - KIT Mechatronics Course Planner

## Project Overview

StudySearch is an AI-powered course planning tool for KIT Mechatronics and Information Technology students. It combines conversational AI with a comprehensive module library to help students plan their semester efficiently.

## Features

- 🤖 **AI Conversation Interface**: Chat with an AI course guide powered by ElevenLabs
- 📚 **Module Library**: Browse and search through 300+ official KIT modules
- 📊 **Semester Planner**: Drag-and-drop courses into semesters with ECTS tracking
- 🔍 **Smart Filters**: Filter modules by term, type, specialization area, and subcategory
- 📄 **PDF Handbook Integration**: Direct links to module pages in the official handbook
- ✨ **Automated Course Extraction**: AI automatically extracts course bookings from conversations

## Getting Started

### Prerequisites

- Node.js 18+ installed ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))

### Installation

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd StudySearch

# Step 3: Install dependencies
npm i

# Step 4: Set up environment variables
cp .env.example .env

# Edit .env with your API keys:
# - VITE_GEMINI_API_KEY: Get from https://makersuite.google.com/app/apikey
# - VITE_ELEVENLABS_API_KEY: Get from https://elevenlabs.io
# - VITE_ELEVENLABS_AGENT_ID: Your ElevenLabs agent ID

# Step 5: Start the development server
npm run dev
```

Open `http://localhost:8080` in your browser.

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
VITE_ELEVENLABS_AGENT_ID=your_agent_id_here
```

**Important**: Never commit your `.env` file to version control!

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/3d94c844-5c1e-411a-8513-92c2923a1780) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
