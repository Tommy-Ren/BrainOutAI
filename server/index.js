import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Middleware
app.use(cors());
app.use(express.json());

// The grand prompt that makes simple things complicated
const GRAND_PROMPT = `You are BrainOutAI, an AI that takes simple questions and transforms them into hilariously over-complicated, technically accurate, but absurdly detailed explanations. Your goal is to make the simplest concepts sound like they require a PhD in theoretical physics to understand.

Guidelines:
1. Always be technically correct, but use the most complex terminology possible
2. Include unnecessary mathematical formulas, scientific principles, and technical jargon
3. Reference obscure theories, quantum mechanics, thermodynamics, or advanced mathematics even for simple questions
4. Use formal academic language with lots of subordinate clauses
5. Include multiple "considerations" and "variables" that normal people would never think about
6. Make it sound like you're solving the most complex problem in the universe
7. Be funny through over-engineering, not through being wrong
8. For math problems, show every possible step, alternative method, and theoretical framework
9. Always maintain accuracy while being ridiculously verbose

Examples:
- Simple: "What's 2+2?" 
- Complex: "To determine the sum of two discrete integer units and two additional discrete integer units, we must first establish our mathematical framework within the Peano axiom system..."

- Simple: "How do I make coffee?"
- Complex: "The preparation of a caffeinated beverage through the thermodynamic extraction of soluble compounds from roasted Coffea arabica seeds requires a comprehensive understanding of fluid dynamics, heat transfer coefficients, and molecular dissolution kinetics..."

Now, take the user's question and transform it into an over-complicated but accurate explanation:`;

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Create the full prompt
    const fullPrompt = `${GRAND_PROMPT}\n\nUser Question: "${message}"`;

    // Generate response using Gemini
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({ 
      response: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      details: error.message 
    });
  }
});

// Make it even harder endpoint
app.post('/api/make-harder', async (req, res) => {
  try {
    const { originalQuestion, originalResponse } = req.body;
    
    if (!originalQuestion || !originalResponse) {
      return res.status(400).json({ error: 'Original question and response are required' });
    }

    const harderPrompt = `Take this already over-complicated explanation and make it EVEN MORE absurdly complex. Add more unnecessary mathematical proofs, quantum mechanics references, thermodynamic principles, and theoretical frameworks. Make it sound like it requires a team of Nobel Prize winners to understand:

Original Question: "${originalQuestion}"
Original Response: "${originalResponse}"

Make this explanation even more ridiculously over-engineered while maintaining accuracy:`;

    const result = await model.generateContent(harderPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({ 
      response: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating harder response:', error);
    res.status(500).json({ 
      error: 'Failed to generate harder response',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'BrainOutAI server is running' });
});

app.listen(PORT, () => {
  console.log(`🧠 BrainOutAI server running on port ${PORT}`);
  console.log(`🚀 Ready to over-complicate simple questions!`);
});
