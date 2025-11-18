'use strict';

module.exports = (models) => {
  const {
    User,
    Organization,
    OrganizationMember,
    VolunteerProfile,
    Task,
    Assignment,
    PointTransaction,
    Badge,
    VolunteerBadge,
    RefreshToken,
    AiRecommendation,
    AuditLog,
  } = models;

  if (!User) {
    throw new Error('Los modelos no se cargaron correctamente');
  }

  // Users y perfiles
  User.hasOne(VolunteerProfile, { foreignKey: 'userId', as: 'volunteerProfile' });
  VolunteerProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
  RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // Organizaciones
  Organization.belongsTo(User, {
    foreignKey: { name: 'createdByUserId', allowNull: false },
    as: 'creator',
  });
  User.hasMany(Organization, { foreignKey: 'createdByUserId', as: 'organizationsCreated' });

  Organization.hasMany(OrganizationMember, {
    foreignKey: 'organizationId',
    as: 'members',
  });
  OrganizationMember.belongsTo(Organization, {
    foreignKey: 'organizationId',
    as: 'organization',
  });
  OrganizationMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  User.hasMany(OrganizationMember, { foreignKey: 'userId', as: 'organizationMemberships' });

  // Tareas
  Organization.hasMany(Task, { foreignKey: 'organizationId', as: 'tasks' });
  Task.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

  User.hasMany(Task, { foreignKey: 'createdByUserId', as: 'tasksCreated' });
  Task.belongsTo(User, { foreignKey: 'createdByUserId', as: 'creator' });

  // Asignaciones
  Task.hasMany(Assignment, { foreignKey: 'taskId', as: 'assignments' });
  Assignment.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

  Organization.hasMany(Assignment, { foreignKey: 'organizationId', as: 'assignments' });
  Assignment.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

  User.hasMany(Assignment, { foreignKey: 'volunteerId', as: 'volunteerAssignments' });
  Assignment.belongsTo(User, { foreignKey: 'volunteerId', as: 'volunteer' });

  User.hasMany(Assignment, { foreignKey: 'assignedByUserId', as: 'assignmentsIssued' });
  Assignment.belongsTo(User, { foreignKey: 'assignedByUserId', as: 'assignedBy' });

  // Gamificación
  VolunteerProfile.hasMany(PointTransaction, {
    foreignKey: 'volunteerProfileId',
    as: 'pointTransactions',
  });
  PointTransaction.belongsTo(VolunteerProfile, {
    foreignKey: 'volunteerProfileId',
    as: 'volunteerProfile',
  });

  Assignment.hasMany(PointTransaction, { foreignKey: 'assignmentId', as: 'pointTransactions' });
  PointTransaction.belongsTo(Assignment, { foreignKey: 'assignmentId', as: 'assignment' });

  VolunteerProfile.hasMany(VolunteerBadge, {
    foreignKey: 'volunteerProfileId',
    as: 'volunteerBadges',
  });
  VolunteerBadge.belongsTo(VolunteerProfile, {
    foreignKey: 'volunteerProfileId',
    as: 'volunteerProfile',
  });

  Badge.hasMany(VolunteerBadge, { foreignKey: 'badgeId', as: 'awards' });
  VolunteerBadge.belongsTo(Badge, { foreignKey: 'badgeId', as: 'badge' });

  Assignment.hasMany(VolunteerBadge, { foreignKey: 'assignmentId', as: 'badgesAwarded' });
  VolunteerBadge.belongsTo(Assignment, { foreignKey: 'assignmentId', as: 'assignment' });

  // AI
  Task.hasMany(AiRecommendation, { foreignKey: 'taskId', as: 'aiRecommendations' });
  AiRecommendation.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

  Organization.hasMany(AiRecommendation, {
    foreignKey: 'organizationId',
    as: 'aiRecommendations',
  });
  AiRecommendation.belongsTo(Organization, {
    foreignKey: 'organizationId',
    as: 'organization',
  });

  User.hasMany(AiRecommendation, { foreignKey: 'volunteerId', as: 'aiRecommendations' });
  AiRecommendation.belongsTo(User, { foreignKey: 'volunteerId', as: 'volunteer' });

  // Auditoría
  Organization.hasMany(AuditLog, { foreignKey: 'organizationId', as: 'auditLogs' });
  AuditLog.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

  User.hasMany(AuditLog, { foreignKey: 'actorId', as: 'auditLogs' });
  AuditLog.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });
};


