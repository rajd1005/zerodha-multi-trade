const KiteConnect = require("kiteconnect").KiteConnect;

class KiteService {
    constructor(apiKey, accessToken) {
        this.kite = new KiteConnect({ api_key: apiKey });
        this.kite.setAccessToken(accessToken);
    }

    async placeRegularOrder(params) {
        try {
            return await this.kite.placeOrder("regular", params);
        } catch (error) {
            console.error("Order placement failed:", error.message);
            throw error;
        }
    }
    
    // You will add more methods here later: getLTP, modifyOrder, cancelOrder
}

module.exports = KiteService;
