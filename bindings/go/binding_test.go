package tree_sitter_ductus_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_ductus "github.com/ductus-lang/tree-sitter-ductus/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_ductus.Language())
	if language == nil {
		t.Errorf("Error loading Ductus grammar")
	}
}
