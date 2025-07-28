const CLProcessor = require('./utils/clProcessor');
const { pool } = require('./config/database');

async function testCLProcessor() {
  try {
    console.log('Testing CL Processor...');
    
    // Sample data that matches the CSV structure
    const sampleRows = [
      {
        mapped_project_id: 1,
        mapped_domain_id: 5, // CL domain ID
        project: 'proj1',
        domain: 'AL',
        phase: 'bronze',
        user_name: 'user1',
        block_name: 'blk1',
        floor_plan: 'completed/in progress',
        routing: 'completed/in progress',
        area_um2: '2.2345',
        pv_drc_base_drc_metal_drc_antenna: 'No DB available/pass/fail/pass with waivers',
        pv_lvs_erc: 'No DB available/pass/fail',
        run_directory: '/proj/proj1/al/users/user1/blk1',
        runtime_hrmin: '4:15',
        run_end_time: '26/06/2025',
        ai_based_overall_summary_and_suggestions: 'analyze the violations seem to be optimization issue',
        ir_static: 'No DB available/pass/fail/pass with waivers',
        ir_dynamic: 'No DB available/pass/fail/pass with waivers',
        em_power_signal: 'No DB available/pass/fail/pass with waivers',
        em_rms_power_signal: 'No DB available/pass/fail/pass with waivers',
        pv_perc: 'No DB available/pass/fail/pass with waivers',
        logs_errors_warnings: 'Errors: 675 warnings: 554',
        run_status_passfailcontinue_with_error: 'continue_with_error'
      }
    ];

    const processor = new CLProcessor();
    const result = await processor.process(sampleRows, 1);
    
    console.log('CL Processor Test Result:', result);
    
    // Verify data was inserted
    const [rows] = await pool.execute('SELECT * FROM cl_data_raw WHERE block_name = ?', ['blk1']);
    console.log('Inserted CL data:', rows);
    
  } catch (error) {
    console.error('CL Processor Test Error:', error);
  } finally {
    await pool.end();
  }
}

testCLProcessor(); 