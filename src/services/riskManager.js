const User = require('../models/User');
const KiteService = require('./kite');

const checkRiskLimits = async (userId, linkedAccounts) => {
    const user = await User.findById(userId);
    
    if (!user) throw new Error("User not found");

    const { maxLossPerDay, maxProfitPerDay } = user;

    // If both limits are 0, risk management is disabled for this user
    if (maxLossPerDay === 0 && maxProfitPerDay === 0) {
        return true;
    }

    let totalMtm = 0;

    // Calculate total MTM across all linked Zerodha accounts
    for (const account of linkedAccounts) {
        try {
            const kite = new KiteService(account.apiKey, account.accessToken);
            const positions = await kite.getPositions();

            // Zerodha returns net and day positions. We check net to get overall P&L
            const netPositions = positions.net || [];
            
            let accountMtm = 0;
            netPositions.forEach(pos => {
                accountMtm += pos.m2m; // m2m is the Mark to Market field in Zerodha's API
            });

            totalMtm += accountMtm;
        } catch (error) {
            console.error(`Failed to fetch positions for account ${account.accountAlias}:`, error.message);
            // Block trading if we can't verify the MTM (Safety first)
            throw new Error(`Risk Manager could not verify MTM for account: ${account.accountAlias}. Trade blocked for safety.`);
        }
    }

    console.log(`Current Total MTM for user ${user.email}: ₹${totalMtm}`);

    // Check Max Loss Limit (Ensure we treat maxLoss as a negative number)
    if (maxLossPerDay > 0 && totalMtm <= -Math.abs(maxLossPerDay)) {
        throw new Error(`Maximum daily loss limit (₹${maxLossPerDay}) reached. Trading disabled for today.`);
    }

    // Check Max Profit Limit
    if (maxProfitPerDay > 0 && totalMtm >= maxProfitPerDay) {
        throw new Error(`Maximum daily profit target (₹${maxProfitPerDay}) reached. Trading disabled for today.`);
    }

    return true; // Limits are safe, proceed with trade
};

module.exports = { checkRiskLimits };
