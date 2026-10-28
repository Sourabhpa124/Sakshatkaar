require('dotenv').config();

const bcrypt = require('bcryptjs');
const cors = require('cors');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User');
const Session = require('./models/Session');
const { authenticateToken } = require('./middlewares/authMiddleware');
const {
    evaluateFullSession,
    generateDynamicPrompt,
    processInterviewTurn,
} = require('./utils/aiEngine');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({ origin: '*' }));
app.use(express.json());

const createToken = (userId) => {
    if (!process.env.ACCESS_TOKEN_SECRET) {
        throw new Error('ACCESS_TOKEN_SECRET is missing from environment variables.');
    }
    return jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2d' });
};

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/create-account', async (req, res) => {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
        return res.status(400).json({ error: true, message: 'All fields are required.' });
    }
    try {
        if (await User.findOne({ email })) {
            return res.status(400).json({ error: true, message: 'Email already exists.' });
        }
        const user = await User.create({ fullName, email, password: await bcrypt.hash(password, 10) });
        return res.status(201).json({
            error: false,
            user: { fullName: user.fullName, email: user.email },
            accessToken: createToken(user._id),
        });
    } catch (error) {
        console.error('Account creation failed:', error);
        return res.status(500).json({ error: true, message: 'Unable to create account.' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: true, message: 'Email and password are required.' });
    }
    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: true, message: 'Invalid email or password.' });
        }
        return res.json({
            error: false,
            user: { fullName: user.fullName, email: user.email },
            accessToken: createToken(user._id),
        });
    } catch (error) {
        console.error('Login failed:', error);
        return res.status(500).json({ error: true, message: 'Unable to sign in.' });
    }
});

app.get('/get-user', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: true, message: 'User not found.' });
        return res.json({ error: false, user: { fullName: user.fullName, email: user.email } });
    } catch (error) {
        console.error('User lookup failed:', error);
        return res.status(500).json({ error: true, message: 'Unable to retrieve user.' });
    }
});

app.get('/sessions', authenticateToken, async (req, res) => {
    try {
        const sessions = await Session.find({ candidateId: req.user.id }).sort({ timestamp: -1 });
        return res.json({ error: false, data: sessions });
    } catch (error) {
        console.error('Session retrieval failed:', error);
        return res.status(500).json({ error: true, message: 'Unable to retrieve sessions.' });
    }
});

app.post('/generate-question', authenticateToken, async (req, res) => {
    const { topic, difficulty } = req.body;
    if (!topic || !difficulty) return res.status(400).json({ error: true, message: 'Topic and difficulty are required.' });
    try {
        return res.json({ error: false, question: await generateDynamicPrompt(topic, difficulty) });
    } catch (error) {
        console.error('Question generation failed:', error);
        return res.status(502).json({ error: true, message: 'Unable to generate an interview question.' });
    }
});

app.post('/interview-turn', authenticateToken, async (req, res) => {
    const { topic, difficulty, duration, conversationHistory, isFinalTurn } = req.body;
    if (!Array.isArray(conversationHistory)) {
        return res.status(400).json({ error: true, message: 'conversationHistory must be an array.' });
    }
    try {
        const response = await processInterviewTurn(topic, difficulty, duration, conversationHistory, isFinalTurn);
        return res.json({ error: false, response });
    } catch (error) {
        console.error('Interview turn failed:', error);
        return res.status(502).json({ error: true, message: 'Unable to process interview response.' });
    }
});

app.post('/submit-session', authenticateToken, async (req, res) => {
    const { topic, difficulty, duration, conversationHistory } = req.body;
    if (!Array.isArray(conversationHistory) || conversationHistory.length === 0) {
        return res.status(400).json({ error: true, message: 'A non-empty transcript is required.' });
    }
    try {
        const evaluation = await evaluateFullSession(topic, difficulty, conversationHistory);
        const session = await Session.create({
            candidateId: req.user.id,
            questionPrompt: `${topic} (${difficulty} - ${duration} Min Session)`,
            candidateResponse: 'Multi-turn dialogue transcript archived.',
            aiEvaluation: evaluation,
            timestamp: new Date(),
        });
        return res.status(201).json({ error: false, data: session });
    } catch (error) {
        console.error('Session submission failed:', error);
        return res.status(502).json({ error: true, message: 'Unable to evaluate and save the session.' });
    }
});

if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is missing from environment variables.');
} else {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log('MongoDB connected.'))
        .catch((error) => console.error('MongoDB connection failed:', error.message));
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
