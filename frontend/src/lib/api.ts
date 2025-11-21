import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getAuthHeader() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No active session");
    return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
    };
}

export const api = {
    onboard: async (data: any) => {
        const headers = await getAuthHeader();
        const response = await fetch(`${supabaseUrl}/functions/v1/onboard`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Onboarding failed');
        return response.json();
    },

    getProfile: async (userId?: string) => {
        const headers = await getAuthHeader();
        const url = new URL(`${supabaseUrl}/functions/v1/onboard`);
        if (userId) url.searchParams.append('userId', userId);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers,
        });
        if (!response.ok) throw new Error('Failed to fetch profile');
        return response.json();
    },

    generatePrompt: async () => {
        const headers = await getAuthHeader();
        const response = await fetch(`${supabaseUrl}/functions/v1/generate-prompt`, {
            method: 'GET',
            headers,
        });
        if (!response.ok) throw new Error('Failed to generate prompt');
        return response.json();
    },

    prepareRecording: async (file: File, title?: string) => {
        const headers = await getAuthHeader();
        const response = await fetch(`${supabaseUrl}/functions/v1/record-prepare`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                filename: file.name,
                fileType: file.type,
                fileSize: file.size,
                title,
            }),
        });
        if (!response.ok) throw new Error('Failed to prepare recording');
        return response.json();
    },

    completeRecording: async (recordingId: string) => {
        const headers = await getAuthHeader();
        const response = await fetch(`${supabaseUrl}/functions/v1/record-complete`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ recordingId }),
        });
        if (!response.ok) throw new Error('Failed to complete recording');
        return response.json();
    },

    uploadVideo: async (uploadUrl: string, file: File) => {
        const response = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type,
            },
        });
        if (!response.ok) throw new Error('Upload failed');
        return response;
    }
};
