-include .ok/credentials.mk
-include local.mk

ANDROID_TARGET?=Pixel_3_API_32

SHELL=/bin/bash

.DEFAULT_GOAL=start

check_defined = \
  $(strip $(foreach 1,$1, \
    $(call __check_defined,$1,$(strip $(value 2)))))
__check_defined = \
  $(if $(value $1),, \
    $(error Undefined $1$(if $2, ($2))))

# ------------------------------------------------------------
# dev

.PHONY: help
help: ## Show this help
	@egrep -h '\s##\s' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m  %-30s\033[0m %s\n", $$1, $$2}'

.PHONY: setup
setup: ## Setup the project
	yarn install --production=false

.PHONY: start
start: setup src/lib/headline_filter_parser.js src
start: ## Run a server that serves organice as PWA (default)
	npx react-scripts start

.PHONY: test
test: setup src/lib/headline_filter_parser.js
test: ## Run the tests
	npx react-scripts test --env=jsdom

.PHONY: docs
docs: ## Compile the documentation
	./bin/compile_doc.sh

.PHONY: deploy-docs
deploy-docs: docs
deploy-docs: ## Deploy the documentation
	./bin/compile_doc_and_upload.sh

REVISION=$(shell git describe --tags)

RELEASE_FILES=$(shell find release/ -type f -name '*.js')

build: src/lib/headline_filter_parser.js src
build: ## Build a production build
	bin/transient_env_vars.sh bait
	npx react-scripts build

release: build
	bin/transient_env_vars.sh switch build release
	make set-revision

.PHONY: set-revision
set-revision: $(RELEASE_FILES)
set-revision: ## Set the build revision
	for FILE in $?; do sed -i "s/ORGANICE_ROLLING_RELEASE/$(REVISION)/" $$FILE; done

.PHONY: android
android: release
android: ## Build the android app and run it on $ANDROID_TARGET
	npx cap run android --target $(ANDROID_TARGET)

.PHONY: check-ftp-credentials
check-ftp-credentials: ## Check for FTP credentials
	$(call check_defined, FTP_HOST, deployment target)
	$(call check_defined, FTP_USER, deployment user)
	$(call check_defined, FTP_PASSWD, deployment password)

.PHONY: deploy
deploy: check-ftp-credentials setup release
deploy: ## Deploy PWA
	cd release && \
	  lftp -u${FTP_USER},${FTP_PASSWD} -e "mirror -R ./" ${FTP_HOST}

# TODO: this should replace the sh script bin/compile_search_parser.sh
src/lib/headline_filter_parser.js: src/lib/headline_filter_parser.grammar.pegjs
	echo '/* eslint-disable */' > $@
	npx pegjs -o - $< >> $@
#
#    "start": "make start",
#     "build": "make build",
#     "test:dbg": "./bin/compile_search_parser.sh && react-scripts --inspect-brk test --runInBand --no-cache",
#     "test": "./bin/compile_search_parser.sh && react-scripts test --env=jsdom",
#     "coverage": "./bin/compile_search_parser.sh && react-scripts test --env=jsdom --coverage --watchAll=false",
#     "eslint": "./node_modules/.bin/eslint --cache .",
#     "nibble": "./node_modules/.bin/eslint-nibble --cache .",
#     "prettier": "./node_modules/.bin/prettier \"**/*.js\"",
#     "prettier-eslint": "./node_modules/.bin/prettier-eslint \"`pwd`/**/*.js\"",
#     "lint": "yarn eslint && yarn prettier-eslint --list-different",
#     "eject": "react-scripts eject",
#     "postinstall": "if [ \"$ON_HEROKU\" ]; then npm install -g serve; fi"
#
