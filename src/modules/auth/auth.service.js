'use strict';

const bcrypt = require('bcryptjs');
const dayjs = require('dayjs');
const { getPrisma } = require('../../database');
const { hashPassword, comparePassword } = require('../../utils/password');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const { AuthenticationError, ValidationError, NotFoundError } = require('../../core/api-error');

const buildUserPayload = (user) => ({
  sub: user.id,
  email: user.email,
  role: user.role,
});

const getRefreshExpirationDate = (refreshToken) => {
  const decoded = verifyRefreshToken(refreshToken);
  return dayjs.unix(decoded.exp).toDate();
};

const createRefreshTokenRecord = async (prisma, userId, refreshToken, metadata = {}) => {
  const hash = await bcrypt.hash(refreshToken, 10);
  const expiresAt = getRefreshExpirationDate(refreshToken);

  const record = await prisma.refreshToken.create({
    data: {
      userId,
      token: hash,
      expiresAt,
      metadata,
    },
  });

  return record;
};

const registerVolunteer = async (payload) => {
  const prisma = getPrisma();

  const existing = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existing) {
    throw new ValidationError('El correo ya se encuentra registrado');
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        fullName: payload.fullName,
        email: payload.email,
        passwordHash: await hashPassword(payload.password),
        phoneNumber: payload.phoneNumber,
        role: 'VOLUNTEER',
        status: 'ACTIVE',
      },
    });

    await tx.volunteerProfile.create({
      data: {
        userId: user.id,
        bio: payload.bio,
        baseLocation: payload.baseLocation,
        latitude: payload.latitude,
        longitude: payload.longitude,
        availability: payload.availability,
        skills: payload.skills || [],
        certifications: payload.certifications || [],
        transportOptions: payload.transportOptions || [],
      },
    });

    const accessToken = signAccessToken(buildUserPayload(user));
    const refreshToken = signRefreshToken(buildUserPayload(user));
    const refreshRecord = await createRefreshTokenRecord(
      tx,
      user.id,
      refreshToken,
      { type: 'volunteer_register' },
    );

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
        refreshTokenId: refreshRecord.id,
      },
    };
  });
};

const registerOrganization = async (payload) => {
  const prisma = getPrisma();

  const existing = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existing) {
    throw new ValidationError('El correo ya se encuentra registrado');
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        fullName: payload.fullName,
        email: payload.email,
        passwordHash: await hashPassword(payload.password),
        phoneNumber: payload.phoneNumber,
        role: 'ORGANIZATION',
        status: 'ACTIVE',
      },
    });

    const organization = await tx.organization.create({
      data: {
        createdByUserId: user.id,
        name: payload.organization.name,
        description: payload.organization.description,
        sector: payload.organization.sector,
        contactEmail: payload.email,
        contactPhone: payload.phoneNumber,
        headquartersLocation: payload.organization.headquartersLocation,
        coverageAreas: payload.organization.coverageAreas || [],
      },
    });

    await tx.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        role: 'OWNER',
      },
    });

    const accessToken = signAccessToken(buildUserPayload(user));
    const refreshToken = signRefreshToken(buildUserPayload(user));
    const refreshRecord = await createRefreshTokenRecord(
      tx,
      user.id,
      refreshToken,
      { type: 'organization_register', organizationId: organization.id },
    );

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      organization: {
        id: organization.id,
        name: organization.name,
      },
      tokens: {
        accessToken,
        refreshToken,
        refreshTokenId: refreshRecord.id,
      },
    };
  });
};

const login = async ({ email, password }) => {
  const prisma = getPrisma();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AuthenticationError('Credenciales incorrectas');
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    throw new AuthenticationError('Credenciales incorrectas');
  }

  if (user.status !== 'ACTIVE') {
    throw new AuthenticationError('Cuenta inactiva o suspendida');
  }

  const accessToken = signAccessToken(buildUserPayload(user));
  const refreshToken = signRefreshToken(buildUserPayload(user));
  const refreshRecord = await createRefreshTokenRecord(prisma, user.id, refreshToken, {
    type: 'login',
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const volunteerProfile =
    user.role === 'VOLUNTEER'
      ? await prisma.volunteerProfile.findUnique({ where: { userId: user.id } })
      : null;

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      volunteerProfile: volunteerProfile
        ? {
            id: volunteerProfile.id,
            level: volunteerProfile.level,
            totalPoints: volunteerProfile.totalPoints,
          }
        : null,
    },
    tokens: {
      accessToken,
      refreshToken,
      refreshTokenId: refreshRecord.id,
    },
  };
};

const refreshTokens = async ({ refreshToken }) => {
  const prisma = getPrisma();

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AuthenticationError('Refresh token inválido');
  }

  const refreshRecords = await prisma.refreshToken.findMany({
    where: {
      userId: payload.sub,
      revokedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const matchingRecord = refreshRecords.find((record) =>
    bcrypt.compareSync(refreshToken, record.token),
  );

  if (!matchingRecord) {
    throw new AuthenticationError('Refresh token inválido');
  }

  if (dayjs(matchingRecord.expiresAt).isBefore(dayjs())) {
    throw new AuthenticationError('Refresh token expirado');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new AuthenticationError('Usuario no encontrado');
  }

  const newAccess = signAccessToken(buildUserPayload(user));
  const newRefresh = signRefreshToken(buildUserPayload(user));

  await prisma.$transaction(async (tx) => {
    await tx.refreshToken.update({
      where: { id: matchingRecord.id },
      data: { revokedAt: new Date() },
    });
    await createRefreshTokenRecord(tx, user.id, newRefresh, { type: 'refresh' });
  });

  return {
    accessToken: newAccess,
    refreshToken: newRefresh,
  };
};

const revokeRefreshToken = async ({ refreshTokenId, userId }) => {
  const prisma = getPrisma();

  const record = await prisma.refreshToken.findFirst({
    where: { id: refreshTokenId, userId, revokedAt: null },
  });

  if (!record) {
    throw new NotFoundError('Token ya fue revocado o no existe');
  }

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  return { success: true };
};

const getCurrentUser = async (userId) => {
  const prisma = getPrisma();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  const response = { ...user };

  if (user.role === 'VOLUNTEER') {
    const profile = await prisma.volunteerProfile.findUnique({
      where: { userId: user.id },
    });
    response.volunteerProfile = profile;
  }

  if (user.role === 'ORGANIZATION') {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId: user.id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    response.organizations = memberships.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      role: membership.role,
    }));
  }

  return response;
};

module.exports = {
  registerVolunteer,
  registerOrganization,
  login,
  refreshTokens,
  revokeRefreshToken,
  getCurrentUser,
};
