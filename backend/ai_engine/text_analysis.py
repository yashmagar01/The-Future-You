"""
Semantic Coherence Engine for The Future You v1.7.0
Measures logical flow between sentences using sentence embeddings.

Model: all-MiniLM-L6-v2 (Lightweight BERT via SentenceTransformers)
"""

import sys
import json
import re
import logging
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Lazy load the model to avoid import-time overhead
_model = None

def get_model():
    """Lazy load the SentenceTransformer model."""
    global _model
    if _model is None:
        logging.info("Loading SentenceTransformer model (all-MiniLM-L6-v2)...")
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer('all-MiniLM-L6-v2')
        logging.info("Model loaded successfully.")
    return _model


def cosine_similarity(vec1, vec2):
    """Calculate cosine similarity between two vectors."""
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot_product / (norm1 * norm2)


def calculate_coherence(transcript: str) -> dict:
    """
    Calculate semantic coherence of a transcript.
    
    Process:
    1. Split transcript into sentences
    2. Generate embedding vector for each sentence
    3. Calculate cosine similarity between adjacent sentences
    4. Return flow score (average similarity)
    
    Args:
        transcript: The full text transcript to analyze
        
    Returns:
        dict with:
        - flow_score: Average similarity between adjacent sentences (0-1)
        - coherence_timeline: List of individual similarity scores
        - sentence_count: Number of sentences analyzed
    """
    try:
        if not transcript or not transcript.strip():
            return {
                "flow_score": 0.0,
                "coherence_timeline": [],
                "sentence_count": 0,
                "note": "Empty transcript"
            }
        
        # Split into sentences using regex
        # Match sentence-ending punctuation followed by whitespace
        sentences = re.split(r'(?<=[.!?])\s+', transcript.strip())
        
        # Filter out very short "sentences" (likely noise)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 5]
        
        if len(sentences) < 2:
            return {
                "flow_score": 1.0,  # Single sentence = perfectly coherent
                "coherence_timeline": [],
                "sentence_count": len(sentences),
                "note": "Not enough sentences for coherence analysis"
            }
        
        # Load model and generate embeddings
        model = get_model()
        embeddings = model.encode(sentences)
        
        # Calculate adjacent similarities
        similarities = []
        for i in range(len(embeddings) - 1):
            sim = cosine_similarity(embeddings[i], embeddings[i + 1])
            similarities.append(float(sim))
        
        # Flow Score = Average of all adjacent similarities
        flow_score = sum(similarities) / len(similarities) if similarities else 0.0
        
        return {
            "flow_score": round(flow_score, 4),
            "coherence_timeline": [round(s, 4) for s in similarities],
            "sentence_count": len(sentences)
        }
        
    except Exception as e:
        logging.error(f"Error in coherence analysis: {str(e)}")
        return {
            "flow_score": 0.0,
            "coherence_timeline": [],
            "sentence_count": 0,
            "error": str(e)
        }


if __name__ == "__main__":
    # CLI mode for testing
    if len(sys.argv) > 1:
        # Join all arguments as the transcript
        test_transcript = " ".join(sys.argv[1:])
    else:
        # Default test case
        test_transcript = """
        Today I want to talk about my goals. I have been working hard on improving my communication skills.
        Speaking clearly is important for my career. I sometimes struggle with confidence during presentations.
        By practicing regularly, I know I can get better. This journey is about progress, not perfection.
        """
    
    result = calculate_coherence(test_transcript)
    print(json.dumps(result, indent=2))
