import SwiftUI
import FirebaseFirestore

// MARK: - Child Profile
struct Child: Identifiable, Codable, Equatable {
    @DocumentID var id: String?
    var name: String
    var colorHex: String
    var birthDate: Date?
    var emoji: String
    var order: Int
    
    var color: Color {
        Color(hex: colorHex) ?? .blue
    }
    
    static let sampleChildren: [Child] = [
        Child(id: "child1", name: "はな", colorHex: "#FF8FAB", emoji: "🌸", order: 0),
        Child(id: "child2", name: "そら", colorHex: "#74B9FF", emoji: "⭐️", order: 1)
    ]
}

// MARK: - Category
struct ItemCategory: Identifiable, Codable, Equatable {
    @DocumentID var id: String?
    var name: String
    var emoji: String
    var order: Int
    
    static let defaults: [ItemCategory] = [
        ItemCategory(id: "cat1", name: "オムツ", emoji: "🍼", order: 0),
        ItemCategory(id: "cat2", name: "トップス", emoji: "👕", order: 1),
        ItemCategory(id: "cat3", name: "ボトムス", emoji: "👖", order: 2),
        ItemCategory(id: "cat4", name: "アウター", emoji: "🧥", order: 3),
        ItemCategory(id: "cat5", name: "肌着", emoji: "🩲", order: 4),
        ItemCategory(id: "cat6", name: "靴下", emoji: "🧦", order: 5),
        ItemCategory(id: "cat7", name: "シューズ", emoji: "👟", order: 6),
        ItemCategory(id: "cat8", name: "パジャマ", emoji: "🌙", order: 7),
        ItemCategory(id: "cat9", name: "帽子", emoji: "🧢", order: 8),
        ItemCategory(id: "cat10", name: "その他", emoji: "📦", order: 9)
    ]
}

// MARK: - Wardrobe Item
struct WardrobeItem: Identifiable, Codable {
    @DocumentID var id: String?
    var name: String
    var categoryId: String
    var childId: String?
    var size: String
    var brand: String
    var quantity: Int
    var memo: String
    var imageURL: String?
    var createdAt: Date
    var updatedAt: Date
    
    var isShared: Bool { childId == nil }
    
    static func empty() -> WardrobeItem {
        WardrobeItem(
            name: "",
            categoryId: "",
            childId: nil,
            size: "",
            brand: "",
            quantity: 1,
            memo: "",
            imageURL: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
    }
}

// MARK: - Filter State
struct FilterState {
    var selectedChildId: String?
    var selectedCategoryId: String?
    var selectedSize: String?
    var selectedBrand: String?
    var searchText: String = ""
    
    var isActive: Bool {
        selectedSize != nil || selectedBrand != nil || !searchText.isEmpty
    }
}

// MARK: - Category Summary
struct CategorySummary: Identifiable {
    var id: String { categoryId }
    let categoryId: String
    let categoryName: String
    let categoryEmoji: String
    let itemCount: Int
    let totalQuantity: Int
    let items: [WardrobeItem]
}

// MARK: - App State
class AppState: ObservableObject {
    @Published var selectedTab: TabItem = .home
    @Published var filterState = FilterState()
    @Published var showingAddItem = false
}

enum TabItem: String, CaseIterable {
    case home = "home"
    case inventory = "list"
    case settings = "gear"
    
    var title: String {
        switch self {
        case .home: return "ホーム"
        case .inventory: return "在庫"
        case .settings: return "設定"
        }
    }
    
    var icon: String {
        switch self {
        case .home: return "house.fill"
        case .inventory: return "list.bullet.rectangle.fill"
        case .settings: return "gearshape.fill"
        }
    }
}
