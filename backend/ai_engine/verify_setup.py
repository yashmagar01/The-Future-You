import sys
import logging
import importlib

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

REQUIRED_PACKAGES = [
    "numpy",
    "pandas",
    "librosa",
    "parselmouth",
    "mediapipe",
    "sentence_transformers",
    "spacy",
    "cv2"
]

def check_imports():
    logging.info("Checking dependencies...")
    all_passed = True
    for package in REQUIRED_PACKAGES:
        try:
            importlib.import_module(package)
            logging.info(f"✅ {package} imported successfully")
        except ImportError as e:
            logging.error(f"❌ Failed to import {package}: {str(e)}")
            all_passed = False
    
    if all_passed:
        logging.info("All dependencies installed correctly.")
    else:
        logging.error("Some dependencies are missing or broken.")
    return all_passed

def check_spacy_model():
    logging.info("Checking Spacy model 'en_core_web_sm'...")
    try:
        import spacy
        nlp = spacy.load("en_core_web_sm")
        logging.info("✅ Spacy model 'en_core_web_sm' loaded successfully")
        return True
    except Exception as e:
        logging.error(f"❌ Failed to load Spacy model: {str(e)}")
        return False

if __name__ == "__main__":
    logging.info("Starting verification...")
    imports_ok = check_imports()
    model_ok = check_spacy_model()
    
    if imports_ok and model_ok:
        logging.info("Verification PASSED: Environment is ready.")
        sys.exit(0)
    else:
        logging.error("Verification FAILED: Please check logs.")
        sys.exit(1)
