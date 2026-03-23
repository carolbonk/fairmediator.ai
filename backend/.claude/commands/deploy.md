# Deploy Command

Run comprehensive deployment checklist before production deployment.

## What It Does

Executes the full `deployment-checklist` skill with all validation steps for production readiness.

## Steps

1. Invoke `deployment-checklist` skill
2. Run all automated checks
3. Generate deployment report
4. Block deployment if critical issues found
5. Provide fix suggestions for any issues

## Usage

```bash
/deploy
```

## Integration

This command is a wrapper around the deployment-checklist skill, providing:
- Automated test execution
- Security scanning
- Quota validation
- Build verification
- Environment checks
- Docker validation

## Example

```
🚀 DEPLOYMENT READINESS CHECK

Running deployment-checklist skill...
[Progress shown from deployment-checklist skill]

Final status will determine if deployment can proceed.
```
