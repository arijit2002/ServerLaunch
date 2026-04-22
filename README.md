# ServerLaunch

[![CI](https://github.com/your-username/ServerLaunch/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/ServerLaunch/actions/workflows/ci.yml)

A desktop application to launch and manage AWS EC2 instances without ever opening the AWS Console. Built with Electron, React, and the AWS SDK v3.

---

## What it does

- **Login** with your AWS Access Key and Secret Key
- **View all EC2 instances** in any region — name, status, type, public/private IP
- **Launch new instances** — pick OS, instance type, storage, and region
- **Control instances** — Start, Stop, Reboot, and Terminate with one click
- **Filter by state** — All, Running, Stopped, Pending, Terminated

---

## Screenshots

> Login → Dashboard → Launch

---

## Requirements

- [Node.js](https://nodejs.org/) v18 or later
- An AWS IAM user with the following permissions:
  - `ec2:DescribeInstances`
  - `ec2:DescribeRegions`
  - `ec2:DescribeImages`
  - `ec2:RunInstances`
  - `ec2:StartInstances`
  - `ec2:StopInstances`
  - `ec2:RebootInstances`
  - `ec2:TerminateInstances`
  - `ec2:CreateTags`

---

## Getting Started

**1. Clone the repo**

```bash
git clone https://github.com/your-username/ServerLaunch.git
cd ServerLaunch
```

**2. Install dependencies**

```bash
npm install
```

**3. Build and launch**

```bash
npm run app
```

That's it. The app window will open.

---

## Development

Run webpack in watch mode and Electron separately so changes rebuild automatically:

```bash
# Terminal 1 — rebuild on save
npm run dev

# Terminal 2 — launch the app
npm start
```

---

## Project Structure

```
ServerLaunch/
├── main.js              # Electron main process — AWS SDK calls live here
├── preload.js           # Secure IPC bridge (contextIsolation: true)
├── webpack.config.js    # Bundles React → src/renderer.bundle.js
├── .babelrc             # Babel config for React + modern JS
└── src/
    ├── index.html       # App shell loaded by Electron
    ├── index.jsx        # React entry point
    ├── App.jsx          # Root component — Login / Dashboard routing
    ├── styles/
    │   └── global.css   # Dark theme design system
    ├── utils/
    │   └── constants.js # Instance types, regions, OS options
    └── components/
        ├── Login.jsx         # AWS credentials login screen
        ├── Layout.jsx        # App shell with sidebar
        ├── Sidebar.jsx       # Navigation
        ├── Dashboard.jsx     # EC2 instance list + stats
        ├── InstanceCard.jsx  # Per-instance card with action buttons
        ├── LaunchInstance.jsx# New instance form
        └── Toast.jsx         # In-app notifications
```

---

## Security Notes

- AWS credentials are held **in memory only** — never written to disk or any config file
- The renderer process runs with `contextIsolation: true` and `nodeIntegration: false`
- All AWS calls happen in the Electron main process, exposed to the renderer only through a typed IPC bridge (`preload.js`)
- AMI IDs are resolved at launch time using `ec2:DescribeImages` — no SSM permissions required

---

## Supported Operating Systems (for launching instances)

| OS | AMI Source |
|----|-----------|
| Ubuntu 22.04 LTS | Canonical official (`owner-id: 099720109477`) |
| Amazon Linux 2 | AWS official (`owner-alias: amazon`) |
| Windows Server 2022 | AWS official (`owner-alias: amazon`) |

The latest available AMI is always selected automatically for the chosen region.

---

## Supported Instance Types

`t3.micro` · `t3.small` · `t3.medium` · `t3.large` · `t3.xlarge` · `t3.2xlarge`
`m5.large` · `m5.xlarge` · `m5.2xlarge` · `c5.large` · `c5.xlarge` · `r5.large`

---

## Built With

- [Electron](https://www.electronjs.org/) — desktop app shell
- [React 18](https://react.dev/) — UI
- [AWS SDK v3 for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/) — EC2 API
- [Webpack 5](https://webpack.js.org/) — bundler

---

## License

MIT
