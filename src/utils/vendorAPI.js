const SibApiV3Sdk = require('sib-api-v3-sdk');

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY || 'YOUR_BREVO_API_KEY';

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Function to send a message (email) to a customer via Brevo
async function sendMessageToVendor(customer, htmlContent) {
    console.log(`Attempting to send email to customer ${customer.customer_id} (${customer.email}). Content: "${htmlContent.substring(0, 50)}..."`);

    if (!customer.email) {
        console.error(`Customer ${customer.customer_id} has no email address. Cannot send email.`);
        return { status: "FAILED_NO_EMAIL", customerId: customer.customer_id, error: "Missing customer email" };
    }

    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = "Important Update from NexCRM";
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = {
        name: process.env.BREVO_SENDER_NAME || 'NexCRM',
        email: process.env.BREVO_SENDER_EMAIL || 'your_sender_email@example.com'
    };
    sendSmtpEmail.to = [{ email: customer.email, name: customer.name }];

    try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`Email dispatch to Brevo successful for customer ${customer.customer_id}. Brevo Response: ${JSON.stringify(data)}`);
        return { status: "DISPATCH_SUCCESSFUL", customerId: customer.customer_id, brevoResponse: data };
    } catch (error) {
        let errorMessage = error.message;
        if (error.response && error.response.body && error.response.body.message) { // Brevo specific error message
            errorMessage = `Brevo API Error: ${error.response.body.message} (Code: ${error.response.body.code})`;
        } else if (error.response && error.response.text) { // Sometimes error is in text
             errorMessage = `Brevo API Error: ${error.response.text}`;
        }
        console.error(`Error sending email via Brevo for customer ${customer.customer_id}:`, errorMessage, error.stack);
        return { status: "DISPATCH_FAILED", customerId: customer.customer_id, error: errorMessage };
    }
}

module.exports = {
    sendMessageToVendor
};
