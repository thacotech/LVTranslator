# Contributing to LVTranslator

First off, thank you for considering contributing to LVTranslator! It's people like you that make this tool better for everyone.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Style Guidelines](#style-guidelines)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## 📜 Code of Conduct

By participating in this project, you agree to maintain a respectful and collaborative environment. We expect all contributors to:

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- A modern code editor (VS Code recommended)
- Basic knowledge of JavaScript, HTML, and CSS

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/LVTranslator.git
   cd LVTranslator
   ```

3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/LVTranslator.git
   ```

## 🛠️ Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment**
   Create `.env` file:
   ```env
   GEMINI_API_KEY=your_test_api_key
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=10
   NODE_ENV=development
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Run Tests**
   ```bash
   npm test
   npm run test:watch  # Watch mode
   npm run test:coverage  # With coverage
   ```

## 🤝 How to Contribute

### Types of Contributions

We welcome various types of contributions:

1. **Bug Fixes**: Fix existing issues
2. **New Features**: Add new functionality
3. **Documentation**: Improve docs, add examples
4. **Tests**: Add or improve test coverage
5. **Performance**: Optimize code performance
6. **Security**: Enhance security measures
7. **Translations**: Add or improve language translations

### Contribution Workflow

1. **Find or Create an Issue**
   - Check existing issues first
   - Create a new issue if needed
   - Discuss your approach before starting large changes

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make Your Changes**
   - Write clean, readable code
   - Follow the style guidelines
   - Add tests for new functionality
   - Update documentation as needed

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new translation feature"
   ```

5. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to GitHub and create a PR
   - Fill out the PR template
   - Link related issues

## 🎨 Style Guidelines

### JavaScript

- **ES6+**: Use modern JavaScript features
- **Naming Conventions**:
  - `camelCase` for variables and functions
  - `PascalCase` for classes
  - `UPPER_CASE` for constants
  - Descriptive names (avoid abbreviations)

```javascript
// Good
const translationCache = new TranslationCache();
const MAX_CACHE_SIZE = 100;

function sanitizeUserInput(input) {
  // ...
}

// Bad
const tc = new cache();
const max = 100;

function sni(i) {
  // ...
}
```

- **Comments**: 
  - Use JSDoc for functions
  - Explain "why", not "what"
  - Keep comments up to date

```javascript
/**
 * Sanitize user input to prevent XSS attacks
 * @param {string} input - Raw user input
 * @returns {string} - Sanitized input
 */
function sanitizeInput(input) {
  // Remove script tags to prevent XSS
  return input.replace(/<script>/g, '');
}
```

- **Error Handling**: Always handle errors gracefully

```javascript
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  throw new Error('User-friendly message');
}
```

### HTML/CSS

- **Semantic HTML**: Use appropriate HTML5 tags
- **Accessibility**: Include ARIA labels where needed
- **Responsive**: Mobile-first approach
- **CSS Variables**: Use CSS custom properties
- **BEM Naming**: Use BEM or similar methodology for CSS classes

### File Organization

- **Utilities**: Generic, reusable functions
- **Services**: Business logic and API calls
- **Components**: UI components (when modularized)
- **Workers**: Web Worker files
- **Tests**: Co-located with source files

## 🧪 Testing

### Writing Tests

- **Test File Naming**: `*.test.js`
- **Test Structure**: Use `describe` and `test` blocks
- **Coverage**: Aim for >80% coverage
- **Test Types**:
  - Unit tests for utilities and pure functions
  - Integration tests for features
  - Security tests for sanitization

```javascript
describe('InputSanitizer', () => {
  test('should remove script tags', () => {
    const input = '<script>alert("xss")</script>Hello';
    const output = InputSanitizer.sanitizeHTML(input);
    expect(output).not.toContain('<script>');
  });
});
```

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# Specific file
npm test -- sanitizer.test.js
```

## 📝 Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `security`: Security improvements

### Examples

```bash
feat(translation): add caching for translations
fix(sanitizer): prevent XSS in user input
docs(readme): update installation instructions
test(cache): add LRU eviction tests
security(api): add rate limiting
```

## 🔄 Submitting Changes

### Pull Request Process

1. **Update Documentation**: If you changed functionality
2. **Add Tests**: For new features or bug fixes
3. **Run Linter**: Ensure code passes linting
4. **Check Tests**: All tests must pass
5. **Update Changelog**: Add entry to CHANGELOG.md
6. **Fill PR Template**: Provide all requested information

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests
- [ ] Manual testing completed

## Screenshots (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Added tests
- [ ] All tests pass
```

### Review Process

1. **Automated Checks**: CI/CD runs tests
2. **Code Review**: Maintainer reviews code
3. **Feedback**: Address requested changes
4. **Approval**: Once approved, PR is merged

## 🐛 Reporting Bugs

### Before Reporting

1. **Check Existing Issues**: Issue might already exist
2. **Try Latest Version**: Bug might be fixed
3. **Search Documentation**: Issue might be documented

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Browser: [e.g., Chrome 96]
- OS: [e.g., Windows 10]
- Version: [e.g., 2.0.0]

## Screenshots
If applicable

## Additional Context
Any other information
```

## 💡 Suggesting Features

### Feature Request Template

```markdown
## Feature Description
Clear description of the feature

## Problem It Solves
What problem does this solve?

## Proposed Solution
How should it work?

## Alternatives Considered
Other solutions you've thought of

## Additional Context
Mockups, examples, etc.
```

## 📚 Resources

### Learning Resources

- [JavaScript MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [Jest Testing](https://jestjs.io/docs/getting-started)

### Project-Specific

- [Architecture Overview](.kiro/specs/performance-security-improvements/design.md)
- [Requirements Document](.kiro/specs/performance-security-improvements/requirements.md)
- [API Documentation](api/README.md)

## ❓ Questions?

- **GitHub Issues**: For bugs and features
- **GitHub Discussions**: For questions and discussions
- **Email**: [maintainer email if available]

## 🙏 Thank You!

Your contributions make this project better. Whether it's:
- Fixing a typo
- Reporting a bug
- Suggesting a feature
- Submitting a PR

Every contribution matters. Thank you! ❤️

---

**Happy Coding!** 🚀

