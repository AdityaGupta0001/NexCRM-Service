const { Customer, Order } = require('../models/mongoClient');
const mongoose = require('mongoose');

const uploadCustomers = async (req, res) => {
    try {
        const customersData = req.body; // Expects an array of customer objects
        if (!Array.isArray(customersData) || customersData.length === 0) {
            return res.status(400).json({ error: "Request body must be a non-empty array of customers." });
        }

        const operations = customersData.map(customer => ({
            updateOne: {
                filter: { customer_id: customer.customer_id },
                update: { $set: customer },
                upsert: true
            }
        }));

        const result = await Customer.bulkWrite(operations);
        res.status(201).json({ message: "Customers data processed successfully.", result });
    } catch (error) {
        console.error("Error uploading customers:", error);
        res.status(500).json({ error: "Failed to upload customers data.", details: error.message });
    }
};

const getAllCustomers = async (req, res, next) => {
    try {
        const customers = await Customer.find({});
        res.status(200).json(customers);
    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({ error: "Failed to retrieve customers.", details: error.message });
    }
};

const getAllOrders = async (req, res, next) => {
    try {
        // You might want to populate customer details in orders
        const orders = await Order.find({}); // Example population
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Failed to retrieve orders.", details: error.message });
    }
};

const uploadOrders = async (req, res) => {
    try {
        const ordersData = req.body; // Expects an array of order objects
        if (!Array.isArray(ordersData) || ordersData.length === 0) {
            return res.status(400).json({ error: "Request body must be a non-empty array of orders." });
        }

        let successfulOrders = 0;
        let failedOrders = 0;
        const errors = [];

        for (const orderData of ordersData) {
            const session = await mongoose.startSession(); // For transaction
            session.startTransaction();
            try {
                const customer = await Customer.findOne({ customer_id: orderData.customer_id }).session(session);
                if (!customer) {
                    failedOrders++;
                    errors.push(`Customer with customer_id ${orderData.customer_id} not found for order ${orderData.order_id}.`);
                    await session.abortTransaction();
                    session.endSession();
                    continue;
                }

                const newOrder = new Order({
                    ...orderData,
                    customer_mongo_id: customer._id,
                    customer_id_external: customer.customer_id
                });
                await newOrder.save({ session });

                // Update customer aggregates
                customer.total_spend = (customer.total_spend || 0) + orderData.amount;
                customer.visits = (customer.visits || 0) + 1; // Simplistic: one visit per order
                if (!customer.last_visit || new Date(orderData.date) > new Date(customer.last_visit)) {
                    customer.last_visit = new Date(orderData.date);
                }
                await customer.save({ session });

                await session.commitTransaction();
                successfulOrders++;
            } catch (err) {
                await session.abortTransaction();
                failedOrders++;
                errors.push(`Error processing order ${orderData.order_id}: ${err.message}`);
                console.error(`Error processing order ${orderData.order_id}:`, err);
            } finally {
                session.endSession();
            }
        }

        if (failedOrders > 0) {
            return res.status(207).json({ // Multi-Status
                message: "Orders data processing completed with some errors.",
                successfulOrders,
                failedOrders,
                errors
            });
        }

        res.status(201).json({ message: "Orders data uploaded and customers updated successfully.", successfulOrders });
    } catch (error) {
        console.error("Error uploading orders:", error);
        res.status(500).json({ error: "Failed to upload orders data.", details: error.message });
    }
};


module.exports = {
    uploadCustomers,
    uploadOrders,
    getAllCustomers,
    getAllOrders,
};