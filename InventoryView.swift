import SwiftUI

struct CategoryDetailView: View {
    let categoryId: String
    var preselectedChildId: String?
    
    @EnvironmentObject var firestoreService: FirestoreService
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) var dismiss
    
    @State private var selectedChildId: String?
    @State private var selectedSize: String?
    @State private var selectedBrand: String?
    @State private var searchText = ""
    @State private var showFilterSheet = false
    @State private var selectedItem: WardrobeItem?
    
    var category: ItemCategory? {
        firestoreService.categories.first { $0.id == categoryId }
    }
    
    var filterState: FilterState {
        var f = FilterState()
        f.selectedChildId = selectedChildId
        f.selectedCategoryId = categoryId
        f.selectedSize = selectedSize
        f.selectedBrand = selectedBrand
        f.searchText = searchText
        return f
    }
    
    var filteredItems: [WardrobeItem] {
        firestoreService.filteredItems(for: filterState)
    }
    
    var isFiltered: Bool {
        selectedChildId != nil || selectedSize != nil || selectedBrand != nil || !searchText.isEmpty
    }
    
    init(categoryId: String, preselectedChildId: String? = nil) {
        self.categoryId = categoryId
        self.preselectedChildId = preselectedChildId
        self._selectedChildId = State(initialValue: preselectedChildId)
    }
    
    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Button { dismiss() } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(DS.primaryText)
                        .frame(width: 40, height: 40)
                        .background(Circle().fill(DS.cardBackground))
                        .cardShadow()
                }
                
                Spacer()
                
                if let category = category {
                    HStack(spacing: DS.spacingS) {
                        Text(category.emoji).font(.system(size: 20))
                        Text(category.name).font(.rounded(18, weight: .bold))
                    }
                }
                
                Spacer()
                
                Button {
                    showFilterSheet = true
                } label: {
                    ZStack(alignment: .topTrailing) {
                        Image(systemName: "slider.horizontal.3")
                            .font(.system(size: 18))
                            .foregroundColor(DS.primaryText)
                            .frame(width: 40, height: 40)
                            .background(Circle().fill(DS.cardBackground))
                            .cardShadow()
                        
                        if isFiltered {
                            Circle()
                                .fill(DS.accent)
                                .frame(width: 10, height: 10)
                        }
                    }
                }
            }
            .padding(.horizontal, DS.spacingM)
            .padding(.vertical, DS.spacingS)
            
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(DS.secondaryText)
                TextField("名前・ブランドで検索", text: $searchText)
                    .font(.rounded(15))
                if !searchText.isEmpty {
                    Button { searchText = "" } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(DS.secondaryText)
                    }
                }
            }
            .padding(DS.spacingM)
            .background(DS.cardBackground)
            .clipShape(Capsule())
            .cardShadow()
            .padding(.horizontal, DS.spacingM)
            .padding(.bottom, DS.spacingS)
            
            ChildSelectorTabs(
                children: firestoreService.children,
                selectedChildId: $selectedChildId
            )
            .padding(.bottom, DS.spacingS)
            
            if isFiltered {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack {
                        if let size = selectedSize {
                            FilterChip(label: "サイズ: \(size)") { selectedSize = nil }
                        }
                        if let brand = selectedBrand {
                            FilterChip(label: "ブランド: \(brand)") { selectedBrand = nil }
                        }
                    }
                    .padding(.horizontal, DS.spacingM)
                }
                .padding(.bottom, DS.spacingS)
            }
            
            HStack {
                Text("\(filteredItems.count)件")
                    .font(.rounded(13, weight: .semibold))
                    .foregroundColor(DS.secondaryText)
                Spacer()
            }
            .padding(.horizontal, DS.spacingM)
            .padding(.bottom, DS.spacingXS)
            
            if filteredItems.isEmpty {
                Spacer()
                EmptyStateView(
                    icon: "🔍",
                    title: "見つかりません",
                    subtitle: "フィルターを変えてみてください",
                    action: { appState.showingAddItem = true },
                    actionTitle: "追加する"
                )
                Spacer()
            } else {
                ScrollView {
                    LazyVGrid(
                        columns: [
                            GridItem(.flexible(), spacing: DS.spacingM),
                            GridItem(.flexible(), spacing: DS.spacingM)
                        ],
                        spacing: DS.spacingM
                    ) {
                        ForEach(filteredItems) { item in
                            ItemCard(
                                item: item,
                                children: firestoreService.children
                            )
                            .onTapGesture {
                                HapticFeedback.light()
                                selectedItem = item
                            }
                        }
                    }
                    .padding(.horizontal, DS.spacingM)
                    .padding(.bottom, 100)
                }
            }
        }
        .background(DS.background.ignoresSafeArea())
        .navigationBarHidden(true)
        .sheet(item: $selectedItem) { item in
            ItemDetailView(item: item)
                .environmentObject(firestoreService)
        }
        .sheet(isPresented: $showFilterSheet) {
            FilterSheetView(
                selectedSize: $selectedSize,
                selectedBrand: $selectedBrand,
                availableSizes: firestoreService.availableSizes(for: selectedChildId, categoryId: categoryId),
                availableBrands: firestoreService.availableBrands(for: selectedChildId, categoryId: categoryId)
            )
        }
    }
}

struct ItemCard: View {
    let item: WardrobeItem
    let children: [Child]
    
    var child: Child? {
        guard let id = item.childId else { return nil }
        return children.first { $0.id == id }
    }
    
    var cardColor: Color { child?.color ?? DS.accent }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ZStack(alignment: .topTrailing) {
                CachedAsyncImage(url: item.imageURL, size: .infinity, cornerRadius: 0)
                    .frame(height: 130)
                    .clipShape(
                        .rect(topLeadingRadius: DS.radiusM, topTrailingRadius: DS.radiusM)
                    )
                
                QuantityBadge(count: item.quantity, color: cardColor)
                    .padding(DS.spacingS)
                
                if let child = child {
                    HStack(spacing: 4) {
                        Text(child.emoji).font(.system(size: 11))
                        Text(child.name).font(.rounded(10, weight: .semibold))
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Capsule().fill(cardColor.opacity(0.85)))
                    .padding([.top, .leading], DS.spacingS)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                }
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(item.name)
                    .font(.rounded(14, weight: .semibold))
                    .foregroundColor(DS.primaryText)
                    .lineLimit(1)
                
                HStack(spacing: DS.spacingXS) {
                    if !item.size.isEmpty {
                        Text(item.size)
                            .font(.rounded(11, weight: .medium))
                            .foregroundColor(cardColor)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Capsule().fill(cardColor.opacity(0.12)))
                    }
                    
                    if !item.brand.isEmpty {
                        Text(item.brand)
                            .font(.rounded(11))
                            .foregroundColor(DS.secondaryText)
                            .lineLimit(1)
                    }
                }
            }
            .padding(DS.spacingS)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(cardColor.opacity(0.06))
            .clipShape(
                .rect(bottomLeadingRadius: DS.radiusM, bottomTrailingRadius: DS.radiusM)
            )
        }
        .clipShape(RoundedRectangle(cornerRadius: DS.radiusM))
        .overlay(
            RoundedRectangle(cornerRadius: DS.radiusM)
                .strokeBorder(cardColor.opacity(0.15), lineWidth: 1)
        )
        .cardShadow()
    }
}

struct FilterChip: View {
    let label: String
    let onRemove: () -> Void
    
    var body: some View {
        HStack(spacing: 4) {
            Text(label)
                .font(.rounded(13, weight: .medium))
                .foregroundColor(DS.accent)
            Button(action: onRemove) {
                Image(systemName: "xmark")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(DS.accent)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Capsule().fill(DS.accent.opacity(0.12)))
    }
}

struct FilterSheetView: View {
    @Binding var selectedSize: String?
    @Binding var selectedBrand: String?
    let availableSizes: [String]
    let availableBrands: [String]
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationStack {
            List {
                if !availableSizes.isEmpty {
                    Section("サイズ") {
                        ForEach(availableSizes, id: \.self) { size in
                            HStack {
                                Text(size)
                                Spacer()
                                if selectedSize == size {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(DS.accent)
                                }
                            }
                            .contentShape(Rectangle())
                            .onTapGesture {
                                selectedSize = selectedSize == size ? nil : size
                            }
                        }
                    }
                }
                
                if !availableBrands.isEmpty {
                    Section("ブランド") {
                        ForEach(availableBrands, id: \.self) { brand in
                            HStack {
                                Text(brand)
                                Spacer()
                                if selectedBrand == brand {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(DS.accent)
                                }
                            }
                            .contentShape(Rectangle())
                            .onTapGesture {
                                selectedBrand = selectedBrand == brand ? nil : brand
                            }
                        }
                    }
                }
                
                Section {
                    Button("フィルターをリセット") {
                        selectedSize = nil
                        selectedBrand = nil
                        dismiss()
                    }
                    .foregroundColor(DS.danger)
                }
            }
            .navigationTitle("絞り込み")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("完了") { dismiss() }
                        .font(.rounded(15, weight: .semibold))
                        .foregroundColor(DS.accent)
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}

struct InventoryView: View {
    @EnvironmentObject var firestoreService: FirestoreService
    @EnvironmentObject var appState: AppState
    @State private var searchText = ""
    @State private var selectedChildId: String? = nil
    @State private var selectedItem: WardrobeItem?
    
    var filteredItems: [WardrobeItem] {
        var f = FilterState()
        f.selectedChildId = selectedChildId
        f.searchText = searchText
        return firestoreService.filteredItems(for: f)
    }
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                HStack {
                    Text("すべての在庫")
                        .font(.rounded(24, weight: .bold))
                        .foregroundColor(DS.primaryText)
                    Spacer()
                    Text("\(filteredItems.count)件")
                        .font(.rounded(14, weight: .medium))
                        .foregroundColor(DS.secondaryText)
                }
                .padding(.horizontal, DS.spacingM)
                .padding(.top, DS.spacingM)
                .padding(.bottom, DS.spacingS)
                
                HStack {
                    Image(systemName: "magnifyingglass").foregroundColor(DS.secondaryText)
                    TextField("検索", text: $searchText)
                        .font(.rounded(15))
                    if !searchText.isEmpty {
                        Button { searchText = "" } label: {
                            Image(systemName: "xmark.circle.fill").foregroundColor(DS.secondaryText)
                        }
                    }
                }
                .padding(DS.spacingM)
                .background(DS.cardBackground)
                .clipShape(Capsule())
                .cardShadow()
                .padding(.horizontal, DS.spacingM)
                .padding(.bottom, DS.spacingS)
                
                ChildSelectorTabs(
                    children: firestoreService.children,
                    selectedChildId: $selectedChildId
                )
                .padding(.bottom, DS.spacingS)
                
                ScrollView {
                    LazyVStack(spacing: DS.spacingS) {
                        ForEach(filteredItems) { item in
                            InventoryListRow(item: item, children: firestoreService.children)
                                .onTapGesture {
                                    HapticFeedback.light()
                                    selectedItem = item
                                }
                        }
                    }
                    .padding(.horizontal, DS.spacingM)
                    .padding(.bottom, 100)
                }
            }
            .background(DS.background.ignoresSafeArea())
            .navigationBarHidden(true)
            .sheet(item: $selectedItem) { item in
                ItemDetailView(item: item)
                    .environmentObject(firestoreService)
            }
        }
    }
}

struct InventoryListRow: View {
    let item: WardrobeItem
    let children: [Child]
    
    var child: Child? {
        guard let id = item.childId else { return nil }
        return children.first { $0.id == id }
    }
    
    var body: some View {
        HStack(spacing: DS.spacingM) {
            CachedAsyncImage(url: item.imageURL, size: 64, cornerRadius: 10)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(item.name)
                    .font(.rounded(15, weight: .semibold))
                    .foregroundColor(DS.primaryText)
                
                HStack(spacing: DS.spacingS) {
                    if !item.size.isEmpty {
                        Text(item.size)
                            .font(.rounded(12))
                            .foregroundColor(child?.color ?? DS.accent)
                    }
                    if !item.brand.isEmpty {
                        Text(item.brand)
                            .font(.rounded(12))
                            .foregroundColor(DS.secondaryText)
                    }
                }
                
                if let child = child {
                    HStack(spacing: 4) {
                        Text(child.emoji).font(.system(size: 11))
                        Text(child.name).font(.rounded(11))
                    }
                    .foregroundColor(child.color)
                } else {
                    Text("共有アイテム")
                        .font(.rounded(11))
                        .foregroundColor(DS.secondaryText)
                }
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text("\(item.quantity)")
                    .font(.rounded(22, weight: .bold))
                    .foregroundColor(child?.color ?? DS.accent)
                Text("点")
                    .font(.rounded(11))
                    .foregroundColor(DS.secondaryText)
            }
        }
        .padding(DS.spacingM)
        .cardStyle()
    }
}
