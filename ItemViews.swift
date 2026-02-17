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
