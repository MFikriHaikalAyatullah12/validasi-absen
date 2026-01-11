const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_qsc9PDmB2pCl@ep-super-shape-a12kd8ri-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function addClassTimes() {
  const client = await pool.connect();
  
  try {
    console.log('Adding class time columns...');
    
    // Add columns for check-in and check-out times
    await client.query(`
      ALTER TABLE classes 
      ADD COLUMN IF NOT EXISTS checkin_start_time TIME DEFAULT '07:00',
      ADD COLUMN IF NOT EXISTS checkin_end_time TIME DEFAULT '12:00',
      ADD COLUMN IF NOT EXISTS checkout_start_time TIME DEFAULT '14:00',
      ADD COLUMN IF NOT EXISTS checkout_end_time TIME DEFAULT '15:00'
    `);
    
    console.log('✅ Class time columns added successfully');
    
    // Update existing classes
    await client.query(`
      UPDATE classes 
      SET 
        checkin_start_time = COALESCE(checkin_start_time, '07:00'),
        checkin_end_time = COALESCE(checkin_end_time, '12:00'),
        checkout_start_time = COALESCE(checkout_start_time, '14:00'),
        checkout_end_time = COALESCE(checkout_end_time, '15:00')
    `);
    
    console.log('✅ Existing classes updated with default times');
    
    // Show updated structure
    const result = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'classes'
      ORDER BY ordinal_position
    `);
    
    console.log('\n✅ Updated classes table structure:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addClassTimes();
