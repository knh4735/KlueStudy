import { Request, Response, NextFunction } from "express";

const checkLoggedIn = (req: Request, res: Response, next: NextFunction) => {
	if (!res.locals.user) {

		res.status(401).send(); // Unauthorized
		return;
	}

	next();
};

export default checkLoggedIn;