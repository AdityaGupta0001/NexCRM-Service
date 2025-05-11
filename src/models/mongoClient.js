const mongoose = require('mongoose');
const { Schema } = mongoose;

// User Schema
const UserSchema = new Schema({
    googleId: { type: String, required: true, unique: true },
    displayName: { type: String },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
    createdAt: { type: Date, default: Date.now }
});

// Customer Schema
const CustomerSchema = new Schema({
    customer_id: { type: String, required: true, unique: true }, // External ID
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true }, // Sparse for optional unique email
    phone: { type: String },
    last_visit: { type: Date },
    total_spend: { type: Number, default: 0 },
    visits: { type: Number, default: 0 }, // Number of orders or distinct visit days
    custom_attributes: { type: Map, of: Schema.Types.Mixed } // For additional dynamic fields
}, { timestamps: true });

// Order Schema
const OrderSchema = new Schema({
    order_id: { type: String, required: true, unique: true }, // External ID
    customer_mongo_id: { type: Schema.Types.ObjectId, ref: 'Customer', required: true }, // Link to Customer's ObjectId
    customer_id_external: { type: String, required: true, index: true }, // External customer_id for easier joining if needed
    date: { type: Date, required: true },
    amount: { type: Number, required: true }
}, { timestamps: true });

// Segment Schema
const SegmentSchema = new Schema({
    name: { type: String, required: true },
    rules: { type: Schema.Types.Mixed, required: true }, // JSON rule structure
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    audience_size_snapshot: { type: Number, default: 0 } // Optional: store size at creation
}, { timestamps: true });

// Communication Log Schema
const CommunicationLogSchema = new Schema({
    campaign_id: { type: String, required: true, unique: true }, // UUID
    segment_id: { type: Schema.Types.ObjectId, ref: 'Segment', required: true },
    message_template: { type: String, required: true },
    recipients: [
        {
            customer_id: { type: String, required: true }, // external customer_id
            customer_mongo_id: { type: Schema.Types.ObjectId, ref: 'Customer' },
            status: { type: String, enum: ['PENDING', 'SENT', 'FAILED', 'DELIVERED', 'OPENED'], default: 'PENDING' },
            timestamp: { type: Date }
        }
    ],
    status_counts: {
        SENT: { type: Number, default: 0 },
        FAILED: { type: Number, default: 0 },
        PENDING: {type: Number, default: 0}
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });


const User = mongoose.model('User', UserSchema);
const Customer = mongoose.model('Customer', CustomerSchema);
const Order = mongoose.model('Order', OrderSchema);
const Segment = mongoose.model('Segment', SegmentSchema);
const CommunicationLog = mongoose.model('CommunicationLog', CommunicationLogSchema);

module.exports = {
    User,
    Customer,
    Order,
    Segment,
    CommunicationLog
};