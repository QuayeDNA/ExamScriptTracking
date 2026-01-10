# Exam Session Archiving Feature Documentation

## Overview

The Exam Session Archiving feature allows administrators to archive completed exam sessions after an exam period ends. Archived sessions become read-only and are grouped into named archives for better organization and historical record-keeping.

## Key Features

- **Bulk Session Selection**: Select multiple exam sessions for archiving
- **Named Archives**: Create archives with custom names and descriptions
- **CRUD Operations**: Create, read, update, and delete archives
- **Read-Only Protection**: Archived sessions cannot be modified
- **Historical Preservation**: Maintain all data for reporting and analytics
- **Admin-Only Access**: Only administrators can create and manage archives

## Business Rules

### Archive Creation
- Only administrators can create archives
- Sessions must be in COMPLETED status to be archived
- Archive name is required (3-100 characters)
- Description is optional
- Multiple sessions can be archived together

### Archive Management
- Only administrators can modify archives
- Add sessions to existing archives
- Remove sessions from archives
- Delete entire archives (with confirmation)
- View archive contents and metadata

### Archived Session Restrictions
- Cannot scan attendance
- Cannot create transfers
- Cannot report incidents
- Cannot modify session details
- Cannot change status
- Can be viewed and exported
- Included in analytics and reports

## Technical Implementation

### Database Schema

#### New Model: ExamSessionArchive
```prisma
model ExamSessionArchive {
  id          String   @id @default(uuid())
  name        String   // Archive name (required, 3-100 chars)
  description String?  // Optional description
  createdById String
  createdBy   User     @relation("ArchiveCreator", fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  sessions    ExamSession[]

  @@map("exam_session_archives")
}
```

#### Updated ExamSession Model
```prisma
model ExamSession {
  // ... existing fields ...
  archiveId   String?
  archive     ExamSessionArchive? @relation(fields: [archiveId], references: [id])
  isArchived  Boolean @default(false)

  // ... existing relations ...
}
```

#### Updated BatchStatus Enum
```prisma
enum BatchStatus {
  NOT_STARTED
  IN_PROGRESS
  SUBMITTED
  IN_TRANSIT
  WITH_LECTURER
  UNDER_GRADING
  GRADED
  RETURNED
  COMPLETED
  ARCHIVED  // New status
}
```

### Backend API Endpoints

#### Archive Management (`/archives`)
- `POST /archives` - Create new archive with sessions
- `GET /archives` - List all archives (paginated)
- `GET /archives/:id` - Get archive details with sessions
- `PUT /archives/:id` - Update archive (name/description)
- `DELETE /archives/:id` - Delete archive
- `POST /archives/:id/sessions` - Add sessions to archive
- `DELETE /archives/:id/sessions/:sessionId` - Remove session from archive

#### Exam Sessions (`/exam-sessions`)
- `POST /exam-sessions/archive` - Archive multiple sessions (creates new archive)
- Updated existing endpoints to check `isArchived` flag

### Frontend Implementation (Web Dashboard)

#### ExamSessionsPage.tsx Updates
- Add checkbox column for bulk selection
- "Archive Selected" button (admin only)
- Archive creation modal with name/description fields
- Visual indicators for archived sessions
- "Archives" tab to view/manage archives
- Archive management interface (CRUD operations)

#### New Components
- `ArchiveModal.tsx` - Create/edit archive dialog
- `ArchiveManager.tsx` - Archive CRUD interface
- `ArchivedSessionIndicator.tsx` - Visual archive status

### Mobile App Implementation

#### Sessions List Updates
- Show archive status indicator for archived sessions
- Disable action buttons for archived sessions
- Add archive status to session details

#### Archive Status Display
- Grayed out styling for archived sessions
- Archive icon indicator
- "Archived" status text in session cards

### API Request/Response Examples

#### Create Archive
```typescript
POST /archives
{
  "name": "Fall 2024 Midterms",
  "description": "Mathematics and Science Department exams",
  "sessionIds": ["session-1", "session-2", "session-3"]
}
```

#### Add Sessions to Existing Archive
```typescript
POST /archives/:archiveId/sessions
{
  "sessionIds": ["session-4", "session-5"]
}
```

#### Archive Response
```typescript
{
  "id": "archive-123",
  "name": "Fall 2024 Midterms",
  "description": "Mathematics and Science Department exams",
  "createdBy": { "id": "user-1", "firstName": "Admin", "lastName": "User" },
  "createdAt": "2024-12-01T10:00:00Z",
  "sessionCount": 5,
  "sessions": [
    {
      "id": "session-1",
      "courseCode": "MATH101",
      "status": "ARCHIVED",
      "isArchived": true,
      "archiveId": "archive-123"
    }
  ]
}
```

### Validation Rules

#### Archive Creation
- `name`: Required, 3-100 characters, unique per admin
- `description`: Optional, max 500 characters
- `sessionIds`: Required, array of 1+ session IDs
- Sessions must exist and be in COMPLETED status
- Sessions must not already be archived

#### Archive Modification
- Only archive creator (admin) can modify
- Cannot modify sessions that are in progress
- Archive name must remain unique

### Error Handling

#### Common Error Responses
- `400 Bad Request`: Invalid archive name, sessions not eligible
- `403 Forbidden`: Non-admin attempting archive operations
- `404 Not Found`: Archive or session not found
- `409 Conflict`: Session already archived or archive name exists

### Security Considerations

- Archive operations restricted to ADMIN role only
- All archive endpoints require authentication
- Archive creator relationship maintained for audit trails
- Archived sessions protected from modification

### Migration Strategy

1. **Database Migration**: Add new tables and columns
2. **Data Migration**: Set `isArchived = false` for existing sessions
3. **API Updates**: Add archive endpoints and validation
4. **Frontend Updates**: Add archive UI components
5. **Mobile Updates**: Add archive status indicators

### Testing Strategy

#### Unit Tests
- Archive creation validation
- Session archival logic
- Permission checks

#### Integration Tests
- Full archive creation workflow
- Archive modification operations
- Archived session restrictions

#### E2E Tests
- Web dashboard archive creation
- Mobile app archive status display
- Permission enforcement

### Performance Considerations

- Archive queries use proper indexing
- Bulk operations use batch processing
- Archive list pagination for large datasets
- Cached archive counts for dashboard stats

### Future Enhancements

- Archive search and filtering
- Archive export functionality
- Archive sharing between admins
- Archive templates for recurring exam periods
- Archive analytics and reporting</content>
<parameter name="filePath">c:\Users\Dave\OneDrive\Documents\Projects\ExamScriptTracking\ARCHIVE_FEATURE_DOCS.md