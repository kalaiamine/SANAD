import { NextRequest, NextResponse } from 'next/server';
import { groqChatJSON, GroqConfigError, type GroqMessage } from '@/lib/ai/groqClient';
import {
    FNOL_SYSTEM_PROMPT,
    buildFnolUserTurn,
    computeMissingFields,
    EMPTY_FNOL_COLLECTED,
    type FnolChatResult,
    type FnolCollectedData,
} from '@/lib/ai/fnolPrompt';

export const runtime = 'nodejs';

interface ChatTurn {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatRequestBody {
    /** Full conversation so far, oldest first. The API route is stateless. */
    history: ChatTurn[];
    /** Latest structured data already extracted, so the model doesn't forget it. */
    collected?: FnolCollectedData;
}

export async function POST(req: NextRequest) {
    let body: ChatRequestBody;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const history = Array.isArray(body.history) ? body.history : [];
    const collected = body.collected ?? EMPTY_FNOL_COLLECTED;
    const lastUserTurn = [...history].reverse().find((m) => m.role === 'user');

    if (!lastUserTurn) {
        return NextResponse.json({ error: 'No user message found in history.' }, { status: 400 });
    }

    // Rebuild the message list for the model: system prompt + prior turns (as plain
    // text so the model has conversational context) + the latest user turn wrapped
    // with the structured "already collected" data so it keeps its memory of facts.
    const messages: GroqMessage[] = [{ role: 'system', content: FNOL_SYSTEM_PROMPT }];

    for (const turn of history.slice(0, -1)) {
        messages.push({ role: turn.role, content: turn.content });
    }
    messages.push({ role: 'user', content: buildFnolUserTurn(lastUserTurn.content, collected) });

    try {
        const result = await groqChatJSON<FnolChatResult>(messages, { temperature: 0.3 });

        const mergedCollected: FnolCollectedData = {
            ...collected,
            ...Object.fromEntries(
                Object.entries(result.collected || {}).filter(([, v]) => v !== null && v !== undefined)
            ),
        };

        const missingFields = computeMissingFields(mergedCollected);

        return NextResponse.json({
            reply: result.reply,
            language: result.language === 'ar' ? 'ar' : 'fr',
            collected: mergedCollected,
            readyForDocuments: Boolean(result.readyForDocuments) && missingFields.length === 0,
            missingFields,
        });
    } catch (err) {
        if (err instanceof GroqConfigError) {
            return NextResponse.json({ error: err.message, code: 'MISSING_API_KEY' }, { status: 500 });
        }
        console.error('FNOL chat error:', err);
        return NextResponse.json({ error: 'Le service de chat est momentanément indisponible.' }, { status: 502 });
    }
}
