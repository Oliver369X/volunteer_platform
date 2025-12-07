'use strict';

const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');

/**
 * Genera un PDF de reporte de organización
 */
const generateOrganizationReportPDF = async (reportData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Reporte de Organización', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(reportData.organization.name, { align: 'center' });
      doc.moveDown();

      // Período
      if (reportData.period.from || reportData.period.to) {
        doc.fontSize(10).text(
          `Período: ${reportData.period.from ? new Date(reportData.period.from).toLocaleDateString('es-ES') : 'Inicio'} - ${reportData.period.to ? new Date(reportData.period.to).toLocaleDateString('es-ES') : 'Actual'}`,
          { align: 'center' }
        );
        doc.moveDown();
      }

      doc.moveDown();

      // Estadísticas de Tareas
      doc.fontSize(16).text('Estadísticas de Tareas', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Total de Tareas: ${reportData.tasks.total || 0}`);
      doc.text(`Pendientes: ${reportData.tasks.byStatus?.PENDING || 0}`);
      doc.text(`En Progreso: ${reportData.tasks.byStatus?.IN_PROGRESS || 0}`);
      doc.text(`Completadas: ${reportData.tasks.byStatus?.COMPLETED || 0}`);
      doc.text(`Verificadas: ${reportData.tasks.byStatus?.VERIFIED || 0}`);
      doc.moveDown();

      // Estadísticas de Asignaciones
      doc.fontSize(16).text('Estadísticas de Asignaciones', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Total de Asignaciones: ${reportData.assignments.total || 0}`);
      doc.text(`Tasa de Cumplimiento: ${reportData.assignments.completionRate || 0}%`);
      doc.moveDown();

      // Reconocimientos
      doc.fontSize(16).text('Reconocimientos', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Puntos Totales Otorgados: ${reportData.recognition.totalPointsAwarded || 0}`);
      doc.moveDown();

      // Top Voluntarios
      if (reportData.topVolunteers && reportData.topVolunteers.length > 0) {
        doc.fontSize(16).text('Top Voluntarios', { underline: true });
        doc.moveDown(0.5);
        reportData.topVolunteers.forEach((volunteer, index) => {
          doc.fontSize(12).text(
            `${index + 1}. ${volunteer.fullName || 'Voluntario'} - ${volunteer.assignmentsCompleted || 0} misiones completadas`
          );
        });
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).text(
        `Generado el ${new Date().toLocaleString('es-ES')}`,
        { align: 'center' }
      );

      doc.end();
    } catch (error) {
      logger.error('Error generando PDF de reporte', { error: error.message });
      reject(error);
    }
  });
};

/**
 * Genera un PDF de reporte de auditoría
 */
const generateAuditReportPDF = async (logs, filters = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Reporte de Auditoría', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(
        `Generado el ${new Date().toLocaleString('es-ES')}`,
        { align: 'center' }
      );
      doc.moveDown();

      // Filtros aplicados
      if (Object.keys(filters).length > 0) {
        doc.fontSize(12).text('Filtros Aplicados:', { underline: true });
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            doc.fontSize(10).text(`${key}: ${value}`);
          }
        });
        doc.moveDown();
      }

      doc.moveDown();

      // Resumen
      doc.fontSize(16).text(`Total de Registros: ${logs.length}`, { underline: true });
      doc.moveDown();

      // Tabla de logs
      let yPosition = doc.y;
      const pageHeight = doc.page.height;
      const rowHeight = 60;

      logs.forEach((log, index) => {
        // Nueva página si es necesario
        if (yPosition + rowHeight > pageHeight - 50) {
          doc.addPage();
          yPosition = 50;
        }

        doc.fontSize(10);
        
        // Acción
        doc.text(`Acción: ${log.action}`, 50, yPosition);
        
        // Actor
        doc.text(`Actor: ${log.actor?.fullName || log.actorId} (${log.actorType})`, 50, yPosition + 15);
        
        // Entidad
        doc.text(`Entidad: ${log.entityType} - ${log.entityId}`, 50, yPosition + 30);
        
        // Fecha
        doc.text(`Fecha: ${new Date(log.createdAt).toLocaleString('es-ES')}`, 50, yPosition + 45);
        
        // Línea separadora
        doc.moveTo(50, yPosition + 55).lineTo(550, yPosition + 55).stroke();
        
        yPosition += rowHeight;
      });

      // Footer en cada página
      const addFooter = (page) => {
        doc.fontSize(8).text(
          `Página ${page} - Reporte de Auditoría`,
          50,
          pageHeight - 30,
          { align: 'center' }
        );
      };

      doc.on('pageAdded', () => {
        addFooter(doc.page.number);
      });

      addFooter(1);

      doc.end();
    } catch (error) {
      logger.error('Error generando PDF de auditoría', { error: error.message });
      reject(error);
    }
  });
};

/**
 * Genera un PDF de reporte de voluntario
 */
const generateVolunteerReportPDF = async (reportData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Reporte Personal de Voluntario', { align: 'center' });
      doc.moveDown();

      // Información del Voluntario
      doc.fontSize(16).text('Información Personal', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Nivel: ${reportData.level || 'BRONCE'}`);
      doc.text(`Puntos Totales: ${reportData.totalPoints || 0}`);
      doc.moveDown();

      // Estadísticas del Período
      doc.fontSize(16).text('Estadísticas del Período', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Misiones Completadas: ${reportData.assignmentsCompleted || 0}`);
      doc.text(`Puntos Ganados: ${reportData.pointsEarnedInPeriod || 0}`);
      doc.moveDown();

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).text(
        `Generado el ${new Date().toLocaleString('es-ES')}`,
        { align: 'center' }
      );

      doc.end();
    } catch (error) {
      logger.error('Error generando PDF de reporte de voluntario', { error: error.message });
      reject(error);
    }
  });
};

module.exports = {
  generateOrganizationReportPDF,
  generateAuditReportPDF,
  generateVolunteerReportPDF,
};

