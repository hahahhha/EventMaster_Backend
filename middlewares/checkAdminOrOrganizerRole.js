const AuthControllers = require('../controllers/authControllers');

const checkAdminRole = async (req, res, next) => {
    const userId = await AuthControllers.getUserId(req);
    if (!userId) {
        return res.status(403).json({
            msg: "Не удалось получить айди пользователя"
        });
    }
    const userRole = await AuthControllers.getRole(req);
    if (userRole !== 'admin' && userRole !== 'organizer') {
        return res.status(403).json({
            msg: "Недостаточно прав"
        });
    }
    next();
}

module.exports = checkAdminRole;