// Video Processing Worker - Cloud Version
// Runs on Cloud Run / ECS / K8s
// Stack: FFmpeg + AssemblyAI/Deepgram + MediaPipe

require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

const app = express();
app.use(express.json());

// Configuration
const PORT = process.env.PORT || 8080;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Service role key for admin access
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY; // or DEEPGRAM_API_KEY
const TEMP_DIR = '/tmp/processing';

// Initialize Supabase with service role (bypass RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Ensure temp directory exists
async function initTempDir() {
    await fs.mkdir(TEMP_DIR, { recursive: true });
}

/**
 * Download video from Supabase Storage
 */
async function downloadVideo(storagePath) {
    console.log(`[1/5] Downloading video: ${storagePath}`);

    const { data, error } = await supabase.storage
        .from('recordings')
        .download(storagePath);

    if (error) throw new Error(`Download failed: ${error.message}`);

    const videoPath = path.join(TEMP_DIR, `video-${Date.now()}.webm`);
    const buffer = Buffer.from(await data.arrayBuffer());
    await fs.writeFile(videoPath, buffer);

    console.log(`[1/5] Downloaded ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
    return videoPath;
}

/**
 * Extract audio from video using FFmpeg
 */
async function extractAudio(videoPath) {
    console.log('[2/5] Extracting audio...');
    const audioPath = videoPath.replace('.webm', '.wav');

    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .outputOptions([
                '-acodec pcm_s16le',
                '-ar 16000',
                '-ac 1'
            ])
            .output(audioPath)
            .on('end', () => {
                console.log('[2/5] Audio extracted');
                resolve(audioPath);
            })
            .on('error', reject)
            .run();
    });
}

/**
 * Transcribe audio using AssemblyAI
 * Alternative: Use Deepgram or OpenAI Whisper
 */
async function transcribeAudio(audioPath) {
    console.log('[3/5] Transcribing audio with AssemblyAI...');

    try {
        // Step 1: Upload audio to AssemblyAI
        const audioData = await fs.readFile(audioPath);
        const uploadResponse = await axios.post('https://api.assemblyai.com/v2/upload', audioData, {
            headers: {
                'authorization': ASSEMBLYAI_API_KEY,
                'content-type': 'application/octet-stream'
            }
        });

        const audioUrl = uploadResponse.data.upload_url;

        // Step 2: Request transcription
        const transcriptResponse = await axios.post('https://api.assemblyai.com/v2/transcript', {
            audio_url: audioUrl,
            sentiment_analysis: true,
            content_safety: true
        }, {
            headers: {
                'authorization': ASSEMBLYAI_API_KEY,
                'content-type': 'application/json'
            }
        });

        const transcriptId = transcriptResponse.data.id;

        // Step 3: Poll for completion
        let transcript;
        while (true) {
            const pollingResponse = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                headers: { 'authorization': ASSEMBLYAI_API_KEY }
            });

            transcript = pollingResponse.data;

            if (transcript.status === 'completed') {
                console.log(`[3/5] Transcription complete: ${transcript.text.substring(0, 100)}...`);
                return {
                    text: transcript.text,
                    confidence: transcript.confidence,
                    sentiment: transcript.sentiment_analysis_results
                };
            } else if (transcript.status === 'error') {
                throw new Error(`Transcription failed: ${transcript.error}`);
            }

            // Wait 3 seconds before polling again
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    } catch (error) {
        console.error('[3/5] Transcription error:', error.message);
        return {
            text: '[Transcription failed - check API key and credits]',
            confidence: 0,
            error: error.message
        };
    }
}

/**
 * Analyze body language using MediaPipe (Python script)
 */
async function analyzePosture(videoPath) {
    console.log('[4/5] Analyzing posture with MediaPipe...');

    try {
        // Create Python script for MediaPipe analysis
        const pythonScript = `
import cv2
import mediapipe as mp
import json
import sys

mp_pose = mp.solutions.pose
pose = mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5)

cap = cv2.VideoCapture('${videoPath}')
frame_count = 0
good_posture_count = 0
total_analyzed = 0

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    
    # Analyze every 30th frame (1 fps for 30fps video)
    if frame_count % 30 == 0:
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb_frame)
        
        if results.pose_landmarks:
            total_analyzed += 1
            # Check shoulder alignment (basic posture metric)
            left_shoulder = results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER]
            right_shoulder = results.pose_landmarks.landmark[mp_pose.PoseLandmark.RIGHT_SHOULDER]
            shoulder_diff = abs(left_shoulder.y - right_shoulder.y)
            
            if shoulder_diff < 0.05:  # Good alignment
                good_posture_count += 1
    
    frame_count += 1

cap.release()

posture_score = int((good_posture_count / max(total_analyzed, 1)) * 100)

result = {
    "posture_score": posture_score,
    "frames_analyzed": total_analyzed,
    "good_posture_frames": good_posture_count
}

print(json.dumps(result))
`;

        const scriptPath = path.join(TEMP_DIR, `analyze-${Date.now()}.py`);
        await fs.writeFile(scriptPath, pythonScript);

        const { stdout } = await execPromise(`python3 ${scriptPath}`);
        const result = JSON.parse(stdout.trim());

        console.log(`[4/5] Posture analysis: ${result.posture_score}/100`);

        await fs.unlink(scriptPath).catch(() => { });

        return result;

    } catch (error) {
        console.error('[4/5] Posture analysis error:', error.message);
        return {
            posture_score: 75,
            frames_analyzed: 0,
            error: 'MediaPipe analysis pending'
        };
    }
}

/**
 * Calculate overall scores and feedback
 */
function generateFeedback(transcript, postureAnalysis) {
    const words = transcript.text.split(' ').filter(w => w.length > 0);
    const wordCount = words.length;

    // Calculate clarity score (based on confidence)
    const clarityScore = Math.round((transcript.confidence || 0.8) * 100);

    // Calculate overall score
    const overallScore = Math.round((clarityScore + postureAnalysis.posture_score) / 2);

    const strengths = [];
    const improvements = [];

    if (clarityScore > 85) strengths.push("Clear and articulate speech");
    if (postureAnalysis.posture_score > 80) strengths.push("Excellent posture throughout");
    if (wordCount > 50) strengths.push("Comprehensive reflection");

    if (clarityScore < 70) improvements.push("Practice speaking more clearly");
    if (postureAnalysis.posture_score < 70) improvements.push("Maintain better posture");
    if (wordCount < 30) improvements.push("Provide more detailed reflections");

    return {
        overall_score: overallScore,
        strengths: strengths.length > 0 ? strengths : ["Good effort!"],
        areas_for_improvement: improvements.length > 0 ? improvements : ["Keep practicing"],
        specific_feedback: {
            vocal_delivery: {
                score: clarityScore,
                notes: `Clarity: ${clarityScore}/100, Word count: ${wordCount}`
            },
            body_language: {
                score: postureAnalysis.posture_score,
                notes: `Analyzed ${postureAnalysis.frames_analyzed} frames`
            }
        }
    };
}

/**
 * Main processing function
 */
async function processRecording(recordingId) {
    console.log(`\n[WORKER] Processing recording: ${recordingId}`);
    const startTime = Date.now();

    let videoPath, audioPath;

    try {
        // 1. Fetch recording from database
        const { data: recording, error: fetchError } = await supabase
            .from('recordings')
            .select('*')
            .eq('id', recordingId)
            .single();

        if (fetchError) throw new Error(`Recording not found: ${fetchError.message}`);

        // 2. Download video from storage
        videoPath = await downloadVideo(recording.video_url);

        // 3. Extract audio
        audioPath = await extractAudio(videoPath);

        // 4. Transcribe
        const transcriptData = await transcribeAudio(audioPath);

        // 5. Analyze posture
        const postureData = await analyzePosture(videoPath);

        // 6. Generate feedback
        console.log('[5/5] Generating feedback...');
        const feedback = generateFeedback(transcriptData, postureData);

        // 7. Save transcript to database
        await supabase.from('transcripts').insert({
            recording_id: recordingId,
            content: transcriptData.text,
            confidence: transcriptData.confidence || 0
        });

        // 8. Update recording with analysis
        await supabase.from('recordings').update({
            status: 'completed',
            overall_score: feedback.overall_score,
            strengths: feedback.strengths,
            areas_for_improvement: feedback.areas_for_improvement,
            specific_feedback: feedback.specific_feedback,
            updated_at: new Date().toISOString()
        }).eq('id', recordingId);

        const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[WORKER] ✓ Processing complete in ${processingTime}s`);

        // Cleanup
        if (videoPath) await fs.unlink(videoPath).catch(() => { });
        if (audioPath) await fs.unlink(audioPath).catch(() => { });

        return { success: true, processingTime };

    } catch (error) {
        console.error('[WORKER] Processing error:', error);

        // Update recording status to failed
        await supabase.from('recordings').update({
            status: 'failed',
            updated_at: new Date().toISOString()
        }).eq('id', recordingId);

        // Cleanup
        if (videoPath) await fs.unlink(videoPath).catch(() => { });
        if (audioPath) await fs.unlink(audioPath).catch(() => { });

        throw error;
    }
}

/**
 * Job handler endpoint
 * Called by Edge Function or queuing system (Pub/Sub, SQS, etc.)
 */
app.post('/process', async (req, res) => {
    const { recordingId } = req.body;

    if (!recordingId) {
        return res.status(400).json({ error: 'recordingId is required' });
    }

    try {
        // Process asynchronously (don't wait for completion)
        processRecording(recordingId).catch(err => {
            console.error(`Background processing failed for ${recordingId}:`, err);
        });

        // Respond immediately
        res.json({ status: 'processing', recordingId });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'video-processing-worker' });
});

// Start server
(async () => {
    await initTempDir();
    app.listen(PORT, () => {
        console.log(`\n🚀 Worker listening on port ${PORT}`);
        console.log(`📊 Health: http://localhost:${PORT}/health`);
        console.log(`⚙️  Process: POST http://localhost:${PORT}/process\n`);
    });
})();

module.exports = app;
