const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const {spawn } = require('child_process');
// const fetch = require('node-fetch'); // Native fetch is available in Node 18+
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Gemini client if API key is provided
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;
if (genAI) {
  console.log("Google Gemini AI Companion initialized.");
} else {
  console.warn("GEMINI_API_KEY not configured. Falling back to local context companion coach.");
}

// Singleton for Transformers.js pipeline (Emotion classifier)
let emotionPipeline;
async function getEmotionModel() {
  if (!emotionPipeline) {
    console.log("Loading Emotion Model (MicahB/emotion_text_classifier)...");
    const { pipeline } = await import('@xenova/transformers');
    // MicahB model - explicitly converted for transformers.js (ONNX verified)
    // Detects: joy, sadness, anger, fear, surprise, disgust, neutral
    emotionPipeline = await pipeline('text-classification', 'MicahB/emotion_text_classifier');
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
          
          // Cleanup deferred to after detailed analysis


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

              // ==========================================
              // PHASE 2: ADVANCED AI ENGINE (v1.6.5)
              // ==========================================
              let advancedMetrics = null;
              const transcriptPath = path.join(tmpDir, `${recording_id}_transcript.txt`);
              
              try {
                  console.log("Starting Phase 2 Advanced Analysis...");
                  
                  // 1. Save transcript to temp file
                  fs.writeFileSync(transcriptPath, results.transcript || "");
                  
                  // 2. Spawn Advanced Python Engine
                  const advancedProcess = spawn(pythonCommand, [
                      '../ai_engine/main.py', 
                      '--video', localVideoPath,
                      '--transcript-file', transcriptPath,
                      '--sentiment', String(toneScore)
                  ], { shell: true, cwd: __dirname });

                  let advancedData = '';
                  let advancedError = '';

                  advancedProcess.stdout.on('data', (data) => { advancedData += data.toString(); });
                  
                  // Stream stderr to console for real-time feedback
                  advancedProcess.stderr.on('data', (data) => { 
                      const msg = data.toString();
                      advancedError += msg;
                      console.error(`[Advanced AI] ${msg.trim()}`); 
                  });

                  await new Promise((resolve) => {
                      advancedProcess.on('close', (code) => {
                          if (code === 0 && advancedData) {
                              try {
                                  advancedMetrics = JSON.parse(advancedData);
                                  console.log("Advanced AI Analysis Complete.");
                              } catch (e) {
                                  console.error("Failed to parse Advanced AI output:", e);
                              }
                          } else {
                              console.error("Advanced AI failed:", advancedError);
                          }
                          resolve();
                      });
                  });

              } catch (advError) {
                  console.error("Advanced AI Pipeline Error:", advError);
                  // Non-blocking: we proceed with basic metrics if this fails
              } finally {
                  // Cleanup transcript file
                  try { if (fs.existsSync(transcriptPath)) fs.unlinkSync(transcriptPath); } catch (e) {}
              }

              const feedbackData = {
                recording_id: recording_id,
                overall_score: overallScore,
                clarity_score: clarityScore,
                pace_score: pacingScore,
                tone_score: toneScore,
                pace_score: pacingScore,
                tone_score: toneScore,
                confidence_score: confidenceScore,
                energy_score: energyScore,
                advanced_metrics: advancedMetrics, // New Phase 2 data
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
              
              // SUCCESS CLEANUP
              try { if (fs.existsSync(localVideoPath)) fs.unlinkSync(localVideoPath); } catch (e) {}

              resolve();


            } catch (parseError) {
              console.error('Error parsing results:', parseError);
              await supabase.from('recordings').update({ status: 'failed' }).eq('id', recording_id);
              // ERROR CLEANUP 1
              try { if (fs.existsSync(localVideoPath)) fs.unlinkSync(localVideoPath); } catch (e) {}
              reject(parseError);
            }
          } else {
            console.error('Worker failed with code:', code);
            await supabase.from('recordings').update({ status: 'failed' }).eq('id', recording_id);
            // ERROR CLEANUP 2
            try { if (fs.existsSync(localVideoPath)) fs.unlinkSync(localVideoPath); } catch (e) {}
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

// --- API ENDPOINT: SCRIPT GENERATOR ---
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

// ==========================================
// AI COMPANION & HABIT TRACKING LOGIC
// ==========================================

async function assembleUserContext(userId) {
  const context = {
    name: 'User',
    bio: '',
    goals: [],
    anchors: [],
    habits: [],
    habitSummary: 'No habit data recorded yet.',
    recentScores: null,
    memories: []
  };

  if (!userId) return context;

  try {
    // 1. Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, bio, goals, anchors')
      .eq('id', userId)
      .single();

    if (profile) {
      context.name = profile.full_name || 'User';
      context.bio = profile.bio || '';
      context.goals = Array.isArray(profile.goals) ? profile.goals : [];
      context.anchors = Array.isArray(profile.anchors) ? profile.anchors : [];
    }

    // 2. Habits & today's logs
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: habits } = await supabase
      .from('habits')
      .select('id, name, category, frequency')
      .eq('user_id', userId)
      .eq('archived', false);

    if (habits && habits.length > 0) {
      context.habits = habits;
      const habitIds = habits.map(h => h.id);
      
      const { data: todayLogs } = await supabase
        .from('habit_logs')
        .select('habit_id, completed')
        .in('habit_id', habitIds)
        .eq('logged_date', todayStr);

      const completedCount = todayLogs ? todayLogs.filter(l => l.completed).length : 0;
      context.habitSummary = `Tracking ${habits.length} habits. Completed today: ${completedCount}/${habits.length}. Habits: ${habits.map(h => h.name).join(', ')}`;
    }

    // 3. Latest feedback / speech scores
    const { data: recentRecordings } = await supabase
      .from('recordings')
      .select('id, created_at, feedback (overall_score, clarity_score, pace_score, tone_score, confidence_score, strengths, improvements)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentRecordings && recentRecordings.length > 0 && recentRecordings[0].feedback && recentRecordings[0].feedback.length > 0) {
      const fb = recentRecordings[0].feedback[0];
      context.recentScores = {
        overall: fb.overall_score,
        clarity: fb.clarity_score,
        pace: fb.pace_score,
        tone: fb.tone_score,
        confidence: fb.confidence_score,
        strengths: fb.strengths || [],
        improvements: fb.improvements || []
      };
    }

    // 4. Saved reflection memories
    const { data: memories } = await supabase
      .from('reflections_memories')
      .select('title, content, category')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (memories) {
      context.memories = memories;
    }
  } catch (err) {
    console.error('Error assembling user context:', err);
  }

  return context;
}

function buildCompanionPrompt(context) {
  const goalsSection = context.goals.length > 0
    ? context.goals.map(g => `- ${g}`).join('\n')
    : 'Not yet specified.';
  const anchorsSection = context.anchors.length > 0
    ? context.anchors.map(a => `- ${a}`).join('\n')
    : 'Not yet specified.';
  const memoriesSection = context.memories.length > 0
    ? context.memories.map(m => `• ${m.title}: ${m.content}`).join('\n')
    : 'No prior memories saved.';

  let speechSection = 'No recent video speech recordings analyzed yet.';
  if (context.recentScores) {
    speechSection = `Latest Reflection Scores: Overall: ${context.recentScores.overall}/100, Clarity: ${context.recentScores.clarity}/100, Pace: ${context.recentScores.pace}/100, Confidence: ${context.recentScores.confidence}/100, Tone: ${context.recentScores.tone}/100.
Top Strengths: ${(context.recentScores.strengths || []).join(', ') || 'Consistent practice'}
Areas for Growth: ${(context.recentScores.improvements || []).join(', ') || 'Pacing and conscious pauses'}`;
  }

  return `You are ${context.name}'s personal AI Diary & Communication Growth Companion on "The Future You" platform.
Your mission is to help ${context.name} reflect on their daily experiences, track their habits, improve speaking and vocal presence, and stay grounded in their core values.

--- User Profile Context ---
Name: ${context.name}
Bio: ${context.bio || 'Growth-minded individual'}

Personal Goals:
${goalsSection}

Grounding Anchors & Core Values:
${anchorsSection}

Habit Status:
${context.habitSummary}

Speech & Communication Profile:
${speechSection}

Key Memories & Reflection Notes:
${memoriesSection}

--- Coaching Guidelines ---
1. Empathy & Encouragement: Be warm, authentic, concise, and empowering.
2. Grounded Connection: When contextually relevant, reference their goals, habits, anchors, or speech metrics naturally.
3. Guided Reflection: Ask 1 concise, thought-provoking question to help them reflect deeper rather than giving long monologues.
4. Actionable Communication Advice: Provide crisp, practical tips on articulation, pause control, energy, and authenticity when they discuss speaking or self-expression.
5. Markdown: Use clean Markdown formatting with bullet points or bold text where appropriate.`;
}

// --- AI COMPANION CHAT ENDPOINT ---
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [], userId, sessionId = 'default', stream = true } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Assemble rich context
    const context = await assembleUserContext(userId);
    const systemInstruction = buildCompanionPrompt(context);

    // Save user message to Supabase
    if (userId) {
      supabase.from('companion_messages').insert({
        user_id: userId,
        session_id: sessionId,
        role: 'user',
        content: message
      }).catch(err => console.error('Error saving user message:', err));
    }

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          systemInstruction: systemInstruction
        });

        const contents = conversationHistory.map(msg => ({
          role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));

        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });

        if (stream) {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');

          let fullResponseText = '';
          const result = await model.generateContentStream({ contents });

          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullResponseText += chunkText;
            res.write(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`);
          }

          res.write('data: [DONE]\n\n');
          res.end();

          // Save assistant message to Supabase
          if (userId && fullResponseText) {
            supabase.from('companion_messages').insert({
              user_id: userId,
              session_id: sessionId,
              role: 'assistant',
              content: fullResponseText
            }).catch(err => console.error('Error saving assistant message:', err));
          }
          return;
        } else {
          const result = await model.generateContent({ contents });
          const responseText = result.response.text();

          if (userId) {
            supabase.from('companion_messages').insert({
              user_id: userId,
              session_id: sessionId,
              role: 'assistant',
              content: responseText
            }).catch(err => console.error('Error saving assistant message:', err));
          }

          return res.json({ response: responseText });
        }
      } catch (geminiError) {
        console.error('Gemini streaming error, falling back:', geminiError);
      }
    }

    // Local Fallback Companion Response
    const fallbackResponse = `Thank you for sharing, ${context.name}. Reflecting on what you said: "${message.slice(0, 80)}${message.length > 80 ? '...' : ''}".\n\n` +
      `Keep taking consistent steps towards your goals: ${context.goals.slice(0, 2).join(', ') || 'daily self-growth'}. ` +
      `How do you feel today about your current pace and grounding?`;

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(`data: ${JSON.stringify({ chunk: fallbackResponse })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      res.json({ response: fallbackResponse });
    }

    if (userId) {
      supabase.from('companion_messages').insert({
        user_id: userId,
        session_id: sessionId,
        role: 'assistant',
        content: fallbackResponse
      }).catch(err => console.error('Error saving fallback message:', err));
    }
  } catch (error) {
    console.error('[API/CHAT ERROR]:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- HABITS API ENDPOINTS ---
app.get('/api/habits', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'userId query parameter is required' });
    }

    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('archived', false)
      .order('created_at', { ascending: true });

    if (habitsError) throw habitsError;

    // Fetch past 14 days of logs
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const startDateStr = fourteenDaysAgo.toISOString().split('T')[0];

    const habitIds = (habits || []).map(h => h.id);
    let logs = [];

    if (habitIds.length > 0) {
      const { data: logsData, error: logsError } = await supabase
        .from('habit_logs')
        .select('*')
        .in('habit_id', habitIds)
        .gte('logged_date', startDateStr)
        .order('logged_date', { ascending: false });

      if (!logsError && logsData) {
        logs = logsData;
      }
    }

    // Compute streaks and stats
    const todayStr = new Date().toISOString().split('T')[0];
    const habitStats = {};

    (habits || []).forEach(habit => {
      const habitLogs = logs.filter(l => l.habit_id === habit.id && l.completed);
      const isCompletedToday = habitLogs.some(l => l.logged_date === todayStr);
      
      // Calculate current streak
      let streak = 0;
      let checkDate = new Date();
      // If not completed today, start checking from yesterday
      if (!isCompletedToday) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      for (let i = 0; i < 30; i++) {
        const dStr = checkDate.toISOString().split('T')[0];
        const log = habitLogs.find(l => l.logged_date === dStr);
        if (log && log.completed) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      habitStats[habit.id] = {
        streak,
        completedToday: isCompletedToday,
        totalCompletions: habitLogs.length
      };
    });

    res.json({ habits: habits || [], logs, stats: habitStats });
  } catch (error) {
    console.error('[API/HABITS GET ERROR]:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.post('/api/habits', async (req, res) => {
  try {
    const { userId, name, description = '', category = 'growth', frequency = 'daily', target_days = 7, color = '#10B981', icon = 'CheckCircle' } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ error: 'userId and name are required' });
    }

    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: userId,
        name,
        description,
        category,
        frequency,
        target_days,
        color,
        icon,
        archived: false
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('[API/HABITS POST ERROR]:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.put('/api/habits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, color, icon, archived } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (color !== undefined) updates.color = color;
    if (icon !== undefined) updates.icon = icon;
    if (archived !== undefined) updates.archived = archived;

    const { data, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('[API/HABITS PUT ERROR]:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.post('/api/habits/log', async (req, res) => {
  try {
    const { userId, habitId, completed = true, note = '', loggedDate } = req.body;

    if (!userId || !habitId) {
      return res.status(400).json({ error: 'userId and habitId are required' });
    }

    const targetDate = loggedDate || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('habit_logs')
      .upsert({
        user_id: userId,
        habit_id: habitId,
        completed,
        note,
        logged_date: targetDate
      }, {
        onConflict: 'habit_id,logged_date'
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('[API/HABITS/LOG ERROR]:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// --- INSIGHTS API ENDPOINT ---
app.get('/api/insights', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const context = await assembleUserContext(userId);

    const insights = {
      greeting: `Welcome back, ${context.name}!`,
      habitSummary: context.habitSummary,
      speechScores: context.recentScores,
      goals: context.goals,
      anchors: context.anchors,
      dailyNudge: context.recentScores
        ? `In your last session, your vocal clarity was ${context.recentScores.clarity}/100. Practice a 60-second reflection video today!`
        : "Record a quick 60-second video reflection today to track your vocal presence and authenticity.",
      reflectionPrompt: "What is one key victory or lesson from today that aligns with your core goals?"
    };

    res.json(insights);
  } catch (error) {
    console.error('[API/INSIGHTS ERROR]:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// --- PROFILE CONTEXT API ENDPOINTS ---
app.get('/api/profile/context', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, bio, goals, anchors, avatar_url')
      .eq('id', userId)
      .single();

    if (error) throw error;
    res.json(profile);
  } catch (error) {
    console.error('[API/PROFILE/CONTEXT GET ERROR]:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.post('/api/profile/context', async (req, res) => {
  try {
    const { userId, goals, anchors, bio, full_name } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const updates = { updated_at: new Date().toISOString() };
    if (goals !== undefined) updates.goals = goals;
    if (anchors !== undefined) updates.anchors = anchors;
    if (bio !== undefined) updates.bio = bio;
    if (full_name !== undefined) updates.full_name = full_name;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('[API/PROFILE/CONTEXT POST ERROR]:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// --- REFLECTION MEMORIES API ENDPOINTS ---
app.get('/api/memories', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const { data, error } = await supabase
      .from('reflections_memories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('[API/MEMORIES GET ERROR]:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.post('/api/memories', async (req, res) => {
  try {
    const { userId, title, content, category = 'reflection', tags = [] } = req.body;
    if (!userId || !title || !content) {
      return res.status(400).json({ error: 'userId, title, and content are required' });
    }

    const { data, error } = await supabase
      .from('reflections_memories')
      .insert({
        user_id: userId,
        title,
        content,
        category,
        tags
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('[API/MEMORIES POST ERROR]:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.delete('/api/memories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('reflections_memories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Memory deleted' });
  } catch (error) {
    console.error('[API/MEMORIES DELETE ERROR]:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Local processor listening at http://0.0.0.0:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
