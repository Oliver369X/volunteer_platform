'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      full_name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(160),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      phone_number: {
        type: Sequelize.STRING(20),
      },
      role: {
        type: Sequelize.ENUM('ADMIN', 'ORGANIZATION', 'VOLUNTEER'),
        allowNull: false,
        defaultValue: 'VOLUNTEER',
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'SUSPENDED', 'PENDING'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      last_login_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    await queryInterface.createTable('organizations', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      created_by_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      sector: {
        type: Sequelize.STRING(80),
      },
      contact_email: {
        type: Sequelize.STRING(160),
        allowNull: false,
      },
      contact_phone: {
        type: Sequelize.STRING(25),
      },
      headquarters_location: {
        type: Sequelize.STRING(255),
      },
      coverage_areas: {
        type: Sequelize.ARRAY(Sequelize.STRING),
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    await queryInterface.createTable('organization_members', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'organizations', key: 'id' },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.ENUM('OWNER', 'COORDINATOR', 'ANALYST'),
        allowNull: false,
        defaultValue: 'COORDINATOR',
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    await queryInterface.createTable('volunteer_profiles', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        unique: true,
      },
      bio: {
        type: Sequelize.TEXT,
      },
      base_location: {
        type: Sequelize.STRING(180),
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 7),
      },
      longitude: {
        type: Sequelize.DECIMAL(10, 7),
      },
      availability: {
        type: Sequelize.JSONB,
      },
      skills: {
        type: Sequelize.ARRAY(Sequelize.STRING),
      },
      certifications: {
        type: Sequelize.ARRAY(Sequelize.STRING),
      },
      transport_options: {
        type: Sequelize.ARRAY(Sequelize.STRING),
      },
      reputation_score: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      total_points: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      level: {
        type: Sequelize.ENUM('BRONCE', 'PLATA', 'ORO', 'PLATINO'),
        defaultValue: 'BRONCE',
      },
      experience_hours: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    await queryInterface.createTable('tasks', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'organizations', key: 'id' },
        onDelete: 'CASCADE',
      },
      created_by_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING(180),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      status: {
        type: Sequelize.ENUM(
          'PENDING',
          'ASSIGNED',
          'IN_PROGRESS',
          'COMPLETED',
          'VERIFIED',
          'CANCELLED',
        ),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      urgency: {
        type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
        allowNull: false,
        defaultValue: 'MEDIUM',
      },
      category: {
        type: Sequelize.STRING(80),
      },
      skills_required: {
        type: Sequelize.ARRAY(Sequelize.STRING),
      },
      location_name: {
        type: Sequelize.STRING(180),
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 7),
      },
      longitude: {
        type: Sequelize.DECIMAL(10, 7),
      },
      start_at: {
        type: Sequelize.DATE,
      },
      end_at: {
        type: Sequelize.DATE,
      },
      volunteers_needed: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      metadata: {
        type: Sequelize.JSONB,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    await queryInterface.createTable('assignments', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      task_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tasks', key: 'id' },
        onDelete: 'CASCADE',
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'organizations', key: 'id' },
        onDelete: 'CASCADE',
      },
      volunteer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      assigned_by_user_id: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM(
          'PENDING',
          'ACCEPTED',
          'REJECTED',
          'IN_PROGRESS',
          'COMPLETED',
          'VERIFIED',
        ),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      assigned_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      responded_at: {
        type: Sequelize.DATE,
      },
      completed_at: {
        type: Sequelize.DATE,
      },
      verification_notes: {
        type: Sequelize.TEXT,
      },
      evidence_url: {
        type: Sequelize.STRING(255),
      },
      rating: {
        type: Sequelize.INTEGER,
      },
      feedback: {
        type: Sequelize.TEXT,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    await queryInterface.createTable('badges', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING(80),
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      category: {
        type: Sequelize.STRING(60),
      },
      level: {
        type: Sequelize.ENUM('BRONCE', 'PLATA', 'ORO', 'PLATINO', 'ESPECIAL'),
        allowNull: false,
        defaultValue: 'BRONCE',
      },
      criteria: {
        type: Sequelize.JSONB,
      },
      icon_url: {
        type: Sequelize.STRING(255),
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    await queryInterface.createTable('volunteer_badges', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      volunteer_profile_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'volunteer_profiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      badge_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'badges', key: 'id' },
        onDelete: 'CASCADE',
      },
      assignment_id: {
        type: Sequelize.UUID,
        references: { model: 'assignments', key: 'id' },
        onDelete: 'SET NULL',
      },
      token_id: {
        type: Sequelize.STRING(160),
      },
      blockchain_status: {
        type: Sequelize.ENUM('PENDING', 'MINTED', 'FAILED'),
        defaultValue: 'PENDING',
      },
      shared_at: {
        type: Sequelize.DATE,
      },
      metadata: {
        type: Sequelize.JSONB,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    await queryInterface.createTable('point_transactions', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      volunteer_profile_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'volunteer_profiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      assignment_id: {
        type: Sequelize.UUID,
        references: { model: 'assignments', key: 'id' },
        onDelete: 'SET NULL',
      },
      type: {
        type: Sequelize.ENUM('EARN', 'REDEEM', 'ADJUSTMENT'),
        allowNull: false,
      },
      points: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(255),
      },
      reference_type: {
        type: Sequelize.STRING(60),
      },
      reference_id: {
        type: Sequelize.UUID,
      },
      metadata: {
        type: Sequelize.JSONB,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    await queryInterface.createTable('refresh_tokens', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      token: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      revoked_at: {
        type: Sequelize.DATE,
      },
      metadata: {
        type: Sequelize.JSONB,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    await queryInterface.createTable('ai_recommendations', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      task_id: {
        type: Sequelize.UUID,
        references: { model: 'tasks', key: 'id' },
        onDelete: 'SET NULL',
      },
      volunteer_id: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      organization_id: {
        type: Sequelize.UUID,
        references: { model: 'organizations', key: 'id' },
        onDelete: 'SET NULL',
      },
      request_context: {
        type: Sequelize.JSONB,
      },
      response_payload: {
        type: Sequelize.JSONB,
      },
      confidence_score: {
        type: Sequelize.FLOAT,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      organization_id: {
        type: Sequelize.UUID,
        references: { model: 'organizations', key: 'id' },
        onDelete: 'SET NULL',
      },
      action: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      actor_type: {
        type: Sequelize.STRING(60),
      },
      actor_id: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      entity_type: {
        type: Sequelize.STRING(60),
      },
      entity_id: {
        type: Sequelize.UUID,
      },
      metadata: {
        type: Sequelize.JSONB,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    // Índices
    await queryInterface.addIndex('tasks', ['organization_id', 'status']);
    await queryInterface.addIndex('assignments', ['volunteer_id', 'status']);
    await queryInterface.addIndex('volunteer_profiles', ['level']);
    await queryInterface.addIndex('point_transactions', ['volunteer_profile_id']);
    await queryInterface.addIndex('audit_logs', ['organization_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('audit_logs', ['organization_id']);
    await queryInterface.removeIndex('point_transactions', ['volunteer_profile_id']);
    await queryInterface.removeIndex('volunteer_profiles', ['level']);
    await queryInterface.removeIndex('assignments', ['volunteer_id', 'status']);
    await queryInterface.removeIndex('tasks', ['organization_id', 'status']);

    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('ai_recommendations');
    await queryInterface.dropTable('refresh_tokens');
    await queryInterface.dropTable('point_transactions');
    await queryInterface.dropTable('volunteer_badges');
    await queryInterface.dropTable('badges');
    await queryInterface.dropTable('assignments');
    await queryInterface.dropTable('tasks');
    await queryInterface.dropTable('volunteer_profiles');
    await queryInterface.dropTable('organization_members');
    await queryInterface.dropTable('organizations');

    await queryInterface.dropTable('users');

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_assignments_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tasks_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tasks_urgency";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_organization_members_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_volunteer_profiles_level";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_badges_level";');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_volunteer_badges_blockchain_status";',
    );
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_point_transactions_type";');
  },
};
