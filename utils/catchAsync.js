function catchAsync (asyncFun) {
    return (req, res, next) => {
        asyncFun(req, res, next).catch(e => next(e));
    }
}

module.exports = catchAsync;