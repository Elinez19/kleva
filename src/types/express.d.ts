import { Request } from 'express';

export interface RequestCustom extends Request {
	user?: {
		id: string;
	};
	admin?: {
		id: string;
	};
}
