document.addEventListener('DOMContentLoaded', () => {
    const containers = document.querySelectorAll('.typing-container');
    const terminal = document.querySelector('.terminal-prompt');
    const input = document.getElementById('terminal-input');
    const text = document.getElementById('command-text');
    const history = document.getElementById('terminal-history');
    const promptLabel = document.querySelector('.prompt');

    // Virtual File System
    const fs = {
        '/': {
            type: 'dir',
            children: {
                '.git': { type: 'dir', children: {} },
                'css': { type: 'dir', children: { 'style.css': { type: 'file' } } },
                'js': { type: 'dir', children: { 'main.js': { type: 'file' } } },
                'docs': { type: 'dir', children: { 'documentation.txt': { type: 'file' }, 'app-gui': { type: 'file' } } },
                'index.html': { type: 'file' },
                'README.md': { type: 'file' },
                'wbctrl.sh': { type: 'file' }
            }
        }
    };

    let currentPath = '/';
    let commandHistory = [];
    let historyIndex = -1;

    // Hide everything initially
    containers.forEach(el => el.style.display = 'none');
    terminal.style.display = 'none';

    // 1. Show Welcome (ASCII Art) Container
    setTimeout(() => { containers[0].style.display = 'block'; }, 100);

    // 2. Show Flavour Text Container
    setTimeout(() => { containers[1].style.display = 'block'; }, 700);

    // 3. Show Terminal Prompt and setup interaction
    setTimeout(() => {
        terminal.style.display = 'block';
        input.focus();
        document.addEventListener('click', () => input.focus());
        
        function updateInputDisplay() {
            const val = input.value;
            const pos = input.selectionStart !== null ? input.selectionStart : val.length;
            const before = val.substring(0, pos).replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const after = val.substring(pos).replace(/</g, '&lt;').replace(/>/g, '&gt;');
            text.innerHTML = before + '<span class="cursor">_</span>' + after;
        }

        input.addEventListener('input', updateInputDisplay);
        input.addEventListener('click', updateInputDisplay);
        input.addEventListener('keyup', updateInputDisplay);

        input.addEventListener('keydown', (e) => {
            setTimeout(updateInputDisplay, 10);
            if (e.key === 'ArrowUp') {
                if (commandHistory.length > 0) {
                    if (historyIndex < commandHistory.length - 1) {
                        historyIndex++;
                        input.value = commandHistory[commandHistory.length - 1 - historyIndex];
                        text.textContent = input.value;
                    }
                    e.preventDefault();
                }
            } else if (e.key === 'ArrowDown') {
                if (historyIndex >= 0) {
                    historyIndex--;
                    if (historyIndex === -1) {
                        input.value = '';
                    } else {
                        input.value = commandHistory[commandHistory.length - 1 - historyIndex];
                    }
                    text.textContent = input.value;
                }
                e.preventDefault();
            } else if (e.key === 'Enter') {
                const fullCommand = input.value.trim();
                const parts = fullCommand.split(' ').filter(p => p !== '');
                const command = parts[0];
                const args = parts.slice(1);
                
                if (fullCommand) {
                    commandHistory.push(fullCommand);
                    historyIndex = -1;
                }

                // Add current line to history
                const line = document.createElement('div');
                line.innerHTML = `<span class="prompt">${promptLabel.textContent}</span> <span class="history-command">${fullCommand}</span>`;
                history.appendChild(line);

                processCommand(command, args);
                resetInput();
            }
        });
    }, 1300);

    function processCommand(cmd, args) {
        if (!cmd) return;

        const output = document.createElement('div');
        output.className = 'history-output';

        if (cmd === 'ls') {
            const currentDir = getDir(currentPath);
            const items = Object.keys(currentDir.children)
                .filter(name => name !== '.git')
                .map(name => {
                    return currentDir.children[name].type === 'dir' ? name + '/' : name;
                });
            output.textContent = items.join('  ');
            history.appendChild(output);
        } else if (cmd === 'clear') {
            const content = document.getElementById('terminal-content');
            content.querySelectorAll('.typing-container').forEach(c => c.remove());
            history.innerHTML = '';
        } else if (cmd === 'cd') {
            const target = args[0] || '/';
            const newPath = resolvePath(currentPath, target);
            const dir = getDir(newPath);

            if (dir && dir.type === 'dir') {
                currentPath = newPath;
                updatePrompt();
            } else if (dir && dir.type === 'file') {
                output.textContent = `cd: not a directory: ${target}`;
                history.appendChild(output);
            } else {
                output.textContent = `cd: no such file or directory: ${target}`;
                history.appendChild(output);
            }
        } else if (cmd === 'rm') {
            let isRecursive = args.includes('-r');
            let target = args.find(a => !a.startsWith('-'));
            
            if (!target) {
                output.textContent = "rm: missing operand";
            } else {
                const itemPath = resolvePath(currentPath, target);
                const item = getDir(itemPath);
                
                if (item) {
                    if (item.type === 'file') {
                        output.className += ' error-red';
                        output.textContent = "Since when were you the one in charge? =)";
                    } else if (item.type === 'dir') {
                        if (isRecursive) {
                            output.className += ' error-red';
                            output.textContent = "Since when were you the one in charge? =)";
                        } else {
                            output.textContent = `rm: cannot remove '${target}': Is a directory`;
                        }
                    }
                } else {
                    output.textContent = `rm: cannot remove '${target}': No such file or directory`;
                }
            }
            history.appendChild(output);
        } else if (cmd === './wbctrl.sh') {
            if (args.length === 0) {
                location.reload();
                return;
            }
            if (args.includes('-h')) {
                output.innerHTML = `Usage: ./wbctrl.sh [OPTIONS]<br><br>` +
                                 `Options:<br>` +
                                 `  (none)&nbsp;&nbsp;Refresh session<br>` +
                                 `  -h&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Show this help menu<br><br>` +
                                 `  -g&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;View GitHub info<br>` +
                                 `  -gg&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Open GitHub Profile<br><br>` +
                                 `  -c&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;View Codeberg info<br>` +
                                 `  -cg&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Open Codeberg Profile<br><br>` +
                                 `  -d&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Launch Documentation GUI<br><br>` +
                                 `  -m&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;View Contact info<br>` +
                                 `  -mg&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Compose Email (opens client)`;
            } else if (args.includes('-g')) {
                output.textContent = 'Account: DeployedReject on GitHub. Use -gg to open.';
            } else if (args.includes('-gg')) {
                output.textContent = 'Opening GitHub Profile...';
                window.open('https://github.com/DeployedReject', '_blank');
            } else if (args.includes('-c')) {
                output.textContent = 'Account: DeployedReject on Codeberg. Use -cg to open.';
            } else if (args.includes('-cg')) {
                output.textContent = 'Opening Codeberg Profile...';
                window.open('https://codeberg.org/DeployedReject', '_blank');
            } else if (args.includes('-d')) {
                output.innerHTML = 'Starting documentation server...<br>Launching GUI environment...';
                input.disabled = true;
                setTimeout(() => {
                    document.getElementById('gui-window').style.display = 'flex';
                }, 500);
            } else if (args.includes('-m')) {
                output.textContent = 'Contact: DeployedReject via Email. Use -mg to compose.';
            } else if (args.includes('-mg')) {
                output.textContent = 'Opening email client...';
                window.location.href = 'mailto:mishravaibhav2048@gmail.com';
            } else {
                output.textContent = `./wbctrl.sh: invalid option: ${args[0]}. Try "./wbctrl.sh -h" for help.`;
            }
            history.appendChild(output);
        } else if (cmd === 'whoami') {
            output.textContent = 'you are nothing and nobody';
            history.appendChild(output);
        } else if (cmd === 'echo') {
            output.textContent = args.join(' ');
            history.appendChild(output);
        } else {
            output.innerHTML = `zsh: command not found: ${cmd}<br>Try running <b style="color: white">./wbctrl.sh</b> -h to see what you can do.`;
            history.appendChild(output);
        }
    }

    function getDir(path) {
        if (path === '/') return fs['/'];
        const parts = path.split('/').filter(p => p !== '');
        let current = fs['/'];
        for (const part of parts) {
            if (!current || !current.children[part]) return null;
            current = current.children[part];
        }
        return current;
    }

    function resolvePath(current, target) {
        if (target === '/') return '/';
        if (target === '..') {
            if (current === '/') return '/';
            const parts = current.split('/').filter(p => p !== '');
            parts.pop();
            return '/' + parts.join('/');
        }
        if (target === '.') return current;
        
        let path = target.startsWith('/') ? target : (current === '/' ? '/' + target : current + '/' + target);
        // Clean up trailing slashes
        if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
        return path;
    }

    function updatePrompt() {
        const displayPath = currentPath === '/' ? '~' : currentPath.replace(/^\//, '');
        promptLabel.textContent = `vaibhav@DeployedReject ${displayPath} %`;
    }

    function resetInput() {
        input.value = '';
        text.innerHTML = '<span class="cursor">_</span>';
        window.scrollTo(0, document.body.scrollHeight);
    }

    window.toggleMaxDocs = function() {
        const w = document.getElementById('gui-window');
        w.classList.toggle('maximized');
        w.classList.remove('minimized');
    };

    window.toggleMinDocs = function() {
        const w = document.getElementById('gui-window');
        w.classList.toggle('minimized');
        w.classList.remove('maximized');
    };

    window.closeDocs = function() {
        const w = document.getElementById('gui-window');
        w.style.display = 'none';
        w.classList.remove('maximized', 'minimized');
        input.disabled = false;
        input.focus();
        
        const output = document.createElement('div');
        output.className = 'history-output';
        output.textContent = '[Process completed: GUI app closed]';
        history.appendChild(output);
        
        window.scrollTo(0, document.body.scrollHeight);
    };
});
