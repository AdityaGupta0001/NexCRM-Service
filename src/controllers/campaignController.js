const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { Segment, CommunicationLog, Customer } = require('../models/mongoClient');
const { evaluateSegmentRules } = require('../utils/segmentRuleEvaluator');
const vendorAPI = require('../utils/vendorAPI');
const sendCampaign = async (req, res) => {
    try {
        const { segment_id, message_template } = req.body;
        if (!segment_id || !message_template) {
            return res.status(400).json({ error: "Segment ID and message template are required." });
        }

        const segment = await Segment.findById(segment_id);
        if (!segment) {
            return res.status(404).json({ error: "Segment not found." });
        }

        const audience = await evaluateSegmentRules(segment.rules);
        if (!audience || audience.length === 0) {
            return res.status(400).json({ error: "Segment has no audience. Campaign not sent." });
        }

        const campaignId = uuidv4();
        const initialRecipients = audience.map(customer => ({
            customer_id: customer.customer_id,
            customer_mongo_id: customer._id,
            status: "PENDING",
            timestamp: null
        }));

        const newCampaignLog = new CommunicationLog({
            campaign_id: campaignId,
            segment_id: segment._id,
            message_template,
            recipients: initialRecipients,
            status_counts: { PENDING: audience.length, SENT: 0, FAILED: 0 },
            createdBy: req.user._id
        });
        await newCampaignLog.save();

        res.status(202).json({
            message: "Campaign accepted and processing initiated.",
            campaign_id: campaignId,
            audienceSize: audience.length
        });

        (async () => {
            for (const customer of audience) { 
                let deliveryStatusForCallback;
                let vendorDispatchSuccessful = false;

                try {
                    const personalizedMessage = message_template.replace(/{{name}}/gi, customer.name || 'Valued Customer');
                    const vendorResponse = await vendorAPI.sendMessageToVendor(customer, personalizedMessage);

                    if (vendorResponse.status === "DISPATCH_SUCCESSFUL") {
                        deliveryStatusForCallback = "SENT";
                        vendorDispatchSuccessful = true;
                    } else {
                        // This covers "DISPATCH_FAILED" and "FAILED_NO_EMAIL"
                        deliveryStatusForCallback = "FAILED";
                        console.warn(`Vendor dispatch failed for customer ${customer.customer_id}: ${vendorResponse.error}`);
                    }

                } catch (dispatchError) {
                    // Catch any unexpected errors from sendMessageToVendor itself
                    console.error(`Critical error dispatching message for customer ${customer.customer_id}:`, dispatchError);
                    deliveryStatusForCallback = "FAILED";
                }
                
                // 2. Simulate vendor callback (or direct update if our internal callback fails)
                // This part remains largely the same, but the 'deliveryStatusForCallback' is now based on Brevo's response
                try {
                    // Ensure SERVER_BASE_URL is correctly set in .env
                    // This simulates an external vendor calling back to our API.
                    await axios.post(`${process.env.SERVER_BASE_URL}/api/campaigns/delivery-receipt`, {
                        campaign_id: campaignId,
                        customer_id: customer.customer_id,
                        status: deliveryStatusForCallback,
                        timestamp: new Date().toISOString()
                    });
                } catch (callbackError) {
                    console.error(`Error simulating delivery-receipt callback for customer ${customer.customer_id} in campaign ${campaignId}:`, callbackError.message);
                    // Fallback: Update CommunicationLog directly if the callback simulation fails
                    try {
                        await CommunicationLog.updateOne(
                            { campaign_id: campaignId, "recipients.customer_id": customer.customer_id },
                            {
                                $set: {
                                    "recipients.$.status": deliveryStatusForCallback, // Use determined status
                                    "recipients.$.timestamp": new Date()
                                },
                                $inc: { 
                                    [deliveryStatusForCallback === "SENT" ? "status_counts.SENT" : "status_counts.FAILED"]: 1, 
                                    "status_counts.PENDING": -1 
                                }
                            }
                        );
                    } catch (dbError) {
                        console.error(`Failed to directly update status for ${customer.customer_id} after callback error:`, dbError);
                    }
                }
            }
            console.log(`Campaign ${campaignId} email dispatch processing finished.`);
        })();

    } catch (error) {
        console.error("Error sending campaign:", error);
        res.status(500).json({ error: "Failed to send campaign.", details: error.message });
    }
};

const updateDeliveryStatus = async (req, res) => {
    try {
        const { campaign_id, customer_id, status, timestamp } = req.body;
        if (!campaign_id || !customer_id || !status) {
            return res.status(400).json({ error: "Campaign ID, Customer ID, and Status are required." });
        }

        const validStatuses = ["SENT", "FAILED", "DELIVERED", "OPENED"]; // Add more if needed
        if (!validStatuses.includes(status.toUpperCase())) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }
        
        const logEntry = await CommunicationLog.findOne({ campaign_id: campaign_id });
        if (!logEntry) {
            return res.status(404).json({ error: "Campaign log not found."});
        }

        const recipientIndex = logEntry.recipients.findIndex(r => r.customer_id === customer_id && r.status === "PENDING");
        if (recipientIndex === -1) {
            // If not PENDING, it might be an update for an already processed one, or an error.
            // For now, let's just log if already processed, or error if not found at all.
            const existingRecipient = logEntry.recipients.find(r => r.customer_id === customer_id);
            if (!existingRecipient) return res.status(404).json({ error: `Customer ${customer_id} not found in campaign ${campaign_id} recipients.` });
            // console.log(`Status for customer ${customer_id} in campaign ${campaign_id} was already ${existingRecipient.status}. New status: ${status}. Ignoring or re-processing based on logic needed.`);
            // For simplicity, we only update if it was PENDING. More complex logic can be added.
             return res.status(409).json({ error: `Status for customer ${customer_id} already processed or not in PENDING state.` });
        }


        const updateQuery = {
            $set: {
                [`recipients.${recipientIndex}.status`]: status.toUpperCase(),
                [`recipients.${recipientIndex}.timestamp`]: timestamp ? new Date(timestamp) : new Date()
            },
            $inc: {
                [`status_counts.${status.toUpperCase()}`]: 1,
                "status_counts.PENDING": -1
            }
        };
        
        const result = await CommunicationLog.updateOne(
            { campaign_id: campaign_id, "recipients.customer_id": customer_id },
             updateQuery
        );

        if (result.matchedCount === 0) {
             return res.status(404).json({ error: `Customer ${customer_id} not found or already updated in campaign ${campaign_id}.` });
        }
        if (result.modifiedCount === 0 && result.matchedCount > 0) {
             return res.status(200).json({ message: "Delivery status for customer was already up-to-date."});
        }

        res.status(200).json({ message: "Delivery status updated successfully." });
    } catch (error) {
        console.error("Error updating delivery status:", error);
        res.status(500).json({ error: "Failed to update delivery status.", details: error.message });
    }
};


const getCampaignHistory = async (req, res) => {
    try {
        // For employees, only show campaigns they created. Admins see all.
        const query = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
        
        const campaigns = await CommunicationLog.find(query)
            .populate('segment_id', 'name')
            .populate('createdBy', 'displayName email')
            .sort({ createdAt: -1 });

        const history = campaigns.map(log => ({
            campaign_id: log.campaign_id,
            segment_name: log.segment_id ? log.segment_id.name : 'N/A',
            message_template: log.message_template,
            audience_size: log.recipients.length,
            status_counts: log.status_counts,
            created_at: log.createdAt,
            created_by: log.createdBy ? log.createdBy.displayName : 'N/A'
        }));

        res.status(200).json(history);
    } catch (error) {
        console.error("Error fetching campaign history:", error);
        res.status(500).json({ error: "Failed to retrieve campaign history.", details: error.message });
    }
};

module.exports = {
    sendCampaign,
    updateDeliveryStatus,
    getCampaignHistory
};