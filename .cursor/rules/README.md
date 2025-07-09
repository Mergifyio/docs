# Cursor Rules for Conventional Commits

This directory contains Cursor rules that help enforce coding standards and best practices in this project.

## Available Rules

### conventional-commits.mdc

This rule ensures that all commits and pull requests follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

**What it does:**
- Enforces proper commit message format: `type(scope): description`
- Ensures use of correct commit types (feat, fix, docs, etc.)
- Guides proper use of imperative mood and formatting
- Helps maintain a clean, parseable git history

**How it's applied:**
- `alwaysApply: true` - This rule is always active in Cursor
- It will guide you when writing commit messages
- It ensures consistency across all project commits

## How Cursor Rules Work

Cursor rules in the `.cursor/rules/` directory are automatically loaded and applied based on their configuration:

- **Always Applied**: Rules with `alwaysApply: true` are active for all files
- **Pattern-Based**: Rules with `globs` patterns apply to matching files
- **Manual**: Rules can be invoked manually using `@rule-name` in Cursor

## Benefits of Conventional Commits

1. **Automated Versioning**: Tools can automatically determine version bumps
2. **Changelog Generation**: Automatically generate CHANGELOGs from commits
3. **Better Communication**: Clear commit history that's easy to understand
4. **CI/CD Integration**: Trigger different pipelines based on commit types
5. **Consistent History**: Makes git history readable and searchable

## Examples

When Cursor helps you write commits, it will follow patterns like:

```
feat(auth): add OAuth2 login support
fix(api): handle null response in user endpoint
docs: update installation guide
refactor(database): optimize query performance
```

This ensures your project maintains professional, consistent commit standards!