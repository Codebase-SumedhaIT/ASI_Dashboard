class CLProcessor {
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
          console.warn(`[CLProcessor] Skipping row - no project/domain mapping. Project: ${row.project || 'unknown'}, Domain: ${row.mapped_domain_code || 'unknown'}`);
          skippedCount++;
          continue;
        }

        // Parse run_end_time (support D/M/YYYY and DD/MM/YYYY)
        let runEndTime = null;
        if (row.run_end_time) {
          // Try DD/MM/YYYY format first
          let match = row.run_end_time.match(/^([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4})$/);
          if (match) {
            const day = match[1].padStart(2, '0');
            const month = match[2].padStart(2, '0');
            const year = match[3];
            runEndTime = `${year}-${month}-${day}`;
          } else {
            // If no match, try to parse as is or set to null
            console.warn(`[CLProcessor] Could not parse date format: ${row.run_end_time}`);
            runEndTime = null;
          }
        }

        // Convert runtime from hr:min format to seconds
        let runtimeSeconds = null;
        if (row.runtime_hrmin) {
          const timeMatch = row.runtime_hrmin.match(/^(\d+):(\d+)$/);
          if (timeMatch) {
            const hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            runtimeSeconds = (hours * 60 + minutes) * 60;
          }
        }

        // Get user_id from user_name
        let userDbId = null;
        try {
          const [users] = await pool.execute(
            'SELECT id FROM users WHERE name = ?',
            [row.user_name]
          );
          userDbId = users.length > 0 ? users[0].id : null;
        } catch (userError) {
          console.warn(`[CLProcessor] Could not find user_id for user_name: ${row.user_name}`);
        }

        // Check for duplicate (project_id + block_name + user_name + run_end_time, not deleted)
        let dupes = [];
        try {
          [dupes] = await pool.execute(
            'SELECT id FROM cl_data_raw WHERE project_id = ? AND block_name = ? AND user_name = ? AND run_end_time = ? AND is_deleted = FALSE',
            [projectId, row.block_name, row.user_name, runEndTime]
          );
        } catch (dupeCheckError) {
          console.warn(`[CLProcessor] Error checking duplicates, continuing with insert:`, dupeCheckError.message);
          // Continue with insert even if duplicate check fails
        }
        if (dupes.length > 0) {
          console.warn(`[CLProcessor] Duplicate found for project_id: ${projectId}, block: ${row.block_name}, user: ${row.user_name}, run_end_time: ${runEndTime}. Skipping.`);
          skippedCount++;
          continue;
        }

        // Prepare insert data with correct column mappings
        const insertData = {
          project_id: projectId,
          domain_id: domainId,
          phase: row.phase || null,
          user_name: row.user_name || null,
          block_name: row.block_name || null,
          floor_plan: row.floor_plan || null,
          routing: row.routing || null,
          area_um2: row.area_um2 || null,
          pv_drc: row.pv__drc_base_drc_metal_drc_antenna || null,
          pv_lvs_erc: row.pv__lvserc || null,
          run_directory: row.run_directory || null,
          runtime_seconds: runtimeSeconds,
          run_end_time: runEndTime,
          ai_summary: row.ai_based_overall_summary_and_suggestions || null,
          ir_static: row.ir_static || null,
          ir_dynamic: row.ir_dynamic || null,
          em_power_signal: row.em_iavg_power_signal || null,
          em_rms_power_signal: row.em_irms_power_signal || null,
          pv_perc: row.pv__perc || null,
          logs_errors_warnings: row.logs_errors__warnings || null,
          run_status: row.run_status_passfailcontinue_with_error || null,
          user_id: userDbId,
          collected_by: userId
        };

        // Debug: Log the row data to see what we're getting
        console.log(`[CLProcessor] Processing row:`, {
          project: row.project,
          domain: row.domain,
          phase: row.phase,
          user_name: row.user_name,
          block_name: row.block_name,
          run_end_time: row.run_end_time,
          parsed_run_end_time: runEndTime,
          user_id: userDbId
        });

        // Insert into cl_data_raw
        const query = `
          INSERT INTO cl_data_raw (
            project_id, domain_id, phase, user_name, block_name, floor_plan, routing, area_um2,
            pv_drc, pv_lvs_erc, run_directory, runtime_seconds, run_end_time, ai_summary,
            ir_static, ir_dynamic, em_power_signal, em_rms_power_signal, pv_perc,
            logs_errors_warnings, run_status, user_id, collected_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
          insertData.project_id,
          insertData.domain_id,
          insertData.phase,
          insertData.user_name,
          insertData.block_name,
          insertData.floor_plan,
          insertData.routing,
          insertData.area_um2,
          insertData.pv_drc,
          insertData.pv_lvs_erc,
          insertData.run_directory,
          insertData.runtime_seconds,
          insertData.run_end_time,
          insertData.ai_summary,
          insertData.ir_static,
          insertData.ir_dynamic,
          insertData.em_power_signal,
          insertData.em_rms_power_signal,
          insertData.pv_perc,
          insertData.logs_errors_warnings,
          insertData.run_status,
          insertData.user_id,
          insertData.collected_by
        ];
        
        console.log(`[CLProcessor] About to insert with values:`, values);
        await pool.execute(query, values);
        console.log(`[CLProcessor] Inserted CL row for project_id: ${projectId}, domain_id: ${domainId}, block: ${row.block_name}, user: ${row.user_name}, run_end_time: ${runEndTime}`);
        processedCount++;
      } catch (err) {
        console.error(`[CLProcessor] Error inserting CL row for project_id: ${row.mapped_project_id}, block: ${row.block_name}, user: ${row.user_name}:`, err);
        console.error(`[CLProcessor] Row data:`, row);
        console.error(`[CLProcessor] Insert data:`, insertData);
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

module.exports = CLProcessor; 