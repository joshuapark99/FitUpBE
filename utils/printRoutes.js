const printRoutes = (app) => {
    const routes = [];

    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            routes.push(middleware.route);
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach((handler) => {
                let route;
                route = handler.route;
                route && routes.push(route);
            });
        }
    });

    console.log('Routes');
    routes.forEach((route) => {
        const methods = Object.keys(route.methods).map((method) => method.toUpperCase()).join(', ');
        console.log(`${methods} ${route.path}`);
    });
};

module.exports = printRoutes;