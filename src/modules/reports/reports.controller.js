'use strict';

const reportsService = require('./reports.service');
const pdfGenerator = require('../../services/pdf-generator');

const getOrganizationDashboard = async (req, res, next) => {
  try {
    const { organizationId, ...filters } = req.query;
    const result = await reportsService.getOrganizationDashboard(
      { organizationId, ...filters },
      req.user,
    );
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const getVolunteerKpis = async (req, res, next) => {
  try {
    const result = await reportsService.getVolunteerKpis(req.query, req.user);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const exportOrganizationReportPDF = async (req, res, next) => {
  try {
    const { organizationId, ...filters } = req.query;
    const reportData = await reportsService.getOrganizationDashboard(
      { organizationId, ...filters },
      req.user,
    );

    const pdfBuffer = await pdfGenerator.generateOrganizationReportPDF(reportData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="reporte_organizacion_${Date.now()}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    return next(error);
  }
};

const exportVolunteerReportPDF = async (req, res, next) => {
  try {
    const reportData = await reportsService.getVolunteerKpis(req.query, req.user);
    const pdfBuffer = await pdfGenerator.generateVolunteerReportPDF(reportData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="reporte_voluntario_${Date.now()}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getOrganizationDashboard,
  getVolunteerKpis,
  exportOrganizationReportPDF,
  exportVolunteerReportPDF,
};
