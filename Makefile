# Basic Makefile

# Retrieve the UUID from ``metadata.json``
UUID = $(shell grep -E '^[ ]*"uuid" :' ./metadata.json | sed 's@^[ ]*"uuid" :[ ]*"\(.\+\)",[ ]*@\1@')

ifeq ($(strip $(DESTDIR)),)
INSTALLBASE = $(HOME)/.local/share/gnome-shell/extensions
else
INSTALLBASE = $(DESTDIR)/usr/share/gnome-shell/extensions
endif
INSTALLNAME = $(UUID)

SRC = $(wildcard *.css) \
      $(wildcard *.js) \
      $(wildcard *.json) \
      $(wildcard *.ui) \
      $(wildcard schemas/*.gschema.xml) \
      schemas/gschemas.compiled

$(info UUID is "$(UUID)")

.PHONY: all clean install zip-file

all: $(SRC)
	rm -rf _build
	for i in $^ ; do \
		mkdir -p _build/$$(dirname $$i) ; \
		cp $$i _build/$$i ; \
	done

schemas/gschemas.compiled: schemas/*.gschema.xml
	glib-compile-schemas schemas

clean:
	rm -rf _build

install: all
	rm -rf $(INSTALLBASE)/$(INSTALLNAME)
	mkdir -p $(INSTALLBASE)/$(INSTALLNAME)
	cp -r _build/* $(INSTALLBASE)/$(INSTALLNAME)/

zip-file: all
	cd _build && zip -qr "../$(UUID)$(VSTRING).zip" .
