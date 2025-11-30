
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
// const fetch = require('node-fetch'); // Native fetch is available in Node 18+
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Ensure tmp directory exists
const tmpDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir);
}

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Local Processor is running!');
});

app.post('/process', async (req, res) => {
  const { recording_id, video_path } = req.body;

  if (!recording_id || !video_path) {
    return res.status(400).json({ error: 'Missing recording_id or video_path' });
  }

  console.log(`Received processing request for recording: ${recording_id}`);

  try {
    // 1. Download video from Supabase
    console.log(`Downloading video from: ${video_path}`);
    
    // DEBUG: List files in the folder to see what's there
    const userId = video_path.split('/')[0];
    console.log(`Debug: Listing files for user ${userId} in 'recordings' bucket...`);
    const { data: listData, error: listError } = await supabase
      .storage
      .from('recordings')
      .list(userId);
    
    if (listError) {
      console.error('Debug: List error:', listError);
    } else {
      console.log('Debug: Files found:', listData.map(f => f.name));
      // Check if our file is in the list
      const fileName = video_path.split('/')[1];
      const found = listData.find(f => f.name === fileName);
      console.log(`Debug: Looking for '${fileName}', found:`, found ? 'YES' : 'NO');
    }

    // Create a signed URL for downloading (valid for 60 seconds)
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('recordings') // Correct bucket name
      .createSignedUrl(video_path, 60);

    if (signedUrlError) {
      throw new Error(`Failed to create signed URL: ${signedUrlError.message}`);
    }

    const videoUrl = signedUrlData.signedUrl;
    const localVideoPath = path.join(tmpDir, `${recording_id}.mp4`); // Assuming mp4, ideally get ext from path

    const response = await fetch(videoUrl);
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }
    
    const fileStream = fs.createWriteStream(localVideoPath);
    await new Promise((resolve, reject) => {
        response.body.pipe(fileStream);
        response.body.on('error', reject);
        fileStream.on('finish', resolve);
    });

    console.log(`Video saved to: ${localVideoPath}`);

    // 2. Spawn Python worker
    console.log('Spawning Python worker...');
    const pythonProcess = spawn('python', ['worker_vosk.py', localVideoPath, recording_id]);

    let pythonData = '';
    let pythonError = '';

    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python stdout: ${data}`);
      pythonData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python stderr: ${data}`);
      pythonError += data.toString();
    });

    pythonProcess.on('close', async (code) => {
      console.log(`Python worker exited with code ${code}`);
      
      // Cleanup temp file
      try {
        if (fs.existsSync(localVideoPath)) {
          fs.unlinkSync(localVideoPath);
          console.log('Temp file cleaned up');
        }
      } catch (cleanupError) {
        console.error('Failed to cleanup temp file:', cleanupError);
      }

      if (code === 0) {
        // Success
        try {
          const results = JSON.parse(pythonData);
          console.log('Analysis results:', results);

          // Insert into Supabase
          const { error: insertError } = await supabase
            .from('insights')
            .insert([{
              recording_id: recording_id,
              transcript: results.transcript,
              filler_words: results.filler_count,
              sentiment_score: results.sentiment_score,
              posture_score: results.posture_score,
              status: 'completed'
            }]);

          if (insertError) {
            console.error('Supabase insert error:', insertError);
            throw new Error(`Supabase insert failed: ${insertError.message}`);
          }

          console.log('Results saved to Supabase');
          res.json({ status: 'success', message: 'Processing complete', data: results });
        } catch (parseError) {
          console.error('Error parsing Python output or saving to DB:', parseError);
          // Update status to failed
          await supabase.from('recordings').update({ status: 'failed' }).eq('id', recording_id);
          res.status(500).json({ status: 'error', message: 'Failed to parse results', details: parseError.message });
        }
      } else {
        console.error('Worker failed with code:', code);
        console.error('Stderr:', pythonError);
        
        // Log to file
        const logPath = path.join(__dirname, 'logs', `error-${recording_id}.log`);
        fs.writeFileSync(logPath, `Exit Code: ${code}\nStderr: ${pythonError}\nStdout: ${pythonData}`);
        
        // Update status to failed
        await supabase.from('recordings').update({ status: 'failed' }).eq('id', recording_id);
        
        res.status(500).json({ status: 'error', message: 'Worker failed', details: pythonError });
      }
    });
  } catch (error) {
    console.error('Processing error:', error);
    // Update status to failed
    if (recording_id) {
        await supabase.from('recordings').update({ status: 'failed' }).eq('id', recording_id);
    }
    res.status(500).json({ error: error.message });
  }
});

// Script Generation Endpoint using Hugging Face
app.post('/generate-script', async (req, res) => {
  const { profileData } = req.body;
  
  if (!profileData) {
    return res.status(400).json({ error: 'Missing profileData' });
  }

  console.log('Generating script for profile:', profileData.id);

  try {
    // Construct prompt based on profile data
    const prompt = `
You are a communication coach helping a user record a video reflection.
Based on their profile, generate 3 scripts (Short: ~1 min, Medium: ~3 min, Long: ~5 min) for them to speak.

User Profile:
- Name: ${profileData.full_name || 'Friend'}
- Role: ${profileData.role || 'User'}
- Goals: ${JSON.stringify(profileData.onboarding_answers || {})}

Output MUST be valid JSON in this format:
{
  "variations": {
    "short": "...",
    "medium": "...",
    "long": "..."
  }
}

Generate the JSON now:
`;

    // Call Hugging Face API
    const hfToken = process.env.HUGGING_FACE_API_KEY;
    const model = "mistralai/Mistral-7B-Instruct-v0.2";
    
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        "Authorization": hfToken ? `Bearer ${hfToken}` : undefined,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 1000,
          return_full_text: false,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    let generatedText = result[0]?.generated_text || "";
    
    // Attempt to extract JSON from the text (LLMs sometimes add chatter)
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      generatedText = jsonMatch[0];
    }

    let scriptData;
    try {
      scriptData = JSON.parse(generatedText);
    } catch (e) {
      console.error("Failed to parse LLM output as JSON:", generatedText);
      // Fallback if JSON parsing fails
      scriptData = {
        variations: {
          short: "Hi! Take a moment to reflect on your day. What went well? What could be improved?",
          medium: "Hello! Let's dive deeper. Think about a recent challenge you faced. How did you handle it? What did you learn about yourself?",
          long: "Welcome back. Today, I want you to explore your long-term goals. How do your current actions align with them? Take your time to articulate your vision."
        }
      };
    }

    res.json(scriptData);

  } catch (error) {
    console.error('Script generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Local processor listening at http://localhost:${port}`);
});
