# GitHub Actions Workflows

This directory contains GitHub Actions workflow definitions for automated CI/CD.

## Workflows

### CI Workflow (`ci.yaml`)

**Triggers:**
- Push to `main`, `master`, or `develop` branches
- Pull requests to `main`, `master`, or `develop` branches

**Jobs:**
1. **Test & Lint**
   - Runs ESLint for code quality
   - Executes Vitest test suite
   - Generates code coverage reports
   - Uploads coverage to Codecov (optional)

2. **Build**
   - Builds the extension for production
   - Verifies build outputs exist
   - Uploads build artifacts (retained for 7 days)

### Release Workflow (`release.yaml`)

**Triggers:**
- GitHub release is published

**Jobs:**
1. **Firefox Submission**
   - Builds production version
   - Archives source code
   - Automatically signs and submits to Firefox Add-ons store

## Status Badges

Add these to README.md to show build status:

```markdown
![CI](https://github.com/YOUR_USERNAME/impersonator-extension/workflows/CI/badge.svg)
```

## Local Testing

Before pushing, run the same checks locally:

```bash
# Run linter
yarn lint

# Run tests
yarn test:run

# Build extension
yarn build
```

## Troubleshooting

**Workflow not running?**
- Check that branch name matches trigger patterns
- Verify `.github/workflows/` directory name (not `.github/.workflow/`)
- Check GitHub Actions is enabled in repository settings

**Tests failing in CI but passing locally?**
- Clear node_modules and reinstall: `rm -rf node_modules && yarn install`
- Check Node.js version matches `.node-version` file
- Verify all dependencies are in `package.json`

**Build artifacts not appearing?**
- Check workflow completed successfully
- Artifacts expire after 7 days
- Download from Actions tab → Workflow run → Artifacts section
