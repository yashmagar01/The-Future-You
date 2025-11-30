
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
    console.log(`Debug: Generated Signed URL: ${videoUrl}`);
    const localVideoPath = path.join(tmpDir, `${recording_id}.mp4`); // Assuming mp4, ideally get ext from path

    const response = await fetch(videoUrl);
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }
    
    const fileStream = fs.createWriteStream(localVideoPath);
    
    // Node 18+ native fetch returns a Web Stream, which doesn't have .pipe()
    // We need to convert it to a Node stream or use stream pipeline
    const { Readable } = require('stream');
    // @ts-ignore
    const nodeStream = Readable.fromWeb(response.body);

    await new Promise((resolve, reject) => {
        nodeStream.pipe(fileStream);
        nodeStream.on('error', reject);
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

          // Calculate derived metrics
          const duration = results.duration || 60; // Default to 60s if missing
          const wpm = Math.round(results.transcript.split(' ').length / (duration / 60));
          const clarityScore = Math.max(0, 100 - (results.filler_count * 5)); // Penalize 5 points per filler
          const pacingScore = (wpm > 120 && wpm < 160) ? 100 : 80; // Simple logic
          const sentimentLabel = results.sentiment_score > 0 ? "Positive" : "Neutral";
          const postureScore = Math.round(results.posture_score * 100);
          
          const overallScore = Math.round((clarityScore + pacingScore + postureScore) / 3);

          const feedbackData = {
            recording_id: recording_id,
            overall_score: overallScore,
            // strengths and areas_for_improvement moved to specific_feedback JSON
            specific_feedback: {
              strengths: ["Good effort"], // Placeholder
              areas_for_improvement: ["Practice more"], // Placeholder
              clarity: {
                score: clarityScore,
                wpm: wpm,
                filler_word_count: results.filler_count,
                filler_words_detected: [] 
              },
              pacing: {
                score: pacingScore,
                feedback: wpm < 120 ? "Try to speak a bit faster." : (wpm > 160 ? "Slow down a bit." : "Perfect pace.")
              },
              sentiment: {
                score: sentimentLabel,
                confidence_level: "Medium"
              },
              posture: {
                score: postureScore,
                issues_detected: []
              },
              transcript: results.transcript
            }
          };

          // Insert into Supabase 'feedback' table
          const { error: insertError } = await supabase
            .from('feedback')
            .insert([feedbackData]);

          if (insertError) {
            console.error('Supabase insert error:', insertError);
            throw new Error(`Supabase insert failed: ${insertError.message}`);
          }
          
          // Update recording status to completed
          await supabase.from('recordings').update({ status: 'completed' }).eq('id', recording_id);

          console.log('Results saved to Supabase');
          res.json({ status: 'success', message: 'Processing complete', data: feedbackData });
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

// ==========================================
// SCRIPT GENERATION LOGIC (Local Templates)
// ==========================================

const generateTemplates = (profileData) => {
  // 1. DATA MAPPING (Frontend -> Script Variables)
  const name = profileData.full_name?.split(' ')[0] || "Friend";
  
  // Map Experience Level -> Role
  // Handle both capitalized (old data) and lowercase (new onboarding) values
  const roleMap = {
    "Beginner": "Learner",
    "beginner": "Learner",
    "Intermediate": "Professional",
    "intermediate": "Professional",
    "Advanced": "Leader",
    "advanced": "Leader"
  };
  // Fallback to "Communicator" if undefined
  const role = roleMap[profileData.experience_level] || "Communicator";

  // Map Primary Goal -> Focus Area
  const focusMap = {
    "clarity": "Articulation",
    "decisions": "Decisiveness",
    "growth": "Confidence"
  };
  // Fallback to "Communication" if undefined
  const focus = focusMap[profileData.primary_goal] || "Communication";

  // 2. THE TEMPLATES

  // --- SHORT SCRIPT (3 Minutes) ---
  const short = `Hi, my name is ${name}, and this is my daily check-in.

Today, I am dedicating these few minutes to my personal growth as a ${role}. I know that to be effective in my field, I need to master ${focus}. It is not just about the words I say, but how I say them.

Right now, I am checking in with my body and my voice. Am I slouching? Am I speaking too fast? I am taking this moment to slow down. I breathe in... and I breathe out.

My goal for today is simple: To be 1% better at ${focus} than I was yesterday. I know I will face distractions. I know there will be moments of stress. But in those moments, I will remember this feeling of calm. I will remember that I have the capacity to handle whatever comes my way.

I am not chasing perfection; I am chasing consistency. By recording this video, I am proving to myself that I show up. I am building the discipline required to be a great ${role}.

I am ready for the day. I am clear, I am focused, and I am capable.`;

  // --- MEDIUM SCRIPT (5 Minutes) ---
  const medium = `Hello, I am ${name}. Welcome to my 5-minute practice session.

Today I want to talk about the concept of 'Capacity.' As a ${role}, I often feel the pressure to know everything, to be everywhere, and to solve every problem instantly. But when I reflect on my journey to improve my ${focus}, I realize that real strength isn't about speed. It is about capacity.

What does it mean to have capacity? It means having the emotional stability to pause before I react. It means having the mental clarity to listen before I speak.

I admit, sometimes I struggle with ${focus}. There are times when I doubt my voice or my decisions. But I also know that these struggles are not signs of weakness—they are the growing pains of becoming a better version of myself.

Think about the challenges I faced this week. There were moments of friction. Maybe I didn't speak up when I should have. Maybe I spoke too quickly. That is okay. That is data. Today, I am rewriting that narrative.

I am choosing to view ${focus} not as a hurdle, but as a skill I am actively building, brick by brick. Every time I record one of these videos, I am laying another brick.

I commit to being a ${role} who leads with empathy and clarity. I commit to listening more deeply. I commit to speaking with intention.

If I stumble today, I will not judge myself. I will simply correct course and keep moving. This is a marathon, not a sprint. And I am in this for the long run.`;

  // --- LONG SCRIPT (10 Minutes) ---
  const long = `This is a message to my future self. My name is ${name}, and I am recording this to document who I am today, and who I am becoming.

I am currently navigating my path as a ${role}. It is a journey filled with highs and lows. Today, my primary focus is on ${focus}. I chose this because I know it is the key to unlocking the next level of my potential.

Let’s talk about why this matters. In a world that is constantly noisy, the ability to communicate with ${focus} is a superpower. It is the difference between being heard and being ignored. It is the difference between having an idea and leading a movement.

I want to reflect on my standards. What creates a great ${role}? Is it just technical skill? No. It is the ability to connect. It is the ability to transfer an emotion or an idea from my mind to someone else’s without distortion. That is why I am here, looking at this camera, practicing this skill.

I admit that sometimes the journey feels slow. Sometimes I look at others and feel like I am falling behind. I see people who seem to have natural charisma, or who speak without ever stumbling. But I remind myself that comparison is the thief of joy. I do not know their story; I only know mine.

And my story is one of persistence. It is the story of someone who chooses to do the hard work when no one is watching. The person I was a year ago might have given up. But the person I am today stays in the room.

I want to visualize where I will be one year from now. If I stick to this practice—if I keep showing up every day to work on my ${focus}—I will be unrecognizable. I will walk into rooms with a different energy. I will speak with a different weight. I will be the kind of ${role} that others look to for guidance, not because I am the loudest, but because I am the most grounded.

To the ${name} of the future: I hope you never lost this hunger. I hope you remembered that confidence is earned, not given. I hope you are using your ${focus} to help others, to lift them up, and to solve problems that matter.

I promise to keep working today, so that you can succeed tomorrow. I am signing off now, with a renewed sense of purpose.`;

  return { 
    variations: { short, medium, long } 
  };
};

// --- API ENDPOINT ---
app.post('/generate-script', (req, res) => {
  try {
    const { profileData } = req.body;
    
    // Validate Input
    if (!profileData) {
      return res.status(400).json({ error: "Missing profileData" });
    }

    const scripts = generateTemplates(profileData);
    res.json(scripts);

  } catch (error) {
    console.error("Script Generation Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Local processor listening at http://localhost:${port}`);
});
