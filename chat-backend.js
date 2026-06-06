import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Formatting function for responses
function formatResponse(text) {
  // Remove all ** ** markers
  let formatted = text.replace(/\*\*/g, '');
  
  // Ensure actions are italicized and on new lines, dialogue in quotes
  // This improves readability but keeps the response natural
  
  return formatted;
}

// New endpoint: Generate initial roleplay scene
app.post('/api/start-scene', async (req, res) => {
  const { basePrompt, scenario } = req.body;
  
  const startPrompt = `${basePrompt} (scenario: ${scenario}))\n\nIMPORTANT FORMATTING RULES:
1. Put ALL actions in *italics* (use single asterisks, not double)
2. Put ALL spoken dialogue in "quotes"
3. Start new lines for each action or dialogue
4. Keep responses natural and immersive
5. NEVER use double asterisks ** **
6. Example format:
*she looks down shyly, adjusting her glasses* "H-hey... I didn't see you there."
*she fidgets with her hands* "What brings you here?"

Now start the scene. As the girl, give a first response that sets the mood, describes your character briefly, and engages the user.`;
  
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: startPrompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 400,
    });
    
    let reply = chatCompletion.choices[0]?.message?.content || "Let's start the scene...";
    reply = formatResponse(reply);
    res.json({ reply });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate scene' });
  }
});

// Existing chat endpoint with formatting instructions
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  // Add formatting instructions to every request
  const formattedMessage = `${message}\n\nIMPORTANT FORMATTING RULES:
1. Put ALL actions in *italics* (use single asterisks, not double)
2. Put ALL spoken dialogue in "quotes"
3. Start new lines for each action or dialogue
4. NEVER use double asterisks ** **
5. Example: *she blushes* "That's so sweet of you to say." *she looks away shyly* "I don't know what to say..."`;
  
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: formattedMessage }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 500,
    });
    
    let reply = chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
    reply = formatResponse(reply);
    res.json({ reply });
    
  } catch (error) {
    console.error('Groq API Error:', error);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});


