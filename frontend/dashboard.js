async function loadDashboard() {
    const response = await fetch("/api/analytics");
    const data = await response.json();

    if (!data.success) return;

    const analytics = data.analytics;
    const orders = data.orders;
    const chat = data.chat;

    // 1. KPI Cards
    const totalOrdersVal = analytics.total_orders || 0;
    document.getElementById("totalOrders").textContent = totalOrdersVal;

    document.getElementById("avgOrder").textContent =
        "₹" + Math.round(analytics.avg_order_value || 0);

    const topFoodName = getTopKey(analytics.most_ordered_food);
    document.getElementById("topFood").textContent = topFoodName;

    const topRestName = getTopKey(analytics.favorite_restaurants);
    document.getElementById("topRestaurant").textContent = topRestName;

    // 2. Circular Target Gauge Progress
    const targetDailyGoal = 5;
    const targetPct = Math.min(Math.round((totalOrdersVal / targetDailyGoal) * 100), 100);
    
    // Stroke circumference is 251.2 (for r=40: 2 * Math.PI * 40 = 251.2)
    const circleOffset = 251.2 - (251.2 * targetPct) / 100;
    
    setTimeout(() => {
        const gaugeCircle = document.getElementById("gaugeCircle");
        if (gaugeCircle) {
            gaugeCircle.style.strokeDashoffset = circleOffset;
        }
        const gaugePct = document.getElementById("gaugePct");
        if (gaugePct) {
            gaugePct.textContent = `${targetPct}%`;
        }
    }, 200);

    // 3. Dynamic Bar Chart (Choice Frequency)
    const barChartContainer = document.getElementById("barChartContainer");
    barChartContainer.innerHTML = "";

    const foodCounts = analytics.most_ordered_food || {};
    const foodsList = Object.keys(foodCounts);

    if (foodsList.length === 0) {
        barChartContainer.innerHTML = `
            <div style="font-size:12px; color:var(--text-secondary); text-align:center; padding:20px 0;">
                No gourmet order choices logged yet. Place orders to see choices chart.
            </div>
        `;
    } else {
        // Sort foods by count descending
        foodsList.sort((a, b) => foodCounts[b] - foodCounts[a]);
        const maxCount = foodCounts[foodsList[0]] || 1;

        foodsList.slice(0, 5).forEach(food => {
            const count = foodCounts[food];
            const pct = Math.round((count / maxCount) * 100);

            const row = document.createElement("div");
            row.className = "chart-bar-row";
            row.innerHTML = `
                <div class="bar-label">${food}</div>
                <div class="bar-track">
                    <div class="bar-fill" style="width: 0%;"></div>
                </div>
                <div class="bar-val">${count} qty</div>
            `;
            barChartContainer.appendChild(row);

            // Animate bar fill width
            setTimeout(() => {
                row.querySelector(".bar-fill").style.width = `${pct}%`;
            }, 150);
        });
    }

    // 4. Recent Transactions List
    const ordersList = document.getElementById("ordersList");
    ordersList.innerHTML = "";

    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div style="font-size:12px; color:var(--text-secondary); text-align:center; padding:20px 0;">
                No transaction items logged yet.
            </div>
        `;
    } else {
        orders.slice().reverse().forEach(order => {
            const div = document.createElement("div");
            div.className = "history-item";

            div.innerHTML = `
                <div class="history-item-left">
                    <strong>${order.summary.item}</strong>
                    <span>🏨 ${order.summary.restaurant} • ID: ${order.order_id}</span>
                </div>
                <div class="history-item-right">
                    ₹${order.summary.price}
                </div>
            `;

            ordersList.appendChild(div);
        });
    }

    // 5. Chat History List
    const chatList = document.getElementById("chatList");
    chatList.innerHTML = "";

    if (chat.length === 0) {
        chatList.innerHTML = `
            <div style="font-size:12px; color:var(--text-secondary); text-align:center; padding:20px 0;">
                No conversational logs logged yet.
            </div>
        `;
    } else {
        chat.slice(-15).reverse().forEach(msg => {
            const div = document.createElement("div");
            div.className = "chat-history-item";

            const isUser = msg.role === "user";
            const badgeClass = isUser ? "chat-role-badge user" : "chat-role-badge jarvis";
            const roleName = isUser ? "You" : "Jarvis";

            div.innerHTML = `
                <div class="${badgeClass}">${roleName}</div>
                <div class="chat-msg-text">${msg.message}</div>
            `;

            chatList.appendChild(div);
        });
    }
}


function getTopKey(obj) {
    if (!obj || Object.keys(obj).length === 0) return "-";

    return Object.keys(obj).reduce((a, b) =>
        obj[a] > obj[b] ? a : b
    );
}

loadDashboard();