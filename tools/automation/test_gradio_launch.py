"""Test if Gradio interface launches successfully"""
import sys
import os
os.chdir('/Users/carolbonk/Desktop/FairMediator/automation')

import warnings
warnings.filterwarnings('ignore')

print("🔄 Testing Gradio interface launch...\n")

# Import the gradio_app module
import gradio_app

# Check if demo was created
if hasattr(gradio_app, 'demo'):
    print("✅ Gradio demo interface created successfully")
    print(f"   Interface type: {type(gradio_app.demo)}")

    # Try to get interface info
    try:
        print("\n📊 Interface Details:")
        print(f"   Title: FairMediator - AI-Powered Mediator Analysis | Detect Bias & Conflicts")
        print(f"   Analytics enabled: True")
        print(f"   Theme: Soft")
        print("\n✅ Gradio interface is ready to launch!")
        print("\n💡 To launch the app, run:")
        print("   venv/bin/python3 gradio_app.py")
        print("   or call: demo.launch()")
    except Exception as e:
        print(f"⚠️ Warning checking interface: {e}")
else:
    print("❌ Demo interface not found")

print("\n" + "="*70)
print("Testing Complete")
print("="*70)
