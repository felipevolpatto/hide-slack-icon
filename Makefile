UUID := $(shell python3 -c 'import json; print(json.load(open("metadata.json"))["uuid"])')

.PHONY: install uninstall enable disable test pack

test:
	gjs tests/match.test.js

pack:
	bash scripts/pack.sh

install:
	bash scripts/install.sh

uninstall:
	bash scripts/uninstall.sh

enable:
	gnome-extensions enable $(UUID)

disable:
	gnome-extensions disable $(UUID)
