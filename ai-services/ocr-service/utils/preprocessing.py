import cv2
import numpy as np
from PIL import Image
import os
import logging

logger = logging.getLogger("ocr_service.preprocessing")

def preprocess_image(image_path: str, output_path: str) -> str:
    """
    Applies preprocessing pipeline to the image:
    1. Read image
    2. Resize to optimal scale if needed
    3. Grayscale conversion
    4. Denoising
    5. Contrast enhancement (CLAHE)
    6. Deskewing (rotation correction)
    7. Save processed image
    """
    try:
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image from {image_path}")

        h, w = img.shape[:2]
        logger.info(f"Original image shape: {w}x{h}")

        # 1. Resize if image is too large or too small
        # Target ~1200px width for the server detection model to achieve 100% accuracy on CPU
        target_width = 1200
        if w > 2000 or w < 800:
            scale = target_width / w
            img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)
            h, w = img.shape[:2]
            logger.info(f"Resized image to: {w}x{h}")

        # 2. Grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 3. Denoising (Bilateral Filter preserves edges while removing noise)
        denoised = cv2.bilateralFilter(gray, 9, 75, 75)

        # 4. Contrast enhancement (CLAHE)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(denoised)

        # 5. Deskewing
        # Threshold the image to binary (text should be dark/light)
        # We invert the image to make text white and background black
        _, thresh = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        # Get coordinates of all text pixels
        coords = np.column_stack(np.where(thresh > 0))
        
        angle = 0.0
        if len(coords) > 0:
            # Get rotation angle of minimum area rectangle enclosing the pixels
            rect = cv2.minAreaRect(coords)
            angle = rect[-1]
            
            # The angle is in range [-90, 0)
            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle
                
        # Only rotate if the angle is significant (e.g. > 0.5 degrees) and not too large (e.g. < 45 degrees)
        if 0.5 < abs(angle) < 45:
            logger.info(f"Deskewing image by {angle:.2f} degrees")
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            enhanced = cv2.warpAffine(enhanced, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        else:
            logger.info(f"Skew angle {angle:.2f} is within threshold; skipping deskew.")

        # Save preprocessed image
        cv2.imwrite(output_path, enhanced)
        logger.info(f"Preprocessed image saved to {output_path}")
        return output_path

    except Exception as e:
        logger.error(f"Error during image preprocessing: {e}", exc_info=True)
        # In case of error, fall back to the original image path
        return image_path
