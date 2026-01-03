require('dotenv').config();
const mongoose = require('mongoose');

async function checkMongoDB() {
  console.log('🔍 Checking MongoDB Connection...\n');
  console.log(`📍 Connection String: ${process.env.MONGODB_URI || 'Not set in .env'}\n`);

  try {
    // Set a short timeout for connection test
    mongoose.set('serverSelectionTimeoutMS', 5000);
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clinicare');
    
    console.log('✅ SUCCESS! MongoDB is running and connected!\n');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🖥️  Host: ${mongoose.connection.host}`);
    console.log(`🔌 Port: ${mongoose.connection.port}`);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📚 Collections: ${collections.length}`);
    if (collections.length > 0) {
      collections.forEach(col => console.log(`   - ${col.name}`));
    } else {
      console.log('   (No collections yet - will be created when you use the app)');
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Ready to start your server! Run: npm run dev');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ MongoDB Connection Failed!\n');
    console.error(`Error: ${error.message}\n`);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 MongoDB is not running. Choose an option:\n');
      console.log('1. MongoDB Atlas (Cloud - Easiest):');
      console.log('   → Sign up: https://www.mongodb.com/cloud/atlas/register');
      console.log('   → Create free cluster and update .env with connection string\n');
      console.log('2. Install MongoDB locally:');
      console.log('   → Download: https://www.mongodb.com/try/download/community');
      console.log('   → Install and run: net start MongoDB\n');
      console.log('3. Use Docker:');
      console.log('   → docker run -d --name mongodb -p 27017:27017 mongo\n');
      console.log('📖 See backend/MONGODB_SETUP.md for detailed instructions');
    } else if (error.message.includes('authentication failed')) {
      console.log('💡 Authentication failed. Check your username/password in .env');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('💡 Cannot resolve hostname. Check your connection string in .env');
    }
    
    process.exit(1);
  }
}

checkMongoDB();

