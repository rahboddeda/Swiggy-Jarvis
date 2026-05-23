import random

MOCK_ADDRESSES = [
    {
        "id": "addr_001",
        "name": "Home",
        "full_address": "Madhapur, Hyderabad"
    },
    {
        "id": "addr_002",
        "name": "Office",
        "full_address": "Hitech City, Hyderabad"
    }
]

MOCK_RESTAURANTS = [
    {
        "id": "rest_001",
        "name": "Paradise Biryani",
        "eta": 28,
        "rating": 4.4,
        "delivery_fee": 40,
        "cuisine": "Biryani, Kebabs, Hyderabadi",
        "cost_for_two": 350,
        "rating_count": "500+ ratings",
        "gradient": "linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%)"
    },
    {
        "id": "rest_002",
        "name": "Behrouz Biryani",
        "eta": 32,
        "rating": 4.5,
        "delivery_fee": 50,
        "cuisine": "Royal Biryani, Mughlai",
        "cost_for_two": 400,
        "rating_count": "200+ ratings",
        "gradient": "linear-gradient(135deg, #F6D365 0%, #FDA085 100%)"
    },
    {
        "id": "rest_003",
        "name": "The Bowl Company",
        "eta": 22,
        "rating": 4.3,
        "delivery_fee": 30,
        "cuisine": "Healthy Bowls, Continental",
        "cost_for_two": 300,
        "rating_count": "1k+ ratings",
        "gradient": "linear-gradient(135deg, #84FAB0 0%, #8FD3F4 100%)"
    },
    {
        "id": "rest_004",
        "name": "Domino's Pizza",
        "eta": 25,
        "rating": 4.2,
        "delivery_fee": 35,
        "cuisine": "Pizzas, Fast Food, Italian",
        "cost_for_two": 450,
        "rating_count": "2k+ ratings",
        "gradient": "linear-gradient(135deg, #A1C4FD 0%, #C2E9FB 100%)"
    },
    {
        "id": "rest_005",
        "name": "Subway",
        "eta": 18,
        "rating": 4.1,
        "delivery_fee": 25,
        "cuisine": "Salads, Healthy Sandwiches",
        "cost_for_two": 250,
        "rating_count": "5k+ ratings",
        "gradient": "linear-gradient(135deg, #CFD9DF 0%, #E2EBF0 100%)"
    }
]

MOCK_MENUS = {
    "rest_001": [
        {
            "name": "Chicken Biryani",
            "price": 329,
            "veg": False,
            "healthy": False,
            "spicy": True,
            "description": "Layered long grain basmati rice, tender chicken pieces, cooked in real copper handis with authentic Nizami spices.",
            "emoji": "🍗",
            "image": "/biryani_preview.png",
            "rating": 4.5,
            "bestseller": True
        },
        {
            "name": "Veg Biryani",
            "price": 249,
            "veg": True,
            "healthy": False,
            "spicy": True,
            "description": "Fragrant basmati rice cooked with fresh seasonal vegetables, paneer cubes, and aromatic spices.",
            "emoji": "🥗",
            "image": "/biryani_preview.png",
            "rating": 4.2,
            "bestseller": False
        },
        {
            "name": "Mini Veg Biryani",
            "price": 179,
            "veg": True,
            "healthy": False,
            "spicy": False,
            "description": "A single-serving box of our fragrant veg biryani, mildly spiced for a quick comforting meal.",
            "emoji": "🍚",
            "image": "/biryani_preview.png",
            "rating": 4.0,
            "bestseller": False
        }
    ],
    "rest_002": [
        {
            "name": "Mini Chicken Biryani",
            "price": 199,
            "veg": False,
            "healthy": False,
            "spicy": True,
            "description": "Individual portion of royal chicken biryani served with raita and gulab jamun.",
            "emoji": "🍗",
            "image": "/biryani_preview.png",
            "rating": 4.6,
            "bestseller": True
        },
        {
            "name": "Veg Dum Biryani",
            "price": 269,
            "veg": True,
            "healthy": False,
            "spicy": True,
            "description": "Premium basmati rice layered with garden fresh vegetables and saffron, slow-cooked in traditional dum style.",
            "emoji": "🥘",
            "image": "/biryani_preview.png",
            "rating": 4.4,
            "bestseller": False
        }
    ],
    "rest_003": [
        {
            "name": "Peri Peri Chicken Bowl",
            "price": 299,
            "veg": False,
            "healthy": True,
            "spicy": True,
            "description": "Grilled chicken chunks tossed in spicy peri-peri sauce, served over high-fiber brown rice and sautéed veggies.",
            "emoji": "🌶️",
            "image": "/salad_preview.png",
            "rating": 4.4,
            "bestseller": True
        },
        {
            "name": "Protein Rice Bowl",
            "price": 279,
            "veg": False,
            "healthy": True,
            "spicy": False,
            "description": "Lean chicken breast, egg whites, broccoli, and jasmine rice dressed in low-fat herb dressing.",
            "emoji": "🥚",
            "image": "/salad_preview.png",
            "rating": 4.3,
            "bestseller": False
        },
        {
            "name": "Healthy Veg Bowl",
            "price": 249,
            "veg": True,
            "healthy": True,
            "spicy": False,
            "description": "A nutrient-rich mix of paneer, quinoa, sweet potato, avocado slices, and light honey-mustard drizzle.",
            "emoji": "🥑",
            "image": "/salad_preview.png",
            "rating": 4.5,
            "bestseller": True
        },
        {
            "name": "Lite Veg Bowl",
            "price": 189,
            "veg": True,
            "healthy": True,
            "spicy": False,
            "description": "Low-carb zucchini noodles, cherry tomatoes, and bell peppers in a zesty basil-pesto dressing.",
            "emoji": "🥗",
            "image": "/salad_preview.png",
            "rating": 4.1,
            "bestseller": False
        }
    ],
    "rest_004": [
        {
            "name": "Farmhouse Pizza",
            "price": 299,
            "veg": True,
            "healthy": False,
            "spicy": False,
            "description": "Delightful combination of onion, capsicum, tomato, and grilled mushrooms on fresh hand-tossed crust.",
            "emoji": "🍕",
            "image": "/pizza_preview.png",
            "rating": 4.3,
            "bestseller": True
        },
        {
            "name": "Chicken Dominator",
            "price": 399,
            "veg": False,
            "healthy": False,
            "spicy": True,
            "description": "Loaded with double chicken tikka, peri peri chicken, chicken rashers, and spicy chicken sausage.",
            "emoji": "🍕",
            "image": "/pizza_preview.png",
            "rating": 4.5,
            "bestseller": True
        },
        {
            "name": "Cheese Burst Pizza",
            "price": 199,
            "veg": True,
            "healthy": False,
            "spicy": False,
            "description": "Classic single cheese pizza oozing with molten cream cheese filling inside the crust.",
            "emoji": "🧀",
            "image": "/pizza_preview.png",
            "rating": 4.1,
            "bestseller": False
        }
    ],
    "rest_005": [
        {
            "name": "Veg Sub",
            "price": 199,
            "veg": True,
            "healthy": True,
            "spicy": False,
            "description": "Crisp cucumber, lettuce, tomatoes, and dynamic custom house sauces on freshly baked honey oat bread.",
            "emoji": "🥖",
            "image": "/sub_preview.png",
            "rating": 4.0,
            "bestseller": False
        },
        {
            "name": "Chicken Tikka Sub",
            "price": 249,
            "veg": False,
            "healthy": True,
            "spicy": True,
            "description": "Tender chicken tikka slices marinated in spicy yogurt marinade, served with your favorite choice of fresh veggies.",
            "emoji": "🥖",
            "image": "/sub_preview.png",
            "rating": 4.4,
            "bestseller": True
        },
        {
            "name": "Mini Veg Sub",
            "price": 149,
            "veg": True,
            "healthy": True,
            "spicy": False,
            "description": "A smaller 4-inch version of our signature vegetable sub, perfect for a quick healthy snack.",
            "emoji": "🥪",
            "image": "/sub_preview.png",
            "rating": 4.2,
            "bestseller": False
        }
    ]
}


def get_addresses():
    return {
        "success": True,
        "data": MOCK_ADDRESSES
    }


def search_restaurants(address_id, query):
    query = query.lower()
    filtered = []

    for restaurant in MOCK_RESTAURANTS:
        if "biryani" in query and "biryani" in restaurant["name"].lower():
            filtered.append(restaurant)

        elif "pizza" in query and "pizza" in restaurant["name"].lower():
            filtered.append(restaurant)

        elif "healthy" in query and restaurant["name"] in [
            "The Bowl Company",
            "Subway"
        ]:
            filtered.append(restaurant)

    if not filtered:
        filtered = MOCK_RESTAURANTS[:3]

    for r in filtered:
        r["eta_display"] = f"{r['eta']} mins"

    return {
        "success": True,
        "data": filtered[:5]
    }


def search_dishes(address_id, intent):
    results = []
    fallback = []

    for restaurant_id, menu in MOCK_MENUS.items():
        restaurant = next(
            r for r in MOCK_RESTAURANTS
            if r["id"] == restaurant_id
        )

        for item in menu:
            match = True

            if intent.get("dish"):
                if intent["dish"].lower() not in item["name"].lower():
                    match = False

            if intent.get("budget") is not None:
                if item["price"] > intent["budget"]:
                    match = False

            if intent.get("veg") is not None:
                if item["veg"] != intent["veg"]:
                    match = False

            if intent.get("healthy"):
                if not item["healthy"]:
                    match = False

            if intent.get("spicy") is not None:
                if item["spicy"] != intent["spicy"]:
                    match = False

            if intent.get("quick"):
                if restaurant["eta"] > 25:
                    match = False

            dish_data = {
                "restaurant_id": restaurant_id,
                "restaurant_name": restaurant["name"],
                "item_name": item["name"],
                "price": item["price"],
                "eta": f"{restaurant['eta']} mins",
                "veg": item["veg"],
                "healthy": item.get("healthy", False),
                "spicy": item.get("spicy", False),
                "description": item.get("description", ""),
                "emoji": item.get("emoji", "🍲"),
                "image": item.get("image", "/biryani_preview.png"),
                "rating": item.get("rating", 4.2),
                "bestseller": item.get("bestseller", False),
                "cuisine": restaurant.get("cuisine", "Specialty"),
                "restaurant_gradient": restaurant.get("gradient", "")
            }

            if match:
                results.append(dish_data)
            else:
                fallback.append(dish_data)

    sort_order = intent.get("sort")
    limit = intent.get("limit", 8)

    reverse = sort_order == "desc"

    results = sorted(results, key=lambda x: x["price"], reverse=reverse)
    fallback = sorted(fallback, key=lambda x: x["price"], reverse=reverse)

    if results:
        return {
            "success": True,
            "data": results[:limit],
            "fallback": False
        }

    return {
        "success": True,
        "data": fallback[:limit],
        "fallback": True
    }


def get_menu(restaurant_id):
    menu = MOCK_MENUS.get(restaurant_id, [])

    formatted = []

    for item in menu:
        formatted.append({
            "name": item["name"],
            "price": item["price"],
            "veg": item["veg"],
            "healthy": item.get("healthy", False),
            "spicy": item.get("spicy", False),
            "description": item.get("description", ""),
            "emoji": item.get("emoji", "🍲"),
            "image": item.get("image", "/biryani_preview.png"),
            "rating": item.get("rating", 4.2),
            "bestseller": item.get("bestseller", False)
        })

    return {
        "success": True,
        "data": formatted
    }


def place_order(order_data):
    order_id = f"ORD-{random.randint(10000, 99999)}"

    return {
        "success": True,
        "data": {
            "order_id": order_id,
            "status": "Order Placed",
            "eta": "25 mins",
            "summary": order_data
        }
    }