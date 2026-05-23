from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from ai_agent import (
    ask_ai,
    clear_chat_memory,
    parse_food_intent
)

from mock_swiggy import (
    get_addresses,
    search_restaurants,
    search_dishes,
    get_menu,
    place_order
)

from storage import (
    save_order,
    save_session,
    load_session,
    clear_session,
    get_analytics,
    get_order_history,
    get_chat_history
)

app = Flask(
    __name__,
    static_folder="../frontend",
    static_url_path=""
)

CORS(app)


def default_session():
    return {
        "selected_address": None,
        "restaurant_results": [],
        "selected_restaurant": None,
        "menu_items": [],
        "pending_order": None,
        "last_order": None,
        "last_query": None,
        "last_intent": None
    }


session_state = load_session()

if not session_state:
    session_state = default_session()


# --------------------------------
# FRONTEND ROUTES
# --------------------------------
@app.route("/")
def home():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/dashboard")
def dashboard():
    return send_from_directory(app.static_folder, "dashboard.html")


@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(app.static_folder, path)


# --------------------------------
# API ROUTES
# --------------------------------
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "success": True,
        "message": "Backend running successfully"
    })


@app.route("/api/analytics", methods=["GET"])
def analytics_api():
    return jsonify({
        "success": True,
        "analytics": get_analytics(),
        "orders": get_order_history(),
        "chat": get_chat_history()
    })


@app.route("/clear-memory", methods=["POST"])
def clear_memory():
    global session_state

    clear_chat_memory()
    clear_session()
    session_state = default_session()

    return jsonify({
        "success": True,
        "message": "Memory cleared"
    })


@app.route("/api/place-cart-order", methods=["POST"])
def place_cart_order():
    global session_state
    try:
        data = request.get_json()
        if not data or "restaurant" not in data or "items" not in data:
            return jsonify({
                "success": False,
                "message": "Invalid cart data"
            }), 400

        restaurant = data["restaurant"]
        items_dict = data["items"]

        # Consolidate items into a single summary string and calculate totals
        item_summary_parts = []
        total_price = 0
        for name, details in items_dict.items():
            qty = details["quantity"]
            price = details["price"]
            item_summary_parts.append(f"{name} x{qty}")
            total_price += price * qty

        item_summary = ", ".join(item_summary_parts)

        pending_order = {
            "restaurant": restaurant,
            "item": item_summary,
            "price": total_price
        }

        # Place order and write to storage
        result = place_order(pending_order)
        save_order(result["data"])

        # Cache last order and reset session states
        session_state["last_order"] = pending_order
        session_state["pending_order"] = None
        session_state["menu_items"] = []
        session_state["selected_restaurant"] = None
        session_state["restaurant_results"] = []
        save_session(session_state)

        return jsonify({
            "success": True,
            "type": "order_success",
            "data": result["data"]
        })
    except Exception as e:
        print("PLACE CART ORDER ERROR:", str(e))
        return jsonify({
            "success": False,
            "message": "Internal server error"
        }), 500


@app.route("/chat", methods=["POST"])
def chat():
    global session_state

    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "message": "No request data received"
            }), 400

        message = data.get("message", "").strip()
        action = data.get("action")
        payload = data.get("payload", {})

        # -----------------------------
        # DIRECT DISH SELECTION
        # -----------------------------
        if action == "select_dish_direct":
            item_name = payload.get("item_name")

            if not session_state["selected_address"]:
                return jsonify({
                    "success": False,
                    "message": "No active food search"
                }), 400

            intent = session_state["last_intent"]

            if isinstance(intent, list):
                all_dishes = []

                for sub_intent in intent:
                    result = search_dishes(
                        session_state["selected_address"]["id"],
                        sub_intent
                    )
                    all_dishes.extend(result["data"])
            else:
                result = search_dishes(
                    session_state["selected_address"]["id"],
                    intent
                )
                all_dishes = result["data"]

            for dish in all_dishes:
                if dish["item_name"] == item_name:
                    pending_order = {
                        "restaurant": dish["restaurant_name"],
                        "item": dish["item_name"],
                        "price": dish["price"]
                    }

                    session_state["pending_order"] = pending_order
                    save_session(session_state)

                    return jsonify({
                        "success": True,
                        "type": "confirmation",
                        "data": pending_order
                    })

        # -----------------------------
        # RESTAURANT SELECTION
        # -----------------------------
        if action == "select_restaurant":
            restaurant_id = payload.get("restaurant_id")

            for restaurant in session_state["restaurant_results"]:
                if restaurant["id"] == restaurant_id:
                    session_state["selected_restaurant"] = restaurant

                    menu = get_menu(restaurant_id)["data"]
                    session_state["menu_items"] = menu

                    save_session(session_state)

                    return jsonify({
                        "success": True,
                        "type": "menu",
                        "restaurant": restaurant["name"],
                        "data": menu
                    })

            return jsonify({
                "success": False,
                "message": "Restaurant not found"
            }), 404

        # -----------------------------
        # MENU ITEM SELECTION
        # -----------------------------
        if action == "select_menu_item":
            item_name = payload.get("item_name")

            for item in session_state["menu_items"]:
                if item["name"] == item_name:
                    pending_order = {
                        "restaurant": session_state["selected_restaurant"]["name"],
                        "item": item["name"],
                        "price": item["price"]
                    }

                    session_state["pending_order"] = pending_order
                    save_session(session_state)

                    return jsonify({
                        "success": True,
                        "type": "confirmation",
                        "data": pending_order
                    })

            return jsonify({
                "success": False,
                "message": "Menu item not found"
            }), 404

        # -----------------------------
        # CONFIRM ORDER
        # -----------------------------
        if action == "confirm_order":
            if not session_state["pending_order"]:
                return jsonify({
                    "success": False,
                    "message": "No pending order"
                }), 400

            result = place_order(session_state["pending_order"])
            save_order(result["data"])

            session_state["last_order"] = session_state["pending_order"]
            session_state["pending_order"] = None
            session_state["menu_items"] = []
            session_state["selected_restaurant"] = None
            session_state["restaurant_results"] = []

            save_session(session_state)

            return jsonify({
                "success": True,
                "type": "order_success",
                "data": result["data"]
            })

        # -----------------------------
        # MESSAGE REQUIRED
        # -----------------------------
        if not message:
            return jsonify({
                "success": False,
                "message": "Message required"
            }), 400

        lower_msg = message.lower()

        # -----------------------------
        # REPEAT ORDER
        # -----------------------------
        repeat_phrases = [
            "repeat last order",
            "same as previous",
            "same as before",
            "repeat order"
        ]

        if any(p in lower_msg for p in repeat_phrases):
            if session_state["last_order"]:
                result = place_order(session_state["last_order"])
                save_order(result["data"])

                return jsonify({
                    "success": True,
                    "type": "order_success",
                    "data": result["data"]
                })

            return jsonify({
                "success": True,
                "type": "chat",
                "reply": "No previous order found."
            })

        # -----------------------------
        # CHEAPER FOLLOW-UP
        # -----------------------------
        if "cheaper" in lower_msg:
            if session_state["last_intent"]:
                intent = session_state["last_intent"]

                if isinstance(intent, list):
                    merged = []

                    for sub in intent:
                        cheaper = sub.copy()

                        if cheaper.get("budget"):
                            cheaper["budget"] = max(
                                50,
                                cheaper["budget"] - 50
                            )

                        cheaper["sort"] = "asc"

                        result = search_dishes(
                            session_state["selected_address"]["id"],
                            cheaper
                        )

                        merged.extend(result["data"])

                    return jsonify({
                        "success": True,
                        "type": "dishes",
                        "data": merged,
                        "fallback": False
                    })

                cheaper_intent = intent.copy()

                if cheaper_intent.get("budget"):
                    cheaper_intent["budget"] = max(
                        50,
                        cheaper_intent["budget"] - 50
                    )

                cheaper_intent["sort"] = "asc"

                result = search_dishes(
                    session_state["selected_address"]["id"],
                    cheaper_intent
                )

                return jsonify({
                    "success": True,
                    "type": "dishes",
                    "data": result["data"],
                    "fallback": result["fallback"]
                })

        # -----------------------------
        # AI INTENT PARSING
        # -----------------------------
        intent = parse_food_intent(message)

        if intent:
            addresses = get_addresses()["data"]
            selected_address = addresses[0]

            session_state["selected_address"] = selected_address
            session_state["last_query"] = message
            session_state["last_intent"] = intent

            save_session(session_state)

            # Multi-intent
            if isinstance(intent, list):
                merged_results = []

                for sub_intent in intent:
                    result = search_dishes(
                        selected_address["id"],
                        sub_intent
                    )

                    merged_results.extend(result["data"])

                return jsonify({
                    "success": True,
                    "type": "dishes",
                    "data": merged_results,
                    "fallback": False
                })

            # Restaurant flow
            if intent.get("restaurant_intent"):
                restaurants = search_restaurants(
                    selected_address["id"],
                    message
                )["data"]

                session_state["restaurant_results"] = restaurants
                save_session(session_state)

                return jsonify({
                    "success": True,
                    "type": "restaurants",
                    "data": restaurants
                })

            # Single dish flow
            result = search_dishes(
                selected_address["id"],
                intent
            )

            return jsonify({
                "success": True,
                "type": "dishes",
                "data": result["data"],
                "fallback": result["fallback"]
            })

        # -----------------------------
        # NORMAL CHAT
        # -----------------------------
        ai_reply = ask_ai(message)

        return jsonify({
            "success": True,
            "type": "chat",
            "reply": ai_reply
        })

    except Exception as e:
        print("CHAT ERROR:", str(e))

        return jsonify({
            "success": False,
            "message": "Internal server error"
        }), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)