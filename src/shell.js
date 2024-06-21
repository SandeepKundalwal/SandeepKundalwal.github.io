class Shell {
  constructor(term, commands) {
    this.commands = commands;
    this.commandList = ['clear', 'ls', 'cd', 'cat', 'help', 'history']; // Static list of commands
    this.fileList = this.commandList = ['about.txt', 'achievements.txt', 'contact.txt', 'experience', 'intern_indicrafter.txt', 'intern_itucopenhagen.txt', 'projects.txt', 'resume.txt', 'skills.txt', 'ta_iitmandi.txt', 'volunteering.txt']; // Add this line to store the list of commands    ; // Static list of filenames for demonstration
    this.setupListeners(term);
    this.term = term;

    this.matchIndex = -1; // To keep track of the current match index
    this.matches = []; // To store the current list of filename matches

    localStorage.directory = 'root';
    localStorage.history = JSON.stringify('');
    localStorage.historyIndex = -1;
    localStorage.inHistory = false;

    $('.input').focus();
  }

  setupListeners(term) {
    $('#terminal').mouseup(() => $('.input').last().focus());

    term.addEventListener('keyup', (evt) => {
      const keyUp = 38;
      const keyDown = 40;
      const key = evt.keyCode;

      if ([keyUp, keyDown].includes(key)) {
        let history = localStorage.history;
        history = history ? Object.values(JSON.parse(history)) : [];

        if (key === keyUp) {
          if (localStorage.historyIndex >= 0) {
            if (localStorage.inHistory == 'false') {
              localStorage.inHistory = true;
            }
            // Prevent repetition of last command while traversing history.
            if (localStorage.historyIndex == history.length - 1 && history.length !== 1) {
              localStorage.historyIndex -= 1;
            }
            $('.input')
              .last()
              .html(`${history[localStorage.historyIndex]}<span class="end"><span>`);
            if (localStorage.historyIndex != 0) localStorage.historyIndex -= 1;
          }
        } else if (key === keyDown) {
          if (localStorage.inHistory == 'true' && localStorage.historyIndex < history.length) {
            let ret;

            if (localStorage.historyIndex > 0) {
              ret = `${history[localStorage.historyIndex]}<span class="end"><span>`;
              if (localStorage.historyIndex != history.length - 1) {
                localStorage.historyIndex = Number(localStorage.historyIndex) + 1;
              }
              // Prevent repetition of first command while traversing history.
            } else if (localStorage.historyIndex == 0 && history.length > 1) {
              ret = `${history[1]}<span class="end"><span>`;
              localStorage.historyIndex = history.length !== 2 ? 2 : 1;
            }
            $('.input').last().html(ret);
          }
        }
        evt.preventDefault();
        $('.end').focus();
      }
    });

    term.addEventListener('keydown', (evt) => {
      // Keydown legend:
      // 9 -> Tab key.
      // 27 -> Escape key.
      // 8 -> Backspace key.
      // 46 -> Delete key.

      if (evt.keyCode === 9) {
        evt.preventDefault();
        this.handleTabCompletion();
      } else if (evt.keyCode === 27) {
        $('.terminal-window').toggleClass('fullscreen');
      } else if (evt.keyCode === 8 || evt.keyCode === 46) {
        this.resetHistoryIndex();
      }
    });

    term.addEventListener('keypress', (evt) => {
      // Exclude these keys for Firefox, as they're fired for arrow/tab keypresses.
      if (![9, 27, 37, 38, 39, 40].includes(evt.keyCode)) {
        // If input keys are pressed then resetHistoryIndex() is called.
        this.resetHistoryIndex();
      }
      if (evt.keyCode === 13) {
        const prompt = evt.target;
        const input = prompt.textContent.trim().split(' ');
        const cmd = input[0].toLowerCase();
        const args = input.slice(1).join(' '); // join rest of the input as args

        this.resetMatchState(); // Reset match state on Enter

        if (cmd === 'clear') {
          this.updateHistory(cmd);
          this.clearConsole();
        } else if (cmd && cmd in this.commands) {
          this.runCommand(cmd, args);
          this.resetPrompt(term, prompt);
          $('.root').last().html(localStorage.directory);
        } else {
          this.term.innerHTML += 'Error: command not recognized';
          this.resetPrompt(term, prompt);
        }
        evt.preventDefault();
      }
    });
  }

  handleTabCompletion() {
    const inputElem = $('.input').last();
    const inputText = inputElem.text().trim();
    const words = inputText.split(' ');
    const lastWord = words[words.length - 1];

    if (words.length > 1) {
      if (this.matches.length === 0 || !lastWord.startsWith(this.matches[this.matchIndex])) {
        this.matches = this.fileList.filter(file => file.startsWith(lastWord));
        this.matchIndex = -1;
      }

      if (this.matches.length > 0) {
        this.matchIndex = (this.matchIndex + 1) % this.matches.length;
        words[words.length - 1] = this.matches[this.matchIndex];
        inputElem.text(words.join(' '));
        this.moveCaretToEnd(inputElem[0]);
      }
    }
  }

  moveCaretToEnd(el) {
    const range = document.createRange();
    const sel = window.getSelection();
    range.setStart(el.childNodes[0], el.textContent.length);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    el.focus();
  }

  resetMatchState() {
    this.matchIndex = -1;
    this.matches = [];
  }

  runCommand(cmd, args) {
    const command = args ? `${cmd} ${args}` : cmd;
    this.updateHistory(command);

    const output = this.commands[cmd](args);
    if (output) {
      this.term.innerHTML += output;
    }
  }

  resetPrompt(term, prompt) {
    const newPrompt = prompt.parentNode.cloneNode(true);
    prompt.setAttribute('contenteditable', false);

    if (this.prompt) {
      newPrompt.querySelector('.prompt').textContent = this.prompt;
    }

    term.appendChild(newPrompt);
    newPrompt.querySelector('.input').innerHTML = '';
    newPrompt.querySelector('.input').focus();
  }

  resetHistoryIndex() {
    let history = localStorage.history;

    history = history ? Object.values(JSON.parse(history)) : [];
    if (localStorage.goingThroughHistory == true) {
      localStorage.goingThroughHistory = false;
    }

    if (history.length == 0) {
      localStorage.historyIndex = -1;
    } else {
      localStorage.historyIndex = history.length - 1 > 0 ? history.length - 1 : 0;
    }
  }

  updateHistory(command) {
    let history = localStorage.history;
    history = history ? Object.values(JSON.parse(history)) : [];

    history.push(command);
    localStorage.history = JSON.stringify(history);
    localStorage.historyIndex = history.length - 1;
  }

  clearConsole() {
    const getDirectory = () => localStorage.directory;
    const dir = getDirectory();

    $('#terminal').html(
      `<p class="hidden">
          <span class="prompt">
            <span class="root">${dir}</span>
            <span class="tick">$</span>
          </span>
          <span contenteditable="true" class="input" spellcheck="false"></span>
        </p>`,
    );

    $('.input').focus();
  }
}
