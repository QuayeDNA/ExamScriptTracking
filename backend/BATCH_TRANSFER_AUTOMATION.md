# Batch Transfer Automation Service

This service automates the status progression of exam sessions based on batch transfer events, ensuring a smooth workflow from exam submission to completion.

## Automated Status Flow

### 1. Initial Setup
- **NOT_STARTED** → **IN_PROGRESS** (when exam starts)
- **IN_PROGRESS** → **SUBMITTED** (when exam ends - creates initial custody record)

### 2. Transfer Initiation
- **SUBMITTED** → **IN_TRANSIT** (when first transfer is initiated)
  - Triggered by: `BatchTransferAutomationService.handleTransferInitiated()`
  - Called from: `createTransfer()` in batchTransferController

### 3. Transfer Confirmation
- **IN_TRANSIT** → **WITH_LECTURER** (when transfer reaches a LECTURER)
- **IN_TRANSIT** → **UNDER_GRADING** (when transfer reaches DEPARTMENT_HEAD or FACULTY_OFFICER)
  - Triggered by: `BatchTransferAutomationService.handleTransferConfirmed()`
  - Called from: `confirmTransfer()` in batchTransferController

### 4. Manual Progression (by authorized users)
- **WITH_LECTURER** → **UNDER_GRADING** (lecturer starts grading)
- **UNDER_GRADING** → **GRADED** (grading completed)
- **GRADED** → **RETURNED** (scripts returned to students)
- **RETURNED** → **COMPLETED** (process finished)

## Key Features

### Automatic Status Updates
- **Transfer Initiation**: Status changes to "IN_TRANSIT" when first transfer is created
- **Role-Based Progression**: Status automatically updates based on receiver's role
- **Validation**: All transitions are validated against allowed state changes
- **Audit Logging**: All automated changes are logged with full context

### Manual Status Updates
- Authorized users (Lecturers, Department Heads, Faculty Officers, Admins) can manually update status
- Additional automation hooks available for future enhancements
- Full audit trail maintained

### Error Handling
- Graceful failure handling - automation doesn't break core transfer functionality
- Console logging for debugging and monitoring
- Validation ensures only allowed transitions occur

## Usage Examples

### Transfer Initiation
```typescript
// When a transfer is created
await BatchTransferAutomationService.handleTransferInitiated(
  examSessionId,
  userId
);
```

### Transfer Confirmation
```typescript
// When a transfer is confirmed
await BatchTransferAutomationService.handleTransferConfirmed(
  examSessionId,
  transferId,
  receiverId,
  receiverRole
);
```

### Manual Status Update
```typescript
// When status is manually changed
await BatchTransferAutomationService.handleManualStatusUpdate(
  examSessionId,
  newStatus,
  userId
);
```

## Status Transition Rules

| Current Status | Allowed Next Statuses | Trigger |
|---------------|----------------------|---------|
| NOT_STARTED | IN_PROGRESS | Exam start |
| IN_PROGRESS | SUBMITTED | Exam end |
| SUBMITTED | IN_TRANSIT | First transfer initiated |
| IN_TRANSIT | WITH_LECTURER, SUBMITTED | Transfer to lecturer or return |
| WITH_LECTURER | UNDER_GRADING, IN_TRANSIT | Start grading or rollback |
| UNDER_GRADING | GRADED | Grading complete |
| GRADED | RETURNED | Scripts returned |
| RETURNED | COMPLETED | Process complete |
| COMPLETED | (terminal state) | N/A |

## Integration Points

- **batchTransferController**: Calls automation on transfer create/confirm
- **examSessionController**: Calls automation on manual status updates
- **Socket Events**: Real-time notifications for status changes
- **Audit Logging**: Complete trail of all status changes
- **Incident Service**: Auto-creates incidents for discrepancies

## Future Enhancements

- **Return Transfer Automation**: Auto-create return transfers when grading completes
- **Deadline Monitoring**: Alerts for overdue status transitions
- **Workflow Templates**: Configurable workflows per department/faculty
- **Bulk Operations**: Handle multiple batches simultaneously
- **Integration APIs**: Connect with external grading systems</content>
<parameter name="filePath">c:\Users\Dave\OneDrive\Documents\Projects\ExamScriptTracking\backend\src\services\README.md