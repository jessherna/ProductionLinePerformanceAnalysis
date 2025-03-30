import sys
import os
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

# Print current directory and Python path
logger.info(f"Current directory: {os.getcwd()}")
logger.info(f"Python path: {sys.path}")

# Add analysis module to path
CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent.parent.parent
ANALYSIS_DIR = ROOT_DIR / "analysis"
ANALYSIS_SRC_DIR = ANALYSIS_DIR / "src"

logger.info(f"CURRENT_DIR: {CURRENT_DIR}")
logger.info(f"ROOT_DIR: {ROOT_DIR}")
logger.info(f"ANALYSIS_DIR: {ANALYSIS_DIR}")
logger.info(f"ANALYSIS_SRC_DIR: {ANALYSIS_SRC_DIR}")

# Check if src directory exists
if ANALYSIS_SRC_DIR.exists():
    logger.info(f"Analysis src directory exists: {ANALYSIS_SRC_DIR}")
    
    # List contents of src directory
    logger.info(f"Contents of src directory:")
    for item in ANALYSIS_SRC_DIR.iterdir():
        logger.info(f"  - {item}")
    
    # Check models directory
    models_dir = ANALYSIS_SRC_DIR / "models"
    if models_dir.exists():
        logger.info(f"Models directory exists: {models_dir}")
        for item in models_dir.iterdir():
            logger.info(f"  - {item}")
    else:
        logger.warning(f"Models directory does not exist: {models_dir}")
    
    # Check data directory
    data_dir = ANALYSIS_SRC_DIR / "data"
    if data_dir.exists():
        logger.info(f"Data directory exists: {data_dir}")
        for item in data_dir.iterdir():
            logger.info(f"  - {item}")
    else:
        logger.warning(f"Data directory does not exist: {data_dir}")
    
    # Add to Python path
    sys.path.append(str(ANALYSIS_SRC_DIR))
    logger.info(f"Added to Python path: {ANALYSIS_SRC_DIR}")
    logger.info(f"Updated Python path: {sys.path}")
    
    # Try importing the modules
    try:
        logger.info("Trying to import models.anomaly...")
        import models.anomaly
        logger.info("Successfully imported models.anomaly")
        
        # Check for the required functions
        if hasattr(models.anomaly, 'load_model'):
            logger.info("load_model function exists in models.anomaly")
        else:
            logger.warning("load_model function DOES NOT exist in models.anomaly")
            
        if hasattr(models.anomaly, 'predict_anomaly'):
            logger.info("predict_anomaly function exists in models.anomaly")
        else:
            logger.warning("predict_anomaly function DOES NOT exist in models.anomaly")
        
    except ImportError as e:
        logger.error(f"ImportError: {e}")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
    
    try:
        logger.info("Trying to import data.preprocess...")
        import data.preprocess
        logger.info("Successfully imported data.preprocess")
        
        # Check for the required functions
        if hasattr(data.preprocess, 'generate_synthetic_data'):
            logger.info("generate_synthetic_data function exists in data.preprocess")
        else:
            logger.warning("generate_synthetic_data function DOES NOT exist in data.preprocess")
            
    except ImportError as e:
        logger.error(f"ImportError: {e}")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
else:
    logger.error(f"Analysis src directory does not exist: {ANALYSIS_SRC_DIR}")

print("Diagnostics complete.") 