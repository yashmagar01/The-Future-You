import requests
import json
import sys

def test_pipeline():
    url = "http://localhost:3001/process"
    payload = {
        "recording_id": "test-uuid-123",
        "video_path": "test/video.mp4" # Needs to be a valid path in Supabase or mocked
    }
    
    print(f"Sending request to {url}...")
    try:
        # This will likely fail if the server isn't running or video doesn't exist, 
        # but it tests connectivity.
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_pipeline()
