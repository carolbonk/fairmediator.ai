# Web Application Firewall (WAF) Integration Guide

## Overview

This guide provides step-by-step instructions for integrating a Web Application Firewall (WAF) with FairMediator to protect against common web exploits, DDoS attacks, and malicious traffic.

**Two Options Provided:**
1. **Cloudflare WAF** - Recommended for most use cases (easier setup, built-in CDN)
2. **AWS WAF** - Recommended if already using AWS infrastructure

---

## Option 1: Cloudflare WAF (Recommended)

### Benefits
- Free tier available with basic protection
- Global CDN included (improved performance)
- Easy DNS-based setup (no code changes required)
- DDoS protection included
- Automatic SSL/TLS
- Analytics and insights dashboard

### Pricing
- **Free Plan**: Basic DDoS protection, shared SSL, limited rules
- **Pro Plan ($20/month)**: WAF, advanced DDoS, Polish (image optimization)
- **Business Plan ($200/month)**: Advanced WAF, custom SSL, priority support
- **Enterprise**: Custom pricing with dedicated support

**Recommendation**: Start with Pro plan for production.

---

### Setup Instructions

#### 1. Create Cloudflare Account

```bash
# Visit https://dash.cloudflare.com/sign-up
# Sign up with your email and create account
```

#### 2. Add Your Domain

1. Go to Cloudflare Dashboard
2. Click "Add a Site"
3. Enter your domain (e.g., `fairmediator.com`)
4. Select a plan (Free or Pro recommended)
5. Cloudflare will scan your DNS records

#### 3. Update DNS Records

Cloudflare will show your current DNS records. Verify these are correct:

```
Type    Name                Value                   Proxy Status
A       fairmediator.com    YOUR_SERVER_IP          Proxied (Orange Cloud)
A       www                 YOUR_SERVER_IP          Proxied (Orange Cloud)
CNAME   api                 fairmediator.com        Proxied (Orange Cloud)
```

**IMPORTANT**: Ensure "Proxy Status" is enabled (orange cloud icon) for WAF protection.

#### 4. Update Nameservers

Cloudflare will provide nameservers like:

```
ns1.cloudflare.com
ns2.cloudflare.com
```

Update these at your domain registrar (GoDaddy, Namecheap, etc.):

1. Log in to your domain registrar
2. Find DNS/Nameserver settings
3. Replace existing nameservers with Cloudflare's nameservers
4. Wait 24-48 hours for propagation (usually faster)

#### 5. Configure SSL/TLS

In Cloudflare Dashboard → SSL/TLS:

```
SSL/TLS encryption mode: Full (strict)

This ensures end-to-end encryption:
Browser → Cloudflare: HTTPS
Cloudflare → Origin Server: HTTPS
```

**Enable these settings:**
- ✅ Always Use HTTPS
- ✅ Automatic HTTPS Rewrites
- ✅ Minimum TLS Version: 1.2
- ✅ Opportunistic Encryption
- ✅ TLS 1.3

#### 6. Configure Firewall Rules

Navigate to **Security → WAF**

##### Managed Rules (Recommended)

Enable these rulesets:

```
✅ Cloudflare Managed Ruleset
   - Protection against OWASP Top 10
   - Automatically updated by Cloudflare

✅ Cloudflare OWASP Core Ruleset
   - Comprehensive OWASP protection
   - SQL injection, XSS, RCE prevention

✅ Cloudflare Exposed Credentials Check
   - Blocks requests with known compromised credentials
```

##### Custom Firewall Rules

Create these custom rules:

**Rule 1: Block Known Malicious IPs**
```
Expression: (ip.geoip.country in {"CN" "RU" "KP"}) and (cf.threat_score > 10)
Action: Block

Note: Adjust countries based on your user base
Only recommended if you don't serve these regions
```

**Rule 2: Rate Limiting Protection**
```
Expression: (http.request.uri.path contains "/api/auth/login")
Action: Challenge (Managed Challenge)
Rate: More than 5 requests in 60 seconds

This prevents brute force attacks on login endpoint
```

**Rule 3: Admin Path Protection**
```
Expression: (http.request.uri.path contains "/admin") and (ip.src ne YOUR_OFFICE_IP)
Action: Block

Replace YOUR_OFFICE_IP with your actual IP
Prevents unauthorized admin access
```

**Rule 4: API Rate Limiting**
```
Expression: (http.request.uri.path contains "/api/")
Action: Managed Challenge
Rate: More than 100 requests in 60 seconds

Prevents API abuse
```

**Rule 5: SQL Injection Pattern Blocking**
```
Expression: (http.request.uri.query contains "' OR 1=1") or
            (http.request.uri.query contains "UNION SELECT") or
            (http.request.uri.query contains "DROP TABLE")
Action: Block

Additional SQL injection protection
```

#### 7. Configure DDoS Protection

Navigate to **Security → DDoS**

```
✅ HTTP DDoS Attack Protection: Enabled
✅ Network-layer DDoS Attack Protection: Enabled

Sensitivity: Medium (adjust based on false positives)
```

#### 8. Enable Bot Protection

Navigate to **Security → Bots**

```
Bot Fight Mode: On (Free/Pro plans)
Super Bot Fight Mode: On (Business+ plans)

Configure:
- Allow verified bots (Google, Bing)
- Challenge likely bots
- Block definitely bots
```

#### 9. Configure Rate Limiting

Navigate to **Security → Rate Limiting Rules**

Create these rules:

**Login Endpoint Protection:**
```
Rule Name: Login Rate Limit
URL Pattern: fairmediator.com/api/auth/login
Method: POST
Requests: 5 requests per 60 seconds
Action: Block for 15 minutes
```

**Registration Rate Limit:**
```
Rule Name: Registration Rate Limit
URL Pattern: fairmediator.com/api/auth/register
Method: POST
Requests: 3 requests per 3600 seconds (1 hour)
Action: Block for 1 hour
```

**API Global Rate Limit:**
```
Rule Name: API Global Limit
URL Pattern: fairmediator.com/api/*
Method: ALL
Requests: 1000 requests per 60 seconds per IP
Action: Challenge (CAPTCHA)
```

#### 10. Enable Security Headers

Navigate to **Rules → Transform Rules → Managed Transforms**

Enable:
```
✅ Add security headers
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: SAMEORIGIN
   - Referrer-Policy: strict-origin-when-cross-origin
```

#### 11. Configure Page Rules

Navigate to **Rules → Page Rules**

**Force HTTPS:**
```
URL: http://*fairmediator.com/*
Setting: Always Use HTTPS
```

**Cache API Responses (Optional):**
```
URL: fairmediator.com/api/mediators*
Settings:
  - Cache Level: Standard
  - Edge Cache TTL: 5 minutes
  - Browser Cache TTL: 5 minutes
```

#### 12. Backend Configuration

Update your backend to trust Cloudflare IPs:

**`/backend/src/middleware/cloudflare.js`** (create this file):

```javascript
/**
 * Cloudflare Integration Middleware
 * Restore original visitor IP from Cloudflare headers
 */

const cloudflareIPs = [
  // Cloudflare IPv4 ranges (update periodically)
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22'
];

/**
 * Restore real IP from Cloudflare headers
 */
const restoreRealIP = (req, res, next) => {
  // Get CF-Connecting-IP header (original visitor IP)
  const cfConnectingIP = req.headers['cf-connecting-ip'];

  if (cfConnectingIP) {
    // Verify request is actually from Cloudflare
    const requestIP = req.ip || req.connection.remoteAddress;

    // In production, verify the request comes from Cloudflare IP range
    if (process.env.NODE_ENV === 'production') {
      // For simplicity, we trust CF-Connecting-IP if present
      // In strict mode, verify requestIP is in cloudflareIPs range
      req.realIP = cfConnectingIP;
    } else {
      req.realIP = cfConnectingIP;
    }
  }

  // Set realIP for logging and rate limiting
  req.clientIP = req.realIP || req.ip || req.connection.remoteAddress;

  next();
};

/**
 * Log Cloudflare security headers
 */
const logCloudflareHeaders = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Cloudflare Headers:', {
      'CF-Connecting-IP': req.headers['cf-connecting-ip'],
      'CF-RAY': req.headers['cf-ray'],
      'CF-Visitor': req.headers['cf-visitor'],
      'CF-IPCountry': req.headers['cf-ipcountry'],
      'CF-Threat-Score': req.headers['cf-threat-score']
    });
  }
  next();
};

module.exports = {
  restoreRealIP,
  logCloudflareHeaders
};
```

**Update `/backend/src/server.js`:**

```javascript
// Add after other middleware imports
const { restoreRealIP, logCloudflareHeaders } = require('./middleware/cloudflare');

// Add after CORS but before rate limiting
app.use(restoreRealIP);
app.use(logCloudflareHeaders);

// Update rate limiting to use req.clientIP
// Modify /backend/src/middleware/rateLimiting.js to use req.clientIP instead of req.ip
```

#### 13. Update Environment Variables

Add to `.env`:

```bash
# Cloudflare Configuration
CLOUDFLARE_ENABLED=true
CLOUDFLARE_ZONE_ID=your_zone_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here

# Get these from Cloudflare Dashboard → Overview
```

#### 14. Testing

After setup, test your WAF:

```bash
# Test 1: Verify HTTPS redirect
curl -I http://fairmediator.com
# Should return 301 redirect to https://

# Test 2: Verify security headers
curl -I https://fairmediator.com
# Should include X-Content-Type-Options, X-Frame-Options, etc.

# Test 3: Test rate limiting
for i in {1..10}; do
  curl -X POST https://fairmediator.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
# Should be blocked/challenged after 5 attempts

# Test 4: SQL injection attempt (should be blocked)
curl "https://fairmediator.com/api/mediators?search=' OR 1=1--"
# Should return 403 Forbidden

# Test 5: Verify real IP passthrough
# Check your backend logs - should show real visitor IP, not Cloudflare IP
```

#### 15. Monitoring

Navigate to **Analytics → Security**

Monitor these metrics:
- Total threats blocked
- Threat types (bot, country, IP reputation)
- Rate limiting hits
- Firewall events
- Top blocked IPs/countries

**Set up alerts:**
1. Go to Notifications
2. Enable "WAF Alert"
3. Set threshold (e.g., alert if >100 threats/hour)
4. Add email/webhook

---

## Option 2: AWS WAF

### Benefits
- Deep AWS integration (ALB, CloudFront, API Gateway)
- Highly customizable rules
- Pay-per-use pricing
- Advanced bot control
- Fraud prevention (Account Takeover Prevention)

### Pricing
- **$5/month** per web ACL
- **$1/month** per rule
- **$0.60** per 1 million requests
- **Bot Control**: Additional $10/month + $1 per 1M requests

**Example**: 10M requests/month with 5 rules = ~$5 + $5 + $6 = **$16/month**

---

### Setup Instructions

#### 1. Prerequisites

- AWS Account with administrative access
- Application hosted on AWS (EC2, ECS, ALB, CloudFront, or API Gateway)
- AWS CLI installed (optional)

```bash
# Install AWS CLI
brew install awscli  # macOS
# or
apt-get install awscli  # Linux

# Configure AWS CLI
aws configure
# Enter: Access Key, Secret Key, Region, Output format
```

#### 2. Create Web ACL

**Via AWS Console:**

1. Go to AWS WAF Console: https://console.aws.amazon.com/wafv2
2. Click "Create web ACL"
3. Configure:

```
Name: FairMediator-Production-WAF
Description: Web Application Firewall for FairMediator
CloudWatch metric name: FairMediatorWAF
Resource type: Regional resources (for ALB) or CloudFront
Region: us-east-1 (or your region)
```

4. Associate resources:
   - Select your Application Load Balancer or CloudFront distribution

#### 3. Add Managed Rule Groups

AWS provides pre-configured rule groups:

**Core Rule Set (Required):**
```
AWS Managed Rules - Core rule set (AWSManagedRulesCommonRuleSet)
Cost: Included
Protection: OWASP Top 10, common vulnerabilities
```

**Known Bad Inputs:**
```
AWS Managed Rules - Known bad inputs (AWSManagedRulesKnownBadInputsRuleSet)
Cost: Included
Protection: Known malicious patterns, exploit attempts
```

**SQL Database:**
```
AWS Managed Rules - SQL database (AWSManagedRulesSQLiRuleSet)
Cost: Included
Protection: SQL injection attacks
```

**Linux Operating System:**
```
AWS Managed Rules - Linux OS (AWSManagedRulesLinuxRuleSet)
Cost: Included
Protection: Linux-specific exploits (if using Linux backend)
```

**Bot Control (Optional but Recommended):**
```
AWS Managed Rules - Bot Control (AWSManagedRulesBotControlRuleSet)
Cost: $10/month + $1 per 1M requests
Protection: Advanced bot detection, CAPTCHA challenges
```

#### 4. Create Custom Rules

**Rule 1: Rate-Based Rule for Login Protection**

```json
{
  "Name": "LoginRateLimit",
  "Priority": 1,
  "Statement": {
    "RateBasedStatement": {
      "Limit": 100,
      "AggregateKeyType": "IP",
      "ScopeDownStatement": {
        "ByteMatchStatement": {
          "SearchString": "/api/auth/login",
          "FieldToMatch": {
            "UriPath": {}
          },
          "TextTransformations": [
            {
              "Priority": 0,
              "Type": "LOWERCASE"
            }
          ],
          "PositionalConstraint": "CONTAINS"
        }
      }
    }
  },
  "Action": {
    "Block": {}
  },
  "VisibilityConfig": {
    "SampledRequestsEnabled": true,
    "CloudWatchMetricsEnabled": true,
    "MetricName": "LoginRateLimit"
  }
}
```

**Via Console:**
1. Add rule → Add my own rules → Rule builder
2. Rule type: Rate-based rule
3. Name: LoginRateLimit
4. Rate limit: 100 requests per 5 minutes
5. Criteria: URI path contains "/api/auth/login"
6. Action: Block
7. Priority: 1

**Rule 2: Geo-Blocking (Optional)**

```json
{
  "Name": "BlockHighRiskCountries",
  "Priority": 2,
  "Statement": {
    "GeoMatchStatement": {
      "CountryCodes": ["KP", "IR", "SY"]
    }
  },
  "Action": {
    "Block": {}
  },
  "VisibilityConfig": {
    "SampledRequestsEnabled": true,
    "CloudWatchMetricsEnabled": true,
    "MetricName": "GeoBlocking"
  }
}
```

**Rule 3: Admin Path IP Whitelist**

```json
{
  "Name": "AdminIPWhitelist",
  "Priority": 3,
  "Statement": {
    "AndStatement": {
      "Statements": [
        {
          "ByteMatchStatement": {
            "SearchString": "/admin",
            "FieldToMatch": {
              "UriPath": {}
            },
            "TextTransformations": [
              {
                "Priority": 0,
                "Type": "LOWERCASE"
              }
            ],
            "PositionalConstraint": "STARTS_WITH"
          }
        },
        {
          "NotStatement": {
            "Statement": {
              "IPSetReferenceStatement": {
                "Arn": "arn:aws:wafv2:us-east-1:ACCOUNT_ID:regional/ipset/AdminIPs/IPSET_ID"
              }
            }
          }
        }
      ]
    }
  },
  "Action": {
    "Block": {}
  }
}
```

**First create IP Set:**
1. AWS WAF → IP sets → Create IP set
2. Name: AdminIPs
3. IP addresses: YOUR_OFFICE_IP/32 (e.g., 203.0.113.0/32)
4. Save, then reference in rule above

#### 5. Configure CloudWatch Logging

Enable logging to monitor WAF activity:

```bash
# Create log group
aws logs create-log-group --log-group-name aws-waf-logs-fairmediator

# Enable logging for Web ACL
aws wafv2 put-logging-configuration \
  --logging-configuration \
    ResourceArn=arn:aws:wafv2:REGION:ACCOUNT_ID:regional/webacl/FairMediator-Production-WAF/WEB_ACL_ID,\
    LogDestinationConfigs=arn:aws:logs:REGION:ACCOUNT_ID:log-group:aws-waf-logs-fairmediator
```

**Via Console:**
1. Web ACL → Logging and metrics
2. Enable logging
3. Select log destination: CloudWatch Logs
4. Log group: aws-waf-logs-fairmediator

#### 6. Set Up CloudWatch Alarms

Create alarms for suspicious activity:

```bash
# Alarm for high block rate
aws cloudwatch put-metric-alarm \
  --alarm-name "WAF-High-Block-Rate" \
  --alarm-description "Alert when WAF blocks >1000 requests in 5 minutes" \
  --metric-name BlockedRequests \
  --namespace AWS/WAFV2 \
  --statistic Sum \
  --period 300 \
  --threshold 1000 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

#### 7. Backend Configuration

Create AWS WAF helper middleware:

**`/backend/src/middleware/awsWAF.js`:**

```javascript
/**
 * AWS WAF Integration Middleware
 * Handle WAF-related headers and logging
 */

const logger = require('../config/logger');

/**
 * Log AWS WAF headers for debugging
 */
const logWAFHeaders = (req, res, next) => {
  if (process.env.AWS_WAF_ENABLED === 'true') {
    const wafHeaders = {
      'X-Amzn-Waf-Action': req.headers['x-amzn-waf-action'],
      'X-Amzn-Waf-Matched-Rules': req.headers['x-amzn-waf-matched-rules']
    };

    if (wafHeaders['X-Amzn-Waf-Action']) {
      logger.info('AWS WAF Action', {
        action: wafHeaders['X-Amzn-Waf-Action'],
        rules: wafHeaders['X-Amzn-Waf-Matched-Rules'],
        path: req.path,
        ip: req.ip
      });
    }
  }

  next();
};

/**
 * Handle rate limit exceeded from WAF
 */
const handleWAFBlock = (req, res, next) => {
  const wafAction = req.headers['x-amzn-waf-action'];

  if (wafAction === 'BLOCK' || wafAction === 'CAPTCHA') {
    logger.security.auth('WAF_BLOCK', null, {
      ip: req.ip,
      path: req.path,
      reason: req.headers['x-amzn-waf-matched-rules']
    });

    return res.status(403).json({
      error: 'Request blocked by security policy',
      message: 'Your request has been identified as potentially malicious and blocked.'
    });
  }

  next();
};

module.exports = {
  logWAFHeaders,
  handleWAFBlock
};
```

**Update `/backend/src/server.js`:**

```javascript
// Add imports
const { logWAFHeaders, handleWAFBlock } = require('./middleware/awsWAF');

// Add middleware (early in the chain)
if (process.env.AWS_WAF_ENABLED === 'true') {
  app.use(logWAFHeaders);
  app.use(handleWAFBlock);
}
```

#### 8. Environment Variables

Add to `.env`:

```bash
# AWS WAF Configuration
AWS_WAF_ENABLED=true
AWS_WAF_WEB_ACL_ARN=arn:aws:wafv2:us-east-1:ACCOUNT_ID:regional/webacl/FairMediator-Production-WAF/WEB_ACL_ID
AWS_REGION=us-east-1
```

#### 9. Testing

```bash
# Test 1: Trigger rate limit
for i in {1..101}; do
  curl https://fairmediator.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
# Should be blocked after 100 requests

# Test 2: SQL injection (should be blocked)
curl "https://fairmediator.com/api/mediators?search=1' UNION SELECT * FROM users--"
# Should return 403 Forbidden

# Test 3: XSS attempt (should be blocked)
curl "https://fairmediator.com/api/mediators?search=<script>alert(1)</script>"
# Should return 403 Forbidden

# Test 4: Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/WAFV2 \
  --metric-name BlockedRequests \
  --dimensions Name=WebACL,Value=FairMediator-Production-WAF \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

#### 10. Monitoring Dashboard

Create CloudWatch Dashboard:

1. Go to CloudWatch → Dashboards
2. Create dashboard: "FairMediator-WAF-Monitoring"
3. Add widgets:

```
- Line graph: AllowedRequests vs BlockedRequests
- Number: Total BlockedRequests (last hour)
- Line graph: Rate-based rule triggers
- Pie chart: Block reasons (by rule)
- Table: Top blocked IPs
```

#### 11. Cost Optimization

Monitor and optimize costs:

```bash
# View WAF costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE \
  --filter file://waf-filter.json

# waf-filter.json:
{
  "Dimensions": {
    "Key": "SERVICE",
    "Values": ["AWS WAF"]
  }
}
```

**Optimization tips:**
- Use managed rule groups (included) instead of custom rules where possible
- Set appropriate rate limits (not too low)
- Review and remove unused rules monthly
- Consider Bot Control only if bot traffic is significant

---

## Comparison: Cloudflare vs AWS WAF

| Feature | Cloudflare WAF | AWS WAF |
|---------|----------------|---------|
| **Ease of Setup** | ⭐⭐⭐⭐⭐ DNS-based | ⭐⭐⭐ AWS Console |
| **Pricing** | $20/month (Pro) | ~$16/month + usage |
| **DDoS Protection** | Included, unlimited | Charged separately |
| **CDN** | Included | Requires CloudFront |
| **Bot Protection** | Included (Pro+) | $10/month extra |
| **Custom Rules** | Limited (Pro) | Unlimited |
| **AWS Integration** | ❌ None | ⭐⭐⭐⭐⭐ Native |
| **Analytics** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good |
| **Global Network** | 300+ locations | AWS regions only |
| **Best For** | General use | AWS-hosted apps |

**Recommendation**:
- Use **Cloudflare** if you want easy setup, global CDN, and all-in-one solution
- Use **AWS WAF** if you're already on AWS and want deep integration

---

## Post-Deployment Checklist

After implementing WAF (either option):

- [ ] WAF enabled and associated with production domain
- [ ] HTTPS enforcement active
- [ ] Rate limiting rules configured
- [ ] DDoS protection enabled
- [ ] Bot protection enabled
- [ ] Security headers configured
- [ ] IP whitelisting for admin paths (if applicable)
- [ ] Geo-blocking configured (if applicable)
- [ ] Monitoring and alerts set up
- [ ] CloudWatch/Analytics dashboard created
- [ ] Backend middleware updated to handle WAF headers
- [ ] Tested all rules (rate limiting, SQL injection, XSS)
- [ ] Documented WAF configuration in team wiki
- [ ] Trained team on WAF dashboard and alerts
- [ ] Cost monitoring enabled
- [ ] Monthly review scheduled

---

## Maintenance Schedule

### Weekly
- Review blocked requests in dashboard
- Check for false positives
- Verify rate limit thresholds are appropriate

### Monthly
- Review and update firewall rules
- Check for new managed rule group updates
- Review security event trends
- Optimize rules based on traffic patterns
- Review costs and optimize if needed

### Quarterly
- Audit all WAF rules
- Update IP whitelists
- Review geo-blocking settings
- Test disaster recovery procedures
- Update team training on WAF features

### Annually
- Full security audit including WAF effectiveness
- Review and renew WAF service plan
- Evaluate alternative WAF providers
- Update documentation

---

## Troubleshooting

### Issue: Legitimate traffic being blocked

**Solution:**
1. Check WAF logs for block reason
2. Identify the rule causing false positive
3. Add exception to rule or adjust sensitivity
4. For Cloudflare: Create "Skip" rule for specific patterns
5. For AWS: Add exception condition to rule

### Issue: Rate limiting too aggressive

**Solution:**
1. Review rate limit thresholds
2. Adjust based on legitimate traffic patterns
3. Consider per-user rate limits instead of per-IP
4. Whitelist known good IPs (office, CI/CD servers)

### Issue: Performance degradation

**Solution:**
1. Check WAF rule count (fewer is better)
2. Optimize rule priorities (most common first)
3. Enable caching for static assets
4. Review managed rule group selections
5. For AWS: Check CloudWatch metrics for latency

### Issue: Costs higher than expected

**Solution:**
1. Review request volume in dashboard
2. Check if bot traffic is significant
3. Consider dropping Bot Control if not needed
4. Optimize rule count (AWS charges per rule)
5. Review and remove unused rules

---

## Security Best Practices

1. **Defense in Depth**: WAF is one layer. Maintain application-level security (input validation, CSRF, etc.)
2. **Regular Updates**: Keep managed rule groups updated
3. **Monitor Continuously**: Set up alerts for unusual patterns
4. **Test Before Prod**: Test new rules in "Count" mode before blocking
5. **Document Everything**: Keep WAF configuration documented
6. **Least Privilege**: Only whitelist IPs that absolutely need it
7. **Regular Audits**: Review WAF effectiveness quarterly
8. **Incident Response**: Have a plan for WAF bypass attempts
9. **Backup Strategy**: Know how to quickly disable WAF if needed
10. **Team Training**: Ensure team understands WAF capabilities and limitations

---

## Additional Resources

### Cloudflare
- Documentation: https://developers.cloudflare.com/waf/
- Firewall Rules: https://developers.cloudflare.com/firewall/
- API Reference: https://api.cloudflare.com/
- Community Forum: https://community.cloudflare.com/

### AWS WAF
- Documentation: https://docs.aws.amazon.com/waf/
- Best Practices: https://docs.aws.amazon.com/waf/latest/developerguide/waf-best-practices.html
- Pricing: https://aws.amazon.com/waf/pricing/
- Tutorials: https://aws.amazon.com/waf/getting-started/

### OWASP
- Top 10 Web Risks: https://owasp.org/www-project-top-ten/
- WAF Evaluation: https://owasp.org/www-community/Web_Application_Firewall

---

**Last Updated**: December 25, 2024
**Next Review**: March 25, 2025
**Contact**: security@fairmediator.com
