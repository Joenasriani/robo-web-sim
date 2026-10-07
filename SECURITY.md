# Security Policy

## Supported version

Security fixes are currently applied to the latest code on the default branch and the latest published release once releases are available.

## Reporting a vulnerability

Please do not publish exploit details in a public issue.

If GitHub private vulnerability reporting is available for this repository, use the repository's **Security** tab to report the issue privately. Otherwise, contact the maintainer through the GitHub profile associated with this repository and request a private channel before sharing sensitive exploit details.

Include enough information to reproduce and assess the issue, such as:

- affected route or component
- prerequisites
- reproduction steps
- expected and observed behavior
- impact
- suggested mitigation, if known

## Current security scope

RoboWebSim is currently a browser-first application. It does not require user accounts, a backend database, payments, or a robotics-control backend for its current simulator workflow. User progress, saved scenes, and saved programs are stored locally in the browser.

This reduces some server-side attack surface, but it does not mean the project has completed a formal security audit or penetration test.

The repository's historical validation reports should not be interpreted as security certifications.
