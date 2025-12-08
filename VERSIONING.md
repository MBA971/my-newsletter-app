# Versioning Strategy

This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html) (SemVer) for release numbering.

## Version Format

Given a version number MAJOR.MINOR.PATCH, increment the:

1. MAJOR version when you make incompatible API changes
2. MINOR version when you add functionality in a backward compatible manner
3. PATCH version when you make backward compatible bug fixes

## Current Version

Current version: 1.2.1

## Release Process

1. Update version numbers in all package.json files:
   - `package.json` (root)
   - `frontend/package.json`
   - `backend/package.json`

2. Update CHANGELOG.md with release notes

3. Commit changes with message: "Release version X.Y.Z: Update package versions and changelog"

4. Create a git tag: `git tag -a vX.Y.Z -m "Release version X.Y.Z"`

5. Push changes and tags: `git push origin main --tags`

## Branching Strategy

- `main` branch contains production-ready code
- Feature branches for development work
- Tags for releases

## Documentation

Documentation is maintained in:
- README.md - Project overview and setup instructions
- CHANGELOG.md - Detailed change history
- VERSIONING.md - This file explaining versioning strategy
- Individual component documentation in respective directories