const { Segment, Customer } = require('../models/mongoClient');
const { evaluateSegmentRules, getSegmentAudienceCount, buildMongoQueryFromRules } = require('../utils/segmentRuleEvaluator');

const createSegment = async (req, res) => {
    try {
        const { name, rules } = req.body;
        if (!name || !rules) {
            return res.status(400).json({ error: "Segment name and rules are required." });
        }

        // Validate rules structure roughly (more specific validation can be added)
        if (typeof rules !== 'object' || !rules.logic || !Array.isArray(rules.conditions)) {
             return res.status(400).json({ error: "Invalid rules structure." });
        }
        
        // Optional: Preview audience size before saving
        const audienceSize = await getSegmentAudienceCount(rules);

        const newSegment = new Segment({
            name,
            rules,
            createdBy: req.user._id,
            audience_size_snapshot: audienceSize
        });
        await newSegment.save();

        res.status(201).json({ message: "Segment created successfully.", segment: newSegment, audienceSize });
    } catch (error) {
        console.error("Error creating segment:", error);
        if (error.message.startsWith("Unsupported operator") || error.message.startsWith("Invalid date value")) {
            return res.status(400).json({ error: "Error in segment rule definition.", details: error.message });
        }
        res.status(500).json({ error: "Failed to create segment.", details: error.message });
    }
};

const previewSegment = async (req, res) => {
    try {
        const { rules } = req.body;
        if (!rules) {
            return res.status(400).json({ error: "Rules are required for preview." });
        }
        if (typeof rules !== 'object' || !rules.logic || !Array.isArray(rules.conditions)) {
             return res.status(400).json({ error: "Invalid rules structure for preview." });
        }

        const audienceSize = await getSegmentAudienceCount(rules);
        res.status(200).json({ audienceSize });
    } catch (error) {
        console.error("Error previewing segment:", error);
         if (error.message.startsWith("Unsupported operator") || error.message.startsWith("Invalid date value")) {
            return res.status(400).json({ error: "Error in segment rule definition for preview.", details: error.message });
        }
        res.status(500).json({ error: "Failed to preview segment.", details: error.message });
    }
};

const listSegments = async (req, res) => {
    try {
        const segments = await Segment.find({ createdBy: req.user._id }).populate('createdBy', 'displayName email').sort({ createdAt: -1 });
        // Admins might see all segments:
        // const segments = req.user.role === 'admin' ? await Segment.find({}) : await Segment.find({ createdBy: req.user._id });
        res.status(200).json(segments);
    } catch (error) {
        console.error("Error listing segments:", error);
        res.status(500).json({ error: "Failed to retrieve segments.", details: error.message });
    }
};

const getSegmentDetails = async (req, res) => {
    try {
        const segment = await Segment.findById(req.params.id).populate('createdBy', 'displayName email');
        if (!segment) {
            return res.status(404).json({ error: "Segment not found." });
        }
        // Add role-based access check if employees can only see their own segments
        // if (req.user.role === 'employee' && segment.createdBy.toString() !== req.user._id.toString()) {
        //     return res.status(403).json({ error: "Access denied to this segment." });
        // }
        res.status(200).json(segment);
    } catch (error) {
        console.error("Error fetching segment details:", error);
        res.status(500).json({ error: "Failed to retrieve segment details.", details: error.message });
    }
};

const getSegmentAudience = async (req, res) => {
    try {
        const segment = await Segment.findById(req.params.id);
        if (!segment) {
            return res.status(404).json({ error: "Segment not found." });
        }
        // Add role-based access check here too if necessary

        const audience = await evaluateSegmentRules(segment.rules);
        res.status(200).json({ audienceCount: audience.length, audience });
    } catch (error) {
        console.error("Error fetching segment audience:", error);
        res.status(500).json({ error: "Failed to retrieve segment audience.", details: error.message });
    }
};


module.exports = {
    createSegment,
    previewSegment,
    listSegments,
    getSegmentDetails,
    getSegmentAudience
};