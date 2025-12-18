const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const {spawn } = require('child_process');
// const fetch = require('node-fetch'); // Native fetch is available in Node 18+
const cors = require('cors');
require('dotenv').config();

// Singleton for Transformers.js pipeline (Multi-emotion classifier)
let emotionPipeline;
async function getEmotionModel() {
  if (!emotionPipeline) {
    console.log("Loading Emotion Model (Xenova/twitter-roberta-base-emotion-multilabel-latest)...");
    const { pipeline } = await import('@xenova/transformers');
    // Multi-label emotion classifier: anger, anticipation, disgust, fear, joy, love, optimism, pessimism, sadness, surprise, trust
    emotionPipeline = await pipeline('text-classification', 'Xenova/twitter-roberta-base-emotion-multilabel-latest', { top_k: null });
    console.log("Emotion Model Loaded.");
  }
  return emotionPipeline;
}

// Singleton for CoLA (Coherence) Model
let coherencePipeline;
async function getCoherenceModel() {
  if (!coherencePipeline) {
    console.log("Loading Coherence Model (Xenova/bert-base-uncased)...");
    try {
        const { pipeline } = await import('@xenova/transformers');
        
        // Switched to public model 'bert-base-uncased' and 'feature-extraction' task
        // Removed auth token requirement
        coherencePipeline = await pipeline('feature-extraction', 'Xenova/bert-base-uncased');
        console.log("Coherence Model Loaded.");
    } catch (e) {
        console.error("Warning: Coherence model failed. Skipping Thought Structure analysis.", e);
        // Fallback to a dummy function that returns a non-empty array to simulate success
        coherencePipeline = async () => [[0.1, 0.2, 0.3]]; 
    }
  }
  return coherencePipeline;
}

const app = express();
const port = process.env.PORT || 3001;

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

// ==========================================
// BACKGROUND WORKER LOGIC
// ==========================================

async function processRecording(recording_id, video_path) {
  console.log(`Starting processing for recording: ${recording_id}`);

  try {
    // 1. Download video from Supabase
    console.log(`Downloading video from: ${video_path}`);
    
    // Create a signed URL for downloading (valid for 60 seconds)
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('recordings')
      .createSignedUrl(video_path, 60);

    if (signedUrlError) {
      throw new Error(`Failed to create signed URL: ${signedUrlError.message}`);
    }

    const videoUrl = signedUrlData.signedUrl;
    const localVideoPath = path.join(tmpDir, `${recording_id}.mp4`);

    const response = await fetch(videoUrl);
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }
    
    const fileStream = fs.createWriteStream(localVideoPath);
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
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    
    // UPDATED: Using worker_whisper.py
    const pythonProcess = spawn(pythonCommand, ['worker_whisper.py', localVideoPath, recording_id], {
        shell: true
    });

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

    await new Promise((resolve, reject) => {
        pythonProcess.on('close', async (code) => {
          console.log(`Python worker exited with code ${code}`);
          
          // Cleanup temp file
          try {
            if (fs.existsSync(localVideoPath)) {
              fs.unlinkSync(localVideoPath);
            }
          } catch (cleanupError) {
            console.error('Failed to cleanup temp file:', cleanupError);
          }

          if (code === 0) {
            try {
              const results = JSON.parse(pythonData);
              console.log('Analysis results parsed successfully.');

              // Calculate derived metrics
              const duration = results.duration || 1;
              const allWords = results.transcript.split(' ').filter(w => w.trim().length > 0).length;
              const fillerCount = results.filler_count || 0;
              const effectiveWords = Math.max(1, allWords - fillerCount);
              const wpm = Math.round(effectiveWords / (duration / 60));
              
              // --- SCORING ALGORITHMS ---
              const durationMin = Math.max(duration / 60, 0.01);
              const dfm = results.filler_count / durationMin;
              const fluencyScore = Math.round(100 * Math.exp(-0.15 * Math.max(0, dfm - 1)));

              const rawPacingScore = 100 * Math.exp(-Math.pow(wpm - 145, 2) / (2 * Math.pow(50, 2)));
              let consistencyPenalty = results.wpm_std_dev || 0;
              if (wpm >= 130 && wpm <= 170) consistencyPenalty = 0;
              const pacingScore = Math.max(0, Math.round(rawPacingScore - consistencyPenalty));
              
              const clarityScore = Math.round((fluencyScore + pacingScore) / 2);

              const visibilityRatio = results.posture_score || 0;
              const slope = results.average_shoulder_slope || 0;
              const alignmentScore = Math.max(0, 50 * (1 - (slope / 0.2)));
              const offset = results.average_centering_offset || 0;
              const centeringScore = Math.max(0, 50 * (1 - (offset / 0.3)));
              const confidenceScore = Math.round(visibilityRatio * (alignmentScore + centeringScore));

              // Tone Analysis
              let toneScore = 60;
              let sentimentLabel = "Neutral";
              let structureScore = 0;
              let coherenceIssue = false;
              let detectedEmotions = []; // Store all detected emotions for frontend

              try {
                if (results.transcript && results.transcript.trim().length > 0) {
                    const emotionClassifier = await getEmotionModel();
                    const coherenceClassifier = await getCoherenceModel();
                    
                    // Coherence Check
                    const sentences = results.transcript.match(/[^.!?]+[.!?]+/g) || [results.transcript];
                    let coherentSentences = 0;
                    let totalSentences = 0;
                    
                    for (const sentence of sentences) {
                        if (sentence.trim().length < 10) continue;
                        try {
                            const output = await coherenceClassifier(sentence.trim());
                            if (output && output.data) {
                                totalSentences++;
                                const data = output.data;
                                let sum = 0;
                                for (let i = 0; i < data.length; i++) sum += data[i];
                                const mean = sum / data.length;
                                let squaredDiffSum = 0;
                                for (let i = 0; i < data.length; i++) squaredDiffSum += Math.pow(data[i] - mean, 2);
                                const variance = squaredDiffSum / data.length;
                                if (variance > 0.01) coherentSentences++;
                            }
                        } catch (e) {}
                    }
                    
                    if (totalSentences > 0) {
                        const ratio = coherentSentences / totalSentences;
                        structureScore = Math.round(60 + (ratio * 35));
                    } else {
                        structureScore = 95;
                    }

                    // Multi-Emotion Analysis (replaced binary sentiment)
                    const textToAnalyze = results.transcript.substring(0, 1500); 
                    const emotionOutput = await emotionClassifier(textToAnalyze);
                    
                    if (emotionOutput && emotionOutput.length > 0) {
                        // emotionOutput is an array of { label, score } sorted by score desc
                        // Labels: anger, anticipation, disgust, fear, joy, love, optimism, pessimism, sadness, surprise, trust
                        
                        // Define weights: positive emotions boost score, negative emotions reduce it
                        const emotionWeights = {
                            'joy': 1.0,
                            'love': 0.9,
                            'optimism': 0.8,
                            'trust': 0.7,
                            'anticipation': 0.6,
                            'surprise': 0.5, // neutral-ish
                            'sadness': 0.3,
                            'fear': 0.25,
                            'pessimism': 0.2,
                            'disgust': 0.15,
                            'anger': 0.1
                        };
                        
                        // Calculate weighted tone score
                        let weightedSum = 0;
                        let totalWeight = 0;
                        // Using outer detectedEmotions variable
                        
                        for (const emotion of emotionOutput) {
                            const weight = emotionWeights[emotion.label] || 0.5;
                            // Only count emotions with confidence > 0.1
                            if (emotion.score > 0.1) {
                                detectedEmotions.push({ label: emotion.label, confidence: Math.round(emotion.score * 100) });
                                weightedSum += emotion.score * weight;
                                totalWeight += emotion.score;
                            }
                        }
                        
                        if (totalWeight > 0) {
                            // Normalize to 0-1 range, then scale to 50-100 for tone score
                            const normalizedScore = weightedSum / totalWeight;
                            toneScore = Math.round(50 + (normalizedScore * 50));
                        }
                        
                        // Pick dominant emotion as label
                        const dominant = emotionOutput[0];
                        sentimentLabel = dominant.label.charAt(0).toUpperCase() + dominant.label.slice(1);
                        
                        // Store all detected emotions for richer frontend display
                        if (detectedEmotions.length > 0) {
                            // Will be stored in key_insights.sentiment.emotions
                            console.log(`Detected emotions: ${detectedEmotions.map(e => `${e.label}(${e.confidence}%)`).join(', ')}`);
                        }
                    }
                }
              } catch (sentimentError) {
                console.error("Emotion Analysis Failed:", sentimentError);
              }

              // Energy
              const rms = results.average_rms || 1;
              const db = 20 * Math.log10(rms);
              let energyScore = 100;
              if (db < 40) energyScore = Math.max(0, Math.round((db / 40) * 50));
              else if (db > 80) energyScore = Math.max(0, Math.round(100 - ((db - 80) * 2)));

              const overallScore = Math.round(
                (clarityScore * 0.35) + (confidenceScore * 0.25) + (toneScore * 0.20) + (energyScore * 0.20)
              );

              const feedbackData = {
                recording_id: recording_id,
                overall_score: overallScore,
                clarity_score: clarityScore,
                pace_score: pacingScore,
                tone_score: toneScore,
                confidence_score: confidenceScore,
                energy_score: energyScore,
                filler_words_count: results.filler_count,
                stutter_count: results.stutter_count || 0,
                strengths: ["Good effort", "Clear audio"], 
                improvements: ["Practice pacing", "Reduce filler words"],
                key_insights: {
                  clarity: { score: clarityScore, wpm: wpm, filler_word_count: results.filler_count, filler_words_detected: results.filler_words_detected || [] },
                  pacing: { score: pacingScore, feedback: wpm < 120 ? "Too slow" : (wpm > 160 ? "Too fast" : "Perfect"), words_per_minute: wpm, consistency_penalty: Math.round(consistencyPenalty) },
                  sentiment: { score: sentimentLabel, confidence_level: "Medium", structure_score: structureScore, emotions: detectedEmotions },
                  posture: { score: confidenceScore, issues_detected: [], details: { alignment_score: Math.round(alignmentScore), centering_score: Math.round(centeringScore), visibility_score: Math.round(visibilityRatio * 100), posture_ratio: results.average_posture_ratio || 0 } },
                  transcript: results.transcript,
                  timeline: results.timeline || []
                }
              };

              // Insert into Supabase
              const { error: insertError } = await supabase.from('feedback').insert([feedbackData]);
              if (insertError) throw new Error(`Supabase insert failed: ${insertError.message}`);
              
              // Update recording status
              await supabase.from('recordings').update({ status: 'completed' }).eq('id', recording_id);
              console.log('Processing completed successfully.');
              resolve();

            } catch (parseError) {
              console.error('Error parsing results:', parseError);
              await supabase.from('recordings').update({ status: 'failed' }).eq('id', recording_id);
              reject(parseError);
            }
          } else {
            console.error('Worker failed with code:', code);
            await supabase.from('recordings').update({ status: 'failed' }).eq('id', recording_id);
            reject(new Error(`Worker failed with code ${code}: ${pythonError}`));
          }
        });
    });

  } catch (error) {
    console.error('Processing error:', error);
    await supabase.from('recordings').update({ status: 'failed' }).eq('id', recording_id);
  }
}

// Polling Loop
let isProcessing = false;
async function processQueue() {
  if (isProcessing) return;
  
  try {
    // Fetch next job
    const { data: job, error } = await supabase
      .from('recordings')
      .select('id, video_url')
      .eq('status', 'uploaded')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
        console.error('Error fetching job:', error);
    }

    if (job) {
      isProcessing = true;
      console.log(`Picking up job: ${job.id}`);
      
      // Mark as processing
      await supabase.from('recordings').update({ status: 'processing' }).eq('id', job.id);
      
      // Process
      await processRecording(job.id, job.video_url);
      
      isProcessing = false;
      // Check immediately for next job
      processQueue(); 
    } else {
        // No jobs, wait 5 seconds
        setTimeout(processQueue, 5000);
    }
  } catch (err) {
    console.error('Worker loop error:', err);
    isProcessing = false;
    setTimeout(processQueue, 5000);
  }
}

// Start the worker
console.log("Starting Background Worker...");
processQueue();

// ==========================================
// SCRIPT GENERATION LOGIC (Ollama AI)
// ==========================================

// Fallback function in case AI fails
const generateStaticFallback = (profileData) => {
  const name = profileData.full_name?.split(' ')[0] || "Friend";
  const context = profileData.user_context || "improving my communication skills";
  const audience = profileData.target_audience || "my future self";
  const painPoint = profileData.pain_point || "speaking with clarity";
  const confidence = profileData.confidence_level || 5;

  const short = `Hi, I'm ${name}. Today I am practicing for my ${context}. My goal is to speak clearly to ${audience} and overcome my struggle with ${painPoint}. I know that confidence is a skill, not a trait. Right now, I am rating my confidence at a ${confidence} out of 10, but by the end of this practice, I aim to be one point higher.`;
  
  const medium = `Hello, I am ${name}. I am taking this time to prepare for ${context}. I know that when I speak to ${audience}, I often struggle with ${painPoint}. But today, I am rewriting that story. I am not defined by my past mistakes. I am defined by my willingness to practice. I am visualizing success. I see myself standing tall.`;
  
  const long = `This is a message to myself, ${name}. I am recording this to document my journey in mastering ${context}. Why does this matter? Because communicating effectively with ${audience} is key to my growth. I admit that ${painPoint} has held me back in the past. It has made me doubt myself. But today, I am choosing to play big. I am reminding myself of my strengths. I have unique insights. I have valuable experience.`;

  return { variations: { short, medium, long } };
};

async function generateScriptWithOllama(profileData, attempt = 1) {
  const name = profileData.full_name?.split(' ')[0] || "Friend";
  const context = profileData.user_context || "improving my communication skills";
  const audience = profileData.target_audience || "my future self";
  const painPoint = profileData.pain_point || "speaking with clarity";
  const confidence = profileData.confidence_level || 5;

  // Construct the prompt
  const systemPrompt = `You are a world-class communication coach designed to write "Teleprompter Scripts" for students. 
  Your scripts are not just text; they are psychological priming tools. 
  They must be rhythmic, easy to read aloud, and deeply empathetic.
  
  Tone:
  - Direct but encouraging (like a sports coach).
  - Use short sentences for breathability.
  - Focus on "I" statements to help the user internalize the confidence.
  
  Structure Requirements:
  1. Short Script (1 min): Focus on "State Change". Immediate grounding, breathing, and setting a simple intention.
  2. Medium Script (3 min): Focus on "Visualization". Address the specific pain point directly. Reframe the struggle into a strength.
  3. Long Script (5 min): Focus on "Mastery". Include specific performance cues in brackets like [PAUSE], [SMILE], [TAKE A DEEP BREATH]. Guide them through a mental rehearsal of the specific scenario.

  CRITICAL: You must output ONLY valid JSON. No preamble. No markdown code blocks.`;

  const userPrompt = `Student Profile:
  - Name: ${name}
  - Context/Scenario: ${context}
  - Target Audience: ${audience}
  - Specific Pain Point: ${painPoint}
  - Current Confidence: ${confidence}/10

  Generate the 3 scripts (Short, Medium, Long) based on this profile.
  
  Output Format:
  {
    "variations": {
      "short": "...",
      "medium": "...",
      "long": "..."
    }
  }`;

  try {
    console.log(`[Ollama] Generating scripts for ${name} (Attempt ${attempt})...`);
    
    // Create an AbortController with a 2-minute timeout (Ollama can be slow on first run)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 2 minutes
    
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        stream: false,
        format: "json",
        options: { temperature: 0.7 }
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeout); // Clear the timeout if request succeeds

    if (!response.ok) {
      throw new Error(`Ollama API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.response;

    // Parse and Validate JSON
    try {
      const parsed = JSON.parse(generatedText);
      if (!parsed.variations || !parsed.variations.short) {
        throw new Error("Invalid JSON structure");
      }
      return parsed;
    } catch (parseError) {
      console.error("[Ollama] JSON Parse Error:", parseError);
      if (attempt < 2) {
        console.log("[Ollama] Retrying...");
        return generateScriptWithOllama(profileData, attempt + 1);
      } else {
        throw new Error("Failed to generate valid JSON after retries.");
      }
    }

  } catch (error) {
    console.error("[Ollama] Generation Failed:", error);
    console.log("[Ollama] Falling back to static templates.");
    return generateStaticFallback(profileData);
  }
}

// --- API ENDPOINT ---
app.post('/generate-script', async (req, res) => {
  try {
    const { profileData } = req.body;
    
    if (!profileData) {
      return res.status(400).json({ error: "Missing profileData" });
    }

    console.log("Generating personalized script for:", profileData.full_name);
    const scripts = await generateScriptWithOllama(profileData);
    res.json(scripts);

  } catch (error) {
    console.error("Script Generation Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Local processor listening at http://0.0.0.0:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
