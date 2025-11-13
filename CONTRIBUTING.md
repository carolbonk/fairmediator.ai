# Contributing to FairMediator

Thank you for your interest in contributing to FairMediator! This document provides guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Your environment (OS, Node version, etc.)

### Suggesting Features

1. Check if the feature has been suggested in Issues
2. Create a new issue with:
   - Clear use case description
   - Expected behavior
   - Why this feature would be valuable

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes:**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Test your changes:**
   ```bash
   # Backend tests
   cd backend && npm test
   
   # Frontend tests
   cd frontend && npm test
   ```

5. **Commit with clear messages:**
   ```bash
   git commit -m "feat: add mediator search filtering"
   git commit -m "fix: resolve affiliation detection bug"
   git commit -m "docs: update API documentation"
   ```

6. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   ```

## Development Guidelines

### Code Style

**JavaScript/React:**
- Use ES6+ features
- 2 spaces for indentation
- Semicolons required
- Meaningful variable names
- JSDoc comments for functions

**Python:**
- Follow PEP 8
- Type hints where appropriate
- Docstrings for all functions
- 4 spaces for indentation

### Llama Integration

When working with Llama models:

1. **Follow the global rules** defined in the project
2. **Reference official docs:** https://www.llama.com/docs/
3. **Use appropriate prompts** following Llama 3.3 format
4. **Handle errors gracefully**
5. **Log token usage** for cost tracking

### Testing

- Write tests for new features
- Ensure existing tests pass
- Test with real Llama API (use test key)
- Check for edge cases

### Documentation

- Update README if adding major features
- Document new API endpoints
- Add JSDoc/docstrings to code
- Update LLAMA_INTEGRATION.md for AI changes

## Project Structure

```
FairMediator/
├── frontend/         # React + Tailwind
├── backend/          # Node.js + Express
├── automation/       # Python scripts
├── docs/             # Documentation
└── README.md
```

## Llama-Specific Contributions

If contributing to Llama integration:

1. **Test with multiple providers:**
   - Together AI
   - Groq
   - Fireworks AI

2. **Optimize prompts:**
   - Keep prompts concise
   - Use system messages effectively
   - Test temperature settings

3. **Monitor costs:**
   - Track token usage
   - Suggest caching strategies
   - Propose model alternatives

## Resources

- **Llama Docs:** https://www.llama.com/docs/overview/
- **Prompt Guide:** https://www.llama.com/docs/model-cards-and-prompt-formats/llama3_3/
- **Migration Guide:** https://www.llama.com/docs/llama-everywhere/migration/

## Questions?

- Open an issue for discussion
- Tag with `question` label
- Be specific about your use case

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make FairMediator better! 🎯⚖️
