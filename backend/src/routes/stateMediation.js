/**
 * State Mediation Routes
 * Endpoints for fetching state-specific mediation laws and mediator qualification standards
 */

const express = require('express');
const router = express.Router();

// State mediation data - eventually should be in database
const stateMediationData = {
  FL: {
    stateName: 'Florida',
    stateCode: 'FL',
    mediationStatute: {
      url: 'http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&Title=-%3E2024-%3EChapter%2044',
      citationLabel: 'Florida Statutes Chapter 44',
      summary: 'Florida law requires mediation to be conducted by certified mediators in court-connected cases. Mediation communications are confidential and protected from disclosure in subsequent proceedings. Mediators must remain neutral and cannot impose decisions on parties.',
    },
    mediatorStandards: {
      url: 'https://www.flcourts.gov/Resources-Services/Alternative-Dispute-Resolution/Certified-Mediators',
      citationLabel: 'Florida Supreme Court Certified Mediator Standards',
      summary: 'Florida requires mediators to complete 40 hours of training for circuit civil cases and pass a written examination. Family mediators need 100 hours of training plus additional family law coursework. All certified mediators must complete continuing education and maintain good standing with the Florida Supreme Court.',
    },
    screeningCriteria: {
      minTrainingHours: 40,
      requiresCourtRoster: true,
      hasFamilyPanel: true,
      hasCircuitCivilPanel: true,
      hasCountyCivilPanel: true,
      requiresContinuingEducation: true,
      continuingEdHoursPerYear: 4,
      backgroundCheckRequired: true,
      stateCertificationRequired: true,
    },
  },

  CA: {
    stateName: 'California',
    stateCode: 'CA',
    mediationStatute: {
      url: 'https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=EVID&division=8.&title=&part=&chapter=2.&article=',
      citationLabel: 'California Evidence Code §§ 1115-1128',
      summary: 'California provides strong confidentiality protections for mediation communications. Mediations are voluntary unless ordered by the court. Mediators must disclose any circumstances that might reasonably raise questions about their impartiality.',
    },
    mediatorStandards: {
      url: 'https://www.courts.ca.gov/3074.htm',
      citationLabel: 'California Rules of Court, Rules 3.850-3.872',
      summary: 'California does not require statewide mediator certification for private mediations. However, court-connected civil mediators must complete 30-40 hours of training. Family mediators must have specific mental health or legal credentials plus specialized domestic violence training.',
    },
    screeningCriteria: {
      minTrainingHours: 30,
      requiresCourtRoster: false,
      hasFamilyPanel: true,
      requiresContinuingEducation: false,
      stateCertificationRequired: false,
    },
  },

  NY: {
    stateName: 'New York',
    stateCode: 'NY',
    mediationStatute: {
      url: 'https://www.nysenate.gov/legislation/laws/CLS',
      citationLabel: 'NY Judiciary Law § 849-b',
      summary: 'New York recognizes community dispute resolution centers and provides confidentiality for settlement discussions. Court-annexed mediation programs operate under court rules. Mediators must maintain impartiality and cannot represent parties in related matters.',
    },
    mediatorStandards: {
      url: 'https://ww2.nycourts.gov/ip/adr/index.shtml',
      citationLabel: 'NY Uniform Rules for Trial Courts § 146',
      summary: 'New York requires mediators in court-connected programs to meet specific qualifications including 24-40 hours of training depending on case type. Commercial mediators often pursue private certification through organizations like the NY State Dispute Resolution Association.',
    },
    screeningCriteria: {
      minTrainingHours: 24,
      requiresCourtRoster: true,
      hasCircuitCivilPanel: true,
      requiresContinuingEducation: true,
      continuingEdHoursPerYear: 6,
      stateCertificationRequired: false,
    },
  },

  TX: {
    stateName: 'Texas',
    stateCode: 'TX',
    mediationStatute: {
      url: 'https://statutes.capitol.texas.gov/Docs/CP/htm/CP.154.htm',
      citationLabel: 'Texas Civil Practice & Remedies Code Chapter 154',
      summary: 'Texas promotes mediation as an alternative dispute resolution method. Mediation communications are confidential and generally not subject to disclosure. Courts may order parties to participate in mediation, though parties cannot be compelled to settle.',
    },
    mediatorStandards: {
      url: 'https://www.txcourts.gov/adr/',
      citationLabel: 'Texas ADR Rules & Standards',
      summary: 'Texas does not have mandatory statewide certification for private mediators. However, mediators appointed by courts must meet specific training requirements. The Texas Mediator Credentialing Association offers voluntary credentialing requiring 40 hours of basic training plus additional specialized training.',
    },
    screeningCriteria: {
      minTrainingHours: 40,
      requiresCourtRoster: false,
      requiresContinuingEducation: false,
      stateCertificationRequired: false,
    },
  },

  IL: {
    stateName: 'Illinois',
    stateCode: 'IL',
    mediationStatute: {
      url: 'https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=2481',
      citationLabel: 'Illinois Supreme Court Rules on ADR',
      summary: 'Illinois law protects the confidentiality of mediation communications. Courts may refer cases to mediation either by agreement or court order. Mediators must be impartial and disclose any potential conflicts of interest.',
    },
    mediatorStandards: {
      url: 'https://www.illinoiscourts.gov/courts/circuit-court/alternative-dispute-resolution/',
      citationLabel: 'Illinois Circuit Court ADR Programs',
      summary: 'Illinois does not mandate statewide mediator certification. However, court-approved mediator programs typically require 40 hours of mediation training. Many mediators pursue voluntary certification through professional organizations.',
    },
    screeningCriteria: {
      minTrainingHours: 40,
      requiresCourtRoster: false,
      requiresContinuingEducation: false,
      stateCertificationRequired: false,
    },
  },
};

/**
 * GET /api/state-mediation/:stateCode
 * Get mediation laws and standards for a specific state
 */
router.get('/:stateCode', (req, res) => {
  try {
    const { stateCode } = req.params;
    const stateCodeUpper = stateCode.toUpperCase();

    const stateData = stateMediationData[stateCodeUpper];

    if (!stateData) {
      // Default to Florida if state not found
      return res.json(stateMediationData.FL);
    }

    res.json(stateData);
  } catch (error) {
    console.error('Error fetching state mediation data:', error);
    res.status(500).json({
      error: 'Failed to fetch state mediation data',
      message: error.message,
    });
  }
});

/**
 * GET /api/state-mediation
 * Get list of all supported states
 */
router.get('/', (_req, res) => {
  try {
    const states = Object.keys(stateMediationData).map(code => ({
      stateCode: code,
      stateName: stateMediationData[code].stateName,
    }));

    res.json({ states });
  } catch (error) {
    console.error('Error fetching states list:', error);
    res.status(500).json({
      error: 'Failed to fetch states list',
      message: error.message,
    });
  }
});

module.exports = router;
