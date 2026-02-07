const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_qsc9PDmB2pCl@ep-super-shape-a12kd8ri-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function clearAllData() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Starting database cleanup...\n');
    
    // Step 1: Delete all attendance records
    console.log('1️⃣ Deleting all attendance records...');
    const attendanceResult = await client.query('DELETE FROM attendance');
    console.log(`   ✅ Deleted ${attendanceResult.rowCount} attendance records\n`);
    
    // Step 2: Delete all teacher-class relationships
    console.log('2️⃣ Deleting all teacher-class relationships...');
    const teacherClassResult = await client.query('DELETE FROM teacher_classes');
    console.log(`   ✅ Deleted ${teacherClassResult.rowCount} teacher-class relationships\n`);
    
    // Step 3: Delete all users (this will also cascade delete related data)
    console.log('3️⃣ Deleting all user accounts...');
    const usersResult = await client.query('DELETE FROM users');
    console.log(`   ✅ Deleted ${usersResult.rowCount} user accounts\n`);
    
    // Step 4: Delete all classes
    console.log('4️⃣ Deleting all classes...');
    const classesResult = await client.query('DELETE FROM classes');
    console.log(`   ✅ Deleted ${classesResult.rowCount} classes\n`);
    
    // Verify the cleanup
    console.log('📊 Verification - Checking remaining data:');
    
    const verifyQueries = [
      { name: 'users', query: 'SELECT COUNT(*) FROM users' },
      { name: 'classes', query: 'SELECT COUNT(*) FROM classes' },
      { name: 'attendance', query: 'SELECT COUNT(*) FROM attendance' },
      { name: 'teacher_classes', query: 'SELECT COUNT(*) FROM teacher_classes' }
    ];
    
    for (const { name, query } of verifyQueries) {
      const result = await client.query(query);
      const count = parseInt(result.rows[0].count);
      const icon = count === 0 ? '✅' : '⚠️';
      console.log(`   ${icon} ${name}: ${count} records`);
    }
    
    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('📝 Note: school_settings table was preserved for system configuration.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the cleanup
clearAllData();
