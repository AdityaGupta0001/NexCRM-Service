// This is a simplified simulation. In a real scenario, this would interact with an external vendor's API.
async function simulateSendMessageToVendor(customerId, messageContent) {
    console.log(`SIMULATING: Sending message to customer ${customerId}. Content: "${messageContent}"`);
    // Simulate network delay or processing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50)); // 50-150ms delay
    
    // The decision of "SENT" or "FAILED" and the subsequent call to /api/delivery-receipt
    // is handled by the campaignController as per the project description's example.
    // This function just simulates the act of dispatching.
    return { status: "ATTEMPTED_SEND", customerId: customerId };
}

module.exports = {
    simulateSendMessageToVendor
};