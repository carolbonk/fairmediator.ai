/**
 * AWS WAF Integration Middleware
 * Handle WAF-related headers and logging
 */

const logger = require('../config/logger');

/**
 * Log AWS WAF headers for debugging and monitoring
 * AWS WAF adds custom headers when requests pass through
 */
const logWAFHeaders = (req, res, next) => {
  if (process.env.AWS_WAF_ENABLED === 'true') {
    const wafHeaders = {
      'X-Amzn-Waf-Action': req.headers['x-amzn-waf-action'],
      'X-Amzn-Waf-Matched-Rules': req.headers['x-amzn-waf-matched-rules'],
      'X-Amzn-Trace-Id': req.headers['x-amzn-trace-id']
    };

    // Log WAF action if present
    if (wafHeaders['X-Amzn-Waf-Action']) {
      logger.info('AWS WAF Action', {
        action: wafHeaders['X-Amzn-Waf-Action'],
        matchedRules: wafHeaders['X-Amzn-Waf-Matched-Rules'],
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Store WAF info on request for potential use in other middleware
      req.waf = {
        action: wafHeaders['X-Amzn-Waf-Action'],
        matchedRules: wafHeaders['X-Amzn-Waf-Matched-Rules'],
        traceId: wafHeaders['X-Amzn-Trace-Id']
      };
    }

    // Development mode - log all headers
    if (process.env.NODE_ENV === 'development' && wafHeaders['X-Amzn-Waf-Action']) {
      console.log('AWS WAF Headers:', wafHeaders);
    }
  }

  next();
};

/**
 * Handle requests that were blocked or challenged by WAF
 * Note: In most cases, WAF blocks requests before they reach your application
 * This middleware handles edge cases where WAF adds headers but doesn't block
 */
const handleWAFBlock = (req, res, next) => {
  if (process.env.AWS_WAF_ENABLED !== 'true') {
    return next();
  }

  const wafAction = req.headers['x-amzn-waf-action'];

  // If WAF explicitly marked this as BLOCK, reject it
  if (wafAction === 'BLOCK') {
    logger.security.auth('WAF_BLOCK', null, {
      ip: req.ip,
      path: req.path,
      method: req.method,
      matchedRules: req.headers['x-amzn-waf-matched-rules'],
      userAgent: req.headers['user-agent']
    });

    return res.status(403).json({
      error: 'Request blocked by security policy',
      message: 'Your request has been identified as potentially malicious and blocked by our Web Application Firewall.',
      traceId: req.headers['x-amzn-trace-id']
    });
  }

  // If WAF requires CAPTCHA, inform the user
  if (wafAction === 'CAPTCHA') {
    logger.security.auth('WAF_CAPTCHA', null, {
      ip: req.ip,
      path: req.path,
      method: req.method,
      matchedRules: req.headers['x-amzn-waf-matched-rules']
    });

    return res.status(403).json({
      error: 'CAPTCHA verification required',
      message: 'Please complete CAPTCHA verification to continue.',
      action: 'CAPTCHA',
      traceId: req.headers['x-amzn-trace-id']
    });
  }

  next();
};

/**
 * Log rate limit events from AWS WAF
 * Rate limiting is handled by WAF, but we log for monitoring
 */
const logRateLimitEvents = (req, res, next) => {
  if (process.env.AWS_WAF_ENABLED === 'true') {
    const matchedRules = req.headers['x-amzn-waf-matched-rules'];

    // Check if rate limit rule was triggered
    if (matchedRules && matchedRules.includes('RateLimit')) {
      logger.warn('AWS WAF Rate Limit Triggered', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        matchedRules,
        timestamp: new Date().toISOString()
      });

      // Optionally, you could add custom logic here
      // For example, track repeated rate limit violations
    }
  }

  next();
};

/**
 * Monitor and log suspicious patterns that WAF allowed but we want to track
 */
const monitorSuspiciousPatterns = (req, res, next) => {
  if (process.env.AWS_WAF_ENABLED !== 'true') {
    return next();
  }

  const suspiciousPatterns = [
    { pattern: /(\bunion\b|\bselect\b|\bfrom\b|\bwhere\b)/i, type: 'SQL_INJECTION' },
    { pattern: /<script[^>]*>|javascript:|onerror=/i, type: 'XSS' },
    { pattern: /\.\.\//g, type: 'PATH_TRAVERSAL' },
    { pattern: /\${|<%|{{/g, type: 'TEMPLATE_INJECTION' }
  ];

  const url = req.originalUrl || req.url;
  const body = req.body ? JSON.stringify(req.body) : '';
  const fullRequest = url + body;

  for (const { pattern, type } of suspiciousPatterns) {
    if (pattern.test(fullRequest)) {
      logger.warn('Suspicious pattern detected (allowed by WAF)', {
        type,
        ip: req.ip,
        path: req.path,
        method: req.method,
        pattern: pattern.toString(),
        wafAction: req.headers['x-amzn-waf-action'] || 'ALLOW'
      });

      // Don't block - just log for analysis
      // WAF already made the decision to allow this
      break;
    }
  }

  next();
};

/**
 * Add WAF information to response headers (for debugging in development)
 */
const addWAFDebugHeaders = (req, res, next) => {
  if (process.env.NODE_ENV === 'development' && process.env.AWS_WAF_ENABLED === 'true') {
    const wafAction = req.headers['x-amzn-waf-action'];
    const matchedRules = req.headers['x-amzn-waf-matched-rules'];

    if (wafAction) {
      res.set('X-Debug-WAF-Action', wafAction);
    }
    if (matchedRules) {
      res.set('X-Debug-WAF-Rules', matchedRules);
    }
  }

  next();
};

/**
 * Get WAF metrics from CloudWatch (requires AWS SDK)
 * This is a helper function for monitoring dashboards
 */
async function getWAFMetrics(startTime, endTime) {
  if (process.env.AWS_WAF_ENABLED !== 'true') {
    logger.warn('AWS WAF metrics requested but WAF not enabled');
    return null;
  }

  try {
    // Requires AWS SDK to be installed and configured
    const { CloudWatchClient, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');

    const client = new CloudWatchClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });

    const webAclName = process.env.AWS_WAF_WEB_ACL_NAME || 'FairMediator-Production-WAF';

    const params = {
      Namespace: 'AWS/WAFV2',
      MetricName: 'BlockedRequests',
      Dimensions: [
        {
          Name: 'WebACL',
          Value: webAclName
        },
        {
          Name: 'Region',
          Value: process.env.AWS_REGION || 'us-east-1'
        }
      ],
      StartTime: startTime,
      EndTime: endTime,
      Period: 300, // 5 minutes
      Statistics: ['Sum', 'Average'],
      Unit: 'Count'
    };

    const command = new GetMetricStatisticsCommand(params);
    const response = await client.send(command);

    logger.info('WAF metrics retrieved', {
      datapoints: response.Datapoints?.length || 0
    });

    return response.Datapoints;
  } catch (error) {
    logger.error('Failed to retrieve WAF metrics', {
      error: error.message,
      stack: error.stack
    });
    return null;
  }
}

/**
 * Create CloudWatch alarm for high block rate
 * This is a setup function, typically run once during deployment
 */
async function createHighBlockRateAlarm() {
  if (process.env.AWS_WAF_ENABLED !== 'true') {
    return false;
  }

  try {
    const { CloudWatchClient, PutMetricAlarmCommand } = require('@aws-sdk/client-cloudwatch');

    const client = new CloudWatchClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });

    const webAclName = process.env.AWS_WAF_WEB_ACL_NAME || 'FairMediator-Production-WAF';

    const params = {
      AlarmName: 'WAF-High-Block-Rate',
      AlarmDescription: 'Alert when WAF blocks more than 1000 requests in 5 minutes',
      MetricName: 'BlockedRequests',
      Namespace: 'AWS/WAFV2',
      Statistic: 'Sum',
      Period: 300, // 5 minutes
      EvaluationPeriods: 1,
      Threshold: 1000,
      ComparisonOperator: 'GreaterThanThreshold',
      Dimensions: [
        {
          Name: 'WebACL',
          Value: webAclName
        },
        {
          Name: 'Region',
          Value: process.env.AWS_REGION || 'us-east-1'
        }
      ],
      ActionsEnabled: true,
      AlarmActions: [
        // Add SNS topic ARN here for notifications
        // process.env.AWS_SNS_TOPIC_ARN
      ]
    };

    const command = new PutMetricAlarmCommand(params);
    await client.send(command);

    logger.info('WAF high block rate alarm created successfully');
    return true;
  } catch (error) {
    logger.error('Failed to create WAF alarm', {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
}

/**
 * Middleware to extract real client IP when behind ALB
 * ALB adds X-Forwarded-For header
 */
const extractRealIPFromALB = (req, res, next) => {
  if (process.env.AWS_WAF_ENABLED === 'true') {
    // Get real IP from X-Forwarded-For (added by ALB)
    const forwardedFor = req.headers['x-forwarded-for'];

    if (forwardedFor) {
      // X-Forwarded-For can contain multiple IPs: client, proxy1, proxy2
      // The first one is the original client IP
      const clientIP = forwardedFor.split(',')[0].trim();
      req.clientIP = clientIP;
    } else {
      req.clientIP = req.ip || req.connection.remoteAddress;
    }
  }

  next();
};

module.exports = {
  logWAFHeaders,
  handleWAFBlock,
  logRateLimitEvents,
  monitorSuspiciousPatterns,
  addWAFDebugHeaders,
  extractRealIPFromALB,
  getWAFMetrics,
  createHighBlockRateAlarm
};
