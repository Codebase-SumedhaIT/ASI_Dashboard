const classifyDomain = require('./domainClassifier');
const PDProcessor = require('./pdProcessor');
const DVProcessor = require('./dvProcessor');
const readAndNormalizeCSV = require('./readAndNormalizeCSV');
const { pool } = require('../config/database');
const path = require('path');
const logger = require('./logger');

const processors = {
  PD: new PDProcessor(),
  DV: new DVProcessor(),
  // Add more as you implement them
};

async function getDomainMapping() {
  try {
    const [domains] = await pool.execute(
      'SELECT id, short_code, full_name FROM domains WHERE is_active = 1'
    );
    
    const mapping = {};
    domains.forEach(domain => {
      mapping[domain.short_code] = domain.id;
      mapping[domain.full_name.toUpperCase()] = domain.id;
      // Add common variations
      if (domain.short_code === 'PD') {
        mapping['PHYSICAL DESIGN'] = domain.id;
        mapping['PHYSICAL'] = domain.id;
      }
      if (domain.short_code === 'DV') {
        mapping['DESIGN VERIFICATION'] = domain.id;
        mapping['VERIFICATION'] = domain.id;
      }
      if (domain.short_code === 'RTL') {
        mapping['REGISTER TRANSFER LEVEL'] = domain.id;
      }
      if (domain.short_code === 'CD') {
        mapping['CLOCK DESIGN'] = domain.id;
        mapping['CLOCK'] = domain.id;
      }
      if (domain.short_code === 'CL') {
        mapping['CUSTOM LAYOUT'] = domain.id;
        mapping['CUSTOM'] = domain.id;
      }
      if (domain.short_code === 'DFT') {
        mapping['DESIGN FOR TESTABILITY'] = domain.id;
        mapping['TESTABILITY'] = domain.id;
      }
    });
    
    return mapping;
  } catch (error) {
    logger.error('Error getting domain mapping', 'enhancedCSVProcessor', { error: error.message });
    return {};
  }
}

async function getProjectMapping() {
  try {
    const [projects] = await pool.execute(`
      SELECT id, project_name
      FROM projects
      WHERE status = 'active'
    `);
    
    const mapping = {};
    projects.forEach(project => {
      // Map by project name only
      mapping[project.project_name] = {
        project_id: project.id
      };
    });
    
    return mapping;
  } catch (error) {
    logger.error('Error getting project mapping', 'enhancedCSVProcessor', { error: error.message });
    return {};
  }
}

async function mapRowToProjectAndDomain(row, domainMapping, projectMapping, projectName, domainCode) {
  // Classify the domain from the provided domainCode (from filename)
  const classifiedDomain = classifyDomain({ domain: domainCode });

  // Use the provided projectName
  // Try to find exact project match
  if (projectName && projectMapping[projectName]) {
    // Find domain_id and domain_code from domainMapping
    if (classifiedDomain !== 'UNKNOWN' && domainMapping[classifiedDomain]) {
      return {
        project_id: projectMapping[projectName].project_id,
        domain_id: domainMapping[classifiedDomain],
        domain_code: classifiedDomain,
        confidence: 'high'
      };
    } else {
      // Project found, but domain not found
      return {
        project_id: projectMapping[projectName].project_id,
        domain_id: null,
        domain_code: null,
        confidence: 'none',
        missing_domain: classifiedDomain
      };
    }
  }

  // If no project found
  return {
    project_id: null,
    domain_id: null,
    domain_code: null,
    confidence: 'none',
    missing_project: projectName,
    missing_domain: classifiedDomain
  };
}

async function processCSVFile(filePath, userId) {
  try {
    console.log(`[EnhancedCSVProcessor] Starting processing of ${filePath}`);

    // Extract project and domain from filename
    const baseName = path.basename(filePath, '.csv');
    // Support both s1_pd.csv and s1-pd.csv (replace - with _ for split)
    const [projectNameRaw, domainCodeRaw] = baseName.replace(/-/g, '_').split('_');
    const projectName = projectNameRaw ? projectNameRaw.trim() : '';
    const domainCode = domainCodeRaw ? domainCodeRaw.trim() : '';

    // Validate project and domain name format from filename
    if (!projectName) {
      throw new Error(`Project name is missing or not in the expected format in filename: ${baseName}.csv`);
    }
    if (!domainCode) {
      throw new Error(`Domain name is missing or not in the expected format in filename: ${baseName}.csv`);
    }

    // Get mappings from database
    const domainMapping = await getDomainMapping();
    const projectMapping = await getProjectMapping();

    // --- ADDED: Skip file if project does not exist ---
    if (!projectMapping[projectName]) {
      console.warn(`[EnhancedCSVProcessor] Project '${projectName}' not found in database. Skipping file: ${filePath}`);
      return {
        total_rows: 0,
        mapped_rows: 0,
        unmapped_rows: 0,
        mapping_stats: {},
        processing_results: [],
        unmapped_samples: [],
        skipped_reason: `Project '${projectName}' not found in database. File skipped.`
      };
    }
    // --- END ADDED ---

    console.log(`[EnhancedCSVProcessor] Loaded ${Object.keys(domainMapping).length} domain mappings`);
    console.log(`[EnhancedCSVProcessor] Loaded ${Object.keys(projectMapping).length} project mappings`);

    const rows = await readAndNormalizeCSV(filePath);
    console.log(`[EnhancedCSVProcessor] Read ${rows.length} rows from CSV`);

    // Overwrite project and domain fields in each row with values from filename
    for (const row of rows) {
      row.project = projectName;
      row.domain = domainCode;
    }

    // Map each row to project and domain using filename info
    const mappedRows = [];
    const unmappedRows = [];
    const mappingStats = {
      high_confidence: 0,
      medium_confidence: 0,
      low_confidence: 0,
      none_confidence: 0
    };

    for (const row of rows) {
      const mapping = await mapRowToProjectAndDomain(row, domainMapping, projectMapping, projectName, domainCode);

      if (mapping.confidence === 'none') {
        unmappedRows.push({
          ...row,
          mapping_error: `No domain/project mapping found. Project: ${mapping.missing_project}, Domain: ${mapping.missing_domain}`
        });
      } else {
        mappedRows.push({
          ...row,
          mapped_project_id: mapping.project_id,
          mapped_domain_id: mapping.domain_id,
          mapped_domain_code: mapping.domain_code,
          mapping_confidence: mapping.confidence
        });
        mappingStats[`${mapping.confidence}_confidence`]++;
      }
    }
    
    console.log(`[EnhancedCSVProcessor] Mapping statistics:`, mappingStats);
    console.log(`[EnhancedCSVProcessor] Mapped ${mappedRows.length} rows, ${unmappedRows.length} unmapped`);
    
    // Group mapped rows by domain
    const domainGroups = {};
    for (const row of mappedRows) {
      const domainCode = row.mapped_domain_code;
      if (!domainGroups[domainCode]) domainGroups[domainCode] = [];
      domainGroups[domainCode].push(row);
    }
    
    // Process each domain group
    const processingResults = [];
    for (const [domainCode, domainRows] of Object.entries(domainGroups)) {
      if (processors[domainCode]) {
        try {
          console.log(`[EnhancedCSVProcessor] Processing ${domainRows.length} rows for domain ${domainCode}`);
          const result = await processors[domainCode].process(domainRows, userId);
          processingResults.push({
            domain: domainCode,
            rows_processed: domainRows.length,
            success: true,
            result
          });
        } catch (error) {
          logger.error(`Error processing domain ${domainCode}`, 'enhancedCSVProcessor', { error: error.message });
          processingResults.push({
            domain: domainCode,
            rows_processed: domainRows.length,
            success: false,
            error: error.message
          });
        }
      } else {
        console.warn(`[EnhancedCSVProcessor] No processor for domain: ${domainCode}. Rows skipped.`);
        processingResults.push({
          domain: domainCode,
          rows_processed: domainRows.length,
          success: false,
          error: 'No processor available'
        });
      }
    }
    
    // Log unmapped rows for debugging
    if (unmappedRows.length > 0) {
      console.warn(`[EnhancedCSVProcessor] ${unmappedRows.length} rows could not be mapped:`);
      const uniqueErrors = {};
      unmappedRows.forEach(row => {
        const error = row.mapping_error;
        if (!uniqueErrors[error]) uniqueErrors[error] = 0;
        uniqueErrors[error]++;
      });
      
      Object.entries(uniqueErrors).forEach(([error, count]) => {
        console.warn(`[EnhancedCSVProcessor] ${count}x: ${error}`);
      });
    }
    
    return {
      total_rows: rows.length,
      mapped_rows: mappedRows.length,
      unmapped_rows: unmappedRows.length,
      mapping_stats: mappingStats,
      processing_results: processingResults,
      unmapped_samples: unmappedRows.slice(0, 5) // Return first 5 unmapped rows as samples
    };
    
  } catch (error) {
    logger.error(`Error processing CSV file: ${error.message}\n${error.stack}`, 'enhancedCSVProcessor');
    throw error;
  }
}

module.exports = processCSVFile;