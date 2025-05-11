function isAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    res.status(403).json({ error: "Access denied. Admin role required." });
}

function isEmployeeOrAdmin(req, res, next) {
    if (req.user && (req.user.role === 'employee' || req.user.role === 'admin')) {
        return next();
    }
    res.status(403).json({ error: "Access denied. Insufficient privileges." });
}

module.exports = {
    isAdmin,
    isEmployeeOrAdmin
};