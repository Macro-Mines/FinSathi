import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Category, CATEGORIES } from "../types";

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
        model: "gemini-3-flash-preview",
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
  history: { role: 'user' | 'model', content: string }[]
) {
  const context = `
    User Profile:
    - Income Bracket: ${profile.incomeBracket}
    - Goals: ${profile.goals?.join(', ')}
    - Language: ${profile.preferredLanguage}
    
    Recent Transactions (Summary):
    ${JSON.stringify(transactions.slice(0, 50).map(t => ({ date: t.date, desc: t.description, amt: t.amount, type: t.type, cat: t.category })))}
    
    Instructions:
    - You are FinSathi, a helpful AI financial consultant for the Indian market.
    - Provide data-grounded answers based on the user's transactions.
    - Use Hinglish if the user asks in Hinglish or if preferred.
    - Include a disclaimer: 'This is informational, not regulated financial advice.'
    - Be concise and actionable.
  `;

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: context,
    }
  });

  // Add history
  // Note: sendMessage only takes a string message, so we might need to handle history differently if needed
  // but for now let's just send the query.
  
  const response = await chat.sendMessage({ message: query });
  return response.text;
}
