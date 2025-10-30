import OpenAI from "openai";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  if (!openai) {
    throw new Error("OPENAI_API_KEY not configured");
  }
  return openai;
}

export interface RepairAnalysis {
  category: string;
  description: string;
  confidence: number;
  urgency: "low" | "medium" | "high";
}

export async function analyzeRepairImage(imageBase64: string): Promise<RepairAnalysis> {
  const client = getOpenAI();

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert at analyzing home repair and maintenance issues from photos. 
Analyze the image and identify:
1. The category of work needed (Plumbing, Electrical, Welding, Carpentry, HVAC, Appliance, or General Handyman)
2. A clear, professional description of the issue
3. Your confidence level (0-100)
4. Urgency level (low, medium, or high)

Respond in JSON format:
{
  "category": "category name",
  "description": "detailed description of the issue",
  "confidence": confidence_score,
  "urgency": "low|medium|high"
}`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
            {
              type: "text",
              text: "What type of repair or maintenance work is needed in this image?",
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const analysis = JSON.parse(content) as RepairAnalysis;
    return analysis;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error("Failed to analyze image. Please try again.");
  }
}
