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
import SwiftUI
import PhotosUI

struct AddItemView: View {
    @EnvironmentObject var firestoreService: FirestoreService
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) var dismiss
    
    @State private var item = WardrobeItem.empty()
    @State private var selectedImage: UIImage?
    @State private var photoPickerItem: PhotosPickerItem?
    @State private var showCamera = false
    @State private var showImageSourcePicker = false
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var isValid: Bool {
        !item.name.trimmingCharacters(in: .whitespaces).isEmpty &&
        !item.categoryId.isEmpty
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: DS.spacingL) {
                    ImagePickerSection(
                        selectedImage: $selectedImage,
                        photoPickerItem: $photoPickerItem,
                        showCamera: $showCamera,
                        showImageSourcePicker: $showImageSourcePicker
                    )
                    
                    VStack(spacing: DS.spacingM) {
                        FormSection(title: "基本情報") {
                            FormTextField(title: "アイテム名 *", text: $item.name, placeholder: "例: 半袖Tシャツ")
                            FormDivider()
                            CategoryPicker(selectedId: $item.categoryId, categories: firestoreService.categories)
                            FormDivider()
                            ChildPicker(selectedId: $item.childId, children: firestoreService.children)
                        }
                        
                        FormSection(title: "詳細") {
                            FormTextField(title: "サイズ", text: $item.size, placeholder: "例: 80, 90, 100")
                            FormDivider()
                            FormTextField(title: "ブランド", text: $item.brand, placeholder: "例: ユニクロ, H&M")
                            FormDivider()
                            QuantityField(quantity: $item.quantity)
                        }
                        
                        FormSection(title: "メモ") {
                            TextEditor(text: $item.memo)
                                .font(.rounded(15))
                                .frame(height: 80)
                                .scrollContentBackground(.hidden)
                                .overlay(
                                    Group {
                                        if item.memo.isEmpty {
                                            Text("コメントを追加...")
                                                .font(.rounded(15))
                                                .foregroundColor(.gray.opacity(0.5))
                                                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                                                .allowsHitTesting(false)
                                        }
                                    }
                                )
                        }
                    }
                    .padding(.horizontal, DS.spacingM)
                    
                    Spacer(minLength: 20)
                }
                .padding(.top, DS.spacingS)
            }
            .background(DS.background.ignoresSafeArea())
            .navigationTitle("アイテムを追加")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("キャンセル") { dismiss() }
                        .foregroundColor(DS.secondaryText)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("保存") {
                        Task { await saveItem() }
                    }
                    .font(.rounded(15, weight: .semibold))
                    .foregroundColor(isValid ? DS.accent : DS.secondaryText)
                    .disabled(!isValid || isLoading)
                }
            }
            .overlay { if isLoading { LoadingOverlay() } }
        }
        .onChange(of: photoPickerItem) { _, newItem in
            Task {
                if let data = try? await newItem?.loadTransferable(type: Data.self),
                   let image = UIImage(data: data) {
                    selectedImage = image
                }
            }
        }
        .sheet(isPresented: $showCamera) {
            CameraView(selectedImage: $selectedImage)
        }
    }
    
    private func saveItem() async {
        isLoading = true
        HapticFeedback.medium()
        
        do {
            try await firestoreService.addItem(item)
            HapticFeedback.success()
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}

struct ImagePickerSection: View {
    @Binding var selectedImage: UIImage?
    @Binding var photoPickerItem: PhotosPickerItem?
    @Binding var showCamera: Bool
    @Binding var showImageSourcePicker: Bool
    
    var body: some View {
        ZStack {
            if let image = selectedImage {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(height: 220)
                    .clipped()
                    .overlay(alignment: .topTrailing) {
                        Button {
                            withAnimation { selectedImage = nil }
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .font(.system(size: 28))
                                .foregroundColor(.white)
                                .shadow(radius: 4)
                        }
                        .padding()
                    }
            } else {
                Button { showImageSourcePicker = true } label: {
                    VStack(spacing: DS.spacingM) {
                        ZStack {
                            Circle()
                                .fill(DS.accent.opacity(0.12))
                                .frame(width: 70, height: 70)
                            Image(systemName: "camera.fill")
                                .font(.system(size: 28))
                                .foregroundColor(DS.accent)
                        }
                        
                        Text("写真を追加")
                            .font(.rounded(15, weight: .semibold))
                            .foregroundColor(DS.accent)
                        Text("タップしてカメラまたはライブラリから選択")
                            .font(.rounded(12))
                            .foregroundColor(DS.secondaryText)
                    }
                    .frame(height: 180)
                    .frame(maxWidth: .infinity)
                    .background(
                        RoundedRectangle(cornerRadius: DS.radiusM)
                            .strokeBorder(style: StrokeStyle(lineWidth: 2, dash: [8]))
                            .foregroundColor(DS.accent.opacity(0.3))
                    )
                    .padding(.horizontal, DS.spacingM)
                }
            }
        }
        .confirmationDialog("写真を選択", isPresented: $showImageSourcePicker) {
            PhotosPicker(selection: $photoPickerItem, matching: .images) {
                Label("ライブラリから選択", systemImage: "photo.on.rectangle")
            }
            Button("カメラで撮影") { showCamera = true }
            Button("キャンセル", role: .cancel) {}
        }
    }
}

struct FormSection<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content
    
    var body: some View {
        VStack(alignment: .leading, spacing: DS.spacingS) {
            Text(title)
                .font(.rounded(12, weight: .semibold))
                .foregroundColor(DS.secondaryText)
                .padding(.leading, DS.spacingXS)
            
            VStack(spacing: 0) {
                content
            }
            .background(DS.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: DS.radiusM))
            .cardShadow()
        }
    }
}

struct FormTextField: View {
    let title: String
    @Binding var text: String
    var placeholder: String = ""
    
    var body: some View {
        HStack {
            Text(title)
                .font(.rounded(15))
                .foregroundColor(DS.primaryText)
                .frame(width: 110, alignment: .leading)
            
            TextField(placeholder, text: $text)
                .font(.rounded(15))
                .foregroundColor(DS.primaryText)
                .multilineTextAlignment(.trailing)
        }
        .padding(.horizontal, DS.spacingM)
        .frame(height: 50)
    }
}

struct FormDivider: View {
    var body: some View {
        Divider()
            .padding(.leading, DS.spacingM)
    }
}

struct CategoryPicker: View {
    @Binding var selectedId: String
    let categories: [ItemCategory]
    
    var selectedCategory: ItemCategory? {
        categories.first { $0.id == selectedId }
    }
    
    @State private var showPicker = false
    
    var body: some View {
        Button { showPicker = true } label: {
            HStack {
                Text("カテゴリ *")
                    .font(.rounded(15))
                    .foregroundColor(DS.primaryText)
                
                Spacer()
                
                if let cat = selectedCategory {
                    HStack(spacing: 4) {
                        Text(cat.emoji)
                        Text(cat.name)
                            .font(.rounded(15))
                            .foregroundColor(DS.secondaryText)
                    }
                } else {
                    Text("選択してください")
                        .font(.rounded(15))
                        .foregroundColor(.gray.opacity(0.5))
                }
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundColor(DS.secondaryText)
            }
            .padding(.horizontal, DS.spacingM)
            .frame(height: 50)
        }
        .buttonStyle(.plain)
        .sheet(isPresented: $showPicker) {
            CategoryPickerSheet(selectedId: $selectedId, categories: categories)
        }
    }
}

struct CategoryPickerSheet: View {
    @Binding var selectedId: String
    let categories: [ItemCategory]
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationStack {
            List(categories) { cat in
                HStack {
                    Text(cat.emoji).font(.system(size: 24))
                    Text(cat.name).font(.rounded(16))
                    Spacer()
                    if selectedId == cat.id {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(DS.accent)
                    }
                }
                .contentShape(Rectangle())
                .onTapGesture {
                    selectedId = cat.id ?? ""
                    dismiss()
                }
            }
            .navigationTitle("カテゴリを選択")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("完了") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}

struct ChildPicker: View {
    @Binding var selectedId: String?
    let children: [Child]
    @State private var showPicker = false
    
    var selectedChild: Child? {
        guard let id = selectedId else { return nil }
        return children.first { $0.id == id }
    }
    
    var body: some View {
        Button { showPicker = true } label: {
            HStack {
                Text("持ち主")
                    .font(.rounded(15))
                    .foregroundColor(DS.primaryText)
                
                Spacer()
                
                if let child = selectedChild {
                    HStack(spacing: 4) {
                        Text(child.emoji)
                        Text(child.name)
                            .font(.rounded(15))
                            .foregroundColor(DS.secondaryText)
                    }
                } else {
                    Text("みんなで共有")
                        .font(.rounded(15))
                        .foregroundColor(DS.secondaryText)
                }
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundColor(DS.secondaryText)
            }
            .padding(.horizontal, DS.spacingM)
            .frame(height: 50)
        }
        .buttonStyle(.plain)
        .sheet(isPresented: $showPicker) {
            NavigationStack {
                List {
                    HStack {
                        Text("👨‍👩‍👧‍👦").font(.system(size: 24))
                        Text("みんなで共有").font(.rounded(16))
                        Spacer()
                        if selectedId == nil {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(DS.accent)
                        }
                    }
                    .contentShape(Rectangle())
                    .onTapGesture { selectedId = nil; showPicker = false }
                    
                    ForEach(children) { child in
                        HStack {
                            Text(child.emoji).font(.system(size: 24))
                            Text(child.name).font(.rounded(16))
                            Spacer()
                            if selectedId == child.id {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(child.color)
                            }
                        }
                        .contentShape(Rectangle())
                        .onTapGesture { selectedId = child.id; showPicker = false }
                    }
                }
                .navigationTitle("持ち主を選択")
                .navigationBarTitleDisplayMode(.inline)
            }
            .presentationDetents([.medium])
        }
    }
}

struct QuantityField: View {
    @Binding var quantity: Int
    
    var body: some View {
        HStack {
            Text("数量")
                .font(.rounded(15))
                .foregroundColor(DS.primaryText)
            
            Spacer()
            
            HStack(spacing: DS.spacingM) {
                Button {
                    if quantity > 1 { quantity -= 1 }
                    HapticFeedback.light()
                } label: {
                    Image(systemName: "minus.circle.fill")
                        .font(.system(size: 28))
                        .foregroundColor(quantity > 1 ? DS.accent : .gray.opacity(0.3))
                }
                
                Text("\(quantity)")
                    .font(.rounded(20, weight: .bold))
                    .foregroundColor(DS.primaryText)
                    .frame(minWidth: 36)
                
                Button {
                    quantity += 1
                    HapticFeedback.light()
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 28))
                        .foregroundColor(DS.accent)
                }
            }
        }
        .padding(.horizontal, DS.spacingM)
        .frame(height: 50)
    }
}
