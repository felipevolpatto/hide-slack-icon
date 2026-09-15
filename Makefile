.PHONY: install uninstall enable disable test

test:
	gjs tests/match.test.js

install:
	bash scripts/install.sh

uninstall:
	bash scripts/uninstall.sh

enable:
	gnome-extensions enable hide-slack-icon@organisys.local

disable:
	gnome-extensions disable hide-slack-icon@organisys.local
