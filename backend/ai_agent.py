import os
import json
import requests
from dotenv import load_dotenv
from pathlib import Path

from storage import (
    save_chat,
    load_json,
    CHAT_FILE,
    clear_chat
)

load_dotenv(Path("../.env"))

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

chat_history = load_json(CHAT_FILE, [])


SYSTEM_PROMPT = """
You are Jarvis, an AI personal food concierge.
Be concise, smart, and conversational.
Never mention technical implementation.
"""


INTENT_PROMPT = """
Extract food ordering intent.

IMPORTANT:
If user asks multiple requests joined by 'and',
return a JSON ARRAY.

Otherwise return a single JSON OBJECT.

Schema:
{
  "dish": string or null,
  "budget": integer or null,
  "veg": true/false/null,
  "healthy": true/false,
  "spicy": true/false/null,
  "quick": true/false,
  "restaurant_intent": true/false,
  "sort": "asc" | "desc" | null,
  "limit": integer
}

Rules:

Dish:
- pizza -> dish = "pizza"
- biryani -> dish = "biryani"
- burger -> dish = "burger"
- sandwich -> dish = "sandwich"

Budget:
- under 200 -> budget = 200

Diet:
- veg / vegetarian -> veg = true
- non veg / chicken / mutton -> veg = false

Health:
- healthy -> healthy = true

Spice:
- spicy -> spicy = true
- non spicy / not spicy -> spicy = false

Quick:
- quick / fast -> quick = true

Restaurant:
- restaurants / restaurant / places -> restaurant_intent = true

Sorting:
cheap / cheapest / low price -> sort = "asc"
expensive / premium / costly / costliest -> sort = "desc"

Top N:
top 3 -> limit = 3
top 5 -> limit = 5

SUPERLATIVE:
If no explicit top N:
- most expensive -> limit = 1
- costliest -> limit = 1
- cheapest -> limit = 1
- most cheapest -> limit = 1

Compound queries:
"Most Expensive Veg Items and Most Expensive Non Veg item"

Return:
[
  {
    "veg": true,
    "sort": "desc",
    "limit": 1
  },
  {
    "veg": false,
    "sort": "desc",
    "limit": 1
  }
]

"cheapest veg and cheapest non veg"

Return:
[
  {
    "veg": true,
    "sort": "asc",
    "limit": 1
  },
  {
    "veg": false,
    "sort": "asc",
    "limit": 1
  }
]

Return JSON only.
No explanation.
"""


def ask_ai(user_message):
    global chat_history

    url = "https://openrouter.ai/api/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    user_entry = {
        "role": "user",
        "content": user_message
    }

    chat_history.append(user_entry)
    save_chat("user", user_message)

    recent_history = chat_history[-24:]

    payload = {
        "model": "nvidia/nemotron-3-nano-30b-a3b:free",
        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            }
        ] + recent_history
    }

    try:
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=60
        )

        if response.status_code != 200:
            print("OPENROUTER ERROR:", response.text)
            return "Sorry, AI service is unavailable right now."

        data = response.json()
        ai_reply = data["choices"][0]["message"]["content"]

        assistant_entry = {
            "role": "assistant",
            "content": ai_reply
        }

        chat_history.append(assistant_entry)
        save_chat("assistant", ai_reply)

        return ai_reply

    except Exception as e:
        print("AI ERROR:", str(e))
        return "Sorry, something went wrong while processing your request."


def parse_food_intent(user_message):
    url = "https://openrouter.ai/api/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "nvidia/nemotron-3-nano-30b-a3b:free",
        "messages": [
            {
                "role": "system",
                "content": INTENT_PROMPT
            },
            {
                "role": "user",
                "content": user_message
            }
        ]
    }

    try:
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=45
        )

        if response.status_code != 200:
            print("INTENT PARSER ERROR:", response.text)
            return None

        data = response.json()
        content = data["choices"][0]["message"]["content"].strip()

        if content.startswith("```"):
            content = content.replace("```json", "").replace("```", "").strip()

        parsed = json.loads(content)

        if isinstance(parsed, list):
            for intent in parsed:
                if "limit" not in intent or intent["limit"] is None:
                    intent["limit"] = 8
            return parsed

        if "limit" not in parsed or parsed["limit"] is None:
            parsed["limit"] = 8

        return parsed

    except Exception as e:
        print("INTENT PARSE ERROR:", str(e))
        return None


def clear_chat_memory():
    global chat_history
    clear_chat()
    chat_history = []