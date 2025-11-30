
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

// Script Generation Endpoint using Hugging Face Inference Providers
app.post('/generate-script', async (req, res) => {
  const { profileData } = req.body;
  
  if (!profileData) {
    return res.status(400).json({ error: 'Missing profileData' });
  }

  console.log('Generating script for user:', profileData.full_name || 'Unknown');

  try {
    const hfToken = process.env.HUGGING_FACE_API_KEY;
    if (!hfToken) {
      throw new Error('HUGGING_FACE_API_KEY not set in .env file');
    }

    // Using Hugging Face Inference Providers with google/gemma-2-2b-it model
    // This model is available via the Inference Providers and uses the router endpoint
    const model = "google/gemma-2-2b-it"; // Using Gemma 2 2B which is free and reliable
    
    // Construct system + user messages
    const systemPrompt = `You are a communication coach helping users record video reflections. Generate personalized scripts based on their profile.

Output MUST be valid JSON in this exact format:
{
  "variations": {
    "short": "1-minute script here",
    "medium": "3-minute script here",
    "long": "5-minute script here"
  }
}`;

    const userPrompt = `Generate 3 personalized video recording scripts for:
Name: ${profileData.full_name || 'the user'}
Role: ${profileData.role || 'User'}
Goals: ${JSON.stringify(profileData.onboarding_answers || {})}

The scripts should help them reflect and practice communication skills.
Remember: Output valid JSON only.`;

    // Use the router.huggingface.co endpoint with OpenAI-compatible format
    const response = await fetch(`https://router.huggingface.co/featherless-ai/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hfToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API error:', response.status, errorText);
      throw new Error(`Hugging Face API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    const generatedText = result.choices?.[0]?.message?.content || "";
    
    console.log('LLM raw output:', generatedText);

    // Attempt to extract JSON from the text
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    let scriptData;
    
    if (jsonMatch) {
      try {
        scriptData = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("Failed to parse extracted JSON:", jsonMatch[0]);
        scriptData = null;
      }
    }

    // Fallback if JSON parsing fails
    if (!scriptData || !scriptData.variations) {
      console.log("Using fallback script template");
      const name = profileData.full_name?.split(' ')[0] || 'there';
      scriptData = {
        variations: {
          short: `Hi ${name}, take a moment to reflect. What was the most significant part of your day? How did you handle challenges?`,
          medium: `Hello ${name}, let's dive deeper into your experiences. Think about a recent challenge you faced. How did you approach it? What did you learn about yourself? What would you do differently next time?`,
          long: `Welcome ${name}. Today, I want you to explore your long-term goals and daily actions. How do your current habits align with where you want to be? What specific steps can you take this week to move closer to your aspirations? Take your time to articulate your vision clearly.`
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
