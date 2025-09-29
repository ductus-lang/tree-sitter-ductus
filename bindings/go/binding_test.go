package tree_sitter_chi_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_chi "gitlab.com/chil-lang/tree-sitter-chi/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_chi.Language())
	if language == nil {
		t.Errorf("Error loading Chi grammar")
	}
}
