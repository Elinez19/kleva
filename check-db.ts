import { connectDb } from './src/database/db';
import UserModel from './src/models/user.model';

const checkDatabase = async () => {
	try {
		console.log('🔍 Checking database...');
		await connectDb();
		
		const users = await UserModel.find({});
		console.log(`\n📊 Found ${users.length} users in database:`);
		
		users.forEach(user => {
			console.log(`  - ${user.email} (${user.role}) - ${user.approvalStatus}`);
		});
		
		process.exit(0);
	} catch (error) {
		console.error('❌ Error:', error);
		process.exit(1);
	}
};

checkDatabase();

