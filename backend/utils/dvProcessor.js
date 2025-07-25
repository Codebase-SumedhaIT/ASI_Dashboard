class DVProcessor {
  async process(rows, userId) {
    const { pool } = require('../config/database');
    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      try {
        // Use mapped project and domain IDs from enhanced processor
        const projectId = row.mapped_project_id;
        const domainId = row.mapped_domain_id;

        // Skip if no project or domain mapping found
        if (!projectId || !domainId) {
          console.warn(`[DVProcessor] Skipping row - no project/domain mapping. Project: ${row.project || 'unknown'}, Domain: ${row.mapped_domain_code || 'unknown'}`);
          skippedCount++;
          continue;
        }

        // Check for duplicate (project_id + module, not deleted)
        const [dupes] = await pool.execute(
          'SELECT id FROM dv_data_raw WHERE project_id = ? AND module = ? AND is_deleted = FALSE',
          [projectId, row.module]
        );
        if (dupes.length > 0) {
          console.warn(`[DVProcessor] Duplicate found for project_id: ${projectId}, module: ${row.module}. Skipping.`);
          skippedCount++;
          continue;
        }

        // Prepare insert data (all raw values, no conversion)
        const insertData = {
          project_id: projectId,
          domain_id: domainId,
          module: row.module || null,
          tb_dev_total: row.tb_dev_total || null,
          tb_dev_coded: row.tb_dev_coded || null,
          test_total: row.test_total || null,
          test_coded: row.test_coded || null,
          test_pass: row.test_pass || null,
          test_fail: row.test_fail || null,
          assert_total: row.assert_total || null,
          assert_coded: row.assert_coded || null,
          assert_pass: row.assert_pass || null,
          assert_fail: row.assert_fail || null,
          code_coverage_percent: row.code_coverage_ || null,
          functional_coverage_percent: row.functional_coverage_ || null,
          req_total: row.req_total || null,
          req_covered: row.req_covered || null,
          req_uncovered: row.req_uncovered || null,
          block_status: row.block_status || null,
          collected_by: userId
        };

        // Insert into dv_data_raw
        const query = `
          INSERT INTO dv_data_raw (
            project_id, domain_id, module, tb_dev_total, tb_dev_coded, test_total, test_coded, test_pass, test_fail,
            assert_total, assert_coded, assert_pass, assert_fail, code_coverage_percent, functional_coverage_percent,
            req_total, req_covered, req_uncovered, block_status, collected_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
          insertData.project_id,
          insertData.domain_id,
          insertData.module,
          insertData.tb_dev_total,
          insertData.tb_dev_coded,
          insertData.test_total,
          insertData.test_coded,
          insertData.test_pass,
          insertData.test_fail,
          insertData.assert_total,
          insertData.assert_coded,
          insertData.assert_pass,
          insertData.assert_fail,
          insertData.code_coverage_percent,
          insertData.functional_coverage_percent,
          insertData.req_total,
          insertData.req_covered,
          insertData.req_uncovered,
          insertData.block_status,
          insertData.collected_by
        ];
        await pool.execute(query, values);
        console.log(`[DVProcessor] Inserted DV row for project_id: ${projectId}, domain_id: ${domainId}, module: ${row.module}`);
        processedCount++;
      } catch (err) {
        console.error(`[DVProcessor] Error inserting DV row for project_id: ${row.mapped_project_id}, module: ${row.module}:`, err);
        errorCount++;
      }
    }

    return {
      processed: processedCount,
      skipped: skippedCount,
      errors: errorCount,
      total: rows.length
    };
  }
}

module.exports = DVProcessor; 