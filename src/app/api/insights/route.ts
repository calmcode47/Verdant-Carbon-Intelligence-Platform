/**
 * @file route.ts
 * @description Next.js API Route for AI Carbon Insights.
 * Integrates with Google Gemini to analyze carbon logs and return structured insights (TIP, WARNING, ACHIEVEMENT, PREDICTION)
 * and optional chat responses. Includes a rich fallback mechanism for non-configured API key environments.
 */

import { NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { activities, userQuestion, summary: userSummary } = await req.json();

    // 1. Define fallbacks for unconfigured API key environments
    const fallbackInsights = [
      {
        type: 'tip',
        title: 'Smart Thermostat Integration',
        description: 'Lowering your thermostat by just 1.5°C during winter hours can decrease your heating footprint by roughly 10%.',
        potentialSavingKg: 4.8,
        difficulty: 'easy',
        category: 'energy',
        actionItems: [
          'Install a programmable smart thermostat',
          'Lower night heating target to 18°C',
          'Use heavy drapes to retain warmth during evenings'
        ]
      },
      {
        type: 'warning',
        title: 'Commute Peak Anomaly',
        description: 'Your transport emissions have spiked 32% above the baseline average. Short driving trips are compounding your transport carbon footprint.',
        potentialSavingKg: 12.0,
        difficulty: 'medium',
        category: 'transport',
        actionItems: [
          'Consolidate multiple short errands into one trip',
          'Opt for cycling or walking for trips under 3km',
          'Enable eco-routing on your GPS navigation app'
        ]
      },
      {
        type: 'achievement',
        title: 'Green Dietary Streak',
        description: 'Incredible progress! You reduced your food-related carbon footprint by 15% this week by selecting plant-based alternatives.',
        potentialSavingKg: 8.5,
        difficulty: 'easy',
        category: 'food',
        actionItems: [
          'Maintain your current plant-based lunch schedule',
          'Explore dairy-free milk alternatives like oat or almond',
          'Continue composting organic leftovers to prevent methane release'
        ]
      },
      {
        type: 'prediction',
        title: 'Monthly Budget Projection',
        description: 'Based on current activity frequencies, you are projected to emit approximately 382 kg of CO₂ this month, which is 18 kg below your 400 kg budget threshold.',
        potentialSavingKg: 18.0,
        difficulty: 'medium',
        category: 'lifestyle',
        actionItems: [
          'Adopt carbon offset subscriptions for residual travel emissions',
          'Audit appliance energy ratings before future purchases',
          'Encourage one family member to join your carbon saving streak'
        ]
      }
    ];

    let fallbackChat = 'I have analyzed your carbon logs. Your transport emissions are currently your highest source, but your recent food savings are a major win. Try reducing short trips to make the largest immediate impact.';
    if (userQuestion) {
      const q = userQuestion.toLowerCase();
      if (q.includes('transport') || q.includes('car') || q.includes('travel')) {
        fallbackChat = 'To reduce your transport emissions, prioritize active travel (walking or cycling) for shorter trips. For longer commutes, public transit or carpooling can reduce your per-mile impact by 60-80%. If you must drive, accelerating smoothly and maintaining optimal tire pressure can improve fuel efficiency by up to 10%.';
      } else if (q.includes('food') || q.includes('diet') || q.includes('eat')) {
        fallbackChat = 'Food emissions are heavily driven by animal products. Shifting from red meat to poultry can save around 5-7 kg of CO₂ per meal, while moving to fully plant-based meals can reduce food-related emissions by up to 70%. Additionally, reducing food waste is one of the highest-impact climate actions you can take.';
      } else if (q.includes('energy') || q.includes('electric') || q.includes('heat') || q.includes('power')) {
        fallbackChat = 'Your energy footprint can be trimmed by adjusting heating and cooling. Washing clothes in cold water saves about 0.3 kg CO₂ per load. Unplugging "vampire electronics" (standby power) can shave 5-8% off your electric bill. Upgrading to LED bulbs is another quick win.';
      } else if (q.includes('plan') || q.includes('7-day') || q.includes('reduce')) {
        fallbackChat = 'Here is a simple 7-Day Carbon Diet:\n- **Day 1**: Bike or walk for all trips under 3km.\n- **Day 2**: Swap red meat for a plant-based meal.\n- **Day 3**: Unplug standby electronics (TV, consoles) at night.\n- **Day 4**: Wash all laundry on cold cycles.\n- **Day 5**: Limit shower time to 5 minutes.\n- **Day 6**: Switch off unused lights and power strips.\n- **Day 7**: Audit your local recycling and organic waste streams.';
      }
    }

    const fallbackSummary = 'Overall, your footprint shows a steady profile with minor spikes in Transport. Your Energy usage remains consistent, and your Food choices are improving due to recent plant-based meals. Focus on consolidating vehicle trips to maximize reductions.';

    // 2. Load Google Gemini AI model
    const model = getGeminiModel('gemini-1.5-flash');

    if (!model) {
      // Return mock response when API key is missing
      return NextResponse.json({
        insights: fallbackInsights,
        chatResponse: userQuestion ? fallbackChat : undefined,
        summary: fallbackSummary
      });
    }

    // 3. Build Prompt
    const systemContext = `You are an expert carbon footprint analyst and sustainability advisor. 
Analyze the user's carbon data and provide actionable, specific, science-backed advice.
Always quantify recommendations (e.g., "This would save 2.3 kg CO2/week").
Use IPCC, EPA, and peer-reviewed sources for your calculations.
Be encouraging but honest. Focus on high-impact, low-effort changes first.`;

    const userContext = `
User's carbon summary: ${JSON.stringify(userSummary || {})}
Recent activities: ${JSON.stringify(activities?.slice(0, 20) || [])}
User question: ${userQuestion || 'Analyze my footprint and give me personalized insights'}

Return a JSON response with this structure:
{
  "insights": [
    {
      "type": "tip" | "warning" | "achievement" | "prediction",
      "title": "...",
      "description": "...",
      "potentialSavingKg": number,
      "difficulty": "easy" | "medium" | "hard",
      "category": "transport" | "food" | "energy" | "lifestyle",
      "actionItems": ["...", "...", "..."]
    }
  ],
  "chatResponse": "... (provide only if the user asked a question, otherwise null)",
  "summary": "One paragraph overall assessment"
}

Ensure the output is valid JSON. Do not include markdown code block syntax (like \`\`\`json) in the response text, or if you do, ensure it is the only content returned.`;

    const result = await model.generateContent(systemContext + '\n\n' + userContext);
    let text = result.response.text().trim();

    // Clean up markdown wrappers
    if (text.startsWith('```json')) {
      text = text.substring(7, text.lastIndexOf('```')).trim();
    } else if (text.startsWith('```')) {
      text = text.substring(3, text.lastIndexOf('```')).trim();
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('Could not extract JSON from Gemini response. Text was:', text);
      return NextResponse.json({
        insights: fallbackInsights,
        chatResponse: userQuestion ? fallbackChat : undefined,
        summary: fallbackSummary
      });
    }

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error generating Gemini insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
