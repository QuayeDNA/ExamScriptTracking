import { Server, Socket } from "socket.io";

/**
 * Incident created - notify admins and department heads
 */
export function emitIncidentCreated(
  io: Server,
  incident: {
    id: string;
    incidentNumber: string;
    type: string;
    severity: string;
    title: string;
    reporter: any;
  }
) {
  // Notify all admins and department heads
  io.to("role:ADMIN").emit("incident:created", { incident });
  io.to("role:DEPARTMENT_HEAD").emit("incident:created", { incident });

  console.log(`[Socket] Incident created: ${incident.incidentNumber}`);
}

/**
 * Incident assigned - notify assignee and reporter
 */
export function emitIncidentAssigned(
  io: Server,
  incident: any,
  assigneeId: string,
  reporterId: string
) {
  // Notify the assignee
  io.to(`user:${assigneeId}`).emit("incident:assigned", {
    incident,
    message: `You have been assigned to incident ${incident.incidentNumber}`,
  });

  // Notify the reporter
  io.to(`user:${reporterId}`).emit("incident:updated", {
    incident,
    message: `Incident ${incident.incidentNumber} has been assigned`,
  });

  console.log(
    `[Socket] Incident ${incident.incidentNumber} assigned to user ${assigneeId}`
  );
}

/**
 * Incident status changed - notify relevant users
 */
export function emitIncidentStatusChanged(
  io: Server,
  incident: any,
  oldStatus: string,
  newStatus: string
) {
  // Notify reporter and assignee
  if (incident.reporterId) {
    io.to(`user:${incident.reporterId}`).emit("incident:status_changed", {
      incident,
      oldStatus,
      newStatus,
    });
  }

  if (incident.assigneeId) {
    io.to(`user:${incident.assigneeId}`).emit("incident:status_changed", {
      incident,
      oldStatus,
      newStatus,
    });
  }

  // Special handling for escalated incidents
  if (newStatus === "ESCALATED") {
    io.to("role:DEPARTMENT_HEAD").emit("incident:escalated", { incident });
    io.to("role:FACULTY_OFFICER").emit("incident:escalated", { incident });
    io.to("role:ADMIN").emit("incident:escalated", { incident });
    console.log(`[Socket] Incident ${incident.incidentNumber} escalated`);
  }

  // Special handling for resolved incidents
  if (newStatus === "RESOLVED") {
    io.to(`user:${incident.reporterId}`).emit("incident:resolved", {
      incident,
    });
    console.log(`[Socket] Incident ${incident.incidentNumber} resolved`);
  }

  console.log(
    `[Socket] Incident ${incident.incidentNumber} status: ${oldStatus} → ${newStatus}`
  );
}

/**
 * Comment added to incident - notify relevant users
 */
export function emitIncidentCommentAdded(
  io: Server,
  incidentId: string,
  comment: any,
  reporterId: string,
  assigneeId: string | null,
  commenterId: string
) {
  // Notify reporter (if not the commenter)
  if (reporterId !== commenterId) {
    io.to(`user:${reporterId}`).emit("incident:comment_added", {
      incidentId,
      comment,
    });
  }

  // Notify assignee (if exists and not the commenter)
  if (assigneeId && assigneeId !== commenterId) {
    io.to(`user:${assigneeId}`).emit("incident:comment_added", {
      incidentId,
      comment,
    });
  }

  console.log(
    `[Socket] Comment added to incident ${incidentId} by user ${commenterId}`
  );
}

/**
 * Incident updated - notify relevant users
 */
export function emitIncidentUpdated(io: Server, incident: any) {
  // Notify reporter and assignee
  if (incident.reporterId) {
    io.to(`user:${incident.reporterId}`).emit("incident:updated", { incident });
  }

  if (incident.assigneeId) {
    io.to(`user:${incident.assigneeId}`).emit("incident:updated", { incident });
  }

  console.log(`[Socket] Incident ${incident.incidentNumber} updated`);
}

/**
 * Attachment uploaded - notify relevant users
 */
export function emitIncidentAttachmentUploaded(
  io: Server,
  incidentId: string,
  attachments: any[],
  reporterId: string,
  assigneeId: string | null
) {
  const data = { incidentId, attachments };

  // Notify reporter and assignee
  if (reporterId) {
    io.to(`user:${reporterId}`).emit("incident:attachment_uploaded", data);
  }

  if (assigneeId) {
    io.to(`user:${assigneeId}`).emit("incident:attachment_uploaded", data);
  }

  console.log(
    `[Socket] ${attachments.length} attachment(s) uploaded to incident ${incidentId}`
  );
}
