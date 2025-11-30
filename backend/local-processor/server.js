
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const {spawn } = require('child_process');
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
        fs.writeFileSync(logPath, `Exit Code: ${code}\\nStderr: ${pythonError}\\nStdout: ${pythonData}`);
        
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

// Script Generation Endpoint - Local Template-Based (No external API required!)
app.post('/generate-script', async (req, res) => {
  const { profileData } = req.body;
  
  if (!profileData) {
    return res.status(400).json({ error: 'Missing profileData' });
  }

  console.log('Generating personalized script for:', profileData.full_name || 'Unknown');

  try {
    const name = profileData.full_name?.split(' ')[0] || 'there';
    const role = profileData.role || 'user';
    const answers = profileData.onboarding_answers || {};
    
    // Extract goals/interests from onboarding data
    const goals = answers.goals || answers.interests || answers.goal || 'personal growth';
    const challenges = answers.challenges || answers.challenge || 'communication skills';
    
    // Generate personalized scripts based on profile
    const scriptData = {
      variations: {
        short: generateShortScript(name, role, goals),
        medium: generateMediumScript(name, role, goals, challenges),
        long: generateLongScript(name, role, goals, challenges, answers)
      }
    };

    console.log('✅ Successfully generated personalized script');
    res.json(scriptData);

  } catch (error) {
    console.error('Script generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions for template-based generation
function generateShortScript(name, role, goals) {
  return `Hi ${name}, let's take a quick moment for reflection. 

Think about your goal of ${goals}. What's one small thing you did today that moved you closer to this goal? It could be as simple as a conversation you had or a decision you made.

Remember, progress isn't always dramatic—sometimes it's the small, consistent steps that matter most. Share what's on your mind.`;
}

function generateMediumScript(name, role, goals, challenges) {
  return `Hello ${name}, welcome to your reflection session.

Today, I want you to think deeply about ${goals}. You mentioned wanting to work on ${challenges}, so let's explore that.

First, consider a recent situation where ${challenges} came into play. How did you handle it? What was going through your mind at the time? Looking back, what would you do differently?

Now, think about the progress you've made. Even if it feels small, acknowledge it. Growth happens in moments we often overlook.

As you speak, be honest with yourself. This is your space to reflect, learn, and grow. Take your time.`;
}

function generateLongScript(name, role, goals, challenges, answers) {
  const timeframe = answers.timeframe || 'the near future';
  const motivation = answers.motivation || 'becoming better';
  
  return `Welcome, ${name}. This is your dedicated time for deep reflection and growth.

Let's start with the big picture. You're focused on ${goals}, and you've identified ${challenges} as an area for improvement. These aren't random choices—they reflect what matters to you and where you want to grow.

Part 1: Recent Experiences
Think about this past week. When did you feel most aligned with your goal of ${motivation}? Describe that moment in detail. What were you doing? Who were you with? What made it significant?

Now, think about a challenging moment. We all face obstacles on the path to ${goals}. What happened? How did you respond? What did you learn about yourself in that situation?

Part 2: Patterns and Insights
As you reflect on your journey, have you noticed any patterns? Are there triggers that bring out your best self? Are there situations where ${challenges} becomes more difficult? Understanding these patterns is key to sustainable growth.

Part 3: Moving Forward
Looking ahead to ${timeframe}, what specific actions can you commit to? Be concrete. Instead of "I'll work on communication," try "I'll practice active listening in my next three meetings."

Remember, ${name}, this reflection practice is about progress, not perfection. Each time you show up and think deeply about your growth, you're investing in ${goals}. You're already on the path—this is just about being more intentional with each step.

Take your time. Speak from the heart. Your future self will thank you for this investment.`;
}

app.listen(port, () => {
  console.log(`Local processor listening at http://localhost:${port}`);
});
