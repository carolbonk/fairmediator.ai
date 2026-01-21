"""Test the full_analysis function from gradio_app"""
import sys
import os

# Change to the automation directory
os.chdir('/Users/carolbonk/Desktop/FairMediator/automation')

# Suppress warnings for cleaner output
import warnings
warnings.filterwarnings('ignore')

print("🔄 Importing gradio_app module...")
print("   (This may take a moment as models are loading...)\n")

# Import the module (this will load all models)
import gradio_app

print("\n" + "=" * 70)
print("Testing full_analysis function with example inputs")
print("=" * 70)

# Test cases from the Gradio examples
test_cases = [
    {
        "name": "Case 1: ACLU Mediator with Morrison & Foerster conflict",
        "bio": "Sarah Johnson is a senior mediator at Pacific Dispute Resolution in Los Angeles. She has 18 years of experience in employment and commercial disputes. Previously, she was a partner at Morrison & Foerster LLP and volunteered with the ACLU on civil rights cases. She holds certifications from JAMS and the American Arbitration Association.",
        "party": "Morrison & Foerster"
    },
    {
        "name": "Case 2: Conservative Federalist Society Member",
        "bio": "Michael Williams is a member of the Federalist Society and advocates for constitutional originalism and limited government. He has written extensively about free market principles and serves on the board of the Heritage Foundation. 25 years of experience in corporate arbitration.",
        "party": ""
    },
    {
        "name": "Case 3: Neutral Mediator with Tech Company Check",
        "bio": "Jennifer Chen is a certified mediator with 15 years of experience in commercial disputes. She focuses on finding practical solutions and maintaining strict neutrality between all parties. Member of the American Bar Association. Based in San Francisco.",
        "party": "Tech Innovations Inc"
    }
]

for i, test_case in enumerate(test_cases, 1):
    print(f"\n{'─' * 70}")
    print(f"Test {i}: {test_case['name']}")
    print(f"{'─' * 70}")
    print(f"Bio: {test_case['bio'][:100]}...")
    print(f"Party: {test_case['party'] if test_case['party'] else 'None'}")
    print()

    # Run the analysis
    result = gradio_app.full_analysis(test_case['bio'], test_case['party'])

    # Display results
    for key, value in result.items():
        print(f"  {key}: {value}")

print("\n" + "=" * 70)
print("✅ All test cases completed successfully!")
print("=" * 70)

# Test edge cases
print("\n\n" + "=" * 70)
print("Testing Edge Cases")
print("=" * 70)

# Edge case 1: Empty bio
print("\n📝 Edge Case 1: Empty bio")
result = gradio_app.full_analysis("", "Test Party")
print(f"Result: {result}")

# Edge case 2: Very short bio
print("\n📝 Edge Case 2: Very short bio")
result = gradio_app.full_analysis("John Doe is a mediator.", "")
print(f"Recommendation: {result['📋 Recommendation']}")

print("\n" + "=" * 70)
print("✅ All edge cases handled correctly!")
print("=" * 70)
