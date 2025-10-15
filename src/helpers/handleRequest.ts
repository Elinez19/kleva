import { NextFunction, Response } from 'express';
import { RequestCustom } from '../types/express';
import { HTTPSTATUS } from '../constants/http.constants';

export const handleRequest = (serviceFunction: (body: any) => Promise<any>) => {
	return async (req: RequestCustom, res: Response, next: NextFunction) => {
		try {
			const params = {
				data: req.body,
				user: req.user,
				admin: req.admin,
				query: req.params
			};

			const data = await serviceFunction(params);
			res.status(HTTPSTATUS.OK).json(data);
		} catch (error: any) {
			res.status(HTTPSTATUS.BAD_REQUEST).json({
				success: false,
				message: error.message,
				data: null
			});
		}
	};
};
