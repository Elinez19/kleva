import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { HTTPSTATUS } from '../constants/http.constants';

export const validateRequest = (schema: z.ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
	return (req: Request, res: Response, next: NextFunction): any => {
		try {
			const data = req[source];

			const validated = schema.parse(data);

			req[source] = validated;

			next();
		} catch (error) {
			if (error instanceof ZodError) {
				return res.status(HTTPSTATUS.BAD_REQUEST).json({
					success: false,
					message: 'Validation failed',
					errors: error.issues.map((err: any) => ({
						field: err.path.join('.'),
						message: err.message
					}))
				});
			}

			return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
				success: false,
				message: 'Internal server error during validation'
			});
		}
	};
};

export const validateBody = (schema: z.ZodSchema) => validateRequest(schema, 'body');

export const validateQuery = (schema: z.ZodSchema) => validateRequest(schema, 'query');

export const validateParams = (schema: z.ZodSchema) => validateRequest(schema, 'params');

export default validateRequest;
