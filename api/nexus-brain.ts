import { GoogleGenAI, Type } from "@google/genai";
import type { NexusBrainAction, RROI_Index, TPT_Simulation, SEAM_Blueprint } from '../types.ts';

export const config = {
  runtime: 'edge',
};

// --- PROMPTS AND SCHEMAS ---

const RROI_SYSTEM_INSTRUCTION = `You are the Nexus Brain's Diagnostic Engine. Your purpose is to act as a world-class regional economist. You will take a user's specified region and use Google Search to gather data on its core economic, social, and structural attributes. You MUST synthesize this data into the "Regional Resilience & Opportunity Index" (RROI), applying foundational economic principles like Location Quotient, Shift-Share, and Agglomeration theories. Your response MUST be a valid JSON object matching the RROI schema.`;

const RROI_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.NUMBER, description: "A weighted score from 0-100 representing the region's overall resilience and opportunity." },
    summary: { type: Type.STRING, description: "A concise, 2-3 sentence executive summary of the region's strategic position." },
    components: {
      type: Type.OBJECT,
      properties: {
        humanCapital: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, score: { type: Type.NUMBER }, analysis: { type: Type.STRING } }, required: ['name', 'score', 'analysis'] },
        infrastructure: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, score: { type: Type.NUMBER }, analysis: { type: Type.STRING } }, required: ['name', 'score', 'analysis'] },
        agglomeration: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, score: { type: Type.NUMBER }, analysis: { type: Type.STRING } }, required: ['name', 'score', 'analysis'] },
        economicComposition: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, score: { type: Type.NUMBER }, analysis: { type: Type.STRING } }, required: ['name', 'score', 'analysis'] },
        governance: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, score: { type: Type.NUMBER }, analysis: { type: Type.STRING } }, required: ['name', 'score', 'analysis'] },
        qualityOfLife: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, score: { type: Type.NUMBER }, analysis: { type: Type.STRING } }, required: ['name', 'score', 'analysis'] },
      },
      required: ['humanCapital', 'infrastructure', 'agglomeration', 'economicComposition', 'governance', 'qualityOfLife']
    }
  },
  required: ['overallScore', 'summary', 'components']
};

const SIMULATE_SYSTEM_INSTRUCTION = `You are the Nexus Brain's Predictive Engine. Your purpose is to act as a strategic foresight analyst. Using the provided RROI diagnostic and a proposed intervention, you will simulate the potential long-term impact based on principles of endogenous growth theory and path dependency. Your response MUST be a valid JSON object matching the TPT_Simulation schema.`;

const TPT_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        scenario: { type: Type.STRING, description: "A descriptive title for the simulation scenario." },
        intervention: { type: Type.STRING, description: "A summary of the user-proposed intervention." },
        timeline: { type: Type.STRING, description: "The timeline over which the simulation runs (e.g., '5-10 Years')." },
        impactAnalysis: { type: Type.STRING, description: "A narrative analysis explaining the likely causal chain of effects and feedback loops resulting from the intervention." },
        predictedOutcomes: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    metric: { type: Type.STRING, description: "The name of the RROI component being impacted." },
                    startValue: { type: Type.NUMBER, description: "The original score from the RROI." },
                    endValue: { type: Type.NUMBER, description: "The predicted score after the intervention." },
                },
                required: ['metric', 'startValue', 'endValue']
            }
        }
    },
    required: ['scenario', 'intervention', 'timeline', 'impactAnalysis', 'predictedOutcomes']
};


const ARCHITECT_SYSTEM_INSTRUCTION = `You are the Nexus Brain's Prescriptive Engine. Your purpose is to act as a global strategy consultant. Based on a region's diagnosis (RROI) and a strategic objective, you must design a complete, multi-partner "Symbiotic Ecosystem." Identify real-world organizations that fit the required archetypes (Anchor, Innovation, Capital, etc.) to create a virtuous cycle of development. Your response MUST be a valid JSON object matching the SEAM_Blueprint schema.`;

const SEAM_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        strategicObjective: { type: Type.STRING, description: "A refined version of the user's objective that this ecosystem is designed to achieve." },
        ecosystemSummary: { type: Type.STRING, description: "A high-level narrative explaining the synergy between the prescribed partners and how they collectively solve the region's core challenges." },
        partners: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, description: "The archetype of the partner (e.g., 'Anchor', 'Innovation')." },
                    entity: { type: Type.STRING, description: "The name of the real-world company, university, or organization, including their country of origin." },
                    rationale: { type: Type.STRING, description: "A concise justification for why this specific partner is the right fit to fulfill their role in the ecosystem." },
                },
                required: ['type', 'entity', 'rationale']
            }
        }
    },
    required: ['strategicObjective', 'ecosystemSummary', 'partners']
};


export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  if (!process.env.API_KEY) {
    return new Response(JSON.stringify({ error: 'API key is not configured' }), { status: 500 });
  }

  try {
    const { action, payload } = await request.json();

    if (!action || !payload) {
      return new Response(JSON.stringify({ error: 'Action and payload are required.' }), { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let systemInstruction = '';
    let prompt = '';
    let schema: any;

    switch (action as NexusBrainAction) {
      case 'diagnose':
        systemInstruction = RROI_SYSTEM_INSTRUCTION;
        schema = RROI_SCHEMA;
        prompt = `
          **Region to Diagnose:** "${payload.region}"
          **User Goal Context:** "${payload.objective}"

          **Your Task:**
          1.  **Human Capital:** Analyze university presence, skilled workforce availability, and potential for 'brain drain/gain'.
          2.  **Infrastructure:** Assess physical (ports, airports, rail) and digital (broadband, data centers) connectivity.
          3.  **Agglomeration:** Evaluate the density of businesses, specialized services, and knowledge spillovers.
          4.  **Economic Composition:** Use principles of Location Quotient to identify key industrial clusters and Shift-Share analysis to understand growth drivers versus the national average.
          5.  **Governance:** Research the local government's pro-business policies, stability, and incentive structures.
          6.  **Quality of Life:** Assess factors that attract and retain talent (healthcare, education, amenities).
          
          Synthesize these findings into the RROI JSON format. The analysis for each component should be a concise, insightful paragraph.
        `;
        break;
        
      case 'simulate':
        systemInstruction = SIMULATE_SYSTEM_INSTRUCTION;
        schema = TPT_SCHEMA;
        prompt = `
            **Regional Diagnosis (RROI) Input:**
            \`\`\`json
            ${JSON.stringify(payload.rroi, null, 2)}
            \`\`\`

            **Proposed Intervention:**
            "${payload.intervention}"

            **Your Task:**
            Based on the provided RROI, analyze the likely impact of the intervention over a 5-10 year period. Explain the causal effects and predict the changes to the relevant RROI component scores. Format your response as a valid TPT_Simulation JSON object.
        `;
        break;
      
      case 'architect':
        systemInstruction = ARCHITECT_SYSTEM_INSTRUCTION;
        schema = SEAM_SCHEMA;
        prompt = `
            **Regional Diagnosis (RROI) Input:**
            \`\`\`json
            ${JSON.stringify(payload.rroi, null, 2)}
            \`\`\`

            **User's Strategic Objective:**
            "${payload.objective}"

            **Your Task:**
            Design a symbiotic ecosystem to achieve the user's objective, addressing the weaknesses and leveraging the strengths identified in the RROI. Use Google Search to find real-world entities for each partner archetype. Your response must be a valid SEAM_Blueprint JSON object.
        `;
        break;

      default:
        return new Response(JSON.stringify({ error: 'Invalid action.' }), { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const result = JSON.parse(response.text);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`Error in /api/nexus-brain for action:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: `Nexus Brain failed to respond: ${errorMessage}` }), {
      status: 500,
    });
  }
}