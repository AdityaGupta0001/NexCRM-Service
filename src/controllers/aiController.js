const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY2,
});

const parseSegmentFromPrompt = async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required." });
        }

        const today = new Date();
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(today.getMonth() - 6);
        const formattedSixMonthsAgo = sixMonthsAgo.toISOString().split('T')[0];
        // Add other relative dates as needed or instruct Groq to use "N days/months ago from YYYY-MM-DD"

        const systemMessage = `
You are an AI assistant that converts natural language queries about customer segments into a specific JSON rule structure.
The JSON structure for rules is:
{
  "logic": "AND" | "OR",
  "conditions": [
    { "field": "fieldName", "operator": "operator", "value": "value" }, // Simple condition
    // OR nested condition group:
    {
      "logic": "AND" | "OR",
      "conditions": [ /* ... more conditions ... */ ]
    }
  ]
}
Supported fields for customers: "total_spend" (number), "visits" (number), "last_visit" (date string YYYY-MM-DD), "name" (string), "email" (string), "phone" (string), "createdAt" (date string YYYY-MM-DD).
Supported operators: ">", "<", "=", ">=", "<=", "!=", "contains" (for strings).
For date comparisons, '<' means before the date, '>' means after the date.
Today's date is ${today.toISOString().split('T')[0]}.
When a relative date like "6 months ago" is mentioned, calculate it based on today's date.
For example, if the user says "haven't shopped in 6 months", the last_visit should be less than ${formattedSixMonthsAgo}.
Return ONLY the JSON object as your response, without any surrounding text or explanations.
        `;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: prompt }
            ],
            model: 'llama3-8b-8192', // Or 'mixtral-8x7b-32768' or other suitable model
            temperature: 0.2, // Lower temperature for more deterministic JSON output
        });

        const aiResponse = chatCompletion.choices[0]?.message?.content;
        if (!aiResponse) {
            throw new Error("AI did not return a response.");
        }

        try {
            const jsonRules = JSON.parse(aiResponse);
            res.status(200).json(jsonRules);
        } catch (parseError) {
            console.error("Error parsing AI response as JSON:", aiResponse);
            res.status(500).json({ error: "AI returned a non-JSON response or invalid JSON.", details: aiResponse });
        }

    } catch (error) {
        console.error("Error parsing segment from prompt:", error);
        res.status(500).json({ error: "Failed to parse segment from prompt.", details: error.message });
    }
};

const suggestMessages = async (req, res) => {
    try {
        const { objective, segmentDescription, tone } = req.body; // Added more context
        if (!objective) {
            return res.status(400).json({ error: "Objective is required." });
        }

        let systemMessage = `
You are an AI assistant that generates 3 concise and engaging marketing message suggestions for CRM campaigns.
The messages should be suitable for SMS or short emails.
Return ONLY a JSON array of strings, like ["message1", "message2", "message3"].
Do not include any other text or explanations.
        `;
        
        let userPrompt = `Objective: "${objective}"`;
        if (segmentDescription) {
            userPrompt += `\nTarget Audience: "${segmentDescription}"`;
        }
        if (tone) {
            userPrompt += `\nDesired Tone: "${tone}"`;
        }


        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: userPrompt }
            ],
            model: 'llama3-8b-8192', // Or 'mixtral-8x7b-32768'
            temperature: 0.7,
        });

        const aiResponse = chatCompletion.choices[0]?.message?.content;
         if (!aiResponse) {
            throw new Error("AI did not return a response for message suggestions.");
        }
        
        try {
            // Attempt to clean common non-JSON prefixes/suffixes if LLM doesn't strictly follow format
            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith("```json")) {
                cleanedResponse = cleanedResponse.substring(7);
                if (cleanedResponse.endsWith("```")) {
                    cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
                }
            }
            cleanedResponse = cleanedResponse.trim();

            const messageSuggestions = JSON.parse(cleanedResponse);
            if (!Array.isArray(messageSuggestions) || !messageSuggestions.every(item => typeof item === 'string')) {
                throw new Error("AI response is not a valid JSON array of strings.");
            }
            res.status(200).json(messageSuggestions);
        } catch (parseError) {
            console.error("Error parsing AI message suggestions as JSON array:", aiResponse);
            res.status(500).json({ error: "AI returned non-JSON or invalid format for message suggestions.", details: aiResponse });
        }

    } catch (error) {
        console.error("Error suggesting messages:", error);
        res.status(500).json({ error: "Failed to suggest messages.", details: error.message });
    }
};


module.exports = {
    parseSegmentFromPrompt,
    suggestMessages
};