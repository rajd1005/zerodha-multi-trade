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

    initTicker(instrumentTokens, onTickCallback) {
        this.ticker = new KiteTicker({
            api_key: this.apiKey,
            access_token: this.accessToken
        });

        this.ticker.connect();

        this.ticker.on("ticks", (ticks) => {
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

    async modifyOrder(orderId, params) {
        try {
            return await this.kite.modifyOrder("regular", orderId, params);
        } catch (error) {
            console.error("Order modification failed:", error.message);
            throw error;
        }
    }

    async cancelOrder(orderId) {
        try {
            return await this.kite.cancelOrder("regular", orderId);
        } catch (error) {
            console.error("Order cancellation failed:", error.message);
            throw error;
        }
    }

    async getMargins() {
        try {
            return await this.kite.getMargins();
        } catch (error) {
            console.error("Failed to fetch margins:", error.message);
            throw error;
        }
    }

    async getPositions() {
        try {
            return await this.kite.getPositions();
        } catch (error) {
            console.error("Failed to fetch positions:", error.message);
            throw error;
        }
    }

    async getInstruments(exchange) {
        try {
            return await this.kite.getInstruments(exchange);
        } catch (error) {
            console.error("Failed to fetch instruments:", error.message);
            throw error;
        }
    }

    // NEW: Fetch Live LTP for an array of instruments (e.g., ["NSE:INFY", "NFO:NIFTY24MAY22000CE"])
    async getLTP(instruments) {
        try {
            return await this.kite.getLTP(instruments);
        } catch (error) {
            console.error("Failed to fetch LTP:", error.message);
            throw error;
        }
    }

} // <--- Class properly closes here

module.exports = KiteService;
