const { spawn } = require('child_process');
const path = require('path');

const services = [
    {
        name: 'VALIDATOR',
        dir: 'Carne_Univarsario/Carne_Univarsario',
        command: 'npm',
        args: ['run', 'validator'],
        env: {},
        color: '\x1b[33m' // Yellow
    },
    {
        name: 'RECTIFICATION',
        dir: 'rectification',
        command: 'npm',
        args: ['start'],
        env: { PORT: '3001' },
        color: '\x1b[32m' // Green
    },
    {
        name: 'CARNET',
        dir: 'Carne_Univarsario/Carne_Univarsario',
        command: 'npm',
        args: ['start'],
        env: { PORT: '5000' },
        color: '\x1b[35m' // Magenta
    },
    {
        name: 'DASHBOARD',
        dir: 'dashboard',
        command: 'npm',
        args: ['start'],
        env: { PORT: process.env.PORT || '3002' },
        color: '\x1b[36m' // Cyan
    }
];

function startService(service) {
    return new Promise((resolve) => {
        const cwd = path.join(__dirname, service.dir);
        const cmd = service.command || (process.platform === 'win32' ? 'npm.cmd' : 'npm');
        const useShell = cmd.toLowerCase().endsWith('.cmd') || cmd.toLowerCase().endsWith('.bat') || cmd === 'npm';

        console.log(`\x1b[1m[${service.name}]\x1b[0m Starting in ${cwd}...`);

        const child = spawn(cmd, service.args, {
            cwd: cwd,
            env: { ...process.env, ...service.env },
            stdio: 'pipe',
            shell: useShell
        });

        child.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    console.log(`${service.color}[${service.name}] ${line.trim()}\x1b[0m`);
                }
            });
        });

        child.stderr.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    console.error(`${service.color}[${service.name}] ERROR: ${line.trim()}\x1b[0m`);
                }
            });
        });

        child.on('close', (code) => {
            console.log(`[${service.name}] process exited with code ${code}`);
        });

        child.on('error', (err) => {
            console.error(`[${service.name}] Failed to start: ${err.message}`);
        });

        // Give each service a moment to bind to its port before starting the next
        setTimeout(resolve, 3000);
    });
}

(async () => {
    console.log('\x1b[1mStarting all portal services sequentially...\x1b[0m');
    for (const service of services) {
        await startService(service);
    }
    console.log('\x1b[1;32mAll services initiated.\x1b[0m');
})();

// Keep process alive
process.stdin.resume();
