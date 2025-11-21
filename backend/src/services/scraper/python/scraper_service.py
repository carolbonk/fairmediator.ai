"""
FairMediator Scraping Service
LLM-powered web scraping compatible with Python 3.9+
Uses BeautifulSoup + aiohttp + LLM APIs for intelligent extraction
"""

from __future__ import annotations

import os
import json
import asyncio
import re
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import aiohttp
from bs4 import BeautifulSoup

load_dotenv()

app = FastAPI(title="FairMediator Scraper Service", version="1.0.0")

# Configuration
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY", "")
HF_API_URL = "https://router.huggingface.co/v1/chat/completions"

# ============================================================================
# Request/Response Models
# ============================================================================

class ScrapeRequest(BaseModel):
    url: str
    query: Optional[str] = None
    extract_schema: Optional[Dict[str, Any]] = None

class MediatorScrapeRequest(BaseModel):
    url: str
    mediator_name: Optional[str] = None

class AffiliationRequest(BaseModel):
    urls: List[str]
    mediator_name: str
    check_for: Optional[List[str]] = None

class IdeologyRequest(BaseModel):
    urls: List[str]
    mediator_name: str

class BulkScrapeRequest(BaseModel):
    urls: List[str]
    query: str

# ============================================================================
# Helper Functions
# ============================================================================

async def fetch_page(url: str, timeout: int = 30) -> Dict[str, Any]:
    """Fetch webpage content"""
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, timeout=timeout) as response:
                if response.status != 200:
                    return {"success": False, "error": f"HTTP {response.status}"}

                html = await response.text()
                soup = BeautifulSoup(html, 'lxml')

                # Remove scripts and styles
                for tag in soup(['script', 'style', 'nav', 'footer', 'header']):
                    tag.decompose()

                # Extract text content
                text = soup.get_text(separator='\n', strip=True)

                # Extract links
                links = [a.get('href') for a in soup.find_all('a', href=True)]
                internal_links = [l for l in links if l and not l.startswith('http')]

                return {
                    "success": True,
                    "text": text[:15000],  # Limit text length
                    "html": str(soup)[:5000],
                    "links": internal_links[:20]
                }
    except asyncio.TimeoutError:
        return {"success": False, "error": "Request timeout"}
    except Exception as e:
        return {"success": False, "error": str(e)}

async def call_llm(prompt: str, system_prompt: str = "") -> str:
    """Call LLM for intelligent extraction - tries Ollama first, then HuggingFace"""

    # Try Ollama first (local, free)
    try:
        async with aiohttp.ClientSession() as session:
            ollama_payload = {
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt or "You are a helpful assistant that extracts structured data from text."},
                    {"role": "user", "content": prompt}
                ],
                "stream": False
            }

            async with session.post(
                f"{OLLAMA_URL}/api/chat",
                json=ollama_payload,
                timeout=60
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("message", {}).get("content", "")
    except Exception:
        pass  # Fall through to HuggingFace

    # Try HuggingFace as fallback
    if HUGGINGFACE_API_KEY:
        try:
            async with aiohttp.ClientSession() as session:
                hf_payload = {
                    "model": "meta-llama/Llama-3.2-3B-Instruct",
                    "messages": [
                        {"role": "system", "content": system_prompt or "You are a helpful assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 1024,
                    "temperature": 0.3
                }

                headers = {
                    "Authorization": f"Bearer {HUGGINGFACE_API_KEY}",
                    "Content-Type": "application/json"
                }

                async with session.post(
                    HF_API_URL,
                    json=hf_payload,
                    headers=headers,
                    timeout=60
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("choices", [{}])[0].get("message", {}).get("content", "")
        except Exception as e:
            return f"LLM call failed: {str(e)}"

    return "No LLM available (Ollama not running and no HuggingFace API key)"

def extract_json_from_text(text: str) -> Dict:
    """Extract JSON from LLM response"""
    # Try to find JSON in code blocks
    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass

    # Try to parse the entire text as JSON
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try to find JSON object in text
    json_match = re.search(r'\{[\s\S]*\}', text)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass

    return {"raw_response": text}

# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    # Check Ollama
    ollama_status = "unknown"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{OLLAMA_URL}/api/tags", timeout=5) as resp:
                ollama_status = "healthy" if resp.status == 200 else "unavailable"
    except Exception:
        ollama_status = "unavailable"

    return {
        "status": "healthy",
        "service": "FairMediator Scraper",
        "ollama": ollama_status,
        "huggingface": "configured" if HUGGINGFACE_API_KEY else "not configured"
    }

@app.post("/scrape/generic")
async def scrape_generic(request: ScrapeRequest):
    """Generic scraping endpoint"""
    page = await fetch_page(request.url)

    if not page["success"]:
        raise HTTPException(status_code=500, detail=page.get("error", "Scraping failed"))

    prompt = f"""
    {request.query or "Extract all relevant information from this page"}

    Page content:
    {page['text'][:8000]}

    Return the extracted information as JSON.
    """

    llm_response = await call_llm(prompt)
    extracted = extract_json_from_text(llm_response)

    return {
        "success": True,
        "data": extracted,
        "raw_html": page.get("html", ""),
        "links": page.get("links", [])
    }

@app.post("/scrape/mediator-profile")
async def scrape_mediator_profile(request: MediatorScrapeRequest):
    """Scrape mediator profile information"""
    page = await fetch_page(request.url)

    if not page["success"]:
        return {"success": False, "error": page.get("error"), "data": {}}

    prompt = f"""
    Extract mediator/arbitrator profile information from this page.
    {f'Focus on: {request.mediator_name}' if request.mediator_name else ''}

    Extract these fields as JSON:
    - name (string)
    - firm (string)
    - email (string)
    - phone (string)
    - location (object with city, state, address)
    - specializations (array of strings)
    - certifications (array of strings)
    - barAdmissions (array of strings)
    - yearsExperience (number)
    - education (array of strings)
    - biography (string)

    Page content:
    {page['text'][:8000]}

    Return ONLY valid JSON.
    """

    llm_response = await call_llm(prompt)
    extracted = extract_json_from_text(llm_response)

    return {
        "success": True,
        "data": extracted
    }

@app.post("/scrape/affiliations")
async def scrape_affiliations(request: AffiliationRequest):
    """Scrape and detect affiliations for conflict analysis"""
    all_affiliations = []
    potential_conflicts = []

    for url in request.urls:
        page = await fetch_page(url)

        if not page["success"]:
            continue

        prompt = f"""
        Find ALL organizational affiliations for {request.mediator_name}:

        - Current and past employers
        - Board memberships
        - Professional associations
        - Political affiliations
        - Corporate relationships
        - Law firm connections

        Page content:
        {page['text'][:8000]}

        Return as JSON with format:
        {{
            "affiliations": [
                {{"organization": "name", "role": "position", "current": true/false}}
            ]
        }}
        """

        llm_response = await call_llm(prompt)
        affiliations = extract_json_from_text(llm_response)

        all_affiliations.append({
            "source": url,
            "affiliations": affiliations.get("affiliations", affiliations)
        })

        # Check for conflicts
        if request.check_for:
            aff_str = json.dumps(affiliations).lower()
            for org in request.check_for:
                if org.lower() in aff_str:
                    potential_conflicts.append({
                        "organization": org,
                        "source": url,
                        "risk_level": "HIGH"
                    })

    return {
        "success": True,
        "mediator": request.mediator_name,
        "affiliations": all_affiliations,
        "potential_conflicts": potential_conflicts,
        "conflict_detected": len(potential_conflicts) > 0
    }

@app.post("/scrape/ideology")
async def scrape_ideology(request: IdeologyRequest):
    """Scrape and analyze ideology indicators"""
    indicators = []

    for url in request.urls:
        page = await fetch_page(url)

        if not page["success"]:
            continue

        prompt = f"""
        Analyze political ideology indicators for {request.mediator_name}:

        Look for:
        - Political donations
        - Public statements on political issues
        - Affiliations with politically-aligned organizations
        - Op-eds or articles with political views

        For each indicator, classify as LIBERAL, CONSERVATIVE, or NEUTRAL.

        Page content:
        {page['text'][:8000]}

        Return as JSON:
        {{
            "indicators": [
                {{"type": "donation/statement/affiliation", "description": "...", "leaning": "LIBERAL/CONSERVATIVE/NEUTRAL"}}
            ]
        }}
        """

        llm_response = await call_llm(prompt)
        result = extract_json_from_text(llm_response)

        indicators.append({
            "source": url,
            "indicators": result.get("indicators", result)
        })

    # Calculate ideology score
    liberal_count = 0
    conservative_count = 0

    for item in indicators:
        data_str = json.dumps(item).upper()
        liberal_count += data_str.count("LIBERAL")
        conservative_count += data_str.count("CONSERVATIVE")

    total = liberal_count + conservative_count
    if total > 0:
        ideology_score = ((conservative_count - liberal_count) / total) * 10
    else:
        ideology_score = 0

    if ideology_score < -3:
        leaning = "liberal"
    elif ideology_score > 3:
        leaning = "conservative"
    else:
        leaning = "neutral"

    return {
        "success": True,
        "mediator": request.mediator_name,
        "indicators": indicators,
        "ideology_score": round(ideology_score, 2),
        "leaning": leaning,
        "confidence": min(total * 10, 100)
    }

@app.post("/scrape/bulk")
async def scrape_bulk(request: BulkScrapeRequest):
    """Bulk scrape multiple URLs"""
    results = []

    for url in request.urls:
        page = await fetch_page(url)

        if not page["success"]:
            results.append({"url": url, "success": False, "error": page.get("error")})
            continue

        prompt = f"""
        {request.query}

        Page content:
        {page['text'][:6000]}

        Return extracted information as JSON.
        """

        llm_response = await call_llm(prompt)
        extracted = extract_json_from_text(llm_response)

        results.append({
            "url": url,
            "success": True,
            "data": extracted
        })

    return {
        "success": True,
        "total": len(results),
        "successful": sum(1 for r in results if r.get("success")),
        "results": results
    }

@app.post("/scrape/linkedin")
async def scrape_linkedin_profile(request: MediatorScrapeRequest):
    """Scrape LinkedIn profile"""
    page = await fetch_page(request.url)

    if not page["success"]:
        return {"success": False, "error": page.get("error"), "data": {}}

    prompt = f"""
    Extract professional information from this LinkedIn profile for {request.mediator_name or 'the person'}:

    - Full name and headline
    - Current position and company
    - Previous positions
    - Education
    - Skills
    - Certifications

    Page content:
    {page['text'][:8000]}

    Return as JSON.
    """

    llm_response = await call_llm(prompt)
    extracted = extract_json_from_text(llm_response)

    return {"success": True, "data": extracted}

@app.post("/scrape/legal-database")
async def scrape_legal_database(request: MediatorScrapeRequest):
    """Scrape legal databases"""
    page = await fetch_page(request.url)

    if not page["success"]:
        return {"success": False, "error": page.get("error"), "data": {}}

    prompt = f"""
    Extract legal professional information for {request.mediator_name or 'the mediator'}:

    - Bar admissions and status
    - Disciplinary history
    - Panel memberships
    - Case history
    - Ratings

    Page content:
    {page['text'][:8000]}

    Return as JSON.
    """

    llm_response = await call_llm(prompt)
    extracted = extract_json_from_text(llm_response)

    return {"success": True, "data": extracted}

# ============================================================================
# Run the service
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("SCRAPER_PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
