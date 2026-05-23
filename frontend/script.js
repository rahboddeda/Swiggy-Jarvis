const chatMessages = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const typingIndicator = document.getElementById("typingIndicator");

const API_URL = window.location.origin;

let isProcessing = false;

// Visual workspace content pointers
const portalDynamicContent = document.getElementById("portalDynamicContent");
const emptyPortalState = document.getElementById("emptyPortalState");
const orderConfetti = document.getElementById("orderConfetti");

// Cart Elements
const cartSheet = document.getElementById("cartSheet");
const cartItemsList = document.getElementById("cartItemsList");
const cartCloseBtn = document.getElementById("cartCloseBtn");
const cartCheckoutBtn = document.getElementById("cartCheckoutBtn");

const billSubtotal = document.getElementById("billSubtotal");
const billDelivery = document.getElementById("billDelivery");
const billTax = document.getElementById("billTax");
const billGrandTotal = document.getElementById("billGrandTotal");

// Mobile Layout Toggles
const appWrapper = document.getElementById("appWrapper");
const tabBtnChat = document.getElementById("tabBtnChat");
const tabBtnPortal = document.getElementById("tabBtnPortal");
const portalTabBadge = document.getElementById("portalTabBadge");

// Voice & Mic Elements
const voiceMicBtn = document.getElementById("voiceMicBtn");
const voiceWaveContainer = document.getElementById("voiceWaveContainer");

// Local Cart & Search States
let cart = {
    restaurant: null,
    deliveryFee: 0,
    items: {} // maps item_name -> { price, quantity, emoji, image }
};

let currentWorkspaceItems = []; // Keeps track of active lists for instant filters
let currentWorkspaceViewType = "none"; // "restaurants", "dishes", "menu"
let currentRestaurantDetails = null; // store restaurant information in details mode
let activeFilters = {
    veg: false,
    rating: false,
    lowPrice: false,
    healthy: false,
    bestseller: false
};

// ---------------------------------
// SOUND ENGINE REMOVED (NO-OP)
// ---------------------------------
function playUISound(type) {
    // All UI sound effects completely removed per user request
}

// Set timestamps on startup
document.getElementById("initTimestamp").textContent = getTime();

// ---------------------------------
// MOBILE UI CONTROLS & AUTO SWITCHES
// ---------------------------------
tabBtnChat.addEventListener("click", () => {
    appWrapper.className = "app-wrapper view-chat";
    tabBtnChat.classList.add("active");
    tabBtnPortal.classList.remove("active");
});

tabBtnPortal.addEventListener("click", () => {
    appWrapper.className = "app-wrapper view-portal";
    tabBtnPortal.classList.add("active");
    tabBtnChat.classList.remove("active");
    
    // Clear badge when user views the portal
    portalTabBadge.classList.remove("active");
});

function autoSwitchToPortalOnMobile() {
    if (window.innerWidth <= 960) {
        appWrapper.className = "app-wrapper view-portal";
        tabBtnPortal.classList.add("active");
        tabBtnChat.classList.remove("active");
        
        // Clear badge since we navigated there
        portalTabBadge.classList.remove("active");
    }
}

function triggerMobileTabBadge() {
    // Only pulse badge if user is currently looking at the Chat view
    if (window.innerWidth <= 960 && appWrapper.classList.contains("view-chat")) {
        portalTabBadge.classList.add("active");
    }
}

// ---------------------------------
// AUXILIARY UTILITIES
// ---------------------------------
function getTime() {
    return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function setLoading(isLoading) {
    isProcessing = isLoading;
    typingIndicator.classList.toggle("hidden", !isLoading);
    sendBtn.disabled = isLoading;
    messageInput.disabled = isLoading;
}

function addMessage(text, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;

    messageDiv.innerHTML = `
        <span class="sender-tag">${sender === 'user' ? 'You' : 'Jarvis'}</span>
        <div class="bubble">${text}</div>
        <span class="timestamp">${getTime()}</span>
    `;

    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// ---------------------------------
// VOICE COMMAND SIMULATOR
// ---------------------------------
voiceMicBtn.addEventListener("click", () => {
    if (voiceWaveContainer.classList.contains("active")) {
        voiceWaveContainer.classList.remove("active");
        voiceMicBtn.classList.remove("active");
        return;
    }

    voiceWaveContainer.classList.add("active");
    voiceMicBtn.classList.add("active");

    const prompts = [
        "Suggest a spicy chicken biryani from Paradise Biryani",
        "Show me healthy dinner bowls under 300 rupees",
        "Order cheapest pizza from Domino's Pizza",
        "Find me a good vegetarian lunch from Subway",
        "Cheapest non veg dish under 250"
    ];

    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    setTimeout(() => {
        if (!voiceWaveContainer.classList.contains("active")) return;
        
        messageInput.value = randomPrompt;
        voiceWaveContainer.classList.remove("active");
        voiceMicBtn.classList.remove("active");
        
        sendMessage();
    }, 2800);
});

// ---------------------------------
// CART CALCULATOR & RENDER
// ---------------------------------
function addToCart(itemName, price, emoji, image, restaurantName, deliveryFee) {
    // Manage restaurant mismatch
    if (cart.restaurant && cart.restaurant !== restaurantName) {
        // Clear cart for new restaurant
        cart.items = {};
        addMessage(`🔄 <i>Cart updated. Switched selection to ${restaurantName}</i>`, "bot");
    }

    cart.restaurant = restaurantName;
    cart.deliveryFee = deliveryFee;

    if (!cart.items[itemName]) {
        cart.items[itemName] = { price, quantity: 0, emoji, image };
    }

    cart.items[itemName].quantity += 1;
    updateCartUI();
    
    // Notify on mobile
    triggerMobileTabBadge();
}

function updateCartQuantity(itemName, delta) {
    if (!cart.items[itemName]) return;

    cart.items[itemName].quantity += delta;

    if (cart.items[itemName].quantity <= 0) {
        delete cart.items[itemName];
    }

    // If cart is empty, reset restaurant info
    if (Object.keys(cart.items).length === 0) {
        cart.restaurant = null;
        cart.deliveryFee = 0;
    }

    updateCartUI();
}

function updateCartUI() {
    const itemKeys = Object.keys(cart.items);
    
    if (itemKeys.length === 0) {
        cartSheet.classList.remove("active");
        syncQuantitySelectors();
        return;
    }

    cartItemsList.innerHTML = "";
    let subtotal = 0;

    itemKeys.forEach(name => {
        const item = cart.items[name];
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const row = document.createElement("div");
        row.className = "cart-item-row";
        row.innerHTML = `
            <div class="cart-item-left">
                <span>${item.emoji || '🍲'}</span>
                <span>${name}</span>
            </div>
            <div class="cart-item-right">
                <div class="cart-qty-counter">
                    <span onclick="updateCartQuantity('${name}', -1)">−</span>
                    <span>${item.quantity}</span>
                    <span onclick="updateCartQuantity('${name}', 1)">+</span>
                </div>
                <span class="cart-item-price">₹${itemTotal}</span>
            </div>
        `;
        cartItemsList.appendChild(row);
    });

    const taxVal = Math.round(subtotal * 0.05);
    const grandVal = subtotal + cart.deliveryFee + taxVal;

    billSubtotal.textContent = `₹${subtotal}`;
    billDelivery.textContent = `₹${cart.deliveryFee}`;
    billTax.textContent = `₹${taxVal}`;
    billGrandTotal.textContent = `₹${grandVal}`;

    cartSheet.classList.add("active");
    syncQuantitySelectors();
}

cartCloseBtn.addEventListener("click", () => {
    cartSheet.classList.remove("active");
});

// Synchronize selectors on visual grid cards with current cart counts
function syncQuantitySelectors() {
    document.querySelectorAll(".swiggy-add-btn-container").forEach(container => {
        const name = container.dataset.itemName;
        const price = parseInt(container.dataset.itemPrice);
        const emoji = container.dataset.itemEmoji;
        const image = container.dataset.itemImage;
        const restName = container.dataset.restaurantName;
        const delFee = parseInt(container.dataset.deliveryFee);

        const currentQty = cart.items[name] ? cart.items[name].quantity : 0;

        if (currentQty > 0) {
            container.innerHTML = `
                <div class="swiggy-qty-btn">
                    <span onclick="event.stopPropagation(); updateCartQuantity('${name}', -1)">−</span>
                    <span class="qty-value">${currentQty}</span>
                    <span onclick="event.stopPropagation(); updateCartQuantity('${name}', 1)">+</span>
                </div>
            `;
        } else {
            container.innerHTML = `
                <button type="button" class="swiggy-add-btn" onclick="event.stopPropagation(); addToCart('${name}', ${price}, '${emoji}', '${image}', '${restName}', ${delFee})">
                    ADD +
                </button>
            `;
        }
    });
}

// ---------------------------------
// CLIENT FILTER PILLS
// ---------------------------------
document.querySelectorAll(".filter-pill").forEach(pill => {
    pill.addEventListener("click", () => {
        const filterType = pill.dataset.filter;
        activeFilters[filterType] = !activeFilters[filterType];
        pill.classList.toggle("active", activeFilters[filterType]);
        
        applyWorkspaceFilters();
    });
});

function applyWorkspaceFilters() {
    if (currentWorkspaceViewType === "none" || currentWorkspaceItems.length === 0) return;

    let filtered = [...currentWorkspaceItems];

    if (currentWorkspaceViewType === "restaurants") {
        if (activeFilters.veg) {
            filtered = filtered.filter(r => r.id !== 'rest_002'); // Behrouz has mostly non-veg
        }
        if (activeFilters.rating) {
            filtered = filtered.filter(r => r.rating >= 4.3);
        }
        if (activeFilters.lowPrice) {
            filtered.sort((a, b) => a.cost_for_two - b.cost_for_two);
        }
        renderRestaurantGrid(filtered);
    } 
    else if (currentWorkspaceViewType === "dishes") {
        if (activeFilters.veg) {
            filtered = filtered.filter(d => d.veg === true);
        }
        if (activeFilters.rating) {
            filtered = filtered.filter(d => (d.rating || 4.2) >= 4.3);
        }
        if (activeFilters.healthy) {
            filtered = filtered.filter(d => d.healthy === true);
        }
        if (activeFilters.bestseller) {
            filtered = filtered.filter(d => d.bestseller === true);
        }
        if (activeFilters.lowPrice) {
            filtered.sort((a, b) => a.price - b.price);
        }
        renderDishesList(filtered);
    }
    else if (currentWorkspaceViewType === "menu") {
        if (activeFilters.veg) {
            filtered = filtered.filter(item => item.veg === true);
        }
        if (activeFilters.rating) {
            filtered = filtered.filter(item => (item.rating || 4.2) >= 4.3);
        }
        if (activeFilters.healthy) {
            filtered = filtered.filter(item => item.healthy === true);
        }
        if (activeFilters.bestseller) {
            filtered = filtered.filter(item => item.bestseller === true);
        }
        if (activeFilters.lowPrice) {
            filtered.sort((a, b) => a.price - b.price);
        }
        renderMenuDetails(currentRestaurantDetails, filtered);
    }
}

// ---------------------------------
// PORTAL WORKSPACE RENDER ENGINE (Dish Photos)
// ---------------------------------
function setWorkspaceContent(html) {
    emptyPortalState.style.display = "none";
    portalDynamicContent.innerHTML = html;
    syncQuantitySelectors();
}

function renderRestaurantGrid(restaurants) {
    let html = `<div class="restaurants-grid">`;
    restaurants.forEach(r => {
        const bgGrad = r.gradient || "linear-gradient(135deg, #FF9F43 0%, #FF5252 100%)";
        const cuisineList = r.cuisine || "Indian, Fast Food";
        const etaText = r.eta_display || `${r.eta} mins`;
        const starClass = r.rating >= 4.3 ? 'rating-badge' : 'rating-badge orange';
        
        html += `
            <div class="restaurant-card" onclick="selectRestaurant('${r.id}')">
                <div class="card-visual-header" style="background: ${bgGrad}">
                    <span class="card-visual-emoji">🏨</span>
                </div>
                <div class="restaurant-card-content">
                    <h3>${r.name}</h3>
                    <div class="cuisine">${cuisineList}</div>
                    <div class="restaurant-card-meta">
                        <span class="${starClass}">⭐ ${r.rating}</span>
                        <span>${etaText}</span>
                        <span>₹${r.cost_for_two || 300} for two</span>
                    </div>
                </div>
            </div>
        `;
    });
    html += `</div>`;
    setWorkspaceContent(html);
}

function renderDishesList(dishes) {
    let html = `<div class="dishes-list-container">`;
    dishes.forEach(d => {
        const bestsellerHTML = d.bestseller ? `<span class="bestseller-badge">★ Bestseller</span>` : '';
        const vegHTML = d.veg ? `<div class="veg-badge"><span class="dot"></span></div>` : `<div class="nonveg-badge"><span class="dot"></span></div>`;
        const ratingHTML = d.rating ? `<span class="dish-rating">⭐ ${d.rating}</span>` : `<span class="dish-rating">⭐ 4.2</span>`;
        const healthyHTML = d.healthy ? `<span class="bestseller-badge" style="background:#E2F7E1; color:#2E7D32;">🥑 Healthy</span>` : '';
        const spicyHTML = d.spicy ? `<span class="bestseller-badge" style="background:#FFEAEA; color:#C62828;">🌶️ Spicy</span>` : '';
        const previewImage = d.image || "/biryani_preview.png";

        html += `
            <div class="dish-card">
                <div class="dish-card-left">
                    <div class="dish-badges">
                        ${vegHTML}
                        ${bestsellerHTML}
                        ${healthyHTML}
                        ${spicyHTML}
                    </div>
                    <h3>${d.item_name}</h3>
                    <div class="dish-price">₹${d.price}</div>
                    ${ratingHTML}
                    <p class="dish-description">${d.description || 'Delicious freshly-made premium selection, prepared with absolute hygiene and premium hand-picked ingredients.'}</p>
                    <span class="dish-restaurant-origin">From <b>${d.restaurant_name}</b> • ${d.eta}</span>
                </div>
                <div class="dish-card-right">
                    <img src="${previewImage}" class="dish-visual-img" alt="${d.item_name}" />
                    <div class="swiggy-add-btn-container" 
                         data-item-name="${d.item_name}" 
                         data-item-price="${d.price}"
                         data-item-emoji="${d.emoji || '🍲'}"
                         data-item-image="${previewImage}"
                         data-restaurant-name="${d.restaurant_name}"
                         data-delivery-fee="40">
                    </div>
                </div>
            </div>
        `;
    });
    html += `</div>`;
    setWorkspaceContent(html);
}

function renderMenuDetails(restaurantName, menuItems) {
    let headerHTML = `
        <div class="restaurant-details-header">
            <h2>${restaurantName}</h2>
            <p class="restaurant-cuisine">Gourmet Specalties • Premium Quality Kitchen</p>
            <div class="restaurant-meta-row">
                <div class="rating-badge-pill">⭐ 4.4</div>
                <div class="meta-item">25 mins <div class="meta-sub">Delivery ETA</div></div>
                <div class="meta-item">₹350 <div class="meta-sub">Cost for two</div></div>
            </div>
        </div>
    `;

    let listHTML = `<div class="dishes-list-container">`;
    menuItems.forEach(item => {
        const bestsellerHTML = item.bestseller ? `<span class="bestseller-badge">★ Bestseller</span>` : '';
        const vegHTML = item.veg ? `<div class="veg-badge"><span class="dot"></span></div>` : `<div class="nonveg-badge"><span class="dot"></span></div>`;
        const ratingHTML = item.rating ? `<span class="dish-rating">⭐ ${item.rating}</span>` : `<span class="dish-rating">⭐ 4.2</span>`;
        const healthyHTML = item.healthy ? `<span class="bestseller-badge" style="background:#E2F7E1; color:#2E7D32;">🥑 Healthy</span>` : '';
        const spicyHTML = item.spicy ? `<span class="bestseller-badge" style="background:#FFEAEA; color:#C62828;">🌶️ Spicy</span>` : '';
        const previewImage = item.image || "/biryani_preview.png";

        listHTML += `
            <div class="dish-card">
                <div class="dish-card-left">
                    <div class="dish-badges">
                        ${vegHTML}
                        ${bestsellerHTML}
                        ${healthyHTML}
                        ${spicyHTML}
                    </div>
                    <h3>${item.name}</h3>
                    <div class="dish-price">₹${item.price}</div>
                    ${ratingHTML}
                    <p class="dish-description">${item.description || 'Rich traditional signature recipes cooked to perfection under stringent safety levels.'}</p>
                </div>
                <div class="dish-card-right">
                    <img src="${previewImage}" class="dish-visual-img" alt="${item.name}" />
                    <div class="swiggy-add-btn-container" 
                         data-item-name="${item.name}" 
                         data-item-price="${item.price}"
                         data-item-emoji="${item.emoji || '🍲'}"
                         data-item-image="${previewImage}"
                         data-restaurant-name="${restaurantName}"
                         data-delivery-fee="35">
                    </div>
                </div>
            </div>
        `;
    });
    listHTML += `</div>`;

    setWorkspaceContent(headerHTML + listHTML);
}

// ---------------------------------
// DELIVERY TRACKER SIMULATOR
// ---------------------------------
function runDeliverySimulator(itemSummary, orderId) {
    autoSwitchToPortalOnMobile();

    let trackingHTML = `
        <div class="order-tracking-card">
            <div class="tracking-header">
                <h2>🍔 Live Order Tracking</h2>
                <span class="tracking-id">ID: ${orderId}</span>
            </div>

            <!-- Transit motorcycle map row -->
            <div class="delivery-transit-lane">
                <div class="delivery-track-line"></div>
                <div class="delivery-track-progress" id="trackProgress"></div>
                <div class="delivery-motorcycle" id="trackMotorcycle">🛵</div>
            </div>

            <!-- Steps checklist -->
            <div class="tracking-timeline">
                <div class="timeline-step completed" id="stepPlaced">
                    <div class="step-circle">✓</div>
                    <div class="step-content">
                        <span class="step-title">Order Confirmed</span>
                        <span class="step-desc">Your order for [<b>${itemSummary}</b>] has been accepted by the kitchen</span>
                    </div>
                </div>
                <div class="timeline-step active" id="stepPrep">
                    <div class="step-circle">🍳</div>
                    <div class="step-content">
                        <span class="step-title">Preparing Your Feast</span>
                        <span class="step-desc">Masterchef is cooking your gourmet meal to perfection</span>
                    </div>
                </div>
                <div class="timeline-step" id="stepTransit">
                    <div class="step-circle">🛵</div>
                    <div class="step-content">
                        <span class="step-title">Out for Delivery</span>
                        <span class="step-desc">Our superfast delivery partner is zooming towards your location</span>
                    </div>
                </div>
                <div class="timeline-step" id="stepArrived">
                    <div class="step-circle">🎁</div>
                    <div class="step-content">
                        <span class="step-title">Arrived at Doorstep</span>
                        <span class="step-desc">Order handed over! Relish your hot delicious meal!</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    setWorkspaceContent(trackingHTML);

    const motorcycle = document.getElementById("trackMotorcycle");
    const progress = document.getElementById("trackProgress");

    const stepPrep = document.getElementById("stepPrep");
    const stepTransit = document.getElementById("stepTransit");
    const stepArrived = document.getElementById("stepArrived");

    // Phase 1: Preparation (1s to 4s)
    setTimeout(() => {
        if (!motorcycle) return;
        progress.style.width = "40%";
        motorcycle.style.left = "40%";
        
        stepPrep.className = "timeline-step completed";
        stepPrep.querySelector(".step-circle").textContent = "✓";
        
        stepTransit.className = "timeline-step active";
    }, 3000);

    // Phase 2: Dispatch Transit (4s to 7s)
    setTimeout(() => {
        if (!motorcycle) return;
        progress.style.width = "85%";
        motorcycle.style.left = "85%";
        
        stepTransit.className = "timeline-step completed";
        stepTransit.querySelector(".step-circle").textContent = "✓";
        
        stepArrived.className = "timeline-step active";
    }, 6000);

    // Phase 3: Arrived & Confetti celebration (7s)
    setTimeout(() => {
        if (!motorcycle) return;
        progress.style.width = "100%";
        motorcycle.style.left = "100%";
        motorcycle.textContent = "🍔";
        
        stepArrived.className = "timeline-step completed";
        stepArrived.querySelector(".step-circle").textContent = "✓";
        
        triggerConfettiCascade();
        addMessage(`🎉 <b>Delicious update!</b> Your order for <b>${itemSummary}</b> has arrived hot! Bon appétit!`, "bot");
    }, 9000);
}

// Confetti burst logic
function triggerConfettiCascade() {
    const confetti = document.getElementById("orderConfetti");
    confetti.classList.remove("hidden");
    confetti.innerHTML = "";

    const colors = ["#FC8019", "#60B246", "#FF9F43", "#38BDF8", "#EC4899", "#EAB308"];

    for (let i = 0; i < 60; i++) {
        const p = document.createElement("div");
        p.className = "confetti-particle";
        p.style.setProperty("--left", Math.random() * 100 + "%");
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.animationDelay = Math.random() * 2 + "s";
        p.style.transform = `scale(${Math.random() * 0.6 + 0.5})`;
        confetti.appendChild(p);
    }

    setTimeout(() => {
        confetti.classList.add("hidden");
        confetti.innerHTML = "";
    }, 6000);
}

// ---------------------------------
// SYSTEM NETWORKING (API HANDLERS)
// ---------------------------------
async function sendRequest(body) {
    try {
        setLoading(true);

        const response = await fetch(`${API_URL}/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        setLoading(false);
        return data;

    } catch (error) {
        setLoading(false);
        console.error("Backend interaction failed:", error);
        return {
            success: false
        };
    }
}

async function selectRestaurant(id) {
    const data = await sendRequest({
        action: "select_restaurant",
        payload: {
            restaurant_id: id
        }
    });

    if (data.success && data.type === "menu") {
        currentWorkspaceViewType = "menu";
        currentRestaurantDetails = data.restaurant;
        currentWorkspaceItems = data.data; // Store raw items list
        
        applyWorkspaceFilters(); // Applies filters & renders menu
        autoSwitchToPortalOnMobile();
    }
}

async function selectDishDirect(itemName) {
    const data = await sendRequest({
        action: "select_dish_direct",
        payload: {
            item_name: itemName
        }
    });

    if (data.success && data.type === "confirmation") {
        addConfirmation(data.data);
    }
}

async function selectMenuItem(itemName) {
    const data = await sendRequest({
        action: "select_menu_item",
        payload: {
            item_name: itemName
        }
    });

    if (data.success && data.type === "confirmation") {
        addConfirmation(data.data);
    }
}

async function confirmOrder() {
    const data = await sendRequest({
        action: "confirm_order"
    });

    if (data.success && data.type === "order_success") {
        cart = { restaurant: null, deliveryFee: 0, items: {} }; // Clear cart
        updateCartUI(); // Closes sheet
        
        runDeliverySimulator(data.data.summary.item, data.data.order_id);
    }
}

// Render bot order-confirmation block with Checkout CTA
function addConfirmation(order) {
    const wrapper = document.createElement("div");
    wrapper.className = "message bot";

    wrapper.innerHTML = `
        <span class="sender-tag">Jarvis</span>
        <div class="bubble">
            <b>Confirm Order?</b><br><br>
            🏨 Restaurant: <b>${order.restaurant}</b><br>
            🍲 Gourmet Item: <b>${order.item}</b><br>
            💰 Value: <b>₹${order.price}</b><br><br>
            <button type="button" class="confirm-order-btn" style="width:100%; border:none; background:linear-gradient(135deg, #60B246, #85E060); color:white; padding:12px; border-radius:12px; font-weight:800; cursor:pointer; box-shadow:0 6px 15px rgba(96,178,70,0.25);">
                Place Order via Swiggy Jarvis ➔
            </button>
        </div>
        <span class="timestamp">${getTime()}</span>
    `;

    chatMessages.appendChild(wrapper);
    scrollToBottom();

    wrapper.querySelector(".confirm-order-btn")
        .addEventListener("click", async function(e) {
            e.preventDefault();
            e.stopPropagation();
            await confirmOrder();
        });
}

// PLACING MULTIPLE ORDERS AT ONCE (Consolidated checkout API call)
cartCheckoutBtn.addEventListener("click", async () => {
    const cartKeys = Object.keys(cart.items);
    if (cartKeys.length === 0) return;

    cartSheet.classList.remove("active");

    const consolidatedItemsText = cartKeys.map(name => `${name} x${cart.items[name].quantity}`).join(", ");
    
    // Add visual Jarvis bubble
    addMessage(`Placing cart order for: ${consolidatedItemsText}`, "user");

    try {
        setLoading(true);

        const response = await fetch(`${API_URL}/api/place-cart-order`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                restaurant: cart.restaurant,
                items: cart.items
            })
        });

        const data = await response.json();
        setLoading(false);

        if (data.success && data.type === "order_success") {
            // Reset shopping cart state
            cart = { restaurant: null, deliveryFee: 0, items: {} };
            updateCartUI();
            
            // Run tracker timeline simulator
            runDeliverySimulator(consolidatedItemsText, data.data.order_id);
        } else {
            addMessage("⚠️ Failed to checkout cart items. Please try again.", "bot");
        }

    } catch (error) {
        setLoading(false);
        console.error("Cart checkout API failed:", error);
        addMessage("⚠️ Backend connection failed while submitting cart items.", "bot");
    }
});

// Main Send Button Action
async function sendMessage() {
    if (isProcessing) return;

    const message = messageInput.value.trim();
    if (!message) return;

    addMessage(message, "user");
    messageInput.value = "";

    const data = await sendRequest({
        message
    });

    if (!data.success) {
        addMessage("⚠️ Connection to Swiggy Jarvis service failed. Please check your backend connection.", "bot");
        return;
    }

    if (data.type === "restaurants") {
        currentWorkspaceViewType = "restaurants";
        currentWorkspaceItems = data.data; // Store items list
        
        applyWorkspaceFilters(); // Filter & render restaurants
        autoSwitchToPortalOnMobile();
        addMessage(`I found <b>${data.data.length} premium restaurants</b> matching your query in Madhapur. Check them out on the Swiggy Portal!`, "bot");
    }
    else if (data.type === "dishes") {
        currentWorkspaceViewType = "dishes";
        currentWorkspaceItems = data.data; // Store items list
        
        applyWorkspaceFilters(); // Filter & render dishes
        autoSwitchToPortalOnMobile();
        addMessage(`I discovered delicious matching options in your area! Visual dish listings are loaded in your Swiggy Portal.`, "bot");
    }
    else if (data.type === "menu") {
        currentWorkspaceViewType = "menu";
        currentRestaurantDetails = data.restaurant;
        currentWorkspaceItems = data.data; // Store items list
        
        applyWorkspaceFilters(); // Filter & render menu
        autoSwitchToPortalOnMobile();
        addMessage(`The gourmet menu of <b>${data.restaurant}</b> is now loaded. Tap ADD on the right to start customizing your cart!`, "bot");
    }
    else if (data.type === "confirmation") {
        addConfirmation(data.data);
    }
    else if (data.type === "order_success") {
        cart = { restaurant: null, deliveryFee: 0, items: {} };
        updateCartUI();
        runDeliverySimulator(data.data.summary.item, data.data.order_id);
    }
    else if (data.type === "chat") {
        addMessage(data.reply, "bot");
    }
    else {
        addMessage("Received unexpected service event.", "bot");
    }
}

function quickPrompt(text) {
    if (isProcessing) return;
    messageInput.value = text;
    sendMessage();
}

// ---------------------------------
// EVENT BINDINGS
// ---------------------------------
sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && !isProcessing) {
        e.preventDefault();
        sendMessage();
    }
});

clearBtn.addEventListener("click", async function(e) {
    e.preventDefault();
    e.stopPropagation();

    try {
        const response = await fetch(`${API_URL}/clear-memory`, {
            method: "POST"
        });

        const data = await response.json();

        if (data.success) {
            chatMessages.innerHTML = "";
            addMessage("Conversation cleared. Swiggy Jarvis is ready to serve you fresh again!", "bot");
            cart = { restaurant: null, deliveryFee: 0, items: {} };
            updateCartUI();
            
            // Reset portal
            currentWorkspaceItems = [];
            currentWorkspaceViewType = "none";
            portalDynamicContent.innerHTML = `
                <div class="empty-portal-state" id="emptyPortalState">
                    <div class="visual-icon">🌍</div>
                    <h2>Your Swiggy Portal is ready</h2>
                    <p>Tell Jarvis what you'd like to eat, or click suggestions on the left, and watch gourmet options appear here instantly!</p>
                </div>
            `;
        }

    } catch (error) {
        console.error(error);
        addMessage("Failed to clear chat memory.", "bot");
    }
});