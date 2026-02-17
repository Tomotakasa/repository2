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

struct ItemDetailView: View {
    let item: WardrobeItem
    @EnvironmentObject var firestoreService: FirestoreService
    @Environment(\.dismiss) var dismiss
    @State private var showEditView = false
    @State private var showDeleteConfirm = false
    
    var child: Child? {
        guard let id = item.childId else { return nil }
        return firestoreService.children.first { $0.id == id }
    }
    
    var category: ItemCategory? {
        firestoreService.categories.first { $0.id == item.categoryId }
    }
    
    var accentColor: Color { child?.color ?? DS.accent }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    ZStack(alignment: .bottomLeading) {
                        CachedAsyncImage(url: item.imageURL, size: .infinity, cornerRadius: 0)
                            .frame(height: 280)
                        
                        LinearGradient(
                            colors: [accentColor.opacity(0.6), .clear],
                            startPoint: .bottom,
                            endPoint: .top
                        )
                        .frame(height: 140)
                        .frame(maxHeight: .infinity, alignment: .bottom)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            if let child = child {
                                HStack(spacing: 4) {
                                    Text(child.emoji)
                                    Text(child.name)
                                }
                                .font(.rounded(13, weight: .semibold))
                                .foregroundColor(.white.opacity(0.9))
                            }
                            
                            Text(item.name)
                                .font(.rounded(26, weight: .bold))
                                .foregroundColor(.white)
                        }
                        .padding(DS.spacingL)
                    }
                    
                    VStack(spacing: DS.spacingM) {
                        HStack(spacing: DS.spacingM) {
                            StatCard(emoji: "📦", label: "在庫", value: "\(item.quantity)点", color: accentColor)
                            if !item.size.isEmpty {
                                StatCard(emoji: "📏", label: "サイズ", value: item.size, color: accentColor)
                            }
                            if !item.brand.isEmpty {
                                StatCard(emoji: "🏷️", label: "ブランド", value: item.brand, color: accentColor)
                            }
                        }
                        
                        if let category = category {
                            HStack {
                                Text("カテゴリ")
                                    .font(.rounded(15))
                                    .foregroundColor(DS.secondaryText)
                                Spacer()
                                CategoryBadge(emoji: category.emoji, name: category.name, color: accentColor)
                            }
                            .padding(DS.spacingM)
                            .cardStyle()
                        }
                        
                        if !item.memo.isEmpty {
                            VStack(alignment: .leading, spacing: DS.spacingS) {
                                Text("メモ")
                                    .font(.rounded(12, weight: .semibold))
                                    .foregroundColor(DS.secondaryText)
                                Text(item.memo)
                                    .font(.rounded(15))
                                    .foregroundColor(DS.primaryText)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(DS.spacingM)
                            .cardStyle()
                        }
                        
                        Button {
                            showDeleteConfirm = true
                        } label: {
                            Label("削除する", systemImage: "trash")
                                .font(.rounded(15, weight: .medium))
                                .foregroundColor(DS.danger)
                                .frame(maxWidth: .infinity)
                                .frame(height: 50)
                                .background(DS.danger.opacity(0.1))
                                .clipShape(RoundedRectangle(cornerRadius: DS.radiusM))
                        }
                    }
                    .padding(DS.spacingM)
                }
            }
            .background(DS.background.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button { dismiss() } label: {
                        Image(systemName: "chevron.down")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(DS.primaryText)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showEditView = true } label: {
                        Text("編集")
                            .font(.rounded(15, weight: .semibold))
                            .foregroundColor(DS.accent)
                    }
                }
            }
            .alert("削除しますか？", isPresented: $showDeleteConfirm) {
                Button("削除", role: .destructive) {
                    Task {
                        try? await firestoreService.deleteItem(item)
                        dismiss()
                    }
                }
                Button("キャンセル", role: .cancel) {}
            } message: {
                Text("\(item.name)を削除します。この操作は取り消せません。")
            }
            .sheet(isPresented: $showEditView) {
                EditItemView(item: item)
                    .environmentObject(firestoreService)
            }
        }
        .presentationDetents([.large])
    }
}

struct StatCard: View {
    let emoji: String
    let label: String
    let value: String
    var color: Color = DS.accent
    
    var body: some View {
        VStack(spacing: 4) {
            Text(emoji).font(.system(size: 20))
            Text(value)
                .font(.rounded(16, weight: .bold))
                .foregroundColor(color)
            Text(label)
                .font(.rounded(11))
                .foregroundColor(DS.secondaryText)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, DS.spacingM)
        .background(color.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: DS.radiusM))
    }
}

struct EditItemView: View {
    let originalItem: WardrobeItem
    @EnvironmentObject var firestoreService: FirestoreService
    @Environment(\.dismiss) var dismiss
    
    @State private var item: WardrobeItem
    @State private var selectedImage: UIImage?
    @State private var isLoading = false
    
    init(item: WardrobeItem) {
        self.originalItem = item
        self._item = State(initialValue: item)
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: DS.spacingL) {
                    ImagePickerSection(
                        selectedImage: $selectedImage,
                        photoPickerItem: .constant(nil),
                        showCamera: .constant(false),
                        showImageSourcePicker: .constant(false)
                    )
                    
                    VStack(spacing: DS.spacingM) {
                        FormSection(title: "基本情報") {
                            FormTextField(title: "アイテム名", text: $item.name, placeholder: "例: 半袖Tシャツ")
                            FormDivider()
                            CategoryPicker(selectedId: $item.categoryId, categories: firestoreService.categories)
                            FormDivider()
                            ChildPicker(selectedId: $item.childId, children: firestoreService.children)
                        }
                        
                        FormSection(title: "詳細") {
                            FormTextField(title: "サイズ", text: $item.size, placeholder: "例: 80, 90")
                            FormDivider()
                            FormTextField(title: "ブランド", text: $item.brand, placeholder: "例: ユニクロ")
                            FormDivider()
                            QuantityField(quantity: $item.quantity)
                        }
                        
                        FormSection(title: "メモ") {
                            TextEditor(text: $item.memo)
                                .font(.rounded(15))
                                .frame(height: 80)
                                .scrollContentBackground(.hidden)
                        }
                    }
                    .padding(.horizontal, DS.spacingM)
                }
            }
            .background(DS.background.ignoresSafeArea())
            .navigationTitle("編集")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("キャンセル") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("保存") {
                        Task {
                            isLoading = true
                            try? await firestoreService.updateItem(item)
                            HapticFeedback.success()
                            isLoading = false
                            dismiss()
                        }
                    }
                    .font(.rounded(15, weight: .semibold))
                    .foregroundColor(DS.accent)
                }
            }
            .overlay { if isLoading { LoadingOverlay() } }
        }
    }
}

struct CameraView: UIViewControllerRepresentable {
    @Binding var selectedImage: UIImage?
    @Environment(\.dismiss) var dismiss
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator { Coordinator(self) }
    
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: CameraView
        init(_ parent: CameraView) { self.parent = parent }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let image = info[.originalImage] as? UIImage {
                parent.selectedImage = image
            }
            parent.dismiss()
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}
