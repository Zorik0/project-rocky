# Project Rocky

Chat with Rocky, the Eridian engineer from Andy Weir's *Project Hail Mary*. He talks the way he does in the book: short literal sentences, "Question?" before every question, "Amaze! Amaze! Amaze!" when he's happy, and a lot of worry about how fragile humans are.

Try it at [project-rocky-seven.vercel.app](https://project-rocky-seven.vercel.app). It installs as an app on your phone and has an offline screen for when you lose signal.

## How it works

- `app/page.tsx` is the chat screen, with an animated Rocky avatar that listens while you type and moves when he speaks.
- `app/api/chat/route.ts` sends the conversation to DeepSeek's `deepseek-chat` model with a system prompt that keeps Rocky in character.
- `app/manifest.ts` and `app/offline/page.tsx` make it an installable PWA.

Built with Next.js 16, React 19 and Framer Motion.

## Run it locally

```bash
npm install
echo "DEEPSEEK_API_KEY=your-key" > .env.local
npm run dev
```

Then open http://localhost:3000.

Rocky is a character from *Project Hail Mary* by Andy Weir. This is an unofficial fan project.
