"""
FairMediator AI Demo - HuggingFace Space
Intelligent Mediator Matching & Screening Platform

Features:
- Ideology Classification
- Affiliation/Conflict Detection
- Named Entity Recognition
- Full Mediator Analysis
"""

import gradio as gr
from transformers import pipeline
from typing import Dict, List, Any

# Load models (cached after first load)
print("Loading models...")

sentiment_classifier = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english"
)

ner_pipeline = pipeline(
    "ner",
    model="dslim/bert-base-NER",
    aggregation_strategy="simple"
)

zero_shot_classifier = pipeline(
    "zero-shot-classification",
    model="facebook/bart-large-mnli"
)

print("Models loaded!")

# Ideology keywords
LIBERAL_KEYWORDS = [
    'progressive', 'equality', 'social justice', 'environmental',
    'civil rights', 'labor rights', 'ACLU', 'diversity', 'inclusion'
]

CONSERVATIVE_KEYWORDS = [
    'traditional', 'liberty', 'free market', 'constitutional',
    'heritage foundation', 'family values', 'federalist', 'limited government'
]

LIBERAL_ORGS = ['ACLU', 'Sierra Club', 'Planned Parenthood', 'NAACP']
CONSERVATIVE_ORGS = ['Heritage Foundation', 'Federalist Society', 'NRA', 'Cato Institute']


def classify_ideology(text: str) -> Dict[str, Any]:
    """Classify political ideology using keywords + ML."""
    if not text.strip():
        return {"error": "Please enter text to analyze"}

    text_lower = text.lower()

    # Keyword scoring
    liberal_count = sum(1 for kw in LIBERAL_KEYWORDS if kw.lower() in text_lower)
    conservative_count = sum(1 for kw in CONSERVATIVE_KEYWORDS if kw.lower() in text_lower)
    liberal_count += sum(2 for org in LIBERAL_ORGS if org.lower() in text_lower)
    conservative_count += sum(2 for org in CONSERVATIVE_ORGS if org.lower() in text_lower)

    total = liberal_count + conservative_count
    keyword_score = ((conservative_count - liberal_count) / total * 10) if total > 0 else 0

    # ML classification
    labels = ["liberal/progressive", "conservative/traditional", "neutral/centrist"]
    result = zero_shot_classifier(text, labels)
    scores = dict(zip(result['labels'], result['scores']))

    if scores.get('liberal/progressive', 0) > scores.get('conservative/traditional', 0):
        ml_score = -10 * scores.get('liberal/progressive', 0)
    else:
        ml_score = 10 * scores.get('conservative/traditional', 0)

    # Combined score
    combined_score = round(0.6 * ml_score + 0.4 * keyword_score, 2)

    # Determine leaning
    if combined_score < -3:
        leaning = "LIBERAL"
        color = "blue"
    elif combined_score > 3:
        leaning = "CONSERVATIVE"
        color = "red"
    else:
        leaning = "NEUTRAL"
        color = "gray"

    return {
        "Leaning": leaning,
        "Combined Score": f"{combined_score} (scale: -10 liberal to +10 conservative)",
        "ML Score": round(ml_score, 2),
        "Keyword Score": round(keyword_score, 2),
        "Confidence": f"{result['scores'][0]:.1%}",
        "ML Breakdown": {k: f"{v:.1%}" for k, v in scores.items()}
    }


def detect_affiliation(bio: str, party: str) -> Dict[str, Any]:
    """Detect potential conflicts of interest."""
    if not bio.strip() or not party.strip():
        return {"error": "Please enter both mediator bio and party name"}

    labels = ["potential conflict of interest", "no conflict of interest"]
    analysis_text = f"Check if mediator has connection to {party}: {bio}"

    result = zero_shot_classifier(analysis_text, labels)
    is_conflict = result['labels'][0] == "potential conflict of interest"
    confidence = result['scores'][0]

    # Direct match check
    direct_match = party.lower() in bio.lower()

    # Risk level
    if direct_match or (is_conflict and confidence > 0.7):
        risk_level = "HIGH"
    elif is_conflict and confidence > 0.5:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return {
        "Risk Level": risk_level,
        "Prediction": result['labels'][0],
        "Confidence": f"{confidence:.1%}",
        "Direct Match Found": "Yes" if direct_match else "No",
        "Recommendation": "Review carefully before proceeding" if risk_level in ["HIGH", "MEDIUM"] else "No significant conflicts detected"
    }


def extract_entities(text: str) -> Dict[str, List[str]]:
    """Extract named entities from text."""
    if not text.strip():
        return {"error": "Please enter text to analyze"}

    entities = ner_pipeline(text[:3000])

    result = {
        "Organizations (ORG)": [],
        "People (PER)": [],
        "Locations (LOC)": [],
        "Miscellaneous (MISC)": []
    }

    type_map = {
        "ORG": "Organizations (ORG)",
        "PER": "People (PER)",
        "LOC": "Locations (LOC)",
        "MISC": "Miscellaneous (MISC)"
    }

    for ent in entities:
        ent_type = ent['entity_group']
        if ent_type in type_map:
            result[type_map[ent_type]].append(ent['word'])

    # Deduplicate
    for key in result:
        result[key] = list(set(result[key])) if result[key] else ["None found"]

    return result


def full_analysis(bio: str, parties: str) -> Dict[str, Any]:
    """Run complete mediator analysis."""
    if not bio.strip():
        return {"error": "Please enter mediator bio"}

    # Parse parties
    party_list = [p.strip() for p in parties.split(",") if p.strip()] if parties else []

    # Run analyses
    ideology = classify_ideology(bio)
    entities = extract_entities(bio)

    # Conflict checks
    conflicts = []
    if party_list:
        for party in party_list:
            conflict = detect_affiliation(bio, party)
            conflicts.append({
                "Party": party,
                "Risk": conflict.get("Risk Level", "N/A"),
                "Confidence": conflict.get("Confidence", "N/A")
            })

    # Sentiment
    sentiment = sentiment_classifier(bio[:500])[0]

    # Overall recommendation
    has_high_risk = any(c.get("Risk") == "HIGH" for c in conflicts)
    has_medium_risk = any(c.get("Risk") == "MEDIUM" for c in conflicts)

    if has_high_risk:
        recommendation = "NOT RECOMMENDED - High conflict risk"
    elif has_medium_risk:
        recommendation = "REVIEW REQUIRED - Potential conflicts"
    else:
        recommendation = "RECOMMENDED - No significant conflicts"

    return {
        "RECOMMENDATION": recommendation,
        "Ideology": ideology.get("Leaning", "N/A"),
        "Ideology Score": ideology.get("Combined Score", "N/A"),
        "Sentiment": f"{sentiment['label']} ({sentiment['score']:.1%})",
        "Organizations Found": ", ".join(entities.get("Organizations (ORG)", [])),
        "Locations Found": ", ".join(entities.get("Locations (LOC)", [])),
        "Conflict Analysis": conflicts if conflicts else "No parties to check"
    }


# Create Gradio interface
with gr.Blocks(title="FairMediator AI Demo", theme=gr.themes.Soft()) as demo:
    gr.Markdown("""
    # FairMediator AI Demo
    ### Intelligent Mediator Matching & Screening Platform

    Analyze mediator profiles for ideology, conflicts of interest, and affiliations using AI.

    **100% FREE** - Powered by HuggingFace Transformers
    """)

    with gr.Tabs():
        # Tab 1: Full Analysis
        with gr.TabItem("Full Analysis"):
            gr.Markdown("### Complete Mediator Analysis")
            with gr.Row():
                with gr.Column():
                    full_bio = gr.Textbox(
                        label="Mediator Bio/Profile",
                        placeholder="Enter the mediator's biography, credentials, affiliations...",
                        lines=8
                    )
                    full_parties = gr.Textbox(
                        label="Parties to Check (comma-separated)",
                        placeholder="e.g., Acme Corp, Smith & Associates, TechStart Inc"
                    )
                    full_btn = gr.Button("Analyze Mediator", variant="primary")
                with gr.Column():
                    full_output = gr.JSON(label="Analysis Results")

            full_btn.click(full_analysis, inputs=[full_bio, full_parties], outputs=full_output)

            gr.Examples(
                examples=[
                    [
                        "Patricia Martinez is a senior mediator at Pacific Dispute Resolution in Los Angeles. She has 18 years of experience in employment disputes. Previously a partner at Morrison & Foerster LLP and in-house counsel for TechStart Inc. Member of the ABA and has volunteered with the ACLU.",
                        "TechStart Inc, Morrison & Foerster"
                    ]
                ],
                inputs=[full_bio, full_parties]
            )

        # Tab 2: Ideology Classification
        with gr.TabItem("Ideology Classifier"):
            gr.Markdown("### Political Ideology Detection")
            with gr.Row():
                with gr.Column():
                    ideology_text = gr.Textbox(
                        label="Text to Analyze",
                        placeholder="Enter mediator bio, statements, or affiliations...",
                        lines=6
                    )
                    ideology_btn = gr.Button("Classify Ideology", variant="primary")
                with gr.Column():
                    ideology_output = gr.JSON(label="Classification Results")

            ideology_btn.click(classify_ideology, inputs=ideology_text, outputs=ideology_output)

            gr.Examples(
                examples=[
                    ["Board member of the Heritage Foundation and advocate for constitutional originalism and limited government."],
                    ["Volunteer attorney for the ACLU, focusing on civil rights and environmental justice cases."],
                    ["Neutral arbitrator with 20 years experience, certified by AAA and JAMS."]
                ],
                inputs=ideology_text
            )

        # Tab 3: Conflict Detection
        with gr.TabItem("Conflict Checker"):
            gr.Markdown("### Affiliation & Conflict Detection")
            with gr.Row():
                with gr.Column():
                    conflict_bio = gr.Textbox(
                        label="Mediator Bio",
                        placeholder="Enter mediator background...",
                        lines=5
                    )
                    conflict_party = gr.Textbox(
                        label="Party Name to Check",
                        placeholder="e.g., Goldman Sachs"
                    )
                    conflict_btn = gr.Button("Check Conflicts", variant="primary")
                with gr.Column():
                    conflict_output = gr.JSON(label="Conflict Analysis")

            conflict_btn.click(detect_affiliation, inputs=[conflict_bio, conflict_party], outputs=conflict_output)

        # Tab 4: Entity Extraction
        with gr.TabItem("Entity Extraction"):
            gr.Markdown("### Named Entity Recognition (NER)")
            with gr.Row():
                with gr.Column():
                    ner_text = gr.Textbox(
                        label="Text to Analyze",
                        placeholder="Enter text to extract organizations, people, locations...",
                        lines=6
                    )
                    ner_btn = gr.Button("Extract Entities", variant="primary")
                with gr.Column():
                    ner_output = gr.JSON(label="Extracted Entities")

            ner_btn.click(extract_entities, inputs=ner_text, outputs=ner_output)

        # Tab 5: About
        with gr.TabItem("About"):
            gr.Markdown("""
            ## About FairMediator

            FairMediator is an AI-powered platform for intelligent mediator matching and screening.

            ### Features
            - **Ideology Classification**: Detect political leanings using keyword analysis + ML
            - **Conflict Detection**: Identify potential conflicts of interest
            - **Entity Extraction**: Extract organizations, people, and locations
            - **Full Analysis**: Complete mediator screening pipeline

            ### Technology
            - HuggingFace Transformers (FREE)
            - DistilBERT for sentiment
            - BART for zero-shot classification
            - BERT for NER

            ### Links
            - [GitHub Repository](https://github.com/carolbonk/fairmediator.ai)
            - [HuggingFace Profile](https://huggingface.co/CarolBonk)

            ### Contact
            Created by Carol Bonk

            ---
            *This is a demo version. The full application includes web scraping, database integration, and more.*
            """)

# Launch the app
if __name__ == "__main__":
    demo.launch()
