// server.js
require('dotenv').config();
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const mongoose   = require('mongoose');
const cors       = require('cors');

const app    = express();
const server = http.createServer(app);

/* ─── CORS ───────────────────────────────────────────────────── */
const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

/* ─── MongoDB ────────────────────────────────────────────────── */
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB error:', err));

const MessageSchema = new mongoose.Schema({
    text:      { type: String, required: true, maxlength: 1000 },
    uid:       { type: String, required: true },
    username:  { type: String, required: true },
    photoURL:  { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
});
const Message = mongoose.model('RandomChatMessage', MessageSchema);

/* ─── Layer 1: Hardcoded blocklist (instant, no API) ─────────── */
const BLOCKED_WORDS = [
    'nigga', 'nigger', 'chink', 'spic', 'kike', 'faggot', 'fag', 'dyke', 'tranny',
    'fuck you',  'fuck off', 'motherfucker', 'motherfucking',
    'bitch', 'whore', 'slut', 'pussy', 'dick', 'cock', 'asshole',
    'fucker', 'bastard', 'son of a bitch',
    'kill yourself', 'kys', 'go die', 'i will kill', 'i will hurt',
    'rape', 'molest',
];

function localModerate(text) {
    const lower = text.toLowerCase().replace(/\s+/g, ' ').trim();
    for (const word of BLOCKED_WORDS) {
        const regex = new RegExp(`(^|\\s|\\b)${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|\\b|$)`, 'i');
        if (regex.test(lower)) {
            return { allowed: false, reason: `"${word}" is not allowed in this chat.` };
        }
    }
    return { allowed: true };
}

async function groqModerate(text) {
    try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192',
                max_tokens: 30,
                temperature: 0,
                messages: [
                    {
                        role: 'system',
                        content: `You are an extremely strict chat moderator for a public chat app. Respond ONLY with JSON.

BLOCK any message that contains:
- Profanity or swear words (fuck, shit, bitch, ass, damn, hell used offensively, etc.)
- Insults or personal attacks of any kind
- Racial, gender, sexual, or religious slurs
- Threats or violent language
- Sexual content or innuendo
- Harassment or bullying

ALLOW only:
- Normal friendly conversation
- Questions and answers
- Greetings and casual chat
- Opinions without insults

Be VERY strict. When in doubt, block it.

Reply ONLY with one of:
{"allowed":true}
{"allowed":false,"reason":"short reason"}`
                    },
                    { role: 'user', content: text }
                ],
            }),
        });

        const data = await res.json();
        const raw  = data.choices?.[0]?.message?.content?.trim();
        if (!raw) return { allowed: true };
        const cleaned = raw.replace(/```json|```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (err) {
        console.error('⚠️  Groq error:', err.message);
        return { allowed: true };
    }
}

async function moderateMessage(text) {
    const local = localModerate(text);
    if (!local.allowed) {
        console.log(`🚫 [LOCAL BLOCK]: "${text}" — ${local.reason}`);
        return local;
    }

    const ai = await groqModerate(text);
    if (!ai.allowed) {
        console.log(`🚫 [AI BLOCK]: "${text}" — ${ai.reason}`);
    }
    return ai;
}

app.get('/api/random-chat/messages', async (req, res) => {
    try {
        const messages = await Message.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        res.json(messages.reverse());
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

const io = new Server(server, { cors: corsOptions });

io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('send_message', async (data) => {
        const { text, uid, username, photoURL } = data;
        if (!text?.trim() || !uid || !username) return;

        const modResult = await moderateMessage(text.trim());

        if (!modResult.allowed) {
            socket.emit('message_blocked', {
                reason: modResult.reason || 'This message violates community guidelines.',
            });
            return;
        }

        try {
            const msg = await Message.create({
                text: text.trim(),
                uid,
                username,
                photoURL: photoURL || '',
            });
            io.emit('new_message', msg.toObject());
            console.log(`💬 [${username}]: ${text.trim()}`);
        } catch (err) {
            socket.emit('error', { message: 'Could not save message' });
        }
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Chat server on http://localhost:${PORT}`));