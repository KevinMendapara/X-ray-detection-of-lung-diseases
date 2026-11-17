import os
import zipfile
import io
import numpy as np
import pydicom
from PIL import Image

def dicom_to_rgb_array(dcm_bytes):
    ds = pydicom.dcmread(io.BytesIO(dcm_bytes))
    arr = ds.pixel_array.astype(np.float32)
    
    # Check PhotometricInterpretation (MONOCHROME1 is inverted)
    photo_interp = getattr(ds, 'PhotometricInterpretation', 'MONOCHROME2')
    if photo_interp == 'MONOCHROME1':
        arr = np.max(arr) - arr
        
    # Percentile contrast stretch
    p1, p99 = np.percentile(arr, (1, 99))
    if p99 > p1:
        arr = np.clip(arr, p1, p99)
        arr = (arr - p1) / (p99 - p1) * 255.0
    else:
        arr = (arr - np.min(arr)) / (np.max(arr) - np.min(arr) + 1e-6) * 255.0
        
    arr = arr.astype(np.uint8)
    img = Image.fromarray(arr).convert('RGB')
    return img, ds

if __name__ == '__main__':
    normal_zip = r"C:\Users\Hp\OneDrive\Desktop\intbtr99.zip"
    abnormal_zip = r"C:\Users\Hp\Downloads\intbtr253.zip"
    
    print("Testing Normal DICOM:")
    with zipfile.ZipFile(normal_zip) as z:
        for name in z.namelist():
            if name.endswith('.dicom'):
                img, ds = dicom_to_rgb_array(z.read(name))
                print(f"Normal sample: {name}, size={img.size}, mode={img.mode}")
                os.makedirs("ml/data/sample_xrays", exist_ok=True)
                img.save("ml/data/sample_xrays/sample_normal_icmr.png")
                break
                
    print("Testing Abnormal (TB) DICOM:")
    with zipfile.ZipFile(abnormal_zip) as z:
        for name in z.namelist():
            if name.endswith('.dicom'):
                img, ds = dicom_to_rgb_array(z.read(name))
                print(f"Abnormal sample: {name}, size={img.size}, mode={img.mode}")
                img.save("ml/data/sample_xrays/sample_tb_icmr.png")
                break
    print("Sample DICOMs converted and saved successfully!")
