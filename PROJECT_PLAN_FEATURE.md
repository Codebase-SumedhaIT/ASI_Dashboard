# Project Plan Feature Documentation

## Overview
The Project Plan feature allows users to define and manage project plans for different domains (starting with DV domain). This feature provides a comprehensive planning system with requirements, testcases, assertions, and functional coverage management.

## Database Schema

### DV Planned Work Tables

#### 1. dv_planned_requirements
Stores planned requirements for DV domain projects.

**Key Fields:**
- `requirement_name`: Name of the requirement
- `testcase_name`: Associated testcase name
- `assertion_name`: Associated assertion name
- `coverpoint_name`: Associated coverpoint name
- `description`: Detailed description
- `status`: planned, in_progress, completed, blocked
- `priority`: low, medium, high, critical
- `estimated_hours`: Estimated time in hours
- `planned_start_date`: Planned start date
- `planned_end_date`: Planned end date

#### 2. dv_planned_testcases
Stores planned testcases for DV domain projects.

**Key Fields:**
- `testcase_name`: Name of the testcase
- `testcase_engineer`: Engineer assigned to the testcase
- `testcase_description`: Detailed description
- `requirement_id`: Link to requirement
- `status`: planned, in_progress, completed, blocked
- `priority`: low, medium, high, critical

#### 3. dv_planned_assertions
Stores planned assertions for DV domain projects.

**Key Fields:**
- `assertion_name`: Name of the assertion
- `assertion_engineer`: Engineer assigned to the assertion
- `assertion_description`: Detailed description
- `requirement_id`: Link to requirement
- `testcase_id`: Link to testcase
- `status`: planned, in_progress, completed, blocked
- `priority`: low, medium, high, critical

#### 4. dv_planned_functional_coverage
Stores planned functional coverage for DV domain projects.

**Key Fields:**
- `coverpoint_name`: Name of the coverpoint
- `coverpoint_engineer`: Engineer assigned to the coverpoint
- `coverpoint_description`: Detailed description
- `requirement_id`: Link to requirement
- `testcase_id`: Link to testcase
- `assertion_id`: Link to assertion
- `status`: planned, in_progress, completed, blocked
- `priority`: low, medium, high, critical

## API Endpoints

### Requirements
- `GET /api/planned-work/requirements/:projectId/:domainId` - Get all requirements
- `POST /api/planned-work/requirements` - Create new requirement
- `PUT /api/planned-work/requirements/:id` - Update requirement
- `DELETE /api/planned-work/requirements/:id` - Delete requirement

### Testcases
- `GET /api/planned-work/testcases/:projectId/:domainId` - Get all testcases
- `POST /api/planned-work/testcases` - Create new testcase
- `PUT /api/planned-work/testcases/:id` - Update testcase
- `DELETE /api/planned-work/testcases/:id` - Delete testcase

### Assertions
- `GET /api/planned-work/assertions/:projectId/:domainId` - Get all assertions
- `POST /api/planned-work/assertions` - Create new assertion
- `PUT /api/planned-work/assertions/:id` - Update assertion
- `DELETE /api/planned-work/assertions/:id` - Delete assertion

### Functional Coverage
- `GET /api/planned-work/functional-coverage/:projectId/:domainId` - Get all functional coverage
- `POST /api/planned-work/functional-coverage` - Create new functional coverage
- `PUT /api/planned-work/functional-coverage/:id` - Update functional coverage
- `DELETE /api/planned-work/functional-coverage/:id` - Delete functional coverage

## Frontend Components

### 1. ProjectManagement.jsx
Main component that includes the "Define Project Plans" button.

**Key Features:**
- Project and domain validation
- Integration with selection modal
- Error handling for missing projects/domains

### 2. ProjectSelectionModal.jsx
Modal for selecting project and domain before opening the plan modal.

**Key Features:**
- Dropdown selection for projects and domains
- Form validation
- Clean UI with proper styling

### 3. ProjectPlanModal.jsx
Main modal for managing project plans.

**Key Features:**
- Tabbed interface (Requirements, Testcases, Assertions, Functional Coverage)
- Form sections for adding new items
- Data tables for viewing existing items
- Status and priority management
- Time tracking (estimated vs actual hours)
- Date planning (start/end dates)

## Usage Instructions

### 1. Setting up the Database
Run the SQL schema file to create the necessary tables:

```sql
-- Run the dv_planned_work_schema.sql file
source dv_planned_work_schema.sql;
```

### 2. Accessing the Feature
1. Navigate to the Project Management page
2. Ensure you have at least one project and domain created
3. Click the "📋 Define Project Plans" button
4. Select your project and domain from the dropdown
5. Use the tabbed interface to manage different aspects of your project plan

### 3. Adding New Items
1. Select the appropriate tab (Requirements, Testcases, etc.)
2. Fill out the form on the left side
3. Click the submit button to create the item
4. The item will appear in the table on the right side

### 4. Managing Status and Priority
- **Status Options:** planned, in_progress, completed, blocked
- **Priority Options:** low, medium, high, critical
- Use the dropdown menus to update status and priority

### 5. Time Tracking
- Enter estimated hours when creating items
- Update actual hours as work progresses
- Track planned vs actual start/end dates

## Features

### ✅ Completed Features
- [x] Database schema for DV planned work
- [x] Backend API routes for CRUD operations
- [x] Frontend modal components
- [x] Project and domain selection
- [x] Tabbed interface for different work types
- [x] Form validation and error handling
- [x] Status and priority management
- [x] Time tracking capabilities
- [x] Responsive design
- [x] Modern UI with gradients and animations

### 🔄 Future Enhancements
- [ ] Support for other domains (PD, RTL, CL, etc.)
- [ ] Bulk import/export functionality
- [ ] Advanced filtering and search
- [ ] Gantt chart visualization
- [ ] Progress tracking and reporting
- [ ] Team collaboration features
- [ ] Integration with existing data workflows

## Technical Details

### Backend
- **Framework:** Node.js with Express
- **Database:** MySQL
- **Authentication:** JWT-based
- **File:** `backend/routes/plannedWork.js`

### Frontend
- **Framework:** React with TypeScript
- **Styling:** CSS with modern gradients and animations
- **Components:** Modular design with reusable components
- **State Management:** React hooks (useState, useEffect)

### Database
- **Engine:** MySQL
- **Schema:** Normalized design with foreign key relationships
- **Indexes:** Performance optimized with proper indexing
- **Soft Deletes:** Uses `is_deleted` flag for data integrity

## Error Handling

### Backend Errors
- Database connection errors
- Validation errors
- Authentication errors
- Foreign key constraint violations

### Frontend Errors
- Network connectivity issues
- Form validation errors
- Missing project/domain errors
- API response errors

## Security Considerations

1. **Authentication:** All endpoints require valid JWT token
2. **Authorization:** Users can only access their own data
3. **Input Validation:** Server-side validation for all inputs
4. **SQL Injection:** Uses parameterized queries
5. **XSS Protection:** Input sanitization and output encoding

## Performance Considerations

1. **Database Indexes:** Proper indexing on frequently queried columns
2. **Pagination:** Large datasets can be paginated
3. **Caching:** Consider implementing Redis for frequently accessed data
4. **Optimization:** Efficient queries with proper joins

## Testing

### Manual Testing Checklist
- [ ] Create new requirements
- [ ] Create new testcases
- [ ] Create new assertions
- [ ] Create new functional coverage
- [ ] Update existing items
- [ ] Delete items
- [ ] Test error scenarios
- [ ] Test responsive design
- [ ] Test with different browsers

### Automated Testing (Future)
- Unit tests for API endpoints
- Integration tests for database operations
- Frontend component tests
- End-to-end tests for complete workflows

## Deployment

### Prerequisites
1. MySQL database with the schema applied
2. Node.js backend running
3. React frontend built and served
4. Environment variables configured

### Environment Variables
```env
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:3000
```

## Support and Maintenance

### Monitoring
- Database performance metrics
- API response times
- Error rates and logs
- User activity tracking

### Maintenance
- Regular database backups
- Log rotation and cleanup
- Performance optimization
- Security updates

## Conclusion

The Project Plan feature provides a comprehensive solution for managing DV domain project planning. It includes all necessary components for requirements, testcases, assertions, and functional coverage management with a modern, user-friendly interface.

The implementation follows best practices for security, performance, and maintainability, making it ready for production use while providing a solid foundation for future enhancements. 