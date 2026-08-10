default:
    @just --choose
test: gen
    tree-sitter test
# Parse every file under examples/; prints only files that contain errors and
# exits non-zero if any do (clean parses produce no output).
test-examples: gen
    tree-sitter parse -q examples/*.ductus
playground: gen wasm
    tree-sitter playground

wasm: gen
    tree-sitter build --wasm
gen:
    tree-sitter generate
    tree-sitter build

test-bindings:
    # Ref https://github.com/tree-sitter/parser-test-action/
    cargo build --all-features
    cargo test -q --all-features --no-fail-fast
    npm install
    node --test bindings/node/*_test.js
    uv pip install -e ".[core]"
    uv run -m unittest discover -v -s bindings/python/tests
    cd bindings/go && go mod tidy && go test -v && cd ../..
    which swift > /dev/null && (swift build --build-tests && swift test --skip-build -q) || echo "Swift not available, skipping Swift tests"

install:
    cp ductus.so ~/.config/nvim/parser/ductus.so
