const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { pool } = require('../config/database');

// Get engineer users for module assignment
router.get('/engineers', auth, async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.name, u.email, ur.role_name
      FROM users u
      LEFT JOIN user_roles ur ON u.role_id = ur.id
      WHERE ur.role_name = 'Engineer' AND u.is_active = TRUE
      ORDER BY u.name ASC
    `;
    
    const [engineers] = await pool.execute(query);
    
    res.json({ success: true, engineers });
  } catch (error) {
    console.error('Error fetching engineers:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get all modules for a project and domain
router.get('/modules/:projectId/:domainId', auth, async (req, res) => {
  try {
    const { projectId, domainId } = req.params;
    
    const query = `
      SELECT m.*, u.name as created_by_name
      FROM dv_modules m
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.project_id = ? AND m.domain_id = ? AND m.is_deleted = FALSE
      ORDER BY m.created_date DESC
    `;
    
    const [modules] = await pool.execute(query, [projectId, domainId]);
    
    res.json({ success: true, modules });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create new module
router.post('/modules', auth, async (req, res) => {
  try {
    const {
      module_name,
      module_engineer,
      project_id,
      domain_id
    } = req.body;

    const query = `
      INSERT INTO dv_modules 
      (module_name, module_engineer, project_id, domain_id, created_by)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      module_name, module_engineer, project_id, domain_id, req.user.userId
    ]);

    res.json({ success: true, id: result.insertId, message: 'Module created successfully' });
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update module
router.put('/modules/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      module_name,
      module_engineer,
      project_id,
      domain_id
    } = req.body;

    const query = `
      UPDATE dv_modules SET
        module_name = ?, module_engineer = ?, project_id = ?, domain_id = ?
      WHERE id = ? AND is_deleted = FALSE
    `;

    const [result] = await pool.execute(query, [
      module_name, module_engineer, project_id, domain_id, id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    res.json({ success: true, message: 'Module updated successfully' });
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete module
router.delete('/modules/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'UPDATE dv_modules SET is_deleted = TRUE WHERE id = ?';
    const [result] = await pool.execute(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    res.json({ success: true, message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});



// Get all planned requirements for a project and domain
router.get('/requirements/:projectId/:domainId', auth, async (req, res) => {
  try {
    const { projectId, domainId } = req.params;
    
    const query = `
      SELECT pr.*, u.name as assigned_to_name, c.name as created_by_name,
             pt.testcase_name, pt.testcase_engineer,
             pa.assertion_name, pa.assertion_engineer,
             pfc.coverpoint_name, pfc.coverpoint_engineer
      FROM dv_planned_requirements pr
      LEFT JOIN users u ON pr.assigned_to = u.id
      LEFT JOIN users c ON pr.created_by = c.id
      LEFT JOIN dv_planned_testcases pt ON pr.testcase_id = pt.id
      LEFT JOIN dv_planned_assertions pa ON pr.assertion_id = pa.id
      LEFT JOIN dv_planned_functional_coverage pfc ON pr.coverpoint_id = pfc.id
      WHERE pr.project_id = ? AND pr.domain_id = ? AND pr.is_deleted = FALSE
      ORDER BY pr.created_at DESC
    `;
    
    const [requirements] = await pool.execute(query, [projectId, domainId]);
    
    res.json({ success: true, requirements });
  } catch (error) {
    console.error('Error fetching planned requirements:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create new planned requirement
router.post('/requirements', auth, async (req, res) => {
  try {
    const {
      project_id,
      domain_id,
      requirement_name,
      testcase_id,
      assertion_id,
      coverpoint_id,
      description,
      status,
      priority,
      assigned_to,
      estimated_hours,
      planned_start_date,
      planned_end_date
    } = req.body;

    const query = `
      INSERT INTO dv_planned_requirements 
      (project_id, domain_id, requirement_name, testcase_id, assertion_id, coverpoint_id, 
       description, status, priority, estimated_hours, planned_start_date, planned_end_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      project_id, domain_id, requirement_name, testcase_id, assertion_id, coverpoint_id,
      description, status || 'planned', priority || 'medium', estimated_hours,
      planned_start_date, planned_end_date, req.user.userId
    ]);

    res.json({ success: true, id: result.insertId, message: 'Requirement created successfully' });
  } catch (error) {
    console.error('Error creating planned requirement:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update planned requirement
router.put('/requirements/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      requirement_name,
      testcase_id,
      assertion_id,
      coverpoint_id,
      description,
      status,
      priority,
      assigned_to,
      estimated_hours,
      actual_hours,
      planned_start_date,
      planned_end_date,
      actual_start_date,
      actual_end_date
    } = req.body;

    const query = `
      UPDATE dv_planned_requirements SET
        requirement_name = ?, testcase_id = ?, assertion_id = ?, coverpoint_id = ?,
        description = ?, status = ?, priority = ?, estimated_hours = ?,
        actual_hours = ?, planned_start_date = ?, planned_end_date = ?,
        actual_start_date = ?, actual_end_date = ?
      WHERE id = ? AND is_deleted = FALSE
    `;

    const [result] = await pool.execute(query, [
      requirement_name, testcase_id, assertion_id, coverpoint_id,
      description, status, priority, estimated_hours,
      actual_hours, planned_start_date, planned_end_date,
      actual_start_date, actual_end_date, id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Requirement not found' });
    }

    res.json({ success: true, message: 'Requirement updated successfully' });
  } catch (error) {
    console.error('Error updating planned requirement:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete planned requirement
router.delete('/requirements/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'UPDATE dv_planned_requirements SET is_deleted = TRUE WHERE id = ?';
    const [result] = await pool.execute(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Requirement not found' });
    }

    res.json({ success: true, message: 'Requirement deleted successfully' });
  } catch (error) {
    console.error('Error deleting planned requirement:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get all planned testcases for a project and domain
router.get('/testcases/:projectId/:domainId', auth, async (req, res) => {
  try {
    const { projectId, domainId } = req.params;
    
    const query = `
      SELECT pt.*, u.name as assigned_to_name, c.name as created_by_name
      FROM dv_planned_testcases pt
      LEFT JOIN users u ON pt.assigned_to = u.id
      LEFT JOIN users c ON pt.created_by = c.id
      WHERE pt.project_id = ? AND pt.domain_id = ? AND pt.is_deleted = FALSE
      ORDER BY pt.created_at DESC
    `;
    
    const [testcases] = await pool.execute(query, [projectId, domainId]);
    
    res.json({ success: true, testcases });
  } catch (error) {
    console.error('Error fetching planned testcases:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create new planned testcase
router.post('/testcases', auth, async (req, res) => {
  try {
    const {
      project_id,
      domain_id,
      testcase_name,
      testcase_engineer,
      testcase_description,
      status,
      priority,
      assigned_to,
      estimated_hours,
      planned_start_date,
      planned_end_date
    } = req.body;

    const query = `
      INSERT INTO dv_planned_testcases 
      (project_id, domain_id, testcase_name, testcase_engineer, testcase_description,
       status, priority, estimated_hours, planned_start_date, planned_end_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      project_id, domain_id, testcase_name, testcase_engineer, testcase_description,
      status || 'planned', priority || 'medium', estimated_hours,
      planned_start_date, planned_end_date, req.user.userId
    ]);

    res.json({ success: true, id: result.insertId, message: 'Testcase created successfully' });
  } catch (error) {
    console.error('Error creating planned testcase:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update planned testcase
router.put('/testcases/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      testcase_name,
      testcase_engineer,
      testcase_description,
      status,
      priority,
      assigned_to,
      estimated_hours,
      actual_hours,
      planned_start_date,
      planned_end_date,
      actual_start_date,
      actual_end_date
    } = req.body;

    const query = `
      UPDATE dv_planned_testcases SET
        testcase_name = ?, testcase_engineer = ?, testcase_description = ?,
        status = ?, priority = ?, estimated_hours = ?, actual_hours = ?,
        planned_start_date = ?, planned_end_date = ?, actual_start_date = ?, actual_end_date = ?
      WHERE id = ? AND is_deleted = FALSE
    `;

    const [result] = await pool.execute(query, [
      testcase_name, testcase_engineer, testcase_description,
      status, priority, estimated_hours, actual_hours,
      planned_start_date, planned_end_date, actual_start_date, actual_end_date, id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Testcase not found' });
    }

    res.json({ success: true, message: 'Testcase updated successfully' });
  } catch (error) {
    console.error('Error updating planned testcase:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete planned testcase
router.delete('/testcases/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'UPDATE dv_planned_testcases SET is_deleted = TRUE WHERE id = ?';
    const [result] = await pool.execute(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Testcase not found' });
    }

    res.json({ success: true, message: 'Testcase deleted successfully' });
  } catch (error) {
    console.error('Error deleting planned testcase:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get all planned assertions for a project and domain
router.get('/assertions/:projectId/:domainId', auth, async (req, res) => {
  try {
    const { projectId, domainId } = req.params;
    
    const query = `
      SELECT pa.*, u.name as assigned_to_name, c.name as created_by_name
      FROM dv_planned_assertions pa
      LEFT JOIN users u ON pa.assigned_to = u.id
      LEFT JOIN users c ON pa.created_by = c.id
      WHERE pa.project_id = ? AND pa.domain_id = ? AND pa.is_deleted = FALSE
      ORDER BY pa.created_at DESC
    `;
    
    const [assertions] = await pool.execute(query, [projectId, domainId]);
    
    res.json({ success: true, assertions });
  } catch (error) {
    console.error('Error fetching planned assertions:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create new planned assertion
router.post('/assertions', auth, async (req, res) => {
  try {
    const {
      project_id,
      domain_id,
      assertion_name,
      assertion_engineer,
      assertion_description,
      status,
      priority,
      assigned_to,
      estimated_hours,
      planned_start_date,
      planned_end_date
    } = req.body;

    const query = `
      INSERT INTO dv_planned_assertions 
      (project_id, domain_id, assertion_name, assertion_engineer, assertion_description,
       status, priority, estimated_hours, planned_start_date, planned_end_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      project_id, domain_id, assertion_name, assertion_engineer, assertion_description,
      status || 'planned', priority || 'medium', estimated_hours,
      planned_start_date, planned_end_date, req.user.userId
    ]);

    res.json({ success: true, id: result.insertId, message: 'Assertion created successfully' });
  } catch (error) {
    console.error('Error creating planned assertion:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update planned assertion
router.put('/assertions/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      assertion_name,
      assertion_engineer,
      assertion_description,
      status,
      priority,
      assigned_to,
      estimated_hours,
      actual_hours,
      planned_start_date,
      planned_end_date,
      actual_start_date,
      actual_end_date
    } = req.body;

    const query = `
      UPDATE dv_planned_assertions SET
        assertion_name = ?, assertion_engineer = ?, assertion_description = ?,
        status = ?, priority = ?, estimated_hours = ?, actual_hours = ?,
        planned_start_date = ?, planned_end_date = ?, actual_start_date = ?, actual_end_date = ?
      WHERE id = ? AND is_deleted = FALSE
    `;

    const [result] = await pool.execute(query, [
      assertion_name, assertion_engineer, assertion_description,
      status, priority, estimated_hours, actual_hours,
      planned_start_date, planned_end_date, actual_start_date, actual_end_date, id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Assertion not found' });
    }

    res.json({ success: true, message: 'Assertion updated successfully' });
  } catch (error) {
    console.error('Error updating planned assertion:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete planned assertion
router.delete('/assertions/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'UPDATE dv_planned_assertions SET is_deleted = TRUE WHERE id = ?';
    const [result] = await pool.execute(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Assertion not found' });
    }

    res.json({ success: true, message: 'Assertion deleted successfully' });
  } catch (error) {
    console.error('Error deleting planned assertion:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get all planned functional coverage for a project and domain
router.get('/functional-coverage/:projectId/:domainId', auth, async (req, res) => {
  try {
    const { projectId, domainId } = req.params;
    
    const query = `
      SELECT pfc.*, u.name as assigned_to_name, c.name as created_by_name
      FROM dv_planned_functional_coverage pfc
      LEFT JOIN users u ON pfc.assigned_to = u.id
      LEFT JOIN users c ON pfc.created_by = c.id
      WHERE pfc.project_id = ? AND pfc.domain_id = ? AND pfc.is_deleted = FALSE
      ORDER BY pfc.created_at DESC
    `;
    
    const [functionalCoverage] = await pool.execute(query, [projectId, domainId]);
    
    res.json({ success: true, functionalCoverage });
  } catch (error) {
    console.error('Error fetching planned functional coverage:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create new planned functional coverage
router.post('/functional-coverage', auth, async (req, res) => {
  try {
    const {
      project_id,
      domain_id,
      coverpoint_name,
      coverpoint_engineer,
      coverpoint_description,
      status,
      priority,
      assigned_to,
      estimated_hours,
      planned_start_date,
      planned_end_date
    } = req.body;

    const query = `
      INSERT INTO dv_planned_functional_coverage 
      (project_id, domain_id, coverpoint_name, coverpoint_engineer, coverpoint_description,
       status, priority, estimated_hours, planned_start_date, planned_end_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      project_id, domain_id, coverpoint_name, coverpoint_engineer, coverpoint_description,
      status || 'planned', priority || 'medium', estimated_hours,
      planned_start_date, planned_end_date, req.user.userId
    ]);

    res.json({ success: true, id: result.insertId, message: 'Functional coverage created successfully' });
  } catch (error) {
    console.error('Error creating planned functional coverage:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update planned functional coverage
router.put('/functional-coverage/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      coverpoint_name,
      coverpoint_engineer,
      coverpoint_description,
      status,
      priority,
      assigned_to,
      estimated_hours,
      actual_hours,
      planned_start_date,
      planned_end_date,
      actual_start_date,
      actual_end_date
    } = req.body;

    const query = `
      UPDATE dv_planned_functional_coverage SET
        coverpoint_name = ?, coverpoint_engineer = ?, coverpoint_description = ?, 
        status = ?, priority = ?, estimated_hours = ?, actual_hours = ?, planned_start_date = ?, 
        planned_end_date = ?, actual_start_date = ?, actual_end_date = ?
      WHERE id = ? AND is_deleted = FALSE
    `;

    const [result] = await pool.execute(query, [
      coverpoint_name, coverpoint_engineer, coverpoint_description,
      status, priority, estimated_hours, actual_hours, planned_start_date,
      planned_end_date, actual_start_date, actual_end_date, id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Functional coverage not found' });
    }

    res.json({ success: true, message: 'Functional coverage updated successfully' });
  } catch (error) {
    console.error('Error updating planned functional coverage:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete planned functional coverage
router.delete('/functional-coverage/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'UPDATE dv_planned_functional_coverage SET is_deleted = TRUE WHERE id = ?';
    const [result] = await pool.execute(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Functional coverage not found' });
    }

    res.json({ success: true, message: 'Functional coverage deleted successfully' });
  } catch (error) {
    console.error('Error deleting planned functional coverage:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router; 