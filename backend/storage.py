import json
import os
from datetime import datetime

DATA_DIR = "data"

CHAT_FILE = os.path.join(DATA_DIR, "chat_history.json")
ORDER_FILE = os.path.join(DATA_DIR, "order_history.json")
SESSION_FILE = os.path.join(DATA_DIR, "session_state.json")
ANALYTICS_FILE = os.path.join(DATA_DIR, "analytics.json")


def load_json(path, default):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return default


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)


# -------------------------
# CHAT HISTORY
# -------------------------
def save_chat(role, message):
    chats = load_json(CHAT_FILE, [])

    chats.append({
        "timestamp": datetime.now().isoformat(),
        "role": role,
        "message": message
    })

    save_json(CHAT_FILE, chats)


def clear_chat():
    save_json(CHAT_FILE, [])


# -------------------------
# ORDERS
# -------------------------
def save_order(order):
    orders = load_json(ORDER_FILE, [])
    orders.append(order)
    save_json(ORDER_FILE, orders)
    update_analytics(order)


def get_orders():
    return load_json(ORDER_FILE, [])


# -------------------------
# SESSION
# -------------------------
def save_session(session_data):
    save_json(SESSION_FILE, session_data)


def load_session():
    return load_json(SESSION_FILE, {})


def clear_session():
    save_json(SESSION_FILE, {})


# -------------------------
# ANALYTICS
# -------------------------
def update_analytics(order):
    analytics = load_json(ANALYTICS_FILE, {
        "total_orders": 0,
        "most_ordered_food": {},
        "favorite_restaurants": {},
        "avg_order_value": 0
    })

    analytics["total_orders"] += 1

    item = order["summary"]["item"]
    restaurant = order["summary"]["restaurant"]
    price = order["summary"]["price"]

    analytics["most_ordered_food"][item] = (
        analytics["most_ordered_food"].get(item, 0) + 1
    )

    analytics["favorite_restaurants"][restaurant] = (
        analytics["favorite_restaurants"].get(restaurant, 0) + 1
    )

    previous_avg = analytics["avg_order_value"]
    total = analytics["total_orders"]

    analytics["avg_order_value"] = (
        ((previous_avg * (total - 1)) + price) / total
    )

    save_json(ANALYTICS_FILE, analytics)


def get_analytics():
    return load_json(ANALYTICS_FILE, {})

def get_chat_history():
    return load_json(CHAT_FILE, [])


def get_order_history():
    return load_json(ORDER_FILE, [])