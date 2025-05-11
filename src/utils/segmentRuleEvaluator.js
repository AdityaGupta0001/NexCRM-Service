const { Customer } = require('../models/mongoClient');

function buildMongoQueryFromRules(rules) {
    if (!rules || !rules.conditions || !rules.logic) {
        throw new Error("Invalid segment rules structure.");
    }

    const mongoConditions = rules.conditions.map(condition => {
        if (condition.logic) {
            return buildMongoQueryFromRules(condition);
        } else { // Simple condition
            const { field, operator, value } = condition;
            let queryValue = value;

            // Handle specific field types, e.g., dates
            if (field === 'last_visit' || field === 'createdAt' || field === 'updatedAt' || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/))) {
                 // Basic check for date string, robust parsing might be needed
                const dateVal = new Date(value);
                if (isNaN(dateVal.getTime())) { // Check if date is valid
                    throw new Error(`Invalid date value: ${value} for field ${field}`);
                }
                queryValue = dateVal;
            }


            switch (operator) {
                case '>': return { [field]: { $gt: queryValue } };
                case '<': return { [field]: { $lt: queryValue } };
                case '=': return { [field]: { $eq: queryValue } };
                case '>=': return { [field]: { $gte: queryValue } };
                case '<=': return { [field]: { $lte: queryValue } };
                case '!=': return { [field]: { $ne: queryValue } };
                case 'contains': return { [field]: { $regex: queryValue, $options: 'i' } }; // Case-insensitive contains for strings
                // Add more operators as needed (e.g., $in, $nin for array values)
                default: throw new Error(`Unsupported operator: ${operator}`);
            }
        }
    });

    if (mongoConditions.length === 0) {
        return {}; // No conditions, match all (or handle as error depending on desired behavior)
    }
    
    return { [rules.logic.toLowerCase() === 'and' ? '$and' : '$or']: mongoConditions };
}

async function evaluateSegmentRules(rulesJson) {
    const query = buildMongoQueryFromRules(rulesJson);
    const customers = await Customer.find(query);
    return customers;
}

async function getSegmentAudienceCount(rulesJson) {
    const query = buildMongoQueryFromRules(rulesJson);
    const count = await Customer.countDocuments(query);
    return count;
}

module.exports = {
    evaluateSegmentRules,
    getSegmentAudienceCount,
    buildMongoQueryFromRules
};