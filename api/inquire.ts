
import { GoogleGenAI, Type } from "@google/genai";

export const config = {
  runtime: 'edge',
};

const SYSTEM_INSTRUCTION = `You are a helpful AI assistant integrated into an intelligence report generator. Your goal is to help the user by pre-filling the report generation form based on their natural language query and any context they provide. Analyze their request and suggest values for the form fields. Your response MUST be a valid JSON object. Only include keys for fields you can confidently suggest. Omit any you are unsure about.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    reportName: { type: Type.STRING, description: "A concise, descriptive name for the report based on the user's query." },
    region: { type: Type.STRING, description: "The primary geographical region, city, or country mentioned. Format as 'City, Country' or just 'Country'." },
    industry: { type: Type.STRING, description: "The core industry or sector at the heart of the user's query." },
    idealPartnerProfile: { type: Type.STRING, description: "A detailed paragraph describing the ideal partner company, synthesized from the user's query. Mention their likely size, key technologies, strategic focus, etc." },
    problemStatement: { type: Type.STRING, description: "A well-formed problem statement or strategic objective synthesized from the user's query and context." },
  },
};


export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  if (!process.env.API_KEY) {
    return new Response(JSON.stringify({ error: 'API key is not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { query, fileContent } = await request.json();

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query parameter is required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      The user's query is: "${query}"
      ${fileContent ? `They have also provided the following context from a file:\n---\n${fileContent}\n---` : ''}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const suggestions = JSON.parse(response.text);

    return new Response(JSON.stringify(suggestions), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in /api/inquire:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}