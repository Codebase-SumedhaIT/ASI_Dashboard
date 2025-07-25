const express = require('express');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const [users] = await pool.execute(
      'SELECT r.role_name FROM users u JOIN user_roles r ON u.role_id = r.id WHERE u.id = ?',
      [req.user.userId]
    );

    if (users.length === 0 || users[0].role_name !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== DOMAIN ROUTES ====================

// Get all domains
router.get('/domains', auth, requireAdmin, async (req, res) => {
  try {
    const [domains] = await pool.execute(
      'SELECT id, short_code, full_name, description, is_active, created_at FROM domains ORDER BY short_code'
    );

    res.json({ domains });
  } catch (error) {
    console.error('Get domains error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new domain
router.post('/domains', auth, requireAdmin, async (req, res) => {
  try {
    const { short_code, full_name, description } = req.body;

    // Validate input
    if (!short_code || !full_name) {
      return res.status(400).json({ message: 'Short code and full name are required' });
    }

    // Check if domain already exists
    const [existingDomains] = await pool.execute(
      'SELECT id FROM domains WHERE short_code = ? OR full_name = ?',
      [short_code, full_name]
    );

    if (existingDomains.length > 0) {
      return res.status(400).json({ message: 'Domain with this short code or full name already exists' });
    }

    // Create domain
    const [result] = await pool.execute(
      'INSERT INTO domains (short_code, full_name, description) VALUES (?, ?, ?)',
      [short_code, full_name, description || null]
    );

    // Get created domain
    const [newDomains] = await pool.execute(
      'SELECT id, short_code, full_name, description, is_active, created_at FROM domains WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Domain created successfully',
      domain: newDomains[0]
    });

  } catch (error) {
    console.error('Create domain error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update domain
router.put('/domains/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { short_code, full_name, description, is_active } = req.body;

    // Check if domain exists
    const [existingDomains] = await pool.execute(
      'SELECT id FROM domains WHERE id = ?',
      [id]
    );

    if (existingDomains.length === 0) {
      return res.status(404).json({ message: 'Domain not found' });
    }

    // Check if new short_code or full_name conflicts with other domains
    if (short_code || full_name) {
      const [conflictingDomains] = await pool.execute(
        'SELECT id FROM domains WHERE (short_code = ? OR full_name = ?) AND id != ?',
        [short_code, full_name, id]
      );

      if (conflictingDomains.length > 0) {
        return res.status(400).json({ message: 'Domain with this short code or full name already exists' });
      }
    }

    // Build update query
    const updates = [];
    const values = [];
    
    if (short_code) {
      updates.push('short_code = ?');
      values.push(short_code);
    }
    if (full_name) {
      updates.push('full_name = ?');
      values.push(full_name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (typeof is_active === 'boolean') {
      updates.push('is_active = ?');
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE domains SET ${updates.join(', ')} WHERE id = ?`;
    
    await pool.execute(query, values);

    // Get updated domain
    const [updatedDomains] = await pool.execute(
      'SELECT id, short_code, full_name, description, is_active, created_at FROM domains WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Domain updated successfully',
      domain: updatedDomains[0]
    });

  } catch (error) {
    console.error('Update domain error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete domain
router.delete('/domains/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if domain exists
    const [existingDomains] = await pool.execute(
      'SELECT id FROM domains WHERE id = ?',
      [id]
    );

    if (existingDomains.length === 0) {
      return res.status(404).json({ message: 'Domain not found' });
    }

    // Check if domain has associated projects
    const [projects] = await pool.execute(
      'SELECT COUNT(*) as count FROM projects WHERE domain_id = ?',
      [id]
    );

    if (projects[0].count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete domain. It has associated projects. Please delete the projects first.' 
      });
    }

    // Delete domain
    await pool.execute('DELETE FROM domains WHERE id = ?', [id]);

    res.json({ message: 'Domain deleted successfully' });

  } catch (error) {
    console.error('Delete domain error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== PROJECT ROUTES ====================

// Get all projects with their domains
router.get('/projects', auth, requireAdmin, async (req, res) => {
  try {
    // Fetch projects and their domains
    const [rows] = await pool.query(`
      SELECT 
        p.id AS project_id,
        p.project_name,
        p.description,
        p.status,
        p.start_date,
        p.created_at,
        d.id AS domain_id,
        d.short_code,
        d.full_name
      FROM projects p
      LEFT JOIN project_domains pd ON p.id = pd.project_id
      LEFT JOIN domains d ON pd.domain_id = d.id
      ORDER BY p.created_at DESC, d.short_code
    `);

    // Group by project
    const projectsMap = {};
    for (const row of rows) {
      if (!projectsMap[row.project_id]) {
        projectsMap[row.project_id] = {
          id: row.project_id,
          project_name: row.project_name,
          description: row.description,
          status: row.status,
          start_date: row.start_date,
          created_at: row.created_at,
          domains: []
        };
      }
      if (row.domain_id) {
        projectsMap[row.project_id].domains.push({
          id: row.domain_id,
          short_code: row.short_code,
          full_name: row.full_name
        });
      }
    }
    const projects = Object.values(projectsMap);

    res.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new project (no domain selection required)
router.post('/projects', auth, requireAdmin, async (req, res) => {
  try {
    const { project_name, description, status, start_date } = req.body;
    if (!project_name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    // Create project
    const [result] = await pool.execute(
      'INSERT INTO projects (project_name, description, status, start_date, created_by) VALUES (?, ?, ?, ?, ?)',
      [project_name, description || null, status || 'active', start_date || null, req.user.userId]
    );

    res.status(201).json({ message: 'Project created successfully' });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update project (no domain selection required)
router.put('/projects/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { project_name, description, status, start_date } = req.body;

    // Update project fields
    const updates = [];
    const values = [];
    if (project_name) { updates.push('project_name = ?'); values.push(project_name); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (status) { updates.push('status = ?'); values.push(status); }
    if (start_date !== undefined) { updates.push('start_date = ?'); values.push(start_date); }
    if (updates.length > 0) {
      values.push(id);
      await pool.execute(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    res.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete project
router.delete('/projects/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if project exists
    const [existingProjects] = await pool.execute(
      'SELECT id FROM projects WHERE id = ?',
      [id]
    );

    if (existingProjects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if project has associated data
    const [pdData] = await pool.execute(
      'SELECT COUNT(*) as count FROM pd_data_raw WHERE project_id = ?',
      [id]
    );

    const [dvData] = await pool.execute(
      'SELECT COUNT(*) as count FROM dv_data_raw WHERE project_id = ?',
      [id]
    );

    if (pdData[0].count > 0 || dvData[0].count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete project. It has associated data. Please delete the data first.' 
      });
    }

    // Delete project
    await pool.execute('DELETE FROM projects WHERE id = ?', [id]);

    res.json({ message: 'Project deleted successfully' });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 