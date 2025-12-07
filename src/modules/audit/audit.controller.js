'use strict';

const auditService = require('./audit.service');

const getAuditLogs = async (req, res, next) => {
  try {
    const filters = {
      organizationId: req.query.organizationId,
      actorId: req.query.actorId,
      action: req.query.action,
      entityType: req.query.entityType,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
    };
    const result = await auditService.getAuditLogs(req.user.id, filters);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const generateUserAuditReport = async (req, res, next) => {
  try {
    const result = await auditService.generateUserAuditReport(req.user.id, req.params.userId);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const generateEventAuditReport = async (req, res, next) => {
  try {
    const result = await auditService.generateEventAuditReport(req.user.id, req.params.eventId);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const exportAuditReportPDF = async (req, res, next) => {
  try {
    const filters = {
      organizationId: req.query.organizationId,
      actorId: req.query.actorId,
      action: req.query.action,
      entityType: req.query.entityType,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
    };
    const logs = await auditService.getAuditLogs(req.user.id, filters);
    
    const pdfGenerator = require('../../services/pdf-generator');
    const pdfBuffer = await pdfGenerator.generateAuditReportPDF(logs, filters);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="reporte_auditoria_${Date.now()}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAuditLogs,
  generateUserAuditReport,
  generateEventAuditReport,
  exportAuditReportPDF,
};


