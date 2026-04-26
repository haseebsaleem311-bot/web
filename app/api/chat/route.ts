import { NextRequest, NextResponse } from 'next/server';

const modeInstructions: Record<string, string> = {
    quick: 'Give a brief, precise answer in 3-5 sentences. Be direct, accurate, and helpful. Do not pad with unnecessary text.',
    detailed: 'Give a thorough, well-structured explanation. Use clear headings, bullet points, numbered steps, and real examples. Break complex ideas into digestible parts. End by asking if they need further clarification.',
    exam: 'Focus on VU exam preparation. Identify what is likely to be tested, provide model answers, mention marks distribution, give memory tricks/mnemonics, and highlight common mistakes students make. Keep it exam-strategic.',
    quiz: 'Generate 5 high-quality MCQs on the topic with 4 options each (A, B, C, D). Mark the correct answer with ✅ and give a 1-line explanation for why that answer is correct. Number each question clearly.',
};

export async function POST(request: NextRequest) {
    try {
        const { message, mode = 'quick', history = [], weakTopics } = await request.json();

        if (!message?.trim()) {
            return NextResponse.json({ reply: 'Please type a question first.' }, { status: 400 });
        }
        
        let weakTopicPrompt = '';
        if (weakTopics && Object.keys(weakTopics).length > 0) {
            weakTopicPrompt = `\n\n## Student Performance Insight:\nThe student is currently struggling with these topics: ${JSON.stringify(weakTopics)}. If they ask about these topics, provide extra encouragement and more foundational explanations. If the current question is related, mention that you've noticed their interest in this area.`;
        }

        const groqKey = process.env.GROQ_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;

        if (!groqKey && !geminiKey) {
            console.error('No AI API Keys set.');
            return NextResponse.json({
                reply: '⚠️ AI service is temporarily unavailable. Please configure API keys or contact support.',
            });
        }

        const systemPrompt = `You are **HM nexora AI Mentor** — a highly knowledgeable, professional, and friendly academic tutor exclusively for **Virtual University of Pakistan (VU)** students.

## Your Expertise:
You have deep knowledge of all VU courses (CS, IT, Mathematics, Management, English, etc.).

## Response Style:
- **Professional yet warm** — like a brilliant senior student or university lecturer who genuinely cares.
- **Contextually aware** — use Pakistani academic context (VU handouts, VULMS, GDB, Quiz, Assignment).
- **Structured** — use formatting (bullet points, bold terms) for clarity.

## Current Mode:
${modeInstructions[mode] || modeInstructions.quick}

## Important Rules:
- Redirect non-academic questions politely.
- Use Pakistani context and local currency in examples.
- Format math clearly using text notation.`;

        // Combine system prompt with performance insight
        const fullSystemPrompt = systemPrompt + (weakTopicPrompt || '');

        // 1. TRY GROQ (Primary)
        if (groqKey) {
            try {
                // Format history for Groq/OpenAI
                const groqMessages = [{ role: 'system', content: fullSystemPrompt }];
                if (Array.isArray(history)) {
                    history.filter((msg: any) => msg.text?.trim()).forEach((msg: any) => {
                        groqMessages.push({
                            role: msg.role === 'user' ? 'user' : 'assistant',
                            content: msg.text
                        });
                    });
                }
                groqMessages.push({ role: 'user', content: message });
                const finalGroqMessages = groqMessages.length > 11 ? [groqMessages[0], ...groqMessages.slice(-10)] : groqMessages;

                const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${groqKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile',
                        messages: finalGroqMessages,
                        temperature: mode === 'quiz' ? 0.6 : 0.75,
                        max_tokens: mode === 'quick' ? 500 : 2000,
                        stream: false
                    }),
                });

                if (groqResponse.ok) {
                    const data = await groqResponse.json();
                    const reply = data?.choices?.[0]?.message?.content;
                    if (reply) return NextResponse.json({ reply: reply.trim(), provider: 'groq' });
                } else {
                    const errorData = await groqResponse.json().catch(() => ({}));
                    console.error(`Groq Failed (Status ${groqResponse.status}):`, errorData);
                    console.warn(`Attempting Gemini fallback...`);
                }
            } catch (err) {
                console.error('Groq fetch error, falling back to Gemini:', err);
            }
        }

        // 2. FALLBACK TO GEMINI (Secondary)
        if (geminiKey) {
            try {
                // Format history for Gemini
                const validHistory = history.filter((msg: any) => msg.text?.trim());
                const alternatingHistory: any[] = [];
                for (const msg of validHistory) {
                    const role = msg.role === 'user' ? 'user' : 'model';
                    if (alternatingHistory.length > 0 && alternatingHistory[alternatingHistory.length - 1].role === role) {
                        alternatingHistory[alternatingHistory.length - 1].parts[0].text += '\n\n' + msg.text;
                    } else {
                        alternatingHistory.push({ role, parts: [{ text: msg.text }] });
                    }
                }

                let recentHistory = alternatingHistory.slice(-6);
                let finalMessage = message;
                if (recentHistory.length > 0 && recentHistory[recentHistory.length - 1].role === 'user') {
                    const last = recentHistory.pop();
                    finalMessage = last!.parts[0].text + '\n\n' + message;
                }

                const geminiContents = [...recentHistory, { role: 'user', parts: [{ text: finalMessage }] }];

                const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: fullSystemPrompt }] },
                        contents: geminiContents,
                        generationConfig: {
                            temperature: mode === 'quiz' ? 0.6 : 0.75,
                            maxOutputTokens: mode === 'quick' ? 500 : 2000,
                        }
                    }),
                });

                if (geminiResponse.ok) {
                    const data = await geminiResponse.json();
                    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (reply) return NextResponse.json({ reply: reply.trim(), provider: 'gemini' });
                } else {
                    const errorData = await geminiResponse.json().catch(() => ({}));
                    console.error(`Gemini also failed (Status ${geminiResponse.status}):`, errorData);
                }
            } catch (err) {
                console.error('Gemini fallback error:', err);
            }
        }

        return NextResponse.json({
            reply: '⚠️ Both AI engines are currently unavailable. Please check your connection or try again in a minute.',
        }, { status: 503 });

    } catch (error) {
        console.error('Chat API general error:', error);
        return NextResponse.json({
            reply: '⚠️ Something went wrong. Please refresh the page and try again.',
        }, { status: 500 });
    }
}
