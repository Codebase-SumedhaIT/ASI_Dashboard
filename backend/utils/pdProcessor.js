class PDProcessor {
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
          console.warn(`[PDProcessor] Skipping row - no project/domain mapping. Project: ${row.project || 'unknown'}, Domain: ${row.mapped_domain_code || 'unknown'}`);
          skippedCount++;
          continue;
        }

        // Parse run_end_time (support DD/MM/YYYY)
        let runEndTime = null;
        if (row.run_end_time) {
          const match = row.run_end_time.match(/^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/);
          if (match) {
            runEndTime = `${match[3]}-${match[2]}-${match[1]}`;
          } else {
            runEndTime = row.run_end_time;
          }
        }

        // Check for duplicate (project_id + block_name + experiment + run_end_time, not deleted)
        const [dupes] = await pool.execute(
          'SELECT id FROM pd_data_raw WHERE project_id = ? AND block_name = ? AND experiment = ? AND run_end_time = ? AND is_deleted = FALSE',
          [projectId, row.block_name, row.experiment, runEndTime]
        );
        if (dupes.length > 0) {
          console.warn(`[PDProcessor] Duplicate found for project_id: ${projectId}, block: ${row.block_name}, experiment: ${row.experiment}, run_end_time: ${runEndTime}. Skipping.`);
          skippedCount++;
          continue;
        }

        // Prepare insert data (all raw values, no conversion)
        const insertData = {
          project_id: projectId,
          domain_id: domainId,
          block_name: row.block_name || null,
          experiment: row.experiment || null,
          RTL_tag: row.rtl__tag || null,
          user_name: row.user_name || null,
          run_directory: row.run_directory || null,
          run_end_time: runEndTime,
          stage: row.stage || null,
          internal_timing: row.internal_timing_wnstnsfep || null,
          interface_timing: row.interface_timing_wnstnsfep || null,
          max_tran_wns_nvp: row.max_tran_wnsnvp || null,
          max_cap_wns_nvp: row.max_cap_wnsnvp || null,
          noise: row.noise || null,
          mpw_min_period_double_switching: row.mpwmin_perioddouble_switching || null,
          congestion_drc_metrics: row.congestiondrc_metrics || null,
          area_um2: row.areaum2 || null,
          inst_count: row.inst_count || null,
          utilization: row.utilization || null,
          logs_errors_warnings: row.logs_errors__warnings || null,
          run_status: row.run_status_passfailcontinue_with_error || null,
          runtime_seconds: row.runtimehrmin || null,
          ai_summary: row.ai_based_overall_summary_and_suggestions || null,
          ir_static: row.ir_static || null,
          em_power_signal: row.em_power_signal || null,
          pv_drc: row.pv_drc_base_drc_metal_drc_antenna || null,
          lvs: row.lvs || null,
          lec: row.lec || null,
          collected_by: userId
        };

        // Insert into pd_data_raw
        const query = `
          INSERT INTO pd_data_raw (
            project_id, domain_id, block_name, experiment, RTL_tag, user_name, run_directory, run_end_time, stage,
            internal_timing, interface_timing, max_tran_wns_nvp, max_cap_wns_nvp, noise, mpw_min_period_double_switching,
            congestion_drc_metrics, area_um2, inst_count, utilization, logs_errors_warnings, run_status, runtime_seconds,
            ai_summary, ir_static, em_power_signal, pv_drc, lvs, lec, collected_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
          insertData.project_id,
          insertData.domain_id,
          insertData.block_name,
          insertData.experiment,
          insertData.RTL_tag,
          insertData.user_name,
          insertData.run_directory,
          insertData.run_end_time,
          insertData.stage,
          insertData.internal_timing,
          insertData.interface_timing,
          insertData.max_tran_wns_nvp,
          insertData.max_cap_wns_nvp,
          insertData.noise,
          insertData.mpw_min_period_double_switching,
          insertData.congestion_drc_metrics,
          insertData.area_um2,
          insertData.inst_count,
          insertData.utilization,
          insertData.logs_errors_warnings,
          insertData.run_status,
          insertData.runtime_seconds,
          insertData.ai_summary,
          insertData.ir_static,
          insertData.em_power_signal,
          insertData.pv_drc,
          insertData.lvs,
          insertData.lec,
          insertData.collected_by
        ];
        await pool.execute(query, values);
        console.log(`[PDProcessor] Inserted PD row for project_id: ${projectId}, domain_id: ${domainId}, block: ${row.block_name}, experiment: ${row.experiment}, run_end_time: ${runEndTime}`);
        processedCount++;
      } catch (err) {
        console.error(`[PDProcessor] Error inserting PD row for project_id: ${row.mapped_project_id}, block: ${row.block_name}, experiment: ${row.experiment}:`, err);
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

module.exports = PDProcessor; 