import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini AI
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// The math prompt that makes simple maths complicated
const GRAND_PROMPT = `You are an expert at over-complicating simple questions. You have two modes:

If the question is mathematical (arithmetic, algebra, calculus, etc.), use absurdly complex mathematical concepts like:
- Calculus (derivatives, integrals, limits)
- Linear algebra (matrices, eigenvalues)
- Set theory, Graph theory, Differential equations
- Topology, Abstract algebra
Make the solution ridiculously convoluted but mathematically sound.

If the question is about instructions, tasks, or general knowledge, over-complicate it by:
- Using unnecessary advanced concepts from relevant fields
- Breaking simple tasks into many unnecessary steps
- Including technical jargon and theoretical frameworks
- Referencing physics, engineering, CS, biology, etc.

IMPORTANT: Choose the appropriate mode based on the question type. Make it ridiculously over-engineered but educational and technically sound. The answer must still be correct and maximum 400 words.

Question: `;

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
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: fullPrompt,
    });
    const text = result.text;

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

    const harderPrompt = `Take this already over-complicated explanation and make it EVEN MORE absurdly complex but still maximum 400 words. Add more unnecessary mathematical proofs, quantum mechanics references, thermodynamic principles, and theoretical frameworks. Make it sound like it requires a team of Nobel Prize winners to understand:

Original Question: "${originalQuestion}"
Original Response: "${originalResponse}"

Make this explanation even more ridiculously over-engineered while maintaining accuracy:`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: harderPrompt
    });
    const text = result.text;

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

// Chat with files endpoint
app.post('/api/chat-with-files', upload.any(), async (req, res) => {
  try {
    const { message, fileCount } = req.body;
    const files = req.files;

    if (!message && (!files || files.length === 0)) {
      return res.status(400).json({ error: 'Message or files are required' });
    }

    // Create prompt with file information
    let fullPrompt = `${GRAND_PROMPT}\n\nUser Question: "${message || 'Please analyze these files'}"`;

    if (files && files.length > 0) {
      fullPrompt += `\n\nThe user has uploaded ${files.length} file(s):`;
      files.forEach((file, index) => {
        fullPrompt += `\n- File ${index + 1}: ${file.originalname} (${file.mimetype}, ${Math.round(file.size / 1024)}KB)`;
      });
      fullPrompt += `\n\nPlease provide an over-complicated analysis that references these files and their content where relevant.`;
    }

    // Generate response using Gemini
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: fullPrompt,
    });
    const text = response.text;

    res.json({
      response: text,
      timestamp: new Date().toISOString(),
      filesProcessed: files ? files.length : 0
    });

  } catch (error) {
    console.error('Error generating response with files:', error);
    res.status(500).json({
      error: 'Failed to generate response with files',
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
