import Foundation
import FirebaseFirestore
import FirebaseStorage
import UIKit

@MainActor
class FirestoreService: ObservableObject {
    private let db = Firestore.firestore()
    private var familyId: String
    
    @Published var children: [Child] = []
    @Published var categories: [ItemCategory] = []
    @Published var items: [WardrobeItem] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private var childrenListener: ListenerRegistration?
    private var categoriesListener: ListenerRegistration?
    private var itemsListener: ListenerRegistration?
    
    init(familyId: String) {
        self.familyId = familyId
        startListening()
    }
    
    private var familyRef: DocumentReference {
        db.collection("families").document(familyId)
    }
    private var childrenRef: CollectionReference {
        familyRef.collection("children")
    }
    private var categoriesRef: CollectionReference {
        familyRef.collection("categories")
    }
    private var itemsRef: CollectionReference {
        familyRef.collection("items")
    }
    
    func startListening() {
        listenToChildren()
        listenToCategories()
        listenToItems()
    }
    
    func stopListening() {
        childrenListener?.remove()
        categoriesListener?.remove()
        itemsListener?.remove()
    }
    
    private func listenToChildren() {
        childrenListener = childrenRef
            .order(by: "order")
            .addSnapshotListener { [weak self] snapshot, error in
                Task { @MainActor in
                    guard let docs = snapshot?.documents else { return }
                    self?.children = docs.compactMap { try? $0.data(as: Child.self) }
                }
            }
    }
    
    func addChild(_ child: Child) async throws {
        let ref = childrenRef.document()
        var newChild = child
        newChild.order = children.count
        try ref.setData(from: newChild)
    }
    
    func updateChild(_ child: Child) async throws {
        guard let id = child.id else { return }
        try childrenRef.document(id).setData(from: child)
    }
    
    func deleteChild(_ child: Child) async throws {
        guard let id = child.id else { return }
        try await childrenRef.document(id).delete()
    }
    
    func updateChildrenOrder(_ children: [Child]) async throws {
        let batch = db.batch()
        for (index, child) in children.enumerated() {
            guard let id = child.id else { continue }
            batch.updateData(["order": index], forDocument: childrenRef.document(id))
        }
        try await batch.commit()
    }
    
    private func listenToCategories() {
        categoriesListener = categoriesRef
            .order(by: "order")
            .addSnapshotListener { [weak self] snapshot, error in
                Task { @MainActor in
                    guard let docs = snapshot?.documents else { return }
                    let fetched = docs.compactMap { try? $0.data(as: ItemCategory.self) }
                    if fetched.isEmpty {
                        await self?.initializeDefaultCategories()
                    } else {
                        self?.categories = fetched
                    }
                }
            }
    }
    
    private func initializeDefaultCategories() async {
        let batch = db.batch()
        for category in ItemCategory.defaults {
            let ref = categoriesRef.document()
            try? batch.setData(from: category, forDocument: ref)
        }
        try? await batch.commit()
    }
    
    func addCategory(_ category: ItemCategory) async throws {
        var newCat = category
        newCat.order = categories.count
        try categoriesRef.document().setData(from: newCat)
    }
    
    func updateCategory(_ category: ItemCategory) async throws {
        guard let id = category.id else { return }
        try categoriesRef.document(id).setData(from: category)
    }
    
    func deleteCategory(_ category: ItemCategory) async throws {
        guard let id = category.id else { return }
        try await categoriesRef.document(id).delete()
    }
    
    func updateCategoriesOrder(_ cats: [ItemCategory]) async throws {
        let batch = db.batch()
        for (index, cat) in cats.enumerated() {
            guard let id = cat.id else { continue }
            batch.updateData(["order": index], forDocument: categoriesRef.document(id))
        }
        try await batch.commit()
    }
    
    private func listenToItems() {
        itemsListener = itemsRef
            .order(by: "updatedAt", descending: true)
            .addSnapshotListener { [weak self] snapshot, error in
                Task { @MainActor in
                    guard let docs = snapshot?.documents else { return }
                    self?.items = docs.compactMap { try? $0.data(as: WardrobeItem.self) }
                }
            }
    }
    
    func addItem(_ item: WardrobeItem) async throws {
        var newItem = item
        newItem.createdAt = Date()
        newItem.updatedAt = Date()
        try itemsRef.document().setData(from: newItem)
    }
    
    func updateItem(_ item: WardrobeItem) async throws {
        guard let id = item.id else { return }
        var updated = item
        updated.updatedAt = Date()
        try itemsRef.document(id).setData(from: updated)
    }
    
    func deleteItem(_ item: WardrobeItem) async throws {
        guard let id = item.id else { return }
        try await itemsRef.document(id).delete()
    }
    
    func filteredItems(for filter: FilterState) -> [WardrobeItem] {
        items.filter { item in
            if let childId = filter.selectedChildId {
                guard item.childId == childId else { return false }
            }
            if let catId = filter.selectedCategoryId {
                guard item.categoryId == catId else { return false }
            }
            if let size = filter.selectedSize, !size.isEmpty {
                guard item.size == size else { return false }
            }
            if let brand = filter.selectedBrand, !brand.isEmpty {
                guard item.brand == brand else { return false }
            }
            if !filter.searchText.isEmpty {
                let query = filter.searchText.lowercased()
                return item.name.lowercased().contains(query) ||
                       item.brand.lowercased().contains(query) ||
                       item.memo.lowercased().contains(query)
            }
            return true
        }
    }
    
    func categorySummaries(filter: FilterState) -> [CategorySummary] {
        let filtered = filteredItems(for: filter)
        
        return categories.map { category in
            let categoryItems = filtered.filter { $0.categoryId == category.id }
            return CategorySummary(
                categoryId: category.id ?? "",
                categoryName: category.name,
                categoryEmoji: category.emoji,
                itemCount: categoryItems.count,
                totalQuantity: categoryItems.reduce(0) { $0 + $1.quantity },
                items: categoryItems
            )
        }.filter { $0.itemCount > 0 }
    }
    
    func availableSizes(for childId: String?, categoryId: String?) -> [String] {
        Array(Set(items
            .filter { item in
                if let cid = childId { return item.childId == cid }
                return true
            }
            .filter { categoryId == nil || $0.categoryId == categoryId }
            .map { $0.size }
            .filter { !$0.isEmpty }
        )).sorted()
    }
    
    func availableBrands(for childId: String?, categoryId: String?) -> [String] {
        Array(Set(items
            .filter { item in
                if let cid = childId { return item.childId == cid }
                return true
            }
            .filter { categoryId == nil || $0.categoryId == categoryId }
            .map { $0.brand }
            .filter { !$0.isEmpty }
        )).sorted()
    }
}

class StorageService {
    private let storage = Storage.storage()
    private var familyId: String
    
    init(familyId: String) {
        self.familyId = familyId
    }
    
    func uploadImage(_ image: UIImage, itemId: String) async throws -> String {
        guard let data = image.jpegData(compressionQuality: 0.7) else {
            throw NSError(domain: "ImageError", code: -1)
        }
        
        let ref = storage.reference()
            .child("families/\(familyId)/items/\(itemId).jpg")
        
        let metadata = StorageMetadata()
        metadata.contentType = "image/jpeg"
        
        _ = try await ref.putDataAsync(data, metadata: metadata)
        let url = try await ref.downloadURL()
        return url.absoluteString
    }
    
    func deleteImage(itemId: String) async throws {
        let ref = storage.reference()
            .child("families/\(familyId)/items/\(itemId).jpg")
        try await ref.delete()
    }
}
