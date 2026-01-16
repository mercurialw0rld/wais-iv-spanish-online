/**
 * Vercel Serverless Function - Gemini API Proxy
 * Evaluates user responses using Google's Gemini API
 * The API key is stored in Vercel environment variables
 */

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    try {
        const { prompt, systemInstruction, generationConfig } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: generationConfig || {
                temperature: 0.1,
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 500
            }
        };

        // Add system instruction if provided
        if (systemInstruction) {
            requestBody.systemInstruction = {
                parts: [{
                    text: systemInstruction
                }]
            };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API error:', errorData);
            return res.status(response.status).json({ 
                error: 'Error from Gemini API',
                details: errorData 
            });
        }

        const data = await response.json();
        
        // Extract the text response
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!textResponse) {
            return res.status(500).json({ error: 'Invalid response from Gemini API' });
        }

        // Try to extract JSON from the response
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsedResult = JSON.parse(jsonMatch[0]);
                return res.status(200).json(parsedResult);
            } catch (parseError) {
                // If JSON parsing fails, return the raw text
                return res.status(200).json({ rawText: textResponse });
            }
        }

        return res.status(200).json({ rawText: textResponse });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
