import axios, { AxiosInstance } from 'axios';
import Logger from '../utils/logger';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class OpenRouterClient {
  private client: AxiosInstance;
  private apiKey: string;
  private defaultModel: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.defaultModel = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';

    this.client = axios.create({
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:1111',
        'X-Title': 'Meta Ads Analytics Suite',
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 seconds
    });
  }

  /**
   * Send a chat completion request to OpenRouter
   */
  async chat(
    messages: OpenRouterMessage[],
    options: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
    } = {}
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const request: OpenRouterRequest = {
      model: options.model || this.defaultModel,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 2000,
    };

    try {
      Logger.info(`OpenRouter request to ${request.model}`);

      const response = await this.client.post<OpenRouterResponse>(
        '/chat/completions',
        request
      );

      const content = response.data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content in OpenRouter response');
      }

      Logger.info(
        `OpenRouter response: ${response.data.usage.total_tokens} tokens used`
      );

      return content;
    } catch (error: any) {
      if (error.response) {
        Logger.error('OpenRouter API error:', {
          status: error.response.status,
          data: error.response.data,
        });
        throw new Error(
          `OpenRouter API error: ${error.response.data?.error?.message || error.message}`
        );
      }

      Logger.error('OpenRouter request failed:', error);
      throw error;
    }
  }

  /**
   * Analyze creative content for ad performance prediction
   */
  async analyzeCreative(imageUrl: string, adName: string): Promise<{
    analysis: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    predictedScore: number;
  }> {
    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: `You are an expert Meta Ads creative analyst. Analyze ad creatives and provide actionable insights for performance optimization.`,
      },
      {
        role: 'user',
        content: `Analyze this Meta ad creative:
Ad Name: ${adName}
Image URL: ${imageUrl}

Provide a detailed analysis in JSON format with:
1. analysis: Overall assessment (2-3 sentences)
2. strengths: Array of 3-5 strengths
3. weaknesses: Array of 2-4 weaknesses
4. recommendations: Array of 3-5 specific recommendations
5. predictedScore: Performance prediction score (0-100)

Return ONLY valid JSON, no markdown formatting.`,
      },
    ];

    const response = await this.chat(messages, { temperature: 0.5 });

    try {
      // Remove markdown code blocks if present
      const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanResponse);
    } catch (error) {
      Logger.error('Failed to parse creative analysis response:', response);
      throw new Error('Failed to parse AI response');
    }
  }

  /**
   * Detect anomalies in metrics and provide explanations
   */
  async explainAnomaly(
    entityType: string,
    entityName: string,
    metricName: string,
    expectedValue: number,
    actualValue: number,
    deviation: number,
    historicalContext?: string
  ): Promise<string> {
    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: `You are an expert Meta Ads performance analyst. Explain anomalies in ad metrics with actionable insights.`,
      },
      {
        role: 'user',
        content: `Explain this anomaly in Meta Ads performance:

Entity: ${entityType} "${entityName}"
Metric: ${metricName}
Expected Value: ${expectedValue.toFixed(2)}
Actual Value: ${actualValue.toFixed(2)}
Deviation: ${deviation.toFixed(1)}%
${historicalContext ? `\nHistorical Context: ${historicalContext}` : ''}

Provide a concise explanation (2-3 sentences) of:
1. What likely caused this deviation
2. Whether it's a concern or opportunity
3. What action should be taken

Keep it practical and actionable.`,
      },
    ];

    return await this.chat(messages, { temperature: 0.3, max_tokens: 300 });
  }

  /**
   * Generate insights from campaign data
   */
  async generateInsights(data: {
    totalSpend: number;
    totalConversions: number;
    avgCPC: number;
    avgCTR: number;
    avgROAS: number;
    topCampaigns: Array<{ name: string; spend: number; conversions: number }>;
    dateRange: { start: string; end: string };
  }): Promise<{
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    opportunities: string[];
  }> {
    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: `You are an expert Meta Ads strategist. Generate actionable insights from campaign performance data.`,
      },
      {
        role: 'user',
        content: `Analyze this Meta Ads performance data and generate insights:

Period: ${data.dateRange.start} to ${data.dateRange.end}
Total Spend: $${data.totalSpend.toFixed(2)}
Total Conversions: ${data.totalConversions}
Avg CPC: $${data.avgCPC.toFixed(2)}
Avg CTR: ${data.avgCTR.toFixed(2)}%
Avg ROAS: ${data.avgROAS.toFixed(2)}

Top Campaigns:
${data.topCampaigns.map(c => `- ${c.name}: $${c.spend.toFixed(2)} spend, ${c.conversions} conversions`).join('\n')}

Provide insights in JSON format:
1. summary: Overall performance summary (2-3 sentences)
2. keyFindings: Array of 4-6 key findings
3. recommendations: Array of 4-6 actionable recommendations
4. opportunities: Array of 3-5 growth opportunities

Return ONLY valid JSON, no markdown formatting.`,
      },
    ];

    const response = await this.chat(messages, { temperature: 0.6 });

    try {
      const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanResponse);
    } catch (error) {
      Logger.error('Failed to parse insights response:', response);
      throw new Error('Failed to parse AI response');
    }
  }

  /**
   * Natural language query interface
   */
  async queryData(
    question: string,
    context: {
      campaigns?: number;
      adsets?: number;
      ads?: number;
      totalSpend?: number;
      dateRange?: string;
    }
  ): Promise<string> {
    const contextStr = Object.entries(context)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: `You are a Meta Ads analytics assistant. Answer questions about ad performance data clearly and concisely. Be helpful and actionable.`,
      },
      {
        role: 'user',
        content: `Based on this data context: ${contextStr || 'No specific context provided'}

Question: ${question}

Provide a clear, concise answer (2-4 sentences). If you need more data to answer accurately, say so.`,
      },
    ];

    return await this.chat(messages, { temperature: 0.4, max_tokens: 400 });
  }
}

// Export singleton instance
export default new OpenRouterClient();
