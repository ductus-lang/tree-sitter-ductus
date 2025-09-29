import XCTest
import SwiftTreeSitter
import TreeSitterChi

final class TreeSitterChiTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_chi())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Chi grammar")
    }
}
