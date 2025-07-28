const { pool } = require('./config/database');

async function checkCLData() {
  try {
    console.log('Checking CL data in database...');
    
    // Check if CL data exists
    const [clData] = await pool.execute('SELECT * FROM cl_data_raw');
    console.log('Total CL records:', clData.length);
    
    if (clData.length > 0) {
      console.log('Sample CL record:', clData[0]);
    }
    
    // Check project mapping
    const [projects] = await pool.execute('SELECT * FROM projects');
    console.log('Available projects:', projects);
    
    // Check domain mapping
    const [domains] = await pool.execute('SELECT * FROM domains WHERE short_code = "CL"');
    console.log('CL domain:', domains);
    
    // Check CL data with project and domain info
    const [clWithProject] = await pool.execute(`
      SELECT cl.*, p.project_name, d.full_name as domain_name 
      FROM cl_data_raw cl 
      JOIN projects p ON cl.project_id = p.id 
      JOIN domains d ON cl.domain_id = d.id
    `);
    console.log('CL data with project info:', clWithProject);
    
    // Check specifically for ASi project
    const [asiProject] = await pool.execute('SELECT * FROM projects WHERE project_name = "ASi"');
    console.log('ASi project:', asiProject);
    
    if (asiProject.length > 0) {
      const [asiCLData] = await pool.execute(`
        SELECT cl.*, p.project_name, d.full_name as domain_name 
        FROM cl_data_raw cl 
        JOIN projects p ON cl.project_id = p.id 
        JOIN domains d ON cl.domain_id = d.id
        WHERE p.project_name = "ASi"
      `);
      console.log('CL data for ASi project:', asiCLData);
    }
    
  } catch (error) {
    console.error('Error checking CL data:', error);
  } finally {
    await pool.end();
  }
}

checkCLData(); 