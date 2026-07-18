/**
 * Minimal client for the Groq Chat Completions API.
 *
 * Why Groq: it has a genuinely free tier (no credit card required),
 * an OpenAI-compatible REST schema, and it is fast enough for a
 * conversational FNOL bot. Get a free key at https://console.groq.com/keys
 * and put it in `.env.local` as GROQ_API_KEY (see .env.local.example).
 *
 * The rest of the app never talks to Groq directly — everything goes
 * through this file, so swapping providers later (e.g. to OpenAI,
 * Gemini, or a self-hosted Ollama model) only means editing this file.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Default text model. Override with GROQ_MODEL in .env.local if you want a different model.
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

// Vision JSON responses are small, but reasoning models (e.g. Qwen) spend
// completion tokens on <think> blocks before the JSON — a small budget gets
// truncated mid-reasoning and no JSON is ever emitted. Confusing inputs
// (gibberish brand names, ambiguous photos) make the reasoning even longer.
const DEFAULT_VISION_MAX_TOKENS = 4096;

export interface GroqMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface GroqChatOptions {
    /** Force the model to return valid JSON (Groq supports OpenAI-style json_object mode). */
    json?: boolean;
    temperature?: number;
    maxTokens?: number;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(errText: string): number {
    const match = errText.match(/try again in ([\d.]+)s/i);
    if (match) {
        return Math.ceil(parseFloat(match[1]) * 1000) + 300;
    }
    return 5000;
}

function stripModelReasoning(raw: string): string {
    return raw
        .replace(/<think>[\s\S]*?<\/redacted_thinking>/gi, '')
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
        // Truncated responses can end inside an unterminated <think> block
        .replace(/<think(?:ing)?>[\s\S]*$/gi, '')
        .replace(/```json\s*/gi, '')
        .replace(/```/g, '')
        .trim();
}

/** Pulls the first parseable JSON object out of a noisy model response. */
function extractJsonObject(raw: string): string | null {
    const cleaned = stripModelReasoning(raw);
    if (!cleaned) return null;

    try {
        JSON.parse(cleaned);
        return cleaned;
    } catch {
        // fall through
    }

    // Prefer the last `{...}` block — models often append JSON after reasoning.
    for (let start = cleaned.lastIndexOf('{'); start >= 0; start = cleaned.lastIndexOf('{', start - 1)) {
        for (let end = cleaned.lastIndexOf('}'); end > start; end = cleaned.lastIndexOf('}', end - 1)) {
            const candidate = cleaned.slice(start, end + 1);
            try {
                JSON.parse(candidate);
                return candidate;
            } catch {
                // keep searching
            }
        }
    }

    return null;
}

function parseJsonFromModel<T>(raw: string): T {
    const jsonText = extractJsonObject(raw);
    if (jsonText) {
        return JSON.parse(jsonText) as T;
    }
    throw new Error(`Failed to parse JSON from model response: ${raw.slice(0, 200)}`);
}

function isJsonValidationError(errText: string): boolean {
    return errText.includes('json_validate_failed') || errText.includes('Failed to validate JSON');
}

export class GroqConfigError extends Error {
    constructor() {
        super(
            'GROQ_API_KEY is missing. Create a free key at https://console.groq.com/keys ' +
            'and add it to your .env.local file as GROQ_API_KEY=your_key_here, then restart the dev server.'
        );
        this.name = 'GroqConfigError';
    }
}

export class GroqRateLimitError extends Error {
    retryAfterMs: number;

    constructor(retryAfterMs: number) {
        super(`Groq rate limit exceeded. Retry after ${Math.ceil(retryAfterMs / 1000)}s.`);
        this.name = 'GroqRateLimitError';
        this.retryAfterMs = retryAfterMs;
    }
}

async function groqFetch(apiKey: string, body: unknown): Promise<Response> {
    for (let attempt = 0; attempt < 2; attempt++) {
        const res = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
        });

        if (res.status === 429 && attempt === 0) {
            const errText = await res.text().catch(() => '');
            await sleep(parseRetryAfterMs(errText));
            continue;
        }

        return res;
    }

    throw new GroqRateLimitError(5000);
}

/**
 * Calls the Groq chat completion endpoint and returns the assistant's raw text.
 */
export async function groqChat(messages: GroqMessage[], opts: GroqChatOptions = {}): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new GroqConfigError();
    }

    const res = await groqFetch(apiKey, {
        model: DEFAULT_MODEL,
        messages,
        temperature: opts.temperature ?? 0.4,
        max_tokens: opts.maxTokens ?? 700,
        ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        if (res.status === 429) {
            throw new GroqRateLimitError(parseRetryAfterMs(errText));
        }
        throw new Error(`Groq API error (${res.status}): ${errText || res.statusText}`);
    }

    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error('Groq API returned an empty response.');
    }
    return content;
}

/**
 * Same as groqChat, but parses the response as JSON and throws a readable
 * error if the model didn't comply (rare, but happens).
 */
export async function groqChatJSON<T = unknown>(messages: GroqMessage[], opts: GroqChatOptions = {}): Promise<T> {
    const raw = await groqChat(messages, { ...opts, json: true });
    return parseJsonFromModel<T>(raw);
}

// Vision-capable model — used for the vehicle-photo vs. constat cross-check
// (fraud detection) and the repair-cost estimate.
const DEFAULT_VISION_MODEL = process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b';

export interface GroqVisionUserTurn {
    /** Free-text instructions/context accompanying the image. */
    text: string;
    /** data: URL, e.g. `data:image/jpeg;base64,...` */
    imageDataUrl: string;
}

/**
 * Calls a Groq vision-capable model with one image + text and returns raw text.
 * Used for image-vs-declaration consistency checks (fraud detection).
 */
export async function groqVisionChat(
    systemPrompt: string,
    userTurn: GroqVisionUserTurn,
    opts: GroqChatOptions = {}
): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new GroqConfigError();
    }

    // Qwen 3.6 follows instructions more reliably when they live in the user turn.
    const userText = `${systemPrompt}\n\n${userTurn.text}\n\nRéponds UNIQUEMENT avec un objet JSON valide. Aucun texte, aucune balise thinking, aucun markdown.`;

    const messages = [
        {
            role: 'user',
            content: [
                { type: 'text', text: userText },
                { type: 'image_url', image_url: { url: userTurn.imageDataUrl } },
            ],
        },
    ] as const;

    const requestBody = (jsonMode: boolean, reasoningFormat: 'hidden' | 'parsed' | null) => ({
        model: DEFAULT_VISION_MODEL,
        messages,
        temperature: opts.temperature ?? 0.15,
        max_completion_tokens: opts.maxTokens ?? DEFAULT_VISION_MAX_TOKENS,
        // Reasoning models (Qwen) emit <think> blocks that consume the whole
        // completion budget and break JSON parsing — ask Groq to hide them.
        ...(reasoningFormat ? { reasoning_format: reasoningFormat } : {}),
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    });

    const call = async (jsonMode: boolean, reasoningFormat: 'hidden' | 'parsed' | null = 'hidden') => {
        const res = await groqFetch(apiKey, requestBody(jsonMode, reasoningFormat));

        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            if (res.status === 429) {
                throw new GroqRateLimitError(parseRetryAfterMs(errText));
            }
            throw new Error(`Groq API error (${res.status}): ${errText || res.statusText}`);
        }

        const data = await res.json();
        const message = data?.choices?.[0]?.message;
        const content: string | undefined = message?.content;
        if (!content) {
            throw new Error('Groq API returned an empty response.');
        }
        return content;
    };

    if (!opts.json) {
        return call(false);
    }

    // Degrade gracefully: strict JSON + hidden reasoning → parsed reasoning →
    // plain text with hidden reasoning → plain text without any extra params
    // (in case the configured model rejects reasoning_format).
    const jsonAttempts: Array<{ jsonMode: boolean; reasoningFormat: 'hidden' | 'parsed' | null }> = [
        { jsonMode: true, reasoningFormat: 'hidden' },
        { jsonMode: true, reasoningFormat: 'parsed' },
        { jsonMode: false, reasoningFormat: 'hidden' },
        { jsonMode: false, reasoningFormat: null },
    ];

    let lastError: unknown;
    for (const attempt of jsonAttempts) {
        try {
            return await call(attempt.jsonMode, attempt.reasoningFormat);
        } catch (err) {
            lastError = err;
            const message = err instanceof Error ? err.message : '';
            const isRecoverable =
                isJsonValidationError(message) ||
                message.includes('reasoning_format') ||
                message.includes('reasoning');
            if (!isRecoverable) {
                throw err;
            }
        }
    }

    throw lastError instanceof Error ? lastError : new Error('Groq vision JSON call failed.');
}

/**
 * Same as groqVisionChat, but parses the response as JSON.
 */
export async function groqVisionChatJSON<T = unknown>(
    systemPrompt: string,
    userTurn: GroqVisionUserTurn,
    opts: GroqChatOptions = {}
): Promise<T> {
    const raw = await groqVisionChat(systemPrompt, userTurn, { ...opts, json: true });
    return parseJsonFromModel<T>(raw);
}
