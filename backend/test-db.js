require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user');
const ChatSession = require('./src/models/ChatSession');

// Test MongoDB connection
async function testConnection() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log(`📍 URI: ${process.env.MONGODB_URI || 'Not set'}`);
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clinicare');
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🖥️  Host: ${mongoose.connection.host}`);
    
    // Test User model
    console.log('\n📝 Testing User Model...');
    const userSchema = User.schema;
    const userFields = Object.keys(userSchema.paths);
    console.log('✅ User model fields:', userFields.filter(f => !f.includes('_')).join(', '));
    
    // Test ChatSession model
    console.log('\n💬 Testing ChatSession Model...');
    const sessionSchema = ChatSession.schema;
    const sessionFields = Object.keys(sessionSchema.paths);
    console.log('✅ ChatSession model fields:', sessionFields.filter(f => !f.includes('_')).join(', '));
    
    // Check if phase field exists
    if (sessionSchema.paths.phase) {
      console.log('✅ Phase field exists with enum:', sessionSchema.paths.phase.enumValues);
    }
    
    // Check if collectedFields exists
    if (sessionSchema.paths.collectedFields) {
      console.log('✅ collectedFields exists');
    }
    
    // List collections
    console.log('\n📚 Existing Collections:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    if (collections.length === 0) {
      console.log('   (No collections yet - they will be created when you use the app)');
    } else {
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    }
    
    console.log('\n✅ All tests passed! MongoDB is ready to use.');
    
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure MongoDB is running');
    console.error('   2. Check your MONGODB_URI in .env file');
    console.error('   3. If using local MongoDB, start it with: mongod');
    console.error('   4. If using MongoDB Atlas, check your connection string');
    process.exit(1);
  }
}

testConnection();

