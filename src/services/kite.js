const KiteConnect = require("kiteconnect").KiteConnect;
const KiteTicker = require("kiteconnect").KiteTicker;

class KiteService {
    constructor(apiKey, accessToken) {
        this.kite = new KiteConnect({ api_key: apiKey });
        this.kite.setAccessToken(accessToken);
        this.apiKey = apiKey;
        this.accessToken = accessToken;
        this.ticker = null;
    }

    async placeRegularOrder(params) {
        try {
            return await this.kite.placeOrder("regular", params);
        } catch (error) {
            console.error("Order placement failed:", error.message);
            throw error;
        }
    }

    // New Method: Initialize WebSocket for Live LTP
    initTicker(instrumentTokens, onTickCallback) {
        this.ticker = new KiteTicker({
            api_key: this.apiKey,
            access_token: this.accessToken
        });

        this.ticker.connect();

        this.ticker.on("ticks", (ticks) => {
            // Ticks contain the live LTP data. We pass it to the callback function
            // where our Trailing SL and Target logic will be handled.
            if (onTickCallback && typeof onTickCallback === 'function') {
                onTickCallback(ticks);
            }
        });

        this.ticker.on("connect", () => {
            console.log("WebSocket connected. Subscribing to instruments...");
            this.ticker.subscribe(instrumentTokens);
            this.ticker.setMode(this.ticker.modeFull, instrumentTokens);
        });

        this.ticker.on("disconnect", () => {
            console.log("WebSocket disconnected.");
        });

        this.ticker.on("error", (error) => {
            console.error("WebSocket error:", error.message);
        });
    }

    // Method to modify an existing order (used for Trailing SL)
    async modifyOrder(orderId, params) {
        try {
            return await this.kite.modifyOrder("regular", orderId, params);
        } catch (error) {
            console.error("Order modification failed:", error.message);
            throw error;
        }
    }

    // Method to exit/cancel an order (used when Target is hit)
    async cancelOrder(orderId) {
        try {
            return await this.kite.cancelOrder("regular", orderId);
        } catch (error) {
            console.error("Order cancellation failed:", error.message);
            throw error;
        }
    }
}

// Fetch available funds/margins
    async getMargins() {
        try {
            return await this.kite.getMargins();
        } catch (error) {
            console.error("Failed to fetch margins:", error.message);
            throw error;
        }
    }

    // Fetch live positions
    async getPositions() {
        try {
            return await this.kite.getPositions();
        } catch (error) {
            console.error("Failed to fetch positions:", error.message);
            throw error;
        }
    }

    // Fetch all active instruments (symbols, strike prices, tokens)
    async getInstruments(exchange) {
        try {
            // Exchange can be 'NFO', 'NSE', 'BSE', 'MCX'
            return await this.kite.getInstruments(exchange);
        } catch (error) {
            console.error("Failed to fetch instruments:", error.message);
            throw error;
        }
    }

module.exports = KiteService;
