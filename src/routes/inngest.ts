import express from 'express';
import { serve } from 'inngest/express';
import { inngest } from '../config/inngest';

const router = express.Router();

// Inngest webhook endpoint for receiving events
router.post(
	'/inngest',
	serve({
		client: inngest,
		functions: [
			// Import your Inngest functions here when ready
			// ...emailFunctions,
			// ...authWorkflows,
			// ...paymentWorkflows
		]
	})
);

export default router;
