import XCTest
import SwiftTreeSitter
import TreeSitterDuctus

final class TreeSitterDuctusTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_ductus())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Ductus grammar")
    }
}
