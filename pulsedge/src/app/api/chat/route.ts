import { NextRequest } from 'next/server';
import { streamChatResponse } from '@/lib/claude';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { messages, isLoggedIn } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response('Invalid messages', { status: 400 });
    }

    const stream = await streamChatResponse(messages, !!isLoggedIn);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('Chat error:', err);
    return new Response('Internal server error', { status: 500 });
  }
}
