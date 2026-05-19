# Contributing Guide

Thanks for your interest in contributing to `highway-network`.

## Project Scope

This repository contains an operating-systems focused simulation of a highway
network, with emphasis on:

- concurrency and synchronization,
- IPC patterns,
- correctness and determinism under concurrent load,
- clean C code and reproducible builds.

## Before You Start

- Open an issue first for major changes.
- Keep pull requests focused and small when possible.
- For behavioral changes, explain the design and trade-offs in the PR.

## Local Setup

1. Clone the repository.
2. Create a feature branch.
3. Build with `make` once project modules are available.

## Coding Standards

- Use C11-compatible code unless explicitly discussed otherwise.
- Prefer readable, modular functions over large monolithic blocks.
- Handle errors from syscalls and library calls (`fork`, `pipe`, `read`,
  `write`, `pthread_*`, `sem_*`, `shm_*`, etc.).
- Clean up resources on all return paths.
- Avoid introducing unnecessary dependencies.

## Commit and PR Expectations

- Write clear commit messages in imperative mood.
- Include rationale in PR description:
  - what changed,
  - why it changed,
  - how it was validated.
- Update docs when behavior or architecture changes.

## Testing Expectations

- Add or update tests when introducing logic changes.
- For concurrency/IPC changes, include at least one reproducible validation
  scenario in the PR description.

## Review Process

Maintainers may request changes for:

- correctness/safety issues,
- race conditions or deadlock risks,
- maintainability and clarity,
- missing tests or documentation.

Thank you for helping make this project robust and useful.
