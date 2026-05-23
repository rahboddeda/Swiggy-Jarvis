from mock_swiggy import get_addresses, search_restaurants, get_menu, place_order

print(get_addresses())
print(search_restaurants("addr_001", "chicken biryani"))
print(get_menu("rest_001"))
print(place_order({
    "restaurant": "Paradise Biryani",
    "item": "Chicken Biryani",
    "price": 329
}))