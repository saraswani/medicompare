/**
 * ReportService
 * Handles persistence, validation, and review tracking for medicine error reports.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPORTS_FILE = path.join(__dirname, '..', 'data', 'error_reports.json');
const VERCEL_TMP_FILE = path.join('/tmp', 'error_reports.json');

function getFilePath() {
  if (process.env.VERCEL) {
    if (!fs.existsSync(VERCEL_TMP_FILE)) {
      try {
        if (fs.existsSync(REPORTS_FILE)) {
          fs.copyFileSync(REPORTS_FILE, VERCEL_TMP_FILE);
        } else {
          fs.writeFileSync(VERCEL_TMP_FILE, '[]', 'utf8');
        }
      } catch (e) {
        // Fall back to reading from bundle
        return REPORTS_FILE;
      }
    }
    return VERCEL_TMP_FILE;
  }
  return REPORTS_FILE;
}

export class ReportService {
  static loadReports() {
    try {
      const targetFile = getFilePath();
      if (!fs.existsSync(targetFile)) {
        return [];
      }
      const raw = fs.readFileSync(targetFile, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      console.error('Error loading error reports:', e);
      return [];
    }
  }

  static saveReports(reports) {
    try {
      const targetFile = getFilePath();
      fs.writeFileSync(targetFile, JSON.stringify(reports, null, 2), 'utf8');
      return true;
    } catch (e) {
      console.error('Error saving error reports:', e);
      return false;
    }
  }

  static submitReport(data) {
    const { medicine_id, medicine_name, error_type, description, reporter_contact, suggested_correction, source_reference } = data;

    if (!medicine_id || !description) {
      throw new Error('medicine_id and description are required fields.');
    }

    const reportId = `ERR-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReport = {
      report_id: reportId,
      medicine_id: String(medicine_id).trim(),
      medicine_name: String(medicine_name || 'Unknown').trim(),
      error_type: String(error_type || 'GENERAL_DATA_INACCURACY').trim(),
      description: String(description).trim(),
      reporter_contact: String(reporter_contact || 'Anonymous').trim(),
      suggested_correction: String(suggested_correction || '').trim(),
      source_reference: String(source_reference || '').trim(),
      status: 'PENDING_REVIEW',
      submitted_at: new Date().toISOString(),
      review_log: [
        {
          timestamp: new Date().toISOString(),
          action: 'REPORT_SUBMITTED',
          note: 'Report queued for clinical reviewer evaluation.'
        }
      ]
    };

    const reports = this.loadReports();
    reports.unshift(newReport);
    this.saveReports(reports);

    return newReport;
  }

  static getReports(statusFilter = null) {
    const reports = this.loadReports();
    if (!statusFilter) return reports;
    return reports.filter(r => r.status === statusFilter);
  }
}
