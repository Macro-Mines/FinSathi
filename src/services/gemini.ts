import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Category, CATEGORIES, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function categorizeTransactions(transactions: Partial<Transaction>[]): Promise<Transaction[]> {
  const CHUNK_SIZE = 40;
  const allEnriched: Transaction[] = [];

  for (let i = 0; i < transactions.length; i += CHUNK_SIZE) {
    const chunk = transactions.slice(i, i + CHUNK_SIZE);
    const prompt = `
      Categorize the following bank transactions into one of these categories: ${CATEGORIES.join(', ')}.
      Also provide a specific sub-category for each.
      
      Transactions:
      ${JSON.stringify(chunk.map(t => ({ description: t.rawDescription, amount: t.amount, type: t.type })))}
      
      Return the result as a JSON array of objects with "category" and "subCategory" fields, matching the order of input.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING, enum: [...CATEGORIES] },
                subCategory: { type: Type.STRING }
              },
              required: ["category", "subCategory"]
            }
          }
        }
      });

      const results = JSON.parse(response.text || '[]');
      const enrichedChunk = chunk.map((t, index) => ({
        ...t,
        category: results[index]?.category || 'Others',
        subCategory: results[index]?.subCategory || 'General',
      } as Transaction));
      
      allEnriched.push(...enrichedChunk);
    } catch (error) {
      console.error(`Error categorizing chunk starting at ${i}:`, error);
      const fallbackChunk = chunk.map(t => ({
        ...t,
        category: 'Others',
        subCategory: 'General',
      } as Transaction));
      allEnriched.push(...fallbackChunk);
    }
  }

  return allEnriched;
}

export async function getFinancialAdvice(
  query: string, 
  transactions: Transaction[], 
  profile: any,
  history: ChatMessage[]
) {
  const context = `
    You are FinSathi, a premium AI financial concierge for the Indian market.
    Your mission is to provide deeply personalized, actionable, and data-driven financial advice.

    USER PROFILE:
    - Name: ${profile.displayName}
    - Income Bracket: ${profile.incomeBracket}
    - Goals: ${profile.goals?.join(', ')}
    - Preferred Language: ${profile.preferredLanguage}
    
    DATA CONTEXT:
    Total Transactions Provided: ${transactions.length}
    Recent Transactions (Last 50):
    ${JSON.stringify(transactions.slice(0, 50).map(t => ({ date: t.date, desc: t.description, amt: t.amount, type: t.type, cat: t.category })))}
    
    STRICT GUIDELINES:
    1. Answer in ${profile.preferredLanguage || 'English'}. If the user uses Hinglish, reply in polished Hinglish.
    2. Be empathetic but objective. Use the user's data to back up your suggestions.
    3. For budgeting, use the 50/30/20 rule adjusted for Indian middle-class context.
    4. Mention specific Indian investment instruments like PPF, SIPs, ELSS, or FD/RD where relevant to their goals.
    5. Always include this disclaimer: 'Mitr, this is AI-powered analysis for information only, not regulated financial advice. Consult a SEBI-registered advisor for investments.'
    6. If asked about specific transactions, refer to their descriptions and amounts accurately.
    7. Maintain a helpful, conversational "Sathi" (companion) tone.
  `;

  // Map internal history to Gemini format
  const formattedHistory = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  const chat = ai.chats.create({
    model: "gemini-3.1-pro-preview",
    config: {
      systemInstruction: context,
    },
    history: formattedHistory
  });
  
  const response = await chat.sendMessage({ message: query });
  return response.text;
}

export async function getSmartInsights(transactions: Transaction[], profile: any) {
  const prompt = `
    Analyze these transactions and provide 2-3 specific, actionable financial insights for a user in India.
    Consider their income bracket (${profile.incomeBracket}) and goals (${profile.goals?.join(', ')}).
    
    Transactions:
    ${JSON.stringify(transactions.slice(0, 100).map(t => ({ date: t.date, desc: t.description, amt: t.amount, type: t.type, cat: t.category })))}
    
    Return the result as a JSON array of objects with "title", "description", and "type" (one of: "warning", "success", "info").
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["warning", "success", "info"] }
            },
            required: ["title", "description", "type"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Insights error:", error);
    return [];
  }
}
