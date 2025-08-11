# Contributing to Life OS

Thank you for your interest in contributing to Life OS! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

We welcome contributions from the community! There are many ways to contribute:

- 🐛 **Bug Reports**: Help us identify and fix issues
- 💡 **Feature Requests**: Suggest new features and improvements
- 📝 **Documentation**: Improve our docs and guides
- 🔧 **Code Contributions**: Submit pull requests with fixes or features
- 🧪 **Testing**: Help us test and improve our test coverage
- 🌟 **Community Support**: Help other users in discussions

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- **Git** for version control
- **Supabase** account (free tier available)
- **OpenAI API** key (optional, for AI features)

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/life-os.git
   cd life-os
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Run tests to ensure everything works**
   ```bash
   npm run test
   ```

## 📋 Development Workflow

### 1. Create a Feature Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
# or
git checkout -b docs/your-documentation-update
```

### 2. Make Your Changes

- Write clean, readable code
- Follow our coding standards (see below)
- Add tests for new features
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run end-to-end tests
npm run test:e2e

# Check code quality
npm run lint
npm run type-check
```

### 4. Commit Your Changes

Use conventional commit messages:

```bash
git commit -m "feat: add new meal planning feature"
git commit -m "fix: resolve calendar sync issue"
git commit -m "docs: update API documentation"
git commit -m "test: add tests for user authentication"
```

### 5. Push and Create a Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub with a clear description of your changes.

## 📝 Code Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` types - use proper type definitions
- Use strict TypeScript configuration

### React Best Practices

- Use functional components with hooks
- Follow React naming conventions
- Use proper prop types and interfaces
- Implement proper error boundaries
- Use React.memo for performance optimization when needed

### Code Style

- Use 2 spaces for indentation
- Use semicolons at the end of statements
- Use single quotes for strings
- Use camelCase for variables and functions
- Use PascalCase for components and types
- Use UPPER_SNAKE_CASE for constants

### File Organization

```
src/
├── app/                 # Next.js app directory
├── components/          # React components
│   ├── shared/         # Shared/common components
│   ├── forms/          # Form components
│   └── modals/         # Modal components
├── lib/                # Utility libraries
│   ├── api/           # API functions
│   ├── hooks/         # Custom React hooks
│   └── utils/         # Utility functions
├── types/              # TypeScript type definitions
└── context/            # React context providers
```

### Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Files**: kebab-case (e.g., `user-profile.tsx`)
- **Functions**: camelCase (e.g., `getUserData`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Types/Interfaces**: PascalCase (e.g., `UserProfile`)

## 🧪 Testing Guidelines

### Unit Tests

- Write tests for all new features
- Aim for at least 80% code coverage
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies

### Component Tests

- Test component rendering
- Test user interactions
- Test prop changes
- Test error states
- Use React Testing Library

### Integration Tests

- Test API endpoints
- Test database operations
- Test authentication flows
- Test real user scenarios

### Example Test Structure

```typescript
describe('UserProfile Component', () => {
  it('should render user information correctly', () => {
    // Test implementation
  });

  it('should handle loading state', () => {
    // Test implementation
  });

  it('should handle error state', () => {
    // Test implementation
  });
});
```

## 📚 Documentation Standards

### Code Documentation

- Use JSDoc comments for functions and classes
- Document complex business logic
- Include examples in comments
- Keep documentation up to date

### API Documentation

- Document all API endpoints
- Include request/response examples
- Document error codes and messages
- Keep API docs in sync with code

### User Documentation

- Write clear, concise instructions
- Include screenshots when helpful
- Provide step-by-step guides
- Keep documentation user-friendly

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected behavior** vs actual behavior
4. **Environment information** (browser, OS, etc.)
5. **Screenshots or videos** if applicable
6. **Console errors** or logs
7. **Browser developer tools** information

## 💡 Feature Requests

When suggesting features, please include:

1. **Clear description** of the feature
2. **Use case** and problem it solves
3. **Proposed implementation** (if you have ideas)
4. **Mockups or wireframes** (if applicable)
5. **Priority level** (low, medium, high)

## 🔄 Pull Request Process

### Before Submitting

1. **Ensure tests pass**
   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```

2. **Update documentation** if needed
3. **Add/update tests** for new features
4. **Follow the commit message convention**

### Pull Request Template

Use our pull request template and fill out all sections:

- **Description**: What does this PR do?
- **Type of change**: Bug fix, feature, documentation, etc.
- **Testing**: How was this tested?
- **Screenshots**: If applicable
- **Checklist**: Ensure all items are completed

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Address feedback** and make changes
4. **Get approval** from at least one maintainer
5. **Merge** when ready

## 🏷️ Issue Labels

We use the following labels to categorize issues:

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `priority: high` - High priority issues
- `priority: medium` - Medium priority issues
- `priority: low` - Low priority issues
- `type: frontend` - Frontend related
- `type: backend` - Backend related
- `type: ai` - AI/ML related
- `type: database` - Database related

## 🎯 Areas for Contribution

### High Priority

- **Performance improvements** - Optimize loading times and responsiveness
- **Accessibility enhancements** - Improve screen reader support and keyboard navigation
- **Mobile optimization** - Enhance mobile user experience
- **Test coverage** - Increase test coverage for existing features

### Medium Priority

- **New AI features** - Enhance AI-powered recommendations
- **Additional integrations** - Connect with more third-party services
- **Advanced analytics** - More detailed insights and reporting
- **Export/import functionality** - Data portability features

### Low Priority

- **UI/UX improvements** - Visual enhancements and user experience tweaks
- **Additional themes** - Dark/light mode variations
- **Localization** - Multi-language support
- **Advanced customization** - User preference options

## 🤝 Community Guidelines

### Be Respectful

- Treat all contributors with respect
- Be patient with newcomers
- Provide constructive feedback
- Avoid personal attacks or harassment

### Be Helpful

- Answer questions when you can
- Share knowledge and best practices
- Help review pull requests
- Welcome new contributors

### Be Professional

- Use clear, professional language
- Follow project conventions
- Be responsive to feedback
- Maintain high code quality

## 📞 Getting Help

If you need help or have questions:

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For general questions and discussions
- **Discord**: For real-time chat and community support
- **Email**: For private or sensitive matters

## 🙏 Recognition

We appreciate all contributions! Contributors will be:

- Listed in our contributors file
- Mentioned in release notes
- Given credit in documentation
- Invited to join our community

Thank you for contributing to Life OS! 🚀
