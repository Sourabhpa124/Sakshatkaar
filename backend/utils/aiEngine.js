const Groq = require("groq-sdk");

let groq;
const MODEL_NAME = process.env.GROQ_MODEL_NAME || "llama-3.3-70b-versatile";

const getGroqClient = () => {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is missing from environment variables.');
    }
    if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    return groq;
};

const withRetry = async (fn, retries = 3, delay = 1500) => {
    try {
        return await fn();
    } catch (error) {
        if (retries === 0 || (!error.message.includes('503') && !error.message.includes('429'))) throw error;
        console.warn(`Upstream Groq API saturated. Re-initiating payload in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
        return withRetry(fn, retries - 1, delay * 2);
    }
};

const executeInference = async (question, answer) => {
    return withRetry(async () => {
        const systemPrompt = `
            Role: Technical Assessor.
            Task: Evaluate the candidate's answer to the question.
            Question: "${question}"
            Answer: "${answer}"
            
            Output Directive: You must return ONLY a valid JSON object. Use these exact keys with integer values (0-100) and a string for feedback. Do not include markdown blocks.
            {
                "keywordDensity": <int>,
                "logicalStructure": <int>,
                "confidenceMarker": <int>,
                "feedback": "<string>"
            }
        `;

        const completion = await getGroqClient().chat.completions.create({
            messages: [{ role: "user", content: systemPrompt }],
            model: MODEL_NAME,
            temperature: 0.1,
            response_format: { type: "json_object" } 
        });

        return JSON.parse(completion.choices[0].message.content);
    });
};

const generateDynamicPrompt = async (topic, difficulty) => {
    return withRetry(async () => {
        const systemPrompt = `
            Role: Senior Technical Engineering Manager.
            Task: Generate a single, highly specific ${difficulty}-level interview question regarding the ${topic} stack/technology. 
            Constraint: Return ONLY the exact string of the question. Do not include markdown, JSON formats, preambles, or conversational filler.
        `;

        const completion = await getGroqClient().chat.completions.create({
            messages: [{ role: "user", content: systemPrompt }],
            model: MODEL_NAME,
            temperature: 0.7 
            // DELIBERATELY OMITTING response_format HERE
        });

        return completion.choices[0].message.content.trim();
    });
};

const processInterviewTurn = async (topic, difficulty, duration, conversationHistory, isFinalTurn) => {
    return withRetry(async () => {
        let systemPrompt = `
            Role: Senior Technical Engineering Manager conducting a ${duration}-minute interview on ${topic} at a ${difficulty} level.
            
            Directive: 
            Analyze the candidate's last response. 
            If the response is weak, ask a probing follow-up question.
            If the response is sufficient, transition smoothly to a new, related technical question.
            Keep your response conversational, professional, and strictly under 3 sentences. Do not break character. Do not provide the "correct" answer.
        `;

        if (isFinalTurn) {
            systemPrompt = `
                Role: Senior Technical Engineering Manager.
                
                Directive: The ${duration}-minute time allocation has expired. Conclude the interview professionally in 1 or 2 sentences. Do not ask any further questions.
            `;
        }

        const messages = [
            { role: "user", content: systemPrompt },
            ...conversationHistory.map(msg => ({
                role: msg.role === 'interviewer' ? 'assistant' : 'user',
                content: msg.content
            }))
        ];

        const completion = await getGroqClient().chat.completions.create({
            messages: messages,
            model: MODEL_NAME,
            temperature: 0.6 
            // DELIBERATELY OMITTING response_format HERE
        });

        return completion.choices[0].message.content.trim();
    });
};

const evaluateFullSession = async (topic, difficulty, conversationHistory) => {
    return withRetry(async () => {
        const formattedHistory = conversationHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n');
        
        const systemPrompt = `
            Role: Technical Assessor.
            Task: Evaluate the candidate's performance across this entire ${difficulty}-level interview concerning ${topic}.
            
            Output Directive: You must return ONLY a valid JSON object. Use these exact keys with integer values (0-100) and a string for feedback. Do not include markdown blocks or preambles.
            {
                "hireabilityIndex": <int>,
                "keywordDensity": <int>,
                "logicalStructure": <int>,
                "confidenceMarker": <int>,
                "feedback": "<string>"
            }
        `;

        const completion = await getGroqClient().chat.completions.create({
            messages: [
                { role: "user", content: systemPrompt },
                { role: "user", content: `Here is the interview transcript to evaluate:\n\n${formattedHistory}` }
            ],
            model: MODEL_NAME,
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        return JSON.parse(completion.choices[0].message.content);
    });
};

module.exports = { executeInference, generateDynamicPrompt, processInterviewTurn, evaluateFullSession };
