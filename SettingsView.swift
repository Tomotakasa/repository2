import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var firestoreService: FirestoreService
    @EnvironmentObject var authManager: AuthManager
    @State private var selectedSection: SettingsSection? = nil
    
    enum SettingsSection: Identifiable {
        case children, categories
        var id: Self { self }
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: DS.spacingL) {
                    SettingsHeaderView(
                        children: firestoreService.children
                    )
                    
                    VStack(spacing: DS.spacingM) {
                        SettingsSectionCard(
                            icon: "person.2.fill",
                            title: "こどもの管理",
                            subtitle: "\(firestoreService.children.count)人登録済み",
                            color: Color(hex: "#74B9FF") ?? .blue
                        ) {
                            selectedSection = .children
                        }
                        
                        SettingsSectionCard(
                            icon: "tag.fill",
                            title: "カテゴリの管理",
                            subtitle: "\(firestoreService.categories.count)カテゴリ",
                            color: Color(hex: "#55EFC4") ?? .green
                        ) {
                            selectedSection = .categories
                        }
                        
                        StatsCard(
                            children: firestoreService.children,
                            items: firestoreService.items,
                            categories: firestoreService.categories
                        )
                        
                        Button {
                            authManager.signOut()
                        } label: {
                            HStack {
                                Image(systemName: "rectangle.portrait.and.arrow.right")
                                    .foregroundColor(DS.danger)
                                Text("サインアウト")
                                    .font(.rounded(15, weight: .medium))
                                    .foregroundColor(DS.danger)
                                Spacer()
                            }
                            .padding(DS.spacingM)
                            .cardStyle()
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, DS.spacingM)
                    
                    Text("こどもクローゼット v1.0.0")
                        .font(.rounded(12))
                        .foregroundColor(DS.secondaryText.opacity(0.5))
                    
                    Spacer(minLength: 100)
                }
                .padding(.top, DS.spacingM)
            }
            .background(DS.background.ignoresSafeArea())
            .navigationBarHidden(true)
            .navigationDestination(item: $selectedSection) { section in
                switch section {
                case .children:
                    ChildrenSettingsView()
                        .environmentObject(firestoreService)
                case .categories:
                    CategoriesSettingsView()
                        .environmentObject(firestoreService)
                }
            }
        }
    }
}

struct SettingsHeaderView: View {
    let children: [Child]
    
    var body: some View {
        VStack(spacing: DS.spacingM) {
            Text("⚙️")
                .font(.system(size: 48))
            
            Text("設定")
                .font(.rounded(28, weight: .bold))
                .foregroundColor(DS.primaryText)
            
            if !children.isEmpty {
                HStack(spacing: -12) {
                    ForEach(children) { child in
                        ZStack {
                            Circle()
                                .fill(child.color)
                                .frame(width: 44, height: 44)
                                .overlay(Circle().strokeBorder(.white, lineWidth: 2))
                            Text(child.emoji)
                                .font(.system(size: 22))
                        }
                    }
                }
            }
        }
        .padding(.top, DS.spacingM)
    }
}

struct SettingsSectionCard: View {
    let icon: String
    let title: String
    let subtitle: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: DS.spacingM) {
                ZStack {
                    RoundedRectangle(cornerRadius: DS.radiusS)
                        .fill(color.opacity(0.15))
                        .frame(width: 44, height: 44)
                    Image(systemName: icon)
                        .font(.system(size: 20))
                        .foregroundColor(color)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.rounded(16, weight: .semibold))
                        .foregroundColor(DS.primaryText)
                    Text(subtitle)
                        .font(.rounded(13))
                        .foregroundColor(DS.secondaryText)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(DS.secondaryText.opacity(0.5))
            }
            .padding(DS.spacingM)
            .cardStyle()
        }
        .buttonStyle(.plain)
    }
}

struct StatsCard: View {
    let children: [Child]
    let items: [WardrobeItem]
    let categories: [ItemCategory]
    
    var totalQuantity: Int { items.reduce(0) { $0 + $1.quantity } }
    
    var body: some View {
        VStack(alignment: .leading, spacing: DS.spacingM) {
            Text("📊 現在の統計")
                .font(.rounded(15, weight: .semibold))
                .foregroundColor(DS.primaryText)
            
            HStack(spacing: DS.spacingM) {
                MiniStat(value: "\(children.count)", label: "こども", color: Color(hex: "#FF8FAB") ?? .pink)
                MiniStat(value: "\(items.count)", label: "アイテム種", color: DS.accent)
                MiniStat(value: "\(totalQuantity)", label: "総アイテム数", color: Color(hex: "#55EFC4") ?? .green)
            }
        }
        .padding(DS.spacingM)
        .cardStyle()
    }
}

struct MiniStat: View {
    let value: String
    let label: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.rounded(22, weight: .bold))
                .foregroundColor(color)
            Text(label)
                .font(.rounded(11))
                .foregroundColor(DS.secondaryText)
        }
        .frame(maxWidth: .infinity)
    }
}

struct ChildrenSettingsView: View {
    @EnvironmentObject var firestoreService: FirestoreService
    @Environment(\.dismiss) var dismiss
    @State private var children: [Child] = []
    @State private var showAddChild = false
    @State private var editingChild: Child?
    @State private var isReordering = false
    
    var body: some View {
        List {
            Section {
                ForEach($children) { $child in
                    ChildRow(child: $child) {
                        editingChild = child
                    }
                }
                .onMove { indices, destination in
                    children.move(fromOffsets: indices, toOffset: destination)
                    Task { try? await firestoreService.updateChildrenOrder(children) }
                }
                .onDelete { indices in
                    Task {
                        for index in indices {
                            try? await firestoreService.deleteChild(children[index])
                        }
                    }
                }
            } header: {
                Text("こどものプロフィール")
            } footer: {
                Text("≡ をドラッグして並び替えできます")
            }
            
            Section {
                Button {
                    showAddChild = true
                } label: {
                    Label("こどもを追加", systemImage: "plus.circle.fill")
                        .font(.rounded(15, weight: .medium))
                        .foregroundColor(DS.accent)
                }
            }
        }
        .navigationTitle("こどもの管理")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            EditButton()
        }
        .onAppear { children = firestoreService.children }
        .onChange(of: firestoreService.children) { _, new in children = new }
        .sheet(isPresented: $showAddChild) {
            ChildEditorView(mode: .add)
                .environmentObject(firestoreService)
        }
        .sheet(item: $editingChild) { child in
            ChildEditorView(mode: .edit(child))
                .environmentObject(firestoreService)
        }
    }
}

struct ChildRow: View {
    @Binding var child: Child
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: DS.spacingM) {
                ZStack {
                    Circle()
                        .fill(child.color)
                        .frame(width: 44, height: 44)
                    Text(child.emoji)
                        .font(.system(size: 22))
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(child.name)
                        .font(.rounded(16, weight: .semibold))
                        .foregroundColor(DS.primaryText)
                    
                    Circle()
                        .fill(child.color)
                        .frame(width: 16, height: 16)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundColor(DS.secondaryText.opacity(0.5))
            }
        }
        .buttonStyle(.plain)
    }
}

struct ChildEditorView: View {
    enum Mode {
        case add
        case edit(Child)
    }
    
    let mode: Mode
    @EnvironmentObject var firestoreService: FirestoreService
    @Environment(\.dismiss) var dismiss
    
    @State private var name: String = ""
    @State private var emoji: String = "🌸"
    @State private var colorHex: String = "#FF8FAB"
    @State private var isLoading = false
    
    var title: String {
        switch mode {
        case .add: return "こどもを追加"
        case .edit: return "プロフィールを編集"
        }
    }
    
    let emojiOptions = ["🌸", "⭐️", "🌈", "🦋", "🐼", "🦁", "🐰", "🐸", "🍀", "🌙", "🎠", "🚀"]
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: DS.spacingL) {
                    ZStack {
                        Circle()
                            .fill(Color(hex: colorHex) ?? .pink)
                            .frame(width: 100, height: 100)
                        Text(emoji)
                            .font(.system(size: 48))
                    }
                    .padding(.top, DS.spacingM)
                    
                    VStack(spacing: DS.spacingM) {
                        FormSection(title: "名前") {
                            FormTextField(title: "名前", text: $name, placeholder: "例: はな")
                        }
                        
                        VStack(alignment: .leading, spacing: DS.spacingS) {
                            Text("アバター")
                                .font(.rounded(12, weight: .semibold))
                                .foregroundColor(DS.secondaryText)
                                .padding(.leading, DS.spacingXS)
                            
                            LazyVGrid(
                                columns: Array(repeating: GridItem(.flexible()), count: 6),
                                spacing: DS.spacingS
                            ) {
                                ForEach(emojiOptions, id: \.self) { e in
                                    Button {
                                        emoji = e
                                        HapticFeedback.light()
                                    } label: {
                                        Text(e)
                                            .font(.system(size: 28))
                                            .frame(width: 48, height: 48)
                                            .background(
                                                RoundedRectangle(cornerRadius: DS.radiusS)
                                                    .fill(emoji == e ?
                                                          (Color(hex: colorHex) ?? DS.accent).opacity(0.2) :
                                                          Color.gray.opacity(0.08))
                                            )
                                            .overlay(
                                                RoundedRectangle(cornerRadius: DS.radiusS)
                                                    .strokeBorder(
                                                        emoji == e ? (Color(hex: colorHex) ?? DS.accent) : Color.clear,
                                                        lineWidth: 2
                                                    )
                                            )
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding(DS.spacingM)
                            .background(DS.cardBackground)
                            .clipShape(RoundedRectangle(cornerRadius: DS.radiusM))
                            .cardShadow()
                        }
                        
                        VStack(alignment: .leading, spacing: DS.spacingS) {
                            Text("テーマカラー")
                                .font(.rounded(12, weight: .semibold))
                                .foregroundColor(DS.secondaryText)
                                .padding(.leading, DS.spacingXS)
                            
                            ColorPickerGrid(selectedHex: $colorHex)
                        }
                        
                        if case .edit(let child) = mode {
                            Button {
                                Task {
                                    try? await firestoreService.deleteChild(child)
                                    dismiss()
                                }
                            } label: {
                                Label("削除", systemImage: "trash")
                                    .font(.rounded(15, weight: .medium))
                                    .foregroundColor(DS.danger)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 50)
                                    .background(DS.danger.opacity(0.1))
                                    .clipShape(RoundedRectangle(cornerRadius: DS.radiusM))
                            }
                        }
                    }
                    .padding(.horizontal, DS.spacingM)
                }
            }
            .background(DS.background.ignoresSafeArea())
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("キャンセル") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("保存") {
                        Task { await save() }
                    }
                    .font(.rounded(15, weight: .semibold))
                    .foregroundColor(name.isEmpty ? DS.secondaryText : DS.accent)
                    .disabled(name.isEmpty)
                }
            }
            .onAppear {
                if case .edit(let child) = mode {
                    name = child.name
                    emoji = child.emoji
                    colorHex = child.colorHex
                }
            }
        }
    }
    
    private func save() async {
        isLoading = true
        do {
            switch mode {
            case .add:
                let child = Child(name: name, colorHex: colorHex, emoji: emoji, order: 0)
                try await firestoreService.addChild(child)
            case .edit(var child):
                child.name = name
                child.colorHex = colorHex
                child.emoji = emoji
                try await firestoreService.updateChild(child)
            }
            HapticFeedback.success()
            dismiss()
        } catch {
            print("Error saving child:", error)
        }
        isLoading = false
    }
}

struct CategoriesSettingsView: View {
    @EnvironmentObject var firestoreService: FirestoreService
    @State private var categories: [ItemCategory] = []
    @State private var showAddCategory = false
    @State private var editingCategory: ItemCategory?
    
    var body: some View {
        List {
            Section {
                ForEach($categories) { $category in
                    CategoryRow(category: $category) {
                        editingCategory = category
                    }
                }
                .onMove { indices, destination in
                    categories.move(fromOffsets: indices, toOffset: destination)
                    Task { try? await firestoreService.updateCategoriesOrder(categories) }
                }
                .onDelete { indices in
                    Task {
                        for index in indices {
                            try? await firestoreService.deleteCategory(categories[index])
                        }
                    }
                }
            } header: {
                Text("カテゴリ一覧")
            } footer: {
                Text("≡ をドラッグして並び替えできます。\nホーム画面の表示順に反映されます。")
            }
            
            Section {
                Button {
                    showAddCategory = true
                } label: {
                    Label("カテゴリを追加", systemImage: "plus.circle.fill")
                        .font(.rounded(15, weight: .medium))
                        .foregroundColor(DS.accent)
                }
            }
        }
        .navigationTitle("カテゴリの管理")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { EditButton() }
        .onAppear { categories = firestoreService.categories }
        .onChange(of: firestoreService.categories) { _, new in categories = new }
        .sheet(isPresented: $showAddCategory) {
            CategoryEditorView(mode: .add)
                .environmentObject(firestoreService)
        }
        .sheet(item: $editingCategory) { cat in
            CategoryEditorView(mode: .edit(cat))
                .environmentObject(firestoreService)
        }
    }
}

struct CategoryRow: View {
    @Binding var category: ItemCategory
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack {
                Text(category.emoji).font(.system(size: 24))
                Text(category.name).font(.rounded(16))
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundColor(DS.secondaryText.opacity(0.5))
            }
        }
        .buttonStyle(.plain)
    }
}

struct CategoryEditorView: View {
    enum Mode {
        case add
        case edit(ItemCategory)
    }
    
    let mode: Mode
    @EnvironmentObject var firestoreService: FirestoreService
    @Environment(\.dismiss) var dismiss
    @State private var name = ""
    @State private var emoji = "📦"
    
    let emojiOptions = ["👕","👖","🧥","🩲","🧦","👟","🌙","🧢","🍼","📦","🎒","🧸","🩳","🧣","🥾"]
    
    var body: some View {
        NavigationStack {
            Form {
                Section("カテゴリ名") {
                    TextField("例: ロンパース", text: $name)
                }
                
                Section("アイコン") {
                    LazyVGrid(
                        columns: Array(repeating: GridItem(.flexible()), count: 5),
                        spacing: DS.spacingS
                    ) {
                        ForEach(emojiOptions, id: \.self) { e in
                            Button {
                                emoji = e
                                HapticFeedback.light()
                            } label: {
                                Text(e)
                                    .font(.system(size: 28))
                                    .frame(width: 48, height: 48)
                                    .background(
                                        RoundedRectangle(cornerRadius: DS.radiusS)
                                            .fill(emoji == e ? DS.accent.opacity(0.15) : Color.gray.opacity(0.08))
                                    )
                                    .overlay(
                                        RoundedRectangle(cornerRadius: DS.radiusS)
                                            .strokeBorder(emoji == e ? DS.accent : Color.clear, lineWidth: 2)
                                    )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.vertical, DS.spacingS)
                }
                
                if case .edit(let cat) = mode {
                    Section {
                        Button("削除", role: .destructive) {
                            Task {
                                try? await firestoreService.deleteCategory(cat)
                                dismiss()
                            }
                        }
                    }
                }
            }
            .navigationTitle(mode == .add ? "カテゴリを追加" : "カテゴリを編集")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("キャンセル") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("保存") {
                        Task {
                            switch mode {
                            case .add:
                                let cat = ItemCategory(name: name, emoji: emoji, order: 0)
                                try? await firestoreService.addCategory(cat)
                            case .edit(var cat):
                                cat.name = name
                                cat.emoji = emoji
                                try? await firestoreService.updateCategory(cat)
                            }
                            HapticFeedback.success()
                            dismiss()
                        }
                    }
                    .font(.rounded(15, weight: .semibold))
                    .foregroundColor(name.isEmpty ? DS.secondaryText : DS.accent)
                    .disabled(name.isEmpty)
                }
            }
            .onAppear {
                if case .edit(let cat) = mode {
                    name = cat.name
                    emoji = cat.emoji
                }
            }
        }
    }
}
