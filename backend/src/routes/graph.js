/**
 * Graph API Routes - Frontend-Compatible Wrappers
 *
 * Simplified conflict detection routes for frontend integration
 * Wraps graph_analyzer conflict routes with batch support
 *
 * @module routes/graph
 */

const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const logger = require('../config/logger');
const { authenticate } = require('../middleware/auth');
const graphService = require('../graph_analyzer/services/graph_service');
const { validateRiskInputs } = require('../graph_analyzer/models/risk_calculator');
const Mediator = require('../models/Mediator');

/**
 * POST /api/graph/check-conflicts
 * Check conflicts for a single mediator against multiple parties
 *
 * Body: {
 *   mediatorId: string,
 *   parties: string[] - Array of party names
 * }
 */
router.post('/check-conflicts', async (req, res) => {
  try {
    const { mediatorId, parties } = req.body;

    if (!mediatorId || !parties || !Array.isArray(parties)) {
      return res.status(400).json({
        success: false,
        error: 'mediatorId and parties array are required'
      });
    }

    // Analyze conflicts against all parties
    const conflictChecks = await Promise.allSettled(
      parties.map(party =>
        graphService.analyzeConflict(mediatorId, party, { maxDepth: 3 })
      )
    );

    // Aggregate results
    const paths = [];
    let maxRiskScore = 0;
    let riskLevel = 'GREEN';

    conflictChecks.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        const analysis = result.value;

        // Collect conflict paths
        if (analysis.paths && analysis.paths.length > 0) {
          paths.push(...analysis.paths);
        }

        // Track max risk
        if (analysis.riskScore > maxRiskScore) {
          maxRiskScore = analysis.riskScore;
          riskLevel = analysis.riskLevel;
        }
      }
    });

    res.json({
      mediatorId,
      parties,
      riskLevel,
      riskScore: maxRiskScore,
      paths,
      conflictCount: paths.length
    });

  } catch (error) {
    logger.error('[GraphRoutes] Error checking conflicts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check conflicts',
      message: error.message
    });
  }
});

/**
 * POST /api/graph/batch-check-conflicts
 * Check conflicts for multiple mediators against parties
 *
 * Body: {
 *   mediatorIds: string[],
 *   parties: string[]
 * }
 */
router.post('/batch-check-conflicts', async (req, res) => {
  try {
    const { mediatorIds, parties } = req.body;

    if (!mediatorIds || !Array.isArray(mediatorIds) || !parties || !Array.isArray(parties)) {
      return res.status(400).json({
        success: false,
        error: 'mediatorIds and parties arrays are required'
      });
    }

    // Limit batch size
    if (mediatorIds.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Batch size limited to 50 mediators'
      });
    }

    // Check conflicts for each mediator
    const results = {};

    await Promise.allSettled(
      mediatorIds.map(async (mediatorId) => {
        const conflictChecks = await Promise.allSettled(
          parties.map(party =>
            graphService.analyzeConflict(mediatorId, party, { maxDepth: 3 })
          )
        );

        const paths = [];
        let maxRiskScore = 0;
        let riskLevel = 'GREEN';

        conflictChecks.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            const analysis = result.value;

            if (analysis.paths && analysis.paths.length > 0) {
              paths.push(...analysis.paths);
            }

            if (analysis.riskScore > maxRiskScore) {
              maxRiskScore = analysis.riskScore;
              riskLevel = analysis.riskLevel;
            }
          }
        });

        results[mediatorId] = {
          riskLevel,
          riskScore: maxRiskScore,
          paths,
          conflictCount: paths.length
        };
      })
    );

    res.json(results);

  } catch (error) {
    logger.error('[GraphRoutes] Error batch checking conflicts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to batch check conflicts',
      message: error.message
    });
  }
});

/**
 * GET /api/graph/relationships
 * Get relationship paths between two entities
 *
 * Query: entity1, entity2
 */
router.get('/relationships', async (req, res) => {
  try {
    const { entity1, entity2 } = req.query;

    if (!entity1 || !entity2) {
      return res.status(400).json({
        success: false,
        error: 'entity1 and entity2 query parameters are required'
      });
    }

    const paths = await graphService.findPaths(entity1, entity2, { maxDepth: 4 });

    res.json({
      entity1,
      entity2,
      pathCount: paths.length,
      paths
    });

  } catch (error) {
    logger.error('[GraphRoutes] Error finding relationships:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find relationships',
      message: error.message
    });
  }
});

/**
 * GET /api/graph/conflict-report/:mediatorId
 * Generate a PDF conflict/bias report for a mediator
 * Requires authentication. Returns application/pdf stream.
 *
 * Query params:
 *   format=pdf (default) | format=json (returns raw data for testing)
 */
router.get('/conflict-report/:mediatorId', authenticate, async (req, res) => {
  try {
    const { mediatorId } = req.params;
    const format = req.query.format || 'pdf';

    // Fetch mediator — only fields needed for report
    const mediator = await Mediator.findById(mediatorId).select(
      'name bio email phone website location lawFirm currentEmployer specializations ' +
      'yearsExperience barAdmissions certifications ideologyScore biasIndicators ' +
      'conflictRisk lobbyingData'
    ).lean();

    if (!mediator) {
      return res.status(404).json({ success: false, error: 'Mediator not found' });
    }

    // Expose raw data if requested (useful for testing / frontend preview)
    if (format === 'json') {
      return res.json({ success: true, data: mediator });
    }

    // ── Build PDF ──────────────────────────────────────────────────────────
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filename = `FairMediator-Report-${mediator.name.replace(/\s+/g, '-')}-${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    const DARK = '#1a1a2e';
    const ACCENT = '#374151';
    const MUTED = '#6b7280';
    const RED = '#dc2626';
    const YELLOW = '#d97706';
    const GREEN = '#16a34a';
    const PAGE_WIDTH = doc.page.width - 100; // left + right margin

    // ── Header ─────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 80).fill(DARK);
    doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold')
      .text('FairMediator', 50, 25);
    doc.fillColor('#9ca3af').fontSize(10).font('Helvetica')
      .text('Conflict & Bias Analysis Report', 50, 50);
    doc.fillColor(MUTED).fontSize(9)
      .text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 65);

    doc.y = 100;

    // ── Mediator Name ───────────────────────────────────────────────────────
    doc.fillColor(DARK).fontSize(18).font('Helvetica-Bold')
      .text(mediator.name, 50, doc.y);
    doc.moveDown(0.3);

    const subParts = [
      mediator.lawFirm || mediator.currentEmployer,
      mediator.location?.city && mediator.location?.state
        ? `${mediator.location.city}, ${mediator.location.state}`
        : mediator.location?.state,
      mediator.yearsExperience ? `${mediator.yearsExperience} yrs experience` : null,
    ].filter(Boolean);

    if (subParts.length) {
      doc.fillColor(MUTED).fontSize(10).font('Helvetica')
        .text(subParts.join(' · '), 50, doc.y);
      doc.moveDown(0.5);
    }

    doc.moveTo(50, doc.y).lineTo(50 + PAGE_WIDTH, doc.y).strokeColor('#e5e7eb').stroke();
    doc.moveDown(0.8);

    // ── Helper: section heading ─────────────────────────────────────────────
    const sectionHeading = (title) => {
      doc.moveDown(0.5);
      doc.fillColor(DARK).fontSize(12).font('Helvetica-Bold').text(title, 50, doc.y);
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(50 + PAGE_WIDTH, doc.y).strokeColor('#d1d5db').lineWidth(0.5).stroke();
      doc.moveDown(0.4);
    };

    const labelValue = (label, value) => {
      if (!value) return;
      doc.fillColor(MUTED).fontSize(9).font('Helvetica-Bold').text(`${label}:  `, 50, doc.y, { continued: true });
      doc.fillColor(ACCENT).font('Helvetica').text(String(value));
      doc.moveDown(0.2);
    };

    // ── Bio ─────────────────────────────────────────────────────────────────
    if (mediator.bio) {
      sectionHeading('Professional Summary');
      doc.fillColor(ACCENT).fontSize(10).font('Helvetica')
        .text(mediator.bio, 50, doc.y, { width: PAGE_WIDTH, lineGap: 2 });
      doc.moveDown(0.6);
    }

    // ── Professional Details ────────────────────────────────────────────────
    sectionHeading('Professional Details');
    labelValue('Bar Admissions', mediator.barAdmissions?.join(', ') || 'Not listed');
    labelValue('Certifications', mediator.certifications?.join(', ') || 'None on file');
    labelValue('Specializations', mediator.specializations?.join(', ') || 'General');
    labelValue('Website', mediator.website || 'Not provided');

    // ── Ideology Score ──────────────────────────────────────────────────────
    sectionHeading('Ideology & Bias Assessment');

    const score = mediator.ideologyScore ?? 0;
    const absScore = Math.abs(score);
    const ideologyLabel =
      absScore <= 1 ? 'Neutral' :
      score < -5 ? 'Strongly Liberal' :
      score < 0 ? 'Moderate Liberal' :
      score > 5 ? 'Strongly Conservative' : 'Moderate Conservative';
    const ideologyColor = absScore <= 2 ? GREEN : absScore <= 5 ? YELLOW : RED;

    doc.fillColor(MUTED).fontSize(9).font('Helvetica-Bold').text('Ideology Score:  ', 50, doc.y, { continued: true });
    doc.fillColor(ideologyColor).font('Helvetica').text(`${score.toFixed(1)} / 10  (${ideologyLabel})`);
    doc.moveDown(0.3);

    // Score bar (simple rect visualization)
    const barY = doc.y;
    const barW = PAGE_WIDTH;
    doc.rect(50, barY, barW, 8).fillColor('#f3f4f6');
    const fillW = Math.round(((score + 10) / 20) * barW);
    doc.rect(50, barY, fillW, 8).fillColor(ideologyColor);
    doc.rect(50, barY, barW, 8).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
    doc.fillColor(MUTED).fontSize(8).text('Liberal', 50, barY + 11);
    doc.text('Conservative', 50 + barW - 55, barY + 11);
    doc.y = barY + 26;
    doc.moveDown(0.5);

    // ── Political Affiliations ──────────────────────────────────────────────
    const affiliations = mediator.biasIndicators?.politicalAffiliations || [];
    const donations = mediator.biasIndicators?.donationHistory || [];
    const statements = mediator.biasIndicators?.publicStatements || [];

    if (affiliations.length || donations.length) {
      sectionHeading('Political Affiliations & Donations');

      if (affiliations.length) {
        labelValue('Known Affiliations', affiliations.join(', '));
      }

      if (donations.length) {
        doc.moveDown(0.3);
        doc.fillColor(MUTED).fontSize(9).font('Helvetica-Bold').text('Donation History:', 50, doc.y);
        doc.moveDown(0.3);
        donations.slice(0, 10).forEach((d) => {
          const line = `${d.year || '—'}  ${d.recipient || 'Unknown recipient'}  $${(d.amount || 0).toLocaleString()}  (${d.party || '—'})`;
          doc.fillColor(ACCENT).fontSize(9).font('Helvetica').text(`• ${line}`, 60, doc.y, { width: PAGE_WIDTH - 10 });
          doc.moveDown(0.2);
        });
        if (donations.length > 10) {
          doc.fillColor(MUTED).fontSize(8).text(`  ...and ${donations.length - 10} more`, 60, doc.y);
          doc.moveDown(0.2);
        }
      }
    }

    // ── Public Statements ───────────────────────────────────────────────────
    if (statements.length) {
      sectionHeading('Public Statements');
      statements.slice(0, 5).forEach((s) => {
        doc.fillColor(ACCENT).fontSize(9).font('Helvetica-Oblique')
          .text(`"${s.statement}"`, 60, doc.y, { width: PAGE_WIDTH - 10, lineGap: 1 });
        doc.fillColor(MUTED).fontSize(8).font('Helvetica')
          .text(`Source: ${s.source || 'Unknown'} · Sentiment: ${s.sentiment || 'Unclassified'}`, 60, doc.y);
        doc.moveDown(0.5);
      });
    }

    // ── Conflict Risk ───────────────────────────────────────────────────────
    const risk = mediator.conflictRisk;
    if (risk) {
      sectionHeading('Conflict Risk Indicators');
      const riskColor = risk.level === 'HIGH' ? RED : risk.level === 'MEDIUM' ? YELLOW : GREEN;
      doc.fillColor(MUTED).fontSize(9).font('Helvetica-Bold').text('Risk Level:  ', 50, doc.y, { continued: true });
      doc.fillColor(riskColor).font('Helvetica').text(risk.level || 'Unknown');
      doc.moveDown(0.2);
      if (risk.flags?.length) {
        risk.flags.slice(0, 5).forEach((flag) => {
          doc.fillColor(ACCENT).fontSize(9).font('Helvetica').text(`• ${flag}`, 60, doc.y, { width: PAGE_WIDTH - 10 });
          doc.moveDown(0.2);
        });
      }
    }

    // ── Disclaimer ──────────────────────────────────────────────────────────
    doc.moveDown(1.5);
    doc.rect(50, doc.y, PAGE_WIDTH, 1).fillColor('#e5e7eb');
    doc.moveDown(0.8);
    doc.fillColor(MUTED).fontSize(8).font('Helvetica')
      .text(
        'DISCLAIMER: This report is generated from publicly available data and algorithmic analysis. ' +
        'It is intended for informational purposes only and does not constitute legal advice. ' +
        'FairMediator does not guarantee the accuracy or completeness of this information.',
        50, doc.y, { width: PAGE_WIDTH, lineGap: 2 }
      );

    doc.end();

    logger.info(`[ConflictReport] PDF generated for mediator ${mediatorId} by user ${req.user?.userId}`);

  } catch (error) {
    logger.error('[ConflictReport] Error generating report:', { error: error.message });
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Failed to generate report' });
    }
  }
});

module.exports = router;
