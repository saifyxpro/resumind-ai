# Contributing to Resumind

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to Resumind. These are mostly guidelines, not rules. Use your best judgment and feel free to propose changes to this document in a pull request.

## 🛠️ Translation & Setup

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/your-username/ai-resume-nextjs.git
    cd ai-resume-nextjs
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Create a branch** for your edits:
    ```bash
    git checkout -b feature/amazing-feature
    ```

## 🧪 Development

-   Run the dev server: `npm run dev`
-   Open `http://localhost:3000`

### Project Structure
-   `/src/app`: Next.js App Router pages
-   `/src/components`: Reusable UI components
-   `/src/lib`: Utilities (OpenAI, PDF processing, Database)

## 📮 Pull Requests

1.  Push your changes to your fork.
2.  Open a Pull Request against the `main` branch.
3.  Describe your changes clearly in the PR description.
4.  Wait for review! We typically review within 24-48 hours.

## 🎨 Style Guide

-   We use **Tailwind CSS** for styling.
-   Please remove any `console.log` used for debugging before pushing.
-   Ensure TypeScript no-implicit-any errors are resolved.

## 🐛 Bug Reports

Found a bug? Go to the [Issues](https://github.com/yourusername/ai-resume-nextjs/issues) tab and create a new issue. Please include:
-   Steps to reproduce
-   Expected vs actual behavior
-   Screenshots (if applicable)

Happy Coding! 🚀
