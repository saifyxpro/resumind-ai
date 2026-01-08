"""
Temporary script to convert all .tex resumes to PDF.
Run from the project root: python convert_tex_to_pdf.py
"""
import subprocess
import os
import shutil

# Paths
EXAMPLES_DIR = "examples"
PDF_OUTPUT_DIR = os.path.join(EXAMPLES_DIR, "pdf")

# Ensure output directory exists
os.makedirs(PDF_OUTPUT_DIR, exist_ok=True)

# Find all .tex files
tex_files = [f for f in os.listdir(EXAMPLES_DIR) if f.endswith(".tex")]

print(f"Found {len(tex_files)} .tex files to convert.\n")

for tex_file in tex_files:
    tex_path = os.path.join(EXAMPLES_DIR, tex_file)
    print(f"Converting: {tex_file}...")
    
    try:
        # Run pdflatex with output directory
        result = subprocess.run(
            ["pdflatex", "-interaction=nonstopmode", f"-output-directory={PDF_OUTPUT_DIR}", tex_path],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            print(f"  [OK] Success: {tex_file.replace('.tex', '.pdf')}")
        else:
            print(f"  [ERROR] Error compiling {tex_file}")
            # Print last few lines of error for debugging
            error_lines = result.stdout.split('\n')[-5:]
            for line in error_lines:
                if line.strip():
                    print(f"    {line}")
    except subprocess.TimeoutExpired:
        print(f"  [TIMEOUT] {tex_file}")
    except FileNotFoundError:
        print("  [ERROR] pdflatex not found. Please install MiKTeX or TeX Live.")
        break

# Cleanup: Remove .aux, .log, .out files
print("\nCleaning up temporary files...")
for ext in [".aux", ".log", ".out"]:
    for f in os.listdir(PDF_OUTPUT_DIR):
        if f.endswith(ext):
            try:
                os.remove(os.path.join(PDF_OUTPUT_DIR, f))
            except:
                pass

print("\nDone! PDFs are in:", PDF_OUTPUT_DIR)
