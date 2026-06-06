import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AIAnalysisResult {
  assetType: string;
  severity: 'Low' | 'Medium' | 'High';
  slaHours: number;
  confidence: number;
  priorityScore: number;
  warrantyRisk: boolean;
  summary: string;
}

export async function analyzeIssue(
  description: string,
  imageBase64?: string
): Promise<AIAnalysisResult> {
  const prompt = `You are an AI system for CityPramaan, a civic infrastructure platform in India.
Analyze this civic issue report and return ONLY a JSON object with no extra text.

Description: "${description}"

Return this exact JSON:
{
  "assetType": "ROAD_DAMAGE | DRAIN | STREETLIGHT | FOOTPATH | WATER_SUPPLY | GARBAGE | OTHER",
  "severity": "Low | Medium | High",
  "slaHours": <number of hours to resolve>,
  "confidence": <0-100>,
  "priorityScore": <0-100>,
  "warrantyRisk": <true if likely repeat failure>,
  "summary": "<one line summary>"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const result = JSON.parse(text);
  return result as AIAnalysisResult;
}

export async function compareBeforeAfter(
  beforeDescription: string,
  afterDescription: string
): Promise<{ repairVerified: boolean; score: number; feedback: string }> {
  const prompt = `You are verifying a civic repair for CityPramaan.
Before: "${beforeDescription}"
After: "${afterDescription}"
Return ONLY this JSON:
{
  "repairVerified": <true if repair looks genuine>,
  "score": <0-100 quality score>,
  "feedback": "<one line feedback>"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return JSON.parse(text);
}