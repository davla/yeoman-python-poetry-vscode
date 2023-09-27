#!/usr/bin/env sh

# This script runs the end-to-end tests against a packaged dependency of the
# generator.
# This is achieved by packing and locally installing the tarball.

########################################
#             Variables
########################################

# This doesn't work when the script is sourced
# shellcheck disable=1003
SCRIPT_PATH="$(echo "$0" | tr '\\' '/')"
SCRIPT_DIR="$(dirname "$SCRIPT_PATH" | xargs readlink --canonicalize)"
SCRIPT_FILE="$(basename "$SCRIPT_PATH" '.sh')"

NPM_PACK_LOG_FILE="$SCRIPT_DIR/npm-pack.log"
NPM_PACKAGE_NAME="$(npm run env | grep --ignore-case npm_package_name \
    | cut --delimiter '=' --fields 2)"

########################################
#             Functions
########################################

# This function is invoked in a trap to clean up temporary state.
cleanup() {
    log 'Clean up temporary files...'
    rm --force "$NPM_PACK_LOG_FILE" "$NPM_PACKAGE_TARBALL"

    log "Uninstall locally built $NPM_PACKAGE_NAME package..."
    npm uninstall "$NPM_PACKAGE_NAME"
}

# This function prepends a log prefix to the passed message and writes the
# result to STDOUT. The log prefix includes the log level, the script name and
# a timestamp.
#
# So far there's been no need to have log levels other than info. Let's keep it
# simple until we need more features.
#
# Arguments:
#     - $@: The actual log message, possibly split across multiple arguments.
log() {
    printf '\e[92m[info\e[0m@\e[92m%s %s]\e[0m %s\n' "$SCRIPT_FILE"\
        "$(date '+%T')" "$*"
}

########################################
#         Argument processing
########################################

TEST_OUTPUT=''

while [ "$#" -gt 0 ]; do
    case "$1" in
        '--test-output')
            TEST_OUTPUT="$2"
            shift 1
            ;;

        *)
            echo >&2 "Unknown argument '$1'"
            exit 64
            ;;
    esac
    shift 1
done

if [ -n "$TEST_OUTPUT" ]; then
    NPM_TEST_ARGS=":ci -- output=$TEST_OUTPUT"
fi

########################################
#               Main
########################################

trap cleanup EXIT

# We really want to stop at the first error
set -e

log 'Install end-to-end tests dependencies...'
npm install

log "Pack $NPM_PACKAGE_NAME package locally..."
npm pack --pack-destination "$SCRIPT_DIR" | tee "$NPM_PACK_LOG_FILE"
NPM_PACKAGE_TARBALL="$SCRIPT_DIR/$(tail -n 1 "$NPM_PACK_LOG_FILE")"

log "Install $NPM_PACKAGE_NAME package from local tarball..."
npm install --no-save "$NPM_PACKAGE_TARBALL"

log 'Run end-to-end tests...'
# shellcheck disable=2086
npm run test:end-to-end$NPM_TEST_ARGS
