import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize the Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { rant } = await req.json();

    if (!rant) {
      return NextResponse.json(
        { error: 'Rant content is required.' },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
       // Mock response if API key is not set
       return NextResponse.json({
         scores: {
           ti: 0.8, te: 0.2, fi: 0.3, fe: 0.1, ni: 0.6, ne: 0.9, si: 0.4, se: 0.5
         },
         fault_detected: "Ti-Si Loop",
         patch_notes: "Warning: Missing GROQ_API_KEY. This is a mock response. Please add your key to .env.local to activate the Cognitive OS kernel."
       });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are the Cognitive OS Kernel. Your task is to perform a 'System Audit' on the user's rant. 
- Identify usage weights (0.0 to 1.0) for the 8 Jungian functions (ti, te, fi, fe, ni, ne, si, se).
- Detect 'System Faults': Identify if the user is in a 'Ti-Si Loop', 'Inferior Fe Grip', or other specific Jungian stress states.
- Return ONLY a JSON object: 
{
  "scores": { "ti": 0.9, "te": 0.1, "fi": 0.2, "fe": 0.1, "ni": 0.5, "ne": 0.8, "si": 0.7, "se": 0.3 },
  "fault_detected": "string",
  "patch_notes": "A technical, growth-oriented suggestion to restore system stability."
}`,
        },
        {
          role: 'user',
          content: rant,
        },
      ],
      model: 'llama-3.1-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = completion.choices[0]?.message?.content;
    
    if (!result) {
      throw new Error("No response from Groq");
    }

    const parsedResult = JSON.parse(result);
    return NextResponse.json(parsedResult);

  } catch (error: any) {
    console.error('Groq API Error:', error);
    return NextResponse.json(
      { error: 'Internal System Error. Failed to parse Cognitive Output.' },
      { status: 500 }
    );
  }
}
