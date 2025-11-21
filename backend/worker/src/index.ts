import { createClient } from '@supabase/supabase-js';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import fetch from 'node-fetch';
import 'dotenv/config';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TRANSCRIPTION_API_KEY = process.env.TRANSCRIPTION_API_KEY || 'mock-key';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing Supabase configuration");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Mock Transcription Service (Replace with AssemblyAI/Deepgram/Whisper)
async function transcribeAudio(audioPath: string): Promise<string> {
    console.log(`Transcribing ${audioPath}...`);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    return "This is a simulated transcript of the reflection. The user spoke about their goals and progress.";
}

async function processRecording(recordingId: string) {
    console.log(`Processing recording: ${recordingId}`);
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    try {
        // 1. Fetch recording details
        const { data: recording, error: fetchError } = await supabase
            .from('recordings')
            .select('*')
            .eq('id', recordingId)
            .single();

        if (fetchError || !recording) throw new Error(`Recording not found: ${fetchError?.message}`);

        // 2. Download video
        const videoPath = path.join(tempDir, `${recordingId}.webm`);
        const audioPath = path.join(tempDir, `${recordingId}.mp3`);

        console.log(`Downloading ${recording.video_url}...`);
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('recordings')
            .download(recording.video_url);

        if (downloadError) throw downloadError;

        await fs.promises.writeFile(videoPath, Buffer.from(await fileData.arrayBuffer()));

        // 3. Extract Audio with FFmpeg
        console.log("Extracting audio...");
        await new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .toFormat('mp3')
                .on('end', resolve)
                .on('error', reject)
                .save(audioPath);
        });

        // 4. Transcribe
        const transcriptText = await transcribeAudio(audioPath);

        // 5. Save Transcript
        const { error: transcriptError } = await supabase
            .from('transcripts')
            .insert({
                recording_id: recordingId,
                content: transcriptText,
                confidence: 0.95
            });

        if (transcriptError) throw transcriptError;

        // 6. Update Recording Status
        await supabase
            .from('recordings')
            .update({ status: 'completed' })
            .eq('id', recordingId);

        console.log(`Successfully processed ${recordingId}`);

        // Cleanup
        fs.unlinkSync(videoPath);
        fs.unlinkSync(audioPath);

    } catch (error) {
        console.error(`Failed to process ${recordingId}:`, error);
        await supabase
            .from('recordings')
            .update({ status: 'failed' })
            .eq('id', recordingId);
    }
}

// Polling Loop (Simulating Worker Consumption)
async function startWorker() {
    console.log("Worker started. Polling for pending recordings...");

    while (true) {
        try {
            // Fetch pending recordings
            // In a real SQS setup, this would be: const message = await sqs.receiveMessage();
            const { data: pendingRecordings, error } = await supabase
                .from('recordings')
                .select('id')
                .eq('status', 'pending')
                .limit(1);

            if (error) {
                console.error("Polling error:", error);
            } else if (pendingRecordings && pendingRecordings.length > 0) {
                const recording = pendingRecordings[0];
                // Mark as processing immediately to avoid double-processing (naive lock)
                await supabase.from('recordings').update({ status: 'processing' }).eq('id', recording.id);

                await processRecording(recording.id);
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (e) {
            console.error("Worker loop error:", e);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

startWorker();
